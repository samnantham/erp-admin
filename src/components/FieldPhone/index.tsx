import { useField, FieldProps } from "@formiz/core";
import { Box } from "@chakra-ui/react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { CountryCode } from "libphonenumber-js";
import "react-phone-number-input/style.css";

import { FormGroup, FormGroupProps } from "@/components/FormGroup";

type Value = string | undefined;

export type FieldPhoneProps = FieldProps<Value> &
  FormGroupProps & {
    placeholder?: string;
    defaultCountry?: CountryCode;
  };

export const FieldPhone = (props: FieldPhoneProps) => {
  const field = useField({
    ...props,
    validations: [
      ...(props.validations ?? []),
      {
        handler: (value: Value) =>
          !value || isValidPhoneNumber(value),
        message: "Invalid phone number",
      },
    ],
  });

  const {
    placeholder,
    defaultCountry = "IN",
    isDisabled,
    ...rest
  } = field.otherProps;

  const formGroupProps = {
    ...rest,
    errorMessage: field.errorMessage,
    id: field.id,
    isRequired: field.isRequired,
    showError: (props.showError ?? field.shouldDisplayError) && !field.isValid,
  };

  return (
    <FormGroup {...formGroupProps}>
      <Box
        sx={{
          ".PhoneInput": {
            display: "flex",
            alignItems: "center",
            border: "1px solid",
            borderColor: "gray.200",
            borderRadius: "6px",
            padding: "6px",
            opacity: isDisabled ? 0.6 : 1,
          },
          ".PhoneInputInput": {
            border: "none",
            outline: "none",
            width: "100%",
            fontSize: "14px",
            background: "transparent",
          },
        }}
      >
        <PhoneInput
          international
          defaultCountry={defaultCountry}
          value={field.value as string | undefined}
          placeholder={placeholder || "Enter phone number"}
          disabled={isDisabled}
          onChange={(value) => field.setValue(value ?? "")}
          onBlur={() => field.setIsTouched(true)}
        />
      </Box>
    </FormGroup>
  );
};