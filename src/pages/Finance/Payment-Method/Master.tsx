import { useState } from 'react';
import { BiEdit, BiInfoCircle, BiShow, BiTrash, BiRefresh } from 'react-icons/bi';
import { Badge, Box, HStack, Heading, Stack, Tabs, TabList, Tab, TabPanels, TabPanel, useDisclosure } from '@chakra-ui/react';
import { LuPlus } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router-dom';
import { DataTable } from '@/components/DataTable';
import { SlideIn } from '@/components/SlideIn';
import { ResponsiveIconButton } from '@/components/ResponsiveIconButton';
import { buildColumns, DynamicColumn } from '@/components/ReUsable/table-columns/buildColumns';
import { useRouterContext } from '@/services/auth/RouteContext';
import {
    usePaymentMethodIndex,
    PaymentMethod,
} from '@/services/finance/payment-method/service';
import { PageLimit } from "@/components/PageLimit";
import { format } from 'date-fns';
import { CardPreview } from "@/components/Popups/Finance/CardPreview";
import { BankPreview } from "@/components/Popups/Finance/BankPreview";
import { ChequePreview } from "@/components/Popups/Finance/ChequePreview";
import { PreviewModal } from "@/components/Popups/Finance/PreviewModal";
import { ConfirmationWithReasonPopup } from "@/components/ConfirmationWithReasonPopup";
import { useDelete } from "@/api/useDelete";

type ConfirmMode = null | "delete" | "restore";
/* =========================================================
   Column Configs
========================================================= */

const getBankColumns = (canUpdate: boolean, canView: boolean, navigate: any, onPreview: (row: any) => void, ask: (mode: ConfirmMode, row: any) => void) => {
    const config: DynamicColumn<any>[] = [
        { key: 'name', header: 'Bank Name', meta: { sortable: true } },
        { key: 'account_label', header: 'Account Label', meta: { sortable: true } },
        { key: 'branch', header: 'Branch', meta: { sortable: true } },
        { key: 'ac_iban_no', header: 'IBAN / AC No', meta: { sortable: true } },
        { key: 'swift', header: 'Swift', meta: { sortable: true } },
        { key: 'currency.name', header: 'Currency', meta: { sortable: true } },
        { key: 'contact_name', header: 'Contact', meta: { sortable: true } },
        {
            key: "created_at",
            header: "Created At",
            meta: { sortable: true },
            render: (row: any) => format(new Date(row.created_at), 'dd-MMM-yyyy HH:mm'),
        },
        {
            key: 'is_default',
            header: 'Default',
            render: (row: any) => (
                <Badge colorScheme={row.is_active ? 'green' : 'red'}>
                    {row.is_active ? 'Yes' : 'No'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            type: 'actions',
            actions: [
                ...(canUpdate ? [{
                    label: 'Edit',
                    icon: <BiEdit />,
                    isDisabled: (row: any) => !!row.deleted_at || !!row.has_pending_request,
                    disabledTooltip: (row: any) =>
                        row.deleted_at ? "Cannot edit deleted record" : row.pending_request_message,
                    onClick: (row: any) => navigate(`/finance/payment-method/banks/form/${row.id}`),
                }] : []),

                ...(canView ? [{
                    label: 'View',
                    icon: <BiInfoCircle />,
                    onClick: (row: any) => navigate(`/finance/payment-method/banks/form/${row.id}/view`),
                }] : []),

                ...(canView ? [{
                    label: 'Preview',
                    icon: <BiShow />,
                    onClick: onPreview
                }] : []),

                ...(canUpdate ? [

                    // 🗑 DELETE
                    {
                        label: 'Delete',
                        icon: <BiTrash />,
                        onClick: (row: any) => ask("delete", row),
                        isVisible: (row: any) => !row.deleted_at,
                        isDisabled: (row: any) => !!row.has_pending_request,
                        disabledTooltip: (row: any) => row.pending_request_message,
                    },

                    // 🔄 RESTORE
                    {
                        label: 'Restore',
                        icon: <BiRefresh />,
                        onClick: (row: any) => ask("restore", row),
                        isVisible: (row: any) => !!row.deleted_at,
                        isDisabled: (row: any) => !!row.has_pending_request,
                        disabledTooltip: (row: any) => row.pending_request_message,
                    },

                ] : []),
            ],
        }
    ];
    return buildColumns(config, { showSerial: true });
};

const getCardColumns = (canUpdate: boolean, canView: boolean, navigate: any, onPreview: (row: any) => void, ask: (mode: ConfirmMode, row: any) => void) => {
    const config: DynamicColumn<any>[] = [
        { key: 'card_label', header: 'Card Label', meta: { sortable: true } },
        { key: 'card_holder_name', header: 'Holder Name', meta: { sortable: true } },
        { key: 'card_type', header: 'Type', meta: { sortable: true } },
        { key: 'card_category', header: 'Category', meta: { sortable: true } },
        { key: 'card_last4', header: 'Last 4', meta: { sortable: true } },
        { key: 'bank_name', header: 'Bank', meta: { sortable: true } },
        { key: 'currency.name', header: 'Currency', meta: { sortable: true } },
        { key: 'contact_name', header: 'Contact', meta: { sortable: true } },
        {
            key: "created_at",
            header: "Created At",
            meta: { sortable: true },
            render: (row: any) => format(new Date(row.created_at), 'dd-MMM-yyyy HH:mm'),
        },
        {
            key: 'is_default',
            header: 'Default',
            render: (row: any) => (
                <Badge colorScheme={row.is_active ? 'green' : 'red'}>
                    {row.is_active ? 'Yes' : 'No'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            type: 'actions',
            actions: [
                ...(canUpdate ? [{
                    label: 'Edit',
                    icon: <BiEdit />,
                    isDisabled: (row: any) => !!row.has_pending_request,
                    disabledTooltip: (row: any) => row.pending_request_message,
                    onClick: (row: any) => navigate(`/finance/payment-method/cards/form/${row.id}`),
                }] : []),
                ...(canView ? [{
                    label: 'View',
                    icon: <BiInfoCircle />,
                    onClick: (row: any) => navigate(`/finance/payment-method/cards/form/${row.id}/view`),
                }] : []),
                ...(canView ? [{
                    label: 'Preview',
                    icon: <BiShow />,
                    onClick: onPreview
                }] : []),
                ...(canUpdate ? [

                    // 🗑 DELETE
                    {
                        label: 'Delete',
                        icon: <BiTrash />,
                        onClick: (row: any) => ask("delete", row),
                        isVisible: (row: any) => !row.deleted_at,
                        isDisabled: (row: any) => !!row.has_pending_request,
                        disabledTooltip: (row: any) => row.pending_request_message,
                    },

                    // 🔄 RESTORE
                    {
                        label: 'Restore',
                        icon: <BiRefresh />,
                        onClick: (row: any) => ask("restore", row),
                        isVisible: (row: any) => !!row.deleted_at,
                        isDisabled: (row: any) => !!row.has_pending_request,
                        disabledTooltip: (row: any) => row.pending_request_message,
                    },

                ] : []),
            ],
        },
    ];
    return buildColumns(config, { showSerial: true });
};

const getChequeColumns = (canView: boolean, canUpdate: boolean, navigate: any, onPreview: (row: any) => void, ask: (mode: ConfirmMode, row: any) => void) => {
    const config: DynamicColumn<any>[] = [
        { key: 'name', header: 'Name', meta: { sortable: true } },
        { key: 'account_label', header: 'Account Label', meta: { sortable: true } },
        { key: 'branch', header: 'Branch', meta: { sortable: true } },
        { key: 'ac_no', header: 'AC No', meta: { sortable: true } },
        { key: 'currency.name', header: 'Currency', meta: { sortable: true } },
        { key: 'contact_name', header: 'Contact', meta: { sortable: true } },
        {
            key: "created_at",
            header: "Created At",
            meta: { sortable: true },
            render: (row: any) => format(new Date(row.created_at), 'dd-MMM-yyyy HH:mm'),
        },
        {
            key: 'is_default',
            header: 'Default',
            render: (row: any) => (
                <Badge colorScheme={row.is_active ? 'green' : 'red'}>
                    {row.is_active ? 'Yes' : 'No'}
                </Badge>
            ),
        },
        {
            key: 'actions',
            header: 'Actions',
            type: 'actions',
            actions: [
                ...(canUpdate ? [{
                    label: 'Edit',
                    icon: <BiEdit />,
                    onClick: (row: any) => navigate(`/finance/payment-method/cheques/form/${row.id}`),
                    isDisabled: (row: any) => !!row.has_pending_request,
                    disabledTooltip: (row: any) => row.pending_request_message,
                }] : []),
                ...(canView ? [{
                    label: 'View',
                    icon: <BiInfoCircle />,
                    onClick: (row: any) => navigate(`/finance/payment-method/cheques/form/${row.id}/view`),
                }] : []),
                ...(canView ? [{
                    label: 'Preview',
                    icon: <BiShow />,
                    onClick: onPreview
                }] : []),
                ...(canUpdate ? [

                    // 🗑 DELETE
                    {
                        label: 'Delete',
                        icon: <BiTrash />,
                        onClick: (row: any) => ask("delete", row),
                        isVisible: (row: any) => !row.deleted_at,
                        isDisabled: (row: any) => !!row.has_pending_request,
                        disabledTooltip: (row: any) => row.pending_request_message,
                    },

                    // 🔄 RESTORE
                    {
                        label: 'Restore',
                        icon: <BiRefresh />,
                        onClick: (row: any) => ask("restore", row),
                        isVisible: (row: any) => !!row.deleted_at,
                        isDisabled: (row: any) => !!row.has_pending_request,
                        disabledTooltip: (row: any) => row.pending_request_message,
                    },

                ] : []),
            ],
        },
    ];
    return buildColumns(config, { showSerial: true });
};

/* =========================================================
   Tab Config
========================================================= */

const TABS: { label: string; method: PaymentMethod }[] = [
    { label: 'Banks', method: 'banks' },
    { label: 'Cards', method: 'cards' },
    { label: 'Cheques', method: 'cheques' },
];

/* =========================================================
   Main Page
========================================================= */

export const PaymentMethodMaster = () => {
    const navigate = useNavigate();
    const { otherPermissions } = useRouterContext();
    const { method } = useParams<{ method?: string }>();
    // ✅ Declare state first so activeMethod is available for the hook below
    const tabIndex = TABS.findIndex((t) => t.method === method) ?? 0;
    const activeIndex = tabIndex === -1 ? 0 : tabIndex;
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortBy, setSortBy] = useState('created_at');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const { isOpen, onOpen, onClose } = useDisclosure();

    const [previewData, setPreviewData] = useState<any>(null);
    const [previewType, setPreviewType] = useState<"card" | "bank" | "cheque" | null>(null);

    const activeMethod = TABS[activeIndex].method;

    const canCreate = otherPermissions.create === 1;
    const canUpdate = otherPermissions.update === 1;
    const canView = otherPermissions.view === 1;

    // ✅ Single hook call at the top level — no hooks inside loops/maps
    const { data, isLoading, refetch  } = usePaymentMethodIndex(activeMethod);
    const rows = data?.data ?? [];

    const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
    const [activeItem, setActiveItem] = useState<any>(null);

    const ask = (mode: ConfirmMode, row: any) => {
        setActiveItem(row);
        setConfirmMode(mode);
    };

    const closeConfirm = () => {
        setConfirmMode(null);
        setActiveItem(null);
    };

    const onConfirm = (reason: string) => {
        if (!activeItem) return;

        triggerDelete(
            {
                id: activeItem.id,
                ...(confirmMode === "delete"
                    ? { deleted_reason: reason }
                    : { restore_reason: reason }),
            },
            {
                onSuccess: () => {
                    refetch(); 
                },
                onSettled: closeConfirm,
            }
        );
    };

const { mutate: triggerDelete, isLoading: isDeleting } = useDelete({
    url: activeItem
        ? `/finance/payment-method/${activeMethod}/${activeItem.id}`
        : "",
    invalidate: ['paymentMethods'],
});

    console.log(rows)
    const columns = (() => {
        const handlePreview = (row: any) => {
            setPreviewData(row);
            setPreviewType(activeMethod.slice(0, -1) as any); // cards → card
            onOpen();
        };

        if (activeMethod === 'banks')
            return getBankColumns(canUpdate, canView, navigate, handlePreview, ask);

        if (activeMethod === 'cards')
            return getCardColumns(canUpdate, canView, navigate, handlePreview, ask);

        if (activeMethod === 'cheques')
            return getChequeColumns(canUpdate, canView, navigate, handlePreview, ask);

        return [];
    })();

    const handleSortChange = (columnId: string, direction: 'asc' | 'desc') => {
        setSortBy(columnId);
        setSortDirection(direction);
    };

    const changePageLimit = (limit: number) => {
        setItemsPerPage(limit);
    };

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* Heading + Add New above tabs */}
                <HStack justify="space-between">
                    <Heading as="h4" size="md">Payment Methods</Heading>
                    {canCreate && (
                        <ResponsiveIconButton
                            variant="@primary"
                            icon={<LuPlus />}
                            size={{ base: 'sm', md: 'md' }}
                            onClick={() => navigate(`/finance/payment-method/${activeMethod}/form`)}
                        >
                            Add New
                        </ResponsiveIconButton>
                    )}
                </HStack>

                {/* ✅ Fixed: was referencing undefined `listData`, now uses `data` / `isLoading` */}
                <Box borderRadius={4}>
                    <HStack
                        bg={'white'}
                        justify={'space-between'}
                        p={4}
                        borderTopRadius={4}
                    >
                        <Heading as="h4" size={'md'}>
                            {TABS[tabIndex].label} List
                        </Heading>
                        <Box ml="auto" display="flex" alignItems="center">
                            <PageLimit
                                currentLimit={itemsPerPage}
                                loading={isLoading}
                                changeLimit={changePageLimit}
                                total={data?.total}
                            />
                        </Box>
                    </HStack>
                </Box>

                <Tabs
                    index={activeIndex}
                    onChange={(index) => navigate(`/finance/payment-method/${TABS[index].method}/master`)}
                    variant="unstyled"
                    colorScheme="blue"
                >
                    <TabList>
                        {TABS.map((tab, index) => (
                            <Tab
                                key={tab.method}
                                bg={tabIndex === index ? "#0C2556" : "gray.200"}
                                color={tabIndex === index ? "white" : "black"}
                                _hover={{ bg: tabIndex === index ? "#0C2556" : "gray.300" }}
                            >
                                {tab.label}
                            </Tab>
                        ))}
                    </TabList>

                    {/* ✅ Single TabPanel driven by shared state — no hooks inside map */}
                    <TabPanels>
                        {TABS.map((tab) => (
                            <TabPanel key={tab.method} px={0} pt={0}>
                                <DataTable
                                    columns={columns}
                                    data={rows}
                                    loading={isLoading}
                                    title={`${tab.label} List`}
                                    showtitleBar={false}
                                    enablePagination
                                    enableClientSideSearch
                                    onSortChange={handleSortChange}
                                    sortDirection={sortDirection}
                                    sortBy={sortBy}
                                    pageSize={itemsPerPage}
                                    stickyColumns={2}
                                    stickyLastColumn
                                    onPageSizeChange={(limit) => setItemsPerPage(limit)}
                                />
                            </TabPanel>
                        ))}
                    </TabPanels>
                </Tabs>

                <PreviewModal isOpen={isOpen} onClose={onClose}>
                    {previewType === "card" && previewData && (
                        <CardPreview data={previewData} />
                    )}

                    {previewType === "bank" && previewData && (
                        <BankPreview data={previewData} />
                    )}

                    {previewType === "cheque" && previewData && (
                        <ChequePreview data={previewData} />
                    )}
                </PreviewModal>

                <ConfirmationWithReasonPopup
                    isOpen={confirmMode !== null}
                    onClose={closeConfirm}
                    onConfirm={onConfirm}
                    headerText={
                        confirmMode === "delete"
                            ? "Confirm Delete"
                            : "Confirm Restore"
                    }
                    isInputRequired
                    isLoading={isDeleting}
                    placeholder={
                        confirmMode === "delete"
                            ? "Enter reason to delete"
                            : "Enter reason to restore"
                    }
                />

            </Stack>
        </SlideIn>
    );
};

export default PaymentMethodMaster;
