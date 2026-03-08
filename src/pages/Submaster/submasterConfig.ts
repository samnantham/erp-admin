import { z } from "zod";
import { zBasicObject } from "@/services/global-schema";
import { FieldInput } from "@/components/FieldInput";
import { FieldCheckbox } from "@/components/FieldCheckbox";

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
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Currency Name",
                required: "Currency Name required",
                type: "all-capital",
                maxLength: 15
            },
            {
                component: FieldInput,
                name: "code",
                placeholder: "Enter Currency Code",
                required: "Code Currency required",
                type: "alpha",
                maxLength: 3
            },
            {
                component: FieldInput,
                name: "symbol",
                placeholder: "Enter Currency Symbol",
                type: "text",
                required: 'Currency Symbol required',
                maxLength: 3
            }
        ],
        schema: zBasicObject.extend({
            code: z.string(),
            symbol: z.string(),
        }),
    },

    "payment-terms": {
        title: "Payment Term",
        formType: "modal",
        columns: ["name", "no_of_days"],
        extraFields: { no_of_days: "Credit Days" },
        fields: [
            {
                component: FieldInput,
                name: "name",
                placeholder: "Enter Payment Term",
                required: "Payment Term required",
                type: "all-capital"
            },
            {
                component: FieldInput,
                name: "no_of_days",
                placeholder: "Enter No of Days",
                required: "No of Day required",
                type: "integer",
                maxValue: 999
            },
        ],
        schema: zBasicObject.extend({
            no_of_days: z.number(),
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
                type: "all-capital",
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
                type: "all-capital"
            },
            {
                component: FieldInput,
                name: "account_number",
                placeholder: "Enter Account No",
                required: "Account No required",
                type: "integer",
                maxLength: 15
            },
        ],
        schema: zBasicObject.extend({
            account_number: z.string(),
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
                type: "all-capital"
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