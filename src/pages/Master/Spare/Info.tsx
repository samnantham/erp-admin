import { ChevronRightIcon, EditIcon } from '@chakra-ui/icons';
import {
    Box,
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    HStack,
    Stack,
    Text
} from '@chakra-ui/react';
import { BiSolidFilePdf } from "react-icons/bi";
import { HiArrowNarrowLeft } from 'react-icons/hi';
import { useParams, useSearchParams } from 'react-router-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { usePartNumberDetails } from '@/services/master/spare/service';
import { endPoints } from '@/api/endpoints';
import { usePdfPreview } from '@/hooks/usePdfPreview';
import { PDFPreviewModal } from '@/components/PDFPreview';
import FieldDisplay from '@/components/FieldDisplay';
import DocumentDownloadButton from '@/components/DocumentDownloadButton';

export const SpareInfo = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();

    const { data: details } = usePartNumberDetails(id);
    const d = details?.data;
    const { pdfUrl, pdfTitle, isOpen, openPreview, closePreview } = usePdfPreview();

    // Manual preview button — waits for details to have business_name for the title
    const handleOpenPreview = () => {
        if (!d) return;
        const url = endPoints.preview.spare.replace(':id', d?.id);
        openPreview(url, `Part Number Preview - ${d?.name}`);
    };

    // ── Auto-open preview when ?preview=true is in the URL ────────────────────
    // id from useParams is immediately available — no need to wait for details.
    // Strips the param right away via replace so refresh never re-triggers.
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
                            <BreadcrumbLink as={Link} to="/spare-management/master">
                                Spare Management
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbItem isCurrentPage color={'#0C2556'}>
                            <BreadcrumbLink>Part Number Details</BreadcrumbLink>
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
                    <ResponsiveIconButton
                        colorScheme={'green'}
                        icon={<EditIcon />}
                        size={'sm'}
                        fontWeight={'thin'}
                        onClick={() => navigate(`/spare-management/form/${id}`)}
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
                mt={3}
            >
                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={2}>
                    <FieldDisplay size="sm" label="Name" value={d?.name || 'N/A'} />
                    <FieldDisplay size="sm" label="Description" value={d?.description || 'N/A'} />
                    <FieldDisplay size="sm" label="Manufacturer Name" value={d?.manufacturer_name || 'N/A'} />
                    <FieldDisplay size="sm" label="CAGE Code" value={d?.cage_code || 'N/A'} />
                </Stack>

                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={2}>
                    <FieldDisplay size="sm" label="ATA" value={d?.ata || 'N/A'} />
                    <FieldDisplay size="sm" label="Unit of Measure" value={d?.unit_of_measure?.name || 'N/A'} />
                    <FieldDisplay size="sm" label="Spare Type" value={d?.spare_type?.name || 'N/A'} />
                    <FieldDisplay size="sm" label="Spare Model" value={d?.spare_model?.name || 'N/A'} />
                    <FieldDisplay size="sm" label="HSC Code" value={d?.hsc_code?.name || 'N/A'} />
                </Stack>

                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={2}>
                    <FieldDisplay size="sm" label="Shelf Life" value={d?.is_shelf_life ? 'Yes' : 'No'} />
                    <FieldDisplay size="sm" label="Total Shelf Life (Days)" value={d?.total_shelf_life ?? '0'} />
                    <FieldDisplay size="sm" label="Serialized" value={d?.is_serialized ? 'Yes' : 'No'} />
                    <FieldDisplay size="sm" label="Life Limited Part (LLP)" value={d?.is_llp ? 'Yes' : 'No'} />
                    <FieldDisplay size="sm" label="Dangerous Goods (DG)" value={d?.is_dg ? 'Yes' : 'No'} />
                </Stack>

                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={4}>
                    <Box w="100%">
                        <Text fontSize="sm" fontWeight="600" mb={2}>MSDS Document</Text>
                        <DocumentDownloadButton size="sm" url={d?.msds || ''} />
                    </Box>
                    <Box w="100%">
                        <Text fontSize="sm" fontWeight="600" mb={2}>Picture</Text>
                        <DocumentDownloadButton size="sm" url={d?.picture || ''} />
                    </Box>
                    <Box w="100%">
                        <Text fontSize="sm" fontWeight="600" mb={2}>IPC Reference</Text>
                        <DocumentDownloadButton size="sm" url={d?.ipc_ref || ''} />
                    </Box>
                    <Box w="100%">
                        <Text fontSize="sm" fontWeight="600" mb={2}>X - Reference</Text>
                        <DocumentDownloadButton size="sm" url={d?.xref || ''} />
                    </Box>
                </Stack>
                {d?.remarks && (
                    <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={4}>
                        <FieldDisplay size="sm" label="Remarks" value={d?.remarks || 'N/A'} isHtml />
                    </Stack>
                )}
            </Box>
            {/* ── PDF Preview Modal ── */}
            <PDFPreviewModal
                isOpen={isOpen}
                onClose={closePreview}
                pdfUrlOrEndpoint={pdfUrl}
                title={pdfTitle}
                isEndpoint={true}
            />


        </Box>
    );
};

export default SpareInfo;