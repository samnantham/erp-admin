import { ChevronRightIcon, EditIcon } from '@chakra-ui/icons';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  HStack,
  IconButton,
  Stack,
} from '@chakra-ui/react';
import { HiArrowNarrowLeft } from 'react-icons/hi';
import { useLocation } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';

import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { CustomerDetails } from '@/pages/Master/Customer/Info/CustomerDetails';

export const CustomerInfo = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = location.state || {};

  return (
    <Box>
      <HStack justify={'space-between'}>
        <Stack spacing={0}>
          <Breadcrumb
            fontWeight="medium"
            fontSize="sm"
            separator={<ChevronRightIcon boxSize={6} color="#0C2556" />}
          >
            <BreadcrumbItem color={'brand.500'}>
              <BreadcrumbLink as={Link} to="/customer-master">
                Contact Management
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbItem isCurrentPage color={'#0C2556'}>
              <BreadcrumbLink>Customer Details</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
        </Stack>
        <HStack spacing={2}>
          <IconButton
            aria-label="Edit"
            icon={<EditIcon />}
            size="sm"
            variant="outline"
            colorScheme="gray"
            onClick={() => navigate(`/customer-master/${id}/edit`)}
          />
          <ResponsiveIconButton
            variant={'@primary'}
            icon={<HiArrowNarrowLeft />}
            size={'sm'}
            fontWeight={'thin'}
            onClick={() => navigate(-1)}
          >
            Back
          </ResponsiveIconButton>
        </HStack>
      </HStack>
      <CustomerDetails
        customerId={id ?? 0}
      />
    </Box>
  );
};

export default CustomerInfo;
