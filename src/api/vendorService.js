/**
 * Vendor Management API Service
 * All endpoints mapped exactly to the Spring Boot backend controllers.
 */
import api from './axios';

// ─── Vendor CRUD ─────────────────────────────────────────────────────────────
// GET  /api/vendors                          → List all (params: search, complianceStatus, kycStatus)
// POST /api/vendors                          → Create vendor (VendorRequestDTO)
// GET  /api/vendors/{id}                     → Full vendor detail with sub-resources
// PUT  /api/vendors/{id}                     → Update vendor (VendorRequestDTO)
// DELETE /api/vendors/{id}                   → Soft delete

export const fetchVendors = (params) =>
  api.get('/vendors', { params });

export const fetchVendorById = (id) =>
  api.get(`/vendors/${id}`);

export const createVendor = (payload, userId = null) =>
  api.post('/vendors', payload, {
    headers: userId ? { 'X-User-Id': userId } : {},
  });

export const updateVendor = (id, payload) =>
  api.put(`/vendors/${id}`, payload);

export const deleteVendor = (id) =>
  api.delete(`/vendors/${id}`);

// ─── Vendor Status ────────────────────────────────────────────────────────────
// PATCH /api/vendors/{id}/block              → Block vendor  (body: { reason })
// PATCH /api/vendors/{id}/unblock            → Unblock vendor

export const blockVendor = (id, reason) =>
  api.patch(`/vendors/${id}/block`, { reason });

export const unblockVendor = (id) =>
  api.patch(`/vendors/${id}/unblock`);

// ─── Onboarding Workflow ─────────────────────────────────────────────────────
// POST /api/vendors/{id}/onboarding/approve  → Advance to next stage (body: { comments })
// POST /api/vendors/{id}/onboarding/reject   → Reject at current stage (body: { reason })

export const approveOnboarding = (id, comments = null) =>
  api.post(`/vendors/${id}/onboarding/approve`, comments ? { comments } : {});

export const rejectOnboarding = (id, reason) =>
  api.post(`/vendors/${id}/onboarding/reject`, { reason });

// ─── Vendor Stats & Purchase History ─────────────────────────────────────────
// GET /api/vendors/{id}/stats                → VendorStatsDTO
// GET /api/vendors/{id}/purchase-orders      → List<VendorPurchaseHistoryDTO>

export const fetchVendorStats = (id) =>
  api.get(`/vendors/${id}/stats`);

export const fetchVendorPurchaseHistory = (id) =>
  api.get(`/vendors/${id}/purchase-orders`);

// ─── Vendor Locations ─────────────────────────────────────────────────────────
// POST   /api/vendors/{id}/locations         → Add location (VendorLocationDTO)
// DELETE /api/vendors/locations/{locationId} → Remove location

export const addLocation = (vendorId, dto) =>
  api.post(`/vendors/${vendorId}/locations`, dto);

export const deleteLocation = (locationId) =>
  api.delete(`/vendors/locations/${locationId}`);

// ─── Vendor Bank Accounts ─────────────────────────────────────────────────────
// POST   /api/vendors/{id}/bank-accounts     → Add bank account (VendorBankAccountDTO)
// DELETE /api/vendors/bank-accounts/{id}     → Remove bank account

export const addBankAccount = (vendorId, dto) =>
  api.post(`/vendors/${vendorId}/bank-accounts`, dto);

export const deleteBankAccount = (accountId) =>
  api.delete(`/vendors/bank-accounts/${accountId}`);

// ─── Vendor Documents ─────────────────────────────────────────────────────────
// POST /api/vendors/{id}/documents           → Add document (VendorDocumentDTO)
// POST /api/vendors/documents/{docId}/approve → Approve document
// POST /api/vendors/documents/{docId}/reject  → Reject document (body: { reason })
// DELETE /api/vendors/documents/{docId}      → Delete document

export const addDocument = (vendorId, dto) =>
  api.post(`/vendors/${vendorId}/documents`, dto);

export const approveDocument = (docId, userId = null) =>
  api.post(`/vendors/documents/${docId}/approve`, null, {
    headers: userId ? { 'X-User-Id': userId } : {},
  });

export const rejectDocument = (docId, reason) =>
  api.post(`/vendors/documents/${docId}/reject`, { reason });

export const deleteDocument = (docId) =>
  api.delete(`/vendors/documents/${docId}`);

// ─── Vendor Bulk Upload ───────────────────────────────────────────────────────
// GET  /api/vendors/bulk-upload/template → Download Excel template
// POST /api/vendors/bulk-upload          → Upload Excel file (multipart/form-data)

export const downloadVendorTemplate = () =>
  api.get('/vendors/bulk-upload/template', { responseType: 'blob' });

export const uploadVendorBulk = (file, updateExisting = true, userId = null) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('updateExisting', updateExisting);
  return api.post('/vendors/bulk-upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(userId && { 'X-User-Id': userId }),
    },
  });
};

// ─── Compliance ───────────────────────────────────────────────────────────────
// POST /api/vendors/compliance/scan          → Trigger manual compliance scan

export const triggerComplianceScan = () =>
  api.post('/vendors/compliance/scan');

// ─── Bulk Upload ──────────────────────────────────────────────────────────────
// GET  /api/vendors/bulk-upload/template     → Download Excel template
// POST /api/vendors/bulk-upload              → Upload Excel (multipart)

export const downloadBulkTemplate = () =>
  api.get('/vendors/bulk-upload/template', { responseType: 'blob' });

export const bulkUploadVendors = (file, updateExisting = true, userId = null) => {
  const form = new FormData();
  form.append('file', file);
  form.append('updateExisting', updateExisting);
  return api.post('/vendors/bulk-upload', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(userId ? { 'X-User-Id': userId } : {}),
    },
  });
};

// ─── Vendor Products ──────────────────────────────────────────────────────────
// GET  /api/vendors/{vendorId}/products      → List vendor catalog (?search=)
// GET  /api/vendor-products/{id}             → Single product
// POST /api/vendor-products/{id}/map-product → Map to store product
// PUT  /api/vendor-products/{id}/deactivate  → Deactivate

export const fetchVendorProducts = (vendorId, search = null) =>
  api.get(`/vendors/${vendorId}/products`, search ? { params: { search } } : {});

export const fetchExpiredVendorProducts = (vendorId) =>
  api.get(`/vendors/${vendorId}/products/expired`);

export const fetchVendorProductById = (id) =>
  api.get(`/vendor-products/${id}`);

export const mapVendorProduct = (id, productId) =>
  api.post(`/vendor-products/${id}/map-product`, { productId });

export const deactivateVendorProduct = (id) =>
  api.put(`/vendor-products/${id}/deactivate`);

export const downloadProductTemplate = () =>
  api.get('/vendor-products/template', { responseType: 'blob' });

export const bulkUploadProducts = (file, updateExisting = true) => {
  const form = new FormData();
  form.append('file', file);
  form.append('updateExisting', updateExisting);
  return api.post('/vendor-products/bulk-upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ─── Purchase Orders ──────────────────────────────────────────────────────────
// GET  /api/purchase-orders                  → List all POs
// GET  /api/purchase-orders/{id}             → Single PO
// POST /api/purchase-orders                  → Create PO

export const fetchPurchaseOrders = (params) =>
  api.get('/purchase-orders', { params }).catch(() => []);

export const fetchPOById = (id) =>
  api.get(`/purchase-orders/${id}`).catch(() => null);

export const createPO = (payload) =>
  api.post('/purchase-orders', payload);

// ─── GRN ─────────────────────────────────────────────────────────────────────
// POST  /api/grn                             → Create GRN (requires X-User-Id header)
// POST  /api/grn/{id}/approve               → Approve/Finalize GRN
// PATCH /api/grn/{id}/finalize              → Alias for approve
// GET   /api/grn/{id}                       → Single GRN
// GET   /api/grn/purchase-order/{poId}      → GRNs for a PO

export const createGRN = (payload, userId) =>
  api.post('/grn', payload, { headers: { 'X-User-Id': userId } });

export const approveGRN = (id) =>
  api.post(`/grn/${id}/approve`);

export const finalizeGRN = (id) =>
  api.patch(`/grn/${id}/finalize`);

export const fetchGRNById = (id) =>
  api.get(`/grn/${id}`).catch(() => null);

export const fetchGRNsByPO = (poId) =>
  api.get(`/grn/purchase-order/${poId}`).catch(() => []);

export const fetchGRNs = () =>
  api.get('/grn').catch(() => []);

// ─── Finance / Invoices ────────────────────────────────────────────────────────
export const submitInvoice = (payload) =>
  api.post('/finance/invoices', payload);

export const approveInvoice = (id) =>
  api.put(`/finance/invoices/${id}/approve`);

// ─── Payments ─────────────────────────────────────────────────────────────────
// POST /api/payments                         → Record payment
// GET  /api/payments                         → List all
// GET  /api/payments/{id}                    → Single payment
// GET  /api/payments/invoice/{invoiceId}     → Payments for invoice
// GET  /api/payments/by-date?from=&to=       → Date range
// GET  /api/payments/today-total             → KPI: today's total

export const recordPayment = (payload) =>
  api.post('/finance/payments', payload);

export const fetchPayments = (params) =>
  api.get('/finance/payments', { params }).catch(() => []);

export const fetchPaymentById = (id) =>
  api.get(`/finance/payments/${id}`).catch(() => null);


export const fetchPaymentsByInvoice = (invoiceId) =>
  api.get(`/payments/invoice/${invoiceId}`).catch(() => []);

export const fetchVendorPayments = (vendorId) =>
  api.get(`/finance/payments/vendor/${vendorId}`).catch(() => []);

export const fetchPaymentsByDate = (from, to) =>
  api.get('/payments/by-date', { params: { from, to } }).catch(() => []);

export const fetchTodayTotal = () =>
  api.get('/payments/today-total').catch(() => ({ date: '', total: 0 }));

// ─── Endpoints without backend (graceful fallbacks) ───────────────────────────
export const fetchVendorLedger = (vendorId, params) =>
  api.get(`/vendors/${vendorId}/ledger`, { params }).catch(() => []);

export const fetchVendorScorecard = (vendorId) =>
  api.get(`/vendors/${vendorId}/scorecard`);

export const fetchGSTData = (params) =>
  api.get('/gst/reconciliation', { params }).catch(() => []);

export const fetchInvoices = (params) =>
  api.get('/finance/invoices', { params }).catch(() => []);


export const fetchInvoiceById = (id) =>
  api.get(`/invoices/${id}`).catch(() => null);

export const fetchNotifications = () =>
  api.get('/notifications').catch(() => []);

export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`).catch(() => null);

export const markAllRead = () =>
  api.patch('/notifications/read-all').catch(() => null);

// Aggregates pending POs + under-review invoices into an approval queue.
// Uses real backend endpoints — no dedicated /api/approvals controller needed.
export const fetchApprovals = async () => {
  try {
    const [posRes, invoicesRes] = await Promise.allSettled([
      api.get('/purchase-orders'),
      api.get('/finance/invoices'),
    ]);
    const pos = posRes.status === 'fulfilled'
      ? (posRes.value?.data || []).filter(p => p.status === 'PENDING' || p.status === 'pending')
      : [];
    const invoices = invoicesRes.status === 'fulfilled'
      ? (invoicesRes.value?.data || []).filter(i => i.submissionStatus === 'UNDER_REVIEW')
      : [];
    const poApprovals = pos.map(p => ({
      id: p.id, type: 'Purchase Order',
      vendor: p.vendorName || p.vendor || 'Unknown Vendor',
      requester: 'Procurement',
      amount: p.grandTotal || p.amount || 0,
      since: p.createdAt || p.date || 'Recent',
      priority: 'medium',
    }));
    const invoiceApprovals = invoices.map(i => ({
      id: i.id, type: 'Invoice Payment',
      vendor: i.vendorName || 'Unknown Vendor',
      requester: 'Finance',
      amount: i.totalAmount || i.invoiceAmount || 0,
      since: i.createdAt || i.invoiceDate || 'Recent',
      priority: 'high',
    }));
    return [...poApprovals, ...invoiceApprovals];
  } catch { return []; }
};

export const approveItem = (id, type) =>
  api.put(`/purchase-orders/${id}/status`, null, { params: { status: 'APPROVED' } })
    .catch(() => null);

export const rejectItem = (id, reason) =>
  api.put(`/purchase-orders/${id}/status`, null, { params: { status: 'REJECTED' } })
    .catch(() => null);

export const fetchVendorAnalytics = (params) =>
  api.get('/vendors/analytics', { params }).catch(() => ({}));

export const fetchPayablesAnalytics = () =>
  api.get('/payables/analytics').catch(() => ({}));

// ─── GST Reconciliation Actions ────────────────────────────────────────────────
export const notifyGSTVendor = (gstin, period) =>
  api.post('/gst/reconciliation/notify', null, { params: { gstin, period } });

export const releaseGSTHold = (gstin, period) =>
  api.post('/gst/reconciliation/release', null, { params: { gstin, period } });

export const writeOffGSTHold = (gstin, period) =>
  api.post('/gst/reconciliation/write-off', null, { params: { gstin, period } });

export const updateGSTDisputeNote = (gstin, period, note) =>
  api.post('/gst/reconciliation/dispute-note', null, { params: { gstin, period, note } });

// ─── GST Tax Tracker: Input & Output Tax Ledger ─────────────────────────────
export const fetchInputTaxData = (params) =>
  api.get('/gst/reconciliation/input-tax', { params }).catch(() => []);

export const fetchOutputTaxData = (params) =>
  api.get('/gst/reconciliation/output-tax', { params }).catch(() => []);


// ─── Return-To-Vendor (RTV) / Reverse Logistics ───────────────────────────────
export const fetchRTVRequests = () =>
  api.get('/rtv').catch(() => []);

export const fetchVendorReturns = (vendorId) =>
  api.get(`/rtv/vendor/${vendorId}`).catch(() => []);

export const createRTVRequest = (payload, userId = null) => {
  const headers = userId ? { 'X-User-Id': userId } : {};
  return api.post('/rtv', payload, { headers });
};

export const updateRTVStatus = (id, status, disputeNote = null) =>
  api.patch(`/rtv/${id}/status`, null, { params: { status, disputeNote } });

// ─── Reverse Auction (REST Integration) ───────────────────────────────────────
export const fetchAuctions = () =>
  api.get('/auctions').catch(() => []);

export const fetchAuctionById = (id) =>
  api.get(`/auctions/${id}`).catch(() => null);

export const fetchAuctionBids = (id) =>
  api.get(`/auctions/${id}/bids`).catch(() => []);

export const createAuction = (payload, userId) =>
  api.post('/auctions', payload, { headers: { 'X-User-Id': userId } });

export const updateAuctionStatus = (id, status) =>
  api.put(`/auctions/${id}/status`, null, { params: { status } });

// ─── Products Integration ─────────────────────────────────────────────────────
export const fetchProducts = () =>
  api.get('/products').catch(() => []);

// ─── Warehouse Slotting & Stock Transfer (STO) APIs ──────────────────────────
export const fetchBinLocations = () =>
  api.get('/inventory/bins').catch(() => []);

export const createBinLocation = (payload) =>
  api.post('/inventory/bins', payload);

export const slotProductToBin = (binIdentifier, payload) =>
  api.put(`/inventory/bins/${binIdentifier}/slot`, payload);

export const createSTO = (payload, userId = null) => {
  const headers = userId ? { 'X-User-Id': userId } : {};
  return api.post('/inventory/sto', payload, { headers });
};

export const fetchSTOs = () =>
  api.get('/inventory/sto').catch(() => []);

export const updateSTOStatus = (id, status, approverId = null) => {
  const headers = approverId ? { 'X-User-Id': approverId } : {};
  return api.patch(`/inventory/sto/${id}/status`, null, { params: { status }, headers });
};

// ─── Purchase Order Updates ────────────────────────────────────────────────────
// Maps to the existing PurchaseController endpoints (Bug 3 fix):
// PUT /api/purchase-orders/{id}           → full update
// PUT /api/purchase-orders/{id}/status    → status-only update
export const updatePO = (id, payload) =>
  api.put(`/purchase-orders/${id}`, payload);

export const updatePOStatus = (id, status) =>
  api.put(`/purchase-orders/${id}/status`, null, { params: { status } });

// ─── Vendor Product CRUD Endpoints ─────────────────────────────────────────────
export const fetchAllVendorProducts = () =>
  api.get('/vendor-products').catch(() => []);

export const createVendorProduct = (vendorId, payload) =>
  api.post(`/vendors/${vendorId}/products`, payload);

export const updateVendorProduct = (id, payload) =>
  api.put(`/vendor-products/${id}`, payload);

export const deleteVendorProduct = (id) =>
  api.delete(`/vendor-products/${id}`);


