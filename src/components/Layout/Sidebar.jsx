import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ShoppingCart, Package, FileText, History,
    BarChart3, Warehouse, Settings, Store, X, LogOut, Users,
    Tag, UploadCloud, ChevronDown, Truck, CreditCard, ClipboardList,
    ScanLine, Receipt, TrendingUp, Bot, Globe, ArrowLeftRight,
    Activity, MessageCircle, Bell, CheckSquare, Building2, Gavel, Sparkles,
    Map as MapIcon, ClipboardCheck, RefreshCw, Zap, DollarSign, Smartphone, SlidersHorizontal
} from 'lucide-react';
import { VENDOR_ROUTES } from '../../pages/Vendors/vendorConstants';
import useAuthStore from '../../store/useAuthStore';
import useNotificationStore from '../../store/useNotificationStore';

const Sidebar = ({ isPOS, isOpen, isCollapsed, onClose }) => {
    const logout = useAuthStore((state) => state.logout);
    const unreadNotifications = useNotificationStore(state => state.getUnreadCount());
    const navigate = useNavigate();
    const location = useLocation();
    const isSpecialLayout = isPOS || location.pathname === '/bulk-upload';
    const isVendorRoute = location.pathname.startsWith('/vendors');

    const [vendorOpen, setVendorOpen] = useState(isVendorRoute);

    // Auto-close vendor menu when sidebar is collapsed for smoothness
    useEffect(() => {
        if (isCollapsed) setVendorOpen(false);
    }, [isCollapsed]);

    const handleLogout = () => { logout(); navigate('/login'); };

    const VENDOR_MENU_DYNAMIC = [
        { icon: <LayoutDashboard size={16} />, label: 'Dashboard', path: VENDOR_ROUTES.dashboard, badge: null },
        { icon: <Users size={16} />, label: 'Vendor List', path: VENDOR_ROUTES.list },
        { icon: <Package size={16} />, label: 'Vendor Products', path: VENDOR_ROUTES.productList },
        // { icon: <ClipboardList size={16} />, label: 'Onboarding Tracker', path: VENDOR_ROUTES.onboardingWorkflow },
        { icon: <FileText size={16} />, label: 'Purchase Orders', path: VENDOR_ROUTES.poList },
        { icon: <ScanLine size={16} />, label: 'GRN Management', path: VENDOR_ROUTES.grnList },
        { icon: <Receipt size={16} />, label: 'Invoices', path: VENDOR_ROUTES.purchaseInvoice },
        { icon: <CreditCard size={16} />, label: 'Payables', path: VENDOR_ROUTES.payablesDash },
        { icon: <RefreshCw size={16} />, label: 'Returns & Claims', path: VENDOR_ROUTES.rtvWorkflow },
        { icon: <RefreshCw size={16} />, label: 'GST Reconciliation', path: VENDOR_ROUTES.gstRecon },
        { icon: <Activity size={16} />, label: 'Fulfillment', path: VENDOR_ROUTES.fulfillment },
        { icon: <TrendingUp size={16} />, label: 'Scorecard', path: VENDOR_ROUTES.scorecard },
        { icon: <BarChart3 size={16} />, label: 'Reports Hub', path: VENDOR_ROUTES.reports },
        { icon: <Globe size={16} />, label: 'Vendor Portal', path: VENDOR_ROUTES.portal },
        { icon: <Building2 size={16} />, label: 'Multi-Outlet', path: VENDOR_ROUTES.multiOutlet },
        { icon: <MapIcon size={16} />, label: 'Warehouse Map', path: VENDOR_ROUTES.warehouseMap },
        { icon: <ArrowLeftRight size={16} />, label: 'Stock Transfer', path: VENDOR_ROUTES.stockTransferAdvanced },
        { icon: <ClipboardCheck size={16} />, label: 'Cycle Audit', path: VENDOR_ROUTES.cycleAudit },
        { icon: <Zap size={16} />, label: 'Predictive Expiry', path: VENDOR_ROUTES.predictiveExpiry },
        { icon: <MessageCircle size={16} />, label: 'WhatsApp Comms', path: VENDOR_ROUTES.whatsapp },
        //{ icon: <Bell size={16} />, label: 'Notifications', path: VENDOR_ROUTES.notifications, badge: unreadNotifications > 0 ? unreadNotifications.toString() : null },
        { icon: <CheckSquare size={16} />, label: 'Approval Queue', path: VENDOR_ROUTES.approvalQueue, badge: '3' },
        { icon: <Sparkles size={16} />, label: 'Smart PO', path: VENDOR_ROUTES.smartPO },
        { icon: <TrendingUp size={16} />, label: 'Forecasting', path: VENDOR_ROUTES.demandForecasting },
        { icon: <Gavel size={16} />, label: 'Live Auction', path: VENDOR_ROUTES.reverseAuction, badge: 'Live' },
        { icon: <Warehouse size={16} />, label: 'Inbound Logistics', path: VENDOR_ROUTES.inboundLogistics, badge: 'New' },
        { icon: <DollarSign size={16} />, label: 'Aggregator Payout', path: VENDOR_ROUTES.aggregatorPayout },
        { icon: <Smartphone size={16} />, label: 'Mobile GRN', path: VENDOR_ROUTES.mobileGrn },
        { icon: <SlidersHorizontal size={16} />, label: 'Vendor Settings', path: VENDOR_ROUTES.settings },
    ];

    const sidebarClasses = `${isCollapsed ? 'w-20' : 'w-64'} flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] group
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        ${isSpecialLayout
            ? 'lg:-translate-x-[calc(100%-12px)] lg:hover:translate-x-0 lg:shadow-2xl'
            : 'lg:translate-x-0'
        }
        bg-white border-r border-slate-200 overflow-x-hidden will-change-[width,transform]
        `;

    return (
        <aside className={sidebarClasses}>
            {isSpecialLayout && (
                <div className="hidden lg:flex absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-r from-transparent to-slate-200/50 cursor-pointer items-center justify-center group-hover:opacity-0 transition-opacity">
                    <div className="w-1 h-12 bg-slate-400 rounded-full opacity-50 shadow-sm" />
                </div>
            )}

            {/* Logo */}
            <div className={`p-5 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} border-b border-slate-100 bg-slate-50/20`}>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 shrink-0">
                        <Truck size={22} strokeWidth={2.5} />
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <h1 className="font-extrabold tracking-tight text-[15px] truncate text-slate-900">Vendor Portal</h1>
                            <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase tracking-[0.1em]">
                                {/* <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shrink-0" /> */}
                                {/* <span className="truncate">Management Suite</span> */}
                            </div>
                        </div>
                    )}
                </div>
                {!isCollapsed && (
                    <button onClick={onClose} className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100">
                        <X size={20} />
                    </button>
                )}
            </div>

            <nav className="flex-1 p-3 overflow-y-auto space-y-1">
                <div className={`mb-4 px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest ${isCollapsed ? 'text-center' : ''}`}>
                    {isCollapsed ? 'Menu' : 'Main Navigation'}
                </div>

                {VENDOR_MENU_DYNAMIC.map((item, i) => {
                    const isActive = location.pathname === item.path ||
                        (item.path !== '/vendors/dashboard' && item.path !== '/vendors/list' && location.pathname.startsWith(item.path));

                    return (
                        <NavLink key={item.path} to={item.path} onClick={onClose}
                            title={isCollapsed ? item.label : undefined}
                            className={() =>
                                `group relative flex items-center ${isCollapsed ? 'justify-center mx-auto w-10 h-10' : 'justify-between gap-3 px-3 py-2.5'} rounded-xl text-[14px] font-semibold transition-all duration-300 overflow-hidden mb-0.5 ${isActive
                                    ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-200'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600 border border-transparent'
                                }`
                            }
                        >
                            <div className="relative z-10 flex items-center gap-3">
                                <div className={`transition-all duration-500 ease-out flex items-center justify-center ${isActive
                                    ? 'scale-110 text-indigo-600'
                                    : 'text-slate-500 group-hover:scale-110 group-hover:text-indigo-500'
                                    }`}>
                                    {React.cloneElement(item.icon, {
                                        size: 18,
                                        strokeWidth: isActive ? 2.5 : 2
                                    })}
                                </div>
                                <div className={`flex items-center transition-all duration-300 ${isCollapsed ? 'w-0 opacity-0 invisible' : 'w-auto opacity-100'}`}>
                                    <span className={`whitespace-nowrap ${isActive ? 'font-bold' : ''}`}>{item.label}</span>
                                </div>
                            </div>

                            {!isCollapsed && item.badge && (
                                <span className={`relative z-10 px-2 py-0.5 text-[9px] font-bold rounded-md text-white ${isActive ? 'scale-110' : 'group-hover:scale-110'} `}
                                    style={{
                                        background: item.badge === 'AI' || item.badge === 'Live'
                                            ? 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)'
                                            : 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                                    }}>
                                    {item.badge}
                                </span>
                            )}
                        </NavLink>
                    )
                })}
            </nav>

            {/* Bottom */}
            <div className={`p-3 border-t space-y-0.5 border-slate-100`}>
                <NavLink to="/settings" onClick={onClose}
                    title={isCollapsed ? 'Settings' : undefined}
                    className={({ isActive }) =>
                        `flex items-center ${isCollapsed ? 'justify-center mx-auto w-10 h-10' : 'gap-3 px-3 py-2.5'} rounded-xl font-medium transition-all text-sm mb-0.5 ${isActive
                            ? 'bg-blue-50 text-blue-700 font-bold'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                        }`
                    }>
                    <Settings size={20} />
                    {!isCollapsed && <span>Settings</span>}
                </NavLink>
                <button onClick={handleLogout}
                    title={isCollapsed ? 'Logout' : undefined}
                    className={`flex items-center ${isCollapsed ? 'justify-center mx-auto w-10 h-10' : 'w-full gap-3 px-3 py-2.5'} rounded-xl font-medium transition-all text-left text-sm text-red-500 hover:bg-red-50`}>
                    <LogOut size={20} />
                    {!isCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
