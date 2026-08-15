import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import TruckPortalStatementDocument from "../components/TruckPortalStatementDocument";
import {
  Truck,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock,
  RefreshCw,
  Search,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  ChevronDown,
  Download,
  Printer,
  Eye,
  Landmark,
  X,
} from "lucide-react";

export default function TruckAccountingPage() {
  const { user, isOwner } = useAuth();

  const [trucks, setTrucks] = useState([]);
  const [lrEntries, setLrEntries] = useState([]);
  const [truckPayments, setTruckPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTruckModal, setViewTruckModal] = useState(null);

  // Selected Truck Filter ("ALL" or specific truckNo)
  const [selectedTruckNo, setSelectedTruckNo] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Statement PDF & Print Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeAutoAction, setActiveAutoAction] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [trucksRes, lrRes, paymentsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/trucks`),
        fetch(`${API_BASE_URL}/lr-entries`),
        fetch(`${API_BASE_URL}/truck-payments`),
      ]);

      let tList = [];
      let lList = [];
      let pList = [];

      if (trucksRes.ok) tList = await trucksRes.json();
      if (lrRes.ok) lList = await lrRes.json();
      if (paymentsRes.ok) pList = await paymentsRes.json();

      if (Array.isArray(tList)) setTrucks(tList);
      if (Array.isArray(lList)) setLrEntries(lList);
      if (Array.isArray(pList)) setTruckPayments(pList);
    } catch (err) {
      console.error("Error fetching truck accounting data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Identify user's registered trucks by matching mobile number
  const userMobile = user?.mobileNo || user?.username || "";

  const myTrucks = isOwner
    ? trucks
    : trucks.filter((t) => {
      if (!t.mobileNo || !userMobile) return false;
      const nums = String(t.mobileNo).split(/[,/ ]+/).map((n) => n.trim());
      return nums.includes(userMobile.trim());
    });

  const myTruckNosSet = new Set(myTrucks.map((t) => (t.truckNo || "").toUpperCase().trim()));

  // Filter LR entries strictly for my trucks (Excluding TO-PAY LRs as TO-PAY posts 0 entries in accounting ledger)
  const filteredLRs = lrEntries.filter((lr) => {
    const payStatus = (lr.toPayOrPaid || "TBB").trim().toUpperCase().replace("-", " ");
    if (payStatus === "TO PAY" || payStatus === "TOPAY") return false;

    const tNo = (lr.truckNo || "").toUpperCase().trim();
    if (!isOwner) {
      if (!myTruckNosSet.has(tNo)) return false;
      if (selectedTruckNo !== "ALL") return tNo === selectedTruckNo.toUpperCase().trim();
      return true;
    }
    // Owner view
    if (selectedTruckNo !== "ALL") return tNo === selectedTruckNo.toUpperCase().trim();
    return true;
  });

  // Filter Truck Payment entries strictly for my trucks
  const filteredPayments = truckPayments.filter((p) => {
    const tNo = (p.truckNo || "").toUpperCase().trim();
    if (!isOwner) {
      if (!myTruckNosSet.has(tNo)) return false;
      if (selectedTruckNo !== "ALL") return tNo === selectedTruckNo.toUpperCase().trim();
      return true;
    }
    // Owner view
    if (selectedTruckNo !== "ALL") return tNo === selectedTruckNo.toUpperCase().trim();
    return true;
  });

  // Combine trips & cash entries into a single accounting ledger timeline
  const combinedLedger = [
    ...filteredLRs.map((lr) => {
      const amt = Number(lr.netTotalAmount) || Number(lr.freightAmount) || 0;
      const paidAmt = Number(lr.truckPaidAmount) || 0;
      const isPaid = lr.truckPaymentStatus === "PAID" || paidAmt >= amt;
      const routeStr = lr.fromPlace && lr.toPlace ? ` (${lr.fromPlace} -> ${lr.toPlace})` : "";
      const paidDateVal = isPaid ? (lr.truckPaidDate || lr.dateTime || lr.createdAt?.split("T")[0] || "-") : "-";
      return {
        id: `LR-${lr.id}`,
        date: lr.dateTime || lr.createdAt?.split("T")[0] || "-",
        truckNo: (lr.truckNo || "-").toUpperCase(),
        detail: `Trip Freight${routeStr}`,
        category: "TRIP",
        amount: amt,
        paidAmount: paidAmt,
        status: isPaid ? "PAID" : "UNPAID",
        paidDate: paidDateVal,
        rawDate: new Date(lr.createdAt || Date.now()),
      };
    }),
    ...filteredPayments.map((p) => {
      const amt = Number(p.amount) || 0;
      const isPaid = p.status === "PAID";
      const paidDateVal = isPaid ? (p.date || p.createdAt?.split("T")[0] || "-") : "-";
      return {
        id: `TP-${p.id}`,
        date: p.date || p.createdAt?.split("T")[0] || "-",
        truckNo: (p.truckNo || "-").toUpperCase(),
        detail: p.remark ? `Payment: ${p.remark}` : "Payment / Cash Advance",
        category: "PAYMENT",
        amount: amt,
        paidAmount: isPaid ? amt : 0,
        status: isPaid ? "PAID" : "PENDING",
        paidDate: paidDateVal,
        rawDate: new Date(p.createdAt || Date.now()),
      };
    }),
  ].sort((a, b) => b.rawDate - a.rawDate);

  // Search filter
  const finalLedger = combinedLedger.filter((item) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.truckNo.toLowerCase().includes(term) ||
      item.detail.toLowerCase().includes(term) ||
      item.date.toLowerCase().includes(term) ||
      item.paidDate.toLowerCase().includes(term)
    );
  });

  // Calculations
  const totalBilled = combinedLedger.reduce((sum, item) => sum + item.amount, 0);
  const totalPaid = combinedLedger.reduce((sum, item) => sum + (item.status === "PAID" ? item.amount : item.paidAmount), 0);
  const balancePayable = Math.max(0, totalBilled - totalPaid);

  // Currency Formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  // Date Formatter
  const formatDateDisplay = (dateVal) => {
    if (!dateVal || dateVal === "-") return "-";
    try {
      if (typeof dateVal === "string" && dateVal.includes("-")) {
        const cleanDate = dateVal.split("T")[0];
        const parts = cleanDate.split("-");
        if (parts.length === 3) {
          const [y, m, d] = parts;
          return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
        }
      }
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return dateVal;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateVal;
    }
  };

  // Helper to open Truck Master Details popup
  const handleOpenTruckDetails = (truckNoVal, e) => {
    if (e) e.stopPropagation();
    if (!truckNoVal || truckNoVal === "-" || truckNoVal === "N/A") return;
    const cleanSearch = truckNoVal.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
    const matched = trucks.find(
      (t) => t.truckNo && t.truckNo.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === cleanSearch
    );

    if (matched) {
      setViewTruckModal(matched);
    } else {
      setViewTruckModal({
        truckNo: truckNoVal,
        ownerName: "Not found in Truck Master",
      });
    }
  };

  if (showPrintModal) {
    return (
      <TruckPortalStatementDocument
        userMobile={userMobile}
        selectedTruckNo={selectedTruckNo}
        selectedFY="ALL"
        totalBilled={totalBilled}
        totalPaid={totalPaid}
        balancePayable={balancePayable}
        records={finalLedger}
        autoAction={activeAutoAction}
        onClose={() => {
          setShowPrintModal(false);
          setActiveAutoAction(null);
        }}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 font-sans text-slate-100">

      {/* Page Title & Header */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              My Truck Accounting
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {myTrucks.length} Truck{myTrucks.length !== 1 ? "s" : ""}
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Trip ledger & payment history for registered mobile: <span className="font-mono text-amber-400 font-bold">{userMobile}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Multi-Truck Selector Dropdown */}
          {myTrucks.length > 0 && (
            <div className="relative flex-1 sm:flex-initial">
              <select
                value={selectedTruckNo}
                onChange={(e) => setSelectedTruckNo(e.target.value)}
                className="w-full bg-slate-900 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer uppercase"
              >
                <option value="ALL">All My Trucks ({myTrucks.length})</option>
                {myTrucks.map((t) => (
                  <option key={t.id || t.truckNo} value={t.truckNo}>
                    {t.truckNo}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={() => {
              setActiveAutoAction("pdf");
              setShowPrintModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer shadow shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement PDF</span>
          </button>

          <button
            onClick={() => {
              setActiveAutoAction("print");
              setShowPrintModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer shadow shrink-0"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print A4</span>
          </button>

          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50 shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* 1. Total Freight / Billed */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Freight Amount</span>
            <DollarSign className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-400 font-mono my-1">
            {formatCurrency(totalBilled)}
          </div>
          <div className="text-[10px] text-slate-400">Total Billed Freight</div>
        </div>

        {/* 2. Total Paid */}
        <div className="bg-slate-800/90 border border-emerald-500/40 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400 text-xs font-semibold">
            <span>Paid Amount</span>
            <CheckCircle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono my-1">
            {formatCurrency(totalPaid)}
          </div>
          <div className="text-[10px] text-slate-400">Received Payments</div>
        </div>

        {/* 3. Balance Payable */}
        <div className="bg-slate-800/90 border border-amber-500/40 rounded-xl p-3.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs font-semibold">
            <span>Balance Payable</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-amber-400 font-mono my-1">
            {formatCurrency(balancePayable)}
          </div>
          <div className="text-[10px] text-slate-400">Remaining Balance</div>
        </div>
      </div>

      {/* Clean Accounting Table */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-slate-700/80 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Accounting Statement / Trips Log
            </h2>
          </div>

          {/* Search */}
          <div className="relative max-w-md w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Truck No or Date..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Minimal Clean Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-700/80">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10.5px] font-bold border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-4">Txn Date</th>
                <th className="py-2.5 px-4">Truck No</th>
                <th className="py-2.5 px-4">Trip Details / Remark</th>
                <th className="py-2.5 px-4 text-right">Amount (₹)</th>
                <th className="py-2.5 px-4 text-center">Paid Date</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700/60 bg-slate-800/40">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                    Loading accounting details...
                  </td>
                </tr>
              ) : finalLedger.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-400 font-medium">
                    <AlertCircle className="w-5 h-5 mx-auto mb-1 text-slate-500" />
                    No trips or payment records found.
                  </td>
                </tr>
              ) : (
                finalLedger.map((item) => {
                  const isPaid = item.status === "PAID";
                  return (
                    <tr key={item.id} className="hover:bg-slate-700/40 transition-colors">
                      {/* Date */}
                      <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatDateDisplay(item.date)}</span>
                        </div>
                      </td>

                      {/* Truck No */}
                      <td className="py-3 px-4 font-bold font-mono text-amber-400 text-sm whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => handleOpenTruckDetails(item.truckNo, e)}
                          title="Click to view Truck Master details"
                          className="hover:underline hover:text-amber-300 font-mono font-bold cursor-pointer transition-colors inline-flex items-center gap-1 group"
                        >
                          <span>{item.truckNo}</span>
                          {item.truckNo && item.truckNo !== "-" && (
                            <Eye size={12} className="opacity-0 group-hover:opacity-100 text-amber-400 shrink-0 transition-opacity" />
                          )}
                        </button>
                      </td>

                      {/* Detail / Remark */}
                      <td className="py-3 px-4 text-slate-200">
                        {item.detail}
                      </td>

                      {/* Amount */}
                      <td className="py-3 px-4 text-right font-extrabold font-mono text-white text-sm whitespace-nowrap">
                        {formatCurrency(item.amount)}
                      </td>

                      {/* Paid Date */}
                      <td className="py-3 px-4 text-center font-mono text-xs whitespace-nowrap">
                        {isPaid && item.paidDate && item.paidDate !== "-" ? (
                          <span className="text-emerald-400 font-semibold">{formatDateDisplay(item.paidDate)}</span>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
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
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW TRUCK MASTER DETAILS MODAL (Clean Crisp White Theme) */}
      {viewTruckModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-600" /> Truck Master Details
              </h3>
              <button
                onClick={() => setViewTruckModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-3.5 text-xs text-slate-800">
              <div className="bg-sky-50/70 p-4 rounded-xl border border-sky-200">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-extrabold text-sky-800 uppercase tracking-wider block">
                      Truck Number
                    </span>
                    <h4 className="text-lg font-black text-slate-900 font-mono tracking-wide">
                      {viewTruckModal.truckNo}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Owner Name</span>
                    <span className="font-black text-slate-900 text-sm">{viewTruckModal.ownerName || "N/A"}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">Mobile Number</span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    {viewTruckModal.mobileNo ? `📱 ${viewTruckModal.mobileNo}` : "N/A"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">City / Address</span>
                  <span className="font-semibold text-slate-900 text-xs">
                    {viewTruckModal.address || "N/A"}
                  </span>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="text-[11px] font-extrabold text-sky-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex items-center gap-1.5">
                  <Landmark size={14} className="text-sky-700" /> Bank Account Details
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Bank Name</span>
                    <span className="font-bold text-slate-900 text-xs">{viewTruckModal.bankName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Branch</span>
                    <span className="font-semibold text-slate-800 text-xs">{viewTruckModal.branch || "N/A"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Account Holder Name</span>
                    <span className="font-bold text-slate-900 text-xs">{viewTruckModal.accountName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">IFSC Code</span>
                    <span className="font-mono font-black text-amber-700 text-xs">{viewTruckModal.ifscCode || "N/A"}</span>
                  </div>
                </div>

                <div className="pt-1.5 border-t border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Account Number</span>
                  <span className="font-mono font-black text-sm text-emerald-700 tracking-wider">
                    {viewTruckModal.accountNo || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewTruckModal(null)}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-lg text-xs uppercase shadow transition cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
