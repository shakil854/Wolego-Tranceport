import React, { useRef, useEffect, useState } from "react";
import { Printer, Download, Share2, ArrowLeft, FileSignature, X } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoImg from "../assets/logo.png";

export default function LRPrintDocument({ lrData, onClose, onShareWhatsApp, autoAction }) {
  const printRef = useRef(null);
  const termsRef = useRef(null);
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

  // High-Quality Multi-Page PDF Export (Page 1: LR, Page 2: Terms and Conditions)
  const handleExportPDF = async () => {
    if (!printRef.current) return;
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Render Page 1 (LR Document)
      const canvas1 = await html2canvas(printRef.current, {
        scale: 2, // High DPI
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff"
      });

      const imgData1 = canvas1.toDataURL("image/jpeg", 0.85);
      pdf.addImage(imgData1, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

      // Render Page 2 (Terms and Conditions)
      if (termsRef.current) {
        try {
          const canvas2 = await html2canvas(termsRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff"
          });
          const imgData2 = canvas2.toDataURL("image/jpeg", 0.85);
          pdf.addPage();
          pdf.addImage(imgData2, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
        } catch (tErr) {
          console.error("Terms & Conditions page canvas error:", tErr);
        }
      }

      pdf.save(`LR_${lrData.lrNumber || "Document"}_WolegoTransport.pdf`);
    } catch (err) {
      console.error("PDF export failed:", err);
      window.print();
    }
  };

  // Dynamic PDF Generator + WhatsApp Share Function (Shares ONLY 2-Page PDF File with ZERO text)
  const handleWhatsApp = async () => {
    if (!printRef.current) return;
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // 1. Render Page 1 (LR Document)
      const canvas1 = await html2canvas(printRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: "#ffffff"
      });
      const imgData1 = canvas1.toDataURL("image/jpeg", 0.85);
      pdf.addImage(imgData1, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

      // 2. Render Page 2 (Terms and Conditions)
      if (termsRef.current) {
        try {
          const canvas2 = await html2canvas(termsRef.current, {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: "#ffffff"
          });
          const imgData2 = canvas2.toDataURL("image/jpeg", 0.85);
          pdf.addPage();
          pdf.addImage(imgData2, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
        } catch (tErr) {
          console.error("Terms page canvas error:", tErr);
        }
      }

      const filename = `LR_${lrData.lrNumber || "Document"}_WolegoTransport.pdf`;
      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], filename, { type: "application/pdf" });

      // 3. Share ONLY the PDF file without any text message
      if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile]
        });
      } else {
        // Desktop Fallback: Download PDF & Open WhatsApp Web clean without text
        pdf.save(filename);
        window.open(`https://api.whatsapp.com/send`, "_blank");
      }
    } catch (err) {
      console.error("WhatsApp PDF sharing error:", err);
      try {
        const pdf = new jsPDF("p", "mm", "a4");
        const canvas1 = await html2canvas(printRef.current, { scale: 1.5, logging: false });
        pdf.addImage(canvas1.toDataURL("image/jpeg", 0.85), "JPEG", 0, 0, 210, 297, undefined, "FAST");
        pdf.save(`LR_${lrData.lrNumber || "Document"}_WolegoTransport.pdf`);
      } catch (e) {
        console.error("Fallback PDF save failed:", e);
      }
      window.open(`https://api.whatsapp.com/send`, "_blank");
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
        <div ref={printRef} className="border-2 border-slate-900 bg-white text-slate-900 min-h-[265mm] h-full flex flex-col justify-between print-document relative overflow-hidden">

          {/* Background Watermark Logo (Shown during both PDF Export & LR Print) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
            <img
              src={logoImg}
              alt="Watermark Logo"
              className="w-[450px] max-w-[75%] opacity-[0.08] object-contain mix-blend-multiply"
            />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-between">
            {/* Header Bar */}
            {/* Company Header Block (Line by Line Exact Copy of Image 2) */}
            <div className="border-b-2 border-slate-900 p-2.5 pb-2">

              {/* Copy Checkboxes Header */}
              <div className="flex flex-wrap justify-between items-center text-[10px] font-bold border-b border-slate-300 pb-1 mb-1">
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
              </div>

              {/* Company Banner & Logo */}
              <div className="grid grid-cols-12 gap-1 items-center my-1">
                {/* Left Logo Column */}
                <div className="col-span-2 flex justify-center items-center">
                  <img src={logoImg} alt="Wolego Transport Logo" className="h-24 sm:h-28 w-auto object-contain max-w-full" />
                </div>

                {/* Middle Column: Exact 8-Line Sequence Requested by User */}
                <div className="col-span-7 text-center flex flex-col items-center justify-center space-y-1">
                  
                  {/* Line 1: SUBJECT TO WANKANER JURISDICTION */}
                  <div className="text-[10px] font-black text-slate-950 uppercase underline tracking-wider whitespace-nowrap">
                    SUBJECT TO WANKANER JURISDICTION
                  </div>

                  {/* Line 2: WOLEGO TRANSPORT (Single Unbroken Line - Exact Logo Green Color) */}
                  <h1 className="text-2xl sm:text-3xl font-black text-[#009a44] tracking-wider font-serif uppercase leading-none whitespace-nowrap">
                    WOLEGO TRANSPORT
                  </h1>

                  {/* Line 3: EVERYTHING IS FAST (Single Unbroken Line) */}
                  <div className="text-xs sm:text-sm font-black text-amber-900 italic font-serif whitespace-nowrap">
                    EVERYTHING IS FAST
                  </div>

                  {/* Line 4: TRANSPORT CONTRACTOR AND COMMISSION AGENT (Single Unbroken Line) */}
                  <div className="whitespace-nowrap">
                    <span className="text-[10.5px] sm:text-xs font-black uppercase tracking-wider bg-blue-900 text-white px-3 py-0.5 inline-block">
                      TRANSPORT CONTRACTOR AND COMMISSION AGENT
                    </span>
                  </div>

                  {/* Line 5 & 6: Address (Line by Line) */}
                  <div className="text-[10px] sm:text-[10.5px] text-red-900 font-black tracking-tight uppercase leading-tight space-y-0.5 whitespace-nowrap text-center">
                    <div>SURVEY NUMBER NA 178P8, 27 NATIONAL HIGHWAY,</div>
                    <div>CHANDRAPUR, WANKANER-363621 DISTRICT-MORBI ( GUJRAT )</div>
                  </div>

                </div>

                {/* Right Side Column: Mobile Numbers, PAN, GSTIN (Stacked Vertically) */}
                <div className="col-span-3 text-right text-[9.5px] sm:text-[10px] font-black text-slate-950 space-y-0.5 border-l border-slate-300 pl-2">
                  <div>MOBILE NO. +91 99 79 111 555</div>
                  <div>MOBILE NO. +91 81 41 111 555</div>
                  <div>PAN NO. : DLTPS8567M</div>
                  <div>GSTIN NO. : 24DLTPS8567M1ZT</div>
                </div>

              </div>

            </div>

            {/* Title Strip (Line 7 & Line 8 - Blue Background) */}
            <div className="bg-blue-900 text-white font-extrabold text-center py-1 tracking-wider text-xs uppercase flex flex-col items-center justify-center space-y-0.5 border-b-2 border-blue-900">
              <div className="text-xs font-black tracking-widest text-white">GOODS CONSIGNMENT NOTE</div>
              <div className="text-[9.5px] font-bold tracking-wider text-amber-300">AT OWNER'S RISK</div>
            </div>

            {/* LR Header Grid (LR NO, DATE, FROM, TO) */}
            <div className="grid grid-cols-12 border-b-2 border-slate-900 font-extrabold text-[11px] divide-x-2 divide-slate-900 text-slate-950">
              <div className="col-span-3 p-1.5 bg-slate-100 flex items-center gap-2">
                <span>L.R. NO. :</span>
                <span className="text-lg font-black text-rose-700 font-mono">{lrData.lrNumber}</span>
              </div>
              <div className="col-span-3 p-1.5 flex items-center gap-2">
                <span>DATE :</span>
                <span className="font-extrabold">{formatDateDisplay(lrData.dateTime)}</span>
              </div>
              <div className="col-span-3 p-1.5 flex items-center gap-2">
                <span>FROM :</span>
                <span className="uppercase font-black text-slate-950">{lrData.fromPlace || ""}</span>
              </div>
              <div className="col-span-3 p-1.5 flex items-center gap-2">
                <span>TO :</span>
                <span className="uppercase font-black text-slate-950">{lrData.toPlace || ""}</span>
              </div>
            </div>

            {/* Truck No & Delivery At */}
            <div className="grid grid-cols-12 border-b-2 border-slate-900 font-extrabold text-[11px] divide-x-2 divide-slate-900 text-slate-950">
              <div className="col-span-6 p-1.5 flex items-center gap-2">
                <span>DELIVERY AT :</span>
                <span className="font-black uppercase bg-yellow-300 px-2 py-0.5 border border-slate-900 rounded text-slate-950">
                  {lrData.deliveryAt || ""}
                </span>
              </div>
              <div className="col-span-6 p-1.5 flex items-center gap-2">
                <span>TRUCK NO. :</span>
                <span className="font-mono text-base font-black tracking-wider uppercase text-slate-950">
                  {lrData.truckNo}
                </span>
              </div>
            </div>

            {/* Consignor & Consignee Box */}
            <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900 min-h-[90px]">

              {/* Consignor Column */}
              <div className="p-2 space-y-1">
                <div className="font-black text-[11px] underline uppercase text-slate-950">
                  CONSIGNOR'S NAME & ADDRESS
                </div>
                <div className="font-black text-xs text-slate-950 uppercase whitespace-pre-line leading-tight">{lrData.consignorName}</div>
                <div className="text-[10.5px] font-bold text-slate-950 leading-tight uppercase whitespace-pre-line">
                  {lrData.consignorAddress}
                </div>
                <div className="font-mono font-extrabold text-[11px] pt-1 border-t border-slate-400 mt-1 text-slate-950">
                  CONSIGNOR GSTIN NO. : <span className="font-black text-slate-950">{lrData.consignorGst || ""}</span>
                </div>
              </div>

              {/* Consignee Column */}
              <div className="p-2 space-y-1">
                <div className="font-black text-[11px] underline uppercase text-slate-950">
                  CONSIGNEE'S NAME & ADDRESS
                </div>
                <div className="font-black text-sm text-slate-950 uppercase">{lrData.consigneeName}</div>
                <div className="text-[10.5px] font-bold text-slate-950 leading-tight uppercase whitespace-pre-line">
                  {lrData.consigneeAddress}
                </div>
                <div className="font-mono font-extrabold text-[11px] pt-1 border-t border-slate-400 mt-1 text-slate-950">
                  CONSIGNEE GSTIN NO. : <span className="font-black text-slate-950">{lrData.consigneeGst || ""}</span>
                </div>
              </div>

            </div>

            {/* Goods Table */}
            <div className="border-b-2 border-slate-900 min-h-[110px]">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-200 border-b-2 border-slate-900 font-black uppercase text-center divide-x-2 divide-slate-900 text-slate-950">
                    <th className="p-1.5 w-24">NO. OF ARTICLE</th>
                    <th className="p-1.5">DESCRIPTION OF GOODS</th>
                    <th className="p-1.5 w-32">WEIGHT</th>
                    <th className="p-1.5 w-28">RATE</th>
                    <th className="p-1.5 w-36">FREIGHT ({lrData.toPayOrPaid || "TO-PAY"})</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-b-2 border-slate-900 font-extrabold text-slate-950">
                  <tr className="divide-x-2 divide-slate-900 text-center min-h-[80px]">
                    <td className="p-2 font-black align-top text-slate-950">
                      <div className="min-h-[34px] flex flex-col justify-start">
                        <div className="font-black text-sm">{lrData.noOfArticles}</div>
                        <span className="text-[10.5px] font-extrabold text-slate-950 uppercase">{lrData.bundles || ""}</span>
                      </div>
                      {lrData.noOfArticles2 && (
                        <div className="mt-1 pt-1 border-t border-slate-900 min-h-[34px] flex flex-col justify-start">
                          <div className="font-black text-sm">{lrData.noOfArticles2}</div>
                          <span className="text-[10.5px] font-extrabold text-slate-950 uppercase">{lrData.bundles2 || "BUNDLE"}</span>
                        </div>
                      )}
                    </td>
                    <td className="p-2 align-top text-left">
                      <div className="min-h-[34px] flex flex-col justify-start">
                        <div className="font-black uppercase text-sm text-slate-950">{lrData.descriptionOfGoods}</div>
                      </div>
                      {lrData.noOfArticles2 && (
                        <div className="mt-1 pt-1 border-t border-slate-900 min-h-[34px] flex flex-col justify-start">
                          <div className="font-black uppercase text-sm text-slate-950">{lrData.descriptionOfGoods2 || "SANITARYWARE"}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-2 font-mono font-black align-top text-slate-950">
                      {lrData.weightKgs ? `${lrData.weightKgs} K.G.` : ""}
                    </td>
                    <td className="p-2 font-mono font-black align-top text-slate-950">
                      {lrData.ratePerTon ? `${lrData.ratePerTon} ${lrData.rateType || ""}` : ""}
                    </td>
                    <td className="p-2 font-mono font-black text-right align-top text-sm text-slate-950">
                      {lrData.freightAmount || ""}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Bottom Grid: Charges, GST, Invoice, Insurance, Bank details - Stretched to bottom border */}
            <div className="grid grid-cols-12 divide-x-2 divide-slate-900 flex-1 min-h-[400px]">

              {/* Left Column (7 cols): Full-width rows stretching edge-to-edge to main grid lines */}
              <div className="col-span-7 text-[10px] flex flex-col justify-between h-full text-slate-950">
                {/* 1. GST Payable By */}
                <div className="font-black text-slate-950 border-b-2 border-slate-900 px-2 py-1 flex items-center gap-2">
                  <span>GST PAYABLE BY :</span>
                  <span className="bg-yellow-300 px-2 py-0.5 border border-slate-900 rounded font-black text-slate-950">{lrData.gstPayableBy || "CONSIGNEE"}</span>
                </div>

                {/* 2. Invoice No */}
                <div className="font-black text-slate-950 border-b-2 border-slate-900 px-2 py-1">
                  INVOICE NO. : <span className="font-black text-xs text-slate-950">{lrData.billNumbers || ""}</span>
                </div>

                {/* 3. Value Rs */}
                <div className="font-black text-slate-950 border-b-2 border-slate-900 px-2 py-1">
                  VALUE RS. : <span className="font-black text-xs text-slate-950">{lrData.invoiceValue || ""}</span>
                </div>

                {/* 4. Consignor E-Way Bill */}
                <div className="font-black text-slate-950 border-b-2 border-slate-900 px-2 py-1">
                  CONSIGNOR E-WAY BILL : <span className="font-black text-xs text-slate-950">{lrData.consignorEwayBill || ""}</span>
                </div>

                {/* 5. Consignee E-Way Bill */}
                <div className="font-black text-slate-950 border-b-2 border-slate-900 px-2 py-1">
                  CONSIGNEE E-WAY BILL : <span className="font-black text-xs text-slate-950">{lrData.consigneeEwayBill || ""}</span>
                </div>

                {/* 6. Driver Mobile No */}
                <div className="font-black text-slate-950 border-b-2 border-slate-900 px-2 py-1">
                  DRIVER NO. : <span className="font-black text-xs text-slate-950">{lrData.driverMobile || ""}</span>
                </div>

                {/* 6. Remarks / Disclaimer */}
                <div className="px-2 py-1 space-y-1">
                  <div className="font-black uppercase text-red-700 bg-red-50 p-1 border-2 border-slate-900 text-[9.5px]">
                    WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE. FULL TRUCK LOAD ACCEPTED ALL OVER INDIA.
                  </div>
                  {lrData.remarks &&
                    lrData.remarks !== "WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE." &&
                    lrData.remarks !== "WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE. FULL TRUCK LOAD ACCEPTED ALL OVER INDIA." && (
                      <div className="font-black text-slate-950 text-[9.5px] uppercase p-1 border border-slate-900 bg-slate-100">
                        REMARKS: <span className="font-black">{lrData.remarks}</span>
                      </div>
                    )}
                </div>

                {/* 7. Insurance Declaration Box */}
                <div className="px-2 py-1">
                  <div className="border-2 border-slate-900 p-1.5 rounded text-[9.5px] bg-transparent space-y-0.5 text-slate-950 font-bold">
                    <div className="font-black uppercase underline text-slate-950">INSURANCE :</div>
                    <div className="font-bold text-slate-950">THE CUSTOMER HAS STATED THAT HE HAS NOT INSURED THE CONSIGNMENT OR HAS INSURED CONSIGNMENT.</div>
                    <div className="grid grid-cols-3 gap-1 pt-0.5 border-t-2 border-slate-900 font-mono font-extrabold text-slate-950">
                      <span>COMPANY: ________</span>
                      <span>POLICY: ________</span>
                      <span>RISK: ________</span>
                    </div>
                  </div>
                </div>

                {/* 8. ICICI Bank Payment Details */}
                <div className="p-2">
                  <div className="border-2 border-blue-900 p-1.5 rounded bg-transparent text-[9.5px] text-slate-950">
                    <div className="font-black text-blue-950 uppercase border-b border-blue-300 pb-0.5 mb-0.5">
                      ICICI BANK LTD (RTGS / NEFT PAYMENT)
                    </div>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-bold text-slate-950">
                      <div>NAME : <span className="font-black text-slate-950">WOLEGO TRANSPORT</span></div>
                      <div>ACCOUNT NO. : <span className="font-mono font-black text-slate-950">118405500444</span></div>
                      <div>IFSC CODE : <span className="font-mono font-black text-slate-950">ICIC0001184</span></div>
                      <div>BRANCH : <span className="font-black text-slate-950">WANKANER</span></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 cols): Freight Breakdown, Net Total & Signatory */}
              <div className="col-span-5 bg-transparent flex flex-col justify-between font-mono text-xs h-full text-slate-950">
                <div>
                  <div className="flex justify-between font-black border-b-2 border-slate-900 px-2.5 py-2 text-xs bg-slate-100/40 text-slate-950">
                    <span>FREIGHT</span>
                    <span>{lrData.freightAmount || 0}</span>
                  </div>

                  <div className="flex justify-between font-bold text-slate-950 px-2.5 py-2 border-b border-slate-300">
                    <span>Add : S-G.S.T. @ 2.5%</span>
                    <span className="font-extrabold text-slate-950">{lrData.sgstAmount || "0.00"}</span>
                  </div>

                  <div className="flex justify-between font-bold text-slate-950 px-2.5 py-2 border-b border-slate-300">
                    <span>Add : C-G.S.T. @ 2.5%</span>
                    <span className="font-extrabold text-slate-950">{lrData.cgstAmount || "0.00"}</span>
                  </div>

                  <div className="flex justify-between font-bold text-slate-950 px-2.5 py-2 border-b-2 border-slate-900">
                    <span>Add : I-G.S.T. @ 5%</span>
                    <span className="font-extrabold text-slate-950">{lrData.igstAmount || "0.00"}</span>
                  </div>

                  <div className="flex justify-between font-black border-b-2 border-slate-900 px-2.5 py-2 text-xs bg-slate-100/40 text-slate-950">
                    <span>TOTAL WITH GST</span>
                    <span>{lrData.totalWithGst || lrData.freightAmount}</span>
                  </div>

                  <div className="flex justify-between font-bold text-slate-950 px-2.5 py-2 border-b border-slate-300">
                    <span>Other Charges</span>
                    <span className="font-extrabold text-slate-950">{lrData.otherCharges || "0.00"}</span>
                  </div>

                  <div className="flex justify-between font-bold text-slate-950 border-b-2 border-slate-900 px-2.5 py-2">
                    <span>Less : Advance Paid</span>
                    <span className="font-extrabold text-slate-950">{lrData.lessAdvancePaid || "0.00"}</span>
                  </div>

                  <div className="flex justify-between font-black text-sm border-b-2 border-slate-900 px-2.5 py-2.5 text-slate-950 bg-yellow-100/40">
                    <span>NET TOTAL:</span>
                    <span>₹ {lrData.netTotalAmount || lrData.freightAmount}</span>
                  </div>
                </div>

                {/* Signatory Block Inside Grid */}
                <div className="text-right font-sans p-2 mt-auto flex flex-col items-end justify-end min-h-[60px]">
                  <div className="font-black uppercase text-[11px] text-slate-950">FOR, WOLEGO TRANSPORT</div>
                  {signatureImg ? (
                    <img
                      src={signatureImg}
                      alt="Authorised Digital Signature"
                      className="h-10 w-auto max-w-[150px] object-contain my-1 mix-blend-multiply"
                    />
                  ) : (
                    <div className="h-6"></div>
                  )}
                  <div className="text-[9.5px] text-slate-950 uppercase tracking-wider font-extrabold">(AUTHORISED SIGNATORY)</div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Page 2: Terms and Conditions Document (Included in PDF Export) */}
      <div className="max-w-4xl mx-auto bg-white p-3 sm:p-5 shadow-2xl rounded-sm print-container print:p-0 print:shadow-none font-sans text-xs mt-6 print:hidden">
        <div
          ref={termsRef}
          className="border-2 border-slate-900 bg-white text-slate-900 min-h-[265mm] h-full flex flex-col justify-between print-document relative overflow-hidden p-6 sm:p-10"
        >
          {/* Inner Rounded Frame matching Photo */}
          <div className="border border-slate-400 rounded-2xl p-6 sm:p-8 h-full flex flex-col justify-start relative overflow-hidden">
            {/* Background Watermark Logo */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
              <img
                src={logoImg}
                alt="Watermark Logo"
                className="w-[450px] max-w-[75%] opacity-[0.08] object-contain mix-blend-multiply"
              />
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-start">
              {/* Header Bar */}
              <div className="pb-4 mb-6 text-center">
                <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 tracking-wider uppercase mb-2">
                  :: GOOD BOOKED ON ARE REVERS CARRIED CARRIED SUBJECT TO THE FOLLOWING ::
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-widest border-b-2 border-slate-900 inline-block pb-1">
                  TERMS AND CONDITIONS
                </h2>
              </div>

              {/* 8 Terms & Conditions Points */}
              <div className="space-y-4 text-[11px] sm:text-xs leading-relaxed text-slate-900 font-medium">
                <div className="flex gap-2.5">
                  <span className="font-bold text-slate-950 shrink-0 min-w-[20px]">1)</span>
                  <p>
                    THE COMPANY DOES NOT GUARANTEE DELIVERY WITHIN ANY SPECIFIED TIME AND THE COMPANY DOES NOT BE LIABLE FOR ANY DELAY IN TRANSPORT OR DELIVERY, NOT ANY NEGLIGENCE FDEFAULT OF THE CARRIEROF HISAGENTS.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <span className="font-bold text-slate-950 shrink-0 min-w-[20px]">2)</span>
                  <p>
                    NATURE, CONTENTE CONDITION AND VALUE OF THE CONSIGNMENT ARE UNKNOWN TO GOODS CARRERS OF INDIA (HEREIN-AFTER CALLED THE COMPANY) THE COMPANY CARRY THE GOODSAND PACKEDAT OWNER'S RISK.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <span className="font-bold text-slate-950 shrink-0 min-w-[20px]">3)</span>
                  <p>
                    THE COMPANY SHALL NOT BE RESPONSIBLE IF THE GOOD S ARE DETAINED SEIZED OR CONFICATED GOVERNMENT AUTHORITIES.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <span className="font-bold text-slate-950 shrink-0 min-w-[20px]">4)</span>
                  <p>
                    THE COMPANY SHALL NOT BE LIABLE FOR ANY LOSS OR DAMAGE DUE TO PILFERAGE THEFT WEALTHIER CONDITIONS STRIKES, RIOTS, DISTURBANCES, FIRE EXPLOSION OR ACCIDENT, PROVIDED HOWEVER ALL REASONABLE PRECAUTIONS ARE TAKEN TO PROVIDE AGAINST SUCHCONTINGENCY.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <span className="font-bold text-slate-950 shrink-0 min-w-[20px]">5)</span>
                  <p>
                    NO ENQUIRY WELL ENTERTAINED RELATING TO ANY CONSIGNMENT AFTER THE EXPIRY OF 30 DAYSFORM THE DATE DELIVERY.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <span className="font-bold text-slate-950 shrink-0 min-w-[20px]">6)</span>
                  <p>
                    THE COMPANY IS NOT RESPONSIBLE FOR LEAKAGE, BREAKAGE OR SHORTAGE BY SUN, RAIN ORWATER DUE TOBAD ROAD CONDUCTION OR DUEIMPROPER PACKING ETC.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <span className="font-bold text-slate-950 shrink-0 min-w-[20px]">7)</span>
                  <p>
                    THE COURT IN WANKANER ALONE SHALL HAVE JURIDITION IN RESPECT OF ALLCLAIMS AND MATTESARISING UNDER THE CONSIGNMENT OF THEGOODS ENTRUSTED FOR TRANSPORT.
                  </p>
                </div>

                <div className="flex gap-2.5">
                  <span className="font-bold text-slate-950 shrink-0 min-w-[20px]">8)</span>
                  <p>
                    PLEASE CHEQUETHE DOCUMENT OF THETRUCK & DRIVER LICENCE.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
