import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import {
  Truck,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Trash2,
  Phone,
  MapPin,
  Building,
  RefreshCw,
  Filter,
  Check,
  XCircle,
  Weight,
} from "lucide-react";

export default function TruckOrdersPage() {
  const { user, isOwner, isTruck } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Form State for new Truck Order
  const [formData, setFormData] = useState({
    truckNo: "",
    truckMT: "",
    driverNo: "",
    location: "",
    center: "",
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/truck-orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Error fetching truck orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    if (!formData.truckNo.trim()) {
      alert("Please enter Truck Number.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        createdBy: user?.username || "TRUCK",
      };

      const res = await fetch(`${API_BASE_URL}/truck-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Truck Order submitted successfully!");
        setShowModal(false);
        setFormData({
          truckNo: "",
          truckMT: "",
          driverNo: "",
          location: "",
          center: "",
        });
        fetchOrders();
      } else {
        alert("Failed to submit Truck Order.");
      }
    } catch (err) {
      console.error("Error submitting truck order:", err);
      alert("Error submitting Truck Order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to confirm this truck order?")) return;
    setActionLoading(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/truck-orders/${orderId}/confirm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmedBy: user?.username || "OWNER" }),
      });

      if (res.ok) {
        fetchOrders();
      } else {
        alert("Failed to confirm truck order.");
      }
    } catch (err) {
      console.error("Error confirming truck order:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this truck order?")) return;
    setActionLoading(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/truck-orders/${orderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchOrders();
      } else {
        alert("Failed to delete truck order.");
      }
    } catch (err) {
      console.error("Error deleting truck order:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // 1. Role-based check: Truck user should ONLY see their own orders
    if (!isOwner) {
      const uUsername = user?.username ? String(user.username).trim().toLowerCase() : "";
      const createdBy = order.createdBy ? String(order.createdBy).trim().toLowerCase() : "";
      const driverNo = order.driverNo ? String(order.driverNo).trim().toLowerCase() : "";
      const truckNo = order.truckNo ? String(order.truckNo).trim().toLowerCase() : "";

      const matchCreatedBy = createdBy && uUsername && createdBy === uUsername;
      const matchDriverNo = driverNo && uUsername && driverNo === uUsername;
      const matchTruckNo = truckNo && uUsername && truckNo === uUsername;

      if (!matchCreatedBy && !matchDriverNo && !matchTruckNo) {
        return false;
      }
    }

    // 2. Search query match
    const matchesSearch =
      !searchTerm ||
      (order.orderNo && order.orderNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.truckNo && order.truckNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.driverNo && order.driverNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.location && order.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.center && order.center.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.truckMT && order.truckMT.toLowerCase().includes(searchTerm.toLowerCase()));

    // 3. Status filter match
    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans text-slate-100 flex-1 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 bg-slate-800/80 p-5 rounded-2xl border border-slate-700 shadow-xl backdrop-blur-md">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Truck Orders ({isOwner ? "Owner View" : "Truck Portal"})
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {isOwner
                  ? "View and confirm Truck Orders placed by truck drivers / owners"
                  : "Submit Truck availability orders and check confirmation status"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-600 shadow"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + New Truck Order
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order No, Truck No, Driver No, Location, Center..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 rounded-xl">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent py-2.5 text-sm text-slate-200 font-semibold focus:outline-none"
          >
            <option value="ALL" className="bg-slate-800">All Status</option>
            <option value="PENDING" className="bg-slate-800">Pending</option>
            <option value="CONFIRMED" className="bg-slate-800">Confirmed</option>
          </select>
        </div>
      </div>

      {/* Orders List / Cards */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12 bg-slate-800/40 rounded-2xl border border-slate-700/60">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Loading truck orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center p-12 bg-slate-800/40 rounded-2xl border border-slate-700/60">
          <Truck className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-slate-300">No Truck Orders Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Click "+ New Truck Order" to submit a new truck availability order.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => {
            const isConfirmed = order.status === "CONFIRMED";
            return (
              <div
                key={order.id}
                className={`bg-slate-800/90 rounded-2xl border p-5 transition shadow-lg flex flex-col justify-between ${
                  isConfirmed
                    ? "border-emerald-500/40 shadow-emerald-950/20"
                    : "border-blue-500/40 shadow-blue-950/20"
                }`}
              >
                <div>
                  {/* Top Bar: Order No & Status */}
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 text-blue-400 px-3 py-1 rounded-lg text-xs font-black tracking-wider border border-blue-500/30">
                        {order.orderNo || order.id}
                      </span>
                    </div>

                    <div>
                      {isConfirmed ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Confirmed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Truck No Header */}
                  <div className="flex items-center gap-2 mb-3 bg-slate-900/70 p-3 rounded-xl border border-slate-700/70">
                    <Truck className="w-5 h-5 text-blue-400 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Truck Number</span>
                      <span className="text-base font-black text-white tracking-wide">{order.truckNo || "-"}</span>
                    </div>
                  </div>

                  {/* Order Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] font-bold block uppercase">Truck M.T.</span>
                      <span className="font-bold text-amber-400 text-sm mt-0.5 block">{order.truckMT || "-"}</span>
                    </div>

                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] font-bold block uppercase">Driver No.</span>
                      <span className="font-bold text-slate-200 text-xs mt-0.5 block flex items-center gap-1">
                        <Phone className="w-3 h-3 text-blue-400 inline" /> {order.driverNo || "-"}
                      </span>
                    </div>

                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] font-bold block uppercase">Location</span>
                      <span className="font-bold text-emerald-400 text-xs mt-0.5 block flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-emerald-400 inline" /> {order.location || "-"}
                      </span>
                    </div>

                    <div className="bg-slate-900/50 p-2.5 rounded-xl border border-slate-700/60">
                      <span className="text-slate-400 text-[10px] font-bold block uppercase">Center</span>
                      <span className="font-bold text-purple-400 text-xs mt-0.5 block flex items-center gap-1">
                        <Building className="w-3 h-3 text-purple-400 inline" /> {order.center || "-"}
                      </span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 italic mb-2">
                    Submitted: {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                  </div>
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-700/70 mt-2">
                  <span className="text-[11px] text-slate-400">
                    {isConfirmed ? "Status: Confirmed by Owner" : "Awaiting Confirmation"}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Confirm Button for Owner */}
                    {isOwner && !isConfirmed && (
                      <button
                        onClick={() => handleConfirmOrder(order.id)}
                        disabled={actionLoading === order.id}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black rounded-xl text-xs shadow-lg transition active:scale-95 cursor-pointer"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                        Confirm Order
                      </button>
                    )}

                    {/* Delete button */}
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={actionLoading === order.id}
                        className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition border border-rose-500/20"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Dialog to Place New Truck Order */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-5 flex items-center justify-between text-white">
              <div className="flex items-center gap-2.5">
                <Truck className="w-6 h-6 stroke-[2.5]" />
                <h3 className="text-lg font-black tracking-wide">Submit New Truck Order</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-900/20 rounded-lg text-white transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Truck Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="truckNo"
                  value={formData.truckNo}
                  onChange={handleChange}
                  placeholder="e.g. GJ01AB1234"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Truck M.T.</label>
                  <input
                    type="text"
                    name="truckMT"
                    value={formData.truckMT}
                    onChange={handleChange}
                    placeholder="e.g. 20 M.T., 30 M.T."
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Driver Mobile No.</label>
                  <input
                    type="text"
                    name="driverNo"
                    value={formData.driverNo}
                    onChange={handleChange}
                    placeholder="Driver Contact Number"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Current Location / City"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Center</label>
                  <input
                    type="text"
                    name="center"
                    value={formData.center}
                    onChange={handleChange}
                    placeholder="Center / Loading Station"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-black rounded-xl shadow-lg transition active:scale-95"
                >
                  {submitting ? "Submitting..." : "Submit Truck Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
