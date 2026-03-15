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
import { useParams } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';

import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { CustomerDetails } from '@/pages/Master/Customer/Info/CustomerDetails';
import { useCustomerDetails } from '@/services/master/customer/service';

export const CustomerInfo = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
    const { data: details } = useCustomerDetails(id);

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
            onClick={() => navigate(`/contact-management/customer-master/form/${id}`)}
            isDisabled={!!details?.data?.has_pending_request}
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
        customerId={id ?? ''}
      />
    </Box>
  );
};

export default CustomerInfo;
