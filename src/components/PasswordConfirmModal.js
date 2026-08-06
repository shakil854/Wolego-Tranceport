import React, { useState } from "react";
import { Lock, X, KeyRound, AlertCircle, ShieldCheck } from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";

export default function PasswordConfirmModal({ actionTitle, onConfirm, onClose }) {
  const { user } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter password!");
      return;
    }
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          id: user?.id,
          username: user?.username,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Incorrect Password! Access Denied.");
      }

      // Password verified successfully
      onConfirm();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-800 border-2 border-rose-500/80 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg border border-rose-500/40">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                Action Security Password Required
              </h3>
              <p className="text-[11px] text-rose-300 font-bold">
                {actionTitle || "Enter action security password to proceed"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
              Enter Action Security Password (सिक्योरिटी पासवर्ड):
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Action Security Password..."
                autoFocus
                className="w-full bg-slate-900 border-2 border-rose-500/60 rounded-xl pl-9 pr-3 py-2 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-rose-400"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-rose-500/20 border border-rose-500/50 rounded-lg text-rose-200 text-xs font-bold animate-pulse">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase rounded-lg shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105"
            >
              {loading ? (
                "Verifying..."
              ) : (
                <>
                  <ShieldCheck size={16} /> Confirm & Proceed
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
