import { useMemo, useState, useEffect } from "react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Box,
  Button,
  HStack,
  Heading,
  Stack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Tooltip,
} from "@chakra-ui/react";
import { Formiz, useForm, useFormFields } from "@formiz/core";
import { isEmail } from "@formiz/validations";
import { HiArrowNarrowLeft } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";

import { FaTimes, FaChevronRight, FaChevronLeft, FaCheck } from "react-icons/fa";
import { FieldTextarea } from '@/components/FieldTextarea';
import { FieldDayPicker } from '@/components/FieldDayPicker';
import { FieldInput } from "@/components/FieldInput";
import { FieldUpload } from '@/components/FieldUpload';
import { FieldYearPicker } from '@/components/FieldYearPicker';
import { FieldSelect } from "@/components/FieldSelect";
import { ResponsiveIconButton } from "@/components/ResponsiveIconButton";
import { SlideIn } from "@/components/SlideIn";
import { isFormFieldsChanged } from '@/helpers/FormChangeDetector';
import dayjs from 'dayjs';
import {
  useSaveCustomer,
  useCustomerDetails,
  useCustomerDropdowns
} from '@/services/master/customer/service';
import { useSubmasterItemIndex } from "@/services/submaster/service";
import { useParams } from "react-router-dom";
import LoadingOverlay from '@/components/LoadingOverlay';
import { QualityCertificates } from '@/pages/Master/Customer/QualityCertificates';
import { CustomerBanks } from "@/pages/Master/Customer/Banks";
import { CustomerContactManagers } from "@/pages/Master/Customer/ContactManagers";
import { CustomerShippingAddresses } from "@/pages/Master/Customer/ShippingAddresses";
import { CustomerPrincipleOfOwners } from "@/pages/Master/Customer/PrincipleOfOwners";
import { CustomerTraderReferences } from "@/pages/Master/Customer/TraderReferences";
import { formatDate } from '@/helpers/commonHelper';

const TABS = [
  "Contact Details",
  "Quality / Other Docs",
  "Contact Managers",
  "Shipping Addresses",
  "Customer Banks",
  "Principle of Owners",
  "Trader References",
];

const LAST_TAB = TABS.length - 1;

export const CustomerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [activeTab, setActiveTab] = useState(0);

  const isEdit = !!id;

  const keys = [
    'contact_type_id', 'business_name', 'year_of_business', 'business_type_id',
    'is_foreign_entity', 'currency_id', 'nature_of_business', 'email',
    'license_trade_exp_date', 'license_trade_url', 'license_trade_no',
    'payment_mode_id', 'payment_term_id', 'total_credit_amount',
    'total_credit_period', 'vat_tax_id', 'vat_tax_url', 'remarks',
  ];

  const { data: paymentTermList } = useSubmasterItemIndex("payment-terms", {});
  const paymentTerms: TODO[] = paymentTermList?.data ?? [];

  // ── Tab field states ───────────────────────────────────────────────────────
  const [qcFields, setQcFields] = useState<any[]>([]);
  const [initialQcFields, setInitialQcFields] = useState<any[]>([]);

  const [bankFields, setBankFields] = useState<any[]>([]);
  const [initialBankFields, setInitialBankFields] = useState<any[]>([]);

  const [contactManagerFields, setContactManagerFields] = useState<any[]>([]);
  const [initialContactManagerFields, setInitialContactManagerFields] = useState<any[]>([]);

  const [shippingAddressFields, setShippingAddressFields] = useState<any[]>([]);
  const [initialShippingAddressFields, setInitialShippingAddressFields] = useState<any[]>([]);

  const [principleOfOwnerFields, setPrincipleOfOwnerFields] = useState<any[]>([]);
  const [initialPrincipleOfOwnerFields, setInitialPrincipleOfOwnerFields] = useState<any[]>([]);

  const [traderReferenceFields, setTraderReferenceFields] = useState<any[]>([]);
  const [initialTraderReferenceFields, setInitialTraderReferenceFields] = useState<any[]>([]);

  // ── QC helpers ─────────────────────────────────────────────────────────────
  const addQcFields = (qcData: any) => setQcFields((prev) => [...prev, qcData]);
  const removeQcFields = (index: number) => setQcFields((prev) => prev.filter((_: unknown, idx: number) => idx !== index));
  const editQcFields = (index: number, updatedData: any) =>
    setQcFields((prev) => prev.map((cert: any, i: number) => i === index ? { ...cert, ...updatedData } : cert));

  // ── Dropdowns ──────────────────────────────────────────────────────────────
  const { data: dropdownData, isLoading } = useCustomerDropdowns();
  const [tocDisabled, setTOCDisabled] = useState<any>(true);
  const businessTypeOptions = dropdownData?.business_types ?? [];
  const contactTypeOptions = dropdownData?.contact_types ?? [];
  const currencyOptions = dropdownData?.currencies ?? [];
  const paymentModeOptions = dropdownData?.payment_modes ?? [];
  const paymentTermsOptions = dropdownData?.payment_terms ?? [];

  const { data: userData, isLoading: infoLoading } = useCustomerDetails(id, { enabled: !!id });
  const saveCustomer = useSaveCustomer();

  const handlePaymentTermsChange = (paymentTerm: any) => {
    const selected = paymentTerms?.find((emp) => String(emp.id) === String(paymentTerm));
    if (selected && selected.is_fixed === true) {
      setTOCDisabled(true);
      form.setValues({ total_credit_amount: ' ', total_credit_period: ' ' });
    } else if (selected && selected.is_fixed === false) {
      setTOCDisabled(false);
      form.setValues({ total_credit_amount: '', total_credit_period: selected.credit_days?.toString() });
    }
  };

  // ── Form ───────────────────────────────────────────────────────────────────
  const form = useForm({
    onValidSubmit: (values) => {
      const payload: any = Object.fromEntries(keys.map((key) => [key, values[key]]));

      payload.is_foreign_entity = values.is_foreign_entity === "true";
      payload.license_trade_exp_date = values.license_trade_exp_date
        ? formatDate(values.license_trade_exp_date) : null;
      payload.total_credit_amount = Number(values.total_credit_amount);
      payload.total_credit_period = Number(values.total_credit_period);

      if (values.business_since) {
        payload.year_of_business = dayjs().year() - dayjs(values.business_since).year();
      }

      if (qcFields.length > 0) payload.quality_certificates = qcFields;
      if (bankFields.length > 0) payload.banks = bankFields;
      if (contactManagerFields.length > 0) payload.contact_managers = contactManagerFields;
      if (shippingAddressFields.length > 0) payload.shipping_addresses = shippingAddressFields;
      if (principleOfOwnerFields.length > 0) payload.principle_of_owners = principleOfOwnerFields;
      if (traderReferenceFields.length > 0) payload.trader_references = traderReferenceFields;

      if (isEdit) {
        saveCustomer.mutate({ id, ...payload }, {
          onSuccess: () => navigate("/contact-management/customer-master"),
        });
      } else {
        saveCustomer.mutate(payload, {
          onSuccess: () => navigate("/contact-management/customer-master"),
        });
      }
    },
  });

  // ── Prefill for edit ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!userData?.data) return;
    const existData = userData.data;

    const init = Object.fromEntries(keys.map((key) => [key, (existData as any)?.[key] ?? ""]));
    init.is_foreign_entity = existData.is_foreign_entity.toString();
    init.business_since = existData.year_of_business
      ? dayjs(`${new Date().getFullYear() - Number(existData.year_of_business)}-01-01`) : null;
    init.license_trade_exp_date = existData.license_trade_exp_date
      ? dayjs(existData.license_trade_exp_date) : null;

    handlePaymentTermsChange(existData?.payment_term_id);

    const mappedCertificates: any[] = (existData.quality_certificates ?? []).length > 0
      ? (existData.quality_certificates ?? []).map((c: any) => ({
        id: c.id, certificate_type: c.certificate_type, doc_no: c.doc_no,
        validity_date: c.validity_date ? formatDate(c.validity_date) : null,
        issue_date: c.issue_date ? formatDate(c.issue_date) : null,
        doc_url: c.doc_url,
      })) : [];
    setInitialQcFields(mappedCertificates);
    setQcFields(mappedCertificates);

    const STRIP_KEYS = new Set(['has_pending_request', 'pending_request_message', 'updated_at', 'deleted_at', 'created_at']);
    const stripMeta = (arr: any[]) =>
      arr.map((item) =>
        Object.fromEntries(Object.entries(item).filter(([k]) => !STRIP_KEYS.has(k)))
      );

    const mappedBanks = stripMeta(existData.banks ?? []);
    setInitialBankFields(mappedBanks);
    setBankFields(mappedBanks);

    const mappedContactManagers = stripMeta(existData.contact_managers ?? []);
    setInitialContactManagerFields(mappedContactManagers);
    setContactManagerFields(mappedContactManagers);

    const mappedShippingAddresses = stripMeta(existData.shipping_addresses ?? []);
    setInitialShippingAddressFields(mappedShippingAddresses);
    setShippingAddressFields(mappedShippingAddresses);

    const mappedPrincipleOfOwners = stripMeta(existData.principle_owners ?? []);
    setInitialPrincipleOfOwnerFields(mappedPrincipleOfOwners);
    setPrincipleOfOwnerFields(mappedPrincipleOfOwners);

    const mappedTraderReferences = stripMeta(existData.trader_references ?? []);
    setInitialTraderReferenceFields(mappedTraderReferences);
    setTraderReferenceFields(mappedTraderReferences);

    setInitialValues(init);
    form.setValues(init);
  }, [userData]);

  // ── Change detection ───────────────────────────────────────────────────────
  const [initialValues, setInitialValues] = useState<any>(null);
  const fields = useFormFields({ connect: form });

  const isFormValuesChanged =
    isFormFieldsChanged({ fields, initialValues, keys }) ||
    JSON.stringify(qcFields) !== JSON.stringify(initialQcFields) ||
    JSON.stringify(bankFields) !== JSON.stringify(initialBankFields) ||
    JSON.stringify(contactManagerFields) !== JSON.stringify(initialContactManagerFields) ||
    JSON.stringify(shippingAddressFields) !== JSON.stringify(initialShippingAddressFields) ||
    JSON.stringify(principleOfOwnerFields) !== JSON.stringify(initialPrincipleOfOwnerFields) ||
    JSON.stringify(traderReferenceFields) !== JSON.stringify(initialTraderReferenceFields);

  // ── Tab unlock logic ───────────────────────────────────────────────────────
  const isFirstTab = activeTab === 0;
  const isLastTab = activeTab === LAST_TAB;

  const formValid = form.isValid;
  const hasContactManagers = contactManagerFields.length > 0;
  const hasShippingAddresses = shippingAddressFields.length > 0;

  const tabUnlocked = useMemo(() => [
    true,                                                         // Tab 0: Contact Details — always
    formValid,                                                    // Tab 1: Quality / Other Docs
    formValid,                                                    // Tab 2: Contact Managers
    formValid && hasContactManagers,                              // Tab 3: Shipping Addresses
    formValid && hasContactManagers && hasShippingAddresses,      // Tab 4: Customer Banks
    formValid && hasContactManagers && hasShippingAddresses,      // Tab 5: Principle of Owners
    formValid && hasContactManagers && hasShippingAddresses,      // Tab 6: Trader References
  ], [formValid, hasContactManagers, hasShippingAddresses]);

  const tabLockReason = useMemo(() => [
    "",
    !formValid ? "Complete Contact Details first" : "",
    !formValid ? "Complete Contact Details first" : "",
    !formValid
      ? "Complete Contact Details first"
      : !hasContactManagers
        ? "Add at least 1 Contact Manager first"
        : "",
    !formValid
      ? "Complete Contact Details first"
      : !hasContactManagers
        ? "Add at least 1 Contact Manager first"
        : !hasShippingAddresses
          ? "Add at least 1 Shipping Address first"
          : "",
    !formValid
      ? "Complete Contact Details first"
      : !hasContactManagers
        ? "Add at least 1 Contact Manager first"
        : !hasShippingAddresses
          ? "Add at least 1 Shipping Address first"
          : "",
    !formValid
      ? "Complete Contact Details first"
      : !hasContactManagers
        ? "Add at least 1 Contact Manager first"
        : !hasShippingAddresses
          ? "Add at least 1 Shipping Address first"
          : "",
  ], [formValid, hasContactManagers, hasShippingAddresses]);

  // ── isNextDisabled: memoized boolean (NOT a function call) ─────────────────
  const isNextDisabled = useMemo(() => {
    const nextTab = activeTab + 1;
    if (nextTab > LAST_TAB) return false;
    return !tabUnlocked[nextTab];
  }, [activeTab, tabUnlocked]);

  // ── renderTabNavigationButtons: plain render function (NOT a component) ────
  // Using a render function instead of a React component is critical here.
  // An inner component (const Foo = () => ...) gets a new identity every render,
  // causing React to remount it and read stale closure values on the first click.
  // A plain function called as {renderTabNavigationButtons()} always executes in
  // the current render scope and reads the latest isNextDisabled value directly.
  const renderTabNavigationButtons = () => (
    <Stack direction={{ base: "column", md: "row" }} justify="center" alignItems="center" mt={6}>
      {isFirstTab ? (
        <>
          <Button
            type="button"
            colorScheme="red"
            isDisabled={saveCustomer.isLoading}
            onClick={() => navigate(-1)}
            leftIcon={<FaTimes />}
          >
            Close
          </Button>
          <Tooltip
            label={isNextDisabled ? tabLockReason[activeTab + 1] : ""}
            isDisabled={!isNextDisabled}
            hasArrow
            placement="top"
          >
            <Box display="inline-block" cursor={isNextDisabled ? "not-allowed" : "pointer"}>
              <Button
                type="button"
                colorScheme="brand"
                onClick={() => setActiveTab((t) => t + 1)}
                isDisabled={isNextDisabled}
                pointerEvents={isNextDisabled ? "none" : "auto"}
                rightIcon={<FaChevronRight />}
              >
                Skip/Next
              </Button>
            </Box>
          </Tooltip>
        </>
      ) : isLastTab ? (
        <>
          <Button
            type="button"
            colorScheme="brand"
            onClick={() => setActiveTab((t) => t - 1)}
            leftIcon={<FaChevronLeft />}
          >
            Previous
          </Button>
          <Button
            type="button"
            colorScheme="green"
            onClick={() => form.submit()}
            isLoading={saveCustomer.isLoading}
            isDisabled={
              saveCustomer.isLoading ||
              !form.isValid ||
              (isEdit ? !isFormValuesChanged : false)
            }
            leftIcon={<FaCheck />}
          >
            {isEdit ? "Update" : "Submit"}
          </Button>
        </>
      ) : (
        <>
          <Button
            type="button"
            colorScheme="brand"
            onClick={() => setActiveTab((t) => t - 1)}
            leftIcon={<FaChevronLeft />}
          >
            Previous
          </Button>
          <Tooltip
            label={isNextDisabled ? tabLockReason[activeTab + 1] : ""}
            isDisabled={!isNextDisabled}
            hasArrow
            placement="top"
          >
            <Box display="inline-block" cursor={isNextDisabled ? "not-allowed" : "pointer"}>
              <Button
                type="button"
                colorScheme="brand"
                onClick={() => setActiveTab((t) => t + 1)}
                isDisabled={isNextDisabled}
                pointerEvents={isNextDisabled ? "none" : "auto"}
                rightIcon={<FaChevronRight />}
              >
                Skip/Next
              </Button>
            </Box>
          </Tooltip>
        </>
      )}
    </Stack>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <SlideIn>
      <Stack pl={2} spacing={2}>
        <HStack justify={"space-between"}>
          <Stack spacing={0}>
            <Breadcrumb
              fontWeight="medium"
              fontSize="sm"
              separator={<ChevronRightIcon boxSize={6} color="gray.500" />}
            >
              <BreadcrumbItem color={"brand.500"}>
                <BreadcrumbLink as={Link} to="/contact-management/customer-master">
                  Customer Master
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage color={"gray.500"}>
                <BreadcrumbLink>
                  {isEdit ? "Edit Contact" : "Add New Contact"}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
            <Heading as="h4" size={"md"}>
              {isEdit ? "Edit Contact" : "Add New Contact"}
            </Heading>
          </Stack>

          <ResponsiveIconButton
            variant={"@primary"}
            icon={<HiArrowNarrowLeft />}
            size={"sm"}
            onClick={() => navigate(-1)}
          >
            Back
          </ResponsiveIconButton>
        </HStack>

        <LoadingOverlay isLoading={isLoading || infoLoading}>
          <Stack spacing={0} bg={"white"} borderRadius={"md"} boxShadow={"md"} overflow="hidden" minH="calc(95vh - 140px)">

            <Formiz connect={form}>
              <Tabs
                index={activeTab}
                onChange={(index) => setActiveTab(index)}
                variant="unstyled"
                colorScheme="brand"
              >
                <TabList overflowX="auto" overflowY="hidden" flexWrap="nowrap" width="100%">
                  {TABS.map((tab, index) => (
                    <Tooltip
                      key={tab}
                      label={tabLockReason[index]}
                      isDisabled={tabUnlocked[index]}
                      hasArrow
                      placement="bottom"
                    >
                      {/*
                        Box is Tooltip's direct child and always keeps pointer-events
                        active so mouse hover is detected and the tooltip fires.
                        The Tab inside has pointer-events:none when locked to block
                        actual tab switching — but the Box still receives the hover.
                      */}
                      <Box
                        flex={1}
                        display="flex"
                        cursor={tabUnlocked[index] ? "pointer" : "not-allowed"}
                      >
                        <Tab
                          width="100%"
                          whiteSpace="nowrap"
                          fontWeight="medium"
                          px={5}
                          py={3}
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          gap={2}
                          bg={tabUnlocked[index] ? "gray.200" : "gray.100"}
                          color={tabUnlocked[index] ? "gray.600" : "gray.400"}
                          opacity={tabUnlocked[index] ? 1 : 0.5}
                          pointerEvents={tabUnlocked[index] ? "auto" : "none"}
                          _selected={{
                            color: "white",
                            bg: "#0C2556",
                            borderBottomColor: "white",
                            borderColor: "gray.200",
                            fontWeight: "semibold",
                          }}
                          _hover={{ bg: tabUnlocked[index] ? "gray.300" : "gray.100" }}
                          _focus={{ boxShadow: "none" }}
                        >
                          {tab}
                        </Tab>
                      </Box>
                    </Tooltip>
                  ))}
                </TabList>

                <TabPanels>

                  {/* ── Tab 1: Contact Details ── */}
                  <TabPanel p={0}>
                    <Box p={4}>
                      <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                        <FieldSelect
                          label={'Type of Contact'}
                          name={'contact_type_id'}
                          required={'Type of Contact is required'}
                          placeholder="Select type of contact"
                          options={contactTypeOptions}
                        />
                        <FieldInput
                          label={'Business Name'}
                          name={'business_name'}
                          required={'Business Name is required'}
                          placeholder="Enter business name"
                          maxLength={40}
                          type={'alpha-numeric-with-space'}
                        />
                        <FieldYearPicker
                          name="business_since"
                          label="Business Since"
                          placeholder="Select year"
                          yearRange={{ start: 1950, end: dayjs().year() }}
                          onValueChange={(value) => {
                            if (value) {
                              form.setValues({
                                year_of_business: (Number(dayjs().year()) - Number(dayjs(value).year())).toString(),
                              });
                            }
                          }}
                        />
                        <FieldInput
                          label="Years in Business"
                          name="year_of_business"
                          placeholder="Years in Business"
                          defaultValue={'0'}
                          isDisabled={true}
                        />
                      </Stack>

                      <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                        <FieldSelect
                          label={'Types of Business'}
                          name={'business_type_id'}
                          required={'Business Type is required'}
                          placeholder="Select business type"
                          options={businessTypeOptions}
                        />
                        <FieldSelect
                          label={'Foreign Entity'}
                          name={'is_foreign_entity'}
                          required={'Foreign Entity is required'}
                          placeholder="Select foreign entity"
                          options={[
                            { value: 'true', label: 'Yes' },
                            { value: 'false', label: 'No' },
                          ]}
                        />
                      </Stack>

                      <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                        <FieldSelect
                          label="Currency"
                          name="currency_id"
                          required="Currency is required"
                          placeholder="Select currency"
                          options={currencyOptions}
                        />
                        <FieldInput
                          label="Nature of Business"
                          name="nature_of_business"
                          placeholder="Enter nature of business"
                          maxLength={35}
                          type={'alpha-numeric-with-space'}
                        />
                        <FieldInput
                          label="Email"
                          name="email"
                          type="email"
                          onKeyDown={(e) => { if (e.key === ' ') e.preventDefault(); }}
                          placeholder="Enter email"
                          validations={[{ handler: isEmail(), message: 'Invalid email' }]}
                          required={'Email is required'}
                          maxLength={100}
                        />
                      </Stack>

                      <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                        <Stack w={'full'} spacing={8} direction={{ base: 'column', md: 'row' }}>
                          <FieldInput
                            label="License / Trade Number"
                            name="license_trade_no"
                            placeholder="Enter license / trade number"
                            maxLength={25}
                            type={'alpha-numeric-with-special'}
                            required={
                              fields?.license_trade_exp_date?.value || fields?.license_trade_url?.value
                                ? 'License / Trade Number required' : ''
                            }
                          />
                          <FieldDayPicker
                            label="License / Trade Expiry Date"
                            name="license_trade_exp_date"
                            placeholder="Enter license / trade expiry date"
                            disabledDays={{ before: new Date() }}
                            required={
                              fields?.license_trade_no?.value || fields?.license_trade_url?.value
                                ? 'License / Trade Expiry Date required' : ''
                            }
                          />
                        </Stack>
                        <FieldUpload
                          label="License / Trade Doc Upload"
                          name="license_trade_url"
                          placeholder="Upload license / trade doc"
                          required={
                            fields?.license_trade_no?.value || fields?.license_trade_exp_date?.value
                              ? 'License / Trade Doc required' : ''
                          }
                        />
                      </Stack>

                      <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                        <FieldInput
                          label="Vat / Tax ID"
                          name="vat_tax_id"
                          type={'alpha-numeric-with-special'}
                          placeholder="Enter vat / tax id"
                          maxLength={30}
                          required={fields?.vat_tax_url?.value ? 'Vat / Tax ID required' : ''}
                        />
                        <FieldUpload
                          label="Vat / Tax Doc Upload"
                          name="vat_tax_url"
                          placeholder="Upload vat / tax doc"
                          required={fields?.vat_tax_id?.value ? 'Vat / Tax Doc required' : ''}
                        />
                      </Stack>

                      <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                        <FieldSelect
                          label={'Mode of Payment'}
                          name={'payment_mode_id'}
                          required={'Mode of Payment is required'}
                          placeholder="Select mode of payment"
                          options={paymentModeOptions}
                        />
                        <FieldSelect
                          label={'Payment Terms'}
                          name={'payment_term_id'}
                          required={'Payment Terms is required'}
                          placeholder="Select payment terms"
                          options={paymentTermsOptions}
                          onValueChange={(value) => handlePaymentTermsChange(value)}
                        />
                        <FieldInput
                          key={`total_credit_amount`}
                          label={'Total Credit Amount'}
                          name={'total_credit_amount'}
                          required={!tocDisabled ? 'Total Credit Amount is required' : ''}
                          placeholder="Enter Total Credit Amount"
                          type="decimal"
                          maxLength={10}
                          isDisabled={tocDisabled}
                        />
                        <FieldInput
                          key={`total_credit_period`}
                          label={'Total Credit Period (Days)'}
                          name={'total_credit_period'}
                          required={!tocDisabled ? 'Total Credit Period is required' : ''}
                          placeholder="Enter Total Credit Period"
                          type="integer"
                          maxLength={6}
                          isDisabled={true}
                        />
                      </Stack>

                      <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                        <FieldTextarea
                          label="Remarks"
                          name="remarks"
                          placeholder="Enter remarks"
                          maxLength={100}
                        />
                      </Stack>

                      {renderTabNavigationButtons()}
                    </Box>
                  </TabPanel>

                  {/* ── Tab 2: Quality / Other Docs ── */}
                  <TabPanel p={0}>
                    <Box p={4}>
                      <QualityCertificates
                        name="Doc."
                        fields={qcFields}
                        onAdd={addQcFields}
                        onRemove={removeQcFields}
                        onEdit={editQcFields}
                        fieldPrefix="certificate"
                      />
                      {renderTabNavigationButtons()}
                    </Box>
                  </TabPanel>

                  {/* ── Tab 3: Contact Managers ── */}
                  <TabPanel p={0}>
                    <Box p={4}>
                      <CustomerContactManagers
                        fields={contactManagerFields}
                        onAdd={(d) => setContactManagerFields(prev => [...prev, d])}
                        onRemove={(i) => setContactManagerFields(prev => prev.filter((_, idx) => idx !== i))}
                        onEdit={(i, d) => setContactManagerFields(prev => prev.map((b, idx) => idx === i ? { ...b, ...d } : b))}
                      />
                      {renderTabNavigationButtons()}
                    </Box>
                  </TabPanel>

                  {/* ── Tab 4: Shipping Addresses ── */}
                  <TabPanel p={0}>
                    <Box p={4}>
                      <CustomerShippingAddresses
                        fields={shippingAddressFields}
                        onAdd={(d) => setShippingAddressFields(prev => [...prev, d])}
                        onRemove={(i) => setShippingAddressFields(prev => prev.filter((_, idx) => idx !== i))}
                        onEdit={(i, d) => setShippingAddressFields(prev => prev.map((b, idx) => idx === i ? { ...b, ...d } : b))}
                      />
                      {renderTabNavigationButtons()}
                    </Box>
                  </TabPanel>

                  {/* ── Tab 5: Customer Banks ── */}
                  <TabPanel p={0}>
                    <Box p={4}>
                      <CustomerBanks
                        fields={bankFields}
                        onAdd={(d) => setBankFields(prev => [...prev, d])}
                        onRemove={(i) => setBankFields(prev => prev.filter((_, idx) => idx !== i))}
                        onEdit={(i, d) => setBankFields(prev => prev.map((b, idx) => idx === i ? { ...b, ...d } : b))}
                      />
                      {renderTabNavigationButtons()}
                    </Box>
                  </TabPanel>

                  {/* ── Tab 6: Principle of Owners ── */}
                  <TabPanel p={0}>
                    <Box p={4}>
                      <CustomerPrincipleOfOwners
                        fields={principleOfOwnerFields}
                        onAdd={(d) => setPrincipleOfOwnerFields(prev => [...prev, d])}
                        onRemove={(i) => setPrincipleOfOwnerFields(prev => prev.filter((_, idx) => idx !== i))}
                        onEdit={(i, d) => setPrincipleOfOwnerFields(prev => prev.map((p, idx) => idx === i ? { ...p, ...d } : p))}
                      />
                      {renderTabNavigationButtons()}
                    </Box>
                  </TabPanel>

                  {/* ── Tab 7: Trader References ── */}
                  <TabPanel p={0}>
                    <Box p={4}>
                      <CustomerTraderReferences
                        fields={traderReferenceFields}
                        onAdd={(d) => setTraderReferenceFields(prev => [...prev, d])}
                        onRemove={(i) => setTraderReferenceFields(prev => prev.filter((_, idx) => idx !== i))}
                        onEdit={(i, d) => setTraderReferenceFields(prev => prev.map((p, idx) => idx === i ? { ...p, ...d } : p))}
                      />
                      {renderTabNavigationButtons()}
                    </Box>
                  </TabPanel>

                </TabPanels>
              </Tabs>
            </Formiz>

          </Stack>
        </LoadingOverlay>
      </Stack>
    </SlideIn>
  );
};

export default CustomerForm;