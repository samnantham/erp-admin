import { Checkbox, Flex, Spinner } from '@chakra-ui/react';
import { FieldProps, useField } from '@formiz/core';
import { FormGroup, FormGroupProps } from '@/components/FormGroup';

type Value = boolean;

export type FieldCheckboxProps<FormattedValue = Value> = FieldProps<
  Value,
  FormattedValue
> &
  FormGroupProps & {
    label?: string;
  };

export const FieldCheckbox = <FormattedValue = Value,>(
  props: FieldCheckboxProps<FormattedValue>
) => {
  const field = useField(props);

  const { label, ...rest } = field.otherProps;

  const formGroupProps = {
    ...rest,
    id: field.id,
    errorMessage: field.errorMessage,
    isRequired: field.isRequired,
    showError: (props.showError ?? field.shouldDisplayError) && !field.isValid,
    label: undefined, // prevent FormGroup label
  };

  return (
    <FormGroup {...formGroupProps}>
      <Flex align="center">
        <Checkbox
          id={field.id}
          isChecked={!!field.value}
          onChange={(e) => {
            field.setValue(e.target.checked);
            field.setIsTouched(true);
          }}
        >
          {label}
        </Checkbox>

        {(field.isTouched || field.isSubmitted) && field.isValidating && (
          <Spinner size="sm" ml={2} />
        )}
      </Flex>
    </FormGroup>
  );
};