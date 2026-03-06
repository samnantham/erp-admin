import React, { ReactNode, useEffect, useRef, useState } from 'react';

import {
  Box,
  Button,
  FormLabel,
  Input,
  InputGroup,
  InputLeftElement,
  InputProps,
  InputRightElement,
  Placement,
  Portal,
} from '@chakra-ui/react';
import { FieldProps } from '@formiz/core';
import dayjs from 'dayjs';
import { DateRange, DayPicker, DayPickerProps } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { FiCalendar, FiX } from 'react-icons/fi';

import { FormGroup, FormGroupProps } from '@/components/FormGroup';

import {
  DATE_FORMAT,
  DEFAULT_MODIFIERS,
  DEFAULT_MODIFIERS_STYLES,
} from '../DayPicker/constants';
import { parseInputToDate } from '../DayPicker/parseInputToDate';
import { Icon } from '../Icons';

export interface DateRangePickerProps {
  id?: string;
  value?: DateRange | null;
  onRangeChange: (range: DateRange | undefined) => void;
  popperPlacement?: Placement;
  inputProps?: Omit<InputProps, 'value' | 'onChange' | 'placeholder '> & {
    'data-test'?: string;
  } & {
    label?: string;
  };
  dateRangePickerProps?: DayPickerProps;
  placeholder?: string;
  minDate?: any;
  maxDate?: any;
  label?: string;
  isDisabled?: boolean;
  autoFocus?: boolean;
  onClose?(day?: DateRange | null): void;
  onClear?: () => void;
  isSearch?: boolean;
}

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

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  id,
  value,
  onRangeChange,
  inputProps = {},
  placeholder = 'Select range',
  minDate = undefined,
  maxDate = undefined,
  isDisabled = false,
  autoFocus = false,
  onClose = () => {},
  onClear,
  isSearch = false
}) => {
  const [range, setRange] = useState<DateRange | undefined>(value || undefined);
  const [inputValue, setInputValue] = useState<string>(formatDateRange(range));
  const [isPopperOpen, setIsPopperOpen] = useState(false);
  const [popperPosition, setPopperPosition] = useState({ top: 0, left: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const popperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const size = inputProps?.size;
  const label = inputProps?.label;

  const labelSize = getLabelSize(size?.toString() || 'md') as
    | 'sm'
    | 'md'
    | 'lg'
    | undefined;

  const formGroupProps = {
    labelSize,
  };

  useEffect(() => {
    setInputValue(formatDateRange(range));
  }, [range]);

  useEffect(() => {
    if (isPopperOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPopperPosition({
        top: rect.bottom + window.scrollY,
        left: isSearch ? (rect.left + window.scrollX - 100): rect.left + window.scrollX,
      });
    }
  }, [isPopperOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popperRef.current &&
        !popperRef.current.contains(event.target as Node) &&
        !containerRef.current?.contains(event.target as Node)
      ) {
        setIsPopperOpen(false);
        onClose(range); // Call onClose when clicking outside
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, range]);

  const handleRangeSelect = (selectedRange: DateRange | undefined) => {
    if(selectedRange){
      setRange(selectedRange);
      onRangeChange(selectedRange);
    }else{
      handleClear();
    }
   
    // Remove the following lines to keep the picker open after selection
    // if (selectedRange?.from && selectedRange?.to) {
    //   setIsPopperOpen(false);
    //   onClose(selectedRange);
    // }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.currentTarget.value);
    const { from, to } = parseDateRangeInput(e.currentTarget.value);
    if (from && to) {
      handleRangeSelect({ from, to });
    }
  };

  const handleInputBlur = (value: string) => {
    const { from, to } = parseDateRangeInput(value);
    if (!from || !to) {
      if (!value) {
        handleRangeSelect(undefined);
        return;
      }
      setInputValue(formatDateRange(range));
      return;
    }

    const newRange = { from, to };
    const isNewValue = !areDatesEqual(newRange, range);
    if (!isNewValue) {
      setInputValue(formatDateRange(newRange));
      return;
    }

    handleRangeSelect(newRange);
  };

  const handleInputClick = () => {
    setIsPopperOpen((prev) => !prev);
  };

  const handleClear = () => {
    setRange(undefined);
    setInputValue('');
    onRangeChange(undefined);
    onClear?.();
  };

  return (
    <>
      <FormGroup {...formGroupProps}>
        {label && <FormLabel>{label}</FormLabel>}
        <InputGroup ref={containerRef} size={size} width={inputProps.width}>
          <InputLeftElement pointerEvents="none">
            <Icon
              icon={FiCalendar}
              fontSize={size}
              transform="scale(1.2)"
              color={isDisabled ? 'gray.300' : 'gray.400'}
              _dark={{
                color: isDisabled ? 'gray.500' : 'gray.300',
              }}
            />
          </InputLeftElement>
          <Input
            ref={inputRef}
            id={id}
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            onBlur={(e) => handleInputBlur(e.target.value)}
            onClick={handleInputClick}
            isDisabled={isDisabled}
            autoFocus={autoFocus}
            {...inputProps}
          />
          {inputValue && (
            <InputRightElement>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClear}
                aria-label="Clear date range"
                id="btn-clear"
                isDisabled={isDisabled}
              >
                <Icon icon={FiX} />
              </Button>
            </InputRightElement>
          )}
        </InputGroup>
      </FormGroup>

      {isPopperOpen && (
        <Portal>
          <Box
            ref={popperRef}
            position="absolute"
            top={popperPosition.top}
            left={popperPosition.left}
            zIndex={9999}
            minW={250}
            bg="white"
            boxShadow="lg"
            borderRadius="md"
            _dark={{
              bg: 'gray.800',
            }}
          >
            <DayPicker
              mode="range"
              selected={range}
              onSelect={handleRangeSelect}
              modifiers={DEFAULT_MODIFIERS}
              modifiersStyles={DEFAULT_MODIFIERS_STYLES}
              fromDate={minDate ? new Date(minDate) : undefined }
              toDate={maxDate ? new Date(maxDate) : undefined}
            />
          </Box>
        </Portal>
      )}
    </>
  );
};

const formatDateRange = (dateRange: DateRange | undefined): string => {
  if (!dateRange || !dateRange.from) return '';
  if (!dateRange.to) return dayjs(dateRange.from).format(DATE_FORMAT);
  return `${dayjs(dateRange.from).format(DATE_FORMAT)} - ${dayjs(dateRange.to).format(DATE_FORMAT)}`;
};

const parseDateRangeInput = (
  input: string
): { from: Date | null; to: Date | null } => {
  const [fromString, toString] = input.split('-').map((s) => s.trim());
  const from = parseInputToDate(fromString).isValid()
    ? parseInputToDate(fromString).toDate()
    : null;
  const to = parseInputToDate(toString).isValid()
    ? parseInputToDate(toString).toDate()
    : null;
  return { from, to };
};

const areDatesEqual = (
  range1: DateRange | undefined,
  range2: DateRange | undefined
): boolean => {
  if (!range1 || !range2) return range1 === range2;
  return (
    dayjs(range1.from).isSame(range2.from, 'day') &&
    dayjs(range1.to).isSame(range2.to, 'day')
  );
};

export default DateRangePicker;
