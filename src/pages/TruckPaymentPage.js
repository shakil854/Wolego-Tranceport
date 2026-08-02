import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import {
  Truck,
  DollarSign,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  PlusCircle,
  Trash2,
  Search,
  Check,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import PasswordConfirmModal from "../components/PasswordConfirmModal";

export default function TruckPaymentPage() {
  const [records, setRecords] = useState([]);
  const [trucksList, setTrucksList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Form State
  const todayStr = new Date().toISOString().split("T")[0];
  const [formData, setFormData] = useState({
    truckNo: "",
    amount: "",
    remark: "",
    date: todayStr,
  });

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PENDING, PAID

  // Notification / Alert Message
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Fetch Records & Trucks list
  const fetchData = async () => {
    setLoading(true);
    try {
      const [paymentsRes, trucksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/truck-payments`),
        fetch(`${API_BASE_URL}/trucks`),
      ]);

      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        if (Array.isArray(data)) setRecords(data);
      }

      if (trucksRes.ok) {
        const tData = await trucksRes.json();
        if (Array.isArray(tData)) setTrucksList(tData);
      }
    } catch (err) {
      console.error("Error loading truck payment data:", err);
      showToast("Error loading records from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Form Input Change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "truckNo" ? value.toUpperCase() : value,
    }));
  };

  // Handle Form Submit (Create Entry)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.truckNo.trim()) {
      alert("Please enter Truck Number!");
      return;
    }
    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("Please enter a valid Amount!");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/truck-payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          truckNo: formData.truckNo.trim(),
          amount: Number(formData.amount),
          remark: formData.remark.trim(),
          date: formData.date || todayStr,
          status: "PENDING",
        }),
      });

      if (res.ok) {
        const created = await res.json();
        setRecords((prev) => [created, ...prev]);
        setFormData({
          truckNo: "",
          amount: "",
          remark: "",
          date: todayStr,
        });
        showToast("New truck debit created successfully! ✅");
      } else {
        const errData = await res.json();
        alert(errData.error || "Failed to save record.");
      }
    } catch (err) {
      console.error("Error creating record:", err);
      alert("Network error. Could not create record.");
    } finally {
      setSubmitting(false);
    }
  };

  // Execute action after password verification
  const executePendingAction = async () => {
    if (!pendingAction) return;

    const { type, id, currentStatus } = pendingAction;
    setPendingAction(null);

    if (type === "TOGGLE_STATUS") {
      await handleSetPaid(id, currentStatus);
    } else if (type === "DELETE") {
      await handleDelete(id);
    }
  };

  // Toggle or Set Status to PAID
  const handleSetPaid = async (id, currentStatus) => {
    const newStatus = currentStatus === "PAID" ? "PENDING" : "PAID";
    try {
      const res = await fetch(`${API_BASE_URL}/truck-payments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setRecords((prev) =>
          prev.map((rec) => (rec.id === id ? { ...rec, status: updated.status } : rec))
        );
        showToast(
          newStatus === "PAID"
            ? "Status updated to PAID ✅"
            : "Status updated to PENDING ⏳"
        );
      } else {
        alert("Failed to update status.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Error updating status.");
    }
  };

  // Delete Record
  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/truck-payments/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setRecords((prev) => prev.filter((rec) => rec.id !== id));
        showToast("Record deleted successfully.");
      } else {
        alert("Failed to delete record.");
      }
    } catch (err) {
      console.error("Error deleting record:", err);
      alert("Error deleting record.");
    }
  };

  // Calculations
  const totalAmount = records.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const paidAmount = records
    .filter((item) => item.status === "PAID")
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const pendingAmount = totalAmount - paidAmount;

  // Filtered List
  const filteredRecords = records.filter((rec) => {
    const matchesSearch =
      rec.truckNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.remark?.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "PENDING") return matchesSearch && rec.status !== "PAID";
    if (statusFilter === "PAID") return matchesSearch && rec.status === "PAID";
    return matchesSearch;
  });

  // Currency Formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 space-y-3 font-sans text-slate-100">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg shadow-xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Title & Header */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              Truck Debit
            </h1>
            <p className="text-[11px] text-slate-400">
              Create truck debit entries, auto-capture date, and manage paid status.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {/* 1. Total Entries */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
            <span>Total Entries</span>
            <FileText className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-base sm:text-xl font-extrabold text-blue-400 font-mono my-0.5">
            {records.length}
          </div>
          <div className="text-[10px] text-slate-400">Recorded Log Entries</div>
        </div>

        {/* 2. Total Amount */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-2.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-semibold">
            <span>Total Amount</span>
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-base sm:text-xl font-extrabold text-cyan-400 font-mono my-0.5">
            {formatCurrency(totalAmount)}
          </div>
          <div className="text-[10px] text-slate-400">All Truck Entries</div>
        </div>

        {/* 3. Pending Amount */}
        <div className="bg-slate-800/90 border border-amber-500/40 rounded-xl p-2.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-[11px] font-semibold">
            <span>Pending Amount</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base sm:text-xl font-extrabold text-amber-400 font-mono my-0.5">
            {formatCurrency(pendingAmount)}
          </div>
          <div className="text-[10px] text-slate-400">Unpaid Entries</div>
        </div>

        {/* 4. Paid Amount */}
        <div className="bg-slate-800/90 border border-emerald-500/40 rounded-xl p-2.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 text-[11px] font-semibold">
            <span>Paid Amount</span>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base sm:text-xl font-extrabold text-emerald-400 font-mono my-0.5">
            {formatCurrency(paidAmount)}
          </div>
          <div className="text-[10px] text-slate-400">Completed Payments</div>
        </div>
      </div>

      {/* New Entry Form */}
      <div className="bg-slate-800/90 border border-amber-500/40 rounded-xl p-3 sm:p-3.5 shadow-xl">
        <div className="flex items-center gap-1.5 border-b border-slate-700/80 pb-2 mb-3">
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider">
            Create New Truck Debit
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5 items-end">
          {/* Field 1: Truck No */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
              Truck No <span className="text-amber-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                name="truckNo"
                list="trucks-list-options"
                value={formData.truckNo}
                onChange={handleChange}
                placeholder="e.g. GJ36T1234"
                required
                className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono font-bold focus:outline-none uppercase"
              />
              <datalist id="trucks-list-options">
                {trucksList.map((t) => (
                  <option key={t.id || t.truckNo} value={t.truckNo} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Field 2: Amount */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
              Amount (₹) <span className="text-amber-400">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 5000"
              min="1"
              required
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 font-mono font-bold focus:outline-none"
            />
          </div>

          {/* Field 3: Remark */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-300 mb-0.5">
              Remark / Note
            </label>
            <input
              type="text"
              name="remark"
              value={formData.remark}
              onChange={handleChange}
              placeholder="e.g. Advance cash / Diesel"
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>

          {/* Field 4: Date & Submit Button */}
          <div className="lg:col-span-3 flex gap-2">
            <div className="w-5/12">
              <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                Date (Auto)
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-1.5 py-1.5 text-xs text-slate-300 focus:outline-none font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-7/12 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold py-1.5 px-3 rounded-lg text-xs transition shadow-md flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>{submitting ? "Saving..." : "Add Entry"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Entries Table & Controls Header */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-slate-700/80 pb-3">
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === "ALL"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All ({records.length})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === "PENDING"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Pending ({records.filter((r) => r.status !== "PAID").length})
            </button>
            <button
              onClick={() => setStatusFilter("PAID")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                statusFilter === "PAID"
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Paid ({records.filter((r) => r.status === "PAID").length})
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Truck No or Remark..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto rounded-xl border border-slate-700/80">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10.5px] font-bold border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Truck No</th>
                <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                <th className="py-2.5 px-3">Remark</th>
                <th className="py-2.5 px-3 text-center">Status</th>
                <th className="py-2.5 px-3 text-center">Action (Mark Paid)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700/60 bg-slate-800/40">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                    Loading records...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    <AlertCircle className="w-5 h-5 mx-auto mb-1 text-slate-500" />
                    No truck payment entries found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const isPaid = item.status === "PAID";
                  return (
                    <tr key={item.id} className="hover:bg-slate-700/40 transition-colors">
                      {/* Date */}
                      <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          <span>{item.date}</span>
                        </div>
                      </td>

                      {/* Truck No */}
                      <td className="py-2.5 px-3 font-bold font-mono text-amber-400 text-sm whitespace-nowrap">
                        {item.truckNo}
                      </td>

                      {/* Amount */}
                      <td className="py-2.5 px-3 text-right font-extrabold font-mono text-white text-sm whitespace-nowrap">
                        {formatCurrency(item.amount)}
                      </td>

                      {/* Remark */}
                      <td className="py-2.5 px-3 text-slate-300">
                        {item.remark || <span className="text-slate-500 italic">-</span>}
                      </td>

                      {/* Status */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                            <CheckCircle className="w-3 h-3" /> PAID
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        )}
                      </td>

                      {/* Action (Mark Paid Checkmark Button & Delete) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          {/* Green Right Click / Checkmark Action Button */}
                          <button
                            onClick={() =>
                              setPendingAction({
                                type: "TOGGLE_STATUS",
                                id: item.id,
                                currentStatus: item.status,
                                truckNo: item.truckNo,
                              })
                            }
                            title={isPaid ? "Mark as Pending" : "Mark as Paid"}
                            className={`p-1.5 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1 ${
                              isPaid
                                ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md"
                                : "bg-emerald-500/20 hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 border border-emerald-500/40"
                            }`}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span className="text-[11px]">{isPaid ? "Paid ✓" : "Mark Paid"}</span>
                          </button>

                          {/* Delete Action Button */}
                          <button
                            onClick={() =>
                              setPendingAction({
                                type: "DELETE",
                                id: item.id,
                                truckNo: item.truckNo,
                              })
                            }
                            title="Delete record"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Password Confirmation Modal */}
      {pendingAction && (
        <PasswordConfirmModal
          actionTitle={
            pendingAction.type === "DELETE"
              ? `Password required to DELETE entry for Truck #${pendingAction.truckNo}`
              : `Password required to change status to ${pendingAction.currentStatus === "PAID" ? "PENDING" : "PAID"} for Truck #${pendingAction.truckNo}`
          }
          onConfirm={executePendingAction}
          onClose={() => setPendingAction(null)}
        />
      )}

    </div>
  );
}
