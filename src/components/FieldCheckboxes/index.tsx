import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';

import { Checkbox, CheckboxProps, Wrap, WrapItem } from '@chakra-ui/react';
import { FieldProps, useField } from '@formiz/core';
import { StoreApi, UseBoundStore, create } from 'zustand';

import { FormGroup, FormGroupProps } from '@/components/FormGroup';

/* ------------------------------------------------------------------ */
/* Types & helpers                                                     */
/* ------------------------------------------------------------------ */

type Value = unknown;
// Field can be a scalar (single mode) or an array (multiple mode)
type FieldValue = Value | Value[] | null;

type InternalOption = {
  value: Value;
  groups: Value[];
};

type Option = {
  value: Value;
  label?: ReactNode;
};

const formatGroupsToArray = (groups?: string[] | string): string[] => {
  if (!groups) return [];
  if (!Array.isArray(groups)) return [groups];
  return groups;
};

const splitValuesByGroupsFromOptions = (
  options: InternalOption[],
  groups: Value[] = []
): [Value[], Value[]] =>
  options.reduce<[Value[], Value[]]>(
    ([inGroups, others], option) => {
      const hasNoGroups = groups.length === 0;
      const isInGroups = option.groups.some((group) => groups.includes(group));
      return hasNoGroups || isInGroups
        ? [[...inGroups, option.value], others]
        : [inGroups, [...others, option.value]];
    },
    [[], []]
  );

type FieldCheckboxesState = {
  options: InternalOption[];
  registerOption: (option: InternalOption, isChecked: boolean) => void;
  unregisterOption: (option: InternalOption) => void;
  // store keeps an array for easy checks, even in single mode
  values: Value[];
  setValues: (values: Value[]) => void;
  toggleValue: (value: Value) => void;
  toggleGroups: (groups: string[]) => void;
  verifyIsValueChecked: (value: Value) => boolean;
};

type FieldCheckboxesContextProps = {
  useStore: UseBoundStore<StoreApi<FieldCheckboxesState>>;
  checkboxGroupProps?: Pick<
    CheckboxProps,
    'size' | 'colorScheme' | 'isDisabled'
  >;
  selectionMode: 'multiple' | 'single';
};

const FieldCheckboxesContext =
  createContext<FieldCheckboxesContextProps | null>(null);

const useFieldCheckboxesContext = () => {
  const context = useContext(FieldCheckboxesContext);
  if (context === null) {
    throw new Error('Missing parent <FieldCheckboxes> component');
  }
  return context;
};

type FieldCheckboxesProps<FormattedValue = FieldValue> = FieldProps<
  FieldValue,
  FormattedValue
> &
  FormGroupProps & {
    checkboxProps?: CheckboxProps;
    itemKey?: string;
    options?: Option[];
    /** 'multiple' (default) keeps current behavior; 'single' stores a scalar (not an array) */
    selectionMode?: 'multiple' | 'single';
    /** Auto-selected value when the field has no value yet */
    defaultValue?: Value;
  };

/* Convert current field value to an array shape for store checks */
const toArray = (v: FieldValue): Value[] => {
  if (Array.isArray(v)) return v;
  if (v === null || typeof v === 'undefined') return [];
  return [v];
};

/* ------------------------------------------------------------------ */
/* FieldCheckboxes                                                     */
/* ------------------------------------------------------------------ */

export const FieldCheckboxes = <FormattedValue = FieldValue,>(
  props: FieldCheckboxesProps<FormattedValue>
) => {
  const field = useField(props);

  const {
    itemKey,
    children,
    options,
    checkboxProps,
    selectionMode = 'multiple',
    defaultValue,
    ...rest
  } = field.otherProps as FieldCheckboxesProps<FormattedValue>;

  // keep refs for equality checks
  const itemKeyRef = useRef<string | undefined>(itemKey);
  if (itemKey) itemKeyRef.current = itemKey;

  const checkValuesEqual = useCallback((a: any, b: any): boolean => {
    const key = itemKeyRef.current;
    if (key) return a?.[key] === b?.[key];
    return JSON.stringify(a) === JSON.stringify(b);
  }, []);

  const verifyValueIsInValues = (
    values: Value[],
    valueToVerify: Value
  ): boolean => !!values.find((item) => checkValuesEqual(item, valueToVerify));

  // Zustand store
  const useStoreRef = useRef<UseBoundStore<StoreApi<FieldCheckboxesState>>>();
  if (!useStoreRef.current) {
    useStoreRef.current = create<FieldCheckboxesState>((set, get) => ({
      options: [],
      registerOption: (
        optionToRegister: InternalOption,
        isChecked: boolean
      ) => {
        set((state) => ({ options: [...state.options, optionToRegister] }));

        field.setValue((prevValue: any) => {
          const prevArr = toArray(prevValue as FieldValue);

          // If the field has no value yet:
          if (!prevArr.length) {
            // 1) honor defaultValue if provided
            if (typeof defaultValue !== 'undefined') {
              return selectionMode === 'single' ? defaultValue : [defaultValue];
            }
            // 2) otherwise honor this option's defaultChecked
            if (isChecked) {
              return selectionMode === 'single'
                ? optionToRegister.value
                : [optionToRegister.value];
            }
            // ✅ IMPORTANT: don't force [] for multiple; leave it empty (null) so nothing fires/changes
            return prevValue ?? null;
          }

          // already has a value; don't modify on register
          return prevValue ?? null;
        });
      },

      unregisterOption: (optionToUnregister: InternalOption) => {
        set((state) => ({
          options: state.options.filter(
            (option) =>
              !checkValuesEqual(option.value, optionToUnregister.value)
          ),
        }));
        // prune form value against remaining options
        field.setValue((prevValue: any) => {
          const remaining = get().options.map((o) => o.value);
          const prevArr = toArray(prevValue as FieldValue);
          const newArr = prevArr.filter((v) =>
            verifyValueIsInValues(remaining, v)
          );

          if (selectionMode === 'single') {
            return newArr.length ? newArr[0] : null;
          }
          return newArr.length ? newArr : null;
        });
      },
      values: toArray(field.value as FieldValue),
      setValues: (values) => set(() => ({ values })),
      toggleValue: (valueToUpdate) => {
        field.setValue((prevValue: any) => {
          const prevArr = toArray(prevValue as FieldValue);
          const hasValue = verifyValueIsInValues(prevArr, valueToUpdate);

          if (selectionMode === 'single') {
            // Radio-like toggle: click same -> uncheck (null), click other -> select it
            return hasValue ? null : valueToUpdate;
          }

          // multiple
          const newArr = hasValue
            ? prevArr.filter((v) => !checkValuesEqual(v, valueToUpdate))
            : [...prevArr, valueToUpdate];
          return newArr.length ? newArr : null;
        });
      },
      toggleGroups: (groups: string[]) => {
        const [allValuesInGroups, allOtherValues] =
          splitValuesByGroupsFromOptions(get().options, groups);

        field.setValue((previousValue: any) => {
          const prevArr = toArray(previousValue as FieldValue);

          if (selectionMode === 'single') {
            const anyInGroupSelected = allValuesInGroups.some((v) =>
              verifyValueIsInValues(prevArr, v)
            );
            return anyInGroupSelected
              ? null
              : allValuesInGroups.length > 0
                ? allValuesInGroups[0]
                : null;
          }

          const othersChecked = allOtherValues.filter((v) =>
            verifyValueIsInValues(prevArr, v)
          );
          const allInGroupChecked = allValuesInGroups.every((v) =>
            verifyValueIsInValues(prevArr, v)
          );

          const newArr = allInGroupChecked
            ? othersChecked
            : [...othersChecked, ...allValuesInGroups];
          return newArr.length ? newArr : null;
        });
      },
      verifyIsValueChecked: (valueToVerify: Value): boolean =>
        !!verifyValueIsInValues(get().values ?? [], valueToVerify),
    }));
  }

  const useStore = useStoreRef.current;
  const setStoreValues = useStore((state) => state.setValues);

  // keep store.values in sync with field.value (convert to array for checks)
  useEffect(() => {
    setStoreValues(toArray(field.value as FieldValue));
  }, [setStoreValues, field.value]);

  // If no value yet and defaultValue is provided, apply it on mount/update.
  useEffect(() => {
    const curr = field.value as FieldValue;
    const hasAny = toArray(curr).length > 0;
    if (!hasAny && typeof defaultValue !== 'undefined') {
      field.setValue(
        selectionMode === 'single' ? defaultValue : [defaultValue]
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue, selectionMode]);

  const formGroupProps = {
    ...rest,
    errorMessage: field.errorMessage,
    id: field.id,
    isRequired: field.isRequired,
    showError: field.shouldDisplayError,
  };

  return (
    <FormGroup {...formGroupProps}>
      <FieldCheckboxesContext.Provider
        value={{
          useStore,
          selectionMode,
          checkboxGroupProps: {
            size: checkboxProps?.size,
            colorScheme: checkboxProps?.colorScheme,
            isDisabled: checkboxProps?.isDisabled,
          },
        }}
      >
        {children ?? (
          <Wrap spacing="4" overflow="visible">
            {options?.map((option) => (
              <WrapItem key={String(option.value)}>
                <FieldCheckboxesItem value={option.value}>
                  {option.label ?? JSON.stringify(option.value)}
                </FieldCheckboxesItem>
              </WrapItem>
            ))}
          </Wrap>
        )}
      </FieldCheckboxesContext.Provider>
    </FormGroup>
  );
};

/* ------------------------------------------------------------------ */
/* FieldCheckboxesItem                                                */
/* ------------------------------------------------------------------ */

type FieldCheckboxItemProps = Omit<CheckboxProps, 'value'> & {
  value: Value;
  groups?: string[] | string;
  /** If provided, overrides checked state (rarely needed). */
  isChecked?: boolean;
};

export const FieldCheckboxesItem: React.FC<
  React.PropsWithChildren<FieldCheckboxItemProps>
> = ({
  value,
  groups,
  onChange = () => undefined,
  children,
  defaultChecked,
  isChecked: propIsChecked,
  ...checkboxProps
}) => {
  const { useStore, checkboxGroupProps } = useFieldCheckboxesContext();

  const defaultCheckedRef = useRef(defaultChecked);
  defaultCheckedRef.current = defaultChecked;

  const registerOption = useStore((state) => state.registerOption);
  const unregisterOption = useStore((state) => state.unregisterOption);
  const toggleValue = useStore((state) => state.toggleValue);

  // Is this value currently selected?
  const isSelected = useStore((state) => state.verifyIsValueChecked(value));
  const isChecked =
    typeof propIsChecked !== 'undefined' ? propIsChecked : isSelected;

  useEffect(() => {
    const option = { value, groups: formatGroupsToArray(groups) };
    registerOption(option, !!defaultCheckedRef.current);
    return () => unregisterOption(option);
  }, [value, groups, registerOption, unregisterOption]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event);
    toggleValue(value);
  };

  return (
    <Checkbox
      variant="subtle"
      colorScheme={isChecked ? 'blue' : 'red'}
      {...checkboxGroupProps}
      {...checkboxProps}
      onChange={handleChange}
      isChecked={isChecked}
      sx={{
        '& .chakra-checkbox__control': {
          bg: isChecked ? 'blue.100' : 'red.100',
          borderColor: isChecked ? 'blue.300' : 'red.300',
          borderWidth: '2px',
          _checked: {
            bg: 'blue.100',
            borderColor: 'blue.300',
            color: 'blue.500',
          },
        },
        '&:hover .chakra-checkbox__control:not([data-checked])': {
          bg: 'red.50',
        },
        '&:hover .chakra-checkbox__control[data-checked]': {
          bg: 'blue.50',
        },
      }}
    >
      {children}
    </Checkbox>
  );
};

/* ------------------------------------------------------------------ */
/* FieldCheckboxesCheckAll                                            */
/* ------------------------------------------------------------------ */

type FieldCheckboxItemCheckAllProps = CheckboxProps & {
  groups?: string[] | string;
};

export const FieldCheckboxesCheckAll: React.FC<
  React.PropsWithChildren<FieldCheckboxItemCheckAllProps>
> = ({
  groups = [],
  onChange = () => undefined,
  children,
  ...checkboxProps
}) => {
  const { checkboxGroupProps, useStore, selectionMode } =
    useFieldCheckboxesContext();

  if (selectionMode === 'single') {
    return null;
  }

  const groupsArray = formatGroupsToArray(groups);

  const toggleGroups = useStore((state) => state.toggleGroups);
  const { isChecked, isIndeterminate, isDisabled } = useStore((state) => {
    const [groupsValues] = splitValuesByGroupsFromOptions(
      state.options,
      groupsArray
    );
    const hasValuesInGroups = groupsValues.length > 0;

    const areAllValuesChecked =
      hasValuesInGroups && groupsValues.every(state.verifyIsValueChecked);
    const areSomeValuesChecked =
      hasValuesInGroups &&
      !areAllValuesChecked &&
      groupsValues.some(state.verifyIsValueChecked);

    return {
      isChecked: areAllValuesChecked,
      isIndeterminate: areSomeValuesChecked,
      isDisabled: !hasValuesInGroups,
    };
  });

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event);
    toggleGroups(groupsArray);
  };

  return (
    <Checkbox
      variant="subtle"
      colorScheme={isChecked ? 'blue' : 'red'}
      {...checkboxGroupProps}
      {...checkboxProps}
      onChange={handleChange}
      isChecked={isChecked}
      isIndeterminate={isIndeterminate}
      isDisabled={isDisabled}
      sx={{
        '& .chakra-checkbox__control': {
          bg: isChecked ? 'blue.100' : 'red.100',
          borderColor: isChecked ? 'blue.300' : 'red.300',
          borderWidth: '2px',
          _checked: {
            bg: 'blue.100',
            borderColor: 'blue.300',
            color: 'blue.500',
          },
        },
        '&:hover .chakra-checkbox__control:not([data-checked])': {
          bg: 'red.50',
        },
        '&:hover .chakra-checkbox__control[data-checked]': {
          bg: 'blue.50',
        },
      }}
    >
      {children}
    </Checkbox>
  );
};
