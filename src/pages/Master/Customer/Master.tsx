import { useMemo, useState } from 'react';
import { BiEdit, BiInfoCircle, BiTrash, BiChevronDown, BiSolidFilePdf } from "react-icons/bi";
import {
    Box,
    Button,
    Flex,
    HStack,
    Heading,
    Stack,
    Icon,
    Menu,
    MenuButton,
    MenuItem,
    MenuList
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { HiRefresh, HiOutlineSearch } from 'react-icons/hi';
import { LuPlus, LuUpload, LuDownload } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';
import LoadingOverlay from '@/components/LoadingOverlay';
import { DataTable } from '@/components/DataTable';
import { FieldInput } from '@/components/FieldInput';
import { FieldSelect } from '@/components/FieldSelect';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { SlideIn } from '@/components/SlideIn';
import { useCustomerIndex, useCustomerDropdowns, useUpdateCustomerStatus } from '@/services/master/customer/service';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { ConfirmationWithReasonPopup } from "@/components/ConfirmationWithReasonPopup";
import { DownloadSampleOptions, contactManagementPageConfig, DownloadSampleKeys } from '@/constants';
import { handleDownload } from '@/helpers/commonHelper';
import { CompletionProgressBar } from '@/components/CompletionProgressBar';
import { ActionMenu } from '@/components/ActionMenu';
import { useSubmasterItemIndex } from "@/services/submaster/service";
import { CustomerDetails } from '@/pages/Master/Customer/Info/CustomerDetails';
import { useDelete } from '@/api/useDelete';
import { endPoints } from '@/api/endpoints';
import { usePDFPreview } from "@/context/PDFPreviewContext";
import { useRouterContext } from '@/services/auth/RouteContext';

type ConfirmMode = null | "delete" | "status-update";

export const CustomerMaster = () => {
    const navigate = useNavigate();
    const { otherPermissions } = useRouterContext();

    const canCreate = otherPermissions.create === 1;
    const canUpdate = otherPermissions.update === 1;
    const canDelete = otherPermissions.update === 1;
    const canView = otherPermissions.view === 1;
    const canBulkUpload = otherPermissions.bulk_upload === 1;

    const { data: dropdownData, isLoading: dropdownLoading, isSuccess: dropdownsFetched } = useCustomerDropdowns();
    const contactTypeOptions = dropdownData?.contact_types ?? [];
    const businessTypeOptions = dropdownData?.business_types ?? [];
    const paymentModeOptions = dropdownData?.payment_modes ?? [];
    const paymentTermOptions = dropdownData?.payment_terms ?? [];
    const customerOptions = dropdownData?.customers ?? [];
    const currencyOptions = dropdownData?.currencies ?? [];

    const [activeItem, setActiveItem] = useState<any>(null);
    const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);

    const { openPreview } = usePDFPreview();
    const handleOpenPreview = (itemInfo: any) => {
        const url = `${import.meta.env.VITE_PUBLIC_API_URL}${endPoints.preview.customer.replace(":id", itemInfo.id)}`;
        openPreview(url, `SEL Preview - #${itemInfo.code}`, true);
    };

    const handleDownloadSampleFunction = (value: DownloadSampleKeys) => {
        const csvPath = contactManagementPageConfig[value]?.csv;
        if (csvPath) handleDownload(csvPath);
        else console.warn('No CSV file found for:', value);
    };

    const handleUploadPageRedirection = (value: DownloadSampleKeys) => {
        navigate(contactManagementPageConfig[value].uploadRoute);
    };

    const [pendingStatus, setPendingStatus] = useState<{ row: any; newStatus: string } | null>(null);

    const { data: customerStatuses, isSuccess: statusFetched } = useSubmasterItemIndex("customer-statuses", {});
    const statusOptions = customerStatuses?.data ?? [];

    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [mutatingRowId, setMutatingRowId] = useState<string | null>(null);

    const updateFilter = (key: string, value: any) => {
        setQueryParams((prev: any) => ({
            ...prev,
            [key]: value ?? "",
            page: 1,
            limit: itemsPerPage,
        }));
    };

    const onConfirmStatusUpdate = (reason: string) => {
        if (!pendingStatus) return;
        triggerStatusUpdate(
            { id: pendingStatus.row.id, customer_status_id: pendingStatus.newStatus, reason },
            {
                onSettled: () => {
                    closeConfirm();
                    setPendingStatus(null);
                    refreshIndex();
                },
            }
        );
    };

    const handleStatusChange = (row: any, newStatus: any) => {
        setMutatingRowId(row.id);
        setPendingStatus({ row, newStatus });
        setConfirmMode("status-update");
    };

    const getFilteredStatusOptions = (status_id: string) => {
        const currentStatus = statusOptions.find((opt: any) => String(opt.id) === String(status_id));
        const currentStatusCode = currentStatus?.code;
        const statusMapping: Record<string, string[]> = {
            UNAPPROVED: ["ACTIVE"],
            ACTIVE: ["HOLD", "INACTIVE"],
            HOLD: ["ACTIVE", "INACTIVE"],
            INACTIVE: ["ACTIVE", "HOLD"],
        };
        return statusOptions
            .filter((opt: any) => statusMapping[currentStatusCode]?.includes(opt.code))
            .map((opt: any) => ({
                ...opt,
                label: currentStatusCode === "UNAPPROVED" && opt.code === "ACTIVE" ? "Approve" : opt.label,
            }));
    };

    const initialQueryParams = {
        page: 1, limit: itemsPerPage, search: '', id: '',
        customer_status_id: '', business_type_id: '', currency_id: '',
        payment_term_id: '', payment_mode_id: '', contact_type_id: '',
    };
    const [queryParams, setQueryParams] = useState<TODO>(initialQueryParams);
    const [formKey, setFormKey] = useState(0);

    const form = useForm({
        onValidSubmit: (values) => setQueryParams({ search: values }),
    });

    const { mutate: triggerDelete, isLoading: isDeleting } = useDelete({
        url: endPoints.delete.customer,
        invalidate: ['customerIndex', 'customerDetails'],
    });
    const { mutate: triggerStatusUpdate, isLoading: isUpdating } = useUpdateCustomerStatus();

    const onConfirmDelete = (reason: string) => {
        if (!activeItem) return;
        triggerDelete(
            { id: activeItem.id, deleted_reason: reason },
            { onSuccess: () => refreshIndex(), onSettled: closeConfirm }
        );
    };

    const ask = (mode: ConfirmMode, row: any) => { setActiveItem(row); setConfirmMode(mode); };
    const closeConfirm = () => { setConfirmMode(null); setActiveItem(null); };

    const { data: listData, isSuccess: listFetched, isLoading: listDataLoading, refetch: refreshIndex } =
        useCustomerIndex(queryParams);

    const allApiDataLoaded = dropdownsFetched && listFetched && statusFetched;
    const data = listData?.data ?? [];
    const paginationData = listData?.pagination;

    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const [sortBy, setSortBy] = useState<string>('created_at');

    const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
        setSortDirection((prev) => prev !== direction ? direction : prev);
        setSortBy((prev) => prev !== columnId ? columnId : prev);
        setQueryParams((prev: TODO) => {
            if (prev.sort_field !== columnId || prev.sort_order !== direction) {
                return { ...prev, sort_field: columnId, sort_order: direction, page: 1 };
            }
            return prev;
        });
    };

    const getColumnConfig = (queryParams: any, cols: DynamicColumn<any>[]) => {
        const priorityKeys: string[] = [];
        if (queryParams.id) priorityKeys.push("code");
        if (queryParams.customer_status_id) priorityKeys.push("customer_status.name");
        if (queryParams.business_type_id) priorityKeys.push("business_type.name");
        if (queryParams.payment_term_id) priorityKeys.push("payment_term.name");
        if (queryParams.payment_mode_id) priorityKeys.push("payment_mode.name");
        if (queryParams.currency_id) priorityKeys.push("currency.name");
        if (queryParams.contact_type_id) priorityKeys.push("contact_type.name");
        const priorityColumns = cols.filter(c => priorityKeys.includes(c.key));
        const remainingColumns = cols.filter(c => !priorityKeys.includes(c.key));
        return [...priorityColumns, ...remainingColumns];
    };

    const columns = useMemo(() => {
        if (!dropdownsFetched) return [];

        const baseColumnConfig: DynamicColumn<any>[] = [
            { key: "business_name", header: () =>  <>Business<br/>Name</>, meta: { sortable: true, isNumeric: false, sortParam: 'business_name' } },
            { key: "code", header: () =>  <>Contact<br/>Code</>, meta: { sortable: true, isNumeric: false, sortParam: 'code' } },
            { key: "email", header: "Email", meta: { sortable: true, sortParam: 'email', width:240 } },
            { key: "nature_of_business", header: () =>  <>Business<br/>Nature</>, meta: { sortable: true, isNumeric: false, sortParam: 'nature_of_business' } },
            { key: "contact_type.name", header: () =>  <>Contact<br/>Type</>, meta: { sortable: true, isNumeric: false, sortParam: 'contact_type_id' } },
            { key: "business_type.name", header: () =>  <>Business<br/>Type</>, meta: { sortable: true, isNumeric: false, sortParam: 'business_type_id' } },
            { key: "currency.name", header: "Currency", meta: { sortable: true, isNumeric: false, sortParam: 'currency_id' } },
            {
                key: "customer_status.name",
                header: () =>  <>Customer<br/>Status</>,
                meta: { sortable: true, isNumeric: false, sortParam: "customer_status_id" },
                render: (row: any) => (
                    <Menu placement="bottom-start">
                        <MenuButton
                            colorScheme={
                                row.customer_status?.code === "UNAPPROVED" ? "yellow" :
                                    row.customer_status?.code === "ACTIVE" ? "green" :
                                        row.customer_status?.code === "HOLD" ? "orange" : "red"
                            }
                            as={Button}
                            size="sm"
                            variant="solid"
                            isDisabled={row.is_fixed || row.has_pending_request}
                            rightIcon={<BiChevronDown />}
                            maxW="130px"
                            minW="130px"
                            isLoading={mutatingRowId === row.id && isUpdating}
                        >
                            {row.customer_status?.name}
                        </MenuButton>
                        <MenuList width="130px" maxW="130px" minW="130px" boxShadow="md" sx={{ overflow: "hidden", padding: "4px" }}>
                            {getFilteredStatusOptions(row.customer_status_id).map((status: any) => (
                                <MenuItem key={status.id} onClick={() => handleStatusChange(row, status.id)}>
                                    {status.name}
                                </MenuItem>
                            ))}
                        </MenuList>
                    </Menu>
                ),
            },
            { key: "payment_term.name", header: () =>  <>Payment<br/>Term</>, meta: { sortable: true, isNumeric: false, sortParam: 'payment_term_id' } },
            { key: "payment_mode.name", header: () =>  <>Payment<br/>Mode</>, meta: { sortable: true, isNumeric: false, sortParam: 'payment_mode_id' } },
            {
                key: "completion_percentage",
                header: "Completion (%)",
                meta: { sortable: false },
                render: (row: any) => <CompletionProgressBar value={row.completion_percentage} trackColor="#7b8085" />,
            },
            {
                key: "actions",
                header: "Actions",
                type: "actions",
                actions: [
                    // View — shown only if canView
                    ...(canView ? [{
                        label: "View",
                        icon: <BiInfoCircle />,
                        onClick: (row: any) => navigate(`/contact-management/master/info/${row.id}`),
                    }] : []),
                    // Edit — shown only if canUpdate
                    ...(canUpdate ? [{
                        label: "Edit",
                        icon: <BiEdit />,
                        isDisabled: (row: any) => row.is_fixed || !!row.has_pending_request,
                        onClick: (row: any) => navigate(`/contact-management/master/form/${row.id}`),
                        disabledTooltip: (row: any) => row.pending_request_message,
                    }] : []),
                    // Delete — shown only if canDelete
                    ...(canDelete ? [{
                        label: "Delete",
                        icon: <BiTrash />,
                        isDisabled: (row: any) => row.is_fixed || !!row.has_pending_request,
                        onClick: (row: any) => ask("delete", row),
                        disabledTooltip: (row: any) => row.pending_request_message,
                    }] : []),
                    // Preview — always visible
                    {
                        label: "Preview",
                        icon: <BiSolidFilePdf />,
                        onClick: (row: any) => handleOpenPreview(row),
                    },
                ],
            },
        ];

        const columnConfig = getColumnConfig(queryParams, baseColumnConfig);
        return buildColumns(columnConfig, { showSerial: true });
    }, [dropdownsFetched, statusOptions, queryParams, canView, canUpdate, canDelete]);

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>
                <HStack justify={'space-between'}>
                    <Heading as="h4" size={'md'}>Contact Management</Heading>
                    {canCreate && (
                        <ResponsiveIconButton
                            variant={'@primary'}
                            icon={<LuPlus />}
                            size={{ base: 'sm', md: 'md' }}
                            onClick={() => navigate('/contact-management/master/form')}
                        >
                            Add New
                        </ResponsiveIconButton>
                    )}
                </HStack>

                <Formiz autoForm connect={form}>
                    <Box sx={{ bg: 'green.200', width: '100%', padding: '4', borderRadius: '4' }}>
                        <Box bg="white" p={6} borderRadius={4} mt={2}>
                            {/* Row 1 */}
                            <Stack direction={{ base: "column", md: "row" }} spacing={4} mb={4}>
                                <FieldInput
                                    name="keyword"
                                    placeholder="Search"
                                    onValueChange={(value) => updateFilter("search", value ?? '')}
                                    rightElement={<Icon as={HiOutlineSearch} color="gray.300" />}
                                    size={'sm'}
                                />
                                <FieldSelect
                                    key={`customer_id_${formKey}`}
                                    name="id"
                                    placeholder="Contact Code"
                                    options={customerOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => setQueryParams({ ...initialQueryParams, id: v ?? "", page: 1, limit: itemsPerPage })}
                                    isClearable={true}
                                    size={'sm'}
                                />
                                <FieldSelect
                                    key={`customer_status_${formKey}`}
                                    name="customer_status_id"
                                    placeholder="Contact Status"
                                    options={statusOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter("customer_status_id", v)}
                                    isDisabled={queryParams?.id}
                                    isClearable={true}
                                    size={'sm'}
                                />
                                <FieldSelect
                                    key={`business_type_${formKey}`}
                                    name="business_type_id"
                                    placeholder="Busi.Type"
                                    options={businessTypeOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter("business_type_id", v)}
                                    isDisabled={queryParams?.id}
                                    isClearable={true}
                                    size={'sm'}
                                />
                            </Stack>

                            {/* Row 2 */}
                            <Stack direction={{ base: "column", md: "row" }} spacing={4}>
                                <FieldSelect
                                    key={`currency_${formKey}`}
                                    name="currency_id"
                                    placeholder="Currency"
                                    options={currencyOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter("currency_id", v)}
                                    isDisabled={queryParams?.id}
                                    isClearable={true}
                                    size={'sm'}
                                />
                                <FieldSelect
                                    key={`payment_term_${formKey}`}
                                    name="payment_term_id"
                                    placeholder="Pay.Term"
                                    options={paymentTermOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter("payment_term_id", v)}
                                    isDisabled={queryParams?.id}
                                    isClearable={true}
                                    size={'sm'}
                                />
                                <FieldSelect
                                    key={`payment_mode_${formKey}`}
                                    name="payment_mode_id"
                                    placeholder="Pay.Mode"
                                    options={paymentModeOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter("payment_mode_id", v)}
                                    isDisabled={queryParams?.id}
                                    isClearable={true}
                                    size={'sm'}
                                />
                                <FieldSelect
                                    key={`contact_type_${formKey}`}
                                    name="contact_type_id"
                                    placeholder="Contact Type"
                                    options={contactTypeOptions}
                                    selectProps={{ isLoading: dropdownLoading }}
                                    onValueChange={(v) => updateFilter("contact_type_id", v)}
                                    isDisabled={queryParams?.id}
                                    isClearable={true}
                                    size={'sm'}
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
                        {queryParams?.id ? (
                            <CustomerDetails customerId={queryParams?.id ?? 0} />
                        ) : (
                            <DataTable
                                columns={columns}
                                data={data}
                                loading={!allApiDataLoaded || dropdownLoading || listDataLoading}
                                title="Contacts"
                                enablePagination
                                enableClientSideSearch={false}
                                onSortChange={handleSortChange}
                                sortDirection={sortDirection}
                                sortBy={sortBy}
                                currentPage={paginationData?.current_page}
                                totalCount={paginationData?.total}
                                pageSize={itemsPerPage}
                                stickyColumns={4}
                                stickyLastColumn={true}
                                onPageChange={(page) => setQueryParams((prev: any) => ({ ...prev, page }))}
                                onPageSizeChange={(limit) => {
                                    setItemsPerPage(limit);
                                    setQueryParams((prev: any) => ({ ...prev, limit, page: 1 }));
                                }}
                                headerAction={
                                    <HStack ml="auto">
                                        {canBulkUpload && (
                                            <Flex alignItems="center">
                                                <ActionMenu
                                                    label="Bulk Upload"
                                                    icon={<LuUpload />}
                                                    colorScheme="green"
                                                    options={DownloadSampleOptions}
                                                    onClick={handleUploadPageRedirection}
                                                    isDisabled={!allApiDataLoaded}
                                                />
                                            </Flex>
                                        )}

                                        {canBulkUpload && (
                                            <Flex alignItems="center">
                                                <ActionMenu
                                                    label="Download Sample"
                                                    icon={<LuDownload />}
                                                    colorScheme="blue"
                                                    options={DownloadSampleOptions}
                                                    onClick={handleDownloadSampleFunction}
                                                    isDisabled={!allApiDataLoaded}
                                                />
                                            </Flex>
                                        )}
                                    </HStack>
                                }
                            />
                        )}
                    </Box>
                </LoadingOverlay>

                <ConfirmationWithReasonPopup
                    isOpen={confirmMode === "delete" || confirmMode === "status-update"}
                    onClose={closeConfirm}
                    onConfirm={confirmMode === "delete" ? onConfirmDelete : onConfirmStatusUpdate}
                    headerText={confirmMode === "delete" ? "Confirm Delete" : "Confirm Status Update"}
                    showBody={false}
                    isInputRequired
                    isLoading={isDeleting || isUpdating}
                    placeholder={confirmMode === "delete" ? "Enter Reason to delete" : "Enter Reason"}
                />
            </Stack>
        </SlideIn>
    );
};

export default CustomerMaster;