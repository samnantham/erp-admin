import { useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Box, HStack, Heading, Stack, Button, useDisclosure,
    Tabs, TabList, Tab, Menu, MenuButton, MenuList, MenuItem,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { ColumnDef } from "@tanstack/react-table";
import Axios from "axios";

import { DataTable } from "@/components/DataTable";
import { SlideIn } from "@/components/SlideIn";
import { ConfirmationWithReasonPopup } from "@/components/ConfirmationWithReasonPopup";
import { BankModal } from "@/components/Modals/CustomerMaster/Bank";
import { ContactManagerModal } from "@/components/Modals/CustomerMaster/ContactManager";
import { CustomerShippingAddressModal } from "@/components/Modals/CustomerMaster/ShippingAddress";
import { PrincipleOfOwnerModal } from "@/components/Modals/CustomerMaster/PrincipleOfOwner";
import { TraderReferenceModal } from "@/components/Modals/CustomerMaster/TraderReference";
import { HistoryModal } from "@/pages/CUDRequests/HistoryModal";

import { formatModelTitle } from "@/helpers/commonHelper";
import { useToastError } from "@/components/Toast";
import { format } from 'date-fns';
import { useApprovalLogIndex, useApprovalLogHistory, useProcessRequest } from "@/services/cud-requests/service";
import { MODULE_CONFIG } from "@/pages/CUDRequests/config/module-config";
import { MODULE_MODEL_OPTIONS } from "@/pages/CUDRequests/config/module-model-config";
import { ModuleConfig } from "@/pages/CUDRequests/modules/types";
import { usePDFPreview } from "@/context/PDFPreviewContext";

// ================= Types =================

type ActionType = "create" | "update" | "delete";
type ConfirmMode = "single-approve" | "single-reject" | null;

// ================= Constants =================

const ALL_ACTION_TABS: { label: string; value: ActionType }[] = [
    { label: "Create Requests", value: "create" },
    { label: "Update Requests", value: "update" },
    { label: "Delete Requests", value: "delete" },
];

const STATUS_OPTIONS = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
];

// ================= Status color helper =================

const STATUS_COLOR = {
    pending: { border: "yellow.400", color: "yellow.700", bg: "yellow.50", hover: "yellow.100" },
    approved: { border: "green.400", color: "green.700", bg: "green.50", hover: "green.100" },
    rejected: { border: "red.400", color: "red.700", bg: "red.50", hover: "red.100" },
} as const;

// ================= Columns =================

const getColumns = (config?: ModuleConfig): ColumnDef<any>[] => [
    {
        id: "sNo",
        header: "#",
        cell: ({ row }) => row.index + 1,
        meta: { width: 50 },
    },
    ...(config?.displayProps ?? [])
        .filter((prop) => prop.showInTable)
        .map(({ label, key }) => ({
            id: key,
            header: label,
            accessorKey: key,
            meta: { sortable: true, searchable: true },
            cell: ({ row }: any) => {
                const value = row.original.record?.[key];
                if (value === null || value === undefined || value === "") return "—";
                if (typeof value === "boolean") return value ? "Yes" : "No";
                return String(value);
            },
        })),
    {
        id: "status",
        header: "Status",
        accessorKey: "status",
        meta: { sortable: true },
        cell: ({ row }) => {
            const status = row.original.status;
            const colorMap: Record<string, { bg: string; color: string }> = {
                pending: { bg: "yellow.100", color: "yellow.700" },
                approved: { bg: "green.100", color: "green.700" },
                rejected: { bg: "red.100", color: "red.700" },
            };
            const { bg, color } = colorMap[status] ?? { bg: "gray.100", color: "gray.700" };
            return (
                <Box
                    as="span" px={2} py={1}
                    borderRadius="full" fontSize="xs"
                    fontWeight="bold" bg={bg} color={color}
                    textTransform="uppercase"
                >
                    {status}
                </Box>
            );
        },
    },
    {
        id: "requested_by",
        header: "Requested By",
        accessorKey: "requested_by",
        meta: { sortable: true },
    },
    {
        id: "created_at",
        header: "Requested At",
        accessorKey: "created_at",
        meta: { sortable: true },
        cell: ({ row }) => format(new Date(row.original.created_at), 'dd-MMM-yyyy HH:mm'),
    },
];

// ================= Page =================

export const CUDRequestMaster = () => {
    const { module: moduleParam, action: actionParam } = useParams<{
        module: string;
        action: string;
    }>();

    const { openPreview, setLoading, setPdfUrl } = usePDFPreview();
    const navigate = useNavigate();
    const toastError = useToastError();

    // Prevent duplicate POST calls
    const isCallingRef = useRef(false);

    // --------------- Derive model options from module param ---------------
    const modelOptions = MODULE_MODEL_OPTIONS[moduleParam ?? ""] ?? [];

    // --------------- Single queryParams — source of truth ---------------
    const [queryParams, setQueryParams] = useState<any>({
        page: 1,
        limit: 10,
        status: "pending",
        model: modelOptions[0]?.value ?? "",
    });

    // Derived
    const config = MODULE_CONFIG[queryParams.model ?? ""];

    const ACTION_TABS = ALL_ACTION_TABS.filter(tab => {
        if (tab.value === "delete" && config?.allowDelete === false) return false;
        if (tab.value === "create" && config?.allowCreate === false) return false;
        return true;
    });

    // --------------- Active tab ---------------
    const defaultTabIndex = ACTION_TABS.findIndex(
        (t) => t.value === (actionParam ?? "update")
    );
    const [activeTabIndex, setActiveTabIndex] = useState(
        defaultTabIndex >= 0 ? defaultTabIndex : 0
    );
    const activeAction = ACTION_TABS[activeTabIndex]?.value ?? "update";

    const title = `${formatModelTitle(queryParams.model)} ${activeAction} Requests`;
    const statusColors = STATUS_COLOR[queryParams.status as keyof typeof STATUS_COLOR] ?? {
        border: "gray.300", color: "gray.600", bg: "white", hover: "gray.100",
    };

    // --------------- Search / Sort ---------------
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    // --------------- Tab change ---------------
    const handleTabChange = (index: number) => {
        setActiveTabIndex(index);
        setSearchTerm("");
        setSortBy("");
        setSortDirection("asc");
        setQueryParams((prev: any) => ({ ...prev, page: 1 }));
    };

    // --------------- Confirm popup ---------------
    const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
    const [activeRow, setActiveRow] = useState<any>(null);

    const openConfirm = (mode: ConfirmMode, row?: any) => { if (row) setActiveRow(row); setConfirmMode(mode); };
    const closeConfirm = () => { setConfirmMode(null); setActiveRow(null); };

    // --------------- View modals ---------------
    const bankDisc = useDisclosure();
    const contactDisc = useDisclosure();
    const shippingDisc = useDisclosure();
    const ownerDisc = useDisclosure();
    const traderDisc = useDisclosure();
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [existValues, setExistValues] = useState<any>(null);

    // --------------- History modal ---------------
    const historyDisc = useDisclosure();
    const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

    const { data: historyData, isLoading: isHistoryLoading } = useApprovalLogHistory(
        activeRecordId,
        { enabled: historyDisc.isOpen && !!activeRecordId }
    );

    const handleShowHistory = (row: any) => {
        setActiveRecordId(row.record_id);
        historyDisc.onOpen();
    };

    const closeHistoryModal = () => {
        historyDisc.onClose();
        setActiveRecordId(null);
    };

    // --------------- API ---------------
    const { data: requestList, isLoading, refetch } = useApprovalLogIndex(
        { model: queryParams.model, action: activeAction },
        queryParams
    );

    const { mutateAsync: processRequest, isLoading: isProcessing } = useProcessRequest();

    const paginationData = requestList?.pagination;
    const data = requestList?.data ?? [];

    // --------------- Handlers ---------------
    const handleViewAction = async (row: any) => {
        if (!config?.getViewAction) return;
        const viewAction = config.getViewAction(row);
        if (!viewAction) return;

        switch (viewAction.type) {
            case "navigate":
                navigate(viewAction.url);
                break;

            case "pdf": {
                const rowAction = row.action ?? activeAction;

                if (rowAction === "create" && config?.preview?.getNewPreviewRequest) {
                    // Prevent duplicate calls
                    if (isCallingRef.current) return;
                    isCallingRef.current = true;

                    const req = config.preview.getNewPreviewRequest(row);
                    const modalTitle = `${viewAction.title?.replace("#undefined", `#${row.new_data?.code ?? "New"}`)}`;

                    try {
                        // Step 1: open modal immediately — user sees spinner
                        openPreview?.(null, modalTitle);
                        setPdfUrl?.(null);
                        setLoading?.(true);

                        // Step 2: POST with blob response — uses axios interceptors (auth headers etc.)
                        const response = await Axios.post(req.url, req.body, {
                            responseType: "blob",
                        });

                        const blob = new Blob([response.data], { type: "application/pdf" });
                        const blobUrl = URL.createObjectURL(blob);

                        // Step 3: small delay for smooth UX then inject PDF
                        await new Promise((r) => setTimeout(r, 200));
                        setPdfUrl?.(blobUrl);

                    } catch (err) {
                        console.error("PDF preview failed:", err);
                        setPdfUrl?.(null); // modal stays open, shows "Unable to load PDF"
                    } finally {
                        setLoading?.(false);
                        isCallingRef.current = false;
                    }

                } else {
                    // update / delete — record exists, use GET
                    openPreview(viewAction.url, viewAction.title, true);
                }
                break;
            }

            case "customer_bank":
                setCustomerId(viewAction.payload.parentId);
                setExistValues(viewAction.payload.existValues);
                bankDisc.onOpen();
                break;
            case "contact_manager":
                setCustomerId(viewAction.payload.parentId);
                setExistValues(viewAction.payload.existValues);
                contactDisc.onOpen();
                break;
            case "customer_shipping_address":
                setCustomerId(viewAction.payload.parentId);
                setExistValues(viewAction.payload.existValues);
                shippingDisc.onOpen();
                break;
            case "customer_principle_owner":
                setCustomerId(viewAction.payload.parentId);
                setExistValues(viewAction.payload.existValues);
                ownerDisc.onOpen();
                break;
            case "customer_trader_references":
                setCustomerId(viewAction.payload.parentId);
                setExistValues(viewAction.payload.existValues);
                traderDisc.onOpen();
                break;
        }
    };

    const closeModal = () => {
        bankDisc.onClose(); contactDisc.onClose();
        shippingDisc.onClose(); ownerDisc.onClose(); traderDisc.onClose();
        setCustomerId(null); setExistValues(null);
    };

    const handleSingleAction = async (
        row: any,
        status: "approve" | "reject",
        reason: string
    ) => {
        try {
            await processRequest({ change_id: row.id, action: status, reason });
            refetch();
            closeConfirm();
        } catch (error: any) {
            toastError({
                title: "Error",
                description: error?.data?.message || "Action failed.",
            });
        }
    };

    // --------------- Columns ---------------
    const columns = useMemo<ColumnDef<any>[]>(
        () => [
            ...getColumns(config),
            {
                id: "actions",
                header: "Actions",
                cell: ({ row }) => (
                    <Menu>
                        <MenuButton
                            as={Button}
                            bg="#0C2556"
                            color="white"
                            _hover={{ color: "#0C2556", bg: "#fff" }}
                            _active={{ color: "#0C2556", bg: "#fff" }}
                            _focus={{ color: "#0C2556", bg: "#fff" }}
                            rightIcon={<ChevronDownIcon />}
                            size="sm"
                            variant="outline"
                        >
                            Actions
                        </MenuButton>
                        <MenuList minW="170px">
                            {config?.getViewAction && (
                                <MenuItem
                                    fontSize="sm"
                                    onClick={() => handleViewAction(row.original)}
                                >
                                    {(() => {
                                        const action = config?.getViewAction?.(row.original);
                                        return action?.type === "pdf" ? "Preview" : "View";
                                    })()}
                                </MenuItem>
                            )}
                            {row.original.action !== "create" && (
                                <MenuItem
                                    fontSize="sm"
                                    onClick={() => handleShowHistory(row.original)}
                                >
                                    Show History
                                </MenuItem>
                            )}
                        </MenuList>
                    </Menu>
                ),
            },
        ],
        [config, activeAction]
    );

    // ================= Render =================

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>
                <HStack justify="space-between">
                    <Heading as="h4" size="md" textTransform="capitalize">
                        {title}
                    </Heading>
                </HStack>

                <Box>
                    {/* ── Tabs + Filters bar ── */}
                    <HStack
                        justify="space-between"
                        align="center"
                        px={3} py={2}
                        bg="gray.50"
                        borderTopRadius="md"
                        border="1px solid"
                        borderColor="gray.200"
                        borderBottom="none"
                    >
                        {/* Left — Action tabs */}
                        <Tabs index={activeTabIndex} onChange={handleTabChange} variant="unstyled">
                            <TabList>
                                {ACTION_TABS.map((tab) => {
                                    const isActive = tab.value === activeAction;
                                    return (
                                        <Tab
                                            key={tab.value}
                                            bg={isActive ? "#0C2556" : "gray.200"}
                                            color={isActive ? "white" : "gray.600"}
                                            fontSize="sm"
                                            fontWeight="semibold"
                                            px={4} py={1.5}
                                            _hover={{ bg: isActive ? "#0C2556" : "gray.300" }}
                                            _selected={{}}
                                        >
                                            {tab.label}
                                        </Tab>
                                    );
                                })}
                            </TabList>
                        </Tabs>

                        {/* Right — Model + Status menus */}
                        <HStack spacing={3}>
                            {/* Model Menu */}
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    rightIcon={<ChevronDownIcon />}
                                    size="sm"
                                    variant="outline"
                                    bg="white"
                                    fontWeight="medium"
                                    minW="200px"
                                    textAlign="left"
                                >
                                    {modelOptions.find((o: any) => o.value === queryParams.model)?.label ?? "Select Model"}
                                </MenuButton>
                                <MenuList>
                                    {modelOptions.map((opt: any) => (
                                        <MenuItem
                                            key={opt.value}
                                            onClick={() =>
                                                setQueryParams((prev: any) => ({
                                                    ...prev,
                                                    model: opt.value,
                                                    page: 1,
                                                }))
                                            }
                                            fontWeight={queryParams.model === opt.value ? "bold" : "normal"}
                                            color={queryParams.model === opt.value ? "#0C2556" : "inherit"}
                                            bg={queryParams.model === opt.value ? "blue.50" : "white"}
                                        >
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>

                            {/* Status Menu */}
                            <Menu>
                                <MenuButton
                                    as={Button}
                                    rightIcon={<ChevronDownIcon />}
                                    size="sm"
                                    variant="outline"
                                    fontWeight="medium"
                                    minW="140px"
                                    textAlign="left"
                                    borderColor={statusColors.border}
                                    color={statusColors.color}
                                    bg={statusColors.bg}
                                    _hover={{ bg: statusColors.hover }}
                                >
                                    {STATUS_OPTIONS.find((o) => o.value === queryParams.status)?.label ?? "Status"}
                                </MenuButton>
                                <MenuList>
                                    {STATUS_OPTIONS.map((opt) => (
                                        <MenuItem
                                            key={opt.value}
                                            onClick={() =>
                                                setQueryParams((prev: any) => ({
                                                    ...prev,
                                                    status: opt.value,
                                                    page: 1,
                                                }))
                                            }
                                            fontWeight={queryParams.status === opt.value ? "bold" : "normal"}
                                            color={queryParams.status === opt.value ? "#0C2556" : "inherit"}
                                            bg={queryParams.status === opt.value ? "blue.50" : "white"}
                                        >
                                            {opt.label}
                                        </MenuItem>
                                    ))}
                                </MenuList>
                            </Menu>
                        </HStack>
                    </HStack>

                    {/* ── DataTable ── */}
                    <DataTable
                        columns={columns}
                        data={data}
                        sortBy={sortBy}
                        sortDirection={sortDirection}
                        onSortChange={(col, dir) => { setSortBy(col); setSortDirection(dir); }}
                        searchValue={searchTerm}
                        enableClientSideSearch={false}
                        loading={isLoading}
                        title={title}
                        status={queryParams.status}
                        onStatusChange={(next) =>
                            setQueryParams((prev: any) => ({ ...prev, status: next, page: 1 }))
                        }
                        onSearchChange={setSearchTerm}
                        searchPlaceholder={`Search ${title}`}
                        enablePagination
                        currentPage={paginationData?.current_page}
                        totalCount={paginationData?.total}
                        pageSize={queryParams.limit}
                        onPageChange={(page) =>
                            setQueryParams((prev: any) => ({ ...prev, page }))
                        }
                        onPageSizeChange={(limit) =>
                            setQueryParams((prev: any) => ({ ...prev, limit, page: 1 }))
                        }
                        stickyColumns={4}
                        showtitleBar={false}
                    />
                </Box>
            </Stack>

            {/* ── Confirmation Popup ── */}
            <ConfirmationWithReasonPopup
                isOpen={confirmMode !== null}
                onClose={closeConfirm}
                isLoading={isProcessing}
                onConfirm={(reason) => {
                    if (!confirmMode) return;
                    if (confirmMode === "single-approve" && activeRow)
                        handleSingleAction(activeRow, "approve", reason);
                    if (confirmMode === "single-reject" && activeRow)
                        handleSingleAction(activeRow, "reject", reason);
                }}
                headerText={confirmMode?.includes("approve") ? "Confirm Approval" : "Confirm Rejection"}
                bodyText={
                    confirmMode?.includes("approve")
                        ? "Are you sure you want to approve this request?"
                        : "Are you sure you want to reject this request?"
                }
                isInputRequired
            />

            {/* ── History Modal ── */}
            <HistoryModal
                isOpen={historyDisc.isOpen}
                onClose={closeHistoryModal}
                isLoading={isHistoryLoading}
                data={historyData?.data ?? []}
                isProcessing={isProcessing}
                displayProps={config?.displayProps ?? []}
                onApprove={(row) => openConfirm("single-approve", row)}
                onReject={(row) => openConfirm("single-reject", row)}
                config={config}
            />

            {/* ── View Modals ── */}
            <BankModal isOpen={bankDisc.isOpen} isEdit={false} isView
                customerId={customerId ?? ""} existValues={existValues} onClose={closeModal} />
            <ContactManagerModal isOpen={contactDisc.isOpen} isEdit={false} isView
                customerId={customerId ?? ""} existValues={existValues} onClose={closeModal} />
            <CustomerShippingAddressModal isOpen={shippingDisc.isOpen} isEdit={false} isView
                customerId={customerId ?? ""} existValues={existValues} onClose={closeModal} />
            <PrincipleOfOwnerModal isOpen={ownerDisc.isOpen} isEdit={false} isView
                customerId={customerId ?? ""} existValues={existValues} onClose={closeModal} />
            <TraderReferenceModal isOpen={traderDisc.isOpen} isEdit={false} isView
                customerId={customerId ?? ""} existValues={existValues} onClose={closeModal} />
        </SlideIn>
    );
};

export default CUDRequestMaster;