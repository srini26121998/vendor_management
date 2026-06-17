import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import authService from '../../api/authService';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!email) {
                toast.error('Please enter your email address');
                return;
            }

            const response = await authService.forgotPassword({ email });

            setIsSubmitted(true);
            toast.success(response.message || 'Reset link sent to your email');
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0f172a] relative overflow-hidden px-4">
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md z-10">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl animate-entry">
                    {!isSubmitted ? (
                        <>
                            <div className="mb-8">
                                <Link to="/login" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium">
                                    <ArrowLeft className="mr-2" size={16} />
                                    Back to Sign In
                                </Link>
                                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Forgot Password?</h1>
                                <p className="text-slate-400 text-sm">Enter your email and we'll send you instructions to reset your password.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">Email Address</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-blue-500 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            className="w-full pl-11 pr-4 py-3.5 bg-slate-800/50 border border-slate-700 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all placeholder:text-slate-600"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg shadow-blue-900/20 transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 mt-2"
                                >
                                    {isLoading ? "Sending..." : "Send Reset Link"}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 text-green-500 rounded-full mb-6">
                                <CheckCircle size={40} />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-3">Check your email</h2>
                            <p className="text-slate-400 text-sm mb-8">
                                We've sent a password reset link to <span className="text-white font-medium">{email}</span>. Please check your inbox and spam folder.
                            </p>
                            <button
                                onClick={() => navigate('/reset-password?token=demo-token-bh78-90jk')}
                                className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-2xl transition-all"
                            >
                                Continue to Reset (Demo)
                            </button>
                            <p className="mt-6 text-slate-400 text-xs">
                                Didn't receive the email? <button onClick={() => setIsSubmitted(false)} className="text-blue-500 font-bold hover:underline">Try again</button>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
