import { ReactNode } from 'react';

import {
  FormControl,
  FormControlProps,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  SlideFade,
} from '@chakra-ui/react';
import { LuAlertCircle } from 'react-icons/lu';

import { Icon } from '@/components/Icons';

export type FormGroupProps = Omit<
  FormControlProps,
  'onChange' | 'defaultValue' | 'label' | 'placeholder'
> & {
  children?: ReactNode;
  errorMessage?: ReactNode;
  helper?: ReactNode;
  id?: string;
  isRequired?: boolean;
  label?: ReactNode;
  showError?: boolean;
  labelSize?: 'sm' | 'md' | 'lg';
};

const sizeToFontSizeMap = {
  sm: 'sm', // Small font size
  md: 'md', // Default font size
  lg: 'lg', // Large font size
};

export const FormGroup = ({
  children,
  errorMessage,
  helper,
  id,
  isRequired,
  label,
  showError,
  labelSize = 'md',
  ...props
}: FormGroupProps) => (
  <FormControl isInvalid={showError} isRequired={isRequired} {...props}>
    {!!label && (
      <FormLabel htmlFor={id} fontSize={sizeToFontSizeMap[labelSize]}>
        {label}
      </FormLabel>
    )}
    {children}
    {!!helper && <FormHelperText>{helper}</FormHelperText>}

    {!!errorMessage && (
      <FormErrorMessage id={`${id}-error`}>
        <SlideFade in offsetY={-6}>
          <Icon icon={LuAlertCircle} me="2" />
          {errorMessage}
        </SlideFade>
      </FormErrorMessage>
    )}
  </FormControl>
);
