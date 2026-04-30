import { symbol, z } from "zod";
import { zBasicObject } from "@/services/global-schema";
import { FieldInput } from "@/components/FieldInput";
import { FieldCheckbox } from "@/components/FieldCheckbox";
import { FieldRadios } from "@/components/FieldRadios";

export const submasterConfig: Record<string, any> = {
    default: {
        title: "Master",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha-numeric-with-special",
                maxLength: 10
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject
    },

    "fobs": {
        title: "FOB",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha-numeric-with-special",
                maxLength: 15
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject
    },

    "spare-classes": {
        title: "Spare Class",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha-numeric-with-space",
                maxLength: 15
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject
    },

    "spare-types": {
        title: "Spare Type",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha-numeric-with-space",
                maxLength: 15
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject
    },

    "spare-models": {
        title: "Spare Model",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha-numeric-special-with-space",
                maxLength: 15
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject
    },


    "ship-modes": {
        title: "Ship Mode",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha-with-space",
                maxLength: 20
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject
    },

    "ship-types": {
        title: "Ship Type",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha-with-space",
                maxLength: 15
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject
    },

    
    "package-types": {
        title: "Package Type",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha-with-space",
                maxLength: 15
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject
    },

        "business-types": {
        title: "Business Type",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha",
                maxLength: 15
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject
    },

    "unit-of-measures": {
        title: "UOM",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha",
                maxLength: 5
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject
    },


     "conditions": {
        title: "Condition",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha",
                maxLength: 3
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject
    },

    "financial-charges": {
        title: "Financial Charge",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha-with-space",
                maxLength: 20
            },
            {
                component: FieldRadios,
                name: "charge_type",
                defaultValue: "value",
                label: "Charge Type",
                options: [
                    { value: "value", label: "Fixed Value" },
                    { value: "percent", label: "Percentage" },
                ]
            },
            {
                component: FieldRadios,
                name: "calculation_type",
                label: "Calculation Type",
                options: [
                    { value: "add", label: "Add (+)" },
                    { value: "subtract", label: "Subtract (-)" },
                ],
                defaultValue: "add",
            }
        ],
        columns: ["name", "charge_type", "calculation_type"],
        extraFields: { charge_type: "Charge Type", calculation_type: "Operation" },
        schema: zBasicObject.extend({
            charge_type: z.string(), calculation_type: z.string(), is_vat: z.boolean(),
        }),
    },

    "customer-statuses": {
        title: "Customer Status",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                maxLength: 15
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject.extend({
            code: z.string(),
        }),
    },

    "hsc-codes": {
        title: "HSC Code",
        formType: "modal",
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "integer",
                maxLength: 15
            },
        ],
        columns: ["name"],
        extraFields: {},
        schema: zBasicObject
    },

    "contact-types": {
        title: "Contact Type",
        formType: "modal",
        columns: ["name", "code"],
        extraFields: { code: "Cust Code" },
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Contact Type",
                required: "Contact Type required",
                type: "alpha-numeric-with-space",
                maxLength: 16
            },
            {
                component: FieldInput,
                name: "code",
                placeholder: "Enter Code",
                required: "Code required",
            },
        ],
        schema: zBasicObject.extend({
            code: z.string(),
        }),
    },

    "currencies": {
        title: "Currency",
        formType: "modal",
        columns: ["name", "code", "symbol"],
        extraFields: { code: "Code", symbol: "Symbol" },
        hideCreate: true,
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Currency Name",
                required: "Currency Name required",
                type: "alpha-numeric-with-space",
                maxLength: 15
            },
            {
                component: FieldInput,
                name: "code",
                placeholder: "Enter Currency Code",
                required: "Code Currency required",
                type: "alpha",
                maxLength: 3,
                isDisabled: true
            },
            {
                component: FieldInput,
                name: "symbol",
                placeholder: "Enter Currency Symbol",
                type: "text",
                required: 'Currency Symbol required',
                maxLength: 3,
                isDisabled: true
            }
        ],
        schema: zBasicObject.extend({
            code: z.string().nullable().optional(),
            symbol: z.string().nullable().optional(),
        }),
    },

    "payment-terms": {
        title: "Payment Term",
        formType: "modal",
        columns: ["name", "credit_days"],
        extraFields: { credit_days: "Credit Days" },
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Payment Term",
                required: "Payment Term required",
                type: "alpha-numeric-with-space",
                maxLength: 6
            },
            {
                component: FieldInput,
                name: "credit_days",
                placeholder: "Enter No of Days",
                required: "No of Day required",
                type: "integer",
                maxValue: 999
            },
        ],
        schema: zBasicObject.extend({
            credit_days: z.number().nullable().optional(),
            code: z.string().nullable().optional(),
        }),
    },

    "payment-modes": {
        title: "Payment Mode",
        formType: "modal",
        columns: ["name"],
        extraFields: {},
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Payment Term",
                required: "Payment Term required",
                type: "alpha-numeric-with-space",
                maxLength: 15
            }
        ],
        schema: zBasicObject.extend({
            credit_days: z.number().nullable().optional(),
            code: z.string().nullable().optional(),
        }),
    },

    "payment-vias": {
        title: "Payment Via",
        formType: "modal",
        columns: ["name", "code"],
        extraFields: { code: "Code" },
        hideCreate: true,
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Payment Via",
                required: "Payment Via required",
                type: "alpha-numeric-with-space",
                maxLength: 15
            },
            {
                component: FieldInput,
                name: "code",
                placeholder: "Enter Code",
                required: "Code required",
                type: "text",
                maxValue: 4,
                isDisabled: true
            },
        ],
        schema: zBasicObject.extend({
            code: z.string().nullable().optional(),
        }),
    },

    "priorities": {
        title: "Priority",
        formType: "modal",
        columns: ["name", "days"],
        extraFields: { days: "Days" },
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Priority Name",
                required: "Priority Name required",
                type: "alpha-numeric-with-special",
                maxLength: 10
            },
            {
                component: FieldInput,
                name: "days",
                placeholder: "Enter No of Days",
                required: "No of Day required",
                type: "integer",
                maxValue: 999
            },
        ],
        schema: zBasicObject.extend({
            days: z.number(),
            is_custom: z.boolean(),
        }),
    },

    "ship-accounts": {
        title: "Ship Account",
        formType: "modal",
        columns: ["name", "account_number"],
        extraFields: { account_number: "Account No" },
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha-numeric-with-space",
                maxLength: 15
            },
            {
                component: FieldInput,
                name: "account_number",
                placeholder: "Enter Account No",
                // required: "Account No required",
                type: "integer",
                maxLength: 15
            },
        ],
        schema: zBasicObject.extend({
            account_number: z.string().nullable().optional(),
        }),
    },

    "racks": {
        title: "Rack",
        formType: "modal",
        columns: ["name", "is_quarantine"],
        extraFields: { is_quarantine: "Is Quarantine" },
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha-numeric-with-space",
                maxLength: 15
            },
            {
                component: FieldCheckbox,
                name: "is_quarantine",
                label: "Is Quarantine"
            }
        ],
        schema: zBasicObject.extend({
            is_quarantine: z.boolean(),
        }),
    },

    "uns": {
        title: "Unified Number",
        formType: "modal",
        columns: ["name", "description", "un_class"],
        extraFields: { description: "Description", un_class: "Class" },
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Name",
                required: "Name required",
                type: "alpha-numeric-with-space",
                maxLength: 9
            },
            {
                component: FieldInput,
                name: "description",
                placeholder: "Enter Description",
                required: "Description required",
                type: "alpha-numeric-with-space"
            },
            {
                component: FieldInput,
                name: "un_class",
                placeholder: "Enter Class",
                required: "Class required",
                type: "lpha-numeric-with-special"
            }
        ],
        schema: zBasicObject.extend({
            description: z.string(),
            un_class: z.string(),
        }),
    },

    "warehouses": {
        title: "Warehouse",
        formType: "page",
        columns: ["name",
            "consignee_name",
            "email",
            "phone",
            "city",
            "state",
            "zip_code",
            "country"],
        extraFields: {
            consignee_name: "consignee_name",
            email: "email",
            phone: "phone",
            city: "city",
            state: "state",
            zip_code: "zip_code",
            country: "country",
        },
        fields: [
            {
                "name": "name"
            },
            {
                "name": "consignee_name"
            },
            {
                "name": "address"
            },
            {
                "name": "city"
            },
            {
                "name": "state"
            },
            {
                "name": "zip_code"
            },
            {
                "name": "country"
            },
            {
                "name": "phone"
            },
            {
                "name": "fax"
            },
            {
                "name": "email"
            },
            {
                "name": "remarks"
            },
        ],
        schema: zBasicObject.extend({
            address: z.string(),
            city: z.string().nullable(),
            consignee_name: z.string(),
            country: z.string(),
            email: z.string(),
            fax: z.string().nullable().optional(),
            phone: z.string(),
            remarks: z.string().nullable().optional(),
            state: z.string().nullable(),
            zip_code: z.string().nullable(),
        }),
        stickyColumns: 3
    },
};