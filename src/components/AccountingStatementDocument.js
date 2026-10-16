import React, { useRef, useState, useEffect } from "react";
import { Printer, Download, ArrowLeft, X, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoImg from "../assets/logo.png";

export default function AccountingStatementDocument({
  activeTab = "CONSIGNOR", // "CONSIGNOR", "CONSIGNEE", "TRUCK", or "PARTY"
  selectedFY = "ALL",
  selectedPartyName = "ALL",
  selectedTruckNo = "ALL",
  statusFilter = "ALL",
  records = [],
  onClose,
  autoAction = null,
}) {
  const pageRefs = useRef([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const isTruck = activeTab === "TRUCK";
  const isConsignor = activeTab === "CONSIGNOR";
  const isConsignee = activeTab === "CONSIGNEE";

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
    }, 400);
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

  // Determine Party Name based on tab and LR properties
  const getPartyName = (lr) => {
    if (!lr) return "-";
    if (isConsignor) {
      return lr.consignorName?.trim() || "-";
    }
    if (isConsignee) {
      return lr.consigneeName?.trim() || "-";
    }
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

  // Determine Payment Info based on active tab
  const getPaymentInfo = (lr) => {
    if (isTruck) {
      return {
        isPaid: lr.truckPaymentStatus === "PAID",
        paidDate: lr.truckPaidDate,
        chequeNo: lr.truckChequeNo,
      };
    }
    // Consignor, Consignee, or general Party
    return {
      isPaid: lr.partyPaymentStatus === "PAID",
      paidDate: lr.partyPaidDate,
      chequeNo: lr.partyChequeNo,
    };
  };

  const getStatementTitle = () => {
    if (isConsignor) return "CONSIGNOR ACCOUNTING STATEMENT";
    if (isConsignee) return "CONSIGNEE ACCOUNTING STATEMENT";
    if (activeTab === "PARTY") return "PARTY ACCOUNTING STATEMENT";
    return "TRUCK ACCOUNTING STATEMENT";
  };

  const getLedgerTypeLabel = () => {
    if (isConsignor) return "Consignor Ledger";
    if (isConsignee) return "Consignee Ledger";
    if (activeTab === "PARTY") return "Party Ledger";
    return "Truck Ledger";
  };

  const safeRecords = Array.isArray(records) ? records : [];

  // Calculate Totals
  const totalBilled = safeRecords.reduce((sum, lr) => sum + getLRFreightAmount(lr), 0);
  const totalPaid = safeRecords.reduce((sum, lr) => {
    const payment = getPaymentInfo(lr);
    return payment.isPaid ? sum + getLRFreightAmount(lr) : sum;
  }, 0);
  const totalPending = totalBilled - totalPaid;

  // Chunk records into pages:
  // If records <= 12: all fit nicely on 1 page with letterhead and summary cards.
  // If records > 12: Page 1 holds 11 records; subsequent pages hold 15 records each.
  const PAGE_1_SIZE = 11;
  const SUBSEQUENT_PAGE_SIZE = 15;

  const chunkRecords = (recs) => {
    if (!recs || recs.length === 0) return [[]];
    if (recs.length <= 12) return [recs];

    const pagesArr = [];
    pagesArr.push(recs.slice(0, PAGE_1_SIZE));
    let cursor = PAGE_1_SIZE;
    while (cursor < recs.length) {
      pagesArr.push(recs.slice(cursor, cursor + SUBSEQUENT_PAGE_SIZE));
      cursor += SUBSEQUENT_PAGE_SIZE;
    }
    return pagesArr;
  };

  const pages = chunkRecords(safeRecords);

  const getGlobalIndex = (pageIdx, rowIdx) => {
    if (pageIdx === 0) return rowIdx + 1;
    return PAGE_1_SIZE + (pageIdx - 1) * SUBSEQUENT_PAGE_SIZE + rowIdx + 1;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = async () => {
    if (!pageRefs.current || pageRefs.current.length === 0) return;
    setIsExporting(true);
    setExportProgress(1);

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
      const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pageRefs.current[i];
        if (!pageEl) continue;

        setExportProgress(i + 1);

        const canvas = await html2canvas(pageEl, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#ffffff",
          windowWidth: 1000,
        });

        const imgData = canvas.toDataURL("image/png");

        if (i > 0) {
          pdf.addPage("a4", "p");
        }

        const imgProps = pdf.getImageProperties(imgData);
        const renderHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, Math.min(renderHeight, pdfHeight));
      }

      const fileType = activeTab.toLowerCase();
      pdf.save(`Accounting_Statement_${fileType}_${new Date().toISOString().slice(0, 10)}.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const todayStr = formatDateDisplay(new Date().toISOString().split("T")[0]);

  return (
    <div className="statement-modal-wrapper fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md overflow-y-auto flex flex-col items-center justify-start p-2 sm:p-4 print:p-0 print:bg-white print:static print:inset-auto print:overflow-visible text-black">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 5mm;
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
          .statement-modal-wrapper {
            position: static !important;
            overflow: visible !important;
            height: auto !important;
            background: transparent !important;
            padding: 0 !important;
            display: block !important;
          }
          .statement-page {
            page-break-after: always !important;
            break-after: page !important;
            margin: 0 auto !important;
            padding: 4mm 4mm !important;
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            min-height: auto !important;
            box-sizing: border-box !important;
          }
          .statement-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }
        }
      `}</style>

      {/* Top Control Bar (Hidden during printing) */}
      <div className="w-full max-w-[210mm] bg-slate-800 border border-slate-700 rounded-xl p-3 mb-3 shadow-xl flex flex-wrap items-center justify-between gap-3 sticky top-2 z-50 print:hidden text-white">
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              disabled={isExporting}
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 transition cursor-pointer"
              title="Back"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h2 className="text-sm sm:text-base font-bold text-amber-400">
              Accounting Statement Preview ({safeRecords.length} Records{pages.length > 1 ? ` • ${pages.length} Pages` : ""})
            </h2>
            <p className="text-xs text-slate-300 font-mono">
              Type: {getLedgerTypeLabel()} | FY: {selectedFY} | Printed: {todayStr}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            disabled={isExporting}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-lg text-xs uppercase shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer size={15} /> Print (A4)
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isExporting}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black rounded-lg text-xs uppercase shadow flex items-center gap-1.5 transition cursor-pointer min-w-[130px] justify-center"
          >
            {isExporting ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Exporting ({exportProgress}/{pages.length})...</span>
              </>
            ) : (
              <>
                <Download size={15} />
                <span>Export PDF{pages.length > 1 ? ` (${pages.length} Pages)` : ""}</span>
              </>
            )}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              disabled={isExporting}
              className="p-1.5 bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition cursor-pointer ml-1"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Multi-Page A4 Container */}
      <div className="flex flex-col items-center w-full">
        {pages.map((pageRecords, pageIdx) => {
          const isFirstPage = pageIdx === 0;
          const isLastPage = pageIdx === pages.length - 1;
          const pageStartIndex = isFirstPage ? 0 : PAGE_1_SIZE + (pageIdx - 1) * SUBSEQUENT_PAGE_SIZE;

          const pageBilledSubtotal = pageRecords.reduce((sum, lr) => sum + getLRFreightAmount(lr), 0);
          const pagePaidSubtotal = pageRecords.reduce((sum, lr) => {
            const p = getPaymentInfo(lr);
            return p.isPaid ? sum + getLRFreightAmount(lr) : sum;
          }, 0);

          return (
            <div
              key={pageIdx}
              ref={(el) => {
                if (el) pageRefs.current[pageIdx] = el;
              }}
              className="statement-page w-[210mm] min-h-[297mm] bg-white text-black p-6 font-sans border border-slate-300 shadow-2xl print:shadow-none print:border-none print:w-full print:min-h-0 print:p-0 print:mb-0 text-xs box-border mb-6 flex flex-col justify-between"
              style={{ fontFamily: "Arial, Helvetica, sans-serif" }}
            >
              <div>
                {/* PAGE 1: Full Letterhead, Metadata Card, & Summary Boxes */}
                {isFirstPage ? (
                  <>
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

                    {/* Statement Title & Metadata Grid */}
                    <div className="bg-slate-100 border border-slate-400 rounded p-2.5 mb-3">
                      <div className="flex justify-between items-center border-b border-slate-300 pb-1.5 mb-1.5">
                        <h2 className="text-sm font-extrabold text-black uppercase tracking-wide">
                          {getStatementTitle()}
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
                  </>
                ) : (
                  /* PAGE 2+: Compact Continuation Header */
                  <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <img src={logoImg} alt="Logo" className="h-10 w-auto object-contain" />
                      <div>
                        <div className="text-lg font-black text-[#009a44] tracking-wide font-serif uppercase leading-none">
                          WOLEGO TRANSPORT
                        </div>
                        <div className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wide mt-0.5">
                          {getStatementTitle()} <span className="text-amber-800 font-mono">(Page {pageIdx + 1} of {pages.length})</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right text-[9.5px] font-mono text-slate-900 space-y-0.5">
                      <div><strong>Date:</strong> {todayStr} | <strong>FY:</strong> {selectedFY === "ALL" ? "All FY" : `FY ${selectedFY}`}</div>
                      <div><strong>Filter Party:</strong> {selectedPartyName} | <strong>Status:</strong> {String(statusFilter || "ALL").toUpperCase()}</div>
                      <div><strong>Filter Truck:</strong> {selectedTruckNo}</div>
                    </div>
                  </div>
                )}

                {/* Main Accounting Table for current page */}
                <table className="w-full border-collapse border border-black text-left text-[10px]">
                  <thead>
                    <tr className="bg-slate-200 border-b border-black font-bold text-black uppercase">
                      <th className="border border-black p-1.5 text-center w-8">#</th>
                      <th className="border border-black p-1.5 text-center w-14">LR No.</th>
                      <th className="border border-black p-1.5 text-center w-20">Date</th>
                      <th className="border border-black p-1.5 text-left">
                        {isConsignor ? "Consignor Name" : isConsignee ? "Consignee Name" : "Party Name"}
                      </th>
                      <th className="border border-black p-1.5 text-left w-24">Truck No.</th>
                      <th className="border border-black p-1.5 text-left">Route / Goods</th>
                      <th className="border border-black p-1.5 text-right w-22">Net Amount</th>
                      <th className="border border-black p-1.5 text-center w-28">
                        {isConsignor ? "Consignor Payment" : isConsignee ? "Consignee Payment" : isTruck ? "Truck Payment" : "Payment Details"}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRecords.map((lr, idx) => {
                      const globalIndex = getGlobalIndex(pageIdx, idx);
                      const partyName = getPartyName(lr);
                      const payment = getPaymentInfo(lr);
                      const amount = getLRFreightAmount(lr);

                      const routeStr = `${lr.fromPlace || "-"} → ${lr.toPlace || "-"}`;
                      const goodsStr = lr.descriptionOfGoods || lr.bundles || "";

                      return (
                        <tr key={lr.id || globalIndex} className="border-b border-black text-black font-medium">
                          <td className="border-x border-black p-1 text-center font-mono">{globalIndex}</td>
                          <td className="border-x border-black p-1 text-center font-mono font-bold">{lr.lrNumber || "-"}</td>
                          <td className="border-x border-black p-1 text-center font-mono whitespace-nowrap">{formatDateDisplay(lr.dateTime || lr.date)}</td>
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
                            {payment.isPaid ? (
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded text-[9px] border border-emerald-400">
                                  ✓ PAID
                                </span>
                                {payment.paidDate && <span className="text-[9px] text-slate-700 whitespace-nowrap">📅 {payment.paidDate}</span>}
                                {payment.chequeNo && <span className="text-[9px] text-slate-900 font-bold whitespace-nowrap">💳 {payment.chequeNo}</span>}
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

                    {safeRecords.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-slate-500 font-bold italic text-xs">
                          No accounting records found for the selected filters.
                        </td>
                      </tr>
                    )}
                  </tbody>

                  {/* Table Footer: Subtotal on continuation pages, or Grand Total on the last page */}
                  {safeRecords.length > 0 && (
                    <tfoot>
                      {isLastPage ? (
                        <tr className="bg-slate-300 font-bold text-black border-t-2 border-black">
                          <td colSpan={6} className="p-1.5 text-right uppercase tracking-wider text-xs border-r border-black font-extrabold">
                            GRAND TOTAL ({safeRecords.length} RECORDS):
                          </td>
                          <td className="p-1.5 text-right text-xs font-mono font-black border-r border-black">
                            ₹ {totalBilled.toLocaleString("en-IN")}
                          </td>
                          <td className="p-1.5 text-center text-[10px] font-mono font-extrabold">
                            PAID: ₹ {totalPaid.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ) : (
                        <tr className="bg-slate-100 font-bold text-slate-700 border-t border-black text-[10px]">
                          <td colSpan={6} className="p-1.5 text-right italic font-semibold border-r border-black">
                            Carried forward to Page {pageIdx + 2}... (Records {pageStartIndex + 1} - {pageStartIndex + pageRecords.length} of {safeRecords.length})
                          </td>
                          <td className="p-1.5 text-right font-mono font-bold border-r border-black">
                            ₹ {pageBilledSubtotal.toLocaleString("en-IN")}
                          </td>
                          <td className="p-1.5 text-center text-[9px] font-mono font-bold text-slate-800">
                            PAID: ₹ {pagePaidSubtotal.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      )}
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Bottom Page Footer */}
              <div className="mt-4 pt-1.5 border-t border-slate-300 flex justify-between items-center text-[9px] text-slate-500 font-mono">
                <span>WOLEGO TRANSPORT • {getLedgerTypeLabel().toUpperCase()}</span>
                <span className="font-bold text-slate-700">Page {pageIdx + 1} of {pages.length}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
