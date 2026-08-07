import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import {
  LayoutDashboard,
  CreditCard,
  Truck,
  Users,
  FileText,
  Receipt,
  FileSpreadsheet,
  Printer,
  Calculator,
  ArrowRight,
  TrendingUp,
  Clock,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Zap,
  Bell,
  PackagePlus,
} from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lrEntries, setLrEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch LRs and Parties
  const fetchData = async () => {
    setLoading(true);
    try {
      const [lrRes, partyRes] = await Promise.all([
        fetch(`${API_BASE_URL}/lr-entries`),
        fetch(`${API_BASE_URL}/parties`),
      ]);

      const lrData = await lrRes.json();
      const partyData = await partyRes.json();

      if (Array.isArray(lrData)) setLrEntries(lrData);
      if (Array.isArray(partyData)) setParties(partyData);
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to format currency
  const formatCurrency = (val) => {
    const amount = Number(val) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Calculations
  const totalLrs = lrEntries.length;

  // Party Pending Calculation
  const totalPartyBilled = lrEntries.reduce((sum, item) => sum + (Number(item.netTotalAmount) || 0), 0);
  const totalPartyReceived = lrEntries.reduce((sum, item) => {
    if (item.partyPaymentStatus === "PAID") return sum + (Number(item.netTotalAmount) || 0);
    return sum + (Number(item.partyPaidAmount) || 0);
  }, 0);
  const partyPendingAmount = totalPartyBilled - totalPartyReceived;
  const unpaidPartyLrsCount = lrEntries.filter((lr) => lr.partyPaymentStatus !== "PAID").length;

  // Truck Pending Calculation
  const totalTruckPayable = lrEntries.reduce((sum, item) => sum + (Number(item.netTotalAmount) || 0), 0);
  const totalTruckPaid = lrEntries.reduce((sum, item) => {
    if (item.truckPaymentStatus === "PAID") return sum + (Number(item.netTotalAmount) || 0);
    return sum + (Number(item.truckPaidAmount) || 0);
  }, 0);
  const truckPendingAmount = totalTruckPayable - totalTruckPaid;
  const unpaidTruckLrsCount = lrEntries.filter((lr) => lr.truckPaymentStatus !== "PAID").length;

  // Shortcuts Page Configuration
  const allAppPages = [
    {
      title: "Party Orders",
      path: "/party-orders",
      icon: PackagePlus,
      badge: "Orders",
      color: "from-amber-500 to-amber-700",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/30 hover:border-amber-400",
    },
    {
      title: "Truck Orders",
      path: "/truck-orders",
      icon: Truck,
      badge: "Orders",
      color: "from-blue-500 to-blue-700",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/30 hover:border-blue-400",
    },
    {
      title: "New L/R Entry",
      path: "/lr-entry",
      icon: PlusCircle,
      badge: "Create",
      color: "from-emerald-500 to-emerald-700",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/30 hover:border-emerald-400",
    },
    {
      title: "LR Records & List",
      path: "/lr-list",
      icon: FileText,
      badge: `${totalLrs} LRs`,
      color: "from-blue-500 to-blue-700",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/30 hover:border-blue-400",
    },
    {
      title: "Accounting & Payments",
      path: "/accounting",
      icon: Calculator,
      badge: "Ledger",
      color: "from-amber-500 to-amber-700",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/30 hover:border-amber-400",
    },
    {
      title: "Freight Receipt",
      path: "/freight-receipt",
      icon: Receipt,
      badge: "Receipt",
      color: "from-purple-500 to-purple-700",
      textColor: "text-purple-400",
      borderColor: "border-purple-500/30 hover:border-purple-400",
    },
    {
      title: "Daily Report",
      path: "/daily-report",
      icon: TrendingUp,
      badge: "Report",
      color: "from-cyan-500 to-cyan-700",
      textColor: "text-cyan-400",
      borderColor: "border-cyan-500/30 hover:border-cyan-400",
    },
    {
      title: "Letter Pad (A4)",
      path: "/letter-pad",
      icon: FileText,
      badge: "Official Pad",
      color: "from-indigo-500 to-indigo-700",
      textColor: "text-indigo-400",
      borderColor: "border-indigo-500/30 hover:border-indigo-400",
    },
    {
      title: "Range LR Print",
      path: "/range-lr-print",
      icon: Printer,
      badge: "Bulk Print",
      color: "from-rose-500 to-rose-700",
      textColor: "text-rose-400",
      borderColor: "border-rose-500/30 hover:border-rose-400",
    },
    {
      title: "Party Statement",
      path: "/party-statement",
      icon: FileSpreadsheet,
      badge: "Statement",
      color: "from-violet-500 to-violet-700",
      textColor: "text-violet-400",
      borderColor: "border-violet-500/30 hover:border-violet-400",
    },
    {
      title: "CA Excel Export",
      path: "/ca-excel",
      icon: FileSpreadsheet,
      badge: "Tally/Excel",
      color: "from-teal-500 to-teal-700",
      textColor: "text-teal-400",
      borderColor: "border-teal-500/30 hover:border-teal-400",
    },
    {
      title: "Party Master",
      path: "/party-master",
      icon: Users,
      badge: `${parties.length} Parties`,
      color: "from-indigo-500 to-indigo-700",
      textColor: "text-indigo-400",
      borderColor: "border-indigo-500/30 hover:border-indigo-400",
    },
    {
      title: "Truck Master",
      path: "/truck-master",
      icon: Truck,
      badge: "Trucks",
      color: "from-yellow-600 to-amber-700",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/30 hover:border-amber-400",
    },
    {
      title: "Truck Debit",
      path: "/truck-payments",
      icon: Truck,
      badge: "Debit Entry",
      color: "from-emerald-600 to-teal-700",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/30 hover:border-emerald-400",
    },
    {
      title: "Payment Alerts",
      path: "/payment-alerts",
      icon: Bell,
      badge: "Overdue Alerts",
      color: "from-rose-600 to-red-700",
      textColor: "text-rose-400",
      borderColor: "border-rose-500/30 hover:border-rose-400",
    },
    {
      title: "Truck Coming Alert",
      path: "/truck-coming",
      icon: Truck,
      badge: "Due Return",
      color: "from-amber-600 to-orange-700",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/30 hover:border-amber-400",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 font-sans space-y-3">
      
      {/* Compact Header Banner */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 px-4 shadow-md flex justify-between items-center gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
            <LayoutDashboard className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              Wolego Transport Dashboard
            </h1>
            <p className="text-[11px] text-slate-400">
              Welcome, <span className="font-bold text-amber-400">{user?.name || "Owner"}</span> &bull; Quick summary & navigation
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* 4 Compact Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        
        {/* 1. Party Pending */}
        <div
          onClick={() => navigate("/accounting?tab=PARTY")}
          className="bg-slate-800/90 hover:bg-slate-800 border border-rose-500/40 hover:border-rose-500 rounded-xl p-3 shadow transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Party Pending
              </span>
            </div>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <AlertCircle className="w-2.5 h-2.5 inline mr-0.5" /> Unpaid
            </span>
          </div>

          <div className="text-lg sm:text-xl font-extrabold text-rose-400 font-mono tracking-tight my-0.5">
            {loading ? "₹ ..." : formatCurrency(partyPendingAmount)}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-700/60">
            <span>{unpaidPartyLrsCount} Invoices</span>
            <span className="text-rose-400 font-bold flex items-center gap-0.5">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 2. Truck Pending */}
        <div
          onClick={() => navigate("/accounting?tab=TRUCK")}
          className="bg-slate-800/90 hover:bg-slate-800 border border-amber-500/40 hover:border-amber-500 rounded-xl p-3 shadow transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Truck Payable
              </span>
            </div>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Clock className="w-2.5 h-2.5 inline mr-0.5" /> Payable
            </span>
          </div>

          <div className="text-lg sm:text-xl font-extrabold text-amber-400 font-mono tracking-tight my-0.5">
            {loading ? "₹ ..." : formatCurrency(truckPendingAmount)}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-700/60">
            <span>{unpaidTruckLrsCount} Unpaid</span>
            <span className="text-amber-400 font-bold flex items-center gap-0.5">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 3. Total LRs */}
        <div
          onClick={() => navigate("/lr-list")}
          className="bg-slate-800/90 hover:bg-slate-800 border border-blue-500/40 hover:border-blue-500 rounded-xl p-3 shadow transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Total LR Created
              </span>
            </div>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Records
            </span>
          </div>

          <div className="text-lg sm:text-xl font-extrabold text-blue-400 font-mono tracking-tight my-0.5">
            {loading ? "..." : `${totalLrs} LR`}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-700/60">
            <span>Full History</span>
            <span className="text-blue-400 font-bold flex items-center gap-0.5">
              Open <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* 4. Total Turnover */}
        <div
          onClick={() => navigate("/daily-report")}
          className="bg-slate-800/90 hover:bg-slate-800 border border-emerald-500/40 hover:border-emerald-500 rounded-xl p-3 shadow transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Total Turnover
              </span>
            </div>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              Billed
            </span>
          </div>

          <div className="text-lg sm:text-xl font-extrabold text-emerald-400 font-mono tracking-tight my-0.5">
            {loading ? "₹ ..." : formatCurrency(totalPartyBilled)}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-700/60">
            <span>Business Summary</span>
            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
              Report <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

      </div>

      {/* Page Shortcuts Grid Header */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 shadow-md space-y-2.5">
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white tracking-wide">
              Quick Application Shortcuts
            </h2>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            1-Click Direct Navigation
          </span>
        </div>

        {/* 10 Compact Interactive Shortcut Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {allAppPages.map((page) => {
            const Icon = page.icon;
            return (
              <div
                key={page.title}
                onClick={() => navigate(page.path)}
                className={`group bg-slate-900/90 hover:bg-slate-900 rounded-lg p-2.5 border ${page.borderColor} shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-2`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-md bg-gradient-to-br ${page.color} text-white shrink-0 shadow`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-xs text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                      {page.title}
                    </h3>
                    <span className="text-[9px] font-semibold text-slate-400 block truncate">
                      {page.badge}
                    </span>
                  </div>
                </div>

                <ArrowRight className={`w-3.5 h-3.5 ${page.textColor} group-hover:translate-x-0.5 transition-transform shrink-0`} />
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
