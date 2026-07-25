import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
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
} from "lucide-react";

export default function AccountingPage() {
  const { user, isOwner, isParty } = useAuth();

  const [lrEntries, setLrEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Owner View state
  const [activeTab, setActiveTab] = useState("PARTY"); // "PARTY" or "TRUCK"
  const [selectedPartyName, setSelectedPartyName] = useState("ALL");
  const [selectedTruckNo, setSelectedTruckNo] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, PAID, UNPAID
  const [searchQuery, setSearchQuery] = useState("");

  // Action modal / quick edit
  const [updatingId, setUpdatingId] = useState(null);

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
      console.error("Error fetching accounting data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update Payment Status Helper
  const handleUpdatePayment = async (lrId, type, newStatus, amount) => {
    setUpdatingId(lrId);
    try {
      const payload = {};
      const today = new Date().toISOString().split("T")[0];

      if (type === "PARTY") {
        payload.partyPaymentStatus = newStatus;
        payload.partyPaidAmount = newStatus === "PAID" ? amount : 0;
        payload.partyPaidDate = newStatus === "PAID" ? today : "";
      } else if (type === "TRUCK") {
        payload.truckPaymentStatus = newStatus;
        payload.truckPaidAmount = newStatus === "PAID" ? amount : 0;
        payload.truckPaidDate = newStatus === "PAID" ? today : "";
      }

      const res = await fetch(`http://localhost:8002/api/lr-entries/${lrId}/payment-status`, {
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

  // Extract unique Truck numbers
  const uniqueTrucks = Array.from(
    new Set(lrEntries.map((lr) => lr.truckNo?.trim()?.toUpperCase()).filter(Boolean))
  ).sort();

  // Extract unique Parties from LRs & Party master
  const uniqueParties = Array.from(
    new Set([
      ...parties.map((p) => p.partyName?.trim()),
      ...lrEntries.map((lr) => lr.debitAmountTo?.trim() || lr.consignorName?.trim() || lr.consigneeName?.trim()),
    ]).keys()
  ).filter(Boolean).sort();

  // Filtered LRs for Party Role
  const partyLrEntries = isParty
    ? lrEntries.filter((lr) => {
        const pName = user?.partyName?.toLowerCase()?.trim();
        const debit = lr.debitAmountTo?.toLowerCase()?.trim();
        const consignor = lr.consignorName?.toLowerCase()?.trim();
        const consignee = lr.consigneeName?.toLowerCase()?.trim();
        return (debit && debit === pName) || consignor === pName || consignee === pName;
      })
    : [];

  // Metrics for Party Role
  const partyTotalBilled = partyLrEntries.reduce((sum, item) => sum + (Number(item.netTotalAmount) || 0), 0);
  const partyTotalPaid = partyLrEntries.reduce((sum, item) => {
    if (item.partyPaymentStatus === "PAID") return sum + (Number(item.netTotalAmount) || 0);
    return sum + (Number(item.partyPaidAmount) || 0);
  }, 0);
  const partyTotalRemaining = partyTotalBilled - partyTotalPaid;

  // Filtered LRs for Owner View
  const filteredOwnerEntries = lrEntries.filter((lr) => {
    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchLr = lr.lrNumber?.toLowerCase().includes(q);
      const matchTruck = lr.truckNo?.toLowerCase().includes(q);
      const matchParty = (lr.debitAmountTo || lr.consignorName || lr.consigneeName || "")
        .toLowerCase()
        .includes(q);
      if (!matchLr && !matchTruck && !matchParty) return false;
    }

    // Party Tab filtering
    if (activeTab === "PARTY") {
      if (selectedPartyName !== "ALL") {
        const partyMatch =
          lr.debitAmountTo?.trim() === selectedPartyName ||
          lr.consignorName?.trim() === selectedPartyName ||
          lr.consigneeName?.trim() === selectedPartyName;
        if (!partyMatch) return false;
      }
      if (statusFilter === "PAID" && lr.partyPaymentStatus !== "PAID") return false;
      if (statusFilter === "UNPAID" && lr.partyPaymentStatus === "PAID") return false;
    }

    // Truck Tab filtering
    if (activeTab === "TRUCK") {
      if (selectedTruckNo !== "ALL") {
        if (lr.truckNo?.trim()?.toUpperCase() !== selectedTruckNo) return false;
      }
      if (statusFilter === "PAID" && lr.truckPaymentStatus !== "PAID") return false;
      if (statusFilter === "UNPAID" && lr.truckPaymentStatus === "PAID") return false;
    }

    return true;
  });

  // Owner View Metrics
  const ownerTotalBilled = filteredOwnerEntries.reduce(
    (sum, item) => sum + (Number(item.netTotalAmount) || 0),
    0
  );
  const ownerTotalPartyReceived = filteredOwnerEntries.reduce((sum, item) => {
    if (item.partyPaymentStatus === "PAID") return sum + (Number(item.netTotalAmount) || 0);
    return sum + (Number(item.partyPaidAmount) || 0);
  }, 0);
  const ownerPartyPending = ownerTotalBilled - ownerTotalPartyReceived;

  const ownerTotalTruckPayable = filteredOwnerEntries.reduce(
    (sum, item) => sum + (Number(item.netTotalAmount) || 0),
    0
  );
  const ownerTotalTruckPaid = filteredOwnerEntries.reduce((sum, item) => {
    if (item.truckPaymentStatus === "PAID") return sum + (Number(item.netTotalAmount) || 0);
    return sum + (Number(item.truckPaidAmount) || 0);
  }, 0);
  const ownerTruckPending = ownerTotalTruckPayable - ownerTotalTruckPaid;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
          <span className="text-slate-300 font-semibold">Loading Accounting Records...</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 1. PARTY ROLE VIEW (PARTY PORTAL)
  // ----------------------------------------------------
  if (isParty) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans space-y-8">
        
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>Party Account Portal</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              {user?.partyName || "Party Account Statement"}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Account Statement & Payment Breakdown
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-sm font-semibold transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Billed */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-6 shadow-lg">
            <div className="flex justify-between items-center text-slate-400 text-sm font-semibold mb-2">
              <span>Total Freight Billed</span>
              <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-white font-mono">
              ₹ {partyTotalBilled.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Total {partyLrEntries.length} LR Entries
            </p>
          </div>

          {/* Total Paid */}
          <div className="bg-slate-800/90 border border-emerald-500/30 rounded-2xl p-6 shadow-lg bg-emerald-950/10">
            <div className="flex justify-between items-center text-emerald-400 text-sm font-semibold mb-2">
              <span>Total Paid Amount</span>
              <div className="p-2.5 bg-emerald-500/20 text-emerald-400 rounded-xl">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-emerald-400 font-mono">
              ₹ {partyTotalPaid.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-emerald-300/70 mt-2">
              Received Amount
            </p>
          </div>

          {/* Pending Balance */}
          <div className="bg-slate-800/90 border border-amber-500/30 rounded-2xl p-6 shadow-lg bg-amber-950/10">
            <div className="flex justify-between items-center text-amber-400 text-sm font-semibold mb-2">
              <span>Pending Balance</span>
              <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-amber-400 font-mono">
              ₹ {partyTotalRemaining.toLocaleString("en-IN")}
            </div>
            <p className="text-xs text-amber-300/70 mt-2">
              Outstanding Balance
            </p>
          </div>
        </div>

        {/* Detailed Party LR Table */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 border-b border-slate-700 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              <span>LR Records & Statements</span>
            </h2>
            <span className="text-xs font-mono bg-slate-700 text-slate-300 px-3 py-1 rounded-full">
              {partyLrEntries.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="py-3.5 px-4 font-bold">LR No.</th>
                  <th className="py-3.5 px-4 font-bold">Date</th>
                  <th className="py-3.5 px-4 font-bold">Truck No.</th>
                  <th className="py-3.5 px-4 font-bold">From -&gt; To</th>
                  <th className="py-3.5 px-4 font-bold">Goods Description</th>
                  <th className="py-3.5 px-4 font-bold text-right">Net Total (₹)</th>
                  <th className="py-3.5 px-4 font-bold text-center">Payment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60 font-medium">
                {partyLrEntries.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No LR records found.
                    </td>
                  </tr>
                ) : (
                  partyLrEntries.map((lr) => {
                    const isPaid = lr.partyPaymentStatus === "PAID";
                    return (
                      <tr key={lr.id} className="hover:bg-slate-700/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                          {lr.lrNumber || "-"}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                          {lr.dateTime || "-"}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-white">
                          {lr.truckNo || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300">
                          {lr.fromPlace} &rarr; {lr.toPlace}
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 truncate max-w-[200px]">
                          {lr.descriptionOfGoods || lr.bundles || "-"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-base">
                          ₹ {(Number(lr.netTotalAmount) || 0).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>PAID</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              <Clock className="w-3.5 h-3.5" />
                              <span>PENDING</span>
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

      </div>
    );
  }

  // ----------------------------------------------------
  // 2. OWNER VIEW (FULL ACCOUNTING LEDGER & TOGGLES)
  // ----------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-sans space-y-8">
      
      {/* Main Tabs (Party Ledger vs Truck Ledger) */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
        <div className="flex bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          <button
            onClick={() => {
              setActiveTab("PARTY");
              setStatusFilter("ALL");
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer ${
              activeTab === "PARTY"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>1. Party Accounting</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("TRUCK");
              setStatusFilter("ALL");
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition cursor-pointer ${
              activeTab === "TRUCK"
                ? "bg-amber-500 text-slate-950 shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>2. Truck Accounting</span>
          </button>
        </div>

        {/* Global Search */}
        <div className="relative max-w-xs w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search LR, Truck, Party..."
            className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Overview Metric Cards based on Tab */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {activeTab === "PARTY" ? (
          <>
            {/* Total Billed to Party */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex justify-between">
                <span>Party Total Billed</span>
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                ₹ {ownerTotalBilled.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Total Freight Billed
              </p>
            </div>

            {/* Total Collected from Party */}
            <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-6 shadow-lg bg-emerald-950/10">
              <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 flex justify-between">
                <span>Party Amount Paid</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                ₹ {ownerTotalPartyReceived.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-emerald-300/70 mt-2">
                Collected Amount
              </p>
            </div>

            {/* Remaining Receivable from Party */}
            <div className="bg-slate-800 border border-amber-500/30 rounded-2xl p-6 shadow-lg bg-amber-950/10">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 flex justify-between">
                <span>Party Pending Balance</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-amber-400 font-mono">
                ₹ {ownerPartyPending.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-amber-300/70 mt-2">
                Outstanding Balance
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Total Truck Payable */}
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-lg">
              <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex justify-between">
                <span>Truck Total Freight</span>
                <Truck className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-extrabold text-white font-mono">
                ₹ {ownerTotalTruckPayable.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Total Truck Freight Payable
              </p>
            </div>

            {/* Total Paid to Truck */}
            <div className="bg-slate-800 border border-emerald-500/30 rounded-2xl p-6 shadow-lg bg-emerald-950/10">
              <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 flex justify-between">
                <span>Truck Paid Amount</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 font-mono">
                ₹ {ownerTotalTruckPaid.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-emerald-300/70 mt-2">
                Paid Freight Amount
              </p>
            </div>

            {/* Remaining Payable to Truck */}
            <div className="bg-slate-800 border border-amber-500/30 rounded-2xl p-6 shadow-lg bg-amber-950/10">
              <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2 flex justify-between">
                <span>Truck Pending Payable</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-extrabold text-amber-400 font-mono">
                ₹ {ownerTruckPending.toLocaleString("en-IN")}
              </div>
              <p className="text-xs text-amber-300/70 mt-2">
                Outstanding Freight to Pay
              </p>
            </div>
          </>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-wrap items-center justify-between gap-4">
        
        {/* Dropdown Filter for Party Name or Truck No */}
        <div className="flex items-center gap-3">
          <Filter className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-bold text-slate-300 uppercase">Filter:</span>

          {activeTab === "PARTY" ? (
            <select
              value={selectedPartyName}
              onChange={(e) => setSelectedPartyName(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            >
              <option value="ALL">All Parties</option>
              {uniqueParties.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          ) : (
            <select
              value={selectedTruckNo}
              onChange={(e) => setSelectedTruckNo(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white text-sm rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
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

        {/* Status Filter buttons (ALL, PAID, UNPAID) */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1 rounded text-xs font-bold transition ${
              statusFilter === "ALL"
                ? "bg-amber-500 text-slate-950 font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            All ({filteredOwnerEntries.length})
          </button>
          <button
            onClick={() => setStatusFilter("PAID")}
            className={`px-3 py-1 rounded text-xs font-bold transition ${
              statusFilter === "PAID"
                ? "bg-emerald-500 text-slate-950 font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Paid Only
          </button>
          <button
            onClick={() => setStatusFilter("UNPAID")}
            className={`px-3 py-1 rounded text-xs font-bold transition ${
              statusFilter === "UNPAID"
                ? "bg-amber-500 text-slate-950 font-extrabold"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Pending Only
          </button>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-900/90 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3.5 px-4 font-bold">LR No.</th>
                <th className="py-3.5 px-4 font-bold">Date</th>
                <th className="py-3.5 px-4 font-bold">Party Name</th>
                <th className="py-3.5 px-4 font-bold">Truck No.</th>
                <th className="py-3.5 px-4 font-bold text-right">Net Total (₹)</th>
                {activeTab === "PARTY" ? (
                  <th className="py-3.5 px-4 font-bold text-center">Party Payment Status</th>
                ) : (
                  <th className="py-3.5 px-4 font-bold text-center">Truck Payment Status</th>
                )}
                <th className="py-3.5 px-4 font-bold text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-700/60 font-medium">
              {filteredOwnerEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredOwnerEntries.map((lr) => {
                  const partyName = lr.debitAmountTo || lr.consignorName || lr.consigneeName || "-";
                  const partyPaid = lr.partyPaymentStatus === "PAID";
                  const truckPaid = lr.truckPaymentStatus === "PAID";
                  const amount = Number(lr.netTotalAmount) || 0;

                  return (
                    <tr key={lr.id} className="hover:bg-slate-700/40 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-400">
                        {lr.lrNumber || "-"}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                        {lr.dateTime || "-"}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-white max-w-[200px] truncate">
                        {partyName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-white">
                        {lr.truckNo || "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-white text-base">
                        ₹ {amount.toLocaleString("en-IN")}
                      </td>

                      {/* Status Column */}
                      <td className="py-3.5 px-4 text-center">
                        {activeTab === "PARTY" ? (
                          partyPaid ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>PAID</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                              <Clock className="w-3.5 h-3.5" />
                              <span>PENDING</span>
                            </span>
                          )
                        ) : truckPaid ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>PAID</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                            <Clock className="w-3.5 h-3.5" />
                            <span>PENDING</span>
                          </span>
                        )}
                      </td>

                      {/* Action Column */}
                      <td className="py-3.5 px-4 text-center">
                        {updatingId === lr.id ? (
                          <span className="text-xs text-amber-400 animate-pulse">Updating...</span>
                        ) : activeTab === "PARTY" ? (
                          partyPaid ? (
                            <button
                              onClick={() => handleUpdatePayment(lr.id, "PARTY", "UNPAID", 0)}
                              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                            >
                              Mark Pending
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdatePayment(lr.id, "PARTY", "PAID", amount)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
                            >
                              Mark PAID
                            </button>
                          )
                        ) : truckPaid ? (
                          <button
                            onClick={() => handleUpdatePayment(lr.id, "TRUCK", "UNPAID", 0)}
                            className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            Mark Pending
                          </button>
                        ) : (
                          <button
                            onClick={() => handleUpdatePayment(lr.id, "TRUCK", "PAID", amount)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
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

    </div>
  );
}
