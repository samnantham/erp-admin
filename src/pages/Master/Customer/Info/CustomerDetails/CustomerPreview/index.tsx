import React from 'react';

import {
  Avatar,
  Badge,
  Box,
  Button,
  Circle,
  HStack,
  Heading,
  Icon,
  SimpleGrid,
  Stack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { FiFileText } from 'react-icons/fi';

import { CircularProgressBar } from '@/components/CircularProgressBar';
import DocumentDownloadButton from '@/components/DocumentDownloadButton';
import LoadingOverlay from '@/components/LoadingOverlay';
import {
  useCustomerDetails,
  // useCustomerStatusHistory,
} from '@/services/master/customer/service';

/* ----------------------------- Reusable Bits ----------------------------- */
type CustomerInfo = {
  business_name?: string;
  code?: string;
  customer_status?: { id?: number; name?: string };
  currency?: { name?: string; code?: string };
  completion_percentage?: number | string;
  contact_type?: { name?: string };
  nature_of_business?: string;
  business_type?: { name?: string };
  year_of_business?: string | number;
  user?: { username?: string };
  created_at?: string;
  transactionSummary?: {
    currentValue: string;
    outstanding: string;
    overdue: string;
  };
  totals?: { ordersCount: number; totalValue: string };
  orders?: Array<{
    date?: string;
    ref?: string;
    mode?: string;
    amount?: string | number;
  }>;
  refunds?: Array<{
    date?: string;
    ref?: string;
    amount?: string | number;
    reason?: string;
  }>;
  activity?: Array<{ text: string; dateTime: string; by: string }>;
  statusTimeline?: Array<{
    id?: string | number;
    label: string;
    dateTime: string;
  }>;
  documents?: Array<{ name: string; url?: string }>;
};

const Card = ({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const border = useColorModeValue('gray.200', 'whiteAlpha.300');
  const bg = useColorModeValue('gray.100', 'gray.800');
  return (
    <Box
      bg={bg}
      border="1px"
      borderColor={border}
      rounded="md"
      shadow="sm"
      p={4}
    >
      <HStack justify="space-between" mb={3}>
        <Heading size="sm">{title}</Heading>
        {action}
      </HStack>
      {children}
    </Box>
  );
};

const KV = ({ k, v }: { k: string; v?: React.ReactNode }) => (
  <HStack align="start" justify="space-between">
    <Text color="gray.600" fontSize="sm">
      {k}
    </Text>
    <Text
      fontWeight="semibold"
      fontSize="sm"
      textAlign="right"
      textTransform={'capitalize'}
    >
      {v ?? '—'}
    </Text>
  </HStack>
);

const DotItem = ({ text, right }: { text: string; right?: string }) => (
  <HStack justify="space-between">
    <HStack>
      <Circle size="8px" bg="gray.400" />
      <Text fontSize="sm">{text}</Text>
    </HStack>
    {right && (
      <Text fontSize="sm" color="gray.600">
        {right}
      </Text>
    )}
  </HStack>
);

/* ------------------------- Scrollable Status Timeline ------------------------- */

// Helper to ensure unique keys
const keyOf = (s: any, i: number) =>
  s?.id ?? `${s?.label ?? 'step'}-${s?.dateTime ?? ''}-${i}`;

const ITEM_W = 100;
const COL_GAP = 24;
const TRACK_Y = 52;

function StatusTimeline({
  items,
  subtle,
}: {
  items: Array<{ id?: string | number; label: string; dateTime: string }>;
  subtle: string;
}) {
  if (!items?.length) return null;

  const colorOf = (i: any) =>
    i.label === 'unapproved'
      ? 'gray'
      : i.label === 'active'
        ? 'green'
        : i.label === 'hold'
          ? 'orange'
          : i.label === 'created'
            ? 'yellow'
            : 'red';

  return (
    <Card title="Status Timeline">
      <Box
        position="relative"
        overflowX="auto"
        overflowY="hidden"
        sx={{ WebkitOverflowScrolling: 'touch' }}
        px={2}
        pb={2}
      >
        <Box
          display="grid"
          gridAutoFlow="column"
          gridAutoColumns={`${ITEM_W}px`}
          alignItems="start"
          gap={`${COL_GAP}px`} // use px so we can compute width
          position="relative"
          py={4}
          minW={`${Math.max(items.length * ITEM_W + (items.length - 1) * COL_GAP, ITEM_W)}px`}
        >
          {/* Track line: start at center of first, end at center of last */}
          <Box
            position="absolute"
            left={`${ITEM_W / 2}px`}
            top={`${TRACK_Y}px`}
            width={`${Math.max((items.length - 1) * (ITEM_W + COL_GAP), 0)}px`}
            height="2px"
            bg="gray.300"
          />

          {items.map((s, i) => (
            <Stack
              key={keyOf(s, i)}
              spacing={2}
              align="center"
              textAlign="center"
            >
              <Text
                fontSize="sm"
                color={subtle}
                textTransform="capitalize"
                noOfLines={2}
              >
                {s.label}
              </Text>
              <Circle
                size="16px"
                bg={colorOf(s)}
                border="2px solid"
                borderColor={'black'}
                shadow="md"
                zIndex={1}
              />
              <Text fontSize="xs" color={subtle} noOfLines={1}>
                {s.dateTime}
              </Text>
            </Stack>
          ))}
        </Box>
      </Box>
    </Card>
  );
}

/* ----------------------------- Main Component ---------------------------- */

type CustomerPreviewProps = {
  customerId: number | string;
};

export function CustomerPreview({ customerId }: CustomerPreviewProps) {
  const { data: details, isLoading } = useCustomerDetails(Number(customerId));
  // const { data: statusHistory } = useCustomerStatusHistory(Number(customerId));
  const raw: CustomerInfo = details as CustomerInfo ?? {};

  const customerInfo: Required<
    Pick<
      CustomerInfo,
      | 'transactionSummary'
      | 'totals'
      | 'orders'
      | 'refunds'
      | 'activity'
      // | 'statusTimeline'
      | 'documents'
    >
  > &
    CustomerInfo = {
    ...raw,
    transactionSummary: raw.transactionSummary ?? {
      currentValue: '0',
      outstanding: '0',
      overdue: '0 times',
    },
    totals: raw.totals ?? { ordersCount: 0, totalValue: '0' },
    orders: raw.orders ?? [],
    refunds: raw.refunds ?? [],
    activity: raw.activity ?? [
      { text: 'Updated Address', dateTime: '01 Jun 2024', by: 'EMP222' },
      { text: 'Created Contact', dateTime: '15 May 2024', by: 'EMP123' },
    ],
    // statusTimeline:
    //   raw.statusTimeline ??
    //   [
    //     {
    //       label: 'created',
    //       dateTime: details?.data?.created_at
    //         ? format(new Date(details?.data?.created_at), 'dd MMM yyyy')
    //         : '',
    //     },
    //   ].concat(
    //     (statusHistory?.data ?? []).map((qc: any, idx: number) => ({
    //       id: qc?.id ?? `status-${idx + 1}`,
    //       label: qc?.status_name,
    //       dateTime: qc?.created_at
    //         ? format(new Date(qc?.created_at), 'dd MMM yyyy')
    //         : '',
    //     }))
    //   ),
    documents: [
      { name: 'Trade License', url: details?.data?.license_trade_url ?? '' },
      { name: 'VAT Doc', url: details?.data?.vat_tax_url ?? '' },
    ].concat(
      (details?.data?.quality_certificates ?? []).map(
        (qc: any, idx: number) => ({
          name: `QC – Cert #${idx + 1}`,
          url: qc?.doc_url || '',
        })
      )
    ),
  };

  const subtle = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box p={4} background={'white'}>
      <LoadingOverlay isLoading={isLoading}>
        {/* Header */}
        <Box
          display="flex"
          alignItems={{ base: 'flex-start', md: 'center' }}
          justifyContent="space-between"
          flexDir={{ base: 'column', md: 'row' }}
          gap={4}
          mb={4}
        >
          <HStack align="center" spacing={4}>
            <Avatar name={customerInfo?.business_name} size="lg" />
            <VStack align="start" spacing={1}>
              <HStack align="center" spacing={3}>
                <Heading size="lg">{customerInfo?.business_name}</Heading>
                <Badge
                  rounded="md"
                  px={2}
                  py={1}
                  colorScheme={
                    customerInfo?.customer_status?.id === 1
                      ? 'gray'
                      : customerInfo?.customer_status?.id === 2
                        ? 'green'
                        : customerInfo?.customer_status?.id === 3
                          ? 'orange'
                          : 'red'
                  }
                >
                  {customerInfo?.customer_status?.name}
                </Badge>
              </HStack>
              <HStack spacing={3} color={subtle}>
                <Text fontWeight="semibold">({customerInfo?.code})</Text>
              </HStack>
              <HStack spacing={3}>
                <Text>
                  Country:{' '}
                  <Text as="span" fontWeight={'bold'}>
                    UAE
                  </Text>
                </Text>
              </HStack>
              <HStack spacing={3}>
                <Text>
                  Currency:{' '}
                  <Text as="span" fontWeight={'bold'}>
                    {customerInfo?.currency?.name} (
                    {customerInfo?.currency?.code})
                  </Text>
                </Text>
              </HStack>
            </VStack>
          </HStack>

          <HStack>
            <CircularProgressBar
              value={Number(customerInfo?.completion_percentage)}
              size="60px"
              thickness="6px"
              color={
                Number(customerInfo?.completion_percentage) > 75
                  ? 'green'
                  : Number(customerInfo?.completion_percentage) > 50
                    ? 'orange'
                    : 'red'
              }
            />
          </HStack>
        </Box>

        {/* Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, xl: 3 }} gap={4}>
          {/* General Information */}
          <Card
            title="General Information"
            action={
              <Button size="xs" colorScheme="cyan" variant="solid">
                View complete details
              </Button>
            }
          >
            <Stack spacing={2}>
              <KV k="Contact Type" v={customerInfo?.contact_type?.name} />
              <KV k="Nature of Business" v={customerInfo?.nature_of_business} />
              <KV k="Business Type" v={customerInfo?.business_type?.name} />
              <KV k="Years in Business" v={customerInfo?.year_of_business} />
              <KV k="Created By" v={customerInfo?.user?.username} />
              <KV k="Approved By" v={customerInfo?.user?.username} />
              <KV
                k="Date of Creation"
                v={
                  customerInfo?.created_at
                    ? format(new Date(customerInfo?.created_at), 'dd MMM yyyy')
                    : ' - '
                }
              />
            </Stack>
          </Card>

          {/* Transaction Summary */}
          <Card title="Transaction Summary">
            <Stack spacing={3}>
              <KV
                k="Current Value"
                v={`${customerInfo?.transactionSummary.currentValue} ${customerInfo?.currency?.code ?? ''}`}
              />
              <KV
                k="Outstanding Amount"
                v={`${customerInfo?.transactionSummary.outstanding} ${customerInfo?.currency?.code ?? ''}`}
              />
              <KV
                k="Overdue Instances"
                v={customerInfo?.transactionSummary.overdue}
              />
            </Stack>
          </Card>

          {/* Total Orders (summary) */}
          <Card
            title="Total Orders"
            action={
              <Button size="xs" colorScheme="cyan" variant="solid">
                View orders
              </Button>
            }
          >
            <HStack justify="space-between" mt={1}>
              <Text color={subtle}>Total Orders</Text>
              <Heading size="md">{customerInfo?.totals.ordersCount}</Heading>
            </HStack>
            <HStack justify="space-between">
              <Text color={subtle}>Total Order Value</Text>
              <Heading size="md">
                {`${customerInfo?.totals.totalValue} ${customerInfo?.currency?.code ?? ''}`}
              </Heading>
            </HStack>
          </Card>

          {/* Total Orders (table) */}
          <Card title="Total Orders">
            <TableContainer border="1px" borderTop={0}>
              <Table size="sm" variant="simple">
                <Thead backgroundColor={'#0C2556'}>
                  <Tr sx={{ '& th': { color: 'white' } }}>
                    <Th>Date</Th>
                    <Th>Ref No</Th>
                    <Th>Mode</Th>
                    <Th isNumeric>Amount</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {customerInfo?.orders.map((o: any, i: number) => (
                    <Tr key={o?.ref ?? `order-${i}`}>
                      <Td>{o?.date}</Td>
                      <Td>{o?.ref}</Td>
                      <Td>{o?.mode}</Td>
                      <Td isNumeric>{o?.amount}</Td>
                    </Tr>
                  ))}
                  {customerInfo?.orders.length === 0 && (
                    <Tr>
                      <Td textAlign={'center'} colSpan={4}>
                        No Records Found
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Card>

          {/* Refund / Credit History */}
          <Card title="Refund / Credit History">
            <TableContainer border="1px" borderTop={0}>
              <Table size="sm" variant="simple">
                <Thead backgroundColor={'#0C2556'}>
                  <Tr sx={{ '& th': { color: 'white' } }}>
                    <Th>Date</Th>
                    <Th>Ref No</Th>
                    <Th isNumeric>Amount</Th>
                    <Th>Approved</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {customerInfo?.refunds.map((r: any, i: number) => (
                    <Tr key={r?.ref ?? `refund-${i}`}>
                      <Td>{r?.date}</Td>
                      <Td>{r?.ref}</Td>
                      <Td isNumeric>{r?.amount}</Td>
                      <Td>{r?.reason}</Td>
                    </Tr>
                  ))}
                  {customerInfo?.refunds.length === 0 && (
                    <Tr>
                      <Td textAlign={'center'} colSpan={4}>
                        No Records Found
                      </Td>
                    </Tr>
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </Card>

          {/* Edit & Activity History */}
          <Card title="Edit & Activity History">
            <Stack spacing={3}>
              {customerInfo?.activity.map((a: any, idx: number) => (
                <DotItem
                  key={`${a?.text ?? 'activity'}-${a?.dateTime ?? ''}-${idx}`}
                  text={`${a.text} ${a.by}`}
                  right={a.dateTime}
                />
              ))}
            </Stack>
          </Card>

          {/* Uploaded Documents (full width on xl uses colSpan) */}
          <Box gridColumn={{ base: 'auto', xl: '1 / -1' }}>
            <Card title="Uploaded Documents">
              <Stack spacing={3}>
                {customerInfo?.documents.map((d: any, i: number) => (
                  <HStack
                    key={`${d?.name ?? 'doc'}-${d?.url ?? ''}-${i}`}
                    justify="space-between"
                  >
                    <HStack>
                      <Icon as={FiFileText} />
                      <Text>{d.name}</Text>
                    </HStack>
                    <DocumentDownloadButton size={'xs'} url={d.url || ''} />
                  </HStack>
                ))}
              </Stack>
            </Card>
          </Box>

          {/* Status Timeline (Scrollable Road-map) */}
          <Box gridColumn={{ base: 'auto', xl: '1 / -1' }}>
            <StatusTimeline
              items={customerInfo?.statusTimeline ?? []}
              subtle={subtle}
            />
          </Box>
        </SimpleGrid>
      </LoadingOverlay>
    </Box>
  );
}

export default CustomerPreview;
