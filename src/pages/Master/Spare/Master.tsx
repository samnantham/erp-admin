import { useMemo, useState } from 'react';
import { BiEdit, BiInfoCircle, BiTrash, BiSolidFilePdf } from 'react-icons/bi';
import {
    Box,
    Button,
    HStack,
    Heading,
    Stack,
    Icon,
    Flex
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiRefresh, HiOutlineSearch } from 'react-icons/hi';
import { LuPlus, LuDownload, LuUpload } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import LoadingOverlay from '@/components/LoadingOverlay';
import { DataTable } from '@/components/DataTable';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { ConfirmationWithReasonPopup } from '@/components/ConfirmationWithReasonPopup';
import { useDelete } from '@/api/useDelete';
import { endPoints } from '@/api/endpoints';
import { handleDownload } from '@/helpers/commonHelper';
import { usePartNumberIndex, usePartNumberDropdowns } from '@/services/master/spare/service';
import { TbReplaceFilled } from "react-icons/tb";
import { usePdfPreview } from '@/hooks/usePdfPreview';
import { PDFPreviewModal } from '@/components/PDFPreview';

type ConfirmMode = null | 'delete';

export const SpareMaster = () => {
    const navigate = useNavigate();

    const { data: dropdownData, isLoading: dropdownLoading, isSuccess: dropdownsFetched } = usePartNumberDropdowns();
    const spareTypeOptions = dropdownData?.spare_types ?? [];
    const spareModelOptions = dropdownData?.spare_models ?? [];
    const hscCodeOptions = dropdownData?.hsc_codes ?? [];
    const unitOfMeasureOptions = dropdownData?.unit_of_measures ?? [];

    const [activeItem, setActiveItem] = useState<any>(null);
    const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortBy, setSortBy] = useState<string>('created_at');
    const [formKey, setFormKey] = useState(0);

    const { pdfUrl, pdfTitle, isOpen, openPreview, closePreview } = usePdfPreview();

    const handleOpenPreview = (spareInfo: any) => {
        const url = endPoints.preview.spare.replace(':id', spareInfo.id);
        openPreview(url, `Spare Preview - #${spareInfo.name}`);
    };

    const initialQueryParams = {
        page: 1,
        limit: itemsPerPage,
        search: '',
        spare_type_id: '',
        spare_model_id: '',
        hsc_code_id: '',
        unit_of_measure_id: '',
        is_dg: '',
        is_llp: '',
        is_serialized: '',
        is_shelf_life: '',
    };

    const [queryParams, setQueryParams] = useState<any>(initialQueryParams);

    const form = useForm();

    const updateFilter = (key: string, value: any) => {
        setQueryParams((prev: any) => ({
            ...prev,
            [key]: value ?? '',
            page: 1,
            limit: itemsPerPage,
        }));
    };

    const { data: listData, isSuccess: listFetched, isLoading: listDataLoading, refetch: refreshIndex } =
        usePartNumberIndex(queryParams);

    const allApiDataLoaded = dropdownsFetched && listFetched;
    const data = listData?.data ?? [];
    const paginationData = listData?.pagination;

    const { mutate: triggerDelete, isLoading: isDeleting } = useDelete({
        url: endPoints.delete.spare,
        invalidate: ['partNumberIndex', 'partNumberDetails'],
    });

    const onConfirmDelete = (reason: string) => {
        if (!activeItem) return;
        triggerDelete(
            { id: activeItem.id, deleted_reason: reason },
            {
                onSuccess: () => refreshIndex(),
                onSettled: closeConfirm,
            }
        );
    };

    const ask = (mode: ConfirmMode, row: any) => {
        setActiveItem(row);
        setConfirmMode(mode);
    };

    const closeConfirm = () => {
        setConfirmMode(null);
        setActiveItem(null);
    };

    const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
        setSortDirection(direction);
        setSortBy(columnId);
        setQueryParams((prev: any) => ({
            ...prev,
            sort_field: columnId,
            sort_order: direction,
            page: 1,
        }));
    };

    const columns = useMemo(() => {
        if (!dropdownsFetched) return [];

        const baseColumnConfig: DynamicColumn<any>[] = [
            { key: 'name', header: 'Part Number', meta: { sortable: true, sortParam: 'name' } },
            { key: 'description', header: 'Description', meta: { sortable: true, sortParam: 'description' } },
            { key: 'manufacturer_name', header: 'Manufacturer', meta: { sortable: true, sortParam: 'manufacturer_name' } },
            { key: 'cage_code', header: 'Cage Code' },
            { key: 'ata', header: 'ATA' },
            { key: 'spare_type.name', header: 'Type', meta: { sortable: true, sortParam: 'spare_type_id' } },
            { key: 'spare_model.name', header: 'Model', meta: { sortable: true, sortParam: 'spare_model_id' } },
            { key: 'hsc_code.name', header: 'HSC Code', meta: { sortable: true, sortParam: 'hsc_code_id' } },
            { key: 'unit_of_measure.name', header: 'UOM', meta: { sortable: true, sortParam: 'unit_of_measure_id' } },
            {
                key: 'is_shelf_life',
                header: 'Shelf Life',
                render: (row: any) => (row.is_shelf_life ? 'Yes' : 'No'),
            },
            {
                key: 'is_llp',
                header: 'LLP',
                render: (row: any) => (row.is_llp ? 'Yes' : 'No'),
            },
            {
                key: 'is_serialized',
                header: 'Serialized',
                render: (row: any) => (row.is_serialized ? 'Yes' : 'No'),
            },
            {
                key: 'is_dg',
                header: 'DG',
                render: (row: any) => (row.is_dg ? 'Yes' : 'No'),
            },
            {
                key: 'actions',
                header: 'Actions',
                type: 'actions',
                actions: [
                    {
                        label: 'View',
                        icon: <BiInfoCircle />,
                        onClick: (row: any) => navigate(`/spare-management/info/${row.id}`),
                    },
                    {
                        label: 'Edit',
                        icon: <BiEdit />,
                        isDisabled: (row: any) => !!row.has_pending_request,
                        onClick: (row: any) => navigate(`/spare-management/form/${row.id}`),
                        disabledTooltip: (row: any) => row.pending_request_message,
                    },
                    {
                        label: 'Alternates',
                        icon: <TbReplaceFilled />,
                        isDisabled: (row: any) => !!row.has_pending_request,
                        onClick: (row: any) => navigate(`/spare-management/assign-alternates/${row.id}`),
                        disabledTooltip: (row: any) => row.pending_request_message,
                    },
                    {
                        label: 'Delete',
                        icon: <BiTrash />,
                        isDisabled: (row: any) => !!row.has_pending_request,
                        onClick: (row: any) => ask('delete', row),
                        disabledTooltip: (row: any) => row.pending_request_message,
                    },
                    {
                        label: "Preview",
                        icon: <BiSolidFilePdf />,
                        onClick: (row) => handleOpenPreview(row),
                    },
                ],
            },
        ];

        return buildColumns(baseColumnConfig, { showSerial: true });
    }, [dropdownsFetched, queryParams]);

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>
                <HStack justify="space-between">
                    <Heading as="h4" size="md">
                        Spare Master
                    </Heading>
                    <ResponsiveIconButton
                        variant="@primary"
                        icon={<LuPlus />}
                        size={{ base: 'sm', md: 'md' }}
                        onClick={() => navigate('/spare-management/master/form')}
                    >
                        Add New
                    </ResponsiveIconButton>
                </HStack>

                <Formiz autoForm connect={form}>
                    <Box sx={{ bg: 'green.200', width: '100%', padding: '4', borderRadius: '4' }}>
                        <Box bg="white" p={6} borderRadius={4} mt={2}>

                            {/* Row 1 */}
                            <Stack direction={{ base: 'column', md: 'row' }} spacing={4} mb={4}>
                                <FieldInput
                                    name="keyword"
                                    placeholder="Search"
                                    onValueChange={(value) => updateFilter('search', value ?? '')}
                                    rightElement={<Icon as={HiOutlineSearch} color="gray.300" />}
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`spare_type_${formKey}`}
                                    name="spare_type_id"
                                    placeholder="Spare Type"
                                    options={spareTypeOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter('spare_type_id', v)}
                                    isClearable
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`spare_model_${formKey}`}
                                    name="spare_model_id"
                                    placeholder="Spare Model"
                                    options={spareModelOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter('spare_model_id', v)}
                                    isClearable
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`hsc_code_${formKey}`}
                                    name="hsc_code_id"
                                    placeholder="HSC Code"
                                    options={hscCodeOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter('hsc_code_id', v)}
                                    isClearable
                                    size="sm"
                                />
                            </Stack>

                            {/* Row 2 */}
                            <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
                                <FieldSelect
                                    key={`uom_${formKey}`}
                                    name="unit_of_measure_id"
                                    placeholder="Unit of Measure"
                                    options={unitOfMeasureOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter('unit_of_measure_id', v)}
                                    isClearable
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`is_dg_${formKey}`}
                                    name="is_dg"
                                    placeholder="DG"
                                    options={[
                                        { value: 'true', label: 'Yes' },
                                        { value: 'false', label: 'No' },
                                    ]}
                                    onValueChange={(v) => updateFilter('is_dg', v)}
                                    isClearable
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`is_llp_${formKey}`}
                                    name="is_llp"
                                    placeholder="LLP"
                                    options={[
                                        { value: 'true', label: 'Yes' },
                                        { value: 'false', label: 'No' },
                                    ]}
                                    onValueChange={(v) => updateFilter('is_llp', v)}
                                    isClearable
                                    size="sm"
                                />
                                <FieldSelect
                                    key={`is_serialized_${formKey}`}
                                    name="is_serialized"
                                    placeholder="Serialized"
                                    options={[
                                        { value: 'true', label: 'Yes' },
                                        { value: 'false', label: 'No' },
                                    ]}
                                    onValueChange={(v) => updateFilter('is_serialized', v)}
                                    isClearable
                                    size="sm"
                                />
                            </Stack>

                            {/* Reset */}
                            <Stack align="center" mt={6}>
                                <Button
                                    variant="@primary"
                                    size="sm"
                                    leftIcon={<HiRefresh />}
                                    onClick={() => {
                                        form.reset();
                                        setFormKey((k) => k + 1);
                                        setQueryParams(initialQueryParams);
                                    }}
                                >
                                    Reset Form
                                </Button>
                            </Stack>
                        </Box>
                    </Box>
                </Formiz>

                <LoadingOverlay isLoading={!allApiDataLoaded}>
                    <Box borderRadius={4}>
                        <DataTable
                            columns={columns}
                            data={data}
                            loading={!allApiDataLoaded || dropdownLoading || listDataLoading}
                            title="Part Numbers"
                            enablePagination
                            enableClientSideSearch={false}
                            onSortChange={handleSortChange}
                            sortDirection={sortDirection}
                            sortBy={sortBy}
                            currentPage={paginationData?.current_page}
                            totalCount={paginationData?.total}
                            pageSize={itemsPerPage}
                            stickyColumns={5}
                            onPageChange={(page) =>
                                setQueryParams((prev: any) => ({ ...prev, page }))
                            }
                            onPageSizeChange={(limit) => {
                                setItemsPerPage(limit);
                                setQueryParams((prev: any) => ({ ...prev, limit, page: 1 }));
                            }}
                            headerAction={
                                <HStack ml="auto">


                                    <Flex alignItems="center">
                                        <Button
                                            leftIcon={<LuUpload />}
                                            colorScheme="green"
                                            variant="solid"
                                            size="sm"
                                            onClick={() => navigate(`/spare-management/bulk-upload`)}
                                        >
                                            Bulk Upload
                                        </Button>
                                    </Flex>

                                    <Flex alignItems="center">
                                        <Button
                                            leftIcon={<LuDownload />}
                                            colorScheme="blue"
                                            size="sm"
                                            onClick={() => handleDownload(import.meta.env.VITE_SPARES_SAMPLE_CSV)}
                                        >
                                            Download Sample
                                        </Button>
                                    </Flex>
                                </HStack>
                            }
                        />
                    </Box>
                </LoadingOverlay>

                <ConfirmationWithReasonPopup
                    isOpen={confirmMode === 'delete'}
                    onClose={closeConfirm}
                    onConfirm={onConfirmDelete}
                    headerText="Confirm Delete"
                    showBody={false}
                    isInputRequired
                    isLoading={isDeleting}
                    placeholder="Enter reason to delete"
                />

                <PDFPreviewModal
                    isOpen={isOpen}
                    onClose={closePreview}
                    pdfUrlOrEndpoint={pdfUrl}
                    title={pdfTitle}
                    isEndpoint={true}
                />
            </Stack>
        </SlideIn>
    );
};

export default SpareMaster;