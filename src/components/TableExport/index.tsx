import React from 'react';

import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
} from '@chakra-ui/react';
import { FaDownload, FaFileCsv, FaFilePdf } from 'react-icons/fa';

interface TableExportProps {
  loading?: boolean;
  showPerPage?: boolean;
  isExportable?: boolean;
  exportTableData: (format: 'csv' | 'pdf', pageNo?: any) => void;
}

export const TableExport: React.FC<TableExportProps> = ({
  loading,
  showPerPage = false,
  isExportable = false,
  exportTableData,
}) => {
  return (
    <Menu>
      <MenuButton
        as={Button}
        leftIcon={<Box mr={3} as={FaDownload} />}
        rightIcon={<Box ml={3} as={ChevronDownIcon} />}
        size="sm"
        variant="ghost"
        ml={2}
        color={'white'}
        bg={'#0C2556'}
        _hover={{
          bg: '#0C2556',
        }}
        isDisabled={loading || !isExportable}
      >
        Export as
      </MenuButton>
      <MenuList
        width="130px"
        maxW="130px"
        minW="130px"
        boxShadow="md"
        sx={{ overflow: 'hidden', padding: '4px' }}
      >
        {showPerPage === true && (
          <React.Fragment>
        <Box px={3} py={0} fontSize="sm" fontWeight="semibold">
          Total Records
        </Box>
        <MenuDivider />
        </React.Fragment>
        )}
        <MenuItem
          icon={<FaFileCsv />}
          onClick={() => exportTableData('csv', '-1')}
          fontSize="sm"
          fontWeight="semibold"
        >
          CSV
        </MenuItem>
        <MenuItem
          icon={<FaFilePdf />}
          onClick={() => exportTableData('pdf', '-1')}
          fontSize="sm"
          fontWeight="semibold"
        >
          PDF
        </MenuItem>
        {showPerPage === true && (
          <React.Fragment>
        <Box px={3} py={0} fontSize="sm" fontWeight="semibold">
          Current Page
        </Box>
        <MenuDivider />
        <MenuItem
          icon={<FaFileCsv />}
          onClick={() => exportTableData('csv', 10)}
          fontSize="sm"
          fontWeight="semibold"
        >
          CSV
        </MenuItem>
        <MenuItem
          icon={<FaFilePdf />}
          onClick={() => exportTableData('pdf', 10)}
          fontSize="sm"
          fontWeight="semibold"
        >
          PDF
        </MenuItem>
        </React.Fragment>
        )}
      </MenuList>
    </Menu>
  );
};

export default TableExport;
