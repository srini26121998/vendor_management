import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, Legend,
    RadarChart, Radar, PolarGrid, PolarAngleAxis
} from 'recharts';
import { getStatusStyle, formatCurrency } from './vendorConstants';
import { Settings, Diamond, Award, Medal, Trophy, PackageOpen, BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, PieChart as PieChartIcon, Activity } from 'lucide-react';

// ─── Column Configuration ──────────────────────────────────────────────────
export const ColumnConfig = ({ cols, onChange, advMode, setAdvMode }) => {
    return (
        <div className="space-y-4">
            {advMode && (
                <div className="p-5 bg-green-50/50 border border-green-100 rounded-xl animate-in slide-in-from-top-2 duration-300">
                    <div className="flex flex-wrap gap-2">
                        {cols.map(c => (
                            <button
                                key={c.id}
                                onClick={() => onChange(c.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all ${c.visible ? 'bg-green-800 text-white border-green-800 shadow-sm shadow-green-100' : 'bg-white text-gray-400 border-gray-200 hover:border-green-300'}`}
                            >
                                {c.visible ? '✓ ' : '+ '}{c.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Status Badge ──────────────────────────────────────────────────────────
export const StatusBadge = ({ status, size = 'sm' }) => {
    const style = getStatusStyle(status);
    const pad = size === 'xs' ? 'px-2 py-0.5 text-[10px]' : size === 'lg' ? 'px-5 py-2 text-[14px]' : 'px-3.5 py-1.5 text-[12px]';
    return (
        <div className={`inline-flex items-center gap-2 rounded-full text-blue-900 tracking-tight uppercase border shadow-sm transition-all whitespace-nowrap ${pad}`}
            style={{
                backgroundColor: style.bg,
                color: style.text,
                borderColor: style.dot + '20'
            }}>
            <span className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: style.dot }} />
            {style.label || status}
        </div>
    );
};

// ─── KPI Card ──────────────────────────────────────────────────────────────
export const KpiCard = ({ label, value, change, color, chartType, breakdown, onClick }) => {
    const isPos = change >= 0;

    // Build donut segments from breakdown
    const DonutChart = () => {
        if (!breakdown || breakdown.length === 0) return null;
        const total = breakdown.reduce((s, b) => s + b.count, 0);
        const cx = 40, cy = 40, r = 28, stroke = 10;
        const circumference = 2 * Math.PI * r;
        let offset = 0;
        const segments = breakdown.map(b => {
            const pct = b.count / total;
            const dash = pct * circumference;
            const gap = circumference - dash;
            const seg = { ...b, dash, gap, offset };
            offset += dash;
            return seg;
        });
        return (
            <div className="flex items-center gap-3 mt-auto w-full">
                <svg width="80" height="80" viewBox="0 0 80 80" className="flex-shrink-0 drop-shadow-sm">
                    {/* Background track */}
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f1f5f9" strokeWidth={stroke} />
                    {/* Segments */}
                    {segments.map((seg, i) => (
                        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                            stroke={seg.color} strokeWidth={stroke}
                            strokeDasharray={`${seg.dash} ${seg.gap}`}
                            strokeDashoffset={-seg.offset}
                            strokeLinecap="round"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'all 0.6s ease' }}
                        />
                    ))}
                    {/* Center label */}
                    <text x={cx} y={cy - 3} textAnchor="middle" fontSize="13" fontWeight="700" fill="#1e293b">{total}</text>
                    <text x={cx} y={cy + 11} textAnchor="middle" fontSize="7" fontWeight="500" fill="#94a3b8">TOTAL</text>
                </svg>
                {/* Legend */}
                <div className="flex-1 space-y-1">
                    {breakdown.map((b, i) => (
                        <div key={i} className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: b.color }} />
                                <span className="text-[9px] font-semibold text-slate-500 leading-none">{b.label}</span>
                            </div>
                            <span className="text-[10px] font-extrabold" style={{ color: b.color }}>{b.count}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div onClick={onClick}
            className="relative bg-white rounded-2xl p-5 border border-slate-100 transition-all duration-500 shadow-sm cursor-pointer group hover:-translate-y-1 hover:shadow-md hover:border-slate-200 overflow-hidden h-full flex flex-col justify-between">
            {/* Subtle Gradient Glow Effect */}
            <div className="absolute -right-10 -top-10 w-32 h-32 rounded-full blur-3xl opacity-10 transition-opacity duration-500 group-hover:opacity-20 pointer-events-none" style={{ background: color }}></div>

            <div>
                <div className="flex items-start justify-between mb-1 relative z-10">
                    <div className="text-[13px] font-semibold text-slate-500 tracking-wide">{label}</div>
                    {change !== undefined && (
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${isPos ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                            {isPos ? '▲' : '▼'} {Math.abs(change)}%
                        </span>
                    )}
                </div>
                <div className="text-3xl font-bold text-[#1e293b] tracking-tight leading-none mb-4 relative z-10 drop-shadow-sm">{value}</div>
            </div>

            {chartType === 'line' && (
                <div className="mt-auto relative z-10 w-full h-[60px] opacity-80 group-hover:opacity-100 transition-opacity">
                    <svg viewBox="0 0 200 60" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                        <defs>
                            <linearGradient id={`grad-${label.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                                <stop offset="100%" stopColor={color} stopOpacity="0" />
                            </linearGradient>
                            <filter id="glow">
                                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>
                        <path d="M0,50 C30,20 50,60 80,30 C110,0 140,40 170,10 C185,-5 200,10 200,10 L200,60 L0,60 Z" fill={`url(#grad-${label.replace(/\s+/g, '')})`} />
                        <path d="M0,50 C30,20 50,60 80,30 C110,0 140,40 170,10 C185,-5 200,10 200,10" fill="none" stroke={color} strokeWidth="3" filter="url(#glow)" />
                    </svg>
                </div>
            )}
            {chartType === 'bar' && (
                <div className="mt-auto relative z-10 w-full h-[60px] flex items-end justify-between gap-1 opacity-80 group-hover:opacity-100 transition-opacity pt-4">
                    {[40, 70, 45, 90, 60, 100, 75, 55].map((h, i) => (
                        <div key={i} className="flex-1 rounded-t-sm transition-all duration-500 ease-out group-hover:bg-opacity-100"
                            style={{ height: `${h}%`, background: color, opacity: i === 5 ? 1 : 0.6, boxShadow: i === 5 ? `0 0 10px ${color}` : 'none' }}></div>
                    ))}
                </div>
            )}
            {chartType === 'donut' && <DonutChart />}
        </div>
    );
};

// ─── Page Header ───────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, actions, badge }) => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 animate-fadeIn">
        <div>
            <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold tracking-tight text-[#1e293b] drop-shadow-sm">{title}</h1>
                {badge && (
                    <span className="px-2 py-0.5 text-[9px] font-bold rounded-lg uppercase tracking-wide flex items-center shadow-lg border border-green-200"
                        style={{ background: 'linear-gradient(135deg, #15803d, #166534)', color: '#fff' }}>
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse mr-1.5"></span>
                        {badge}
                    </span>
                )}
            </div>
            {subtitle && <p className="text-xs text-slate-600 mt-1 font-bold">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
);

// ─── Vendor Breadcrumb ─────────────────────────────────────────────────────
export const VendorBreadcrumb = ({ items }) => {
    const navigate = useNavigate();
    return (
        <nav className="flex items-center gap-1 text-xs text-slate-400 mb-2 animate-fadeIn">
            {items.map((item, i) => (
                <React.Fragment key={i}>
                    {i > 0 && <span>/</span>}
                    {item.path ? (
                        <button onClick={() => navigate(item.path)}
                            className="hover:text-green-700 transition-colors font-medium">{item.label}</button>
                    ) : (
                        <span className="text-slate-600 font-semibold">{item.label}</span>
                    )}
                </React.Fragment>
            ))}
        </nav>
    );
};

// ─── Search Bar ────────────────────────────────────────────────────────────
export const SearchBar = ({ value, onChange, placeholder = 'Search...', extra }) => (
    <div className="flex items-center gap-2">
        <div className="flex-1 relative group">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-900 transition-colors">🔍</span>
            <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-green-800 focus:ring-0 transition-all outline-none" />
        </div>
        {extra}
    </div>
);

// ─── Primary Button ────────────────────────────────────────────────────────
export const PrimaryBtn = ({ children, onClick, icon, small, className = '', disabled }) => (
    <button onClick={onClick} disabled={disabled}
        className={`group flex items-center justify-center gap-2 ${small ? 'px-4 py-2 text-[10px]' : 'px-6 py-2.5 text-[11px]'} font-bold rounded-full border border-green-200 bg-green-50 text-green-800 shadow-sm hover:bg-green-100 hover:border-green-300 active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:scale-100 whitespace-nowrap ${className.replace(/!bg-\S+/g, '').replace(/bg-\S+/g, '')} uppercase tracking-wider`}>
        {icon && <span className="group-hover:scale-110 transition-transform duration-300">{icon}</span>}
        {children}
    </button>
);

export const SecondaryBtn = ({ children, onClick, icon, small, className = '' }) => (
    <button onClick={onClick}
        className={`group flex items-center justify-center gap-2 ${small ? 'px-4 py-2 text-[10px]' : 'px-6 py-2.5 text-[11px]'} font-bold rounded-full border border-green-200 bg-green-50 text-green-800 shadow-sm hover:bg-green-100 hover:border-green-300 active:scale-95 transition-all duration-300 whitespace-nowrap ${className.replace(/!bg-\S+/g, '').replace(/bg-\S+/g, '')} uppercase tracking-wider`}>
        {icon && <span className="group-hover:scale-110 transition-transform duration-300">{icon}</span>}
        {children}
    </button>
);

export const DangerBtn = ({ children, onClick, small }) => (
    <button onClick={onClick}
        className={`flex items-center gap-1.5 ${small ? 'px-3.5 py-2 text-xs' : 'px-5 py-2.5 text-xs'} font-bold rounded-lg text-white active:scale-95 transition-all`}
        style={{ background: '#dc2626' }}>
        {children}
    </button>
);

// ─── AI Nudge Banner ───────────────────────────────────────────────────────
export const AINudgeBanner = ({ message, onAction, onDismiss, actionLabel = 'Generate' }) => (
    <div className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-700 mb-4 animate-fadeIn relative overflow-hidden">
        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-xl flex-shrink-0 border border-green-100">🤖</div>
        <p className="text-[13px] font-medium flex-1 text-slate-600">{message}</p>
        <div className="flex gap-2 flex-shrink-0">
            {onAction && (
                <button onClick={onAction}
                    className="px-4 py-2 text-xs font-bold rounded-lg text-white bg-green-800 hover:bg-green-700 transition-all uppercase tracking-wider">{actionLabel}</button>
            )}
            <button onClick={onDismiss}
                className="w-8 h-8 flex items-center justify-center text-[10px] text-slate-400 hover:text-slate-600 transition-all">
                ✕
            </button>
        </div>
    </div>
);

// ─── Card ──────────────────────────────────────────────────────────────────
export const VCard = ({ children, className = '', onClick, noPad }) => (
    <div onClick={onClick}
        className={`bg-white rounded-xl border border-slate-200 transition-all duration-300 ${noPad ? '' : 'p-5'} ${onClick ? 'cursor-pointer hover:border-green-600 hover:bg-slate-50/50' : ''} ${className}`}>
        {children}
    </div>
);

// ─── Table ─────────────────────────────────────────────────────────────────
export const VTable = ({ cols, rows, onRowClick, emptyMsg = 'No records found' }) => (
    <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full text-xs min-w-[600px]">
            <thead>
                <tr className="border-b border-slate-100" style={{ background: '#F8FAFC' }}>
                    {cols.map((c, i) => (
                        <th key={i} className="px-2.5 py-1.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">
                            {c.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.length === 0 ? (
                    <tr><td colSpan={cols.length} className="px-3 py-4 text-center text-slate-400 text-xs">{emptyMsg}</td></tr>
                ) : rows.map((row, ri) => (
                    <tr key={ri} onClick={() => onRowClick?.(row)}
                        className={`border-b border-slate-50 transition-colors duration-300 hover:-translate-y-0.5 ${onRowClick ? 'cursor-pointer hover:bg-green-50/50 hover:shadow-sm' : ''} ${ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                        {cols.map((c, ci) => (
                            <td key={ci} className="px-2.5 py-1.5 text-slate-700 whitespace-nowrap">{c.render ? c.render(row) : row[c.key]}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// ─── Tier Badge ────────────────────────────────────────────────────────────
const TIER_COLORS = { 
    Platinum: { bg: '#e0e7ff', text: '#4338ca', icon: <Diamond size={12} /> }, 
    Gold: { bg: '#fef3c7', text: '#92400e', icon: <Award size={12} /> }, 
    Silver: { bg: '#f1f5f9', text: '#475569', icon: <Medal size={12} /> }, 
    Bronze: { bg: '#ffedd5', text: '#9a3412', icon: <Trophy size={12} /> } 
};
export const TierBadge = ({ tier }) => {
    if (!tier) return null;
    const c = TIER_COLORS[tier] || TIER_COLORS.Bronze;
    return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold"
            style={{ background: c.bg, color: c.text }}>
            {c.icon} {tier}
        </span>
    );
};

// ─── Snapshot Card ─────────────────────────────────────────────────────────
export const SnapshotCard = ({ title, items }) => (
    <div className="bg-[#1e293b] p-8 rounded-[2rem] text-white shadow-xl shadow-slate-200">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">{title}</p>
        <div className="space-y-5">
            {items.map((item, i) => (
                <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                        <span className="text-lg opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: item.color }}>{item.icon}</span>
                        <span className="text-[12px] font-bold text-slate-300">{item.label}</span>
                    </div>
                    <span className="text-lg font-bold tracking-tight" style={{ color: item.color }}>{item.value}</span>
                </div>
            ))}
        </div>
    </div>
);

// ─── Empty State ───────────────────────────────────────────────────────────
export const EmptyState = ({ icon = <PackageOpen size={64} className="text-slate-300" />, title, desc, action }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-8 mt-4 flex flex-col items-center justify-center">
            {/* 3D Floating Box Animation */}
            <motion.div
                animate={{
                    y: [0, -20, 0],
                    rotate: [-3, 3, -3]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="text-7xl drop-shadow-[0_20px_20px_rgba(0,0,0,0.15)] relative z-10"
            >
                {icon}
            </motion.div>
            {/* Animated Dynamic Shadow */}
            <motion.div
                animate={{
                    scale: [1, 0.5, 1],
                    opacity: [0.3, 0.1, 0.3]
                }}
                transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="w-20 h-4 bg-slate-500 rounded-[100%] blur-[5px] absolute -bottom-5 z-0"
            />
        </div>
        <h3 className="text-xl font-extrabold text-slate-800 mb-2 tracking-tight">{title}</h3>
        <p className="text-sm font-medium text-slate-500 mb-6 max-w-sm leading-relaxed">{desc}</p>
        {action}
    </div>
);

// ─── Stat Row ──────────────────────────────────────────────────────────────
export const StatRow = ({ label, value, highlight }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
        <span className="text-sm text-slate-500">{label}</span>
        <span className={`text-sm font-bold ${highlight ? 'text-green-700' : 'text-slate-800'}`}>{value}</span>
    </div>
);

// ─── Section Title ─────────────────────────────────────────────────────────
export const SectionTitle = ({ children, action }) => (
    <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700">{children}</h2>
        {action}
    </div>
);

// ─── Stepper ──────────────────────────────────────────────────────────────
export const Stepper = ({ steps, current }) => (
    <div className="flex items-center w-full px-2">
        {steps.map((s, i) => {
            const done = i < current;
            const active = i === current;
            const label = typeof s === 'object' ? s.label : s;
            const icon = typeof s === 'object' ? s.icon : (i + 1);
            return (
                <React.Fragment key={i}>
                    <div className="flex flex-col items-center flex-shrink-0 relative group">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-300 border-2
                            ${done
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : active
                                    ? 'bg-[#00b020] border-[#00b020] text-white shadow-lg shadow-green-100'
                                    : 'bg-white border-slate-200 text-slate-400'}`}>
                            {done ? '✓' : icon}
                        </div>
                        <span className={`text-[9px] mt-2 font-bold text-center uppercase tracking-tight max-w-[70px] leading-tight transition-colors
                            ${active ? 'text-green-700' : done ? 'text-emerald-500' : 'text-slate-400'}`}>
                            {label}
                        </span>
                    </div>
                    {i < steps.length - 1 && (
                        <div className="flex-1 mx-2 h-[2px] bg-slate-100 rounded-full relative">
                            <div className="absolute left-0 top-0 bottom-0 rounded-full transition-all duration-700 ease-in-out"
                                style={{ width: i < current ? '100%' : '0%', background: '#10b981' }} />
                        </div>
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// ─── Modal ─────────────────────────────────────────────────────────────────
export const VModal = ({ open, onClose, title, children, width = 'max-w-xl' }) => {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}>
            <div className={`bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.14)] w-full ${width} max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 ease-out`}
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-10 py-8 border-b border-slate-50">
                    <div>
                        <h3 className="text-2xl font-extrabold text-[#1e293b] tracking-tight">{title}</h3>
                        <div className="w-12 h-1.5 bg-green-800 rounded-full mt-2" />
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 transition-all group">
                        <span className="text-xl group-hover:rotate-90 transition-transform duration-300">✕</span>
                    </button>
                </div>
                <div className="p-10 overflow-y-auto overflow-x-hidden custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

// ─── Tabs ──────────────────────────────────────────────────────────────────
export const VTabs = ({ tabs, active, onChange }) => (
    <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit mb-4">
        {tabs.map(t => (
            <button key={t.key} onClick={() => onChange(t.key)}
                className={`px-3 py-1.5 rounded-lg text-base font-bold transition-all ${active === t.key ? 'bg-white text-green-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {t.icon && <span className="mr-1">{t.icon}</span>}{t.label}
            </button>
        ))}
    </div>
);

// ─── Filter Pill ───────────────────────────────────────────────────────────
export const FilterBar = ({ filters, active, onChange }) => (
    <div className="flex gap-2 flex-wrap">
        {filters.map(f => (
            <button key={f.value} onClick={() => onChange(f.value)}
                className={`px-5 py-1.5 text-[12px] font-bold rounded-full border transition-all duration-300 uppercase tracking-wider ${active === f.value
                    ? 'border-green-800 bg-green-800 text-white shadow-md shadow-green-100'
                    : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'}`}>
                {f.label} {f.count !== undefined && <span className="ml-1 opacity-50">[{f.count}]</span>}
            </button>
        ))}
    </div>
);

// ─── Pagination ────────────────────────────────────────────────────────────
export const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    return (
        <div className="flex items-center justify-between mt-4 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
            <span className="text-xs font-semibold text-slate-500">
                Page <span className="text-slate-800 font-bold">{currentPage}</span> of <span className="text-slate-800 font-bold">{totalPages}</span>
            </span>
            <div className="flex items-center gap-1.5">
                <button
                    disabled={currentPage === 1}
                    onClick={() => onPageChange(currentPage - 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 font-bold bg-white border border-slate-200 rounded-lg transition-all disabled:opacity-30 hover:bg-slate-50"
                >
                    &lt;
                </button>
                {pages.map(p => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-lg transition-all ${currentPage === p
                            ? 'bg-green-800 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {p}
                    </button>
                ))}
                <button
                    disabled={currentPage === totalPages}
                    onClick={() => onPageChange(currentPage + 1)}
                    className="w-8 h-8 flex items-center justify-center text-slate-600 font-bold bg-white border border-slate-200 rounded-lg transition-all disabled:opacity-30 hover:bg-slate-50"
                >
                    &gt;
                </button>
            </div>
        </div>
    );
};

// ─── Multi Chart Switcher ──────────────────────────────────────────────────
const CHART_TYPES_NAV = [
    { key: 'bar', label: 'Bar', icon: <BarChart3 size={14} /> },
    { key: 'line', label: 'Line', icon: <LineChartIcon size={14} /> },
    { key: 'area', label: 'Area', icon: <AreaChartIcon size={14} /> },
    { key: 'pie', label: 'Pie', icon: <PieChartIcon size={14} /> },
    { key: 'radar', label: 'Radar', icon: <Activity size={14} /> },
];

const PIE_COLORS = ['#166534', '#16a34a', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6'];

export const MultiChart = ({ data, series, xAxisKey = 'name', height = 300, yAxisFormatter, title, defaultType = 'bar' }) => {
    const [chartType, setChartType] = useState(defaultType);

    const renderChart = () => {
        const commonProps = { data, margin: { top: 10, right: 10, left: -20, bottom: 0 } };

        switch (chartType) {
            case 'radar':
                return (
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                        <PolarGrid stroke="#f1f5f9" />
                        <PolarAngleAxis dataKey={xAxisKey} tick={{ fontSize: 10, fontWeight: 700, fill: '#94a3b8' }} />
                        {series.map((s, i) => (
                            <Radar key={i} name={s.label} dataKey={s.key} stroke={s.color} fill={s.color} fillOpacity={0.1} strokeWidth={2.5} />
                        ))}
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    </RadarChart>
                );
            case 'line':
                return (
                    <LineChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={yAxisFormatter} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} />
                        {series.map((s, i) => (
                            <Line key={i} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={3} dot={{ r: 4, fill: s.color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                        ))}
                    </LineChart>
                );
            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        <defs>
                            {series.map((s, i) => (
                                <linearGradient key={i} id={`color-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                                </linearGradient>
                            ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={yAxisFormatter} />
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} />
                        {series.map((s, i) => (
                            <Area key={i} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} fillOpacity={1} fill={`url(#color-${s.key})`} strokeWidth={3} />
                        ))}
                    </AreaChart>
                );
            case 'pie':
                const pieData = data.map(d => ({ name: d[xAxisKey], value: d[series[0].key] }));
                return (
                    <PieChart>
                        <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                            {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    </PieChart>
                );
            case 'bar':
            default:
                return (
                    <BarChart {...commonProps}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={yAxisFormatter} domain={[0, 'auto']} />
                        <Tooltip cursor={{ fill: '#F8FAFC' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', paddingTop: '10px' }} />
                        {series.map((s, i) => (
                            <Bar key={i} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} barSize={series.length > 1 ? 15 : 30} />
                        ))}
                    </BarChart>
                );
        }
    };

    return (
        <div className="w-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                {title && <h3 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{title}</h3>}
                <div className="flex flex-wrap gap-1 bg-slate-50/50 p-1 rounded-xl border border-slate-100">
                    {CHART_TYPES_NAV.map(type => (
                        <button
                            key={type.key}
                            onClick={() => setChartType(type.key)}
                            title={type.label}
                            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all duration-300 ${chartType === type.key
                                ? 'bg-white text-green-700 shadow-sm border border-green-50'
                                : 'text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <span>{type.icon}</span>
                            <span className="hidden xl:inline">{type.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            <div style={{ height }} className="w-full">
                <ResponsiveContainer width="100%" height="100%">
                    {renderChart()}
                </ResponsiveContainer>
            </div>
        </div>
    );
};
