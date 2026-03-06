import { useCallback } from 'react';

import { FieldProps, useField } from '@formiz/core';
import dayjs from 'dayjs';
import { DateRange } from 'react-day-picker';

import { FormGroup, FormGroupProps } from '@/components/FormGroup';

import DateRangePicker, {
  DateRangePickerProps,
} from '../DateRangePicker/DateRangePicker';
import {
  getAfterDateDisabledDatesConfig,
  getBeforeDateDisabledDatesConfig,
} from '../FieldDayPicker/utils';

type UsualDateRangePickerProps = 'placeholder';

export type DisabledDays = 'future' | 'past';
type DateDisableOption = 'future' | 'past' | { before: Date } | { after: Date };
export type FieldDateRangePickerProps = FieldProps<DateRange | undefined> &
  FormGroupProps & {
    dateRangePickerProps?: Partial<
      Omit<DateRangePickerProps, UsualDateRangePickerProps>
    >;
    noFormGroup?: boolean;
    invalidMessage?: string;
    placeholder?: string;
    minDate?: any;
    maxDate?: any;
    disabledDays?: DateDisableOption;
    onClear?: () => void;
    isSearch? : boolean;
  };

// Helper function to map 'size' prop to appropriate font sizes
const getLabelSize = (size: string | number) => {
  const sizeMap: { [key: string]: string } = {
    sm: 'sm', // Small size for the label
    md: 'md', // Medium size (default)
    lg: 'lg', // Large size
  };
  return sizeMap[size] || 'md'; // Default to 'md' if size is not defined
};

export const FieldDateRangePicker = ({
  invalidMessage,
  dateRangePickerProps,
  onClear,
  ...restFieldProps
}: FieldDateRangePickerProps) => {
  const getValidations = useCallback(
    () => [
      {
        handler: (v: DateRange | undefined) => v !== undefined,
        message: invalidMessage ?? 'Invalid date range',
      },
      ...(restFieldProps.validations ?? []),
    ],
    [invalidMessage, restFieldProps.validations]
  );

  const field = useField(restFieldProps, {
    formatValue: (value) => value,
    validations: getValidations(),
  });

  const { noFormGroup, disabledDays, placeholder, minDate, maxDate, isSearch, size, ...rest } =
    field.otherProps;

  const labelSize = getLabelSize(size?.toString() || 'md') as
    | 'sm'
    | 'md'
    | 'lg'
    | undefined;

  const formGroupProps = {
    ...(noFormGroup ? {} : rest),
    id: field.id,
    errorMessage: field.errorMessage,
    showError: field.isValid === false && field.isTouched,
    isRequired: field.isRequired,
    labelSize,
  };

  const dateRangePickerPropsWithSize = {
    ...dateRangePickerProps,
    inputProps: {
      ...dateRangePickerProps?.inputProps,
      size,
    },
  };

  const getDisabledDaysMatcher = () => {
    if (typeof disabledDays === 'object') {
      if ('before' in disabledDays) {
        return getBeforeDateDisabledDatesConfig(dayjs(disabledDays.before));
      }
      if ('after' in disabledDays) {
        return getAfterDateDisabledDatesConfig(dayjs(disabledDays.after));
      }
    }
    switch (disabledDays) {
      case 'future':
        return getAfterDateDisabledDatesConfig(dayjs());
      case 'past':
        return getBeforeDateDisabledDatesConfig(dayjs());
      default:
        return null;
    }
  };

  const defaultDisabledDays = (
    !dateRangePickerProps?.isDisabled
      ? [getDisabledDaysMatcher()]
      : Array.isArray(dateRangePickerProps.isDisabled)
        ? [...dateRangePickerProps.isDisabled, getDisabledDaysMatcher()]
        : [dateRangePickerProps.isDisabled, getDisabledDaysMatcher()]
  ).filter(Boolean); // We cut out nullable values because the disabled prop do not accept them

  const handleClear = () => {
    field.setValue(undefined);
    field.setIsTouched(true);
    onClear?.();
  };

  const content = (
    <DateRangePicker
      placeholder={placeholder}
      dateRangePickerProps={{
        ...dateRangePickerPropsWithSize,
        disabled: defaultDisabledDays,
      }}
      minDate={minDate ?? undefined}
      maxDate={maxDate ?? undefined}
      value={field.value ? field.value : undefined}
      isSearch ={isSearch}
      onRangeChange={(range) => {
        field.setValue(range);
        dateRangePickerProps?.onRangeChange?.(range);
      }}
      onClose={(range) => {
        field.setIsTouched(true);
        dateRangePickerProps?.onClose?.(range);
      }}
      onClear={handleClear}
      inputProps={{
        id: field.id,
        size,
        ...dateRangePickerProps?.inputProps,
      }}
    />
  );

  if (noFormGroup) {
    return content;
  }

  return <FormGroup {...formGroupProps}>{content}</FormGroup>;
};

export default FieldDateRangePicker;
