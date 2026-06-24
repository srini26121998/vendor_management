import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Calendar, Clock, Truck, User, Phone, Package, List,
    CheckCircle, XCircle, AlertCircle, QrCode, Scan,
    Thermometer, ShieldCheck, ShieldAlert, ArrowLeft,
    MoreHorizontal, ChevronRight, Save, Info,
    Zap, RefreshCw, Smartphone, Monitor, Shield,
    Lock, Camera, Search, Filter, Plus,
    BarChart3, Activity, Gauge, Sparkles, Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
    PageHeader, VCard, VendorBreadcrumb,
    PrimaryBtn, SecondaryBtn, VModal, VTable, VTabs,
    StatusBadge
} from '../Vendors/VendorComponents';
import TruckLoader from '../../components/Common/TruckLoader';
import SearchableSelect from '../../components/Common/SearchableSelect';
import useInboundStore from '../../store/useInboundStore';


const STORE_LIST = ['Warehouse Alpha - Mumbai', 'Distribution Center - Pune', 'Cold Storage - Surat', 'Express Hub - Navi Mumbai'];
const VEHICLE_TYPES = ['2-Wheeler', 'Light CV (<1T)', 'Medium CV (1-5T)', 'Heavy Truck (>5T)', 'Refrigerated', 'Container'];
const REJECTION_REASONS = ['Temperature Breach', 'Sensor Malfunction', 'Equipment Failure', 'Broken Seal', 'Unauthorized Entry'];

export default function InboundLogistics() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('scheduler'); // 'scheduler', 'receiving', 'iot'

    const fetchAppointments = useInboundStore(state => state.fetchAppointments);
    useEffect(() => {
        if (fetchAppointments) {
            fetchAppointments();
        }
    }, [fetchAppointments]);

    const tabs = [
        { key: 'scheduler', label: 'Dock Scheduler', icon: <Calendar size={16} /> },
        { key: 'receiving', label: 'Blind Receiving', icon: <Package size={16} /> },
        { key: 'iot', label: 'Cold-Chain IoT', icon: <Activity size={16} /> }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-6" style={{ fontFamily: '"Inter", sans-serif' }}>
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
                                <h1 className="text-[18px] font-bold text-slate-800 tracking-tight">Inbound Logistics</h1>
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded-md border border-indigo-100 uppercase tracking-widest">v3.0</span>
                            </div>
                            <VendorBreadcrumb items={[{ label: 'Procurement', path: '/vendors/procurement/smart-po' }, { label: 'Logistics & Receiving' }]} />
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === tab.key
                                    ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                                    : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                                    }`}
                            >
                                {React.cloneElement(tab.icon, { size: 14 })}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto p-4 lg:p-6 space-y-6">
                <AnimatePresence mode="wait">
                    {activeTab === 'scheduler' && <DockScheduler key="scheduler" />}
                    {activeTab === 'receiving' && <BlindReceiving key="receiving" />}
                    {activeTab === 'iot' && <IoTTempMonitor key="iot" />}
                </AnimatePresence>

                {/* Validation Scenarios Widget - Bottom Sticky */}
                <div className="mt-12 pt-8 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Sparkles size={18} className="text-indigo-500" />
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Screen Validation Scenarios</h3>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase ">Select a scenario to test real-time UI response</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <ScenarioCard
                            title="Gate: Unauthorized Vehicle"
                            desc="Triggers a 'DENY' response at the guard gate with reasons."
                            onClick={() => {
                                setActiveTab('scheduler');
                                setTimeout(() => {
                                    triggerScenario('GATE_DENY');
                                    toast.error('Scenario Triggered: Unauthorized Entry');
                                }, 100);
                            }}
                            icon={<ShieldAlert className="text-rose-500" />}
                        />
                        <ScenarioCard
                            title="Receiving: Item Shortage"
                            desc="Auto-flags GRN discrepancy and requests supervisor PIN."
                            onClick={() => {
                                setActiveTab('receiving');
                                setTimeout(() => {
                                    try {
                                        window.dispatchEvent(new window.CustomEvent('triggerScenario', { detail: 'SHORTAGE_ALERT' }));
                                    } catch (e) {
                                        console.warn('CustomEvent failed:', e);
                                        const event = new window.Event('triggerScenario');
                                        event.detail = 'SHORTAGE_ALERT';
                                        window.dispatchEvent(event);
                                    }
                                    toast.error('Scenario Triggered: Shortage Detected');
                                }, 100);
                            }}
                            icon={<AlertCircle className="text-amber-500" />}
                        />
                        <ScenarioCard
                            title="IoT: Temperature Breach"
                            desc="Spikes temp to 8.5°C and starts auto-rejection timer."
                            onClick={() => {
                                setActiveTab('iot');
                                setTimeout(() => {
                                    try {
                                        window.dispatchEvent(new window.CustomEvent('triggerScenario', { detail: 'TEMP_BREACH' }));
                                    } catch (e) {
                                        console.warn('CustomEvent failed:', e);
                                        const event = new window.Event('triggerScenario');
                                        event.detail = 'TEMP_BREACH';
                                        window.dispatchEvent(event);
                                    }
                                    toast.error('Scenario Triggered: IoT Breach');
                                }, 100);
                            }}
                            icon={<Thermometer className="text-rose-500" />}
                        />
                        <ScenarioCard
                            title="System: Audit Override"
                            desc="Simulates a senior auth override for compliance logs."
                            onClick={() => {
                                setActiveTab('iot'); setTimeout(() => {
                                    try {
                                        window.dispatchEvent(new window.CustomEvent('triggerScenario', { detail: 'AUDIT_OVERRIDE' }));
                                    } catch (e) {
                                        console.warn('CustomEvent failed:', e);
                                        const event = new window.Event('triggerScenario');
                                        event.detail = 'AUDIT_OVERRIDE';
                                        window.dispatchEvent(event);
                                    }
                                    toast.success('Scenario Triggered: Manager Override');
                                }, 100);
                            }}
                            icon={<Lock className="text-blue-500" />}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ScenarioCard({ title, desc, onClick, icon }) {
    return (
        <button
            onClick={onClick}
            className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-2xl text-left hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-50 transition-all group"
        >
            <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                {icon}
            </div>
            <div>
                <h4 className="text-[12px] font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">{title}</h4>
                <p className="text-[10px] font-medium text-slate-400 mt-1 leading-relaxed">{desc}</p>
            </div>
        </button>
    );
}

// --- 3.1 DOCK APPOINTMENT SCHEDULER ---
function DockScheduler() {
    const [view, setView] = useState('booking'); // 'booking', 'gate'
    const [formData, setFormData] = useState({
        vendorName: '',
        store: '',
        date: '',
        slot: '',
        dockType: '', // Added dock type
        vehicleType: '',
        vehicleReg: '',
        driverName: '',
        driverMobile: '',
        estLoad: '',
        poNumbers: 'PO-99281-00',
        specialReq: ''
    });
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [appointmentId, setAppointmentId] = useState('');
    const [availablePOs, setAvailablePOs] = useState([]);
    const [availableVendors, setAvailableVendors] = useState([]);

    const bookSlot = useInboundStore(state => state.bookSlot);
    const appointments = useInboundStore(state => state.appointments);

    useEffect(() => {
        const handler = (e) => {
            if (e.detail === 'GATE_DENY') {
                setView('gate');
                setFormData(prev => ({ ...prev, vehicleReg: 'MH 99 XX 0000' }));
            }
        };
        window.addEventListener('triggerScenario', handler);
        return () => window.removeEventListener('triggerScenario', handler);
    }, []);

    useEffect(() => {
        // Dynamically load available Purchase Orders and Vendors
        const loadData = async () => {
            try {
                const { fetchPurchaseOrders, fetchVendors } = await import('../../api/vendorService');
                const poRes = await fetchPurchaseOrders();
                const pos = Array.isArray(poRes) ? poRes : poRes?.data || [];
                
                if (pos.length > 0) {
                    setAvailablePOs(pos.map(p => ({ id: p.id, name: p.invoiceNumber ? `${p.invoiceNumber} (${p.partyName})` : (p.label || p.id) })));
                } else {
                    setAvailablePOs([
                        { id: 'PO-202606-001', name: 'PO-202606-001 (Global Supplies Ltd.)' },
                        { id: 'PO-202606-002', name: 'PO-202606-002 (Fresh Farms Inc.)' },
                        { id: 'PO-99281-00', name: 'PO-99281-00 (Local Distributor)' },
                        { id: 'PO-44582-12', name: 'PO-44582-12 (Warehouse Beta)' }
                    ]);
                }

                const vendRes = await fetchVendors();
                const vends = Array.isArray(vendRes) ? vendRes : vendRes?.data || [];
                if (vends.length > 0) {
                    setAvailableVendors(vends.map(v => ({ id: v.id || v.vendorName || v.vendorCode, name: v.legalName || v.vendorName || v.companyName || v.name })));
                } else {
                    setAvailableVendors([
                        { id: 'Global Supplies Ltd. (V-8820)', name: 'Global Supplies Ltd. (V-8820)' },
                        { id: 'Fresh Farms Inc. (V-9011)', name: 'Fresh Farms Inc. (V-9011)' }
                    ]);
                }

            } catch (err) {
                setAvailablePOs([
                    { id: 'PO-202606-001', name: 'PO-202606-001 (Global Supplies Ltd.)' },
                    { id: 'PO-202606-002', name: 'PO-202606-002 (Fresh Farms Inc.)' },
                    { id: 'PO-99281-00', name: 'PO-99281-00 (Local Distributor)' },
                    { id: 'PO-44582-12', name: 'PO-44582-12 (Warehouse Beta)' }
                ]);
                setAvailableVendors([
                    { id: 'Global Supplies Ltd. (V-8820)', name: 'Global Supplies Ltd. (V-8820)' },
                    { id: 'Fresh Farms Inc. (V-9011)', name: 'Fresh Farms Inc. (V-9011)' }
                ]);
            }
        };
        loadData();
    }, []);

    const handleBooking = () => {
        if (!formData.store || !formData.date || !formData.slot || !formData.vehicleType || !formData.vehicleReg || !formData.driverName || !formData.driverMobile || !formData.dockType || !formData.poNumbers) {
            toast.error('Please fill all mandatory fields (*)');
            return;
        }
        const id = bookSlot(formData);
        setAppointmentId(id);
        setIsConfirmed(true);
        toast.success('Appointment Submitted for Approval!');
    };

    const handleDownloadPDF = () => {
        toast.success('Generating PDF Gate Pass...');
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument.write(`
            <html>
                <head>
                    <title>Gate Pass - ${appointmentId}</title>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 40px; }
                        .ticket { border: 2px dashed #ccc; padding: 40px; border-radius: 20px; display: inline-block; }
                        h1 { color: #333; margin-bottom: 5px; }
                        h2 { color: #666; margin-top: 0; font-size: 16px; }
                        .qr { width: 120px; height: 120px; margin: 30px auto; display: block; }
                        .details { text-align: left; margin-top: 30px; font-size: 14px; color: #444; line-height: 1.6; }
                    </style>
                </head>
                <body>
                    <div class="ticket">
                        <h1>CONFIRMED BOOKING</h1>
                        <h2>APPOINTMENT #${appointmentId}</h2>
                        <svg class="qr" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/></svg>
                        <p style="font-weight: bold; margin: 0; font-size: 12px; letter-spacing: 1px;">SCAN AT GUARD GATE</p>
                        <div class="details">
                            <div><strong>Store:</strong> ${formData.store}</div>
                            <div><strong>Date:</strong> ${formData.date}</div>
                            <div><strong>Slot:</strong> ${formData.slot}</div>
                            <div><strong>Vehicle:</strong> ${formData.vehicleReg}</div>
                        </div>
                    </div>
                </body>
            </html>
        `);
        iframe.contentDocument.close();
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[16px] font-bold text-slate-800">3.1 Dock Appointment Scheduler</h2>
                    <p className="text-[12px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Vendor self-service slot booking & gate validation</p>
                </div>
                <div className="flex items-center bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
                    <button
                        onClick={() => setView('calendar')}
                        className={`px-6 py-2 rounded-xl text-[11px] font-bold transition-all ${view === 'calendar' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        DOCK CALENDAR
                    </button>
                    <button
                        onClick={() => setView('booking')}
                        className={`px-6 py-2 rounded-xl text-[11px] font-bold transition-all ${view === 'booking' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        VENDOR BOOKING
                    </button>
                    <button
                        onClick={() => setView('my_bookings')}
                        className={`px-6 py-2 rounded-xl text-[11px] font-bold transition-all ${view === 'my_bookings' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        MY BOOKINGS
                    </button>
                    <button
                        onClick={() => setView('gate')}
                        className={`px-6 py-2 rounded-xl text-[11px] font-bold transition-all ${view === 'gate' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        GUARD GATE
                    </button>
                </div>
            </div>

            {view === 'calendar' ? (
                <DockCalendarView />
            ) : view === 'my_bookings' ? (
                <MyBookingsView />
            ) : view === 'booking' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Booking Form */}
                    <div className="lg:col-span-8">
                        <VCard className="p-4 shadow-lg border-slate-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] pointer-events-none">
                                <Calendar size={120} />
                            </div>

                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 uppercase tracking-tight">Vendor Booking Form</h3>
                                    <p className="text-[11px] font-bold text-slate-400 uppercase ">Submit details to reserve a receiving dock</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Vendor Name / ID</label>
                                    <SearchableSelect 
                                        options={availableVendors}
                                        value={formData.vendorName}
                                        onChange={(val) => setFormData({ ...formData, vendorName: val })}
                                        placeholder="Search vendor..."
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Store / Warehouse <span className="text-rose-500">*</span></label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                                        value={formData.store}
                                        onChange={(e) => setFormData({ ...formData, store: e.target.value })}
                                    >
                                        <option value="">Select delivery destination...</option>
                                        {STORE_LIST.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Delivery Date <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <Calendar size={16} className="absolute left-4 top-3.5 text-slate-400" />
                                        <input
                                            type="date"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-2 text-xs font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                                            value={formData.date}
                                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 mt-1.5 ml-1 italic">Min: Tomorrow; Max: 30 days ahead</p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase  mb-3 block">Preferred Time Slot <span className="text-rose-500">*</span></label>
                                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
                                        {['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00'].map(slot => {
                                            const isBooked = formData.date && formData.store && appointments.some(a => a.date === formData.date && a.store === formData.store && a.slot === slot);
                                            return (
                                                <button
                                                    key={slot}
                                                    type="button"
                                                    onClick={() => !isBooked && setFormData({ ...formData, slot })}
                                                    disabled={isBooked}
                                                    className={`py-2 rounded-xl border text-[10px] font-bold transition-all ${isBooked ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60' : formData.slot === slot ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white border-slate-100 text-slate-500 hover:border-blue-200 hover:bg-blue-50'}`}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-[9px] font-bold text-slate-400 mt-2 ml-1">Visual grid: Blue=Selected, White=Available, Grey=Booked, Red=Blocked</p>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Dock Number (Auto)</label>
                                    <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-500 italic">
                                        {formData.slot ? 'Dock #04 Assigned' : 'Auto-assigned on slot selection'}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Dock Type Required <span className="text-rose-500">*</span></label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                                        value={formData.dockType}
                                        onChange={(e) => setFormData({ ...formData, dockType: e.target.value })}
                                    >
                                        <option value="">Select dock type...</option>
                                        {['Ambient', 'Cold Storage', 'Dry Goods'].map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Vehicle Type <span className="text-rose-500">*</span></label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                                        value={formData.vehicleType}
                                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                                    >
                                        <option value="">Select vehicle type...</option>
                                        {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Vehicle Registration <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="MH 12 AB 1234"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:bg-white focus:border-blue-500 outline-none transition-all uppercase"
                                        value={formData.vehicleReg}
                                        onChange={(e) => setFormData({ ...formData, vehicleReg: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Driver Name <span className="text-rose-500">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Driver's full name..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                                        value={formData.driverName}
                                        onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Driver Mobile <span className="text-rose-500">*</span></label>
                                    <input
                                        type="tel"
                                        placeholder="+91 XXXXXXXXXX"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                                        value={formData.driverMobile}
                                        onChange={(e) => setFormData({ ...formData, driverMobile: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Estimated Load (KG)</label>
                                    <input
                                        type="number"
                                        placeholder="Approximate weight..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                                        value={formData.estLoad}
                                        onChange={(e) => setFormData({ ...formData, estLoad: e.target.value })}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">PO Numbers <span className="text-rose-500">*</span></label>
                                    <SearchableSelect 
                                        options={availablePOs}
                                        value={formData.poNumbers}
                                        onChange={(val) => setFormData({ ...formData, poNumbers: val })}
                                        placeholder="Search Purchase Order..."
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Special Requirements</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Cold storage bay needed, forklift required..."
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold focus:bg-white focus:border-blue-500 outline-none transition-all resize-none"
                                        value={formData.specialReq}
                                        onChange={(e) => setFormData({ ...formData, specialReq: e.target.value })}
                                    ></textarea>
                                </div>
                            </div>

                            <div className="mt-10 flex justify-end">
                                <PrimaryBtn onClick={handleBooking} icon={<CheckCircle size={18} />} className="!px-10 !py-4 shadow-lg shadow-blue-200">
                                    Submit Request
                                </PrimaryBtn>
                            </div>
                        </VCard>
                    </div>

                    {/* Confirmation Sidebar */}
                    <div className="lg:col-span-4">
                        <AnimatePresence>
                            {isConfirmed ? (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-6"
                                >
                                    <VCard className="p-6 border-emerald-100 bg-emerald-50/30 text-center shadow-lg">
                                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-sm">
                                            <CheckCircle size={32} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800">Booking Submitted</h3>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase mt-1">Appointment # {appointmentId}</p>

                                        <div className="mt-6 p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center">
                                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 mb-4">
                                                <QrCode size={120} className="text-slate-800" />
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-3">SCAN AT GUARD GATE</p>
                                            <SecondaryBtn small className="w-full" icon={<Save size={14} />} onClick={handleDownloadPDF}>Download PDF Gate Pass</SecondaryBtn>
                                        </div>

                                        <div className="mt-4 p-4 bg-white rounded-2xl border border-emerald-100 shadow-sm text-left">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
                                                <StatusBadge status="PENDING" size="xs" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">Confirmation Sent To</span>
                                                <span className="text-[11px] font-bold text-slate-700">email + mobile</span>
                                            </div>
                                        </div>
                                    </VCard>
                                </motion.div>
                            ) : (
                                <VCard className="p-6 border-dashed border-2 border-slate-200 bg-slate-50 flex flex-col items-center justify-center min-h-[400px] text-center">
                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                                        <QrCode size={24} />
                                    </div>
                                    <h4 className="text-sm font-bold text-slate-500 uppercase tracking-tight">Waiting for Selection</h4>
                                    <p className="text-[11px] font-bold text-slate-400 mt-1 uppercase max-w-[200px]">Complete the form to generate your appointment ID and QR code.</p>
                                </VCard>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            ) : (
                <GuardGateView />
            )}
        </motion.div>
    );
}

function DockCalendarView() {
    const appointments = useInboundStore(state => state.appointments);
    const [selectedAppt, setSelectedAppt] = useState(null);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <VCard className="p-6">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4">Dock Availability Heatmap</h3>
                    <div className="grid grid-cols-7 gap-2">
                        {Array.from({ length: 14 }).map((_, i) => {
                            const date = new Date();
                            date.setDate(date.getDate() + i);
                            const dateStr = date.toISOString().split('T')[0];
                            const bookings = appointments.filter(a => a.date === dateStr).length;
                            
                            const isHigh = bookings > 5;
                            const isMed = bookings > 2 && bookings <= 5;
                            const isLow = bookings > 0 && bookings <= 2;
                            
                            return (
                                <div key={i} className={`h-16 rounded-lg border flex flex-col items-center justify-center p-1 transition-all hover:scale-105 cursor-default shadow-sm
                                    ${isHigh ? 'bg-rose-100 border-rose-200' : 
                                      isMed ? 'bg-amber-100 border-amber-200' : 
                                      isLow ? 'bg-indigo-100 border-indigo-200' : 
                                      'bg-emerald-50 border-emerald-100'} `}>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                                    <span className={`text-sm font-black ${isHigh ? 'text-rose-600' : isMed ? 'text-amber-600' : isLow ? 'text-indigo-600' : 'text-emerald-600'}`}>{date.getDate()}</span>
                                    {bookings > 0 && <span className="text-[8px] font-bold text-slate-400 mt-0.5">{bookings} Appts</span>}
                                </div>
                            )
                        })}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-4 justify-center text-[10px] font-bold text-slate-500">
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-50 border border-emerald-100 rounded"></div> Open</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-indigo-100 border border-indigo-200 rounded"></div> Light</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-100 border border-amber-200 rounded"></div> Filling</div>
                        <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-100 border border-rose-200 rounded"></div> Full</div>
                    </div>
                </VCard>
                <VCard className="p-6 lg:col-span-2">
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4">Upcoming Appointments</h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                        {appointments.length === 0 ? (
                            <div className="text-center p-8 text-slate-400 text-sm font-bold border-2 border-dashed rounded-xl border-slate-200">
                                No appointments scheduled yet. Use Vendor Booking.
                            </div>
                        ) : appointments.map(appt => (
                            <div 
                                key={appt.id} 
                                onClick={() => setSelectedAppt(appt)}
                                className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-300 transition-all bg-white shadow-sm cursor-pointer hover:shadow-md"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                        <Truck size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800 uppercase">{appt.id}</p>
                                        <p className="text-[11px] font-bold text-slate-500">{appt.date} • {appt.slot} • {appt.vehicleReg}</p>
                                    </div>
                                </div>
                                <StatusBadge status={appt.status} />
                            </div>
                        ))}
                    </div>
                </VCard>
            </div>

            <VModal open={!!selectedAppt} onClose={() => setSelectedAppt(null)} title="Appointment Details">
                {selectedAppt && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">{selectedAppt.id}</h3>
                                <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">{selectedAppt.store}</p>
                            </div>
                            <StatusBadge status={selectedAppt.status} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Date & Time</p>
                                <p className="text-sm font-bold text-slate-700">{selectedAppt.date} <br/> {selectedAppt.slot}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Vehicle</p>
                                <p className="text-sm font-bold text-slate-700">{selectedAppt.vehicleReg} <br/> <span className="text-[11px] font-bold text-slate-500">{selectedAppt.vehicleType}</span></p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Driver Info</p>
                                <p className="text-sm font-bold text-slate-700">{selectedAppt.driverName} <br/> <span className="text-[11px] font-bold text-slate-500">{selectedAppt.driverMobile}</span></p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                <p className="text-[9px] font-bold text-slate-400 uppercase">Load & POs</p>
                                <p className="text-sm font-bold text-slate-700">{selectedAppt.estLoad ? `${selectedAppt.estLoad} KG` : 'N/A'} <br/> <span className="text-[11px] font-bold text-slate-500">PO: {selectedAppt.poNumbers || 'None'}</span></p>
                            </div>
                        </div>
                        {selectedAppt.specialReq && (
                            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                                <p className="text-[10px] font-bold text-amber-700 uppercase mb-1 flex items-center gap-1"><AlertCircle size={12}/> Special Requirements</p>
                                <p className="text-xs font-bold text-amber-900">{selectedAppt.specialReq}</p>
                            </div>
                        )}
                        <div className="pt-4 flex justify-end">
                            <SecondaryBtn onClick={() => setSelectedAppt(null)}>Close</SecondaryBtn>
                        </div>
                    </div>
                )}
            </VModal>
        </div>
    );
}

function GuardGateView() {
    const [view, setView] = useState('entry'); // 'entry', 'exit'
    const [scannedId, setScannedId] = useState('');
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState(null);
    const [vehicleReg, setVehicleReg] = useState('');
    const appointments = useInboundStore(state => state.appointments);
    const logGateEntry = useInboundStore(state => state.logGateEntry);
    const logGateExit = useInboundStore(state => state.logGateExit);

    useEffect(() => {
        const handler = (e) => {
            if (e.detail === 'GATE_DENY') {
                setView('entry');
                setScannedId('ERR-403');
                setScanResult('deny');
            }
        };
        window.addEventListener('triggerScenario', handler);
        return () => window.removeEventListener('triggerScenario', handler);
    }, []);

    const handleEntryScan = async () => {
        setIsScanning(true);
        try {
            // Force a fresh fetch from backend so we actually hit the API and get the latest status
            const { fetchDockAppointments } = await import('../../api/vendorService');
            const freshAppointments = await fetchDockAppointments();
            const freshAppts = Array.isArray(freshAppointments) ? freshAppointments : freshAppointments?.data || [];
            
            const appt = freshAppts.find(a => a.id === scannedId);
            setIsScanning(false);
            
            if (appt && appt.status === 'Confirmed') {
                setScanResult('allow');
                logGateEntry(appt.id);
                toast.success(`Access Granted! Proceed to Dock (Vehicle: ${appt.vehicleReg})`);
            } else if (appt && appt.status === 'Pending') {
                setScanResult('deny');
                toast.error('Access Denied: Appointment is still Pending Approval.');
            } else {
                setScanResult('deny');
                toast.error('Access Denied: Invalid or Expired Appointment ID');
            }
        } catch (error) {
            setIsScanning(false);
            setScanResult('deny');
            toast.error('Access Denied: Server Error');
        }
    };

    const handleExitScan = async () => {
        setIsScanning(true);
        try {
            // Force a fresh fetch from backend
            const { fetchDockAppointments } = await import('../../api/vendorService');
            const freshAppointments = await fetchDockAppointments();
            const freshAppts = Array.isArray(freshAppointments) ? freshAppointments : freshAppointments?.data || [];
            
            setIsScanning(false);
            
            // Allow searching by either vehicle registration OR appointment ID
            const appt = freshAppts.find(a => 
                (a.vehicleReg.toLowerCase() === vehicleReg.toLowerCase() || a.id === vehicleReg) && 
                ['CHECKED_IN', 'Received', 'Rejected', 'Arrived', 'GATE_DENY'].includes(a.status)
            );
            
            if (appt) {
                if(appt.status === 'Arrived' || appt.status === 'CHECKED_IN') {
                    setScanResult('deny');
                    toast.error('Warning: Vehicle has not completed receiving process! Cannot exit.');
                } else {
                    setScanResult('allow');
                    logGateExit(appt.id);
                    toast.success('Exit Logged. Gate pass closed.');
                }
            } else {
                setScanResult('deny');
                toast.error('No valid active entry found for this vehicle ready for exit.');
            }
        } catch (err) {
            setIsScanning(false);
            setScanResult('deny');
            toast.error('Access Denied: Server Error');
        }
    };

    const activeVehicles = appointments.filter(a => a.status === 'Arrived');

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <div className="flex justify-center gap-4 mb-6">
                    <button onClick={() => { setView('entry'); setScanResult(null); setScannedId(''); }} className={`px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${view === 'entry' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200 shadow-sm'}`}>Vehicle Entry</button>
                    <button onClick={() => { setView('exit'); setScanResult(null); setVehicleReg(''); }} className={`px-6 py-2 rounded-full text-xs font-bold uppercase transition-all ${view === 'exit' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-200 shadow-sm'}`}>Vehicle Exit</button>
                </div>
            <VCard className={`p-10 shadow-2xl transition-all duration-500 border-2 ${scanResult === 'allow' ? 'bg-emerald-50 border-emerald-200' : scanResult === 'deny' ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
                <div className="text-center mb-10">
                    <h3 className={`text-xl font-bold uppercase ${scanResult ? 'text-slate-800' : 'text-slate-700'}`}>{view === 'entry' ? 'Vehicle Entry Validation' : 'Vehicle Exit Logging'}</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider">{view === 'entry' ? 'Cross-check vs booked slot' : 'Confirm goods loaded/unloaded & exit'}</p>
                </div>

                <div className="max-w-md mx-auto bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 opacity-50"></div>

                    <div className="relative z-10 space-y-6">
                        <div className="text-center">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4 block">{view === 'entry' ? 'SCAN / ENTER APPOINTMENT ID' : 'ENTER VEHICLE PLATE NUMBER'}</label>
                            <div className="relative group">
                                <Scan className={`absolute left-4 top-1/2 -translate-y-1/2 ${isScanning ? 'text-blue-500 animate-pulse' : 'text-slate-300'}`} size={20} />
                                {view === 'entry' ? (
                                    <input
                                        type="text"
                                        placeholder="Scan or enter DA-XXXX..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-[13px] font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all uppercase"
                                        value={scannedId}
                                        onChange={(e) => setScannedId(e.target.value)}
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        placeholder="Enter Vehicle Plate..."
                                        className="w-full bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 py-4 text-[13px] font-bold focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 outline-none transition-all uppercase"
                                        value={vehicleReg}
                                        onChange={(e) => setVehicleReg(e.target.value)}
                                    />
                                )}
                            </div>
                        </div>

                        {isScanning ? (
                            <div className="py-4">
                                <TruckLoader message={view === 'entry' ? "Verifying Booking..." : "Verifying Entry Record..."} />
                            </div>
                        ) : (
                            <>
                                <PrimaryBtn
                                    onClick={view === 'entry' ? handleEntryScan : handleExitScan}
                                    disabled={view === 'entry' ? !scannedId : !vehicleReg}
                                    className={`w-full !py-5 !rounded-2xl shadow-xl transition-all ${isScanning ? 'opacity-70' : ''}`}
                                    icon={<Camera size={18} />}
                                >
                                    {view === 'entry' ? 'VALIDATE ENTRY' : 'LOG EXIT'}
                                </PrimaryBtn>

                                <div className="pt-6 border-t border-slate-100 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase">Timestamp</span>
                                        <span className="text-[11px] font-bold text-slate-700 uppercase">{scanResult === 'allow' ? new Date().toLocaleTimeString() : '--:--:--'}</span>
                                    </div>
                                    {scanResult === 'deny' && (
                                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                                            <AlertCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-[10px] font-bold text-rose-900 uppercase">Deny Reason</p>
                                                <p className="text-[11px] font-bold text-rose-600 mt-0.5">{view === 'entry' ? 'No scheduled appointment found for this ID.' : 'Vehicle not checked-in or already exited.'}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {scanResult && (
                    <div className="mt-8 text-center">
                        <div className={`text-4xl font-extrabold tracking-[0.3em] uppercase animate-pulse ${scanResult === 'allow' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {scanResult === 'allow' ? (view === 'entry' ? 'ALLOW ENTRY' : 'ALLOW EXIT') : 'DENY'}
                        </div>
                        {scanResult === 'allow' && <p className="mt-2 text-sm font-bold text-emerald-700 uppercase">{view === 'entry' ? 'Gate pass issued. Open Gate.' : 'Dwell time logged. Close gate event.'}</p>}
                    </div>
                )}
            </VCard>
            </div>

            {/* Active Vehicles Sidebar */}
            <div className="lg:col-span-1">
                <VCard className="p-6 h-full border-blue-100 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Currently Inside</h3>
                        <div className="px-2 py-1 bg-blue-100 text-blue-700 text-[10px] font-bold rounded-full">{activeVehicles.length} Vehicles</div>
                    </div>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                        {activeVehicles.length === 0 ? (
                            <div className="text-center p-6 text-[11px] font-bold text-slate-400 uppercase border-2 border-dashed border-slate-200 rounded-xl">
                                No vehicles inside warehouse
                            </div>
                        ) : (
                            activeVehicles.map(veh => (
                                <div key={veh.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-blue-300 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-sm font-bold text-slate-800 uppercase">{veh.vehicleReg}</p>
                                        <StatusBadge status={veh.status} size="xs" />
                                    </div>
                                    <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-500 uppercase">
                                        <div className="flex items-center justify-between">
                                            <span>PO:</span> <span className="text-slate-700">{veh.poNumbers || 'N/A'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Slot:</span> <span className="text-slate-700">{veh.slot}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </VCard>
            </div>
        </div>
    );
}

// --- 3.2 BLIND RECEIVING MOBILE INTERFACE ---
function BlindReceiving() {
    const [step, setStep] = useState('init'); // 'init', 'scanning', 'summary'
    const [poNumber, setPoNumber] = useState('');
    const [dock, setDock] = useState('');
    const [scannedItems, setScannedItems] = useState([]);
    const [remarks, setRemarks] = useState('');
    const [supervisorPin, setSupervisorPin] = useState('');
    const [activeApptId, setActiveApptId] = useState('');

    const appointments = useInboundStore(state => state.appointments);
    const saveReceivingLog = useInboundStore(state => state.saveReceivingLog);

    useEffect(() => {
        const handler = (e) => {
            if (e.detail === 'SHORTAGE_ALERT') {
                setStep('summary');
                setScannedItems(prev => prev.map(item => ({ ...item, scanned: item.expected - 5 })));
            }
        };
        window.addEventListener('triggerScenario', handler);
        return () => window.removeEventListener('triggerScenario', handler);
    }, []);

    const totalScanned = scannedItems.reduce((acc, item) => acc + item.scanned, 0);
    const totalExpected = scannedItems.reduce((acc, item) => acc + item.expected, 0);
    const hasDiscrepancy = totalScanned !== totalExpected;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
        >
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-[18px] font-bold text-slate-800">3.2 Blind Receiving</h2>
                    <p className="text-[10px] font-bold text-slate-500 uppercase ">Handheld/Tablet Interface</p>
                </div>
                <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-blue-600 flex items-center gap-1.5 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div> MOBILE SESSION
                </div>
            </div>

            <VCard noPad className="shadow-2xl border-slate-200 bg-[#F8FAFC] overflow-hidden flex flex-col min-h-[600px] rounded-[2.5rem] border-[12px] border-slate-200 relative">
                {/* Phone Status Bar */}
                <div className="bg-slate-100 h-6 flex justify-between items-center px-6 text-[10px] text-slate-400 font-bold">
                    <span>12:45</span>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-sm bg-slate-200"></div>
                        <div className="w-5 h-3 rounded-sm bg-emerald-500/50"></div>
                    </div>
                </div>

                {/* Header */}
                <div className="p-6 bg-white border-b border-slate-100 shadow-sm relative z-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                            <Smartphone size={20} />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-bold text-slate-800 uppercase tracking-tight">Receiving Session</h3>
                            <p className="text-[9px] font-bold text-slate-400 uppercase ">Logged: Staff #8842</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
                    {step === 'init' && (
                        <div className="space-y-4">
                            <SectionTitle>Session Initiation</SectionTitle>
                            <div className="space-y-4">
                                <div className="relative">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase  ml-1 mb-1.5 block">PO Number *</label>
                                    <div className="relative group">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Scan or enter PO #..."
                                            className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                            value={poNumber}
                                            onChange={(e) => setPoNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="relative">
                                    <label className="text-[9px] font-bold text-slate-400 uppercase  ml-1 mb-1.5 block">Dock / Receiving Bay *</label>
                                    <select
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none transition-all"
                                        value={dock}
                                        onChange={(e) => setDock(e.target.value)}
                                    >
                                        <option value="">Select bay number...</option>
                                        <option>DOCK-01 (AVAILABLE)</option>
                                        <option>DOCK-04 (ASSIGNED)</option>
                                        <option>DOCK-09 (AVAILABLE)</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase ">Staff ID</p>
                                        <p className="text-[11px] font-bold text-slate-700">ST-8842</p>
                                    </div>
                                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                        <p className="text-[8px] font-bold text-slate-400 uppercase ">Date/Time</p>
                                        <p className="text-[11px] font-bold text-slate-700">{new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <PrimaryBtn
                                    onClick={async () => {
                                    try {
                                        const { fetchDockAppointments, fetchPOById } = await import('../../api/vendorService');
                                        const freshAppointments = await fetchDockAppointments();
                                        const freshAppts = Array.isArray(freshAppointments) ? freshAppointments : freshAppointments?.data || [];
                                        
                                        const activeAppt = freshAppts.find(a => 
                                            (a.poNumbers?.includes(poNumber) || a.id === poNumber) && 
                                            ['Arrived', 'CHECKED_IN'].includes(a.status)
                                        );
                                        
                                        if (activeAppt) {
                                            setActiveApptId(activeAppt.id);
                                            
                                            // Fetch real PO items
                                            const poDetails = await fetchPOById(poNumber);
                                            const items = poDetails?.data?.items || poDetails?.items || [];
                                            
                                            if (items.length > 0) {
                                                setScannedItems(items.map((item, idx) => ({
                                                    id: item.id || idx,
                                                    name: item.productName || item.product?.name || 'Unknown Product',
                                                    uom: 'Units',
                                                    expected: Number(item.quantity || 0),
                                                    scanned: 0,
                                                    damaged: false,
                                                    rejected: false
                                                })));
                                            } else {
                                                // Fallback if PO has no items
                                                setScannedItems([
                                                    { id: 1, name: 'Premium Basmati Rice', uom: 'KG', expected: 100, scanned: 0, damaged: false, rejected: false },
                                                    { id: 2, name: 'Sona Masoori Rice', uom: 'KG', expected: 50, scanned: 0, damaged: false, rejected: false }
                                                ]);
                                            }
                                            
                                            setStep('scanning');
                                        } else if (poNumber === 'DEMO') {
                                            setActiveApptId('DEMO-123');
                                            setScannedItems([
                                                { id: 1, name: 'Premium Basmati Rice', uom: 'KG', expected: 100, scanned: 0, damaged: false, rejected: false },
                                                { id: 2, name: 'Sona Masoori Rice', uom: 'KG', expected: 50, scanned: 0, damaged: false, rejected: false }
                                            ]);
                                            setStep('scanning');
                                        } else {
                                            toast.error('No checked-in vehicle found for this PO/ID. Type "DEMO" to force start.');
                                        }
                                    } catch (err) {
                                        toast.error('Server error fetching appointments.');
                                    }
                                }}
                                    disabled={!poNumber || !dock}
                                    className="w-full !py-4 shadow-lg shadow-blue-100 mt-4"
                                    icon={<Play size={18} />}
                                >
                                    Start Scanning
                                </PrimaryBtn>
                            </div>
                        </div>
                    )}

                    {step === 'scanning' && (
                        <div className="space-y-4 pb-20">
                            <div className="flex items-center justify-between mb-2">
                                <SectionTitle>Item Scanning Interface</SectionTitle>
                                <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-0.5 rounded">Active</span>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] text-center space-y-4 shadow-sm">
                                <div 
                                    onClick={() => {
                                        toast.success('Barcode scanned successfully!');
                                        setScannedItems(prev => prev.map(i => ({...i, scanned: Math.min(i.expected, i.scanned + 10)})));
                                    }}
                                    className="w-full h-32 bg-white rounded-xl border border-slate-200 flex items-center justify-center relative overflow-hidden group cursor-pointer"
                                >
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 bg-rose-400 animate-[bounce_2s_infinite]"></div>
                                    <Camera size={32} className="text-slate-300 group-hover:text-blue-400 transition-colors" />
                                </div>
                                <p className="text-[9px] font-bold text-slate-400 uppercase ">Point camera at item barcode...</p>
                            </div>

                            <div className="space-y-3">
                                {scannedItems.map((item, idx) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="bg-white border border-slate-100 p-4 rounded-2xl shadow-sm space-y-3"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h4 className="text-[13px] font-bold text-slate-800 leading-tight">{item.name}</h4>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase  mt-0.5">{item.uom} | SKU #{item.id}42</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className={`p-1.5 rounded-lg border transition-all ${item.damaged ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                                                    onClick={() => {
                                                        const newItems = [...scannedItems];
                                                        newItems[idx].damaged = !newItems[idx].damaged;
                                                        setScannedItems(newItems);
                                                        if (newItems[idx].damaged) toast.error('Marked as Damaged');
                                                    }}
                                                    title="Damage Flag"
                                                >
                                                    <AlertCircle size={14} />
                                                </button>
                                                <button
                                                    className={`p-1.5 rounded-lg border transition-all ${item.rejected ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-100 text-slate-400'}`}
                                                    onClick={() => {
                                                        const newItems = [...scannedItems];
                                                        newItems[idx].rejected = !newItems[idx].rejected;
                                                        setScannedItems(newItems);
                                                        if (newItems[idx].rejected) toast.error('Marked for Rejection');
                                                    }}
                                                    title="Rejection Flag"
                                                >
                                                    <XCircle size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between bg-slate-50 p-2 rounded-xl border border-slate-100">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => {
                                                        const newItems = [...scannedItems];
                                                        if (newItems[idx].scanned > 0) newItems[idx].scanned--;
                                                        setScannedItems(newItems);
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-extrabold hover:bg-slate-100 transition-all shadow-sm"
                                                >
                                                    -
                                                </button>
                                                <div className="text-center min-w-[60px]">
                                                    <p className="text-[16px] font-bold text-slate-800 leading-none">{item.scanned}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase  mt-1">SCANNED</p>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newItems = [...scannedItems];
                                                        newItems[idx].scanned++;
                                                        setScannedItems(newItems);
                                                    }}
                                                    className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 font-extrabold hover:bg-slate-100 transition-all shadow-sm"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[12px] font-bold text-slate-400">PO: {item.expected}</p>
                                                <div className={`text-[8px] font-extrabold uppercase mt-0.5 ${item.scanned === item.expected ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {item.scanned === item.expected ? 'MATCH' : 'DISCREPANCY'}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {step === 'summary' && (
                        <div className="space-y-4">
                            <SectionTitle>GRN Completion Report</SectionTitle>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase ">Total Scanned</p>
                                    <p className="text-xl font-bold text-slate-800">{totalScanned}</p>
                                </div>
                                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                    <p className="text-[9px] font-bold text-slate-400 uppercase ">Expected</p>
                                    <p className="text-xl font-bold text-slate-800">{totalExpected}</p>
                                </div>
                            </div>

                            {hasDiscrepancy && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 shadow-sm"
                                >
                                    <ShieldAlert size={20} className="text-rose-500 shrink-0" />
                                    <div>
                                        <p className="text-[11px] font-bold text-rose-900 uppercase">Discrepancy Alert</p>
                                        <p className="text-[10px] font-bold text-rose-600 mt-0.5 leading-relaxed">
                                            Shortage detected on {scannedItems.filter(i => i.scanned < i.expected).length} items. Shortage report will be auto-raised.
                                        </p>
                                    </div>
                                </motion.div>
                            )}

                            <div className="space-y-4">
                                <div>
                                    <label className="text-[9px] font-bold text-slate-400 uppercase  ml-1 mb-1.5 block">Remarks</label>
                                    <textarea
                                        rows="3"
                                        placeholder="Additional receiving notes..."
                                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none transition-all resize-none shadow-sm"
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                    ></textarea>
                                </div>

                                {hasDiscrepancy && (
                                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl space-y-3">
                                        <div className="flex items-center gap-2">
                                            <Lock size={14} className="text-amber-600" />
                                            <p className="text-[10px] font-bold text-amber-900 uppercase">Supervisor Override Required</p>
                                        </div>
                                        <input
                                            type="password"
                                            placeholder="Enter supervisor PIN..."
                                            className="w-full bg-white border border-amber-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-amber-500 outline-none transition-all text-center "
                                            value={supervisorPin}
                                            onChange={(e) => setSupervisorPin(e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>

                            <PrimaryBtn
                                onClick={() => {
                                    saveReceivingLog(poNumber, activeApptId, scannedItems, hasDiscrepancy ? 'Discrepancy' : 'Matched');
                                    toast.success('GRN Finalized and Dispatched!');
                                    setStep('init');
                                    setPoNumber('');
                                    setScannedItems([]);
                                    setActiveApptId('');
                                }}
                                disabled={hasDiscrepancy && !supervisorPin}
                                className="w-full !py-4 shadow-lg shadow-blue-100 mt-6 !rounded-[1.5rem]"
                                icon={<CheckCircle size={18} />}
                            >
                                Finalize GRN
                            </PrimaryBtn>
                        </div>
                    )}
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="bg-white border-t border-slate-100 p-4 flex justify-around items-center rounded-b-[2.5rem] relative z-10">
                    <button className="flex flex-col items-center gap-1 text-blue-600">
                        <List size={20} />
                        <span className="text-[8px] font-bold uppercase">QUEUE</span>
                    </button>
                    <button
                        onClick={() => { if (step === 'scanning') setStep('summary'); else setStep('scanning'); }}
                        className="w-14 h-14 -mt-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl border-4 border-white active:scale-90 transition-all"
                    >
                        <Scan size={24} />
                    </button>
                    <button className="flex flex-col items-center gap-1 text-slate-300">
                        <MoreHorizontal size={20} />
                        <span className="text-[8px] font-bold uppercase">MENU</span>
                    </button>
                </div>
            </VCard>
        </motion.div>
    );
}

// --- 3.3 IOT COLD-CHAIN TEMPERATURE MONITOR ---
function IoTTempMonitor() {
    const [temp, setTemp] = useState(4.2);
    const [status, setStatus] = useState('green'); // 'green', 'amber', 'red'
    const [timeAtBreach, setTimeAtBreach] = useState(0);
    const [showOverride, setShowOverride] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');

    const appointments = useInboundStore(state => state.appointments);
    const rejectAppointment = useInboundStore(state => state.rejectAppointment);
    const activeAppt = appointments.find(a => a.status === 'Arrived') || { id: 'DEMO-123', vehicleReg: 'MH 12 AB 1234', slot: 'DOCK-04' };

    useEffect(() => {
        const handler = (e) => {
            if (e.detail === 'TEMP_BREACH') {
                setTemp(8.5);
                setStatus('red');
            } else if (e.detail === 'AUDIT_OVERRIDE') {
                setShowOverride(true);
                setRejectionReason('Temperature Breach');
            }
        };
        window.addEventListener('triggerScenario', handler);
        return () => window.removeEventListener('triggerScenario', handler);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setTemp(prev => {
                const change = (Math.random() - 0.5) * 0.5;
                const newTemp = parseFloat((prev + change).toFixed(1));

                if (newTemp > 6) setStatus('red');
                else if (newTemp > 4) setStatus('amber');
                else setStatus('green');

                return newTemp;
            });

            if (status === 'red') setTimeAtBreach(prev => prev + 1);
            else setTimeAtBreach(0);
        }, 3000);

        return () => clearInterval(interval);
    }, [status]);

    const handleReject = () => {
        if (!rejectionReason) {
            toast.error('Select a rejection reason');
            return;
        }
        if (activeAppt.id !== 'DEMO-123') {
            rejectAppointment(activeAppt.id, rejectionReason);
        }
        toast.error(`GRN Rejected: ${rejectionReason}`, { icon: '🚫' });
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
        >
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-[18px] font-bold text-slate-800">3.3 IoT Cold-Chain Temperature Monitor</h2>
                    <p className="text-[12px] font-bold text-slate-500 mt-1 uppercase tracking-wider">Real-time dashboard with automated GRN rejection</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    <span className="text-[11px] font-bold text-slate-700 uppercase ">Sensors Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Gauge Display */}
                <div className="lg:col-span-8">
                    <VCard className="p-8 shadow-xl border-slate-200 relative overflow-hidden h-full">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none rotate-12">
                            <Thermometer size={160} />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                            {/* Gauge Visualization */}
                            <div className="relative flex flex-col items-center">
                                <div className="w-64 h-64 rounded-full border-[12px] border-slate-50 relative flex items-center justify-center shadow-inner">
                                    {/* Progress Ring */}
                                    <svg className="absolute inset-0 -rotate-90 w-full h-full">
                                        <circle
                                            cx="128" cy="128" r="120"
                                            fill="none"
                                            stroke={status === 'red' ? '#ef4444' : status === 'amber' ? '#f59e0b' : '#10b981'}
                                            strokeWidth="12"
                                            strokeDasharray="753"
                                            strokeDashoffset={753 - (753 * (temp + 20) / 40)}
                                            strokeLinecap="round"
                                            className="transition-all duration-1000 ease-in-out"
                                        />
                                    </svg>

                                    <div className="text-center relative z-10">
                                        <p className="text-[12px] font-bold text-slate-400 uppercase  mb-1">Live Temp</p>
                                        <h3 className="text-6xl font-extrabold text-slate-800 tracking-tighter">{temp}°C</h3>
                                        <div className={`mt-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase  border transition-all ${status === 'red' ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                            status === 'amber' ? 'bg-amber-50 border-amber-100 text-amber-600' :
                                                'bg-emerald-50 border-emerald-100 text-emerald-600'
                                            }`}>
                                            {status === 'red' ? 'BREACH DETECTED' : status === 'amber' ? 'APPROACHING THRESHOLD' : 'STABLE'}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 flex gap-6 text-center">
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase  mb-1">Range</p>
                                        <p className="text-[13px] font-bold text-slate-700">0°C — 4°C</p>
                                    </div>
                                    <div className="w-px h-8 bg-slate-100"></div>
                                    <div>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase  mb-1">Category</p>
                                        <p className="text-[13px] font-bold text-slate-700">Dairy / Chilled</p>
                                    </div>
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="space-y-6">
                                <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm"><Truck size={18} /></div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase ">Truck / Dock ID</p>
                                            <p className="text-[13px] font-bold text-slate-800 uppercase tracking-tight">{activeAppt.vehicleReg} • {activeAppt.slot}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded-lg text-rose-400 shadow-sm"><Clock size={18} /></div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase ">Time at Breach</p>
                                            <p className={`text-[13px] font-bold uppercase tracking-tight ${timeAtBreach > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
                                                {timeAtBreach > 0 ? `${timeAtBreach}s (AUTO-REJECT AT 300s)` : '00:00:00'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-4">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase ">Status Indicator</p>
                                        <div className="flex gap-1.5">
                                            <div className={`w-3 h-3 rounded-full ${status === 'green' ? 'bg-emerald-500 shadow-lg shadow-emerald-200 animate-pulse' : 'bg-slate-200'}`}></div>
                                            <div className={`w-3 h-3 rounded-full ${status === 'amber' ? 'bg-amber-500 shadow-lg shadow-amber-200 animate-pulse' : 'bg-slate-200'}`}></div>
                                            <div className={`w-3 h-3 rounded-full ${status === 'red' ? 'bg-rose-500 shadow-lg shadow-rose-200 animate-pulse' : 'bg-slate-200'}`}></div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-500 italic">Traffic Light: Green=Within Range; Amber=Approaching (±2°C); Red=Breach</p>
                                </div>

                                <PrimaryBtn
                                    onClick={handleReject}
                                    className="w-full !bg-rose-600 hover:!bg-rose-700 !py-4 shadow-xl shadow-rose-100"
                                    icon={<XCircle size={20} />}
                                >
                                    REJECT GRN
                                </PrimaryBtn>
                            </div>
                        </div>
                    </VCard>
                </div>

                {/* Controls Column */}
                <div className="lg:col-span-4 space-y-6">
                    <VCard className="p-6 border-slate-200 shadow-lg bg-white h-full">
                        <div className="flex items-center gap-2 mb-6">
                            <ShieldCheck size={20} className="text-blue-600" />
                            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Compliance Override</h3>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-bold text-slate-500 uppercase  mb-2 block">Rejection Reason *</label>
                                <select
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:bg-white focus:border-blue-500 outline-none transition-all"
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                >
                                    <option value="">Select reason...</option>
                                    {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>

                            <div className="pt-6 border-t border-slate-100">
                                <label className="flex items-start gap-3 p-4 border border-dashed border-slate-200 rounded-2xl hover:bg-slate-50 transition-all cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        checked={showOverride}
                                        onChange={(e) => setShowOverride(e.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <div>
                                        <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900 leading-tight block">Request Senior Authorization</span>
                                        <span className="text-[9px] font-bold text-slate-400 mt-1 block">Allow receiving despite breach; records override authorizer in audit log.</span>
                                    </div>
                                </label>
                            </div>

                            <AnimatePresence>
                                {showOverride && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        className="space-y-3"
                                    >
                                        <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl">
                                            <p className="text-[10px] font-bold text-blue-900 uppercase mb-2 flex items-center gap-1.5"><Lock size={12} /> Biometric / PIN Auth</p>
                                            <input
                                                type="password"
                                                placeholder="Enter Manager PIN..."
                                                className="w-full bg-white border border-blue-200 rounded-xl px-4 py-3 text-sm font-bold focus:border-blue-500 outline-none transition-all text-center tracking-[0.5em]"
                                            />
                                        </div>
                                        <SecondaryBtn className="w-full !py-3 !text-[10px] !text-blue-600 border-blue-100 hover:bg-blue-50">VERIFY & OVERRIDE</SecondaryBtn>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="mt-auto pt-10">
                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-slate-600 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <Info size={40} className="text-slate-400" />
                                </div>
                                <h4 className="text-[10px] font-bold uppercase  text-slate-400 mb-2">System Audit</h4>
                                <p className="text-[11px] font-bold leading-relaxed opacity-80">
                                    All temperature readings and overrides are logged per FSSAI / HACCP compliance standards.
                                </p>
                            </div>
                        </div>
                    </VCard>
                </div>
            </div>
        </motion.div>
    );
}

function SectionTitle({ children, action }) {
    return (
        <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{children}</h2>
            {action}
        </div>
    );
}

function MyBookingsView() {
    const appointments = useInboundStore(state => state.appointments);
    const cancelAppointment = useInboundStore(state => state.cancelAppointment);
    const confirmAppointment = useInboundStore(state => state.confirmAppointment);
    
    // Sort appointments: latest first
    const sortedAppts = [...appointments].reverse();

    const handleCancel = (id) => {
        cancelAppointment(id);
        toast.success(`Booking ${id} cancelled.`);
    };

    const handleConfirm = (id) => {
        confirmAppointment(id);
        toast.success(`Booking ${id} approved successfully!`);
    };

    const handleDownload = (id) => {
        toast.success(`Downloading confirmation for ${id}...`);
        // Basic simulation of download
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.contentDocument.write(`
            <html>
                <head>
                    <title>Booking Confirmation - ${id}</title>
                    <style>
                        body { font-family: sans-serif; text-align: center; padding: 40px; }
                        .ticket { border: 2px dashed #ccc; padding: 40px; border-radius: 20px; display: inline-block; }
                        h1 { color: #333; margin-bottom: 5px; }
                    </style>
                </head>
                <body>
                    <div class="ticket">
                        <h1>BOOKING CONFIRMATION</h1>
                        <h2>APPOINTMENT #${id}</h2>
                    </div>
                </body>
            </html>
        `);
        iframe.contentDocument.close();
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
    };

    return (
        <VCard className="p-6">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight mb-4">My Bookings</h3>
            {sortedAppts.length === 0 ? (
                <div className="text-center p-10 text-slate-400 text-sm font-bold border-2 border-dashed rounded-xl border-slate-200">
                    No bookings found. Submit a new booking form to see it here.
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200">
                                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Booking ID</th>
                                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date & Slot</th>
                                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Store</th>
                                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="py-3 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedAppts.map(appt => (
                                <tr key={appt.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="text-xs font-bold text-slate-800">{appt.id}</div>
                                        <div className="text-[10px] font-bold text-slate-400">{appt.poNumbers ? `PO: ${appt.poNumbers}` : 'No PO'}</div>
                                    </td>
                                    <td className="py-3 px-4 text-xs font-bold text-slate-700">
                                        {appt.date} <br/> <span className="text-[10px] text-slate-500">{appt.slot}</span>
                                    </td>
                                    <td className="py-3 px-4 text-xs font-bold text-slate-700">{appt.store}</td>
                                    <td className="py-3 px-4">
                                        <StatusBadge status={appt.status.toLowerCase()} size="xs" />
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            {appt.status === 'Pending' && (
                                                <button 
                                                    onClick={() => handleConfirm(appt.id)}
                                                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                                    title="Approve Booking"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleDownload(appt.id)}
                                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                title="Download Confirmation"
                                            >
                                                <Save size={16} />
                                            </button>
                                            {(appt.status === 'Pending' || appt.status === 'Confirmed' || appt.status === 'Scheduled') && (
                                                <button 
                                                    onClick={() => handleCancel(appt.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                                    title={appt.status === 'Pending' ? "Reject Booking" : "Cancel Booking"}
                                                >
                                                    <XCircle size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </VCard>
    );
}
