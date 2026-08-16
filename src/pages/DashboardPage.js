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
  Building2,
} from "lucide-react";

import { getFinancialYear } from "../utils/storage";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [lrEntries, setLrEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [officeOrders, setOfficeOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch LRs, Parties and Office Orders
  const fetchData = async () => {
    setLoading(true);
    try {
      const [lrRes, partyRes, officeOrdersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/lr-entries`),
        fetch(`${API_BASE_URL}/parties`),
        fetch(`${API_BASE_URL}/office-orders`),
      ]);

      const lrData = await lrRes.json();
      const partyData = await partyRes.json();
      let officeOrdersData = [];
      try {
        if (officeOrdersRes && officeOrdersRes.ok) {
          officeOrdersData = await officeOrdersRes.json();
        }
      } catch (e) {
        console.error("Error parsing office orders:", e);
      }

      if (Array.isArray(lrData)) setLrEntries(lrData);
      if (Array.isArray(partyData)) setParties(partyData);
      if (Array.isArray(officeOrdersData)) setOfficeOrders(officeOrdersData);
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

  // Latest Financial Year (matching AccountingPage default)
  const latestFY = React.useMemo(() => {
    if (!lrEntries || lrEntries.length === 0) return "";
    const years = Array.from(
      new Set(
        lrEntries
          .map((lr) => {
            const d = lr.dateTime || lr.date || lr.createdAt;
            return d ? getFinancialYear(d).label : null;
          })
          .filter(Boolean)
      )
    ).sort((a, b) => b.localeCompare(a));
    return years[0] || "";
  }, [lrEntries]);

  const matchFY = (lrFY, targetFY) => {
    if (!targetFY || targetFY === "ALL") return true;
    if (!lrFY) return false;
    if (lrFY === targetFY) return true;
    if (targetFY.length === 5 && lrFY.endsWith(targetFY)) return true;
    if (lrFY.length === 5 && targetFY.endsWith(lrFY)) return true;
    return false;
  };

  const getLRDate = (lr) => lr?.dateTime || lr?.date || lr?.createdAt || null;
  const getLRFYLabel = (lr) => {
    const d = getLRDate(lr);
    return d ? getFinancialYear(d).label : "";
  };

  // Helper to accurately extract freight amount from LR record matching AccountingPage.js
  const getLRFreightAmount = (lr) => {
    if (!lr) return 0;
    const net = parseFloat(lr.netTotalAmount);
    if (!isNaN(net) && net > 0) return net;

    const totalGst = parseFloat(lr.totalWithGst);
    if (!isNaN(totalGst) && totalGst > 0) return totalGst;

    const freight = parseFloat(lr.freightAmount);
    if (!isNaN(freight) && freight > 0) return freight;

    const w = parseFloat(lr.weightKgs) || 0;
    const r = parseFloat(lr.ratePerTon) || 0;
    if (w > 0 && r > 0) {
      return w > 1000 ? Math.round((w / 1000) * r) : Math.round(w * r);
    }
    return net || 0;
  };

  // Calculations
  const totalLrs = lrEntries.length;

  // 1. CONSIGNEE PENDING (Matching AccountingPage "2. Consignee (Receiver)" tab)
  const consigneeLRs = lrEntries.filter((lr) => {
    const lrFY = getLRFYLabel(lr);
    if (!matchFY(lrFY, latestFY)) return false;

    const payStatus = (lr.toPayOrPaid || "TBB").trim().toUpperCase().replace("-", " ");
    const debitOverride = lr.debitAmountTo?.trim()?.toUpperCase();

    // TO PAY has 0 accounting entries!
    if (payStatus === "TO PAY" || payStatus === "TOPAY") return false;

    // Rule: TBB LRs post to Consignee (or debitAmountTo === CONSIGNEE override)
    if (payStatus !== "TBB" && debitOverride !== "CONSIGNEE") return false;
    return true;
  });
  const totalConsigneeBilled = consigneeLRs.reduce((sum, item) => sum + getLRFreightAmount(item), 0);
  const totalConsigneeReceived = consigneeLRs.reduce((sum, item) => {
    if (item.partyPaymentStatus === "PAID") return sum + getLRFreightAmount(item);
    return sum + (Number(item.partyPaidAmount) || 0);
  }, 0);
  const consigneePendingAmount = totalConsigneeBilled - totalConsigneeReceived;
  const unpaidConsigneeLrsCount = consigneeLRs.filter((lr) => lr.partyPaymentStatus !== "PAID").length;

  // 2. CONSIGNOR PENDING (Matching AccountingPage "1. Consignor (Shipper)" tab)
  const consignorLRs = lrEntries.filter((lr) => {
    const lrFY = getLRFYLabel(lr);
    if (!matchFY(lrFY, latestFY)) return false;

    const payStatus = (lr.toPayOrPaid || "TBB").trim().toUpperCase().replace("-", " ");
    const debitOverride = lr.debitAmountTo?.trim()?.toUpperCase();

    // TO PAY has 0 accounting entries!
    if (payStatus === "TO PAY" || payStatus === "TOPAY") return false;

    // Rule: PAID LRs post to Consignor (or debitAmountTo === CONSIGNOR override)
    if (payStatus === "TBB" && debitOverride !== "CONSIGNOR") return false;
    if (payStatus !== "PAID" && debitOverride !== "CONSIGNOR") return false;
    return true;
  });
  const totalConsignorBilled = consignorLRs.reduce((sum, item) => sum + getLRFreightAmount(item), 0);
  const totalConsignorReceived = consignorLRs.reduce((sum, item) => {
    if (item.partyPaymentStatus === "PAID") return sum + getLRFreightAmount(item);
    return sum + (Number(item.partyPaidAmount) || 0);
  }, 0);
  const consignorPendingAmount = totalConsignorBilled - totalConsignorReceived;
  const unpaidConsignorLrsCount = consignorLRs.filter((lr) => lr.partyPaymentStatus !== "PAID").length;

  // 3. TRUCK PAYABLE PENDING (Matching AccountingPage "3. Truck Accounting" tab)
  const truckLRs = lrEntries.filter((lr) => {
    const lrFY = getLRFYLabel(lr);
    if (!matchFY(lrFY, latestFY)) return false;

    const payStatus = (lr.toPayOrPaid || "TBB").trim().toUpperCase().replace("-", " ");
    // Rule: TBB & PAID post to Truck. TO-PAY posts 0 accounting entries!
    if (payStatus === "TO PAY" || payStatus === "TOPAY") return false;
    return true;
  });
  const totalTruckPayable = truckLRs.reduce((sum, item) => sum + getLRFreightAmount(item), 0);
  const totalTruckPaid = truckLRs.reduce((sum, item) => {
    if (item.truckPaymentStatus === "PAID") return sum + getLRFreightAmount(item);
    return sum + (Number(item.truckPaidAmount) || 0);
  }, 0);
  const truckPendingAmount = totalTruckPayable - totalTruckPaid;
  const unpaidTruckLrsCount = truckLRs.filter((lr) => lr.truckPaymentStatus !== "PAID").length;

  // Total Turnover (All billed LRs in FY)
  const totalBilledTurnover = lrEntries
    .filter((lr) => {
      const lrFY = getLRFYLabel(lr);
      if (!matchFY(lrFY, latestFY)) return false;
      const payStatus = (lr.toPayOrPaid || "TBB").trim().toUpperCase().replace("-", " ");
      return payStatus !== "TO PAY" && payStatus !== "TOPAY";
    })
    .reduce((sum, item) => sum + getLRFreightAmount(item), 0);

  // Unconfirmed Office Orders Count
  const unconfirmedOfficeOrdersCount = React.useMemo(() => {
    if (!Array.isArray(officeOrders)) return 0;
    return officeOrders.filter((ord) => ord.status !== "CONFIRMED").length;
  }, [officeOrders]);

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
      title: "Office Orders",
      path: "/office-orders",
      icon: Building2,
      badge: unconfirmedOfficeOrdersCount > 0 ? `${unconfirmedOfficeOrdersCount} Unconfirmed` : "Orders",
      unconfirmedCount: unconfirmedOfficeOrdersCount,
      color: "from-indigo-500 to-purple-700",
      textColor: "text-purple-400",
      borderColor: unconfirmedOfficeOrdersCount > 0 ? "border-rose-500/80 hover:border-rose-400 ring-2 ring-rose-500/40" : "border-purple-500/30 hover:border-purple-400",
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

        {/* 1. Consignee Pending */}
        <div
          onClick={() => navigate("/accounting?tab=CONSIGNEE")}
          className="bg-slate-800/90 hover:bg-slate-800 border border-rose-500/40 hover:border-rose-500 rounded-xl p-3 shadow transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-rose-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Consignee Pending
              </span>
            </div>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
              <AlertCircle className="w-2.5 h-2.5 inline mr-0.5" /> Unpaid
            </span>
          </div>

          <div className="text-lg sm:text-xl font-extrabold text-rose-400 font-mono tracking-tight my-0.5">
            {loading ? "₹ ..." : formatCurrency(consigneePendingAmount)}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-700/60">
            <span>{unpaidConsigneeLrsCount} Invoices</span>
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

        {/* 3. Consignor Pending */}
        <div
          onClick={() => navigate("/accounting?tab=CONSIGNOR")}
          className="bg-slate-800/90 hover:bg-slate-800 border border-blue-500/40 hover:border-blue-500 rounded-xl p-3 shadow transition cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">
                Consignor Pending
              </span>
            </div>
            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
              <AlertCircle className="w-2.5 h-2.5 inline mr-0.5" /> Unpaid
            </span>
          </div>

          <div className="text-lg sm:text-xl font-extrabold text-blue-400 font-mono tracking-tight my-0.5">
            {loading ? "₹ ..." : formatCurrency(consignorPendingAmount)}
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-700/60">
            <span>{unpaidConsignorLrsCount} Invoices</span>
            <span className="text-blue-400 font-bold flex items-center gap-0.5">
              View <ArrowRight className="w-3 h-3" />
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
            {loading ? "₹ ..." : formatCurrency(totalBilledTurnover)}
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
            const hasNotification = page.unconfirmedCount > 0;
            return (
              <div
                key={page.title}
                onClick={() => navigate(page.path)}
                className={`group bg-slate-900/90 hover:bg-slate-900 rounded-lg p-2.5 border ${page.borderColor} shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-2 relative overflow-hidden`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`p-1.5 rounded-md bg-gradient-to-br ${page.color} text-white shrink-0 shadow relative`}>
                    <Icon className="w-3.5 h-3.5" />
                    {hasNotification && (
                      <span className="absolute -top-1.5 -right-1.5 px-1 min-w-[15px] h-3.5 rounded-full bg-rose-600 text-white text-[8.5px] font-black flex items-center justify-center border border-slate-900 animate-pulse shadow">
                        {page.unconfirmedCount}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="font-bold text-xs text-slate-200 group-hover:text-amber-400 transition-colors truncate">
                        {page.title}
                      </h3>
                      {hasNotification && (
                        <span className="text-[10.5px] font-black text-rose-400 shrink-0">
                          ({page.unconfirmedCount})
                        </span>
                      )}
                    </div>
                    <span className={`text-[9px] font-semibold block truncate ${hasNotification ? "text-rose-400 font-extrabold" : "text-slate-400"}`}>
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
