import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import {
  PackagePlus,
  CheckCircle,
  Clock,
  XCircle,
  Search,
  Plus,
  Trash2,
  FileText,
  User,
  Phone,
  MapPin,
  Truck,
  MessageSquare,
  Building2,
  RefreshCw,
  Filter,
  Check,
} from "lucide-react";

export default function PartyOrdersPage() {
  const { user, isOwner, isParty } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Form State for new Party Order
  const [formData, setFormData] = useState({
    consignor1Name: "",
    consignor1Mo: "",
    consignor2Name: "",
    consignor2Mo: "",
    consignor3Name: "",
    consignor3Mo: "",
    consignor4Name: "",
    consignor4Mo: "",
    consigneeBillingName: "",
    unloadingPoint: "",
    truckMT: "",
    remark: "",
  });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/party-orders`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data || []);
      }
    } catch (err) {
      console.error("Error fetching party orders:", err);
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
    if (!formData.consignor1Name.trim()) {
      alert("Please enter at least Consignor (1) Party Name.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        createdBy: user?.username || "PARTY",
        partyName: user?.partyName || formData.consignor1Name,
      };

      const res = await fetch(`${API_BASE_URL}/party-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert("Party Order created successfully!");
        setShowModal(false);
        setFormData({
          consignor1Name: "",
          consignor1Mo: "",
          consignor2Name: "",
          consignor2Mo: "",
          consignor3Name: "",
          consignor3Mo: "",
          consignor4Name: "",
          consignor4Mo: "",
          consigneeBillingName: "",
          unloadingPoint: "",
          truckMT: "",
          remark: "",
        });
        fetchOrders();
      } else {
        alert("Failed to create Party Order.");
      }
    } catch (err) {
      console.error("Error creating party order:", err);
      alert("Error submitting Party Order.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to confirm this party order?")) return;
    setActionLoading(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/party-orders/${orderId}/confirm`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmedBy: user?.username || "OWNER" }),
      });

      if (res.ok) {
        fetchOrders();
      } else {
        alert("Failed to confirm order.");
      }
    } catch (err) {
      console.error("Error confirming order:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to delete this order?")) return;
    setActionLoading(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/party-orders/${orderId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchOrders();
      } else {
        alert("Failed to delete order.");
      }
    } catch (err) {
      console.error("Error deleting order:", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((order) => {
    // 1. Role-based check: Party user should ONLY see their own orders
    if (!isOwner) {
      const uUsername = user?.username ? String(user.username).trim().toLowerCase() : "";
      const uPartyName = user?.partyName ? String(user.partyName).trim().toLowerCase() : "";
      const createdBy = order.createdBy ? String(order.createdBy).trim().toLowerCase() : "";
      const pName = order.partyName ? String(order.partyName).trim().toLowerCase() : "";

      const matchCreatedBy = createdBy && uUsername && createdBy === uUsername;
      const matchPartyName = pName && uPartyName && pName === uPartyName;

      const matchConsignorName = [order.consignor1Name, order.consignor2Name, order.consignor3Name, order.consignor4Name].some(
        (name) => name && uPartyName && String(name).trim().toLowerCase() === uPartyName
      );
      const matchConsignorMo = [order.consignor1Mo, order.consignor2Mo, order.consignor3Mo, order.consignor4Mo].some(
        (mo) => mo && uUsername && String(mo).trim().toLowerCase() === uUsername
      );

      if (!matchCreatedBy && !matchPartyName && !matchConsignorName && !matchConsignorMo) {
        return false;
      }
    }

    // 2. Search query match
    const matchesSearch =
      !searchTerm ||
      (order.orderNo && order.orderNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.consigneeBillingName && order.consigneeBillingName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.consignor1Name && order.consignor1Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.unloadingPoint && order.unloadingPoint.toLowerCase().includes(searchTerm.toLowerCase())) ||
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
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <PackagePlus className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Party Orders ({isOwner ? "Owner View" : "Party Portal"})
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                {isOwner
                  ? "View and confirm Party Orders placed by parties"
                  : "Place Party Orders and check confirmation status"}
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
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg transition transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + New Party Order
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order No, Consignor, Consignee, Unloading Point, M.T..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
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
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mb-3" />
          <p className="text-slate-400 text-sm">Loading party orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center p-12 bg-slate-800/40 rounded-2xl border border-slate-700/60">
          <PackagePlus className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
          <h3 className="text-lg font-bold text-slate-300">No Party Orders Found</h3>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Click "+ New Party Order" to create a new order.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            const isConfirmed = order.status === "CONFIRMED";
            return (
              <div
                key={order.id}
                className={`bg-slate-800/90 rounded-2xl border p-5 transition shadow-lg relative flex flex-col justify-between ${
                  isConfirmed
                    ? "border-emerald-500/40 shadow-emerald-950/20"
                    : "border-amber-500/40 shadow-amber-950/20"
                }`}
              >
                <div>
                  {/* Top Bar: Order No & Status Badge */}
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-3 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 text-amber-400 px-3 py-1 rounded-lg text-xs font-black tracking-wider border border-amber-500/30">
                        {order.orderNo || order.id}
                      </span>
                      <span className="text-xs text-slate-400">
                        {new Date(order.createdAt).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {isConfirmed ? (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Order Confirmed
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                          <Clock className="w-3.5 h-3.5" />
                          Pending Confirmation
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Consignors (1 to 4) */}
                  <div className="mb-4 bg-slate-900/60 rounded-xl p-3.5 border border-slate-700/60">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Consignor Details:
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {order.consignor1Name && (
                        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                          <span className="text-slate-400 font-medium">1) </span>
                          <span className="font-bold text-slate-100">{order.consignor1Name}</span>
                          {order.consignor1Mo && (
                            <span className="text-amber-300 block text-[11px] mt-0.5">
                              📞 Mo: {order.consignor1Mo}
                            </span>
                          )}
                        </div>
                      )}
                      {order.consignor2Name && (
                        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                          <span className="text-slate-400 font-medium">2) </span>
                          <span className="font-bold text-slate-100">{order.consignor2Name}</span>
                          {order.consignor2Mo && (
                            <span className="text-amber-300 block text-[11px] mt-0.5">
                              📞 Mo: {order.consignor2Mo}
                            </span>
                          )}
                        </div>
                      )}
                      {order.consignor3Name && (
                        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                          <span className="text-slate-400 font-medium">3) </span>
                          <span className="font-bold text-slate-100">{order.consignor3Name}</span>
                          {order.consignor3Mo && (
                            <span className="text-amber-300 block text-[11px] mt-0.5">
                              📞 Mo: {order.consignor3Mo}
                            </span>
                          )}
                        </div>
                      )}
                      {order.consignor4Name && (
                        <div className="bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                          <span className="text-slate-400 font-medium">4) </span>
                          <span className="font-bold text-slate-100">{order.consignor4Name}</span>
                          {order.consignor4Mo && (
                            <span className="text-amber-300 block text-[11px] mt-0.5">
                              📞 Mo: {order.consignor4Mo}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Consignee Billing Name, Unloading Point, Truck MT */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-3 text-xs">
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                        Consignee Billing Name
                      </span>
                      <span className="font-bold text-slate-200 mt-0.5 block">
                        {order.consigneeBillingName || "-"}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                        Unloading Point
                      </span>
                      <span className="font-bold text-emerald-400 mt-0.5 block">
                        {order.unloadingPoint || "-"}
                      </span>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-700">
                      <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">
                        Truck M.T.
                      </span>
                      <span className="font-bold text-amber-400 mt-0.5 block">
                        {order.truckMT || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Remark */}
                  {order.remark && (
                    <div className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-700/50 mb-4 text-xs text-slate-300">
                      <span className="text-slate-400 font-semibold">Remark: </span>
                      {order.remark}
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-700/70 mt-2">
                  <span className="text-[11px] text-slate-400 italic">
                    {isConfirmed
                      ? `Confirmed at ${new Date(order.confirmedAt).toLocaleTimeString()}`
                      : "Awaiting Owner Confirmation..."}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Confirm Button for Owner */}
                    {isOwner && !isConfirmed && (
                      <button
                        onClick={() => handleConfirmOrder(order.id)}
                        disabled={actionLoading === order.id}
                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-black rounded-xl text-xs shadow-lg transition active:scale-95 cursor-pointer"
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

      {/* Modal Dialog to Place New Party Order */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-4 sm:p-5 flex items-center justify-between text-slate-950">
              <div className="flex items-center gap-2.5">
                <PackagePlus className="w-6 h-6 stroke-[2.5]" />
                <h3 className="text-lg font-black tracking-wide">Create New Party Order</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-900/20 rounded-lg text-slate-950 transition"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* CONSIGNOR SECTION */}
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-700/80">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3">
                  Consignor Details (Consignor Party Name & Mobile No)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Consignor 1 */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      (1) Consignor Party Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="consignor1Name"
                      value={formData.consignor1Name}
                      onChange={handleChange}
                      placeholder="Party Name 1"
                      required
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">(1) Mobile No.</label>
                    <input
                      type="text"
                      name="consignor1Mo"
                      value={formData.consignor1Mo}
                      onChange={handleChange}
                      placeholder="Mobile Number 1"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Consignor 2 */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">(2) Consignor Party Name</label>
                    <input
                      type="text"
                      name="consignor2Name"
                      value={formData.consignor2Name}
                      onChange={handleChange}
                      placeholder="Party Name 2"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">(2) Mobile No.</label>
                    <input
                      type="text"
                      name="consignor2Mo"
                      value={formData.consignor2Mo}
                      onChange={handleChange}
                      placeholder="Mobile Number 2"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Consignor 3 */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">(3) Consignor Party Name</label>
                    <input
                      type="text"
                      name="consignor3Name"
                      value={formData.consignor3Name}
                      onChange={handleChange}
                      placeholder="Party Name 3"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">(3) Mobile No.</label>
                    <input
                      type="text"
                      name="consignor3Mo"
                      value={formData.consignor3Mo}
                      onChange={handleChange}
                      placeholder="Mobile Number 3"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Consignor 4 */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">(4) Consignor Party Name</label>
                    <input
                      type="text"
                      name="consignor4Name"
                      value={formData.consignor4Name}
                      onChange={handleChange}
                      placeholder="Party Name 4"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">(4) Mobile No.</label>
                    <input
                      type="text"
                      name="consignor4Mo"
                      value={formData.consignor4Mo}
                      onChange={handleChange}
                      placeholder="Mobile Number 4"
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* CONSIGNEE, UNLOADING POINT, TRUCK MT, REMARK */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Consignee Billing Name
                  </label>
                  <input
                    type="text"
                    name="consigneeBillingName"
                    value={formData.consigneeBillingName}
                    onChange={handleChange}
                    placeholder="Consignee Billing Name"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Unloading Point</label>
                    <input
                      type="text"
                      name="unloadingPoint"
                      value={formData.unloadingPoint}
                      onChange={handleChange}
                      placeholder="Unloading Location / City"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">Truck M.T.</label>
                    <input
                      type="text"
                      name="truckMT"
                      value={formData.truckMT}
                      onChange={handleChange}
                      placeholder="e.g. 25 M.T., 30 M.T."
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">Remark</label>
                  <textarea
                    name="remark"
                    rows="2"
                    value={formData.remark}
                    onChange={handleChange}
                    placeholder="Additional instructions or remark..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  ></textarea>
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
                  className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded-xl shadow-lg transition active:scale-95"
                >
                  {submitting ? "Submitting..." : "Submit Party Order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
