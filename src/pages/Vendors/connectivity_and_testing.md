# Vendor Management UI - Connectivity & Testing Documentation

This document outlines the connectivity architecture, data flow, and testing procedures for the newly implemented Vendor Management modules.

## 1. Module Overview
The system is divided into four primary functional areas:
- **1.1 Vendor Master Dashboard**: Centralized management of all vendors with enterprise-scale filtering.
- **1.2 Vendor Profile Screen**: Detailed view with basic info, banking, and performance metrics.
- **1.3 Multi-Level Digital Onboarding**: Internal approval workflow with 4-stage verification.
- **1.4 Statutory Document Vault**: Intelligent document management with expiry tracking and blocking logic.

## 2. Connectivity & Data Flow

### 2.1 Component Mapping
- `VendorList.jsx` → Maps to route `/vendors/list`
- `VendorDetail.jsx` → Maps to route `/vendors/detail/:id`
- `VendorOnboarding.jsx` → Maps to route `/vendors/onboarding`
- `vendorConstants.js` → Centralized store for Mock Data and Status Logic.

### 2.2 Navigation Logic
| From | Action | To |
| :--- | :--- | :--- |
| Dashboard | Click "Onboard New Vendor" | Onboarding Workflow |
| Dashboard | Click "View Profile" (👁️) | Vendor Profile Screen |
| Dashboard | Click "Download Documents" | Statutory Vault (Profile Tab) |
| Profile | Click Tab "Statutory Vault" | Document Management Panel |

### 2.3 Data Schema Updates
The vendor object has been expanded to include:
- `contactPersons`: Array of objects (Name, Role, Contact)
- `factoryLocations` & `shippingPoints`: Arrays of strings
- `bankAccounts`: Array of objects (Bank, Acc No, IFSC, Primary Flag)
- `documents`: Array of objects (Type, Expiry, Status, Preview URL)
- `auditLog`: Array of action timestamps.

## 3. Testing Procedures

### 3.1 Unit Testing Scenarios
1. **Status Badge Rendering**: Verify that `blocked` status renders with red theme and `expiring_soon` with amber.
2. **Sort Logic**: Ensure sorting by "Vendor ID" and "Last Updated" works correctly in the Dashboard grid.
3. **Pagination**: Verify that changing "Rows per page" to 50/100/200 correctly recalculates the item count.

### 3.2 Workflow Testing
1. **Onboarding Approval**: 
   - Navigate to `/vendors/onboarding`.
   - Click "Approve & Move Next Stage".
   - Verify step indicator updates to "Quality Dept" and progress bar increments.
2. **Rejection Flow**:
   - Click "Reject / Send Back" in Onboarding.
   - Verify "Rejection Reason" modal appears with mandatory dropdown.
   - Confirm rejection redirects back to the Registry.

### 3.3 Statutory Vault Testing
1. **Expiry Alert**: Select a vendor with expired documents (e.g., Sunrise Foods). Verify the Red Banner appears: "Critical: POs and Payments are BLOCKED".
2. **Document Preview**: Click on a document card. Verify the modal opens with the correct image preview and audit note.
3. **Reminder Logic**: Click "Remind Vendor". Verify the toast notification triggers "Reminder sent!".

## 4. Environment Requirements
- **Frontend**: React 18+ with TailwindCSS.
- **Animations**: Framer Motion.
- **Icons**: Emoji-based (Standard Unicode).
- **Fonts**: Inter (Google Fonts).

---
*Created by Antigravity AI Assistant*
