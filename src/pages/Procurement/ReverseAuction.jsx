import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Area, Line, ComposedChart,
    Bar, BarChart, LineChart, PieChart, Pie, Cell
} from 'recharts';
import { VENDOR_ROUTES } from '../Vendors/vendorConstants';
import { PageHeader, VCard, VendorBreadcrumb, PrimaryBtn, SecondaryBtn, VModal, VTable } from '../Vendors/VendorComponents';
import {
    Timer, Users, TrendingDown, Play, Pause,
    StopCircle, Trophy, Zap, MessageSquare,
    Monitor, Smartphone, ChevronRight, Gavel,
    ShieldAlert, ArrowLeft, Sparkles, Info,
    History, Award, Download, FileText, Eye, LayoutGrid,
    Clock, DollarSign, Edit3, List, Package,
    Plus, Save, Settings, Tag, UserPlus,
    ArrowUpRight, Shield, ShieldCheck, Trash2,
    Calendar, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import {
    fetchVendors,
    fetchAuctions,
    fetchAuctionById,
    fetchAuctionBids,
    createAuction,
    updateAuctionStatus,
    fetchProducts
} from '../../api/vendorService';

// ─── LIGHTWEIGHT NATIVE WEB SOCKET STOMP CLIENT ────────────────────────────────
class SimpleStompClient {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.subscriptions = {};
        this.connected = false;
        this.onConnect = null;
        this.onDisconnect = null;
    }

    connect(onConnect, onDisconnect) {
        this.onConnect = onConnect;
        this.onDisconnect = onDisconnect;
        
        try {
            this.ws = new WebSocket(this.url);
        } catch (err) {
            console.error("WebSocket Connection Failed Init:", err);
            if (this.onDisconnect) this.onDisconnect();
            return;
        }

        this.ws.onopen = () => {
            const frame = "CONNECT\naccept-version:1.1,1.0\nheart-beat:10000,10000\n\n\u0000";
            this.ws.send(frame);
        };

        this.ws.onmessage = (event) => {
            const data = event.data;
            const commandEnd = data.indexOf('\n');
            if (commandEnd === -1) return;
            const command = data.substring(0, commandEnd).trim();
            
            if (command === 'CONNECTED') {
                this.connected = true;
                if (this.onConnect) this.onConnect();
            } else if (command === 'MESSAGE') {
                const headerEnd = data.indexOf('\n\n');
                if (headerEnd === -1) return;
                const bodyWithNull = data.substring(headerEnd + 2);
                const body = bodyWithNull.substring(0, bodyWithNull.indexOf('\u0000'));
                
                const destinationMatch = data.match(/destination:(.+)/);
                if (destinationMatch) {
                    const dest = destinationMatch[1].trim();
                    if (this.subscriptions[dest]) {
                        try {
                            this.subscriptions[dest](JSON.parse(body));
                        } catch (e) {
                            this.subscriptions[dest](body);
                        }
                    }
                }
            }
        };

        this.ws.onerror = (err) => {
            console.error("WebSocket Error:", err);
        };

        this.ws.onclose = () => {
            this.connected = false;
            if (this.onDisconnect) this.onDisconnect();
        };
    }

    subscribe(destination, callback) {
        this.subscriptions[destination] = callback;
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            const subId = 'sub-' + Math.random().toString(36).substring(2, 11);
            const frame = `SUBSCRIBE\nid:${subId}\ndestination:${destination}\nack:auto\n\n\u0000`;
            this.ws.send(frame);
        }
    }

    send(destination, body) {
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            const bodyStr = typeof body === 'object' ? JSON.stringify(body) : body;
            const frame = `SEND\ndestination:${destination}\ncontent-type:application/json\ncontent-length:${bodyStr.length}\n\n${bodyStr}\u0000`;
            this.ws.send(frame);
        } else {
            console.warn("Cannot send STOMP frame - socket not connected");
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
        this.connected = false;
        this.subscriptions = {};
    }
}

// Helper to safely parse API domain to WebSocket protocol
const getWebSocketUrl = () => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    try {
        const url = new URL(apiUrl);
        const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
        return `${protocol}//${url.host}/ws-auction`;
    } catch (e) {
        const wsBase = apiUrl.replace(/^http/, 'ws');
        return `${wsBase}/ws-auction`;
    }
};

export default function ReverseAuction() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const userId = user?.id;

    // View States
    const [view, setView] = useState('lobby'); // 'lobby', 'create', 'room'
    const [role, setRole] = useState('host'); // 'host', 'vendor'

    // Directory Lists
    const [auctions, setAuctions] = useState([]);
    const [products, setProducts] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    // Selected Session States
    const [activeAuction, setActiveAuction] = useState(null);
    const [bids, setBids] = useState([]);
    const [timeLeft, setTimeLeft] = useState(0);
    const [selectedVendorId, setSelectedVendorId] = useState('');
    const [vendorBid, setVendorBid] = useState('');
    const [isConfirmed, setIsConfirmed] = useState(false);

    // Form Creation State
    const [form, setForm] = useState({
        productId: '',
        quantity: '5000',
        ceilingPrice: '150',
        durationMinutes: '15',
        autoAward: true,
        notes: ''
    });

    // Refs
    const stompClientRef = useRef(null);
    const timerRef = useRef(null);

    // Load Initial Data (Lobby & Forms)
    const loadLobbyData = async () => {
        setLoading(true);
        try {
            const [auctionRes, productRes, vendorRes] = await Promise.all([
                fetchAuctions(),
                fetchProducts(),
                fetchVendors()
            ]);
            setAuctions(auctionRes.data || auctionRes || []);
            setProducts(productRes.data || productRes || []);
            
            const fetchedVendors = vendorRes.data || vendorRes || [];
            setVendors(fetchedVendors);
            if (fetchedVendors.length > 0) {
                setSelectedVendorId(fetchedVendors[0].id);
            }
        } catch (err) {
            console.error("Error loading Reverse Auction catalog:", err);
            toast.error("Failed to load auction data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLobbyData();
        return () => {
            if (stompClientRef.current) stompClientRef.current.disconnect();
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    // Countdown Timer logic for Room view
    useEffect(() => {
        if (view !== 'room' || !activeAuction || activeAuction.status !== 'ACTIVE') {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        const updateTimer = () => {
            const end = new Date(activeAuction.endTime).getTime();
            const now = new Date().getTime();
            const diff = Math.max(0, Math.floor((end - now) / 1000));
            setTimeLeft(diff);

            if (diff === 0) {
                clearInterval(timerRef.current);
                handleAuctionExpiry();
            }
        };

        updateTimer();
        timerRef.current = setInterval(updateTimer, 1000);

        return () => clearInterval(timerRef.current);
    }, [view, activeAuction]);

    const handleAuctionExpiry = async () => {
        if (!activeAuction) return;
        toast("Auction SLA time limit reached. Finalizing...", { icon: '⌛' });
        try {
            const res = await updateAuctionStatus(activeAuction.id, 'CLOSED');
            setActiveAuction(res.data || res);
            toast.success("Auction closed automatically!");
            loadLobbyData();
        } catch (err) {
            console.error("Failed to auto-close auction:", err);
        }
    };

    // Join a Live Session (Enter Room)
    const joinRoom = async (auction) => {
        setLoading(true);
        setActiveAuction(auction);
        setView('room');
        setIsConfirmed(false);
        setVendorBid('');

        try {
            // Load initial bid history
            const bidLogs = await fetchAuctionBids(auction.id);
            setBids(bidLogs.data || bidLogs || []);

            // Establish WebSocket Live Connection
            if (stompClientRef.current) {
                stompClientRef.current.disconnect();
            }

            const client = new SimpleStompClient(getWebSocketUrl());
            stompClientRef.current = client;

            client.connect(
                () => {
                    console.log("STOMP WebSocket Connected for auction:", auction.id);
                    // Subscribe to the dynamic auction room channel
                    client.subscribe(`/topic/auctions/${auction.id}`, (payload) => {
                        // Payload: { auctionId, newLowestPrice, vendorName, timestamp }
                        toast(`New lowest bid: ₹${payload.newLowestPrice} by ${payload.vendorName}`, { icon: '🔨' });
                        // Re-fetch bids list to ensure chronological order and exact database sync
                        fetchAuctionBids(auction.id).then(res => {
                            setBids(res.data || res || []);
                        });
                    });
                },
                () => {
                    console.warn("WebSocket disconnected from Reverse Auction channel");
                }
            );
        } catch (err) {
            console.error("Failed to enter bidding room:", err);
            toast.error("Failed to synchronize live bidding room");
        } finally {
            setLoading(false);
        }
    };

    // Return to Lobby
    const exitRoom = () => {
        if (stompClientRef.current) {
            stompClientRef.current.disconnect();
            stompClientRef.current = null;
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setView('lobby');
        setActiveAuction(null);
        setBids([]);
        loadLobbyData();
    };

    // Save a new Reverse Auction
    const handleLaunchSession = async (e) => {
        e.preventDefault();
        if (!form.productId) {
            return toast.error("Please select a target SKU/Product");
        }
        if (!form.quantity || parseFloat(form.quantity) <= 0) {
            return toast.error("Please enter a valid procurement quantity");
        }
        if (!form.ceilingPrice || parseFloat(form.ceilingPrice) <= 0) {
            return toast.error("Please enter a valid unit ceiling price");
        }

        setLoading(true);
        try {
            const payload = {
                productId: form.productId,
                quantity: parseFloat(form.quantity),
                ceilingPrice: parseFloat(form.ceilingPrice),
                durationMinutes: parseInt(form.durationMinutes) || 15
            };

            await createAuction(payload, userId);
            toast.success("Reverse Auction Session Launched Successfully!");
            setView('lobby');
            setForm({
                productId: '',
                quantity: '5000',
                ceilingPrice: '150',
                durationMinutes: '15',
                autoAward: true,
                notes: ''
            });
            loadLobbyData();
        } catch (err) {
            console.error("Failed to create auction session:", err);
            toast.error(err.response?.data?.message || "Failed to launch procurement session");
        } finally {
            setLoading(false);
        }
    };

    // Place a Real Bid (Vendor view)
    const handlePlaceBid = () => {
        if (!activeAuction || activeAuction.status !== 'ACTIVE') {
            return toast.error("Bidding is currently inactive or closed");
        }
        if (!selectedVendorId) {
            return toast.error("Please select a participating vendor profile");
        }
        const bidAmount = parseFloat(vendorBid);
        if (!bidAmount || isNaN(bidAmount) || bidAmount <= 0) {
            return toast.error("Please enter a valid bid amount");
        }

        // Validate ceiling price
        if (bidAmount > activeAuction.ceilingPrice) {
            return toast.error(`Bid cannot exceed the ceiling price of ₹${activeAuction.ceilingPrice.toFixed(2)}`);
        }

        // Validate lowest bid
        const currentLowest = bids.length > 0 ? bids[0].bidAmount : activeAuction.ceilingPrice;
        if (bidAmount >= currentLowest) {
            return toast.error(`Your bid must be lower than the current lowest of ₹${currentLowest.toFixed(2)}`);
        }

        if (!isConfirmed) {
            return toast.error("Please confirm this bid is legally binding");
        }

        // Send STOMP payload to Spring Boot message broker
        if (stompClientRef.current && stompClientRef.current.connected) {
            const payload = {
                auctionId: activeAuction.id,
                vendorId: selectedVendorId,
                bidAmount: bidAmount
            };

            stompClientRef.current.send("/app/auction/bid", payload);
            toast.success("Bid transmitted over live network!");
            setVendorBid('');
            setIsConfirmed(false);
        } else {
            toast.error("Network connection unstable. Reconnecting...");
            joinRoom(activeAuction);
        }
    };

    // Close or Award the Bidding Room (Host view)
    const handleUpdateStatus = async (newStatus) => {
        if (!activeAuction) return;
        setLoading(true);
        try {
            const res = await updateAuctionStatus(activeAuction.id, newStatus);
            setActiveAuction(res.data || res);
            toast.success(`Session status marked as ${newStatus}`);
            loadLobbyData();
        } catch (err) {
            console.error("Failed to adjust session status:", err);
            toast.error("Failed to update session status");
        } finally {
            setLoading(false);
        }
    };

    // Format remaining duration
    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // Chart Data calculations
    const chartData = useMemo(() => {
        if (bids.length === 0) return [];
        // Map bids sorted chronologically for progression graph (flip asc to desc bidTime)
        return [...bids]
            .reverse()
            .map((b, idx) => ({
                name: `Bid #${idx + 1}`,
                price: b.bidAmount,
                vendor: b.vendor?.legalName || 'Anonymous'
            }));
    }, [bids]);

    // Savings Calculation
    const savingsPercentage = useMemo(() => {
        if (!activeAuction || bids.length === 0) return 0;
        const lowest = bids[0].bidAmount;
        const ceiling = activeAuction.ceilingPrice;
        return ((ceiling - lowest) / ceiling) * 100;
    }, [activeAuction, bids]);

    const totalSavings = useMemo(() => {
        if (!activeAuction || bids.length === 0) return 0;
        const lowest = bids[0].bidAmount;
        const ceiling = activeAuction.ceilingPrice;
        return (ceiling - lowest) * activeAuction.quantity;
    }, [activeAuction, bids]);

    if (loading && view === 'lobby' && auctions.length === 0) {
        return (
            <div className="w-full min-h-screen bg-[#F3F5F9] flex items-center justify-center" style={{ fontFamily: '"Inter", sans-serif' }}>
                <div className="bg-white rounded-3xl p-10 shadow-2xl flex flex-col items-center gap-4 max-w-sm border border-slate-100/50">
                    <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <h3 className="text-base font-bold text-slate-800 tracking-tight">Syncing Procurement Broker...</h3>
                    <p className="text-xs text-slate-400 font-medium text-center leading-relaxed">Connecting to the live STOMP gateway and loading active reverse auction sessions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-[#F3F5F9] min-h-screen p-4 sm:p-8" style={{ fontFamily: '"Inter", sans-serif' }}>
            <AnimatePresence mode="wait">
                {/* ─── LOBBY VIEW ─────────────────────────────────────────────────── */}
                {view === 'lobby' && (
                    <motion.div
                        key="lobby"
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="space-y-6"
                    >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h1 className="text-[24px] font-bold text-[#1e293b] tracking-tight">Reverse Auction Panel</h1>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Real-time dynamic reverse bidding. Launch sessions, select products, and watch prices fall.</p>
                            </div>
                            <PrimaryBtn onClick={() => setView('create')} icon={<Plus size={16} />}>
                                Launch Auction Session
                            </PrimaryBtn>
                        </div>

                        {/* Top Statistics Block */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Ongoing Sessions', count: auctions.filter(a => a.status === 'ACTIVE').length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: <TrendingDown size={20} /> },
                                { label: 'Scheduled Bids', count: auctions.filter(a => a.status === 'SCHEDULED').length, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', icon: <Clock size={20} /> },
                                { label: 'Completed Awards', count: auctions.filter(a => a.status === 'CLOSED' || a.status === 'AWARDED').length, color: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', icon: <Trophy size={20} /> },
                                { label: 'Total Catalog Products', count: products.length, color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200', icon: <Package size={20} /> },
                            ].map((stat, idx) => (
                                <VCard key={idx} className="!p-5 bg-white border-slate-100/80 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                                        <h3 className="text-[22px] font-bold text-slate-800 mt-1">{stat.count}</h3>
                                    </div>
                                    <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-105 transition-transform`}>
                                        {stat.icon}
                                    </div>
                                </VCard>
                            ))}
                        </div>

                        {/* Auctions Lists */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Live & Scheduled Lobby Cards (8 Columns) */}
                            <div className="lg:col-span-8 space-y-4">
                                <h3 className="text-[14px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <List size={16} /> Active Auction Rooms
                                </h3>

                                {auctions.length === 0 ? (
                                    <VCard className="py-16 text-center bg-white border-slate-100">
                                        <TrendingDown size={40} className="text-slate-300 mx-auto mb-3" />
                                        <h4 className="text-sm font-bold text-slate-600">No Bidding Rooms Active</h4>
                                        <p className="text-xs text-slate-400 mt-1">Select a catalog product and click 'Launch Session' to invite vendors.</p>
                                    </VCard>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {auctions.map(auc => {
                                            const isLive = auc.status === 'ACTIVE';
                                            const isClosed = auc.status === 'CLOSED' || auc.status === 'AWARDED';
                                            return (
                                                <VCard key={auc.id} className="p-6 bg-white border-slate-100 hover:shadow-md hover:border-blue-200 transition-all flex flex-col justify-between">
                                                    <div>
                                                        <div className="flex items-center justify-between gap-2 mb-3">
                                                            <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
                                                                {auc.auctionNumber}
                                                            </span>
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                                                isLive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse' :
                                                                isClosed ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                                                                'bg-amber-50 text-amber-700 border border-amber-200'
                                                            }`}>
                                                                {auc.status}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-base font-bold text-slate-800 truncate mb-1">
                                                            {auc.product?.name}
                                                        </h4>
                                                        <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                                            <Package size={12} /> Target Qty: <span className="font-bold text-slate-700">{auc.quantity.toLocaleString()} units</span>
                                                        </p>

                                                        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-50">
                                                            <div>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Ceiling price</p>
                                                                <p className="text-sm font-bold text-slate-700 mt-0.5">₹{auc.ceilingPrice.toFixed(2)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase">End Time</p>
                                                                <p className="text-sm font-bold text-slate-700 mt-0.5 truncate">
                                                                    {new Date(auc.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-5">
                                                        {isClosed ? (
                                                            <SecondaryBtn onClick={() => joinRoom(auc)} className="w-full text-center py-2.5 !rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100">
                                                                <Eye size={14} /> View Audit Details
                                                            </SecondaryBtn>
                                                        ) : (
                                                            <button
                                                                onClick={() => joinRoom(auc)}
                                                                className={`w-full py-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all text-white shadow-lg ${
                                                                    isLive ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-slate-700 hover:bg-slate-800'
                                                                }`}
                                                            >
                                                                <Gavel size={14} /> {isLive ? 'Join Bidding Room' : 'View Room Lobby'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </VCard>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* Lobby Side Panel: Savvy Savings Analytics (4 Columns) */}
                            <div className="lg:col-span-4 space-y-6">
                                <h3 className="text-[14px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles size={16} /> Bidding Analytics
                                </h3>

                                <VCard className="p-5 bg-white border-slate-100 shadow-sm space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                            <TrendingDown size={18} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Procurement Arbitrage</h4>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Price deflation analytics</p>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                        <p className="text-[10px] text-slate-500 leading-relaxed">
                                            Our real-time reverse auction module empowers multiple registered vendors to openly compete and bid procurement prices down. This increases transparency, speeds up purchasing cycles, and minimizes contract costs by an average of 14.8%.
                                        </p>
                                    </div>

                                    <div className="pt-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Average savings rate</span>
                                            <span className="text-xs font-bold text-emerald-600">14.8%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 h-full" style={{ width: '68%' }} />
                                        </div>
                                    </div>
                                </VCard>

                                <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-950 text-white rounded-2xl shadow-xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-2">
                                        <ShieldCheck size={12} className="text-emerald-400" /> Compliance Protocols
                                    </h4>
                                    <p className="text-[10px] text-slate-300 font-bold leading-relaxed">
                                        Every placed bid represents a legally binding supply contract. Shortages, delays, or pricing defaults automatically trigger a credit lock and a penalty impact on the vendor's real-time scorecards.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ─── LAUNCH SESSION VIEW ────────────────────────────────────────── */}
                {view === 'create' && (
                    <motion.div
                        key="create"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="max-w-4xl mx-auto space-y-6"
                    >
                        <div className="flex items-center gap-3">
                            <SecondaryBtn onClick={() => setView('lobby')} icon={<ArrowLeft size={16} />} className="!rounded-xl border border-slate-200 bg-white" />
                            <div>
                                <h1 className="text-[20px] font-bold text-slate-800 tracking-tight">Launch Reverse Auction</h1>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Procurement Session Creator</p>
                            </div>
                        </div>

                        <form onSubmit={handleLaunchSession} className="grid grid-cols-1 md:grid-cols-12 gap-8">
                            {/* Form Input Block (8 Columns) */}
                            <div className="md:col-span-8 space-y-6">
                                <VCard className="p-6 bg-white border-slate-100 shadow-sm flex flex-col gap-5">
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                            Select Product / SKU <span className="text-rose-500">*</span>
                                        </label>
                                        <select
                                            value={form.productId}
                                            onChange={(e) => setForm({ ...form, productId: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                                        >
                                            <option value="">Choose Catalog SKU...</option>
                                            {products.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku || p.barcode})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                Target Quantity <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={form.quantity}
                                                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 pr-12 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                                />
                                                <span className="absolute right-4 top-3 text-[9px] font-bold text-slate-400">units</span>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                Ceiling Unit Price (Max) <span className="text-rose-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <DollarSign size={14} className="absolute left-4 top-3 text-slate-400" />
                                                <input
                                                    type="number"
                                                    value={form.ceilingPrice}
                                                    onChange={(e) => setForm({ ...form, ceilingPrice: e.target.value })}
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                Session Duration
                                            </label>
                                            <select
                                                value={form.durationMinutes}
                                                onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                                            >
                                                <option value="5">5 Minutes (Demo)</option>
                                                <option value="15">15 Minutes</option>
                                                <option value="30">30 Minutes</option>
                                                <option value="60">1 Hour</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl mt-6">
                                            <div>
                                                <p className="text-[11px] font-bold text-slate-700">Auto-Award Winner</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">Instant PO generation</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setForm({ ...form, autoAward: !form.autoAward })}
                                                className={`w-10 h-5 rounded-full transition-all relative ${form.autoAward ? 'bg-blue-600 shadow-md shadow-blue-200' : 'bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${form.autoAward ? 'left-6' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                            Procurement Specifications & Notes
                                        </label>
                                        <textarea
                                            value={form.notes}
                                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 text-xs font-bold text-slate-700 min-h-[100px] outline-none focus:bg-white focus:border-blue-500 transition-all resize-none"
                                            placeholder="Write special quality, moisture or transport criteria..."
                                        />
                                    </div>
                                </VCard>

                                <div className="flex justify-end gap-3 pt-2">
                                    <SecondaryBtn onClick={() => setView('lobby')} type="button" className="!rounded-xl">Cancel</SecondaryBtn>
                                    <PrimaryBtn type="submit" icon={<Sparkles size={16} />}>Launch Auction</PrimaryBtn>
                                </div>
                            </div>

                            {/* Informational Panel (4 Columns) */}
                            <div className="md:col-span-4 space-y-6">
                                <VCard className="p-5 bg-white border-slate-100 shadow-sm">
                                    <div className="flex items-center gap-2 text-rose-500 mb-3">
                                        <AlertCircle size={16} />
                                        <h4 className="text-xs font-bold uppercase tracking-wider">Strategic Reserve</h4>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase">
                                        We suggest configuring a Ceiling Price that represents the standard market MRP rate. The active real-time bidding process will automatically drive the actual vendor costs downwards, resulting in optimal saving margins.
                                    </p>
                                </VCard>

                                <div className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl flex gap-3">
                                    <Zap className="text-amber-300 shrink-0" size={20} />
                                    <div>
                                        <p className="text-[11px] font-bold">Automated PO Dispatch</p>
                                        <p className="text-[9px] text-blue-100 leading-relaxed mt-1">
                                            Upon session closure, the system will automatically award the procurement contract to the lowest bidder and trigger the digital Purchase Order workflow instantly.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </motion.div>
                )}

                {/* ─── LIVE ROOM VIEW ─────────────────────────────────────────────── */}
                {view === 'room' && activeAuction && (
                    <motion.div
                        key="room"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="space-y-6"
                    >
                        {/* Header Details Panel */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <SecondaryBtn onClick={exitRoom} icon={<ArrowLeft size={16} />} className="!rounded-xl border border-slate-200 bg-white" />
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg border border-slate-200">
                                            {activeAuction.auctionNumber}
                                        </span>
                                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase ${
                                            activeAuction.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-200 text-slate-600'
                                        }`}>
                                            {activeAuction.status}
                                        </span>
                                    </div>
                                    <h1 className="text-[20px] font-bold text-slate-800 tracking-tight mt-1">{activeAuction.product?.name}</h1>
                                </div>
                            </div>

                            {/* Role Controller & State Indicators */}
                            <div className="flex items-center gap-3">
                                <div className="bg-white border border-slate-200 rounded-xl p-1 flex shadow-sm">
                                    <button
                                        onClick={() => setRole('host')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                                            role === 'host' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Monitor size={12} /> Staff Host
                                    </button>
                                    <button
                                        onClick={() => setRole('vendor')}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-1.5 ${
                                            role === 'vendor' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                    >
                                        <Smartphone size={12} /> Staff Mobility (Vendor)
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Top Highlights Panel */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <VCard className="p-5 bg-white border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-slate-50 text-slate-600">
                                    <Package size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Target Quantity</p>
                                    <h4 className="text-lg font-bold text-slate-700 mt-0.5">{activeAuction.quantity.toLocaleString()} units</h4>
                                </div>
                            </VCard>

                            <VCard className="p-5 bg-white border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-rose-50 text-rose-600">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Ceiling Unit Price</p>
                                    <h4 className="text-lg font-bold text-slate-700 mt-0.5">₹{activeAuction.ceilingPrice.toFixed(2)}</h4>
                                </div>
                            </VCard>

                            <VCard className="p-5 bg-white border-slate-100 shadow-sm flex items-center gap-4">
                                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
                                    <TrendingDown size={20} />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase">Current Lowest Bid</p>
                                    <h4 className="text-lg font-bold text-emerald-600 mt-0.5">
                                        ₹{bids.length > 0 ? bids[0].bidAmount.toFixed(2) : activeAuction.ceilingPrice.toFixed(2)}
                                    </h4>
                                </div>
                            </VCard>

                            {/* Timer Block */}
                            <div className="p-5 bg-slate-800 border border-slate-800 rounded-xl shadow-sm flex items-center gap-4 text-white">
                                <div className="p-3 rounded-xl bg-white/10 text-amber-300">
                                    <Timer size={20} className="animate-spin-slow" />
                                </div>
                                <div>
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Remaining Time</p>
                                    <h4 className="text-xl font-bold mt-0.5 tracking-tight font-mono text-white">
                                        {activeAuction.status === 'ACTIVE' ? formatTime(timeLeft) : activeAuction.status}
                                    </h4>
                                </div>
                            </div>
                        </div>

                        {/* Room Dashboards split */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Left Column: Visual progression & forms (8 Columns) */}
                            <div className="lg:col-span-8 space-y-6">
                                <VCard className="p-6 bg-white border-slate-100 shadow-sm">
                                    <h3 className="text-[12px] font-bold text-slate-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                        <TrendingDown size={14} className="text-blue-500" /> Bidding Price Progression Chart
                                    </h3>

                                    <div className="h-[280px] w-full">
                                         {chartData.length === 0 ? (
                                             <div className="h-full flex items-center justify-center flex-col text-slate-300 p-6">
                                                 <TrendingDown size={36} className="text-slate-300 animate-pulse mb-2" />
                                                 <p className="text-xs font-bold text-slate-500">Awaiting First Live Vendor Bid...</p>
                                                 
                                                 <div className="mt-6 max-w-md bg-blue-50/60 border border-blue-100 rounded-2xl p-4 flex gap-3 text-left">
                                                     <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
                                                     <div>
                                                         <h5 className="text-[11px] font-extrabold text-blue-800 uppercase tracking-wide">Dynamic Bidding Instructions</h5>
                                                         <p className="text-[10px] text-slate-500 font-semibold leading-relaxed mt-1">
                                                             To place a bid, simply click the <span className="text-blue-700 font-extrabold">"STAFF MOBILITY (VENDOR)"</span> switcher in the top right! You can then select participating vendor profiles, enter lower bids, and submit them to watch prices drop here in real-time!
                                                         </p>
                                                     </div>
                                                 </div>
                                             </div>
                                         ) : (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                                                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} domain={['dataMin - 5', 'auto']} />
                                                    <Tooltip
                                                        contentStyle={{ background: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '11px' }}
                                                        labelStyle={{ fontWeight: 'bold', color: '#38bdf8' }}
                                                    />
                                                    <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={3} activeDot={{ r: 6 }} dot={{ r: 4 }} />
                                                </LineChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </VCard>

                                {/* Staff Mobility: Vendor Place Bid controls */}
                                {role === 'vendor' && (
                                    <VCard className="p-6 bg-white border-slate-100 shadow-sm space-y-5">
                                        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                                            <Smartphone className="text-blue-600" size={16} />
                                            <div>
                                                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Staff Mobility Platform</h3>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Participating Vendor Terminal</p>
                                            </div>
                                        </div>

                                        {activeAuction.status !== 'ACTIVE' ? (
                                            <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-center text-slate-400 text-xs font-bold">
                                                Bidding room is {activeAuction.status}. Bids cannot be placed.
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-4">
                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                            Acting As Vendor Profile <span className="text-rose-500">*</span>
                                                        </label>
                                                        <select
                                                            value={selectedVendorId}
                                                            onChange={(e) => setSelectedVendorId(e.target.value)}
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all appearance-none"
                                                        >
                                                            {vendors.map(v => (
                                                                <option key={v.id} value={v.id}>{v.legalName}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">
                                                            Your Target Bid (Per Unit) <span className="text-rose-500">*</span>
                                                        </label>
                                                        <div className="relative">
                                                            <span className="absolute left-4 top-3 text-slate-400 text-xs font-bold">₹</span>
                                                            <input
                                                                type="number"
                                                                value={vendorBid}
                                                                onChange={(e) => setVendorBid(e.target.value)}
                                                                placeholder="Must be lower than current lowest..."
                                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-8 pr-4 text-xs font-bold text-slate-700 outline-none focus:bg-white focus:border-blue-500 transition-all"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col justify-between gap-4">
                                                    <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                                                        <input
                                                            type="checkbox"
                                                            id="confirmBid"
                                                            checked={isConfirmed}
                                                            onChange={(e) => setIsConfirmed(e.target.checked)}
                                                            className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5 cursor-pointer"
                                                        />
                                                        <label htmlFor="confirmBid" className="text-[10px] text-slate-500 leading-relaxed font-semibold cursor-pointer">
                                                            I hereby confirm that this bid of <span className="text-slate-800 font-bold">₹{parseFloat(vendorBid) || 0}</span> represents a binding legal commitment to supply {activeAuction.quantity.toLocaleString()} units of {activeAuction.product?.name}.
                                                        </label>
                                                    </div>

                                                    <button
                                                        onClick={handlePlaceBid}
                                                        disabled={!isConfirmed || !vendorBid}
                                                        className={`w-full py-3 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-1.5 transition-all ${
                                                            isConfirmed && vendorBid ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-slate-300 shadow-none cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <Gavel size={14} /> Submit Binding Bid
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </VCard>
                                )}

                                {/* Host Controls */}
                                {role === 'host' && (
                                    <VCard className="p-6 bg-white border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                                        <div>
                                            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                <Settings size={14} className="text-slate-500" /> Host Session Controls
                                            </h3>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Manage active bidding and finalize awards</p>
                                        </div>

                                        <div className="flex gap-3">
                                            {activeAuction.status === 'ACTIVE' && (
                                                <>
                                                    <button
                                                        onClick={() => handleUpdateStatus('CLOSED')}
                                                        className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold shadow-lg shadow-rose-100 flex items-center gap-1.5 transition-all"
                                                    >
                                                        <StopCircle size={14} /> Award & Close Session
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </VCard>
                                )}
                            </div>

                            {/* Right Column: Live Leaderboard (4 Columns) */}
                            <div className="lg:col-span-4 space-y-6">
                                <VCard className="p-5 bg-white border-slate-200 shadow-sm flex flex-col min-h-[400px]">
                                    <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                                        <div className="flex items-center gap-2">
                                            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Trophy size={14} /></div>
                                            <h3 className="text-[11px] font-bold text-slate-800 uppercase tracking-wider">Live Leaderboard</h3>
                                        </div>
                                        <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{bids.length} Bids</span>
                                    </div>

                                    {bids.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                                            <Gavel size={32} className="text-slate-300 mb-2 animate-bounce-slow" />
                                            <h4 className="text-xs font-bold text-slate-600">No Bids Submitted</h4>
                                            <p className="text-[9px] text-slate-400 mt-1 uppercase">Awaiting vendor activity...</p>
                                        </div>
                                    ) : (
                                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                                            {bids.map((b, index) => {
                                                const isWinner = index === 0;
                                                return (
                                                    <div
                                                        key={b.id}
                                                        className={`p-3 border rounded-xl flex items-center justify-between transition-all ${
                                                            isWinner ? 'bg-emerald-50/50 border-emerald-300 shadow-sm' : 'bg-slate-50/50 border-slate-100'
                                                        }`}
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                                                                isWinner ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                                                            }`}>
                                                                {index + 1}
                                                            </div>
                                                            <div>
                                                                <h4 className="text-[11px] font-bold text-slate-700 truncate max-w-[120px]">{b.vendor?.legalName}</h4>
                                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">
                                                                    {new Date(b.bidTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-right">
                                                            <p className={`text-xs font-bold ${isWinner ? 'text-emerald-600' : 'text-slate-700'}`}>
                                                                ₹{b.bidAmount.toFixed(2)}
                                                            </p>
                                                            {isWinner && (
                                                                <span className="text-[8px] font-bold bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded uppercase mt-0.5 inline-block">
                                                                    Winning
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Savings Card Block if closed */}
                                    {(activeAuction.status === 'CLOSED' || activeAuction.status === 'AWARDED') && bids.length > 0 && (
                                        <div className="mt-6 p-4 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-md">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Award size={14} className="text-amber-300" />
                                                <h4 className="text-[10px] font-bold uppercase">Contract Summary</h4>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/20">
                                                <div>
                                                    <p className="text-[8px] uppercase opacity-85">Winning Bid</p>
                                                    <p className="text-xs font-bold">₹{bids[0].bidAmount.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[8px] uppercase opacity-85">Total Saved</p>
                                                    <p className="text-xs font-bold text-amber-300">₹{totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </VCard>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
