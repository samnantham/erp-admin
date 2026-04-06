import { useEffect, useState } from 'react';
import {
    Button, FormControl, FormLabel, HStack, Input,
    Modal, ModalBody, ModalCloseButton, ModalContent,
    ModalFooter, ModalHeader, ModalOverlay, Stack,
} from '@chakra-ui/react';
import { Formiz, useForm } from '@formiz/core';
import { FieldSelect } from '@/components/FieldSelect';
import { useCustomerList, getCustomerById, getCustomerRelations } from '@/services/master/customer/service';
import { useSaveVendorToRFQ } from '@/services/purchase/rfq/service';
import { useSubmasterItemIndex } from "@/services/submaster/service";
import { CustomerModal } from "@/components/Modals/CustomerMaster";
import { ContactManagerModal } from "@/components/Modals/CustomerMaster/ContactManager";

// ─── Sub-modal open tracker ───────────────────────────────────────────────────
//
// Placed inside a FieldSelect `CreateModal` render prop, this tiny helper
// fires onOpen / onClose without violating the Rules of Hooks (no hooks in
// callbacks) and without relying on unreliable unmount timing.
//
const SubModalTracker = ({
    isOpen,
    onOpen,
    onClose,
}: {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}) => {
    useEffect(() => {
        if (isOpen) {
            onOpen();
            // Cleanup runs when isOpen flips to false OR the component unmounts,
            // so we never get stuck in the "hidden" state.
            return () => onClose();
        }
    }, [isOpen]);

    return null;
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Props = {
    isOpen: boolean;
    onClose: () => void;
    prfqId: string;
    existVendorIds?: string[];
    onSuccess?: () => void;
};

// ─── Component ────────────────────────────────────────────────────────────────

export const AddVendorToRFQModal = ({
    isOpen,
    onClose,
    prfqId,
    existVendorIds = [],
    onSuccess,
}: Props) => {
    const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

    // ── Track whether any sub-modal (CustomerModal / ContactManagerModal) is
    //    currently open so we can visually hide THIS modal without unmounting
    //    it.  Unmounting would break Chakra's focus-trap and scroll-lock.
    const [isSubModalOpen, setIsSubModalOpen] = useState(false);

    const { data: contactTypeData } = useSubmasterItemIndex("contact-types", {});
    const filterContactTypeCodes = ['SUP', 'PUR'];
    const filteredContactTypeIds = contactTypeData?.data
        ?.filter((item: any) => filterContactTypeCodes.includes(item.code))
        .map((item: any) => item.id);

    // ── Vendor data state ─────────────────────────────────────────────────────
    const [vendorData, setVendorData] = useState<{
        customer: any;
        contact_managers: any[];
        is_loading: boolean;
        selectedContactManager: any;
    }>({
        customer: null,
        contact_managers: [],
        is_loading: false,
        selectedContactManager: null,
    });

    const saveVendorToRFQ = useSaveVendorToRFQ();

    // ── Vendor list ───────────────────────────────────────────────────────────
    const { data: customerListData, isLoading: isLoadingVendors, refetch: reloadCustomers } = useCustomerList({
        contact_type_id: filteredContactTypeIds,
        enabled: isOpen,
    });

    const vendorOptions = (customerListData?.data ?? [])
        .filter((c: any) => !existVendorIds.includes(String(c.value ?? c.id)))
        .map((c: any) => ({
            value: String(c.value ?? c.id),
            label: c.label ?? c.business_name ?? c.name,
        }));

    // ── Load vendor details ───────────────────────────────────────────────────
    const loadVendorData = async (vendorId: string) => {
        setVendorData({ customer: null, contact_managers: [], is_loading: true, selectedContactManager: null });
        try {
            const [customer, contacts] = await Promise.all([
                getCustomerById(vendorId),
                getCustomerRelations(vendorId, 'contact-managers'),
            ]);
            setVendorData({
                customer,
                contact_managers: contacts ?? [],
                is_loading: false,
                selectedContactManager: null,
            });
        } catch {
            setVendorData({ customer: null, contact_managers: [], is_loading: false, selectedContactManager: null });
        }
    };

    // ── Reload contacts only ──────────────────────────────────────────────────
    const reloadContacts = async (vendorId: string) => {
        const contacts = await getCustomerRelations(vendorId, 'contact-managers');
        setVendorData(prev => ({ ...prev, contact_managers: contacts ?? [] }));
    };

    // ── Derived display values ────────────────────────────────────────────────
    const vendorCode = vendorData.customer?.code ?? '';
    const vendorAddress = vendorData.selectedContactManager?.address_line1 ?? '';
    const contactOptions = vendorData.contact_managers.map((c: any) => ({
        value: String(c.id),
        label: c.attention,
    }));

    // ── Form ──────────────────────────────────────────────────────────────────
    const form = useForm({
        onValidSubmit: (values) => {
            saveVendorToRFQ.mutate(
                {
                    prfq_id: prfqId,
                    vendor_id: values.vendor_id,
                    customer_contact_manager_id: values.contact_id,
                },
                {
                    onSuccess: () => {
                        onSuccess?.();
                        handleClose();
                    },
                }
            );
        },
    });

    // ── Add-new helper ────────────────────────────────────────────────────────
    const handleAddNewSuccess = (
        fieldName: string,
        refetch: () => void,
        onValueChange?: (id: any) => void
    ) => (data: any) => {
        const record = data?.data ?? data;
        const newId = record?.id;
        setTimeout(() => {
            refetch();
            setTimeout(() => {
                form.setValues({ [fieldName]: newId });
                onValueChange?.(newId);
            }, 50);
        }, 100);
    };

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleVendorChange = (v: any) => {
        setSelectedVendorId(v);
        form.setValues({ contact_id: '' });
        if (v) loadVendorData(v);
        else setVendorData({ customer: null, contact_managers: [], is_loading: false, selectedContactManager: null });
    };

    const handleContactChange = (contactId: any) => {
        const matched = vendorData.contact_managers.find((c: any) => String(c.id) === String(contactId));
        setVendorData(prev => ({ ...prev, selectedContactManager: matched ?? null }));
    };

    const handleClose = () => {
        setSelectedVendorId(null);
        setVendorData({ customer: null, contact_managers: [], is_loading: false, selectedContactManager: null });
        form.setValues({ vendor_id: '', contact_id: '' });
        onClose();
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            isCentered
            size="md"
            blockScrollOnMount={false}
            closeOnOverlayClick={false}
            closeOnEsc={false}
        >
            {/*
             * FIX: Instead of toggling isOpen (which unmounts this modal and
             * destroys Chakra's focus-trap / scroll-lock), we keep this modal
             * always mounted and simply hide it visually while a sub-modal is
             * open.  It reappears instantly—fully functional—when the sub-modal
             * closes.
             */}
            <ModalOverlay display={isSubModalOpen ? 'none' : 'block'} />
            <ModalContent display={isSubModalOpen ? 'none' : 'flex'}>
                <ModalHeader fontSize="md" fontWeight="700">
                    Add Vendor To RFQ
                </ModalHeader>
                <ModalCloseButton />

                <Formiz autoForm connect={form}>
                    <ModalBody>
                        <Stack spacing={4}>

                            {/* Row 1: Vendor Select + Vendor Code */}
                            <HStack align="flex-end" spacing={4}>
                                <FieldSelect
                                    label="Select Vendor"
                                    name="vendor_id"
                                    placeholder="Select Vendor"
                                    options={vendorOptions}
                                    required="Vendor is required"
                                    size="sm"
                                    onValueChange={handleVendorChange}
                                    addNew={{
                                        label: '+ Add New',
                                        CreateModal: (p) => (
                                            <>
                                                {/* Tracks open state so we can hide this modal's
                                                    overlay/content without unmounting it. */}
                                                <SubModalTracker
                                                    isOpen={p.isOpen}
                                                    onOpen={() => setIsSubModalOpen(true)}
                                                    onClose={() => setIsSubModalOpen(false)}
                                                />
                                                <CustomerModal
                                                    isOpen={p.isOpen}
                                                    onClose={(status: boolean) => {
                                                        if (!status) p.onClose();
                                                    }}
                                                    onSuccess={(data: any) => {
                                                        p.onClose();
                                                        handleAddNewSuccess(
                                                            'vendor_id',
                                                            reloadCustomers,
                                                            handleVendorChange
                                                        )(data);
                                                    }}
                                                />
                                            </>
                                        ),
                                    }}
                                    selectProps={{
                                        type: 'creatable',
                                        noOptionsMessage: () => 'No vendors found',
                                        isLoading: isLoadingVendors,
                                    }}
                                />
                                <FormControl>
                                    <FormLabel fontSize="sm">Vendor Code</FormLabel>
                                    <Input
                                        size="sm"
                                        placeholder="Vendor Code"
                                        value={vendorCode}
                                        isReadOnly
                                        isDisabled={vendorData.is_loading}
                                        bg="gray.50"
                                        borderColor="gray.200"
                                    />
                                </FormControl>
                            </HStack>

                            {/* Row 2: Contact Select + Address */}
                            <HStack align="flex-end" spacing={4}>
                                <FieldSelect
                                    label="Select Contact"
                                    name="contact_id"
                                    placeholder={selectedVendorId ? 'Select Contact' : 'Select vendor first'}
                                    options={contactOptions}
                                    required="Contact is required"
                                    isDisabled={!selectedVendorId}
                                    size="sm"
                                    onValueChange={handleContactChange}
                                    addNew={{
                                        label: '+ Add New',
                                        CreateModal: (p) => (
                                            <>
                                                {/* Same tracker for the contact sub-modal. */}
                                                <SubModalTracker
                                                    isOpen={p.isOpen}
                                                    onOpen={() => setIsSubModalOpen(true)}
                                                    onClose={() => setIsSubModalOpen(false)}
                                                />
                                                <ContactManagerModal
                                                    isOpen={p.isOpen}
                                                    onClose={(status: boolean) => {
                                                        if (!status) p.onClose();
                                                    }}
                                                    customerId={selectedVendorId ?? ''}
                                                    isEdit={false}
                                                    customerInfo={vendorData.customer}
                                                    onSuccess={(data: any) => {
                                                        p.onClose();
                                                        handleAddNewSuccess(
                                                            'contact_id',
                                                            () => reloadContacts(selectedVendorId!),
                                                            handleContactChange
                                                        )(data);
                                                    }}
                                                />
                                            </>
                                        ),
                                    }}
                                    selectProps={{
                                        type: 'creatable',
                                        noOptionsMessage: () => 'No contacts found',
                                        isLoading: vendorData.is_loading,
                                    }}
                                />
                                <FormControl>
                                    <FormLabel fontSize="sm">Address</FormLabel>
                                    <Input
                                        size="sm"
                                        placeholder="Address"
                                        value={vendorAddress}
                                        isReadOnly
                                        isDisabled={vendorData.is_loading}
                                        bg="gray.50"
                                        borderColor="gray.200"
                                    />
                                </FormControl>
                            </HStack>

                        </Stack>
                    </ModalBody>

                    <ModalFooter gap={3}>
                        <Button colorScheme="red" size="sm" onClick={handleClose}>
                            Close
                        </Button>
                        <Button
                            type="submit"
                            colorScheme="blue"
                            size="sm"
                            isLoading={saveVendorToRFQ.isLoading}
                        >
                            Add Vendor
                        </Button>
                    </ModalFooter>
                </Formiz>
            </ModalContent>
        </Modal>
    );
};

export default AddVendorToRFQModal;
