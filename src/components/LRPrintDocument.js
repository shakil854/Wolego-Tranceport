import React, { useRef } from "react";
import { Printer, Download, Share2, ArrowLeft } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function LRPrintDocument({ lrData, onClose, onShareWhatsApp }) {
  const printRef = useRef(null);

  if (!lrData) return null;

  // Direct Browser Print (A4 Portrait)
  const handlePrint = () => {
    window.print();
  };

  // High-Quality PDF Export
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High DPI resolution
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`LR_${lrData.lrNumber || "Document"}_WolegoTransport.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    }
  };

  // WhatsApp Message Generator
  const handleWhatsApp = () => {
    const text = `*WOLEGO TRANSPORT - LORRY RECEIPT*%0A` +
      `*LR No:* ${lrData.lrNumber}%0A` +
      `*Date:* ${lrData.dateTime ? new Date(lrData.dateTime).toLocaleDateString("en-IN") : "N/A"}%0A` +
      `*From:* ${lrData.fromPlace || "MORBI"} *To:* ${lrData.toPlace}%0A` +
      `*Truck No:* ${lrData.truckNo}%0A` +
      `----------------------------------%0A` +
      `*Consignor:* ${lrData.consignorName}%0A` +
      `*Consignee:* ${lrData.consigneeName}%0A` +
      `*Goods:* ${lrData.descriptionOfGoods} (${lrData.noOfArticles || 0} ${lrData.bundles || "BOX"})%0A` +
      `*Weight:* ${lrData.weightKgs} KGS%0A` +
      `*Freight:* Rs. ${lrData.freightAmount} (${lrData.toPayOrPaid})%0A` +
      `*GST Payable By:* ${lrData.gstPayableBy || "CONSIGNEE"}%0A` +
      `*Net Total:* Rs. ${lrData.netTotalAmount}%0A` +
      `----------------------------------%0A` +
      `Thank you for using Wolego Transport!`;

    if (onShareWhatsApp) {
      onShareWhatsApp(text);
    } else {
      const url = `https://api.whatsapp.com/send?text=${text}`;
      window.open(url, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 py-6 px-2 sm:px-4 text-slate-900">
      
      {/* Top Action Toolbar (Hidden during Print) */}
      <div className="max-w-4xl mx-auto mb-6 bg-slate-800 p-4 rounded-xl shadow-lg border border-slate-700 flex flex-wrap justify-between items-center gap-3 print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-300 hover:text-white font-bold text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} /> Back to Entry
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2 rounded-lg text-sm shadow-md transition-all transform hover:scale-105"
          >
            <Printer size={16} /> Print Straight A4
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2 rounded-lg text-sm shadow-md transition-all"
          >
            <Download size={16} /> Export PDF
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-black px-5 py-2 rounded-lg text-sm shadow-md transition-all"
          >
            <Share2 size={16} /> Send via WhatsApp
          </button>
        </div>
      </div>

      {/* Standard Printable A4 Portrait Document Container */}
      <div className="max-w-4xl mx-auto bg-white p-2 sm:p-6 shadow-2xl rounded-sm print:p-0 print:shadow-none font-sans text-xs">
        <div ref={printRef} className="border-2 border-slate-900 p-3 bg-white text-slate-900">
          
          {/* Header Bar */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-2">
            <div className="w-full">
              
              {/* Copy Checkboxes Header */}
              <div className="flex flex-wrap justify-between items-center text-[10px] font-bold border-b border-slate-300 pb-1 mb-2">
                <div className="flex space-x-4 uppercase">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-3 h-3 accent-slate-900" /> CONSIGNOR COPY
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" className="w-3 h-3 accent-slate-900" /> CONSIGNEE COPY
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" className="w-3 h-3 accent-slate-900" /> TRUCK COPY
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input type="checkbox" className="w-3 h-3 accent-slate-900" /> OFFICE COPY
                  </label>
                </div>
                <div className="italic text-slate-600 font-serif">EVERYTHING IS FAST</div>
              </div>

              {/* Company Banner & Logo */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                <div className="md:col-span-3 flex justify-center md:justify-start">
                  <div className="border-2 border-green-700 text-green-700 p-2 text-center rounded font-black tracking-tight leading-none">
                    <div className="text-3xl font-extrabold flex items-center justify-center">VV</div>
                    <div className="text-[9px] uppercase tracking-widest mt-1">EVERYTHING IS FAST</div>
                  </div>
                </div>

                <div className="md:col-span-9 text-center md:text-left">
                  <h1 className="text-2xl sm:text-3xl font-black text-green-800 tracking-wider font-serif uppercase">
                    WOLEGO TRANSPORT
                  </h1>
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">
                    TRANSPORT CONTRACTOR AND COMMISSION AGENT
                  </div>
                  <div className="text-[10px] text-slate-700 font-medium">
                    8-A NATIONAL HIGHWAY, CHOTILA ROAD, CHANDRAPUR, WANKANER-363 621, DIST. MORBI, (GUJ.)
                  </div>
                  <div className="text-[10px] font-bold text-slate-900 flex flex-wrap justify-center md:justify-start gap-x-4">
                    <span>GSTIN NO.: 24DLTPS8567M1ZT</span>
                    <span>PAN NO.: DLTPS8567M</span>
                    <span>MOBILE: +91 99 79 111 555 / 81 41 111 555</span>
                  </div>
                </div>
              </div>

              {/* Title Strip */}
              <div className="bg-slate-900 text-white font-extrabold text-center py-1 mt-2 tracking-widest text-xs uppercase flex justify-between px-3">
                <span>AT OWNER'S RISK</span>
                <span>GOODS CONSIGNMENT NOTE</span>
                <span>SUBJECT TO WANKANER JURISDICTION</span>
              </div>
            </div>
          </div>

          {/* LR Header Grid (LR NO, DATE, FROM, TO, DELIVERY AT) */}
          <div className="grid grid-cols-12 border-b-2 border-slate-900 font-bold text-[11px] divide-x-2 divide-slate-900">
            <div className="col-span-3 p-1.5 bg-slate-100 flex items-center justify-between">
              <span>L.R. NO. :</span>
              <span className="text-lg font-black text-rose-700 font-mono">{lrData.lrNumber}</span>
            </div>
            <div className="col-span-3 p-1.5 flex items-center justify-between">
              <span>DATE :</span>
              <span>{lrData.dateTime ? new Date(lrData.dateTime).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}</span>
            </div>
            <div className="col-span-3 p-1.5 flex items-center justify-between">
              <span>FROM :</span>
              <span className="uppercase font-extrabold">{lrData.fromPlace || "MORBI"}</span>
            </div>
            <div className="col-span-3 p-1.5 flex items-center justify-between">
              <span>TO :</span>
              <span className="uppercase font-extrabold">{lrData.toPlace}</span>
            </div>
          </div>

          {/* Truck No & Delivery At */}
          <div className="grid grid-cols-12 border-b-2 border-slate-900 font-bold text-[11px] divide-x-2 divide-slate-900">
            <div className="col-span-6 p-1.5 flex items-center gap-2">
              <span>DELIVERY AT :</span>
              <span className="font-extrabold uppercase bg-yellow-200 px-2 py-0.5 border border-slate-400">
                {lrData.deliveryAt || "DOOR"}
              </span>
            </div>
            <div className="col-span-6 p-1.5 flex items-center gap-2">
              <span>TRUCK NO. :</span>
              <span className="font-mono text-base font-black tracking-wider uppercase text-blue-900">
                {lrData.truckNo}
              </span>
            </div>
          </div>

          {/* Consignor & Consignee Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 border-b-2 border-slate-900 divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-900">
            
            {/* Consignor Column */}
            <div className="p-2 space-y-1">
              <div className="font-extrabold text-[11px] underline uppercase text-slate-800">
                CONSIGNOR'S NAME & ADDRESS
              </div>
              <div className="font-bold text-sm text-slate-950 uppercase">{lrData.consignorName}</div>
              <div className="text-[10px] text-slate-700 leading-tight uppercase min-h-[36px]">
                {lrData.consignorAddress}
              </div>
              <div className="font-mono font-bold text-[11px] pt-1 border-t border-slate-300">
                CONSIGNOR GSTIN NO. : <span className="text-blue-900">{lrData.consignorGst || "N/A"}</span>
              </div>
            </div>

            {/* Consignee Column */}
            <div className="p-2 space-y-1">
              <div className="font-extrabold text-[11px] underline uppercase text-slate-800">
                CONSIGNEE'S NAME & ADDRESS
              </div>
              <div className="font-bold text-sm text-slate-950 uppercase">{lrData.consigneeName}</div>
              <div className="text-[10px] text-slate-700 leading-tight uppercase min-h-[36px]">
                {lrData.consigneeAddress}
              </div>
              <div className="font-mono font-bold text-[11px] pt-1 border-t border-slate-300">
                CONSIGNEE GSTIN NO. : <span className="text-blue-900">{lrData.consigneeGst || "N/A"}</span>
              </div>
            </div>

          </div>

          {/* Goods Table */}
          <div className="border-b-2 border-slate-900">
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="bg-slate-200 border-b-2 border-slate-900 font-extrabold uppercase text-center divide-x-2 divide-slate-900">
                  <th className="p-1 w-24">NO. OF ARTICLE</th>
                  <th className="p-1">DESCRIPTION OF GOODS</th>
                  <th className="p-1 w-32">WEIGHT KGS</th>
                  <th className="p-1 w-28">RATE</th>
                  <th className="p-1 w-36">FREIGHT ({lrData.toPayOrPaid || "TO-PAY"})</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b-2 border-slate-900 font-semibold">
                <tr className="divide-x-2 divide-slate-900 text-center min-h-[80px]">
                  <td className="p-2 font-bold align-top">
                    {lrData.noOfArticles} <br />
                    <span className="text-[10px] font-normal">{lrData.bundles || "BOX"}</span>
                  </td>
                  <td className="p-2 align-top text-left">
                    <div className="font-bold uppercase text-sm">{lrData.descriptionOfGoods}</div>
                    <div className="text-[10px] text-slate-600 italic mt-1">
                      GST @ 5% PAYABLE BY {lrData.gstPayableBy || "CONSIGNEE"}
                    </div>
                  </td>
                  <td className="p-2 font-mono font-bold align-top">
                    {lrData.weightKgs} =K.G.
                  </td>
                  <td className="p-2 font-mono font-bold align-top">
                    {lrData.ratePerTon} {lrData.rateType || "P.M.T."}
                  </td>
                  <td className="p-2 font-mono font-bold text-right align-top text-sm">
                    {lrData.freightAmount}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Bottom Grid: Charges, GST, Invoice, Insurance, Bank details */}
          <div className="grid grid-cols-1 md:grid-cols-12 divide-y-2 md:divide-y-0 md:divide-x-2 divide-slate-900 border-b-2 border-slate-900">
            
            {/* Left Column (8 cols): Invoice, E-Way Bill, Disclaimer, Bank details */}
            <div className="md:col-span-7 p-2 space-y-2 text-[10px]">
              
              <div className="grid grid-cols-2 gap-2 border-b border-slate-300 pb-1 font-bold">
                <div>INVOICE NO. : <span className="font-mono text-sm">{lrData.billNumbers || "N/A"}</span></div>
                <div>VALUE RS. : <span className="font-mono text-sm">{lrData.invoiceValue || "N/A"}</span></div>
              </div>

              <div className="font-bold text-slate-900">
                GST PAYABLE BY: <span className="bg-yellow-300 px-2 py-0.5 border border-slate-800 rounded font-black">{lrData.gstPayableBy || "CONSIGNEE"}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono text-[10px]">
                <div>CONSIGNOR E-WAY BILL NO.: <strong>{lrData.consignorEwayBill || "N/A"}</strong></div>
                <div>CONSIGNEE E-WAY BILL NO.: <strong>{lrData.consigneeEwayBill || "N/A"}</strong></div>
              </div>

              <div className="font-extrabold uppercase text-red-700 bg-red-50 p-1 border border-red-200 text-[10px]">
                WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE. FULL TRUCK LOAD ACCEPTED ALL OVER INDIA.
              </div>

              {/* Insurance Declaration Box */}
              <div className="border border-slate-400 p-1.5 rounded text-[9px] bg-slate-50 space-y-1">
                <div className="font-extrabold uppercase underline">INSURANCE :</div>
                <div>THE CUSTOMER HAS STATED THAT HE HAS NOT INSURED THE CONSIGNMENT OR HAS INSURED CONSIGNMENT.</div>
                <div className="grid grid-cols-3 gap-1 pt-0.5 border-t border-slate-300 font-mono">
                  <span>COMPANY: ________</span>
                  <span>POLICY: ________</span>
                  <span>RISK: ________</span>
                </div>
              </div>

              {/* ICICI Bank Payment Details */}
              <div className="border-2 border-blue-900 p-2 rounded bg-blue-50/50 space-y-0.5 text-[10px]">
                <div className="font-black text-blue-950 uppercase border-b border-blue-200 pb-0.5">
                  ICICI BANK LTD (RTGS / NEFT PAYMENT)
                </div>
                <div className="grid grid-cols-2 gap-x-2 font-semibold">
                  <div>NAME : <span className="font-bold">WOLEGO TRANSPORT</span></div>
                  <div>ACCOUNT NO. : <span className="font-mono font-bold">118405500444</span></div>
                  <div>IFSC CODE : <span className="font-mono font-bold">ICIC0001184</span></div>
                  <div>BRANCH : <span className="font-bold">WANKANER</span></div>
                </div>
              </div>

            </div>

            {/* Right Column (5 cols): Freight Breakdown & Net Total */}
            <div className="md:col-span-5 p-2 space-y-1 bg-slate-50 flex flex-col justify-between font-mono">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold border-b border-slate-300 pb-1">
                  <span>FREIGHT</span>
                  <span>{lrData.freightAmount || 0}</span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Add : S-G.S.T. @ 2.5%</span>
                  <span>{lrData.sgstAmount || "0.00"}</span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Add : C-G.S.T. @ 2.5%</span>
                  <span>{lrData.cgstAmount || "0.00"}</span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Add : I-G.S.T. @ 5%</span>
                  <span>{lrData.igstAmount || "0.00"}</span>
                </div>

                <div className="flex justify-between font-bold border-t border-slate-300 pt-1">
                  <span>TOTAL WITH GST</span>
                  <span>{lrData.totalWithGst || lrData.freightAmount}</span>
                </div>

                <div className="flex justify-between text-slate-700">
                  <span>Other Charges</span>
                  <span>{lrData.otherCharges || "0.00"}</span>
                </div>

                <div className="flex justify-between text-slate-700 border-b border-slate-300 pb-1">
                  <span>Less : Advance Paid</span>
                  <span>{lrData.lessAdvancePaid || "0.00"}</span>
                </div>
              </div>

              <div className="border-t-2 border-slate-900 pt-2">
                <div className="bg-slate-900 text-white p-2 rounded flex justify-between items-center text-sm font-black">
                  <span>NET TOTAL:</span>
                  <span className="text-yellow-400 text-base">₹ {lrData.netTotalAmount || lrData.freightAmount}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Signature */}
          <div className="pt-6 pb-2 flex justify-between items-end px-4 text-slate-950 font-bold">
            <div className="text-[10px] italic text-slate-600">
              Driver Sig: __________________
            </div>
            <div className="text-right space-y-8">
              <div className="font-extrabold uppercase text-xs">FOR, WOLEGO TRANSPORT</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">(AUTHORISED SIGNATORY)</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
