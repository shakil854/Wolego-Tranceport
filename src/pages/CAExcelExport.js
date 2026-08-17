import React, { useState, useEffect } from "react";
import { fetchLREntriesFromDB, fetchPartiesFromDB } from "../utils/storage";
import { FileSpreadsheet, Download, RefreshCw, Filter, CheckCircle, Info, FileText } from "lucide-react";

export default function CAExcelExport() {
  const [lrEntries, setLrEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  // Normalize any date string to YYYY-MM-DD
  const normalizeDateStr = (dateVal) => {
    if (!dateVal) return "";
    if (typeof dateVal === "string") {
      const clean = dateVal.split("T")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
      if (clean.includes("/")) {
        const parts = clean.split("/");
        if (parts.length === 3 && parts[2].length === 4) {
          const [d, m, y] = parts;
          return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
        }
      }
    }
    try {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    } catch (e) {}
    return "";
  };

  // Format date for display and Excel in DD/MM/YYYY
  const formatDateToDDMMYYYY = (dateStr) => {
    if (!dateStr) return "";
    const clean = normalizeDateStr(dateStr);
    if (clean && clean.includes("-")) {
      const [y, m, d] = clean.split("-");
      return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
    }
    return dateStr;
  };

  // Default dates: Start of current month to today
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const formatISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const [fromDate, setFromDate] = useState(formatISO(firstDay));
  const [toDate, setToDate] = useState(formatISO(now));

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [lrData, partyData] = await Promise.all([
      fetchLREntriesFromDB(),
      fetchPartiesFromDB(),
    ]);
    setLrEntries(lrData || []);
    setParties(partyData || []);
    setLoading(false);
  };

  // Quick Preset Handlers
  const handlePreset = (preset) => {
    const current = new Date();
    if (preset === "thisMonth") {
      const start = new Date(current.getFullYear(), current.getMonth(), 1);
      setFromDate(formatISO(start));
      setToDate(formatISO(current));
    } else if (preset === "today") {
      setFromDate(formatISO(current));
      setToDate(formatISO(current));
    } else if (preset === "lastMonth") {
      const start = new Date(current.getFullYear(), current.getMonth() - 1, 1);
      const end = new Date(current.getFullYear(), current.getMonth(), 0);
      setFromDate(formatISO(start));
      setToDate(formatISO(end));
    } else if (preset === "all") {
      setFromDate("");
      setToDate("");
    }
  };

  // Party GST lookup map
  const partyGstMap = React.useMemo(() => {
    const map = {};
    parties.forEach((p) => {
      if (p.partyName) {
        map[p.partyName.trim().toLowerCase()] = p.gstNo || "";
      }
    });
    return map;
  }, [parties]);

  // Filter LR records based on date range
  const filteredLRs = React.useMemo(() => {
    return lrEntries.filter((lr) => {
      if (!lr.dateTime) return true;
      const lrDateNorm = normalizeDateStr(lr.dateTime);

      if (fromDate && lrDateNorm && lrDateNorm < fromDate) return false;
      if (toDate && lrDateNorm && lrDateNorm > toDate) return false;
      return true;
    }).sort((a, b) => new Date(a.dateTime || 0) - new Date(b.dateTime || 0));
  }, [lrEntries, fromDate, toDate]);

  // Prepared data items for table preview and export
  const reportRows = React.useMemo(() => {
    const sourceList = filteredLRs.length > 0 ? filteredLRs : lrEntries;

    return sourceList.map((lr, index) => {
      const partyName = lr.consigneeName || lr.consignorName || "-";
      const partyGstFromMap = partyGstMap[partyName.trim().toLowerCase()] || "";
      const gstNo = lr.consigneeGst || partyGstFromMap || lr.consignorGst || "N/A";
      
      const invValue = parseFloat(lr.netTotalAmount || lr.totalWithGst || lr.freightAmount || lr.invoiceValue || 0);
      const taxableVal = parseFloat(lr.netTotalAmount || lr.freightAmount || 0);
      const taxRate = (parseFloat(lr.sgstPercent || 0) + parseFloat(lr.cgstPercent || 0) + parseFloat(lr.igstPercent || 0));

      return {
        srNo: index + 1,
        gstin: gstNo,
        receiverName: partyName,
        invoiceNo: index + 1, // Sequential number as shown in screenshot
        lrNumber: lr.lrNumber,
        invoiceDateRaw: lr.dateTime,
        invoiceDateFormatted: formatDateToDDMMYYYY(lr.dateTime),
        invoiceValue: invValue,
        placeOfSupply: "/", // Shown as '/' in screenshot
        reverseCharges: "Y", // Transport B2B is Y
        invoiceType: "Regular",
        ecommerceGstin: "Not Applicable",
        taxRate: taxRate,
        taxableValue: taxableVal,
        cessAmount: 0,
      };
    });
  }, [filteredLRs, lrEntries, partyGstMap]);

  // Totals calculations
  const totalTaxable = reportRows.reduce((sum, r) => sum + r.taxableValue, 0);
  const totalInvoiceVal = reportRows.reduce((sum, r) => sum + r.invoiceValue, 0);

  // Pre-generate Data URI for Direct HTML Download Link
  const { excelDataUri, excelFileName } = React.useMemo(() => {
    const fromStr = fromDate ? formatDateToDDMMYYYY(fromDate) : "ALL";
    const toStr = toDate ? formatDateToDDMMYYYY(toDate) : "ALL";
    const fileName = `CA_B2B_Report_${fromStr.replace(/\//g, "-")}_to_${toStr.replace(/\//g, "-")}.xls`;

    let excelContent = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8">
<!--[if gte mso 9]>
<xml>
 <x:ExcelWorkbook>
  <x:ExcelWorksheets>
   <x:ExcelWorksheet>
    <x:Name>B2B</x:Name>
    <x:WorksheetOptions>
     <x:DisplayGridlines/>
    </x:WorksheetOptions>
   </x:ExcelWorksheet>
  </x:ExcelWorksheets>
 </x:ExcelWorkbook>
</xml>
<![endif]-->
<style>
  .title-text { font-family: Arial; font-size: 14pt; font-weight: bold; color: #000000; }
  .period-text { font-family: Arial; font-size: 11pt; font-weight: bold; color: #000000; }
  .th-yellow { background-color: #FFFF00; font-family: Arial; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1px solid #000000; padding: 6px; }
  .th-cyan { background-color: #CCFFFF; font-family: Arial; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1px solid #000000; padding: 6px; }
  .th-pink { background-color: #FF99CC; font-family: Arial; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1px solid #000000; padding: 6px; }
  .th-blue { background-color: #99CCFF; font-family: Arial; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1px solid #000000; padding: 6px; }
  .th-purple { background-color: #D1C4E9; font-family: Arial; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1px solid #000000; padding: 6px; }
  .th-green { background-color: #76FF03; font-family: Arial; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1px solid #000000; padding: 6px; }
  .td-left { font-family: Calibri; font-size: 10pt; text-align: left; vertical-align: middle; border-bottom: 1px dotted #888888; border-left: 1px solid #E0E0E0; border-right: 1px solid #E0E0E0; padding: 5px; mso-number-format:"\\@"; }
  .td-center { font-family: Calibri; font-size: 10pt; text-align: center; vertical-align: middle; border-bottom: 1px dotted #888888; border-left: 1px solid #E0E0E0; border-right: 1px solid #E0E0E0; padding: 5px; mso-number-format:"\\@"; }
  .td-date { font-family: Calibri; font-size: 10pt; text-align: center; vertical-align: middle; border-bottom: 1px dotted #888888; border-left: 1px solid #E0E0E0; border-right: 1px solid #E0E0E0; padding: 5px; mso-number-format:"\\@"; }
  .td-right { font-family: Calibri; font-size: 10pt; text-align: right; vertical-align: middle; border-bottom: 1px dotted #888888; border-left: 1px solid #E0E0E0; border-right: 1px solid #E0E0E0; padding: 5px; }
</style>
</head>
<body>
<table>
  <tr>
    <td></td>
    <td colspan="6" class="title-text">B2B REPORT</td>
  </tr>
  <tr>
    <td></td>
    <td colspan="6" class="period-text">For the Period From : ${fromStr} To ${toStr}</td>
  </tr>
  <tr></tr>
  <tr>
    <td></td>
    <th class="th-yellow">GST/UIN of<br/>Receiptient</th>
    <th class="th-cyan">Receiver Name</th>
    <th class="th-pink">Invoice<br/>Number</th>
    <th class="th-pink">Invoice<br/>Date</th>
    <th class="th-pink">Invoice<br/>Value</th>
    <th class="th-cyan">Place of Supply</th>
    <th class="th-yellow">Reverse<br/>Charges</th>
    <th class="th-blue">Invoice<br/>Type</th>
    <th class="th-pink">E-Commerce<br/>GSTTin</th>
    <th class="th-purple">Applicable of<br/>% of Tax Rate</th>
    <th class="th-green">Taxable<br/>Value</th>
    <th class="th-yellow">Cess<br/>Amount</th>
  </tr>`;

    reportRows.forEach((row) => {
      excelContent += `
  <tr>
    <td></td>
    <td class="td-left">${row.gstin}</td>
    <td class="td-left">${row.receiverName}</td>
    <td class="td-center">${row.invoiceNo}</td>
    <td class="td-date">${row.invoiceDateFormatted}</td>
    <td class="td-right">${row.invoiceValue}</td>
    <td class="td-center">${row.placeOfSupply}</td>
    <td class="td-center">${row.reverseCharges}</td>
    <td class="td-center">${row.invoiceType}</td>
    <td class="td-center">${row.ecommerceGstin}</td>
    <td class="td-right">${row.taxRate}</td>
    <td class="td-right">${row.taxableValue}</td>
    <td class="td-right">${row.cessAmount}</td>
  </tr>`;
    });

    excelContent += `
</table>
</body>
</html>`;

    let dataUri = "";
    try {
      dataUri = "data:application/vnd.ms-excel;charset=utf-8;base64," + window.btoa(unescape(encodeURIComponent(excelContent)));
    } catch (e) {
      dataUri = "data:application/vnd.ms-excel;charset=utf-8," + encodeURIComponent(excelContent);
    }

    return { excelDataUri: dataUri, excelFileName: fileName };
  }, [reportRows, fromDate, toDate]);

  return (
    <div className="min-h-[calc(100vh-68px)] bg-slate-900 text-slate-100 p-4 font-sans flex flex-col space-y-4">
      <div className="max-w-7xl w-full mx-auto space-y-4">

        {/* Page Header */}
        <div className="bg-slate-800 p-4 rounded-xl border border-amber-500/30 shadow-lg flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
              <FileSpreadsheet className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black text-amber-400 tracking-wide uppercase flex items-center gap-2">
                CA EXCEL Export (B2B Report)
              </h1>
              <p className="text-xs text-slate-400">
                Generate formatted B2B GST report matching CA exact Excel template format
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Direct HTML Download Anchor Link */}
            <a
              href={excelDataUri}
              download={excelFileName}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg flex items-center space-x-2 shadow-lg cursor-pointer transition-all active:scale-95 no-underline"
            >
              <Download className="w-4 h-4" />
              <span>Download CA Excel Report</span>
            </a>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-md space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-700">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Filter size={14} /> Select Date Range
            </span>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                onClick={() => handlePreset("thisMonth")}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-amber-300 font-semibold rounded border border-slate-600 transition"
              >
                This Month
              </button>
              <button
                onClick={() => handlePreset("today")}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-amber-300 font-semibold rounded border border-slate-600 transition"
              >
                Today
              </button>
              <button
                onClick={() => handlePreset("lastMonth")}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-amber-300 font-semibold rounded border border-slate-600 transition"
              >
                Last Month
              </button>
              <button
                onClick={() => handlePreset("all")}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-amber-300 font-semibold rounded border border-slate-600 transition"
              >
                All Records ({lrEntries.length})
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <button
                onClick={loadData}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg text-sm transition flex items-center justify-center space-x-2 border border-slate-600"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Total Invoices</div>
              <div className="text-2xl font-black text-amber-400 font-mono mt-1">
                {reportRows.length}
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-lg text-amber-400">
              <FileSpreadsheet size={24} />
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Total Taxable Value</div>
              <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
                ₹ {totalTaxable.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-lg text-emerald-400">
              <CheckCircle size={24} />
            </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-400 uppercase">Total Invoice Value</div>
              <div className="text-2xl font-black text-sky-400 font-mono mt-1">
                ₹ {totalInvoiceVal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="p-3 bg-sky-500/10 rounded-lg text-sky-400">
              <Info size={24} />
            </div>
          </div>
        </div>

        {/* Live Data Preview Table */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col">
          <div className="p-3 bg-slate-950 border-b border-slate-700 flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wide flex items-center gap-2">
              <FileText size={16} /> Live Excel Preview ({reportRows.length} Entries)
            </span>
            <a
              href={excelDataUri}
              download={excelFileName}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all active:scale-95 no-underline"
            >
              <Download size={14} /> Download Excel File
            </a>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="text-[11px] font-black uppercase text-slate-900 border-b border-slate-700">
                  <th className="p-2.5 bg-yellow-400 text-center border-r border-yellow-500 min-w-[150px]">
                    GST/UIN of Receiptient
                  </th>
                  <th className="p-2.5 bg-cyan-200 text-slate-900 border-r border-cyan-300 min-w-[220px]">
                    Receiver Name
                  </th>
                  <th className="p-2.5 bg-pink-300 text-center border-r border-pink-400 min-w-[100px]">
                    Invoice Number
                  </th>
                  <th className="p-2.5 bg-pink-300 text-center border-r border-pink-400 min-w-[100px]">
                    Invoice Date
                  </th>
                  <th className="p-2.5 bg-pink-300 text-right border-r border-pink-400 min-w-[110px]">
                    Invoice Value
                  </th>
                  <th className="p-2.5 bg-cyan-200 text-center border-r border-cyan-300 min-w-[110px]">
                    Place of Supply
                  </th>
                  <th className="p-2.5 bg-yellow-400 text-center border-r border-yellow-500 min-w-[100px]">
                    Reverse Charges
                  </th>
                  <th className="p-2.5 bg-blue-300 text-center border-r border-blue-400 min-w-[110px]">
                    Invoice Type
                  </th>
                  <th className="p-2.5 bg-pink-300 text-center border-r border-pink-400 min-w-[140px]">
                    E-Commerce GSTTin
                  </th>
                  <th className="p-2.5 bg-purple-300 text-center border-r border-purple-400 min-w-[140px]">
                    Applicable % of Tax Rate
                  </th>
                  <th className="p-2.5 bg-lime-400 text-right border-r border-lime-500 min-w-[120px]">
                    Taxable Value
                  </th>
                  <th className="p-2.5 bg-yellow-400 text-center min-w-[90px]">
                    Cess Amount
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700 bg-slate-900 font-medium">
                {reportRows.map((row) => (
                  <tr key={row.srNo} className="hover:bg-slate-800 transition-colors">
                    <td className="p-2.5 font-mono text-amber-300 font-bold border-r border-slate-800">
                      {row.gstin}
                    </td>
                    <td className="p-2.5 font-bold text-white uppercase border-r border-slate-800">
                      {row.receiverName}
                    </td>
                    <td className="p-2.5 text-center font-mono font-bold text-slate-200 border-r border-slate-800">
                      {row.invoiceNo}
                    </td>
                    <td className="p-2.5 text-center font-mono border-r border-slate-800">
                      {row.invoiceDateFormatted}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-400 border-r border-slate-800">
                      ₹ {row.invoiceValue.toFixed(0)}
                    </td>
                    <td className="p-2.5 text-center font-bold border-r border-slate-800">
                      {row.placeOfSupply}
                    </td>
                    <td className="p-2.5 text-center font-bold text-amber-400 border-r border-slate-800">
                      {row.reverseCharges}
                    </td>
                    <td className="p-2.5 text-center border-r border-slate-800">
                      {row.invoiceType}
                    </td>
                    <td className="p-2.5 text-center text-slate-400 border-r border-slate-800">
                      {row.ecommerceGstin}
                    </td>
                    <td className="p-2.5 text-center font-mono border-r border-slate-800">
                      {row.taxRate}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-emerald-400 border-r border-slate-800">
                      ₹ {row.taxableValue.toFixed(0)}
                    </td>
                    <td className="p-2.5 text-center font-mono text-slate-400">
                      {row.cessAmount}
                    </td>
                  </tr>
                ))}

                {reportRows.length === 0 && (
                  <tr>
                    <td colSpan="12" className="text-center py-12 text-slate-500">
                      {loading ? (
                        "Loading database records..."
                      ) : (
                        <div className="space-y-2">
                          <p>No LR records found for selected date range.</p>
                          <button
                            onClick={() => handlePreset("all")}
                            className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded text-xs cursor-pointer"
                          >
                            Click to View & Export All Records ({lrEntries.length})
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
