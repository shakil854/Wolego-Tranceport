import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchLREntriesFromDB, fetchPartiesFromDB, sortLRsByNumber, getFinancialYear } from "../utils/storage";
import LRPrintDocument from "../components/LRPrintDocument";
import { Search, Eye, Printer, Download, FileText, Calendar, Filter, ArrowRight } from "lucide-react";

export default function PartyLRRecordsPage() {
  const { user, isOwner } = useAuth();
  const [lrEntries, setLrEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPartyFilter, setSelectedPartyFilter] = useState("ALL");
  const [selectedLR, setSelectedLR] = useState(null);
  const [activeAutoAction, setActiveAutoAction] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const currentFYLabel = getFinancialYear(new Date()).label;
  const [selectedYear, setSelectedYear] = useState(currentFYLabel);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [lrData, partyData] = await Promise.all([
      fetchLREntriesFromDB(),
      fetchPartiesFromDB(),
    ]);

    const lrs = lrData || [];
    setLrEntries(lrs);
    setParties(partyData || []);

    if (lrs.length > 0) {
      const years = Array.from(
        new Set(lrs.map((lr) => (lr.dateTime ? getFinancialYear(lr.dateTime).label : null)).filter(Boolean))
      ).sort((a, b) => b.localeCompare(a));
      if (years.length > 0) {
        setSelectedYear(years[0]);
      }
    }
  };

  // Helper to check if an LR belongs to a specific party name
  const isPartyMatchedInLR = (lr, targetPartyName) => {
    if (!targetPartyName) return false;
    const pName = targetPartyName.trim().toLowerCase();

    // Direct field matches
    if (lr.consignorName && lr.consignorName.trim().toLowerCase() === pName) return true;
    if (lr.consigneeName && lr.consigneeName.trim().toLowerCase() === pName) return true;
    if (lr.partyName && lr.partyName.trim().toLowerCase() === pName) return true;

    // Check multi-consignor arrays / lists (supports up to 4 consignors per LR)
    if (Array.isArray(lr.consignorsList)) {
      const matched = lr.consignorsList.some((c) => {
        const name = typeof c === "string" ? c : c?.partyName;
        return name && name.trim().toLowerCase() === pName;
      });
      if (matched) return true;
    }

    if (Array.isArray(lr.selectedConsignors)) {
      const matched = lr.selectedConsignors.some((c) => {
        const name = typeof c === "string" ? c : c?.partyName;
        return name && name.trim().toLowerCase() === pName;
      });
      if (matched) return true;
    }

    // Check multi-consignee arrays / lists
    if (Array.isArray(lr.consigneesList)) {
      const matched = lr.consigneesList.some((c) => {
        const name = typeof c === "string" ? c : c?.partyName;
        return name && name.trim().toLowerCase() === pName;
      });
      if (matched) return true;
    }

    // Substring fallback
    if (lr.consignorName && lr.consignorName.toLowerCase().includes(pName)) return true;
    if (lr.consigneeName && lr.consigneeName.toLowerCase().includes(pName)) return true;

    return false;
  };

  // Determine active party name for filtering
  const activePartyName = isOwner ? selectedPartyFilter : (user?.partyName || user?.username || "");

  // Filter LRs based on party, FY, and search query
  const filteredLRs = lrEntries.filter((lr) => {
    // 1. Party Filter
    if (!isOwner) {
      if (!isPartyMatchedInLR(lr, activePartyName)) return false;
    } else if (selectedPartyFilter !== "ALL") {
      if (!isPartyMatchedInLR(lr, selectedPartyFilter)) return false;
    }

    // 2. Financial Year Filter
    if (selectedYear !== "ALL") {
      const lrFY = lr.dateTime ? getFinancialYear(lr.dateTime).label : "";
      if (lrFY && lrFY !== selectedYear) return false;
    }

    // 3. Search Query Filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase().trim();
      const matchLrNo = String(lr.lrNumber || "").toLowerCase().includes(q);
      const matchFrom = String(lr.fromPlace || "").toLowerCase().includes(q);
      const matchTo = String(lr.toPlace || "").toLowerCase().includes(q);
      const matchTruck = String(lr.truckNo || "").toLowerCase().includes(q);
      const matchConsignor = String(lr.consignorName || "").toLowerCase().includes(q);
      const matchConsignee = String(lr.consigneeName || "").toLowerCase().includes(q);
      if (!matchLrNo && !matchFrom && !matchTo && !matchTruck && !matchConsignor && !matchConsignee) {
        return false;
      }
    }

    return true;
  });

  const sortedLRs = sortLRsByNumber(filteredLRs, false);

  // Helper to format date display
  const formatDateDisplay = (dateVal) => {
    if (!dateVal) return new Date().toLocaleDateString("en-IN");
    if (typeof dateVal === "string" && dateVal.includes("-")) {
      const parts = dateVal.split("T")[0].split("-");
      if (parts.length === 3) {
        const [y, m, d] = parts;
        const dayStr = String(parseInt(d, 10)).padStart(2, "0");
        const monthStr = String(parseInt(m, 10)).padStart(2, "0");
        return `${dayStr}/${monthStr}/${y}`;
      }
    }
    const dt = new Date(dateVal);
    if (!isNaN(dt.getTime())) {
      const dayStr = String(dt.getDate()).padStart(2, "0");
      const monthStr = String(dt.getMonth() + 1).padStart(2, "0");
      return `${dayStr}/${monthStr}/${dt.getFullYear()}`;
    }
    return new Date().toLocaleDateString("en-IN");
  };

  // Helper to format freight amount
  const getFreightDisplay = (lr) => {
    const amt = parseFloat(lr.netTotalAmount || lr.freightAmount || 0);
    return amt > 0 ? `₹ ${amt.toLocaleString("en-IN")}` : "₹ 0";
  };

  const [selectedCopies, setSelectedCopies] = useState(["CONSIGNOR", "CONSIGNEE"]);
  const [showCopySelectModal, setShowCopySelectModal] = useState(false);
  const [pendingActionType, setPendingActionType] = useState(null);

  const toggleCopySelection = (type) => {
    setSelectedCopies((prev) => {
      if (prev.includes(type)) {
        return prev.length > 1 ? prev.filter((c) => c !== type) : prev;
      } else {
        return [...prev, type];
      }
    });
  };

  // Handlers for View, Print, PDF
  const handleView = (lr) => {
    setSelectedLR(lr);
    setPendingActionType(null);
    setShowCopySelectModal(true);
  };

  const handlePrint = (lr) => {
    setSelectedLR(lr);
    setPendingActionType("print");
    setShowCopySelectModal(true);
  };

  const handlePDF = (lr) => {
    setSelectedLR(lr);
    setPendingActionType("pdf");
    setShowCopySelectModal(true);
  };

  const confirmCopySelectionAndProceed = (actionToExecute) => {
    const act = actionToExecute !== undefined ? actionToExecute : pendingActionType;
    setActiveAutoAction(act);
    setShowCopySelectModal(false);
    setShowPrintModal(true);
  };

  if (showPrintModal && selectedLR) {
    return (
      <LRPrintDocument
        lrData={selectedLR}
        autoAction={activeAutoAction}
        initialCopyType={selectedCopies}
        onClose={() => {
          setShowPrintModal(false);
          setActiveAutoAction(null);
        }}
      />
    );
  }

  return (
    <div className="h-full w-full overflow-y-auto bg-slate-900 p-2 sm:p-4 text-slate-100 flex flex-col font-sans">
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col space-y-2.5 min-h-0">
        
        {/* Top Control Bar */}
        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-lg flex flex-col md:flex-row flex-wrap items-stretch md:items-center justify-between gap-3 shrink-0">
          
          {/* Header Title */}
          <div className="flex items-center gap-3">
            <h1 className="text-base sm:text-lg font-black text-amber-400 flex items-center gap-2 uppercase tracking-wide">
              <FileText className="w-5 h-5 text-amber-400" /> Party L/R Records
            </h1>
            {!isOwner && activePartyName && (
              <span className="bg-sky-950 text-sky-200 border border-sky-600 px-2.5 py-0.5 rounded text-xs font-black uppercase">
                {activePartyName}
              </span>
            )}
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              (Total Records: <span className="text-amber-400 font-mono text-sm">{sortedLRs.length}</span>)
            </span>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            
            {/* Owner Party Selector */}
            {isOwner && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-600 px-2 py-1 rounded text-xs">
                <Filter className="w-3.5 h-3.5 text-amber-400" />
                <select
                  value={selectedPartyFilter}
                  onChange={(e) => setSelectedPartyFilter(e.target.value)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer uppercase text-xs"
                >
                  <option value="ALL" className="bg-slate-900 text-white">ALL PARTIES</option>
                  {parties.map((p) => (
                    <option key={p.id} value={p.partyName} className="bg-slate-900 text-white">
                      {p.partyName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Financial Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-600 px-2.5 py-1 rounded text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer uppercase text-xs"
              >
                <option value="ALL" className="bg-slate-900 text-white">ALL YEARS</option>
                {Array.from(
                  new Set(
                    lrEntries
                      .map((lr) => (lr.dateTime ? getFinancialYear(lr.dateTime).label : null))
                      .filter(Boolean)
                  )
                )
                  .sort((a, b) => b.localeCompare(a))
                  .map((fy) => (
                    <option key={fy} value={fy} className="bg-slate-900 text-white">
                      FY {fy}
                    </option>
                  ))}
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search LR, Party, Truck..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-slate-900 border border-slate-600 text-slate-100 placeholder-slate-400 text-xs rounded pl-8 pr-3 py-1 focus:outline-none focus:border-amber-400 w-44 sm:w-60 font-medium"
              />
            </div>

          </div>
        </div>

        {/* L/R Records Main Table Frame */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs border-collapse">
              {/* Header Bar matching Screenshot */}
              <thead className="bg-slate-950 text-amber-400 font-extrabold uppercase tracking-wider text-[11px] border-b border-slate-700 sticky top-0 z-10">
                <tr>
                  <th className="p-2.5">LR NO.</th>
                  <th className="p-2.5">DATE</th>
                  <th className="p-2.5">FROM / TO</th>
                  <th className="p-2.5">TRUCK NO</th>
                  <th className="p-2.5">CONSIGNOR</th>
                  <th className="p-2.5">CONSIGNEE</th>
                  <th className="p-2.5">FREIGHT</th>
                  <th className="p-2.5 text-center">LR TYPE</th>
                  <th className="p-2.5 text-center">GST BY</th>
                  <th className="p-2.5 text-center">ACTIONS</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-700/60 text-slate-200">
                {sortedLRs.map((lr) => (
                  <tr
                    key={lr.id || lr._id}
                    className="hover:bg-slate-700/50 transition-colors font-medium"
                  >
                    {/* LR NO */}
                    <td className="p-2.5 font-mono font-black text-amber-400 text-sm whitespace-nowrap">
                      #{lr.lrNumber}
                    </td>

                    {/* DATE */}
                    <td className="p-2.5 font-semibold text-slate-300 whitespace-nowrap">
                      {formatDateDisplay(lr.dateTime)}
                    </td>

                    {/* FROM / TO */}
                    <td className="p-2.5 font-bold uppercase text-slate-200 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        {lr.fromPlace || "-"} <ArrowRight size={12} className="text-amber-400 shrink-0" /> {lr.toPlace || "-"}
                      </span>
                    </td>

                    {/* TRUCK NO */}
                    <td className="p-2.5 font-mono font-bold text-sky-300 uppercase whitespace-nowrap">
                      {lr.truckNo || "-"}
                    </td>

                    {/* CONSIGNOR */}
                    <td className="p-2.5 font-bold text-white uppercase max-w-[160px] truncate" title={lr.consignorName}>
                      {lr.consignorName || "-"}
                    </td>

                    {/* CONSIGNEE */}
                    <td className="p-2.5 font-bold text-white uppercase max-w-[160px] truncate" title={lr.consigneeName}>
                      {lr.consigneeName || "-"}
                    </td>

                    {/* FREIGHT */}
                    <td className="p-2.5 font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
                      {getFreightDisplay(lr)}
                    </td>

                    {/* LR TYPE */}
                    <td className="p-2.5 text-center whitespace-nowrap">
                      {(() => {
                        const type = (lr.toPayOrPaid || "TBB").trim().toUpperCase().replace("-", " ");
                        if (type === "PAID") {
                          return (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                              PAID
                            </span>
                          );
                        }
                        if (type === "TO PAY" || type === "TOPAY") {
                          return (
                            <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 uppercase">
                              TO-PAY
                            </span>
                          );
                        }
                        return (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase">
                            TBB
                          </span>
                        );
                      })()}
                    </td>

                    {/* GST BY */}
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-900 text-sky-200 border border-sky-500 uppercase">
                        {lr.gstPayableBy || "CONSIGNEE"}
                      </span>
                    </td>

                    {/* ACTIONS: Print, PDF */}
                    <td className="p-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">

                        {/* Print Button */}
                        <button
                          onClick={() => handlePrint(lr)}
                          title="Print Full A4 Page"
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded transition-all flex items-center gap-1 shadow cursor-pointer"
                        >
                          <Printer size={13} /> Print
                        </button>

                        {/* PDF Download Button */}
                        <button
                          onClick={() => handlePDF(lr)}
                          title="Download PDF"
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded transition-all flex items-center gap-1 shadow cursor-pointer"
                        >
                          <Download size={13} /> PDF
                        </button>

                      </div>
                    </td>

                  </tr>
                ))}

                {sortedLRs.length === 0 && (
                  <tr>
                    <td colSpan="10" className="text-center py-12 text-slate-400 font-semibold text-sm">
                      No Lorry Receipts found for this party.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Copy Selection Selector Modal */}
      {showCopySelectModal && selectedLR && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-800 border border-slate-700 w-full max-w-md rounded-xl p-5 shadow-2xl space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-amber-400">
                  Select Copies for LR #{selectedLR.lrNumber}
                </h3>
              </div>
              <button
                onClick={() => setShowCopySelectModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold px-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 font-medium">
              Select which copy types to include (Consignor, Consignee, Truck or Office):
            </p>

            {/* Copy Checkboxes Grid */}
            <div className="grid grid-cols-2 gap-2.5 bg-slate-900/80 p-3 rounded-lg border border-slate-700/60">
              {[
                { id: "CONSIGNOR", label: "Consignor Copy" },
                { id: "CONSIGNEE", label: "Consignee Copy" },
                { id: "TRUCK", label: "Truck Copy" },
                { id: "OFFICE", label: "Office Copy" },
              ].map((copy) => {
                const isChecked = selectedCopies.includes(copy.id);
                return (
                  <label
                    key={copy.id}
                    onClick={() => toggleCopySelection(copy.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer select-none transition-all ${
                      isChecked
                        ? "bg-amber-500/15 border-amber-500/60 text-amber-300 font-bold"
                        : "bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                    />
                    <span className="text-xs uppercase font-extrabold">{copy.label}</span>
                  </label>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => confirmCopySelectionAndProceed("print")}
                  className="py-2 px-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg shadow flex items-center justify-center gap-1 transition-all"
                >
                  <Printer size={15} /> Print
                </button>

                <button
                  onClick={() => confirmCopySelectionAndProceed("pdf")}
                  className="py-2 px-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-lg shadow flex items-center justify-center gap-1 transition-all"
                >
                  <Download size={15} /> Export PDF
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => confirmCopySelectionAndProceed(null)}
                  className="flex-1 py-1.5 bg-slate-700 hover:bg-slate-600 text-amber-400 font-bold text-xs rounded-lg border border-slate-600 transition-all flex items-center justify-center gap-1"
                >
                  <Eye size={14} /> Document Preview
                </button>

                <button
                  onClick={() => setShowCopySelectModal(false)}
                  className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-bold rounded-lg border border-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
