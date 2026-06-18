import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import MainLayout from './components/Layout/MainLayout';
import TruckLoader from './components/Common/TruckLoader';
import useLoadingStore from './store/useLoadingStore';

import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import ProtectedRoute from './components/Auth/ProtectedRoute';

// ── Vendor Management Module (lazy-loaded) ──────────────────────────────────
const VendorDashboard = lazy(() => import('./pages/Vendors/VendorDashboard'));
const VendorList = lazy(() => import('./pages/Vendors/VendorList'));
const VendorProducts = lazy(() => import('./pages/Vendors/VendorProducts'));
const VendorDetail = lazy(() => import('./pages/Vendors/VendorDetail'));
const VendorOnboarding = lazy(() => import('./pages/Vendors/VendorOnboarding'));
const VendorOnboardingWorkflow = lazy(() => import('./pages/Vendors/VendorOnboardingWorkflow'));
const PurchaseOrderList = lazy(() => import('./pages/Vendors/PurchaseOrderList'));
const CreateEditPO = lazy(() => import('./pages/Vendors/CreateEditPO'));
const PODetail = lazy(() => import('./pages/Vendors/PODetail'));
const GRNEntry = lazy(() => import('./pages/Vendors/GRNEntry'));
const GRNList = lazy(() => import('./pages/Vendors/GRNList'));
const GRNDetail = lazy(() => import('./pages/Vendors/GRNDetail'));
const OCRInvoiceDigitizer = lazy(() => import('./pages/Vendors/OCRInvoiceDigitizer'));
const CreateEditInvoice = lazy(() => import('./pages/Vendors/CreateEditInvoice'));
const PurchaseInvoice = lazy(() => import('./pages/Vendors/PurchaseInvoice'));
const PayablesDashboard = lazy(() => import('./pages/Vendors/PayablesDashboard'));
const PaymentProcessing = lazy(() => import('./pages/Vendors/PaymentProcessing'));
const VendorLedger = lazy(() => import('./pages/Vendors/VendorLedger'));
const GSTReconciliation = lazy(() => import('./pages/Vendors/GSTReconciliation'));
const VendorScorecard = lazy(() => import('./pages/Vendors/VendorScorecard'));
const VendorReportsHub = lazy(() => import('./pages/Vendors/VendorReportsHub'));
const AIInsightsPanel = lazy(() => import('./pages/Vendors/AIInsightsPanel'));
const VendorPortal = lazy(() => import('./pages/Vendors/VendorPortal'));
const MultiOutletView = lazy(() => import('./pages/Vendors/MultiOutletView'));
const StockTransfer = lazy(() => import('./pages/Vendors/StockTransfer'));
const FulfillmentTracker = lazy(() => import('./pages/Vendors/FulfillmentTracker'));
const AggregatorPayout = lazy(() => import('./pages/Vendors/AggregatorPayout'));
const WhatsAppComms = lazy(() => import('./pages/Vendors/WhatsAppComms'));
const MobileGRN = lazy(() => import('./pages/Vendors/MobileGRN'));
const VendorSettings = lazy(() => import('./pages/Vendors/VendorSettings'));
const NotificationCenter = lazy(() => import('./pages/Vendors/NotificationCenter'));
const ApprovalQueue = lazy(() => import('./pages/Vendors/ApprovalQueue'));

// ── Stock & Inventory Management ──
const WarehouseMap = lazy(() => import('./pages/StockManagement/WarehouseMap'));
const StockTransferAdvanced = lazy(() => import('./pages/StockManagement/StockTransferAdvanced'));
const CycleAudit = lazy(() => import('./pages/StockManagement/CycleAudit'));

// ── Procurement & Ordering ──
const SmartPOCreation = lazy(() => import('./pages/Procurement/SmartPOCreation'));
const DemandForecasting = lazy(() => import('./pages/Procurement/DemandForecasting'));
const ReverseAuction = lazy(() => import('./pages/Procurement/ReverseAuction'));
const InboundLogistics = lazy(() => import('./pages/Procurement/InboundLogistics'));
const RTVWorkflow = lazy(() => import('./pages/Procurement/RTVWorkflow'));
const PredictiveExpiry = lazy(() => import('./pages/StockManagement/PredictiveExpiry'));
const ExpiryDetails = lazy(() => import('./pages/StockManagement/ExpiryDetails'));
const ExpiryAnalytics = lazy(() => import('./pages/StockManagement/ExpiryAnalytics'));

const VFallback = (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
    <TruckLoader message="Loading Vendor Module..." />
  </div>
);

function App() {
  const isLoading = useLoadingStore((state) => state.isLoading);

  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      {isLoading && <TruckLoader overlay={true} />}
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:tokenParam?" element={<ResetPassword />} />

        {/* Protected Vendor Routes */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/vendors/dashboard" replace />} />
          
          <Route path="vendors/dashboard" element={<Suspense fallback={VFallback}><VendorDashboard /></Suspense>} />
          <Route path="vendors/list" element={<Suspense fallback={VFallback}><VendorList /></Suspense>} />
          <Route path="vendors/products" element={<Suspense fallback={VFallback}><VendorProducts /></Suspense>} />
          <Route path="vendors/detail/:id?" element={<Suspense fallback={VFallback}><VendorDetail /></Suspense>} />
          <Route path="vendors/onboarding" element={<Suspense fallback={VFallback}><VendorOnboarding /></Suspense>} />
          <Route path="vendors/onboarding-workflow" element={<Suspense fallback={VFallback}><VendorOnboardingWorkflow /></Suspense>} />
          <Route path="vendors/purchase-orders" element={<Suspense fallback={VFallback}><PurchaseOrderList /></Suspense>} />
          <Route path="vendors/purchase-orders/create" element={<Suspense fallback={VFallback}><CreateEditPO /></Suspense>} />
          <Route path="vendors/purchase-orders/:id" element={<Suspense fallback={VFallback}><PODetail /></Suspense>} />
          <Route path="vendors/grn/entry" element={<Suspense fallback={VFallback}><GRNEntry /></Suspense>} />
          <Route path="vendors/grn/list" element={<Suspense fallback={VFallback}><GRNList /></Suspense>} />
          <Route path="vendors/grn/:id" element={<Suspense fallback={VFallback}><GRNDetail /></Suspense>} />
          <Route path="vendors/invoices/ocr" element={<Suspense fallback={VFallback}><OCRInvoiceDigitizer /></Suspense>} />
          <Route path="vendors/invoices/create" element={<Suspense fallback={VFallback}><CreateEditInvoice /></Suspense>} />
          <Route path="vendors/invoices" element={<Suspense fallback={VFallback}><PurchaseInvoice /></Suspense>} />
          <Route path="vendors/payables" element={<Suspense fallback={VFallback}><PayablesDashboard /></Suspense>} />
          <Route path="vendors/payments" element={<Suspense fallback={VFallback}><PaymentProcessing /></Suspense>} />
          <Route path="vendors/ledger" element={<Suspense fallback={VFallback}><VendorLedger /></Suspense>} />
          <Route path="vendors/gst-reconciliation" element={<Suspense fallback={VFallback}><GSTReconciliation /></Suspense>} />
          <Route path="vendors/scorecard" element={<Suspense fallback={VFallback}><VendorScorecard /></Suspense>} />
          <Route path="vendors/reports" element={<Suspense fallback={VFallback}><VendorReportsHub /></Suspense>} />
          <Route path="vendors/ai-insights" element={<Suspense fallback={VFallback}><AIInsightsPanel /></Suspense>} />
          <Route path="vendors/portal" element={<Suspense fallback={VFallback}><VendorPortal /></Suspense>} />
          <Route path="vendors/multi-outlet" element={<Suspense fallback={VFallback}><MultiOutletView /></Suspense>} />
          <Route path="vendors/stock-transfer" element={<Suspense fallback={VFallback}><StockTransfer /></Suspense>} />
          <Route path="vendors/fulfillment" element={<Suspense fallback={VFallback}><FulfillmentTracker /></Suspense>} />
          <Route path="vendors/aggregator-payout" element={<Suspense fallback={VFallback}><AggregatorPayout /></Suspense>} />
          <Route path="vendors/whatsapp" element={<Suspense fallback={VFallback}><WhatsAppComms /></Suspense>} />
          <Route path="vendors/mobile-grn" element={<Suspense fallback={VFallback}><MobileGRN /></Suspense>} />
          <Route path="vendors/settings" element={<Suspense fallback={VFallback}><VendorSettings /></Suspense>} />
          <Route path="vendors/notifications" element={<Suspense fallback={VFallback}><NotificationCenter /></Suspense>} />
          <Route path="vendors/approvals" element={<Suspense fallback={VFallback}><ApprovalQueue /></Suspense>} />

          {/* ── Procurement ── */}
          <Route path="vendors/procurement/smart-po" element={<Suspense fallback={VFallback}><SmartPOCreation /></Suspense>} />
          <Route path="vendors/procurement/forecasting" element={<Suspense fallback={VFallback}><DemandForecasting /></Suspense>} />
          <Route path="vendors/procurement/reverse-auction" element={<Suspense fallback={VFallback}><ReverseAuction /></Suspense>} />
          <Route path="vendors/procurement/inbound-logistics" element={<Suspense fallback={VFallback}><InboundLogistics /></Suspense>} />
          <Route path="vendors/procurement/rtv-workflow" element={<Suspense fallback={VFallback}><RTVWorkflow /></Suspense>} />

          {/* ── Stock & Inventory Management ── */}
          <Route path="vendors/inventory/warehouse-map" element={<Suspense fallback={VFallback}><WarehouseMap /></Suspense>} />
          <Route path="vendors/inventory/stock-transfer" element={<Suspense fallback={VFallback}><StockTransferAdvanced /></Suspense>} />
          <Route path="vendors/inventory/cycle-audit" element={<Suspense fallback={VFallback}><CycleAudit /></Suspense>} />
          <Route path="vendors/inventory/predictive-expiry" element={<Suspense fallback={VFallback}><PredictiveExpiry /></Suspense>} />
          <Route path="vendors/inventory/predictive-expiry/details/:id" element={<Suspense fallback={VFallback}><ExpiryDetails /></Suspense>} />
          <Route path="vendors/inventory/predictive-expiry/analytics/:id" element={<Suspense fallback={VFallback}><ExpiryAnalytics /></Suspense>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
