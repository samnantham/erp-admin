import { useState, useMemo, useRef, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { FieldProps, useField } from '@formiz/core';
import { GroupBase, MultiValue, SingleValue } from 'react-select';
import { Text } from '@chakra-ui/react';
import { FormGroup, FormGroupProps } from '@/components/FormGroup';
import { Select, SelectProps } from '@/components/Select';

type UsualSelectProps =
  | 'isClearable'
  | 'isSearchable'
  | 'placeholder'
  | 'isMulti'
  | 'autoFocus'
  | 'menuPortalTarget';

type CreateModalComponent = React.ComponentType<{
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (createdValue?: unknown) => void;
  createdInputValue?: string;
}>;

export type FieldSelectProps<
  Option extends {
    label: ReactNode;
    value: unknown;
    isDisabled?: boolean;
    /** When true, this option cannot be removed in multi-select mode */
    isFixed?: boolean;
  },
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> = FieldProps<
  IsMulti extends true ? Array<Option['value']> : Option['value']
> &
  FormGroupProps &
  Pick<SelectProps<Option, IsMulti, Group>, UsualSelectProps> & {
    options: Option[];
    size?: 'sm' | 'md' | 'lg'; 
    maxLength?: number;
    isCaseSensitive?: boolean;
    onlyAlphabets?: boolean;

    /** Readonly mode (not disabled) */
    isReadOnly?: boolean;

    /**
     * Optional "Add New" feature.
     * When provided, appends a "+ Add New" option to the dropdown.
     * Clicking it opens the provided CreateModal.
     * After creation, onSuccess is called with the new value.
     */
    addNew?: {
      /** Custom label for the add option. Defaults to '+ Add New' */
      label?: string;
      /** Modal component to render. Must accept isOpen, onClose, onSuccess */
      CreateModal: CreateModalComponent;
      /** Called after modal signals successful creation, with the new created value */
      onSuccess?: (createdValue?: unknown) => void;
    };

    selectProps?: Omit<
      SelectProps<Option, IsMulti, Group>,
      | 'options'
      | 'maxLength'
      | 'isCaseSensitive'
      | 'onlyAlphabets'
      | UsualSelectProps
    >;
  };

const ADD_NEW_VALUE = '__add_new__' as const;

const getLabelSize = (size: string | number) => {
  const sizeMap: { [key: string]: string } = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  };
  return sizeMap[size] || 'md';
};

export const FieldSelect = <
  Option extends {
    label: ReactNode;
    value: unknown;
    isDisabled?: boolean;
    isFixed?: boolean;
  },
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  props: FieldSelectProps<Option, IsMulti, Group>
) => {
  const field = useField(props);

  // Stable modal state — plain useState + useRef instead of useDisclosure.
  // The ref gives us a synchronous guard so onBlur can check open state
  // without waiting for a re-render cycle (which is what caused flickering).
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isModalOpenRef = useRef(false);

  const [createdInput, setCreatedInput] = useState('');

  const openModal = useCallback(() => {
    isModalOpenRef.current = true;
    setIsModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    isModalOpenRef.current = false;
    setIsModalOpen(false);
  }, []);

  const {
    selectProps,
    children,
    options,
    placeholder,
    isClearable,
    isSearchable,
    isMulti,
    autoFocus,
    menuPortalTarget,
    size,
    maxLength,
    isCaseSensitive,
    onlyAlphabets,
    isReadOnly,
    addNew,
    ...rest
  } = field.otherProps;

  const labelSize = getLabelSize(size?.toString() || 'md') as
    | 'sm'
    | 'md'
    | 'lg'
    | undefined;

  const formGroupProps = {
    ...rest,
    errorMessage: field.errorMessage,
    id: field.id,
    isRequired: field.isRequired,
    showError: (props.showError ?? field.shouldDisplayError) && !field.isValid,
    labelSize,
  };

  const fieldValue = field.value;

  const getCreatedValues = () =>
    Array.isArray(fieldValue) &&
      (selectProps?.type === 'creatable' ||
        selectProps?.type === 'async-creatable')
      ? fieldValue
        .filter((v) => !options?.map((o) => o.value).includes(v))
        .map((v) => ({ label: v, value: v, isDisabled: false }) as Option)
      : [];

  const finalValue = Array.isArray(fieldValue)
    ? (() => {
      const selectedOptions =
        options?.filter((option) =>
          fieldValue?.includes(option.value)
        ) ?? [];

      const created = getCreatedValues();

      const all = [...selectedOptions, ...created];

      const fixed = all.filter((o) => o.isFixed);
      const nonFixed = all.filter((o) => !o.isFixed);

      return [...fixed, ...nonFixed]; // 🔥 FIXED FIRST
    })()
    : options?.find((option) => option.value === fieldValue) ?? undefined;

  // Append "+ Add New" option only when addNew prop is provided.
  // Memoized so the options array reference is stable across re-renders
  // that are unrelated to options or addNew changing.
  const finalOptions: Option[] = useMemo(
    () =>
      addNew
        ? [
          ...options,
          {
            value: ADD_NEW_VALUE,
            label: (
              <Text color="brand.500" textDecoration="underline">
                {addNew.label ?? '+ Add New'}
              </Text>
            ),
            isDisabled: false,
          } as unknown as Option,
        ]
        : options,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [options, addNew?.label]
  );

  // Memoize the portal so the modal component never unmounts/remounts
  // due to re-renders caused by onBlur, Formiz state updates, tab switches,
  // or window focus events — all of which previously caused flickering.
  const modalPortal = useMemo(() => {
    if (!addNew) return null;
    return createPortal(
      <addNew.CreateModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSuccess={(createdValue) => {
          closeModal();
          addNew.onSuccess?.(createdValue);
        }}
        createdInputValue={createdInput}
      />,
      document.body
    );
    // Only re-create the portal tree when these values actually change.
    // Intentionally excluded: addNew.CreateModal (should be stable reference),
    // closeModal (useCallback — stable), addNew.onSuccess (caller's concern).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, createdInput]);

  return (
    <FormGroup {...formGroupProps}>
      <Select<Option, IsMulti, Group>
        {...selectProps}
        isOptionDisabled={(option) => !!option.isDisabled}
        autoFocus={!isReadOnly && autoFocus}
        isClearable={!isReadOnly && isClearable}
        isSearchable={!isReadOnly && isSearchable}
        isDisabled={isReadOnly}
        isMulti={isMulti}
        options={finalOptions}
        id={field.otherProps.id ? field.otherProps.id : field.id}
        value={finalValue}
        maxLength={maxLength}
        isCaseSensitive={isCaseSensitive}
        onlyAlphabets={onlyAlphabets}
        placeholder={placeholder ?? 'Select...'}
        menuPortalTarget={menuPortalTarget}
        size={size}

        /** READONLY MODE */
        menuIsOpen={isReadOnly ? false : undefined}

        onFocus={() => !isReadOnly && field.setIsTouched(false)}

        // Guard: skip setIsTouched when the modal is open.
        // When the user clicks "+ Add New", the Select loses focus and fires
        // onBlur — without this guard, Formiz re-renders the field which
        // caused the modal to flicker on open. The ref check is synchronous
        // so it works even before the state update from openModal propagates.
        onBlur={() => {
          if (isModalOpenRef.current) return;
          field.setIsTouched(true);
        }}

        onChange={(fieldValue) => {
          if (isReadOnly) return;

          // Intercept the sentinel before any form-state logic
          if (
            !isMultiValue(fieldValue) &&
            (fieldValue as Option | null)?.value === ADD_NEW_VALUE
          ) {
            openModal();
            return; // sentinel never reaches form state
          }

          if (isMultiValue<Option>(fieldValue)) {
            const currentValues = Array.isArray(field.value) ? field.value : [];

            // Collect values from options marked as fixed that were previously selected.
            // Even if react-select tries to remove them (e.g. via "clear all" or
            // backspace), we restore them here so they stay in the form state.
            const fixedValues = finalOptions
              .filter((o) => o.isFixed && currentValues.some((v) => v === o.value))
              .map((o) => o.value) as Option['value'][];

            const newValues = fieldValue
              .filter((f) => f.value !== ADD_NEW_VALUE)
              .map((f) => f.value) as Option['value'][];

            // Merge fixed values back in, deduplicated
            const merged = [...new Set<Option['value']>([...fixedValues, ...newValues])];

            field.setValue(merged.length > 0 ? (merged as any) : null);
          } else {
            field.setValue(fieldValue ? (fieldValue.value as any) : null);
          }
        }}

        onCreateOption={
          isReadOnly
            ? undefined
            : (inputValue: string) => {
              if (addNew) {
                setCreatedInput(inputValue);
                openModal();
                return;
              }
              props.selectProps?.onCreateOption?.(inputValue);
            }
        }

        onInputChange={
          isReadOnly ? undefined : props.selectProps?.onInputChange
        }

        styles={{
          ...selectProps?.styles,
          control: (base) => ({
            ...base,
            cursor: isReadOnly ? 'not-allowed' : 'pointer',
            opacity: isReadOnly ? 0.8 : 1,
          }),
          // Hide the "×" remove button on fixed chips so users cannot
          // click to remove them. The onChange guard above is a second
          // safety net (e.g. keyboard backspace / clear-all).
          multiValueRemove: (base, state) =>
            (state.data as Option).isFixed
              ? { ...base, display: 'none' }
              : selectProps?.styles?.multiValueRemove
                ? selectProps.styles.multiValueRemove(base, state)
                : base,
          // Slightly dim fixed chips to signal they are non-removable.
          multiValue: (base, state) =>
            (state.data as Option).isFixed
              ? { ...base, opacity: 0.75 }
              : selectProps?.styles?.multiValue
                ? selectProps.styles.multiValue(base, state)
                : base,
        }}
      />
      {children}

      {/* Stable portal — memoized above, only updates on isModalOpen / createdInput changes */}
      {modalPortal}
    </FormGroup>
  );
};

function isMultiValue<Option extends { label: ReactNode; value: unknown }>(
  value: MultiValue<Option> | SingleValue<Option>
): value is MultiValue<Option> {
  return Array.isArray(value);
}