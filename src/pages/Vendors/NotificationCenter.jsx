import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VENDOR_ROUTES } from './vendorConstants';
import { PageHeader, VCard, SectionTitle, PrimaryBtn, SecondaryBtn } from './VendorComponents';
import { Bell, Check, Clock, Info, ShieldAlert, Zap, X, Trash2, CheckCircle2 } from 'lucide-react';
import useNotificationStore from '../../store/useNotificationStore';

const TYPE_FILTERS = [
    { label: 'All Activities', value: 'all' }, 
    { label: 'Urgent Action', value: 'urgent' },
    { label: 'System Info', value: 'info' }, 
    { label: 'AI Insights', value: 'ai' }, 
    { label: 'Success Logs', value: 'success' },
];

const TYPE_CONFIG = {
    urgent: { icon: <ShieldAlert size={18} />, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', indicator: 'bg-rose-500' },
    info: { icon: <Info size={18} />, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', indicator: 'bg-blue-500' },
    ai: { icon: <Zap size={18} />, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', indicator: 'bg-purple-500' },
    success: { icon: <CheckCircle2 size={18} />, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', indicator: 'bg-emerald-500' },
    warning: { icon: <ShieldAlert size={18} />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', indicator: 'bg-amber-500' }
};

export default function NotificationCenter() {
    const [filter, setFilter] = useState('all');
    const { 
        notifications: notifs, 
        markAsRead: markRead, 
        markAllRead, 
        dismiss, 
        clearRead 
    } = useNotificationStore();
    const navigate = useNavigate();

    const handleViewDetails = (notif) => {
        // Simple logic to navigate based on notification content
        if (notif.title.toLowerCase().includes('payment')) navigate(VENDOR_ROUTES.payablesDash);
        else if (notif.title.toLowerCase().includes('document') || notif.title.toLowerCase().includes('license')) navigate(VENDOR_ROUTES.list);
        else if (notif.title.toLowerCase().includes('grn')) navigate(VENDOR_ROUTES.grnList);
        else if (notif.title.toLowerCase().includes('po')) navigate(VENDOR_ROUTES.poList);
        else if (notif.type === 'ai') navigate(VENDOR_ROUTES.aiInsights);
        else navigate(VENDOR_ROUTES.dashboard);
    };

    const filtered = notifs.filter(n => filter === 'all' || n.type === filter);
    const unreadCount = useNotificationStore(state => state.getUnreadCount());

    return (
        <div className="w-full bg-[#F8FAFC] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <div className="max-w-[1200px] mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-[22px] font-bold text-slate-800 tracking-tight">Notification Command Center</h1>
                            {unreadCount > 0 && (
                                <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-blue-600 text-white uppercase tracking-wider shadow-lg shadow-blue-100">
                                    {unreadCount} UNREAD
                                </span>
                            )}
                        </div>
                        <p className="text-[12px] text-slate-500 font-medium">Manage system alerts, compliance warnings, and AI insights.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <SecondaryBtn small icon={<Check size={14} />} onClick={markAllRead}>
                            Mark All Read
                        </SecondaryBtn>
                        <SecondaryBtn small icon={<Trash2 size={14} />} onClick={clearRead}>
                            Clear Read
                        </SecondaryBtn>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    {TYPE_FILTERS.map(f => (
                        <button
                            key={f.value}
                            onClick={() => setFilter(f.value)}
                            className={`px-5 py-2 rounded-xl text-[12px] font-bold whitespace-nowrap transition-all border ${
                                filter === f.value 
                                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100' 
                                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-200 hover:bg-slate-50'
                            }`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>

                {/* Notifications List */}
                <div className="space-y-3">
                    {filtered.length === 0 ? (
                        <VCard className="py-24 text-center">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                                <Bell size={24} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-700">Lifecycle Inbox Clear</h3>
                            <p className="text-sm text-slate-400 font-medium">No new signals detected in the current audit period.</p>
                        </VCard>
                    ) : (
                        filtered.map(n => {
                            const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
                            return (
                                <div 
                                    key={n.id}
                                    className={`group relative bg-white p-5 rounded-2xl border transition-all flex items-start gap-5 ${
                                        n.read 
                                        ? 'border-slate-100 bg-slate-50/30' 
                                        : 'border-slate-200 hover:border-blue-200 shadow-sm hover:shadow-md'
                                    }`}
                                >
                                    {/* Unread Indicator */}
                                    {!n.read && (
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${config.indicator}`} />
                                    )}

                                    {/* Icon */}
                                    <div className={`w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border transition-all group-hover:scale-105 ${config.bg} ${config.border} ${config.color}`}>
                                        {config.icon}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className={`text-[15px] font-bold tracking-tight truncate ${n.read ? 'text-slate-500' : 'text-slate-800'}`}>
                                                {n.title}
                                            </h3>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <Clock size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{n.time}</span>
                                            </div>
                                        </div>
                                        <p className={`text-[13px] font-medium leading-relaxed ${n.read ? 'text-slate-400' : 'text-slate-500'}`}>
                                            {n.message}
                                        </p>

                                        {/* Actions */}
                                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-slate-50">
                                            {!n.read && (
                                                <button 
                                                    onClick={() => markRead(n.id)}
                                                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1.5"
                                                >
                                                    <Check size={14} /> Mark as Read
                                                </button>
                                            )}
                                            <button 
                                                onClick={() => handleViewDetails(n)}
                                                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-wider flex items-center gap-1.5"
                                            >
                                                <Zap size={14} /> View Details
                                            </button>
                                            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => dismiss(n.id)}
                                                    className="p-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                                                    title="Dismiss"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
