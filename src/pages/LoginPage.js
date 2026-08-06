import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Lock, Phone, KeyRound, ArrowRight, Eye, EyeOff, ShieldCheck, Truck, Zap, Sparkles } from "lucide-react";
import logoImg from "../assets/logo.png";
import { API_BASE_URL } from "../config/api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Login failed. Please check your credentials.");
      }

      login(data.user);

      if (data.user.role === "PARTY") {
        navigate("/accounting");
      } else if (data.user.role === "TRUCK") {
        navigate("/truck-accounting");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-x-hidden bg-gradient-to-br from-slate-100 via-sky-50 to-amber-50 font-sans selection:bg-amber-400 selection:text-slate-950 -mt-2">
      
      {/* Soft Ambient Glow Orbs */}
      <div className="absolute -top-24 -left-24 w-[500px] h-[500px] bg-amber-200/50 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
      <div className="absolute -bottom-24 -right-24 w-[500px] h-[500px] bg-sky-200/50 rounded-full blur-[140px] pointer-events-none animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-yellow-200/30 rounded-full blur-[180px] pointer-events-none"></div>

      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none"></div>

      {/* Main Glassmorphic Login Card Container */}
      <div className="relative z-10 max-w-md w-full my-auto">
        
        {/* Animated Golden Aura Glow Around Login Box */}
        <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-[38px] blur-xl opacity-80 animate-pulse"></div>
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-[34px] blur-md opacity-90"></div>

        <div className="relative bg-white border-2 border-slate-200/90 rounded-[32px] p-7 sm:p-9 shadow-[0_25px_60px_-10px_rgba(245,158,11,0.25)] backdrop-blur-2xl space-y-6">
          
          {/* Top Golden Accent Bar */}
          <div className="absolute top-0 left-12 right-12 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-b-full shadow-sm"></div>

          {/* Header Branding */}
          <div className="text-center space-y-3.5 pt-2">
            
            {/* Logo Emblem Container */}
            <div className="relative inline-block">
              <div className="relative bg-white border-2 border-amber-400 p-1.5 sm:p-2 rounded-2xl shadow-[0_10px_25px_rgba(245,158,11,0.25)] overflow-hidden transform hover:scale-105 transition-transform duration-300">
                <img 
                  src={logoImg} 
                  alt="Wolego Transport Logo" 
                  className="h-28 sm:h-32 w-auto object-contain mx-auto scale-110" 
                />
              </div>
            </div>

            {/* Brand Title & Tagline matching LR Document */}
            <div className="pt-1 flex flex-col items-center">
              <h1 className="text-xl sm:text-2xl font-black text-[#009a44] tracking-wider font-serif uppercase whitespace-nowrap drop-shadow-sm">
                WOLEGO TRANSPORT
              </h1>
              <div className="mt-0.5 text-xs sm:text-sm font-black text-amber-900 italic font-serif uppercase tracking-widest">
                EVERYTHING IS FAST
              </div>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-1 bg-amber-100/90 border border-amber-300/80 rounded-full shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                <span className="text-[10px] font-black text-amber-900 tracking-widest uppercase">
                  Transport Billing & Accounting Portal
                </span>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="bg-red-50 border-2 border-red-300 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-3 animate-shake">
              <Lock className="w-4 h-4 text-red-500 shrink-0" />
              <span className="font-bold">{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="space-y-4.5" onSubmit={handleLogin}>
            
            {/* Username / Mobile Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-800">
                Mobile Number / Username *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-600 transition-colors">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter Mobile Number"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-sm font-bold placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition-all font-mono shadow-sm"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-800">
                Password *
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-amber-600 transition-colors">
                  <KeyRound className="w-4.5 h-4.5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter Password"
                  className="w-full pl-11 pr-11 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 text-sm font-bold placeholder-slate-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/15 transition-all font-mono shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-amber-600 transition-colors cursor-pointer"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 active:scale-[0.98] text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-[0_8px_25px_rgba(245,158,11,0.4)] hover:shadow-[0_10px_30px_rgba(245,158,11,0.55)] transition-all duration-200 cursor-pointer disabled:opacity-50 mt-5 overflow-hidden border border-amber-300"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing In...</span>
                </div>
              ) : (
                <>
                  <span className="tracking-widest">SIGN IN TO PORTAL</span>
                  <ArrowRight className="w-5 h-5 transform group-hover:translate-x-1.5 transition-transform duration-200" />
                </>
              )}
            </button>

          </form>

          {/* Footer Security Badges */}
          <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-600 font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1 text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> 256-Bit Encrypted
            </span>
            <span className="flex items-center gap-1 text-slate-700">
              <Truck className="w-3.5 h-3.5 text-amber-600" /> Wolego Master
            </span>
            <span className="flex items-center gap-1 text-slate-700">
              <Zap className="w-3.5 h-3.5 text-sky-600" /> Fast Access
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
