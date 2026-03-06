import { useState, useCallback, useEffect } from 'react';
import {
  Flex,
  HStack,
  IconButton,
  Input,
  InputProps,
  Text,
} from '@chakra-ui/react';
import { FieldProps, useField } from '@formiz/core';
import { FaPlus, FaMinus } from 'react-icons/fa';
import { HiOutlineInformationCircle } from 'react-icons/hi';
import { FormGroup, FormGroupProps } from '@/components/FormGroup';
import debounce from 'lodash.debounce';

type Value = number;

type UsualInputProps = 'placeholder' | 'size';

export type FieldCounterProps = FieldProps<Value> &
  FormGroupProps &
  Pick<InputProps, UsualInputProps> & {
    inputProps?: Omit<InputProps, UsualInputProps>;
    min?: number;
    max?: number;
    debounceDelay?: number;
    onFinalChange?: (value: number) => void;
  };

const getLabelSize = (size: string | number) => {
  const sizeMap: { [key: string]: string } = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
  };
  return sizeMap[size] || 'md';
};

export const FieldCounter = (props: FieldCounterProps) => {
  const field = useField(props);
  const [isFocused, setIsFocused] = useState(false);
  const {
    inputProps,
    children,
    placeholder,
    size = 'md',
    min = 1,
    max = 99,
    debounceDelay = 300,
    onFinalChange,
    ...rest
  } = field.otherProps;

  const labelSize = getLabelSize(size.toString()) as 'sm' | 'md' | 'lg' | undefined;

  const formGroupProps = {
    ...rest,
    errorMessage: field.errorMessage,
    id: field.id,
    isRequired: field.isRequired,
    showError: field.shouldDisplayError,
    labelSize,
  } satisfies FormGroupProps;

  const handleChange = (value: number, triggerFinal = false) => {
    const newValue = Math.min(Math.max(value, min), max);
    field.setValue(newValue);
    field.setIsTouched(true);
    if (triggerFinal && typeof onFinalChange === 'function') {
      onFinalChange(newValue);
    }
  };

  const debouncedHandleChange = useCallback(
    debounce((value: number) => {
      handleChange(value, true); // trigger onFinalChange after delay
    }, debounceDelay),
    [debounceDelay]
  );

  useEffect(() => {
    return () => {
      debouncedHandleChange.cancel();
    };
  }, [debouncedHandleChange]);

  const handleIncrement = () => {
    const newValue = (field.value ?? min) + 1;
    handleChange(newValue, true);
  };

  const handleDecrement = () => {
    const newValue = (field.value ?? min) - 1;
    handleChange(newValue, true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || min;
    field.setValue(value); // update UI immediately
    debouncedHandleChange(value); // trigger final after debounce
    inputProps?.onChange?.(e);
  };

  const currentValue = field.value ?? min;
  const isMinReached = currentValue <= min;
  const isMaxReached = currentValue >= max;

  return (
    <FormGroup {...formGroupProps}>
      <HStack maxWidth="100%" spacing={0}>
        <IconButton
          size={size}
          aria-label="Decrement"
          icon={<FaMinus fontSize="sm" />}
          onClick={handleDecrement}
          isDisabled={isMinReached}
          borderRightRadius={0}
        />

        <Input
          type="number"
          size={size}
          {...inputProps}
          value={currentValue}
          onChange={handleInputChange}
          min={min}
          max={max}
          textAlign="center"
          borderRadius={0}
          px={2}
          width="100%"
          _focus={{ boxShadow: 'none' }}
          onFocus={(e) => {
            setIsFocused(true);
            field.setIsTouched(true);
            inputProps?.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            field.setIsTouched(true);
            handleChange(currentValue, true); // trigger final on blur
            inputProps?.onBlur?.(e);
          }}
        />

        <IconButton
          aria-label="Increment"
          icon={<FaPlus fontSize="sm" />}
          onClick={handleIncrement}
          isDisabled={isMaxReached}
          size={size}
          borderLeftRadius={0}
        />
      </HStack>

      {isFocused && max && isMaxReached && (
        <Flex align="center" fontSize="sm" color="red.500" mt={2}>
          <HiOutlineInformationCircle style={{ marginRight: '4px' }} />
          <Text as="span">Maximum quantity is {max}</Text>
        </Flex>
      )}
      {children}
    </FormGroup>
  );
};
