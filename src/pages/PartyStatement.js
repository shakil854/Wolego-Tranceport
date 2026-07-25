import React, { useState, useEffect } from "react";
import { fetchLREntriesFromDB, fetchPartiesFromDB } from "../utils/storage";
import SearchablePartySelect from "../components/SearchablePartySelect";
import PartyStatementDocument from "../components/PartyStatementDocument";
import {
  FileSpreadsheet,
  Printer,
  Download,
  Share2,
  Calendar,
  User,
  Search,
  Truck,
  Scale,
  DollarSign,
  Eye,
} from "lucide-react";

export default function PartyStatement() {
  const [lrEntries, setLrEntries] = useState([]);
  const [parties, setParties] = useState([]);

  // Form Filter States - Consignor & Consignee Selection
  const [selectedConsignor, setSelectedConsignor] = useState("");
  const [selectedConsignee, setSelectedConsignee] = useState("");
  const [matchEither, setMatchEither] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Print / PDF Modal state
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeAutoAction, setActiveAutoAction] = useState(null);

  useEffect(() => {
    loadData();
    // Default date range: First day of current month to today
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const formatDateStr = (d) => d.toISOString().split("T")[0];
    setFromDate(formatDateStr(firstDay));
    setToDate(formatDateStr(now));
  }, []);

  const loadData = async () => {
    const lrs = await fetchLREntriesFromDB();
    const pts = await fetchPartiesFromDB();
    setLrEntries(lrs || []);
    setParties(pts || []);
  };

  const formatDateDisplay = (dateVal) => {
    if (!dateVal) return "";
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

  // Quick Date Range Preset Handlers
  const handlePresetDate = (type) => {
    const now = new Date();
    const formatDateStr = (d) => d.toISOString().split("T")[0];

    if (type === "THIS_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      setFromDate(formatDateStr(firstDay));
      setToDate(formatDateStr(now));
    } else if (type === "LAST_MONTH") {
      const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
      setFromDate(formatDateStr(firstDay));
      setToDate(formatDateStr(lastDay));
    } else if (type === "ALL_TIME") {
      setFromDate("");
      setToDate("");
    }
  };

  // Filter logic
  const filteredLRs = lrEntries.filter((lr) => {
    // 1. Party Filter (Consignor / Consignee)
    if (matchEither) {
      // Either mode: match selectedConsignor or selectedConsignee as EITHER consignor OR consignee
      const targetConsignor = selectedConsignor.trim().toLowerCase();
      const targetConsignee = selectedConsignee.trim().toLowerCase();

      if (targetConsignor) {
        const matchC1 = (lr.consignorName && lr.consignorName.toLowerCase().includes(targetConsignor)) ||
                        (lr.consigneeName && lr.consigneeName.toLowerCase().includes(targetConsignor));
        if (!matchC1) return false;
      }
      if (targetConsignee) {
        const matchC2 = (lr.consigneeName && lr.consigneeName.toLowerCase().includes(targetConsignee)) ||
                        (lr.consignorName && lr.consignorName.toLowerCase().includes(targetConsignee));
        if (!matchC2) return false;
      }
    } else {
      // Specific mode (Default): Match Consignor and Consignee specifically
      if (selectedConsignor && selectedConsignor.trim() !== "") {
        const targetConsignor = selectedConsignor.trim().toLowerCase();
        const consignorMatch = lr.consignorName && lr.consignorName.toLowerCase().includes(targetConsignor);
        if (!consignorMatch) return false;
      }

      if (selectedConsignee && selectedConsignee.trim() !== "") {
        const targetConsignee = selectedConsignee.trim().toLowerCase();
        const consigneeMatch = lr.consigneeName && lr.consigneeName.toLowerCase().includes(targetConsignee);
        if (!consigneeMatch) return false;
      }
    }

    // 2. Date Filter
    if (lr.dateTime) {
      const lrDateStr = lr.dateTime.split("T")[0];
      if (fromDate && lrDateStr < fromDate) return false;
      if (toDate && lrDateStr > toDate) return false;
    }

    // 3. Search Query Filter
    if (searchQuery && searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      const numMatch = lr.lrNumber && lr.lrNumber.toString().toLowerCase().includes(q);
      const truckMatch = lr.truckNo && lr.truckNo.toLowerCase().includes(q);
      const destMatch = lr.toPlace && lr.toPlace.toLowerCase().includes(q);
      const goodsMatch = lr.descriptionOfGoods && lr.descriptionOfGoods.toLowerCase().includes(q);
      const c1Match = lr.consignorName && lr.consignorName.toLowerCase().includes(q);
      const c2Match = lr.consigneeName && lr.consigneeName.toLowerCase().includes(q);
      if (!numMatch && !truckMatch && !destMatch && !goodsMatch && !c1Match && !c2Match) return false;
    }

    return true;
  });

  // Calculate statistics
  const totalTrucks = filteredLRs.length;
  const totalWeightKgs = filteredLRs.reduce((sum, r) => sum + (parseFloat(r.weightKgs) || 0), 0);
  const totalWeightMT = (totalWeightKgs / 1000).toFixed(3);

  const calculateRowFreight = (r) => {
    if (r.freightAmount && parseFloat(r.freightAmount) > 0) {
      return parseFloat(r.freightAmount);
    }
    const w = parseFloat(r.weightKgs) || 0;
    const rate = parseFloat(r.ratePerTon) || 0;
    return w > 1000 ? (w / 1000) * rate : w * rate;
  };

  const totalAmountFinal = filteredLRs.reduce(
    (sum, r) => sum + (parseFloat(r.netTotalAmount) || parseFloat(r.totalWithGst) || calculateRowFreight(r)),
    0
  );

  const handleOpenPrintModal = (action = null) => {
    setActiveAutoAction(action);
    setShowPrintModal(true);
  };

  // Determine display party title for statement document header
  const getDisplayPartyTitle = () => {
    if (selectedConsignor && selectedConsignee) {
      return `Consignor: ${selectedConsignor} | Consignee: ${selectedConsignee}`;
    }
    if (selectedConsignor) return selectedConsignor;
    if (selectedConsignee) return selectedConsignee;
    return "All Parties";
  };

  // Dedicated Print View Modal (Only white statement document rendered during print)
  if (showPrintModal) {
    return (
      <PartyStatementDocument
        partyName={getDisplayPartyTitle()}
        consignorName={selectedConsignor}
        consigneeName={selectedConsignee}
        fromDate={fromDate}
        toDate={toDate}
        records={filteredLRs}
        autoAction={activeAutoAction}
        onClose={() => {
          setShowPrintModal(false);
          setActiveAutoAction(null);
        }}
      />
    );
  }

  return (
    <div className="h-[calc(100vh-68px)] bg-slate-900 p-2 sm:p-3 text-slate-100 font-sans flex flex-col overflow-hidden">
      <div className="max-w-[1480px] w-full mx-auto flex-1 flex flex-col space-y-2 min-h-0">
        
        {/* Top Control Bar with Actions & Header */}
        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-md flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg border border-amber-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-amber-400 uppercase tracking-wide flex items-center gap-2">
                Party Statement Register
              </h1>
              <p className="text-[11px] text-slate-400">
                Select party & date range to generate loading register statement
              </p>
            </div>
          </div>

          {/* Action Buttons: View Preview, Print A4, PDF, WhatsApp */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleOpenPrintModal(null)}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-amber-400 font-bold rounded text-xs flex items-center gap-1 transition-all shadow border border-slate-600"
            >
              <Eye size={15} /> Statement Preview
            </button>
            <button
              onClick={() => handleOpenPrintModal("print")}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-xs uppercase flex items-center gap-1 transition-all shadow"
            >
              <Printer size={15} /> Print A4
            </button>
            <button
              onClick={() => handleOpenPrintModal("pdf")}
              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded text-xs flex items-center gap-1 transition-all shadow"
            >
              <Download size={15} /> Export PDF
            </button>
            <button
              onClick={() => handleOpenPrintModal("whatsapp")}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white font-black rounded text-xs flex items-center gap-1 transition-all shadow"
            >
              <Share2 size={15} /> WhatsApp
            </button>
          </div>
        </div>

        {/* Filter Selection Panel */}
        <div className="bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-md grid grid-cols-1 md:grid-cols-12 gap-2.5 items-end shrink-0">
          
          {/* Select Consignor (Sender) */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-amber-400 flex items-center gap-1 uppercase">
              <User size={13} /> Select Consignor (Shipper)
            </label>
            <SearchablePartySelect
              parties={parties}
              value={selectedConsignor}
              onSelectParty={(pName) => setSelectedConsignor(pName)}
              placeholder="-- All / Select Consignor --"
            />
          </div>

          {/* Select Consignee (Receiver) */}
          <div className="md:col-span-4 space-y-1">
            <label className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 uppercase">
              <User size={13} /> Select Consignee (Receiver)
            </label>
            <SearchablePartySelect
              parties={parties}
              value={selectedConsignee}
              onSelectParty={(pName) => setSelectedConsignee(pName)}
              placeholder="-- All / Select Consignee --"
            />
          </div>

          {/* Date Range Selection */}
          <div className="md:col-span-4 grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 uppercase">
                <Calendar size={13} /> From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white font-bold focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1 uppercase">
                <Calendar size={13} /> To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-white font-bold focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Date Presets & Search Bar */}
          <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-700/60">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Quick Period:</span>
                <button
                  onClick={() => handlePresetDate("THIS_MONTH")}
                  className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-[11px] font-semibold rounded text-amber-300 transition-colors"
                >
                  This Month
                </button>
                <button
                  onClick={() => handlePresetDate("LAST_MONTH")}
                  className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-[11px] font-semibold rounded text-slate-300 transition-colors"
                >
                  Last Month
                </button>
                <button
                  onClick={() => handlePresetDate("ALL_TIME")}
                  className="px-2 py-0.5 bg-slate-700 hover:bg-slate-600 text-[11px] font-semibold rounded text-slate-300 transition-colors"
                >
                  All Time
                </button>
              </div>

              {/* Option to match either role */}
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-300 cursor-pointer select-none bg-slate-900/60 px-2 py-1 rounded border border-slate-700 hover:border-slate-600">
                <input
                  type="checkbox"
                  checked={matchEither}
                  onChange={(e) => setMatchEither(e.target.checked)}
                  className="w-3.5 h-3.5 text-amber-500 rounded border-slate-600 bg-slate-900 focus:ring-amber-400 cursor-pointer"
                />
                <span className="text-[11px] text-amber-300">Match Party as Either Consignor or Consignee</span>
              </label>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Truck No, LR No, City..."
                className="w-full pl-8 pr-2.5 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 shrink-0">
          <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg shadow flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-md border border-blue-500/30">
              <Truck size={18} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Total Trucks Loaded</div>
              <div className="text-base font-black text-white font-mono">{totalTrucks} Loads</div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg shadow flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-md border border-emerald-500/30">
              <Scale size={18} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Total Weight</div>
              <div className="text-base font-black text-emerald-400 font-mono">{totalWeightMT} MT</div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg shadow flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-md border border-amber-500/30">
              <DollarSign size={18} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-medium uppercase">Total Freight Amount</div>
              <div className="text-base font-black text-amber-400 font-mono">
                ₹ {totalAmountFinal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-lg shadow flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-md border border-purple-500/30">
              <User size={18} />
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="text-[10px] text-slate-400 font-medium uppercase">Selected Parties</div>
              <div className="text-[11px] font-extrabold text-amber-300 truncate" title={selectedConsignor || "All Consignors"}>
                CR: {selectedConsignor || "All"}
              </div>
              <div className="text-[11px] font-extrabold text-emerald-300 truncate" title={selectedConsignee || "All Consignees"}>
                CE: {selectedConsignee || "All"}
              </div>
            </div>
          </div>
        </div>

        {/* Clean Application Data Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-amber-400 font-extrabold uppercase sticky top-0 z-10 border-b border-slate-700">
                <tr>
                  <th className="p-2.5 text-center w-14">LR No.</th>
                  <th className="p-2.5">Date</th>
                  <th className="p-2.5">Destination & Material</th>
                  <th className="p-2.5">Truck No</th>
                  <th className="p-2.5">Consignor</th>
                  <th className="p-2.5">Consignee</th>
                  <th className="p-2.5 text-right">Weight (MT)</th>
                  <th className="p-2.5 text-right">Rate/Ton</th>
                  <th className="p-2.5 text-right">Freight Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/70 font-medium">
                {filteredLRs.map((r, index) => {
                  const amtWTax = calculateRowFreight(r);
                  const materialDesc = r.descriptionOfGoods
                    ? `${r.toPlace || ""} - ${r.descriptionOfGoods}`
                    : r.toPlace || "-";

                  return (
                    <tr key={r.id || index} className="hover:bg-slate-700/50 transition-colors">
                      <td className="p-2.5 text-center font-mono font-black text-amber-400 text-sm">
                        #{r.lrNumber}
                      </td>
                      <td className="p-2.5 whitespace-nowrap">
                        {formatDateDisplay(r.dateTime)}
                      </td>
                      <td className="p-2.5 uppercase font-bold text-white">
                        {materialDesc}
                      </td>
                      <td className="p-2.5 font-mono font-bold text-white uppercase whitespace-nowrap">
                        {r.truckNo || "-"}
                      </td>
                      <td className="p-2.5 uppercase font-semibold text-slate-300 truncate max-w-[140px]" title={r.consignorName}>
                        {r.consignorName || "-"}
                      </td>
                      <td className="p-2.5 uppercase font-semibold text-emerald-300/90 truncate max-w-[140px]" title={r.consigneeName}>
                        {r.consigneeName || "-"}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-white">
                        {(parseFloat(r.weightKgs || 0) / 1000).toFixed(3)} MT
                      </td>
                      <td className="p-2.5 text-right font-mono text-slate-300">
                        ₹ {parseFloat(r.ratePerTon || 0).toFixed(2)}
                      </td>
                      <td className="p-2.5 text-right font-mono font-black text-emerald-400 text-sm">
                        ₹ {amtWTax.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  );
                })}

                {filteredLRs.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-10 text-slate-500 font-bold italic">
                      No lorry receipts found for selected party and date range.
                    </td>
                  </tr>
                )}
              </tbody>

              {filteredLRs.length > 0 && (
                <tfoot className="bg-slate-950 font-black text-amber-400 border-t-2 border-slate-700 sticky bottom-0 z-10">
                  <tr>
                    <td colSpan="6" className="p-2.5 text-right uppercase tracking-widest text-xs">
                      TOTAL ({filteredLRs.length} Trucks)
                    </td>
                    <td className="p-2.5 text-right font-mono text-xs font-black text-emerald-400">
                      {totalWeightMT} MT
                    </td>
                    <td className="p-2.5 text-right font-mono text-xs"></td>
                    <td className="p-2.5 text-right font-mono text-sm font-black text-emerald-400">
                      ₹ {totalAmountFinal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
