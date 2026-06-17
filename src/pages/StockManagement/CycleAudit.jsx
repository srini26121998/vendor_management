import React, { useState } from 'react';
import {
    ClipboardCheck,
    Calendar,
    Users,
    Layers,
    ScanLine,
    EyeOff,
    AlertTriangle,
    CheckCircle2,
    History,
    Smartphone,
    UserCog,
    FileEdit
} from 'lucide-react';
import {
    PageHeader,
    VCard,
    SectionTitle,
    PrimaryBtn,
    SecondaryBtn,
    VendorBreadcrumb,
    StatusBadge
} from '../Vendors/VendorComponents';
import toast from 'react-hot-toast';

const ZONES = ['A1: Cold Storage', 'A2: Ambient', 'B1: Bulk Storage', 'C1: Dispatch'];
const STAFF = ['John Doe (Picker)', 'Jane Smith (Supervisor)', 'Mike Ross (Store Manager)'];
const AUDIT_TYPES = ['Full Warehouse Count', 'Zone Count', 'Spot Check', 'Financial Audit'];

export default function CycleAudit() {
    const [activeRole, setActiveRole] = useState('Manager'); // Manager or Staff

    // Manager State
    const [auditName, setAuditName] = useState('');
    const [auditType, setAuditType] = useState('Full Warehouse Count');
    const [auditDate, setAuditDate] = useState('');
    const [blindCount, setBlindCount] = useState(true);
    const [recountThreshold, setRecountThreshold] = useState('5');

    // Staff State
    const [itemBarcode, setItemBarcode] = useState('');
    const [physicalCount, setPhysicalCount] = useState('');
    const [recountFlag, setRecountFlag] = useState(false);
    const [countNotes, setCountNotes] = useState('');

    const handleAssignAudit = () => {
        if (!auditName || !auditDate) {
            toast.error('Please fill in mandatory fields');
            return;
        }
        toast.success(`Audit "${auditName}" assigned successfully!`);
    };

    const handleSubmitCount = () => {
        if (!itemBarcode || !physicalCount) {
            toast.error('Barcode and Count are required');
            return;
        }
        toast.success('Physical count submitted for verification.');
    };

    const breadcrumbs = [
        { label: 'Inventory', path: '/inventory' },
        { label: 'Stock Management', path: '#' },
        { label: 'Cycle Count & Physical Audit' }
    ];

    return (
        <div className="w-full bg-[#F8FAFC] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <PageHeader
                    title="Cycle Count & Physical Audit Interface"
                    subtitle="Audit assignment system and staff mobile counting interface with blind count enforcement."
                />
                <div className="flex items-center bg-white border border-slate-200 p-1 rounded-2xl shadow-sm">
                    <button
                        onClick={() => setActiveRole('Manager')}
                        className={`px-8 py-3 rounded-xl text-[12px] font-bold transition-all ${activeRole === 'Manager' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        MANAGER VIEW
                    </button>
                    <button
                        onClick={() => setActiveRole('Staff')}
                        className={`px-8 py-3 rounded-xl text-[12px] font-bold transition-all ${activeRole === 'Staff' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        STAFF MOBILITY
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {activeRole === 'Manager' ? (
                    <>
                        {/* MANAGER: AUDIT ASSIGNMENT FORM */}
                        <div className="lg:col-span-7 space-y-6">
                            <VCard>
                                <SectionTitle>Audit Assignment Form — Manager</SectionTitle>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    {/* Audit Name */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Audit Name <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <FileEdit size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="e.g. Monthly Cycle Count Jan 2026..."
                                                className="w-full pl-9 pr-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all"
                                                value={auditName}
                                                onChange={e => setAuditName(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium italic">Max 60 chars</p>
                                    </div>

                                    {/* Audit Type */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Audit Type <span className="text-rose-500">*</span></label>
                                        <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                                            {AUDIT_TYPES.map(t => (
                                                <label key={t} className="flex items-center gap-3 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        name="auditType"
                                                        className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                                                        checked={auditType === t}
                                                        onChange={() => setAuditType(t)}
                                                    />
                                                    <span className={`text-[12px] font-bold transition-colors ${auditType === t ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}`}>{t}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Audit Date */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Audit Date <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="date"
                                                className="w-full pl-9 pr-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all"
                                                value={auditDate}
                                                onChange={e => setAuditDate(e.target.value)}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium italic">Cannot be in the past; advance scheduling up to 30 days</p>
                                    </div>

                                    {/* Assign Zones */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Assign Zones <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <Layers size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <select className="w-full pl-9 pr-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all appearance-none">
                                                <option>Select zones/aisles...</option>
                                                {ZONES.map(z => <option key={z}>{z}</option>)}
                                            </select>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium italic">Visual aisle map with checkboxes; assign specific aisles to specific staff</p>
                                    </div>

                                    {/* Assign Staff */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Assign Staff <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <Users size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <select className="w-full pl-9 pr-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all appearance-none">
                                                <option>Select staff members...</option>
                                                {STAFF.map(s => <option key={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium italic">Active warehouse staff; drag to zone grid for zone-staff mapping</p>
                                    </div>

                                    {/* Blind Count Enforcement */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Blind Count Enforcement</label>
                                        <div className="flex items-center justify-between p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <EyeOff size={16} className="text-blue-600" />
                                                <span className="text-[12px] font-bold text-blue-900">Enforced (Locked)</span>
                                            </div>
                                            <div
                                                onClick={() => setBlindCount(!blindCount)}
                                                className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-all ${blindCount ? 'bg-blue-600' : 'bg-slate-300'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full transition-all ${blindCount ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium italic">Cannot be turned off; system quantities hidden from staff during count</p>
                                    </div>

                                    {/* Recount Threshold % */}
                                    <div className="space-y-2">
                                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Recount Threshold %</label>
                                        <div className="relative">
                                            <AlertTriangle size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="number"
                                                className="w-full pl-9 pr-4 py-3 text-[13px] font-bold border border-slate-100 rounded-xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all"
                                                value={recountThreshold}
                                                onChange={e => setRecountThreshold(e.target.value)}
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">%</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium italic">If variance &gt; threshold %, staff prompted to recount before submitting</p>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-50 flex justify-end">
                                    <PrimaryBtn onClick={handleAssignAudit} className="px-12 py-4 rounded-2xl" icon={<ClipboardCheck size={18} />}>
                                        Assign Audit Session
                                    </PrimaryBtn>
                                </div>
                            </VCard>
                        </div>

                        {/* MANAGER: RECENT AUDITS / ANALYTICS */}
                        <div className="lg:col-span-5 space-y-6">
                            <VCard className="bg-slate-900 text-white border-0">
                                <SectionTitle><span className="text-slate-400">Audit Health Check</span></SectionTitle>
                                <div className="space-y-6 mt-6">
                                    <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="text-[11px] font-bold text-blue-400 uppercase ">Active Coverage</div>
                                            <div className="text-2xl font-extrabold text-white">84.2%</div>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 w-[84%]" />
                                        </div>
                                        <p className="text-[10px] text-slate-500 mt-3 font-medium">16/19 Zones counted in current session</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                                            <div className="text-[9px] font-bold text-emerald-400 uppercase  mb-1">Accurate</div>
                                            <div className="text-xl font-extrabold text-emerald-500">92%</div>
                                        </div>
                                        <div className="p-4 bg-rose-500/10 rounded-2xl border border-rose-500/20">
                                            <div className="text-[9px] font-bold text-rose-400 uppercase  mb-1">Variance</div>
                                            <div className="text-xl font-extrabold text-rose-500">8.4%</div>
                                        </div>
                                    </div>
                                </div>
                            </VCard>

                            <VCard>
                                <SectionTitle>Audit History</SectionTitle>
                                <div className="space-y-4 mt-4">
                                    {[
                                        { name: 'Yearend Audit 2025', date: '31 Dec 2025', status: 'COMPLETED' },
                                        { name: 'Flash Spot Check: Frozen', date: '15 Jan 2026', status: 'COMPLETED' },
                                        { name: 'Cold-Chain Verification', date: '02 Feb 2026', status: 'IN PROGRESS' }
                                    ].map((a, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                                                    <History size={16} />
                                                </div>
                                                <div>
                                                    <div className="text-[13px] font-bold text-slate-800">{a.name}</div>
                                                    <div className="text-[10px] font-medium text-slate-400">{a.date}</div>
                                                </div>
                                            </div>
                                            <StatusBadge status={a.status} size="xs" />
                                        </div>
                                    ))}
                                </div>
                            </VCard>
                        </div>
                    </>
                ) : (
                    <>
                        {/* STAFF: MOBILE COUNT ENTRY */}
                        <div className="lg:col-span-12 max-w-2xl mx-auto w-full">
                            <VCard className="bg-white border-2 border-slate-200 shadow-xl rounded-[2.5rem] overflow-hidden">
                                <div className="bg-slate-900 p-8 text-center">
                                    <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-6" />
                                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-[0.2em] mb-4">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Session
                                    </div>
                                    <h3 className="text-xl font-extrabold text-white">Assigned: A1: Cold Storage</h3>
                                    <p className="text-[12px] text-slate-400 mt-1 font-medium">Staff: John Doe · Shift: Morning</p>
                                </div>

                                <div className="p-8 space-y-8">
                                    {/* Item Barcode Scan */}
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em]">Item Barcode <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <ScanLine size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Scan item or type UPC..."
                                                className="w-full pl-12 pr-4 py-4 text-[15px] font-bold border-2 border-slate-100 rounded-2xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all placeholder:text-slate-300"
                                                value={itemBarcode}
                                                onChange={e => setItemBarcode(e.target.value)}
                                            />
                                            <button className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 active:scale-95 transition-all">
                                                📷
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium italic">Accepts EAN, unrecognised barcodes logged as "Unknown Item" for review</p>
                                    </div>

                                    {/* Physical Count */}
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em]">Physical Count <span className="text-rose-500">*</span></label>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setPhysicalCount(prev => Math.max(0, (parseInt(prev) || 0) - 1).toString())}
                                                className="w-16 h-16 rounded-2xl border-2 border-slate-100 bg-slate-50 text-2xl font-bold text-slate-400 hover:bg-slate-100 active:scale-90 transition-all flex items-center justify-center"
                                            >
                                                －
                                            </button>
                                            <input
                                                type="number"
                                                placeholder="Enter count..."
                                                className="flex-1 py-4 text-center text-3xl font-extrabold border-2 border-slate-100 rounded-2xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all"
                                                value={physicalCount}
                                                onChange={e => setPhysicalCount(e.target.value)}
                                            />
                                            <button
                                                onClick={() => setPhysicalCount(prev => ((parseInt(prev) || 0) + 1).toString())}
                                                className="w-16 h-16 rounded-2xl border-2 border-slate-100 bg-slate-50 text-2xl font-bold text-slate-400 hover:bg-slate-100 active:scale-90 transition-all flex items-center justify-center"
                                            >
                                                ＋
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-medium italic text-center">Numeric only; no system quantity shown; can increment with ± button</p>
                                    </div>

                                    {/* Recount Flag */}
                                    <label className="flex items-center gap-4 p-5 bg-orange-50/50 border-2 border-orange-100 rounded-2xl cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            className="w-6 h-6 rounded-lg text-orange-600 focus:ring-orange-500 border-slate-300"
                                            checked={recountFlag}
                                            onChange={e => setRecountFlag(e.target.checked)}
                                        />
                                        <div>
                                            <div className="text-[13px] font-bold text-orange-900">Recount Flag</div>
                                            <div className="text-[10px] text-orange-600 font-medium leading-tight">Staff can flag item for recount by supervisor if unsure</div>
                                        </div>
                                    </label>

                                    {/* Count Notes */}
                                    <div className="space-y-3">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-[0.1em]">Count Notes</label>
                                        <textarea
                                            placeholder="Any observations (e.g. Packaging damaged)..."
                                            rows={2}
                                            className="w-full px-5 py-4 text-[14px] font-bold border-2 border-slate-100 rounded-2xl bg-slate-50/50 outline-none focus:border-blue-500 transition-all resize-none"
                                            value={countNotes}
                                            onChange={e => setCountNotes(e.target.value)}
                                        />
                                        <p className="text-[10px] text-slate-400 font-medium italic">Max 100 chars; e.g. 'Items mixed with wrong SKU'</p>
                                    </div>

                                    <div className="pt-6">
                                        <PrimaryBtn onClick={handleSubmitCount} className="w-full py-5 rounded-[1.5rem] text-sm shadow-xl shadow-blue-200" icon={<CheckCircle2 size={20} />}>
                                            Submit Physical Count
                                        </PrimaryBtn>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-6 flex items-center justify-center gap-8 border-t-2 border-slate-100">
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase ">Progress</div>
                                        <div className="text-[14px] font-extrabold text-slate-700">24 / 85 Items</div>
                                    </div>
                                    <div className="w-px h-8 bg-slate-200" />
                                    <div className="text-center">
                                        <div className="text-[10px] font-bold text-slate-400 uppercase ">Accuracy</div>
                                        <div className="text-[14px] font-extrabold text-emerald-600">Pending</div>
                                    </div>
                                </div>
                            </VCard>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
