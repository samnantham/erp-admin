import { Text } from '@chakra-ui/react';

export const highlightSearch = (text: string, search: string): any => {
    if (!search) return text;

  const regex = new RegExp(`(${search})`, 'gi'); 
  const parts = text.split(regex);

  return parts.map((part, index) => {
    return part.toLowerCase() === search.toLowerCase() ? (
      <Text key={index} as="span" style={{ backgroundColor: 'yellow' }}>
        {part}
      </Text>
    ) : (
      <Text key={index} as="span">{part}</Text> 
    );
  });
};
