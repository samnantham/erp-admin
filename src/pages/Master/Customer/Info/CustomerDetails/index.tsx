import { useMemo, useState } from 'react';

import {
  Box,
  HStack,
  Heading,
  Icon,
  Stack,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableContainer,
  Tabs,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  ButtonGroup,
  Button
} from '@chakra-ui/react';
import dayjs from 'dayjs';
import { AiOutlineStock } from 'react-icons/ai';
import { BiSupport } from 'react-icons/bi';
import { FaUsersRays } from 'react-icons/fa6';
import {
  HiOutlineInformationCircle,
  HiOutlineLibrary,
  HiOutlineLocationMarker,
} from 'react-icons/hi';

import DocumentDownloadButton from '@/components/DocumentDownloadButton';
import FieldDisplay from '@/components/FieldDisplay';
import LoadingOverlay from '@/components/LoadingOverlay';
import { SlideIn } from '@/components/SlideIn';
import { useCustomerDetails } from '@/services/master/customer/service';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Bank } from '@/pages/Master/Customer/Info/Bank';
import { ContactManager } from '@/pages/Master/Customer/Info/ContactManager';
import { PrincipleOfOwner } from '@/pages/Master/Customer/Info/PrincipleOfOwner';
import { ShippingAddress } from '@/pages/Master/Customer/Info/ShippingAddress';
import { TraderReference } from '@/pages/Master/Customer/Info/TraderReference';

type CustomerDetailsProps = {
  customerId: string;
  disableActionBtns?: boolean;
};

export const CustomerDetails = ({
  customerId,
  disableActionBtns = false,
}: CustomerDetailsProps) => {
  const {
    data: details,
    isLoading,
    refetch: refreshDetails,
  } = useCustomerDetails(customerId);

  const d = details?.data;
  const qualityCertificates = d?.quality_certificates ?? [];
  const DetailsPanel = (
    <Box
      bg="white"
      borderRadius="md"
      borderTopRightRadius={0}
      borderTopLeftRadius={0}
      boxShadow="md"
      borderWidth={1}
      borderColor="gray.200"
      p={4}
      minHeight="73vh"
    >
      {/* Top fields */}
      <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={2}>
        <FieldDisplay
          size="sm"
          label="Business Name"
          value={d?.business_name || 'N/A'}
        />
        <FieldDisplay
          size="sm"
          label="Business Type"
          value={d?.business_type?.name || 'N/A'}
        />
        <FieldDisplay
          size="sm"
          label="Years of Business"
          value={d?.year_of_business || 'N/A'}
        />
        <FieldDisplay
          size="sm"
          label="Contact Type"
          value={d?.contact_type?.name || 'N/A'}
        />
      </Stack>

      <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={2}>
        <FieldDisplay
          size="sm"
          label="Foreign Entity"
          value={d?.is_foreign_entity ? 'Yes' : 'No'}
        />
        <FieldDisplay
          size="sm"
          label="Currency"
          value={d?.currency?.name || 'N/A'}
        />
        <FieldDisplay
          size="sm"
          label="Nature of Business"
          value={d?.nature_of_business || 'N/A'}
        />
        <FieldDisplay size="sm" label="Email" value={d?.email || 'N/A'} />
      </Stack>

      <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={2}>
        <FieldDisplay
          size="sm"
          label="License Trade No."
          value={d?.license_trade_no || 'N/A'}
        />
        <FieldDisplay
          size="sm"
          label="License Trade Expiry Date"
          value={d?.license_trade_exp_date || 'N/A'}
        />
        <FieldDisplay
          size="sm"
          label="VAT Tax ID"
          value={d?.vat_tax_id || 'N/A'}
        />
        <FieldDisplay
          size="sm"
          label="Remarks"
          value={d?.remarks || 'N/A'}
          isHtml
        />
      </Stack>

      <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={2}>
        <FieldDisplay
          size="sm"
          label="Mode of Payment"
          value={d?.payment_mode?.name || 'N/A'}
        />
        <FieldDisplay
          size="sm"
          label="Payment Terms"
          value={d?.payment_term?.name || 'N/A'}
        />
        <FieldDisplay
          size="sm"
          label="Total Credit Amount"
          value={d?.total_credit_amount ?? '0'}
        />
        <FieldDisplay
          size="sm"
          label="Total Credit Period (Days)"
          value={d?.total_credit_period ?? '0'}
        />
      </Stack>

      <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={2}>
        <Box w="100%">
          <Text fontSize="sm" fontWeight="600" mb={2}>
            VAT Tax URL
          </Text>
          <DocumentDownloadButton size="sm" url={d?.vat_tax_url || ''} />
        </Box>
        <Box w="100%">
          <Text fontSize="sm" fontWeight="600" mb={2}>
            License Trade URL
          </Text>
          <DocumentDownloadButton
            style={{ justifyContent: 'flex-start' }}
            size="sm"
            url={d?.license_trade_url || ''}
          />
        </Box>
        <Box w="100%" />
        <Box w="100%" />
      </Stack>

      {/* Quality Certificates */}
      <Box p={0} m={0}>
        <HStack justify="space-between" mb={2}>
          <Text fontSize="sm" fontWeight="600">
            Quality Certificates
          </Text>
        </HStack>
        <TableContainer
          overflow="auto"
          border="1px"
          borderColor="#0C2556"
          boxShadow="md"
        >
          <Table variant="striped" size="sm">
            <Thead bg="#0C2556">
              <Tr>
                <Th color="white">S.NO</Th>
                <Th color="white">Certificate Type</Th>
                <Th color="white">Document No</Th>
                <Th color="white">Issue Date</Th>
                <Th color="white">Validity Date</Th>
                <Th color="white">Document URL</Th>
              </Tr>
            </Thead>
            <Tbody>
              {qualityCertificates.map((item: any, index: number) => (
                <Tr key={index}>
                  <Td>{index + 1}</Td>
                  <Td>{item?.certificate_type ?? '-'}</Td>
                  <Td>{item?.doc_no ?? '-'}</Td>
                  <Td>
                    {item?.issue_date
                      ? dayjs(item?.issue_date).format('DD-MMM-YYYY')
                      : ' - '}
                  </Td>
                  <Td>
                    {item?.validity_date
                      ? dayjs(item?.validity_date).format('DD-MMM-YYYY')
                      : ' - '}
                  </Td>
                  <Td>
                    <DocumentDownloadButton
                      size="sm"
                      url={item?.doc_url || ''}
                    />
                  </Td>
                </Tr>
              ))}

              {qualityCertificates.length === 0 && (
                <Tr>
                  <Td colSpan={6} textAlign="center">
                    No Records Found.
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
  const TAB_CONFIG = useMemo(
    () => [
      {
        id: 'details',
        label: 'Contact Details',
        icon: HiOutlineInformationCircle,
        panel: (
          <>
            {DetailsPanel}
          </>
        ),
      },
      {
        id: 'contact',
        label: 'Contact Manager',
        icon: BiSupport,
        panel: (
          <ContactManager
            customerId={customerId}
            contactManagerData={d?.contact_managers ?? []}
            refreshCustomerDetails={refreshDetails}
            actionStatus={disableActionBtns}
            customerInfo={d}
          />
        ),
      },
      {
        id: 'shipping',
        label: 'Shipping Address',
        icon: HiOutlineLocationMarker,
        panel: (
          <ShippingAddress
            customerId={customerId}
            shippingData={d?.shipping_addresses ?? []}
            refreshCustomerDetails={refreshDetails}
            customerInfo={d}
            actionStatus={disableActionBtns}
          />
        ),
      },
      {
        id: 'banking',
        label: 'Banking',
        icon: HiOutlineLibrary,
        panel: (
          <Bank
            customerId={customerId}
            bankData={d?.banks ?? []}
            refreshCustomerDetails={refreshDetails}
            customerInfo={d}
            actionStatus={disableActionBtns}
          />
        ),
      },
      {
        id: 'principle',
        label: 'Principle of Owner',
        icon: FaUsersRays,
        panel: (
          <PrincipleOfOwner
            customerId={customerId}
            principleData={d?.principle_owners ?? []}
            refreshCustomerDetails={refreshDetails}
            customerInfo={d}
            actionStatus={disableActionBtns}
          />
        ),
      },
      {
        id: 'trader',
        label: 'Trader Reference',
        icon: AiOutlineStock,
        panel: (
          <TraderReference
            customerId={customerId}
            traderReferenceData={d?.trader_references ?? []}
            refreshCustomerDetails={refreshDetails}
            customerInfo={d}
            actionStatus={disableActionBtns}
          />
        ),
      },
    ],
    [customerId, d, disableActionBtns]
  );

  const [tabIndex, setTabIndex] = useState(0);

  const totalTabs = TAB_CONFIG.length;

  const goNext = () => {
    setTabIndex((prev) => Math.min(prev + 1, totalTabs - 1));
  };

  const goPrev = () => {
    setTabIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <SlideIn>
      <Stack spacing={2}>
        <LoadingOverlay isLoading={isLoading}>
          {d && (
            <Heading as="h3" size="lg">
              {`${d?.business_name} - ${d?.code}`}
            </Heading>
          )}

          <Tabs position="relative" variant="unstyled" index={tabIndex} mt={3} onChange={(index) => setTabIndex(index)}>
            <TabList display="flex" width="100%">
              {TAB_CONFIG.map(({ id, icon, label }) => (
                <Tab
                  key={id}
                  flex="1"
                  _selected={{ bg: '#0C2556', color: 'white' }}
                  bg="gray.200"
                  color="black"
                  _hover={{ bg: 'gray.300' }}
                  p={4}
                >
                  <Box
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                  >
                    <Icon as={icon} fontSize="xl" />
                    <Text fontSize="sm" fontWeight="bold" textAlign="center">
                      {label}
                    </Text>
                  </Box>
                </Tab>
              ))}
            </TabList>

            <TabPanels>
              {TAB_CONFIG.map(({ id, panel }) => (
                <TabPanel key={id} p={0}>
                  {panel}
                </TabPanel>
              ))}
              <HStack justify="space-between" mt={4}>
                <ButtonGroup isAttached variant="outline">
                  <Button onClick={goPrev} isDisabled={tabIndex === 0} leftIcon={<Icon as={FiChevronLeft} />}>
                    Previous
                  </Button>
                  <Button onClick={goNext} isDisabled={tabIndex === totalTabs - 1} rightIcon={<Icon as={FiChevronRight} />}>
                    Next
                  </Button>
                </ButtonGroup>
              </HStack>
            </TabPanels>

          </Tabs>


        </LoadingOverlay>
      </Stack>
    </SlideIn>
  );
};

export default CustomerDetails;
