import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Calendar, Package, AlertCircle,
    Upload, DollarSign, CheckCircle, Clock, Trash2,
    MessageSquare, FileText, ChevronRight, Info,
    Camera, ShieldCheck, XCircle, RefreshCw, Send,
    Download, History, ShieldAlert, MoreHorizontal, Filter, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    PageHeader, VCard, VendorBreadcrumb,
    PrimaryBtn, SecondaryBtn, VModal, VTable,
    StatusBadge
} from '../Vendors/VendorComponents';
import useAuthStore from '../../store/useAuthStore';
import { fetchGRNs, fetchRTVRequests, fetchVendorReturns, createRTVRequest, updateRTVStatus } from '../../api/vendorService';



const RETURN_REASONS = [
    'Quality Defect',
    'Wrong Item',
    'Damage in Transit',
    'Short Expiry',
    'Overstock (not vendor fault)',
    'Packaging Issue'
];

const PIPELINE_STATES = [
    { id: 'FLAGGED', label: 'Return Initiated', color: 'orange', desc: 'Staff raised return; item moved to Red Zone.' },
    { id: 'DEBIT_NOTE_RAISED', label: 'Debit Note Generated', color: 'green', desc: 'Auto-generated on creation; vendor notified.' },
    { id: 'VENDOR_NOTIFIED', label: 'Awaiting SLA Response', color: 'amber', desc: 'Vendor portal notification sent; 72hr SLA.' },
    { id: 'SHIPPED_BACK', label: 'Shipped Back to Vendor', color: 'purple', desc: 'Physical inventory dispatched; tracking logged.' },
    { id: 'DISPUTED', label: 'Dispute Raised by Vendor', color: 'red', desc: 'Vendor challenged the return value/quality.' },
    { id: 'RESOLVED', label: 'Closed - Debit Accepted', color: 'green', desc: 'Vendor accepted; debit note settled.' },
    { id: 'FORCE_CLOSED', label: 'Closed by Management', color: 'slate', desc: 'Finance manager force-closed with audit logs.' }
];

const SIMPLIFIED_STEPS = [
    { id: 'INITIATED', label: 'Initiated', desc: 'Debit note raised' },
    { id: 'AWAITING', label: 'Awaiting Response', desc: 'Pending vendor review' },
    { id: 'SHIPPED', label: 'Shipped Back', desc: 'Physical goods in transit' },
    { id: 'COMPLETED', label: 'Completed', desc: 'Claim settled & closed' }
];

const getActiveStepIndex = (status) => {
    if (['FLAGGED', 'DEBIT_NOTE_RAISED', 'ACTIVE', 'active'].includes(status)) return 0;
    if (['VENDOR_NOTIFIED', 'DISPUTED'].includes(status)) return 1;
    if (status === 'SHIPPED_BACK') return 2;
    if (['RESOLVED', 'FORCE_CLOSED'].includes(status)) return 3;
    return 0;
};

export default function RTVWorkflow() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const userId = user?.id;

    // Data lists
    const [grns, setGrns] = useState([]);
    const [rtvs, setRtvs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Search and Form States
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGRN, setSelectedGRN] = useState(null);
    const [formData, setFormData] = useState({
        grnRef: '',
        vendorName: '',
        poNumber: '',
        returnDate: new Date().toISOString().split('T')[0],
        selectedItems: [], // { sku, qty, reason, subReason, photos }
        creditNotePreference: 'Debit Note from vendor'
    });

    // Tracker Sidebar Status (unused in Lobby now, but kept for compatibility or fallback)
    const [showPipeline, setShowPipeline] = useState(false);
    const [selectedRtvForTracking, setSelectedRtvForTracking] = useState(null);
    const [disputeInput, setDisputeInput] = useState('');

    // Details Modal State
    const [selectedRtvForDetails, setSelectedRtvForDetails] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [disputeReason, setDisputeReason] = useState('');
    const [showDisputeInput, setShowDisputeInput] = useState(false);

    // Lobby View Toggle & Filter States
    const [view, setView] = useState('lobby'); // 'lobby' or 'initiate'
    const [lobbySearch, setLobbySearch] = useState('');
    const [lobbyStatusFilter, setLobbyStatusFilter] = useState('ALL');

    // Load dynamic data on mount
    const loadDynamicData = async () => {
        setLoading(true);
        try {
            const [grnRes, rtvRes] = await Promise.all([
                fetchGRNs(),
                fetchRTVRequests()
            ]);

            const dbGrns = grnRes.data || grnRes || [];
            const dbRtvs = rtvRes.data || rtvRes || [];

            // Map DB GRNs to the structure our UI uses
            const mappedGrns = dbGrns.map(g => ({
                id: g.id,
                grnNumber: g.grnNumber || `GRN-${g.id.substring(0, 8)}`,
                vendor: g.vendorName || 'General Supplier',
                po: g.purchaseOrderNumber || 'PO-GENERIC',
                date: g.receivedDate ? g.receivedDate.split('T')[0] : '',
                items: g.items ? g.items.map(item => ({
                    sku: item.vendorProductSku || `SKU-${item.id.toString().substring(0, 6).toUpperCase()}`,
                    name: item.productName || 'Basmati Rice',
                    received: item.receivedQuantity || 0,
                    accepted: item.acceptedQuantity || 0,
                    rejected: item.rejectedQuantity || 0,
                    price: item.unitPrice || 0
                })) : []
            }));

            setGrns(mappedGrns);
            setRtvs(dbRtvs);

            // Automatically select first active RTV to show in the SLA tracker
            if (dbRtvs.length > 0 && !selectedRtvForTracking) {
                setSelectedRtvForTracking(dbRtvs[0]);
            }
        } catch (err) {
            console.error('Failed loading dynamic reverse logistics data:', err);
            setGrns([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDynamicData();
    }, []);

    // Filter GRNs based on search input
    const filteredGRNs = grns.filter(g =>
        g.grnNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.vendor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectGRN = (grn) => {
        setSelectedGRN(grn);
        setFormData({
            ...formData,
            grnRef: grn.id,
            vendorName: grn.vendor,
            poNumber: grn.po,
            selectedItems: []
        });
        setSearchTerm('');
        toast.success(`Linked GRN ${grn.grnNumber} Successfully`);
    };

    const handleItemToggle = (item) => {
        const exists = formData.selectedItems.find(i => i.sku === item.sku);
        if (exists) {
            setFormData({
                ...formData,
                selectedItems: formData.selectedItems.filter(i => i.sku !== item.sku)
            });
        } else {
            setFormData({
                ...formData,
                selectedItems: [...formData.selectedItems, {
                    ...item,
                    qty: 1,
                    reason: '',
                    subReason: '',
                    photos: []
                }]
            });
        }
    };

    const updateItemField = (sku, field, value) => {
        setFormData({
            ...formData,
            selectedItems: formData.selectedItems.map(item =>
                item.sku === sku ? { ...item, [field]: value } : item
            )
        });
    };

    const calculateTotalDebit = () => {
        return formData.selectedItems.reduce((acc, item) => acc + (item.qty * item.price), 0);
    };

    const handleViewDetails = async (row) => {
        const loadingToast = toast.loading('Fetching fresh return details...');
        try {
            if (row.vendorId) {
                const res = await fetchVendorReturns(row.vendorId);
                const vendorReturns = res.data || res || [];
                const freshRtv = vendorReturns.find(r => r.id === row.id);

                if (freshRtv) {
                    setSelectedRtvForDetails(freshRtv);
                } else {
                    setSelectedRtvForDetails(row);
                }
            } else {
                setSelectedRtvForDetails(row);
            }
            toast.dismiss(loadingToast);
            setShowDetailsModal(true);
            setShowDisputeInput(false);
            setDisputeReason('');
        } catch (err) {
            toast.dismiss(loadingToast);
            toast.error('Failed to fetch details');
            setSelectedRtvForDetails(row);
            setShowDetailsModal(true);
            setShowDisputeInput(false);
            setDisputeReason('');
        }
    };

    // Raise new RTV return request to Spring Boot backend
    const handleSubmit = async () => {
        if (!formData.grnRef) return toast.error('Please select a GRN Reference');
        if (formData.selectedItems.length === 0) return toast.error('Please select at least one item to return');

        // Validation for each item
        for (const item of formData.selectedItems) {
            if (!item.reason) return toast.error(`Please select a reason for ${item.name}`);
            if (item.qty <= 0) return toast.error(`Invalid quantity for ${item.name}`);
            if (item.qty > item.received) return toast.error(`Quantity exceeds received for ${item.name}`);

            if ((item.reason === 'Quality Defect' || item.reason === 'Packaging Issue') && !item.subReason) {
                return toast.error(`Sub-reason is required for ${item.name} due to ${item.reason}`);
            }

            if ((item.reason === 'Damage in Transit' || item.reason === 'Quality Defect') && item.photos.length === 0) {
                return toast.error(`At least 1 photo is required for ${item.name} for ${item.reason}`);
            }
        }

        const payload = {
            grnId: formData.grnRef,
            totalReturnValue: calculateTotalDebit(),
            status: 'DEBIT_NOTE_RAISED',
            returnedProducts: formData.selectedItems.map(item => ({
                productName: item.name,
                productSku: item.sku,
                vendorProductSku: item.sku,
                quantity: item.qty,
                returnQuantity: item.qty,
                reason: item.reason,
                returnReason: item.reason,
                unitPrice: item.price
            }))
        };

        const activeUserId = userId || '00000000-0000-0000-0000-000000000000'; // Default fallback ID if not logged in

        const myToast = toast.loading('Initiating reverse logistics flow...');
        try {
            const res = await createRTVRequest(payload, activeUserId);
            const data = res.data || res;

            // Save selected items for the details modal lookup
            localStorage.setItem(`rtv_items_${data.rtvNumber}`, JSON.stringify(formData.selectedItems));

            toast.dismiss(myToast);
            toast.success(`RTV Request ${data.rtvNumber} raised successfully!`);

            // Reset states
            setSelectedGRN(null);
            setFormData({
                grnRef: '',
                vendorName: '',
                poNumber: '',
                returnDate: new Date().toISOString().split('T')[0],
                selectedItems: [],
                creditNotePreference: 'Debit Note from vendor'
            });

            // Reload returns
            await loadDynamicData();
            setView('lobby');
        } catch (err) {
            toast.dismiss(myToast);
            toast.error(err.response?.data?.message || 'Failed initiating Return-to-Vendor');
        }
    };

    // Update return status interactively
    const handleUpdateStatus = async (status, disputeText = null) => {
        if (!selectedRtvForTracking) return;

        const myToast = toast.loading(`Updating lifecycle state to ${status}...`);
        try {
            const res = await updateRTVStatus(selectedRtvForTracking.id, status, disputeText);
            const updated = res.data || res;

            toast.dismiss(myToast);
            toast.success(`Lifecycle updated to ${status}`);
            setDisputeInput('');

            // Refresh list
            await loadDynamicData();

            // Maintain selection with refreshed data
            setSelectedRtvForTracking(updated);
        } catch (err) {
            toast.dismiss(myToast);
            toast.error(err.response?.data?.message || 'Failed updating return status');
        }
    };

    // Calculate Lobby metrics dynamically
    const totalClaimsValue = rtvs.reduce((acc, r) => acc + (r.totalReturnValue || 0), 0);
    const activeClaimsCount = rtvs.filter(r => !['RESOLVED', 'FORCE_CLOSED'].includes(r.status)).length;
    const resolvedClaimsCount = rtvs.filter(r => r.status === 'RESOLVED').length;
    const disputedClaimsCount = rtvs.filter(r => r.status === 'DISPUTED').length;

    // Filter RTV claims dynamically based on lobby search and status filter pills
    const filteredRtvs = rtvs.filter(r => {
        const matchesSearch = r.rtvNumber.toLowerCase().includes(lobbySearch.toLowerCase()) ||
            (r.vendorName && r.vendorName.toLowerCase().includes(lobbySearch.toLowerCase())) ||
            (r.purchaseOrderNumber && r.purchaseOrderNumber.toLowerCase().includes(lobbySearch.toLowerCase()));

        const matchesStatus = lobbyStatusFilter === 'ALL' ||
            (lobbyStatusFilter === 'ACTIVE' && !['RESOLVED', 'FORCE_CLOSED'].includes(r.status)) ||
            r.status === lobbyStatusFilter;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-6 animate-in fade-in duration-300" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Header Area */}
            <div className="bg-white border-b border-slate-200 px-6 py-2 sticky top-0 z-40 shadow-sm">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg bg-slate-50 text-slate-500 hover:bg-slate-100 transition-all border border-slate-200 shadow-sm">
                            <ArrowLeft size={16} />
                        </button>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                                <h1 className="text-[18px] font-bold text-slate-800 tracking-tight">Returns & Claims</h1>
                                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[9px] font-bold rounded-md border border-green-100 uppercase tracking-widest">RTV.v2</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {view === 'lobby' ? (
                            <PrimaryBtn small icon={<Send size={14} />} onClick={() => setView('initiate')}>
                                Initiate Return
                            </PrimaryBtn>
                        ) : (
                            <>
                                <SecondaryBtn small onClick={() => setView('lobby')}>
                                    ← Back to Lobby
                                </SecondaryBtn>
                                <PrimaryBtn small icon={<Send size={14} />} onClick={handleSubmit}>
                                    Raise Return
                                </PrimaryBtn>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-12 gap-5">
                {loading ? (
                    <div className="lg:col-span-12 flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-300">
                        <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
                        <h3 className="text-sm font-bold text-slate-700">Loading Reverse Logistics...</h3>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">Fetching claims and active GRNs</p>
                    </div>
                ) : (
                    <>
                        {/* LEFT: FORM SECTION OR LOBBY DASHBOARD */}
                        <div className={view === 'lobby' ? 'lg:col-span-12 space-y-5 animate-in fade-in duration-300' : 'lg:col-span-8 space-y-5'}>
                            {view === 'lobby' ? (
                                <>
                                    {/* Lobby KPI Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-300">
                                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-full -mr-8 -mt-8 opacity-40 blur-lg group-hover:scale-150 transition-all"></div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Returned Value</div>
                                            <div className="text-xl font-bold text-slate-800 mt-2">₹{totalClaimsValue.toLocaleString()}</div>
                                            <div className="text-[9px] font-medium text-slate-400 mt-1">Accrued reverse logistics claims</div>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-full -mr-8 -mt-8 opacity-40 blur-lg group-hover:scale-150 transition-all"></div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Claims</div>
                                            <div className="text-xl font-bold text-amber-600 mt-2">{activeClaimsCount} Claims</div>
                                            <div className="text-[9px] font-medium text-slate-400 mt-1">Pending SLA/Shipped back</div>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-full -mr-8 -mt-8 opacity-40 blur-lg group-hover:scale-150 transition-all"></div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Resolved Claims</div>
                                            <div className="text-xl font-bold text-emerald-600 mt-2">{resolvedClaimsCount} Claims</div>
                                            <div className="text-[9px] font-medium text-slate-400 mt-1">Settled & debit note accepted</div>
                                        </div>
                                        <div className="p-4 bg-white rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden group hover:scale-[1.02] transition-all">
                                            <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50 rounded-full -mr-8 -mt-8 opacity-40 blur-lg group-hover:scale-150 transition-all"></div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Disputed Claims</div>
                                            <div className="text-xl font-bold text-rose-600 mt-2">{disputedClaimsCount} Claims</div>
                                            <div className="text-[9px] font-medium text-slate-400 mt-1">Challenged by suppliers</div>
                                        </div>
                                    </div>

                                    {/* Lobby Search & Filter Card */}
                                    <VCard className="p-5 border-slate-200 bg-white shadow-sm">
                                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                                            <div className="relative flex-1 w-full">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                                <input
                                                    type="text"
                                                    value={lobbySearch}
                                                    onChange={(e) => setLobbySearch(e.target.value)}
                                                    placeholder="Search by RTV ID, Vendor Name, or PO Number..."
                                                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-green-500 outline-none text-xs font-medium transition-all shadow-inner"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
                                                {[
                                                    { label: 'All Claims', value: 'ALL' },
                                                    { label: 'Active', value: 'ACTIVE' },
                                                    { label: 'Disputed', value: 'DISPUTED' },
                                                    { label: 'Shipped Back', value: 'SHIPPED_BACK' },
                                                    { label: 'Resolved', value: 'RESOLVED' }
                                                ].map(f => (
                                                    <button
                                                        key={f.value}
                                                        onClick={() => setLobbyStatusFilter(f.value)}
                                                        className={`px-4 py-2 text-[10px] font-bold rounded-full transition-all whitespace-nowrap uppercase tracking-wider border ${lobbyStatusFilter === f.value
                                                            ? 'bg-green-50 text-green-800 border-green-200 shadow-sm hover:bg-green-100 hover:border-green-300'
                                                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                                                            }`}
                                                    >
                                                        {f.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </VCard>

                                    {/* Lobby Claims Table VCard */}
                                    <VCard className="p-6 border-slate-200 bg-white shadow-md relative overflow-hidden">
                                        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-50">
                                            <div className="p-1.5 bg-green-600 rounded-lg text-white">
                                                <Package size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">RTV Returns Registry</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Historical log of all generated debit notes and claims</p>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden mt-4">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="text-[11px] text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200 bg-slate-50/75">
                                                            <th className="px-8 py-4 whitespace-nowrap">RTV Request ID</th>
                                                            <th className="px-4 py-4 whitespace-nowrap">Vendor</th>
                                                            <th className="px-4 py-4 whitespace-nowrap">Linked Documents</th>
                                                            <th className="px-4 py-4 whitespace-nowrap">Return Value</th>
                                                            <th className="px-4 py-4 whitespace-nowrap">Initiated Date</th>
                                                            <th className="px-4 py-4 whitespace-nowrap">Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {filteredRtvs.length > 0 ? (
                                                            filteredRtvs.map((row) => (
                                                                <tr key={row.id} onClick={() => handleViewDetails(row)} className="bg-white even:bg-slate-50/50 hover:bg-green-50/30 transition-all duration-200 group cursor-pointer border-b border-slate-200 last:border-0">
                                                                    <td className="px-8 py-3.5 whitespace-nowrap border-b border-slate-200">
                                                                        <span className="px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold font-mono">
                                                                            {row.rtvNumber}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200">
                                                                        <div className="flex items-center gap-2">
                                                                            <div className="w-6 h-6 rounded bg-green-50 border border-green-200 flex items-center justify-center text-green-700 font-extrabold text-[9px] shadow-sm">
                                                                                {row.vendorName ? row.vendorName.charAt(0).toUpperCase() : 'V'}
                                                                            </div>
                                                                            <span className="font-bold text-slate-700 group-hover:text-green-800 transition-colors">{row.vendorName || 'General Vendor'}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tight">PO: {row.purchaseOrderNumber || 'N/A'}</span>
                                                                            <span className="text-[9px] text-slate-400 font-medium">GRN: {row.grnNumber || 'N/A'}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200">
                                                                        <span className="font-bold text-slate-800">₹{(row.totalReturnValue || 0).toLocaleString()}</span>
                                                                    </td>
                                                                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200">
                                                                        <span className="text-[13px] font-medium text-slate-600">
                                                                            {new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                                        </span>
                                                                    </td>
                                                                    <td className="px-4 py-3.5 whitespace-nowrap border-b border-slate-200">
                                                                        <StatusBadge status={row.status} size="sm" />
                                                                    </td>
                                                                </tr>
                                                            ))
                                                        ) : (
                                                            <tr>
                                                                <td colSpan={6} className="py-24 text-center">
                                                                    <div className="flex flex-col items-center justify-center space-y-4">
                                                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 border border-slate-100">
                                                                            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                                        </div>
                                                                        <h3 className="text-[18px] font-medium text-slate-700">No matching return claims found</h3>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </VCard>
                                </>
                            ) : (
                                <>
                                    {/* INITIATION FORM */}
                                    <VCard className="p-6 shadow-md border-slate-200 relative overflow-hidden bg-white">
                                        <div className="flex items-center gap-3 mb-4 pb-2 border-b border-slate-50">
                                            <div className="p-1.5 bg-green-50 text-green-800 border border-green-200 shadow-sm rounded-lg">
                                                <Package size={18} />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">RTV Initiation Form</h3>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Source selection and return justification</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                            {/* GRN Reference */}
                                            <div className="relative md:col-span-2 lg:col-span-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">GRN Reference <span className="text-rose-500">*</span></label>
                                                <div className="relative group">
                                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-green-500 transition-colors" size={18} />
                                                    <input
                                                        type="text"
                                                        placeholder="Search GRN #..."
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2 text-[12px] font-bold focus:bg-white focus:border-green-500 outline-none transition-all shadow-sm"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />

                                                    {/* Search Dropdown */}
                                                    {searchTerm && (
                                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden py-2 animate-in fade-in slide-in-from-top-1">
                                                            {filteredGRNs.length > 0 ? filteredGRNs.map(grn => (
                                                                <button
                                                                    key={grn.id}
                                                                    onClick={() => handleSelectGRN(grn)}
                                                                    className="w-full px-5 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors"
                                                                >
                                                                    <div>
                                                                        <p className="text-[13px] font-bold text-slate-800 group-hover:text-green-600">{grn.grnNumber}</p>
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{grn.vendor} | {grn.po}</p>
                                                                    </div>
                                                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
                                                                </button>
                                                            )) : (
                                                                <div className="px-5 py-4 text-center text-slate-400 text-[11px] font-bold uppercase ">No matching GRNs found</div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                {selectedGRN && (
                                                    <div className="mt-2 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg w-fit">
                                                        <CheckCircle size={14} className="text-emerald-500" />
                                                        <span className="text-[11px] font-bold text-emerald-600 uppercase">Linked: {selectedGRN.grnNumber}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Return Date */}
                                            <div className="md:col-span-2 lg:col-span-1">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Return Date <span className="text-rose-500">*</span></label>
                                                <div className="relative">
                                                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                                    <input
                                                        type="date"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-2 text-[12px] font-bold focus:bg-white focus:border-green-500 outline-none transition-all shadow-sm"
                                                        value={formData.returnDate}
                                                        onChange={(e) => setFormData({ ...formData, returnDate: e.target.value })}
                                                    />
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-400 mt-2 flex items-center gap-1.5 ml-1 italic">
                                                    <Info size={10} /> Max 30 days post GRN date
                                                </p>
                                            </div>

                                            {/* Read-only Vendor & PO */}
                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Vendor Name</label>
                                                <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-[12px] font-bold text-slate-600 flex items-center gap-3">
                                                    <RefreshCw size={14} className="text-slate-400" />
                                                    {formData.vendorName || '-- Auto-populated from GRN --'}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">PO Number</label>
                                                <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2 text-[12px] font-bold text-slate-600 flex items-center gap-3">
                                                    <FileText size={14} className="text-slate-400" />
                                                    {formData.poNumber || '-- Auto-populated from GRN --'}
                                                </div>
                                            </div>

                                            {/* SKU / Item Multi-Select */}
                                            <div className="md:col-span-2 mt-4">
                                                <label className="text-[10px] font-bold text-slate-500 uppercase  mb-3 block">SKU / Item * (Select from GRN)</label>
                                                {selectedGRN ? (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in duration-200">
                                                        {selectedGRN.items.map(item => (
                                                            <button
                                                                key={item.sku}
                                                                onClick={() => handleItemToggle(item)}
                                                                className={`p-4 rounded-2xl border-2 text-left transition-all group ${formData.selectedItems.find(i => i.sku === item.sku)
                                                                    ? 'bg-green-50 border-green-500 shadow-lg shadow-green-50'
                                                                    : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 shadow-sm'
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between items-start mb-2">
                                                                    <div className={`p-1.5 rounded-lg ${formData.selectedItems.find(i => i.sku === item.sku) ? 'bg-green-50 text-green-800 border border-green-200 shadow-sm' : 'bg-slate-100 text-slate-400'}`}>
                                                                        <Package size={14} />
                                                                    </div>
                                                                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${formData.selectedItems.find(i => i.sku === item.sku) ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-slate-100 text-slate-500'}`}>
                                                                        {item.sku}
                                                                    </span>
                                                                </div>
                                                                <h4 className="text-[13px] font-bold text-slate-800 leading-tight mb-1">{item.name}</h4>
                                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Received: {item.received} Units</p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
                                                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mx-auto mb-4 shadow-sm">
                                                            <Filter size={24} />
                                                        </div>
                                                        <p className="text-[12px] font-bold text-slate-400 uppercase ">Please link a GRN first to see available items</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </VCard>

                                    {/* SELECTED ITEMS DETAILS */}
                                    <AnimatePresence>
                                        {formData.selectedItems.length > 0 && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 20 }}
                                                className="space-y-6"
                                            >
                                                <div className="flex items-center gap-2 mb-2 px-2">
                                                    <ShieldAlert size={18} className="text-amber-500" />
                                                    <h3 className="text-sm font-bold text-slate-800 uppercase ">Return Item Configuration</h3>
                                                </div>

                                                {formData.selectedItems.map((item, idx) => (
                                                    <VCard key={item.sku} className="p-6 border-slate-200 shadow-lg relative overflow-hidden group bg-white">
                                                        <div className="absolute top-0 right-0 p-8 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                                                            <Package size={140} />
                                                        </div>

                                                        <div className="flex flex-col md:flex-row gap-4 relative z-10">
                                                            {/* Item Header & Qty */}
                                                            <div className="md:w-1/3 space-y-5">
                                                                <div className="flex items-start gap-3">
                                                                    <div className="w-10 h-10 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center shrink-0">
                                                                        <span className="text-[12px] font-bold">{idx + 1}</span>
                                                                    </div>
                                                                    <div>
                                                                        <h4 className="text-[14px] font-bold text-slate-800 leading-tight">{item.name}</h4>
                                                                        <p className="text-[10px] font-bold text-slate-400 uppercase  mt-1">Price: ₹{item.price} / unit</p>
                                                                    </div>
                                                                </div>

                                                                <div>
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase  mb-2 block">Return Quantity *</label>
                                                                    <div className="flex items-center gap-3">
                                                                        <button
                                                                            onClick={() => updateItemField(item.sku, 'qty', Math.max(1, item.qty - 1))}
                                                                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-extrabold hover:bg-slate-50 transition-all shadow-sm"
                                                                        >
                                                                            -
                                                                        </button>
                                                                        <input
                                                                            type="number"
                                                                            className="w-20 text-center bg-slate-50 border border-slate-200 rounded-xl py-2 text-xs font-bold outline-none"
                                                                            value={item.qty}
                                                                            onChange={(e) => updateItemField(item.sku, 'qty', parseInt(e.target.value) || 0)}
                                                                        />
                                                                        <button
                                                                            onClick={() => updateItemField(item.sku, 'qty', Math.min(item.received, item.qty + 1))}
                                                                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-extrabold hover:bg-slate-50 transition-all shadow-sm"
                                                                        >
                                                                            +
                                                                        </button>
                                                                    </div>
                                                                    <p className={`text-[9px] font-bold mt-2 ml-1 ${item.qty > item.received ? 'text-rose-500' : 'text-slate-400'}`}>
                                                                        Max allowed: {item.received} Units
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Reason & Sub-reason */}
                                                            <div className="flex-1 space-y-5">
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                    <div>
                                                                        <label className="text-[9px] font-bold text-slate-500 uppercase  mb-2 block">Return Reason *</label>
                                                                        <select
                                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold focus:bg-white focus:border-green-500 outline-none transition-all shadow-sm"
                                                                            value={item.reason}
                                                                            onChange={(e) => updateItemField(item.sku, 'reason', e.target.value)}
                                                                        >
                                                                            <option value="">Select reason...</option>
                                                                            {RETURN_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                                                        </select>
                                                                    </div>

                                                                    {/* Sub-reason (Conditional) */}
                                                                    {(item.reason === 'Quality Defect' || item.reason === 'Packaging Issue') && (
                                                                        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}>
                                                                            <label className="text-[9px] font-bold text-slate-500 uppercase  mb-2 block">Sub-Reason *</label>
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Describe the issue..."
                                                                                maxLength={200}
                                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold focus:bg-white focus:border-green-500 outline-none transition-all shadow-sm"
                                                                                value={item.subReason}
                                                                                onChange={(e) => updateItemField(item.sku, 'subReason', e.target.value)}
                                                                            />
                                                                        </motion.div>
                                                                    )}
                                                                </div>

                                                                {/* Photos Upload (Conditional Requirement) */}
                                                                <div>
                                                                    <div className="flex justify-between items-center mb-2">
                                                                        <label className="text-[9px] font-bold text-slate-500 uppercase  block">
                                                                            Photos {(item.reason === 'Damage in Transit' || item.reason === 'Quality Defect') && <span className="text-rose-500">*</span>}
                                                                        </label>
                                                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Min 1 for Damage/Quality returns</span>
                                                                    </div>

                                                                    <div className="flex flex-wrap gap-3">
                                                                        {item.photos.map((p, pIdx) => (
                                                                            <div key={pIdx} className="w-16 h-16 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center relative group">
                                                                                <Camera size={20} className="text-slate-400" />
                                                                                <button
                                                                                    onClick={() => {
                                                                                        const newPhotos = [...item.photos];
                                                                                        newPhotos.splice(pIdx, 1);
                                                                                        updateItemField(item.sku, 'photos', newPhotos);
                                                                                    }}
                                                                                    className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                >
                                                                                    <Trash2 size={10} />
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                        {item.photos.length < 10 && (
                                                                            <button
                                                                                onClick={() => updateItemField(item.sku, 'photos', [...item.photos, 'photo_url'])}
                                                                                className="w-16 h-16 bg-green-50 border-2 border-dashed border-green-200 rounded-xl flex flex-col items-center justify-center text-green-500 hover:bg-green-100 transition-all gap-1"
                                                                            >
                                                                                <Upload size={16} />
                                                                                <span className="text-[8px] font-bold uppercase">Add</span>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Financial Impact per item */}
                                                        <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <DollarSign size={14} className="text-green-500" />
                                                                <span className="text-[11px] font-bold text-slate-500 uppercase">Estimated Return Value:</span>
                                                                <span className="text-[14px] font-bold text-slate-900">₹{(item.qty * item.price).toLocaleString()}</span>
                                                            </div>
                                                            <button
                                                                onClick={() => handleItemToggle(item)}
                                                                className="text-[10px] font-bold text-rose-500 hover:text-rose-700 uppercase  flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-all"
                                                            >
                                                                <Trash2 size={12} /> Remove Item
                                                            </button>
                                                        </div>
                                                    </VCard>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </>
                            )}
                        </div>

                        {/* RIGHT: SUMMARY & STATUS SECTION */}
                        {view === 'initiate' && (
                            <div className="lg:col-span-4">
                                <div className="sticky top-[100px] space-y-4">
                                    {/* SUMMARY CARD */}
                                    {view === 'initiate' && (
                                        <VCard className="p-5 border-slate-200 bg-white shadow-xl overflow-hidden">
                                            <div className="flex items-center gap-2 mb-4">
                                                <div className="p-1.5 bg-green-50 text-green-800 border border-green-200 shadow-sm rounded-lg">
                                                    <RefreshCw size={16} />
                                                </div>
                                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">RTV Summary</h3>
                                            </div>

                                            <div className="space-y-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="p-3 bg-white rounded-xl border border-green-50/50 shadow-sm">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Total Items</span>
                                                        <span className="text-base font-bold text-slate-800">{formData.selectedItems.length}</span>
                                                    </div>
                                                    <div className="p-3 bg-white rounded-xl border border-green-50/50 shadow-sm">
                                                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Total Qty</span>
                                                        <span className="text-base font-bold text-slate-800">
                                                            {formData.selectedItems.reduce((acc, i) => acc + i.qty, 0)} <span className="text-[10px] font-medium text-slate-400">U</span>
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-900 shadow-sm relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-16 h-16 bg-green-50 rounded-full -mr-8 -mt-8 blur-2xl opacity-50"></div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Debit Note Amount</span>
                                                    <div className="text-3xl font-bold tracking-tight mt-1 text-slate-800">₹{calculateTotalDebit().toLocaleString()}</div>
                                                    <div className="mt-3 flex items-center gap-1.5 text-[8px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg w-fit">
                                                        <ShieldCheck size={10} /> AUTO-CALCULATED
                                                    </div>
                                                </div>

                                                {/* Preference */}
                                                <div className="pt-3 border-t border-green-100/50">
                                                    <label className="text-[9px] font-bold text-slate-500 uppercase mb-2 block">Settlement Preference</label>
                                                    <div className="flex flex-col gap-1.5">
                                                        {['Debit Note from vendor', 'Credit Note adjustment'].map(opt => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => setFormData({ ...formData, creditNotePreference: opt })}
                                                                className={`w-full px-3 py-2.5 rounded-xl border flex items-center gap-3 transition-all ${formData.creditNotePreference === opt
                                                                    ? 'bg-green-50 text-green-800 border-green-200 shadow-sm'
                                                                    : 'bg-white border-slate-100 text-slate-500 hover:border-green-200'
                                                                    }`}
                                                            >
                                                                <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${formData.creditNotePreference === opt ? 'border-white' : 'border-slate-200'}`}>
                                                                    {formData.creditNotePreference === opt && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                                </div>
                                                                <span className="text-[10px] font-bold uppercase">{opt}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <PrimaryBtn
                                                    className="w-full !py-3.5 mt-2 shadow-xl shadow-green-100"
                                                    icon={<Send size={16} />}
                                                    onClick={handleSubmit}
                                                >
                                                    Raise Return & Debit Note
                                                </PrimaryBtn>
                                            </div>
                                        </VCard>
                                    )}
                                    {/* PIPELINE STATUS (Conditional) */}
                                    <AnimatePresence>
                                        {showPipeline && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: 10 }}
                                            >
                                                <VCard className="p-5 border-slate-200 shadow-xl overflow-hidden bg-white/80 backdrop-blur-sm">
                                                    <div className="flex flex-col gap-3 mb-5 border-b border-slate-100 pb-3">
                                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            Return Lifecycle
                                                        </h3>

                                                        {/* RTV Selector Dropdown */}
                                                        <div>
                                                            <label className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Select Return to Track</label>
                                                            <select
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] font-bold outline-none"
                                                                value={selectedRtvForTracking ? selectedRtvForTracking.id : ''}
                                                                onChange={(e) => {
                                                                    const match = rtvs.find(r => r.id === e.target.value);
                                                                    if (match) setSelectedRtvForTracking(match);
                                                                }}
                                                            >
                                                                {rtvs.length > 0 ? rtvs.map(r => (
                                                                    <option key={r.id} value={r.id}>
                                                                        {r.rtvNumber} ({r.vendorName} - ₹{r.totalReturnValue})
                                                                    </option>
                                                                )) : (
                                                                    <option value="">No Active Returns Found</option>
                                                                )}
                                                            </select>
                                                        </div>
                                                    </div>

                                                    {selectedRtvForTracking ? (
                                                        <div className="space-y-5 relative">
                                                            {/* Vertical Line */}
                                                            <div className="absolute left-[13px] top-2 bottom-2 w-[1px] bg-slate-100 z-0"></div>

                                                            {PIPELINE_STATES.map((state, sIdx) => {
                                                                const curIndex = PIPELINE_STATES.findIndex(st => st.id === selectedRtvForTracking.status);
                                                                const isActive = state.id === selectedRtvForTracking.status;
                                                                const isCompleted = PIPELINE_STATES.findIndex(st => st.id === state.id) < curIndex;

                                                                return (
                                                                    <div key={state.id} className="relative z-10 flex gap-4 group">
                                                                        <div className={`w-7 h-7 rounded-full border-2 shadow-sm flex items-center justify-center shrink-0 transition-all ${isActive ? 'bg-green-50 text-green-800 border-green-200 scale-110 shadow-green-100' : isCompleted ? 'bg-emerald-500 border-white text-white' : 'bg-slate-50 border-white'
                                                                            }`}>
                                                                            {isActive ? <RefreshCw size={10} className="text-white animate-spin" /> :
                                                                                isCompleted ? <CheckCircle size={12} className="text-white" /> :
                                                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />}
                                                                        </div>
                                                                        <div>
                                                                            <h4 className={`text-[11px] font-bold leading-none mb-1 uppercase tracking-tight ${isActive ? 'text-green-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                                                                                }`}>
                                                                                {state.label}
                                                                            </h4>
                                                                            <p className="text-[9px] font-medium text-slate-400 leading-tight">
                                                                                {state.desc}
                                                                            </p>
                                                                            {isActive && (
                                                                                <div className="mt-2 inline-flex items-center gap-1.5 text-[8px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase border border-green-100">
                                                                                    Current Phase
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}

                                                            {/* SLA/Dispute Live Action Center */}
                                                            <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                                                                <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-tight">SLA Interactive Control Center</h4>

                                                                {selectedRtvForTracking.disputeNote && (
                                                                    <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[10px] font-medium mb-2">
                                                                        <strong className="block text-[8px] font-bold uppercase tracking-wider text-rose-500 mb-1">Dispute Thread:</strong>
                                                                        "{selectedRtvForTracking.disputeNote}"
                                                                    </div>
                                                                )}

                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {selectedRtvForTracking.status === 'DEBIT_NOTE_RAISED' && (
                                                                        <button
                                                                            onClick={() => handleUpdateStatus('VENDOR_NOTIFIED')}
                                                                            className="px-2 py-2 bg-green-50 text-green-600 hover:bg-green-100 transition-all rounded-lg text-[9px] font-bold uppercase border border-green-100"
                                                                        >
                                                                            Acknowledge SLA
                                                                        </button>
                                                                    )}
                                                                    {selectedRtvForTracking.status === 'VENDOR_NOTIFIED' && (
                                                                        <button
                                                                            onClick={() => handleUpdateStatus('SHIPPED_BACK')}
                                                                            className="px-2 py-2 bg-purple-50 text-purple-600 hover:bg-purple-100 transition-all rounded-lg text-[9px] font-bold uppercase border border-purple-100"
                                                                        >
                                                                            Dispatch Shipment
                                                                        </button>
                                                                    )}
                                                                    {['DEBIT_NOTE_RAISED', 'VENDOR_NOTIFIED', 'SHIPPED_BACK'].includes(selectedRtvForTracking.status) && (
                                                                        <div className="col-span-2 space-y-2 mt-1">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Dispute reason..."
                                                                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-[10px] outline-none font-medium"
                                                                                value={disputeInput}
                                                                                onChange={(e) => setDisputeInput(e.target.value)}
                                                                            />
                                                                            <button
                                                                                onClick={() => {
                                                                                    if (!disputeInput.trim()) return toast.error('Enter dispute reason');
                                                                                    handleUpdateStatus('DISPUTED', disputeInput);
                                                                                }}
                                                                                className="w-full px-2 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all rounded-lg text-[9px] font-bold uppercase border border-rose-100"
                                                                            >
                                                                                Raise Dispute
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                    {['DISPUTED', 'SHIPPED_BACK', 'VENDOR_NOTIFIED'].includes(selectedRtvForTracking.status) && (
                                                                        <button
                                                                            onClick={() => handleUpdateStatus('RESOLVED')}
                                                                            className="col-span-1 px-2 py-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all rounded-lg text-[9px] font-bold uppercase border border-emerald-100"
                                                                        >
                                                                            Accept & Close
                                                                        </button>
                                                                    )}
                                                                    {['DISPUTED', 'SHIPPED_BACK'].includes(selectedRtvForTracking.status) && (
                                                                        <button
                                                                            onClick={() => handleUpdateStatus('FORCE_CLOSED')}
                                                                            className="col-span-1 px-2 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all rounded-lg text-[9px] font-bold uppercase border border-slate-200"
                                                                        >
                                                                            Force Close
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <p className="text-[10px] font-bold text-slate-400 text-center uppercase py-5">
                                                            No Return Selected
                                                        </p>
                                                    )}
                                                </VCard>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Dispute Management Widget */}
            <div className="max-w-[1600px] mx-auto px-6 lg:px-10 mt-10">
                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h4 className="text-[15px] font-bold text-slate-900 uppercase">Automated Dispute Management</h4>
                            <p className="text-[11px] font-bold text-slate-500 mt-0.5">Disputes raised by vendors are auto-routed to regional category managers for 24h resolution.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <SecondaryBtn small onClick={() => toast('No active disputes for this return yet.', { icon: '🧵' })}>View Dispute Thread</SecondaryBtn>
                        <PrimaryBtn small icon={<MessageSquare size={14} />} onClick={() => navigate('/vendors/whatsapp')}>Contact Vendor</PrimaryBtn>
                    </div>
                </div>
            </div>

            {/* RTV DETAILS & TIMELINE MODAL */}
            <VModal
                open={showDetailsModal}
                onClose={() => {
                    setShowDetailsModal(false);
                    setSelectedRtvForDetails(null);
                }}
                title={selectedRtvForDetails ? `Return Request: ${selectedRtvForDetails.rtvNumber}` : 'Return Claim Details'}
                width="max-w-4xl"
            >
                {selectedRtvForDetails && (
                    <div className="space-y-6 animate-in fade-in duration-200">

                        {/* Status Warning Banner (if disputed) */}
                        {selectedRtvForDetails.status === 'DISPUTED' && (
                            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex gap-3 items-start animate-in slide-in-from-top-4 duration-300">
                                <ShieldAlert className="text-rose-500 shrink-0 mt-0.5 animate-bounce" size={18} />
                                <div className="flex-1">
                                    <h5 className="text-[11px] font-bold text-rose-700 uppercase tracking-wide">Claim Disputed by Supplier</h5>
                                    <p className="text-[10px] font-medium text-rose-600 mt-1">
                                        "{selectedRtvForDetails.disputeNote || 'No dispute explanation provided.'}"
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        <button
                                            onClick={async () => {
                                                const res = await updateRTVStatus(selectedRtvForDetails.id, 'RESOLVED');
                                                const updated = res.data || res;
                                                setSelectedRtvForDetails(updated);
                                                await loadDynamicData();
                                                toast.success('Debit note accepted! Claim resolved successfully.');
                                            }}
                                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
                                        >
                                            Accept & Close
                                        </button>
                                        <button
                                            onClick={async () => {
                                                const res = await updateRTVStatus(selectedRtvForDetails.id, 'FORCE_CLOSED');
                                                const updated = res.data || res;
                                                setSelectedRtvForDetails(updated);
                                                await loadDynamicData();
                                                toast.success('Claim force closed successfully.');
                                            }}
                                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all"
                                        >
                                            Force Close (Override)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* General Meta Information Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Vendor Partner</span>
                                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                    <div className="w-4 h-4 rounded-full bg-green-50 border border-green-100 flex items-center justify-center text-green-600 text-[8px] font-black">
                                        {selectedRtvForDetails.vendorName ? selectedRtvForDetails.vendorName.charAt(0).toUpperCase() : 'V'}
                                    </div>
                                    {selectedRtvForDetails.vendorName || 'General Supplier'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Initiated Date</span>
                                <span className="text-xs font-bold text-slate-700">
                                    {selectedRtvForDetails.createdAt ? new Date(selectedRtvForDetails.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                </span>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Associated PO / GRN</span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-700">PO: {selectedRtvForDetails.purchaseOrderNumber || 'N/A'}</span>
                                    <span className="text-[9px] font-medium text-slate-400">GRN: {selectedRtvForDetails.grnNumber || 'N/A'}</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Claim Status</span>
                                <StatusBadge status={selectedRtvForDetails.status} size="xs" />
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Total Return Value</span>
                                <span className="text-xs font-bold text-slate-700">
                                    ₹{(selectedRtvForDetails.totalReturnValue || 0).toLocaleString()}
                                </span>
                            </div>
                            <div>
                                <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Created By</span>
                                <span className="text-xs font-bold text-slate-700">
                                    {selectedRtvForDetails.createdByName || 'System'}
                                </span>
                            </div>
                            {selectedRtvForDetails.resolvedAt && (
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Resolved At</span>
                                    <span className="text-xs font-bold text-slate-700">
                                        {new Date(selectedRtvForDetails.resolvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>
                            )}
                            {selectedRtvForDetails.shortageReportNumber && (
                                <div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Shortage Report</span>
                                    <span className="text-xs font-bold text-slate-700">
                                        {selectedRtvForDetails.shortageReportNumber}
                                    </span>
                                </div>
                            )}
                            {selectedRtvForDetails.disputeNote && selectedRtvForDetails.status !== 'DISPUTED' && (
                                <div className="col-span-2 md:col-span-4 mt-2">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Dispute Note</span>
                                    <span className="text-xs font-medium text-rose-600 bg-rose-50 px-3 py-2 rounded-lg inline-block border border-rose-100 w-full">
                                        {selectedRtvForDetails.disputeNote}
                                    </span>
                                </div>
                            )}
                        </div>



                        {/* Returned items detail registry from matching GRN */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Package size={14} className="text-green-500" /> Linked GRN Returned Line Items
                            </h4>

                            {(() => {
                                let returnItems = [];
                                // Use returnedProducts from the API response if available
                                if (selectedRtvForDetails.returnedProducts && selectedRtvForDetails.returnedProducts.length > 0) {
                                    returnItems = selectedRtvForDetails.returnedProducts.map(rp => ({
                                        sku: rp.productSku || rp.vendorProductSku || rp.vendorSku || rp.sku,
                                        name: rp.productName || rp.name || 'Unknown Product',
                                        qty: rp.quantity || rp.returnQuantity || rp.returnedQuantity || rp.qty || 0,
                                        reason: rp.reason || rp.returnReason || rp.disputeReason || 'General Return',
                                        price: rp.unitPrice || rp.price || 0,
                                        totalValue: rp.totalValue || (rp.unitPrice * (rp.returnQuantity || rp.returnedQuantity || rp.qty || 0)) || 0,
                                        batchNumber: rp.batchNumber || 'N/A',
                                        isRejected: true // Everything in this array is a returned product
                                    }));
                                } else {
                                    // Fallback to local storage or GRN derivation for backward compatibility
                                    const savedItemsKey = `rtv_items_${selectedRtvForDetails.rtvNumber}`;
                                    const savedItemsRaw = localStorage.getItem(savedItemsKey);

                                    if (savedItemsRaw) {
                                        const selectedMap = JSON.parse(savedItemsRaw);
                                        returnItems = selectedMap.map(item => ({
                                            ...item,
                                            isRejected: true
                                        }));
                                    } else {
                                        const matchedGrn = grns.find(g => g.id === selectedRtvForDetails.grnId);
                                        if (matchedGrn && matchedGrn.items && matchedGrn.items.length > 0) {
                                            const rejectedItems = matchedGrn.items.filter(item => item.rejected > 0);
                                            if (rejectedItems.length > 0) {
                                                returnItems = rejectedItems.map(item => ({
                                                    ...item,
                                                    qty: item.rejected,
                                                    reason: 'Damaged / Rejected at GRN',
                                                    isRejected: true
                                                }));
                                            } else {
                                                // Dynamically deduce return items from totalReturnValue
                                                const totalValue = selectedRtvForDetails.totalReturnValue || 0;
                                                if (totalValue > 0) {
                                                    const validItems = matchedGrn.items.filter(item => item.price > 0);
                                                    if (validItems.length === 1) {
                                                        const deducedQty = totalValue / validItems[0].price;
                                                        returnItems = [{
                                                            ...validItems[0],
                                                            qty: deducedQty,
                                                            reason: 'Damage in Transit',
                                                            isRejected: true
                                                        }];
                                                    } else {
                                                        const exactMatch = validItems.find(item => totalValue % item.price === 0 && (totalValue / item.price) <= item.received);
                                                        if (exactMatch) {
                                                            returnItems = [{
                                                                ...exactMatch,
                                                                qty: totalValue / exactMatch.price,
                                                                reason: 'Damage in Transit',
                                                                isRejected: true
                                                            }];
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }

                                return returnItems.length > 0 ? (
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 border-b border-slate-100">
                                                    <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">Item Description</th>
                                                    <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">SKU Code</th>
                                                    <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">Batch Number</th>
                                                    <th className="p-3 text-[10px] font-bold text-slate-400 uppercase text-center">Qty (Returned / Accepted)</th>
                                                    <th className="p-3 text-[10px] font-bold text-slate-400 uppercase text-center">Status</th>
                                                    <th className="p-3 text-[10px] font-bold text-slate-400 uppercase">Justification Reason</th>
                                                    <th className="p-3 text-[10px] font-bold text-slate-400 uppercase text-right">Unit Price</th>
                                                    <th className="p-3 text-[10px] font-bold text-slate-400 uppercase text-right">Total Value</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {returnItems.map(item => (
                                                    <tr key={item.sku} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-3 text-xs font-bold text-slate-700">{item.name}</td>
                                                        <td className="p-3 text-xs font-semibold text-slate-500 font-mono">{item.sku}</td>
                                                        <td className="p-3 text-xs font-semibold text-slate-500 font-mono">{item.batchNumber || 'N/A'}</td>
                                                        <td className="p-3 text-xs font-bold text-slate-600 text-center">
                                                            <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${item.isRejected ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                                                {item.qty} Units
                                                            </span>
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            {item.isRejected ? (
                                                                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-full text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> RETURNED
                                                                </span>
                                                            ) : (
                                                                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[9px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ACCEPTED
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="p-3 text-xs font-semibold text-slate-500">{item.reason || 'General Return'}</td>
                                                        <td className="p-3 text-xs font-bold text-slate-800 text-right">₹{item.price.toLocaleString()}</td>
                                                        <td className="p-3 text-xs font-bold text-green-700 text-right">₹{(item.totalValue || (item.qty * item.price)).toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400 font-medium uppercase tracking-wider">
                                        No item details available for this GRN
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Interactive Decision Desk for Vendor Role */}
                        {['DEBIT_NOTE_RAISED', 'VENDOR_NOTIFIED', 'ACTIVE', 'active'].includes(selectedRtvForDetails.status) && (
                            <div className="mt-8 pt-6 border-t border-slate-100 bg-slate-50/40 rounded-3xl p-5 border border-slate-100">
                                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                    <ShieldCheck size={14} className="text-green-500" /> Vendor Portal Decision Desk
                                </h4>
                                <p className="text-[10px] font-bold text-slate-500 mb-5 uppercase tracking-tight">
                                    Please choose to accept the return debit note value (resolved) or deny the claim with an audit dispute explanation.
                                </p>

                                {!showDisputeInput ? (
                                    <div className="flex gap-3">
                                        <PrimaryBtn
                                            className="flex-1 !py-3"
                                            icon={<CheckCircle size={16} />}
                                            onClick={async () => {
                                                const res = await updateRTVStatus(selectedRtvForDetails.id, 'RESOLVED');
                                                const updated = res.data || res;
                                                setSelectedRtvForDetails(updated);
                                                await loadDynamicData();
                                                toast.success('Debit note accepted! Return claim successfully resolved.');
                                            }}
                                        >
                                            Accept Return & Debit
                                        </PrimaryBtn>
                                        <button
                                            onClick={() => setShowDisputeInput(true)}
                                            className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-rose-100"
                                        >
                                            <XCircle size={16} /> Deny & Dispute Claim
                                        </button>
                                    </div>
                                ) : (
                                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-rose-50/50 border border-rose-100 rounded-2xl p-4 space-y-3">
                                        <label className="text-[9px] font-bold text-slate-600 uppercase block">Provide Dispute / Denial Reason *</label>
                                        <textarea
                                            value={disputeReason}
                                            onChange={(e) => setDisputeReason(e.target.value)}
                                            placeholder="Please explain in detail why you are denying this return..."
                                            className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs outline-none focus:border-rose-500 min-h-[80px]"
                                        />
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => setShowDisputeInput(false)}
                                                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-200 transition-all"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                onClick={async () => {
                                                    if (!disputeReason.trim()) return toast.error('Please enter a dispute reason');
                                                    const res = await updateRTVStatus(selectedRtvForDetails.id, 'DISPUTED', disputeReason);
                                                    const updated = res.data || res;
                                                    setSelectedRtvForDetails(updated);
                                                    await loadDynamicData();
                                                    setShowDisputeInput(false);
                                                    toast.success('Dispute raised successfully.');
                                                }}
                                                className="px-4 py-2 bg-rose-600 text-white rounded-lg text-[10px] font-bold uppercase hover:bg-rose-700 transition-all shadow-md shadow-rose-100"
                                            >
                                                Submit Dispute
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Warehouse Dispatcher override option for internal staff */}
                        {['VENDOR_NOTIFIED', 'DEBIT_NOTE_RAISED', 'ACTIVE', 'active'].includes(selectedRtvForDetails.status) && (
                            <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/20 p-4 rounded-2xl border border-slate-50">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">Warehouse Dispatch Desk</span>
                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Logistics Dispatch Controller</span>
                                </div>
                                <button
                                    onClick={async () => {
                                        const res = await updateRTVStatus(selectedRtvForDetails.id, 'SHIPPED_BACK');
                                        const updated = res.data || res;
                                        setSelectedRtvForDetails(updated);
                                        await loadDynamicData();
                                        toast.success('Goods marked as Shipped Back to vendor!');
                                    }}
                                    className="px-4 py-2 bg-green-50 hover:bg-green-100 text-green-600 border border-green-100 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all"
                                >
                                    Mark as Shipped Back
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </VModal>
        </div>
    );
}
