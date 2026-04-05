import { useState, useEffect, useCallback, useRef } from "react";
import { ChevronRightIcon, DeleteIcon, SearchIcon, ViewIcon } from "@chakra-ui/icons";
import {
    Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink,
    Button, FormControl, FormLabel, HStack, Heading,
    IconButton, Stack, Table, TableContainer, Tbody,
    Td, Text, Th, Thead, Tooltip, Tr, Grid, GridItem,
    useDisclosure, Input
} from "@chakra-ui/react";
import { Formiz, useForm, useFormFields } from "@formiz/core";
import { HiArrowNarrowLeft, HiOutlinePlus } from "react-icons/hi";
import { Link, useNavigate, useParams } from "react-router-dom";
import dayjs from 'dayjs';

import { isFormFieldsChanged } from "@/helpers/FormChangeDetector";
import { FieldDayPicker } from "@/components/FieldDayPicker";
import { FieldHTMLEditor } from "@/components/FieldHTMLEditor";
import { FieldInput } from "@/components/FieldInput";
import { FieldSelect } from "@/components/FieldSelect";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";
import LoadingOverlay from "@/components/LoadingOverlay";
import { formatDate, getDisplayLabel } from "@/helpers/commonHelper";
import { useMaterialRequestList, getMaterialRequestById } from "@/services/purchase/material-request/service";
import { usePRFQDropdowns, useSavePRFQ, usePRFQDetails } from "@/services/purchase/rfq/service";
import { getCustomerRelations, useCustomerList, getCustomerById, useContactGroupList, useContactGroupMembers } from "@/services/master/customer/service";
import { useSubmasterItemIndex } from "@/services/submaster/service";
import { usePDFPreviewController } from "@/api/hooks/usePDFPreviewController";
import { endPoints } from "@/api/endpoints";
import { useUserContext } from "@/services/auth/UserContext";
import { SubMasterModalForm } from '@/pages/Submaster/ModalForm';
import { CustomerModal } from "@/components/Modals/CustomerMaster";
import { ContactManagerModal } from "@/components/Modals/CustomerMaster/ContactManager";
import { MaterialRequestSearchPopup } from "@/components/Popups/Search/Purchase/MaterialRequest";
import { useToastError } from '@/components/Toast';
import ConfirmationPopup from '@/components/ConfirmationPopup';

// ─── Constants ─────────────────────────────────────────────────────────────────

const FORM_KEYS = ["need_by_date", "priority_id", "remarks"];
const str = (v: any) => String(v ?? '');

// ─── Types ──────────────────────────────────────────────────────────────────────

type MRIDRow = { material_request_id: any; id?: any };

type MRRow = {
    rowKey: string;
    part_number_id: any; part_number: any; condition_id: any;
    qty: any; unit_of_measure_id: any; remark: any;
    mr_remark: any; material_request_code: any;
    material_request_item_id: any; material_request_id?: any;
    id?: any; is_existing?: boolean;
};

type VendorRow = {
    rowKey: string; vendor_id: any; customer_contact_manager_id: any;
    customer?: any; customer_contact_manager?: any;
    contact_managers?: any[]; is_duplicate?: boolean;
    is_loading?: boolean; id?: any; is_existing?: boolean;
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

const makeEmptyVendor = (): VendorRow => ({
    rowKey: crypto.randomUUID(), vendor_id: "", customer_contact_manager_id: "",
});

const recomputeDuplicates = (rows: VendorRow[]): VendorRow[] => {
    const count = new Map<string, number>();
    rows.forEach(({ vendor_id, customer_contact_manager_id }) => {
        if (vendor_id && customer_contact_manager_id) {
            const key = `${vendor_id}-${customer_contact_manager_id}`;
            count.set(key, (count.get(key) ?? 0) + 1);
        }
    });
    return rows.map(row => ({
        ...row,
        is_duplicate: (count.get(`${row.vendor_id}-${row.customer_contact_manager_id}`) ?? 0) > 1,
    }));
};

// ─── Component ─────────────────────────────────────────────────────────────────

export const PRFQForm = () => {
    const navigate = useNavigate();
    const { userInfo } = useUserContext();
    const { id } = useParams<{ id?: string }>();
    const isEdit = !!id;
    const toastError = useToastError();
    const title = isEdit ? "Edit Purchase RFQ" : "Add New Purchase RFQ";

    // ── Refs ───────────────────────────────────────────────────────────────────
    // Tracks whether we've already prefilled from itemInfo so MR-sync effect doesn't overwrite
    const prefillDoneRef = useRef(false);
    const fetchTriggeredRef = useRef(false);

    // ── UI State ───────────────────────────────────────────────────────────────
    const [isMRLoading, setIsMRLoading] = useState(false);
    const { isOpen: isMRModalOpen, onOpen: openMRModal, onClose: closeMRModal } = useDisclosure();
    const [openConfirmation, setOpenConfirmation] = useState(false);
    const [vendorGroup, setVendorGroup] = useState<any>('');
    const [groupVendorsAdded, setGroupVendorsAdded] = useState(false);
    const [disabledDatePicker, setDisabledDatePicker] = useState(true);

    // ── Data State ─────────────────────────────────────────────────────────────
    const [selectedMRIds, setSelectedMRIds] = useState<string[]>([]);
    const [selectedMaterialRequests, setSelectedMaterialRequests] = useState<any[]>([]);
    const [mrIds, setMRIds] = useState<MRIDRow[]>([]);
    const [rows, setRows] = useState<MRRow[]>([]);
    const [vendors, setVendors] = useState<VendorRow[]>([makeEmptyVendor()]);

    // Snapshots for change detection
    const [initialValues, setInitialValues] = useState<any>(null);
    const [initialMRIds, setInitialMRIds] = useState<string[]>([]);
    const [initialVendorSnapshots, setInitialVendorSnapshots] = useState<{ vendor_id: any; customer_contact_manager_id: any }[]>([]);
    const [initialRowSnapshots, setInitialRowSnapshots] = useState<{ material_request_item_id: any; condition_id: any; qty: any; unit_of_measure_id: any; remark: any }[]>([]);

    // ── Remote Data ────────────────────────────────────────────────────────────
    const { data: dropdownData, isLoading: l1, refetch: reloadDropDowns } = usePRFQDropdowns();
    const { data: itemInfo, isLoading: l2, refetch: fetchItemInfo } = usePRFQDetails(id, { enabled: false });
    const { data: materialRequestList, isLoading: l3 } = useMaterialRequestList();
    const { data: customerList, isLoading: l4, refetch: reloadCustomers } = useCustomerList();
    const { data: contactGroupList, isLoading: l5 } = useContactGroupList();

    const { data: priorityList } = useSubmasterItemIndex("priorities", {});
    const { data: conditionData } = useSubmasterItemIndex("conditions", {});
    const { data: uomData } = useSubmasterItemIndex("unit-of-measures", {});
    const { data: contactTypeData } = useSubmasterItemIndex("contact-types", {});

    const filterContactTypeCodes = ['SUP', 'PUR'];
    const filteredContactTypeIds = contactTypeData?.data
        .filter((item: any) => filterContactTypeCodes.includes(item.code))
        .map((item: any) => item.id);

    const { isLoading: l6, refetch: fetchGroupMembers } = useContactGroupMembers({
        groupId: vendorGroup,
        contact_type_ids: filteredContactTypeIds,
        enabled: false,
    });

    const isLoading = l1 || l2 || l3 || l4 || l5 || l6 || isMRLoading;

    // ── Derived Options ────────────────────────────────────────────────────────
    const priorityOptions = dropdownData?.priorities ?? [];
    const priorityItems = (priorityList?.data ?? []) as any[];
    const conditionOptions = conditionData?.data?.map((c: any) => ({ value: c.id, label: c.name })) ?? [];
    const uomOptions = uomData?.data?.map((u: any) => ({ value: u.id, label: u.name })) ?? [];
    const fixedMRIds: string[] = isEdit ? (itemInfo?.data?.material_request_ids ?? []).map(String) : [];
    const materialRequestOptions = (materialRequestList?.data ?? []).map((opt: any) => ({
        ...opt, isFixed: fixedMRIds.includes(String(opt.value)),
    }));
    const customerOptions = customerList?.data ?? [];
    const contactGroupOptions = contactGroupList?.data ?? [];

    // ── Form ───────────────────────────────────────────────────────────────────
    const saveEndpoint = useSavePRFQ();
    const isSaving = saveEndpoint.isLoading;

    const form = useForm({
        onValidSubmit: (values) => {
            const payload: any = Object.fromEntries(FORM_KEYS.map(k => [k, values[k]]));
            payload.need_by_date = formatDate(fields['need_by_date'].value) as string;

            if (isEdit) {
                const existingMRs = mrIds.map(mr => ({ material_request_id: mr.material_request_id, ...(mr.id && { id: mr.id }) }));
                const newMRs = selectedMRIds
                    .filter(sid => !initialMRIds.includes(str(sid)))
                    .map(sid => ({ material_request_id: sid }));
                payload.material_requests = [...existingMRs, ...newMRs];
            } else {
                payload.material_request_ids = selectedMRIds;
            }

            payload.items = rows.map(row => ({
                part_number_id: row.part_number_id,
                condition_id: values[`condition_${row.rowKey}`],
                qty: Number(values[`qty_${row.rowKey}`]),
                unit_of_measure_id: values[`uom_${row.rowKey}`],
                remark: values[`remark_${row.rowKey}`],
                material_request_item_id: row.material_request_item_id,
                ...(row.id && { id: row.id }),
            }));

            payload.vendors = vendors.map(v => ({
                vendor_id: v.vendor_id,
                customer_contact_manager_id: v.customer_contact_manager_id,
                ...(v.id && { id: v.id }),
            }));

            saveEndpoint.mutate(isEdit ? { id, ...payload } : payload, {
                onSuccess: () => navigate('/purchase/rfq/master'),
            });
        },
    });

    const fields = useFormFields({ connect: form });

    // ── Change Detection ───────────────────────────────────────────────────────
    const isHeaderChanged = isFormFieldsChanged({ fields, initialValues, keys: FORM_KEYS });

    const isMRIdsChanged = selectedMRIds.length !== initialMRIds.length ||
        selectedMRIds.some(sid => !new Set(initialMRIds).has(str(sid)));

    const isVendorsChanged = vendors.length !== initialVendorSnapshots.length ||
        vendors.some((v, i) =>
            str(v.vendor_id) !== str(initialVendorSnapshots[i]?.vendor_id) ||
            str(v.customer_contact_manager_id) !== str(initialVendorSnapshots[i]?.customer_contact_manager_id)
        );

    const isRowsChanged = (() => {
        const existingRows = rows.filter(r => r.is_existing);
        if (rows.some(r => !r.is_existing)) return true;
        if (existingRows.length !== initialRowSnapshots.length) return true;
        return existingRows.some((row, i) => {
            const s = initialRowSnapshots[i];
            return !s ||
                str(fields[`condition_${row.rowKey}`]?.value) !== str(s.condition_id) ||
                str(fields[`qty_${row.rowKey}`]?.value) !== str(s.qty) ||
                str(fields[`uom_${row.rowKey}`]?.value) !== str(s.unit_of_measure_id) ||
                str(fields[`remark_${row.rowKey}`]?.value) !== str(s.remark);
        });
    })();

    const isFormValuesChanged = isHeaderChanged || isMRIdsChanged || isVendorsChanged || isRowsChanged;

    // ── Trigger fetchItemInfo once priorityItems + id are ready ───────────────
    // Using a ref so this only fires ONCE even if priorityItems re-renders
    useEffect(() => {
        if (id && priorityItems.length > 0 && !fetchTriggeredRef.current) {
            fetchTriggeredRef.current = true;
            fetchItemInfo();
        }
    }, [id, priorityItems.length]);

    // ── Prefill form from itemInfo (edit mode) ─────────────────────────────────
    useEffect(() => {
        if (!itemInfo?.data || !priorityItems.length) return;

        const s = itemInfo.data;
        prefillDoneRef.current = false; // reset while we're setting up

        // Header fields
        const values = Object.fromEntries(FORM_KEYS.map(k => [k, (s as any)[k]]));
        values.need_by_date = dayjs(values.need_by_date);
        setInitialValues(values);
        form.setValues(values);

        // Priority → date picker
        if (s.priority_id) {
            const days = priorityItems.find((u: any) => str(u.id) === str(s.priority_id))?.days ?? 0;
            setDisabledDatePicker(days !== 0);
        }

        // MR IDs
        const mrIdRows: MRIDRow[] = (s.material_requests ?? []).map((mrItem: any) => ({
            id: mrItem.id ?? "", material_request_id: mrItem.material_request_id ?? "",
        }));
        setMRIds(mrIdRows);

        if (s.material_request_ids?.length) {
            const mrIdStrings = s.material_request_ids.map(String);
            setInitialMRIds(mrIdStrings);
            setSelectedMRIds(mrIdStrings);
            form.setValues({ material_request_id: s.material_request_ids });
            // Prefill selectedMaterialRequests directly from nested data — no extra fetch needed
            const embeddedMRs = (s.material_requests ?? []).map((pmr: any) => pmr.material_request).filter(Boolean);
            setSelectedMaterialRequests(embeddedMRs);
        }

        // Vendors
        if (s.vendors?.length) {
            const prefilled: VendorRow[] = s.vendors.map((v: any) => ({
                rowKey: crypto.randomUUID(), id: v.id ?? "",
                vendor_id: v.vendor_id ?? "", customer_contact_manager_id: v.customer_contact_manager_id ?? "",
                customer: v.vendor ?? undefined,
                contact_managers: v.customer_contact_manager ? [v.customer_contact_manager] : [],
                customer_contact_manager: v.customer_contact_manager ?? undefined,
                is_existing: true,
            }));
            setVendors(recomputeDuplicates(prefilled));
            setInitialVendorSnapshots(prefilled.map(v => ({
                vendor_id: v.vendor_id,
                customer_contact_manager_id: v.customer_contact_manager_id,
            })));
            prefilled.forEach((row, index) => { if (row.vendor_id) loadVendorData(index, row.vendor_id, true); });
        }

        // Items/Rows — set directly from API data, bypass MR sync
        if (s.items?.length) {
            const prefilledRows: MRRow[] = s.items.map((item: any) => ({
                id: item.id ?? "", rowKey: crypto.randomUUID(),
                material_request_id: item.material_request_info?.id ?? "",
                material_request_code: item.material_request_code ?? item.material_request_info?.code ?? "",
                part_number_id: item.part_number_id ?? "", part_number: item.part_number ?? null,
                condition_id: item.condition_id ?? "", qty: item.qty ?? "",
                unit_of_measure_id: item.unit_of_measure_id ?? "",
                mr_remark: item.material_request_item_info?.remark ?? "",
                remark: item.remark ?? "", material_request_item_id: item.material_request_item_id ?? "",
                is_existing: true,
            }));
            setRows(prefilledRows);
            setInitialRowSnapshots(prefilledRows.map(row => ({
                material_request_item_id: row.material_request_item_id,
                condition_id: row.condition_id, qty: row.qty,
                unit_of_measure_id: row.unit_of_measure_id, remark: row.remark,
            })));
            // Defer so row fields are registered before values are set
            setTimeout(() => {
                const rowValues = prefilledRows.reduce((acc, row) => ({
                    ...acc,
                    [`condition_${row.rowKey}`]: row.condition_id,
                    [`qty_${row.rowKey}`]: row.qty,
                    [`uom_${row.rowKey}`]: row.unit_of_measure_id,
                    [`remark_${row.rowKey}`]: row.remark,
                }), {});
                form.setValues(rowValues);
            }, 0);
        }

        // Mark prefill complete — MR sync effect will now be allowed to run for NEW additions only
        prefillDoneRef.current = true;

    }, [itemInfo, priorityItems]);

    // ── Fetch missing MR details when selectedMRIds changes ───────────────────
    useEffect(() => {
        if (selectedMRIds.length === 0) {
            setSelectedMaterialRequests([]);
            return;
        }

        const alreadyFetchedIds = new Set(selectedMaterialRequests.map(mr => str(mr.id)));
        const toFetch = selectedMRIds.filter(sid => !alreadyFetchedIds.has(sid));
        const retained = selectedMaterialRequests.filter(mr => selectedMRIds.includes(str(mr.id)));

        // Remove rows from deselected MRs (keep existing rows in edit mode)
        setRows(prev => prev.filter(row =>
            !row.material_request_id ||
            initialMRIds.includes(str(row.material_request_id)) ||
            selectedMRIds.includes(str(row.material_request_id))
        ));

        if (toFetch.length === 0) {
            if (retained.length !== selectedMaterialRequests.length) {
                setSelectedMaterialRequests(retained);
            }
            return;
        }

        setIsMRLoading(true);
        (async () => {
            try {
                const fetched = await Promise.all(toFetch.map(getMaterialRequestById));
                setSelectedMaterialRequests([...retained, ...fetched]);
            } finally {
                setIsMRLoading(false);
            }
        })();
    }, [selectedMRIds]);

    // ── Sync header fields + NEW rows from selectedMaterialRequests ────────────
    useEffect(() => {
        if (selectedMaterialRequests.length === 0) {
            // Only wipe rows/fields if not in edit mode or prefill hasn't run
            if (!isEdit || !prefillDoneRef.current) {
                setRows([]);
                form.setValues({ priority_id: '', need_by_date: '' });
                setDisabledDatePicker(true);
            }
            return;
        }

        // Always update header priority/date
        const priorityIds = selectedMaterialRequests.map(mr => str(mr.priority?.id ?? (isEdit ? mr.priority_id : '')));
        const allSamePriority = priorityIds.length > 0 && priorityIds.every(pid => pid === priorityIds[0]);
        const today = dayjs().startOf('day');
        const dueDates = selectedMaterialRequests
            .map(mr => mr.due_date ? dayjs(mr.due_date) : null)
            .filter(Boolean) as dayjs.Dayjs[];
        const maxDueDate = dueDates.length > 0
            ? dueDates.reduce((max, d) => d.isAfter(max) ? d : max)
            : null;
        const isMaxDateValid = maxDueDate ? maxDueDate.isSame(today) || maxDueDate.isAfter(today) : false;

        if (allSamePriority && isMaxDateValid) {
            setDisabledDatePicker(true);
            form.setValues({ priority_id: priorityIds[0], need_by_date: maxDueDate });
        } else {
            const customPriority = priorityItems.find(p => p.is_custom);
            setDisabledDatePicker(false);
            form.setValues({
                priority_id: customPriority ? str(customPriority.id) : '',
                need_by_date: isMaxDateValid ? maxDueDate : '',
            });
        }

        // In edit mode after prefill: only ADD rows for newly selected MRs, don't touch existing rows
        if (isEdit && prefillDoneRef.current) {
            const existingItemIds = new Set(rows.filter(r => r.is_existing).map(r => str(r.material_request_item_id)));
            const newRows = selectedMaterialRequests.flatMap(mr =>
                (mr.items ?? [])
                    .filter((item: any) => !existingItemIds.has(str(item.id)))
                    .map((item: any) => ({
                        rowKey: crypto.randomUUID(), material_request_id: mr.id, material_request_code: mr.code,
                        part_number_id: item.part_number_id ?? '', part_number: item.part_number,
                        condition_id: item.condition_id ?? '', qty: item.qty ?? '',
                        unit_of_measure_id: item.unit_of_measure_id ?? '', mr_remark: item.remark,
                        remark: '', material_request_item_id: item.id ?? '',
                    }))
            );
            if (newRows.length > 0) {
                setRows(prev => [...prev, ...newRows]);
            }
            return;
        }

        // Add mode (or before prefill is done — shouldn't happen but safe fallback)
        if (!isEdit) {
            const newRows = selectedMaterialRequests.flatMap(mr =>
                (mr.items ?? []).map((item: any) => ({
                    rowKey: crypto.randomUUID(), material_request_id: mr.id, material_request_code: mr.code,
                    part_number_id: item.part_number_id ?? '', part_number: item.part_number,
                    condition_id: item.condition_id ?? '', qty: item.qty ?? '',
                    unit_of_measure_id: item.unit_of_measure_id ?? '', mr_remark: item.remark,
                    remark: '', material_request_item_id: item.id ?? '',
                }))
            );
            setRows(newRows);
        }
    }, [selectedMaterialRequests]);

    // ── PDF Preview ────────────────────────────────────────────────────────────
    const previewPDF = usePDFPreviewController({ url: endPoints.preview_post.prfq, title: "PRFQ PREVIEW" });

    const handleOpenPreview = (vendorId?: string, contactManagerId?: string) => {
        const vars: any = { user_id: userInfo.id };
        Object.keys(fields).forEach(k => { vars[k] = fields[k].value; });
        vars.type = "oe";
        vars.need_by_date = formatDate(fields['need_by_date'].value) as string;
        vars.items = rows.map(row => ({
            part_number_id: row?.part_number_id,
            condition_id: fields[`condition_${row.rowKey}`].value,
            qty: Number(fields[`qty_${row.rowKey}`].value),
            unit_of_measure_id: fields[`uom_${row.rowKey}`].value,
            mr_remark: row?.mr_remark,
            mr_code: row?.material_request_code,
            remark: fields[`remark_${row.rowKey}`].value,
        }));
        if (vendorId && contactManagerId) {
            vars.vendor_id = vendorId;
            vars.customer_contact_manager_id = contactManagerId;
        } else {
            vars.vendors = vendors.map(row => ({
                vendor_id: row?.vendor_id,
                customer_contact_manager_id: row?.customer_contact_manager_id,
            }));
        }
        previewPDF.open(vars);
    };

    // ── MR Modal ───────────────────────────────────────────────────────────────
    const handleMRApply = (ids: string[]) => {
        setSelectedMRIds(ids);
        setMRIds(prev => {
            const existingMap = new Map(prev.map(item => [item.material_request_id, item]));
            return ids.map(sid => existingMap.get(sid) ?? { id: null, material_request_id: sid });
        });
        form.setValues({ material_request_id: ids });
        closeMRModal();
    };

    // ── Add-new helper ─────────────────────────────────────────────────────────
    const handleAddNewSuccess = (fieldName: string, refetch: () => void) => (data: any) => {
        const newId = (data?.data ?? data)?.id;
        setTimeout(() => { refetch(); setTimeout(() => form.setValues({ [fieldName]: newId }), 50); }, 100);
    };

    // ── Priority → due date ────────────────────────────────────────────────────
    const handlePriorityChange = (priority: any) => {
        const days = priorityItems.find(u => str(u.id) === str(priority))?.days ?? 0;
        if (days === 0) { setDisabledDatePicker(false); form.setValues({ need_by_date: '' }); }
        else { setDisabledDatePicker(true); form.setValues({ need_by_date: dayjs().add(days, 'day') }); }
    };

    // ── Vendor Group ───────────────────────────────────────────────────────────
    const handleChangeVendorGroup = (group: any) => {
        setVendorGroup(group);
        setGroupVendorsAdded(false);
        if (!group) setVendors([makeEmptyVendor()]);
    };

    const handleConfirm = async () => {
        setOpenConfirmation(false);
        if (!vendorGroup) return;

        const result = await fetchGroupMembers();
        const members = result?.data?.data ?? [];
        if (members.length === 0) return;

        const newVendors: VendorRow[] = members.map((m: any) => ({
            rowKey: crypto.randomUUID(),
            vendor_id: m.contact_id,
            customer_contact_manager_id: "",
            customer: m.contact,
            contact_managers: [],
        }));

        const existingIds = new Set(vendors.map(v => v.vendor_id).filter(Boolean));
        const dedupedNew = newVendors.filter(v => !existingIds.has(v.vendor_id));
        const duplicateCount = newVendors.length - dedupedNew.length;

        if (duplicateCount > 0) {
            toastError({
                title: "Duplicate Vendors Skipped",
                description: `${duplicateCount} vendor${duplicateCount > 1 ? "s" : ""} already exist and were not added.`,
            });
        }

        setVendors(prev => {
            const merged = [...prev.filter(v => v.vendor_id), ...dedupedNew];
            return recomputeDuplicates(merged.length ? merged : [makeEmptyVendor()]);
        });

        dedupedNew.forEach((v, i) => {
            const index = vendors.filter(r => r.vendor_id).length + i;
            if (v.vendor_id) loadVendorData(index, v.vendor_id, false);
        });

        setGroupVendorsAdded(true);
    };

    // ── Vendor Handlers ────────────────────────────────────────────────────────
    const addVendor = () => setVendors(prev => [...prev, makeEmptyVendor()]);
    const deleteVendor = (key: string) => setVendors(prev => prev.filter(r => r.rowKey !== key));

    const loadVendorData = useCallback(async (index: number, vendorId: string, preserveContact = false) => {
        setVendors(prev => {
            const next = [...prev];
            next[index] = {
                ...next[index], is_loading: true, customer: undefined, contact_managers: [],
                ...(!preserveContact && { customer_contact_manager_id: "", customer_contact_manager: undefined }),
            };
            return next;
        });
        try {
            const [customer, contacts] = await Promise.all([
                getCustomerById(vendorId),
                getCustomerRelations(vendorId, "contact-managers"),
            ]);
            setVendors(prev => {
                const next = [...prev];
                const existingContactId = next[index].customer_contact_manager_id;
                const matchedContact = contacts?.find((c: any) => str(c.id) === str(existingContactId));
                next[index] = {
                    ...next[index], customer, contact_managers: contacts ?? [], is_loading: false,
                    ...(preserveContact && matchedContact && { customer_contact_manager: matchedContact }),
                };
                return recomputeDuplicates(next);
            });
        } catch {
            setVendors(prev => { const next = [...prev]; next[index] = { ...next[index], is_loading: false }; return next; });
        }
    }, []);

    const handleVendorSelect = (vendorId: string, index: number) => {
        setVendors(prev => {
            if (prev.some((v, i) => i !== index && v.vendor_id === vendorId)) {
                toastError({ title: "Duplicate Entry!!", description: "This vendor is already selected in another row." });
                return prev;
            }
            const next = [...prev];
            next[index] = { ...next[index], vendor_id: vendorId };
            return recomputeDuplicates(next);
        });
        if (vendorId) loadVendorData(index, vendorId, false);
    };

    const handleContactSelect = (contactId: string, index: number) => {
        setVendors(prev => {
            const next = [...prev];
            next[index] = {
                ...next[index], customer_contact_manager_id: contactId,
                customer_contact_manager: next[index].contact_managers?.find((c: any) => c.id === contactId),
            };
            return recomputeDuplicates(next);
        });
    };

    const handleNewContactCreated = async (newId: string, index: number) => {
        const vendorId = vendors[index]?.vendor_id;
        if (!vendorId) return;
        const contacts = await getCustomerRelations(vendorId, "contact-managers");
        setVendors(prev => {
            const next = [...prev];
            next[index] = {
                ...next[index], contact_managers: contacts ?? [], customer_contact_manager_id: newId,
                customer_contact_manager: contacts?.find((c: any) => c.id === newId),
            };
            return recomputeDuplicates(next);
        });
        form.setValues({ [`customer_contact_manager_id_${vendors[index].rowKey}`]: newId });
    };

    const deleteRow = (key: string) => setRows(prev => prev.filter(r => r.rowKey !== key));

    const handleRowChange = (field: string, value: any, index: number) => {
        setRows(prev => { const next = [...prev]; next[index] = { ...next[index], [field]: value }; return next; });
    };

    // ── Derived Totals ─────────────────────────────────────────────────────────
    const totalQty = rows.reduce((acc, row) => acc + (Number(fields[`qty_${row.rowKey}`]?.value) || 0), 0);
    const totalItems = rows.filter(row => fields[`part_number_${row.rowKey}`]?.value).length;

    const mkSelectProps = (isLoadingFlag?: boolean) => ({
        type: 'creatable' as const,
        noOptionsMessage: () => 'No options found',
        isLoading: isLoadingFlag,
    });

    // ─── Render ────────────────────────────────────────────────────────────────
    return (
        <SlideIn>
            <Stack pl={2} spacing={4}>

                {/* ── Page Header ── */}
                <HStack justify="space-between">
                    <Stack spacing={0}>
                        <Breadcrumb fontWeight="medium" fontSize="sm" separator={<ChevronRightIcon boxSize={6} color="gray.500" />}>
                            <BreadcrumbItem color="brand.500">
                                <BreadcrumbLink as={Link} to="/purchase/rfq/master">Purchase RFQ</BreadcrumbLink>
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
                        <Text fontSize="md" fontWeight="700">Purchase RFQ</Text>

                        <Formiz autoForm connect={form}>
                            <FieldInput name="remarks" size="sm" sx={{ display: "none" }} />

                            <Stack spacing={2}>

                                {/* ── MR Selection + Preview Table ── */}
                                <Grid templateColumns={{ base: "1fr", md: "3fr 7fr" }} gap={6} alignItems="stretch">
                                    <GridItem>
                                        <Box rounded="md" border="1px solid" borderColor="gray.300" p={4} h="100%">
                                            <Stack spacing={4}>
                                                <FormControl>
                                                    <FormLabel>
                                                        Material Request
                                                        <IconButton aria-label="Open MR Search" colorScheme="brand" size="sm" icon={<SearchIcon />} onClick={openMRModal} ml={2} />
                                                    </FormLabel>
                                                    <FieldSelect
                                                        name="material_request_id" required="Material Request is required"
                                                        options={materialRequestOptions} isClearable isMulti
                                                        onValueChange={(v) => setSelectedMRIds(v ?? [])}
                                                        selectProps={{ noOptionsMessage: () => 'No Material Requests' }}
                                                    />
                                                </FormControl>
                                                <FieldSelect
                                                    label="Priority" name="priority_id" placeholder="Select..."
                                                    options={priorityOptions} required="Priority is required" size="sm"
                                                    onValueChange={handlePriorityChange} isDisabled className="disabled-input"
                                                    addNew={{
                                                        label: '+ Add New',
                                                        CreateModal: (p) => <SubMasterModalForm {...p} model="priorities" isEdit={false} />,
                                                        onSuccess: handleAddNewSuccess('priority_id', reloadDropDowns),
                                                    }}
                                                    selectProps={mkSelectProps(l1)}
                                                />
                                                <FieldDayPicker
                                                    label="Need By Date" name="need_by_date"
                                                    placeholder="Select Need By Date" required="Need By Date is required" size="sm"
                                                    dayPickerProps={{ inputProps: { isDisabled: disabledDatePicker } }}
                                                />
                                            </Stack>
                                        </Box>
                                    </GridItem>

                                    <GridItem>
                                        <Box rounded="md" border="1px solid" borderColor="gray.300" p={4} h="100%">
                                            <TableContainer>
                                                <Table variant="simple" size="sm">
                                                    <Thead>
                                                        <Tr>
                                                            <Th>MR Reference</Th>
                                                            <Th>MR Type</Th>
                                                            <Th>Need by Date</Th>
                                                            <Th>Priority</Th>
                                                        </Tr>
                                                    </Thead>
                                                    <Tbody>
                                                        {selectedMaterialRequests.length > 0
                                                            ? selectedMaterialRequests.map((item: any, i: number) => (
                                                                <Tr key={i}>
                                                                    <Td>{item?.code}</Td>
                                                                    <Td>{item?.type_label}</Td>
                                                                    <Td>{item?.due_date ? dayjs(item.due_date).format('DD-MMM-YYYY') : '-'}</Td>
                                                                    <Td>{getDisplayLabel(priorityOptions, item?.priority_id, 'priority')}</Td>
                                                                </Tr>
                                                            ))
                                                            : <Tr><Td colSpan={4} textAlign="center" color="gray.400">No Material Request Selected</Td></Tr>
                                                        }
                                                    </Tbody>
                                                </Table>
                                            </TableContainer>
                                        </Box>
                                    </GridItem>
                                </Grid>

                                {/* ── Vendors ── */}
                                <HStack justify="space-between" mt={3}>
                                    <Text fontSize="md" fontWeight="700">Vendors</Text>
                                    <HStack spacing={2} align="center">
                                        <FieldSelect
                                            name="customer_group_id" placeholder="Select Contact Group"
                                            options={contactGroupOptions} size="sm"
                                            onValueChange={handleChangeVendorGroup} isClearable
                                            selectProps={{ noOptionsMessage: () => 'No Contact Group found' }}
                                        />
                                        <Button
                                            colorScheme="brand" size="sm" minW={0} type="button"
                                            onClick={() => setOpenConfirmation(true)}
                                            isDisabled={!vendorGroup || isLoading || groupVendorsAdded}
                                            isLoading={isLoading}
                                        >
                                            Add
                                        </Button>
                                    </HStack>
                                </HStack>

                                <TableContainer rounded="md" overflow="auto" border="1px" borderColor="gray.500" borderRadius="md" boxShadow="md">
                                    <Table variant="striped" size="sm">
                                        <Thead bg="gray.500">
                                            <Tr>
                                                {["S.No.", "Vendor Name", "Vendor Code", "Contact", "Address"].map(h =>
                                                    <Th key={h} color="white">{h}</Th>)}
                                                <Th color="white" isNumeric>Action</Th>
                                            </Tr>
                                        </Thead>
                                        <Tbody>
                                            {vendors.map((vendor, index) => {
                                                const selectedVendorIds = vendors.map(v => v.vendor_id).filter(Boolean);
                                                const filteredOptions = customerOptions.filter(opt =>
                                                    opt.value === vendor.vendor_id || !selectedVendorIds.includes(opt.value)
                                                );
                                                const isLast = index === vendors.length - 1;
                                                const canAdd = !vendor.vendor_id || !vendor.customer_contact_manager_id;

                                                return (
                                                    <Tr key={vendor.rowKey} background={vendor.is_duplicate ? "yellow.100" : ""}>
                                                        <Td><Text fontSize="medium">{index + 1}.</Text></Td>
                                                        <Td>
                                                            <FieldSelect
                                                                name={`vendor_id_${vendor.rowKey}`} size="sm"
                                                                menuPortalTarget={document.body} required="Vendor is required"
                                                                placeholder="Select Vendor" options={filteredOptions}
                                                                defaultValue={vendor.vendor_id || ""}
                                                                onValueChange={(v) => handleVendorSelect(v ?? '', index)}
                                                                style={{ minWidth: 130 }}
                                                                addNew={{
                                                                    label: '+ Add New',
                                                                    CreateModal: (p) => (
                                                                        <CustomerModal {...p} onClose={p.onClose}
                                                                            onSuccess={(data: any) => {
                                                                                const newId = data?.id;
                                                                                reloadCustomers();
                                                                                form.setValues({ [`vendor_id_${vendor.rowKey}`]: newId });
                                                                                handleVendorSelect(newId, index);
                                                                            }}
                                                                        />
                                                                    ),
                                                                }}
                                                                selectProps={mkSelectProps(l4)}
                                                            />
                                                        </Td>
                                                        <Td><Input size="sm" placeholder="Vendor Code" disabled value={vendor?.customer?.code ?? ""} /></Td>
                                                        <Td>
                                                            <FieldSelect
                                                                name={`customer_contact_manager_id_${vendor.rowKey}`} size="sm"
                                                                menuPortalTarget={document.body} required="Contact is required"
                                                                placeholder="Select..." defaultValue={vendor.customer_contact_manager_id || ""}
                                                                options={vendor.contact_managers?.map((c: any) => ({ value: c.id, label: c.attention })) ?? []}
                                                                onValueChange={(v) => handleContactSelect(v, index)}
                                                                style={{ minWidth: 130 }}
                                                                addNew={{
                                                                    label: '+ Add New',
                                                                    CreateModal: (p) => (
                                                                        <ContactManagerModal {...p} customerId={vendor.vendor_id} isEdit={false}
                                                                            customerInfo={vendor?.customer} onClose={p.onClose}
                                                                            onSuccess={(data: any) => handleNewContactCreated(data?.id, index)}
                                                                        />
                                                                    ),
                                                                }}
                                                                selectProps={mkSelectProps(vendor.is_loading)}
                                                            />
                                                        </Td>
                                                        <Td><Input size="sm" placeholder="Address" disabled value={vendor?.customer_contact_manager?.address_line1 ?? ""} /></Td>
                                                        <Td isNumeric>
                                                            <IconButton aria-label="View Row" colorScheme="green" size="sm" icon={<ViewIcon />}
                                                                onClick={() => handleOpenPreview(vendor.vendor_id, vendor.customer_contact_manager_id)}
                                                                isDisabled={!vendor.vendor_id || !vendor.customer_contact_manager_id} mr={2}
                                                            />
                                                            {isLast && (
                                                                <IconButton aria-label="Add Row" variant="@primary" size="sm" icon={<HiOutlinePlus />}
                                                                    onClick={addVendor} mr={2} isDisabled={canAdd}
                                                                />
                                                            )}
                                                            <Tooltip label="You cant delete existing vendor while edit." placement="left"
                                                                hasArrow color="white" isDisabled={vendor.is_existing !== true} background="red">
                                                                <IconButton aria-label="Delete Row" colorScheme="red" size="sm" icon={<DeleteIcon />}
                                                                    onClick={() => deleteVendor(vendor.rowKey)}
                                                                    isDisabled={vendors.length <= 1 || vendor.is_existing === true}
                                                                />
                                                            </Tooltip>
                                                        </Td>
                                                    </Tr>
                                                );
                                            })}
                                        </Tbody>
                                    </Table>
                                </TableContainer>

                                {/* ── RFQ Items ── */}
                                {rows.length > 0 && (
                                    <Box>
                                        <HStack justify="space-between" mt={3}>
                                            <Text fontSize="md" fontWeight="700">RFQ Items</Text>
                                        </HStack>
                                        <TableContainer rounded="md" overflow="auto" border="1px" borderColor="gray.500" borderRadius="md" boxShadow="md">
                                            <Table variant="striped" size="sm">
                                                <Thead bg="gray.500">
                                                    <Tr>
                                                        {["S.No.", "MR REF", "Part Number", "Description", "Condition", "Quantity", "UOM", "MR Remarks", "Remarks"].map(h =>
                                                            <Th key={h} color="white">{h}</Th>)}
                                                        <Th color="white" isNumeric>Action</Th>
                                                    </Tr>
                                                </Thead>
                                                <Tbody>
                                                    {rows.map((row, index) => (
                                                        <Tr key={row.rowKey}>
                                                            <Td><Text fontSize="medium">{index + 1}.</Text></Td>
                                                            <Td><Text>{row?.material_request_code}</Text></Td>
                                                            <Td><Text>{row?.part_number?.name}</Text></Td>
                                                            <Td><Text>{row?.part_number?.description}</Text></Td>
                                                            <Td>
                                                                <FieldSelect
                                                                    name={`condition_${row.rowKey}`} size="sm"
                                                                    menuPortalTarget={document.body} required="Condition is required"
                                                                    placeholder="Select..." options={conditionOptions}
                                                                    defaultValue={row.condition_id || ""}
                                                                    onValueChange={(v) => handleRowChange("condition_id", v, index)}
                                                                    style={{ minWidth: 130 }}
                                                                    addNew={{
                                                                        label: '+ Add New',
                                                                        CreateModal: (p) => <SubMasterModalForm {...p} model="conditions" isEdit={false} />,
                                                                        onSuccess: handleAddNewSuccess(`condition_${row.rowKey}`, reloadDropDowns),
                                                                    }}
                                                                    selectProps={mkSelectProps(l1)}
                                                                />
                                                            </Td>
                                                            <Td>
                                                                <FieldInput name={`qty_${row.rowKey}`} size="sm" required="Quantity is required"
                                                                    type="integer" placeholder="Qty" defaultValue={row.qty || ""}
                                                                    width="100px" maxLength={9} onValueChange={(v) => handleRowChange("qty", v, index)}
                                                                />
                                                            </Td>
                                                            <Td>
                                                                <FieldSelect
                                                                    name={`uom_${row.rowKey}`} size="sm"
                                                                    menuPortalTarget={document.body} required="UOM is required"
                                                                    placeholder="Select..." options={uomOptions}
                                                                    defaultValue={row.unit_of_measure_id || ""}
                                                                    onValueChange={(v) => handleRowChange("unit_of_measure_id", v, index)}
                                                                    style={{ minWidth: 120 }} isDisabled className="disabled-input"
                                                                    addNew={{
                                                                        label: '+ Add New',
                                                                        CreateModal: (p) => <SubMasterModalForm {...p} model="unit_of_measures" isEdit={false} />,
                                                                        onSuccess: handleAddNewSuccess(`uom_${row.rowKey}`, reloadDropDowns),
                                                                    }}
                                                                    selectProps={mkSelectProps(l1)}
                                                                />
                                                            </Td>
                                                            <Td><Text>{row?.mr_remark}</Text></Td>
                                                            <Tooltip label={fields[`remark_${row.rowKey}`]?.value ?? ""} placement="left"
                                                                hasArrow color="white"
                                                                isDisabled={str(fields[`remark_${row.rowKey}`]?.value ?? "").length <= 20}>
                                                                <Td>
                                                                    <FieldInput name={`remark_${row.rowKey}`} size="sm" placeholder="Remark"
                                                                        defaultValue={row.remark || ""} maxLength={60}
                                                                    />
                                                                </Td>
                                                            </Tooltip>
                                                            <Td isNumeric>
                                                                <Tooltip label="You cant delete existing part while edit." placement="left"
                                                                    hasArrow color="white" isDisabled={row.is_existing !== true} background="red">
                                                                    <span>
                                                                        <IconButton aria-label="Delete Row" colorScheme="red" size="sm" icon={<DeleteIcon />}
                                                                            onClick={() => deleteRow(row.rowKey)}
                                                                            isDisabled={rows.length <= 1 || row.is_existing === true}
                                                                        />
                                                                    </span>
                                                                </Tooltip>
                                                            </Td>
                                                        </Tr>
                                                    ))}
                                                </Tbody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}

                                {/* ── Totals ── */}
                                <HStack mt={3}>
                                    <Text>Total Qty: <Text as="span" ml={3} fontWeight="bold">{totalQty}</Text></Text>
                                    <Text ml={3}>Total Line Items: <Text as="span" ml={3} fontWeight="bold">{totalItems}</Text></Text>
                                </HStack>

                                {/* ── Remarks ── */}
                                <FormControl>
                                    <FormLabel>Remarks</FormLabel>
                                    <FieldHTMLEditor
                                        onValueChange={(v) => form.setValues({ remarks: v })}
                                        maxLength={import.meta.env.VITE_ELABORATE_REMARKS_LENGTH}
                                        placeHolder="Enter Remarks Here"
                                        defaultValue={isEdit && itemInfo?.data?.remarks ? itemInfo.data.remarks : ""}
                                    />
                                </FormControl>
                            </Stack>

                            {/* ── Form Actions ── */}
                            <Stack direction={{ base: "column", md: "row" }} justify="center" alignItems="center" mt={4}>
                                <Button type="submit" colorScheme="brand" isLoading={isSaving}
                                    isDisabled={isSaving || (isEdit ? (!isFormValuesChanged || !form.isValid) : false)}>
                                    {isEdit ? "Update" : "Submit"}
                                </Button>
                                <Button onClick={() => handleOpenPreview()} colorScheme="green"
                                    isDisabled={!form.isValid} isLoading={previewPDF.isLoading}>
                                    Preview
                                </Button>
                            </Stack>
                        </Formiz>
                    </Stack>

                    <ConfirmationPopup
                        isOpen={openConfirmation}
                        onClose={() => setOpenConfirmation(false)}
                        onConfirm={handleConfirm}
                        headerText="Add Vendors"
                        bodyText="Are you sure you want to add these group vendors to this PRFQ?"
                    />
                </LoadingOverlay>
            </Stack>

            <MaterialRequestSearchPopup isOpen={isMRModalOpen} onClose={handleMRApply} data={{ request_ids: selectedMRIds }} />
        </SlideIn>
    );
};

export default PRFQForm;