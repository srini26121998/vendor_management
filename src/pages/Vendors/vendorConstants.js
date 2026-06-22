// ─── Vendor Module Design Tokens ───────────────────────────────────────────
export const VENDOR_COLORS = {
    primary: '#1e40af', // Indigo/Blue
    accent: '#3b82f6',  // Light Blue
    success: '#059669',
    successDark: '#064e3b',
    warning: '#d97706',
    warningDark: '#78350f',
    danger: '#dc2626',
    dangerDark: '#7f1d1d',
    surface: '#F0F7FF', // Ice Blue Surface
    muted: '#64748b',
    border: '#e2e8f0',
};

export const STATUS_COLORS = {
    // ── Frontend (lowercase) — used by existing mock data ──
    active:        { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Active' },
    blocked:       { bg: '#fef2f2', text: '#991b1b', dot: '#dc2626', label: 'Blocked' },
    pending_kyc:   { bg: '#f8fafc', text: '#475569', dot: '#94a3b8', label: 'Pending KYC' },
    expiring_soon: { bg: '#fff7ed', text: '#9a3412', dot: '#ea580c', label: 'Expiring Soon' },
    inactive:      { bg: '#f8fafc', text: '#475569', dot: '#94a3b8', label: 'Inactive' },
    in_review:     { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6', label: 'In Review' },
    under_review:  { bg: '#fff7ed', text: '#9a3412', dot: '#ea580c', label: 'Under Review' },
    rejected:      { bg: '#fdf2f8', text: '#9d174d', dot: '#ec4899', label: 'Rejected' },
    paid:          { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Paid' },

    // ── Purchase Order Lifecycle Statuses ──
    pending:            { bg: '#fff7ed', text: '#c2410c', dot: '#ea580c', label: 'Pending' },
    approved:           { bg: '#ecfdf5', text: '#047857', dot: '#10b981', label: 'Approved' },
    received:           { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6', label: 'Received' },
    partially_received: { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', label: 'Partially Received' },

    // ── Backend (uppercase) — kycStatus values from VendorResponseDTO ──
    ACTIVE:        { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Active' },
    BLOCKED:       { bg: '#fef2f2', text: '#991b1b', dot: '#dc2626', label: 'Blocked' },
    PENDING:       { bg: '#f8fafc', text: '#475569', dot: '#94a3b8', label: 'Pending KYC' },
    IN_REVIEW:     { bg: '#eff6ff', text: '#1d4ed8', dot: '#3b82f6', label: 'In Review' },
    REJECTED:      { bg: '#fdf2f8', text: '#9d174d', dot: '#ec4899', label: 'Rejected' },
    INACTIVE:      { bg: '#f8fafc', text: '#475569', dot: '#94a3b8', label: 'Inactive' },
    PAID:          { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Paid' },
    PROCESSED:     { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Success' },
    SUCCESS:       { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Success' },

    // ── RTV Reverse Logistics Statuses ──
    FLAGGED:            { bg: '#fff7ed', text: '#9a3412', dot: '#ea580c', label: 'Initiated' },
    DEBIT_NOTE_RAISED:  { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6', label: 'Debit Note Generated' },
    VENDOR_NOTIFIED:    { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b', label: 'Awaiting Action' },
    SHIPPED_BACK:       { bg: '#f3e8ff', text: '#6b21a8', dot: '#a855f7', label: 'Shipped Back' },
    DISPUTED:           { bg: '#fef2f2', text: '#991b1b', dot: '#dc2626', label: 'Disputed' },
    RESOLVED:           { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Completed' },
    FORCE_CLOSED:       { bg: '#f1f5f9', text: '#334155', dot: '#64748b', label: 'Closed (Force)' },

    // ── Compliance status ──
    COMPLIANT:      { bg: '#ecfdf5', text: '#065f46', dot: '#059669', label: 'Compliant' },
    EXPIRING_SOON:  { bg: '#fff7ed', text: '#9a3412', dot: '#ea580c', label: 'Expiring Soon' },
    NON_COMPLIANT:  { bg: '#fef2f2', text: '#991b1b', dot: '#dc2626', label: 'Non-Compliant' },
};


export const VENDOR_CATEGORIES = [
    'Fresh', 'Dairy', 'Beverages', 'Staples', 'FMCG', 'Frozen', 'Non-Food'
];



export const PO_TYPES = [
    'Standard PO', 'Blanket PO', 'Emergency PO', 'Contract PO'
];

export const PAYMENT_TERMS = [
    'Net 7', 'Net 15', 'Net 30', 'Net 45', 'Net 60', 'Advance', 'On Delivery'
];



export const TAX_CATEGORIES = [
    '0%', '5%', '12%', '18%', '28%'
];




// ─── Onboarding Workflow Stages ───────────────────────────────────────────
export const ONBOARDING_STAGES = [
    { key: 'category_manager', label: 'Category Manager', icon: '👤' },
    { key: 'quality_dept', label: 'Quality Dept', icon: '🔬' },
    { key: 'finance_controller', label: 'Finance Controller', icon: '💰' },
    { key: 'director', label: 'Director', icon: '👔' },
];





// ─── Aging Data ────────────────────────────────────────────────────────────
export const AGING_DATA = [
    { range: '0-30 DAYS', amount: 680000, count: 12, color: '#2563eb', fill: '#eff6ff' },
    { range: '31-60 DAYS', amount: 283000, count: 6, color: '#f59e0b', fill: '#fffbeb' },
    { range: '61-90 DAYS', amount: 145000, count: 3, color: '#ea580c', fill: '#fff7ed' },
    { range: '90+ DAYS', amount: 107400, count: 2, color: '#dc2626', fill: '#fef2f2' },
];



// ─── Helper Utils ──────────────────────────────────────────────────────────
export const formatCurrency = (val) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

export const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

export const getStatusStyle = (status) => STATUS_COLORS[status] || STATUS_COLORS.active;

export const VENDOR_ROUTES = {
    dashboard: '/vendors/dashboard',
    list: '/vendors/list',
    productList: '/vendors/products',
    detail: '/vendors/detail',
    onboarding: '/vendors/onboarding',
    onboardingWorkflow: '/vendors/onboarding-workflow',
    poList: '/vendors/purchase-orders',
    poCreate: '/vendors/purchase-orders/create',
    poDetail: '/vendors/purchase-orders/detail',
    grnEntry: '/vendors/grn/entry',
    grnList: '/vendors/grn/list',
    ocrInvoice: '/vendors/invoices/ocr',
    invoiceCreate: '/vendors/invoices/create',
    purchaseInvoice: '/vendors/invoices',
    payablesDash: '/vendors/payables',
    paymentProcess: '/vendors/payments',
    ledger: '/vendors/ledger',
    gstRecon: '/vendors/gst-reconciliation',
    scorecard: '/vendors/scorecard',
    reports: '/vendors/reports',
    aiInsights: '/vendors/ai-insights',
    portal: '/vendors/portal',
    multiOutlet: '/vendors/multi-outlet',
    stockTransfer: '/vendors/stock-transfer',
    fulfillment: '/vendors/fulfillment',
    aggregatorPayout: '/vendors/aggregator-payout',
    whatsapp: '/vendors/whatsapp',
    mobileGrn: '/vendors/mobile-grn',
    settings: '/vendors/settings',
    notifications: '/vendors/notifications',
    approvalQueue: '/vendors/approvals',
    // Procurement & Ordering
    smartPO: '/vendors/procurement/smart-po',
    demandForecasting: '/vendors/procurement/forecasting',
    reverseAuction: '/vendors/procurement/reverse-auction',
    inboundLogistics: '/vendors/procurement/inbound-logistics',
    rtvWorkflow: '/vendors/procurement/rtv-workflow',
    // Inventory & Stock Management
    warehouseMap: '/vendors/inventory/warehouse-map',
    stockTransferAdvanced: '/vendors/inventory/stock-transfer',
    cycleAudit: '/vendors/inventory/cycle-audit',
    predictiveExpiry: '/vendors/inventory/predictive-expiry',
};

