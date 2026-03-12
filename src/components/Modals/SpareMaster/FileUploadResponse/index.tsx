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
  Tabs,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';

type ModalPopupProps = {
  isOpen: boolean;
  onClose: () => void;
  response: any;
};

export const FileUploadResponseModal = ({
  isOpen,
  onClose,
  response,
}: ModalPopupProps) => {
  return (
    <div>
      <Modal isOpen={isOpen} onClose={onClose} size="lg" closeOnOverlayClick={false} closeOnEsc={false}>
        <ModalOverlay />
        <ModalContent maxWidth="50vw">
          <ModalHeader>File Upload Status</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Tabs>
              <TabList>
                <Tab
                  _selected={{
                    bg: 'red.400', // Green color for Successful tab when selected
                    color: 'white',
                  }}
                  _hover={{
                    bg: 'red.300', // Green hover effect
                  }}
                >
                  UnSuccessful
                </Tab>
                <Tab
                  _selected={{
                    bg: 'green.400', // Red color for Unsuccessful tab when selected
                    color: 'white',
                  }}
                  _hover={{
                    bg: 'green.300', // Red hover effect
                  }}
                >
                  Successful
                </Tab>
              </TabList>

              <TabPanels>
                <TabPanel>
                <Table variant="simple" size={'sm'}>
                    <Thead>
                      <Tr>
                        <Th>#</Th>
                        <Th>Part Number</Th>
                        <Th>Message</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                    {response?.errors && response?.errors.map((item: any, index: number) => (
                      <Tr key={index}>
                        <Td>{item?.row}</Td>
                        <Td>{item?.part_number}</Td>
                        <Td>{item?.message}</Td>
                      </Tr>))}
                      {response?.errors && response?.errors.length === 0 && (
                      <Tr>
                        <Td colSpan={4} textAlign={'center'}>No part numbers found </Td>
                      </Tr>)}
                      
                    </Tbody>
                  </Table>
                  
                </TabPanel>
                <TabPanel>
                <Table variant="simple" size={'sm'}>
                    <Thead>
                    <Tr>
                        <Th>#</Th>
                        <Th>Part Number</Th>
                        <Th>Desc.</Th>
                      </Tr>
                    
                    </Thead>
                    <Tbody>
                    {response?.created_spares && response?.created_spares.map((item: any, index: number) => (
                      <Tr key={index}>
                        <Td>{index + 1}</Td>
                        <Td>{item.part_number}</Td>
                        <Td>{item.description}</Td>
                      </Tr>
                      ))}
                       {response?.created_spares && response?.created_spares.length === 0 && (
                      <Tr>
                        <Td colSpan={3} textAlign={'center'}>No part numbers found </Td>
                      </Tr>)}
                    </Tbody>
                  </Table>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default FileUploadResponseModal;
