import React, { useState, useEffect, useRef } from "react";
import { fetchLREntriesFromDB, getFinancialYear } from "../utils/storage";
import { Printer, Download, Share2, CheckCircle2, DollarSign, Calendar } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoImg from "../assets/logo.png";

export default function FreightReceipt() {
  const [lrEntries, setLrEntries] = useState([]);
  const [receiptType, setReceiptType] = useState("CHEQUE"); // "CHEQUE" or "CASH"
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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
  const inputLrNoRef = useRef(null);
  const inputTruckNoRef = useRef(null);
  const inputWeightRef = useRef(null);
  const inputRateRef = useRef(null);
  const inputChequeRef = useRef(null);
  const inputRemarksRef = useRef(null);

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

  // Helper to generate crisp, high-res A4 PDF matching Print preview
  const generateFreightReceiptPdf = async () => {
    if (!printRef.current) return null;
    const element = printRef.current;

    // Temporarily make element visible behind screen for html2canvas capture
    const origOpacity = element.style.opacity;
    const origPosition = element.style.position;
    const origLeft = element.style.left;
    const origTop = element.style.top;
    const origZIndex = element.style.zIndex;

    element.style.opacity = "1";
    element.style.position = "fixed";
    element.style.left = "0";
    element.style.top = "0";
    element.style.zIndex = "-9999";

    try {
      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      const margin = 10;
      const printWidth = pdfWidth - margin * 2; // 190mm
      const imgProps = pdf.getImageProperties(imgData);
      const imgHeight = (imgProps.height * printWidth) / imgProps.width;

      // Fill pure white A4 background
      pdf.setFillColor(255, 255, 255);
      pdf.rect(0, 0, pdfWidth, pdfHeight, "F");

      // Place centered receipt image at top of A4 page (matches Print)
      pdf.addImage(imgData, "PNG", margin, 15, printWidth, imgHeight);

      return pdf;
    } finally {
      element.style.opacity = origOpacity;
      element.style.position = origPosition;
      element.style.left = origLeft;
      element.style.top = origTop;
      element.style.zIndex = origZIndex;
    }
  };

  // Browser Print
  const handlePrint = () => {
    window.print();
  };

  // PDF Export
  const handleExportPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = await generateFreightReceiptPdf();
      if (!pdf) return;
      pdf.save(`Freight_Receipt_${selectedLrNo || "Draft"}_${receiptType}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
      window.print();
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Direct WhatsApp PDF Sharing
  const handleWhatsApp = async () => {
    setIsGeneratingPdf(true);
    try {
      const pdf = await generateFreightReceiptPdf();
      if (!pdf) return;

      const filename = `Freight_Receipt_${selectedLrNo || "Draft"}_${receiptType}.pdf`;
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], filename, { type: "application/pdf" });

      setIsGeneratingPdf(false);

      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: filename,
        });
      } else if (navigator.share) {
        await navigator.share({
          files: [pdfFile],
          title: filename,
        });
      } else {
        // Desktop Fallback: Download PDF file & Open WhatsApp Web
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        window.open("https://api.whatsapp.com/send", "_blank");
      }
    } catch (err) {
      console.error("WhatsApp share error:", err);
      setIsGeneratingPdf(false);
      window.open("https://api.whatsapp.com/send", "_blank");
    }
  };

  return (
    <div className="freight-receipt-page min-h-[calc(100vh-68px)] bg-slate-900 p-2 sm:p-4 text-slate-100 flex flex-col overflow-y-auto font-sans relative">

      {/* Print Media CSS Overrides (Fixes black background, L-border, & ensures single half-page A4 print) */}
      <style>{`
        @media print {
          html, body {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .freight-receipt-page {
            background: #ffffff !important;
            min-height: 0 !important;
            height: auto !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .freight-print-wrapper {
            position: static !important;
            opacity: 1 !important;
            pointer-events: auto !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 185mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: 2px solid #000000 !important;
            box-sizing: border-box !important;
          }
          @page {
            size: A4 portrait;
            margin: 8mm;
          }
        }
      `}</style>

      {/* Loading Modal / Overlay for WhatsApp PDF Generation */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md text-white p-4 print:hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Generating PDF...</h3>
              <p className="text-xs text-slate-400 mt-1">Preparing Freight Receipt PDF for WhatsApp sharing.</p>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="max-w-4xl w-full mx-auto bg-slate-800 px-3 sm:px-4 py-2.5 rounded-xl border border-slate-700 shadow-lg flex flex-wrap justify-between items-center gap-2 shrink-0 print:hidden mb-3">
        <div className="flex items-center gap-3">
          <h1 className="text-sm sm:text-lg font-black text-amber-400 flex items-center gap-2">
            <Receipt className="w-5 h-5 sm:w-6 sm:h-6" /> Freight Receipt Generator
          </h1>
        </div>

        {/* Financial Year Selector */}
        <div className="flex items-center gap-2">
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
                ref={inputLrNoRef}
                type="text"
                value={selectedLrNo}
                onChange={(e) => handleLrNumberChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    inputTruckNoRef.current?.focus();
                  }
                }}
                placeholder="ENTER LR NO."
                className="w-full px-2 py-1 bg-slate-950 border border-slate-600 rounded font-mono font-bold text-amber-400 text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-0.5">
                Truck No.
              </label>
              <input
                ref={inputTruckNoRef}
                type="text"
                value={truckNo}
                onChange={(e) => setTruckNo(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    inputWeightRef.current?.focus();
                  }
                }}
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
                ref={inputWeightRef}
                type="number"
                value={weightKgs}
                onChange={(e) => setWeightKgs(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    inputRateRef.current?.focus();
                  }
                }}
                placeholder="WEIGHT IN KGS"
                className="w-full px-2 py-1 bg-slate-950 border border-slate-600 rounded font-mono font-bold text-white text-xs focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase mb-0.5">
                Rate Per M.T.
              </label>
              <input
                ref={inputRateRef}
                type="number"
                value={ratePerMt}
                onChange={(e) => setRatePerMt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (receiptType === "CHEQUE") {
                      inputChequeRef.current?.focus();
                    } else {
                      inputRemarksRef.current?.focus();
                    }
                  }
                }}
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
                  ref={inputChequeRef}
                  type="number"
                  value={paidByCheque}
                  onChange={(e) => setPaidByCheque(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      inputRemarksRef.current?.focus();
                    }
                  }}
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
              ref={inputRemarksRef}
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handlePrint();
                }
              }}
              placeholder="ENTER REMARKS (IF ANY) - PRESS ENTER TO PRINT"
              className="w-full px-2 py-1 bg-slate-950 border border-slate-600 rounded text-white text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Action Buttons Row at Bottom of Form Card */}
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-700">
          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs uppercase shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer"
          >
            <Printer size={16} /> Print Receipt
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer"
          >
            <Download size={16} /> Export PDF
          </button>

          <button
            type="button"
            onClick={handleWhatsApp}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl text-xs uppercase shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105 cursor-pointer"
          >
            <Share2 size={16} /> WhatsApp
          </button>
        </div>

      </div>

      {/* Offscreen / Hidden Print Document (Capturable by PDF/Print without displaying on screen) */}
      <div className="fixed -left-[9999px] top-0 opacity-0 pointer-events-none print:static print:opacity-100 print:pointer-events-auto">
        <div
          ref={printRef}
          className="freight-print-wrapper bg-white text-black max-w-[185mm] w-full mx-auto font-sans border-2 border-black shadow-none rounded-none box-border p-0"
          style={{ width: "185mm", backgroundColor: "#ffffff", color: "#000000" }}
        >
          {/* 1. Top Jurisdiction Bar (Wall to wall with 2px bottom border) */}
          <div className="text-center font-extrabold uppercase tracking-wide text-[10px] sm:text-[10.5px] py-1 border-b-2 border-black text-black bg-white whitespace-nowrap">
            <u>SUBJECT TO WANKANER JURISDICTION</u>
          </div>

          {/* 2. 3-Column Company Header Row (Wall to wall with 2px black dividers) */}
          <div className="grid grid-cols-12 items-center border-b-2 border-black bg-white text-black py-1.5 px-0">
            {/* Left Logo Column (Col 2 with 2px black right border) */}
            <div className="col-span-2 flex flex-col items-center justify-center border-r-2 border-black pr-1 h-full">
              <img
                src={logoImg}
                alt="Wolego Transport Logo"
                className="h-20 sm:h-24 w-auto max-w-full object-contain mix-blend-multiply"
              />
            </div>

            {/* Center Title & Details Column (Col 7 - Clean Natural Spacing) */}
            <div className="col-span-7 border-r-2 border-black text-center flex flex-col items-center justify-center space-y-1 py-1 px-1">
              <h1 className="text-xl sm:text-2xl font-black text-[#009a44] font-serif tracking-wider uppercase leading-tight whitespace-nowrap">
                WOLEGO TRANSPORT
              </h1>
              <p className="text-[11px] sm:text-xs font-black italic text-[#800000] font-serif tracking-wide leading-tight whitespace-nowrap">
                EVERYTHING IS FAST
              </p>
              <div className="whitespace-nowrap flex justify-center items-center">
                <div className="bg-[#1e3a8a] text-white font-black text-[9px] sm:text-[10px] px-3 py-1 rounded-xs uppercase tracking-wider inline-flex items-center justify-center text-center leading-normal">
                  TRANSPORT CONTRACTOR AND COMMISSION AGENT
                </div>
              </div>
              <div className="text-[8.5px] sm:text-[9.5px] font-black text-[#800000] leading-snug text-center uppercase whitespace-nowrap">
                <div>SURVEY NUMBER NA 178P8, 27 NATIONAL HIGHWAY,</div>
                <div>CHANDRAPUR, WANKANER-363621 DISTRICT-MORBI ( GUJRAT )</div>
              </div>
            </div>

            {/* Right Contact Details Column (Col 3) */}
            <div className="col-span-3 pl-2 space-y-0.5 text-[8.5px] sm:text-[9.5px] font-black text-black text-left flex flex-col justify-center h-full whitespace-nowrap">
              <div>MOBILE NO. +91 99 79 111 555</div>
              <div>MOBILE NO. +91 81 41 111 555</div>
              <div>PAN NO. : DLTPS8567M</div>
              <div>GSTIN NO. : 24DLTPS8567M1ZT</div>
            </div>
          </div>

          {/* 3. Freight Receipt Title Banner (Wall to wall with 2px bottom border) */}
          <div className="bg-slate-900 text-white font-black text-xs sm:text-sm py-1 text-center uppercase tracking-widest border-b-2 border-black">
            FREIGHT RECEIPT
          </div>

          {/* 4. Main Form Table Matching Half-Page Printable Specifications */}
          <table className="w-full border-collapse text-xs sm:text-sm">
            <tbody>
              <tr>
                <td className="w-1/2 p-2 font-extrabold uppercase bg-gray-100 border-r-2 border-b-2 border-black text-black">
                  TRUCK NO.
                </td>
                <td className="w-1/2 p-2 font-mono font-extrabold text-sm sm:text-base uppercase text-center border-b-2 border-black text-black">
                  {truckNo || "-"}
                </td>
              </tr>

              <tr>
                <td className="w-1/2 p-2 font-extrabold uppercase bg-gray-100 border-r-2 border-b-2 border-black text-black">
                  TOTAL WEIGHT IN KGS
                </td>
                <td className="w-1/2 p-2 font-mono font-extrabold text-sm sm:text-base text-center border-b-2 border-black text-black">
                  {weightKgs ? numericWeight.toLocaleString("en-IN") : "-"}
                </td>
              </tr>

              <tr>
                <td className="w-1/2 p-2 font-extrabold uppercase bg-gray-100 border-r-2 border-b-2 border-black text-black">
                  RATE PER M.T.
                </td>
                <td className="w-1/2 p-2 font-mono font-extrabold text-sm sm:text-base text-center border-b-2 border-black text-black">
                  {ratePerMt ? numericRate.toLocaleString("en-IN") : "-"}
                </td>
              </tr>

              <tr>
                <td className="w-1/2 p-2 font-extrabold uppercase bg-gray-100 border-r-2 border-b-2 border-black text-black">
                  TOTAL FREIGHT
                </td>
                <td className="w-1/2 p-2 font-mono font-extrabold text-base sm:text-lg text-center border-b-2 border-black text-black">
                  {calculatedTotalFreight > 0 ? `₹ ${calculatedTotalFreight.toLocaleString("en-IN")}` : "-"}
                </td>
              </tr>

              {receiptType === "CHEQUE" ? (
                <>
                  <tr>
                    <td className="w-1/2 p-2 font-extrabold uppercase bg-gray-100 border-r-2 border-b-2 border-black text-black">
                      PAID BY CHEQUE
                    </td>
                    <td className="w-1/2 p-2 font-mono font-extrabold text-sm sm:text-base text-center border-b-2 border-black text-black">
                      {paidByCheque ? `₹ ${numericPaidCheque.toLocaleString("en-IN")}` : "-"}
                    </td>
                  </tr>

                  <tr>
                    <td className="w-1/2 p-2 font-extrabold uppercase bg-gray-100 border-r-2 border-b-2 border-black text-black">
                      CASH PAID
                    </td>
                    <td className="w-1/2 p-2 font-mono font-extrabold text-sm sm:text-base text-center border-b-2 border-black text-black">
                      {calculatedTotalFreight > 0 ? `₹ ${calculatedCashPaid.toLocaleString("en-IN")}` : "-"}
                    </td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td className="w-1/2 p-2 font-extrabold uppercase bg-gray-100 border-r-2 border-b-2 border-black text-black">
                    CASH PAID
                  </td>
                  <td className="w-1/2 p-2 font-mono font-extrabold text-sm sm:text-base text-center border-b-2 border-black text-black">
                    {calculatedTotalFreight > 0 ? `₹ ${calculatedTotalFreight.toLocaleString("en-IN")}` : "-"}
                  </td>
                </tr>
              )}

              <tr>
                <td className="w-1/2 p-2 font-extrabold text-xs sm:text-sm uppercase bg-gray-100 border-r-2 border-black text-red-600">
                  REMARKS
                </td>
                <td className="w-1/2 p-2 font-extrabold text-xs sm:text-sm text-center text-red-600 uppercase">
                  {remarks || "-"}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
