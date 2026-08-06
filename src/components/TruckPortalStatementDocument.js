import React, { useRef, useEffect } from "react";
import { Printer, Download, ArrowLeft, X } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoImg from "../assets/logo.png";

export default function TruckPortalStatementDocument({
  userMobile = "",
  selectedTruckNo = "ALL",
  selectedFY = "ALL",
  totalBilled = 0,
  totalPaid = 0,
  balancePayable = 0,
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
    if (!dateVal || dateVal === "-") return "-";
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
      const truckLabel = selectedTruckNo === "ALL" ? "All_Trucks" : selectedTruckNo.replace(/[^a-zA-Z0-9]/g, "_");
      pdf.save(`Truck_Account_Statement_${truckLabel}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    }
  };

  const todayStr = formatDateDisplay(new Date().toISOString().split("T")[0]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto flex flex-col items-center justify-start p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto text-black">
      
      {/* Top Control Bar (Hidden on Print) */}
      <div className="w-full max-w-[210mm] bg-white border border-slate-300 rounded-lg p-3 mb-3 shadow-md flex flex-wrap items-center justify-between gap-3 sticky top-2 z-50 print:hidden text-slate-900">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-slate-200 rounded text-slate-800 transition-all border border-slate-300 cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Truck Statement Preview ({records.length} Entries)
            </h2>
            <p className="text-xs text-slate-600">
              Truck: <span className="font-bold text-slate-800">{selectedTruckNo}</span> | Mobile: {userMobile} | Date: {todayStr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-xs uppercase shadow flex items-center gap-1 transition-all cursor-pointer"
          >
            <Printer size={14} /> Print A4
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded text-xs transition-all flex items-center gap-1 shadow font-bold cursor-pointer"
          >
            <Download size={14} /> Export PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-100 hover:bg-rose-600 text-slate-700 hover:text-white rounded transition-all border border-slate-300 ml-1 cursor-pointer"
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

          {/* Right Column: Contact, PAN, GSTIN */}
          <div className="col-span-3 text-left text-[8.5px] sm:text-[9.5px] font-black text-slate-950 space-y-0.5 border-l border-slate-300 pl-2">
            <div>MOBILE NO. +91 99 79 111 555</div>
            <div>MOBILE NO. +91 81 41 111 555</div>
            <div>PAN NO. : DLTPS8567M</div>
            <div>GSTIN NO. : 24DLTPS8567M1ZT</div>
          </div>
        </div>

        {/* Document Title & Truck Info */}
        <div className="mb-3 bg-slate-50 p-2.5 border border-black rounded flex justify-between items-center">
          <div>
            <h2 className="text-sm font-black uppercase text-black">
              TRUCK ACCOUNT & PAYMENT STATEMENT
            </h2>
            <div className="text-xs font-bold text-slate-800 uppercase mt-0.5">
              TRUCK NO: <span className="font-extrabold text-black">{selectedTruckNo}</span>
              {userMobile && <span className="ml-3 text-slate-600 font-semibold">(Mobile: {userMobile})</span>}
            </div>
          </div>
          <div className="text-right text-[11px]">
            <div className="font-bold text-slate-800">
              F.Y. PERIOD: <span className="font-extrabold text-black">{selectedFY === "ALL" ? "ALL YEARS" : `F.Y. ${selectedFY}`}</span>
            </div>
            <div className="font-bold text-slate-800">
              STATEMENT DATE: <span className="font-extrabold text-black">{todayStr}</span>
            </div>
          </div>
        </div>

        {/* KPI Summary Cards Bar */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="border border-black p-2 bg-slate-50 text-center rounded">
            <div className="text-[10px] font-bold text-slate-700 uppercase">Total Freight Billed</div>
            <div className="text-sm font-black text-black font-mono">₹ {formatCurrency(totalBilled)}</div>
            <div className="text-[9px] text-slate-600 font-semibold">{records.length} Total Ledger Entries</div>
          </div>
          <div className="border border-black p-2 bg-emerald-50 text-center rounded">
            <div className="text-[10px] font-bold text-emerald-800 uppercase">Total Paid Amount</div>
            <div className="text-sm font-black text-emerald-900 font-mono">₹ {formatCurrency(totalPaid)}</div>
            <div className="text-[9px] text-emerald-700 font-semibold">Completed Payments</div>
          </div>
          <div className="border border-black p-2 bg-amber-50 text-center rounded">
            <div className="text-[10px] font-bold text-amber-800 uppercase">Balance Payable</div>
            <div className="text-sm font-black text-amber-900 font-mono">₹ {formatCurrency(balancePayable)}</div>
            <div className="text-[9px] text-amber-700 font-semibold">Outstanding Balance</div>
          </div>
        </div>

        {/* Records Table */}
        <table className="w-full border-collapse border border-black text-left text-[11px] mb-4">
          <thead>
            <tr className="bg-slate-200 text-black font-extrabold border-b border-black text-[10px] uppercase">
              <th className="border border-black p-1.5 text-center w-20">Txn Date</th>
              <th className="border border-black p-1.5 text-left w-24">Truck No.</th>
              <th className="border border-black p-1.5 text-left">Trip Details / Remark</th>
              <th className="border border-black p-1.5 text-right w-24">Amount (₹)</th>
              <th className="border border-black p-1.5 text-center w-24">Paid Date</th>
              <th className="border border-black p-1.5 text-center w-24">Status</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-slate-500 font-bold italic">
                  No accounting records found.
                </td>
              </tr>
            ) : (
              records.map((item, idx) => {
                const isPaid = item.status === "PAID";
                return (
                  <tr key={item.id || idx} className="border-b border-black font-medium text-black">
                    <td className="border border-black p-1.5 text-center font-mono whitespace-nowrap">
                      {formatDateDisplay(item.date)}
                    </td>
                    <td className="border border-black p-1.5 text-left font-bold uppercase font-mono whitespace-nowrap">
                      {item.truckNo || "-"}
                    </td>
                    <td className="border border-black p-1.5 text-left uppercase font-semibold">
                      {item.detail}
                    </td>
                    <td className="border border-black p-1.5 text-right font-bold font-mono text-xs whitespace-nowrap">
                      ₹ {formatCurrency(item.amount)}
                    </td>
                    <td className="border border-black p-1.5 text-center font-mono whitespace-nowrap font-bold text-[10.5px]">
                      {isPaid && item.paidDate && item.paidDate !== "-" ? (
                        <span className="text-emerald-900">{formatDateDisplay(item.paidDate)}</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="border border-black p-1.5 text-center whitespace-nowrap">
                      {isPaid ? (
                        <span className="font-extrabold text-emerald-700 uppercase text-[10px]">
                          ✓ PAID
                        </span>
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
                <td colSpan="3" className="border border-black p-2 text-right uppercase tracking-wider text-xs font-black">
                  GRAND TOTAL ({records.length} Entries)
                </td>
                <td className="border border-black p-2 text-right font-black font-mono text-xs whitespace-nowrap">
                  ₹ {formatCurrency(totalBilled)}
                </td>
                <td colSpan="2" className="border border-black p-2 text-center text-[10px]">
                  <span className="font-bold text-emerald-800">Paid: ₹{formatCurrency(totalPaid)}</span>
                  {balancePayable > 0 && (
                    <span className="font-bold text-amber-800 ml-2">Pending: ₹{formatCurrency(balancePayable)}</span>
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
