import { useState, useEffect } from "react";
import { ChevronRightIcon, DeleteIcon } from "@chakra-ui/icons";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    Button, FormControl, FormLabel, HStack, Heading,
    IconButton, Stack, Table, TableContainer, Tbody,
    Td, Text, Th, Thead, Tooltip, Tr,
} from "@chakra-ui/react";
import { Formiz, useForm, useFormFields } from "@formiz/core";
import { HiArrowNarrowLeft, HiOutlinePlus } from "react-icons/hi";
import { LuDownload } from "react-icons/lu";
import { Link, useNavigate, useParams, useLocation } from "react-router-dom";

import { FieldDayPicker } from "@/components/FieldDayPicker";
import { FieldHTMLEditor } from "@/components/FieldHTMLEditor";
import { FieldInput } from "@/components/FieldInput";
import { FieldSelect } from "@/components/FieldSelect";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";
import LoadingOverlay from "@/components/LoadingOverlay";
import { isFormFieldsChanged } from "@/helpers/FormChangeDetector";
import { useToastError } from "@/components/Toast";
import { getOptionValue, handleDownload, formatDate } from "@/helpers/commonHelper";
import { useSalesLogList, useSalesLogDetails } from '@/services/sales-log/service';
import {
    useSaveMaterialRequest,
    useMaterialRequestDetails,
    useMaterialRequestDropdowns,
} from "@/services/purchase/material-request/service";
import { useSearchPartNumber } from "@/services/master/spare/service";
import { useSubmasterItemIndex } from "@/services/submaster/service";
import { usePDFPreviewController } from "@/api/hooks/usePDFPreviewController";
import { endPoints } from "@/api/endpoints";
import { useUserContext } from "@/services/auth/UserContext";
import { CSVUploadButton } from "@/components/ReUsable/CSVUploadButton";
import { SubMasterModalForm } from '@/pages/Submaster/ModalForm';
import { PartNumberModal } from '@/components/Modals/SpareMaster';
import dayjs from 'dayjs';

// ─── Constants ────────────────────────────────────────────────────────────────

const FORM_KEYS = ["due_date", "priority_id", "sales_log_id", "remarks"];

// ─── Types ────────────────────────────────────────────────────────────────────

type NormalisedRow = {
    part_number_id: string;
    condition_id: string;
    qty: string;
    unit_of_measure_id: string;
    remark: string;
};

type MRRow = {
    rowKey: string;
    id?: any;
    part_number_id: any;
    condition_id: any;
    qty: any;
    unit_of_measure_id: any;
    remark: any;
    is_duplicate: boolean;
    sales_log_item_id: any;
    maxValue?: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_ROW = (): MRRow => ({
    rowKey: crypto.randomUUID(),
    part_number_id: "",
    condition_id: "",
    qty: "",
    unit_of_measure_id: "",
    remark: "",
    is_duplicate: false,
    sales_log_item_id: "",
    maxValue: undefined,
});

const normaliseRow = (row: any): NormalisedRow => ({
    part_number_id: String(row.part_number_id ?? ""),
    condition_id: String(row.condition_id ?? ""),
    qty: String(row.qty ?? ""),
    unit_of_measure_id: String(row.unit_of_measure_id ?? ""),
    remark: String(row.remark ?? ""),
});

const rowsChanged = (current: NormalisedRow[], initial: NormalisedRow[]) => {
    if (current.length !== initial.length) return true;
    return current.some((row, i) => JSON.stringify(row) !== JSON.stringify(initial[i]));
};

// ─── Component ────────────────────────────────────────────────────────────────

export const MaterialRequestForm = () => {
    const navigate = useNavigate();
    const toastError = useToastError();
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const { userInfo } = useUserContext();
    const location = useLocation();
    const [queryParams, setQueryParams] = useState<any>({});
    const [existingPartIDs, setExistingPartIDs] = useState<string[]>([]);
    const [mrType, setMRType] = useState<string>((location.state as any)?.type ?? "oe");
    const [disabledDatePicker, setDisabledDatePicker] = useState<boolean>(true);
    const [existingSELIds, setExistingSELIds] = useState<any[]>([]);

    // ── Rows state ─────────────────────────────────────────────────────────────
    const [rows, setRows] = useState<MRRow[]>([EMPTY_ROW()]);
    const [initialRows, setInitialRows] = useState<NormalisedRow[]>([]);

    // ── Part number search state ───────────────────────────────────────────────
    const [partNumberQuery, setPartNumberQuery] = useState("");
    const [changedRowIndex, setChangedRowIndex] = useState<number | null>(null);
    const [spareLoading, setSpareLoading] = useState(false);

    // ── Data fetching ──────────────────────────────────────────────────────────
    const { data: dropdownData, isLoading: l1, refetch: reloadDropDowns } = useMaterialRequestDropdowns();
    const { data: infoData, isLoading: l2 } = useMaterialRequestDetails(id, { enabled: isEdit });
    const { data: salesLogList, isLoading: l3 } = useSalesLogList({
        enabled: mrType === "sel",
        queryParams: { is_purchase_request_fulfilled: false, exist_ids: existingSELIds?.join(",") },
    });
    const { data: priorityList } = useSubmasterItemIndex("priorities", {});
    const { data: conditionData } = useSubmasterItemIndex("conditions", {});
    const { data: uomData } = useSubmasterItemIndex("unit-of-measures", {});
    const { data: spareSearchData, refetch: reloadSpares } = useSearchPartNumber(queryParams);

    // ── Derived options ────────────────────────────────────────────────────────
    const priorityOptions = dropdownData?.priorities ?? [];
    const salesLogOptions = salesLogList?.data ?? [];
    const priorityItems = (priorityList?.data ?? []) as TODO[];
    const conditionOptions = conditionData?.data?.map((c: any) => ({ value: c.id, label: c.name })) ?? [];
    const uomOptions = uomData?.data?.map((u: any) => ({ value: u.id, label: u.name })) ?? [];
    const spareOptions = spareSearchData?.data?.map((s: any) => ({ value: s.id, label: s.name })) ?? [];

    // ── Form ───────────────────────────────────────────────────────────────────
    const saveEndpoint = useSaveMaterialRequest();
    const [initialValues, setInitialValues] = useState<any>(null);

    const handleAddNewSuccess =
        (
            fieldName: any,
            refetch: () => void,
            options?: {
                onValueChange?: (val: any, fullData?: any) => void;
            }
        ) =>
            (data: any) => {
                const record = data?.data ?? data; // 🔥 FIX
                console.log(record, fieldName)
                const id = record?.id;

                setTimeout(() => {
                    refetch();

                    setTimeout(() => {
                        form.setValues({ [fieldName]: id });
                        options?.onValueChange?.(id, record);
                    }, 50);
                }, 100);
            };

    const form = useForm({
        onValidSubmit: (values) => {
            if (rows.some(r => r.is_duplicate)) {
                toastError({
                    title: "Duplicate entries found",
                    description: "Same Part Number added with same condition multiple times",
                });
                return;
            }
            const payload: any = Object.fromEntries(FORM_KEYS.map(k => [k, values[k]]));
            payload.type = mrType;
            payload.due_date = formatDate(fields['due_date'].value) as string;
            payload.items = rows.map(row => ({
                part_number_id: values[`part_number_${row.rowKey}`],
                condition_id: values[`condition_${row.rowKey}`],
                qty: Number(values[`qty_${row.rowKey}`]),
                unit_of_measure_id: values[`uom_${row.rowKey}`],
                remark: values[`remark_${row.rowKey}`],
                ...(row.sales_log_item_id && { sales_log_item_id: row.sales_log_item_id }),
                ...(row.id && { id: row.id }),
            }));
            saveEndpoint.mutate(
                isEdit ? { id, ...payload } : payload,
                { onSuccess: () => navigate('/purchase/material-request/master', { state: { type: mrType } }) }
            );
        },
    });

    const fields = useFormFields({ connect: form });

    // ── Sales log details (driven by sales_log_id form field) ─────────────────
    const selectedSalesLogId = fields["sales_log_id"]?.value;
    const { data: salesLogData, isLoading: l4 } = useSalesLogDetails(
        selectedSalesLogId,
        { enabled: !!selectedSalesLogId }
    );

    // ── Single loading flag covers all data fetches ────────────────────────────
    const isLoading = l1 || l2 || l3 || l4;

    // ── PDF Preview ────────────────────────────────────────────────────────────
    const previewPDF = usePDFPreviewController({ url: endPoints.preview_post.material_request, title: "MR PREVIEW" });

    const handleOpenPreview = () => {
        const popupVariables: any = { user_id: userInfo.id };
        Object.keys(fields).forEach(key => { popupVariables[key] = fields[key].value; });
        popupVariables.type = mrType;
        popupVariables.due_date = formatDate(fields['due_date'].value) as string;
        popupVariables.items = rows.map(row => ({
            part_number_id: fields[`part_number_${row.rowKey}`].value,
            condition_id: fields[`condition_${row.rowKey}`].value,
            qty: Number(fields[`qty_${row.rowKey}`].value),
            unit_of_measure_id: fields[`uom_${row.rowKey}`].value,
            remark: fields[`remark_${row.rowKey}`].value,
        }));
        previewPDF.open(popupVariables);
    };

    // ── Row helpers ────────────────────────────────────────────────────────────
    const applyRowsToForm = (prefilled: MRRow[]) => {
        prefilled.forEach(item => {
            form.setValues({
                [`part_number_${item.rowKey}`]: item.part_number_id,
                [`condition_${item.rowKey}`]: item.condition_id,
                [`qty_${item.rowKey}`]: item.qty,
                [`uom_${item.rowKey}`]: item.unit_of_measure_id,
                [`remark_${item.rowKey}`]: item.remark,
            });
        });
    };

    const addRow = () => setRows(prev => [...prev, EMPTY_ROW()]);
    const deleteRow = (rowKey: string) => setRows(prev => prev.filter(r => r.rowKey !== rowKey));

    const handleInputChange = (field: string, value: any, index: number) => {
        setRows(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            const seen = new Set<string>();
            return next.map(row => {
                const key = `${row.part_number_id}-${row.condition_id}`;
                const isDuplicate = !!(row.part_number_id && row.condition_id && seen.has(key));
                if (row.part_number_id && row.condition_id) seen.add(key);
                return { ...row, is_duplicate: isDuplicate };
            });
        });
    };

    const setDuedate = (priority: any) => {
        const selected = priorityItems?.find((u) => String(u.id) === String(priority));
        const daysToAdd = selected?.days || 0;
        if (daysToAdd === 0) {
            setDisabledDatePicker(false);
            form.setValues({ due_date: '' });
        } else {
            setDisabledDatePicker(true);
            form.setValues({ due_date: dayjs().add(daysToAdd, 'day') });
        }
    };

    // ── Remarks ────────────────────────────────────────────────────────────────
    const handleRemarksChange = (value: string) => form.setValues({ remarks: value });

    // ── Edit prefill ───────────────────────────────────────────────────────────
    useEffect(() => {
        if (!infoData?.data) return;
        const s = infoData.data;
        setMRType(s.type);
        setExistingSELIds([s.sales_log_id]);

        const initValues = Object.fromEntries(FORM_KEYS.map(k => [k, (s as any)[k]]));
        setInitialValues(initValues);
        form.setValues(initValues);
        handleRemarksChange(s.remarks ?? '');

        if (!s.items?.length) return;
        const prefilled: MRRow[] = s.items.map((item: any) => ({
            rowKey: crypto.randomUUID(),
            id: item.id,
            part_number_id: item.part_number_id,
            condition_id: item.condition_id,
            qty: item.qty,
            unit_of_measure_id: item.unit_of_measure_id,
            remark: item.remark ?? "",
            sales_log_item_id: item.sales_log_item_id ?? "",
            is_duplicate: false,
        }));
        setRows(prefilled);
        setInitialRows(prefilled.map(normaliseRow));
        applyRowsToForm(prefilled);
    }, [infoData]);

    // ── Sales log selection ────────────────────────────────────────────────────
    useEffect(() => {
        if (!salesLogData?.data) return;

        const selData = salesLogData.data;
        const validItems = selData.items?.filter(
            (item: any) => item.is_purchase_request_fulfilled === false
        ) ?? [];

        form.setValues({
            due_date: selData?.due_date,
            priority_id: selData?.priority_id
        });

        if (!validItems.length) return;

        if (!isEdit) {
            const prefilled: MRRow[] = validItems.map((item: any) => ({
                rowKey: crypto.randomUUID(),
                sales_log_item_id: item.id,
                part_number_id: item.part_number_id,
                condition_id: item.condition_id,
                qty: item.qty,
                unit_of_measure_id: item.unit_of_measure_id,
                remark: item.remark ?? "",
                is_duplicate: false,
                maxValue: item.qty,
            }));
            setRows(prefilled);
            setInitialRows(prefilled.map(normaliseRow));
            applyRowsToForm(prefilled);
        } else {
            const selQtyMap = new Map<string, number>(
                validItems.map((item: any) => [String(item.id), item.qty])
            );
            setRows(prev => prev.map(row => ({
                ...row,
                maxValue: row.sales_log_item_id
                    ? selQtyMap.get(String(row.sales_log_item_id))
                    : undefined,
            })));
        }
    }, [salesLogData]);

    // ── Change detection ───────────────────────────────────────────────────────
    const isHeaderChanged = isFormFieldsChanged({ fields, initialValues, keys: FORM_KEYS });

    const liveRows: NormalisedRow[] = rows.map(row => normaliseRow({
        part_number_id: fields[`part_number_${row.rowKey}`]?.value ?? row.part_number_id,
        condition_id: fields[`condition_${row.rowKey}`]?.value ?? row.condition_id,
        qty: fields[`qty_${row.rowKey}`]?.value ?? row.qty,
        unit_of_measure_id: fields[`uom_${row.rowKey}`]?.value ?? row.unit_of_measure_id,
        remark: fields[`remark_${row.rowKey}`]?.value ?? row.remark,
    }));

    const isFormValuesChanged = isHeaderChanged || (isEdit && rowsChanged(liveRows, initialRows));

    // ── Derived display values ─────────────────────────────────────────────────
    const totalQty = rows.reduce((acc, row) => acc + (Number(fields[`qty_${row.rowKey}`]?.value) || 0), 0);
    const totalItems = rows.filter(row => fields[`part_number_${row.rowKey}`]?.value).length;
    const isSaving = saveEndpoint.isLoading;
    const title = isEdit ? "Edit Material Request" : "Add Material Request";
    const isSelWithLog = mrType === 'sel' && !!selectedSalesLogId;
    const sectionStyle = { bg: "blue.100", p: 4, rounded: "md", border: "1px solid", borderColor: "blue.300" };

    // ─── Render ────────────────────────────────────────────────────────────────

    useEffect(() => {
        setQueryParams((prev: any) => ({
            ...prev,
            query: partNumberQuery
        }));
    }, [partNumberQuery]);

    useEffect(() => {
        const exists = [
            ...new Set([...(id ? [id] : []), ...(existingPartIDs ?? [])]),
        ];

        setQueryParams((prev: any) => {
            // Clone previous state
            const updated = { ...prev };

            if (exists.length > 0) {
                updated.exist_ids = exists.join(',');
            } else {
                delete updated.exist_ids; // ✅ remove key completely
            }

            return updated;
        });
    }, [existingPartIDs]);

    useEffect(() => {
        const ids = rows
            .map((row) => row.part_number_id)
            .filter((id) => !!id); // remove empty/null

        setExistingPartIDs([...new Set(ids)]);
    }, [rows]);

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* ── Page header ── */}
                <HStack justify="space-between">
                    <Stack spacing={0}>
                        <Breadcrumb fontWeight="medium" fontSize="sm" separator={<ChevronRightIcon boxSize={6} color="gray.500" />}>
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/material-management/material-request">Material Request</BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbItem isCurrentPage color="gray.500">
                                <BreadcrumbLink>{title}</BreadcrumbLink>
                            </BreadcrumbItem>
                        </Breadcrumb>
                        <Heading as="h4" size="md">{title}</Heading>
                    </Stack>
                    <ResponsiveIconButton variant="@primary" icon={<HiArrowNarrowLeft />} size="sm" onClick={() => navigate(-1)}>
                        Back
                    </ResponsiveIconButton>
                </HStack>

                <LoadingOverlay isLoading={isLoading}>
                    <Stack spacing={2} p={4} bg="white" borderRadius="md" boxShadow="md">
                        <Text fontSize="md" fontWeight="700">Material Request</Text>

                        <Formiz autoForm connect={form}>
                            <FieldInput name="remarks" size="sm" sx={{ display: "none" }} />

                            <Stack spacing={2}>

                                {/* ── Header fields ── */}
                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle}>
                                    {mrType === "sel" && (
                                        <FieldSelect
                                            label="Sales Log"
                                            name="sales_log_id"
                                            placeholder="Select..."
                                            options={salesLogOptions}
                                            selectProps={{ isLoading: l3 }}
                                            isClearable
                                            size="sm"
                                            isDisabled={isEdit}
                                            className={isEdit ? 'disabled-input' : ''}
                                        />
                                    )}
                                    {mrType === "wo" && (
                                        <FieldSelect
                                            label="Work Order"
                                            name="work_order_id"
                                            placeholder="Select..."
                                            options={[]}
                                            isClearable
                                            size="sm"
                                        />
                                    )}
                                    <FieldSelect
                                        label="Priority"
                                        name="priority_id"
                                        placeholder="Select..."
                                        options={priorityOptions}
                                        required="Priority is required"
                                        size="sm"
                                        onValueChange={setDuedate}
                                        isDisabled={mrType !== 'oe'}
                                        className={mrType !== 'oe' ? 'disabled-input' : ''}
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p) => (
                                                <SubMasterModalForm
                                                    {...p}
                                                    model="priorities"
                                                    isEdit={false}
                                                />
                                            ),
                                            onSuccess: handleAddNewSuccess(
                                                'priority_id',
                                                reloadDropDowns
                                            ),
                                        }}
                                        selectProps={{
                                            type: 'creatable',
                                            noOptionsMessage: () => 'No options found',
                                            isLoading: l1,
                                        }}
                                    />
                                    <FieldDayPicker
                                        label="Due Date"
                                        name="due_date"
                                        placeholder="Select due date"
                                        required="Due Date is required"
                                        size="sm"
                                        dayPickerProps={{ inputProps: { isDisabled: disabledDatePicker } }}
                                        isDisabled={mrType !== 'oe'}
                                    />
                                </Stack>

                                {/* ── Items toolbar (OE only) ── */}
                                {(mrType === 'oe' && !isLoading) && (
                                    <HStack justify="space-between" mt={3}>
                                        <Text fontSize="md" fontWeight="700">Items</Text>
                                        <HStack ml="auto">
                                            <Button
                                                leftIcon={<LuDownload />}
                                                colorScheme="blue"
                                                size="sm"
                                                onClick={() => handleDownload(import.meta.env.VITE_MR_SAMPLE_PARTNUMBERS_CSV)}
                                            >
                                                Download Sample
                                            </Button>

                                            {/* ── Reusable CSV Upload ── */}
                                            <CSVUploadButton<MRRow>
                                                createEmptyRow={EMPTY_ROW}
                                                fieldMappings={[
                                                    {
                                                        csvKey: "part_number_id",
                                                        rowKey: "part_number_id",
                                                        transform: (v) => getOptionValue(v, spareOptions) ?? "",
                                                    },
                                                    {
                                                        csvKey: "condition_id",
                                                        rowKey: "condition_id",
                                                        transform: (v) => getOptionValue(v, conditionOptions) ?? "",
                                                    },
                                                    {
                                                        csvKey: "qty",
                                                        rowKey: "qty",
                                                    },
                                                    {
                                                        csvKey: "unit_of_measure_id",
                                                        rowKey: "unit_of_measure_id",
                                                        transform: (v) => getOptionValue(v, uomOptions) ?? "",
                                                    },
                                                    {
                                                        csvKey: "remark",
                                                        rowKey: "remark",
                                                    },
                                                ]}
                                                duplicateCheck={{
                                                    keys: ["part_number_id"],
                                                    label: "Part Number",
                                                    existingRows: rows,
                                                }}
                                                onUpload={(mapped) =>
                                                    setRows(prev => [...prev.filter(r => r.part_number_id), ...mapped])
                                                }
                                                confirmHeaderText="Upload Items CSV"
                                                confirmBodyText="Are you sure you want to upload this file? Existing rows with part numbers will be kept."
                                                buttonLabel="Upload Items"
                                                colorScheme="green"
                                                size="sm"
                                                maxRows={100}
                                            />
                                        </HStack>
                                    </HStack>
                                )}

                                {/* ── Items table ── */}
                                <TableContainer rounded="md" overflow="auto" border="1px" borderColor="gray.500" borderRadius="md" boxShadow="md">
                                    <Table variant="simple" size="sm">
                                        <Thead bg="gray.500">
                                            <Tr>
                                                <Th color="white">S.No.</Th>
                                                <Th color="white">Part Number</Th>
                                                <Th color="white">Condition</Th>
                                                <Th color="white">Quantity</Th>
                                                <Th color="white">UOM</Th>
                                                <Th color="white">Remarks</Th>
                                                <Th color="white" isNumeric>Action</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {rows.map((row, index) => {
                                                const isPartSelected = !!fields[`part_number_${row.rowKey}`]?.value;
                                                const isFieldDisabled = isSelWithLog || !isPartSelected;
                                                const isLastRow = index === rows.length - 1;

                                                return (
                                                    <Tr key={row.rowKey} background={row.is_duplicate ? "yellow.100" : ""}>
                                                        <Td><Text fontSize="medium">{index + 1}.</Text></Td>

                                                        <Td>
                                                            <FieldSelect
                                                                name={`part_number_${row.rowKey}`}
                                                                size="sm"
                                                                menuPortalTarget={document.body}
                                                                required="Part Number is required"
                                                                placeholder="Search part number"
                                                                options={spareOptions}
                                                                isClearable
                                                                defaultValue={row.part_number_id || ""}
                                                                onValueChange={(v) => handleInputChange("part_number_id", v, index)}

                                                                style={{ minWidth: 180 }}
                                                                isDisabled={isSelWithLog}
                                                                className={isSelWithLog ? 'disabled-input' : ''}
                                                                addNew={{
                                                                    label: '+ Add New',
                                                                    CreateModal: (p) => (
                                                                        <PartNumberModal
                                                                            {...p}
                                                                            onClose={() => {
                                                                                p.onClose?.();
                                                                            }}

                                                                            onSuccess={(data: TODO) => {
                                                                                setExistingPartIDs(prev => [...prev, data?.id]);
                                                                                setTimeout(() => {
                                                                                    handleAddNewSuccess(
                                                                                        `part_number_${row.rowKey}`,
                                                                                        reloadSpares
                                                                                    )(data);

                                                                                }, 50);

                                                                            }}
                                                                        />
                                                                    )
                                                                }}
                                                                selectProps={{
                                                                    type: 'creatable',
                                                                    noOptionsMessage: () => "No parts found",
                                                                    onInputChange: (val: string) => {
                                                                        setSpareLoading(true);
                                                                        setChangedRowIndex(index);
                                                                        setTimeout(() => { setPartNumberQuery(val); setSpareLoading(false); }, 600);
                                                                    },
                                                                    isLoading: changedRowIndex === index && spareLoading || l4
                                                                }}
                                                            />
                                                        </Td>

                                                        <Td>
                                                            <FieldSelect
                                                                name={`condition_${row.rowKey}`}
                                                                size="sm"
                                                                menuPortalTarget={document.body}
                                                                required="Condition is required"
                                                                placeholder="Select..."
                                                                options={conditionOptions}
                                                                defaultValue={row.condition_id || ""}
                                                                onValueChange={(v) => handleInputChange("condition_id", v, index)}
                                                                style={{ minWidth: 130 }}
                                                                isDisabled={isFieldDisabled}
                                                                addNew={{
                                                                    label: '+ Add New',
                                                                    CreateModal: (p) => (
                                                                        <SubMasterModalForm
                                                                            {...p}
                                                                            model="conditions"
                                                                            isEdit={false}
                                                                        />
                                                                    ),
                                                                    onSuccess: handleAddNewSuccess(
                                                                        `condition_${row.rowKey}`,
                                                                        reloadDropDowns
                                                                    ),
                                                                }}
                                                                selectProps={{
                                                                    type: 'creatable',
                                                                    noOptionsMessage: () => 'No options found',
                                                                    isLoading: l1,
                                                                }}
                                                                className={isFieldDisabled ? 'disabled-input' : ''}
                                                            />
                                                        </Td>

                                                        <Td>
                                                            <FieldInput
                                                                name={`qty_${row.rowKey}`}
                                                                size="sm"
                                                                required="Quantity is required"
                                                                type="integer"
                                                                placeholder="Qty"
                                                                defaultValue={row.qty || ""}
                                                                width="100px"
                                                                maxValue={mrType === 'sel' ? row.maxValue : undefined}
                                                                maxLength={9}
                                                                isDisabled={!isPartSelected}
                                                                onValueChange={(v) => handleInputChange("qty", v, index)}
                                                            />
                                                        </Td>

                                                        <Td>
                                                            <FieldSelect
                                                                name={`uom_${row.rowKey}`}
                                                                size="sm"
                                                                menuPortalTarget={document.body}
                                                                required="UOM is required"
                                                                placeholder="Select..."
                                                                options={uomOptions}
                                                                defaultValue={row.unit_of_measure_id || ""}
                                                                onValueChange={(v) => handleInputChange("unit_of_measure_id", v, index)}
                                                                style={{ minWidth: 120 }}
                                                                isDisabled={isFieldDisabled}
                                                                className={isFieldDisabled ? 'disabled-input' : ''}
                                                                addNew={{
                                                                    label: '+ Add New',
                                                                    CreateModal: (p) => (
                                                                        <SubMasterModalForm
                                                                            {...p}
                                                                            model="unit_of_measures"
                                                                            isEdit={false}
                                                                        />
                                                                    ),
                                                                    onSuccess: handleAddNewSuccess(
                                                                        `uom_${row.rowKey}`,
                                                                        reloadDropDowns
                                                                    ),
                                                                }}
                                                                selectProps={{
                                                                    type: 'creatable',
                                                                    noOptionsMessage: () => 'No options found',
                                                                    isLoading: l1,
                                                                }}
                                                            />
                                                        </Td>

                                                        <Tooltip
                                                            label={fields[`remark_${row.rowKey}`]?.value ?? ""}
                                                            placement="top" hasArrow color="white"
                                                            isDisabled={String(fields[`remark_${row.rowKey}`]?.value ?? "").length <= 20}
                                                        >
                                                            <Td>
                                                                <FieldInput
                                                                    name={`remark_${row.rowKey}`}
                                                                    size="sm"
                                                                    placeholder="Remark"
                                                                    defaultValue={row.remark || ""}
                                                                    maxLength={60}
                                                                    isDisabled={!isPartSelected}
                                                                />
                                                            </Td>
                                                        </Tooltip>

                                                        <Td isNumeric>
                                                            {(isLastRow && mrType === 'oe') && (
                                                                <IconButton aria-label="Add Row" variant="@primary" size="sm"
                                                                    icon={<HiOutlinePlus />} onClick={addRow} mr={2} />
                                                            )}
                                                            <IconButton aria-label="Delete Row" colorScheme="red" size="sm"
                                                                icon={<DeleteIcon />} onClick={() => deleteRow(row.rowKey)}
                                                                isDisabled={rows.length <= 1} />
                                                        </Td>
                                                    </Tr>
                                                );
                                            })}
                                        </Tbody>
                                    </Table>
                                </TableContainer>

                                {/* ── Totals ── */}
                                <HStack mt={3}>
                                    <Text>Total Qty: <Text as="span" ml={3} fontWeight="bold">{totalQty}</Text></Text>
                                    <Text ml={3}>Total Line Items: <Text as="span" ml={3} fontWeight="bold">{totalItems}</Text></Text>
                                </HStack>

                                {/* ── Remarks editor ── */}
                                <Stack>
                                    <FormControl>
                                        <FormLabel>Remarks</FormLabel>
                                        <FieldHTMLEditor
                                            onValueChange={handleRemarksChange}
                                            maxLength={import.meta.env.VITE_ELABORATE_REMARKS_LENGTH}
                                            placeHolder="Enter Remarks Here"
                                            defaultValue={isEdit && infoData?.data?.remarks ? infoData.data.remarks : ''}
                                        />
                                    </FormControl>
                                </Stack>

                            </Stack>

                            {/* ── Actions ── */}
                            <Stack direction={{ base: "column", md: "row" }} justify="center" alignItems="center" mt={4}>
                                <Button
                                    type="submit"
                                    colorScheme="brand"
                                    isLoading={isSaving}
                                    isDisabled={isSaving || (isEdit ? (!isFormValuesChanged || !form.isValid) : false)}
                                >
                                    {isEdit ? "Update" : "Submit"}
                                </Button>
                                <Button
                                    onClick={handleOpenPreview}
                                    colorScheme="green"
                                    isDisabled={!form.isValid}
                                    isLoading={previewPDF.isLoading}
                                >
                                    Preview
                                </Button>
                            </Stack>

                        </Formiz>
                    </Stack>
                </LoadingOverlay>
            </Stack>
        </SlideIn>
    );
};

export default MaterialRequestForm;