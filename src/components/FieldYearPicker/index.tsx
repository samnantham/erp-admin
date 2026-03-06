import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  SimpleGrid,
  Portal,
} from '@chakra-ui/react';
import { FieldProps, useField } from '@formiz/core';
import dayjs, { Dayjs } from 'dayjs';
import { FiCalendar } from 'react-icons/fi';
import { usePopper } from 'react-popper';

import { FormGroup, FormGroupProps } from '@/components/FormGroup';
import { Icon } from '@/components/Icons';

type Value = Dayjs;

export type FieldYearPickerProps = FieldProps<
  Value,
  string | number | Date | null
> &
  FormGroupProps & {
    placeholder?: string;
    disableTyping?: boolean;
    yearRange?: { start: number; end: number };
    noFormGroup?: boolean;
    portalTarget?: HTMLElement | null;
    isDisabled?: boolean;
  };

const MIN_YEAR = 1950;

export const FieldYearPicker = ({
  placeholder = 'Select year',
  size = 'md',
  disableTyping = false,
  yearRange,
  noFormGroup = false,
  portalTarget,
  isDisabled = false,
  ...props
}: FieldYearPickerProps) => {
  const field = useField(props, {
    formatValue: (v) => (v ? dayjs(v) : null),
  });

  const { id, isValid, errorMessage, shouldDisplayError, isRequired } = field;
  const showError = shouldDisplayError && !isValid;

  const [referenceElement, setReferenceElement] =
    useState<HTMLElement | null>(null);
  const [popperElement, setPopperElement] =
    useState<HTMLElement | null>(null);

  const currentYear = dayjs().year();
  const MAX_YEAR = yearRange?.end ?? currentYear;
  const startYear = yearRange?.start ?? currentYear - 50;
  const endYear = MAX_YEAR;

  const years = useMemo(
    () =>
      Array.from(
        { length: endYear - startYear + 1 },
        (_, i) => startYear + i
      ),
    [startYear, endYear]
  );

  const [visible, setVisible] = useState(false);
  const [inputValue, setInputValue] = useState('');

  // Sync input if value changes externally
  useEffect(() => {
    if (field.value) {
      setInputValue(field.value.format('YYYY'));
    }
  }, [field.value]);

  const filteredYears = useMemo(() => {
    if (!inputValue) return years;
    return years.filter((year) =>
      String(year).startsWith(inputValue)
    );
  }, [years, inputValue]);

  const { styles, attributes } = usePopper(
    referenceElement,
    popperElement,
    {
      placement: 'bottom-start',
      modifiers: [
        {
          name: 'preventOverflow',
          options: {
            boundary: document.body,
            altBoundary: true,
          },
        },
        {
          name: 'flip',
          options: {
            fallbackPlacements: ['top-start', 'bottom-end'],
          },
        },
      ],
    }
  );

  const handleSelect = useCallback(
    (year: number) => {
      if (isDisabled) return;

      const date = dayjs().year(year).startOf('year');
      field.setValue(date);
      field.setIsTouched(true);
      setInputValue(String(year));
      setVisible(false);
    },
    [field, isDisabled]
  );

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (isDisabled) return;

    const value = e.target.value;

    if (value === '') {
      setInputValue('');
      field.setValue(null);
      setVisible(true);
      return;
    }

    if (!/^\d*$/.test(value)) return;
    if (value.length > 4) return;

    setInputValue(value);
    setVisible(true);
  };

  const handleInputBlur = () => {
    field.setIsTouched(true);

    if (inputValue.length !== 4) {
      setInputValue(field.value?.format('YYYY') ?? '');
      return;
    }

    const year = Number(inputValue);

    if (year < MIN_YEAR || year > MAX_YEAR) {
      setInputValue(field.value?.format('YYYY') ?? '');
      return;
    }

    field.setValue(dayjs().year(year).startOf('year'));
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        referenceElement &&
        popperElement &&
        !referenceElement.contains(event.target as Node) &&
        !popperElement.contains(event.target as Node)
      ) {
        setVisible(false);
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [visible, referenceElement, popperElement]);

  const [defaultPortalTarget, setDefaultPortalTarget] =
    useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!portalTarget && typeof document !== 'undefined') {
      let target = document.getElementById('year-picker-portal');
      if (!target) {
        target = document.createElement('div');
        target.id = 'year-picker-portal';
        document.body.appendChild(target);
      }
      setDefaultPortalTarget(target);
    }
  }, [portalTarget]);

  const content = (
    <>
      <InputGroup className="year-picker">
        <InputLeftElement pointerEvents="none">
          <Icon
            icon={FiCalendar}
            color={isDisabled ? 'gray.300' : 'gray.400'}
          />
        </InputLeftElement>

        <Input
          ref={setReferenceElement}
          id={id}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => !isDisabled && setVisible(true)}
          placeholder={placeholder}
          readOnly={disableTyping}
          size={size}
          isDisabled={isDisabled}
          inputMode="numeric"
          pattern="\d{4}"
        />
      </InputGroup>

      {visible && !isDisabled && (
        <Portal
          containerRef={{
            current: portalTarget || defaultPortalTarget,
          }}
        >
          <Box
            ref={setPopperElement}
            {...attributes.popper}
            style={{ ...styles.popper, zIndex: 9999 }}
            bg="white"
            p={3}
            maxHeight="14rem"
            overflowY="auto"
            shadow="md"
            borderRadius="md"
            borderWidth="1px"
          >
            {filteredYears.length === 0 ? (
              <Box textAlign="center" color="gray.500">
                No years found
              </Box>
            ) : (
              <SimpleGrid columns={5} spacing={2}>
                {filteredYears.map((year) => (
                  <Button
                    key={year}
                    size={size}
                    variant="ghost"
                    onMouseDown={(e) => {
                      e.preventDefault(); // 👈 prevents blur
                      handleSelect(year);
                    }}
                  >
                    {year}
                  </Button>
                ))}
              </SimpleGrid>
            )}
          </Box>
        </Portal>
      )}
    </>
  );

  return noFormGroup ? (
    content
  ) : (
    <FormGroup
      id={id}
      label={props.label}
      errorMessage={errorMessage}
      showError={showError}
      isRequired={isRequired}
    >
      {content}
    </FormGroup>
  );
};
