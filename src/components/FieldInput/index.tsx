import { ReactNode, useState } from 'react';

import {
  Flex,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  InputProps,
  InputRightElement,
  Spinner,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import { FieldProps, useField } from '@formiz/core';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { HiOutlineInformationCircle } from 'react-icons/hi';

import { FormGroup, FormGroupProps } from '@/components/FormGroup';

type Value = InputProps['value'];
type UsualInputProps = 'placeholder' | 'autoFocus' | 'type' | 'size';

export type FieldInputProps<FormattedValue = Value> = FieldProps<
  Value,
  FormattedValue
> &
  FormGroupProps &
  Pick<InputProps, UsualInputProps> & {
    inputProps?: Omit<InputProps, UsualInputProps>;
    leftElement?: ReactNode;
    rightElement?: ReactNode;
    maxLength?: number;
    maxValue?: number;
    showErrorinTT?: boolean;
    allowedSpecialChars?: string[];
  };

const getLabelSize = (size: string | number) => {
  const sizeMap: { [key: string]: string } = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  };
  return sizeMap[size] || 'md';
};

export const FieldInput = <FormattedValue = Value,>(
  props: FieldInputProps<FormattedValue>
) => {
  const field = useField(props);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isMaxLengthReached, setIsMaxLengthReached] = useState(false);
  const [isMaxValueReached, setIsMaxValueReached] = useState(false);

  const {
    inputProps,
    children,
    placeholder,
    type,
    autoFocus,
    size,
    leftElement,
    rightElement,
    maxLength,
    maxValue,
    showErrorinTT = false,
    allowedSpecialChars = [],
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

  const handleChange = (e: any, type: any, field: any) => {
    const { value } = e.target;

    if (value === '') {
      field.setValue(value);
      setIsMaxLengthReached(false);
      return;
    }

    const escapedSpecials = allowedSpecialChars.map((c) => `\\${c}`).join('');
    const specialsPattern = escapedSpecials || '\\-\\/'; // default

    switch (type) {
      case 'decimal':
        if (!/^\d*\.?\d*$/.test(value)) return;
        break;
      case 'integer': {
        const integerPattern = allowedSpecialChars.length
          ? new RegExp(`^[\\d${escapedSpecials}]+$`)
          : /^\d+$/;
        if (!integerPattern.test(value)) return;
        break;
      }
      case 'alpha-numeric':
        if (!/^[a-zA-Z0-9]*$/.test(value.replace(/\s/g, ''))) return;
        break;
      case 'alpha-numeric-with-special': {
        const pattern = new RegExp(`^[a-zA-Z0-9${specialsPattern}]*$`);
        const startsWithSpecial = new RegExp(`^[${specialsPattern}]`);
        if (startsWithSpecial.test(value)) return;
        if (!pattern.test(value)) return;
        break;
      }
      case 'alpha-numeric-with-space':
        if (!/^[a-zA-Z0-9 ]*$/.test(value)) return;
        break;
      case 'alpha':
        if (!/^[a-zA-Z]*$/.test(value)) return;
        break;
      case 'alpha-with-space': {
        if (!/^[a-zA-Z\s]*$/.test(value)) return;
        break;
      }
      case 'phone-number':
        if (!/^\+?\d{0,14}$/.test(value)) return;
        break;
      case 'email': {
        const allowedEmailPattern = /^[a-zA-Z0-9.+%-@]*$/;
        if (!allowedEmailPattern.test(value)) return;
        const parts = value.split('@');
        if (parts.length > 2) return;
        const local = parts[0];
        if (local.length >= 4 && local[2] === '-' && local[3] === '-') return;
        if (local.includes('--')) return;
        if (local.startsWith('-') || local.endsWith('-')) return;
        if (parts.length === 2) {
          const domain = parts[1];
          if (domain.length >= 4 && domain[2] === '-' && domain[3] === '-')
            return;
          if (domain.includes('.')) {
            const domainParts = domain.split('.');
            const tld = domainParts[domainParts.length - 1];
            if (tld.length >= 2) {
              const domainPattern =
                /^(?!-)(?!.*--)(?!.*\.-)[a-zA-Z0-9-]+(?<!-)\.[a-zA-Z]{2,}$/;
              if (!domainPattern.test(domain)) return;
            }
          }
        }
        break;
      }
    }

    let processedValue = value;

    switch (type) {
      case 'alpha-numeric':
        processedValue = value.replace(/\s/g, '').toUpperCase();
        break;
      case 'alpha-with-space':
        processedValue = value.replace(/[^a-zA-Z ]/g, '');
        processedValue = processedValue.toUpperCase();
        break;

      case 'alpha-numeric-with-special': {
        const cleanPattern = new RegExp(`[^a-zA-Z0-9${specialsPattern}]`, 'g');
        processedValue = value.replace(cleanPattern, '');
        const startsWithSpecial = new RegExp(`^[${specialsPattern}]`);
        if (startsWithSpecial.test(processedValue)) {
          processedValue = processedValue.substring(1);
        }
        processedValue = processedValue.toUpperCase();
        break;
      }
      case 'alpha-numeric-with-space':
        processedValue = value.replace(/\s{2,}/g, ' ').toUpperCase();
        break;
      case 'alpha':
        processedValue = value.replace(/[^A-Z]/gi, '').toUpperCase();
        break;
      case 'phone-number':
        processedValue = value.replace(/[^+\d]/g, '');
        if (processedValue.includes('+')) {
          processedValue = '+' + processedValue.replace(/\+/g, '');
        } else {
          processedValue = '+' + processedValue;
        }
        break;
      case 'all-capital':
        processedValue = value.toUpperCase();
        break;
      case 'email':
        processedValue = value.toLowerCase();
        break;
    }

    if (maxLength) {
      if (type === 'decimal') {
        const [integerPart] = processedValue.split('.');
        const isExceeded = integerPart.length > maxLength;
        setIsMaxLengthReached(isExceeded);
        if (isExceeded) return;
      } else if (type === 'phone-number') {
        console.log('processedValue', processedValue);
        console.log('processedValue.length', Number(processedValue.length));
        console.log('Max Length', maxLength);
        const isExceeded = processedValue.length > maxLength;
        console.log('isExceeded', isExceeded);

        setIsMaxLengthReached(processedValue.length === maxLength);
        if (isExceeded) return;
      } else {
        const isExceeded = processedValue.length > maxLength;
        setIsMaxLengthReached(isExceeded);
        if (isExceeded) return;
      }
    }

    if (maxValue !== undefined) {
      const numericValue = parseFloat(processedValue);
      if (!isNaN(numericValue) && numericValue > maxValue) {
        setIsMaxValueReached(true);
        return;
      } else {
        setIsMaxValueReached(false);
      }
    }

    if (type === 'integer' && allowedSpecialChars.length === 0) {
      const numericValue = parseInt(processedValue, 10);
      // if (
      //   field?.otherProps?.maxValue !== undefined &&
      //   numericValue > field.otherProps.maxValue
      // ) {
      //   return;
      // }
      processedValue = numericValue;
    }

    field.setValue(processedValue);
  };

  const shouldShowLengthError =
    isMaxLengthReached && (isFocused || field.isTouched || field.isSubmitted);

  const shouldShowMaxValueError =
    isMaxValueReached && (isFocused || field.isTouched || field.isSubmitted);

  return (
    <FormGroup {...formGroupProps}>
      <InputGroup size={size}>
        {leftElement && <InputLeftElement>{leftElement}</InputLeftElement>}

        <Input
          {...inputProps}
          size={size}
          type={showPassword ? 'text' : type ?? 'text'}
          id={field.otherProps.id ? field.otherProps.id : field.id}
          value={field.value ?? ''}
          onChange={(e) => {
            handleChange(e, type, field);
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
          placeholder={placeholder ? String(placeholder) : ''}
          autoFocus={autoFocus}
          maxLength={undefined}
          max={maxValue ?? undefined}
        />

        {type === 'password' && (
          <InputRightElement right="5px" justifyContent="flex-end">
            <IconButton
              onClick={() => setShowPassword((x) => !x)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              display="flex"
              size="xs"
              fontSize="lg"
              icon={showPassword ? <FaEyeSlash /> : <FaEye />}
              variant="unstyled"
              style={{ float: 'right' }}
            />
          </InputRightElement>
        )}

        {rightElement && <InputRightElement>{rightElement}</InputRightElement>}

        {(field.isTouched || field.isSubmitted) && field.isValidating && (
          <InputRightElement>
            <Spinner size="sm" flex="none" />
          </InputRightElement>
        )}
      </InputGroup>

      {shouldShowLengthError && isFocused && (
        <Flex align="center" fontSize="sm" color="red.500" mt={2}>
          <Text as="span" display="flex" alignItems="center">
            {showErrorinTT ? (
              <Tooltip
                label={`Character limit is ${maxLength}${type === 'decimal' && !field.value?.toString().includes('.')
                  ? '. You can only add decimal value.'
                  : ''
                  }`}
                hasArrow
                placement="right"
                color="white"
                backgroundColor="red"
              >
                <Text as="span" display="flex" alignItems="center">
                  <HiOutlineInformationCircle style={{ marginRight: '4px' }} />
                  Error
                </Text>
              </Tooltip>
            ) : (
              <Text as="span">
                Max {maxLength} chars
                {type === 'decimal' && !field.value?.toString().includes('.')
                  ? '. You can only add decimal value.'
                  : ''}
              </Text>
            )}
          </Text>
        </Flex>
      )}

      {shouldShowMaxValueError && isFocused && (
        <Flex align="center" fontSize="sm" color="red.500" mt={2}>
          <Text as="span" display="flex" alignItems="center">
            {showErrorinTT ? (
              <Tooltip
                label={`Value cannot exceed ${maxValue}`}
                hasArrow
                placement="right"
                color="white"
                backgroundColor="red"
              >
                <Text as="span" display="flex" alignItems="center">
                  <HiOutlineInformationCircle style={{ marginRight: '4px' }} />
                  Error
                </Text>
              </Tooltip>
            ) : (
              <Text as="span">Max value is {maxValue}</Text>
            )}
          </Text>
        </Flex>
      )}

      {children}
    </FormGroup>
  );
};
