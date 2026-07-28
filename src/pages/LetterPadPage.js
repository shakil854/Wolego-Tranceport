import React, { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Printer,
  FileSignature,
  Trash2,
  Calendar,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import logoImg from "../assets/logo.png";

export default function LetterPadPage() {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);

  // Digital Signature State
  const [signatureImg, setSignatureImg] = useState(() => {
    return localStorage.getItem("wolego_digital_signature") || null;
  });

  // Upload digital signature
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

  // Remove signature
  const handleRemoveSignature = () => {
    setSignatureImg(null);
    localStorage.removeItem("wolego_digital_signature");
  };

  // Execute Rich Text Format Commands
  const formatText = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  // Insert Today's Date Header
  const insertDate = () => {
    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    formatText("insertHTML", `<p><strong>DATE:</strong> ${today}</p><p><br></p>`);
  };

  // Insert Sample Official Letter Template
  const insertSampleTemplate = () => {
    if (!editorRef.current) return;
    const today = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    editorRef.current.innerHTML = `
      <p style="text-align: right;"><strong>DATE: ${today}</strong></p>
      <p style="text-align: right;"><strong>REF NO: WT/LP/${Date.now().toString().slice(-4)}</strong></p>
      <p><br></p>
      <p><strong>TO,</strong></p>
      <p><strong>THE MANAGER / AUTHORIZED OFFICER</strong></p>
      <p>SUBJECT: <u>TRANSPORTATION & FREIGHT SERVICES UNDERTAKING</u></p>
      <p><br></p>
      <p>Respected Sir / Madam,</p>
      <p><br></p>
      <p>We, <strong>WOLEGO TRANSPORT</strong>, hereby certify and confirm that all consignment deliveries and transport operations executed under our supervision adhere to standard safety and delivery compliance guidelines.</p>
      <p><br></p>
      <p>This letter pad serves as an official communication for your records.</p>
      <p><br></p>
      <p>Thanking You,</p>
      <p>Yours Faithfully,</p>
    `;
  };

  // Clear Content
  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all text?")) {
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    }
  };

  // Browser Print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-2 sm:p-4 font-sans print:bg-white print:p-0 print:m-0 print:block print:h-auto print:overflow-visible">
      
      {/* On-Screen Controls Toolbar (Hidden during Browser Print) */}
      <div className="max-w-[210mm] mx-auto space-y-3 mb-4 print:hidden">
        
        {/* Header Navigation */}
        <div className="bg-slate-800 p-3 sm:p-4 rounded-xl border border-slate-700 shadow-xl flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 hover:text-white transition-all"
              title="Back to Dashboard"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-base sm:text-lg font-black text-amber-400 flex items-center gap-2">
                <Sparkles size={20} className="text-amber-400" /> Wolego Letter Pad (A4 Print)
              </h1>
              <p className="text-xs text-slate-400 font-bold">
                Create & print official letterheads on A4 paper format
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-4 py-2 rounded-lg text-xs shadow-lg transition-all transform active:scale-95 cursor-pointer"
            >
              <Printer size={16} /> Print Letter Pad (A4)
            </button>
          </div>
        </div>

        {/* Formatting Toolbar */}
        <div className="bg-slate-800 p-2.5 rounded-xl border border-slate-700 shadow-md flex flex-wrap items-center justify-between gap-2">
          
          {/* Text Styling */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button
              type="button"
              onClick={() => formatText("bold")}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-amber-400 font-bold"
              title="Bold Text"
            >
              <Bold size={16} />
            </button>
            <button
              type="button"
              onClick={() => formatText("italic")}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-amber-400 italic"
              title="Italic Text"
            >
              <Italic size={16} />
            </button>
            <button
              type="button"
              onClick={() => formatText("underline")}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-amber-400 underline"
              title="Underline Text"
            >
              <Underline size={16} />
            </button>

            <div className="h-4 w-px bg-slate-700 mx-1"></div>

            <button
              type="button"
              onClick={() => formatText("justifyLeft")}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-amber-400"
              title="Align Left"
            >
              <AlignLeft size={16} />
            </button>
            <button
              type="button"
              onClick={() => formatText("justifyCenter")}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-amber-400"
              title="Align Center"
            >
              <AlignCenter size={16} />
            </button>
            <button
              type="button"
              onClick={() => formatText("justifyRight")}
              className="p-1.5 hover:bg-slate-700 rounded text-slate-300 hover:text-amber-400"
              title="Align Right"
            >
              <AlignRight size={16} />
            </button>
          </div>
        </div>

      </div>

      {/* Printable A4 Letter Pad Container */}
      <div className="w-full max-w-[210mm] mx-auto bg-white p-[4mm] shadow-2xl rounded-sm print-container print:p-[4mm] print:m-0 print:w-[210mm] print:h-[297mm] print:max-w-none print:shadow-none font-sans text-xs box-border">
        
        {/* Inner Bordered Document Container */}
        <div className="border-2 border-slate-900 bg-white text-slate-900 min-h-[287mm] h-full flex flex-col justify-between print-document relative overflow-hidden box-border p-3">
          
          {/* Background Watermark Logo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
            <img
              src={logoImg}
              alt="Watermark Logo"
              className="w-[450px] max-w-[75%] opacity-[0.07] object-contain mix-blend-multiply"
            />
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-between h-full">
            
            {/* Top Official Header Banner (Identical to LR Print Header) */}
            <div>
              <div className="text-center font-extrabold uppercase tracking-wide text-[10px] border-b border-slate-900 pb-0.5 mb-2 text-slate-900">
                <u>SUBJECT TO WANKANER JURISDICTION</u>
              </div>

              <div className="grid grid-cols-12 items-center gap-2 pb-2 border-b-2 border-slate-900">
                {/* Left Logo */}
                <div className="col-span-3 flex flex-col items-center justify-center border-r border-slate-300 pr-2">
                  <img
                    src={logoImg}
                    alt="Wolego Transport Logo"
                    className="h-24 sm:h-28 w-auto max-w-full object-contain mix-blend-multiply"
                  />
                </div>

                {/* Center Title & Address */}
                <div className="col-span-6 text-center space-y-1">
                  <h1 className="text-[24px] sm:text-[28px] font-black text-[#009a44] font-serif tracking-wider uppercase leading-tight">
                    WOLEGO TRANSPORT
                  </h1>
                  <p className="text-[12px] font-black italic text-[#800000] tracking-wide">
                    EVERYTHING IS FAST
                  </p>
                  <div className="bg-[#1e3a8a] text-white font-black text-[10.5px] py-0.5 px-2 rounded-xs uppercase tracking-wider inline-block">
                    TRANSPORT CONTRACTOR AND COMMISSION AGENT
                  </div>
                  <p className="text-[9.5px] font-black text-[#800000] leading-snug px-1">
                    SURVEY NUMBER NA 178P8, 27 NATIONAL HIGHWAY, CHANDRAPUR, WANKANER-363621 DISTRICT-MORBI ( GUJRAT )
                  </p>
                </div>

                {/* Right Contact Details */}
                <div className="col-span-3 border-l border-slate-300 pl-2 space-y-1 text-[9.5px] font-black text-slate-950">
                  <div>MOBILE NO. +91 99 79 111 555</div>
                  <div>MOBILE NO. +91 81 41 111 555</div>
                  <div>PAN NO. : DLTPS8567M</div>
                  <div>GSTIN NO. : 24DLTPS8567M1ZT</div>
                </div>
              </div>
            </div>

            {/* Middle Editable Letter Body Canvas */}
            <div className="flex-1 py-4 px-2 my-2 relative min-h-[550px]">
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="w-full h-full min-h-[550px] outline-none text-slate-950 font-sans text-sm leading-relaxed focus:bg-amber-50/10 p-2 rounded transition-all whitespace-pre-wrap"
              >
                <p><br /></p>
              </div>
            </div>

            {/* Bottom Footer Signatory Block */}
            <div className="pt-3 border-t border-slate-300 mt-auto">
              <div className="flex justify-end items-end">

                <div className="text-center font-sans p-2 flex flex-col items-center justify-end min-h-[60px]">
                  <div className="font-black uppercase text-[11px] text-slate-950">
                    FOR, WOLEGO TRANSPORT
                  </div>
                  {signatureImg ? (
                    <img
                      src={signatureImg}
                      alt="Authorised Digital Signature"
                      className="h-10 w-auto max-w-[150px] object-contain my-1 mix-blend-multiply"
                    />
                  ) : (
                    <div className="h-8"></div>
                  )}
                  <div className="text-[9.5px] text-slate-950 uppercase tracking-wider font-extrabold">
                    (AUTHORISED SIGNATORY)
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
