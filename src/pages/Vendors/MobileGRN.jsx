import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VENDOR_ROUTES } from './vendorConstants';
import { PrimaryBtn, SecondaryBtn } from './VendorComponents';
import toast from 'react-hot-toast';


// Mobile GRN — Full-screen Captain App style
const ITEMS = [
    { name: 'Basmati Rice (Premium)', poQty: 100, unit: 'Kg', scanned: false },
    { name: 'Sunflower Oil', poQty: 50, unit: 'L', scanned: false },
    { name: 'Turmeric Powder', poQty: 20, unit: 'Kg', scanned: false },
];

export default function MobileGRN() {
    const navigate = useNavigate();
    const [items, setItems] = useState(ITEMS);
    const [current, setCurrent] = useState(0);
    const [scanning, setScanning] = useState(false);
    const [receivedQty, setReceivedQty] = useState('');
    const [voice, setVoice] = useState(false);

    const scan = () => {
        setScanning(true);
        setTimeout(() => {
            setScanning(false);
            setReceivedQty(ITEMS[current].poQty.toString());
            toast.success(`Scanned: ${ITEMS[current].name} ✓`);
        }, 1200);
    };

    const confirmItem = () => {
        setItems(it => it.map((item, i) => i === current ? { ...item, scanned: true, received: parseFloat(receivedQty) || 0 } : item));
        setReceivedQty('');
        if (current < ITEMS.length - 1) setCurrent(c => c + 1);
        else {
            toast.success('GRN Complete! 🎉');
            navigate(VENDOR_ROUTES.grnList);
        }
    };

    const progress = ((items.filter(i => i.scanned).length) / items.length) * 100;

    return (
        <div className="flex flex-col min-h-screen" style={{ background: '#0f172a', fontFamily: '"Inter", sans-serif' }}>
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-3" style={{ background: '#1E3A5F' }}>
                <div>
                    <div className="text-xs text-blue-200 font-bold uppercase tracking-wider">PO-2026-0421 · Sunrise Foods</div>
                    <div className="text-white font-bold text-sm">GRN Captain Mode</div>
                </div>
                <div className="text-right">
                    <div className="text-xs text-blue-200">Items: {items.filter(i => i.scanned).length}/{items.length}</div>
                    <div className="text-white font-bold text-sm">{Math.round(progress)}%</div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1.5 bg-slate-800">
                <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, background: '#F97316' }} />
            </div>

            {/* Camera Viewfinder */}
            <div className="flex-1 relative flex items-center justify-center" style={{ background: '#0f172a', minHeight: 200 }}>
                <div className="w-full max-w-sm aspect-video flex items-center justify-center rounded-2xl mx-4"
                    style={{ border: '2px solid #1E3A5F', background: '#020617' }}>
                    {scanning ? (
                        <div className="text-center p-4">
                            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                            <div className="text-blue-300 text-sm font-bold">Scanning barcode...</div>
                        </div>
                    ) : (

                        <div className="text-center">
                            <div className="text-slate-600 text-3xl mb-1">📷</div>
                            <div className="text-slate-500 text-xs">Camera viewfinder active</div>
                            <div className="text-slate-600 text-[10px] mt-0.5">Point at barcode</div>
                        </div>
                    )}
                    {/* Corner guides */}
                    {['top-3 left-3 border-l-2 border-t-2 rounded-tl', 'top-3 right-3 border-r-2 border-t-2 rounded-tr',
                        'bottom-3 left-3 border-l-2 border-b-2 rounded-bl', 'bottom-3 right-3 border-r-2 border-b-2 rounded-br'
                    ].map((c, i) => (
                        <div key={i} className={`absolute w-6 h-6 border-blue-400 ${c}`} />
                    ))}
                </div>
            </div>

            {/* Bottom Card */}
            <div className="rounded-t-3xl p-5 space-y-4" style={{ background: '#1e293b' }}>
                {/* Current Item */}
                <div>
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-0.5">Current Item ({current + 1}/{items.length})</div>
                    <div className="text-white font-bold text-lg">{ITEMS[current]?.name}</div>
                    <div className="text-slate-400 text-sm">PO Qty: {ITEMS[current]?.poQty} {ITEMS[current]?.unit}</div>
                </div>

                {/* Qty Input */}
                <div className="flex items-center gap-3">
                    <button onClick={() => setReceivedQty(q => String(Math.max(0, (parseFloat(q) || 0) - 1)))}
                        className="w-11 h-11 rounded-full text-white font-bold text-xl flex items-center justify-center"
                        style={{ background: '#334155' }}>−</button>
                    <input type="number" value={receivedQty} onChange={e => setReceivedQty(e.target.value)}
                        placeholder={ITEMS[current]?.poQty?.toString()}
                        className="flex-1 text-center text-2xl font-bold bg-transparent text-white border-b-2 border-blue-500 focus:outline-none py-2"
                        style={{ borderRadius: 0 }} />
                    <button onClick={() => setReceivedQty(q => String((parseFloat(q) || 0) + 1))}
                        className="w-11 h-11 rounded-full text-white font-bold text-xl flex items-center justify-center"
                        style={{ background: '#334155' }}>+</button>
                    <span className="text-slate-300 text-sm">{ITEMS[current]?.unit}</span>
                </div>

                {/* Status Chips */}
                <div className="flex gap-2">
                    {['Matched', 'Short', 'Damaged'].map(s => (
                        <button key={s} className="px-3 py-1.5 rounded-full text-xs font-bold border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors">
                            {s}
                        </button>
                    ))}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                    <button onClick={scan}
                        className="py-3 rounded-xl font-bold text-sm text-white transition-all"
                        style={{ background: scanning ? '#d97706' : '#1E3A5F' }}>
                        📷 {scanning ? 'Scanning' : 'Scan'}
                    </button>
                    <button onClick={() => { setVoice(!voice); toast.success(voice ? 'Voice stopped' : 'Recording voice note...'); }}
                        className="py-3 rounded-xl font-bold text-sm border border-slate-600 transition-all"
                        style={{ background: voice ? '#dc2626' : '#1e293b', color: voice ? 'white' : '#94a3b8' }}>
                        {voice ? '⏹ Stop' : '🎤 Voice'}
                    </button>
                    <button onClick={confirmItem}
                        className="py-3 rounded-xl font-bold text-sm text-white"
                        style={{ background: '#16a34a' }}>
                        ✓ Confirm
                    </button>
                </div>

                {/* Scanned items pill list */}
                <div className="flex gap-1.5 flex-wrap">
                    {items.map((item, i) => (
                        <span key={i} onClick={() => setCurrent(i)}
                            className={`px-2 py-1 text-[10px] font-bold rounded-full cursor-pointer transition-all ${item.scanned ? 'text-green-400 border border-green-600' : i === current ? 'text-orange-400 border border-orange-500 bg-orange-900/20' : 'text-slate-500 border border-slate-700'}`}>
                            {item.scanned ? '✓ ' : ''}{item.name.split(' ')[0]}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}
