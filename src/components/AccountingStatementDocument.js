import React, { useRef, useEffect } from "react";
import { Printer, Download, ArrowLeft, X, CheckCircle2, Clock } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoImg from "../assets/logo.png";

export default function AccountingStatementDocument({
  activeTab = "PARTY", // "PARTY" or "TRUCK"
  selectedFY = "ALL",
  selectedPartyName = "ALL",
  selectedTruckNo = "ALL",
  statusFilter = "ALL",
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

  const getLRFreightAmount = (lr) => {
    if (!lr) return 0;
    const net = parseFloat(lr.netTotalAmount);
    if (!isNaN(net) && net > 0) return net;

    const totalGst = parseFloat(lr.totalWithGst);
    if (!isNaN(totalGst) && totalGst > 0) return totalGst;

    const freight = parseFloat(lr.freightAmount);
    if (!isNaN(freight) && freight > 0) return freight;

    const w = parseFloat(lr.weightKgs) || 0;
    const r = parseFloat(lr.ratePerTon) || 0;
    if (w > 0 && r > 0) {
      return w > 1000 ? Math.round((w / 1000) * r) : Math.round(w * r);
    }
    return net || 0;
  };

  const getPartyName = (lr) => {
    if (!lr) return "-";
    const status = (lr.toPayOrPaid || "TBB").trim().toUpperCase();
    if (status === "PAID") {
      return lr.consignorName?.trim() || lr.consigneeName?.trim() || "-";
    }
    if (status === "TBB") {
      return lr.consigneeName?.trim() || lr.consignorName?.trim() || "-";
    }
    const debit = lr.debitAmountTo?.trim()?.toUpperCase();
    if (debit === "CONSIGNEE") return lr.consigneeName?.trim() || "-";
    if (debit === "CONSIGNOR") return lr.consignorName?.trim() || "-";
    return lr.consigneeName?.trim() || lr.consignorName?.trim() || "-";
  };

  // Calculate Totals
  const totalBilled = records.reduce((sum, lr) => sum + getLRFreightAmount(lr), 0);
  const totalPaid = records.reduce((sum, lr) => {
    const isPaid = activeTab === "PARTY" ? lr.partyPaymentStatus === "PAID" : lr.truckPaymentStatus === "PAID";
    return isPaid ? sum + getLRFreightAmount(lr) : sum;
  }, 0);
  const totalPending = totalBilled - totalPaid;

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
      pdf.save(`Accounting_Statement_${activeTab}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    }
  };

  const todayStr = formatDateDisplay(new Date().toISOString().split("T")[0]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md overflow-y-auto flex flex-col items-center justify-start p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto text-black">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 4mm;
          }
          html, body, #root {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>

      {/* Top Control Bar (Hidden during printing) */}
      <div className="w-full max-w-[210mm] bg-slate-800 border border-slate-700 rounded-xl p-3 mb-3 shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-2 z-50 print:hidden text-white">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-amber-400">
              Accounting Statement Preview ({records.length} Records)
            </h2>
            <p className="text-xs text-slate-300 font-mono">
              Type: {activeTab === "PARTY" ? "Party Ledger" : "Truck Ledger"} | FY: {selectedFY} | Printed: {todayStr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer size={15} /> Print (A4)
          </button>
          <button
            onClick={handleExportPDF}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs uppercase shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download size={15} /> Export PDF
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Actual A4 Printable Statement Container */}
      <div
        ref={printRef}
        className="print-document print-container w-[210mm] bg-white text-black p-6 font-sans border border-slate-300 shadow-2xl print:shadow-none print:border-none print:w-full text-xs box-border my-1"
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

        {/* Statement Title & Metadata Grid */}
        <div className="bg-slate-100 border border-slate-400 rounded p-2.5 mb-3">
          <div className="flex justify-between items-center border-b border-slate-300 pb-1.5 mb-1.5">
            <h2 className="text-sm font-extrabold text-black uppercase tracking-wide">
              {activeTab === "PARTY" ? "PARTY ACCOUNTING STATEMENT" : "TRUCK ACCOUNTING STATEMENT"}
            </h2>
            <span className="text-xs font-mono font-bold text-slate-800">
              DATE: {todayStr}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[11px]">
            <div>
              <span className="font-bold text-slate-700">Financial Year:</span>{" "}
              <span className="font-semibold text-black">{selectedFY === "ALL" ? "All Financial Years" : `FY ${selectedFY}`}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Filter Party:</span>{" "}
              <span className="font-semibold text-black">{selectedPartyName}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Status Filter:</span>{" "}
              <span className="font-semibold uppercase text-black">{statusFilter}</span>
            </div>
            <div>
              <span className="font-bold text-slate-700">Filter Truck:</span>{" "}
              <span className="font-semibold text-black">{selectedTruckNo}</span>
            </div>
          </div>
        </div>

        {/* Summary Figures Box */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="border border-slate-400 rounded p-2 bg-slate-50 text-center">
            <div className="text-[10px] uppercase font-bold text-slate-600">Total Billed Amount</div>
            <div className="text-sm font-extrabold font-mono text-black">₹ {totalBilled.toLocaleString("en-IN")}</div>
          </div>
          <div className="border border-emerald-500 rounded p-2 bg-emerald-50 text-center">
            <div className="text-[10px] uppercase font-bold text-emerald-800">Total Received / Paid</div>
            <div className="text-sm font-extrabold font-mono text-emerald-900">₹ {totalPaid.toLocaleString("en-IN")}</div>
          </div>
          <div className="border border-amber-500 rounded p-2 bg-amber-50 text-center">
            <div className="text-[10px] uppercase font-bold text-amber-800">Outstanding Balance</div>
            <div className="text-sm font-extrabold font-mono text-amber-900">₹ {totalPending.toLocaleString("en-IN")}</div>
          </div>
        </div>

        {/* Main Accounting Table */}
        <table className="w-full border-collapse border border-black text-left text-[10px]">
          <thead>
            <tr className="bg-slate-200 border-b border-black font-bold text-black uppercase">
              <th className="border border-black p-1.5 text-center w-8">#</th>
              <th className="border border-black p-1.5 text-center w-14">LR No.</th>
              <th className="border border-black p-1.5 text-center w-20">Date</th>
              <th className="border border-black p-1.5 text-left">Party Name</th>
              <th className="border border-black p-1.5 text-left w-24">Truck No.</th>
              <th className="border border-black p-1.5 text-left">Route / Goods</th>
              <th className="border border-black p-1.5 text-right w-22">Net Amount</th>
              <th className="border border-black p-1.5 text-center w-28">Payment Details</th>
            </tr>
          </thead>
          <tbody>
            {records.map((lr, index) => {
              const partyName = getPartyName(lr);
              const isPaid = activeTab === "PARTY" ? lr.partyPaymentStatus === "PAID" : lr.truckPaymentStatus === "PAID";
              const paidDate = activeTab === "PARTY" ? lr.partyPaidDate : lr.truckPaidDate;
              const chequeNo = activeTab === "PARTY" ? lr.partyChequeNo : lr.truckChequeNo;
              const amount = getLRFreightAmount(lr);

              const routeStr = `${lr.fromPlace || "-"} → ${lr.toPlace || "-"}`;
              const goodsStr = lr.descriptionOfGoods || lr.bundles || "";

              return (
                <tr key={lr.id || index} className="border-b border-black text-black font-medium">
                  <td className="border-x border-black p-1 text-center font-mono">{index + 1}</td>
                  <td className="border-x border-black p-1 text-center font-mono font-bold">{lr.lrNumber || "-"}</td>
                  <td className="border-x border-black p-1 text-center font-mono whitespace-nowrap">{formatDateDisplay(lr.dateTime)}</td>
                  <td className="border-x border-black p-1 font-semibold uppercase">{partyName}</td>
                  <td className="border-x border-black p-1 font-mono uppercase">{lr.truckNo || "-"}</td>
                  <td className="border-x border-black p-1">
                    <div className="font-semibold">{routeStr}</div>
                    {goodsStr && <div className="text-[9px] text-slate-600 italic">{goodsStr}</div>}
                  </td>
                  <td className="border-x border-black p-1 text-right font-mono font-bold">
                    ₹ {amount.toLocaleString("en-IN")}
                  </td>
                  <td className="border-x border-black p-1 text-center font-mono">
                    {isPaid ? (
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[9px] border border-emerald-400">
                          ✓ PAID
                        </span>
                        {paidDate && <span className="text-[9px] text-slate-700">📅 {paidDate}</span>}
                        {chequeNo && <span className="text-[9px] text-slate-900 font-bold">💳 {chequeNo}</span>}
                      </div>
                    ) : (
                      <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded text-[9px] border border-amber-400">
                        ⏳ PENDING
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}

            {records.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-500 font-bold italic text-xs">
                  No accounting records found for the selected filters.
                </td>
              </tr>
            )}
          </tbody>

          {/* Footer Totals */}
          {records.length > 0 && (
            <tfoot>
              <tr className="bg-slate-300 font-bold text-black border-t-2 border-black">
                <td colSpan={6} className="p-1.5 text-right uppercase tracking-wider text-xs border-r border-black font-extrabold">
                  TOTAL ({records.length} RECORDS):
                </td>
                <td className="p-1.5 text-right text-xs font-mono font-black border-r border-black">
                  ₹ {totalBilled.toLocaleString("en-IN")}
                </td>
                <td className="p-1.5 text-center text-[10px] font-mono font-extrabold">
                  PAID: ₹ {totalPaid.toLocaleString("en-IN")}
                </td>
              </tr>
            </tfoot>
          )}
        </table>

      </div>

    </div>
  );
}
