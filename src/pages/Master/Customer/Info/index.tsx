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
import { useParams, useSearchParams } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { CustomerDetails } from '@/pages/Master/Customer/Info/CustomerDetails';
import { useCustomerDetails } from '@/services/master/customer/service';
import { endPoints } from '@/api/endpoints';
import { usePdfPreview } from '@/hooks/usePdfPreview';
import { PDFPreviewModal } from '@/components/PDFPreview';
import { useRouterContext } from '@/services/auth/RouteContext';

export const CustomerInfo = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const { otherPermissions } = useRouterContext();

  const canUpdate = otherPermissions.update === 1;

  const { data: details } = useCustomerDetails(id);
  const { pdfUrl, pdfTitle, isOpen, openPreview, closePreview } = usePdfPreview();

  const handleOpenPreview = () => {
    if (!details?.data?.id) return;
    const url = endPoints.preview.customer.replace(':id', details.data.id);
    openPreview(url, `Contact Preview -${details.data.business_name}`);
  };

  useEffect(() => {
    if (searchParams.get('preview') === 'true' && id) {
      const url = endPoints.preview.customer.replace(':id', id);
      openPreview(url, `Contact Preview`);
      const stripped = new URLSearchParams(searchParams);
      stripped.delete('preview');
      navigate({ search: stripped.toString() }, { replace: true });
    }
  }, []);

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
              <BreadcrumbLink as={Link} to="/contact-management/customer-master">
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
            isDisabled={!details?.data?.id}
          >
            Preview
          </ResponsiveIconButton>
          {canUpdate && (
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
          )}
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