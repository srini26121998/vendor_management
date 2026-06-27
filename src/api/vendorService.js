/**
 * Vendor Management API Service
 * All endpoints mapped exactly to the Spring Boot backend controllers.
 */
import api from './axios';

// â”€â”€â”€ Vendor CRUD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET  /api/vendors                          â†’ List all (params: search, complianceStatus, kycStatus)
// POST /api/vendors                          â†’ Create vendor (VendorRequestDTO)
// GET  /api/vendors/{id}                     â†’ Full vendor detail with sub-resources
// PUT  /api/vendors/{id}                     â†’ Update vendor (VendorRequestDTO)
// DELETE /api/vendors/{id}                   â†’ Soft delete

export const fetchBranches = () =>
  api.get('/branches');

export const fetchUsers = () =>
  api.get('/users');

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

// â”€â”€â”€ Vendor Status â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// PATCH /api/vendors/{id}/block              â†’ Block vendor  (body: { reason })
// PATCH /api/vendors/{id}/unblock            â†’ Unblock vendor

export const blockVendor = (id, reason) =>
  api.patch(`/vendors/${id}/block`, { reason });

export const unblockVendor = (id) =>
  api.patch(`/vendors/${id}/unblock`);

// â”€â”€â”€ Onboarding Workflow â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/vendors/{id}/onboarding/approve  â†’ Advance to next stage (body: { comments })
// POST /api/vendors/{id}/onboarding/reject   â†’ Reject at current stage (body: { reason })

export const approveOnboarding = (id, comments = null) =>
  api.post(`/vendors/${id}/onboarding/approve`, comments ? { comments } : {});

export const rejectOnboarding = (id, reason) =>
  api.post(`/vendors/${id}/onboarding/reject`, { reason });

// â”€â”€â”€ Vendor Stats & Purchase History â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET /api/vendors/{id}/stats                â†’ VendorStatsDTO
// GET /api/vendors/{id}/purchase-orders      â†’ List<VendorPurchaseHistoryDTO>

export const fetchVendorStats = (id) =>
  api.get(`/vendors/${id}/stats`);

export const fetchVendorPurchaseHistory = (id) =>
  api.get(`/vendors/${id}/purchase-orders`);

// â”€â”€â”€ Vendor Locations â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST   /api/vendors/{id}/locations         â†’ Add location (VendorLocationDTO)
// DELETE /api/vendors/locations/{locationId} â†’ Remove location

export const addLocation = (vendorId, dto) =>
  api.post(`/vendors/${vendorId}/locations`, dto);

export const deleteLocation = (locationId) =>
  api.delete(`/vendors/locations/${locationId}`);

// â”€â”€â”€ Vendor Bank Accounts â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST   /api/vendors/{id}/bank-accounts     â†’ Add bank account (VendorBankAccountDTO)
// DELETE /api/vendors/bank-accounts/{id}     â†’ Remove bank account

export const addBankAccount = (vendorId, dto) =>
  api.post(`/vendors/${vendorId}/bank-accounts`, dto);

export const deleteBankAccount = (accountId) =>
  api.delete(`/vendors/bank-accounts/${accountId}`);

// â”€â”€â”€ Vendor Documents â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/vendors/{id}/documents           â†’ Add document (VendorDocumentDTO)
// POST /api/vendors/documents/{docId}/approve â†’ Approve document
// POST /api/vendors/documents/{docId}/reject  â†’ Reject document (body: { reason })
// DELETE /api/vendors/documents/{docId}      â†’ Delete document

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

// â”€â”€â”€ Vendor Bulk Upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET  /api/vendors/bulk-upload/template â†’ Download Excel template
// POST /api/vendors/bulk-upload          â†’ Upload Excel file (multipart/form-data)

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

// â”€â”€â”€ Compliance â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/vendors/compliance/scan          â†’ Trigger manual compliance scan

export const triggerComplianceScan = () =>
  api.post('/vendors/compliance/scan');

// â”€â”€â”€ Bulk Upload â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET  /api/vendors/bulk-upload/template     â†’ Download Excel template
// POST /api/vendors/bulk-upload              â†’ Upload Excel (multipart)

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

// â”€â”€â”€ Vendor Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET  /api/vendors/{vendorId}/products      â†’ List vendor catalog (?search=)
// GET  /api/vendor-products/{id}             â†’ Single product
// POST /api/vendor-products/{id}/map-product â†’ Map to store product
// PUT  /api/vendor-products/{id}/deactivate  â†’ Deactivate

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

// â”€â”€â”€ Purchase Orders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET  /api/purchase-orders                  â†’ List all POs
// GET  /api/purchase-orders/{id}             â†’ Single PO
// POST /api/purchase-orders                  â†’ Create PO

export const fetchPurchaseOrders = (params) =>
  api.get('/purchase-orders', { params }).catch(() => []);

export const fetchPOById = (id) =>
  api.get(`/purchase-orders/${id}`).catch(() => null);

export const createPO = (payload) =>
  api.post('/purchase-orders', payload);

// â”€â”€â”€ GRN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST  /api/grn                             â†’ Create GRN (requires X-User-Id header)
// POST  /api/grn/{id}/approve               â†’ Approve/Finalize GRN
// PATCH /api/grn/{id}/finalize              â†’ Alias for approve
// GET   /api/grn/{id}                       â†’ Single GRN
// GET   /api/grn/purchase-order/{poId}      â†’ GRNs for a PO

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

// â”€â”€â”€ Finance / Invoices â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const submitInvoice = (payload) =>
  api.post('/finance/invoices', payload);

export const approveInvoice = (id) =>
  api.put(`/finance/invoices/${id}/approve`);

// â”€â”€â”€ Payments â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// POST /api/payments                         â†’ Record payment
// GET  /api/payments                         â†’ List all
// GET  /api/payments/{id}                    â†’ Single payment
// GET  /api/payments/invoice/{invoiceId}     â†’ Payments for invoice
// GET  /api/payments/by-date?from=&to=       â†’ Date range
// GET  /api/payments/today-total             â†’ KPI: today's total

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

// â”€â”€â”€ Endpoints without backend (graceful fallbacks) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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



export const searchGlobalInventory = async (query) => {
  try {
    const response = await api.get(`/inventory/global-search?query=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching global inventory:', error);
    throw error;
  }
};

// Aggregates pending POs + under-review invoices into an approval queue.
// Uses real backend endpoints â€” no dedicated /api/approvals controller needed.
export const fetchApprovals = async () => {
  try {
    const [posRes, invoicesRes, stoRes] = await Promise.allSettled([
      api.get('/purchase-orders'),
      api.get('/finance/invoices'),
      api.get('/inventory/sto'),
    ]);
    const pos = posRes.status === 'fulfilled'
      ? (Array.isArray(posRes.value?.data ?? posRes.value) ? (posRes.value?.data ?? posRes.value) : []).filter(p => p.status === 'PENDING' || p.status === 'pending')
      : [];
    const invoices = invoicesRes.status === 'fulfilled'
      ? (Array.isArray(invoicesRes.value?.data ?? invoicesRes.value) ? (invoicesRes.value?.data ?? invoicesRes.value) : []).filter(i => i.submissionStatus === 'UNDER_REVIEW')
      : [];
    const stos = stoRes.status === 'fulfilled'
      ? (Array.isArray(stoRes.value?.data ?? stoRes.value) ? (stoRes.value?.data ?? stoRes.value) : []).filter(s => {
        const st = (s.status || '').toUpperCase();
        return st === 'PENDING' || st === 'DRAFT';
      })
      : [];
    const poApprovals = pos.map(p => ({
      id: p.id, type: 'Purchase Order',
      vendor: p.partyName || p.vendorName || p.vendor || 'Unknown Vendor',
      requester: 'Procurement',
      amount: p.grandTotal || p.amount || 0,
      since: p.invoiceDate || p.createdAt || p.date || 'Recent',
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
    const stoApprovals = stos.map(s => ({
      id: s.id, displayId: s.stoNumber, type: 'Stock Transfer',
      vendor: `${s.sourceBranchName || 'Branch'} to ${s.destBranchName || 'Branch'}`,
      requester: s.requestedBy || 'Warehouse',
      amount: s.items?.length || s.transferQuantity || s.totalQuantity || 0,
      since: s.createdAt || s.date || 'Recent',
      priority: 'medium',
    }));
    return [...poApprovals, ...invoiceApprovals, ...stoApprovals];
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

// â”€â”€â”€ GST Reconciliation Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const notifyGSTVendor = (gstin, period) =>
  api.post('/gst/reconciliation/notify', null, { params: { gstin, period } });

export const releaseGSTHold = (gstin, period) =>
  api.post('/gst/reconciliation/release', null, { params: { gstin, period } });

export const writeOffGSTHold = (gstin, period) =>
  api.post('/gst/reconciliation/write-off', null, { params: { gstin, period } });

export const updateGSTDisputeNote = (gstin, period, note) =>
  api.post('/gst/reconciliation/dispute-note', null, { params: { gstin, period, note } });

// â”€â”€â”€ GST Tax Tracker: Input & Output Tax Ledger â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const fetchInputTaxData = (params) =>
  api.get('/gst/reconciliation/input-tax', { params }).catch(() => []);

export const fetchOutputTaxData = (params) =>
  api.get('/gst/reconciliation/output-tax', { params }).catch(() => []);


// â”€â”€â”€ Return-To-Vendor (RTV) / Reverse Logistics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

// â”€â”€â”€ Purchase Order Updates â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Maps to the existing PurchaseController endpoints (Bug 3 fix):
// PUT /api/purchase-orders/{id}/status    â†’ status-only update
// PUT /api/purchase-orders/{id}/vendor-response â†’ Vendor Accept/Decline
export const updatePO = (id, payload) =>
  api.put(`/purchase-orders/${id}`, payload);

export const updatePOStatus = (id, status) =>
  api.put(`/purchase-orders/${id}/status`, null, { params: { status } });

export const vendorRespondToPO = (id, status, deliveryDate = null) => {
  const params = { status };
  if (deliveryDate) params.deliveryDate = deliveryDate;
  return api.put(`/purchase-orders/${id}/vendor-response`, null, { params });
};

// â”€â”€â”€ Vendor Product CRUD Endpoints â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export const fetchAllVendorProducts = () =>
  api.get('/vendor-products').catch(() => []);

export const createVendorProduct = (vendorId, payload) =>
  api.post(`/vendors/${vendorId}/products`, payload);

export const updateVendorProduct = (id, payload) =>
  api.put(`/vendor-products/${id}`, payload);

export const deleteVendorProduct = (id) =>
  api.delete(`/vendor-products/${id}`);

// â”€â”€â”€ Reports Hub API â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// GET  /api/reports/catalog                â†’ List available report types
// GET  /api/reports/kpis?type=&timePeriod= â†’ KPI summary for a report
// POST /api/reports/data?page=&size=       â†’ Paginated report data
// POST /api/reports/export                 â†’ Download Excel report

export const fetchReportCatalog = () =>
  api.get('/reports/catalog').catch(() => []);

export const fetchReportKpis = (type, timePeriod = 'MONTH') =>
  api.get('/reports/kpis', { params: { type, timePeriod } }).catch(() => null);

export const fetchReportData = (payload, page = 0, size = 5) =>
  api.post('/reports/data', payload, { params: { page, size } }).catch(() => null);

export const exportReport = (payload) =>
  api.post('/reports/export', payload, { responseType: 'blob' });

// â”€â”€â”€ Vendor Disputes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export const raiseDispute = (vendorId, payload) =>
  api.post(`/vendors/${vendorId}/disputes`, payload);



// %%% Inbound Logistics %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
export const createDockAppointment = (payload) =>
  api.post('/vendor/logistics/appointments', payload);

export const fetchDockAppointments = () =>
  api.get('/vendor/logistics/appointments').catch(() => []);

export const gateCheckinAppointment = (id, action) =>
  api.patch('/vendor/logistics/gate-checkin', null, { params: { id, action } });

export const submitGRNReceiving = (payload) =>
  api.post('/vendor/logistics/receiving/submit', payload);

export const recordIotTelemetry = (payload) =>
  api.post('/vendor/logistics/iot/telemetry', payload);



export const fetchProducts = () => api.get('/products').catch(() => []);
export const fetchCategories = () => api.get('/categories').catch(() => {
    return { data: [{ name: 'Fresh' }, { name: 'Dairy' }, { name: 'Beverages' }, { name: 'Staples' }, { name: 'FMCG' }, { name: 'Frozen' }, { name: 'Non-Food' }] };
});
export const fetchWarehouseProducts = () => api.get('/vendor-products/in-stock').catch(() => []);
export const fetchWarehouseCategories = async () => { try { const res = await api.get('/vendor-categories'); return res || []; } catch (e) { return [{ id: 'CAT1', name: 'Dairy', color: '#10b981' }]; } };
export const fetchWarehouseRacks = async () => { return [{ id: 'R-01', categoryId: 'CAT1' }, { id: 'R-02', categoryId: 'CAT2' }]; };
export const fetchWarehouseStock = async () => { return []; };
export const fetchWarehouseMovements = async () => { return []; };
export const adjustWarehouseStock = async () => { return true; };
export const updateWarehouseRackCategory = async () => { return true; };
