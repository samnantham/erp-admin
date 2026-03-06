import { ReactNode } from 'react';
import { FieldProps, useField } from '@formiz/core';
import { GroupBase, MultiValue, SingleValue } from 'react-select';
import { FormGroup, FormGroupProps } from '@/components/FormGroup';
import { Select, SelectProps } from '@/components/Select';

type UsualSelectProps =
  | 'isClearable'
  | 'isSearchable'
  | 'placeholder'
  | 'isMulti'
  | 'autoFocus'
  | 'menuPortalTarget'
  | 'size';

export type FieldSelectProps<
  Option extends { label: ReactNode; value: unknown; isDisabled?: boolean },
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> = FieldProps<
  IsMulti extends true ? Array<Option['value']> : Option['value']
> &
  FormGroupProps &
  Pick<SelectProps<Option, IsMulti, Group>, UsualSelectProps> & {
    options: Option[];
    maxLength?: number;
    isCaseSensitive?: boolean;
    onlyAlphabets?: boolean;

    /** ✅ NEW: Readonly mode (not disabled) */
    isReadOnly?: boolean;

    selectProps?: Omit<
      SelectProps<Option, IsMulti, Group>,
      | 'options'
      | 'maxLength'
      | 'isCaseSensitive'
      | 'onlyAlphabets'
      | UsualSelectProps
    >;
  };

const getLabelSize = (size: string | number) => {
  const sizeMap: { [key: string]: string } = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  };
  return sizeMap[size] || 'md';
};

export const FieldSelect = <
  Option extends { label: ReactNode; value: unknown; isDisabled?: boolean },
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>(
  props: FieldSelectProps<Option, IsMulti, Group>
) => {
  const field = useField(props);

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
    isReadOnly, // ✅ NEW
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
    ? [
        ...(options?.filter((option) => fieldValue?.includes(option.value)) ??
          []),
        ...getCreatedValues(),
      ]
    : options?.find((option) => option.value === fieldValue) ?? undefined;

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
        options={options}
        id={field.otherProps.id ? field.otherProps.id : field.id}
        value={finalValue}
        maxLength={maxLength}
        isCaseSensitive={isCaseSensitive}
        onlyAlphabets={onlyAlphabets}
        placeholder={placeholder ?? 'Select...'}
        menuPortalTarget={menuPortalTarget}
        size={size}

        /** 🔒 READONLY MODE */
        menuIsOpen={isReadOnly ? false : undefined}

        onFocus={() => !isReadOnly && field.setIsTouched(false)}
        onBlur={() => field.setIsTouched(true)}

        onChange={(fieldValue) => {
          if (isReadOnly) return; // ⛔ stop changes

          if (isMultiValue<Option>(fieldValue)) {
            const values = fieldValue.map((f) => f.value) as Option['value'][];
            field.setValue(values.length > 0 ? (values as any) : null);
          } else {
            field.setValue(fieldValue ? (fieldValue.value as any) : null);
          }
        }}

        onCreateOption={
          isReadOnly ? undefined : props.selectProps?.onCreateOption
        }
        onInputChange={
          isReadOnly ? undefined : props.selectProps?.onInputChange
        }

        /** 🎨 UX styling for readonly */
        styles={{
          ...selectProps?.styles,
          control: (base) => ({
            ...base,
            cursor: isReadOnly ? 'not-allowed' : 'pointer',
            opacity: isReadOnly ? 0.8 : 1,
          }),
        }}
      />
      {children}
    </FormGroup>
  );
};

function isMultiValue<Option extends { label: ReactNode; value: unknown }>(
  value: MultiValue<Option> | SingleValue<Option>
): value is MultiValue<Option> {
  return Array.isArray(value);
}
