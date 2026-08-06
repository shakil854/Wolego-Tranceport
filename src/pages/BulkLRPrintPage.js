import React, { useState, useEffect } from "react";
import { fetchLREntriesFromDB, getFinancialYear } from "../utils/storage";
import { Printer, RefreshCw, Eye, CheckSquare, Layers, ArrowRight, FileText, Info, Calendar } from "lucide-react";
import logoImg from "../assets/logo.png";

export default function BulkLRPrintPage() {
  const [lrEntries, setLrEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Financial Year Selection State
  const currentFYLabel = getFinancialYear(new Date()).label;
  const [selectedYear, setSelectedYear] = useState(currentFYLabel);

  // Range inputs (e.g. From 0001 to 2001)
  const [fromLR, setFromLR] = useState("0001");
  const [toLR, setToLR] = useState("2001");

  // Default: Only Office Copy Checked (as requested!)
  const [copyState, setCopyState] = useState({
    consignor: false,
    consignee: false,
    truck: false,
    office: true,
  });

  const [previewLR, setPreviewLR] = useState(null);
  const signatureImg = localStorage.getItem("wolego_digital_signature") || null;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await fetchLREntriesFromDB();
    const loaded = data || [];
    setLrEntries(loaded);

    if (loaded.length > 0) {
      // Auto-select latest year created in the system
      const years = Array.from(
        new Set(loaded.map((lr) => (lr.dateTime ? getFinancialYear(lr.dateTime).label : null)).filter(Boolean))
      ).sort((a, b) => b.localeCompare(a));
      if (years.length > 0) {
        setSelectedYear(years[0]);
      }

      const numbers = loaded.map((lr) => extractLRNumber(lr.lrNumber)).filter((n) => n > 0);
      if (numbers.length > 0) {
        const minNum = Math.min(...numbers);
        const maxNum = Math.max(...numbers);
        setFromLR(String(minNum).padStart(4, "0"));
        setToLR(String(maxNum).padStart(4, "0"));
      }
    }
    setLoading(false);
  };

  const extractLRNumber = (val) => {
    if (!val) return 0;
    const digits = String(val).replace(/\D/g, "");
    return digits ? parseInt(digits, 10) : 0;
  };

  const handleCopyToggle = (key) => {
    setCopyState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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

  // Compute available financial years sorted descending
  const availableYears = Array.from(
    new Set([
      currentFYLabel,
      ...lrEntries.map((lr) => (lr.dateTime ? getFinancialYear(lr.dateTime).label : null)).filter(Boolean),
    ])
  ).sort((a, b) => b.localeCompare(a));

  // LRs filtered by selected Financial Year
  const yearFilteredLRs = lrEntries.filter((lr) => {
    if (!selectedYear || selectedYear === "ALL") return true;
    const lrFY = lr.dateTime ? getFinancialYear(lr.dateTime).label : null;
    return lrFY === selectedYear;
  });

  const startNum = extractLRNumber(fromLR);
  const endNum = extractLRNumber(toLR);

  const filteredLRs = yearFilteredLRs.filter((lr) => {
    const lrNum = extractLRNumber(lr.lrNumber);

    if (startNum > 0 && endNum > 0) {
      const low = Math.min(startNum, endNum);
      const high = Math.max(startNum, endNum);
      if (lrNum > 0) {
        return lrNum >= low && lrNum <= high;
      }
    }

    if (fromLR && toLR) {
      const cleanLR = (lr.lrNumber || "").toLowerCase();
      const cleanFrom = fromLR.toLowerCase();
      const cleanTo = toLR.toLowerCase();
      return cleanLR >= cleanFrom && cleanLR <= cleanTo;
    }

    return true;
  });

  filteredLRs.sort((a, b) => {
    const numA = extractLRNumber(a.lrNumber);
    const numB = extractLRNumber(b.lrNumber);
    if (numA > 0 && numB > 0) return numA - numB;
    return (a.lrNumber || "").localeCompare(b.lrNumber || "", undefined, { numeric: true });
  });

  const handlePreset = (type) => {
    if (yearFilteredLRs.length === 0) return;
    const numbers = yearFilteredLRs.map((lr) => extractLRNumber(lr.lrNumber)).filter((n) => n > 0);
    if (numbers.length === 0) return;

    const minNum = Math.min(...numbers);
    const maxNum = Math.max(...numbers);

    if (type === "all") {
      setFromLR(String(minNum).padStart(4, "0"));
      setToLR(String(maxNum).padStart(4, "0"));
    } else if (type === "sample0001to2001") {
      setFromLR("0001");
      setToLR("2001");
    } else if (type === "last20") {
      const sorted = [...numbers].sort((a, b) => a - b);
      const end = sorted[sorted.length - 1];
      const start = sorted[Math.max(0, sorted.length - 20)];
      setFromLR(String(start).padStart(4, "0"));
      setToLR(String(end).padStart(4, "0"));
    }
  };

  const handlePrintAll = () => {
    window.print();
  };

  const renderLRDocument = (lrData) => (
    <div className="border-2 border-slate-900 bg-white text-slate-900 h-[290mm] min-h-[290mm] w-full flex flex-col justify-between print-document relative overflow-hidden text-xs font-sans box-border">

      {/* Background Watermark Logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
        <img
          src={logoImg}
          alt="Watermark Logo"
          className="w-[450px] max-w-[75%] opacity-[0.08] object-contain mix-blend-multiply"
        />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-between">

        {/* Header Bar */}
        <div className="border-b-2 border-slate-900 p-3 pb-2">

          {/* Copy Checkboxes Header */}
          <div className="flex flex-wrap justify-between items-center text-[10px] font-bold border-b border-slate-300 pb-1 mb-1">
            <div className="flex space-x-4 uppercase">
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={Boolean(copyState.consignor)} onChange={() => handleCopyToggle("consignor")} className="w-3 h-3 accent-slate-900" /> CONSIGNOR COPY
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={Boolean(copyState.consignee)} onChange={() => handleCopyToggle("consignee")} className="w-3 h-3 accent-slate-900" /> CONSIGNEE COPY
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={Boolean(copyState.truck)} onChange={() => handleCopyToggle("truck")} className="w-3 h-3 accent-slate-900" /> TRUCK COPY
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked={Boolean(copyState.office)} onChange={() => handleCopyToggle("office")} className="w-3 h-3 accent-slate-900" /> OFFICE COPY
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
            <div className="my-auto pt-3.5 pb-1 flex items-center justify-center flex-1 w-full px-2 overflow-hidden">
              <img
                src={logoImg}
                alt="Wolego Transport Logo"
                className="w-full max-w-[260px] h-auto max-h-[200px] object-contain mix-blend-multiply opacity-95"
                style={{ clipPath: "inset(0 0 18% 0)", transform: "scale(1.1)" }}
              />
            </div>

            {/* Signatory Block Inside Grid */}
            <div className="text-center font-sans p-2 mt-auto flex flex-col items-center justify-end min-h-[60px]">
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
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-2 sm:p-4 font-sans print:bg-white print:p-0 print:m-0 print:block print:h-auto print:overflow-visible">

      {/* On-Screen Controls (Hidden during Browser Print) */}
      <div className="max-w-7xl mx-auto space-y-4 print:hidden">

        {/* Sleek Header */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 text-slate-950 p-2.5 rounded-lg shadow-md">
              <Printer className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black text-amber-400 flex items-center gap-2">
                Range LR Record Print (Sequential LR Print)
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                Select LR From and To numbers (e.g. 0001 to 2001) to print all LRs sequentially.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Financial Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/40 px-2.5 py-1.5 rounded-lg">
              <Calendar className="w-4 h-4 text-amber-400" />
              <label className="text-xs font-bold text-amber-300 uppercase">F.Y.:</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="bg-slate-950 text-amber-400 font-extrabold text-xs px-2 py-0.5 rounded border border-slate-700 focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="ALL">ALL YEARS (सभी वर्ष)</option>
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    F.Y. {yr} {yr === currentFYLabel ? "(Current)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Data
            </button>

            <button
              onClick={handlePrintAll}
              disabled={filteredLRs.length === 0}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              <Printer className="w-5 h-5" /> Print All Range LRs ({filteredLRs.length})
            </button>
          </div>
        </div>

        {/* Range Selection Card */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">

            {/* From LR No. */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                From LR No. (e.g. 0001)
              </label>
              <input
                type="text"
                value={fromLR}
                onChange={(e) => setFromLR(e.target.value)}
                placeholder="0001"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="hidden md:flex md:col-span-1 justify-center items-center pb-2 text-slate-500 font-bold">
              <ArrowRight className="w-5 h-5 text-amber-400" />
            </div>

            {/* To LR No. */}
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                To LR No. (e.g. 2001)
              </label>
              <input
                type="text"
                value={toLR}
                onChange={(e) => setToLR(e.target.value)}
                placeholder="2001"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Quick Presets */}
            <div className="md:col-span-5 space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handlePreset("sample0001to2001")}
                  className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded text-xs font-bold border border-slate-600 transition-all"
                >
                  Range 0001 - 2001
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset("last20")}
                  className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded text-xs font-bold border border-slate-600 transition-all"
                >
                  Last 20 LRs
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset("all")}
                  className="px-2.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-amber-300 rounded text-xs font-bold border border-slate-600 transition-all"
                >
                  All LRs
                </button>
              </div>
            </div>

          </div>

          {/* Copies Selection Bar */}
          <div className="pt-3 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase text-slate-300 flex items-center gap-1">
                <CheckSquare size={16} className="text-amber-400" /> Copies to Tick:
              </span>

              <div className="flex flex-wrap gap-3 items-center text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 hover:border-slate-500">
                  <input
                    type="checkbox"
                    checked={copyState.consignor}
                    onChange={() => handleCopyToggle("consignor")}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="font-semibold text-slate-300">Consignor Copy</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 hover:border-slate-500">
                  <input
                    type="checkbox"
                    checked={copyState.consignee}
                    onChange={() => handleCopyToggle("consignee")}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="font-semibold text-slate-300">Consignee Copy</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer bg-slate-900 px-2.5 py-1.5 rounded border border-slate-700 hover:border-slate-500">
                  <input
                    type="checkbox"
                    checked={copyState.truck}
                    onChange={() => handleCopyToggle("truck")}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="font-semibold text-slate-300">Truck Copy</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer bg-amber-500/20 px-2.5 py-1.5 rounded border-2 border-amber-400">
                  <input
                    type="checkbox"
                    checked={copyState.office}
                    onChange={() => handleCopyToggle("office")}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span className="font-extrabold text-amber-300">✓ Office Copy (Checked)</span>
                </label>
              </div>
            </div>

            <div className="text-[11px] text-amber-200/80 bg-amber-950/40 px-3 py-1 rounded border border-amber-500/30 flex items-center gap-1.5 font-medium">
              <Info size={14} className="text-amber-400 shrink-0" />
              <span>Office copy is selected by default for range printing.</span>
            </div>
          </div>

        </div>

        {/* Results Summary Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">

          <div className="bg-slate-800/90 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm font-black text-slate-100 uppercase tracking-wider">
                LR Range List ({filteredLRs.length} LRs matched)
              </h2>
            </div>

            {filteredLRs.length > 0 && (
              <span className="text-xs font-mono font-bold text-amber-400 bg-slate-900 px-3 py-1 rounded border border-slate-700">
                Range: #{filteredLRs[0]?.lrNumber} ➔ #{filteredLRs[filteredLRs.length - 1]?.lrNumber}
              </span>
            )}
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 font-bold">
              Loading LRs from database...
            </div>
          ) : filteredLRs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <FileText className="w-10 h-10 mx-auto text-slate-600" />
              <p className="font-bold">No LRs found between LR #{fromLR} and #{toLR}.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[450px] overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-amber-400 font-extrabold uppercase sticky top-0 border-b border-slate-700">
                  <tr>
                    <th className="p-3 w-12 text-center">#</th>
                    <th className="p-3">LR No.</th>
                    <th className="p-3">Date</th>
                    <th className="p-3">From ➔ To</th>
                    <th className="p-3">Truck No</th>
                    <th className="p-3">Consignor</th>
                    <th className="p-3">Consignee</th>
                    <th className="p-3 text-right">Freight Amount</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/80 font-medium">
                  {filteredLRs.map((lr, idx) => (
                    <tr key={lr.id || idx} className="hover:bg-slate-700/50 transition-colors">
                      <td className="p-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-black text-amber-400 text-sm">
                        #{lr.lrNumber}
                      </td>
                      <td className="p-3 text-xs whitespace-nowrap">
                        {lr.dateTime ? new Date(lr.dateTime).toLocaleDateString("en-IN") : "-"}
                      </td>
                      <td className="p-3 font-bold uppercase text-slate-200">
                        {lr.fromPlace || "-"} ➔ {lr.toPlace || "-"}
                      </td>
                      <td className="p-3 font-mono font-bold text-white uppercase">
                        {lr.truckNo || "-"}
                      </td>
                      <td className="p-3 font-bold text-white text-xs max-w-[150px] truncate">
                        {lr.consignorName || "-"}
                      </td>
                      <td className="p-3 font-bold text-white text-xs max-w-[150px] truncate">
                        {lr.consigneeName || "-"}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-emerald-400">
                        ₹ {lr.netTotalAmount || lr.freightAmount || 0}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => setPreviewLR(lr)}
                          className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-amber-400 font-bold text-xs rounded transition-all inline-flex items-center gap-1"
                        >
                          <Eye size={13} /> Preview
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </div>

      {/* Single LR Preview Modal */}
      {previewLR && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto flex flex-col items-center justify-start print:hidden">
          <div className="w-full max-w-4xl bg-slate-800 p-3 rounded-xl border border-slate-700 mb-3 flex justify-between items-center shadow-2xl">
            <h3 className="font-extrabold text-amber-400 text-sm flex items-center gap-2">
              Previewing LR #{previewLR.lrNumber}
            </h3>
            <button
              onClick={() => setPreviewLR(null)}
              className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition-all"
            >
              Close Preview
            </button>
          </div>
          <div className="print-document print-container w-full max-w-[210mm] bg-white p-[3.5mm] rounded shadow-2xl box-border">
            {renderLRDocument(previewLR)}
          </div>
        </div>
      )}

      {/* PRINTABLE CONTAINER (Rendered only when browser print triggers) */}
      <div className="print-document print-container hidden print:block bg-white text-black font-sans m-0 p-0">
        {filteredLRs.map((lr, idx) => (
          <div key={lr.id || idx} className="range-print-sheet">
            {renderLRDocument(lr)}
          </div>
        ))}
      </div>

    </div>
  );
}
