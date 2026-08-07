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
  List,
  LayoutGrid,
} from "lucide-react";

export default function TruckOrdersPage() {
  const { user, isOwner } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("TABLE"); // "TABLE" or "GRID"
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

  // Filter orders (Role-based security + search + status filter)
  const filteredOrders = orders.filter((order) => {
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

    const matchesSearch =
      !searchTerm ||
      (order.orderNo && order.orderNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.truckNo && order.truckNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.driverNo && order.driverNo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.location && order.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.center && order.center.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (order.truckMT && order.truckMT.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="p-3 sm:p-4 max-w-[1600px] mx-auto w-full font-sans text-slate-100 flex-1 overflow-y-auto">
      {/* Compact Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 bg-slate-800/90 px-4 py-2.5 rounded-xl border border-slate-700/80 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              Truck Orders <span className="text-xs font-normal text-slate-400">({isOwner ? "Owner View" : "Truck Portal"})</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setViewMode("TABLE")}
              className={`p-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                viewMode === "TABLE" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-slate-200"
              }`}
              title="Compact Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode("GRID")}
              className={`p-1.5 rounded-md text-xs font-bold transition flex items-center gap-1 ${
                viewMode === "GRID" ? "bg-blue-500 text-white" : "text-slate-400 hover:text-slate-200"
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
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-extrabold rounded-lg text-xs shadow transition transform active:scale-95"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            + New Truck Order
          </button>
        </div>
      </div>

      {/* Compact Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 mb-3">
        <div className="relative flex-1 w-full">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order No, Truck No, Driver No, Location, Center..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-800/90 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-500"
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
          <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mb-2" />
          <p className="text-slate-400 text-xs">Loading truck orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center p-8 bg-slate-800/40 rounded-xl border border-slate-700/60">
          <Truck className="w-8 h-8 text-slate-500 mx-auto mb-2 opacity-50" />
          <h3 className="text-sm font-bold text-slate-300">No Truck Orders Found</h3>
          <p className="text-xs text-slate-400 mt-0.5">Click "+ New Truck Order" to submit a new truck order.</p>
        </div>
      ) : viewMode === "TABLE" ? (
        /* COMPACT TABLE VIEW */
        <div className="bg-slate-800/90 rounded-xl border border-slate-700 shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/90 text-blue-400 border-b border-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Order No & Date</th>
                  <th className="py-2.5 px-3">Truck Number</th>
                  <th className="py-2.5 px-3">Truck M.T.</th>
                  <th className="py-2.5 px-3">Driver No.</th>
                  <th className="py-2.5 px-3">Location</th>
                  <th className="py-2.5 px-3">Center</th>
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
                        isConfirmed ? "bg-emerald-950/10" : "bg-blue-950/10"
                      }`}
                    >
                      {/* Order No & Date */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <div className="font-black text-blue-400">{order.orderNo || order.id}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(order.createdAt).toLocaleString("en-IN", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </div>
                      </td>

                      {/* Truck No */}
                      <td className="py-2 px-3 whitespace-nowrap">
                        <span className="font-black text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-700 tracking-wider">
                          {order.truckNo || "-"}
                        </span>
                      </td>

                      {/* Truck MT */}
                      <td className="py-2 px-3 font-bold text-amber-300 whitespace-nowrap">
                        {order.truckMT || "-"}
                      </td>

                      {/* Driver No */}
                      <td className="py-2 px-3 font-semibold text-slate-200 whitespace-nowrap">
                        {order.driverNo ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3 h-3 text-blue-400" /> {order.driverNo}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Location */}
                      <td className="py-2 px-3 font-bold text-emerald-400 whitespace-nowrap">
                        {order.location ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-400" /> {order.location}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* Center */}
                      <td className="py-2 px-3 font-bold text-purple-400 whitespace-nowrap">
                        {order.center ? (
                          <span className="inline-flex items-center gap-1">
                            <Building className="w-3 h-3 text-purple-400" /> {order.center}
                          </span>
                        ) : (
                          "-"
                        )}
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
                  isConfirmed ? "border-emerald-500/40" : "border-blue-500/40"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-700/80 pb-2 mb-2">
                    <span className="bg-slate-900 text-blue-400 px-2 py-0.5 rounded font-black text-xs">
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

                  <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-700 mb-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Truck No</span>
                    <strong className="text-sm font-black text-white">{order.truckNo || "-"}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-1 text-[11px] mb-2">
                    <div>M.T.: <strong className="text-amber-300">{order.truckMT || "-"}</strong></div>
                    <div>Driver: <strong className="text-slate-200">{order.driverNo || "-"}</strong></div>
                    <div>Location: <strong className="text-emerald-400">{order.location || "-"}</strong></div>
                    <div>Center: <strong className="text-purple-400">{order.center || "-"}</strong></div>
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

      {/* Modal Dialog to Place New Truck Order */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-xl shadow-2xl overflow-hidden my-4">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 stroke-[2.5]" />
                <h3 className="text-base font-black tracking-wide">Submit New Truck Order</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-900/20 rounded-lg text-white transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="p-4 space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">
                  Truck Number <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="truckNo"
                  value={formData.truckNo}
                  onChange={handleChange}
                  placeholder="e.g. GJ01AB1234"
                  required
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">Truck M.T.</label>
                  <input
                    type="text"
                    name="truckMT"
                    value={formData.truckMT}
                    onChange={handleChange}
                    placeholder="e.g. 20 M.T., 30 M.T."
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">Driver Mobile No.</label>
                  <input
                    type="text"
                    name="driverNo"
                    value={formData.driverNo}
                    onChange={handleChange}
                    placeholder="Driver Contact Number"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Current Location / City"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-0.5">Center</label>
                  <input
                    type="text"
                    name="center"
                    value={formData.center}
                    onChange={handleChange}
                    placeholder="Center / Loading Station"
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-100 focus:outline-none focus:border-blue-500"
                  />
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
                  className="px-4 py-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white text-xs font-black rounded shadow transition active:scale-95"
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
