import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getFinancialYear } from "../utils/storage";
import PartyPortalStatementDocument from "../components/PartyPortalStatementDocument";
import AccountingStatementDocument from "../components/AccountingStatementDocument";
import LRPrintDocument from "../components/LRPrintDocument";
import { API_BASE_URL } from "../config/api";
import {
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  Truck,
  Users,
  Search,
  Filter,
  RefreshCw,
  CreditCard,
  Building2,
  X,
  Calendar,
  Download,
  Printer,
} from "lucide-react";

export default function AccountingPage() {
  const { user, isParty } = useAuth();
  const location = useLocation();

  const [lrEntries, setLrEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Owner View state
  const [activeTab, setActiveTab] = useState("CONSIGNOR"); // "CONSIGNOR", "CONSIGNEE", "TRUCK"
  const [selectedFY, setSelectedFY] = useState("ALL"); // Financial Year Filter
  const [fromDate, setFromDate] = useState(""); // From Date Filter (YYYY-MM-DD)
  const [toDate, setToDate] = useState(""); // To Date Filter (YYYY-MM-DD)
  const [selectedPartyName, setSelectedPartyName] = useState("ALL");
  const [selectedTruckNo, setSelectedTruckNo] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PAID, UNPAID
  const [searchQuery, setSearchQuery] = useState("");

  // Statement PDF & Print Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showOwnerStatementModal, setShowOwnerStatementModal] = useState(false);
  const [activeAutoAction, setActiveAutoAction] = useState(null);

  // Individual LR PDF view/download state for Party Portal
  const [selectedLrForDoc, setSelectedLrForDoc] = useState(null);
  const [lrDocAutoAction, setLrDocAutoAction] = useState(null);

  // Sync tab with URL search parameter (?tab=TRUCK or ?tab=PARTY)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam === "TRUCK") {
      setActiveTab("TRUCK");
    } else if (tabParam === "PARTY") {
      setActiveTab("PARTY");
    }
  }, [location.search]);

  // Action modal / quick edit
  const [updatingId, setUpdatingId] = useState(null);

  // Custom Payment Modal State
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    lrId: "",
    lrNumber: "",
    type: "PARTY", // "PARTY" or "TRUCK"
    partyName: "",
    amount: 0,
    paymentDate: "",
    chequeNo: "",
  });

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

      if (Array.isArray(lrData)) {
        setLrEntries(lrData);
        // Auto-select latest Financial Year present in database (e.g. 2026-27 or 2027-28)
        if (lrData.length > 0) {
          const dbYears = Array.from(
            new Set(
              lrData
                .map((lr) => {
                  const d = lr.dateTime || lr.date;
                  return d ? getFinancialYear(d).label : null;
                })
                .filter(Boolean)
            )
          ).sort((a, b) => b.localeCompare(a));

          if (dbYears.length > 0) {
            setSelectedFY(dbYears[0]);
          }
        }
      }
      if (Array.isArray(partyData)) setParties(partyData);
    } catch (err) {
      console.error("Error fetching accounting data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getTodayIsoDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDisplayDate = (isoStr) => {
    if (!isoStr) return "";
    const parts = isoStr.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return isoStr;
  };

  // Open Payment Modal
  const openPaymentModal = (lrId, lrNumber, type, amount, partyName, existingChequeNo = "") => {
    setPaymentModal({
      isOpen: true,
      lrId,
      lrNumber,
      type,
      partyName,
      amount,
      paymentDate: getTodayIsoDate(),
      chequeNo: existingChequeNo || "",
    });
  };

  // Confirm Payment Submission
  const handleConfirmPayment = async () => {
    const { lrId, type, amount, paymentDate, chequeNo } = paymentModal;
    if (!lrId) return;

    setUpdatingId(lrId);
    setPaymentModal((prev) => ({ ...prev, isOpen: false }));

    try {
      const payload = {};
      const formattedDate = formatDisplayDate(paymentDate) || new Date().toLocaleDateString("en-GB");

      if (type === "PARTY") {
        payload.partyPaymentStatus = "PAID";
        payload.partyPaidAmount = amount;
        payload.partyPaidDate = formattedDate;
        payload.partyChequeNo = chequeNo ? chequeNo.trim() : "";
      } else if (type === "TRUCK") {
        payload.truckPaymentStatus = "PAID";
        payload.truckPaidAmount = amount;
        payload.truckPaidDate = formattedDate;
        payload.truckChequeNo = chequeNo ? chequeNo.trim() : "";
      }

      const res = await fetch(`${API_BASE_URL}/lr-entries/${lrId}/payment-status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setLrEntries((prev) =>
          prev.map((item) => (item.id === lrId ? { ...item, ...payload } : item))
        );
      }
    } catch (err) {
      console.error("Error updating payment status:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  // Helper to extract actual party name for an LR entry based on TBB (Consignee) / PAID (Consignor)
  const getPartyName = (lr) => {
    if (!lr) return "-";
    const status = (lr.toPayOrPaid || "TBB").trim().toUpperCase();
    if (status === "PAID") {
      return lr.consignorName?.trim() || lr.consigneeName?.trim() || "-";
    }
    if (status === "TBB") {
      return lr.consigneeName?.trim() || lr.consignorName?.trim() || "-";
    }
    const debit = lr.debitAmountTo?.trim()?.toUpperCase();
    if (debit === "CONSIGNEE") return lr.consigneeName?.trim() || "-";
    if (debit === "CONSIGNOR") return lr.consignorName?.trim() || "-";
    return lr.consigneeName?.trim() || lr.consignorName?.trim() || "-";
  };

  // Date and FY helper functions
  const getLRDate = (lr) => {
    return lr?.dateTime || lr?.date || lr?.createdAt || null;
  };

  const getLRFYLabel = (lr) => {
    const d = getLRDate(lr);
    return d ? getFinancialYear(d).label : "";
  };

  const matchFY = (lrFY, targetFY) => {
    if (!targetFY || targetFY === "ALL") return true;
    if (!lrFY) return false;
    if (lrFY === targetFY) return true;
    if (targetFY.length === 5 && lrFY.endsWith(targetFY)) return true;
    if (lrFY.length === 5 && targetFY.endsWith(lrFY)) return true;
    return false;
  };

  // Extract unique Financial Years present in Dataset
  const availableFYs = Array.from(
    new Set([
      getFinancialYear(new Date()).label,
      ...lrEntries
        .map((lr) => {
          const d = getLRDate(lr);
          return d ? getFinancialYear(d).label : null;
        })
        .filter(Boolean),
    ])
  ).sort((a, b) => b.localeCompare(a));

  // Helper to accurately extract freight amount from LR record
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

  // Extract unique Truck numbers
  const uniqueTrucks = Array.from(
    new Set(
      lrEntries
        .map((lr) => lr.truckNo?.trim()?.toUpperCase())
        .filter(Boolean)
    )
  ).sort();

  const getIsoDateString = (dateVal) => {
    if (!dateVal) return "";
    if (typeof dateVal === "string") {
      if (dateVal.includes("T")) return dateVal.split("T")[0];
      if (dateVal.match(/^\d{4}-\d{2}-\d{2}$/)) return dateVal;
      if (dateVal.includes("/")) {
        const parts = dateVal.split("/");
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
        }
      }
    }
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) return d.toISOString().split("T")[0];
    } catch (e) {}
    return "";
  };

  // Consignor parties list (Parties with PAID LRs or registered as Consignor)
  const consignorPartiesList = Array.from(
    new Set([
      ...parties
        .filter((p) => !p.selectType || p.selectType === "CONSIGNOR" || p.selectType === "BOTH")
        .map((p) => p.partyName?.trim()),
      ...lrEntries
        .filter((lr) => {
          const status = (lr.toPayOrPaid || "TBB").trim().toUpperCase().replace("-", " ");
          if (status === "TO PAY" || status === "TOPAY") return false;
          return status === "PAID" || lr.debitAmountTo?.toUpperCase() === "CONSIGNOR";
        })
        .map((lr) => lr.consignorName?.trim()),
    ])
  )
    .filter((p) => p && p !== "-")
    .sort();

  // Consignee parties list (Parties with TBB LRs or registered as Consignee)
  const consigneePartiesList = Array.from(
    new Set([
      ...parties
        .filter((p) => !p.selectType || p.selectType === "CONSIGNEE" || p.selectType === "CONSIGNE" || p.selectType === "BOTH")
        .map((p) => p.partyName?.trim()),
      ...lrEntries
        .filter((lr) => {
          const status = (lr.toPayOrPaid || "TBB").trim().toUpperCase().replace("-", " ");
          if (status === "TO PAY" || status === "TOPAY") return false;
          return status === "TBB" || lr.debitAmountTo?.toUpperCase() === "CONSIGNEE";
        })
        .map((lr) => lr.consigneeName?.trim()),
    ])
  )
    .filter((p) => p && p !== "-")
    .sort();

  // Filtered LRs for Party Role
  const partyLrEntries = isParty
    ? lrEntries.filter((lr) => {
        const lrFY = getLRFYLabel(lr);
        if (!matchFY(lrFY, selectedFY)) return false;

        if (fromDate || toDate) {
          const lrIso = getIsoDateString(getLRDate(lr));
          if (fromDate && lrIso && lrIso < fromDate) return false;
          if (toDate && lrIso && lrIso > toDate) return false;
        }

        const pName = user?.partyName?.toLowerCase()?.trim();
        const status = (lr.toPayOrPaid || "TBB").trim().toUpperCase().replace("-", " ");

        // TO PAY has 0 accounting entries!
        if (status === "TO PAY" || status === "TOPAY") return false;

        const consignor = lr.consignorName?.toLowerCase()?.trim();
        const consignee = lr.consigneeName?.toLowerCase()?.trim();

        if (status === "PAID") {
          return consignor === pName;
        }
        if (status === "TBB") {
          return consignee === pName;
        }

        return consignor === pName || consignee === pName;
      })
    : [];

  // Metrics for Party Role
  const partyTotalBilled = partyLrEntries.reduce((sum, item) => sum + getLRFreightAmount(item), 0);
  const partyTotalPaid = partyLrEntries.reduce((sum, item) => {
    if (item.partyPaymentStatus === "PAID") return sum + getLRFreightAmount(item);
    return sum + (Number(item.partyPaidAmount) || 0);
  }, 0);
  const partyTotalRemaining = partyTotalBilled - partyTotalPaid;

  // 1. Base Filtered LRs for Owner View (Filtered by FY, Date Range, Search Query, Active Tab selection)
  const baseOwnerEntries = lrEntries.filter((lr) => {
    // Financial Year filter
    const lrFY = getLRFYLabel(lr);
    if (!matchFY(lrFY, selectedFY)) return false;

    // Date Range Filter (From Date -> To Date)
    if (fromDate || toDate) {
      const lrDateRaw = getLRDate(lr);
      const lrIso = getIsoDateString(lrDateRaw);
      if (fromDate && lrIso && lrIso < fromDate) return false;
      if (toDate && lrIso && lrIso > toDate) return false;
    }

    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchLr = lr.lrNumber?.toLowerCase().includes(q);
      const matchTruck = lr.truckNo?.toLowerCase().includes(q);
      const matchParty = getPartyName(lr).toLowerCase().includes(q);
      const matchConsignor = lr.consignorName?.toLowerCase().includes(q);
      const matchConsignee = lr.consigneeName?.toLowerCase().includes(q);
      if (!matchLr && !matchTruck && !matchParty && !matchConsignor && !matchConsignee) return false;
    }

    const payStatus = (lr.toPayOrPaid || "TBB").trim().toUpperCase().replace("-", " ");
    const debitOverride = lr.debitAmountTo?.trim()?.toUpperCase();

    // TO PAY has 0 accounting entries across all tabs!
    if (payStatus === "TO PAY" || payStatus === "TOPAY") return false;

    // Active Tab filtering: "ALL", "CONSIGNOR", "CONSIGNEE", "TRUCK"
    if (activeTab === "CONSIGNOR") {
      // Rule: PAID LRs post to Consignor (or debitAmountTo === CONSIGNOR override)
      if (payStatus !== "PAID" && debitOverride !== "CONSIGNOR") return false;
      if (!lr.consignorName) return false;
      if (selectedPartyName !== "ALL" && lr.consignorName?.trim() !== selectedPartyName) return false;
    } else if (activeTab === "CONSIGNEE") {
      // Rule: TBB LRs post to Consignee (or debitAmountTo === CONSIGNEE override)
      if (payStatus !== "TBB" && debitOverride !== "CONSIGNEE") return false;
      if (!lr.consigneeName) return false;
      if (selectedPartyName !== "ALL" && lr.consigneeName?.trim() !== selectedPartyName) return false;
    } else if (activeTab === "ALL" || activeTab === "PARTY") {
      if (selectedPartyName !== "ALL") {
        const partyMatch =
          getPartyName(lr) === selectedPartyName ||
          (payStatus === "PAID" && lr.consignorName?.trim() === selectedPartyName) ||
          (payStatus === "TBB" && lr.consigneeName?.trim() === selectedPartyName);
        if (!partyMatch) return false;
      }
    } else if (activeTab === "TRUCK") {
      if (selectedTruckNo !== "ALL") {
        if (lr.truckNo?.trim()?.toUpperCase() !== selectedTruckNo) return false;
      }
    }

    return true;
  });

  // 2. Owner View Top Metrics (Calculated for selected FY & active tab)
  const ownerTotalBilled = baseOwnerEntries.reduce(
    (sum, item) => sum + getLRFreightAmount(item),
    0
  );
  const ownerTotalPartyReceived = baseOwnerEntries.reduce((sum, item) => {
    if (item.partyPaymentStatus === "PAID") return sum + getLRFreightAmount(item);
    return sum + (Number(item.partyPaidAmount) || 0);
  }, 0);
  const ownerPartyPending = ownerTotalBilled - ownerTotalPartyReceived;

  const ownerTotalTruckPayable = baseOwnerEntries.reduce(
    (sum, item) => sum + getLRFreightAmount(item),
    0
  );
  const ownerTotalTruckPaid = baseOwnerEntries.reduce((sum, item) => {
    if (item.truckPaymentStatus === "PAID") return sum + getLRFreightAmount(item);
    return sum + (Number(item.truckPaidAmount) || 0);
  }, 0);
  const ownerTruckPending = ownerTotalTruckPayable - ownerTotalTruckPaid;

  // Status button badges counts
  const ownerAllCount = baseOwnerEntries.length;
  const ownerPaidCount = baseOwnerEntries.filter((lr) =>
    activeTab !== "TRUCK" ? lr.partyPaymentStatus === "PAID" : lr.truckPaymentStatus === "PAID"
  ).length;
  const ownerUnpaidCount = ownerAllCount - ownerPaidCount;

  // 3. Final Table Filtered LRs (Applies PAID / UNPAID status filter for list view)
  const filteredOwnerEntries = baseOwnerEntries.filter((lr) => {
    if (activeTab !== "TRUCK") {
      if (statusFilter === "PAID" && lr.partyPaymentStatus !== "PAID") return false;
      if (statusFilter === "UNPAID" && lr.partyPaymentStatus === "PAID") return false;
    } else if (activeTab === "TRUCK") {
      if (statusFilter === "PAID" && lr.truckPaymentStatus !== "PAID") return false;
      if (statusFilter === "UNPAID" && lr.truckPaymentStatus === "PAID") return false;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-slate-300 text-sm font-semibold">Loading Accounting Records...</span>
        </div>
      </div>
    );
  }

  if (selectedLrForDoc) {
    return (
      <LRPrintDocument
        lrData={selectedLrForDoc}
        autoAction={lrDocAutoAction}
        onClose={() => {
          setSelectedLrForDoc(null);
          setLrDocAutoAction(null);
        }}
      />
    );
  }

  // ----------------------------------------------------
  // 1. PARTY ROLE VIEW (COMPACT PARTY PORTAL)
  // ----------------------------------------------------
  if (isParty) {
    if (showPrintModal) {
      return (
        <PartyPortalStatementDocument
          partyName={user?.partyName || "Party Account Statement"}
          selectedFY={selectedFY}
          partyTotalBilled={partyTotalBilled}
          partyTotalPaid={partyTotalPaid}
          partyTotalRemaining={partyTotalRemaining}
          records={partyLrEntries}
          autoAction={activeAutoAction}
          onClose={() => {
            setShowPrintModal(false);
            setActiveAutoAction(null);
          }}
        />
      );
    }

    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 font-sans space-y-4">
        
        {/* Compact Welcome Banner */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 px-4 shadow flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white leading-tight">
                  {user?.partyName || "Party Account Statement"}
                </h1>
                <span className="px-2 py-0.5 bg-amber-500/15 text-amber-400 rounded text-[10px] font-bold uppercase tracking-wider">
                  Party Portal
                </span>
              </div>
              <p className="text-slate-400 text-xs">
                Account Statement & Payment Breakdown
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Financial Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-slate-300 uppercase">Year:</span>
              <select
                value={selectedFY}
                onChange={(e) => setSelectedFY(e.target.value)}
                className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none cursor-pointer"
              >
                <option value="ALL" className="bg-slate-900 text-white">All Years</option>
                {availableFYs.map((fy) => (
                  <option key={fy} value={fy} className="bg-slate-900 text-white">
                    FY {fy}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setActiveAutoAction("pdf");
                setShowPrintModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Statement PDF</span>
            </button>

            <button
              onClick={() => {
                setActiveAutoAction("print");
                setShowPrintModal(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black transition cursor-pointer shadow"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print A4</span>
            </button>

            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* 3 Compact Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Total Billed */}
          <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3.5 px-4 shadow">
            <div className="flex justify-between items-center text-slate-400 text-xs font-semibold mb-1">
              <span>Total Freight Billed</span>
              <FileSpreadsheet className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-extrabold text-white font-mono">
              ₹ {partyTotalBilled.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Total {partyLrEntries.length} LR Entries
            </p>
          </div>

          {/* Total Paid */}
          <div className="bg-slate-800/90 border border-emerald-500/30 rounded-xl p-3.5 px-4 shadow bg-emerald-950/10">
            <div className="flex justify-between items-center text-emerald-400 text-xs font-semibold mb-1">
              <span>Total Paid Amount</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-extrabold text-emerald-400 font-mono">
              ₹ {partyTotalPaid.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-emerald-300/70 mt-1">
              Received Amount
            </p>
          </div>

          {/* Pending Balance */}
          <div className="bg-slate-800/90 border border-amber-500/30 rounded-xl p-3.5 px-4 shadow bg-amber-950/10">
            <div className="flex justify-between items-center text-amber-400 text-xs font-semibold mb-1">
              <span>Pending Balance</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-extrabold text-amber-400 font-mono">
              ₹ {partyTotalRemaining.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-amber-300/70 mt-1">
              Outstanding Balance
            </p>
          </div>
        </div>

        {/* Compact Party LR Table */}
        <div className="bg-slate-800 border border-slate-700/80 rounded-xl shadow-lg overflow-hidden">
          <div className="p-3 px-4 border-b border-slate-700/80 flex justify-between items-center">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>LR Records & Statements</span>
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveAutoAction("pdf");
                  setShowPrintModal(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded transition shadow cursor-pointer"
              >
                <Download size={13} /> Export Statement PDF
              </button>
              <span className="text-[11px] font-mono bg-slate-700 text-slate-300 px-2.5 py-0.5 rounded-full">
                {partyLrEntries.length} Records
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700/80">
                <tr>
                  <th className="py-2.5 px-3 font-bold">LR No.</th>
                  <th className="py-2.5 px-3 font-bold">Date</th>
                  <th className="py-2.5 px-3 font-bold">Truck No.</th>
                  <th className="py-2.5 px-3 font-bold">From -&gt; To</th>
                  <th className="py-2.5 px-3 font-bold">Goods Description</th>
                  <th className="py-2.5 px-3 font-bold text-right">Net Total (₹)</th>
                  <th className="py-2.5 px-3 font-bold text-center">Payment Status</th>
                  <th className="py-2.5 px-3 font-bold text-center">Download LR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {partyLrEntries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                      No LR records found.
                    </td>
                  </tr>
                ) : (
                  partyLrEntries.map((lr) => {
                    const isPaid = lr.partyPaymentStatus === "PAID";
                    return (
                      <tr key={lr.id} className="hover:bg-slate-700/40 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                          {lr.lrNumber || "-"}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                          {lr.dateTime || "-"}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-white">
                          {lr.truckNo || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300">
                          {lr.fromPlace} &rarr; {lr.toPlace}
                        </td>
                        <td className="py-2.5 px-3 text-slate-300 truncate max-w-[180px]">
                          {lr.descriptionOfGoods || lr.bundles || "-"}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white text-sm">
                          ₹ {(Number(lr.netTotalAmount) || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {isPaid ? (
                            <div className="flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>PAID</span>
                              </span>
                              {lr.partyPaidDate && (
                                <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
                                  📅 {lr.partyPaidDate}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              <Clock className="w-3 h-3" />
                              <span>PENDING</span>
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedLrForDoc(lr);
                              setLrDocAutoAction("pdf");
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[11px] font-black transition cursor-pointer shadow"
                            title="Download LR PDF"
                          >
                            <Download className="w-3 h-3" />
                            <span>Download LR</span>
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

  // ----------------------------------------------------
  // 2. OWNER VIEW (FULL ACCOUNTING LEDGER & TOGGLES)
  // ----------------------------------------------------
  return (
    <>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 font-sans space-y-4 print:hidden">
      
      {/* Main 3 Tabs: CONSIGNOR, CONSIGNEE, TRUCK & Search */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab("CONSIGNOR");
              setStatusFilter("ALL");
              setSelectedPartyName("ALL");
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
              activeTab === "CONSIGNOR"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>1. Consignor (Shipper)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("CONSIGNEE");
              setStatusFilter("ALL");
              setSelectedPartyName("ALL");
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
              activeTab === "CONSIGNEE"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>2. Consignee (Receiver)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("TRUCK");
              setStatusFilter("ALL");
              setSelectedTruckNo("ALL");
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer whitespace-nowrap ${
              activeTab === "TRUCK"
                ? "bg-amber-500 text-slate-950 shadow-md font-black"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>3. Truck Accounting</span>
          </button>
        </div>

        {/* Global Search & Refresh */}
        <div className="flex items-center gap-2">
          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search LR, Truck, Party..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            onClick={fetchData}
            title="Refresh Data"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg transition cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Overview Metric Cards based on Tab */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {activeTab !== "TRUCK" ? (
          <>
            {/* Total Billed to Party */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5 px-4 shadow">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex justify-between">
                <span>Party Total Billed</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-xl font-extrabold text-white font-mono">
                ₹ {ownerTotalBilled.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Total Freight Billed
              </p>
            </div>

            {/* Total Collected from Party */}
            <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-3.5 px-4 shadow bg-emerald-950/10">
              <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 flex justify-between">
                <span>Party Amount Paid</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">
                ₹ {ownerTotalPartyReceived.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-emerald-300/70 mt-1">
                Collected Amount
              </p>
            </div>

            {/* Remaining Receivable from Party */}
            <div className="bg-slate-800 border border-amber-500/30 rounded-xl p-3.5 px-4 shadow bg-amber-950/10">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1 flex justify-between">
                <span>Party Pending Balance</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-extrabold text-amber-400 font-mono">
                ₹ {ownerPartyPending.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-amber-300/70 mt-1">
                Outstanding Balance
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Total Truck Payable */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-3.5 px-4 shadow">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex justify-between">
                <span>Truck Total Freight</span>
                <Truck className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-xl font-extrabold text-white font-mono">
                ₹ {ownerTotalTruckPayable.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Total Truck Freight Payable
              </p>
            </div>

            {/* Total Paid to Truck */}
            <div className="bg-slate-800 border border-emerald-500/30 rounded-xl p-3.5 px-4 shadow bg-emerald-950/10">
              <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 flex justify-between">
                <span>Truck Paid Amount</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-xl font-extrabold text-emerald-400 font-mono">
                ₹ {ownerTotalTruckPaid.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-emerald-300/70 mt-1">
                Paid Freight Amount
              </p>
            </div>

            {/* Remaining Payable to Truck */}
            <div className="bg-slate-800 border border-amber-500/30 rounded-xl p-3.5 px-4 shadow bg-amber-950/10">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1 flex justify-between">
                <span>Truck Pending Payable</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-xl font-extrabold text-amber-400 font-mono">
                ₹ {ownerTruckPending.toLocaleString("en-IN")}
              </div>
              <p className="text-[11px] text-amber-300/70 mt-1">
                Outstanding Freight to Pay
              </p>
            </div>
          </>
        )}
      </div>

      {/* Filter Bar with Date Range Selector */}
      <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-3">
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Financial Year (FY) Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-slate-300 uppercase">Year / FY:</span>
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-xs font-mono font-bold rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="ALL">All Years</option>
              {availableFYs.map((fy) => (
                <option key={fy} value={fy}>
                  FY {fy}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Selection (From Date -> To Date) */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-xs font-bold text-amber-400 uppercase">Date Range:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-slate-800 text-white font-bold px-2 py-0.5 rounded border border-slate-600 text-xs focus:outline-none"
            />
            <span className="text-slate-400 text-xs font-bold">to</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-slate-800 text-white font-bold px-2 py-0.5 rounded border border-slate-600 text-xs focus:outline-none"
            />
            {(fromDate || toDate) && (
              <button
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                className="text-rose-400 hover:text-rose-300 font-bold ml-1 text-xs underline"
                title="Clear Date Filter"
              >
                Clear
              </button>
            )}
          </div>

          {/* Dropdown Filter for Party Name or Truck No */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs font-bold text-slate-300 uppercase">Filter:</span>

            {activeTab === "CONSIGNOR" && (
              <select
                value={selectedPartyName}
                onChange={(e) => setSelectedPartyName(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="ALL">All Consignors</option>
                {consignorPartiesList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}

            {activeTab === "CONSIGNEE" && (
              <select
                value={selectedPartyName}
                onChange={(e) => setSelectedPartyName(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                <option value="ALL">All Consignees</option>
                {consigneePartiesList.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}

            {activeTab === "TRUCK" && (
              <select
                value={selectedTruckNo}
                onChange={(e) => setSelectedTruckNo(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
              >
                <option value="ALL">All Trucks</option>
                {uniqueTrucks.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Status Filter & Print Statement Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                statusFilter === "ALL"
                  ? "bg-amber-500 text-slate-950 font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All ({ownerAllCount})
            </button>
            <button
              onClick={() => setStatusFilter("PAID")}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                statusFilter === "PAID"
                  ? "bg-emerald-500 text-slate-950 font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Paid Only ({ownerPaidCount})
            </button>
            <button
              onClick={() => setStatusFilter("UNPAID")}
              className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                statusFilter === "UNPAID"
                  ? "bg-amber-500 text-slate-950 font-extrabold"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Pending Only ({ownerUnpaidCount})
            </button>
          </div>

          <button
            onClick={() => setShowOwnerStatementModal(true)}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 rounded-lg text-xs font-black shadow transition cursor-pointer"
            title="Print A4 Statement of current filtered records"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Statement (A4)</span>
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-2.5 px-3 font-bold">LR No.</th>
                <th className="py-2.5 px-3 font-bold">Date</th>
                <th className="py-2.5 px-3 font-bold">Party Name</th>
                <th className="py-2.5 px-3 font-bold">Truck No.</th>
                <th className="py-2.5 px-3 font-bold text-right">Net Total (₹)</th>
                {activeTab !== "TRUCK" ? (
                  <th className="py-2.5 px-3 font-bold text-center">Party Payment Status</th>
                ) : (
                  <th className="py-2.5 px-3 font-bold text-center">Truck Payment Status</th>
                )}
                <th className="py-2.5 px-3 font-bold text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700/60 font-medium">
              {filteredOwnerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredOwnerEntries.map((lr) => {
                  const partyName = getPartyName(lr);
                  const partyPaid = lr.partyPaymentStatus === "PAID";
                  const truckPaid = lr.truckPaymentStatus === "PAID";
                  const amount = getLRFreightAmount(lr);

                  return (
                    <tr key={lr.id} className="hover:bg-slate-700/40 transition">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                        {lr.lrNumber || "-"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-slate-300">
                        {lr.dateTime || "-"}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-white max-w-[180px] truncate">
                        {partyName}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-white">
                        {lr.truckNo || "-"}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white text-sm">
                        ₹ {amount.toLocaleString("en-IN")}
                      </td>

                      {/* Status Column */}
                      <td className="py-2.5 px-3 text-center">
                        {activeTab !== "TRUCK" ? (
                          partyPaid ? (
                            <div className="flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>PAID</span>
                              </span>
                              {lr.partyPaidDate && (
                                <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
                                  📅 {lr.partyPaidDate}
                                </span>
                              )}
                              {lr.partyChequeNo && (
                                <span className="text-[10px] text-slate-300 font-mono mt-0.5">
                                  💳 {lr.partyChequeNo}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              <Clock className="w-3 h-3" />
                              <span>PENDING</span>
                            </span>
                          )
                        ) : truckPaid ? (
                          <div className="flex flex-col items-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>PAID</span>
                            </span>
                            {lr.truckPaidDate && (
                              <span className="text-[10px] text-emerald-400/80 font-mono mt-0.5">
                                📅 {lr.truckPaidDate}
                              </span>
                            )}
                            {lr.truckChequeNo && (
                              <span className="text-[10px] text-slate-300 font-mono mt-0.5">
                                💳 {lr.truckChequeNo}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            <Clock className="w-3 h-3" />
                            <span>PENDING</span>
                          </span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="py-2.5 px-3 text-center">
                        {updatingId === lr.id ? (
                          <span className="text-[10px] text-amber-400 animate-pulse">Updating...</span>
                        ) : activeTab !== "TRUCK" ? (
                          partyPaid ? (
                            <span className="text-[11px] font-bold text-emerald-400 opacity-80">
                              ✓ Completed
                            </span>
                          ) : (
                            <button
                              onClick={() => openPaymentModal(lr.id, lr.lrNumber, "PARTY", amount, partyName, lr.partyChequeNo)}
                              className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow transition cursor-pointer"
                            >
                              Mark PAID
                            </button>
                          )
                        ) : truckPaid ? (
                          <span className="text-[11px] font-bold text-emerald-400 opacity-80">
                            ✓ Completed
                          </span>
                        ) : (
                          <button
                            onClick={() => openPaymentModal(lr.id, lr.lrNumber, "TRUCK", amount, partyName, lr.truckChequeNo)}
                            className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-bold shadow transition cursor-pointer"
                          >
                            Mark PAID
                          </button>
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

      {/* Custom Payment Confirmation & Date Entry Modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-800 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 relative">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Confirm {paymentModal.type === "PARTY" ? "Party" : "Truck"} Payment</span>
              </div>
              <button
                onClick={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Info Summary Box */}
            <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-medium">LR Number:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">LR #{paymentModal.lrNumber || "-"}</span>
              </div>
              {paymentModal.partyName && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium">Party Name:</span>
                  <span className="font-semibold text-white truncate max-w-[200px]">{paymentModal.partyName}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-800">
                <span className="text-slate-400 font-medium">Payment Amount:</span>
                <span className="font-mono font-extrabold text-emerald-400 text-base">
                  ₹ {Number(paymentModal.amount || 0).toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Date Input with Calendar Picker */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Payment Paid Date (ચુકવણીની તારીખ)</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={paymentModal.paymentDate}
                  onChange={(e) => setPaymentModal((prev) => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 [color-scheme:dark] cursor-pointer"
                />
              </div>
            </div>

            {/* Optional Cheque / Ref No Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Cheque No. / Ref No. (Optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. CHQ123456 / UTR No. (Optional)"
                value={paymentModal.chequeNo}
                onChange={(e) => setPaymentModal((prev) => ({ ...prev, chequeNo: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-sm px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500 placeholder:text-slate-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-700/60">
              <button
                type="button"
                onClick={() => setPaymentModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark PAID</span>
              </button>
            </div>

          </div>
        </div>
      )}

      </div>

      {/* Accounting Statement A4 Print Modal */}
      {showOwnerStatementModal && (
        <AccountingStatementDocument
          activeTab={activeTab}
          selectedFY={selectedFY}
          selectedPartyName={selectedPartyName}
          selectedTruckNo={selectedTruckNo}
          statusFilter={statusFilter}
          records={filteredOwnerEntries}
          onClose={() => setShowOwnerStatementModal(false)}
        />
      )}
    </>
  );
}
