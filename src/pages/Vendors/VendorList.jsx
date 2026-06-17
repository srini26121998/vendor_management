import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { VENDOR_ROUTES, VENDOR_CATEGORIES } from './vendorConstants';

const MANAGERS_LIST = [
    { id: 'M1', name: 'Arun Sharma' },
    { id: 'M2', name: 'Neha Gupta' },
    { id: 'M3', name: 'Rahul Desai' }
];
import {
    StatusBadge, PrimaryBtn, SecondaryBtn, VModal, ColumnConfig
} from './VendorComponents';
import { Settings, Download, LayoutGrid, List, Search, ChevronDown, FileText, Trash2, CheckCircle2, XCircle, Printer as PrintIcon, Edit3, Eye, MoreHorizontal, FileSpreadsheet, AlertCircle, Share2, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { exportToExcel, exportToPDF, printData } from '../../utils/exportUtils';

import useVendorStore from '../../store/useVendorStore';
import VendorBulkImportModal from './VendorBulkImportModal';

export default function VendorList() {
    const navigate = useNavigate();
    const { vendors, isLoading, loadVendors, removeVendor, blockVendorsApi, blockVendors, assignManager } = useVendorStore();

    // ── Load vendors from API on mount ──
    useEffect(() => {
        loadVendors().catch(() => {
            toast.error('Failed to load vendors from server.');
        });
    }, []);


    const [selected, setSelected] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [catFilters, setCatFilters] = useState([]); // Multi-select
    const [statusFilter, setStatusFilter] = useState('All Statuses');
    const [gstinFilter, setGstinFilter] = useState('');
    const [dateRange, setDateRange] = useState({ from: '', to: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(20);
    const [sortConfig, setSortConfig] = useState({ key: 'vendorCode', dir: 'asc' });

    // Modal states
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockReason, setBlockReason] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedManager, setSelectedManager] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBulkImportModal, setShowBulkImportModal] = useState(false);
    const [vendorToDelete, setVendorToDelete] = useState(null);
    const [advMode, setAdvMode] = useState(false);

    const [cols, setCols] = useState([
        { id: 'vendorCode', label: 'Vendor Code', visible: true },
        { id: 'name', label: 'Vendor Name', visible: true },
        { id: 'category', label: 'Category', visible: true },
        { id: 'primaryMobile', label: 'Mobile', visible: true },
        { id: 'primaryEmail', label: 'Email', visible: true },
        { id: 'kycStatus', label: 'KYC Status', visible: true },
        { id: 'gstin', label: 'GSTIN', visible: true },
        { id: 'pan', label: 'PAN', visible: true },
        { id: 'actions', label: 'Actions', visible: true },
    ]);

    // Debounce Search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm.length >= 3 || searchTerm.length === 0) {
                setDebouncedSearch(searchTerm);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const toggleSelect = (id) => {
        setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
    };

    const selectAll = () => {
        if (selected.length === paginatedVendors.length && paginatedVendors.length > 0) setSelected([]);
        else setSelected(paginatedVendors.map(v => v.id));
    };

    const handleSort = (key) => {
        const dir = sortConfig.key === key && sortConfig.dir === 'asc' ? 'desc' : 'asc';
        setSortConfig({ key, dir });
    };

    const filtered = useMemo(() => {
        return vendors.filter(v => {
            const matchSearch = debouncedSearch === '' ||
                (v.name || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (v.gstin || '').toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (v.vendorCode || v.id || '').toLowerCase().includes(debouncedSearch.toLowerCase());

            const matchCat = catFilters.length === 0 || catFilters.includes(v.category);

            const matchStatus = statusFilter === 'All Statuses' ||
                (statusFilter === 'Expiring Soon' && v.status === 'expiring_soon') ||
                v.status.toLowerCase() === statusFilter.toLowerCase();

            const matchGstin = gstinFilter === '' || (v.gstin || '').includes(gstinFilter);

            const matchDate = (!dateRange.from || new Date(v.lastUpdated) >= new Date(dateRange.from)) &&
                (!dateRange.to || new Date(v.lastUpdated) <= new Date(dateRange.to));

            return matchSearch && matchCat && matchStatus && matchGstin && matchDate;
        });
    }, [vendors, debouncedSearch, catFilters, statusFilter, gstinFilter, dateRange]);

    const sortedVendors = useMemo(() => {
        return [...filtered].sort((a, b) => {
            const { key, dir } = sortConfig;
            let valA = a[key] || '';
            let valB = b[key] || '';
            if (valA < valB) return dir === 'asc' ? -1 : 1;
            if (valA > valB) return dir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [filtered, sortConfig]);

    const totalPages = Math.ceil(sortedVendors.length / rowsPerPage);
    const paginatedVendors = sortedVendors.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);
    const visibleCols = cols.filter(c => c.visible);

    const handleBulkAction = (action) => {
        if (action === 'Bulk Block') {
            setShowBlockModal(true);
        } else if (action === 'Assign Manager') {
            setShowAssignModal(true);
        } else if (action === 'Approve All') {
            handleApproveAll();
        } else {
            toast.success(`${action} performed on ${selected.length} vendors`);
            setSelected([]);
        }
    };

    const handleApproveAll = () => {
        const ids = [...selected];
        setSelected([]);
        toast.promise(
            useVendorStore.getState().approveVendorsApi(ids),
            {
                loading: `Approving ${ids.length} vendor(s)...`,
                success: (res) => `Activated ${res.success} vendor(s) successfully.`,
                error: 'Failed to approve some vendors.',
            }
        );
    };

    const handleBlockVendors = () => {
        if (blockReason.length < 20) {
            toast.error("Reason must be at least 20 characters.");
            return;
        }
        const ids = [...selected];
        setSelected([]);
        setShowBlockModal(false);
        setBlockReason('');
        toast.promise(
            blockVendorsApi(ids, blockReason),
            {
                loading: `Blocking ${ids.length} vendor(s)...`,
                success: (res) => `Blocked ${res.success} vendor(s) successfully.`,
                error: 'Failed to block some vendors. Please try again.',
            }
        );
    };

    const handleAssignManager = () => {
        if (!selectedManager) {
            toast.error("Please select a manager.");
            return;
        }
        const manager = MANAGERS_LIST.find(m => m.id === selectedManager);
        assignManager(selected, selectedManager);
        toast.success(`Assigned ${selected.length} vendors to ${manager.name}`);
        setSelected([]);
        setShowAssignModal(false);
        setSelectedManager('');
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${text} to clipboard`, { icon: '📋' });
    };

    const maskText = (text, visibleCount = 5) => {
        if (!text) return '—';
        return text.slice(0, visibleCount) + '*'.repeat(text.length - visibleCount);
    };

    const handleEdit = (id) => {
        const vendor = vendors.find(v => v.id === id);
        if (vendor) {
            navigate(VENDOR_ROUTES.onboarding, { state: { vendor, mode: 'edit' } });
        }
    };

    const handleDelete = (id) => {
        setVendorToDelete(vendors.find(v => v.id === id));
        setShowDeleteModal(true);
    };

    // ── Single block from detail page context ──
    const handleSingleBlock = (id, reason) => {
        toast.promise(
            useVendorStore.getState().blockVendorApi(id, reason),
            {
                loading: 'Blocking vendor...',
                success: 'Vendor blocked successfully.',
                error: 'Failed to block vendor.',
            }
        );
    };

    const handlePrint = (v) => {
        printData([v], `Vendor Details: ${v.name}`, [
            { header: 'ID', accessor: 'vendorCode' },
            { header: 'Name', accessor: 'name' },
            { header: 'Category', accessor: 'category' },
            { header: 'Status', accessor: 'status' },
            { header: 'GSTIN', accessor: 'gstin' },
            { header: 'PAN', accessor: 'pan' },
            { header: 'City', accessor: 'city' },
            { header: 'State', accessor: 'state' }
        ]);
    };

    const confirmDelete = () => {
        if (vendorToDelete) {
            const toDelete = vendorToDelete;
            setShowDeleteModal(false);
            setVendorToDelete(null);
            toast.promise(
                removeVendor(toDelete.id),
                {
                    loading: `Removing ${toDelete.name || toDelete.vendorCode}...`,
                    success: `Vendor "${toDelete.name || toDelete.vendorCode}" removed from the registry.`,
                    error: (err) => err?.response?.data?.message || 'Failed to delete vendor.',
                }
            );
        }
    };

    const handleDownload = (v) => {
        const generateDossier = async () => {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const content = `VENDOR DOSSIER: ${v.vendorCode || v.id}\n-----------------------------------\nName: ${v.name}\nCategory: ${v.category}\nGSTIN: ${v.gstin}\nPAN: ${v.pan}\nFSSAI: ${v.fssai || 'N/A'}\nLocation: ${v.city}\nStatus: ${v.status.toUpperCase()}\nLast Updated: ${v.lastUpdated}\n-----------------------------------\nGenerated on: ${new Date().toLocaleString()}`;
            const blob = new Blob([content], { type: 'text/plain' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${v.vendorCode || v.id}_Dossier.txt`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        };

        toast.promise(
            generateDossier(),
            {
                loading: `Generating document package for ${v.name}...`,
                success: `Dossier for ${v.vendorCode || v.id} downloaded successfully.`,
                error: 'Failed to generate documents.',
            }
        );
    };


    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Loading overlay */}
            {isLoading && (
                <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 border border-slate-100">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[13px] font-bold text-slate-600">Loading vendor registry...</p>
                    </div>
                </div>
            )}
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');`}
            </style>
            <div className="max-w-[1600px] mx-auto p-4 sm:p-6 space-y-4 pt-4">
                {/* ── Header ── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                        <h1 className="text-[22px] font-bold text-[#1e293b] tracking-tight">Vendor Master Registry</h1>
                        <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Central listing with filtering, sorting, and compliance management.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setAdvMode(!advMode)}
                            className={`flex items-center gap-2 px-4 py-2 text-[13px] font-semibold rounded-lg border transition-all shadow-sm ${advMode ? 'bg-blue-600 text-white border-blue-600 shadow-blue-100' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                            <Settings className={`w-4 h-4 ${advMode ? 'animate-spin' : ''}`} />
                            {advMode ? 'Config Active' : 'View Config'}
                        </button>



                        <div className="relative group">
                            <button className="bg-white px-4 py-2 rounded-lg border border-gray-200 flex items-center gap-2 text-[13px] text-gray-600 shadow-sm hover:bg-gray-50 transition-colors font-bold group-hover:border-blue-400 group-hover:text-blue-600">
                                <Share2 className="w-4 h-4" />
                                Share & Export
                                <ChevronDown className="w-4 h-4 transition-transform group-hover:rotate-180" />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-100 rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2 border-b-4 border-b-blue-600">
                                <button onClick={() => exportToExcel(vendors, 'Vendor_List', [])} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 rounded-xl font-bold text-slate-600 flex items-center gap-2 transition-all">
                                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                    Export Excel
                                </button>
                                <button onClick={() => exportToPDF(vendors, 'Vendor Registry', [])} className="w-full text-left px-4 py-2.5 text-[12px] hover:bg-slate-50 rounded-xl font-bold text-slate-600 flex items-center gap-2 transition-all">
                                    <FileText className="w-4 h-4 text-rose-600" />
                                    Export PDF
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <SecondaryBtn onClick={() => setShowBulkImportModal(true)} className="!rounded-full !font-bold !px-6 !py-2.5 !text-[11px] !border-blue-200 !text-blue-700 bg-blue-50 shadow-sm hover:bg-blue-100 hover:border-blue-300">
                                <UploadCloud className="w-4 h-4 mr-1 inline-block" />
                                BULK IMPORT
                            </SecondaryBtn>

                            <PrimaryBtn onClick={() => navigate(VENDOR_ROUTES.onboarding)} className="!rounded-full !font-bold !px-6 !py-2.5 !text-[11px] !bg-blue-600 shadow-lg shadow-blue-200">
                                + ONBOARD NEW VENDOR
                            </PrimaryBtn>
                        </div>
                    </div>
                </div>

                {/* ── Search & Filter Bar ── */}
                        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm space-y-3">
                            <div className="relative group">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                </span>
                                <input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by Vendor Name, ID, or GSTIN..."
                                    className="w-full pl-14 pr-6 h-14 bg-white border border-slate-200 rounded-2xl text-[15px] font-medium text-slate-700 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50/50 transition-all shadow-sm placeholder:text-slate-400"
                                />
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                                <div className="flex items-center gap-2">
                                    {[
                                        { label: 'All', value: 'All Statuses' },
                                        { label: 'Active', value: 'Active' },
                                        { label: 'Blocked', value: 'Blocked' },
                                        { label: 'Expiring Soon', value: 'Expiring Soon' }
                                    ].map((f) => (
                                        <button
                                            key={f.value}
                                            onClick={() => setStatusFilter(f.value)}
                                            className={`px-5 py-1.5 text-[11px] font-bold rounded-full transition-all duration-300 uppercase  border ${statusFilter === f.value
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-100'
                                                : 'bg-blue-50/30 text-blue-500 border-blue-100/50 hover:bg-blue-50'}`}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                                    className="flex items-center gap-2 text-[11px] font-bold uppercase  text-blue-600 hover:text-blue-700 transition-all px-4 py-2 rounded-full bg-blue-50/50 border border-blue-100"
                                >
                                    <svg className={`w-3.5 h-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                                    {showAdvancedFilters ? 'Hide Filters' : 'Advanced Filters'}
                                </button>
                            </div>

                            {showAdvancedFilters && (
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pt-8 border-t border-slate-100 animate-in fade-in slide-in-from-top-2">
                                    {/* Category Filter */}
                                    <div className="md:col-span-1 space-y-3">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Filter by Categories</label>
                                        <div className="flex flex-wrap gap-2">
                                            {VENDOR_CATEGORIES.map(c => {
                                                const isSelected = catFilters.includes(c);
                                                return (
                                                    <button
                                                        key={c}
                                                        onClick={() => {
                                                            setCatFilters(prev =>
                                                                isSelected ? prev.filter(x => x !== c) : [...prev, c]
                                                            );
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${isSelected
                                                            ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm'
                                                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                                    >
                                                        {c}
                                                        {isSelected && <span className="ml-1.5 text-[10px]">✕</span>}
                                                    </button>
                                                );
                                            })}
                                            {catFilters.length > 0 && (
                                                <button
                                                    onClick={() => setCatFilters([])}
                                                    className="px-3 py-1.5 text-[10px] font-bold text-rose-500 uppercase hover:underline"
                                                >
                                                    Clear
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* GSTIN Filter */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">GSTIN Registry</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                            </span>
                                            <input
                                                value={gstinFilter}
                                                onChange={(e) => setGstinFilter(e.target.value.toUpperCase())}
                                                maxLength={15}
                                                placeholder="15-digit GSTIN..."
                                                className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300 shadow-sm"
                                            />
                                        </div>
                                    </div>

                                    {/* Date Range */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Last Activity Period</label>
                                        <div className="flex items-center gap-2">
                                            <div className="relative flex-1">
                                                <input type="date"
                                                    max={new Date().toISOString().split('T')[0]}
                                                    value={dateRange.from}
                                                    onChange={(e) => setDateRange(r => ({ ...r, from: e.target.value }))}
                                                    className="w-full px-3 h-11 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer shadow-sm" />
                                            </div>
                                            <span className="text-slate-300 text-xs font-bold">to</span>
                                            <div className="relative flex-1">
                                                <input type="date"
                                                    max={new Date().toISOString().split('T')[0]}
                                                    value={dateRange.to}
                                                    onChange={(e) => setDateRange(r => ({ ...r, to: e.target.value }))}
                                                    className="w-full px-3 h-11 bg-white border border-slate-200 rounded-xl text-[12px] font-bold text-slate-600 focus:border-blue-400 focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer shadow-sm" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rows Per Page */}
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Display Density</label>
                                        <div className="relative">
                                            <select
                                                value={rowsPerPage}
                                                onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                                className="w-full appearance-none px-4 h-11 bg-white border border-slate-200 rounded-xl text-[13px] font-bold text-slate-600 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all cursor-pointer shadow-sm">
                                                <option value={20}>20 Entries per page</option>
                                                <option value={50}>50 Entries per page</option>
                                                <option value={100}>100 Entries per page</option>
                                            </select>
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Bulk Actions Bar ── */}
                        {selected.length > 0 && (
                            <div className="bg-[#1e293b] text-white p-4 px-8 rounded-2xl flex items-center justify-between animate-in slide-in-from-top-4 shadow-xl border-l-4 border-blue-500">
                                <div className="flex items-center gap-8">
                                    <p className="text-[12px] font-bold uppercase "><span className="text-blue-400">{selected.length}</span> Vendors Selected</p>
                                    <div className="flex gap-4">
                                        <button onClick={() => handleBulkAction('Export CSV')} className="text-[11px] font-bold text-blue-400 hover:text-blue-300 uppercase  flex items-center gap-2">
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 0L8 8m4-4l4 4" /></svg>
                                            Bulk Export
                                        </button>
                                        <button onClick={() => handleBulkAction('Approve All')} className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 uppercase ">Approve All</button>
                                        <button onClick={() => handleBulkAction('Bulk Block')} className="text-[11px] font-bold text-rose-400 hover:text-rose-300 uppercase ">Bulk Block</button>
                                        <button onClick={() => handleBulkAction('Assign Manager')} className="text-[11px] font-bold text-white/70 hover:text-white uppercase ">Assign Category Manager</button>
                                    </div>
                                </div>
                                <button onClick={() => setSelected([])} className="text-[10px] font-bold bg-white/10 px-4 py-1.5 rounded-lg hover:bg-white/20 transition-all">Clear Selection</button>
                            </div>
                        )}

                        <ColumnConfig cols={cols} onChange={(id) => setCols(cols.map(c => c.id === id ? { ...c, visible: !c.visible } : c))} advMode={advMode} setAdvMode={setAdvMode} />

                        {/* ── Table Container ── */}
                        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[12px] text-slate-400 font-bold uppercase tracking-wider border-b border-slate-100 bg-[#F8FAFC]">
                                            {visibleCols.map(col => (
                                                <th key={col.id} className={`${['vendorCode', 'id', 'name'].includes(col.id) ? 'px-8' : 'px-4'} py-5 cursor-pointer hover:text-slate-900 transition-colors whitespace-nowrap ${col.id === 'actions' ? 'sticky right-0 bg-[#F8FAFC] z-10 shadow-[-4px_0_12px_rgba(0,0,0,0.03)]' : ''}`} onClick={() => handleSort(col.id)}>
                                                    <div className="flex items-center gap-2">
                                                        {col.label.toUpperCase()}
                                                        {sortConfig.key === col.id && (
                                                            <span className="text-blue-500 font-bold">{sortConfig.dir === 'asc' ? '↑' : '↓'}</span>
                                                        )}
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginatedVendors.length > 0 ? (
                                            paginatedVendors.map((v) => (
                                                <tr key={v.id} className="hover:bg-slate-50 transition-all group">
                                                    {visibleCols.map(col => (
                                                        <td key={col.id} className={`${['vendorCode', 'id', 'name'].includes(col.id) ? 'px-8' : 'px-4'} py-4 whitespace-nowrap ${col.id === 'actions' ? 'sticky right-0 bg-white group-hover:bg-slate-50 z-10 shadow-[-4px_0_12px_rgba(0,0,0,0.03)]' : ''}`}>
                                                            {col.id === 'vendorCode' && (
                                                                <button onClick={() => copyToClipboard(v.vendorCode || v.id)} className="text-blue-600 hover:text-blue-800 font-bold text-[13px]">{v.vendorCode || v.id}</button>
                                                            )}
                                                            {col.id === 'name' && (
                                                                <>
                                                                    <button onClick={() => navigate(`${VENDOR_ROUTES.detail}/${v.id}`)} className="font-medium text-[#1e293b] text-[14px] hover:text-blue-600 transition-colors">{v.name}</button>
                                                                    <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">{v.city}</div>
                                                                </>
                                                            )}
                                                            {col.id === 'category' && (
                                                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold uppercase border border-blue-100 shadow-sm transition-all hover:bg-blue-100">
                                                                    {v.category}
                                                                </div>
                                                            )}
                                                            {col.id === 'status' && <StatusBadge status={v.status} size="sm" />}
                                                            {col.id === 'gstin' && (
                                                                <div className="group/mask relative cursor-help">
                                                                    <span className="text-[13px] font-medium text-slate-600 font-mono tracking-tight">{maskText(v.gstin)}</span>
                                                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover/mask:block bg-slate-800 text-white text-[11px] p-2 rounded shadow-xl z-20 whitespace-nowrap">
                                                                        Full GSTIN: <span className="font-mono">{v.gstin}</span>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {col.id === 'pan' && (
                                                                <div className="group/pan relative cursor-help">
                                                                    <span className="text-[13px] font-medium text-slate-600 font-mono tracking-tight">{maskText(v.pan)}</span>
                                                                    <div className="absolute left-0 bottom-full mb-2 hidden group-hover/pan:block bg-slate-800 text-white text-[11px] p-2 rounded shadow-xl z-20 whitespace-nowrap">
                                                                        Full PAN: <span className="font-mono">{v.pan}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {col.id === 'lastUpdated' && (
                                                                <div className="flex flex-col">
                                                                    <span className="text-[13px] font-bold text-slate-700">{v.lastUpdated}</span>
                                                                </div>
                                                            )}
                                                            {col.id === 'primaryMobile' && (
                                                                <span className="text-[13px] font-medium text-slate-600">{v.primaryMobile || '—'}</span>
                                                            )}
                                                            {col.id === 'primaryEmail' && (
                                                                <span className="text-[13px] font-medium text-slate-600">{v.primaryEmail || '—'}</span>
                                                            )}
                                                            {col.id === 'kycStatus' && (
                                                                <StatusBadge status={v.kycStatus || 'pending'} size="sm" />
                                                            )}
                                                            {col.id === 'actions' && (
                                                                <div className="flex items-center gap-1.5">
                                                                    <button onClick={() => navigate(`${VENDOR_ROUTES.detail}/${v.id}`)} title="View Detail" className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                                                        <Eye className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleEdit(v.id)} title="Edit" className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white transition-all shadow-sm">
                                                                        <Edit3 className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleDelete(v.id)} title="Delete" className="w-8 h-8 flex items-center justify-center rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handlePrint(v)} title="Print" className="w-8 h-8 flex items-center justify-center rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm">
                                                                        <PrintIcon className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => handleDownload(v)} title="Download Dossier" className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-600 hover:text-white transition-all shadow-sm">
                                                                        <Download className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={cols.length} className="py-24 text-center">
                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100">
                                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        </div>
                                                        <h3 className="text-[18px] font-bold text-slate-700">No matching vendors found</h3>
                                                        <button onClick={() => { setSearchTerm(''); setCatFilters([]); setStatusFilter('All Statuses'); setGstinFilter(''); setDateRange({ from: '', to: '' }); }} className="text-blue-600 text-[13px] font-bold hover:underline">Clear all filters</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>


                {/* ── Pagination ── */}
                {totalPages > 0 && (
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-12 mt-4">
                        <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">
                            Showing <span className="text-slate-700">{sortedVendors.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}</span> to <span className="text-slate-700">{Math.min(currentPage * rowsPerPage, sortedVendors.length)}</span> of <span className="text-slate-700">{sortedVendors.length}</span> entries
                        </div>
                        <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                            <button 
                                disabled={currentPage === 1} 
                                onClick={() => setCurrentPage(s => s - 1)} 
                                className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center gap-1">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                Prev
                            </button>
                            <div className="flex items-center gap-1 px-2 border-x border-slate-100">
                                {(() => {
                                    const pages = [];
                                    if (totalPages <= 5) {
                                        for (let i = 1; i <= totalPages; i++) pages.push(i);
                                    } else {
                                        if (currentPage <= 3) {
                                            pages.push(1, 2, 3, 4, '...', totalPages);
                                        } else if (currentPage >= totalPages - 2) {
                                            pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                                        } else {
                                            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                                        }
                                    }
                                    return pages.map((p, i) => (
                                        p === '...' ? (
                                            <span key={`dots-${i}`} className="w-8 text-center text-slate-400 font-bold tracking-widest">...</span>
                                        ) : (
                                            <button 
                                                key={`page-${p}`} 
                                                onClick={() => setCurrentPage(p)}
                                                className={`w-9 h-9 flex items-center justify-center rounded-xl text-[13px] font-bold transition-all duration-300 ${currentPage === p ? 'bg-blue-600 text-white shadow-md shadow-blue-200/50 scale-105' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}>
                                                {p}
                                            </button>
                                        )
                                    ));
                                })()}
                            </div>
                            <button 
                                disabled={currentPage === totalPages} 
                                onClick={() => setCurrentPage(s => s + 1)} 
                                className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all flex items-center gap-1">
                                Next
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Modals ── */}
                <VModal open={showBlockModal} onClose={() => setShowBlockModal(false)} title="Block Vendors">
                    <div className="space-y-4">
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-[13px] font-medium">
                            Are you sure you want to block <span className="font-bold">{selected.length}</span> selected vendor(s)?
                        </div>
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Mandatory Reason for Blocking</label>
                            <textarea
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                placeholder="Provide a detailed reason for the audit trail (Min 20 characters)..."
                                className="w-full p-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[14px] font-medium h-36 outline-none focus:border-rose-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-300"
                            />
                            <div className={`text-[10px] mt-2 font-bold uppercase  ${blockReason.length < 20 ? 'text-rose-500' : 'text-emerald-500'}`}>
                                {blockReason.length} / 20 characters minimum
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-8">
                            <SecondaryBtn onClick={() => setShowBlockModal(false)}>Cancel Action</SecondaryBtn>
                            <PrimaryBtn onClick={handleBlockVendors} className="!bg-rose-600 hover:!bg-rose-700 hover:!shadow-rose-100">Confirm & Block</PrimaryBtn>
                        </div>
                    </div>
                </VModal>

                <VModal open={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Category Manager">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[11px] font-bold text-slate-500 uppercase mb-2 block">Select Manager</label>
                            <div className="relative">
                                <select
                                    value={selectedManager}
                                    onChange={(e) => setSelectedManager(e.target.value)}
                                    className="w-full appearance-none p-4 bg-[#F8FAFC] border border-slate-200 rounded-2xl text-[14px] font-bold text-slate-700 outline-none focus:border-blue-500 focus:bg-white transition-all">
                                    <option value="">-- Choose Manager --</option>
                                    {MANAGERS_LIST.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                </span>
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6">
                            <SecondaryBtn onClick={() => setShowAssignModal(false)}>Cancel</SecondaryBtn>
                            <PrimaryBtn onClick={handleAssignManager}>Assign & Confirm</PrimaryBtn>
                        </div>
                    </div>
                </VModal>

                {/* ── Delete Vendor Modal ── */}
                <VModal open={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Vendor">
                    <div className="space-y-6">
                        <div className="flex flex-col items-center text-center py-4">
                            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mb-4 text-rose-600">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 mb-2">Are you sure?</h3>
                            <p className="text-slate-600">
                                You are about to permanently delete <span className="font-bold text-slate-800">"{vendorToDelete?.name}"</span>.
                                This action cannot be undone and will remove all associated data.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-end mt-8">
                            <SecondaryBtn onClick={() => setShowDeleteModal(false)}>Cancel</SecondaryBtn>
                            <PrimaryBtn onClick={confirmDelete} className="!bg-rose-600 hover:!bg-rose-700">Delete Permanently</PrimaryBtn>
                        </div>
                    </div>
                </VModal>
            </div>
            {/* ── Modals ── */}
            <VendorBulkImportModal
                isOpen={showBulkImportModal}
                onClose={() => setShowBulkImportModal(false)}
                onSuccess={async () => {
                    await loadVendors();
                    setShowBulkImportModal(false);
                }}
            />

        </div>
    );
}
