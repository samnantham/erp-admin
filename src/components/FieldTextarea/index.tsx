import { useState } from 'react';

import { Flex, Text, Textarea, TextareaProps } from '@chakra-ui/react';
import { FieldProps, useField } from '@formiz/core';
import { HiOutlineInformationCircle } from 'react-icons/hi';

import { FormGroup, FormGroupProps } from '@/components/FormGroup';

type Value = TextareaProps['value'];

type UsualTextareaProps = 'placeholder' | 'size';

export type FieldTextareaProps<FormattedValue = Value> = FieldProps<
  Value,
  FormattedValue
> &
  FormGroupProps &
  Pick<TextareaProps, UsualTextareaProps> & {
    textareaProps?: Omit<TextareaProps, UsualTextareaProps>;
    maxLength?: number;
  };

// Define a function to map 'size' prop to appropriate font sizes
const getLabelSize = (size: string | number) => {
  const sizeMap: { [key: string]: string } = {
    sm: 'sm', // Small size for the label
    md: 'md', // Medium size (default)
    lg: 'lg', // Large size
  };
  return sizeMap[size] || 'md'; // Default to 'md' if size is not defined
};

export const FieldTextarea = <FormattedValue = Value,>(
  props: FieldTextareaProps<FormattedValue>
) => {
  const field = useField(props);
  const [isFocused, setIsFocused] = useState(false);
  const { textareaProps, children, placeholder, size, maxLength, ...rest } =
    field.otherProps;
  const isMaxLengthReached =
    maxLength && field?.value?.toString().length === maxLength;

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
    showError: field.shouldDisplayError,
    labelSize,
  } satisfies FormGroupProps;

  const handleChange = (e: any, field: any) => {
    const { value } = e.target;
    if (value === '') {
      field.setValue(value);
      return;
    }
    if (field?.otherProps?.maxValue !== undefined) {
      const filteredValue = value;
      field.setValue(filteredValue);
    } else {
      const filteredValue = value;
      field.setValue(filteredValue);
    }
  };

  return (
    <FormGroup {...formGroupProps}>
      <Textarea
        size={size}
        maxLength={maxLength ?? undefined}
        {...textareaProps}
        placeholder={placeholder}
        id={field.id}
        value={field.value ?? ''}
        onChange={(e) => {
          handleChange(e, field);
          textareaProps?.onChange?.(e);
          field.setIsTouched(true);
        }}
        onFocus={(e) => {
          setIsFocused(true);
          field.setIsTouched(true);
          textareaProps?.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          field.setIsTouched(true);
          textareaProps?.onBlur?.(e);
        }}
      />
      {isFocused && maxLength && isMaxLengthReached && (
        <Flex align="center" fontSize="sm" color="red.500" mt={2}>
          <HiOutlineInformationCircle style={{ marginRight: '4px' }} />
          <Text as="span">Character limit is {maxLength}</Text>
        </Flex>
      )}
      {children}
    </FormGroup>
  );
};
