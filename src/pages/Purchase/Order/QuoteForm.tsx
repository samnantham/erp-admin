import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { ChevronRightIcon, DeleteIcon } from "@chakra-ui/icons";
import {
    Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    Button, FormControl, FormLabel, HStack, Heading,
    IconButton, Stack, Table, TableContainer, Tbody,
    Td, Text, Th, Thead, Tooltip, Tr, Grid, Box, useDisclosure
} from "@chakra-ui/react";
import { Formiz, useForm, useFormFields } from "@formiz/core";
import { HiArrowNarrowLeft } from "react-icons/hi";
import { LuSearch } from "react-icons/lu";
import { Link, useNavigate, useParams } from "react-router-dom";

import FieldDisplay from "@/components/FieldDisplay";
import { FieldHTMLEditor } from "@/components/FieldHTMLEditor";
import { FieldInput } from "@/components/FieldInput";
import { FieldSelect } from "@/components/FieldSelect";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";
import LoadingOverlay from "@/components/LoadingOverlay";
import { isFormFieldsChanged } from "@/helpers/FormChangeDetector";
import { useToastError } from "@/components/Toast";
import { formatContactAddress, formatShippingAddress } from "@/helpers/commonHelper";
import { SubMasterModalForm } from '@/pages/Submaster/ModalForm';
import { ContactManagerModal } from "@/components/Modals/CustomerMaster/ContactManager";
import { CustomerShippingAddressModal } from "@/components/Modals/CustomerMaster/ShippingAddress";
import { SupplierPricingUpdateSearchPopup } from '@/components/Popups/Search/Purchase/SupplierPricingUpdate';

import { useSavePurchaseOrder, usePurchaseOrderDetails, usePurchaseOrderDropdowns } from "@/services/purchase/order/service";
import { useCustomerRelationIndex, useCustomerDetails } from "@/services/master/customer/service";
import { useSubmasterItemIndex } from "@/services/submaster/service";
import { useUserContext } from "@/services/auth/UserContext";
import { usePDFPreviewController } from "@/api/hooks/usePDFPreviewController";
import { endPoints } from "@/api/endpoints";
import { getRequest } from "@/api/client";
import { useQuotationList, useRelatedQuotationList } from '@/services/purchase/quotation/service';
import { zPurchaseQuotationDetailsPayload } from '@/services/purchase/quotation/schema';
import { v4 as uuidv4 } from "uuid";
// ─── Constants ────────────────────────────────────────────────────────────────

const FORM_KEYS = [
    "quotation_id", "related_quotation_id", "priority_id", "currency_id",
    "payment_mode_id", "payment_term_id", "fob_id",
    "customer_contact_manager_id", "customer_shipping_address_id", "remarks",
    "bank_charge", "freight", "miscellaneous_charges", "vat", "discount",
    "ship_type_id", "ship_mode_id", "ship_account_id",
];

const NA = "N/A";

// ─── Types ────────────────────────────────────────────────────────────────────

type SLRow = {
    rowKey:            string;
    part_number_id:    any;
    part_number:       any;
    condition_id:      any;
    qty:               any;
    unit_of_measure_id: any;
    price:             any;
    total_value:       any;
    note:              any;
    is_duplicate:      boolean;
    id?:               any;
    quotation_item_id?: string | null;
    // null = primary quotation row; string = which related quotation this came from
    source_quotation_id?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const emptyRow = (): SLRow => ({
    rowKey:             uuidv4(),
    part_number_id:     "", part_number: null,
    condition_id:       "", qty: "",
    unit_of_measure_id: "", price: "",
    total_value:        "", note: "",
    is_duplicate:       false,
    quotation_item_id:  null,
    source_quotation_id: null,
});

const calcTotal = (qty: any, price: any): string => {
    const q = parseFloat(qty), p = parseFloat(price);
    return (!isNaN(q) && !isNaN(p)) ? (q * p).toFixed(2) : "";
};

const lineItemToRow = (item: any, sourceQuotationId?: string | null): SLRow => ({
    rowKey:             uuidv4(),
    part_number_id:     item.part_number_id,
    part_number:        item.part_number,
    condition_id:       item.condition_id,
    qty:                item.qty ?? "",
    unit_of_measure_id: item.unit_of_measure_id ?? "",
    price:              item.price ?? "",
    total_value:        calcTotal(item.qty, item.price),
    note:               item.remark ?? item.note ?? "",
    is_duplicate:       false,
    quotation_item_id:  item.quotation_item_id ?? null,
    id:                 item.id,
    source_quotation_id: sourceQuotationId ?? null,
});

const markDuplicates = (rowList: SLRow[]): SLRow[] => {
    const seen = new Set<string>();
    return rowList.map(row => {
        const key = `${row.part_number_id}-${row.condition_id}`;
        const isDuplicate = !!(row.part_number_id && row.condition_id && seen.has(key));
        if (row.part_number_id && row.condition_id) seen.add(key);
        return { ...row, is_duplicate: isDuplicate };
    });
};

// ─── Component ────────────────────────────────────────────────────────────────

export const PurchaseOrderForm = () => {
    const navigate    = useNavigate();
    const toastError  = useToastError();
    const { id }      = useParams<{ id?: string }>();
    const isEdit      = !!id;
    const { userInfo } = useUserContext();
    const { isOpen: isSearchOpen, onOpen: openSearch, onClose: closeSearch } = useDisclosure();

    // ── State ──────────────────────────────────────────────────────────────────
    const [selectedCustomerId,        setSelectedCustomerId]        = useState<any>(null);
    const [selectedContactManagerId,  setSelectedContactManagerId]  = useState<any>(null);
    const [selectedShippingAddressId, setSelectedShippingAddressId] = useState<any>(null);
    const [quotationId,               setQuotationId]               = useState<any>(null);

    const [rows,        setRows]        = useState<SLRow[]>([emptyRow()]);
    const [relatedRows, setRelatedRows] = useState<SLRow[]>([]);

    // ✅ Stores MR IDs directly — populated from quotation fetch or edit response
    const [materialRequestIds, setMaterialRequestIds] = useState<string[]>([]);

    const [relatedQuotationIds, setRelatedQuotationIds] = useState<string[]>([]);

    // ── Refs ───────────────────────────────────────────────────────────────────
    const relatedRowCache      = useRef<Map<string, SLRow[]>>(new Map());
    const manuallyRemovedKeys  = useRef<Map<string, Set<string>>>(new Map());

    const [activeInput,            setActiveInput]            = useState('');
    const [initialValues,          setInitialValues]          = useState<any>(null);
    const [vendorQuoteNo,          setVendorQuoteNo]          = useState(NA);
    const [prfqNo,                 setPRFQNo]                 = useState(NA);
    const [mrRefNo,                setMRRefNo]                = useState(NA);
    const [editReady,              setEditReady]              = useState(!isEdit);
    const [loadingRelatedDetails,  setLoadingRelatedDetails]  = useState(false);

    // ── Data fetching ──────────────────────────────────────────────────────────
    const { data: dropdownData,        isLoading: loadingDropdowns,          refetch: reloadDropDowns }       = usePurchaseOrderDropdowns();
    const { data: itemInfo,            isLoading: loadingItem }                                               = usePurchaseOrderDetails(id, { enabled: isEdit });
    const { data: customerInfo,        isLoading: loadingCustomer }                                           = useCustomerDetails(selectedCustomerId, { enabled: !!selectedCustomerId });
    const { data: contactManagerList,  isLoading: loadingCM,                 refetch: reloadContactManagers } = useCustomerRelationIndex(selectedCustomerId, "contact-managers");
    const { data: shippingAddressList, isLoading: loadingSA,                 refetch: reloadShippingAddresses } = useCustomerRelationIndex(selectedCustomerId, "shipping-addresses");
    const { data: conditionData }                                                                              = useSubmasterItemIndex("conditions", {});
    const { data: uomData }                                                                                    = useSubmasterItemIndex("unit-of-measures", {});
    const { data: currencyData }                                                                               = useSubmasterItemIndex("currencies", {});
    const { data: quotationList,       isLoading: loadingQuotationList }                                      = useQuotationList();
    const { data: relatedQuotations,   isLoading: loadingRelatedQuotationList }                               = useRelatedQuotationList(quotationId);

    const isLoading =
        !editReady ||
        loadingDropdowns ||
        loadingQuotationList ||
        loadingRelatedQuotationList ||
        loadingItem ||
        loadingRelatedDetails ||
        (!isEdit && loadingCustomer);

    // ── Derived options ────────────────────────────────────────────────────────
    const priorityOptions        = dropdownData?.priorities    ?? [];
    const currencyOptions        = dropdownData?.currencies    ?? [];
    const fobOptions             = dropdownData?.fobs          ?? [];
    const paymentModeOptions     = dropdownData?.payment_modes ?? [];
    const paymentTermOptions     = dropdownData?.payment_terms ?? [];
    const shipTypeOptions        = dropdownData?.ship_types    ?? [];
    const shipModeOptions        = dropdownData?.ship_modes    ?? [];
    const shipAccountOptions     = dropdownData?.ship_accounts ?? [];
    const quotationOptions       = quotationList?.data         ?? [];
    const relatedQuotationOptions = relatedQuotations?.data   ?? [];
    const conditionOptions       = conditionData?.data?.map((c: any) => ({ value: c.id, label: c.name })) ?? [];
    const uomOptions             = uomData?.data?.map((u: any)        => ({ value: u.id, label: u.name })) ?? [];
    const contactManagerOptions  = contactManagerList?.data?.map((i: any) => ({ value: i.id, label: i.attention }))                       ?? [];
    const shippingAddressOptions = shippingAddressList?.data?.map((i: any) => ({ value: i.id, label: `${i.consignee_name} — ${i.country}` })) ?? [];

    // ── Address display ────────────────────────────────────────────────────────
    const selectedContact = useMemo(
        () => contactManagerList?.data?.find((i: any) => String(i.id) === String(selectedContactManagerId)),
        [contactManagerList, selectedContactManagerId]
    );
    const selectedShipping = useMemo(
        () => shippingAddressList?.data?.find((i: any) => String(i.id) === String(selectedShippingAddressId)),
        [shippingAddressList, selectedShippingAddressId]
    );
    const contactAddressDisplay  = selectedContact  ? formatContactAddress(selectedContact)   : "—";
    const shippingAddressDisplay = selectedShipping ? formatShippingAddress(selectedShipping) : "—";

    // ── Merged rows ────────────────────────────────────────────────────────────
    const allRows = useMemo(() => [...rows, ...relatedRows], [rows, relatedRows]);

    // ── Form ───────────────────────────────────────────────────────────────────
    const saveEndpoint = useSavePurchaseOrder();
    const form = useForm({
        onValidSubmit: (values) => {
            if (allRows.some(r => r.is_duplicate)) {
                toastError({ title: "Duplicate entries found", description: "Same Part Number added with same condition multiple times" });
                return;
            }

            const payload: any = Object.fromEntries(FORM_KEYS.map(k => [k, values[k]]));
            payload.customer_id      = selectedCustomerId;
            payload.quotation_ids    = [...(quotationId ? [quotationId] : []), ...relatedQuotationIds];
            // ✅ Send MR IDs directly from state — stored in purchase_order_material_requests
            payload.material_request_ids = materialRequestIds;
            payload.items = allRows.map(row => ({
                part_number_id:    row.part_number_id,
                condition_id:      values[`condition_${row.rowKey}`],
                qty:               Number(values[`qty_${row.rowKey}`]),
                unit_of_measure_id: row.unit_of_measure_id,
                price:             Number(values[`price_${row.rowKey}`]),
                total_value:       Number(values[`total_value_${row.rowKey}`]),
                note:              values[`note_${row.rowKey}`],
                quotation_item_id: row.quotation_item_id ?? null,
                ...(row.id && { id: row.id }),
            }));

            saveEndpoint.mutate(
                isEdit ? { id, ...payload } : payload,
                { onSuccess: () => navigate("/purchase/order/master") }
            );
        },
    });

    const fields = useFormFields({ connect: form });

    const currencySymbol = useMemo(() => {
        const cid = fields['currency_id']?.value;
        if (!cid) return "";
        const match = currencyData?.data?.find((c: any) => String(c.id) === String(cid));
        return match?.symbol ?? match?.label ?? "";
    }, [fields['currency_id']?.value, currencyData]);

    // ── PDF Preview ────────────────────────────────────────────────────────────
    const previewPDF = usePDFPreviewController({ url: endPoints.preview_post.purchase_order, title: "PURCHASE ORDER PREVIEW" });

    const handleOpenPreview = () => {
        const vars: any = { user_id: userInfo.id, customer_id: selectedCustomerId };
        Object.keys(fields).forEach(k => { vars[k] = fields[k].value; });
        vars.quotation_ids         = [...(quotationId ? [quotationId] : []), ...relatedQuotationIds];
        // ✅ Include in preview too
        vars.material_request_ids  = materialRequestIds;
        vars.items = allRows.map(row => ({
            part_number_id:    row.part_number_id,
            condition_id:      fields[`condition_${row.rowKey}`]?.value,
            qty:               Number(fields[`qty_${row.rowKey}`]?.value),
            unit_of_measure_id: fields[`uom_${row.rowKey}`]?.value,
            price:             Number(fields[`price_${row.rowKey}`]?.value),
            total_value:       Number(fields[`total_value_${row.rowKey}`]?.value),
            note:              fields[`note_${row.rowKey}`]?.value,
        }));
        previewPDF.open(vars);
    };

    // ── Helpers ────────────────────────────────────────────────────────────────

    const handleDoubleClick = (field: string) => setActiveInput(field);

    const applyRowsToForm = useCallback((prefilled: SLRow[]) => {
        const vals: Record<string, any> = {};
        prefilled.forEach(r => {
            vals[`part_number_${r.rowKey}`]  = r.part_number_id;
            vals[`condition_${r.rowKey}`]    = r.condition_id;
            vals[`qty_${r.rowKey}`]          = r.qty;
            vals[`uom_${r.rowKey}`]          = r.unit_of_measure_id;
            vals[`price_${r.rowKey}`]        = r.price;
            vals[`total_value_${r.rowKey}`]  = r.total_value;
            vals[`note_${r.rowKey}`]         = r.note;
        });
        form.setValues(vals);
    }, [form]);

    const clearRelatedState = useCallback(() => {
        setRelatedQuotationIds([]);
        setRelatedRows([]);
        setMaterialRequestIds([]);
        relatedRowCache.current.clear();
        manuallyRemovedKeys.current.clear();
    }, []);

    // ── Primary quotation select ───────────────────────────────────────────────
    const handleQuotationSelect = useCallback((qid: any) => {
        if (!qid) {
            setQuotationId(null);
            setSelectedCustomerId(null);
            setSelectedContactManagerId(null);
            setSelectedShippingAddressId(null);
            setRows([emptyRow()]);
            clearRelatedState();
            form.reset();
            return;
        }
        setQuotationId(qid);
        setSelectedContactManagerId(null);
        setSelectedShippingAddressId(null);
        setRows([emptyRow()]);
        clearRelatedState();
        form.reset();
        setTimeout(() => form.setValues({ quotation_id: qid }), 0);
    }, [form, clearRelatedState]);

    // ── Related quotation multi-select ────────────────────────────────────────
    const handleRelatedQuotationChange = useCallback(async (selectedIds: string[]) => {
        setRelatedQuotationIds(selectedIds);

        if (!selectedIds.length) {
            setRelatedRows([]);
            return;
        }

        setRelatedRows(prev =>
            prev.filter(row =>
                row.source_quotation_id != null &&
                selectedIds.includes(row.source_quotation_id)
            )
        );

        const toRestore: string[] = [];
        const toFetch:   string[] = [];

        selectedIds.forEach(sid => {
            if (relatedRowCache.current.has(sid)) toRestore.push(sid);
            else                                  toFetch.push(sid);
        });

        if (toRestore.length) {
            const restoredRows: SLRow[] = [];
            toRestore.forEach(sid => {
                const cached  = relatedRowCache.current.get(sid) ?? [];
                const removed = manuallyRemovedKeys.current.get(sid) ?? new Set<string>();
                cached.filter(r => !removed.has(r.rowKey)).forEach(r => restoredRows.push(r));
            });
            if (restoredRows.length) {
                setRelatedRows(prev => {
                    const presentKeys = new Set(prev.map(r => r.rowKey));
                    return [...prev, ...restoredRows.filter(r => !presentKeys.has(r.rowKey))];
                });
                applyRowsToForm(restoredRows);
            }
        }

        if (!toFetch.length) return;

        setLoadingRelatedDetails(true);
        try {
            const results = await Promise.all(
                toFetch.map(sid =>
                    getRequest(
                        endPoints.info.purchase_quotation.replace(':id', sid),
                        zPurchaseQuotationDetailsPayload
                    ).then((data: any) => ({ sid, data }))
                )
            );

            const newRows: SLRow[] = [];
            const newMrIds: string[] = [];

            results.forEach(({ sid, data }: { sid: string; data: any }) => {
                const lineItems = data?.data?.line_items ?? [];
                const fetched   = lineItems.map((item: any) => lineItemToRow(item, sid));
                relatedRowCache.current.set(sid, fetched);
                newRows.push(...fetched);

                // ✅ Collect MR IDs from newly fetched related quotations
                const mrs = data?.data?.material_requests ?? [];
                mrs.forEach((mr: any) => {
                    if (mr?.id && !newMrIds.includes(String(mr.id))) {
                        newMrIds.push(String(mr.id));
                    }
                });
            });

            if (newRows.length) {
                setRelatedRows(prev => [...prev, ...newRows]);
                applyRowsToForm(newRows);
            }

            // Merge new MR IDs into existing (no duplicates)
            if (newMrIds.length) {
                setMaterialRequestIds(prev => [...new Set([...prev, ...newMrIds])]);
            }
        } catch (err) {
            console.error("Failed to fetch related quotation details", err);
        } finally {
            setLoadingRelatedDetails(false);
        }
    }, [applyRowsToForm]);

    // ── Delete row ────────────────────────────────────────────────────────────
    const deleteRow = useCallback((rowKey: string, sourceQuotationId?: string | null) => {
        if (sourceQuotationId) {
            setRelatedRows(prev => prev.filter(r => r.rowKey !== rowKey));
            if (!manuallyRemovedKeys.current.has(sourceQuotationId)) {
                manuallyRemovedKeys.current.set(sourceQuotationId, new Set());
            }
            manuallyRemovedKeys.current.get(sourceQuotationId)!.add(rowKey);
        } else {
            setRows(prev => prev.filter(r => r.rowKey !== rowKey));
        }
    }, []);

    // ── Input change ──────────────────────────────────────────────────────────
    const handleInputChange = useCallback((field: string, value: any, index: number) => {
        const isPrimary = index < rows.length;

        if (isPrimary) {
            setRows(prev => {
                const next    = [...prev];
                const updated = { ...next[index], [field]: value };
                if (field === "qty" || field === "price") {
                    const tv = calcTotal(
                        field === "qty"   ? value : updated.qty,
                        field === "price" ? value : updated.price
                    );
                    updated.total_value = tv;
                    form.setValues({ [`total_value_${next[index].rowKey}`]: tv });
                }
                next[index] = updated;
                return markDuplicates(next);
            });
        } else {
            const relIndex = index - rows.length;
            setRelatedRows(prev => {
                const next    = [...prev];
                const updated = { ...next[relIndex], [field]: value };
                if (field === "qty" || field === "price") {
                    const tv = calcTotal(
                        field === "qty"   ? value : updated.qty,
                        field === "price" ? value : updated.price
                    );
                    updated.total_value = tv;
                    form.setValues({ [`total_value_${next[relIndex].rowKey}`]: tv });
                }
                next[relIndex] = updated;
                return next;
            });
        }
    }, [rows.length, form]);

    // ── addNew helpers ─────────────────────────────────────────────────────────
    const handleAddNewSuccess =
        (fieldName: any, refetch: () => void, options?: { onValueChange?: (val: any, fullData?: any) => void }) =>
            (data: any) => {
                const newId = (data?.data ?? data)?.id;
                setTimeout(() => {
                    refetch();
                    setTimeout(() => {
                        form.setValues({ [fieldName]: newId });
                        options?.onValueChange?.(newId, data?.data ?? data);
                    }, 50);
                }, 100);
            };

    const submasterAddNew = (fieldName: string, model: string) => ({
        label: '+ Add New',
        CreateModal: (p: any) => <SubMasterModalForm {...p} model={model} isEdit={false} />,
        onSuccess: handleAddNewSuccess(fieldName, reloadDropDowns),
    });

    // ── Effects ────────────────────────────────────────────────────────────────

    /**
     * EDIT MODE pre-fill.
     * - MRs come directly from s.material_requests (stored in purchase_order_material_requests).
     * - No PRFQ traversal needed.
     */
    useEffect(() => {
        if (!itemInfo?.data) return;
        const s      = itemInfo.data;
        const values = Object.fromEntries(FORM_KEYS.map(k => [k, (s as any)[k]]));

        setSelectedCustomerId(s.customer_id);
        setSelectedContactManagerId(s.customer_contact_manager_id);
        setSelectedShippingAddressId(s.customer_shipping_address_id);

        if (s.quotations?.length) {
            const [primaryQ, ...restQ] = s.quotations;
            setVendorQuoteNo(primaryQ.code ?? NA);
            setQuotationId(primaryQ.id ?? null);
            values.quotation_id = primaryQ.id ?? '';

            if (restQ.length) {
                const rqIds = restQ.map((q: any) => String(q.id));
                setRelatedQuotationIds(rqIds);
                values.related_quotation_id = rqIds;
            }
        }

        setPRFQNo(s.prfqs?.map((p: any) => p.code).join(', ')           || NA);
        // ✅ MRs from the direct relationship — no PRFQ traversal
        setMRRefNo(s.material_requests?.map((m: any) => m.ref).join(', ') || NA);
        setMaterialRequestIds(s.material_requests?.map((m: any) => String(m.id)).filter(Boolean) ?? []);

        setInitialValues(values);
        form.setValues(values);

        if (s.items?.length) {
            const primaryItems: SLRow[]                    = [];
            const relatedItemsByQuo = new Map<string, SLRow[]>();

            s.items.forEach((item: any) => {
                const srcId = item.source_quotation_id ? String(item.source_quotation_id) : null;
                const row: SLRow = {
                    rowKey:             uuidv4(),
                    part_number_id:     item.part_number_id,
                    part_number:        item.part_number ?? null,
                    condition_id:       item.condition_id,
                    qty:                item.qty,
                    unit_of_measure_id: item.unit_of_measure_id,
                    price:              item.price ?? "",
                    total_value:        item.total_value ?? calcTotal(item.qty, item.price),
                    note:               item.note ?? "",
                    id:                 item.id,
                    is_duplicate:       false,
                    quotation_item_id:  item.quotation_item_id ?? null,
                    source_quotation_id: srcId,
                };
                if (srcId) {
                    if (!relatedItemsByQuo.has(srcId)) relatedItemsByQuo.set(srcId, []);
                    relatedItemsByQuo.get(srcId)!.push(row);
                } else {
                    primaryItems.push(row);
                }
            });

            relatedItemsByQuo.forEach((rowList, sid) => {
                relatedRowCache.current.set(sid, rowList);
            });

            if (primaryItems.length) {
                setRows(primaryItems);
                applyRowsToForm(primaryItems);
            }

            const allRelatedItems = Array.from(relatedItemsByQuo.values()).flat();
            if (allRelatedItems.length) {
                setRelatedRows(allRelatedItems);
                applyRowsToForm(allRelatedItems);
            }
        }

        setEditReady(true);
    }, [itemInfo]);

    // Customer auto-fill (create only)
    useEffect(() => {
        if (!customerInfo?.data || isEdit) return;
        const c = customerInfo.data;
        form.setValues({
            currency_id:     c.currency_id     ?? "",
            payment_mode_id: c.payment_mode_id ?? "",
            payment_term_id: c.payment_term_id ?? "",
        });
    }, [customerInfo]);

    // Primary quotation auto-fill (create only)
    useEffect(() => {
        if (!quotationId || isEdit) return;
        (async () => {
            try {
                const data = await getRequest(
                    endPoints.info.purchase_quotation.replace(':id', String(quotationId)),
                    zPurchaseQuotationDetailsPayload
                );
                const q = data?.data;
                if (!q) return;

                setVendorQuoteNo(q.code ?? NA);
                setPRFQNo(q.prfq?.code ?? NA);
                setSelectedCustomerId(q.vendor_id);

                // ✅ Seed MR IDs from primary quotation
                const mrIds = (q.material_requests ?? []).map((m: any) => String(m.id)).filter(Boolean);
                setMaterialRequestIds(mrIds);
                setMRRefNo(q.material_requests?.map((m: any) => m.ref).join(', ') ?? NA);

                if (!q.line_items?.length) return;
                const prefilled = q.line_items.map((item: any) => lineItemToRow(item, null));
                setRows(prefilled);
                applyRowsToForm(prefilled);
            } catch (err) {
                console.error("Failed to fetch primary quotation details", err);
            }
        })();
    }, [quotationId, isEdit]);

    // Re-apply contact manager once list loads (edit)
    useEffect(() => {
        if (!isEdit || !itemInfo?.data || !contactManagerList?.data?.length) return;
        const cmId = itemInfo.data.customer_contact_manager_id;
        if (cmId) { form.setValues({ customer_contact_manager_id: cmId }); setSelectedContactManagerId(cmId); }
    }, [contactManagerList]);

    // Re-apply shipping address once list loads (edit)
    useEffect(() => {
        if (!isEdit || !itemInfo?.data || !shippingAddressList?.data?.length) return;
        const saId = itemInfo.data.customer_shipping_address_id;
        if (saId) { form.setValues({ customer_shipping_address_id: saId }); setSelectedShippingAddressId(saId); }
    }, [shippingAddressList]);

    // ── Derived totals ─────────────────────────────────────────────────────────
    const isFormValuesChanged = isFormFieldsChanged({ fields, initialValues, keys: FORM_KEYS });
    const totalQty   = allRows.reduce((a, r) => a + (Number(fields[`qty_${r.rowKey}`]?.value) || 0), 0);
    const totalItems = allRows.filter(r => fields[`part_number_${r.rowKey}`]?.value || r.part_number_id).length;
    const grandTotal = allRows.reduce((a, r) => a + (Number(fields[`total_value_${r.rowKey}`]?.value) || 0), 0);
    const subTotal   = grandTotal;
    const vatAmount  = parseFloat(((subTotal * (Number(fields['vat']?.value) || 0)) / 100).toFixed(2));
    const totalPayable = parseFloat((
        subTotal
        + (Number(fields['bank_charge']?.value)           || 0)
        + (Number(fields['freight']?.value)               || 0)
        + (Number(fields['miscellaneous_charges']?.value) || 0)
        + vatAmount
        - (Number(fields['discount']?.value)              || 0)
    ).toFixed(2));

    const isSaving = saveEndpoint.isLoading;
    const title    = isEdit ? "Edit Purchase Order" : "Add New Purchase Order";
    const sectionStyle = { bg: "blue.100", p: 4, rounded: "md", border: "1px solid", borderColor: "blue.300" };

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* ── Header ── */}
                <HStack justify="space-between">
                    <Stack spacing={0}>
                        <Breadcrumb fontWeight="medium" fontSize="sm" separator={<ChevronRightIcon boxSize={6} color="gray.500" />}>
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/purchase/order/master">Purchase Order</BreadcrumbLink>
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
                        <Text fontSize="md" fontWeight="700">Purchase Order</Text>

                        <Formiz autoForm connect={form}>
                            <FieldInput name="remarks" size="sm" sx={{ display: "none" }} />

                            <Stack spacing={2}>

                                {/* ── Quotation header ── */}
                                <Grid templateColumns={{ base: '1fr', md: 'repeat(5, 1fr)' }} gap={3} bg="blue.100" p={3} borderRadius="md" borderWidth={1} alignItems="end">
                                    <Box>
                                        <FormControl>
                                            <FormLabel fontSize="sm" minH="20px">
                                                Quo.No
                                                <IconButton aria-label="Search Quotation" colorScheme="brand" size="xs" icon={<LuSearch />} onClick={openSearch} ml={2} />
                                            </FormLabel>
                                            <FieldSelect
                                                name="quotation_id"
                                                required="Quotation is required"
                                                options={quotationOptions}
                                                placeholder="Select Quotation"
                                                size="sm"
                                                onValueChange={(v) => handleQuotationSelect(v ?? null)}
                                                isClearable
                                            />
                                        </FormControl>
                                    </Box>
                                    <Box>
                                        <FormControl>
                                            <FormLabel fontSize="sm" minH="20px">Related.Quo</FormLabel>
                                            <FieldSelect
                                                name="related_quotation_id"
                                                size="sm"
                                                options={relatedQuotationOptions}
                                                isDisabled={!quotationId || !relatedQuotationOptions.length}
                                                isClearable
                                                isMulti
                                                selectProps={{
                                                    noOptionsMessage: () => 'No related quotations found',
                                                    isLoading: loadingRelatedQuotationList || loadingRelatedDetails,
                                                }}
                                                onValueChange={(value) => {
                                                    const ids = value
                                                        ? (Array.isArray(value) ? value.map(String) : [String(value)])
                                                        : [];
                                                    handleRelatedQuotationChange(ids);
                                                }}
                                            />
                                        </FormControl>
                                    </Box>
                                    <Box>
                                        <FormControl>
                                            <FormLabel fontSize="sm" minH="20px">Ven.Quo.No</FormLabel>
                                            <FieldDisplay value={vendorQuoteNo} size="sm" style={{ backgroundColor: '#fff' }} />
                                        </FormControl>
                                    </Box>
                                    <Box>
                                        <FormControl>
                                            <FormLabel fontSize="sm" minH="20px">PRFQ No</FormLabel>
                                            <FieldDisplay value={prfqNo} size="sm" style={{ backgroundColor: '#fff' }} />
                                        </FormControl>
                                    </Box>
                                    <Box>
                                        <FormControl>
                                            <FormLabel fontSize="sm" minH="20px">MR Ref</FormLabel>
                                            <FieldDisplay value={mrRefNo} size="sm" style={{ backgroundColor: '#fff' }} />
                                        </FormControl>
                                    </Box>
                                </Grid>

                                {/* ── Section 1: Vendor + Contact ── */}
                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle} align="flex-start">
                                    <FieldDisplay key={`vname_${selectedCustomerId}`} label="Vendor Name" value={customerInfo?.data?.business_name ?? 'N/A'} isHtml style={{ backgroundColor: "#fff" }} size="sm" />
                                    <FieldDisplay key={`vcode_${selectedCustomerId}`} label="Vendor Code" value={customerInfo?.data?.code ?? 'N/A'} isHtml style={{ backgroundColor: "#fff" }} size="sm" />
                                    <FieldSelect
                                        key={`cm_${selectedCustomerId ?? 'none'}`}
                                        label="Contact Manager" name="customer_contact_manager_id"
                                        placeholder={selectedCustomerId ? "Select..." : "Select vendor first"}
                                        options={contactManagerOptions} required="Contact Manager is required"
                                        isDisabled={!selectedCustomerId} size="sm"
                                        onValueChange={setSelectedContactManagerId}
                                        isCaseSensitive
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p: any) => (
                                                <ContactManagerModal {...p} customerId={selectedCustomerId} isEdit={false} customerInfo={customerInfo?.data}
                                                    onSuccess={(data) => handleAddNewSuccess('customer_contact_manager_id', reloadContactManagers, { onValueChange: setSelectedContactManagerId })(data)} />
                                            ),
                                        }}
                                        selectProps={{ type: 'creatable', noOptionsMessage: () => 'No contacts found', isLoading: loadingCM }}
                                    />
                                    <FieldDisplay key={`cm_disp_${selectedContactManagerId}`} label="Contact Address" value={contactAddressDisplay} isHtml style={{ backgroundColor: "#fff" }} size="sm" />
                                </Stack>

                                {/* ── Section 2: Shipping ── */}
                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle}>
                                    <FieldSelect
                                        key={`sa_${selectedCustomerId ?? 'none'}`}
                                        label="Ship To" name="customer_shipping_address_id"
                                        placeholder={selectedCustomerId ? "Select..." : "Select vendor first"}
                                        options={shippingAddressOptions} required="Shipping Address is required"
                                        isDisabled={!selectedCustomerId} size="sm"
                                        onValueChange={setSelectedShippingAddressId}
                                        addNew={{
                                            label: '+ Add New',
                                            CreateModal: (p: any) => (
                                                <CustomerShippingAddressModal {...p} customerId={selectedCustomerId} isEdit={false} customerInfo={customerInfo?.data}
                                                    onSuccess={(data) => handleAddNewSuccess('customer_shipping_address_id', reloadShippingAddresses, { onValueChange: setSelectedShippingAddressId })(data)} />
                                            ),
                                        }}
                                        selectProps={{ type: 'creatable', noOptionsMessage: () => 'No addresses found', isLoading: loadingSA }}
                                    />
                                    <FieldDisplay key={`sa_disp_${selectedShippingAddressId}`} label="Shipping Address" value={shippingAddressDisplay} isHtml style={{ backgroundColor: "#fff" }} size="sm" />
                                    <FieldSelect label="Ship Type" name="ship_type_id" placeholder="Select..." options={shipTypeOptions} required="Ship Type is required" size="sm" isCaseSensitive addNew={submasterAddNew('ship_type_id', 'ship-types')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options', isLoading: loadingDropdowns }} />
                                    <FieldSelect label="Ship Mode" name="ship_mode_id" placeholder="Select..." options={shipModeOptions} required="Ship Mode is required" size="sm" isCaseSensitive addNew={submasterAddNew('ship_mode_id', 'ship-modes')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options', isLoading: loadingDropdowns }} />
                                    <FieldSelect label="Ship Account" name="ship_account_id" placeholder="Select..." options={shipAccountOptions} required="Ship Account is required" size="sm" isCaseSensitive addNew={submasterAddNew('ship_account_id', 'ship-accounts')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options', isLoading: loadingDropdowns }} />
                                </Stack>

                                {/* ── Section 3: Priority + Payment + FOB ── */}
                                <Stack spacing={8} direction={{ base: "column", md: "row" }} {...sectionStyle}>
                                    <FieldSelect label="Priority" name="priority_id" placeholder="Select..." options={priorityOptions} required="Priority is required" size="sm" isCaseSensitive addNew={submasterAddNew('priority_id', 'priorities')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options', isLoading: loadingDropdowns }} />
                                    <FieldSelect label="Currency" name="currency_id" placeholder="Select..." options={currencyOptions} required="Currency is required" size="sm" selectProps={{ isLoading: loadingDropdowns }} />
                                    <FieldSelect label="Payment Mode" name="payment_mode_id" placeholder="Select..." options={paymentModeOptions} required="Pay.Mode is required" size="sm" isCaseSensitive addNew={submasterAddNew('payment_mode_id', 'payment_modes')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options', isLoading: loadingDropdowns }} />
                                    <FieldSelect label="Payment Term" name="payment_term_id" placeholder="Select..." options={paymentTermOptions} required="Pay.Term is required" size="sm" isCaseSensitive addNew={submasterAddNew('payment_term_id', 'payment-terms')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options', isLoading: loadingDropdowns }} />
                                    <FieldSelect label="FOB" name="fob_id" placeholder="Select..." options={fobOptions} required="FOB is required" size="sm" isCaseSensitive addNew={submasterAddNew('fob_id', 'fobs')} selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options', isLoading: loadingDropdowns }} />
                                </Stack>

                                {/* ── Items ── */}
                                <HStack mt={3}>
                                    <Text fontSize="md" fontWeight="700">Items</Text>
                                </HStack>

                                <TableContainer rounded="md" overflow="auto" border="1px" borderColor="gray.500" borderRadius="md" boxShadow="md">
                                    <Table variant="simple" size="sm">
                                        <Thead bg="gray.500">
                                            <Tr>
                                                <Th color="white">S.No.</Th>
                                                <Th color="white">Part Number</Th>
                                                <Th color="white">Condition</Th>
                                                <Th color="white">Quantity</Th>
                                                <Th color="white">UOM</Th>
                                                <Th color="white">Unit Price</Th>
                                                <Th color="white">Total Value</Th>
                                                <Th color="white">Remarks</Th>
                                                <Th color="white" isNumeric>Action</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {allRows.map((row, index) => {
                                                const isRelatedRow = !!row.source_quotation_id;
                                                return (
                                                    <Tr
                                                        key={row.rowKey}
                                                        background={
                                                            row.is_duplicate ? "yellow.100"
                                                            : isRelatedRow   ? "green.50"
                                                            : ""
                                                        }
                                                    >
                                                        <Td><Text fontSize="medium">{index + 1}.</Text></Td>

                                                        <Td>
                                                            <Text fontWeight="bold">{row.part_number?.name ?? '-'}</Text>
                                                            <Text fontSize="xs" color="gray.500">{row.part_number?.description ?? '-'}</Text>
                                                            {isRelatedRow && (
                                                                <Text fontSize="xs" color="green.600" fontWeight="semibold">Related Quo.</Text>
                                                            )}
                                                        </Td>

                                                        <Td>
                                                            <FieldSelect
                                                                name={`condition_${row.rowKey}`}
                                                                size="sm" menuPortalTarget={document.body}
                                                                required="Condition is required" placeholder="Select..."
                                                                options={conditionOptions}
                                                                defaultValue={row.condition_id || ""}
                                                                onValueChange={(v) => handleInputChange("condition_id", v, index)}
                                                                style={{ minWidth: 130 }}
                                                                isCaseSensitive
                                                                addNew={submasterAddNew(`condition_${row.rowKey}`, 'conditions')}
                                                                selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options', isLoading: loadingDropdowns }}
                                                            />
                                                        </Td>

                                                        <Tooltip hasArrow label="Double-click to change" placement="top" bg="green.600">
                                                            <Td>
                                                                <FieldInput
                                                                    name={`qty_${row.rowKey}`}
                                                                    size="sm" required="Quantity is required" type="integer" placeholder="Qty"
                                                                    defaultValue={row.qty || ""} width="100px" maxLength={9}
                                                                    onValueChange={(v) => handleInputChange("qty", v, index)}
                                                                    onDoubleClick={() => handleDoubleClick(`qty_${row.rowKey}`)}
                                                                    onBlur={() => setActiveInput('')}
                                                                    isReadOnly={activeInput !== `qty_${row.rowKey}`}
                                                                />
                                                            </Td>
                                                        </Tooltip>

                                                        <Td>
                                                            <FieldSelect
                                                                name={`uom_${row.rowKey}`}
                                                                size="sm" menuPortalTarget={document.body}
                                                                required="UOM is required" placeholder="Select..."
                                                                options={uomOptions}
                                                                defaultValue={row.unit_of_measure_id || ""}
                                                                onValueChange={(v) => handleInputChange("unit_of_measure_id", v, index)}
                                                                style={{ minWidth: 120 }}
                                                                isCaseSensitive 
                                                                isDisabled
                                                                className={"disabled-input"}
                                                                selectProps={{ type: 'creatable', noOptionsMessage: () => 'No options', isLoading: loadingDropdowns }}
                                                            />
                                                        </Td>

                                                        <Tooltip hasArrow label="Double-click to change" placement="top" bg="green.600">
                                                            <Td>
                                                                <FieldInput
                                                                    name={`price_${row.rowKey}`}
                                                                    size="sm" required="Unit Price is required" type="number" placeholder="Unit Price"
                                                                    defaultValue={row.price || ""} width="120px" maxLength={15}
                                                                    onValueChange={(v) => handleInputChange("price", v, index)}
                                                                    onDoubleClick={() => handleDoubleClick(`price_${row.rowKey}`)}
                                                                    onBlur={() => setActiveInput('')}
                                                                    isReadOnly={activeInput !== `price_${row.rowKey}`}
                                                                    leftElement={currencySymbol || undefined}
                                                                />
                                                            </Td>
                                                        </Tooltip>

                                                        <Td>
                                                            <FieldInput
                                                                name={`total_value_${row.rowKey}`}
                                                                size="sm" placeholder="—"
                                                                defaultValue={row.total_value || ""} width="120px"
                                                                isReadOnly
                                                                style={{ background: "var(--chakra-colors-gray-50)", cursor: "default" }}
                                                                leftElement={currencySymbol || undefined}
                                                            />
                                                        </Td>

                                                        <Tooltip hasArrow label="Double-click to change" placement="top" bg="green.600">
                                                            <Td>
                                                                <FieldInput
                                                                    name={`note_${row.rowKey}`}
                                                                    size="sm" placeholder="Remark"
                                                                    defaultValue={row.note || ""} maxLength={60}
                                                                    style={{ minWidth: 200 }}
                                                                    onDoubleClick={() => handleDoubleClick(`note_${row.rowKey}`)}
                                                                    onBlur={() => setActiveInput('')}
                                                                    isReadOnly={activeInput !== `note_${row.rowKey}`}
                                                                />
                                                            </Td>
                                                        </Tooltip>

                                                        <Td isNumeric>
                                                            <IconButton
                                                                aria-label="Delete Row"
                                                                colorScheme="red" size="sm"
                                                                icon={<DeleteIcon />}
                                                                onClick={() => deleteRow(row.rowKey, row.source_quotation_id)}
                                                                isDisabled={!isRelatedRow && rows.length <= 1}
                                                            />
                                                        </Td>
                                                    </Tr>
                                                );
                                            })}
                                        </Tbody>
                                    </Table>
                                </TableContainer>

                                {/* ── Totals row ── */}
                                <HStack mt={3}>
                                    <Text>Total Qty: <Text as="span" ml={3} fontWeight="bold">{totalQty}</Text></Text>
                                    <Text ml={3}>Total Line Items: <Text as="span" ml={3} fontWeight="bold">{totalItems}</Text></Text>
                                    <Text ml={3}>Total: <Text as="span" ml={3} fontWeight="bold">{grandTotal.toFixed(2)}</Text></Text>
                                </HStack>

                                {/* ── Charges ── */}
                                <Stack spacing={8} direction={{ base: 'column', md: 'row' }} {...sectionStyle} display={'none'}>
                                    <FieldDisplay label="Sub Total" value={subTotal.toFixed(2)} size="sm" style={{ backgroundColor: '#fff' }} leftElement={currencySymbol || undefined} />
                                    <FieldInput label="Bank Charges" name="bank_charge" size="sm" type="decimal" maxLength={9} leftElement={currencySymbol || undefined} isDisabled/>
                                    <FieldInput label="Freight" name="freight" size="sm" type="decimal" maxLength={9} leftElement={currencySymbol || undefined} isDisabled/>
                                    <FieldInput label="Misc Charges" name="miscellaneous_charges" size="sm" type="decimal" maxLength={9} leftElement={currencySymbol || undefined} isDisabled/>
                                    <FieldInput label="VAT" name="vat" size="sm" type="decimal" maxLength={6} maxValue={999} rightElement="%" isDisabled/>
                                    <FieldDisplay label="VAT Amount" value={vatAmount.toFixed(2)} size="sm" style={{ backgroundColor: '#fff' }} leftElement={currencySymbol || undefined} />
                                    <FieldInput label="Discount" name="discount" size="sm" type="decimal" maxLength={9} leftElement={currencySymbol || undefined} isDisabled/>
                                    <FieldDisplay label="Total Amount" value={totalPayable.toFixed(2)} size="sm" style={{ backgroundColor: '#fff' }} leftElement={currencySymbol || undefined} />
                                </Stack>

                                {/* ── Remarks ── */}
                                <Stack>
                                    <FormControl>
                                        <FormLabel>Remarks</FormLabel>
                                        <FieldHTMLEditor
                                            onValueChange={(v) => form.setValues({ remarks: v })}
                                            maxLength={import.meta.env.VITE_ELABORATE_REMARKS_LENGTH}
                                            placeHolder="Enter Remarks Here"
                                        />
                                    </FormControl>
                                </Stack>

                            </Stack>

                            {/* ── Actions ── */}
                            <Stack direction={{ base: "column", md: "row" }} justify="center" alignItems="center" mt={4}>
                                <Button
                                    type="submit" colorScheme="brand" isLoading={isSaving}
                                    isDisabled={isSaving || (isEdit ? (!isFormValuesChanged || !form.isValid) : false)}
                                >
                                    {isEdit ? "Update" : "Submit"}
                                </Button>
                                <Button onClick={handleOpenPreview} colorScheme="green" isDisabled={!form.isValid} isLoading={previewPDF.isLoading}>
                                    Preview
                                </Button>
                            </Stack>

                        </Formiz>
                    </Stack>

                    <SupplierPricingUpdateSearchPopup
                        isOpen={isSearchOpen}
                        onClose={(selectedId: any) => {
                            if (selectedId) {
                                handleQuotationSelect(String(selectedId));
                                form.setValues({ quotation_id: String(selectedId) });
                            }
                            closeSearch();
                        }}
                        data={quotationId ? { quotation_id: quotationId } : {}}
                    />

                </LoadingOverlay>
            </Stack>
        </SlideIn>
    );
};

export default PurchaseOrderForm;