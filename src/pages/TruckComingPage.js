import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config/api";
import { dismissTruckComing } from "../utils/storage";
import {
  Truck,
  Calendar,
  Clock,
  CheckCircle,
  Phone,
  Search,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  MapPin,
  FileText,
  User,
  Check,
} from "lucide-react";

export default function TruckComingPage() {
  const [lrEntries, setLrEntries] = useState([]);
  const [trucksMap, setTrucksMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastMsg, setToastMsg] = useState("");

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  // Fetch LR Entries and Truck Master from DB
  const fetchData = async () => {
    setLoading(true);
    try {
      const [lrRes, truckRes] = await Promise.all([
        fetch(`${API_BASE_URL}/lr-entries`),
        fetch(`${API_BASE_URL}/trucks`),
      ]);

      let lrs = [];
      let trucksList = [];

      if (lrRes.ok) lrs = await lrRes.json();
      if (truckRes.ok) trucksList = await truckRes.json();

      // Create fast lookup map for Truck Master (truckNo -> truck object)
      const tMap = {};
      if (Array.isArray(trucksList)) {
        trucksList.forEach((t) => {
          if (t.truckNo) {
            const key = t.truckNo.toUpperCase().trim();
            tMap[key] = t;
          }
        });
      }
      setTrucksMap(tMap);

      if (Array.isArray(lrs)) setLrEntries(lrs);
    } catch (err) {
      console.error("Error fetching truck coming data:", err);
      showToast("Error fetching records from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Helper to parse date safely
  const parseLRDate = (dateStr, createdAtStr) => {
    if (dateStr) {
      // YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr + "T00:00:00");
      }
      // DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
        const parts = dateStr.split("/");
        return new Date(`${parts[2]}-${parts[1]}-${parts[0]}T00:00:00`);
      }
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d;
    }
    if (createdAtStr) {
      const cDate = new Date(createdAtStr);
      if (!isNaN(cDate.getTime())) return cDate;
    }
    return new Date();
  };

  // Helper to format date
  const formatDateStr = (dObj) => {
    if (!dObj || isNaN(dObj.getTime())) return "-";
    const yyyy = dObj.getFullYear();
    const mm = String(dObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dObj.getDate()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy}`;
  };

  // Process Truck Coming Alerts
  // 1. Group LRs by truckNo
  // 2. Pick only the LATEST LR per truck (so if a new LR is made for that truck, old alert auto-clears!)
  // 3. Check if tripDays (default 5) are completed (i.e. daysElapsed >= tripDays) AND not manually dismissed
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group LRs by Truck No
  const lrsByTruck = {};
  if (Array.isArray(lrEntries)) {
    lrEntries.forEach((lr) => {
      const tNo = (lr.truckNo || "").toUpperCase().trim();
      if (!tNo) return;
      if (!lrsByTruck[tNo]) lrsByTruck[tNo] = [];
      lrsByTruck[tNo].push(lr);
    });
  }

  // Find latest LR per truck and calculate alert status
  const truckComingList = [];

  Object.keys(lrsByTruck).forEach((tNo) => {
    const truckLRs = lrsByTruck[tNo];
    // Sort descending by date (latest first)
    truckLRs.sort((a, b) => {
      const dateA = parseLRDate(a.dateTime, a.createdAt);
      const dateB = parseLRDate(b.dateTime, b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

    const latestLr = truckLRs[0];

    // If latest LR is manually dismissed, skip alert!
    if (latestLr.truckComingDismissed) return;

    const lrDate = parseLRDate(latestLr.dateTime, latestLr.createdAt);
    lrDate.setHours(0, 0, 0, 0);

    const tripDays = latestLr.tripDays !== undefined ? Number(latestLr.tripDays) : 5;

    // Calculate days elapsed
    const diffTime = today.getTime() - lrDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 3600 * 24));

    // Alert triggers when diffDays >= tripDays (e.g. 5 days completed, 6th day started)
    if (diffDays >= tripDays) {
      // Lookup driver/owner mobile number from Truck Master
      const masterInfo = trucksMap[tNo] || {};
      const mobileNo = masterInfo.mobileNo || masterInfo.ownerMobile || latestLr.driverMobile || "";
      const ownerName = masterInfo.ownerName || masterInfo.driverName || latestLr.driverName || "N/A";

      const overdueDays = diffDays - tripDays;

      truckComingList.push({
        id: latestLr.id,
        truckNo: tNo,
        lrNumber: latestLr.lrNumber || latestLr.id,
        lrDate,
        tripDays,
        diffDays,
        overdueDays,
        fromPlace: latestLr.fromPlace || "N/A",
        toPlace: latestLr.toPlace || "N/A",
        consignorName: latestLr.consignorName || "N/A",
        consigneeName: latestLr.consigneeName || "N/A",
        driverName: ownerName,
        mobileNo,
        isOverdue: overdueDays > 0,
      });
    }
  });

  // Sort most overdue first
  truckComingList.sort((a, b) => b.diffDays - a.diffDays);

  // Filtered List based on Search Term
  const filteredList = truckComingList.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      item.truckNo.toLowerCase().includes(q) ||
      String(item.lrNumber).toLowerCase().includes(q) ||
      item.mobileNo.toLowerCase().includes(q) ||
      item.driverName.toLowerCase().includes(q) ||
      item.fromPlace.toLowerCase().includes(q) ||
      item.toPlace.toLowerCase().includes(q)
    );
  });

  // Handle Manual Dismiss / Mark Arrived
  const handleDismiss = async (lrId, truckNo) => {
    try {
      await dismissTruckComing(lrId);
      showToast(`Truck #${truckNo} marked as arrived and alert dismissed!`);
      fetchData();
    } catch (err) {
      console.error("Error dismissing truck coming alert:", err);
      showToast("Failed to dismiss alert.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 space-y-3 font-sans text-slate-100">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 right-4 z-50 bg-emerald-600 text-white px-3.5 py-1.5 rounded-lg shadow-xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle size={16} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Page Title & Header Bar */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
              Truck Coming Alert
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {truckComingList.length} Due
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Trucks returning after completing trip days (Default: 5 Days) &bull; Auto-cleared when a new LR is made for the truck.
            </p>
          </div>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {/* Total Coming */}
        <div className="bg-slate-800/90 border border-amber-500/40 rounded-xl p-2.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 text-[11px] font-bold">
            <span>Trucks Due Back</span>
            <Truck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-base sm:text-xl font-extrabold text-amber-400 font-mono my-0.5">
            {truckComingList.length}
          </div>
          <div className="text-[10px] text-slate-400">Completed Trip Days (&ge;5 Days)</div>
        </div>

        {/* Overdue */}
        <div className="bg-slate-800/90 border border-rose-500/40 rounded-xl p-2.5 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400 text-[11px] font-bold">
            <span>Overdue Trucks</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-base sm:text-xl font-extrabold text-rose-400 font-mono my-0.5">
            {truckComingList.filter((item) => item.isOverdue).length}
          </div>
          <div className="text-[10px] text-slate-400">&gt; Expected Return Days</div>
        </div>

        {/* Due Today */}
        <div className="bg-slate-800/90 border border-emerald-500/40 rounded-xl p-2.5 shadow-md flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-emerald-400 text-[11px] font-bold">
            <span>Due Today (Day 5)</span>
            <Clock className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-base sm:text-xl font-extrabold text-emerald-400 font-mono my-0.5">
            {truckComingList.filter((item) => !item.isOverdue).length}
          </div>
          <div className="text-[10px] text-slate-400">Exactly 5 Trip Days Elapsed</div>
        </div>
      </div>

      {/* Container with Controls and Cards / Table */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-3 shadow-xl space-y-3">
        {/* Search Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-b border-slate-700/80 pb-3">
          <h2 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Truck size={15} /> Coming Trucks List ({filteredList.length})
          </h2>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by Truck No, Mobile, LR No, Route..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
          </div>
        </div>

        {/* List of Coming Trucks */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 font-medium">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-400" />
            Loading coming trucks...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium space-y-1">
            <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
            <div className="text-sm font-bold text-white">No Coming Truck Alerts Right Now!</div>
            <div className="text-xs text-slate-400">All trucks are either on active trips within 5 days or marked as arrived.</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredList.map((item) => (
              <div
                key={item.id}
                className={`bg-slate-900/90 border rounded-xl p-3 shadow-md space-y-2.5 flex flex-col justify-between transition-all ${
                  item.isOverdue
                    ? "border-rose-500/50 hover:border-rose-400"
                    : "border-amber-500/50 hover:border-amber-400"
                }`}
              >
                {/* Card Top Row: Truck No & Status Badge */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
                      <Truck size={18} />
                    </div>
                    <div>
                      <div className="font-mono font-black text-amber-400 text-base">
                        {item.truckNo}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <FileText size={11} /> LR #{item.lrNumber} ({formatDateStr(item.lrDate)})
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      item.isOverdue
                        ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                        : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                    }`}
                  >
                    {item.isOverdue ? `${item.overdueDays}d Overdue` : "Day 5 (Due Today)"}
                  </span>
                </div>

                {/* Card Middle Section: Driver Contact & Route */}
                <div className="space-y-1.5 text-xs">
                  {/* Driver / Owner Mobile */}
                  <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700/60">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <User size={13} className="text-amber-400" />
                      <span className="font-bold">{item.driverName}</span>
                    </div>
                    {item.mobileNo ? (
                      <a
                        href={`tel:${item.mobileNo}`}
                        className="font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30"
                      >
                        <Phone size={11} /> {item.mobileNo}
                      </a>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">No Mobile</span>
                    )}
                  </div>

                  {/* Route: From -> To */}
                  <div className="flex items-center justify-between text-[11px] text-slate-300 px-1">
                    <span className="text-slate-400 font-medium">Route:</span>
                    <span className="font-bold flex items-center gap-1 text-white">
                      <MapPin size={11} className="text-amber-400" />
                      {item.fromPlace} <ArrowRight size={11} /> {item.toPlace}
                    </span>
                  </div>

                  {/* Trip Timeline Info */}
                  <div className="flex items-center justify-between text-[11px] text-slate-300 px-1">
                    <span className="text-slate-400 font-medium">Trip Days:</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {item.diffDays} Days Elapsed ({item.tripDays} Days Set)
                    </span>
                  </div>
                </div>

                {/* Card Bottom Row: Action Buttons */}
                <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                  {/* Mark Arrived / Dismiss */}
                  <button
                    onClick={() => handleDismiss(item.id, item.truckNo)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-1.5 px-2 rounded-lg text-xs transition shadow flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Check size={14} className="stroke-[3]" />
                    <span>Mark Arrived</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
