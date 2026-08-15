import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { fetchLREntriesFromDB, deleteLREntry, sortLRsByNumber, getFinancialYear, formatDateDisplay } from "../utils/storage";
import LRPrintDocument from "../components/LRPrintDocument";
import PasswordConfirmModal from "../components/PasswordConfirmModal";
import { Search, Eye, Printer, Download, Share2, Edit3, Trash2, Plus, FileText, Calendar } from "lucide-react";

export default function LRList() {
  const navigate = useNavigate();
  const [lrEntries, setLrEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLR, setSelectedLR] = useState(null);
  const [activeAutoAction, setActiveAutoAction] = useState(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // { type: "EDIT" | "DELETE", lr }

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

  // Direct action handlers (Print, PDF, WhatsApp)
  const handleDirectAction = (lr, actionType) => {
    setSelectedLR(lr);
    setPendingActionType(actionType);
    setShowCopySelectModal(true);
  };

  // Interactive View Handler - Opens full screen preview
  const handleView = (lr) => {
    setSelectedLR(lr);
    setPendingActionType(null);
    setShowCopySelectModal(true);
  };

  const confirmCopySelectionAndProceed = (actionToExecute) => {
    const act = actionToExecute !== undefined ? actionToExecute : pendingActionType;
    setActiveAutoAction(act);
    setShowCopySelectModal(false);
    setShowPrintModal(true);
  };

  // Password-protected Direct Edit handler
  const handleEditLR = (lr) => {
    setPendingAction({ type: "EDIT", lr });
  };

  // Password-protected Direct Delete handler
  const handleDeleteLR = (lr) => {
    setPendingAction({ type: "DELETE", lr });
  };

  // Execute action after password verification
  const executePendingAction = async () => {
    if (!pendingAction) return;
    const { type, lr } = pendingAction;
    setPendingAction(null);

    if (type === "EDIT") {
      navigate("/lr-entry", { state: { editLR: lr } });
    } else if (type === "DELETE") {
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
        initialCopyType={selectedCopies}
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
                  <th className="p-3 text-center">LR Type</th>
                  <th className="p-3 text-center">GST By</th>
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
                    <td className="p-3 text-center whitespace-nowrap">
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
                    <td className="p-3 text-center whitespace-nowrap">
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
                    <td colSpan="10" className="text-center py-10 text-slate-500">
                      No Lorry Receipts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Password Confirmation Security Modal */}
        {pendingAction && (
          <PasswordConfirmModal
            passwordType={pendingAction.type === "EDIT" ? "login" : "action"}
            actionTitle={
              pendingAction.type === "EDIT"
                ? `Enter password to Edit LR #${pendingAction.lr?.lrNumber}`
                : `Enter password to Delete LR #${pendingAction.lr?.lrNumber}`
            }
            onConfirm={executePendingAction}
            onClose={() => setPendingAction(null)}
          />
        )}

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
                <div className="grid grid-cols-3 gap-2">
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

                  <button
                    onClick={() => confirmCopySelectionAndProceed("whatsapp")}
                    className="py-2 px-2.5 bg-green-600 hover:bg-green-500 text-white font-black text-xs rounded-lg shadow flex items-center justify-center gap-1 transition-all"
                  >
                    <Share2 size={15} /> WhatsApp
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
    </div>
  );
}
