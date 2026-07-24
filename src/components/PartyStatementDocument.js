import React, { useRef, useEffect } from "react";
import { Printer, Download, Share2, ArrowLeft, X } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function PartyStatementDocument({
  partyName = "",
  fromDate = "",
  toDate = "",
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
      } else if (autoAction === "whatsapp") {
        await handleWhatsApp();
        if (onClose) onClose();
      }
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAction]);

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

  const formatWeight = (val) => {
    if (val === undefined || val === null || val === "") return "0.000";
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return num.toFixed(3);
  };

  const formatAmount = (val) => {
    if (val === undefined || val === null || val === "") return "0.00";
    const num = parseFloat(val);
    if (isNaN(num)) return "0.00";
    return num.toFixed(2);
  };

  const formatTotalAmountDetail = (val) => {
    if (val === undefined || val === null || val === "") return "0.000000";
    const num = parseFloat(val);
    if (isNaN(num)) return "0.000000";
    return num.toFixed(6);
  };

  const calculateRowFreight = (r) => {
    if (r.freightAmount && parseFloat(r.freightAmount) > 0) {
      return parseFloat(r.freightAmount);
    }
    const w = parseFloat(r.weightKgs) || 0;
    const rate = parseFloat(r.ratePerTon) || 0;
    if (w > 1000) {
      return (w / 1000) * rate;
    }
    return w * rate;
  };

  const totalAmountWTax = records.reduce((sum, r) => sum + calculateRowFreight(r), 0);
  const totalAmountFinal = records.reduce(
    (sum, r) => sum + (parseFloat(r.netTotalAmount) || parseFloat(r.totalWithGst) || calculateRowFreight(r)),
    0
  );

  // Direct Browser Print
  const handlePrint = () => {
    window.print();
  };

  // High-Quality PDF Export with Proportional Aspect Ratio
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
      const safePartyName = partyName.replace(/[^a-zA-Z0-9]/g, "_") || "Party";
      pdf.save(`Party_Statement_${safePartyName}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    }
  };

  // WhatsApp Share Function with Proportional Aspect Ratio
  const handleWhatsApp = async () => {
    if (!printRef.current) return;
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const pdfBlob = pdf.output("blob");

      const safeParty = partyName.replace(/[^a-zA-Z0-9]/g, "_") || "Statement";
      const file = new File([pdfBlob], `Party_Statement_${safeParty}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Party Statement - ${partyName}`,
          text: `Please find attached Party Statement of ${partyName} from Wolego Transport.`,
        });
      } else {
        const textMsg = encodeURIComponent(
          `*WOLEGO TRANSPORT - Party Statement*\n*Party:* ${partyName}\n*Period:* ${formatDateDisplay(
            fromDate
          )} to ${formatDateDisplay(toDate)}\n*Total LRs:* ${records.length}\n*Total Amount:* ₹${formatAmount(
            totalAmountFinal
          )}`
        );
        window.open(`https://api.whatsapp.com/send?text=${textMsg}`, "_blank");
      }
    } catch (err) {
      console.error("WhatsApp share failed:", err);
    }
  };

  // Default dates display
  const displayFromDate = fromDate ? formatDateDisplay(fromDate) : "01/04/2026";
  const displayToDate = toDate ? formatDateDisplay(toDate) : formatDateDisplay(new Date());

  return (
    <div className="fixed inset-0 z-50 bg-slate-100 overflow-y-auto flex flex-col items-center justify-start p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto text-black">
      {/* Top Floating Control Bar (Clean light styling, hidden when printing) */}
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
              {partyName || "Selected Party"} | {displayFromDate} - {displayToDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded text-xs uppercase shadow flex items-center gap-1 transition-all"
          >
            <Printer size={14} /> Print
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded text-xs transition-all flex items-center gap-1 shadow font-bold"
          >
            <Download size={14} /> PDF
          </button>
          <button
            onClick={handleWhatsApp}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white font-black rounded text-xs transition-all flex items-center gap-1 shadow font-bold"
          >
            <Share2 size={14} /> Share
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

      {/* Actual A4 Printable Statement Container */}
      <div
        ref={printRef}
        className="w-[210mm] bg-white text-black p-8 font-sans border border-slate-300 shadow-lg print:shadow-none print:border-none print:w-full text-xs box-border my-1"
        style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
      >
        {/* Top Header */}
        <div className="text-center mb-1">
          <span className="text-[11px] underline font-medium text-slate-900">
            Subject to Wankaner Jurisdiction
          </span>
        </div>

        {/* Brand & Mobile */}
        <div className="mb-2">
          <h1 className="text-2xl font-bold tracking-wide uppercase my-0 font-sans text-black">
            WOLEGO TRANSPORT
          </h1>
          <div className="text-[11px] font-bold mt-2 text-black">
            Mobile No.
          </div>
          {/* Double line separator */}
          <div className="border-b-2 border-t border-black h-[3px] my-1"></div>
        </div>

        {/* Title Bar */}
        <div className="my-2">
          <h2 className="text-sm font-bold text-black">
            Consignee L/R Register of M/s.{partyName || ""}
          </h2>
          <div className="flex justify-between items-center text-[11px] font-bold text-black mt-1">
            <span>
              FOR THE PERIOD FROM :{displayFromDate} TO {displayToDate}
            </span>
            <span className="mr-2">PAGE NO. : &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;1</span>
          </div>
        </div>

        {/* Statement Table */}
        <table className="w-full border-collapse border border-black text-left text-[10px] my-2">
          <thead>
            <tr className="border-b border-black bg-white font-bold text-black">
              <th className="border border-black p-1 text-center w-10">L/R<br />Number</th>
              <th className="border border-black p-1 text-left w-20">Date of<br />L/R</th>
              <th className="border border-black p-1 text-left">Destination and<br />Material Description</th>
              <th className="border border-black p-1 text-left w-28">Truck<br />Number</th>
              <th className="border border-black p-1 text-right w-20">Weight<br />in MT</th>
              <th className="border border-black p-1 text-right w-16">Rate/<br />Ton</th>
              <th className="border border-black p-1 text-right w-20">Amount<br />W/Tax</th>
              <th className="border border-black p-1 text-right w-24">Total<br />Amount</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r, index) => {
              const amtWTax = calculateRowFreight(r);
              const totalAmt = parseFloat(r.netTotalAmount) || parseFloat(r.totalWithGst) || amtWTax;
              const consignorName = r.consignorName || "-";

              const materialDesc = r.descriptionOfGoods
                ? `${r.toPlace || ""} - ${r.descriptionOfGoods}`
                : r.toPlace || "-";

              return (
                <React.Fragment key={r.id || index}>
                  {/* Main LR Row */}
                  <tr className="border-t border-black text-black font-medium">
                    <td className="border-x border-black p-1 text-center font-bold">{r.lrNumber || index + 1}</td>
                    <td className="border-x border-black p-1 text-left whitespace-nowrap">{formatDateDisplay(r.dateTime)}</td>
                    <td className="border-x border-black p-1 text-left uppercase font-bold">{materialDesc}</td>
                    <td className="border-x border-black p-1 text-left font-bold uppercase whitespace-nowrap">{r.truckNo || "-"}</td>
                    <td className="border-x border-black p-1 text-right font-bold">{formatWeight(r.weightKgs)}</td>
                    <td className="border-x border-black p-1 text-right">{formatAmount(r.ratePerTon)}</td>
                    <td className="border-x border-black p-1 text-right font-bold">{formatAmount(amtWTax)}</td>
                    <td className="border-x border-black p-1 text-right font-bold">{formatTotalAmountDetail(totalAmt)}</td>
                  </tr>

                  {/* Sub-row for Consignor detail */}
                  <tr className="border-b border-black text-black font-bold">
                    <td className="border-x border-black p-1"></td>
                    <td className="border-x border-black p-1"></td>
                    <td className="border-x border-black p-1"></td>
                    <td colSpan="5" className="border-r border-black p-1 pl-4 uppercase">
                      Consignor :{consignorName}
                    </td>
                  </tr>
                </React.Fragment>
              );
            })}

            {records.length === 0 && (
              <tr>
                <td colSpan="8" className="p-8 text-center text-slate-500 font-bold text-sm italic">
                  No loading records found for the selected party and date period.
                </td>
              </tr>
            )}
          </tbody>

          {/* Footer Totals */}
          {records.length > 0 && (
            <tfoot>
              <tr className="bg-[#cbd5e1] font-bold text-black border-t-2 border-black">
                <td colSpan="6" className="p-1.5 text-right uppercase tracking-wider text-xs border-r border-black font-bold">
                  TOTAL
                </td>
                <td className="p-1.5 text-right text-xs border-r border-black font-bold">
                  {formatAmount(totalAmountWTax)}
                </td>
                <td className="p-1.5 text-right text-xs font-bold">
                  {formatAmount(totalAmountFinal)}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
