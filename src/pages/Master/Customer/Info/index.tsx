import { ChevronRightIcon, EditIcon } from '@chakra-ui/icons';
import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  HStack,
  Stack,
} from '@chakra-ui/react';
import { BiSolidFilePdf } from "react-icons/bi";
import { HiArrowNarrowLeft } from 'react-icons/hi';
import { useParams } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';

import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { CustomerDetails } from '@/pages/Master/Customer/Info/CustomerDetails';
import { useCustomerDetails } from '@/services/master/customer/service';
import { endPoints } from '@/api/endpoints';
import { usePdfPreview } from '@/hooks/usePdfPreview';
import { PDFPreviewModal } from '@/components/PDFPreview';

export const CustomerInfo = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { data: details } = useCustomerDetails(id);

  const { pdfUrl, pdfTitle, isOpen, openPreview, closePreview } = usePdfPreview();

  const handleOpenPreview = () => {
    if (!details?.data?.id) return;
    const url = endPoints.preview.customer.replace(':id', details.data.id);
    openPreview(url, `Contact Preview - #${details.data.business_name}`);
  };

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
          <ResponsiveIconButton
            colorScheme={'teal'}
            icon={<BiSolidFilePdf />}
            size={'sm'}
            fontWeight={'thin'}
            onClick={handleOpenPreview}
            isDisabled={!details?.data?.id}  // ← disabled until data loads
          >
            Preview
          </ResponsiveIconButton>
          <ResponsiveIconButton
            colorScheme={'green'}
            icon={<EditIcon />}
            size={'sm'}
            fontWeight={'thin'}
            onClick={() => navigate(`/contact-management/customer-master/form/${id}`)}
            isDisabled={!!details?.data?.has_pending_request}
          >
            Edit
          </ResponsiveIconButton>
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

      {/* ── PDF Preview Modal ── */}
      <PDFPreviewModal
        isOpen={isOpen}
        onClose={closePreview}
        pdfUrlOrEndpoint={pdfUrl}
        title={pdfTitle}
        isEndpoint={true}
      />

      <CustomerDetails customerId={id ?? ''} />
    </Box>
  );
};

export default CustomerInfo;