import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  RefreshCw,
  Building2,
  Eye,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, isOwner } = useAuth();

  const [lrEntries, setLrEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch LRs and Parties
  const fetchData = async () => {
    setLoading(true);
    try {
      const [lrRes, partyRes] = await Promise.all([
        fetch("http://localhost:8002/api/lr-entries"),
        fetch("http://localhost:8002/api/parties"),
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

  // Helper to extract Party Name
  const getPartyName = (lr) => {
    if (!lr) return "-";
    const debit = lr.debitAmountTo?.trim()?.toUpperCase();
    if (debit === "CONSIGNEE") {
      return lr.consigneeName?.trim() || lr.consignorName?.trim() || "-";
    }
    if (debit === "CONSIGNOR") {
      return lr.consignorName?.trim() || lr.consigneeName?.trim() || "-";
    }
    if (lr.debitAmountTo && lr.debitAmountTo.trim() !== "CONSIGNEE" && lr.debitAmountTo.trim() !== "CONSIGNOR") {
      return lr.debitAmountTo.trim();
    }
    return lr.consigneeName?.trim() || lr.consignorName?.trim() || "-";
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

  // All Application Pages Configuration for Quick Access Grid
  const allAppPages = [
    {
      title: "New L/R Entry",
      description: "Create new Lorre Receipt (LR) with full billing & consignment details",
      path: "/lr-entry",
      icon: PlusCircle,
      badge: "Create New",
      color: "from-emerald-600 to-green-700",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
    },
    {
      title: "LR Records & List",
      description: "View, search, edit, print or manage all created Lorre Receipts",
      path: "/lr-list",
      icon: FileText,
      badge: `${totalLrs} Entries`,
      color: "from-blue-600 to-indigo-700",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/30",
    },
    {
      title: "Accounting & Payments",
      description: "Track Party & Truck pending payments, update paid amounts",
      path: "/accounting",
      icon: Calculator,
      badge: "Party & Truck",
      color: "from-amber-600 to-orange-700",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/30",
    },
    {
      title: "Freight Receipt",
      description: "Generate & print official Freight Payment Receipts for LRs",
      path: "/freight-receipt",
      icon: Receipt,
      badge: "Print Receipt",
      color: "from-purple-600 to-pink-700",
      textColor: "text-purple-400",
      borderColor: "border-purple-500/30",
    },
    {
      title: "Daily Summary Report",
      description: "View day-to-day business freight reports, party totals & date filters",
      path: "/daily-report",
      icon: TrendingUp,
      badge: "Reports",
      color: "from-cyan-600 to-blue-700",
      textColor: "text-cyan-400",
      borderColor: "border-cyan-500/30",
    },
    {
      title: "Range LR Print",
      description: "Print multiple LRs at once with custom LR range selection",
      path: "/range-lr-print",
      icon: Printer,
      badge: "Bulk Print",
      color: "from-rose-600 to-red-700",
      textColor: "text-rose-400",
      borderColor: "border-rose-500/30",
    },
    {
      title: "Party Ledger Statement",
      description: "Download detailed party account statements in Excel or PDF",
      path: "/party-statement",
      icon: FileSpreadsheet,
      badge: "Ledger",
      color: "from-violet-600 to-purple-800",
      textColor: "text-violet-400",
      borderColor: "border-violet-500/30",
    },
    {
      title: "CA Excel Export",
      description: "Export clean transport accounting data formatted for CA & Tally",
      path: "/ca-excel",
      icon: FileSpreadsheet,
      badge: "Tax Export",
      color: "from-teal-600 to-emerald-800",
      textColor: "text-teal-400",
      borderColor: "border-teal-500/30",
    },
    {
      title: "Party Master",
      description: "Add, edit and manage Party names, addresses & GSTIN numbers",
      path: "/party-master",
      icon: Users,
      badge: `${parties.length} Parties`,
      color: "from-indigo-600 to-blue-800",
      textColor: "text-indigo-400",
      borderColor: "border-indigo-500/30",
    },
    {
      title: "Truck Master",
      description: "Register and manage Truck vehicle numbers & driver details",
      path: "/truck-master",
      icon: Truck,
      badge: "Vehicles",
      color: "from-amber-700 to-yellow-800",
      textColor: "text-amber-400",
      borderColor: "border-amber-500/30",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 lg:p-8 font-sans space-y-6">

      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <LayoutDashboard className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-serif">
              Wolego Transport Dashboard
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Welcome, <span className="font-bold text-amber-400">{user?.name || "Owner"}</span>! Quick summary & one-click page navigation.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold transition-all border border-slate-700 shadow-md cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 text-amber-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Primary Interactive KPI Cards (Direct One-Click Navigation to Accounting) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* 1. Party Pending Amount Card (CLICKABLE -> Go to Accounting Party Tab) */}
        <div
          onClick={() => navigate("/accounting?tab=PARTY")}
          className="group relative bg-gradient-to-br from-slate-900 via-rose-950/40 to-slate-900 rounded-2xl p-5 border border-rose-500/30 hover:border-rose-500/70 shadow-lg hover:shadow-rose-950/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:bg-rose-500/20 transition-all"></div>
          
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded-full border border-rose-500/30 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Party Unpaid
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Party Pending Amount
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-400 font-mono tracking-tight">
              {loading ? "₹ ..." : formatCurrency(partyPendingAmount)}
            </div>
            <div className="text-xs text-slate-300 pt-2 flex items-center justify-between font-semibold">
              <span>{unpaidPartyLrsCount} Pending Invoices</span>
              <span className="text-rose-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                View Accounting <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 2. Truck Pending Amount Card (CLICKABLE -> Go to Accounting Truck Tab) */}
        <div
          onClick={() => navigate("/accounting?tab=TRUCK")}
          className="group relative bg-gradient-to-br from-slate-900 via-amber-950/40 to-slate-900 rounded-2xl p-5 border border-amber-500/30 hover:border-amber-500/70 shadow-lg hover:shadow-amber-950/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:bg-amber-500/20 transition-all"></div>

          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
              <Truck className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Truck Payable
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Truck Pending Amount
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono tracking-tight">
              {loading ? "₹ ..." : formatCurrency(truckPendingAmount)}
            </div>
            <div className="text-xs text-slate-300 pt-2 flex items-center justify-between font-semibold">
              <span>{unpaidTruckLrsCount} Unpaid Freight</span>
              <span className="text-amber-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                View Accounting <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 3. Total Lorre Receipts (CLICKABLE -> Go to LR List) */}
        <div
          onClick={() => navigate("/lr-list")}
          className="group relative bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 rounded-2xl p-5 border border-blue-500/30 hover:border-blue-500/70 shadow-lg hover:shadow-blue-950/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-blue-500/20 text-blue-400 rounded-xl">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full border border-blue-500/30">
              LR Records
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total LRs Created
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-400 font-mono tracking-tight">
              {loading ? "..." : `${totalLrs} LRs`}
            </div>
            <div className="text-xs text-slate-300 pt-2 flex items-center justify-between font-semibold">
              <span>Full History</span>
              <span className="text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                Open List <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 4. Total Billed Turnover (CLICKABLE -> Go to Daily Report) */}
        <div
          onClick={() => navigate("/daily-report")}
          className="group relative bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 rounded-2xl p-5 border border-emerald-500/30 hover:border-emerald-500/70 shadow-lg hover:shadow-emerald-950/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer overflow-hidden"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-500/30">
              Total Turnover
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Billed Freight
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {loading ? "₹ ..." : formatCurrency(totalPartyBilled)}
            </div>
            <div className="text-xs text-slate-300 pt-2 flex items-center justify-between font-semibold">
              <span>Business Summary</span>
              <span className="text-emerald-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-bold">
                Daily Report <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Quick Navigation Section: Access Every Single Page Directly */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-extrabold text-white tracking-wide font-serif">
              Direct Application Page Shortcuts
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">
            Click any card to go directly to that page
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {allAppPages.map((page) => {
            const Icon = page.icon;
            return (
              <div
                key={page.title}
                onClick={() => navigate(page.path)}
                className={`group bg-slate-900/90 hover:bg-slate-800/90 rounded-2xl p-4 border ${page.borderColor} hover:border-amber-400/60 shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3 transform hover:-translate-y-1`}
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${page.color} text-white shadow-md`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {page.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white group-hover:text-amber-400 transition-colors">
                      {page.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2 mt-0.5">
                      {page.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-slate-300 group-hover:text-white">
                  <span>Open Page</span>
                  <ArrowRight className={`w-4 h-4 ${page.textColor} group-hover:translate-x-1 transition-transform`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
