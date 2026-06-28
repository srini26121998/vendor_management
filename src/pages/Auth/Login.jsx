import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/useAuthStore';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { login, isAuthenticated } = useAuthStore();

    const from = location.state?.from?.pathname || "/";

    useEffect(() => {
        if (isAuthenticated) {
            // Only redirect if we're actually on the login page to avoid loops
            if (location.pathname === '/login') {
                navigate(from, { replace: true });
            }
        }
    }, [isAuthenticated, navigate, from, location.pathname]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!email || !password) {
            toast.error('Please fill in all fields');
            return;
        }

        setIsLoading(true);

        try {
            await login({ email, password });
            toast.success('Login successful!');
            // Redirection is handled by the useEffect above
        } catch (error) {
            console.error('Login error:', error);
            let message;
            if (error.code === 'ECONNABORTED') {
                message = 'Server is taking too long to respond. It may be starting up — please try again in a moment.';
            } else if (!error.response) {
                message = 'Unable to reach the server. Please check your internet connection.';
            } else {
                message = error.response?.data?.message || 'Invalid credentials. Please try again.';
            }
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden px-4">
            {/* Decorative background elements - Vendor Theme */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md z-10">
                <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-entry">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-lg shadow-blue-200">
                            <Lock className="text-white" size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Vendor Portal</h1>
                        <p className="text-slate-400 text-sm font-medium">Access your procurement and supply dashboard</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Corporate Email</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="name@company.com"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all placeholder:text-slate-400 font-medium"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Password</label>
                                <Link to="/forgot-password" size="sm" className="text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                    Forgot?
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3.5 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all placeholder:text-slate-400 font-medium"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Authorizing...
                                </span>
                            ) : "Secure Login"}
                        </button>

                        <div className="pt-6 text-center">
                            <p className="text-slate-400 text-sm font-medium">
                                Don't have an account?{" "}
                                <Link to="/register" className="text-blue-600 font-bold hover:underline">
                                    Create Account
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Login;
