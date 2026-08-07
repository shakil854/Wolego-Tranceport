import React, { useRef, useEffect, useState } from "react";
import { Printer, Download, Share2, ArrowLeft, FileSignature, X } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import logoImg from "../assets/logo.png";
import AdobeDigitalSignature from "./AdobeDigitalSignature";
import { API_URL, API_BASE_URL } from "../config/api";

export default function LRPrintDocument({ lrData, onClose, onShareWhatsApp, autoAction, initialCopyType = "CONSIGNOR" }) {
  const printRef = useRef(null);
  const termsRef = useRef(null);
  const fileInputRef = useRef(null);

  const [selectedCopies, setSelectedCopies] = useState(() => {
    if (Array.isArray(initialCopyType)) return initialCopyType;
    return initialCopyType ? [initialCopyType] : ["CONSIGNOR"];
  });

  useEffect(() => {
    if (initialCopyType) {
      setSelectedCopies(Array.isArray(initialCopyType) ? initialCopyType : [initialCopyType]);
    }
  }, [initialCopyType]);

  const toggleCopy = (type) => {
    setSelectedCopies((prev) => {
      if (prev.includes(type)) {
        return prev.length > 1 ? prev.filter((c) => c !== type) : prev;
      } else {
        return [...prev, type];
      }
    });
  };

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

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(autoAction === "pdf" || autoAction === "whatsapp");

  useEffect(() => {
    if (!autoAction) return;
    if (autoAction === "print") {
      setIsGeneratingPdf(false);
      handlePrint();
      if (onClose) onClose();
      return;
    }
    setIsGeneratingPdf(true);
    const timer = setTimeout(async () => {
      if (autoAction === "pdf") {
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

  // Helper to format LR PDF filename: LR_0004_WolegoTransport_GJ28AA2626.pdf
  const getLRPdfFilename = (lr) => {
    const lrNo = lr?.lrNumber || "0000";
    let truck = (lr?.truckNo || "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .trim();

    if (truck) {
      return `LR_${lrNo}_WolegoTransport_${truck}.pdf`;
    }
    return `LR_${lrNo}_WolegoTransport.pdf`;
  };

  // Helper to fetch in-memory Puppeteer-generated A4 PDF Blob from backend
  const fetchLRPdfBlob = async () => {
    const urlsToTry = Array.from(new Set([
      `${API_URL}/api/lr/generate-pdf`,
      `${API_BASE_URL}/lr/generate-pdf`,
      "http://localhost:5000/api/lr/generate-pdf",
      "http://localhost:8002/api/lr/generate-pdf",
      "/api/lr/generate-pdf",
    ]));

    let lastError = null;
    for (const url of urlsToTry) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lrData,
            signatureImg,
            selectedCopies,
          }),
        });

        if (response.ok) {
          return await response.blob();
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error("Failed to connect to PDF generation server.");
  };

  // Client-side Canvas PDF Fallback Generator (Page 1: LR, Page 2: Terms and Conditions)
  const generateClientPDFBlob = async () => {
    if (!printRef.current) throw new Error("Document print element not found");

    const el1 = printRef.current;
    const el2 = termsRef.current;

    const prevOpacity1 = el1.style.opacity;
    const prevVisibility1 = el1.style.visibility;
    el1.style.opacity = "1";
    el1.style.visibility = "visible";

    let prevOpacity2, prevVisibility2;
    if (el2) {
      prevOpacity2 = el2.style.opacity;
      prevVisibility2 = el2.style.visibility;
      el2.style.opacity = "1";
      el2.style.visibility = "visible";
    }

    try {
      const canvasOptions = {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      };

      const canvas1 = await html2canvas(el1, canvasOptions);
      const imgData1 = canvas1.toDataURL("image/jpeg", 0.85);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData1, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

      if (el2) {
        try {
          const canvas2 = await html2canvas(el2, canvasOptions);
          const imgData2 = canvas2.toDataURL("image/jpeg", 0.85);
          pdf.addPage();
          pdf.addImage(imgData2, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
        } catch (e2) {
          console.warn("Terms page canvas error:", e2);
        }
      }

      return pdf.output("blob");
    } finally {
      el1.style.opacity = prevOpacity1;
      el1.style.visibility = prevVisibility1;
      if (el2) {
        el2.style.opacity = prevOpacity2;
        el2.style.visibility = prevVisibility2;
      }
    }
  };

  // Safe PDF Fetcher (Backend Puppeteer with Client Canvas Fallback)
  const getOrGenerateLRPdfBlob = async () => {
    try {
      return await fetchLRPdfBlob();
    } catch (err) {
      console.warn("Backend PDF API unreachable, generating client-side A4 PDF:", err.message);
      return await generateClientPDFBlob();
    }
  };

  // High-Quality Multi-Page PDF Export (Direct File Download - Never calls window.print)
  const handleExportPDF = async () => {
    setIsGeneratingPdf(true);
    try {
      const blob = await getOrGenerateLRPdfBlob();
      const filename = getLRPdfFilename(lrData);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export failed:", err);
      alert("Failed to export PDF file. Please try again.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Dynamic PDF Generator + WhatsApp Share Function (Shares ONLY PDF File)
  const handleWhatsApp = async () => {
    setIsGeneratingPdf(true);
    try {
      const blob = await getOrGenerateLRPdfBlob();
      const filename = getLRPdfFilename(lrData);
      const pdfFile = new File([blob], filename, { type: "application/pdf" });

      setIsGeneratingPdf(false);

      // Mobile Web Share API (native share dialog with WhatsApp app & attached PDF ONLY)
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
        // Desktop Fallback: Download PDF file directly & Open Installed WhatsApp App with Contact Selection
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        const textMsg = encodeURIComponent(`*WOLEGO TRANSPORT - LR Copy*\n*LR No:* ${lrData?.lrNo || ""}`);
        window.location.href = `whatsapp://send?text=${textMsg}`;
      }
    } catch (err) {
      console.error("WhatsApp PDF sharing error:", err);
      setIsGeneratingPdf(false);
      const textMsg = encodeURIComponent(`*WOLEGO TRANSPORT - LR Copy*\n*LR No:* ${lrData?.lrNo || ""}`);
      window.location.href = `whatsapp://send?text=${textMsg}`;
    }
  };

  const isAuto = Boolean(autoAction);

  return (
    <>
      {/* Loading Modal / Popup for PDF Generation & WhatsApp Opening (Hidden during print) */}
      {isGeneratingPdf && (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md text-white p-4 pointer-events-auto opacity-100 print:hidden">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h3 className="font-extrabold text-lg text-white">Generating PDF...</h3>
              <p className="text-xs text-slate-400 mt-1">Please wait while we prepare your document for WhatsApp.</p>
            </div>
          </div>
        </div>
      )}

      <div className={isAuto ? "fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm print:bg-white print:static opacity-0 pointer-events-none print:opacity-100 print:pointer-events-auto" : "fixed inset-0 z-[9999] overflow-y-auto bg-slate-900 py-4 px-2 sm:px-4 text-slate-900 print:p-0 print:m-0 print:bg-white print:static print:overflow-visible"}>

        {/* Top Action Toolbar (Hidden during Print) */}
        <div className="max-w-4xl mx-auto mb-4 bg-slate-800 p-3 rounded-xl shadow-lg border border-slate-700 flex flex-wrap justify-between items-center gap-2 print:hidden sticky top-0 z-20">
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

        {/* Standard Printable Full A4 Page Document with Equal 3.5mm Margins */}
        <div className="w-full max-w-[210mm] mx-auto bg-white p-[3.5mm] shadow-2xl rounded-sm print-container print:p-0 print:m-0 print:w-[203mm] print:h-[290mm] print:max-w-none print:shadow-none font-sans text-xs box-border">
          <div ref={printRef} className="border-2 border-slate-900 bg-white text-slate-900 h-[290mm] min-h-[290mm] w-full flex flex-col justify-between print-document relative overflow-hidden box-border">

            {/* Background Watermark Logo (Shown during both PDF Export & LR Print) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
              <img
                src={logoImg}
                alt="Watermark Logo"
                className="w-[620px] max-w-[88%] max-h-[85%] opacity-[0.08] object-contain mix-blend-multiply"
              />
            </div>

            <div className="relative z-10 flex-1 flex flex-col justify-between">
              {/* Header Bar */}
              {/* Company Header Block (Line by Line Exact Copy of Image 2) */}
              <div className="border-b-2 border-slate-900 p-2.5 pb-2">

                {/* Copy Checkboxes Header */}
                <div className="flex flex-wrap justify-between items-center text-[10px] font-bold border-b border-slate-300 pb-1 mb-1">
                  <div className="flex space-x-4 uppercase">
                    <label className="flex items-center gap-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedCopies.includes("CONSIGNOR")}
                        onChange={() => toggleCopy("CONSIGNOR")}
                        className="w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                      /> CONSIGNOR COPY
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedCopies.includes("CONSIGNEE")}
                        onChange={() => toggleCopy("CONSIGNEE")}
                        className="w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                      /> CONSIGNEE COPY
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedCopies.includes("TRUCK")}
                        onChange={() => toggleCopy("TRUCK")}
                        className="w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                      /> TRUCK COPY
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={selectedCopies.includes("OFFICE")}
                        onChange={() => toggleCopy("OFFICE")}
                        className="w-3.5 h-3.5 accent-slate-900 cursor-pointer"
                      /> OFFICE COPY
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

                  {/* Right Side Column: Mobile Numbers, PAN, GSTIN (Left Aligned for Straight Alignment) */}
                  <div className="col-span-3 text-left text-[9.5px] sm:text-[10px] font-black text-slate-950 space-y-0.5 border-l border-slate-300 pl-3">
                    <div>MOBILE NO. +91 99 79 111 555</div>
                    <div>MOBILE NO. +91 81 41 111 555</div>
                    <div>PAN NO. : DLTPS8567M</div>
                    <div>GSTIN NO. : 24DLTPS8567M1ZT</div>
                  </div>

                </div>

              </div>

              {/* Title Strip (Slightly Smaller Height) */}
              <div className="bg-blue-900 text-white font-extrabold text-center py-0.5 tracking-wider uppercase flex flex-col items-center justify-center border-b-2 border-blue-900">
                <div className="text-[11px] font-black tracking-widest text-white leading-tight">GOODS CONSIGNMENT NOTE</div>
                <div className="text-[8.5px] font-bold tracking-wider text-amber-300 leading-tight">AT OWNER'S RISK</div>
              </div>

              {/* LR Header Grid (LR NO, DATE, FROM, TO) */}
              <div className="grid grid-cols-12 border-b-2 border-slate-900 font-black text-[11px] divide-x-2 divide-slate-900 text-slate-950">
                <div className="col-span-3 p-1.5 bg-slate-100 flex items-center justify-center gap-2">
                  <span>L.R. NO. :</span>
                  <span className="text-base font-black text-rose-700 font-mono">{lrData.lrNumber}</span>
                </div>
                <div className="col-span-3 p-1.5 flex items-center gap-2">
                  <span>DATE :</span>
                  <span className="font-black text-[11px]">{formatDateDisplay(lrData.dateTime)}</span>
                </div>
                <div className="col-span-3 p-1.5 flex items-center gap-2">
                  <span>FROM :</span>
                  <span className="uppercase font-black text-[11px] text-slate-950">{lrData.fromPlace || ""}</span>
                </div>
                <div className="col-span-3 p-1.5 flex items-center gap-2">
                  <span>TO :</span>
                  <span className="uppercase font-black text-[11px] text-slate-950">{lrData.toPlace || ""}</span>
                </div>
              </div>

              {/* Truck No & Delivery At */}
              <div className="grid grid-cols-12 border-b-2 border-slate-900 font-black text-[11px] divide-x-2 divide-slate-900 text-slate-950">
                <div className="col-span-6 p-1.5 flex items-center gap-2">
                  <span>DELIVERY AT :</span>
                  <span className="font-black text-[11px] uppercase text-slate-950">
                    {lrData.deliveryAt || ""}
                  </span>
                </div>
                <div className="col-span-6 p-1.5 flex items-center gap-2">
                  <span>TRUCK NO. :</span>
                  <span className="font-sans text-[11px] font-black uppercase text-slate-950">
                    {lrData.truckNo}
                  </span>
                </div>
              </div>

              {/* Consignor & Consignee Box */}
              <div className="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900 min-h-[95px]">

                {/* Consignor Column */}
                <div className="p-2 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="font-black text-[11px] underline uppercase text-slate-950">
                      CONSIGNOR'S NAME & ADDRESS
                    </div>
                    <div className="font-black text-[11px] text-slate-950 uppercase whitespace-pre-line leading-tight">{lrData.consignorName}</div>
                    <div className="text-[11px] font-black text-slate-950 leading-tight uppercase whitespace-pre-line">
                      {lrData.consignorAddress}
                    </div>
                  </div>
                  <div className="font-sans font-black text-[11px] pt-1 border-t border-slate-400 mt-1 text-slate-950">
                    CONSIGNOR GSTIN NO. : <span className="font-black text-[11px] text-slate-950">
                      {(lrData.consignorName && (lrData.consignorName.includes("(1)") || lrData.consignorName.includes("\n")))
                        ? "AS PER BILL"
                        : (lrData.consignorGst || "")}
                    </span>
                  </div>
                </div>

                {/* Consignee Column */}
                <div className="p-2 flex flex-col justify-between">
                  <div className="space-y-0.5">
                    <div className="font-black text-[11px] underline uppercase text-slate-950">
                      CONSIGNEE'S NAME & ADDRESS
                    </div>
                    <div className="font-black text-[11px] text-slate-950 uppercase">{lrData.consigneeName}</div>
                    <div className="text-[11px] font-black text-slate-950 leading-tight uppercase whitespace-pre-line">
                      {lrData.consigneeAddress}
                    </div>
                  </div>
                  <div className="font-sans font-black text-[11px] pt-1 border-t border-slate-400 mt-1 text-slate-950">
                    CONSIGNEE GSTIN NO. : <span className="font-black text-[11px] text-slate-950">{lrData.consigneeGst || ""}</span>
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
                      <th className="p-1.5 w-36">FREIGHT ({lrData.toPayOrPaid || "TBB"})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-b-2 border-slate-900 font-black text-slate-950">
                    <tr className="divide-x-2 divide-slate-900 text-center min-h-[80px]">
                      <td className="p-2 font-black align-top text-slate-950">
                        <div className="min-h-[34px] flex flex-col justify-start">
                          <div className="font-black text-[11px]">{lrData.noOfArticles}</div>
                          <span className="text-[11px] font-black text-slate-950 uppercase">{lrData.bundles || ""}</span>
                        </div>
                        {lrData.noOfArticles2 && (
                          <div className="mt-1 pt-1 border-t border-slate-900 min-h-[34px] flex flex-col justify-start">
                            <div className="font-black text-[11px]">{lrData.noOfArticles2}</div>
                            <span className="text-[11px] font-black text-slate-950 uppercase">{lrData.bundles2 || "BUNDLE"}</span>
                          </div>
                        )}
                      </td>
                      <td className="p-2 align-top text-center">
                        <div className="min-h-[34px] flex flex-col justify-start">
                          <div className="font-black uppercase text-[11px] text-slate-950">{lrData.descriptionOfGoods}</div>
                        </div>
                        {lrData.noOfArticles2 && (
                          <div className="mt-1 pt-1 border-t border-slate-900 min-h-[34px] flex flex-col justify-start">
                            <div className="font-black uppercase text-[11px] text-slate-950">{lrData.descriptionOfGoods2 || "SANITARYWARE"}</div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 font-sans font-black align-top text-[11px] text-slate-950">
                        {lrData.weightKgs ? `${lrData.weightKgs} K.G.` : ""}
                      </td>
                      <td className="p-2 font-sans font-black align-top text-[11px] text-slate-950">
                        {lrData.ratePerTon ? `${lrData.ratePerTon} ${lrData.rateType || ""}` : ""}
                      </td>
                      <td className="p-2 font-sans font-black text-center align-top text-[11px] text-slate-950">
                        {lrData.freightAmount || ""}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Bottom Grid: Charges, GST, Invoice, Insurance, Bank details - Stretched to bottom border */}
              <div className="grid grid-cols-12 divide-x-2 divide-slate-900 flex-1 min-h-[400px]">

                {/* Left Column (7 cols): Full-width rows stretching edge-to-edge to main grid lines */}
                <div className="col-span-7 text-[11px] flex flex-col justify-between h-full text-slate-950 font-black">
                  {/* 1. GST Payable By */}
                  <div className="font-black text-[11px] text-slate-950 border-b-2 border-slate-900 px-2 py-1 flex items-center gap-2">
                    <span>GST PAYABLE BY :</span>
                    <span className="font-black uppercase text-slate-950">{lrData.gstPayableBy || "CONSIGNEE"}</span>
                  </div>

                  {/* 2. Invoice No */}
                  <div className="font-black text-[11px] text-slate-950 border-b-2 border-slate-900 px-2 py-1">
                    INVOICE NO. : <span className="font-black text-[11px] text-slate-950">{lrData.billNumbers || ""}</span>
                  </div>

                  {/* 3. Value Rs */}
                  <div className="font-black text-[11px] text-slate-950 border-b-2 border-slate-900 px-2 py-1">
                    VALUE RS. : <span className="font-black text-[11px] text-slate-950">{lrData.invoiceValue || ""}</span>
                  </div>

                  {/* 4. Consignor E-Way Bill */}
                  <div className="font-black text-[11px] text-slate-950 border-b-2 border-slate-900 px-2 py-1">
                    CONSIGNOR E-WAY BILL : <span className="font-black text-[11px] text-slate-950">{lrData.consignorEwayBill || ""}</span>
                  </div>

                  {/* 5. Consignee E-Way Bill */}
                  <div className="font-black text-[11px] text-slate-950 border-b-2 border-slate-900 px-2 py-1">
                    CONSIGNEE E-WAY BILL : <span className="font-black text-[11px] text-slate-950">{lrData.consigneeEwayBill || ""}</span>
                  </div>

                  {/* 6. Driver Mobile No */}
                  <div className="font-black text-[11px] text-slate-950 border-b-2 border-slate-900 px-2 py-1">
                    DRIVER NO. : <span className="font-black text-[11px] text-slate-950">{lrData.driverMobile || ""}</span>
                  </div>

                  {/* 6. Remarks / Disclaimer */}
                  <div className="px-2 py-1 space-y-1">
                    <div className="font-black uppercase text-red-700 bg-red-50 p-1 border-2 border-slate-900 text-[11px]">
                      WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE.
                    </div>
                    <div className="font-black uppercase text-slate-950 bg-slate-200 p-1 border-2 border-slate-900 text-[11px]">
                      FULL TRUCK LOAD ACCEPTED ALL OVER INDIA.
                    </div>
                    {lrData.remarks &&
                      lrData.remarks !== "WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE." &&
                      lrData.remarks !== "FULL TRUCK LOAD ACCEPTED ALL OVER INDIA." &&
                      lrData.remarks !== "WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE. FULL TRUCK LOAD ACCEPTED ALL OVER INDIA." && (
                        <div className="font-black text-slate-950 text-[11px] uppercase p-1 border border-slate-900 bg-slate-100">
                          REMARKS: <span className="font-black">{lrData.remarks}</span>
                        </div>
                      )}
                  </div>

                  {/* 7. Insurance Declaration Box */}
                  <div className="px-2 py-1">
                    <div className="border-2 border-slate-900 p-1.5 rounded text-[11px] bg-transparent space-y-0.5 text-slate-950 font-black">
                      <div className="font-black uppercase underline text-slate-950">INSURANCE :</div>
                      <div className="font-black text-slate-950">THE CUSTOMER HAS STATED THAT HE HAS NOT INSURED THE CONSIGNMENT OR HAS INSURED CONSIGNMENT.</div>
                      <div className="grid grid-cols-3 gap-1 pt-0.5 border-t-2 border-slate-900 font-sans font-black text-slate-950">
                        <span>COMPANY: ________</span>
                        <span>POLICY: ________</span>
                        <span>RISK: ________</span>
                      </div>
                    </div>
                  </div>

                  {/* 8. ICICI Bank Payment Details */}
                  <div className="p-2">
                    <div className="border-2 border-blue-900 p-1.5 rounded bg-transparent text-[11px] text-slate-950">
                      <div className="font-black text-blue-950 uppercase border-b border-blue-300 pb-0.5 mb-0.5">
                        ICICI BANK LTD (RTGS / NEFT PAYMENT)
                      </div>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 font-black text-slate-950">
                        <div>NAME : <span className="font-black text-slate-950">WOLEGO TRANSPORT</span></div>
                        <div>ACCOUNT NO. : <span className="font-sans font-black text-slate-950">118405500444</span></div>
                        <div>IFSC CODE : <span className="font-sans font-black text-slate-950">ICIC0001184</span></div>
                        <div>BRANCH : <span className="font-black text-slate-950">WANKANER</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (5 cols): Freight Breakdown, Net Total & Signatory */}
                <div className="col-span-5 bg-transparent flex flex-col justify-between font-sans text-[11px] font-black h-full text-slate-950">
                  <div>
                    <div className="flex justify-between font-black border-b-2 border-slate-900 px-2.5 py-2 text-[11px] bg-slate-200 text-slate-950">
                      <span>FREIGHT</span>
                      <span>{lrData.freightAmount || 0}</span>
                    </div>

                    <div className="flex justify-between font-black text-slate-950 px-2.5 py-2 border-b border-slate-300">
                      <span>Add : S-G.S.T. @ 2.5%</span>
                      <span className="font-black text-slate-950">{lrData.sgstAmount || "0.00"}</span>
                    </div>

                    <div className="flex justify-between font-black text-slate-950 px-2.5 py-2 border-b border-slate-300">
                      <span>Add : C-G.S.T. @ 2.5%</span>
                      <span className="font-black text-slate-950">{lrData.cgstAmount || "0.00"}</span>
                    </div>

                    <div className="flex justify-between font-black text-slate-950 px-2.5 py-2 border-b-2 border-slate-900">
                      <span>Add : I-G.S.T. @ 5%</span>
                      <span className="font-black text-slate-950">{lrData.igstAmount || "0.00"}</span>
                    </div>

                    <div className="flex justify-between font-black border-b-2 border-slate-900 px-2.5 py-2 text-[11px] bg-slate-200 text-slate-950">
                      <span>TOTAL WITH GST</span>
                      <span>{lrData.totalWithGst || lrData.freightAmount}</span>
                    </div>

                    <div className="flex justify-between font-black text-slate-950 px-2.5 py-2 border-b border-slate-300">
                      <span>Other Charges</span>
                      <span className="font-black text-slate-950">{lrData.otherCharges || "0.00"}</span>
                    </div>

                    <div className="flex justify-between font-black text-slate-950 border-b-2 border-slate-900 px-2.5 py-2">
                      <span>Less : Advance Paid</span>
                      <span className="font-black text-slate-950">{lrData.lessAdvancePaid || "0.00"}</span>
                    </div>

                    <div className="flex justify-between font-black text-[11px] border-b-2 border-slate-900 px-2.5 py-2.5 text-slate-950 bg-slate-200">
                      <span>NET TOTAL:</span>
                      <span>₹ {lrData.netTotalAmount || lrData.freightAmount}</span>
                    </div>
                  </div>

                  {/* Logo Centered Between NET TOTAL and Signatory Block (Bottom tagline clipped out) */}
                  <div className="my-auto pt-1 pb-0.5 flex items-center justify-center flex-1 w-full px-2 overflow-hidden">
                    <img
                      src={logoImg}
                      alt="Wolego Transport Logo"
                      className="w-full max-w-[240px] h-auto max-h-[180px] object-contain mix-blend-multiply opacity-95"
                      style={{ clipPath: "inset(0 0 18% 0)", transform: "scale(1.05)" }}
                    />
                  </div>

                  {/* Signatory Block Inside Grid */}
                  <div className="text-center font-sans px-2 py-1 mt-auto flex flex-col items-center justify-end min-h-[55px]">
                    <div className="font-black uppercase text-[10.5px] text-slate-950">FOR, WOLEGO TRANSPORT</div>
                    <AdobeDigitalSignature />
                    <div className="text-[9px] text-slate-950 uppercase tracking-wider font-extrabold pb-0.5">(AUTHORISED SIGNATORY)</div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* Page 2: Terms and Conditions Document (Included in PDF Export & Print Preview) */}
        <div className="w-full max-w-[210mm] mx-auto bg-white p-[3.5mm] shadow-2xl rounded-sm print-container print:p-0 print:m-0 print:w-[203mm] print:h-[290mm] print:max-w-none print:shadow-none font-sans text-xs box-border mt-6 print:block print:break-before-page">
          <div
            ref={termsRef}
            className="border-2 border-slate-900 bg-white text-slate-900 h-[290mm] min-h-[290mm] w-full flex flex-col justify-between print-document relative overflow-hidden p-6 sm:p-8 box-border"
          >
            {/* Inner Rounded Frame matching Photo */}
            <div className="border border-slate-400 rounded-2xl p-6 sm:p-8 h-full flex flex-col justify-between relative overflow-hidden">
              {/* Background Watermark Logo */}
              <div className="absolute inset-0 flex items-center justify-center -translate-y-8 pointer-events-none select-none z-0 overflow-hidden">
                <img
                  src={logoImg}
                  alt="Watermark Logo"
                  className="w-[640px] max-w-[90%] max-h-[88%] opacity-[0.13] object-contain mix-blend-multiply"
                />
              </div>

              <div className="relative z-10 flex-1 flex flex-col justify-between mb-4">
                {/* Header Bar */}
                <div className="pb-3 mb-2 text-center">
                  <div className="text-[10px] sm:text-[11px] font-bold text-slate-700 tracking-wider uppercase mb-1.5">
                    :: GOOD BOOKED ON ARE REVERS CARRIED CARRIED SUBJECT TO THE FOLLOWING ::
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-widest border-b-2 border-slate-900 inline-block pb-1">
                    TERMS AND CONDITIONS
                  </h2>
                </div>

                {/* 8 Terms & Conditions Points - Stretched Vertically Down */}
                <div className="flex-1 flex flex-col justify-between py-2 text-[11.5px] sm:text-xs leading-relaxed text-slate-900 font-medium space-y-4 sm:space-y-0">
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

              {/* Footer Section in Empty Space */}
              <div className="relative z-10 mt-auto pt-6 border-t-2 border-slate-200 flex flex-row items-center justify-between gap-4">
                <div className="flex flex-col justify-center space-y-3">
                  {/* Web App Symbol & Domain */}
                  <div className="flex items-center gap-2.5">
                    <img src={logoImg} alt="Wolego Symbol" className="h-8 w-auto object-contain" />
                    <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm sm:text-base tracking-wide">
                      <span>-</span>
                      <a href="https://www.wolegotransport.com" target="_blank" rel="noopener noreferrer" className="hover:underline text-blue-900 font-black">
                        www.wolegotransport.com
                      </a>
                    </div>
                  </div>

                  {/* Play Store Logo & Coming Soon */}
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 bg-slate-900 rounded-lg p-1.5 text-white shadow-sm">
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                        <path d="M3.609 1.814L13.792 12 3.61 22.186a1.536 1.536 0 0 1-.61-.926V2.74c.094-.356.31-.666.609-.926zm11.31 11.31l2.483 2.483-11.83 6.877 9.347-9.36zm1.127-1.124l3.753 2.181a1.25 1.25 0 0 1 0 2.164l-3.753 2.182-2.316-2.316 2.316-2.211zm-1.127-1.128L5.572 1.505l11.83 6.877-2.483 2.49z" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-xs sm:text-sm">Play Store</span>
                      <span className="bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-black px-2.5 py-0.5 rounded-full tracking-wider uppercase">
                        Coming Soon
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Group: QR Code Section & Logo */}
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* QR Code Section */}
                  <div className="flex flex-col items-center justify-center bg-white border border-slate-300 rounded-xl p-2.5 shadow-sm">
                    <div className="w-24 h-24 sm:w-28 sm:h-28">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 31 31" shapeRendering="crispEdges" className="w-full h-full">
                        <path fill="#ffffff" d="M0 0h31v31H0z" />
                        <path stroke="#000000" d="M1 1.5h7m4 0h1m3 0h2m2 0h2m1 0h7M1 2.5h1m5 0h1m2 0h2m1 0h1m4 0h2m3 0h1m5 0h1M1 3.5h1m1 0h3m1 0h1m1 0h1m1 0h3m1 0h1m1 0h1m2 0h2m1 0h1m1 0h3m1 0h1M1 4.5h1m1 0h3m1 0h1m1 0h2m2 0h1m3 0h2m1 0h1m2 0h1m1 0h3m1 0h1M1 5.5h1m1 0h3m1 0h1m1 0h2m2 0h4m3 0h2m1 0h1m1 0h3m1 0h1M1 6.5h1m5 0h1m1 0h9m1 0h1m1 0h1m1 0h1m5 0h1M1 7.5h7m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h1m1 0h7M9 8.5h2m1 0h3m1 0h1m2 0h1M1 9.5h1m1 0h5m3 0h2m2 0h2m1 0h1m4 0h5M1 10.5h3m1 0h1m3 0h1m6 0h6m1 0h3m3 0h1M1 11.5h1m1 0h1m3 0h1m1 0h1m1 0h1m1 0h1m4 0h1M1 12.5h2m2 0h2m1 0h3m2 0h1m1 0h1m1 0h1m2 0h1m2 0h2m1 0h1m1 0h1M1 13.5h1m1 0h1m3 0h4m1 0h1m4 0h2m2 0h1m4 0h2M1 14.5h1m1 0h2m1 0h1m2 0h2m1 0h1m1 0h3m3 0h4m1 0h1m3 0h1M1 15.5h2m2 0h1m1 0h2m4 0h7m3 0h2m1 0h2M1 16.5h2m1 0h1m3 0h2m3 0h2m1 0h1m2 0h1m1 0h1m1 0h3m2 0h1M7 17.5h2m1 0h2m1 0h1m1 0h2m1 0h1m2 0h1m2 0h1m1 0h2M1 18.5h4m3 0h3m1 0h2m2 0h2m2 0h6m1 0h1m1 0h1M1 19.5h1m3 0h6m1 0h1m8 0h1m1 0h2m2 0h1M1 20.5h1m2 0h2m2 0h1m1 0h2m1 0h1m1 0h1m1 0h1m1 0h4m1 0h2m2 0h1M1 21.5h1m1 0h2m2 0h1m3 0h1m6 0h8m1 0h3M9 22.5h4m1 0h3m1 0h2m1 0h1m3 0h5M1 23.5h7m2 0h2m1 0h6m1 0h2m1 0h1m1 0h3M1 24.5h1m5 0h1m1 0h2m2 0h2m1 0h2m1 0h3m3 0h1m3 0h1M1 25.5h1m1 0h3m1 0h1m1 0h2m4 0h1m2 0h1m2 0h5m1 0h1m1 0h1M1 26.5h1m1 0h3m1 0h1m1 0h2m3 0h1m2 0h1m1 0h3m2 0h1m1 0h2M1 27.5h1m1 0h3m1 0h1m1 0h1m3 0h2m1 0h5m1 0h7M1 28.5h1m5 0h1m5 0h1m3 0h1m3 0h1m2 0h1m1 0h1m1 0h1M1 29.5h7m1 0h3m1 0h1m1 0h1m2 0h1m1 0h1m3 0h4" />
                      </svg>
                    </div>
                    <span className="text-[9.5px] font-extrabold text-slate-800 mt-1 uppercase tracking-tight">Scan to Visit</span>
                    <span className="text-[8.5px] font-bold text-blue-900 font-mono">www.wolegotransport.com</span>
                  </div>

                  <img src={logoImg} alt="Wolego Logo" className="h-28 sm:h-32 max-w-[160px] sm:max-w-[200px] object-contain" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
