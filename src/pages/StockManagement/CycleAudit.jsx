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
    FileEdit,
    Camera,
    Minus,
    Plus,
    Activity
} from 'lucide-react';
import {
    PageHeader,
    VCard,
    SectionTitle,
    PrimaryBtn,
    SecondaryBtn,
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
    const [selectedZone, setSelectedZone] = useState('');
    const [selectedStaff, setSelectedStaff] = useState('');

    const [recentSessions, setRecentSessions] = useState([
        { name: 'Yearend Audit 2025', date: '31 Dec 2025', status: 'COMPLETED' },
        { name: 'Flash Spot Check: Frozen', date: '15 Jan 2026', status: 'COMPLETED' },
        { name: 'Cold-Chain Verification', date: '02 Feb 2026', status: 'IN PROGRESS' }
    ]);

    // Staff State
    const [itemBarcode, setItemBarcode] = useState('');
    const [physicalCount, setPhysicalCount] = useState('');
    const [recountFlag, setRecountFlag] = useState(false);
    const [countNotes, setCountNotes] = useState('');

    const handleAssignAudit = () => {
        if (!auditName || !auditDate || !selectedZone || !selectedStaff) {
            toast.error('Please fill in all mandatory fields.');
            return;
        }
        
        const newSession = {
            name: auditName,
            date: new Date(auditDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
            status: 'ACTIVE'
        };
        
        setRecentSessions(prev => [newSession, ...prev]);
        toast.success(`Audit "${auditName}" assigned successfully!`);
        
        // Reset form
        setAuditName('');
        setAuditDate('');
        setSelectedZone('');
        setSelectedStaff('');
        
        // Switch to Staff view automatically after a small delay
        setTimeout(() => setActiveRole('Staff'), 1000);
    };

    const handleSubmitCount = () => {
        if (!itemBarcode || !physicalCount) {
            toast.error('Barcode and Count are required');
            return;
        }
        toast.success('Physical count submitted for verification.');
        // Reset form for next scan
        setItemBarcode('');
        setPhysicalCount('');
        setRecountFlag(false);
        setCountNotes('');
    };

    return (
        <div className="w-full bg-[#F4F7FB] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            {/* Header section with Role Toggle */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
                <PageHeader
                    title="Cycle Audit & Inventory Count"
                    subtitle="Assign blind audits and execute physical counts via mobile interface."
                />
                <div className="flex items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
                    <button
                        onClick={() => setActiveRole('Manager')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 ${activeRole === 'Manager' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <UserCog size={16} /> MANAGER VIEW
                    </button>
                    <button
                        onClick={() => setActiveRole('Staff')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[13px] font-bold transition-all duration-300 ${activeRole === 'Staff' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                        <Smartphone size={16} /> STAFF MOBILITY
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {activeRole === 'Manager' ? (
                    <>
                        {/* MANAGER: AUDIT ASSIGNMENT FORM */}
                        <div className="lg:col-span-8">
                            <VCard className="p-8 border-none shadow-sm ring-1 ring-slate-100">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                        <ClipboardCheck size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Audit Assignment Configuration</h2>
                                        <p className="text-sm text-slate-500">Create new count sessions and allocate resources.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
                                    {/* Audit Name */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block">Audit Name <span className="text-rose-500">*</span></label>
                                        <div className="relative group">
                                            <FileEdit size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="e.g. Q1 Annual Stock Count..."
                                                className="w-full pl-11 pr-4 py-3.5 text-[14px] font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                                value={auditName}
                                                onChange={e => setAuditName(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Audit Type */}
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block">Audit Type <span className="text-rose-500">*</span></label>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {AUDIT_TYPES.map(t => (
                                                <div 
                                                    key={t}
                                                    onClick={() => setAuditType(t)}
                                                    className={`cursor-pointer border rounded-xl p-3 text-center transition-all ${auditType === t ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'}`}
                                                >
                                                    <span className="text-[12px] font-bold leading-tight block">{t}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Audit Date */}
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block">Audit Date <span className="text-rose-500">*</span></label>
                                        <div className="relative group">
                                            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="date"
                                                className="w-full pl-11 pr-4 py-3.5 text-[14px] font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700"
                                                value={auditDate}
                                                onChange={e => setAuditDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    {/* Assign Zones */}
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block">Assign Zone <span className="text-rose-500">*</span></label>
                                        <div className="relative group">
                                            <Layers size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <select 
                                                className="w-full pl-11 pr-4 py-3.5 text-[14px] font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none text-slate-700"
                                                value={selectedZone}
                                                onChange={(e) => setSelectedZone(e.target.value)}
                                            >
                                                <option value="" disabled>Select zone or aisle...</option>
                                                {ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Assign Staff */}
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block">Assign Staff <span className="text-rose-500">*</span></label>
                                        <div className="relative group">
                                            <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <select 
                                                className="w-full pl-11 pr-4 py-3.5 text-[14px] font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none text-slate-700"
                                                value={selectedStaff}
                                                onChange={(e) => setSelectedStaff(e.target.value)}
                                            >
                                                <option value="" disabled>Select staff member...</option>
                                                {STAFF.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Recount Threshold % */}
                                    <div className="space-y-2">
                                        <label className="text-[12px] font-bold text-slate-600 uppercase tracking-wider block">Recount Threshold %</label>
                                        <div className="relative group">
                                            <AlertTriangle size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                                            <input
                                                type="number"
                                                placeholder="e.g. 5"
                                                className="w-full pl-11 pr-8 py-3.5 text-[14px] font-semibold border border-slate-200 rounded-xl bg-slate-50 focus:bg-white outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-700"
                                                value={recountThreshold}
                                                onChange={e => setRecountThreshold(e.target.value)}
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">%</span>
                                        </div>
                                    </div>

                                    {/* Blind Count Enforcement */}
                                    <div className="space-y-2 md:col-span-2">
                                        <div className="flex items-center justify-between p-5 bg-gradient-to-r from-slate-50 to-white border border-slate-200 rounded-xl">
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2.5 rounded-lg ${blindCount ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'} transition-colors`}>
                                                    <EyeOff size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="text-[14px] font-bold text-slate-800">Blind Count Enforcement</h3>
                                                    <p className="text-[12px] text-slate-500 mt-0.5">System quantities will be hidden from staff during count.</p>
                                                </div>
                                            </div>
                                            <div
                                                onClick={() => setBlindCount(!blindCount)}
                                                className={`w-14 h-7 rounded-full p-1 cursor-pointer transition-colors duration-300 ${blindCount ? 'bg-indigo-600' : 'bg-slate-300'}`}
                                            >
                                                <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${blindCount ? 'translate-x-7' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 pt-6 border-t border-slate-100 flex justify-end">
                                    <PrimaryBtn onClick={handleAssignAudit} className="px-10 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-[14px]" icon={<CheckCircle2 size={18} />}>
                                        Launch Audit Session
                                    </PrimaryBtn>
                                </div>
                            </VCard>
                        </div>

                        {/* MANAGER: RECENT AUDITS / ANALYTICS */}
                        <div className="lg:col-span-4 space-y-6">
                            <VCard className="bg-gradient-to-br from-slate-900 to-slate-800 text-white border-none shadow-lg">
                                <div className="flex items-center gap-2 mb-6">
                                    <Activity size={18} className="text-emerald-400" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">Live Audit Health</h3>
                                </div>
                                <div className="space-y-6">
                                    <div className="p-5 bg-white/10 rounded-2xl border border-white/5 backdrop-blur-sm">
                                        <div className="flex justify-between items-end mb-4">
                                            <div className="text-[12px] font-bold text-indigo-300 uppercase tracking-wider">Active Coverage</div>
                                            <div className="text-3xl font-black text-white">84<span className="text-lg text-slate-400">%</span></div>
                                        </div>
                                        <div className="h-2.5 w-full bg-slate-900/50 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 w-[84%] rounded-full relative">
                                                <div className="absolute top-0 right-0 bottom-0 left-0 bg-[linear-gradient(45deg,rgba(255,255,255,.15)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.15)_50%,rgba(255,255,255,.15)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress_1s_linear_infinite]" />
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-3 font-medium">16 out of 19 Zones counted</p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-1">Accuracy</div>
                                            <div className="text-2xl font-black text-emerald-500">92<span className="text-sm">%</span></div>
                                        </div>
                                        <div className="p-4 bg-rose-500/10 rounded-xl border border-rose-500/20">
                                            <div className="text-[10px] font-bold text-rose-400 uppercase tracking-wider mb-1">Variance</div>
                                            <div className="text-2xl font-black text-rose-500">8.4<span className="text-sm">%</span></div>
                                        </div>
                                    </div>
                                </div>
                            </VCard>

                            <VCard className="border-none shadow-sm ring-1 ring-slate-100">
                                <h3 className="text-[13px] font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <History size={16} className="text-slate-400" /> Recent Sessions
                                </h3>
                                <div className="space-y-3">
                                    {recentSessions.map((a, i) => (
                                        <div key={i} className="flex items-center justify-between p-3.5 rounded-xl hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all cursor-pointer group">
                                            <div>
                                                <div className="text-[13px] font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{a.name}</div>
                                                <div className="text-[11px] font-medium text-slate-500 mt-0.5">{a.date}</div>
                                            </div>
                                            <StatusBadge status={a.status} size="xs" />
                                        </div>
                                    ))}
                                </div>
                                <button className="w-full mt-4 py-2.5 text-[12px] font-bold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                    View Full History →
                                </button>
                            </VCard>
                        </div>
                    </>
                ) : (
                    <>
                        {/* STAFF: MOBILE COUNT ENTRY */}
                        <div className="col-span-1 lg:col-span-12 flex justify-center w-full">
                            {/* Mobile Phone Mockup Container */}
                            <div className="w-full max-w-[420px] bg-white border border-slate-200 shadow-2xl rounded-[2.5rem] overflow-hidden flex flex-col relative" style={{ minHeight: '800px' }}>
                                {/* Notch Area (Aesthetic) */}
                                <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
                                    <div className="w-32 h-6 bg-slate-900 rounded-b-2xl"></div>
                                </div>

                                {/* Header Area */}
                                <div className="bg-slate-900 pt-10 pb-6 px-6 text-center rounded-b-3xl relative z-10 shadow-md">
                                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-widest mb-4">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Session
                                    </div>
                                    <h3 className="text-xl font-extrabold text-white leading-tight">Zone A1:<br />Cold Storage</h3>
                                    <p className="text-[12px] text-slate-400 mt-2 font-medium bg-slate-800/50 inline-block px-3 py-1 rounded-full">User: John Doe · Shift: AM</p>
                                </div>

                                {/* Main Scanning Form */}
                                <div className="flex-1 p-6 space-y-7 bg-slate-50/50 flex flex-col justify-center">
                                    {/* Item Barcode Scan */}
                                    <div className="space-y-2.5">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Item Barcode <span className="text-rose-500">*</span></label>
                                        <div className="relative group">
                                            <ScanLine size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                            <input
                                                type="text"
                                                placeholder="Scan or type UPC..."
                                                className="w-full pl-12 pr-14 py-4 text-[16px] font-bold border-2 border-slate-200 rounded-2xl bg-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-slate-300 placeholder:font-normal shadow-sm"
                                                value={itemBarcode}
                                                onChange={e => setItemBarcode(e.target.value)}
                                            />
                                            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-slate-100 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-xl flex items-center justify-center transition-all active:scale-95">
                                                <Camera size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Physical Count */}
                                    <div className="space-y-2.5">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Physical Count <span className="text-rose-500">*</span></label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setPhysicalCount(prev => Math.max(0, (parseInt(prev) || 0) - 1).toString())}
                                                className="w-16 h-16 rounded-2xl border-2 border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-rose-600 active:bg-rose-50 active:border-rose-200 transition-all flex items-center justify-center shadow-sm shrink-0"
                                            >
                                                <Minus size={24} strokeWidth={3} />
                                            </button>
                                            <input
                                                type="number"
                                                placeholder="0"
                                                className="w-full h-16 text-center text-4xl font-black border-2 border-slate-200 rounded-2xl bg-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all text-slate-800 shadow-inner"
                                                value={physicalCount}
                                                onChange={e => setPhysicalCount(e.target.value)}
                                            />
                                            <button
                                                onClick={() => setPhysicalCount(prev => ((parseInt(prev) || 0) + 1).toString())}
                                                className="w-16 h-16 rounded-2xl border-2 border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-emerald-600 active:bg-emerald-50 active:border-emerald-200 transition-all flex items-center justify-center shadow-sm shrink-0"
                                            >
                                                <Plus size={24} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Recount Flag */}
                                    <label className={`flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all border-2 ${recountFlag ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200 hover:border-slate-300'}`}>
                                        <div className="pt-0.5">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                                                checked={recountFlag}
                                                onChange={e => setRecountFlag(e.target.checked)}
                                            />
                                        </div>
                                        <div>
                                            <div className={`text-[14px] font-bold ${recountFlag ? 'text-amber-900' : 'text-slate-700'}`}>Flag for Recount</div>
                                            <div className={`text-[12px] mt-0.5 ${recountFlag ? 'text-amber-700' : 'text-slate-500'}`}>Request supervisor review if you are unsure about this quantity.</div>
                                        </div>
                                    </label>

                                    {/* Count Notes */}
                                    <div className="space-y-2.5">
                                        <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest pl-1">Observations</label>
                                        <textarea
                                            placeholder="E.g., Packaging damaged, wrong bin..."
                                            rows={2}
                                            className="w-full p-4 text-[14px] font-medium border-2 border-slate-200 rounded-2xl bg-white outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none shadow-sm placeholder:text-slate-300"
                                            value={countNotes}
                                            onChange={e => setCountNotes(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/* Footer Sticky Submit */}
                                <div className="bg-white p-5 border-t border-slate-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
                                    <button 
                                        onClick={handleSubmitCount} 
                                        className="w-full py-4 rounded-[1rem] bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[15px] shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                                    >
                                        <CheckCircle2 size={20} />
                                        Record Count
                                    </button>
                                    
                                    {/* Mini Progress Bar */}
                                    <div className="mt-4 flex items-center justify-between px-2">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Progress</span>
                                        <span className="text-[12px] font-black text-slate-700">24 / 85 Items</span>
                                    </div>
                                    <div className="mx-2 mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 w-[28%] rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>

            <style dangerouslySetInnerHTML={{__html: `
                @keyframes progress {
                    0% { background-position: 1rem 0; }
                    100% { background-position: 0 0; }
                }
            `}} />
        </div>
    );
}
