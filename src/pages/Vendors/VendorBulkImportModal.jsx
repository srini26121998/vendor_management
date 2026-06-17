import React, { useState } from 'react';
import { Download, UploadCloud, X, Loader2, FileSpreadsheet, CheckCircle, AlertCircle, AlertTriangle, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { downloadVendorTemplate, uploadVendorBulk, downloadProductTemplate, bulkUploadProducts } from '../../api/vendorService';
import useVendorStore from '../../store/useVendorStore';
import VendorBulkImportErrorModal from './VendorBulkImportErrorModal';

const VendorBulkImportModal = ({ isOpen, onClose, onSuccess, importType = 'vendor' }) => {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [updateExisting, setUpdateExisting] = useState(true);

  const { vendors } = useVendorStore();
  const [fileForUpload, setFileForUpload] = useState(null);
  const [duplicates, setDuplicates] = useState([]);
  const [parsedData, setParsedData] = useState(null);
  const [showDuplicatePopup, setShowDuplicatePopup] = useState(false);

  if (!isOpen) return null;

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const blob = importType === 'product' 
        ? await downloadProductTemplate() 
        : await downloadVendorTemplate();
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', importType === 'product' ? 'product_master_template.xlsx' : 'vendor_master_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Template downloaded successfully');
    } catch (error) {
      console.error('Failed to download template:', error);
      toast.error('Failed to download template');
    } finally {
      setIsDownloading(false);
    }
  };

  const processFile = (selectedFile) => {
    if (!selectedFile.name.match(/\.(xlsx|xls)$/)) {
      toast.error('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds 10MB limit');
      return;
    }
    setFile(selectedFile);
    setFileForUpload(selectedFile);
    setUploadResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        setParsedData({ data: jsonData, sheetName: firstSheetName, workbook });
        
        if (importType === 'vendor') {
          const duplicateList = [];
          jsonData.forEach((row, index) => {
            const vCode = row['vendorCode'] || row['Vendor Code'];
            const vEmail = row['email'] || row['Email'];
            const vPhone = row['phone'] || row['Phone'];
            
            let dupDetails = [];
            const existing = vendors.find(v => {
              let isDup = false;
              if (vCode && v.vendorCode === vCode) { dupDetails.push(`Code: ${vCode}`); isDup = true; }
              if (vEmail && v.email === vEmail) { dupDetails.push(`Email: ${vEmail}`); isDup = true; }
              if (vPhone && v.phone === vPhone) { dupDetails.push(`Phone: ${vPhone}`); isDup = true; }
              return isDup;
            });
            
            if (existing) {
              duplicateList.push({
                rowNumber: index + 2,
                details: dupDetails.join(', '),
                rowData: row
              });
            }
          });
          
          if (duplicateList.length > 0) {
            setDuplicates(duplicateList);
            setShowDuplicatePopup(true);
          }
        }
      } catch (err) {
        console.error('Error parsing excel:', err);
        toast.error('Failed to parse excel file for duplicates');
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleKeepDuplicates = () => {
    setShowDuplicatePopup(false);
  };

  const handleRemoveDuplicates = () => {
    try {
      const dupRows = new Set(duplicates.map(d => d.rowData));
      const newData = parsedData.data.filter(row => !dupRows.has(row));
      
      const newWs = XLSX.utils.json_to_sheet(newData);
      const newWb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(newWb, newWs, parsedData.sheetName || 'Sheet1');
      
      const wbout = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], { type: 'application/octet-stream' });
      const newFile = new File([blob], file.name.replace(/\.xlsx$/, '_filtered.xlsx'), { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      setFileForUpload(newFile);
      setFile(newFile); // update display file
      setShowDuplicatePopup(false);
      toast.success(`Removed ${duplicates.length} duplicate rows.`);
    } catch(err) {
      console.error('Error filtering duplicates:', err);
      toast.error('Failed to remove duplicates');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleUpload = async () => {
    if (!fileForUpload) {
      toast.error('Please select a file first');
      return;
    }

    try {
      setIsUploading(true);
      
      const response = importType === 'product'
        ? await bulkUploadProducts(fileForUpload, updateExisting)
        : await uploadVendorBulk(fileForUpload, updateExisting);
      
      // Axios interceptor already returns response.data
      const result = response.data || response;
      setUploadResult(result);
      
      if (result.status === 'SUCCESS') {
        toast.success(`Successfully processed ${result.successCount} vendors/products!`);
        if (onSuccess) await onSuccess();
      } else if (result.status === 'PARTIAL') {
        toast.success(`Partially successful. ${result.failedCount} records failed.`);
        if (onSuccess) await onSuccess();
      } else {
        toast.error(`Upload failed. Please check the errors.`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      // Backend may return 422 Unprocessable Entity with error list
      if (error.response?.data?.errors) {
        setUploadResult(error.response.data);
      } else {
        toast.error(error.response?.data?.message || 'Failed to upload file');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setFileForUpload(null);
    setUploadResult(null);
    setDuplicates([]);
    setParsedData(null);
    setShowDuplicatePopup(false);
    onClose();
  };

  const hasErrors = uploadResult && (uploadResult.failedCount > 0 || (uploadResult.errors && uploadResult.errors.length > 0) || uploadResult.status === 'FAILED' || uploadResult.status === 'PARTIAL');

  if (hasErrors) {
    return (
      <VendorBulkImportErrorModal 
        isOpen={true} 
        onClose={handleClose} 
        result={uploadResult} 
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-800">
            {importType === 'product' ? 'Product Bulk Import' : 'Vendor Bulk Import'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {/* Step 1: Template */}
          <div className="mb-8">
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
              Download Template
            </h3>
            <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  Download the unified Excel template for {importType === 'product' ? 'Products' : 'Vendors & Products'}.
                </p>
                <p className="text-xs text-gray-500 mt-1">Contains all required columns and format rules.</p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors disabled:opacity-50 shadow-sm"
              >
                {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Download
              </button>
            </div>
          </div>

          {/* Step 2: Upload */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">2</span>
              Upload Data
            </h3>
            
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                file ? 'border-blue-300 bg-blue-50/30' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="file"
                id="file-upload"
                className="hidden"
                accept=".xlsx, .xls"
                onChange={handleFileChange}
              />
              
              {!file ? (
                <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-3">
                    <UploadCloud className="w-6 h-6 text-blue-500" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-gray-500 mt-1">Excel files only (.xlsx, .xls)</span>
                </label>
              ) : (
                <div className="flex flex-col items-center">
                  <FileSpreadsheet className="w-10 h-10 text-green-500 mb-2" />
                  <span className="text-sm font-medium text-gray-800">{file.name}</span>
                  <span className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <button
                    onClick={() => {
                      setFile(null);
                      setUploadResult(null);
                    }}
                    className="mt-4 text-xs font-medium text-red-500 hover:text-red-600"
                  >
                    Remove file
                  </button>
                </div>
              )}
            </div>

            {/* Checkbox for updating existing records */}
            {file && (
              <div className="mt-4 flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <input
                  type="checkbox"
                  id="updateExisting"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex flex-col">
                  <label htmlFor="updateExisting" className="text-sm font-medium text-gray-800 cursor-pointer">
                    Update existing records
                  </label>
                  <span className="text-xs text-gray-500">
                    If unchecked, duplicate GSTIN or SKUs will be skipped with an error instead of being updated.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Results Area */}
          {uploadResult && (
            <div className={`mt-6 rounded-2xl p-5 border shadow-sm ${
              uploadResult.status === 'SUCCESS' ? 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200' :
              uploadResult.status === 'PARTIAL' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-yellow-200' :
              'bg-gradient-to-br from-red-50 to-red-100/50 border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-4">
                {uploadResult.status === 'SUCCESS' ? (
                  <CheckCircle className="w-6 h-6 text-green-600 drop-shadow-sm" />
                ) : (
                  <AlertCircle className={`w-6 h-6 drop-shadow-sm ${uploadResult.status === 'PARTIAL' ? 'text-yellow-600' : 'text-red-600'}`} />
                )}
                <h4 className={`text-lg font-bold tracking-tight ${
                  uploadResult.status === 'SUCCESS' ? 'text-green-800' :
                  uploadResult.status === 'PARTIAL' ? 'text-yellow-800' :
                  'text-red-800'
                }`}>
                  Import {uploadResult.status === 'SUCCESS' ? 'Completed Successfully' : uploadResult.status === 'PARTIAL' ? 'Completed Partially' : 'Failed'}
                </h4>
              </div>

              {/* File Info */}
              <div className="mb-5 flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-xl p-3.5 border border-white/60 shadow-sm">
                <div className="flex items-center gap-3.5">
                  <div className="p-2 bg-green-100/50 rounded-lg">
                    <FileSpreadsheet className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800 line-clamp-1">{uploadResult.fileName || file?.name || 'Uploaded File'}</p>
                    <p className="text-xs font-medium text-gray-500 mt-0.5">Processed on {new Date(uploadResult.processedAt || Date.now()).toLocaleString()}</p>
                  </div>
                </div>
                <div className="hidden sm:block text-right px-3 py-1.5 rounded-lg bg-white shadow-sm border border-gray-100">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Final Status</p>
                   <p className={`text-xs font-bold ${uploadResult.status === 'SUCCESS' ? 'text-green-600' : uploadResult.status === 'PARTIAL' ? 'text-yellow-600' : 'text-red-600'}`}>{uploadResult.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="text-[11px] text-gray-500 uppercase font-bold tracking-wider mb-1">Total Rows</div>
                  <div className="text-2xl font-black text-gray-800">{uploadResult.totalRows || 0}</div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-green-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="text-[11px] text-green-600/80 uppercase font-bold tracking-wider mb-1">Success</div>
                  <div className="text-2xl font-black text-green-600">{uploadResult.successCount || 0}</div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-blue-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="text-[11px] text-blue-600/80 uppercase font-bold tracking-wider mb-1">Updated</div>
                  <div className="text-2xl font-black text-blue-600">{uploadResult.updatedCount || 0}</div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-yellow-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="text-[11px] text-yellow-600/80 uppercase font-bold tracking-wider mb-1">Skipped</div>
                  <div className="text-2xl font-black text-yellow-600">{uploadResult.skippedCount || 0}</div>
                </div>
                <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl border border-red-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <div className="text-[11px] text-red-600/80 uppercase font-bold tracking-wider mb-1">Failed</div>
                  <div className="text-2xl font-black text-red-600">{uploadResult.failedCount || 0}</div>
                </div>
              </div>

              {uploadResult.errors && uploadResult.errors.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-bold text-red-800">Error Log</p>
                  </div>
                  <div className="bg-white/80 backdrop-blur-sm border border-red-100 rounded-xl p-4 max-h-48 overflow-y-auto shadow-inner">
                    <ul className="text-sm text-red-700 space-y-2">
                      {uploadResult.errors.map((err, idx) => (
                        <li key={idx} className="flex gap-2 items-start">
                          <span className="shrink-0 mt-1 w-1.5 h-1.5 rounded-full bg-red-400"></span>
                          <span className="leading-tight">{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 rounded-b-2xl sticky bottom-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-gray-200 focus:outline-none"
          >
            {uploadResult?.status === 'SUCCESS' ? 'Close' : 'Cancel'}
          </button>
          
          <button
            onClick={handleUpload}
            disabled={!fileForUpload || isUploading || uploadResult?.status === 'SUCCESS'}
            className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4" />
                Import Data
              </>
            )}
          </button>
        </div>

        {/* Duplicate Popup */}
        {showDuplicatePopup && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/90 backdrop-blur-sm rounded-2xl">
            <div className="bg-white rounded-xl shadow-2xl border border-yellow-200 w-full max-w-lg flex flex-col max-h-[80vh]">
              <div className="p-4 border-b border-yellow-100 bg-yellow-50/50 flex items-center gap-3 rounded-t-xl shrink-0">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-yellow-800">Duplicate Data Detected</h3>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                <p className="text-sm text-gray-600 mb-4">
                  We found <span className="font-semibold text-gray-800">{duplicates.length}</span> row(s) in your excel file that already exist in the system.
                </p>
                <div className="space-y-2">
                  {duplicates.map((dup, idx) => (
                    <div key={idx} className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm">
                      <div className="font-medium text-gray-700">Row {dup.rowNumber}</div>
                      <div className="text-gray-500 text-xs mt-1">Matched on: {dup.details}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-gray-50 rounded-b-xl shrink-0">
                <button
                  onClick={handleKeepDuplicates}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Keep All (Ignore)
                </button>
                <button
                  onClick={handleRemoveDuplicates}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Duplicates
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorBulkImportModal;
