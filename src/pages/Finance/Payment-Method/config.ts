export type FieldType =
    | "text"
    | "email"
    | "phone"
    | "select"
    | "checkbox"
    | "integer"
    | "alpha-with-space"
    | "alpha-numeric"
    | "phone-number";

export interface FieldConfig {
    name: string;
    label: string;
    placeholder?: string;
    required?: string;
    type?: FieldType;
    options?: { value: string; label: string }[];
    maxLength?: number;
    optionsKey?: string;
}

export const BANK_FIELDS: FieldConfig[][] = [
    [
        {
            name: "name",
            label: "Bank Name",
            placeholder: "Enter bank name",
            required: "Name is required",
            type: "alpha-with-space",
            maxLength: 70,
        },
        {
            name: "type_of_ac",
            label: "Type of Account",
            placeholder: "Enter account type",
            required: "Account Type is required",
            type: "alpha-with-space",
            maxLength: 30,
        },
        {
            name: "account_label",
            label: "Account Label",
            placeholder: "Enter account label",
            required: "Account Label is required",
            type: "alpha-with-space",
            maxLength: 30,
        },
        
    ],
    [
        {
            name: "address_line1",
            label: "Address Line 1",
            placeholder: "Enter Address Line 1",
            required: "Address is required",
            type: "text",
            maxLength: 50,
        },
        {
            name: "address_line2",
            label: "Address Line 2",
            placeholder: "Enter Address Line 2",
            type: "text",
            maxLength: 50,
        },
    ],
    [
        {
            name: "currency_id",
            label: "Currency",
            placeholder: "Select Currency",
            required: "Currency is required",
            type: "select",
            optionsKey: "currencies",
        },
        {
            name: "branch",
            label: "Branch",
            placeholder: "Enter bank branch",
            required: "Branch is required",
            type: "alpha-with-space",
            maxLength: 35,
        },
        {
            name: "contact_name",
            label: "Contact Name",
            placeholder: "Enter Contact Name",
            required: "Contact Name is required",
            type: "alpha-with-space",
            maxLength: 70,
        },
        {
            name: "ac_iban_no",
            label: "IBAN Number",
            placeholder: "Enter IBAN Number",
            required: "IBAN Number is required",
            type: "alpha-numeric",
            maxLength: 34,
        },
    ],
    [
        {
            name: "swift",
            label: "Swift Code",
            placeholder: "Enter Bank Swift code",
            required: "Swift code is required",
            type: "alpha-numeric",
            maxLength: 11,
        },
        {
            name: "aba_routing_no",
            label: "ABA Routing Number",
            placeholder: "Enter ABA Routing Number",
            type: "alpha-numeric",
            maxLength: 11,
        },
    ],
    [
        {
            name: "phone",
            label: "Phone Number",
            placeholder: "Enter Bank Phone Number",
            type: "phone",
        },
        {
            name: "fax",
            label: "Fax No",
            placeholder: "Enter Bank Fax No",
            type: "phone-number",
            maxLength: 15,
        },
        {
            name: "mobile",
            label: "Mobile Number",
            placeholder: "Enter Bank Mobile Number",
            type: "phone-number",
            maxLength: 15,
        },
        {
            name: "email",
            label: "Email",
            placeholder: "Enter Email",
            type: "email",
            maxLength: 100,
        },
    ],
];

export const CARD_FIELDS: FieldConfig[][] = [
    [
        {
            name: "card_label",
            label: "Card Label",
            placeholder: "Enter Card Label",
            required: "Card Label is required",
            type: "alpha-with-space",
            maxLength: 50,
        },
        {
            name: "card_holder_name",
            label: "Card Holder Name",
            placeholder: "Enter Holder Name",
            required: "Holder Name is required",
            type: "alpha-with-space",
            maxLength: 100,
        },
        {
            name: "card_type",
            label: "Card Type",
            placeholder: "Enter Card Type",
            required: "Card Type is required",
            type: "alpha-with-space",
            maxLength: 30,
        },
    ],
    [
        {
            name: "card_category",
            label: "Card Category",
            placeholder: "Enter Card Category",
            required: "Card Category is required",
            type: "alpha-with-space",
            maxLength: 30,
        },
        {
            name: "card_last4",
            label: "Last 4 Digits",
            placeholder: "Enter Last 4 Digits",
            required: "Last 4 Digits is required",
            type: "integer",
            maxLength: 4,
        },
        {
            name: "expiry_month",
            label: "Expiry Month",
            placeholder: "MM",
            required: "Expiry Month is required",
            type: "integer",
            maxLength: 2,
        },
    ],
    [
        {
            name: "expiry_year",
            label: "Expiry Year",
            placeholder: "YYYY",
            required: "Expiry Year is required",
            type: "integer",
            maxLength: 4,
        },
        {
            name: "bank_name",
            label: "Bank Name",
            placeholder: "Enter Bank Name",
            required: "Bank Name is required",
            type: "alpha-with-space",
            maxLength: 100,
        },
        {
            name: "currency_id",
            label: "Currency",
            placeholder: "Select Currency",
            required: "Currency is required",
            type: "select",
            optionsKey: "currencies",
        }
    ],
    [
        {
            name: "address_line1",
            label: "Address Line 1",
            placeholder: "Enter Address Line 1",
            type: "text",
            maxLength: 100,
        },
        {
            name: "address_line2",
            label: "Address Line 2",
            placeholder: "Enter Address Line 2",
            type: "text",
            maxLength: 100,
        },
    ],
    [
        {
            name: "contact_name",
            label: "Contact Name",
            placeholder: "Enter Contact Name",
            required: "Contact Name is required",
            type: "alpha-with-space",
            maxLength: 100,
        },
        {
            name: "phone",
            label: "Phone",
            placeholder: "Enter Phone",
            type: "phone",
        },
        {
            name: "mobile",
            label: "Mobile",
            placeholder: "Enter Mobile",
            type: "phone-number",
            maxLength: 15,
        },
    ],
    [
        {
            name: "email",
            label: "Email",
            placeholder: "Enter Email",
            type: "email",
            maxLength: 100,
        },
    ],
];

export const CHEQUE_FIELDS: FieldConfig[][] = [
    [
        {
            name: "name",
            label: "Name",
            placeholder: "Enter Name",
            required: "Name is required",
            type: "alpha-with-space",
            maxLength: 100,
        },
        {
            name: "account_label",
            label: "Account Label",
            placeholder: "Enter Account Label",
            required: "Account Label is required",
            type: "alpha-with-space",
            maxLength: 50,
        },
        {
            name: "branch",
            label: "Branch",
            placeholder: "Enter Branch",
            required: "Branch is required",
            type: "alpha-with-space",
            maxLength: 100,
        },
    ],
    [
        {
            name: "ac_no",
            label: "AC No",
            placeholder: "Enter AC No",
            required: "AC No is required",
            type: "alpha-numeric",
            maxLength: 50,
        },
        {
            name: "type_of_ac",
            label: "Type of Account",
            placeholder: "Enter Account Type",
            required: "Account Type is required",
            type: "alpha-with-space",
            maxLength: 50,
        },
        {
            name: "aba_routing_no",
            label: "ABA Routing No",
            placeholder: "Enter ABA Routing No",
            type: "alpha-numeric",
            maxLength: 20,
        },
    ],
    [
        {
            name: "address_line1",
            label: "Address Line 1",
            placeholder: "Enter Address Line 1",
            required: "Address is required",
            type: "text",
            maxLength: 50,
        },
        {
            name: "address_line2",
            label: "Address Line 2",
            placeholder: "Enter Address Line 2",
            type: "text",
            maxLength: 50,
        },
    ],
    [
        {
            name: "ifsc_code",
            label: "IFSC Code",
            placeholder: "Enter IFSC Code",
            type: "alpha-numeric",
            maxLength: 20,
        },
        {
            name: "micr_code",
            label: "MICR Code",
            placeholder: "Enter MICR Code",
            type: "alpha-numeric",
            maxLength: 20,
        },
        {
            name: "currency_id",
            label: "Currency",
            placeholder: "Select Currency",
            required: "Currency is required",
            type: "select",
            optionsKey: "currencies",
        }
    ],
    [
        {
            name: "contact_name",
            label: "Contact Name",
            placeholder: "Enter Contact Name",
            required: "Contact Name is required",
            type: "alpha-with-space",
            maxLength: 100,
        },
        {
            name: "phone",
            label: "Phone",
            placeholder: "Enter Phone",
            type: "phone",
        },
        {
            name: "mobile",
            label: "Mobile",
            placeholder: "Enter Mobile",
            type: "phone-number",
            maxLength: 15,
        },
    ],
    [
        {
            name: "fax",
            label: "Fax",
            placeholder: "Enter Fax",
            type: "phone-number",
            maxLength: 15,
        },
        {
            name: "email",
            label: "Email",
            placeholder: "Enter Email",
            type: "email",
            maxLength: 100,
        },
    ],
];

export const METHOD_CONFIG: Record<string, { title: string; rows: FieldConfig[][] }> = {
    banks: { title: "Bank", rows: BANK_FIELDS },
    cards: { title: "Card", rows: CARD_FIELDS },
    cheques: { title: "Cheque", rows: CHEQUE_FIELDS },
};