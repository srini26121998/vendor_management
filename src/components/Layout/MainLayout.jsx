import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Store, Menu, LogOut, Settings, ChevronDown, ChevronLeft, Home, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import useSyncStore from '../../store/useSyncStore';
import useAuthStore from '../../store/useAuthStore';
import useBusinessStore from '../../store/useBusinessStore';
import backupService from '../../api/backupService';

const MainLayout = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    const isVendorList = location.pathname === '/vendors/list';
    const { isOnline, setOnline } = useSyncStore();
    const { user, logout } = useAuthStore();
    const { fetchSettings } = useBusinessStore();
    
    const [isSidebarOpen, setIsSidebarOpen] = useState(!isVendorList);
    const [isCollapsed, setIsCollapsed] = useState(isVendorList);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    useEffect(() => {
        const onVendorList = location.pathname === '/vendors/list';
        if (onVendorList) {
            setIsCollapsed(true);
            setIsSidebarOpen(false);
        } else {
            setIsCollapsed(false);
            if (window.innerWidth < 1024) {
                setIsSidebarOpen(true);
            }
        }
    }, [location.pathname]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const userInitials = user?.name
        ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
        : user?.email ? user.email[0].toUpperCase() : 'AD';

    const userDisplay = user?.name || user?.email || 'Vendor Admin';

    return (
        <div className="flex min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
            <Sidebar 
                isOpen={isSidebarOpen} 
                isCollapsed={isCollapsed} 
                onClose={() => {
                    setIsSidebarOpen(false);
                    if (window.innerWidth >= 1024) setIsCollapsed(true);
                }} 
            />

            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <main className={`flex-1 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ml-0 ${isCollapsed ? 'lg:ml-20' : 'lg:ml-64'} p-3 sm:p-4 lg:p-6`}>
                <header className="mb-6 bg-white border-slate-200 shadow-sm p-3.5 -mt-3 sm:-mt-4 lg:-mt-6 -mx-3 sm:-mx-4 lg:-mx-6 border-b sticky top-0 transition-colors z-30 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => {
                                if (window.innerWidth >= 1024) setIsCollapsed(!isCollapsed);
                                else setIsSidebarOpen(true);
                            }}
                            className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="flex items-center gap-2 text-slate-400">
                            <Store size={16} />
                            <span className="text-[11px] lg:text-[13px] font-bold uppercase leading-none mt-0.5 whitespace-nowrap">Vendor Management</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-4">
                        <button
                            onClick={() => setOnline(!isOnline)}
                            className={`px-2 lg:px-3 py-1 ${isOnline ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'} rounded-full text-[10px] lg:text-xs font-bold uppercase tracking-wide transition-colors cursor-pointer hover:opacity-80 active:scale-95`}
                        >
                            {isOnline ? '● Online' : '○ Offline'}
                        </button>

                        <div className="relative" ref={userMenuRef}>
                            <button
                                onClick={() => setIsUserMenuOpen(v => !v)}
                                className="flex items-center gap-2 px-2 py-1.5 rounded-xl transition-all hover:bg-slate-100"
                            >
                                <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-full bg-gradient-to-br from-indigo-600 to-blue-700 border-2 border-white shadow flex items-center justify-center shrink-0">
                                    <span className="text-white font-bold text-xs lg:text-sm">{userInitials}</span>
                                </div>
                                <span className="hidden lg:block text-xs font-bold max-w-[100px] truncate text-slate-600">
                                    {userDisplay}
                                </span>
                                <ChevronDown size={14} className={`hidden lg:block text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                                        <div className="font-bold text-slate-800 text-sm truncate">{userDisplay}</div>
                                        {user?.email && <div className="text-slate-400 text-xs truncate mt-0.5">{user.email}</div>}
                                    </div>
                                    <div className="p-1.5">
                                        <button
                                            onClick={() => { setIsUserMenuOpen(false); navigate('/vendors/settings'); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-600 hover:bg-slate-50 transition-all text-sm font-medium"
                                        >
                                            <Settings size={15} />
                                            Settings
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-all text-sm font-medium"
                                        >
                                            <LogOut size={15} />
                                            Sign Out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                
                <div className="max-w-[1600px] mx-auto w-full">
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors group"
                                title="Go Back"
                            >
                                <ArrowLeft size={18} className="group-active:-translate-x-1 transition-transform" />
                            </button>

                            <nav className="flex items-center text-sm font-medium text-slate-500 overflow-x-auto no-scrollbar">
                                <Link to="/vendors/dashboard" className="flex items-center hover:text-indigo-600 transition-colors">
                                    <Home size={14} className="mr-1.5" />
                                </Link>

                                {location.pathname.split('/').filter(Boolean).map((path, idx, arr) => {
                                    const to = `/${arr.slice(0, idx + 1).join('/')}`;
                                    const isLast = idx === arr.length - 1;
                                    const label = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');

                                    return (
                                        <React.Fragment key={to}>
                                            <ChevronLeft size={12} className="mx-2 text-slate-300 rotate-180" />
                                            {isLast ? (
                                                <span className="text-slate-900 font-bold truncate">{label}</span>
                                            ) : (
                                                <Link to={to} className="hover:text-indigo-600 transition-colors truncate max-w-[150px]">
                                                    {label}
                                                </Link>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </nav>
                        </div>
                    </div>
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
