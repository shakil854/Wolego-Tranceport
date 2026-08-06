import React, { useState } from "react";
import { ShieldCheck, Eye, EyeOff, X, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { API_BASE_URL } from "../config/api";

export default function ChangeActionPasswordModal({ isOpen, onClose, user }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newActionPassword, setNewActionPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentPassword) {
      setError("Please enter current password / action PIN.");
      return;
    }

    if (!newActionPassword) {
      setError("Please enter a new Action Security Password.");
      return;
    }

    if (newActionPassword.length < 4) {
      setError("Action Security Password must be at least 4 characters long.");
      return;
    }

    if (newActionPassword !== confirmPassword) {
      setError("New Action Password and Confirm Password do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/change-action-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user?.id,
          username: user?.username,
          currentPassword,
          newActionPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update Action Security Password.");
      }

      setSuccess("Action Security Password updated successfully!");
      setCurrentPassword("");
      setNewActionPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setSuccess("");
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError("");
    setSuccess("");
    setCurrentPassword("");
    setNewActionPassword("");
    setConfirmPassword("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn font-sans">
      <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-100 transform transition-all">
        
        {/* Header */}
        <div className="bg-slate-800 px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-white tracking-wide uppercase">
                Action Security Password
              </h3>
              <p className="text-[11px] text-emerald-300 font-bold">
                (Used for LR Edit, LR Delete & Truck Debit)
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs font-bold p-3 rounded-xl animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-500/50 text-emerald-200 text-xs font-bold p-3 rounded-xl">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold uppercase text-slate-300 mb-1.5">
              Current Password / Action PIN:
            </label>
            <div className="relative">
              <input
                type={showCurrent ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono transition"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* New Action Security Password */}
          <div>
            <label className="block text-xs font-bold uppercase text-yellow-300 mb-1.5">
              New Action Security Password:
            </label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newActionPassword}
                onChange={(e) => setNewActionPassword(e.target.value)}
                placeholder="Set new action password"
                className="w-full bg-slate-950 border-2 border-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono transition"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm New Action Security Password */}
          <div>
            <label className="block text-xs font-bold uppercase text-yellow-300 mb-1.5">
              Confirm New Action Password:
            </label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new action password"
                className="w-full bg-slate-950 border-2 border-emerald-500/70 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 font-mono transition"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Save Action Password</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
