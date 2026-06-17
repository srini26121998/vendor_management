import React, { useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';
import authService from '../../api/authService';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const { tokenParam } = useParams();
    const [searchParams] = useSearchParams();

    // Extract token from either path parameter or query parameter (?token=...)
    const token = tokenParam || searchParams.get('token');

    React.useEffect(() => {
        if (!token) {
            toast.error('Token is missing. Please use the link from your email.', {
                duration: 5000,
                id: 'missing-token-error'
            });
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            // We allow the call even if token is null, to let the API return a proper validation error
            // However, we still log a warning for the developer
            if (!token) {
                console.warn('Proceeding with password reset without a token. This will likely fail on the server.');
            }

            const response = await authService.resetPassword({
                token,
                newPassword: password
            });

            toast.success(response.message || 'Password reset successfully!');
            navigate('/login');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const hasLength = password.length >= 6;
    const hasMatch = password && password === confirmPassword;

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden px-4">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md z-10">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl animate-entry">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Reset Password</h1>
                        <p className="text-slate-400 text-sm">Please create a strong new password for your account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {!token && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl animate-pulse">
                                <p className="text-amber-500 text-[11px] font-bold mb-1 uppercase tracking-wider">Testing Mode</p>
                                <p className="text-slate-400 text-xs mb-3">Reset token is missing from the URL. The API will fail.</p>
                                <button
                                    type="button"
                                    onClick={() => navigate('/reset-password?token=demo-token-12345')}
                                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-[11px] font-bold rounded-xl transition-all uppercase"
                                >
                                    Inject Demo Token
                                </button>
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">New Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3.5 bg-slate-800/50 border border-slate-700 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Confirm New Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                    required
                                />
                            </div>
                        </div>

                        {/* Validation indicators */}
                        <div className="space-y-2 pt-1 px-1">
                            <div className={`flex items-center text-xs ${hasLength ? 'text-green-500' : 'text-slate-500'}`}>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 ${hasLength ? 'bg-green-500/20' : 'bg-slate-800'}`}>
                                    <Check size={10} />
                                </div>
                                At least 6 characters
                            </div>
                            <div className={`flex items-center text-xs ${hasMatch && password ? 'text-green-500' : 'text-slate-500'}`}>
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center mr-2 ${hasMatch && password ? 'bg-green-500/20' : 'bg-slate-800'}`}>
                                    <Check size={10} />
                                </div>
                                Passwords match
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !hasLength || !hasMatch}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 mt-2"
                        >
                            {isLoading ? "Resetting..." : "Reset Password"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
