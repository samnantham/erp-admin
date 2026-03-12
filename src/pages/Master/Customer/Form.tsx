import { useState, useEffect } from "react";
import { ChevronRightIcon } from "@chakra-ui/icons";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Button,
  HStack,
  Heading,
  Stack,
} from "@chakra-ui/react";
import { Formiz, useForm, useFormFields } from "@formiz/core";
import { isEmail } from "@formiz/validations";
import { HiArrowNarrowLeft } from "react-icons/hi";
import { Link, useNavigate } from "react-router-dom";

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
import { useLocation } from "react-router-dom";
import LoadingOverlay from '@/components/LoadingOverlay';
import { QualityCertificates } from '@/pages/Master/Customer/QualityCertificates';
import { formatDate } from '@/helpers/commonHelper';

export const CustomerForm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const keys = [
    'contact_type_id',
    'business_name',
    'year_of_business',
    'business_type_id',
    'is_foreign_entity',
    'currency_id',
    'nature_of_business',
    'email',
    'license_trade_exp_date',
    'license_trade_url',
    'license_trade_no',
    'payment_mode_id',
    'payment_term_id',
    'total_credit_amount',
    'total_credit_period',
    'vat_tax_id',
    'vat_tax_url'
  ];

  const { id, mode } = location.state || {};
  const isEdit = mode === "edit";
  const isView = mode === "view";
  const { data: paymentTermList } = useSubmasterItemIndex("payment-terms", {});
  const paymentTerms: TODO[] = paymentTermList?.data ?? [];

  const [qcFields, setQcFields] = useState<any>([]);
  const [initialQcFields, setInitialQcFields] = useState<any[]>([]);

  const addQcFields = (qcData: any) => {
    setQcFields([...qcFields, qcData]);
  };

  const removeQcFields = (index: number) => {
    setQcFields(qcFields.filter((_: unknown, idx: number) => idx !== index));
  };

  const editQcFields = (index: number, updatedData: any) => {
    setQcFields(
      qcFields.map((cert: any, i: number) =>
        i === index ? { ...cert, ...updatedData } : cert
      )
    );
  };

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
    const selected = paymentTerms?.find(
      (emp) => String(emp.id) === String(paymentTerm)
    );
    if (selected && selected.is_fixed === true) {
      setTOCDisabled(true);
      form.setValues({
        [`total_credit_amount`]: ' ',
        [`total_credit_period`]: ' ',
      });
    } else if (selected && selected.is_fixed === false) {
      setTOCDisabled(false);
      form.setValues({
        [`total_credit_amount`]: '',
        [`total_credit_period`]: selected.credit_days?.toString(),
      });
    }
  };

  const form = useForm({
    onValidSubmit: (values) => {
      const payload: any = Object.fromEntries(
        keys.map((key) => [key, values[key]])
      );

      payload.is_foreign_entity = values.is_foreign_entity === "true";

      payload.license_trade_exp_date = values.license_trade_exp_date
        ? formatDate(values.license_trade_exp_date)
        : null;

      payload.total_credit_amount = Number(values.total_credit_amount);
      payload.total_credit_period = Number(values.total_credit_period);

      if (values.business_since) {
        payload.year_of_business =
          dayjs().year() - dayjs(values.business_since).year();
      }

      if (qcFields.length > 0) {
        payload.quality_certificates = qcFields;
      }
      if (isEdit) {
        saveCustomer.mutate({
          id,
          ...payload,
        }, {
          onSuccess: () => navigate("/contact-management/customer-master"),
        });
      } else {
        saveCustomer.mutate(payload, {
          onSuccess: () => navigate("/contact-management/customer-master"),
        });
      }
    },
  });

  /**
   * Prefill form for edit
   */
  useEffect(() => {
    if (!userData?.data) return;

    const existData = userData.data;
    const init = Object.fromEntries(
      keys.map((key) => [key, (existData as any)?.[key] ?? ""])
    );
    init.business_since = existData.year_of_business ? dayjs(`${new Date().getFullYear() - Number(existData.year_of_business)}-01-01`) : null;
    init.license_trade_exp_date = existData.license_trade_exp_date ? dayjs(existData.license_trade_exp_date) : null;
    handlePaymentTermsChange(existData?.payment_term_id)
    const mappedCertificates: any[] =
      existData.quality_certificates &&
        existData.quality_certificates.length > 0
        ? existData.quality_certificates?.map((certificate: any) => ({
          certificate_type: certificate.certificate_type,
          doc_no: certificate.doc_no,
          validity_date: certificate.validity_date
            ? formatDate(certificate.validity_date)
            : null,
          issue_date: certificate.issue_date
            ? formatDate(certificate.issue_date)
            : null,
          doc_url: certificate.doc_url,
        }))
        : [];
    setInitialQcFields(mappedCertificates);
    setQcFields(mappedCertificates);
    setInitialValues(init);
    form.setValues(init);
  }, [userData]);
  
  const isQcChanged = JSON.stringify(qcFields) !== JSON.stringify(initialQcFields);
  const [initialValues, setInitialValues] = useState<any>(null);
  const fields = useFormFields({ connect: form });
  const isFormValuesChanged = isFormFieldsChanged({
    fields,
    initialValues,
    keys: keys,
  }) || isQcChanged;


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
                  {isView ? "View Contact" : isEdit ? "Edit Contact" : "Add New Contact"}
                </BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            <Heading as="h4" size={"md"}>
              {isView ? "View Contact" : isEdit ? "Edit Contact" : "Add New Contact"}
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
          <Stack spacing={2} p={4} bg={"white"} borderRadius={"md"} boxShadow={"md"}>
            <Formiz autoForm connect={form}>
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
                    let year_of_business: number = 0;
                    if (value) {
                      year_of_business =
                        Number(dayjs().year()) - Number(dayjs(value).year());
                      form.setValues({
                        [`year_of_business`]: year_of_business.toString(),
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
                  onKeyDown={(e) => {
                    if (e.key === ' ') {
                      e.preventDefault();
                    }
                  }}
                  placeholder="Enter email"
                  validations={[
                    {
                      handler: isEmail(),
                      message: 'Invalid email',
                    },
                  ]}
                  required={'Email is required'}
                  maxLength={100}
                />
              </Stack>

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                <Stack
                  w={'full'}
                  spacing={8}
                  direction={{ base: 'column', md: 'row' }}
                >
                  <FieldInput
                    label="License / Trade Number"
                    name="license_trade_no"
                    placeholder="Enter license / trade number"
                    maxLength={25}
                    type={'alpha-numeric-with-special'}
                    required={
                      fields?.license_trade_exp_date?.value ||
                        fields?.license_trade_url?.value
                        ? 'License / Trade Number required'
                        : ''
                    }
                  />
                  <FieldDayPicker
                    label="License / Trade Expiry Date"
                    name="license_trade_exp_date"
                    placeholder="Enter license / trade expiry date"
                    disabledDays={{ before: new Date() }}
                    required={
                      fields?.license_trade_no?.value ||
                        fields?.license_trade_url?.value
                        ? 'License / Trade Expiry Date required'
                        : ''
                    }
                  />
                </Stack>
                <FieldUpload
                  label="License / Trade Doc Upload"
                  name="license_trade_url"
                  placeholder="Upload license / trade doc"
                  required={
                    fields?.license_trade_no?.value ||
                      fields?.license_trade_exp_date?.value
                      ? 'License / Trade Doc required'
                      : ''
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
                  required={
                    fields?.vat_tax_url?.value
                      ? 'License / Trade Expiry Date required'
                      : ''
                  }
                />
                <FieldUpload
                  label="Vat / Tax Doc Upload"
                  name="vat_tax_url"
                  placeholder="Upload vat / tax doc"
                  required={
                    fields?.vat_tax_id?.value
                      ? 'License / Trade Expiry Date required'
                      : ''
                  }
                />
              </Stack>
              {/* New Code */}
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
                  onValueChange={(value) => {
                    handlePaymentTermsChange(value);
                  }}
                />

                <FieldInput
                  key={`total_credit_amount`}
                  label={'Total Credit Amount'}
                  name={'total_credit_amount'}
                  required={
                    !tocDisabled ? 'Total Credit Amount is required' : ''
                  }
                  placeholder="Enter Total Credit Amount"
                  type="decimal"
                  maxLength={10}
                  isDisabled={tocDisabled}
                />
                <FieldInput
                  key={`total_credit_period`}
                  label={'Total Credit Period (Days)'}
                  name={'total_credit_period'}
                  required={
                    !tocDisabled ? 'Total Credit Period is required' : ''
                  }
                  placeholder="Enter Total Credit Period"
                  type="integer"
                  maxLength={6}
                  isDisabled={true}
                />
              </Stack>

              <QualityCertificates
                name="QC"
                fields={qcFields}
                onAdd={addQcFields}
                onRemove={removeQcFields}
                onEdit={editQcFields}
                fieldPrefix="certificate"
              />

              <Stack spacing={8} direction={{ base: 'column', md: 'row' }} mb={3}>
                <FieldTextarea
                  label="Remarks"
                  name="remarks"
                  placeholder="Enter remarks"
                  maxLength={100}
                />
              </Stack>

              <Stack
                direction={{ base: "column", md: "row" }}
                justify={"center"}
                alignItems={"center"}
                mt={6}
              >
                {!isView && (
                  <Button
                    type="submit"
                    colorScheme="brand"
                    isLoading={
                      saveCustomer.isLoading}
                    isDisabled={
                      saveCustomer.isLoading ||
                      !form.isValid || (isEdit ? !isFormValuesChanged : false)
                    }
                  >
                    {isEdit ? "Update" : "Submit"}
                  </Button>
                )}
                <Button
                  colorScheme="red"
                  isDisabled={
                    saveCustomer.isLoading
                  }
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </Button>
              </Stack>
            </Formiz>
          </Stack>
        </LoadingOverlay>
      </Stack>
    </SlideIn>
  );
};

export default CustomerForm;