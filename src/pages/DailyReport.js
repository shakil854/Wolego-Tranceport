import React, { useState, useEffect } from "react";
import { fetchLREntriesFromDB, fetchPartiesFromDB, fetchTrucksFromDB, getFinancialYear, formatDateDisplay } from "../utils/storage";
import { Printer, Search, Calendar, FileText, RefreshCw, Filter, Truck, User, Phone, MapPin } from "lucide-react";

export default function DailyReport() {
  const [lrEntries, setLrEntries] = useState([]);
  const [parties, setParties] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedFY, setSelectedFY] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [lrData, partyData, truckData] = await Promise.all([
      fetchLREntriesFromDB(),
      fetchPartiesFromDB(),
      fetchTrucksFromDB(),
    ]);

    const safeLRs = lrData || [];
    setLrEntries(safeLRs);
    setParties(partyData || []);
    setTrucks(truckData || []);

    // Auto-select the latest financial year in database where LRs are created (matching LR List)
    let defaultFY = getFinancialYear(new Date()).label;
    if (safeLRs.length > 0) {
      const dbYears = Array.from(
        new Set(safeLRs.map((lr) => (lr.dateTime ? getFinancialYear(lr.dateTime).label : null)).filter(Boolean))
      ).sort((a, b) => b.localeCompare(a));
      if (dbYears.length > 0) {
        defaultFY = dbYears[0];
      }
    }
    setSelectedFY(defaultFY);

    // Filter LRs for default FY to find default latest date
    const fylrs = safeLRs.filter((lr) => lr.dateTime && getFinancialYear(lr.dateTime).label === defaultFY);
    if (fylrs.length > 0) {
      // Find latest date in FY
      const sorted = [...fylrs].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
      setSelectedDate(sorted[0].dateTime ? sorted[0].dateTime.split("T")[0] : "");
    } else {
      // Fallback to today's date in YYYY-MM-DD format
      const todayStr = new Date().toISOString().split("T")[0];
      setSelectedDate(todayStr);
    }
    setLoading(false);
  };

  // Extract list of all Financial Years present in dataset + current running FY
  const getAvailableFYs = () => {
    const fySet = new Set();
    const currentFY = getFinancialYear(new Date()).label;
    fySet.add(currentFY);

    lrEntries.forEach((lr) => {
      if (lr.dateTime) {
        const fy = getFinancialYear(lr.dateTime).label;
        fySet.add(fy);
      }
    });

    return Array.from(fySet).sort().reverse();
  };

  // Extract unique dates for selected Financial Year
  const getAvailableDatesInFY = () => {
    if (!selectedFY) return [];
    const dateSet = new Set();
    lrEntries.forEach((lr) => {
      if (lr.dateTime && getFinancialYear(lr.dateTime).label === selectedFY) {
        const cleanDate = lr.dateTime.split("T")[0];
        dateSet.add(cleanDate);
      }
    });
    return Array.from(dateSet).sort().reverse();
  };

  // Handler for FY change -> set date to latest date in that FY
  const handleFYChange = (fy) => {
    setSelectedFY(fy);
    if (fy === "ALL") {
      setSelectedDate("");
      return;
    }
    const fylrs = lrEntries.filter((lr) => lr.dateTime && getFinancialYear(lr.dateTime).label === fy);
    if (fylrs.length > 0) {
      const sorted = [...fylrs].sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
      setSelectedDate(sorted[0].dateTime ? sorted[0].dateTime.split("T")[0] : "");
    } else {
      setSelectedDate("");
    }
  };

  // Helper to format phone number to +91 format
  const formatPhone = (numStr) => {
    if (!numStr) return "";
    const clean = numStr.toString().trim().replace(/[^0-9+]/g, "");
    if (!clean) return "";
    if (clean.startsWith("+")) return clean;
    if (clean.length === 10) return `+91${clean}`;
    if (clean.length === 12 && clean.startsWith("91")) return `+${clean}`;
    return clean;
  };

  // Look up Party Mobile from Party Master using Consignee Name (or Party Name)
  const getPartyMobile = (partyNameVal) => {
    if (!partyNameVal) return "";
    const searchStr = partyNameVal.trim().toLowerCase();
    
    // Exact match or partial match in Party Master
    const matchedParty = parties.find(
      (p) => p.partyName && p.partyName.trim().toLowerCase() === searchStr
    ) || parties.find(
      (p) => p.partyName && searchStr.includes(p.partyName.trim().toLowerCase())
    );

    if (matchedParty && matchedParty.mobileNos) {
      const formatted = formatPhone(matchedParty.mobileNos.split(",")[0].trim());
      return formatted ? `P-${formatted}` : "";
    }

    return "";
  };

  // Get Driver Mobile number
  const getDriverMobile = (lr) => {
    if (lr.driverMobile) {
      const formatted = formatPhone(lr.driverMobile);
      return formatted ? `D-${formatted}` : "D-";
    }

    // Try lookup in Truck Master
    if (lr.truckNo) {
      const cleanTruck = lr.truckNo.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
      const matchedTruck = trucks.find(
        (t) => t.truckNo && t.truckNo.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() === cleanTruck
      );
      if (matchedTruck && matchedTruck.mobileNo) {
        const formatted = formatPhone(matchedTruck.mobileNo);
        return formatted ? `D-${formatted}` : "D-";
      }
    }

    return "D-";
  };

  // Extract Consignee City, Party City, and Weight (toPlace - Party City - LR.weight)
  const getConsigneeDetails = (lr) => {
    const consigneeName = lr.consigneeName || "";
    const toPlace = (lr.toPlace || "").trim().toUpperCase();
    let partyCity = "";

    // Look up party master for party's city
    if (consigneeName) {
      const searchStr = consigneeName.trim().toLowerCase();
      const matchedParty = parties.find(
        (p) => p.partyName && p.partyName.trim().toLowerCase() === searchStr
      ) || parties.find(
        (p) => p.partyName && (searchStr.includes(p.partyName.trim().toLowerCase()) || p.partyName.trim().toLowerCase().includes(searchStr))
      );

      if (matchedParty && matchedParty.city) {
        partyCity = matchedParty.city.trim().toUpperCase();
      }
    }

    const firstPlace = toPlace || partyCity || "DESTINATION";
    const weight = lr.weightKgs ? `${lr.weightKgs}` : "0";

    // Only add middle part if Party Master has a city
    if (partyCity) {
      return `${firstPlace}-${partyCity}-${weight}`;
    }
    return `${firstPlace}-${weight}`;
  };

  // Helper to parse Consignors into clean list of names
  const parseConsignors = (rawConsignorStr) => {
    if (!rawConsignorStr) return [];
    
    // Split by newlines or numbered list patterns like (1), (2), (3)
    const lines = rawConsignorStr
      .split(/\n|\(\d+\)/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("Address:") && !s.startsWith("GST:"));

    const consignorNames = [];
    lines.forEach((line) => {
      // Remove any leading numbers or symbols
      const clean = line.replace(/^\d+[\.\)\-]?\s*/, "").trim();
      if (clean && !clean.toLowerCase().includes("gst") && !clean.toLowerCase().includes("address")) {
        consignorNames.push(clean.toUpperCase());
      }
    });

    return consignorNames.length > 0 ? consignorNames : [rawConsignorStr.trim().toUpperCase()];
  };

  // Format Party Name & Consignor Line: "P- Party Name - CONSIGNOR Name"
  const getPartyAndConsignorsLine = (lr) => {
    const partyName = (lr.consigneeName || lr.debitAmountTo || "PARTY").trim().toUpperCase();
    const consignors = parseConsignors(lr.consignorName);

    if (consignors.length === 0) {
      return `P-${partyName}`;
    }

    // Format: P-PartyName-Consignor1+Consignor2+Consignor3
    const consignorsJoined = consignors.join("+");
    return `P-${partyName}-${consignorsJoined}`;
  };

  // Filter LR entries based on FY, Single Date, and Search Query
  const filteredLRs = lrEntries.filter((lr) => {
    // FY Filter
    if (selectedFY && selectedFY !== "ALL") {
      if (!lr.dateTime || getFinancialYear(lr.dateTime).label !== selectedFY) {
        return false;
      }
    }

    // Date Filter
    if (selectedDate) {
      if (!lr.dateTime || !lr.dateTime.startsWith(selectedDate)) {
        return false;
      }
    }

    // Search Query Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const lrNumMatch = lr.lrNumber && lr.lrNumber.toString().includes(q);
      const partyMatch = lr.consigneeName && lr.consigneeName.toLowerCase().includes(q);
      const consignorMatch = lr.consignorName && lr.consignorName.toLowerCase().includes(q);
      const truckMatch = lr.truckNo && lr.truckNo.toLowerCase().includes(q);
      const placeMatch = (lr.toPlace && lr.toPlace.toLowerCase().includes(q)) || (lr.fromPlace && lr.fromPlace.toLowerCase().includes(q));

      if (!lrNumMatch && !partyMatch && !consignorMatch && !truckMatch && !placeMatch) {
        return false;
      }
    }

    return true;
  });

  // Sort LRs by LR Number numerically
  const sortedFilteredLRs = [...filteredLRs].sort((a, b) => {
    const numA = parseInt(a.lrNumber, 10) || 0;
    const numB = parseInt(b.lrNumber, 10) || 0;
    return numA - numB;
  });

  const availableFYs = getAvailableFYs();
  const availableDates = getAvailableDatesInFY();

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 bg-slate-900 text-slate-100 p-3 sm:p-6 overflow-y-auto font-sans">
      {/* Screen Controls & Header (Hidden during Print) */}
      <div className="print:hidden max-w-7xl mx-auto space-y-5">
        {/* Title Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-amber-400 flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-400" />
              Daily Report Master
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Select date & financial year to view and print daily lorry receipt report
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={loadData}
              className="p-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition flex items-center gap-1.5 text-xs font-bold"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handlePrint}
              disabled={sortedFilteredLRs.length === 0}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
            >
              <Printer className="w-4 h-4" />
              <span>Print Daily Report</span>
            </button>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-slate-800/90 border border-slate-700 p-4 rounded-xl shadow-md grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          {/* Financial Year Selector */}
          <div>
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              Financial Year
            </label>
            <select
              value={selectedFY}
              onChange={(e) => handleFYChange(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Financial Years</option>
              {availableFYs.map((fy) => (
                <option key={fy} value={fy}>
                  FY {fy} {fy === getFinancialYear(new Date()).label ? "(Running Year)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
              Select Date
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-sm font-semibold focus:outline-none focus:border-amber-500"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate("")}
                  className="px-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-bold"
                  title="Show All Dates"
                >
                  All
                </button>
              )}
            </div>
          </div>

          {/* Search Box */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              Search LR / Party / City
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-100 pl-9 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Stats Summary Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
          <div>
            Total Entries: <span className="font-bold text-amber-400">{sortedFilteredLRs.length}</span> LRs
            {selectedDate && <span> for date <span className="text-white font-bold">{formatDateDisplay(selectedDate)}</span></span>}
          </div>
          <div>
            FY: <span className="text-white font-bold">{selectedFY || "ALL"}</span>
          </div>
        </div>
      </div>

      {/* Main Report Table Container (Used for both Screen and Printing) */}
      <div className="max-w-7xl mx-auto mt-4 print:mt-0 print:max-w-full">
        {loading ? (
          <div className="text-center py-12 text-slate-400 font-bold flex items-center justify-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-400" />
            Loading Daily Report data...
          </div>
        ) : sortedFilteredLRs.length === 0 ? (
          <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700 text-slate-400 font-semibold print:hidden">
            No LR records found for the selected date and financial year filters.
          </div>
        ) : (
          <div className="bg-white text-slate-950 rounded-xl p-2 sm:p-4 shadow-xl print:p-0 print:shadow-none print:bg-white">
            
            {/* Printable Report Header */}
            <div className="hidden print:block text-center border-b-2 border-black pb-2 mb-2">
              <h2 className="text-lg font-black uppercase tracking-wider text-black">
                WOLEGO TRANSPORT - DAILY LR REPORT
              </h2>
              <div className="flex justify-between items-center text-xs font-bold text-black mt-1 px-1">
                <span>DATE: {selectedDate ? formatDateDisplay(selectedDate) : "ALL DATES"}</span>
                <span>FINANCIAL YEAR: {selectedFY}</span>
                <span>TOTAL LRs: {sortedFilteredLRs.length}</span>
              </div>
            </div>

            {/* Daily Report Table Grid - EXACT SAME FORMAT AS IMAGE 1 & IMAGE 2 */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-slate-950 text-slate-950 font-sans text-xs sm:text-sm">
                <tbody>
                  {sortedFilteredLRs.map((lr) => {
                    const partyMobile = getPartyMobile(lr.consigneeName || lr.debitAmountTo);
                    const driverMobile = getDriverMobile(lr);
                    const consigneeDetails = getConsigneeDetails(lr);
                    const partyConsignorLine = getPartyAndConsignorsLine(lr);
                    const baseRate = lr.ratePerTon !== undefined && lr.ratePerTon !== null && lr.ratePerTon !== "" ? lr.ratePerTon : 0;
                    const chargeStr = lr.lrCharge ? lr.lrCharge : "";
                    const rateStr = `${baseRate}+${chargeStr}`;

                    return (
                      <tr key={lr.id || lr.lrNumber} className="border-b border-slate-950 leading-normal">
                        {/* COLUMN 1: LR Date (Top) & LR NO in RED (Bottom) */}
                        <td className="border border-slate-950 p-3 sm:p-3.5 align-top text-center font-bold w-[20%]">
                          <div className="text-slate-900 text-sm sm:text-base font-bold">
                            {formatDateDisplay(lr.dateTime)}
                          </div>
                          <div className="text-red-600 font-black text-base sm:text-lg mt-1.5 tracking-wider">
                            {lr.lrNumber}
                          </div>
                        </td>

                        {/* COLUMN 2: CONSINEE city - Area - LR.weight / Party Name * consignor Name / P- Party mobile */}
                        <td className="border border-slate-950 p-2.5 sm:p-3 align-top w-[52%]">
                          {/* Line 1: CONSINEE city - Area - LR.weight */}
                          <div className="font-black text-slate-950 uppercase tracking-tight text-sm sm:text-base truncate">
                            {consigneeDetails}
                          </div>
                          {/* Line 2: Party Name * consignor Name */}
                          <div className="font-extrabold text-slate-900 uppercase truncate leading-snug my-1 text-sm sm:text-base">
                            {partyConsignorLine}
                          </div>
                          {/* Line 3: P- Party mobile */}
                          <div className="font-bold text-slate-800 text-sm sm:text-base truncate">
                            {partyMobile || "P-"}
                          </div>
                        </td>

                        {/* COLUMN 3: D- Driver No. / Truck No. / LR- Rate per ton */}
                        <td className="border border-slate-950 p-2.5 sm:p-3 align-top w-[28%]">
                          {/* Line 1: D- Driver No. */}
                          <div className="font-bold text-slate-900 text-sm sm:text-base truncate">
                            {driverMobile || "D-"}
                          </div>
                          {/* Line 2: Truck No. */}
                          <div className="font-black text-slate-950 uppercase text-sm sm:text-base my-1 truncate">
                            {lr.truckNo || "-"}
                          </div>
                          {/* Line 3: LR- Rate per ton + */}
                          <div className="font-extrabold text-slate-900 text-sm sm:text-base truncate">
                            {rateStr}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        )}
      </div>

      {/* Styles for High-Quality Printing */}
      <style>{`
        @media print {
          html, body, #root, main, header, nav, div {
            background-color: #ffffff !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, nav, .print\\:hidden {
            display: none !important;
          }
          .print\\:block {
            display: block !important;
          }
          @page {
            size: A4 portrait;
            margin: 4mm;
          }
          table {
            border-collapse: collapse !important;
            width: 100% !important;
            max-width: 100% !important;
            background-color: #ffffff !important;
          }
          td {
            border: 1.5px solid #000000 !important;
            color: #000000 !important;
            background-color: #ffffff !important;
            padding: 10px 12px !important;
          }
          .text-red-600, .text-red-600 * {
            color: #dc2626 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}
