import React, { useEffect, useState } from 'react';
import {
  Box, Button, Center, HStack, Heading, Spinner,
  Table, Tbody, Td, Text, Th, Thead, Tr, VStack,
} from '@chakra-ui/react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { FaRegFilePdf } from 'react-icons/fa';
import { HiPrinter } from 'react-icons/hi';
import { useNavigate, useParams } from 'react-router-dom';
import PDFHeader from '@/components/PreviewContents/Blocks/PDFHeader';
import PDFPreviewFooter from '@/components/PreviewContents/Blocks/PDFPreviewFooter';
import { downloadPDF, formatFullAddress, triggerPrint } from '@/helpers/commonHelper';
import { usePRFQDetails, usePRFQVendors } from "@/services/purchase/rfq/service";

// ── Constants ─────────────────────────────────────────────────────────────────
const A4_WIDTH = '210mm';
const A4_HEIGHT = '297mm';

// ── Field Row ─────────────────────────────────────────────────────────────────
const FieldRow = ({ label, value }: { label: string; value?: string | null }) => (
  <Box display="flex" alignItems="baseline" mb="2px">
    <Text fontSize="10px" fontWeight="bold" minWidth="80px">{label}</Text>
    <Text fontSize="10px" fontWeight="bold" mr={1}>:</Text>
    <Text fontSize="10px" ml={2}>{value ?? '—'}</Text>
  </Box>
);

// ── A4 Page Wrapper ───────────────────────────────────────────────────────────
const A4Page = ({ children }: { children: React.ReactNode }) => (
  <Box
    width={A4_WIDTH}
    minHeight={A4_HEIGHT}
    bg="white"
    boxShadow="0 0 10px rgba(0,0,0,0.2)"
    mb={8}
    mx="auto"
    display="flex"
    flexDirection="column"
    style={{ pageBreakAfter: 'always' }}
    sx={{
      '@media print': {
        boxShadow: 'none',
        mb: 0,
      }
    }}
  >
    {children}
  </Box>
);

// ── Component ─────────────────────────────────────────────────────────────────
export const PRFQPreview: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();


const [searchParams] = useSearchParams();
const token = searchParams.get('token');

  const [printLoading, setPrintLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [prfqDetails, setPRFQDetails] = useState<any>(null);
  const [pages, setPages] = useState<any[]>([]);

  const [vendorInfo, setSelectedVendor] = useState<any>(null);

  const { data: prfqInfo, isLoading: loading } = usePRFQDetails(id, { enabled: !!token });
  const { data: prfqVendors, isLoading: vlendorLoading } = usePRFQVendors(id ,{ enabled: !!token });


useEffect(() => {
  if (loading) return;
  if (!token) {
    navigate('/');
    return;
  }

  if (!prfqInfo?.data) {
    navigate('/');
    return;
  }

  setPRFQDetails(prfqInfo.data);
  setPages(splitIntoPages(prfqInfo.data.items ?? []));

}, [prfqInfo, loading, token]);


useEffect(() => {
  if (!prfqVendors) return;
  const selectedVendor = prfqVendors?.data.find(
    (item: any) => item.token === token
  );
  setSelectedVendor(selectedVendor);
}, [prfqVendors]);


  // ── Pagination ──────────────────────────────────────────────────────────────
  const splitIntoPages = (items: any[]) => {
    if (items.length <= 8) return [items];
    const result = [items.slice(0, 8)];
    let i = 8;
    while (i < items.length) {
      result.push(items.slice(i, i + 12));
      i += 12;
    }
    return result;
  };

  // ── Actions ─────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    setPrintLoading(true);
    const el = document.getElementById('table-to-export')!;
    setTimeout(() => {
      triggerPrint(el);
      setTimeout(() => setPrintLoading(false), 2000);
    }, 500);
  };

  const handleDownload = () => {
    setDownloading(true);
    downloadPDF(document.getElementById('table-to-export')!, 'prfq');
    setTimeout(() => setDownloading(false), 1000);
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading || vlendorLoading) {
    return (
      <Center h="100vh">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text fontSize="lg" fontWeight="bold" color="gray.600">Please wait...</Text>
        </VStack>
      </Center>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <Box bg="gray.100" minH="100vh" py={8}>
      <Box
        width={A4_WIDTH}
        mx="auto"
        mb={4}
        sx={{ '@media print': { display: 'none' } }}
      >
        <HStack justifyContent="space-between">
          <Heading as="h4" size="md">Purchase RFQ - {prfqDetails?.code}</Heading>
          <HStack spacing={3}>
            <Button
              colorScheme="blue" variant="outline"
              leftIcon={<HiPrinter />}
              isDisabled={printLoading}
              onClick={handlePrint}
              size="sm"
            >
              Print
            </Button>
            <Button
              colorScheme="blue" variant="outline"
              rightIcon={<FaRegFilePdf />}
              isLoading={downloading}
              onClick={handleDownload}
              size="sm"
            >
              Download PDF
            </Button>
          </HStack>
        </HStack>
      </Box>

      <Box id="table-to-export">
        {pages.map((pageData, pageIndex) => {
          const globalOffset = pages.slice(0, pageIndex).reduce((s, p) => s + p.length, 0);
          const isFirstPage = pageIndex === 0;

          return (
            <A4Page key={pageIndex}>
              <Box px="14mm" pt="10mm" pb="4mm">
                <PDFHeader style={{ fontSize: '10px' }} />
              </Box>

              <Box flex={1} px="14mm" py="6mm">

                {isFirstPage && (
                  <Box>
                    <Text
                      fontSize="16px" fontWeight="bold"
                      textAlign="center" mb={2}
                    >
                      Purchase RFQ
                    </Text>
                    <Box borderBottom="1px solid black" mb={3} />

                    <Box
                      display="flex" justifyContent="space-between"
                      borderBottom="1px solid #ccc" pb={3} mb={3}
                    >
                      <Box flex={1}>
                        <Text fontSize="11px" fontWeight="bold" mb={2}>Vendor Info</Text>
                        <FieldRow label="Name" value={vendorInfo?.business_name} />
                        <FieldRow label="Code" value={vendorInfo?.code} />
                        <FieldRow label="Contact" value={vendorInfo?.attention} />
                        <FieldRow label="Phone" value={vendorInfo?.phone} />
                        <FieldRow label="Email" value={vendorInfo?.email} />
                      </Box>
                      <Box>
                        <Text fontSize="11px" fontWeight="bold" mb={2}>Address</Text>
                        <Text
                          fontSize="10px"
                          dangerouslySetInnerHTML={{
                            __html: vendorInfo?.contact ? formatFullAddress(vendorInfo?.contact) : '—'
                          }}
                        />
                      </Box>
                    </Box>

                    <Box
                      display="flex" justifyContent="space-between"
                      borderBottom="1px solid #ccc" pb={3} mb={4}
                    >
                      <Box flex={1}>
                        <FieldRow label="PRFQ REF" value={prfqDetails?.code} />
                      </Box>
                      <Box flex={1}>
                        <FieldRow label="Priority" value={prfqDetails?.priority?.name} />
                      </Box>
                      <Box>
                        <FieldRow
                          label="Need By Date"
                          value={prfqDetails?.need_by_date
                            ? format(new Date(prfqDetails.need_by_date), 'dd-MM-yyyy')
                            : undefined}
                        />
                      </Box>
                    </Box>
                  </Box>
                )}

                <Table variant="simple" size="sm">
                  <Thead bg="#d9d9d9">
                    <Tr>
                      {['#', 'MR.No', 'Part No. & Desc', 'Cond', 'Qty', 'UOM', 'MR Remarks', 'Remarks'].map(h => (
                        <Th key={h} sx={{ fontSize: '10px', py: '4px' }}>{h}</Th>
                      ))}
                    </Tr>
                  </Thead>
                  <Tbody>
                    {pageData.map((item: any, i: number) => (
                      <Tr key={i}>
                        <Td sx={{ fontSize: '10px', py: '3px' }} width="24px">
                          {globalOffset + i + 1}
                        </Td>
                        <Td sx={{ fontSize: '10px', py: '3px' }}>
                          {item?.material_request_info?.code}
                        </Td>
                        <Td sx={{ fontSize: '10px', py: '3px', textTransform: 'capitalize' }}>
                          {item?.part_number?.name}<br />
                          {item?.part_number?.description?.toLowerCase()}
                          {item?.part_number?.spare?.hsc_code && (
                            <Text whiteSpace="pre-line" fontSize="10px">
                              <Text as="span" fontWeight="bold">HSC Code: </Text>
                              {item.part_number.spare.hsc_code.name}
                            </Text>
                          )}
                          {item?.note && <Text whiteSpace="pre-line" fontSize="10px">{item.note}</Text>}
                        </Td>
                        <Td sx={{ fontSize: '10px', py: '3px' }}>{item?.condition?.name}</Td>
                        <Td sx={{ fontSize: '10px', py: '3px' }} width="24px">{item?.qty}</Td>
                        <Td sx={{ fontSize: '10px', py: '3px' }}>{item?.unit_of_measure?.name}</Td>
                        <Td sx={{ fontSize: '10px', py: '3px' }}> {item?.material_request_item_info?.remark ?? '—'} </Td>
                        <Td sx={{ fontSize: '10px', py: '3px' }}>{item?.remark ?? '—'}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>

                {prfqDetails?.remarks && pageIndex === pages.length - 1 && (
                  <Box mt={4} fontSize="10px">
                    <Text fontWeight="bold">Remarks:</Text>
                    <Text dangerouslySetInnerHTML={{ __html: prfqDetails.remarks }} />
                  </Box>
                )}
              </Box>

              <Box px="14mm" pb="8mm" pt="4mm">
                <PDFPreviewFooter
                  style={{ fontSize: '10px' }}
                  createdAt={prfqDetails?.created_at ?? ''}
                  createdBy={prfqDetails?.user?.username ?? ''}
                  totalPages={pages.length}
                  currentPage={pageIndex + 1}
                />
              </Box>

            </A4Page>
          );
        })}
      </Box>
    </Box>
  );
};

export default PRFQPreview;