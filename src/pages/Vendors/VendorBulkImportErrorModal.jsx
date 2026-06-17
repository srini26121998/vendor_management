import React, { useState } from 'react';
import { X, AlertCircle, FileSpreadsheet, CheckCircle2, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';

const VendorBulkImportErrorModal = ({ isOpen, onClose, result }) => {
  const [activeTab, setActiveTab] = useState('summary');

  if (!isOpen || !result) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] relative animate-in zoom-in-95 duration-200">
        
        {/* Header section with gradient background */}
        <div className="bg-gradient-to-r from-red-600 to-rose-500 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Bulk Import Exceptions</h2>
              <p className="text-white/80 text-sm font-medium mt-0.5">Please review the errors below before trying again.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center bg-black/10 hover:bg-black/20 text-white rounded-full transition-colors focus:outline-none shadow-none border-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-white" strokeWidth={2.5} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 shrink-0">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3.5 px-5 text-[14px] font-bold border-b-[3px] transition-colors flex items-center gap-2 ${
              activeTab === 'summary' 
                ? 'border-rose-500 text-rose-700 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <FileSpreadsheet className={`w-4.5 h-4.5 ${activeTab === 'summary' ? 'text-rose-500' : 'text-slate-400'}`} />
            File Summary
          </button>
          <button
            onClick={() => setActiveTab('errors')}
            className={`py-3.5 px-5 text-[14px] font-bold border-b-[3px] transition-colors flex items-center gap-2 ${
              activeTab === 'errors' 
                ? 'border-rose-500 text-rose-700 bg-white' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <AlertCircle className={`w-4.5 h-4.5 ${activeTab === 'errors' ? 'text-rose-500' : 'text-slate-400'}`} />
            Error Logs
            {result.errors && result.errors.length > 0 && (
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] ${
                activeTab === 'errors' ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'
              }`}>
                {result.errors.length}
              </span>
            )}
          </button>
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto bg-slate-50 flex-1 min-h-[300px]">
          
          {activeTab === 'summary' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* File Info Card */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center border border-rose-100">
                    <FileSpreadsheet className="w-6 h-6 text-rose-500" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-[15px]">{result.fileName || 'Uploaded File'}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">
                      Processed on {new Date(result.processedAt || Date.now()).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-700 text-xs font-bold uppercase tracking-wider">
                    <XCircle className="w-3.5 h-3.5" />
                    {result.status || 'FAILED'}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Rows</span>
                  <span className="text-2xl font-black text-slate-700">{result.totalRows || 0}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-emerald-100/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 relative z-10">Success</span>
                  <span className="text-2xl font-black text-emerald-600 relative z-10">{result.successCount || 0}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-blue-100 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1 relative z-10">Updated</span>
                  <span className="text-2xl font-black text-blue-600 relative z-10">{result.updatedCount || 0}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100 flex flex-col items-center justify-center text-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-amber-50 to-amber-100/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1 relative z-10">Skipped</span>
                  <span className="text-2xl font-black text-amber-600 relative z-10">{result.skippedCount || 0}</span>
                </div>
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-rose-200 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-rose-100/50">
                  <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-rose-100/50"></div>
                  <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1 relative z-10">Failed</span>
                  <span className="text-2xl font-black text-rose-600 relative z-10">{result.failedCount || 0}</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'errors' && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Error List */}
              {result.errors && result.errors.length > 0 ? (
                <div className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden flex flex-col">
                  <div className="bg-rose-50/50 px-5 py-3 border-b border-rose-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-rose-500" />
                      <h3 className="font-bold text-rose-800 text-[14px]">Detailed Error Log</h3>
                    </div>
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                      {result.errors.length} Issues Found
                    </span>
                  </div>
                  <div className="p-2 max-h-[350px] overflow-y-auto">
                    <ul className="space-y-1.5 p-2">
                      {result.errors.map((err, idx) => {
                        // Try to extract Row number if the error string starts with "Row X:"
                        const rowMatch = err.match(/^Row (\d+):/);
                        const rowNum = rowMatch ? rowMatch[1] : null;
                        const errText = rowMatch ? err.replace(/^Row \d+:\s*/, '') : err;

                        return (
                          <li key={idx} className="flex items-start gap-3 p-3 rounded-xl hover:bg-rose-50/50 transition-colors border border-transparent hover:border-rose-100 group">
                            {rowNum ? (
                              <div className="shrink-0 w-12 h-12 rounded-lg bg-rose-100/50 border border-rose-100 flex flex-col items-center justify-center text-rose-700">
                                <span className="text-[9px] font-bold uppercase tracking-wider opacity-70">Row</span>
                                <span className="font-black text-[15px] leading-none">{rowNum}</span>
                              </div>
                            ) : (
                              <div className="shrink-0 mt-1 w-2 h-2 rounded-full bg-rose-400 group-hover:scale-125 transition-transform" />
                            )}
                            <div className={`text-[13px] font-medium text-slate-700 leading-relaxed ${rowNum ? 'pt-1.5' : ''}`}>
                              {errText}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="text-slate-800 font-bold text-lg mb-1">No Errors Found</h3>
                  <p className="text-slate-500 text-sm">All rows were processed successfully without any data issues.</p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-white border-t border-slate-100 px-6 py-4 flex items-center justify-between shrink-0 rounded-b-3xl">
          <p className="text-xs font-medium text-slate-500">
            Please fix these errors in your spreadsheet and re-upload.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors focus:ring-4 focus:ring-slate-100 outline-none"
          >
            Close & Review Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default VendorBulkImportErrorModal;
