import { Box, Button, Flex, Text } from '@chakra-ui/react';
import { BsShieldFillX } from "react-icons/bs";
import { Link } from 'react-router-dom';

const Unauthorized = () => (
  <Flex height="60vh" justify="center" align="center">
    <Box textAlign="center" p={5} shadow="md" borderRadius="md" bg="white">
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        fontSize="6xl"
        mb={4}
      >
        <BsShieldFillX />
      </Box>
      <Text fontSize="2xl" fontWeight="bold" mb={4}>
        403 - Unauthorized
      </Text>
      <Text mb={4}>You do not have permission to access this page.</Text>
      <Link to="/">
        <Button colorScheme="teal">Go back to Home</Button>
      </Link>
    </Box>
  </Flex>
);

export default Unauthorized;
