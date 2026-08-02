import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCircle,
  FileText,
  Calendar,
  ExternalLink,
  Search,
  RefreshCw,
  Building2,
  AlertCircle,
  Calculator,
  ArrowRight,
  TrendingDown,
} from "lucide-react";

export default function PaymentAlertsPage() {
  const navigate = useNavigate();

  const [lrEntries, setLrEntries] = useState([]);
  const [partiesMap, setPartiesMap] = useState({});
  const [loading, setLoading] = useState(true);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTab, setFilterTab] = useState("OVERDUE"); // OVERDUE, DUE_TODAY, ALL_UNPAID

  // Fetch LR Entries and Parties
  const fetchData = async () => {
    setLoading(true);
    try {
      const [lrRes, partyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/lr-entries`),
        fetch(`${API_BASE_URL}/parties`),
      ]);

      let lrs = [];
      let parties = [];

      if (lrRes.ok) lrs = await lrRes.json();
      if (partyRes.ok) parties = await partyRes.json();

      // Create party map for fast lookup of paymentDays
      const pMap = {};
      if (Array.isArray(parties)) {
        parties.forEach((p) => {
          if (p.partyName) {
            const key = p.partyName.toUpperCase().trim();
            pMap[key] = p.paymentDays !== undefined ? Number(p.paymentDays) : 30;
          }
        });
      }
      setPartiesMap(pMap);

      if (Array.isArray(lrs)) setLrEntries(lrs);
    } catch (err) {
      console.error("Error fetching payment alerts data:", err);
    } fontally: {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to parse date
  const parseLRDate = (dateStr, createdAtStr) => {
    if (dateStr) {
      // Try YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + "T00:00:00");
      }
      // Try DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split("/");
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
      }
    }
    if (createdAtStr) return new Date(createdAtStr);
    return new Date();
  };

  // Helper to format date
  const formatDateStr = (dObj) => {
    if (!dObj || isNaN(dObj.getTime())) return "-";
    const yyyy = dObj.getFullYear();
    const mm = String(dObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dObj.getDate()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy}`;
  };

  // Currency Formatter
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
  };

  // Process & Calculate Alerts for all Unpaid LRs
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const processedAlerts = lrEntries
    .filter((lr) => lr.partyPaymentStatus !== "PAID") // Only unpaid/pending
    .map((lr) => {
      const partyName = (
        lr.consigneeName ||
        lr.consignorName ||
        lr.debitAmountTo ||
        "UNKNOWN"
      ).toUpperCase().trim();

      const timelineDays = partiesMap[partyName] !== undefined ? partiesMap[partyName] : 30;

      const billedDate = parseLRDate(lr.dateTime, lr.createdAt);
      billedDate.setHours(0, 0, 0, 0);

      // Due Date = Billed Date + timelineDays
      const dueDate = new Date(billedDate);
      dueDate.setDate(dueDate.getDate() + timelineDays);

      // Diff in days between today and due date
      const diffTime = today.getTime() - dueDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

      // Calculate unpaid amount remaining
      const totalAmt = Number(lr.netTotalAmount) || 0;
      const paidAmt = Number(lr.partyPaidAmount) || 0;
      const pendingAmt = Math.max(0, totalAmt - paidAmt);

      return {
        id: lr.id,
        lrNumber: lr.lrNumber || lr.id,
        lrDate: billedDate,
        partyName,
        truckNo: lr.truckNo || "-",
        totalAmt,
        pendingAmt,
        timelineDays,
        dueDate,
        diffDays, // >0: Overdue, ==0: Due Today, <0: In Timeline
        isOverdue: diffDays > 0,
        isDueToday: diffDays === 0,
      };
    })
    .sort((a, b) => b.diffDays - a.diffDays); // Most overdue first

  // Summary Metrics
  const overdueAlerts = processedAlerts.filter((item) => item.isOverdue);
  const dueTodayAlerts = processedAlerts.filter((item) => item.isDueToday);

  const totalOverdueAmount = overdueAlerts.reduce((sum, item) => sum + item.pendingAmt, 0);
  const overduePartiesSet = new Set(overdueAlerts.map((item) => item.partyName));

  // Filtered List based on Search & Tabs
  const filteredAlerts = processedAlerts.filter((item) => {
    const matchesSearch =
      item.partyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(item.lrNumber).toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.truckNo.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === "OVERDUE") return item.isOverdue;
    if (filterTab === "DUE_TODAY") return item.isDueToday;
    return true; // ALL_UNPAID
  });

  // Handle direct navigation to Accounting page for a party
  const handleOpenAccounting = (partyName) => {
    navigate(`/accounting?search=${encodeURIComponent(partyName)}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 space-y-4 font-sans text-slate-100">
      
      {/* Page Title & Banner */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl shrink-0 border border-rose-500/30">
            <Bell className="w-6 h-6 animate-bounce" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Payment Alerts
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {overdueAlerts.length} Overdue
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Invoices exceeding party credit timeline days &bull; Auto-cleared upon Accounting payment.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 1. Overdue Amount */}
        <div className="bg-slate-800/90 border border-rose-500/40 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400 text-xs font-bold">
            <span>Overdue Amount</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-rose-400 font-mono my-1">
            {formatCurrency(totalOverdueAmount)}
          </div>
          <div className="text-[10px] text-slate-400">Timeline Expired Invoices</div>
        </div>

        {/* 2. Overdue Invoices */}
        <div className="bg-slate-800/90 border border-rose-500/40 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-300 text-xs font-bold">
            <span>Overdue Invoices</span>
            <FileText className="w-4 h-4 text-rose-300" />
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-rose-300 font-mono my-1">
            {overdueAlerts.length}
          </div>
          <div className="text-[10px] text-slate-400">Past Due Date</div>
        </div>

        {/* 3. Overdue Parties */}
        <div className="bg-slate-800/90 border border-amber-500/40 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-xs font-bold">
            <span>Overdue Parties</span>
            <Building2 className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-amber-400 font-mono my-1">
            {overduePartiesSet.size}
          </div>
          <div className="text-[10px] text-slate-400">Unique Defaulters</div>
        </div>

        {/* 4. Due Today */}
        <div className="bg-slate-800/90 border border-yellow-500/40 rounded-xl p-3 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-yellow-400 text-xs font-bold">
            <span>Due Today</span>
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-lg sm:text-2xl font-extrabold text-yellow-400 font-mono my-1">
            {dueTodayAlerts.length}
          </div>
          <div className="text-[10px] text-slate-400">Due Date Is Today</div>
        </div>
      </div>

      {/* Main Alert List & Filter Container */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-xl space-y-3">
        
        {/* Filter Controls & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-slate-700/80 pb-3">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setFilterTab("OVERDUE")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                filterTab === "OVERDUE"
                  ? "bg-rose-500 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <AlertTriangle size={12} />
              <span>Overdue ({overdueAlerts.length})</span>
            </button>
            <button
              onClick={() => setFilterTab("DUE_TODAY")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                filterTab === "DUE_TODAY"
                  ? "bg-yellow-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock size={12} />
              <span>Due Today ({dueTodayAlerts.length})</span>
            </button>
            <button
              onClick={() => setFilterTab("ALL_UNPAID")}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                filterTab === "ALL_UNPAID"
                  ? "bg-slate-700 text-white shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Unpaid ({processedAlerts.length})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Party Name, LR No, or Truck No..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Overdue Alerts Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-700/80">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10.5px] font-bold border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3">LR No & Date</th>
                <th className="py-2.5 px-3">Party Name</th>
                <th className="py-2.5 px-3 text-right">Pending Amount</th>
                <th className="py-2.5 px-3 text-center">Timeline</th>
                <th className="py-2.5 px-3 text-center">Due Date</th>
                <th className="py-2.5 px-3 text-center">Overdue Status</th>
                <th className="py-2.5 px-3 text-center">Action (Accounting)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700/60 bg-slate-800/40">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-amber-400" />
                    Calculating payment alerts...
                  </td>
                </tr>
              ) : filteredAlerts.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400 font-medium">
                    <CheckCircle className="w-6 h-6 mx-auto mb-1 text-emerald-400" />
                    No payment alerts found. All payments are up to date!
                  </td>
                </tr>
              ) : (
                filteredAlerts.map((item) => {
                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-700/40 transition-colors ${
                        item.isOverdue ? "bg-rose-950/20" : ""
                      }`}
                    >
                      {/* LR No & Date */}
                      <td className="py-2.5 px-3 font-mono">
                        <div className="font-extrabold text-amber-400 text-sm">
                          #{item.lrNumber}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar size={11} /> {formatDateStr(item.lrDate)}
                        </div>
                      </td>

                      {/* Party Name */}
                      <td className="py-2.5 px-3 font-bold text-white max-w-[200px] truncate">
                        <div className="truncate" title={item.partyName}>
                          {item.partyName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Truck: {item.truckNo}
                        </div>
                      </td>

                      {/* Pending Amount */}
                      <td className="py-2.5 px-3 text-right font-extrabold font-mono text-white text-sm whitespace-nowrap">
                        {formatCurrency(item.pendingAmt)}
                      </td>

                      {/* Timeline Days */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300 font-mono text-[11px] font-bold">
                          {item.timelineDays} Days
                        </span>
                      </td>

                      {/* Due Date */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300 whitespace-nowrap">
                        {formatDateStr(item.dueDate)}
                      </td>

                      {/* Overdue Status Badge */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {item.isOverdue ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10.5px] font-black animate-pulse">
                            <AlertTriangle size={12} /> {item.diffDays} Days Overdue
                          </span>
                        ) : item.isDueToday ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-[10.5px] font-bold">
                            <Clock size={12} /> Due Today
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10.5px] font-bold">
                            <CheckCircle size={12} /> {Math.abs(item.diffDays)} Days Left
                          </span>
                        )}
                      </td>

                      {/* Action (Pay in Accounting) */}
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleOpenAccounting(item.partyName)}
                          title={`Open Accounting ledger for ${item.partyName}`}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold rounded-lg text-xs transition shadow flex items-center gap-1.5 mx-auto cursor-pointer"
                        >
                          <Calculator size={14} />
                          <span>Pay in Accounting</span>
                          <ExternalLink size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
