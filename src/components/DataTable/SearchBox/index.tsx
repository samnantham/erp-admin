// components/TableSearchBox.tsx
import { Input, InputGroup, InputLeftElement } from '@chakra-ui/react';
import { LuSearch } from 'react-icons/lu';

interface TableSearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  size?: string;
  width?: string | number;
}

export const TableSearchBox = ({
  value,
  onChange,
  placeholder = 'Search table...',
  width = '100%',
  size="md"
}: TableSearchBoxProps) => {
  return (
    <InputGroup width={width} size={size}>
      <InputLeftElement pointerEvents="none">
        <LuSearch color="gray.300" />
      </InputLeftElement>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        bg="white"
        borderRadius="md"
      />
    </InputGroup>
  );
};