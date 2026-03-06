// utils/tableHelpers.tsx
import { Text } from '@chakra-ui/react';
import React, { ReactNode } from 'react';

interface CenterTextProps {
  children: ReactNode;
}

/**
 * Universal centering component that accepts:
 * - Strings
 * - Numbers
 * - JSX Elements
 * - Other React nodes
 */
export const CenterText: React.FC<CenterTextProps> = ({ children }) => (
  <Text textAlign="center" width="100%">
    {children}
  </Text>
);

// Helper functions for specific use cases
export const centerText = (content: ReactNode): JSX.Element => (
  <CenterText>{content}</CenterText>
);

export const centerCell = (content: ReactNode): JSX.Element => (
  <CenterText>{content}</CenterText>
);