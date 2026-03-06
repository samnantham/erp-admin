import React from "react";
import {
  Box,
  CircularProgress,
  CircularProgressLabel,
  Text,
  useColorModeValue,
} from "@chakra-ui/react";

type Props = {
  value: number;           // 0–100
  size?: string;           // e.g. "120px"
  thickness?: string;      // e.g. "10px"
  color?: string;          // e.g. "teal.400"
  trackColor?: string;     // e.g. "gray.100"
  showLabel?: boolean;     // show numeric label inside
  format?: (v: number) => string; // custom label formatter
};

export const CircularProgressBar: React.FC<Props> = ({
  value,
  size = "120px",
  thickness = "10px",
  color = "teal.400",
  trackColor,
  showLabel = true,
  format,
}) => {
  const fallbackTrack = useColorModeValue("gray.100", "whiteAlpha.200");
  const label = format ? format(value) : `${Math.round(value)}%`;

  return (
    <Box display="inline-flex" position="relative">
      <CircularProgress
        value={value}
        size={size}
        thickness={thickness}
        color={color}
        trackColor={trackColor ?? fallbackTrack}
        capIsRound
      >
        {showLabel && (
          <CircularProgressLabel>
            <Text fontSize="sm" fontWeight="bold">
              {label}
            </Text>
          </CircularProgressLabel>
        )}
      </CircularProgress>
    </Box>
  );
};

export default CircularProgressBar;