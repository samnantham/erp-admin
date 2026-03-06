import React from 'react';

import {
  Box,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Tr,
} from '@chakra-ui/react';

export const FlowNumberList = ({}) => {
  return (
    <React.Fragment>
      <Text fontSize={'md'} fontWeight={'700'}>
        STF No
      </Text>
      <Stack
        spacing={8}
        direction={{ base: 'column', md: 'row' }}
        gap="5px"
        flexWrap={'wrap'}
        mb={'1rem'}
      >
        <Box
          borderColor={'gray.200'}
          flexGrow={'1'}
          backgroundColor="white"
          whiteSpace="white-space"
        >
          <TableContainer>
            <Table variant="striped" colorScheme="teal">
              <Tbody border="1px solid #B2F5EA">
                <Tr>
                  <Td>STF No :</Td>
                  <Td>STF-IMP-1856</Td>
                </Tr>
                <Tr>
                  <Td>LO No :</Td>
                  <Td>153</Td>
                </Tr>
                <Tr>
                  <Td>Vendor :</Td>
                  <Td>VD GULF</Td>
                </Tr>
                <Tr>
                  <Td>Contact :</Td>
                  <Td>Mr. Jimmy Wu</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
        <Box
          borderColor={'gray.200'}
          flexGrow={'1'}
          backgroundColor="white"
          whiteSpace="white-space"
        >
          <TableContainer>
            <Table variant="striped" colorScheme="teal">
              <Tbody border="1px solid #B2F5EA">
                <Tr>
                  <Td>STF Date :</Td>
                  <Td>17-May-2024</Td>
                </Tr>
                <Tr>
                  <Td>LO Date :</Td>
                  <Td>12-May-2024</Td>
                </Tr>
                <Tr>
                  <Td>Vendor Code :</Td>
                  <Td>VEN001</Td>
                </Tr>
                <Tr>
                  <Td>Bill To Address :</Td>
                  <Td whiteSpace={'normal'}>
                    18321 Ventura Blvd, Suite 400 Tarzana, CA 91356 USA{' '}
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
        <Box
          borderColor={'gray.200'}
          flexGrow={'1'}
          backgroundColor="white"
          whiteSpace="white-space"
        >
          <TableContainer>
            <Table variant="striped" colorScheme="teal">
              <Tbody border="1px solid #B2F5EA">
                <Tr>
                  <Td>PO No :</Td>
                  <Td>PO1856</Td>
                </Tr>
                <Tr>
                  <Td>DG :</Td>
                  <Td>DG/Non-DG</Td>
                </Tr>
                <Tr>
                  <Td>Shipping Address :</Td>
                  <Td whiteSpace={'normal'}>
                    YeS Technik, P3-06 SAIF Zone, Sharjah, UAE
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
        <Box
          borderColor={'gray.200'}
          flexGrow={'1'}
          backgroundColor="white"
          whiteSpace="white-space"
        >
          <TableContainer>
            <Table variant="striped" colorScheme="teal">
              <Tbody border="1px solid #B2F5EA">
                <Tr>
                  <Td>PO Date :</Td>
                  <Td>10-May-2024</Td>
                </Tr>
                <Tr>
                  <Td>FOB :</Td>
                  <Td>Origin</Td>
                </Tr>
                <Tr>
                  <Td>No of Package :</Td>
                  <Td>4</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
      <Text fontSize={'md'} fontWeight={'700'}>
        PO No
      </Text>
      <Stack
        spacing={8}
        direction={{ base: 'column', md: 'row' }}
        gap="5px"
        flexWrap={'wrap'}
        mb={'1rem'}
      >
        <Box
          borderColor={'gray.200'}
          flexGrow={'1'}
          backgroundColor="white"
          whiteSpace="white-space"
        >
          <TableContainer>
            <Table variant="striped" colorScheme="purple">
              <Tbody border="1px solid #e2e8f0">
                <Tr>
                  <Td>PO No :</Td>
                  <Td>PO1856</Td>
                </Tr>
                <Tr>
                  <Td>LO No :</Td>
                  <Td>153</Td>
                </Tr>
                <Tr>
                  <Td>Vendor :</Td>
                  <Td>VD GULF</Td>
                </Tr>
                <Tr>
                  <Td>Contact :</Td>
                  <Td>Mr. Jimmy Wu</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
        <Box
          borderColor={'gray.200'}
          flexGrow={'1'}
          backgroundColor="white"
          whiteSpace="white-space"
        >
          <TableContainer>
            <Table variant="striped" colorScheme="purple">
              <Tbody border="1px solid #e2e8f0">
                <Tr>
                  <Td>PO Date :</Td>
                  <Td>17-May-2024</Td>
                </Tr>
                <Tr>
                  <Td>LO Date :</Td>
                  <Td>12-May-2024</Td>
                </Tr>
                <Tr>
                  <Td>Vendor Code :</Td>
                  <Td>VEN001</Td>
                </Tr>
                <Tr>
                  <Td>Bill To Address :</Td>
                  <Td whiteSpace={'normal'}>
                    18321 Ventura Blvd, Suite 400 Tarzana, CA 91356 USA{' '}
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
        <Box
          borderColor={'gray.200'}
          flexGrow={'1'}
          backgroundColor="white"
          whiteSpace="white-space"
        >
          <TableContainer>
            <Table variant="striped" colorScheme="purple">
              <Tbody border="1px solid #e2e8f0">
                <Tr>
                  <Td>STF No :</Td>
                  <Td>STF-IMP-1856</Td>
                </Tr>
                <Tr>
                  <Td>DG :</Td>
                  <Td>DG/Non-DG</Td>
                </Tr>
                <Tr>
                  <Td>Shipping Address :</Td>
                  <Td whiteSpace={'normal'}>
                    YeS Technik, P3-06 SAIF Zone, Sharjah, UAE
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
        <Box
          borderColor={'gray.200'}
          flexGrow={'1'}
          backgroundColor="white"
          whiteSpace="white-space"
        >
          <TableContainer>
            <Table variant="striped" colorScheme="purple">
              <Tbody border="1px solid #e2e8f0">
                <Tr>
                  <Td>STF Date :</Td>
                  <Td>10-May-2024</Td>
                </Tr>
                <Tr>
                  <Td>FOB :</Td>
                  <Td>Origin</Td>
                </Tr>
                <Tr>
                  <Td>No of Package :</Td>
                  <Td>4</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
      <Text fontSize={'md'} fontWeight={'700'}>
        LO No
      </Text>
      <Stack
        spacing={8}
        direction={{ base: 'column', md: 'row' }}
        gap="5px"
        flexWrap={'wrap'}
        mb={'1rem'}
      >
        <Box
          borderColor={'gray.200'}
          flexGrow={'1'}
          backgroundColor="white"
          whiteSpace="white-space"
        >
          <TableContainer>
            <Table variant="striped" colorScheme="teal">
              <Tbody border="1px solid #B2F5EA">
                <Tr>
                  <Td>LO No :</Td>
                  <Td>STF-IMP-1856</Td>
                </Tr>
                <Tr>
                  <Td>STF No :</Td>
                  <Td>153</Td>
                </Tr>
                <Tr>
                  <Td>Vendor :</Td>
                  <Td>VD GULF</Td>
                </Tr>
                <Tr>
                  <Td>Contact :</Td>
                  <Td>Mr. Jimmy Wu</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
        <Box
          borderColor={'gray.200'}
          flexGrow={'1'}
          backgroundColor="white"
          whiteSpace="white-space"
        >
          <TableContainer>
            <Table variant="striped" colorScheme="teal">
              <Tbody border="1px solid #B2F5EA">
                <Tr>
                  <Td>LO Date :</Td>
                  <Td>17-May-2024</Td>
                </Tr>
                <Tr>
                  <Td>STF Date :</Td>
                  <Td>12-May-2024</Td>
                </Tr>
                <Tr>
                  <Td>Vendor Code :</Td>
                  <Td>VEN001</Td>
                </Tr>
                <Tr>
                  <Td>Bill To Address :</Td>
                  <Td whiteSpace={'normal'}>
                    18321 Ventura Blvd, Suite 400 Tarzana, CA 91356 USA{' '}
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
        <Box
          borderColor={'gray.200'}
          flexGrow={'1'}
          backgroundColor="white"
          whiteSpace="white-space"
        >
          <TableContainer>
            <Table variant="striped" colorScheme="teal">
              <Tbody border="1px solid #B2F5EA">
                <Tr>
                  <Td>PO No :</Td>
                  <Td>PO1856</Td>
                </Tr>
                <Tr>
                  <Td>DG :</Td>
                  <Td>DG/Non-DG</Td>
                </Tr>
                <Tr>
                  <Td>Shipping Address :</Td>
                  <Td whiteSpace={'normal'}>
                    YeS Technik, P3-06 SAIF Zone, Sharjah, UAE
                  </Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
        <Box
          borderColor={'gray.200'}
          flexGrow={'1'}
          backgroundColor="white"
          whiteSpace="white-space"
        >
          <TableContainer>
            <Table variant="striped" colorScheme="teal">
              <Tbody border="1px solid #B2F5EA">
                <Tr>
                  <Td>PO Date :</Td>
                  <Td>10-May-2024</Td>
                </Tr>
                <Tr>
                  <Td>FOB :</Td>
                  <Td>Origin</Td>
                </Tr>
                <Tr>
                  <Td>No of Package :</Td>
                  <Td>4</Td>
                </Tr>
              </Tbody>
            </Table>
          </TableContainer>
        </Box>
      </Stack>
    </React.Fragment>
  );
};
