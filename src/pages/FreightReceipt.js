import React, { useState, useEffect, useRef } from "react";
import { fetchLREntriesFromDB, getFinancialYear } from "../utils/storage";
import { Receipt, Printer, Download, Search, CheckCircle2, DollarSign, Calendar } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function FreightReceipt() {
  const [lrEntries, setLrEntries] = useState([]);
  const [receiptType, setReceiptType] = useState("CHEQUE"); // "CHEQUE" or "CASH"

  // Financial Year Selection State
  const currentFYLabel = getFinancialYear(new Date()).label;
  const [selectedYear, setSelectedYear] = useState(currentFYLabel);

  // Form Fields
  const [selectedLrNo, setSelectedLrNo] = useState("");
  const [truckNo, setTruckNo] = useState("");
  const [weightKgs, setWeightKgs] = useState("");
  const [ratePerMt, setRatePerMt] = useState("");
  const [paidByCheque, setPaidByCheque] = useState("");
  const [remarks, setRemarks] = useState("");

  const printRef = useRef(null);

  useEffect(() => {
    const loadLRs = async () => {
      const data = await fetchLREntriesFromDB();
      const lrs = data || [];
      setLrEntries(lrs);

      // Auto-select latest year created in the system
      if (lrs.length > 0) {
        const years = Array.from(
          new Set(lrs.map((lr) => (lr.dateTime ? getFinancialYear(lr.dateTime).label : null)).filter(Boolean))
        ).sort((a, b) => b.localeCompare(a));
        if (years.length > 0) {
          setSelectedYear(years[0]);
        }
      }
    };
    loadLRs();
  }, []);

  // Compute available financial years sorted descending
  const availableYears = Array.from(
    new Set([
      currentFYLabel,
      ...lrEntries.map((lr) => (lr.dateTime ? getFinancialYear(lr.dateTime).label : null)).filter(Boolean),
    ])
  ).sort((a, b) => b.localeCompare(a));

  // LRs filtered by selected Financial Year
  const yearFilteredLRs = lrEntries.filter((item) => {
    if (!selectedYear || selectedYear === "ALL") return true;
    const lrFY = item.dateTime ? getFinancialYear(item.dateTime).label : null;
    return lrFY === selectedYear;
  });

  // Handler when selecting an LR from dropdown or typing LR number
  const handleSelectLR = (lr) => {
    if (!lr) return;
    setSelectedLrNo(lr.lrNumber || "");
    setTruckNo(lr.truckNo || "");
    setWeightKgs(lr.weightKgs || "");
    // ratePerMt is NOT auto-filled from LR (user will enter manually)
    const chequeAmt = lr.netTotalAmount || lr.freightAmount || "";
    setPaidByCheque(chequeAmt);
    setRemarks(lr.remarks || "");
  };

  const handleLrNumberChange = (val) => {
    setSelectedLrNo(val);
    if (!val) return;
    const cleanVal = val.toString().trim().toLowerCase();

    // Look up matching LR in current selected year first, then in all LRs
    const match =
      yearFilteredLRs.find(
        (item) => item.lrNumber && item.lrNumber.toString().trim().toLowerCase() === cleanVal
      ) ||
      lrEntries.find(
        (item) => item.lrNumber && item.lrNumber.toString().trim().toLowerCase() === cleanVal
      );

    if (match) {
      setTruckNo(match.truckNo || "");
      setWeightKgs(match.weightKgs || "");
      // ratePerMt is NOT auto-filled from LR (user will enter manually)
      const chequeAmt = match.netTotalAmount || match.freightAmount || "";
      setPaidByCheque(chequeAmt);
      setRemarks(match.remarks || "");
    }
  };

  // Dynamic Calculations
  const numericWeight = parseFloat(weightKgs) || 0;
  const numericRate = parseFloat(ratePerMt) || 0;
  // Total Freight = Total Weight (KGs) / 1000 * Rate per M.T.
  const calculatedTotalFreight = Math.round((numericWeight / 1000) * numericRate);

  const numericPaidCheque = parseFloat(paidByCheque) || 0;
  const calculatedCashPaid = Math.max(0, calculatedTotalFreight - numericPaidCheque);

  // Browser Print
  const handlePrint = () => {
    window.print();
  };

  // PDF Export
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();

      // Center image on A4 page
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 10, pdfWidth, pdfHeight);
      pdf.save(`Freight_Receipt_${selectedLrNo || "Draft"}_${receiptType}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      window.print();
    }
  };

  return (
    <div className="min-h-[calc(100vh-68px)] bg-slate-900 p-2 sm:p-4 text-slate-100 flex flex-col overflow-y-auto font-sans">

      {/* Top Header Bar */}
      <div className="max-w-4xl w-full mx-auto bg-slate-800 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-700 shadow-lg flex flex-wrap justify-between items-center gap-2 shrink-0 print:hidden mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm sm:text-lg font-black text-amber-400 flex items-center gap-2">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" /> Freight Receipt Generator
          </h1>
        </div>

        {/* Financial Year Selector & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">

          {/* Financial Year Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/40 px-2.5 py-1 rounded-lg">
            <Calendar className="w-4 h-4 text-amber-400" />
            <label className="text-[11px] font-bold text-amber-300 uppercase">F.Y.:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-slate-950 text-amber-400 font-extrabold text-xs px-2 py-0.5 rounded border border-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              <option value="ALL">ALL YEARS (सभी वर्ष)</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  F.Y. {yr} {yr === currentFYLabel ? "(Current)" : ""}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handlePrint}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase shadow flex items-center gap-1.5 transition-all transform hover:scale-105"
          >
            <Printer size={15} /> Print Receipt
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs uppercase shadow flex items-center gap-1.5 transition-all transform hover:scale-105"
          >
            <Download size={15} /> Export PDF
          </button>
        </div>
      </div>

      {/* Main Full-Width Form Card */}
      <div className="max-w-4xl w-full mx-auto bg-slate-800/90 rounded-xl p-3 sm:p-5 border-2 border-slate-700 shadow-2xl space-y-3 sm:space-y-4 print:hidden">

        {/* Step 1: Mode Selector */}
        <div className="bg-slate-900/80 p-3 rounded-xl border border-slate-700 space-y-2">
          <label className="text-xs font-extrabold text-amber-400 uppercase tracking-wider block">
            1. Select Receipt Type
          </label>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md">
            <button
              type="button"
              onClick={() => setReceiptType("CHEQUE")}
              className={`py-2 px-3 sm:px-4 rounded-lg font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${receiptType === "CHEQUE"
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg scale-105"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
            >
              <CheckCircle2 size={15} /> Cheque + Cash
            </button>

            <button
              type="button"
              onClick={() => setReceiptType("CASH")}
              className={`py-2 px-3 sm:px-4 rounded-lg font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${receiptType === "CASH"
                  ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg scale-105"
                  : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
            >
              <DollarSign size={15} /> Cash Only
            </button>
          </div>
        </div>

        {/* Step 2: Freight Receipt Form Inputs */}
        <div className="space-y-3 bg-slate-900/60 p-3 sm:p-4 rounded-xl border border-slate-700">

          <div className="flex flex-wrap justify-between items-center border-b border-slate-700 pb-1.5 gap-2">
            <h2 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
              2. Freight Receipt Form Details
            </h2>

            {/* Quick LR Selector Dropdown for selected Financial Year */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">
                Select LR from F.Y. {selectedYear}:
              </label>
              <select
                onChange={(e) => {
                  const lr = yearFilteredLRs.find((item) => String(item.id) === e.target.value);
                  if (lr) handleSelectLR(lr);
                }}
                className="bg-slate-950 border border-slate-600 text-amber-300 font-bold text-xs px-2 py-1 rounded focus:outline-none focus:border-amber-400 max-w-[220px] truncate cursor-pointer"
              >
                <option value="">-- Choose LR ({yearFilteredLRs.length} LRs) --</option>
                {yearFilteredLRs.map((lr) => (
                  <option key={lr.id} value={lr.id}>
                    LR #{lr.lrNumber} - {lr.truckNo || "No Truck"} ({lr.partyConsignorName || lr.consignorName || "Consignor"})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-0.5">
                LR Number
              </label>
              <input
                type="text"
                value={selectedLrNo}
                onChange={(e) => handleLrNumberChange(e.target.value)}
                placeholder="ENTER LR NO."
                className="w-full px-2 py-1 bg-slate-950 border border-slate-600 rounded font-mono font-bold text-amber-400 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-0.5">
                Truck No.
              </label>
              <input
                type="text"
                value={truckNo}
                onChange={(e) => setTruckNo(e.target.value.toUpperCase())}
                placeholder="ENTER TRUCK NO."
                className="w-full px-2 py-1 bg-slate-950 border border-slate-600 rounded font-mono font-bold text-white uppercase text-xs focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-0.5">
                Total Weight (KGs)
              </label>
              <input
                type="number"
                value={weightKgs}
                onChange={(e) => setWeightKgs(e.target.value)}
                placeholder="WEIGHT IN KGS"
                className="w-full px-2 py-1 bg-slate-950 border border-slate-600 rounded font-mono font-bold text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-0.5">
                Rate Per M.T.
              </label>
              <input
                type="number"
                value={ratePerMt}
                onChange={(e) => setRatePerMt(e.target.value)}
                placeholder="RATE RS."
                className="w-full px-2 py-1 bg-slate-950 border border-slate-600 rounded font-mono font-bold text-emerald-400 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                Total Freight (₹)
              </label>
              <div className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded font-mono font-black text-emerald-400 text-xs">
                ₹ {calculatedTotalFreight.toLocaleString("en-IN")}
              </div>
            </div>
          </div>

          {receiptType === "CHEQUE" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 uppercase mb-0.5">
                  Paid By Cheque
                </label>
                <input
                  type="number"
                  value={paidByCheque}
                  onChange={(e) => setPaidByCheque(e.target.value)}
                  placeholder="CHEQUE AMOUNT"
                  className="w-full px-2 py-1 bg-slate-950 border border-slate-600 rounded font-mono font-bold text-sky-400 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                  Cash Paid (Calculated)
                </label>
                <div className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded font-mono font-black text-amber-400 text-xs">
                  ₹ {calculatedCashPaid.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                  Receipt Mode
                </label>
                <div className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded font-mono font-black text-amber-400 text-xs">
                  CASH ONLY
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-0.5">
                  Cash Paid (Full Freight)
                </label>
                <div className="w-full px-2 py-1 bg-slate-950 border border-slate-700 rounded font-mono font-black text-amber-400 text-xs">
                  ₹ {calculatedTotalFreight.toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-slate-300 uppercase mb-0.5">
              Remarks
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="ENTER REMARKS (IF ANY)"
              className="w-full px-2 py-1 bg-slate-950 border border-slate-600 rounded text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

      </div>

      {/* Offscreen / Hidden Print Document (Capturable by PDF/Print without displaying on screen) */}
      <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none print:static print:opacity-100 print:pointer-events-auto">
        <div
          ref={printRef}
          className="print-container bg-white text-black p-6 sm:p-10 rounded-xl shadow-2xl border-2 border-slate-300 max-w-2xl mx-auto font-sans"
        >
          {/* Main Form Table Matching Screenshots */}
          <table className="w-full border-collapse border-2 border-black text-sm">
            <tbody>
              {/* TRUCK NO */}
              <tr className="border-b-2 border-black">
                <td className="w-1/2 p-3 font-extrabold uppercase bg-gray-100 border-r-2 border-black">
                  TRUCK NO.
                </td>
                <td className="w-1/2 p-3 font-mono font-black text-base uppercase text-center">
                  {truckNo || ""}
                </td>
              </tr>

              {/* TOTAL WEIGHT IN KGS */}
              <tr className="border-b-2 border-black">
                <td className="w-1/2 p-3 font-extrabold uppercase bg-gray-100 border-r-2 border-black">
                  TOTAL WEIGHT IN KGS
                </td>
                <td className="w-1/2 p-3 font-mono font-black text-base text-center">
                  {weightKgs ? numericWeight.toLocaleString("en-IN") : ""}
                </td>
              </tr>

              {/* RATE PER M.T. */}
              <tr className="border-b-2 border-black">
                <td className="w-1/2 p-3 font-extrabold uppercase bg-gray-100 border-r-2 border-black">
                  RATE PER M.T.
                </td>
                <td className="w-1/2 p-3 font-mono font-black text-base text-center">
                  {ratePerMt ? numericRate.toLocaleString("en-IN") : ""}
                </td>
              </tr>

              {/* TOTAL FREIGHT */}
              <tr className="border-b-2 border-black">
                <td className="w-1/2 p-3 font-extrabold uppercase bg-gray-100 border-r-2 border-black">
                  TOTAL FREIGHT
                </td>
                <td className="w-1/2 p-3 font-mono font-black text-lg text-center">
                  {calculatedTotalFreight > 0 ? calculatedTotalFreight.toLocaleString("en-IN") : ""}
                </td>
              </tr>

              {/* CHEQUE SPECIFIC ROWS */}
              {receiptType === "CHEQUE" ? (
                <>
                  {/* PAID BY CHEQUE */}
                  <tr className="border-b-2 border-black">
                    <td className="w-1/2 p-3 font-extrabold uppercase bg-gray-100 border-r-2 border-black">
                      PAID BY CHEQUE
                    </td>
                    <td className="w-1/2 p-3 font-mono font-black text-base text-center">
                      {paidByCheque ? numericPaidCheque.toLocaleString("en-IN") : ""}
                    </td>
                  </tr>

                  {/* CASH PAID */}
                  <tr className="border-b-2 border-black">
                    <td className="w-1/2 p-3 font-extrabold uppercase bg-gray-100 border-r-2 border-black">
                      CASH PAID
                    </td>
                    <td className="w-1/2 p-3 font-mono font-black text-base text-center">
                      {calculatedTotalFreight > 0 ? calculatedCashPaid.toLocaleString("en-IN") : ""}
                    </td>
                  </tr>
                </>
              ) : (
                /* CASH ONLY SPECIFIC ROW */
                <tr className="border-b-2 border-black">
                  <td className="w-1/2 p-3 font-extrabold uppercase bg-gray-100 border-r-2 border-black">
                    CASH PAID
                  </td>
                  <td className="w-1/2 p-3 font-mono font-black text-base text-center">
                    {calculatedTotalFreight > 0 ? calculatedTotalFreight.toLocaleString("en-IN") : ""}
                  </td>
                </tr>
              )}

              {/* REMARKS */}
              <tr>
                <td className="w-1/2 p-3 font-extrabold uppercase bg-gray-100 border-r-2 border-black">
                  REMARKS
                </td>
                <td className="w-1/2 p-3 font-bold text-sm text-center">
                  {remarks || ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
