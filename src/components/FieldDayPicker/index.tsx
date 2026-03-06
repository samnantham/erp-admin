import { useCallback, useMemo, useState } from 'react';

import { FieldProps, useField } from '@formiz/core';
import dayjs, { Dayjs } from 'dayjs';
import { isMatch } from 'react-day-picker';
import { Button } from '@chakra-ui/react';
import { HiX } from 'react-icons/hi';

import { DayPicker, DayPickerProps } from '@/components/DayPicker';
import {
  getAfterDateDisabledDatesConfig,
  getBeforeDateDisabledDatesConfig,
} from '@/components/FieldDayPicker/utils';
import { FormGroup, FormGroupProps } from '@/components/FormGroup';

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export type FieldDayPickerPossibleFormattedValue =
  | string
  | number
  | Dayjs
  | Date;

type Value = Dayjs;
type UsualDayPickerProps = 'placeholder';

export type DateDisableOption =
  | 'future'
  | 'past'
  | { before?: Date; after?: Date };

export type FieldDayPickerProps<
  FormattedValue extends FieldDayPickerPossibleFormattedValue = Value,
> = FieldProps<Value, FormattedValue> &
  FormGroupProps & {
    showError?: boolean;
    dayPickerProps?: Partial<Omit<DayPickerProps, UsualDayPickerProps>>;
    noFormGroup?: boolean;
    invalidMessage?: string;
    disabledDays?: DateDisableOption;
    disableTyping?: boolean;
    showClearButton?: boolean;
  } & Pick<DayPickerProps, UsualDayPickerProps>;

/* -------------------------------------------------------------------------- */
/*                               HELPER METHODS                               */
/* -------------------------------------------------------------------------- */

const getLabelSize = (
  size?: string | number
): 'sm' | 'md' | 'lg' | undefined => {
  if (size === 'sm' || size === 'md' || size === 'lg') {
    return size;
  }
  return undefined;
};

/* -------------------------------------------------------------------------- */
/*                              COMPONENT START                               */
/* -------------------------------------------------------------------------- */

export const FieldDayPicker = <
  FormattedValue extends FieldDayPickerPossibleFormattedValue = Value,
>({
  invalidMessage,
  dayPickerProps,
  ...restFieldProps
}: FieldDayPickerProps<FormattedValue>) => {
  const [clearTick, setClearTick] = useState(0);

  /* ------------------------------- VALIDATION ------------------------------ */

  const getValidations = useCallback(
    () => [
      {
        handler: (v: FormattedValue) => v !== undefined,
        message: invalidMessage ?? 'Invalid date',
      },
      ...(restFieldProps.validations ?? []),
      {
        handler: (value: FormattedValue) =>
          value
            ? !isMatch(
                dayjs(value).toDate(),
                Array.isArray(dayPickerProps?.isDisabled)
                  ? dayPickerProps.isDisabled
                  : dayPickerProps?.isDisabled
                  ? [dayPickerProps.isDisabled]
                  : []
              )
            : true,
        message: invalidMessage,
        deps: [dayPickerProps?.isDisabled],
      },
    ],
    [invalidMessage, restFieldProps.validations, dayPickerProps?.isDisabled]
  );

  const field = useField(restFieldProps, {
    formatValue: (value) =>
      (value
        ? dayjs.isDayjs(value)
          ? value
          : dayjs(value)
        : null) as FormattedValue,
    validations: getValidations(),
  });

  const {
    noFormGroup,
    disabledDays,
    placeholder,
    size,
    showError,
    disableTyping = true,
    showClearButton = true,
    ...rest
  } = field.otherProps;

  const labelSize = getLabelSize(size as string | number | undefined);

  /* -------------------------- DISABLED DAYS LOGIC -------------------------- */

  const dynamicDisabledMatchers = useMemo(() => {
    if (!disabledDays) return [];

    if (disabledDays === 'future') {
      return [getAfterDateDisabledDatesConfig(dayjs())];
    }

    if (disabledDays === 'past') {
      return [getBeforeDateDisabledDatesConfig(dayjs())];
    }

    if (typeof disabledDays === 'object') {
      const matchers = [];

      if (disabledDays.before) {
        matchers.push(
          getBeforeDateDisabledDatesConfig(dayjs(disabledDays.before))
        );
      }

      if (disabledDays.after) {
        matchers.push(
          getAfterDateDisabledDatesConfig(dayjs(disabledDays.after))
        );
      }

      return matchers;
    }

    return [];
  }, [disabledDays]);

  const mergedDisabledDays = useMemo(() => {
    const base = Array.isArray(dayPickerProps?.isDisabled)
      ? dayPickerProps.isDisabled
      : dayPickerProps?.isDisabled
      ? [dayPickerProps.isDisabled]
      : [];

    return [...base, ...dynamicDisabledMatchers];
  }, [dayPickerProps?.isDisabled, dynamicDisabledMatchers]);

  /* ----------------------------- CLEAR HANDLER ----------------------------- */

  const handleClear = () => {
    field.setValue(null as any);
    field.setIsTouched(true);
    setClearTick((t) => t + 1);
    dayPickerProps?.onChange?.(null as any);
  };

  const inputIsDisabled =
    dayPickerProps?.inputProps?.isDisabled === true;

  /* -------------------------------- CONTENT -------------------------------- */

  const content = (
    <div style={{ position: 'relative' }}>
      <DayPicker
        key={`dp-${field.id}-${clearTick}`}
        placeholder={placeholder}
        value={field.value ? dayjs(field.value).toDate() : null}
        dayPickerProps={{
          ...dayPickerProps,
          disabled: mergedDisabledDays,
        }}
        onChange={(date) => {
          field.setValue(date instanceof Date ? dayjs(date) : date);
          dayPickerProps?.onChange?.(date);
        }}
        onClose={(date) => {
          field.setIsTouched(true);
          dayPickerProps?.onClose?.(date);
        }}
        inputProps={{
          id: field.id,
          size,
          onKeyDown: disableTyping
            ? (e: React.KeyboardEvent) => e.preventDefault()
            : undefined,
          ...dayPickerProps?.inputProps,
        }}
      />

      {showClearButton && field.value && !inputIsDisabled && (
        <Button
          type="button"
          onClick={handleClear}
          aria-label="Clear date"
          size={labelSize}
          variant="ghost"
          colorScheme="red"
          style={{
            position: 'absolute',
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            zIndex: 1,
          }}
        >
          <HiX />
        </Button>
      )}
    </div>
  );

  if (noFormGroup) return content;

  return (
    <FormGroup
      {...(rest as FormGroupProps)}
      id={field.id}
      errorMessage={field.errorMessage}
      showError={(showError ?? field.shouldDisplayError) && !field.isValid}
      isRequired={field.isRequired}
      labelSize={labelSize}
    >
      {content}
    </FormGroup>
  );
};