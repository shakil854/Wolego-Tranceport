import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import {
  PackagePlus,
  CheckCircle,
  Clock,
  Search,
  Plus,
  Trash2,
  User,
  Phone,
  RefreshCw,
  Filter,
  Check,
  XCircle,
  LayoutGrid,
  List,
} from "lucide-react";

export default function PartyOrdersPage() {
  const { user, isOwner } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("TABLE"); // "TABLE" or "GRID"
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

  // Filter orders (Role-based security + search + status filter)
  const filteredOrders = orders.filter((order) => {
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

    const matchesSearch =
      !searchTerm ||
      (order.orderNo && order.orderNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.consigneeBillingName && order.consigneeBillingName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.consignor1Name && order.consignor1Name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.unloadingPoint && order.unloadingPoint.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.truckMT && order.truckMT.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-3 sm:p-4 max-w-[1600px] mx-auto w-full font-sans text-slate-100 flex-1 overflow-y-auto">
      {/* Compact Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 bg-slate-800/90 px-4 py-2.5 rounded-xl border border-slate-700/80 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
            <PackagePlus className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2 flex-wrap">
              <span>Party Orders</span>
              <span className="text-xs font-normal text-slate-400">({isOwner ? "Owner View" : "Party Portal"})</span>
              {orders.filter((ord) => ord.status !== "CONFIRMED").length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-black animate-pulse shadow">
                  {orders.filter((ord) => ord.status !== "CONFIRMED").length} Unconfirmed
                </span>
              )}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode("TABLE")}
              className={`p-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                viewMode === "TABLE" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Compact Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                viewMode === "GRID" ? "bg-amber-500 text-slate-950" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>
          </div>

          <button
            onClick={fetchOrders}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700/80 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition border border-slate-600 shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold rounded-lg text-xs shadow transition transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            + New Party Order
          </button>
        </div>
      </div>

      {/* Compact Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order No, Consignor, Consignee, Unloading Point, MT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-lg w-full sm:w-auto shrink-0">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none py-0.5"
          >
            <option value="ALL" className="bg-slate-800">All Status</option>
            <option value="PENDING" className="bg-slate-800">Pending</option>
            <option value="CONFIRMED" className="bg-slate-800">Confirmed</option>
          </select>
        </div>
      </div>

      {/* Orders View */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-8 bg-slate-800/40 rounded-xl border border-slate-700/60">
          <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mb-2" />
          <p className="text-slate-400 text-xs">Loading party orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center p-8 bg-slate-800/40 rounded-xl border border-slate-700/60">
          <PackagePlus className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-slate-300">No Party Orders Found</h3>
          <p className="text-xs text-slate-400 mt-0.5">Click "+ New Party Order" to create a new order.</p>
        </div>
      ) : viewMode === "TABLE" ? (
        /* COMPACT TABLE VIEW */
        <div className="bg-slate-800/90 rounded-xl border border-slate-700 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-amber-400 border-b border-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Order No & Date</th>
                  <th className="py-2.5 px-3">Consignor(s) Details</th>
                  <th className="py-2.5 px-3">Consignee Billing Name</th>
                  <th className="py-2.5 px-3">Unloading Point</th>
                  <th className="py-2.5 px-3">Truck M.T.</th>
                  <th className="py-2.5 px-3">Remark</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {filteredOrders.map((order) => {
                  const isConfirmed = order.status === "CONFIRMED";
                  return (
                    <tr
                      key={order.id}
                      className={`hover:bg-slate-700/40 transition ${
                        isConfirmed ? "bg-emerald-950/10" : "bg-amber-950/10"
                      }`}
                    >
                      {/* Order No & Date */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-black text-amber-400">{order.orderNo || order.id}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </td>

                      {/* Consignors (1 to 4) */}
                      <td className="py-2 px-3">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {order.consignor1Name && (
                            <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                              <strong className="text-slate-200">1) {order.consignor1Name}</strong>
                              {order.consignor1Mo && <span className="text-amber-300 ml-1">({order.consignor1Mo})</span>}
                            </span>
                          )}
                          {order.consignor2Name && (
                            <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                              <strong className="text-slate-200">2) {order.consignor2Name}</strong>
                              {order.consignor2Mo && <span className="text-amber-300 ml-1">({order.consignor2Mo})</span>}
                            </span>
                          )}
                          {order.consignor3Name && (
                            <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                              <strong className="text-slate-200">3) {order.consignor3Name}</strong>
                              {order.consignor3Mo && <span className="text-amber-300 ml-1">({order.consignor3Mo})</span>}
                            </span>
                          )}
                          {order.consignor4Name && (
                            <span className="bg-slate-900/80 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
                              <strong className="text-slate-200">4) {order.consignor4Name}</strong>
                              {order.consignor4Mo && <span className="text-amber-300 ml-1">({order.consignor4Mo})</span>}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Consignee Billing Name */}
                      <td className="py-2 px-3 font-semibold text-slate-200 whitespace-nowrap">
                        {order.consigneeBillingName || "-"}
                      </td>

                      {/* Unloading Point */}
                      <td className="py-2 px-3 font-bold text-emerald-400 whitespace-nowrap">
                        {order.unloadingPoint || "-"}
                      </td>

                      {/* Truck MT */}
                      <td className="py-2 px-3 font-bold text-amber-300 whitespace-nowrap">
                        {order.truckMT || "-"}
                      </td>

                      {/* Remark */}
                      <td className="py-2 px-3 text-slate-300 max-w-xs truncate" title={order.remark || ""}>
                        {order.remark || "-"}
                      </td>

                      {/* Status */}
                      <td className="py-2 px-3 text-center whitespace-nowrap">
                        {isConfirmed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            <CheckCircle className="w-3 h-3" /> Confirmed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-2 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isOwner && !isConfirmed && (
                            <button
                              onClick={() => handleConfirmOrder(order.id)}
                              disabled={actionLoading === order.id}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-lg text-xs shadow transition active:scale-95 flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" /> Confirm
                            </button>
                          )}

                          {isOwner && (
                            <button
                              onClick={() => handleDeleteOrder(order.id)}
                              disabled={actionLoading === order.id}
                              className="p-1 text-rose-400 hover:bg-rose-500/20 rounded-lg transition"
                              title="Delete Order"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* COMPACT GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredOrders.map((order) => {
            const isConfirmed = order.status === "CONFIRMED";
            return (
              <div
                key={order.id}
                className={`bg-slate-800/90 rounded-xl border p-3 transition shadow flex flex-col justify-between text-xs ${
                  isConfirmed ? "border-emerald-500/40" : "border-amber-500/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2">
                    <span className="bg-slate-900 text-amber-400 px-2 py-0.5 rounded font-black text-xs">
                      {order.orderNo || order.id}
                    </span>
                    {isConfirmed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle className="w-3 h-3" /> Confirmed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 mb-2">
                    {order.consignor1Name && (
                      <div className="text-[11px] truncate">
                        <span className="text-slate-400">Consignor: </span>
                        <strong className="text-slate-100">{order.consignor1Name}</strong>
                        {order.consignor1Mo && <span className="text-amber-300 ml-1">({order.consignor1Mo})</span>}
                      </div>
                    )}
                    <div className="text-[11px] truncate">
                      <span className="text-slate-400">Consignee: </span>
                      <strong className="text-slate-200">{order.consigneeBillingName || "-"}</strong>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span>Point: <strong className="text-emerald-400">{order.unloadingPoint || "-"}</strong></span>
                      <span>M.T.: <strong className="text-amber-300">{order.truckMT || "-"}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-700/70 mt-1">
                  <span className="text-[10px] text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-1">
                    {isOwner && !isConfirmed && (
                      <button
                        onClick={() => handleConfirmOrder(order.id)}
                        disabled={actionLoading === order.id}
                        className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded text-[11px] transition"
                      >
                        Confirm
                      </button>
                    )}
                    {isOwner && (
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-1 text-rose-400 hover:bg-rose-500/20 rounded"
                      >
                        <Trash2 className="w-3 h-3" />
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
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-xl rounded-xl shadow-2xl overflow-hidden my-4">
            <div className="bg-gradient-to-r from-amber-600 to-amber-700 px-4 py-3 flex items-center justify-between text-slate-950">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 stroke-[2.5]" />
                <h3 className="text-base font-black tracking-wide">Create New Party Order</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-900/20 rounded-lg text-slate-950 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-4 space-y-3 max-h-[80vh] overflow-y-auto text-xs">
              {/* CONSIGNOR SECTION */}
              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700/80">
                <h4 className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
                  Consignor Details (Consignor Party Name & Mobile No)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Consignor 1 */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">
                      (1) Consignor Party Name <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="consignor1Name"
                      value={formData.consignor1Name}
                      onChange={handleChange}
                      placeholder="Party Name 1"
                      required
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">(1) Mobile No.</label>
                    <input
                      type="text"
                      name="consignor1Mo"
                      value={formData.consignor1Mo}
                      onChange={handleChange}
                      placeholder="Mobile Number 1"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Consignor 2 */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">(2) Consignor Party Name</label>
                    <input
                      type="text"
                      name="consignor2Name"
                      value={formData.consignor2Name}
                      onChange={handleChange}
                      placeholder="Party Name 2"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">(2) Mobile No.</label>
                    <input
                      type="text"
                      name="consignor2Mo"
                      value={formData.consignor2Mo}
                      onChange={handleChange}
                      placeholder="Mobile Number 2"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Consignor 3 */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">(3) Consignor Party Name</label>
                    <input
                      type="text"
                      name="consignor3Name"
                      value={formData.consignor3Name}
                      onChange={handleChange}
                      placeholder="Party Name 3"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">(3) Mobile No.</label>
                    <input
                      type="text"
                      name="consignor3Mo"
                      value={formData.consignor3Mo}
                      onChange={handleChange}
                      placeholder="Mobile Number 3"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Consignor 4 */}
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">(4) Consignor Party Name</label>
                    <input
                      type="text"
                      name="consignor4Name"
                      value={formData.consignor4Name}
                      onChange={handleChange}
                      placeholder="Party Name 4"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">(4) Mobile No.</label>
                    <input
                      type="text"
                      name="consignor4Mo"
                      value={formData.consignor4Mo}
                      onChange={handleChange}
                      placeholder="Mobile Number 4"
                      className="w-full px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* CONSIGNEE, UNLOADING POINT, TRUCK MT, REMARK */}
              <div className="space-y-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">Consignee Billing Name</label>
                  <input
                    type="text"
                    name="consigneeBillingName"
                    value={formData.consigneeBillingName}
                    onChange={handleChange}
                    placeholder="Consignee Billing Name"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">Unloading Point</label>
                    <input
                      type="text"
                      name="unloadingPoint"
                      value={formData.unloadingPoint}
                      onChange={handleChange}
                      placeholder="Unloading Location / City"
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">Truck M.T.</label>
                    <input
                      type="text"
                      name="truckMT"
                      value={formData.truckMT}
                      onChange={handleChange}
                      placeholder="e.g. 25 M.T., 30 M.T."
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">Remark</label>
                  <textarea
                    name="remark"
                    rows="2"
                    value={formData.remark}
                    onChange={handleChange}
                    placeholder="Additional instructions or remark..."
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  ></textarea>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 text-xs font-black rounded shadow transition active:scale-95"
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
