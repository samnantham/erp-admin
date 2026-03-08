import { useField, FieldProps } from "@formiz/core";
import {
  InputGroup,
  Box,
  useColorModeValue
} from "@chakra-ui/react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";
import { CountryCode } from "libphonenumber-js";
import "react-phone-number-input/style.css";

import { FormGroup, FormGroupProps } from "@/components/FormGroup";

type Value = string | undefined;

export type FieldPhoneProps = FieldProps<Value> &
  FormGroupProps & {
    placeholder?: string;
    defaultCountry?: CountryCode;
    size?: any;
  };

export const FieldPhone = (props: FieldPhoneProps) => {
  const field = useField({
    ...props,
    validations: [
      ...(props.validations ?? []),
      {
        handler: (value: Value) => !value || isValidPhoneNumber(value),
        message: "Invalid phone number",
      },
    ],
  });

  const {
    placeholder,
    defaultCountry = "AE",
    isDisabled,
    size = "md",
    ...rest
  } = field.otherProps;

  const borderColor = useColorModeValue("gray.200", "gray.600");

  /** Normalize Chakra responsive size */
  const normalizedSize =
    typeof size === "string"
      ? size
      : Array.isArray(size)
      ? size[0]
      : size?.base || "md";

  const heightMap = {
    sm: "32px",
    md: "40px",
    lg: "48px",
  };

  const formGroupProps = {
    ...rest,
    errorMessage: field.errorMessage,
    id: field.id,
    isRequired: field.isRequired,
    showError:
      (props.showError ?? field.shouldDisplayError) && !field.isValid,
  };

  return (
    <FormGroup {...formGroupProps}>
      <InputGroup size={normalizedSize}>
        <Box
          border="1px"
          borderColor={
            field.shouldDisplayError && !field.isValid
              ? "red.500"
              : borderColor
          }
          borderRadius="md"
          width="100%"
          display="flex"
          alignItems="center"
          px={3}
          minH={heightMap[normalizedSize as "sm" | "md" | "lg"]}
          opacity={isDisabled ? 0.7 : 1}
          bg={isDisabled ? "gray.100" : "white"}
          _focusWithin={{
            borderColor: "blue.500",
            boxShadow: "0 0 0 1px var(--chakra-colors-blue-500)",
          }}
          sx={{
            ".PhoneInput": {
              display: "flex",
              alignItems: "center",
              width: "100%",
            },
            ".PhoneInputCountry": {
              marginRight: "8px",
            },
            ".PhoneInputInput": {
              border: "none",
              outline: "none",
              width: "100%",
              fontSize: "inherit",
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
      </InputGroup>
    </FormGroup>
  );
};