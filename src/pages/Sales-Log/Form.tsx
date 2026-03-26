import { useState, useEffect, useMemo } from "react";
import { ChevronRightIcon, DeleteIcon } from "@chakra-ui/icons";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    Button, FormControl, FormLabel, HStack, Heading,
    IconButton, Stack, Table, TableContainer, Tbody,
    Td, Text, Th, Thead, Tooltip, Tr,
} from "@chakra-ui/react";
import { Formiz, useForm, useFormFields } from "@formiz/core";
import { HiArrowNarrowLeft, HiOutlinePlus } from "react-icons/hi";
import { LuUpload, LuDownload } from "react-icons/lu";
import { Link, useNavigate, useParams } from "react-router-dom";

import { FieldDayPicker } from "@/components/FieldDayPicker";
import FieldDisplay from "@/components/FieldDisplay";
import { FieldHTMLEditor } from "@/components/FieldHTMLEditor";
import { FieldInput } from "@/components/FieldInput";
import { FieldSelect } from "@/components/FieldSelect";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";
import LoadingOverlay from "@/components/LoadingOverlay";
import { isFormFieldsChanged } from "@/helpers/FormChangeDetector";
import { useToastError } from "@/components/Toast";
import ConfirmationPopup from "@/components/ConfirmationPopup";
import { parseCSV, getOptionValue, handleDownload, formatContactAddress, formatShippingAddress } from "@/helpers/commonHelper";

import { useSaveSalesLog, useSalesLogDetails, useSalesLogDropdowns } from "@/services/sales-log/service";
import { useCustomerRelationIndex, useCustomerDetails } from "@/services/master/customer/service";
import { useSearchPartNumber } from "@/services/master/spare/service";
import { useSubmasterItemIndex } from "@/services/submaster/service";
import { useUserContext } from '@/services/auth/UserContext';
import { usePDFPreviewController } from '@/api/hooks/usePDFPreviewController';
import { endPoints } from '@/api/endpoints';
import dayjs from 'dayjs';
// ─── Constants ────────────────────────────────────────────────────────────────

const FORM_KEYS = [
    "cust_rfq_no", "cust_rfq_date", "due_date",
    "customer_id", "mode_of_receipt_id", "priority_id",
    "customer_contact_manager_id", "customer_shipping_address_id",
    "currency_id", "fob_id", "payment_mode_id", "payment_term_id", "remarks"
];

const EMPTY_ROW = () => ({
    rowKey: crypto.randomUUID(),
    part_number_id: "", condition_id: "", qty: "",
    unit_of_measure_id: "", remark: "", is_duplicate: false,
});

// ─── Component ────────────────────────────────────────────────────────────────

export const SalesLogForm = () => {
    const navigate = useNavigate();
    const toastError = useToastError();
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const [disabledDatePicker, setDisabledDatePicker] = useState<boolean>(true);
    const { userInfo } = useUserContext();
    // ── Dropdowns ──────────────────────────────────────────────────────────────
    const { data: dropdownData, isLoading: dropdownLoading } = useSalesLogDropdowns();
    const customerOptions = dropdownData?.customers ?? [];
    const modeOfReceiptOptions = dropdownData?.mode_of_receipts ?? [];
    const priorityOptions = dropdownData?.priorities ?? [];
    const currencyOptions = dropdownData?.currencies ?? [];
    const fobOptions = dropdownData?.fobs ?? [];
    const paymentModeOptions = dropdownData?.payment_modes ?? [];
    const paymentTermOptions = dropdownData?.payment_terms ?? [];


    // ── Customer-scoped relations ──────────────────────────────────────────────
    const [selectedCustomerId, setSelectedCustomerId] = useState<any>(null);
    const [selectedContactManagerId, setSelectedContactManagerId] = useState<any>(null);
    const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<any>(null);

    const { data: customerInfo, isLoading: customerInfoLoading } = useCustomerDetails(selectedCustomerId, { enabled: !!selectedCustomerId });

    const { data: contactManagerList, isLoading: cmLoading } = useCustomerRelationIndex(
        selectedCustomerId, "contact-managers"
    );
    const { data: shippingAddressList, isLoading: saLoading } = useCustomerRelationIndex(
        selectedCustomerId, "shipping-addresses"
    );

    const contactManagerOptions = contactManagerList?.data?.map((i: any) => ({ value: i.id, label: i.attention })) ?? [];
    const shippingAddressOptions = shippingAddressList?.data?.map((i: any) => ({ value: i.id, label: `${i.consignee_name} — ${i.country}` })) ?? [];

    // ── Derive address display strings directly from the fetched lists ─────────
    // No extra API call needed — find the selected item in the already-fetched list
    const selectedContact = useMemo(() =>
        contactManagerList?.data?.find((i: any) => String(i.id) === String(selectedContactManagerId)),
        [contactManagerList, selectedContactManagerId]
    );

    const selectedShipping = useMemo(() =>
        shippingAddressList?.data?.find((i: any) => String(i.id) === String(selectedShippingAddressId)),
        [shippingAddressList, selectedShippingAddressId]
    );

    const contactAddressDisplay = selectedContact ? formatContactAddress(selectedContact) : "—";
    const shippingAddressDisplay = selectedShipping ? formatShippingAddress(selectedShipping) : "—";

    // ── Part number search ─────────────────────────────────────────────────────
    const [partNumberQuery, setPartNumberQuery] = useState("");
    const [changedRowIndex, setChangedRowIndex] = useState<number | null>(null);
    const [spareLoading, setSpareLoading] = useState(false);
    const { data: spareSearchData } = useSearchPartNumber({ query: partNumberQuery });
    const spareOptions = spareSearchData?.data?.map((s: any) => ({ value: s.id, label: s.name })) ?? [];
    const { data: priorityList } = useSubmasterItemIndex("priorities", {});
    const priorityItems: TODO[] = priorityList?.data ?? [];
    // ── Conditions + UOM ───────────────────────────────────────────────────────
    const { data: conditionData } = useSubmasterItemIndex("conditions", {});
    const conditionOptions = conditionData?.data?.map((c: any) => ({ value: c.id, label: c.name })) ?? [];

    const { data: uomData } = useSubmasterItemIndex("unit-of-measures", {});
    const uomOptions = uomData?.data?.map((u: any) => ({ value: u.id, label: u.name })) ?? [];
    const [isCustomerChanged, setIsCustomerChanged] = useState(false);
    const [isInitialAutoFillDone, setIsInitialAutoFillDone] = useState(false);

    // ── Items rows ─────────────────────────────────────────────────────────────
    const [rows, setRows] = useState([EMPTY_ROW()]);

    const setDuedate = (priority: any) => {
        let daysToAdd: number = 0;
        const selected = priorityItems?.find((u) => String(u.id) === String(priority));
        daysToAdd = selected?.days || 0;
        if (daysToAdd === 0) {
            setDisabledDatePicker(false);
            form.setValues({ [`due_date`]: '' });
        } else {
            setDisabledDatePicker(true);
            form.setValues({
                [`due_date`]: dayjs().add(daysToAdd, 'day'),
            });
        }
    };

    const previewPDF = usePDFPreviewController({
        url: endPoints.preview_post.sales_log,
        title: "SEL PREVIEW",
    });

    const handleOpenPreview = () => {
        let popupVariables: any = {};
        popupVariables.user_id = userInfo.id;
        const items = rows.map(row => ({
            part_number_id: fields[`part_number_${row.rowKey}`].value,
            condition_id: fields[`condition_${row.rowKey}`].value,
            qty: Number(fields[`qty_${row.rowKey}`].value),
            unit_of_measure_id: fields[`uom_${row.rowKey}`].value,
            remark: fields[`remark_${row.rowKey}`].value,
        }));
        Object.keys(fields).forEach(function (key) {
            popupVariables[key] = fields[key].value;
        });
        popupVariables.items = items;
        console.log(popupVariables);
        // 🔥 IMPORTANT: open modal FIRST (empty state)
        previewPDF.open();

        // 🔥 THEN call API
        previewPDF.open(popupVariables);
    };


    const handleInputChange = (field: string, value: any, index: number) => {
        setRows(prev => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: value };
            const seen = new Set();
            return next.map(row => {
                const key = `${row.part_number_id}-${row.condition_id}`;
                if (row.part_number_id && row.condition_id) {
                    row.is_duplicate = seen.has(key);
                    seen.add(key);
                } else {
                    row.is_duplicate = false;
                }
                return { ...row };
            });
        });
    };

    const addRow = () => setRows(prev => [...prev, EMPTY_ROW()]);
    const deleteRow = (rowKey: string) => setRows(prev => prev.filter(r => r.rowKey !== rowKey));

    // ── File upload ────────────────────────────────────────────────────────────
    const [fileKey, setFileKey] = useState(0);
    const [uploadedFile, setUploadedFile] = useState<any>(null);
    const [openConfirmation, setOpenConfirmation] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setUploadedFile(file); setOpenConfirmation(true); }
        setFileKey(k => k + 1);
    };

    const handleConfirm = async () => {
        const parsedRows: any = await parseCSV(uploadedFile);
        console.log(parsedRows)
        if (parsedRows.length > 100) {
            toastError({ title: "Uploaded CSV has more than 100 rows. Max allowed is 100." });
            setOpenConfirmation(false);
            return;
        }
        const mapped = parsedRows.map((row: any) => ({
            ...EMPTY_ROW(),
            part_number_id: getOptionValue(row.part_number_id, spareOptions) ?? "",
            condition_id: getOptionValue(row.condition_id, conditionOptions) ?? "",
            qty: row.qty ?? "",
            unit_of_measure_id: getOptionValue(row.unit_of_measure_id, uomOptions) ?? "",
            remark: row.remark ?? "",
        }));
        setRows(prev => [...prev.filter(r => r.part_number_id), ...mapped]);
        setOpenConfirmation(false);
    };

    // ── Remarks ────────────────────────────────────────────────────────────────
    const handleRemarksChange = (value: string) => form.setValues({ remarks: value });

    // ── Edit prefill ───────────────────────────────────────────────────────────
    const { data: salesLogData, isLoading: infoLoading } = useSalesLogDetails(id, { enabled: !!id });
    const saveEndpoint = useSaveSalesLog();
    const [initialValues, setInitialValues] = useState<any>(null);

    const form = useForm({
        onValidSubmit: (values) => {
            if (rows.some(r => r.is_duplicate)) {
                toastError({ title: "Duplicate entries found", description: "Same Part Number added with same condition multiple times" });
                return;
            }
            const payload: any = Object.fromEntries(FORM_KEYS.map(k => [k, values[k]]));
            payload.remarks = values.remarks;
            payload.items = rows.map(row => ({
                part_number_id: values[`part_number_${row.rowKey}`],
                condition_id: values[`condition_${row.rowKey}`],
                qty: Number(values[`qty_${row.rowKey}`]),
                unit_of_measure_id: values[`uom_${row.rowKey}`],
                remark: values[`remark_${row.rowKey}`],
            }));
            saveEndpoint.mutate(
                isEdit ? { id, ...payload } : payload,
                { onSuccess: () => navigate("/sales-management/sales-log/master") }
            );
        },
    });

    const fields = useFormFields({ connect: form });

    useEffect(() => {
        if (!salesLogData?.data) return;
        const s = salesLogData.data;
        const values = Object.fromEntries(FORM_KEYS.map(k => [k, (s as any)[k]]));
        setSelectedCustomerId(s.customer_id);
        setSelectedContactManagerId(s.customer_contact_manager_id);
        setSelectedShippingAddressId(s.customer_shipping_address_id);
        setInitialValues(values);
        form.setValues(values);

        if (s.items?.length) {
            const prefilled = s.items.map((item: any) => ({
                rowKey: item.id, part_number_id: item.part_number_id,
                condition_id: item.condition_id, qty: item.qty,
                unit_of_measure_id: item.unit_of_measure_id,
                remark: item.remark ?? "", is_duplicate: false,
            }));
            setRows(prefilled);
            prefilled.forEach((item: any) => {
                form.setValues({
                    [`part_number_${item.rowKey}`]: item.part_number_id,
                    [`condition_${item.rowKey}`]: item.condition_id,
                    [`qty_${item.rowKey}`]: item.qty,
                    [`uom_${item.rowKey}`]: item.unit_of_measure_id,
                    [`remark_${item.rowKey}`]: item.remark,
                });
            });
        }
    }, [salesLogData]);

    useEffect(() => {
        if (!customerInfo?.data) return;

        const c = customerInfo.data;

        console.log(c)
        // ✅ Case 1: Edit initial load (run once)
        if (isEdit && !isInitialAutoFillDone) {
            form.setValues({
                currency_id: c.currency_id ?? "",
                payment_mode_id: c.payment_mode_id ?? "",
                payment_term_id: c.payment_term_id ?? "",
            });

            setIsInitialAutoFillDone(true);
            return;
        }

        // ✅ Case 2: User changed customer (always run)
        if (isCustomerChanged) {
            form.setValues({
                currency_id: c.currency_id ?? "",
                payment_mode_id: c.payment_mode_id ?? "",
                payment_term_id: c.payment_term_id ?? "",
            });

            setIsCustomerChanged(false);
        }

    }, [customerInfo]);

    const isFormValuesChanged = isFormFieldsChanged({ fields, initialValues, keys: FORM_KEYS });
    const totalQty = rows.reduce((acc, row) => acc + (Number(fields[`qty_${row.rowKey}`]?.value) || 0), 0);
    const totalItems = rows.filter(row => fields[`part_number_${row.rowKey}`]?.value).length;
    const isSaving = saveEndpoint.isLoading;
    const title = isEdit ? "Edit Sales Log" : "Add New Sales Log";

    const sectionStyle = { bg: "blue.100", p: 4, rounded: "md", border: "1px solid", borderColor: "blue.300" };

    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* Header */}
                <HStack justify="space-between">
                    <Stack spacing={0}>
                        <Breadcrumb fontWeight="medium" fontSize="sm" separator={<ChevronRightIcon boxSize={6} color="gray.500" />}>
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/sales-management/sales-log">Sales Log</BreadcrumbLink>
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

                <LoadingOverlay isLoading={dropdownLoading || infoLoading || customerInfoLoading}>
                    <Stack spacing={2} p={4} bg="white" borderRadius="md" boxShadow="md">
                        <Text fontSize="md" fontWeight="700">Sales Log</Text>

                        <Formiz autoForm connect={form}>
                            <FieldInput name="remarks" size="sm" sx={{ display: "none" }} />

                            <Stack spacing={2}>

                                {/* ── Section 1: RFQ + Priority ── */}
                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle}>
                                    <FieldSelect label="Mode of Receipt" name="mode_of_receipt_id" placeholder="Select..." options={modeOfReceiptOptions} required="Mode of Receipt is required" selectProps={{ isLoading: dropdownLoading }} size="sm" />
                                    <FieldInput label="Customer RFQ No" name="cust_rfq_no" placeholder="Enter RFQ No" required="RFQ No is required" type="alpha-numeric-with-special" maxLength={20} size="sm" />
                                    <FieldDayPicker label="RFQ Date" name="cust_rfq_date" placeholder="Select RFQ date" required="RFQ Date is required" disabledDays={{ after: new Date() }} size="sm" />
                                    <FieldSelect label="Priority" name="priority_id" placeholder="Select..." options={priorityOptions} required="Priority is required" selectProps={{ isLoading: dropdownLoading }} size="sm" onValueChange={(value) => {
                                        setDuedate(value);
                                    }} />
                                    <FieldDayPicker label="Due Date" name="due_date" placeholder="Select due date" required="Due Date is required" size="sm" dayPickerProps={{
                                        inputProps: {
                                            isDisabled: disabledDatePicker,
                                        },
                                    }} />

                                </Stack>

                                {/* ── Section 2: Customer + Contact + Shipping ── */}
                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle} align="flex-start">
                                    {/* Customer */}
                                    <FieldSelect
                                        label="Customer"
                                        name="customer_id"
                                        placeholder="Select..."
                                        options={customerOptions}
                                        required="Customer is required"
                                        selectProps={{ isLoading: dropdownLoading }}
                                        onValueChange={(v) => {
                                            setSelectedCustomerId(v);
                                            setSelectedContactManagerId(null);
                                            setSelectedShippingAddressId(null);
                                            setIsCustomerChanged(true);
                                            form.setValues({ customer_contact_manager_id: "", customer_shipping_address_id: "" });
                                        }}
                                        size="sm"
                                    />

                                    {/* Contact Manager + display */}
                                    <FieldSelect
                                        label="Contact Manager"
                                        name="customer_contact_manager_id"
                                        placeholder={selectedCustomerId ? "Select..." : "Select customer first"}
                                        options={contactManagerOptions}
                                        required="Contact Manager is required"
                                        selectProps={{ isLoading: cmLoading }}
                                        isDisabled={!selectedCustomerId}
                                        onValueChange={(v) => setSelectedContactManagerId(v)}
                                        size="sm"
                                    />
                                    <FieldDisplay
                                        key={`cm_display_${selectedContactManagerId}`}
                                        label="Contact Address"
                                        value={contactAddressDisplay}
                                        isHtml={true}
                                        style={{ backgroundColor: "#fff" }}
                                        size="sm"
                                    />

                                    {/* Shipping Address + display */}
                                    <FieldSelect
                                        label="Shipping Address"
                                        name="customer_shipping_address_id"
                                        placeholder={selectedCustomerId ? "Select..." : "Select customer first"}
                                        options={shippingAddressOptions}
                                        required="Shipping Address is required"
                                        selectProps={{ isLoading: saLoading }}
                                        isDisabled={!selectedCustomerId}
                                        onValueChange={(v) => setSelectedShippingAddressId(v)}
                                        size="sm"
                                    />
                                    <FieldDisplay
                                        key={`sa_display_${selectedShippingAddressId}`}
                                        label="Shipping Address"
                                        value={shippingAddressDisplay}
                                        isHtml={true}
                                        style={{ backgroundColor: "#fff" }}
                                        size="sm"
                                    />
                                </Stack>

                                {/* ── Section 3: Currency + Payment ── */}
                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle}>
                                    <FieldSelect label="Currency" name="currency_id" placeholder="Select..." options={currencyOptions} required="Currency is required" selectProps={{ isLoading: dropdownLoading }} size="sm" />
                                    <FieldSelect label="FOB" name="fob_id" placeholder="Select..." options={fobOptions} required="FOB is required" selectProps={{ isLoading: dropdownLoading }} size="sm" />
                                    <FieldSelect label="Payment Mode" name="payment_mode_id" placeholder="Select..." options={paymentModeOptions} required="Pay.Mode is required" selectProps={{ isLoading: dropdownLoading }} size="sm" />
                                    <FieldSelect label="Payment Term" name="payment_term_id" placeholder="Select..." options={paymentTermOptions} required="Pay.Term is required" selectProps={{ isLoading: dropdownLoading }} size="sm" />
                                </Stack>

                                {/* ── Items header ── */}
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
                                        <input
                                            type="file"
                                            accept=".csv"
                                            id="items-csv-upload"
                                            key={fileKey}
                                            style={{ display: "none" }}
                                            onChange={handleFileChange}
                                        />
                                        <Button
                                            as="label"
                                            htmlFor="items-csv-upload"
                                            leftIcon={<LuUpload />}
                                            colorScheme="green"
                                            size="sm"
                                            cursor="pointer"
                                        >
                                            Upload Items
                                        </Button>
                                    </HStack>
                                </HStack>

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
                                            {rows.map((row, index) => (
                                                <Tr key={row.rowKey} background={row.is_duplicate ? "yellow.100" : ""}>
                                                    <Td><Text fontSize="medium">{index + 1}.</Text></Td>

                                                    {/* Part Number */}
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
                                                            selectProps={{
                                                                isLoading: changedRowIndex === index && spareLoading,
                                                                noOptionsMessage: () => "No parts found",
                                                                onInputChange: (val: string) => {
                                                                    setSpareLoading(true);
                                                                    setChangedRowIndex(index);
                                                                    setTimeout(() => { setPartNumberQuery(val); setSpareLoading(false); }, 600);
                                                                },
                                                            }}
                                                            style={{ minWidth: 180 }}
                                                        />
                                                    </Td>

                                                    {/* Condition */}
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
                                                            isDisabled={!fields[`part_number_${row.rowKey}`]?.value}
                                                        />
                                                    </Td>

                                                    {/* Quantity */}
                                                    <Td>
                                                        <FieldInput
                                                            name={`qty_${row.rowKey}`}
                                                            size="sm"
                                                            required="Quantity is required"
                                                            type="integer"
                                                            placeholder="Qty"
                                                            defaultValue={row.qty || ""}
                                                            width="100px"
                                                            maxLength={9}
                                                            isDisabled={!fields[`part_number_${row.rowKey}`]?.value}
                                                            onValueChange={(v) => handleInputChange("qty", v, index)}
                                                        />
                                                    </Td>

                                                    {/* UOM */}
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
                                                            isDisabled={!fields[`part_number_${row.rowKey}`]?.value}
                                                        />
                                                    </Td>

                                                    {/* Remark */}
                                                    <Tooltip
                                                        label={fields[`remark_${row.rowKey}`]?.value ?? ""}
                                                        placement="top" hasArrow color="white"
                                                        isDisabled={!fields[`remark_${row.rowKey}`]?.value || String(fields[`remark_${row.rowKey}`]?.value).length <= 20}
                                                    >
                                                        <Td>
                                                            <FieldInput
                                                                name={`remark_${row.rowKey}`}
                                                                size="sm"
                                                                placeholder="Remark"
                                                                defaultValue={row.remark || ""}
                                                                maxLength={60}
                                                                isDisabled={!fields[`part_number_${row.rowKey}`]?.value}
                                                            />
                                                        </Td>
                                                    </Tooltip>

                                                    {/* Actions */}
                                                    <Td isNumeric>
                                                        {index === rows.length - 1 && (
                                                            <IconButton aria-label="Add Row" variant="@primary" size="sm" icon={<HiOutlinePlus />} onClick={addRow} mr={2} />
                                                        )}
                                                        <IconButton aria-label="Delete Row" colorScheme="red" size="sm" icon={<DeleteIcon />} onClick={() => deleteRow(row.rowKey)} isDisabled={rows.length <= 1} />
                                                    </Td>
                                                </Tr>
                                            ))}
                                        </Tbody>
                                    </Table>
                                </TableContainer>

                                {/* ── Totals ── */}
                                <HStack mt={3}>
                                    <Text>Total Qty: <Text as="span" ml={3} fontWeight="bold">{totalQty}</Text></Text>
                                    <Text ml={3}>Total Line Items: <Text as="span" ml={3} fontWeight="bold">{totalItems}</Text></Text>
                                </HStack>

                                {/* ── Remarks HTML editor ── */}
                                <Stack>
                                    <FormControl>
                                        <FormLabel>Remarks</FormLabel>
                                        <FieldHTMLEditor
                                            onValueChange={handleRemarksChange}
                                            maxLength={import.meta.env.VITE_ELABORATE_REMARKS_LENGTH}
                                            placeHolder="Enter Remarks Here"
                                        />
                                    </FormControl>
                                </Stack>

                            </Stack>

                            {/* ── Actions ── */}
                            <Stack direction={{ base: "column", md: "row" }} justify="center" alignItems="center" mt={4}>
                                <Button
                                    type="submit" colorScheme="brand"
                                    isLoading={isSaving}
                                    isDisabled={isSaving || (isEdit ? (!isFormValuesChanged || !form.isValid) : false)}
                                >
                                    {isEdit ? "Update" : "Submit"}
                                </Button>
                                <Button
                                    onClick={() => handleOpenPreview()}
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

            <ConfirmationPopup
                isOpen={openConfirmation}
                onClose={() => setOpenConfirmation(false)}
                onConfirm={handleConfirm}
                headerText="Upload Items CSV"
                bodyText="Are you sure you want to upload this file? Existing rows with part numbers will be kept."
            />
        </SlideIn>
    );
};

export default SalesLogForm;