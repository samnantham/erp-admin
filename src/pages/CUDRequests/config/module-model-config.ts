export const MODULE_MODEL_OPTIONS: Record<string, { label: string; value: string }[]> = {
    contact_management: [
        { label: "Customers",          value: "customers" },
        { label: "Customer Banks",     value: "banks" },
        { label: "Contact Managers",   value: "contact_managers" },
        { label: "Shipping Addresses", value: "shipping_addresses" },
        { label: "Principle Owners",   value: "principle_owners" },
        { label: "Trader References",  value: "trader_references" },
    ],
    spare: [
        { label: "Spares",          value: "part_numbers" }
    ],
    sales: [
        { label: "Sales",          value: "sales_logs" }
    ],
    purchase: [
        { label: "Material Request",   value: "material_requests" },
        { label: "PRFQ", value: "prfqs" },
        { label: "Purchase Order",   value: "purchase_orders" },
    ],

    finance: [
        { label: "Finance Banks",   value: "finance_banks" },
        { label: "Finance Cards",   value: "finance_cards" },
        { label: "Finance Cheques", value: "finance_cheques" },
    ],
};