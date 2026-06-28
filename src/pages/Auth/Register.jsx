import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { User, Phone, Lock, Eye, EyeOff, Briefcase, Mail } from 'lucide-react';

const Register = () => {
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: '',
        role: 'Vendor',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        // Conditional fields
        companyName: '',
        department: '',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const roles = ['Vendor', 'Manager', 'Supervisor', 'Staff'];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            toast.success('Registration successful! Please login.');
            navigate('/login');
        }, 1500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] relative overflow-hidden px-4 py-12">
            {/* Decorative background elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px]"></div>

            <div className="w-full max-w-md z-10">
                <div className="bg-white border border-slate-200 p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] animate-entry">
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-6 shadow-lg shadow-blue-200">
                            <User className="text-white" size={32} />
                        </div>
                        <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">Create Account</h1>
                        <p className="text-slate-400 text-sm font-medium">Join the Vendor Management Portal</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        {/* Name Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <User size={18} />
                                </div>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="John Doe"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all placeholder:text-slate-400 font-medium"
                                    required
                                />
                            </div>
                        </div>

                        {/* Role Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Role</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Briefcase size={18} />
                                </div>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    className="w-full pl-11 pr-10 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all appearance-none font-medium"
                                    required
                                >
                                    {roles.map(role => (
                                        <option key={role} value={role}>{role}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>

                        {/* Dynamic Fields based on Role */}
                        {formData.role === 'Vendor' && (
                            <div className="space-y-2 animate-entry">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Company Name</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Briefcase size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="Acme Corp"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all placeholder:text-slate-400 font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {formData.role === 'Staff' && (
                            <div className="space-y-2 animate-entry">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Department</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                        <Briefcase size={18} />
                                    </div>
                                    <input
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        placeholder="e.g. Procurement"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all placeholder:text-slate-400 font-medium"
                                        required
                                    />
                                </div>
                            </div>
                        )}

                        {/* Phone Number Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Phone Number</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Phone size={18} />
                                </div>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleChange}
                                    placeholder="+1 (555) 000-0000"
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all placeholder:text-slate-400 font-medium"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all placeholder:text-slate-400 font-medium"
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

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Confirm Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="••••••••"
                                    className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-600 transition-all placeholder:text-slate-400 font-medium"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-xl shadow-blue-100 transform hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-6"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Creating Account...
                                </span>
                            ) : "Create Account"}
                        </button>

                        <div className="pt-6 text-center">
                            <p className="text-slate-400 text-sm font-medium">
                                Already have an account?{" "}
                                <Link to="/login" className="text-blue-600 font-bold hover:underline">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;
