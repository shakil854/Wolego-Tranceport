import React, { useState, useEffect, useRef } from "react";
import { Plus, Printer, Trash2, Search, X, CheckCircle, AlertTriangle, FileText, Phone, Truck, MapPin, DollarSign, Building } from "lucide-react";
import { API_BASE_URL } from "../config/api";
import { useAuth } from "../context/AuthContext";
import logoImg from "../assets/logo.png";

export default function OfficeOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaveConfirmModal, setShowSaveConfirmModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [orderToConfirm, setOrderToConfirm] = useState(null);
  const [orderToPrint, setOrderToPrint] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    consignor: "",
    consignee: "",
    truckNo: "",
    driverNo: "",
    center: "",
    lrCharge: "",
    remark: "",
  });

  const printRef = useRef(null);

  // Fetch Office Orders from API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/office-orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch office orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "truckNo" ? value.toUpperCase() : value,
    }));
  };

  // Submit Handler -> Triggers Save Confirmation Popup
  const handlePreSave = (e) => {
    e.preventDefault();
    setShowSaveConfirmModal(true);
  };

  // Confirmed Save Handler
  const handleConfirmSave = async () => {
    setShowSaveConfirmModal(false);
    try {
      const res = await fetch(`${API_BASE_URL}/office-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          createdBy: user?.username || "OFFICE",
        }),
      });

      if (res.ok) {
        // Reset form & close modal
        setFormData({
          consignor: "",
          consignee: "",
          truckNo: "",
          driverNo: "",
          center: "",
          lrCharge: "",
          remark: "",
        });
        setShowAddModal(false);
        fetchOrders();
      } else {
        alert("Failed to save Office Order!");
      }
    } catch (err) {
      console.error("Save order error:", err);
      alert("Error saving Office Order: " + err.message);
    }
  };

  // Confirmed Delete Handler
  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    try {
      const res = await fetch(`${API_BASE_URL}/office-orders/${orderToDelete.id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setOrderToDelete(null);
        fetchOrders();
      } else {
        alert("Failed to delete Office Order!");
      }
    } catch (err) {
      console.error("Delete order error:", err);
      alert("Error deleting order: " + err.message);
    }
  };

  // Handle Confirm Order Status Toggle
  const handleConfirmOrderAction = async () => {
    if (!orderToConfirm) return;
    try {
      const res = await fetch(`${API_BASE_URL}/office-orders/${orderToConfirm.id}/confirm`, {
        method: "PUT",
      });
      if (res.ok) {
        setOrderToConfirm(null);
        fetchOrders();
      } else {
        alert("Failed to update Office Order status!");
      }
    } catch (err) {
      console.error("Confirm order error:", err);
      alert("Error confirming order: " + err.message);
    }
  };

  // Handle Print Individual Order
  const handlePrintOrder = (order) => {
    setOrderToPrint(order);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Filtered Orders
  const filteredOrders = orders.filter((ord) => {
    const q = searchTerm.toLowerCase();
    return (
      (ord.orderNo && ord.orderNo.toLowerCase().includes(q)) ||
      (ord.consignor && ord.consignor.toLowerCase().includes(q)) ||
      (ord.consignee && ord.consignee.toLowerCase().includes(q)) ||
      (ord.truckNo && ord.truckNo.toLowerCase().includes(q)) ||
      (ord.driverNo && ord.driverNo.toLowerCase().includes(q)) ||
      (ord.center && ord.center.toLowerCase().includes(q)) ||
      (ord.remark && ord.remark.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-3 sm:p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Page Header */}
        <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wide">
                Office Order List
              </h1>
              <p className="text-xs text-slate-400 font-bold">
                Manage & Record Office Orders (Total: {orders.length})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search Consignor, Consignee, Truck..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Print Table List Button */}
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer whitespace-nowrap"
              title="Print Office Orders Table List"
            >
              <Printer size={16} /> Print List (A4)
            </button>

            {/* Create New Order Button */}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer whitespace-nowrap"
            >
              <Plus size={16} /> Add Office Order
            </button>
          </div>
        </div>

        {/* Office Orders Table Container */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-xl overflow-hidden print:hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-amber-400 uppercase font-black tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-3">Order No</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Consignor</th>
                  <th className="py-3 px-3">Consignee</th>
                  <th className="py-3 px-3">Truck No</th>
                  <th className="py-3 px-3">Driver No</th>
                  <th className="py-3 px-3">Center</th>
                  <th className="py-3 px-3">LR Charge</th>
                  <th className="py-3 px-3">Remark</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-semibold text-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400 font-bold">
                      Loading Office Orders...
                    </td>
                  </tr>
                ) : filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400 font-bold">
                      No Office Orders Found. Click "+ Add Office Order" to create one.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-700/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-300 whitespace-nowrap">
                        {ord.orderNo}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString("en-IN") : "-"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white max-w-[150px] truncate">
                        {ord.consignor || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-white max-w-[150px] truncate">
                        {ord.consignee || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-emerald-400 uppercase whitespace-nowrap">
                        {ord.truckNo || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300 whitespace-nowrap">
                        {ord.driverNo || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-amber-200 uppercase whitespace-nowrap">
                        {ord.center || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-black text-sky-400 whitespace-nowrap">
                        ₹ {(ord.lrCharge || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-2.5 px-3 text-slate-300 max-w-[180px] truncate">
                        {ord.remark || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Confirm Action Button */}
                          {ord.status === "CONFIRMED" ? (
                            <button
                              onClick={() => setOrderToConfirm(ord)}
                              className="px-2 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/40 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition cursor-pointer"
                              title="Click to toggle status"
                            >
                              <CheckCircle size={12} /> Confirmed
                            </button>
                          ) : (
                            <button
                              onClick={() => setOrderToConfirm(ord)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase rounded-lg shadow flex items-center gap-1 transition cursor-pointer"
                              title="Confirm Order"
                            >
                              <CheckCircle size={13} /> Confirm
                            </button>
                          )}

                          {/* Print Slip Button */}
                          <button
                            onClick={() => handlePrintOrder(ord)}
                            className="p-1.5 bg-sky-500/20 hover:bg-sky-500 text-sky-300 hover:text-slate-950 rounded-lg border border-sky-500/40 transition-all cursor-pointer"
                            title="Print Slip"
                          >
                            <Printer size={14} />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setOrderToDelete(ord)}
                            className="p-1.5 bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white rounded-lg border border-rose-500/40 transition-all cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* ADD NEW OFFICE ORDER MODAL FORM */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 print:hidden">
          <div className="bg-slate-800 border-2 border-amber-500/80 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/40">
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-wide">
                    Create New Office Order
                  </h3>
                  <p className="text-[11px] text-amber-300 font-bold">
                    Enter office order details below
                  </p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white p-1 cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handlePreSave} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Consignor */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Consignor Name
                  </label>
                  <input
                    type="text"
                    name="consignor"
                    value={formData.consignor}
                    onChange={handleChange}
                    placeholder="CONSIGNOR NAME"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Consignee */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Consignee Name
                  </label>
                  <input
                    type="text"
                    name="consignee"
                    value={formData.consignee}
                    onChange={handleChange}
                    placeholder="CONSIGNEE NAME"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Truck No */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Truck No.
                  </label>
                  <input
                    type="text"
                    name="truckNo"
                    value={formData.truckNo}
                    onChange={handleChange}
                    placeholder="GJ 36 X 1234"
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-emerald-400 font-mono font-bold uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Driver Mobile No */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Driver Mobile No.
                  </label>
                  <input
                    type="text"
                    name="driverNo"
                    value={formData.driverNo}
                    onChange={handleChange}
                    placeholder="9876543210"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Center */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    Center / Station
                  </label>
                  <input
                    type="text"
                    name="center"
                    value={formData.center}
                    onChange={handleChange}
                    placeholder="WANKANER / MORBI"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-amber-200 uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* LR Charge */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                    LR Charge (₹)
                  </label>
                  <input
                    type="number"
                    name="lrCharge"
                    value={formData.lrCharge}
                    onChange={handleChange}
                    placeholder="0.00"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-sky-400 font-mono font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Remark */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Remark
                </label>
                <textarea
                  name="remark"
                  rows="2"
                  value={formData.remark}
                  onChange={handleChange}
                  placeholder="Enter remarks (if any)..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                ></textarea>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle size={16} /> Save Order
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SAVE CONFIRMATION POPUP */}
      {/* ========================================================================= */}
      {showSaveConfirmModal && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-slate-800 border-2 border-amber-500 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/40">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  Confirm Office Order Creation
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Are you sure you want to save this new Office Order entry?
                </p>
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Consignor:</span>
                <span className="text-white font-bold">{formData.consignor || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consignee:</span>
                <span className="text-white font-bold">{formData.consignee || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Truck No:</span>
                <span className="text-emerald-400 font-bold">{formData.truckNo || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">LR Charge:</span>
                <span className="text-sky-400 font-bold">₹ {(parseFloat(formData.lrCharge) || 0).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setShowSaveConfirmModal(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase rounded-xl cursor-pointer"
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle size={16} /> Yes, Confirm & Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION POPUP */}
      {/* ========================================================================= */}
      {orderToDelete && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-slate-800 border-2 border-rose-500 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/40">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  Confirm Delete Office Order
                </h3>
                <p className="text-xs text-rose-300 font-bold mt-0.5">
                  Are you sure you want to delete Office Order #{orderToDelete.orderNo}?
                </p>
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Truck No:</span>
                <span className="text-white font-bold">{orderToDelete.truckNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consignor:</span>
                <span className="text-white font-bold">{orderToDelete.consignor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consignee:</span>
                <span className="text-white font-bold">{orderToDelete.consignee}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setOrderToDelete(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={16} /> Yes, Delete Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONFIRM ORDER ACTION POPUP */}
      {/* ========================================================================= */}
      {orderToConfirm && (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-slate-800 border-2 border-emerald-500 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40">
                <CheckCircle size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-white uppercase tracking-wide">
                  Confirm Office Order
                </h3>
                <p className="text-xs text-emerald-300 font-bold mt-0.5">
                  Are you sure you want to {orderToConfirm.status === "CONFIRMED" ? "un-confirm" : "confirm"} Office Order #{orderToConfirm.orderNo}?
                </p>
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Truck No:</span>
                <span className="text-white font-bold">{orderToConfirm.truckNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consignor:</span>
                <span className="text-white font-bold">{orderToConfirm.consignor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Consignee:</span>
                <span className="text-white font-bold">{orderToConfirm.consignee}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setOrderToConfirm(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOrderAction}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle size={16} /> Yes, Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT TEMPLATE (Only visible during print) */}
      {/* ========================================================================= */}
      <div className="hidden print:block fixed inset-0 bg-white text-black p-4 font-sans">
        {orderToPrint ? (
          /* 1. INDIVIDUAL ORDER SLIP */
          <div ref={printRef} className="max-w-[185mm] mx-auto border-2 border-black p-4 space-y-4 bg-white text-black">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <img src={logoImg} alt="Logo" className="h-16 w-auto object-contain" />
              <div className="text-center">
                <h1 className="text-2xl font-black text-[#009a44] font-serif uppercase tracking-wider">
                  WOLEGO TRANSPORT
                </h1>
                <p className="text-xs font-black italic text-[#800000] font-serif">
                  EVERYTHING IS FAST
                </p>
                <div className="text-[10px] font-black uppercase text-slate-700">
                  OFFICE ORDER SLIP
                </div>
              </div>
              <div className="text-right text-xs font-mono font-bold">
                <div>ORDER NO: {orderToPrint.orderNo}</div>
                <div>DATE: {orderToPrint.createdAt ? new Date(orderToPrint.createdAt).toLocaleDateString("en-IN") : "-"}</div>
              </div>
            </div>

            {/* Title Bar */}
            <div className="bg-blue-900 text-white font-black text-sm py-1 text-center uppercase tracking-widest border border-black">
              OFFICE ORDER SLIP
            </div>

            {/* Details Table */}
            <table className="w-full border-collapse border-2 border-black text-xs font-bold">
              <tbody>
                <tr>
                  <td className="w-1/3 p-2 bg-gray-100 border border-black uppercase font-black">ORDER NO.</td>
                  <td className="w-2/3 p-2 border border-black font-mono font-black text-sm">{orderToPrint.orderNo}</td>
                </tr>
                <tr>
                  <td className="w-1/3 p-2 bg-gray-100 border border-black uppercase font-black">CONSIGNOR NAME</td>
                  <td className="w-2/3 p-2 border border-black uppercase">{orderToPrint.consignor || "-"}</td>
                </tr>
                <tr>
                  <td className="w-1/3 p-2 bg-gray-100 border border-black uppercase font-black">CONSIGNEE NAME</td>
                  <td className="w-2/3 p-2 border border-black uppercase">{orderToPrint.consignee || "-"}</td>
                </tr>
                <tr>
                  <td className="w-1/3 p-2 bg-gray-100 border border-black uppercase font-black">TRUCK NO.</td>
                  <td className="w-2/3 p-2 border border-black font-mono uppercase text-sm font-black">{orderToPrint.truckNo || "-"}</td>
                </tr>
                <tr>
                  <td className="w-1/3 p-2 bg-gray-100 border border-black uppercase font-black">DRIVER MOBILE NO.</td>
                  <td className="w-2/3 p-2 border border-black font-mono">{orderToPrint.driverNo || "-"}</td>
                </tr>
                <tr>
                  <td className="w-1/3 p-2 bg-gray-100 border border-black uppercase font-black">CENTER / STATION</td>
                  <td className="w-2/3 p-2 border border-black uppercase">{orderToPrint.center || "-"}</td>
                </tr>
                <tr>
                  <td className="w-1/3 p-2 bg-gray-100 border border-black uppercase font-black">LR CHARGE (₹)</td>
                  <td className="w-2/3 p-2 border border-black font-mono text-sm font-black">₹ {(orderToPrint.lrCharge || 0).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td className="w-1/3 p-2 bg-gray-100 border border-black uppercase font-black">REMARK</td>
                  <td className="w-2/3 p-2 border border-black">{orderToPrint.remark || "-"}</td>
                </tr>
              </tbody>
            </table>

            {/* Footer Signatures */}
            <div className="flex justify-between items-end pt-12 text-xs font-black uppercase">
              <div>PREPARED BY: {orderToPrint.createdBy || "OFFICE"}</div>
              <div>AUTHORIZED SIGNATURE</div>
            </div>

          </div>
        ) : (
          /* 2. FULL OFFICE ORDERS TABLE STATEMENT PRINT */
          <div ref={printRef} className="w-full max-w-[210mm] mx-auto bg-white text-black">
            {/* Complete Office Orders Table */}
            <table className="w-full border-collapse border border-black text-[10px] font-semibold">
              <thead className="bg-gray-200 border-b-2 border-black text-black font-black uppercase tracking-wider">
                <tr>
                  <th className="border border-black py-1.5 px-2 text-center">#</th>
                  <th className="border border-black py-1.5 px-2 text-center">Order No</th>
                  <th className="border border-black py-1.5 px-2 text-center">Date</th>
                  <th className="border border-black py-1.5 px-2">Consignor</th>
                  <th className="border border-black py-1.5 px-2">Consignee</th>
                  <th className="border border-black py-1.5 px-2 text-center">Truck No</th>
                  <th className="border border-black py-1.5 px-2 text-center">Driver No</th>
                  <th className="border border-black py-1.5 px-2 text-center">Center</th>
                  <th className="border border-black py-1.5 px-2 text-right">LR Charge (₹)</th>
                  <th className="border border-black py-1.5 px-2">Remark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="border border-black py-4 text-center font-bold">
                      No Office Orders found.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((ord, idx) => (
                    <tr key={ord.id || idx} className="border-b border-gray-400">
                      <td className="border border-black py-1 px-1.5 text-center font-mono font-bold">{idx + 1}</td>
                      <td className="border border-black py-1 px-1.5 text-center font-mono font-black">{ord.orderNo || "-"}</td>
                      <td className="border border-black py-1 px-1.5 text-center font-mono">{ord.createdAt ? new Date(ord.createdAt).toLocaleDateString("en-IN") : "-"}</td>
                      <td className="border border-black py-1 px-1.5 uppercase font-bold">{ord.consignor || "-"}</td>
                      <td className="border border-black py-1 px-1.5 uppercase font-bold">{ord.consignee || "-"}</td>
                      <td className="border border-black py-1 px-1.5 text-center font-mono font-black">{ord.truckNo || "-"}</td>
                      <td className="border border-black py-1 px-1.5 text-center font-mono">{ord.driverNo || "-"}</td>
                      <td className="border border-black py-1 px-1.5 text-center uppercase">{ord.center || "-"}</td>
                      <td className="border border-black py-1 px-1.5 text-right font-mono font-bold">₹ {(ord.lrCharge || 0).toLocaleString("en-IN")}</td>
                      <td className="border border-black py-1 px-1.5">{ord.remark || "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot className="bg-gray-100 font-black border-t-2 border-black">
                <tr>
                  <td colSpan="8" className="border border-black py-1.5 px-2 text-right uppercase">TOTAL LR CHARGE:</td>
                  <td className="border border-black py-1.5 px-2 text-right font-mono text-xs">
                    ₹ {filteredOrders.reduce((sum, o) => sum + (Number(o.lrCharge) || 0), 0).toLocaleString("en-IN")}
                  </td>
                  <td className="border border-black py-1.5 px-2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
