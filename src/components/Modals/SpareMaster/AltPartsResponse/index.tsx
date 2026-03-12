import { useState } from 'react';

import {
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableContainer,
  Tabs,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';

import PartDetails from '@/components/PreviewContents/PartDetails';

type ModalPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  response: any;
};

export const AltPartsResponseModal = ({
  isOpen,
  onClose,
  response,
}: ModalPopupProps) => {
  const [selectedTab, setSelectedTab] = useState(0);
  return (
    <div>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={false} closeOnEsc={false}>
        <ModalOverlay />
        <ModalContent maxWidth="50vw">
          <ModalHeader>Assigned Alternate Parts Status</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Tabs index={selectedTab} onChange={setSelectedTab}>
              <TabList>
                <Tab
                  bg={selectedTab === 0 ? '#0C2556' : 'gray.200'}
                  color={selectedTab === 0 ? 'white' : 'black'}
                  onClick={() => setSelectedTab(0)}
                  _hover={{ bg: selectedTab === 0 ? '#0C2556' : 'gray.300' }}
                >
                  Alt.Parts Assigned Successfully
                </Tab>
                <Tab
                  bg={selectedTab === 1 ? '#0C2556' : 'gray.200'}
                  color={selectedTab === 1 ? 'white' : 'black'}
                  onClick={() => setSelectedTab(1)}
                  _hover={{ bg: selectedTab === 1 ? '#0C2556' : 'gray.300' }}
                >
                  Alt.Parts Not Assigned
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel key={`panel-0`} p={0}>
                  <TableContainer
                    boxShadow={'md'}
                    borderWidth={1}
                    borderColor={'gray.200'}
                  >
                    <Table variant="striped" size={'sm'}>
                      <Thead bg={'#0C2556'}>
                        <Tr>
                          <Th color={'white'} paddingTop={2} paddingBottom={2}>
                            #
                          </Th>
                          <Th color={'white'} paddingTop={2} paddingBottom={2}>
                            Part Number
                          </Th>
                          <Th color={'white'} paddingTop={2} paddingBottom={2}>
                            Alt Part Number
                          </Th>
                          <Th color={'white'} paddingTop={2} paddingBottom={2}>
                            Remarks
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {response?.successfulItems &&
                          response?.successfulItems.map(
                            (item: any, index: number) => (
                              <Tr key={index}>
                                <Td>{index + 1}</Td>
                                <Td>
                                  <PartDetails
                                    partNumber={item?.part_number_id}
                                    field={'part_number'}
                                  />
                                </Td>
                                <Td>
                                  <PartDetails
                                    partNumber={item?.alternate_part_number_id}
                                    field={'part_number'}
                                  />
                                </Td>
                                <Td>{item.remark || ' - '}</Td>
                              </Tr>
                            )
                          )}
                        {response?.successfulItems &&
                          response?.successfulItems.length === 0 && (
                            <Tr>
                              <Td colSpan={4} textAlign={'center'}>
                                No records found.
                              </Td>
                            </Tr>
                          )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </TabPanel>
                <TabPanel key={`panel-1`} p={0}>
                  <TableContainer
                    boxShadow={'md'}
                    borderWidth={1}
                    borderColor={'gray.200'}
                  >
                    <Table variant="striped" size={'sm'}>
                      <Thead bg={'#0C2556'}>
                        <Tr>
                          <Th color={'white'} paddingTop={2} paddingBottom={2}>#</Th>
                          <Th color={'white'} paddingTop={2} paddingBottom={2}>Part Number</Th>
                          <Th color={'white'} paddingTop={2} paddingBottom={2}>Alt Part Number</Th>
                          <Th color={'white'} paddingTop={2} paddingBottom={2}>Message</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {response?.erroredItems &&
                          response?.erroredItems.map(
                            (item: any, index: number) => (
                              <Tr key={index}>
                                <Td>{index + 1}</Td>
                                <Td>
                                  <PartDetails
                                    partNumber={item?.part_number_id}
                                    field={'part_number'}
                                  />
                                </Td>
                                <Td>
                                  <PartDetails
                                    partNumber={item?.alternate_part_number_id}
                                    field={'part_number'}
                                  />
                                </Td>
                                <Td>{item?.message}</Td>
                              </Tr>
                            )
                          )}
                        {response?.erroredItems &&
                          response?.erroredItems.length === 0 && (
                            <Tr>
                              <Td colSpan={4} textAlign={'center'}>
                                No records found.
                              </Td>
                            </Tr>
                          )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default AltPartsResponseModal;
