import { ChevronRightIcon, EditIcon } from '@chakra-ui/icons';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  HStack,
  Heading,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react';
import { HiArrowNarrowLeft } from 'react-icons/hi';
import { Link, useNavigate, useParams } from 'react-router-dom';

import FieldDisplay from '@/components/FieldDisplay';
import LoadingOverlay from '@/components/LoadingOverlay';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { useWarehouseDetails } from '@/services/submaster/warehouse/services';

const WarehouseDetails = () => {
  let { id } = useParams();
  const navigate = useNavigate();

  const { data: details, isLoading } = useWarehouseDetails(Number(id));
  return (
    <SlideIn>
      <Stack pl={2} spacing={2}>
        <HStack justify={'space-between'}>
          <Stack spacing={0}>
            <Breadcrumb
              fontWeight="medium"
              fontSize="sm"
              separator={<ChevronRightIcon boxSize={6} color="gray.500" />}
            >
              <BreadcrumbItem color={'brand.500'}>
                <BreadcrumbLink as={Link} to="/submaster/warehouse">
                  Warehouse Master
                </BreadcrumbLink>
              </BreadcrumbItem>

              <BreadcrumbItem isCurrentPage color={'gray.500'}>
                <BreadcrumbLink>Warehouse Details</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            <Heading as="h4" size={'md'}>
              Warehouse Details
            </Heading>
          </Stack>
          <HStack spacing={2}>
            <IconButton
              aria-label="Edit"
              icon={<EditIcon />}
              size="sm"
              variant="outline"
              colorScheme="gray"
              onClick={() => navigate(`submaster/warehouse/${id}/edit`)}
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

        <Box borderRadius={4}>
          <LoadingOverlay isLoading={isLoading}>
            <Stack
              spacing={2}
              p={4}
              bg={'white'}
              borderRadius={'md'}
              boxShadow={'lg'}
            >
              <Stack spacing={4}>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldDisplay
                    label="Name"
                    value={details?.item.name || 'N/A'}
                  />
                  <FieldDisplay
                    label="Consignee Name"
                    value={details?.item.consignee_name || 'N/A'}
                  />
                </Stack>
                <Box w={'100%'}>
                  <Box w={'100%'}>
                    <Text fontSize={'md'} fontWeight={'bold'}>
                      Address
                    </Text>
                    <Box
                      p={3}
                      bg="gray.50"
                      borderRadius="md"
                      border="1px solid gray.200"
                    >
                      <Text fontSize={'md'}>
                        {details?.item.address || 'N/A'}
                      </Text>
                    </Box>
                  </Box>
                </Box>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldDisplay
                    label="City"
                    value={details?.item.city || 'N/A'}
                  />
                  <FieldDisplay
                    label="State"
                    value={details?.item.state || 'N/A'}
                  />
                  <FieldDisplay
                    label="Country"
                    value={details?.item.country || 'N/A'}
                  />
                  <FieldDisplay
                    label="Zip Code"
                    value={details?.item.zip_code || 'N/A'}
                  />
                </Stack>
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }}>
                  <FieldDisplay
                    label="Phone"
                    value={details?.item.phone || 'N/A'}
                  />
                  <FieldDisplay
                    label="Email"
                    value={details?.item.email || 'N/A'}
                  />
                  <FieldDisplay
                    label="Fax"
                    value={details?.item.fax || 'N/A'}
                  />
                </Stack>
                <Box w={'100%'}>
                  <Box w={'100%'}>
                    <Text fontSize={'md'} fontWeight={'bold'}>
                      Remark
                    </Text>
                    <Box
                      p={3}
                      bg="gray.50"
                      borderRadius="md"
                      border="1px solid gray.200"
                    >
                      <Text fontSize={'md'}>
                        {details?.item.remarks || 'N/A'}
                      </Text>
                    </Box>
                  </Box>
                </Box>
              </Stack>
            </Stack>
          </LoadingOverlay>
        </Box>
      </Stack>
    </SlideIn>
  );
};

export default WarehouseDetails;
