// /pages/UpdateDeleteRequests/config/module-model-config.ts

export const MODULE_MODEL_OPTIONS: Record<string, { label: string; value: string }[]> = {
    contact_management: [
        { label: "Customers",          value: "customers" },
        { label: "Customer Banks",     value: "banks" },
        { label: "Contact Managers",   value: "contact_managers" },
        { label: "Shipping Addresses", value: "shipping_addresses" },
        { label: "Principle Owners",   value: "principle_owners" },
        { label: "Trader References",  value: "trader_references" },
    ],
    purchase: [
        { label: "Material Request",   value: "mr" },
        { label: "PRFQ", value: "prfq" },
        { label: "Purchase Order",   value: "po" },
        { label: "Sales Enquiry Log",  value: "sel" },
    ],
};