import React, { useState, useEffect, useRef } from "react";
import { fetchLREntriesFromDB } from "../utils/storage";
import { Receipt, Printer, Download, Search, CheckCircle2, DollarSign } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function FreightReceipt() {
  const [lrEntries, setLrEntries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [receiptType, setReceiptType] = useState("CHEQUE"); // "CHEQUE" or "CASH"

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
      setLrEntries(data || []);
    };
    loadLRs();
  }, []);

  // Handler when selecting an LR or typing LR number
  const handleSelectLR = (lr) => {
    setSelectedLrNo(lr.lrNumber || "");
    setTruckNo(lr.truckNo || "");
    setWeightKgs(lr.weightKgs || "");
    setRatePerMt(lr.ratePerTon || "");
    const chequeAmt = lr.netTotalAmount || lr.freightAmount || "";
    setPaidByCheque(chequeAmt);
    setRemarks(lr.remarks || "");
  };

  const handleLrNumberChange = (val) => {
    setSelectedLrNo(val);
    // Find matching LR if exists
    const match = lrEntries.find(
      (item) => item.lrNumber && item.lrNumber.toString().trim() === val.toString().trim()
    );
    if (match) {
      setTruckNo(match.truckNo || "");
      setWeightKgs(match.weightKgs || "");
      setRatePerMt(match.ratePerTon || "");
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

  // Filtered LR list for dropdown suggestions
  const filteredLRs = searchQuery
    ? lrEntries.filter(
        (item) =>
          item.lrNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (item.truckNo && item.truckNo.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : lrEntries;

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
    <div className="min-h-screen bg-slate-900 py-6 px-3 sm:px-6 lg:px-8 text-slate-100">
      {/* Screen Controls & Form Container (Hidden during window.print()) */}
      <div className="max-w-6xl mx-auto space-y-6 print:hidden">
        
        {/* Header */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-amber-400 flex items-center gap-2">
              <Receipt className="w-7 h-7" /> Freight Receipt Generator
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Select LR to auto-fill Truck No & Weight, enter Rate per M.T. and calculate Freight Receipt.
              <span className="text-amber-300 font-bold ml-1">(Print only - Not saved to database)</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-sm uppercase shadow-md flex items-center gap-2 transition-all transform hover:scale-105"
            >
              <Printer size={18} /> Print Receipt
            </button>
            <button
              onClick={handleExportPDF}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-sm uppercase shadow-md flex items-center gap-2 transition-all transform hover:scale-105"
            >
              <Download size={18} /> Export PDF
            </button>
          </div>
        </div>

        {/* Mode Selector & Quick LR Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Receipt Type Toggle */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg space-y-3">
            <label className="text-sm font-bold text-amber-400 uppercase tracking-wider block">
              1. Select Receipt Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setReceiptType("CHEQUE")}
                className={`py-3 px-4 rounded-lg font-black text-sm flex items-center justify-center gap-2 border transition-all ${
                  receiptType === "CHEQUE"
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg scale-105"
                    : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <CheckCircle2 size={18} /> Paid by Cheque + Cash
              </button>

              <button
                type="button"
                onClick={() => setReceiptType("CASH")}
                className={`py-3 px-4 rounded-lg font-black text-sm flex items-center justify-center gap-2 border transition-all ${
                  receiptType === "CASH"
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg scale-105"
                    : "bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-700"
                }`}
              >
                <DollarSign size={18} /> Cash Paid Only
              </button>
            </div>
          </div>

          {/* LR Search / Select */}
          <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg space-y-3">
            <label className="text-sm font-bold text-amber-400 uppercase tracking-wider block">
              2. Load LR Data (Optional)
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search saved LR No or Truck..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
            {searchQuery && (
              <div className="max-h-36 overflow-y-auto bg-slate-950 border border-slate-700 rounded-lg divide-y divide-slate-800">
                {filteredLRs.map((lr) => (
                  <button
                    key={lr.id}
                    onClick={() => {
                      handleSelectLR(lr);
                      setSearchQuery("");
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-amber-500/20 flex justify-between items-center text-slate-200"
                  >
                    <span className="font-bold text-amber-400">LR #{lr.lrNumber}</span>
                    <span>{lr.truckNo || "No Truck"}</span>
                    <span>{lr.weightKgs ? `${lr.weightKgs} KGs` : "-"}</span>
                  </button>
                ))}
                {filteredLRs.length === 0 && (
                  <div className="p-3 text-xs text-slate-500 text-center">No matching LRs found</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Input Form Fields */}
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl space-y-4">
          <h2 className="text-sm font-bold text-amber-400 uppercase tracking-wider border-b border-slate-700 pb-2">
            3. Freight Receipt Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            
            {/* LR Number Box */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                LR Number
              </label>
              <input
                type="text"
                value={selectedLrNo}
                onChange={(e) => handleLrNumberChange(e.target.value)}
                placeholder="Enter LR No."
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg font-mono font-bold text-amber-400 text-base focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Truck No */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Truck No.
              </label>
              <input
                type="text"
                value={truckNo}
                onChange={(e) => setTruckNo(e.target.value.toUpperCase())}
                placeholder="e.g. GJ-36-V-8929"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg font-mono font-bold text-white uppercase text-base focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Total Weight in KGs */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Total Weight in KGs
              </label>
              <input
                type="number"
                value={weightKgs}
                onChange={(e) => setWeightKgs(e.target.value)}
                placeholder="e.g. 35370"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg font-mono font-bold text-white text-base focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Rate Per M.T. */}
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Rate Per M.T.
              </label>
              <input
                type="number"
                value={ratePerMt}
                onChange={(e) => setRatePerMt(e.target.value)}
                placeholder="e.g. 3200"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg font-mono font-bold text-emerald-400 text-base focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Total Freight (Calculated) */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                Total Freight (Calculated)
              </label>
              <div className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg font-mono font-black text-emerald-400 text-base">
                ₹ {calculatedTotalFreight.toLocaleString("en-IN")}
              </div>
            </div>

            {/* Paid By Cheque (Only for CHEQUE type) */}
            {receiptType === "CHEQUE" && (
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                  Paid By Cheque
                </label>
                <input
                  type="number"
                  value={paidByCheque}
                  onChange={(e) => setPaidByCheque(e.target.value)}
                  placeholder="e.g. 53055"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg font-mono font-bold text-sky-400 text-base focus:outline-none focus:border-amber-400"
                />
              </div>
            )}

            {/* Cash Paid (Only for CHEQUE type) */}
            {receiptType === "CHEQUE" && (
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">
                  Cash Paid (Calculated)
                </label>
                <div className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg font-mono font-black text-amber-400 text-base">
                  ₹ {calculatedCashPaid.toLocaleString("en-IN")}
                </div>
              </div>
            )}

            {/* Remarks */}
            <div className={receiptType === "CHEQUE" ? "sm:col-span-2 md:col-span-2" : "sm:col-span-2"}>
              <label className="block text-xs font-bold text-slate-300 uppercase mb-1">
                Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Enter remarks (if any)"
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-amber-400"
              />
            </div>

          </div>
        </div>

      </div>

      {/* Printable Receipt Preview & Document Section */}
      <div className="max-w-3xl mx-auto mt-8">
        <div className="text-center mb-3 print:hidden">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            Live Printable Receipt Preview
          </span>
        </div>

        {/* Printable Card Area matching Screenshot Style */}
        <div
          ref={printRef}
          className="print-container bg-white text-black p-6 sm:p-10 rounded-xl shadow-2xl border-2 border-slate-300 max-w-2xl mx-auto font-sans"
          style={{ minHeight: "380px" }}
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
              {receiptType === "CHEQUE" && (
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
