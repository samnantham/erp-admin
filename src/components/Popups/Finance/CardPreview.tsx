import { Box, Text, Flex } from "@chakra-ui/react";
import { CardData } from "./types";

type Props = {
  data: CardData;
};

export const CardPreview: React.FC<Props> = ({ data }) => {
  const last4 = String(data.card_last4).padStart(4, "0");
  const month = String(data.expiry_month).padStart(2, "0");
  const year = String(data.expiry_year).slice(-2);

  return (
    <Box
      w="340px"
      h="200px"
      borderRadius="2xl"
      p={5}
      color="white"
      bg="linear-gradient(135deg, #0f2027, #203a43, #2c5364)"
      boxShadow="xl"
      position="relative"
    >
      <Box w="50px" h="35px" bg="yellow.300" borderRadius="md" mb={4} />

      <Text fontSize="xl" letterSpacing="3px" mb={4}>
        •••• •••• •••• {last4}
      </Text>

      <Flex justify="space-between">
        <Box>
          <Text fontSize="xs">CARD HOLDER</Text>
          <Text fontWeight="bold">{data.card_holder_name}</Text>
        </Box>

        <Box textAlign="right">
          <Text fontSize="xs">EXPIRES</Text>
          <Text fontWeight="bold">
            {month}/{year}
          </Text>
        </Box>
      </Flex>

      <Text position="absolute" bottom="4" right="5" fontWeight="bold">
        {data.card_type ?? "CARD"}
      </Text>
    </Box>
  );
};