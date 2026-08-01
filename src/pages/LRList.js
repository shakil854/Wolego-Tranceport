import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchLREntriesFromDB, deleteLREntry, sortLRsByNumber, getFinancialYear, formatDateDisplay } from "../utils/storage";
import LRPrintDocument from "../components/LRPrintDocument";
import { Search, Eye, Printer, Download, Share2, Edit3, Trash2, Plus, FileText, Calendar } from "lucide-react";

export default function LRList() {
  const navigate = useNavigate();
  const [lrEntries, setLrEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLR, setSelectedLR] = useState(null);
  const [activeAutoAction, setActiveAutoAction] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const currentFYLabel = getFinancialYear(new Date()).label;
  const [selectedYear, setSelectedYear] = useState(currentFYLabel);

  useEffect(() => {
    loadLREntries();
  }, []);

  const loadLREntries = async () => {
    const data = await fetchLREntriesFromDB();
    const lrs = data || [];
    setLrEntries(lrs);

    // Auto-select the latest financial year in database if newer
    if (lrs.length > 0) {
      const years = Array.from(
        new Set(lrs.map((lr) => (lr.dateTime ? getFinancialYear(lr.dateTime).label : null)).filter(Boolean))
      ).sort((a, b) => b.localeCompare(a));
      if (years.length > 0) {
        setSelectedYear(years[0]);
      }
    }
  };

  // Direct action handlers (Print, PDF, WhatsApp)
  const handleDirectAction = (lr, actionType) => {
    setSelectedLR(lr);
    setActiveAutoAction(actionType);
    setShowPrintModal(true);
  };

  // Interactive View Handler - Opens full screen preview
  const handleView = (lr) => {
    setSelectedLR(lr);
    setActiveAutoAction(null);
    setShowPrintModal(true);
  };

  // Direct Edit handler - opens LREntryForm with state
  const handleEditLR = (lr) => {
    navigate("/lr-entry", { state: { editLR: lr } });
  };

  // Direct Delete handler
  const handleDeleteLR = async (lr) => {
    if (window.confirm(`Are you sure you want to delete LR #${lr.lrNumber}?`)) {
      const updatedList = await deleteLREntry(lr.id);
      setLrEntries(updatedList || []);
    }
  };

  // Dynamic available financial years sorted descending
  const availableYears = Array.from(
    new Set([
      currentFYLabel,
      ...lrEntries.map((lr) => (lr.dateTime ? getFinancialYear(lr.dateTime).label : null)).filter(Boolean),
    ])
  ).sort((a, b) => b.localeCompare(a));

  const filteredLRs = lrEntries.filter((lr) => {
    // 1. Financial Year Filter
    if (selectedYear !== "ALL") {
      const lrFY = lr.dateTime ? getFinancialYear(lr.dateTime).label : null;
      if (lrFY !== selectedYear) return false;
    }

    // 2. Search Query Filter
    const q = searchQuery.toLowerCase();
    return (
      (lr.lrNumber && lr.lrNumber.toLowerCase().includes(q)) ||
      (lr.consignorName && lr.consignorName.toLowerCase().includes(q)) ||
      (lr.consigneeName && lr.consigneeName.toLowerCase().includes(q)) ||
      (lr.truckNo && lr.truckNo.toLowerCase().includes(q)) ||
      (lr.toPlace && lr.toPlace.toLowerCase().includes(q))
    );
  });

  const sortedFilteredLRs = sortLRsByNumber(filteredLRs, false);

  if (showPrintModal && selectedLR) {
    return (
      <LRPrintDocument
        lrData={selectedLR}
        autoAction={activeAutoAction}
        onClose={() => {
          setShowPrintModal(false);
          setActiveAutoAction(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-[calc(100vh-68px)] md:h-[calc(100vh-68px)] overflow-y-auto md:overflow-hidden bg-slate-900 p-1.5 text-slate-100 flex flex-col font-sans">
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col space-y-1.5 min-h-0">
        
        {/* Sleek Combined Top Header & Control Bar */}
        <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 shadow flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center justify-between gap-2 shrink-0">
          
          {/* Title & Stats */}
          <div className="flex items-center gap-2">
            <h1 className="text-sm sm:text-base font-black text-amber-400 flex items-center gap-1.5">
              <FileText className="w-5 h-5" /> Saved LR Records
            </h1>
            <span className="text-xs font-bold text-slate-400 hidden sm:inline">
              (Total LRs: <span className="text-amber-400 font-mono text-sm">{filteredLRs.length}</span>)
            </span>
          </div>

          {/* Financial Year Selector & Search Input */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Financial Year Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-600 px-2.5 py-1 rounded">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">F.Y.:</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-transparent text-amber-400 font-bold text-xs outline-none cursor-pointer"
              >
                {availableYears.map((fy) => (
                  <option key={fy} value={fy} className="bg-slate-800 text-white">
                    {fy === currentFYLabel ? `FY ${fy} (Current)` : `FY ${fy}`}
                  </option>
                ))}
                <option value="ALL" className="bg-slate-800 text-white">
                  All Years (सभी वर्ष)
                </option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative w-56 sm:w-72">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search LR No, Consignor, Consignee, Truck..."
                className="w-full pl-8 pr-2.5 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/lr-entry"
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-xs uppercase shadow flex items-center gap-1 transition-all"
            >
              <Plus size={14} /> Create New LR
            </Link>
          </div>
        </div>

        {/* Table of Records with Direct Action Buttons */}
        <div className="bg-slate-800 rounded-lg border border-slate-700 shadow-xl flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-amber-400 font-extrabold uppercase sticky top-0 z-10 border-b border-slate-700">
                <tr>
                  <th className="p-3">LR No.</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">From / To</th>
                  <th className="p-3">Truck No</th>
                  <th className="p-3">Consignor</th>
                  <th className="p-3">Consignee</th>
                  <th className="p-3 text-right">Freight</th>
                  <th className="p-3">GST By</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 font-medium">
                {sortedFilteredLRs.map((lr) => (
                  <tr key={lr.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="p-3 font-mono font-black text-amber-400 text-base">
                      #{lr.lrNumber}
                    </td>
                    <td className="p-3 text-xs whitespace-nowrap font-bold text-slate-200">
                      {formatDateDisplay(lr.dateTime)}
                    </td>
                    <td className="p-3 text-xs font-bold uppercase">
                      {lr.fromPlace || "-"} ➔ {lr.toPlace || "-"}
                    </td>
                    <td className="p-3 font-mono font-bold text-white uppercase">
                      {lr.truckNo || "N/A"}
                    </td>
                    <td className="p-3 font-bold text-white text-xs max-w-[140px] truncate">
                      {lr.consignorName || "-"}
                    </td>
                    <td className="p-3 font-bold text-white text-xs max-w-[140px] truncate">
                      {lr.consigneeName || "-"}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      ₹ {lr.netTotalAmount || lr.freightAmount || 0}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-sky-900 text-sky-200 border border-sky-600 uppercase">
                        {lr.gstPayableBy || "CONSIGNEE"}
                      </span>
                    </td>
                    
                    {/* Direct Action Buttons: View, Print, PDF Export, WhatsApp & Edit */}
                    <td className="p-3 text-center">
                      <div className="flex flex-wrap items-center justify-center gap-1.5">
                        
                        {/* View Button - Opens full screen preview */}
                        <button
                          onClick={() => handleView(lr)}
                          title="View Document Preview"
                          className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-amber-400 font-bold text-xs rounded transition-all flex items-center gap-1 shadow border border-slate-600"
                        >
                          <Eye size={14} /> View
                        </button>

                        {/* Direct Print Button */}
                        <button
                          onClick={() => handleDirectAction(lr, "print")}
                          title="Direct Print A4"
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded font-black text-xs transition-all flex items-center gap-1 shadow"
                        >
                          <Printer size={14} /> Print
                        </button>

                        {/* Direct Export PDF Button */}
                        <button
                          onClick={() => handleDirectAction(lr, "pdf")}
                          title="Direct Export PDF"
                          className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded transition-all flex items-center gap-1 shadow"
                        >
                          <Download size={14} /> PDF
                        </button>

                        {/* Direct WhatsApp Share Button */}
                        <button
                          onClick={() => handleDirectAction(lr, "whatsapp")}
                          title="Direct WhatsApp PDF Share"
                          className="px-2.5 py-1.5 bg-green-600 hover:bg-green-500 text-white font-black text-xs rounded transition-all flex items-center gap-1 shadow"
                        >
                          <Share2 size={14} /> WhatsApp
                        </button>

                        {/* Direct Edit Button */}
                        <button
                          onClick={() => handleEditLR(lr)}
                          title="Edit LR Record"
                          className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs rounded transition-all flex items-center gap-1 shadow cursor-pointer"
                        >
                          <Edit3 size={14} /> Edit
                        </button>

                        {/* Direct Delete Button */}
                        <button
                          onClick={() => handleDeleteLR(lr)}
                          title="Delete LR Record"
                          className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded transition-all flex items-center gap-1 shadow cursor-pointer"
                        >
                          <Trash2 size={14} /> Delete
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}

                {filteredLRs.length === 0 && (
                  <tr>
                    <td colSpan="9" className="text-center py-10 text-slate-500">
                      No Lorry Receipts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
