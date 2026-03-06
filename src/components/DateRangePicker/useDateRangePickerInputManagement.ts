import { ChangeEvent, ChangeEventHandler, useEffect, useState } from 'react';

import dayjs, { ConfigType, Dayjs } from 'dayjs';
import { DayModifiers, ModifiersStyles } from 'react-day-picker';

import { colors } from '@/theme/foundations/colors';

type DateRange = {
  from: Date | null;
  to: Date | null;
};

type UseDateRangePickerInputManagement = {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  handleInputBlur: (inputValue: string) => void;
};

type UseDateRangePickerInputManagementParams = {
  dateRange: DateRange;
  dateFormat: string;
  onChange: (newDateRange: DateRange, updateMonth?: boolean) => void;
};

export const DEFAULT_MODIFIERS: DayModifiers = {
  weekend: { dayOfWeek: [0, 6] },
};

export const DEFAULT_MODIFIERS_STYLES: ModifiersStyles = {
  today: { fontWeight: 'bold' },
  selected: { backgroundColor: colors.brand[500] },
  weekend: { color: 'gray' },
};

export const DATE_FORMAT = 'DD/MM/YYYY';

export const parseInputToDate = (
  input: ConfigType,
  extraFormats: Array<string> = []
): Dayjs => {
  return dayjs(
    input,
    [
      ...extraFormats,
      'DD',
      'DDMM',
      'DD/MM',
      'DD-MM',
      'DD.MM',
      'DD MM',
      'DDMMYY',
      'DD/MM/YY',
      'DD-MM-YY',
      'DD.MM.YY',
      'DD MM YY',
      'DDMMYYYY',
      'DD/MM/YYYY',
      'DD-MM-YYYY',
      'DD.MM.YYYY',
      'DD MM YYYY',
    ],
    'fr',
    true
  );
};

export const useDateRangePickerInputManagement = (
  params: UseDateRangePickerInputManagementParams
): UseDateRangePickerInputManagement => {
  const { dateRange, dateFormat, onChange } = params;
  const [inputValue, setInputValue] = useState<string>(
    formatDateRange(dateRange, dateFormat)
  );

  useEffect(() => {
    setInputValue(formatDateRange(dateRange, dateFormat));
  }, [dateRange, dateFormat]);

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setInputValue(e.currentTarget.value);
    const { from, to } = parseDateRangeInput(e.currentTarget.value, dateFormat);
    if (from && to) {
      onChange({ from: from.toDate(), to: to.toDate() }, true);
    }
  };

  const handleInputBlur = (inputValue: string) => {
    const { from, to } = parseDateRangeInput(inputValue, dateFormat);

    if (!from || !to) {
      if (!inputValue) {
        onChange({ from: null, to: null });
        return;
      }
      setInputValue(formatDateRange(dateRange, dateFormat));
      return;
    }

    const isNewValue =
      !from.isSame(dateRange.from, 'date') || !to.isSame(dateRange.to, 'date');
    if (!isNewValue) {
      setInputValue(
        formatDateRange({ from: from.toDate(), to: to.toDate() }, DATE_FORMAT)
      );
      return;
    }

    onChange({ from: from.toDate(), to: to.toDate() });
  };

  return { inputValue, setInputValue, handleInputChange, handleInputBlur };
};

const formatDateRange = (dateRange: DateRange, format: string): string => {
  if (!dateRange.from || !dateRange.to) return '';
  return `${dayjs(dateRange.from).format(format)} - ${dayjs(dateRange.to).format(format)}`;
};

const parseDateRangeInput = (
  input: string,
  format: string
): { from: Dayjs | null; to: Dayjs | null } => {
  const [fromString, toString] = input.split('-').map((s) => s.trim());
  const from = parseInputToDate(fromString, [format]);
  const to = parseInputToDate(toString, [format]);
  return { from: from.isValid() ? from : null, to: to.isValid() ? to : null };
};
