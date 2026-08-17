import React, { useRef, useEffect } from "react";
import { Printer, Download, ArrowLeft, X, CheckCircle2, Clock } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoImg from "../assets/logo.png";

export default function PartyPortalStatementDocument({
  partyName = "",
  selectedFY = "ALL",
  partyTotalBilled = 0,
  partyTotalPaid = 0,
  partyTotalRemaining = 0,
  records = [],
  onClose,
  autoAction = null,
}) {
  const printRef = useRef(null);

  useEffect(() => {
    if (!autoAction) return;
    const timer = setTimeout(async () => {
      if (autoAction === "print") {
        window.print();
        if (onClose) onClose();
      } else if (autoAction === "pdf") {
        await handleExportPDF();
        if (onClose) onClose();
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAction]);

  const formatDateDisplay = (dateVal) => {
    if (!dateVal) return "-";
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

  const formatCurrency = (val) => {
    const num = parseFloat(val) || 0;
    return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handlePrint = () => {
    window.print();
  };

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
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const safePartyName = (partyName || "Party").replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`Party_Account_Statement_${safePartyName}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    }
  };

  const todayStr = formatDateDisplay(new Date().toISOString().split("T")[0]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto flex flex-col items-center justify-start p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto text-black">
      
      {/* Top Control Bar */}
      <div className="w-full max-w-[210mm] bg-white border border-slate-300 rounded-lg p-3 mb-3 shadow-md flex flex-wrap items-center justify-between gap-3 sticky top-2 z-50 print:hidden text-slate-900">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-800 transition-all border border-slate-300"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Party Statement Preview ({records.length} LRs)
            </h2>
            <p className="text-xs text-slate-600">
              {partyName} | F.Y.: {selectedFY === "ALL" ? "All Years" : selectedFY} | Date: {todayStr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-xs uppercase shadow flex items-center gap-1 transition-all"
          >
            <Printer size={14} /> Print A4
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded text-xs transition-all flex items-center gap-1 shadow font-bold"
          >
            <Download size={14} /> Export PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white rounded transition-all border border-slate-300 ml-1"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Printable A4 White Paper Sheet */}
      <div
        ref={printRef}
        className="print-document print-container w-[210mm] bg-white text-black p-8 font-sans border border-slate-300 shadow-lg print:shadow-none print:border-none print:w-full text-xs box-border my-1"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        {/* Top Header Jurisdiction */}
        <div className="text-center mb-1 border-b border-slate-900 pb-0.5">
          <span className="text-[10px] font-black uppercase underline tracking-wider text-slate-950">
            SUBJECT TO WANKANER JURISDICTION
          </span>
        </div>

        {/* Official Letterhead Header Banner & Logo */}
        <div className="grid grid-cols-12 gap-1 items-center mb-3 pb-2 border-b-2 border-slate-900">
          {/* Left Logo Column */}
          <div className="col-span-2 flex justify-center items-center">
            <img src={logoImg} alt="Wolego Transport Logo" className="h-20 sm:h-24 w-auto object-contain max-w-full" />
          </div>

          {/* Middle Column */}
          <div className="col-span-7 text-center flex flex-col items-center justify-center space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black text-[#009a44] tracking-wider font-serif uppercase leading-none my-0">
              WOLEGO TRANSPORT
            </h1>
            <div className="text-xs sm:text-sm font-black text-amber-900 italic font-serif leading-tight">
              EVERYTHING IS FAST
            </div>
            <div className="whitespace-nowrap">
              <span className="text-[9.5px] sm:text-[10.5px] font-black uppercase tracking-wider bg-blue-900 text-white px-2.5 py-0.5 inline-block rounded-sm">
                TRANSPORT CONTRACTOR AND COMMISSION AGENT
              </span>
            </div>
            <div className="text-[9px] sm:text-[10px] text-red-900 font-black tracking-tight uppercase leading-tight space-y-0.5 text-center">
              <div>SURVEY NUMBER NA 178P8, 27 NATIONAL HIGHWAY, CHANDRAPUR,</div>
              <div>WANKANER-363621 DISTRICT-MORBI ( GUJRAT )</div>
            </div>
          </div>

          {/* Right Column: Contact, PAN, GSTIN, Transport ID, Email */}
          <div className="col-span-3 text-left text-[8px] sm:text-[8.5px] font-black text-slate-950 space-y-0.5 border-l border-slate-300 pl-2">
            <div>MOBILE NO. +91 99 13 111 555</div>
            <div>OFFICE NO. +91 97 12 111 555</div>
            <div>PAN NO. : DLTPS8567M</div>
            <div>GSTIN NO. : 24DLTPS8567M1ZT</div>
            <div>TRANSPORT ID : TS000547462</div>
            <div className="whitespace-nowrap text-[7.5px] sm:text-[8px] font-black tracking-tight">EMAIL : Wolegotransport13@gmail.com</div>
          </div>
        </div>

        {/* Document Title & Party Info */}
        <div className="mb-3 bg-slate-50 p-2.5 border border-black rounded flex justify-between items-center">
          <div>
            <h2 className="text-sm font-black uppercase text-black">
              PARTY ACCOUNT & PAYMENT STATEMENT
            </h2>
            <div className="text-xs font-bold text-slate-800 uppercase mt-0.5">
              PARTY NAME: <span className="font-extrabold text-black">{partyName || "N/A"}</span>
            </div>
          </div>
          <div className="text-right text-[11px]">
            <div className="font-bold text-slate-800">
              F.Y. PERIOD: <span className="font-extrabold text-black">{selectedFY === "ALL" ? "ALL YEARS" : `F.Y. ${selectedFY}`}</span>
            </div>
            <div className="font-bold text-slate-800">
              DATE: <span className="font-extrabold text-black">{todayStr}</span>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="border border-black p-2 bg-slate-50 text-center rounded">
            <div className="text-[10px] font-bold text-slate-700 uppercase">Total Freight Billed</div>
            <div className="text-sm font-black text-black font-mono">₹ {formatCurrency(partyTotalBilled)}</div>
            <div className="text-[9px] text-slate-600 font-semibold">{records.length} Total LR Entries</div>
          </div>
          <div className="border border-black p-2 bg-emerald-50 text-center rounded">
            <div className="text-[10px] font-bold text-emerald-800 uppercase">Total Paid Amount</div>
            <div className="text-sm font-black text-emerald-900 font-mono">₹ {formatCurrency(partyTotalPaid)}</div>
            <div className="text-[9px] text-emerald-700 font-semibold">Received Amount</div>
          </div>
          <div className="border border-black p-2 bg-amber-50 text-center rounded">
            <div className="text-[10px] font-bold text-amber-800 uppercase">Pending Balance</div>
            <div className="text-sm font-black text-amber-900 font-mono">₹ {formatCurrency(partyTotalRemaining)}</div>
            <div className="text-[9px] text-amber-700 font-semibold">Outstanding Amount</div>
          </div>
        </div>

        {/* LR Records & Statements Table */}
        <table className="w-full border-collapse border border-black text-left text-[11px] mb-4">
          <thead>
            <tr className="bg-slate-200 text-black font-extrabold border-b border-black text-[10px] uppercase">
              <th className="border border-black p-1.5 text-center w-12">LR No.</th>
              <th className="border border-black p-1.5 text-center w-20">Date</th>
              <th className="border border-black p-1.5 text-left w-24">Truck No.</th>
              <th className="border border-black p-1.5 text-left">From &rarr; To</th>
              <th className="border border-black p-1.5 text-left">Goods Description</th>
              <th className="border border-black p-1.5 text-right w-24">Net Total (₹)</th>
              <th className="border border-black p-1.5 text-center w-28">Payment Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-slate-500 font-bold italic">
                  No LR statement records found for the selected year.
                </td>
              </tr>
            ) : (
              records.map((lr, idx) => {
                const isPaid = lr.partyPaymentStatus === "PAID";
                const netAmt = Number(lr.netTotalAmount) || 0;
                return (
                  <tr key={lr.id || idx} className="border-b border-black font-medium text-black">
                    <td className="border border-black p-1.5 text-center font-bold font-mono">
                      {lr.lrNumber || "-"}
                    </td>
                    <td className="border border-black p-1.5 text-center whitespace-nowrap font-mono">
                      {formatDateDisplay(lr.dateTime)}
                    </td>
                    <td className="border border-black p-1.5 text-left font-bold uppercase font-mono">
                      {lr.truckNo || "-"}
                    </td>
                    <td className="border border-black p-1.5 text-left uppercase font-semibold">
                      {lr.fromPlace} &rarr; {lr.toPlace}
                    </td>
                    <td className="border border-black p-1.5 text-left uppercase">
                      {lr.descriptionOfGoods || lr.bundles || "-"}
                    </td>
                    <td className="border border-black p-1.5 text-right font-bold font-mono text-xs">
                      ₹ {formatCurrency(netAmt)}
                    </td>
                    <td className="border border-black p-1.5 text-center">
                      {isPaid ? (
                        <div className="text-[10px]">
                          <span className="font-extrabold text-emerald-700 uppercase">✓ PAID</span>
                          {lr.partyPaidDate && (
                            <div className="text-[9px] text-slate-600 font-mono">
                              {formatDateDisplay(lr.partyPaidDate)}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="font-extrabold text-amber-700 uppercase text-[10px]">
                          ⏳ PENDING
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {records.length > 0 && (
            <tfoot>
              <tr className="bg-slate-200 font-bold text-black border-t-2 border-black">
                <td colSpan="5" className="border border-black p-2 text-right uppercase tracking-wider text-xs font-black">
                  GRAND TOTAL ({records.length} LRs)
                </td>
                <td className="border border-black p-2 text-right font-black font-mono text-xs">
                  ₹ {formatCurrency(partyTotalBilled)}
                </td>
                <td className="border border-black p-2 text-center text-[10px]">
                  <span className="font-bold text-emerald-800">Paid: ₹{formatCurrency(partyTotalPaid)}</span>
                  {partyTotalRemaining > 0 && (
                    <div className="font-bold text-amber-800">Pending: ₹{formatCurrency(partyTotalRemaining)}</div>
                  )}
                </td>
              </tr>
            </tfoot>
          )}
        </table>

        {/* Footer Note & Signatory */}
        <div className="mt-8 pt-4 border-t border-slate-300 flex justify-between items-end">
          <div className="text-[9px] text-slate-500 font-medium">
            This is a computer-generated account statement from Wolego Transport Portal.
          </div>
          <div className="text-center">
            <div className="h-10"></div>
            <div className="border-t border-black px-6 pt-1 font-bold text-[10px] uppercase">
              Authorized Signatory
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
