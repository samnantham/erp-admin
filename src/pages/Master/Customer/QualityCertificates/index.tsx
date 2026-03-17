import { useState } from 'react';

import {
  Box,
  Button,
  Flex,
  IconButton,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { FaEdit } from 'react-icons/fa';
import { HiPlus, HiTrash } from 'react-icons/hi';

import ConfirmationPopup from '@/components/ConfirmationPopup';
import DocumentDownloadButton from '@/components/DocumentDownloadButton';
import ModalForm from '@/pages/Master/Customer/QualityCertificates/ModalForm';

type QualityCertificatesProps = {
  name: string;
  fields: {
    id: number;
    certificate_type?: string;
    doc_no?: string;
    validity_date?: string;
    issue_date?: string;
    doc_url?: any;
  }[];
  onAdd: (data: any) => void;
  onRemove: (id: number) => void;
  onEdit: (id: number, data: any) => void;
  fieldPrefix?: string;
};

export const QualityCertificates = ({
  name,
  fields,
  onAdd,
  onRemove,
  onEdit,
}: QualityCertificatesProps) => {
  const [isOpen, toggleModal] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [isEdit, toggleEdit] = useState(false);
  const [indexTOEdit, setEditIndex] = useState<any>(null);
  const [indexTODelete, setDeleteIndex] = useState<any>(null);
  const [confirmationStatus, toggleConfirmation] = useState<boolean>(false);

  const closeModal = (status: boolean, isEdit: boolean, qcData: any) => {
    setSelected(null);
    toggleEdit(false);
    toggleModal(false);
    console.log(status, isEdit, qcData);
    if (status) {
      if (isEdit) {
        onEdit(indexTOEdit, qcData);
      } else {
        onAdd(qcData);
      }
    }
  };

  const deleteQC = (index: number) => {
    setDeleteIndex(index);
    toggleConfirmation(true);
  };

  const confirmDelete = () => {
    onRemove(indexTODelete);
    toggleConfirmation(false);
  };

  const openModal = (item: any, editStatus: boolean, editIndex?: number) => {
    setSelected(item);
    toggleModal(true);
    toggleEdit(editStatus);
    if (editStatus) {
      setEditIndex(editIndex);
    }
  };

  return (
    <Box mt={1}>
      <Flex justify="space-between" align="center" mb={2}>
        <Text fontSize="md" fontWeight="600">
          Quality / Other Documents
        </Text>
        <Button
          leftIcon={<HiPlus />}
          onClick={() => openModal(null, false)}
          size="sm"
          colorScheme="brand"
        >
          Add Document
        </Button>
      </Flex>

      <TableContainer
        rounded={'md'}
        overflow={'auto'}
        border="1px"
        borderColor="gray.500"
        borderRadius="md"
        boxShadow="md"
      >
        <Table variant="simple" size="sm">
          <Thead bg={'#0C2556'}>
            <Tr
              sx={{
                '& th': {
                  color: 'white',
                },
              }}
            >
              <Th>#</Th>
              <Th>{name} Type</Th>
              <Th>{name} File</Th>
              <Th>{name} No</Th>
              <Th>Issue. Date</Th>
              <Th>Valid. Date</Th>
              <Th>Action</Th>
            </Tr>
          </Thead>
          <Tbody>
            {fields.map((field, index) => (
              <Tr key={`index_${index}_${field.id}`}>
                <Td>{index + 1}</Td>
                <Td>{field?.certificate_type ?? ''}</Td>
                <Td>
                  <DocumentDownloadButton
                    size={'sm'}
                    url={field?.doc_url || ''}
                  />
                  <Text mt={1} fontSize={'xs'} color={'green.400'}>
                    {field?.doc_url}
                  </Text>
                </Td>
                <Td>{field?.doc_no ?? ''}</Td>
                <Td>
                  {field?.issue_date
                    ? dayjs(field?.issue_date).format('DD-MMM-YYYY')
                    : ' - '}
                </Td>
                <Td>
                  {field?.validity_date
                    ? dayjs(field?.validity_date).format('DD-MMM-YYYY')
                    : ' - '}
                </Td>
                <Td>
                  <IconButton
                    aria-label={`Edit ${name} Field`}
                    icon={<FaEdit />}
                    colorScheme="green"
                    size="sm"
                    onClick={() => openModal(field, true, index)}
                    mr={2}
                  />
                  <IconButton
                    aria-label={`Remove ${name} Field`}
                    icon={<HiTrash />}
                    colorScheme="red"
                    size="sm"
                    onClick={() => deleteQC(index)}
                  />
                </Td>
              </Tr>
            ))}
            {fields.length === 0 && (
              <Tr>
                <Td colSpan={7} textAlign={'center'}>
                  No Quality certificates Found.
                </Td>
              </Tr>
            )}
          </Tbody>
        </Table>
      </TableContainer>

      <ModalForm
        isOpen={isOpen}
        onClose={closeModal}
        existInfo={selected}
        isEdit={isEdit}
      />
      <ConfirmationPopup
        isOpen={confirmationStatus}
        onClose={() => {
          toggleConfirmation(false);
          setDeleteIndex(null);
        }}
        onConfirm={confirmDelete}
        headerText="Remove Quality Certificate!!!"
        bodyText="Are you sure you want to delete this QC?"
      />
    </Box>
  );
};