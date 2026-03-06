import { ReactNode, useState } from 'react';
import {
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  Spinner,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { FieldProps, useField } from '@formiz/core';
import { HiOutlineInformationCircle } from 'react-icons/hi';

import { FormGroup, FormGroupProps } from '@/components/FormGroup';

type Value = string;

export type FieldEmailInputProps<FormattedValue = Value> = FieldProps<
  Value,
  FormattedValue
> &
  FormGroupProps & {
    placeholder?: string;
    autoFocus?: boolean;
    size?: 'sm' | 'md' | 'lg';
    leftElement?: ReactNode;
    rightElement?: ReactNode;
    maxLength?: number;
    showErrorinTT?: boolean;
  };

export const FieldEmailInput = <FormattedValue = Value,>(
  props: FieldEmailInputProps<FormattedValue>
) => {
  const field = useField(props);
  const [isFocused, setIsFocused] = useState(false);
  const [isMaxLengthReached, setIsMaxLengthReached] = useState(false);

  const {
    placeholder,
    autoFocus,
    size,
    leftElement,
    rightElement,
    maxLength,
    showErrorinTT = false,
    ...rest
  } = field.otherProps;

  const formGroupProps = {
    ...rest,
    errorMessage: field.errorMessage,
    id: field.id,
    isRequired: field.isRequired,
    showError: (props.showError ?? field.shouldDisplayError) && !field.isValid,
  };

  const handleChange = (e: any) => {
    let value = e.target.value;

    if (value === '') {
      field.setValue(value);
      setIsMaxLengthReached(false);
      return;
    }

    /** Allow only email characters */
    const allowedEmailPattern = /^[a-zA-Z0-9.+%-@]*$/;
    if (!allowedEmailPattern.test(value)) return;

    /** Only one @ allowed */
    const parts = value.split('@');
    if (parts.length > 2) return;

    /** Convert to lowercase */
    value = value.toLowerCase();

    /** Max length */
    if (maxLength) {
      const exceeded = value.length > maxLength;
      setIsMaxLengthReached(exceeded);
      if (exceeded) return;
    }

    field.setValue(value);
  };

  const shouldShowLengthError =
    isMaxLengthReached && (isFocused || field.isTouched || field.isSubmitted);

  return (
    <FormGroup {...formGroupProps}>
      <InputGroup size={size}>
        {leftElement && <InputLeftElement>{leftElement}</InputLeftElement>}

        <Input
          type="email"
          value={field.value ?? ''}
          onChange={(e) => {
            handleChange(e);
            field.setIsTouched(true);
            setIsFocused(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            field.setIsTouched(true);
          }}
          onBlur={() => {
            setIsFocused(false);
            field.setIsTouched(true);
          }}
          placeholder={placeholder ?? ''}
          autoFocus={autoFocus}
        />

        {rightElement && <InputRightElement>{rightElement}</InputRightElement>}

        {(field.isTouched || field.isSubmitted) && field.isValidating && (
          <InputRightElement>
            <Spinner size="sm" />
          </InputRightElement>
        )}
      </InputGroup>

      {shouldShowLengthError && isFocused && (
        <Flex align="center" fontSize="sm" color="red.500" mt={2}>
          {showErrorinTT ? (
            <Tooltip
              label={`Character limit is ${maxLength}`}
              hasArrow
              placement="right"
              color="white"
              backgroundColor="red"
            >
              <Text display="flex" alignItems="center">
                <HiOutlineInformationCircle style={{ marginRight: 4 }} />
                Error
              </Text>
            </Tooltip>
          ) : (
            <Text>Max {maxLength} characters</Text>
          )}
        </Flex>
      )}
    </FormGroup>
  );
};