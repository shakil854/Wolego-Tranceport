import React, { useRef, useEffect, useState } from "react";
import { Printer, Download, Share2, ArrowLeft, FileSignature, X } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoImg from "../assets/logo.png";

export default function LRPrintDocument({ lrData, onClose, onShareWhatsApp, autoAction }) {
  const printRef = useRef(null);
  const fileInputRef = useRef(null);

  const [signatureImg, setSignatureImg] = useState(() => {
    return localStorage.getItem("wolego_digital_signature") || null;
  });

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setSignatureImg(base64);
      localStorage.setItem("wolego_digital_signature", base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setSignatureImg(null);
    localStorage.removeItem("wolego_digital_signature");
  };

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
    if (!dateVal) return new Date().toLocaleDateString("en-IN");
    if (typeof dateVal === "string" && dateVal.includes("-")) {
      const parts = dateVal.split("T")[0].split("-");
      if (parts.length === 3) {
        const [y, m, d] = parts;
        return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
      }
    }
    return new Date(dateVal).toLocaleDateString("en-IN");
  };

  // Direct Browser Print (Full A4 Page Portrait)
  const handlePrint = () => {
    window.print();
  };

  // High-Quality PDF Export
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High DPI
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`LR_${lrData.lrNumber || "Document"}_WolegoTransport.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    }
  };

  // Dynamic PDF Generator + WhatsApp Share Function (Shares actual PDF File)
  const handleWhatsApp = async () => {
    if (!printRef.current) return;
    try {
      // 1. Generate high-quality PDF blob
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      const filename = `LR_${lrData.lrNumber || "Document"}_WolegoTransport.pdf`;
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], filename, { type: "application/pdf" });

      const textSummary = `WOLEGO TRANSPORT - LORRY RECEIPT\nLR No: ${lrData.lrNumber}\nConsignor: ${lrData.consignorName}\nConsignee: ${lrData.consigneeName}\nNet Total: Rs. ${lrData.netTotalAmount || lrData.freightAmount}`;

      // 2. Use Web Share API if supported (Mobile Chrome, Safari, Android, Edge)
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          title: `LR #${lrData.lrNumber} - Wolego Transport`,
          text: textSummary,
          files: [pdfFile]
        });
      } else {
        // Fallback for desktop: auto download PDF + open WhatsApp
        pdf.save(filename);
        const encodedText = encodeURIComponent(
          `*WOLEGO TRANSPORT - LORRY RECEIPT*%0A` +
          `*LR No:* ${lrData.lrNumber}%0A` +
          `*Consignor:* ${lrData.consignorName}%0A` +
          `*Consignee:* ${lrData.consigneeName}%0A` +
          `*Truck No:* ${lrData.truckNo}%0A` +
          `*Net Total:* Rs. ${lrData.netTotalAmount || lrData.freightAmount}%0A` +
          `----------------------------------%0A` +
          `📄 *PDF document downloaded (${filename}). Please click attachment 📎 -> Document in WhatsApp to send!*`
        );
        window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
      }
    } catch (err) {
      console.error("WhatsApp PDF sharing error:", err);
      window.open(`https://api.whatsapp.com/send?text=LR%20No:%20${lrData.lrNumber}`, "_blank");
    }
  };

  const isAuto = Boolean(autoAction);

  return (
    <div className={isAuto ? "fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm print:bg-white print:static opacity-0 pointer-events-none print:opacity-100 print:pointer-events-auto" : "min-h-screen bg-slate-900 py-4 px-2 sm:px-4 text-slate-900 print:p-0 print:m-0 print:bg-white"}>

      {/* Top Action Toolbar (Hidden during Print) */}
      <div className="max-w-4xl mx-auto mb-4 bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-700 flex flex-wrap justify-between items-center gap-2 print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-300 hover:text-white font-bold text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
        >
          <ArrowLeft size={16} /> Back to Entry
        </button>

        <div className="flex flex-wrap items-center gap-2">
          {/* Digital Signature File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleSignatureUpload}
            accept="image/*"
            className="hidden"
          />

          {signatureImg ? (
            <button
              type="button"
              onClick={handleRemoveSignature}
              className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow transition-all"
              title="Remove Saved Digital Signature"
            >
              <X size={14} /> Remove Sign
            </button>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow transition-all"
              title="Upload Signature Image from Pendrive or Computer"
            >
              <FileSignature size={14} /> Upload Digital Sign
            </button>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-1.5 rounded-lg text-sm shadow-md transition-all transform hover:scale-105"
          >
            <Printer size={16} /> Print Full A4 Page
          </button>

          <button
            onClick={handleExportPDF}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-1.5 rounded-lg text-sm shadow-md transition-all"
          >
            <Download size={16} /> Export PDF
          </button>

          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-black px-4 py-1.5 rounded-lg text-sm shadow-md transition-all"
          >
            <Share2 size={16} /> Send via WhatsApp
          </button>
        </div>
      </div>

      {/* Standard Printable Full A4 Page Document */}
      <div className="max-w-4xl mx-auto bg-white p-3 sm:p-5 shadow-2xl rounded-sm print-container print:p-0 print:shadow-none font-sans text-xs">
        <div ref={printRef} className="border-2 border-slate-900 bg-white text-slate-900 min-h-[265mm] h-full flex flex-col justify-between print-document">

          <div className="flex-1 flex flex-col justify-between">
            {/* Header Bar */}
            <div className="border-b-2 border-slate-900 p-3 pb-2">

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
              <div className="grid grid-cols-12 gap-2 items-center my-1">
                <div className="col-span-3 flex justify-center items-center">
                  <img src={logoImg} alt="Wolego Transport Logo" className="h-16 sm:h-20 w-auto object-contain max-w-full" />
                </div>

                <div className="col-span-9 text-left">
                  <h1 className="text-2xl sm:text-3xl font-black text-green-800 tracking-wider font-serif uppercase leading-none">
                    WOLEGO TRANSPORT
                  </h1>
                  <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800 mt-1">
                    TRANSPORT CONTRACTOR AND COMMISSION AGENT
                  </div>
                  <div className="text-[10px] text-slate-700 font-medium leading-tight">
                    8-A NATIONAL HIGHWAY, CHOTILA ROAD, CHANDRAPUR, WANKANER-363 621, DIST. MORBI, (GUJ.)
                  </div>
                  <div className="text-[10px] font-bold text-slate-900 flex flex-wrap gap-x-4 mt-0.5">
                    <span>GSTIN NO.: 24DLTPS8567M1ZT</span>
                    <span>PAN NO.: DLTPS8567M</span>
                    <span>MOBILE: +91 99 79 111 555 / 81 41 111 555</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Title Strip */}
            <div className="bg-slate-900 text-white font-extrabold text-center py-1 tracking-wider text-xs uppercase flex justify-between px-3 border-b-2 border-slate-900">
              <span>AT OWNER'S RISK</span>
              <span>GOODS CONSIGNMENT NOTE</span>
              <span>SUBJECT TO WANKANER JURISDICTION</span>
            </div>

            {/* LR Header Grid (LR NO, DATE, FROM, TO) */}
            <div className="grid grid-cols-12 border-b-2 border-slate-900 font-bold text-[11px] divide-x-2 divide-slate-900">
              <div className="col-span-3 p-1.5 bg-slate-100 flex items-center gap-2">
                <span>L.R. NO. :</span>
                <span className="text-lg font-black text-rose-700 font-mono">{lrData.lrNumber}</span>
              </div>
              <div className="col-span-3 p-1.5 flex items-center gap-2">
                <span>DATE :</span>
                <span>{formatDateDisplay(lrData.dateTime)}</span>
              </div>
              <div className="col-span-3 p-1.5 flex items-center gap-2">
                <span>FROM :</span>
                <span className="uppercase font-extrabold">{lrData.fromPlace || ""}</span>
              </div>
              <div className="col-span-3 p-1.5 flex items-center gap-2">
                <span>TO :</span>
                <span className="uppercase font-extrabold">{lrData.toPlace || ""}</span>
              </div>
            </div>

            {/* Truck No & Delivery At */}
            <div className="grid grid-cols-12 border-b-2 border-slate-900 font-bold text-[11px] divide-x-2 divide-slate-900">
              <div className="col-span-6 p-1.5 flex items-center gap-2">
                <span>DELIVERY AT :</span>
                <span className="font-extrabold uppercase bg-yellow-200 px-2 py-0.5 border border-slate-400">
                  {lrData.deliveryAt || ""}
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
            <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900 min-h-[90px]">

              {/* Consignor Column */}
              <div className="p-2 space-y-1">
                <div className="font-extrabold text-[11px] underline uppercase text-slate-800">
                  CONSIGNOR'S NAME & ADDRESS
                </div>
                <div className="font-bold text-xs text-slate-950 uppercase whitespace-pre-line leading-tight">{lrData.consignorName}</div>
                <div className="text-[10px] text-slate-700 leading-normal uppercase whitespace-pre-line">
                  {lrData.consignorAddress}
                </div>
                <div className="font-mono font-bold text-[11px] pt-1 border-t border-slate-300 mt-1">
                  CONSIGNOR GSTIN NO. : <span className="text-blue-900">{lrData.consignorGst || ""}</span>
                </div>
              </div>

              {/* Consignee Column */}
              <div className="p-2 space-y-1">
                <div className="font-extrabold text-[11px] underline uppercase text-slate-800">
                  CONSIGNEE'S NAME & ADDRESS
                </div>
                <div className="font-bold text-sm text-slate-950 uppercase">{lrData.consigneeName}</div>
                <div className="text-[10px] text-slate-700 leading-normal uppercase whitespace-pre-line">
                  {lrData.consigneeAddress}
                </div>
                <div className="font-mono font-bold text-[11px] pt-1 border-t border-slate-300 mt-1">
                  CONSIGNEE GSTIN NO. : <span className="text-blue-900">{lrData.consigneeGst || ""}</span>
                </div>
              </div>

            </div>

            {/* Goods Table */}
            <div className="border-b-2 border-slate-900 min-h-[110px]">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-200 border-b-2 border-slate-900 font-extrabold uppercase text-center divide-x-2 divide-slate-900">
                    <th className="p-1.5 w-24">NO. OF ARTICLE</th>
                    <th className="p-1.5">DESCRIPTION OF GOODS</th>
                    <th className="p-1.5 w-32">WEIGHT</th>
                    <th className="p-1.5 w-28">RATE</th>
                    <th className="p-1.5 w-36">FREIGHT ({lrData.toPayOrPaid || "TO-PAY"})</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-b-2 border-slate-900 font-semibold">
                  <tr className="divide-x-2 divide-slate-900 text-center min-h-[80px]">
                    <td className="p-2 font-bold align-top">
                      <div className="min-h-[34px] flex flex-col justify-start">
                        <div>{lrData.noOfArticles}</div>
                        <span className="text-[10px] font-normal">{lrData.bundles || ""}</span>
                      </div>
                      {lrData.noOfArticles2 && (
                        <div className="mt-1 pt-1 border-t border-slate-900 min-h-[34px] flex flex-col justify-start">
                          <div>{lrData.noOfArticles2}</div>
                          <span className="text-[10px] font-normal">{lrData.bundles2 || "BUNDLE"}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-2 align-top text-left">
                      <div className="min-h-[34px] flex flex-col justify-start">
                        <div className="font-bold uppercase text-sm">{lrData.descriptionOfGoods}</div>
                      </div>
                      {lrData.noOfArticles2 && (
                        <div className="mt-1 pt-1 border-t border-slate-900 min-h-[34px] flex flex-col justify-start">
                          <div className="font-bold uppercase text-sm">{lrData.descriptionOfGoods2 || "SANITARYWARE"}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-2 font-mono font-bold align-top">
                      {lrData.weightKgs ? `${lrData.weightKgs} K.G.` : ""}
                    </td>
                    <td className="p-2 font-mono font-bold align-top">
                      {lrData.ratePerTon ? `${lrData.ratePerTon} ${lrData.rateType || ""}` : ""}
                    </td>
                    <td className="p-2 font-mono font-bold text-right align-top text-sm">
                      {lrData.freightAmount || ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Grid: Charges, GST, Invoice, Insurance, Bank details - Stretched to bottom border */}
            <div className="grid grid-cols-12 divide-x-2 divide-slate-900 flex-1 min-h-[400px]">

              {/* Left Column (7 cols): Full-width rows stretching edge-to-edge to main grid lines */}
              <div className="col-span-7 text-[10px] flex flex-col justify-between h-full">
                {/* 1. GST Payable By */}
                <div className="font-bold text-slate-900 border-b-2 border-slate-900 px-2 py-1.5">
                  GST PAYABLE BY: <span className="bg-yellow-300 px-2 py-0.5 border border-slate-800 rounded font-black">{lrData.gstPayableBy || "CONSIGNEE"}</span>
                </div>

                {/* 2. Invoice No */}
                <div className="font-bold border-b-2 border-slate-900 px-2 py-1.5">
                  INVOICE NO. : <span className="font-mono text-xs">{lrData.billNumbers || ""}</span>
                </div>

                {/* 3. Value Rs */}
                <div className="font-bold border-b-2 border-slate-900 px-2 py-1.5">
                  VALUE RS. : <span className="font-mono text-xs">{lrData.invoiceValue || ""}</span>
                </div>

                {/* 4. Consignor E-Way Bill */}
                <div className="font-mono text-[10px] border-b-2 border-slate-900 px-2 py-1.5">
                  CONSIGNOR E-WAY BILL: <strong>{lrData.consignorEwayBill || ""}</strong>
                </div>

                {/* 5. Consignee E-Way Bill */}
                <div className="font-mono text-[10px] border-b-2 border-slate-900 px-2 py-1.5">
                  CONSIGNEE E-WAY BILL: <strong>{lrData.consigneeEwayBill || ""}</strong>
                </div>

                {/* 6. Remarks / Disclaimer */}
                <div className="px-2 py-1">
                  <div className="font-extrabold uppercase text-red-700 bg-red-50 p-1 border-2 border-slate-900 text-[9.5px]">
                    {lrData.remarks || "WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE. FULL TRUCK LOAD ACCEPTED ALL OVER INDIA."}
                  </div>
                </div>

                {/* 7. Insurance Declaration Box */}
                <div className="px-2 py-1">
                  <div className="border-2 border-slate-900 p-1.5 rounded text-[9px] bg-slate-50 space-y-0.5">
                    <div className="font-extrabold uppercase underline">INSURANCE :</div>
                    <div>THE CUSTOMER HAS STATED THAT HE HAS NOT INSURED THE CONSIGNMENT OR HAS INSURED CONSIGNMENT.</div>
                    <div className="grid grid-cols-3 gap-1 pt-0.5 border-t-2 border-slate-900 font-mono">
                      <span>COMPANY: ________</span>
                      <span>POLICY: ________</span>
                      <span>RISK: ________</span>
                    </div>
                  </div>
                </div>

                {/* 8. ICICI Bank Payment Details */}
                <div className="p-2">
                  <div className="border-2 border-blue-900 p-1.5 rounded bg-blue-50/50 text-[9.5px]">
                    <div className="font-black text-blue-950 uppercase border-b border-blue-200 pb-0.5 mb-0.5">
                      ICICI BANK LTD (RTGS / NEFT PAYMENT)
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-semibold">
                      <div>NAME : <span className="font-bold">WOLEGO TRANSPORT</span></div>
                      <div>ACCOUNT NO. : <span className="font-mono font-bold">118405500444</span></div>
                      <div>IFSC CODE : <span className="font-mono font-bold">ICIC0001184</span></div>
                      <div>BRANCH : <span className="font-bold">WANKANER</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Freight Breakdown, Net Total & Signatory */}
              <div className="col-span-5 bg-slate-50 flex flex-col justify-between font-mono text-xs h-full">
                <div>
                  <div className="flex justify-between font-bold border-b-2 border-slate-900 px-2.5 py-2 text-xs bg-slate-100">
                    <span>FREIGHT</span>
                    <span>{lrData.freightAmount || 0}</span>
                  </div>

                  <div className="flex justify-between text-slate-700 px-2.5 py-2 border-b border-slate-200">
                    <span>Add : S-G.S.T. @ 2.5%</span>
                    <span>{lrData.sgstAmount || "0.00"}</span>
                  </div>

                  <div className="flex justify-between text-slate-700 px-2.5 py-2 border-b border-slate-200">
                    <span>Add : C-G.S.T. @ 2.5%</span>
                    <span>{lrData.cgstAmount || "0.00"}</span>
                  </div>

                  <div className="flex justify-between text-slate-700 px-2.5 py-2 border-b-2 border-slate-900">
                    <span>Add : I-G.S.T. @ 5%</span>
                    <span>{lrData.igstAmount || "0.00"}</span>
                  </div>

                  <div className="flex justify-between font-bold border-b-2 border-slate-900 px-2.5 py-2 text-xs bg-slate-100">
                    <span>TOTAL WITH GST</span>
                    <span>{lrData.totalWithGst || lrData.freightAmount}</span>
                  </div>

                  <div className="flex justify-between text-slate-700 px-2.5 py-2 border-b border-slate-200">
                    <span>Other Charges</span>
                    <span>{lrData.otherCharges || "0.00"}</span>
                  </div>

                  <div className="flex justify-between text-slate-700 border-b-2 border-slate-900 px-2.5 py-2">
                    <span>Less : Advance Paid</span>
                    <span>{lrData.lessAdvancePaid || "0.00"}</span>
                  </div>

                  <div className="flex justify-between font-black text-sm border-b-2 border-slate-900 px-2.5 py-2.5 text-slate-950 bg-yellow-100/60">
                    <span>NET TOTAL:</span>
                    <span>₹ {lrData.netTotalAmount || lrData.freightAmount}</span>
                  </div>
                </div>

                {/* Signatory Block Inside Grid */}
                <div className="text-right font-sans p-2 mt-auto flex flex-col items-end justify-end min-h-[60px]">
                  <div className="font-extrabold uppercase text-[11px] text-slate-950">FOR, WOLEGO TRANSPORT</div>
                  {signatureImg ? (
                    <img
                      src={signatureImg}
                      alt="Authorised Digital Signature"
                      className="h-10 w-auto max-w-[150px] object-contain my-1 mix-blend-multiply"
                    />
                  ) : (
                    <div className="h-6"></div>
                  )}
                  <div className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">(AUTHORISED SIGNATORY)</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
