import * as XLSX from 'xlsx';
import fs from 'fs';

const data = [
  {
    "legalName": "Acme Corp",
    "tradeName": "Acme",
    "businessType": "MANUFACTURER",
    "panNumber": "ABCDE1234F",
    "gstRegistrationType": "REGULAR",
    "gstin": "27ABCDE1234F1Z5",
    "primaryMobile": "9876543210",
    "primaryEmail": "contact@acme.com",
    "website": "www.acme.com",
    "annualTurnoverRange": "100-500",
    "notes": "Premium vendor",
    "authRequired": "true"
  },
  {
    "legalName": "Globex Inc",
    "tradeName": "Globex",
    "businessType": "DISTRIBUTOR",
    "panNumber": "FGHIJ5678K",
    "gstRegistrationType": "COMPOSITION",
    "gstin": "27FGHIJ5678K1Z5",
    "primaryMobile": "9876543211",
    "primaryEmail": "info@globex.com",
    "website": "www.globex.com",
    "annualTurnoverRange": "0-100",
    "notes": "Standard vendor",
    "authRequired": "false"
  }
];

// Create an Excel file where columns map exactly to DTO fields
const wsCamel = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, wsCamel, "CamelCaseFields");

// Create another sheet with Title Case fields in case the backend uses @ExcelProperty with Title Case
const titleData = data.map(item => ({
    "Legal Name": item.legalName,
    "Trade Name": item.tradeName,
    "Business Type": item.businessType,
    "PAN Number": item.panNumber,
    "GST Registration Type": item.gstRegistrationType,
    "GSTIN": item.gstin,
    "Primary Mobile": item.primaryMobile,
    "Primary Email": item.primaryEmail,
    "Website": item.website,
    "Annual Turnover Range": item.annualTurnoverRange,
    "Notes": item.notes,
    "Auth Required": item.authRequired
}));
const wsTitle = XLSX.utils.json_to_sheet(titleData);
XLSX.utils.book_append_sheet(wb, wsTitle, "TitleCaseFields");

XLSX.writeFile(wb, "sample_vendor_data.xlsx");
console.log("sample_vendor_data.xlsx generated successfully.");
