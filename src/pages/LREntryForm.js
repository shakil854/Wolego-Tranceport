import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { fetchPartiesFromDB, fetchLREntriesFromDB, saveLREntry, deleteLREntry, getNextLRNumber, saveParty, fetchTrucksFromDB, saveTruck } from "../utils/storage";
import LRPrintDocument from "../components/LRPrintDocument";
import { Save, Printer, Download, Share2, Plus, RotateCcw, Search, X, Building2, Truck, Trash2 } from "lucide-react";

export default function LREntryForm() {
  const location = useLocation();
  const [parties, setParties] = useState([]);
  const [selectedConsignors, setSelectedConsignors] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeAutoAction, setActiveAutoAction] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [searchConsignorModal, setSearchConsignorModal] = useState(false);
  const [searchConsigneeModal, setSearchConsigneeModal] = useState(false);
  const [partySearchQuery, setPartySearchQuery] = useState("");
  const [activeLR, setActiveLR] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  const initialBlankPartyForm = {
    partyName: "",
    address1: "",
    address2: "",
    address3: "",
    city: "",
    district: "",
    state: "",
    stateCode: "",
    gstNo: "",
    panNo: "",
    contactName: "",
    mobileNos: "",
    selectType: "BOTH",
  };

  // Add Party Modal State
  const [showAddPartyModal, setShowAddPartyModal] = useState(false);
  const [addPartyTarget, setAddPartyTarget] = useState("BOTH"); // "CONSIGNOR", "CONSIGNEE", "BOTH"
  const [newPartyForm, setNewPartyForm] = useState(initialBlankPartyForm);

  // Truck Master State & Modal
  const [trucks, setTrucks] = useState([]);
  const [showAddTruckModal, setShowAddTruckModal] = useState(false);
  const [showTruckSearchDropdown, setShowTruckSearchDropdown] = useState(false);
  const [newTruckForm, setNewTruckForm] = useState({
    truckNo: "",
    ownerName: "",
    mobileNo: "",
    address: "",
    bankName: "",
    accountName: "",
    accountNo: "",
    ifscCode: "",
    branch: "",
  });

  const handleSaveNewTruckModal = async (e) => {
    if (e) e.preventDefault();
    if (!newTruckForm.truckNo || !newTruckForm.truckNo.trim()) {
      alert("Truck Number is required!");
      return;
    }
    const addedNo = newTruckForm.truckNo.trim().toUpperCase();
    const updatedTrucks = await saveTruck({ ...newTruckForm, truckNo: addedNo });
    setTrucks(updatedTrucks || []);
    setFormData((prev) => ({ ...prev, truckNo: addedNo }));
    setShowAddTruckModal(false);
    setNewTruckForm({
      truckNo: "",
      ownerName: "",
      mobileNo: "",
      address: "",
      bankName: "",
      accountName: "",
      accountNo: "",
      ifscCode: "",
      branch: "",
    });
    flashMsg(`Truck "${addedNo}" Saved & Selected!`);
  };

  // State code mapping helper
  const getStateCode = (stateName) => {
    if (!stateName || !stateName.trim()) return "";
    const stateMap = {
      GUJARAT: "24",
      TELANGANA: "36",
      MAHARASHTRA: "27",
      RAJASTHAN: "08",
      DELHI: "07",
      KARNATAKA: "29",
      "TAMIL NADU": "33",
      "MADHYA PRADESH": "23",
      "UTTAR PRADESH": "09",
      "ANDHRA PRADESH": "37",
    };
    return stateMap[stateName.toUpperCase()] || "";
  };

  // State change handler for Modal Add Form
  const handleStateChange = (stateName) => {
    const code = getStateCode(stateName);
    setNewPartyForm((prev) => ({ ...prev, state: stateName, stateCode: code }));
  };

  // GST handler for Modal Add Form (auto-extracts PAN)
  const handleAddGstChange = (val) => {
    const upperVal = val.toUpperCase();
    let pan = newPartyForm.panNo;
    if (upperVal.length >= 12) {
      pan = upperVal.substring(2, 12);
    }
    setNewPartyForm((prev) => ({ ...prev, gstNo: upperVal, panNo: pan }));
  };

  const getTodayDateStr = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const initialForm = {
    id: "",
    lrNumber: "",
    copyData: "N",
    fromPlace: "",
    toPlace: "",
    deliveryAt: "DOOR",
    truckNo: "",
    dateTime: getTodayDateStr(),

    // Consignor
    consignorName: "",
    consignorAddress: "",
    consignorGst: "",
    saveConsignorInMaster: "N",

    // Consignee
    consigneeName: "",
    consigneeAddress: "",
    consigneeGst: "",
    saveConsigneeInMaster: "N",

    // Goods particulars
    noOfArticles: "",
    bundles: "BOX",
    descriptionOfGoods: "CERAMIC TILES",
    noOfArticles2: "",
    bundles2: "BUNDLE",
    descriptionOfGoods2: "SANITARYWARE",
    weightKgs: "",
    ratePerTon: "",
    rateType: "P.M.T.",
    toPayOrPaid: "TBB", // TBB / TO-PAY / PAID
    freightAmount: 0,

    // GST & Charges
    gstPayableBy: "CONSIGNEE", // CONSIGNEE / CONSIGNOR / TRANSPORTER (3 options)
    sgstPercent: 0,
    sgstAmount: 0,
    cgstPercent: 0,
    cgstAmount: 0,
    igstPercent: 0,
    igstAmount: 0,
    totalWithGst: 0,
    otherCharges: 0,
    lessAdvancePaid: 0,
    chequeYn: "N",
    netTotalAmount: 0,

    // Additional Details
    billNumbers: "",
    invoiceValue: "",
    driverName: "",
    licenseNumber: "",
    driverMobile: "",
    consignorEwayBill: "",
    consigneeEwayBill: "",
    remarks: "",
    debitAmountTo: "CONSIGNEE",
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const loadInitData = async () => {
      const loadedParties = await fetchPartiesFromDB();
      const loadedLRs = await fetchLREntriesFromDB();
      const loadedTrucks = await fetchTrucksFromDB();
      setParties(loadedParties || []);
      setTrucks(loadedTrucks || []);

      if (location.state && location.state.editLR) {
        setFormData(location.state.editLR);
        flashMsg(`Editing LR #${location.state.editLR.lrNumber}`);
      } else {
        let defaultDate = getTodayDateStr();
        if (loadedLRs && loadedLRs.length > 0) {
          const sortedDates = loadedLRs
            .map((l) => (l.dateTime ? l.dateTime.split("T")[0] : null))
            .filter(Boolean)
            .sort()
            .reverse();
          if (sortedDates.length > 0 && sortedDates[0] > defaultDate) {
            defaultDate = sortedDates[0];
          }
        }
        const nextNo = getNextLRNumber(defaultDate);
        setFormData((prev) => ({ ...prev, dateTime: defaultDate, lrNumber: nextNo }));
      }
    };
    loadInitData();
  }, [location.state]);

  // Auto calculate freight when Weight & Rate are entered
  const calculateFreight = (weight, rate) => {
    const w = parseFloat(weight) || 0;
    const r = parseFloat(rate) || 0;
    // Rate is usually per Ton (1 Ton = 1000 KGS) or flat
    let amt = 0;
    if (w > 0 && r > 0) {
      amt = Math.round((w / 1000) * r);
    }
    return amt;
  };

  // Recalculate Totals whenever charges change
  useEffect(() => {
    const freight = parseFloat(formData.freightAmount) || 0;
    const sgst = (freight * (parseFloat(formData.sgstPercent) || 0)) / 100;
    const cgst = (freight * (parseFloat(formData.cgstPercent) || 0)) / 100;
    const igst = (freight * (parseFloat(formData.igstPercent) || 0)) / 100;
    const totGst = Math.round(freight + sgst + cgst + igst);
    const other = parseFloat(formData.otherCharges) || 0;
    const adv = parseFloat(formData.lessAdvancePaid) || 0;
    const net = Math.max(0, Math.round(totGst + other - adv));

    setFormData((prev) => ({
      ...prev,
      sgstAmount: sgst,
      cgstAmount: cgst,
      igstAmount: igst,
      totalWithGst: totGst,
      netTotalAmount: net,
    }));
  }, [
    formData.freightAmount,
    formData.sgstPercent,
    formData.cgstPercent,
    formData.igstPercent,
    formData.otherCharges,
    formData.lessAdvancePaid,
  ]);

  const formatPartyAddress = (party) => {
    if (!party) return "";
    const addr1 = party.address1 ? party.address1.trim() : "";
    const addr2 = party.address2 ? party.address2.trim() : "";
    const addr3 = party.address3 ? party.address3.trim() : "";

    return [addr1, addr2, addr3].filter(Boolean).join("\n");
  };

  // Multi-Consignor selection & formatting handler
  const handleAddConsignor = (partyName) => {
    if (!partyName) return;
    const existing = parties.find((p) => p.partyName.trim().toUpperCase() === partyName.trim().toUpperCase());
    const partyObj = existing || { partyName: partyName.toUpperCase(), address1: "", address2: "", address3: "", city: "", state: "", gstNo: "" };

    // Prevent duplicate addition of exact same party
    if (selectedConsignors.some((c) => c.partyName.trim().toUpperCase() === partyObj.partyName.trim().toUpperCase())) {
      return;
    }

    const updatedList = [...selectedConsignors, partyObj];
    applyConsignorsFormatting(updatedList);
  };

  const handleRemoveConsignor = (index) => {
    const updatedList = selectedConsignors.filter((_, idx) => idx !== index);
    applyConsignorsFormatting(updatedList);
  };

  const applyConsignorsFormatting = (list) => {
    setSelectedConsignors(list);

    if (!list || list.length === 0) {
      setFormData((prev) => ({
        ...prev,
        consignorName: "",
        consignorAddress: "",
        consignorGst: "",
      }));
      return;
    }

    if (list.length === 1) {
      // 1 Consignor: 4-line format (Name, Address 1, Address 2, Address 3)
      const c = list[0];
      const fullAddr = formatPartyAddress(c);
      setFormData((prev) => ({
        ...prev,
        consignorName: c.partyName,
        consignorAddress: fullAddr,
        consignorGst: c.gstNo || "",
      }));
    } else if (list.length === 2) {
      // 2 Consignors: Exactly 2 lines per Consignor (Name line + truncated 1-line Address)
      const c1 = list[0];
      const c2 = list[1];

      const rawAddr1 = [c1.address1, c1.address2, c1.address3].filter(Boolean).join(", ");
      const rawAddr2 = [c2.address1, c2.address2, c2.address3].filter(Boolean).join(", ");

      // Truncate address if longer than 45 chars so it NEVER wraps into 2 lines!
      const addr1 = rawAddr1.length > 45 ? rawAddr1.slice(0, 42) + "..." : rawAddr1;
      const addr2 = rawAddr2.length > 45 ? rawAddr2.slice(0, 42) + "..." : rawAddr2;

      const pName1 = c1.partyName.length > 40 ? c1.partyName.slice(0, 37) + "..." : c1.partyName;
      const pName2 = c2.partyName.length > 40 ? c2.partyName.slice(0, 37) + "..." : c2.partyName;

      const line1 = `(1) ${pName1}`;
      const line2 = `    ${addr1 || ""}`;
      const line3 = `(2) ${pName2}`;
      const line4 = `    ${addr2 || ""}`;

      const nameVal = `${line1}\n${line2}\n${line3}\n${line4}`;
      const addrVal = "";
      const gstVal = "AS PER BILL";

      setFormData((prev) => ({
        ...prev,
        consignorName: nameVal,
        consignorAddress: addrVal,
        consignorGst: gstVal,
      }));
    } else {
      // >2 Consignors (3 or more): ONLY Names line-by-line formatted as (1), (2), (3)!
      const nameVal = list.map((c, idx) => `(${idx + 1}) ${c.partyName}`).join("\n");
      const addrVal = "";
      const gstVal = "AS PER BILL";

      setFormData((prev) => ({
        ...prev,
        consignorName: nameVal,
        consignorAddress: addrVal,
        consignorGst: gstVal,
      }));
    }
  };

  // Consignee selection handler (4-line format: Name, Address 1, Address 2, Address 3)
  const handleSelectConsignee = (partyName) => {
    const party = parties.find((p) => p.partyName === partyName);
    if (party) {
      const fullAddr = formatPartyAddress(party);
      setFormData((prev) => ({
        ...prev,
        consigneeName: party.partyName,
        consigneeAddress: fullAddr,
        consigneeGst: party.gstNo || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, consigneeName: partyName }));
    }
  };

  // Weight & Rate change handlers
  const handleWeightRateChange = (field, val) => {
    setFormData((prev) => {
      const newWeight = field === "weightKgs" ? val : prev.weightKgs;
      const newRate = field === "ratePerTon" ? val : prev.ratePerTon;
      const calcFreight = calculateFreight(newWeight, newRate);
      return {
        ...prev,
        [field]: val,
        freightAmount: calcFreight > 0 ? calcFreight : prev.freightAmount,
      };
    });
  };

  // Save Record handler (Locks ID so multiple clicks only update single record)
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    const saved = await saveLREntry(formData);
    setFormData(saved); // Lock form to this saved record
    setActiveLR(saved);
    setShowSuccessModal(true); // Open success popup!
    return saved;
  };

  const handleSaveAndPrint = async (e) => {
    const saved = await handleSave(e);
    if (saved) {
      setActiveAutoAction("print");
      setShowPrintModal(true);
    }
  };

  const handleReset = () => {
    const today = getTodayDateStr();
    const nextNo = getNextLRNumber(today);
    setFormData({ ...initialForm, lrNumber: nextNo, dateTime: today });
  };

  const handleDeleteCurrentLR = async () => {
    if (!formData.id) return;
    if (window.confirm(`Are you sure you want to delete LR #${formData.lrNumber}?`)) {
      await deleteLREntry(formData.id);
      flashMsg(`LR #${formData.lrNumber} Deleted!`);
      handleReset();
    }
  };

  const flashMsg = (text) => {
    setStatusMsg(text);
    setTimeout(() => setStatusMsg(""), 4000);
  };

  // Handler to Save New Party via Modal and Auto-Select in active field
  const handleSaveNewParty = async (e) => {
    if (e) e.preventDefault();
    if (!newPartyForm.partyName || !newPartyForm.partyName.trim()) {
      alert("Party Name is required!");
      return;
    }

    const payload = {
      ...newPartyForm,
      partyName: newPartyForm.partyName.trim().toUpperCase(),
      address1: (newPartyForm.address1 || "").trim().toUpperCase(),
      address2: (newPartyForm.address2 || "").trim().toUpperCase(),
      address3: (newPartyForm.address3 || "").trim().toUpperCase(),
      city: (newPartyForm.city || "").trim().toUpperCase(),
      district: (newPartyForm.district || "").trim().toUpperCase(),
      state: (newPartyForm.state || "").trim().toUpperCase(),
      stateCode: (newPartyForm.stateCode || "").trim(),
      gstNo: (newPartyForm.gstNo || "").trim().toUpperCase(),
      panNo: (newPartyForm.panNo || "").trim().toUpperCase(),
      contactName: (newPartyForm.contactName || "").trim().toUpperCase(),
      mobileNos: (newPartyForm.mobileNos || "").trim(),
    };

    const updatedParties = await saveParty(payload);
    setParties(updatedParties || []);

    const createdName = payload.partyName;

    if (addPartyTarget === "CONSIGNOR") {
      handleAddConsignor(createdName);
    } else if (addPartyTarget === "CONSIGNEE") {
      handleSelectConsignee(createdName);
    } else {
      handleSelectConsignee(createdName);
    }

    setShowAddPartyModal(false);
    setNewPartyForm(initialBlankPartyForm);
    flashMsg(`Party "${createdName}" Added & Selected!`);
  };

  // Fast Data Entry: Keyboard navigation with Enter & Arrow Keys (Up, Down, Left, Right)
  const handleKeyDown = (e) => {
    const container = document.getElementById("lr-form-container") || e.currentTarget;

    // Helper to get all visible focusable elements in logical form order
    const getFocusable = () => {
      return Array.from(
        container.querySelectorAll(
          "input:not([disabled]):not([type='hidden']), select:not([disabled]), textarea:not([disabled]), button:not([disabled])"
        )
      ).filter((el) => el.tabIndex !== -1 && el.offsetParent !== null);
    };

    // 1. Handle Enter Key Navigation
    if (e.key === "Enter") {
      // If user is on a button, execute its action naturally
      if (e.target.tagName === "BUTTON") {
        return;
      }
      // Allow Shift+Enter for multiline text in textareas
      if (e.target.tagName === "TEXTAREA" && e.shiftKey) {
        return;
      }

      e.preventDefault();

      const focusable = getFocusable();
      const index = focusable.indexOf(e.target);

      // Check if there is another input field after the current one (excluding buttons)
      const nextInput = focusable.slice(index + 1).find((el) => el.tagName === "INPUT" || el.tagName === "SELECT" || el.tagName === "TEXTAREA");

      if (nextInput) {
        nextInput.focus();
        if (typeof nextInput.select === "function" && nextInput.tagName === "INPUT") {
          nextInput.select();
        }
        nextInput.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        // All form fields completed -> Move focus directly to Save LR button!
        const saveBtn = document.getElementById("save-lr-btn");
        if (saveBtn) {
          saveBtn.focus();
          saveBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    // 2. Handle Side Arrow Keys (ArrowDown / ArrowRight = Next, ArrowUp / ArrowLeft = Previous)
    const isDown = e.key === "ArrowDown";
    const isUp = e.key === "ArrowUp";
    const isRight = e.key === "ArrowRight" && e.target.tagName !== "TEXTAREA" && e.target.type !== "number";
    const isLeft = e.key === "ArrowLeft" && e.target.tagName !== "TEXTAREA" && e.target.type !== "number";

    const isNext = isDown || isRight;
    const isPrev = isUp || isLeft;

    if (isNext || isPrev) {
      // Allow normal arrow key behavior inside open select options
      if (e.target.tagName === "SELECT" && (isDown || isUp) && !e.altKey) {
        return;
      }

      e.preventDefault();

      const focusable = getFocusable();
      const index = focusable.indexOf(e.target);
      let targetIndex = -1;

      if (isNext && index < focusable.length - 1) {
        targetIndex = index + 1;
      } else if (isPrev && index > 0) {
        targetIndex = index - 1;
      }

      if (targetIndex !== -1 && focusable[targetIndex]) {
        const targetEl = focusable[targetIndex];
        targetEl.focus();
        if (typeof targetEl.select === "function" && targetEl.tagName === "INPUT") {
          targetEl.select();
        }
        targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  const consignorsList = parties.filter((p) => p.selectType === "CONSIGNOR" || p.selectType === "BOTH");
  const consigneesList = parties.filter((p) => p.selectType === "CONSIGNEE" || p.selectType === "BOTH");

  if (showPrintModal && activeLR) {
    return (
      <LRPrintDocument
        lrData={activeLR}
        autoAction={activeAutoAction}
        onClose={() => {
          setShowPrintModal(false);
          setActiveAutoAction(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen md:h-full w-full overflow-y-auto md:overflow-hidden bg-slate-900 p-1.5 text-slate-100 flex flex-col flex-1 min-h-0 font-sans">
      <div className="w-full max-w-full mx-auto flex-1 flex flex-col min-h-0">

        {/* Main Classic Software Card Frame */}
        <div className="bg-sky-900/90 border-2 border-sky-400 rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm flex-1 flex flex-col min-h-0">

          {/* Header Bar */}
          <div className="bg-sky-950 px-3 py-1.5 border-b border-sky-400 flex justify-between items-center gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-base font-black text-white tracking-wide uppercase font-sans">
                L/R ENTRY - ADD / EDIT / CHANGE
              </h1>
              {statusMsg && (
                <span className="bg-emerald-500 text-slate-950 px-2 py-0.5 text-xs font-bold rounded animate-pulse">
                  {statusMsg}
                </span>
              )}
            </div>
          </div>

          {/* Form Content (Fits Viewport Height on PC, Scrollable on Mobile) */}
          <form onSubmit={handleSave} onKeyDown={handleKeyDown} className="p-2 space-y-1.5 flex-1 flex flex-col justify-between overflow-y-auto md:overflow-hidden">

            {/* Row 1: LR Number, Date, From, To, Delivery At, Truck No */}
            <div className="bg-sky-950/80 p-1.5 rounded border border-sky-600/60 grid grid-cols-12 gap-1.5 items-center shrink-0">

              <div className="col-span-6 sm:col-span-4 md:col-span-2">
                <label className="text-[10px] font-extrabold text-yellow-300 uppercase block mb-0.5">
                  L/R NUMBER
                </label>
                <input
                  type="text"
                  value={formData.lrNumber}
                  onChange={(e) => setFormData({ ...formData, lrNumber: e.target.value })}
                  placeholder="LR NO."
                  className="w-full bg-white text-slate-900 font-mono font-black text-xs px-2 py-0.5 border-2 border-amber-400 rounded focus:outline-none"
                />
              </div>

              <div className="col-span-6 sm:col-span-4 md:col-span-2">
                <label className="text-[10px] font-extrabold text-yellow-300 uppercase block mb-0.5">
                  DATE
                </label>
                <input
                  type="date"
                  value={formData.dateTime ? formData.dateTime.slice(0, 10) : getTodayDateStr()}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    const isEdit = location.state && location.state.editLR;
                    if (!isEdit) {
                      const nextNo = getNextLRNumber(newDate);
                      setFormData((prev) => ({ ...prev, dateTime: newDate, lrNumber: nextNo }));
                    } else {
                      setFormData((prev) => ({ ...prev, dateTime: newDate }));
                    }
                  }}
                  className="w-full bg-white text-slate-900 font-bold px-1 py-0.5 border border-sky-300 rounded uppercase text-xs"
                />
              </div>

              <div className="col-span-6 sm:col-span-4 md:col-span-2">
                <label className="text-[10px] font-extrabold text-yellow-300 uppercase block mb-0.5">
                  FROM PLACE
                </label>
                <input
                  type="text"
                  value={formData.fromPlace}
                  onChange={(e) => setFormData({ ...formData, fromPlace: e.target.value.toUpperCase() })}
                  placeholder="FROM"
                  className="w-full bg-white text-slate-900 font-bold px-1.5 py-0.5 border border-sky-300 rounded uppercase text-xs"
                />
              </div>

              <div className="col-span-6 sm:col-span-4 md:col-span-2">
                <label className="text-[10px] font-extrabold text-yellow-300 uppercase block mb-0.5">
                  TO PLACE
                </label>
                <input
                  type="text"
                  value={formData.toPlace}
                  onChange={(e) => setFormData({ ...formData, toPlace: e.target.value.toUpperCase() })}
                  placeholder="TO"
                  className="w-full bg-white text-slate-900 font-bold px-1.5 py-0.5 border border-sky-300 rounded uppercase text-xs"
                />
              </div>

              <div className="col-span-6 sm:col-span-4 md:col-span-2">
                <label className="text-[10px] font-extrabold text-yellow-300 uppercase block mb-0.5">
                  DELIVERY AT
                </label>
                <input
                  type="text"
                  value={formData.deliveryAt}
                  onChange={(e) => setFormData({ ...formData, deliveryAt: e.target.value.toUpperCase() })}
                  placeholder="DOOR"
                  className="w-full bg-white text-slate-900 font-bold px-1.5 py-0.5 border border-sky-300 rounded uppercase text-xs"
                />
              </div>

              <div className="col-span-6 sm:col-span-4 md:col-span-2 relative">
                <div className="flex items-center justify-between mb-0.5">
                  <label className="text-[10px] font-extrabold text-yellow-300 uppercase block">
                    TRUCK NO.
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setNewTruckForm({ ...newTruckForm, truckNo: formData.truckNo });
                      setShowAddTruckModal(true);
                    }}
                    className="text-[9px] bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-1 py-0.2 rounded font-black uppercase shadow flex items-center gap-0.5 cursor-pointer"
                    title="Add New Truck to Master"
                  >
                    <Plus size={10} /> + Add
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    list="truck-master-list"
                    value={formData.truckNo}
                    onChange={(e) => {
                      setFormData({ ...formData, truckNo: e.target.value.toUpperCase() });
                      setShowTruckSearchDropdown(true);
                    }}
                    onFocus={() => setShowTruckSearchDropdown(true)}
                    onBlur={() => setTimeout(() => setShowTruckSearchDropdown(false), 200)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === "Tab" || e.key === "Escape") {
                        setShowTruckSearchDropdown(false);
                      }
                    }}
                    placeholder="TRUCK NO."
                    className="w-full bg-white text-slate-900 font-mono font-black px-1.5 py-0.5 border-2 border-sky-400 rounded uppercase text-xs"
                  />
                  <datalist id="truck-master-list">
                    {trucks.map((t, idx) => (
                      <option key={idx} value={(t.truckNo || "").toUpperCase()}>
                        {t.ownerName ? `${t.truckNo} - ${t.ownerName}` : t.truckNo}
                      </option>
                    ))}
                  </datalist>
                  {showTruckSearchDropdown && (
                    <div className="absolute left-0 right-0 top-full mt-0.5 z-40 bg-slate-900 border-2 border-sky-400 rounded-md shadow-2xl max-h-48 overflow-y-auto">
                      {trucks
                        .filter((t) => (t.truckNo || "").toUpperCase().includes((formData.truckNo || "").toUpperCase()))
                        .map((t, idx) => (
                          <div
                            key={idx}
                            onMouseDown={() => {
                              setFormData({ ...formData, truckNo: (t.truckNo || "").toUpperCase() });
                              setShowTruckSearchDropdown(false);
                            }}
                            className="px-2 py-1.5 hover:bg-sky-700 cursor-pointer text-xs border-b border-slate-800 flex justify-between items-center"
                          >
                            <span className="font-mono font-bold text-amber-300">{(t.truckNo || "").toUpperCase()}</span>
                            <span className="text-[10px] text-slate-400">{t.ownerName || "No Owner"}</span>
                          </div>
                        ))}
                      {trucks.filter((t) => (t.truckNo || "").toUpperCase().includes((formData.truckNo || "").toUpperCase())).length === 0 && (
                        <div className="p-2 text-center text-xs text-slate-400">
                          Manual entry enabled.
                          <button
                            type="button"
                            onMouseDown={() => {
                              setNewTruckForm({ ...newTruckForm, truckNo: formData.truckNo });
                              setShowAddTruckModal(true);
                              setShowTruckSearchDropdown(false);
                            }}
                            className="block mx-auto mt-1 px-2 py-0.5 bg-emerald-500 text-slate-950 font-bold rounded text-[10px]"
                          >
                            + Save "{formData.truckNo}" to Master
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Row 2: Consignor & Consignee Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 shrink-0">

              {/* CONSIGNOR BOX */}
              <div className="bg-sky-950/80 p-2 rounded border border-sky-500 space-y-1">
                <div className="flex justify-between items-center border-b border-sky-700 pb-0.5">
                  <h3 className="text-[11px] font-extrabold text-yellow-300 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>CONSIGNOR (माल भेजने वाला)</span>
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPartySearchQuery("");
                        setSearchConsignorModal(true);
                      }}
                      className="px-2 py-0.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[10px] font-extrabold rounded flex items-center gap-1 shadow cursor-pointer uppercase"
                    >
                      <Search size={12} /> Search
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddPartyTarget("CONSIGNOR");
                        setNewPartyForm({ ...initialBlankPartyForm, selectType: "CONSIGNOR" });
                        setShowAddPartyModal(true);
                      }}
                      className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-extrabold rounded flex items-center gap-1 shadow transition cursor-pointer uppercase"
                    >
                      <Plus size={12} /> + Add Party
                    </button>
                  </div>
                </div>

                {/* Selected Consignors Badges / Chips */}
                {selectedConsignors.length > 0 && (
                  <div className="flex flex-wrap gap-1 p-0.5 bg-sky-900/60 rounded border border-sky-600">
                    {selectedConsignors.map((c, idx) => (
                      <span key={idx} className="inline-flex items-center gap-0.5 bg-amber-400 text-slate-950 px-1 py-0.2 rounded text-[10px] font-black">
                        ({idx + 1}) {c.partyName}
                        <button
                          type="button"
                          onClick={() => handleRemoveConsignor(idx)}
                          className="hover:text-red-700 ml-1 font-extrabold"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    <button
                      type="button"
                      onClick={() => applyConsignorsFormatting([])}
                      className="text-[9px] text-red-300 font-bold underline ml-auto"
                    >
                      Clear
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  value={formData.consignorName}
                  onChange={(e) => setFormData({ ...formData, consignorName: e.target.value.toUpperCase() })}
                  placeholder="CONSIGNOR NAME"
                  className="w-full bg-white text-slate-900 font-bold px-1.5 py-0.5 border border-sky-300 rounded text-xs uppercase font-mono"
                />

                <div className="grid grid-cols-12 gap-1 items-center">
                  <input
                    type="text"
                    value={formData.consignorAddress}
                    onChange={(e) => setFormData({ ...formData, consignorAddress: e.target.value.toUpperCase() })}
                    placeholder="ADDRESS"
                    className="col-span-7 bg-white text-slate-900 font-medium px-1.5 py-0.5 border border-sky-300 rounded text-xs uppercase font-mono"
                  />
                  <input
                    type="text"
                    value={formData.consignorGst}
                    onChange={(e) => setFormData({ ...formData, consignorGst: e.target.value.toUpperCase() })}
                    placeholder="GSTIN NO."
                    className="col-span-5 bg-white text-slate-900 font-mono font-bold px-1.5 py-0.5 border border-sky-300 rounded text-xs uppercase"
                  />
                </div>
              </div>

              {/* CONSIGNEE BOX */}
              <div className="bg-sky-950/80 p-2 rounded border border-sky-500 space-y-1">
                <div className="flex justify-between items-center border-b border-sky-700 pb-0.5">
                  <h3 className="text-[11px] font-extrabold text-yellow-300 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>CONSIGNEE (माल प्राप्तकर्ता)</span>
                  </h3>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPartySearchQuery("");
                        setSearchConsigneeModal(true);
                      }}
                      className="px-2 py-0.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 text-[10px] font-extrabold rounded flex items-center gap-1 shadow cursor-pointer uppercase"
                    >
                      <Search size={12} /> Search
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddPartyTarget("CONSIGNEE");
                        setNewPartyForm({ ...initialBlankPartyForm, selectType: "CONSIGNEE" });
                        setShowAddPartyModal(true);
                      }}
                      className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-extrabold rounded flex items-center gap-1 shadow transition cursor-pointer uppercase"
                    >
                      <Plus size={12} /> + Add Party
                    </button>
                  </div>
                </div>

                <input
                  type="text"
                  value={formData.consigneeName}
                  onChange={(e) => setFormData({ ...formData, consigneeName: e.target.value.toUpperCase() })}
                  placeholder="CONSIGNEE NAME"
                  className="w-full bg-white text-slate-900 font-bold px-1.5 py-0.5 border border-sky-300 rounded text-xs uppercase"
                />

                <div className="grid grid-cols-12 gap-1 items-center">
                  <input
                    type="text"
                    value={formData.consigneeAddress}
                    onChange={(e) => setFormData({ ...formData, consigneeAddress: e.target.value.toUpperCase() })}
                    placeholder="ADDRESS"
                    className="col-span-7 bg-white text-slate-900 font-medium px-1.5 py-0.5 border border-sky-300 rounded text-xs uppercase"
                  />
                  <input
                    type="text"
                    value={formData.consigneeGst}
                    onChange={(e) => setFormData({ ...formData, consigneeGst: e.target.value.toUpperCase() })}
                    placeholder="GSTIN NO."
                    className="col-span-5 bg-white text-slate-900 font-mono font-bold px-1.5 py-0.5 border border-sky-300 rounded text-xs uppercase"
                  />
                </div>
              </div>

            </div>

            {/* Row 3: Goods Section */}
            <div className="bg-sky-950/90 p-2 rounded border border-sky-500 space-y-1 shrink-0">
              <div className="hidden md:grid grid-cols-12 gap-1.5 text-[10px] font-bold text-sky-200 uppercase px-0.5">
                <div className="col-span-2">No. of Articles</div>
                <div className="col-span-4">Description of Goods</div>
                <div className="col-span-2">Weight</div>
                <div className="col-span-2">Rate Rs. Per Ton</div>
                <div className="col-span-2">To Pay / Paid</div>
              </div>

              <div className="grid grid-cols-12 gap-1.5">
                <div className="col-span-6 md:col-span-2 flex gap-1">
                  <input
                    type="text"
                    value={formData.noOfArticles}
                    onChange={(e) => setFormData({ ...formData, noOfArticles: e.target.value })}
                    placeholder="QTY"
                    className="w-2/3 bg-white text-slate-900 font-bold px-1 py-0.5 border rounded text-xs"
                  />
                  <input
                    type="text"
                    value={formData.bundles}
                    onChange={(e) => setFormData({ ...formData, bundles: e.target.value.toUpperCase() })}
                    placeholder="BOX"
                    className="w-1/3 bg-white text-slate-900 font-bold px-0.5 py-0.5 border rounded text-[10px] text-center uppercase"
                  />
                </div>

                <div className="col-span-6 md:col-span-4">
                  <input
                    type="text"
                    value={formData.descriptionOfGoods}
                    onChange={(e) => setFormData({ ...formData, descriptionOfGoods: e.target.value.toUpperCase() })}
                    placeholder="CERAMIC TILES"
                    className="w-full bg-white text-slate-900 font-bold px-1.5 py-0.5 border rounded text-xs uppercase"
                  />
                </div>

                <div className="col-span-4 md:col-span-2">
                  <input
                    type="text"
                    value={formData.weightKgs}
                    onChange={(e) => handleWeightRateChange("weightKgs", e.target.value)}
                    placeholder="WEIGHT"
                    className="w-full bg-white text-slate-900 font-mono font-bold px-1.5 py-0.5 border rounded text-xs"
                  />
                </div>

                <div className="col-span-4 md:col-span-2">
                  <input
                    type="text"
                    value={formData.ratePerTon}
                    onChange={(e) => handleWeightRateChange("ratePerTon", e.target.value)}
                    placeholder="RATE"
                    className="w-full bg-white text-slate-900 font-mono font-bold px-1.5 py-0.5 border rounded text-xs"
                  />
                </div>

                <div className="col-span-4 md:col-span-2">
                  <select
                    value={formData.toPayOrPaid}
                    onChange={(e) => setFormData({ ...formData, toPayOrPaid: e.target.value })}
                    className="w-full bg-yellow-400 text-slate-950 font-black px-1 py-0.5 border rounded text-xs uppercase cursor-pointer"
                  >
                    <option value="TBB">TBB</option>
                    <option value="TO-PAY">TO-PAY</option>
                    <option value="PAID">PAID</option>
                  </select>
                </div>
              </div>

              {/* Sanitaryware Optional Row */}
              <div className="grid grid-cols-12 gap-1.5 pt-0.5 border-t border-sky-800 items-center">
                <div className="col-span-6 md:col-span-2 flex gap-1">
                  <input
                    type="text"
                    value={formData.noOfArticles2}
                    onChange={(e) => setFormData({ ...formData, noOfArticles2: e.target.value })}
                    placeholder="SAN QTY"
                    className="w-2/3 bg-white text-slate-900 font-bold px-1 py-0.5 border border-sky-300 rounded text-xs"
                  />
                  <input
                    type="text"
                    value={formData.bundles2}
                    onChange={(e) => setFormData({ ...formData, bundles2: e.target.value.toUpperCase() })}
                    placeholder="BUNDLE"
                    className="w-1/3 bg-white text-slate-900 font-bold px-0.5 py-0.5 border border-sky-300 rounded text-[9px] text-center uppercase"
                  />
                </div>

                <div className="col-span-6 md:col-span-4">
                  <input
                    type="text"
                    value={formData.descriptionOfGoods2}
                    onChange={(e) => setFormData({ ...formData, descriptionOfGoods2: e.target.value.toUpperCase() })}
                    placeholder="SANITARYWARE"
                    className="w-full bg-white text-slate-900 font-bold px-1.5 py-0.5 border border-sky-300 rounded text-xs uppercase"
                  />
                </div>

                <div className="col-span-12 md:col-span-6 text-[10px] text-amber-300 font-medium italic px-1">
                  (Optional 2nd Item: Sanitaryware)
                </div>
              </div>
            </div>

            {/* Row 4: 3-Column Bottom Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-1.5 shrink-0">

              {/* Col A (4 cols): GST Payable By, Bills, Invoice Value */}
              <div className="col-span-1 md:col-span-4 bg-sky-950/80 p-2 rounded border border-sky-500 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-extrabold text-yellow-300 text-[10px]">GST PAYABLE:</span>
                  <select
                    value={formData.gstPayableBy}
                    onChange={(e) => setFormData({ ...formData, gstPayableBy: e.target.value })}
                    className="bg-yellow-400 text-slate-950 font-black text-[10px] px-1 py-0.5 rounded border border-amber-500 uppercase cursor-pointer"
                  >
                    <option value="CONSIGNEE">CONSIGNEE</option>
                    <option value="CONSIGNOR">CONSIGNOR</option>
                    <option value="TRANSPORTER">TRANSPORTER</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    value={formData.billNumbers}
                    onChange={(e) => setFormData({ ...formData, billNumbers: e.target.value })}
                    placeholder="BILL NO."
                    className="bg-white text-slate-900 font-bold px-1.5 py-0.5 border rounded text-xs"
                  />
                  <input
                    type="text"
                    value={formData.invoiceValue}
                    onChange={(e) => setFormData({ ...formData, invoiceValue: e.target.value })}
                    placeholder="INV VALUE RS"
                    className="bg-white text-slate-900 font-mono font-bold px-1.5 py-0.5 border rounded text-xs"
                  />
                </div>

                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="REMARKS IF ANY..."
                  className="w-full bg-white text-slate-900 font-medium px-1.5 py-0.5 border rounded text-xs"
                />
              </div>

              {/* Col B (4 cols): Driver & E-Way Bills */}
              <div className="col-span-1 md:col-span-4 bg-sky-950/80 p-2 rounded border border-sky-500 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-extrabold text-yellow-300 text-[10px]">E-WAY BILL & DRIVER DETAILS:</span>
                </div>

                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    value={formData.consignorEwayBill}
                    onChange={(e) => setFormData({ ...formData, consignorEwayBill: e.target.value })}
                    placeholder="CONSIGNOR EWAY"
                    className="bg-white text-slate-900 font-mono font-bold px-1.5 py-0.5 border rounded text-[11px]"
                  />
                  <input
                    type="text"
                    value={formData.consigneeEwayBill}
                    onChange={(e) => setFormData({ ...formData, consigneeEwayBill: e.target.value })}
                    placeholder="CONSIGNEE EWAY"
                    className="bg-white text-slate-900 font-mono font-bold px-1.5 py-0.5 border rounded text-[11px]"
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={formData.driverMobile}
                    onChange={(e) => setFormData({ ...formData, driverMobile: e.target.value })}
                    placeholder="DRIVER MOBILE NO."
                    className="w-full bg-white text-slate-900 font-mono font-bold px-1.5 py-0.5 border rounded text-[11px]"
                  />
                </div>
              </div>

              {/* Col C (4 cols): Calculations */}
              <div className="col-span-1 md:col-span-4 bg-sky-950/90 p-2 rounded border-2 border-yellow-400 space-y-1 text-xs font-bold">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-extrabold text-yellow-300 text-[10px]">FREIGHT & CALCULATIONS:</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sky-200 text-[10px]">Freight Rate:</span>
                  <input
                    type="number"
                    value={formData.freightAmount}
                    onChange={(e) => setFormData({ ...formData, freightAmount: parseFloat(e.target.value) || 0 })}
                    className="w-24 bg-white text-slate-900 text-right font-mono font-black px-1.5 py-0.5 border rounded text-xs"
                  />
                </div>

                <div className="flex justify-between items-center gap-1">
                  <span className="text-sky-200 text-[10px]">GST %:</span>
                  <div className="flex gap-1 items-center">
                    <div className="flex items-center gap-0.5 bg-slate-900 px-1 py-0.5 rounded border border-slate-700">
                      <span className="text-[9px] text-amber-300 font-black">S:</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.sgstPercent}
                        onChange={(e) => setFormData({ ...formData, sgstPercent: parseFloat(e.target.value) || 0 })}
                        className="w-7 bg-white text-slate-900 text-center font-bold px-0.5 py-0.5 border rounded text-[10px]"
                      />
                    </div>
                    <div className="flex items-center gap-0.5 bg-slate-900 px-1 py-0.5 rounded border border-slate-700">
                      <span className="text-[9px] text-amber-300 font-black">C:</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.cgstPercent}
                        onChange={(e) => setFormData({ ...formData, cgstPercent: parseFloat(e.target.value) || 0 })}
                        className="w-7 bg-white text-slate-900 text-center font-bold px-0.5 py-0.5 border rounded text-[10px]"
                      />
                    </div>
                    <div className="flex items-center gap-0.5 bg-slate-900 px-1 py-0.5 rounded border border-slate-700">
                      <span className="text-[9px] text-amber-300 font-black">I:</span>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.igstPercent}
                        onChange={(e) => setFormData({ ...formData, igstPercent: parseFloat(e.target.value) || 0 })}
                        className="w-7 bg-white text-slate-900 text-center font-bold px-0.5 py-0.5 border rounded text-[10px]"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center gap-1 border-t border-sky-800 pt-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-amber-300 font-bold">Advance:</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.lessAdvancePaid}
                      onChange={(e) => setFormData({ ...formData, lessAdvancePaid: parseFloat(e.target.value) || 0 })}
                      className="w-14 bg-white text-slate-900 text-right font-mono font-bold px-1 py-0.5 border rounded text-[10px]"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-amber-300 font-bold">Other:</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={formData.otherCharges}
                      onChange={(e) => setFormData({ ...formData, otherCharges: parseFloat(e.target.value) || 0 })}
                      className="w-14 bg-white text-slate-900 text-right font-mono font-bold px-1 py-0.5 border rounded text-[10px]"
                    />
                  </div>
                </div>

                <div className="bg-yellow-400 text-slate-950 px-2 py-0.5 rounded flex justify-between items-center shadow mt-1">
                  <span className="font-black text-[11px] uppercase">NET TOTAL:</span>
                  <span className="font-mono font-black text-sm">₹ {formData.netTotalAmount}</span>
                </div>
              </div>

            </div>

          </form>

          {/* Bottom Action Buttons Bar (Save LR, Save & Print, PDF, WhatsApp, Reset) */}
          <div className="bg-sky-950 px-3 py-2 border-t border-sky-400 flex flex-wrap justify-end items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              id="save-lr-btn"
              type="button"
              onClick={() => handleSave()}
              className="px-3 sm:px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded text-xs uppercase shadow flex items-center gap-1.5 transition-all cursor-pointer transform hover:scale-105 focus:ring-4 focus:ring-amber-300 focus:outline-none"
            >
              <Save size={14} /> Save LR
            </button>

            <button
              type="button"
              onClick={handleSaveAndPrint}
              className="px-3 sm:px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded text-xs uppercase shadow flex items-center gap-1.5 transition-all cursor-pointer transform hover:scale-105"
            >
              <Printer size={14} /> Save & Print
            </button>

            <button
              type="button"
              onClick={() => {
                const saved = handleSave();
                if (saved) setShowPrintModal(true);
              }}
              className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded text-xs uppercase shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download size={14} /> PDF
            </button>

            <button
              type="button"
              onClick={() => {
                const saved = handleSave();
                if (saved) setShowPrintModal(true);
              }}
              className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white font-black rounded text-xs uppercase shadow flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Share2 size={14} /> WhatsApp
            </button>

            {formData.id && (
              <button
                type="button"
                onClick={handleDeleteCurrentLR}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer ml-1"
              >
                <Trash2 size={14} /> Delete LR
              </button>
            )}

            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded text-xs uppercase transition-all flex items-center gap-1.5 cursor-pointer ml-1"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>

        {/* LR Saved Successfully Pop-up Modal */}
        {showSuccessModal && activeLR && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border-2 border-amber-400 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border-2 border-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl font-black">
                ✓
              </div>

              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-wide">
                  L/R #{activeLR.lrNumber} Saved Successfully!
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Lorry Receipt record has been saved safely into database.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setActiveAutoAction("print");
                    setShowPrintModal(true);
                  }}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase flex items-center justify-center gap-1.5 shadow"
                >
                  <Printer size={14} /> Print A4
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setActiveAutoAction("pdf");
                    setShowPrintModal(true);
                  }}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs uppercase flex items-center justify-center gap-1.5 shadow"
                >
                  <Download size={14} /> Export PDF
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    setActiveAutoAction("whatsapp");
                    setShowPrintModal(true);
                  }}
                  className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white font-black rounded-lg text-xs uppercase flex items-center justify-center gap-1.5 shadow"
                >
                  <Share2 size={14} /> WhatsApp
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowSuccessModal(false);
                    handleReset();
                  }}
                  className="px-3 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-lg text-xs uppercase flex items-center justify-center gap-1.5 shadow"
                >
                  <Plus size={14} /> New LR
                </button>
              </div>

              <div className="pt-2 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded-lg text-xs uppercase"
                >
                  Close / Continue Editing
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Consignor Modal */}
        {searchConsignorModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border-2 border-yellow-400 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <div>
                  <h3 className="text-lg font-black text-yellow-300 flex items-center gap-2 uppercase">
                    <Building2 size={20} /> Select Consignors (Multiple Allowed)
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Selected: {selectedConsignors.length} Consignor(s)
                  </p>
                </div>
                <button
                  onClick={() => setSearchConsignorModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={partySearchQuery}
                  onChange={(e) => setPartySearchQuery(e.target.value)}
                  placeholder="Type Consignor Name, City, GST No..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-700 border border-slate-700 rounded-lg">
                {consignorsList
                  .filter(
                    (p) =>
                      p.partyName.toLowerCase().includes(partySearchQuery.toLowerCase()) ||
                      (p.city && p.city.toLowerCase().includes(partySearchQuery.toLowerCase())) ||
                      (p.gstNo && p.gstNo.toLowerCase().includes(partySearchQuery.toLowerCase()))
                  )
                  .map((p) => {
                    const isSelected = selectedConsignors.some(
                      (c) => c.partyName.trim().toUpperCase() === p.partyName.trim().toUpperCase()
                    );
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          if (isSelected) {
                            const idx = selectedConsignors.findIndex(
                              (c) => c.partyName.trim().toUpperCase() === p.partyName.trim().toUpperCase()
                            );
                            if (idx !== -1) handleRemoveConsignor(idx);
                          } else {
                            handleAddConsignor(p.partyName);
                          }
                        }}
                        className={`p-3 cursor-pointer flex justify-between items-center transition-colors ${isSelected ? "bg-sky-950/90 border-l-4 border-yellow-400" : "hover:bg-slate-700/50"
                          }`}
                      >
                        <div>
                          <div className="font-extrabold text-white text-sm uppercase flex items-center gap-1.5">
                            {isSelected && <span className="text-yellow-400 font-black">✓</span>}
                            {p.partyName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {p.city || p.district || p.state} | GST: {p.gstNo || "N/A"}
                          </div>
                        </div>
                        <button
                          type="button"
                          className={`px-3 py-1 font-bold rounded text-xs ${isSelected ? "bg-emerald-500 text-slate-950" : "bg-yellow-400 text-slate-950"
                            }`}
                        >
                          {isSelected ? "Selected ✓" : "+ Add"}
                        </button>
                      </div>
                    );
                  })}
                {consignorsList.filter(
                  (p) =>
                    p.partyName.toLowerCase().includes(partySearchQuery.toLowerCase()) ||
                    (p.city && p.city.toLowerCase().includes(partySearchQuery.toLowerCase())) ||
                    (p.gstNo && p.gstNo.toLowerCase().includes(partySearchQuery.toLowerCase()))
                ).length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No Consignor parties found matching "{partySearchQuery}"
                    </div>
                  )}
              </div>

              <div className="pt-2 border-t border-slate-700 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSearchConsignorModal(false)}
                  className="px-5 py-2 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-xs uppercase shadow"
                >
                  Done / Apply Selection ({selectedConsignors.length})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Search Consignee Modal */}
        {searchConsigneeModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-800 border-2 border-yellow-400 rounded-2xl max-w-xl w-full p-5 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b border-slate-700 pb-2">
                <h3 className="text-lg font-black text-yellow-300 flex items-center gap-2 uppercase">
                  <Building2 size={20} /> Search & Select Consignee
                </h3>
                <button
                  onClick={() => setSearchConsigneeModal(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={partySearchQuery}
                  onChange={(e) => setPartySearchQuery(e.target.value)}
                  placeholder="Type Consignee Name, City, GST No..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-700 border border-slate-700 rounded-lg">
                {consigneesList
                  .filter(
                    (p) =>
                      p.partyName.toLowerCase().includes(partySearchQuery.toLowerCase()) ||
                      (p.city && p.city.toLowerCase().includes(partySearchQuery.toLowerCase())) ||
                      (p.gstNo && p.gstNo.toLowerCase().includes(partySearchQuery.toLowerCase()))
                  )
                  .map((p) => (
                    <div
                      key={p.id}
                      onClick={() => {
                        handleSelectConsignee(p.partyName);
                        setSearchConsigneeModal(false);
                      }}
                      className="p-3 hover:bg-sky-950/60 cursor-pointer flex justify-between items-center transition-colors"
                    >
                      <div>
                        <div className="font-extrabold text-white text-sm">{p.partyName}</div>
                        <div className="text-xs text-slate-400">
                          {p.city || p.district || p.state} | GST: {p.gstNo || "N/A"}
                        </div>
                      </div>
                      <button className="px-3 py-1 bg-yellow-400 text-slate-950 font-bold rounded text-xs">
                        Select
                      </button>
                    </div>
                  ))}
                {consigneesList.filter(
                  (p) =>
                    p.partyName.toLowerCase().includes(partySearchQuery.toLowerCase()) ||
                    (p.city && p.city.toLowerCase().includes(partySearchQuery.toLowerCase())) ||
                    (p.gstNo && p.gstNo.toLowerCase().includes(partySearchQuery.toLowerCase()))
                ).length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      No Consignee parties found matching "{partySearchQuery}"
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}

        {/* Add New Truck Modal (Exact Truck Master Matching Fields) */}
        {showAddTruckModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
            <div className="bg-sky-900/90 border-2 border-yellow-400 rounded-lg max-w-xl w-full shadow-2xl overflow-hidden backdrop-blur-sm flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="bg-sky-950 px-3 py-1.5 border-b border-yellow-400 flex justify-between items-center shrink-0">
                <h2 className="text-xs sm:text-sm font-black text-blue-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-yellow-400" /> + ADD NEW TRUCK TO MASTER
                </h2>
                <button
                  type="button"
                  onClick={() => setShowAddTruckModal(false)}
                  className="text-slate-300 hover:text-white p-0.5 rounded cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Inputs */}
              <form onSubmit={handleSaveNewTruckModal} className="p-3 space-y-3 text-xs overflow-y-auto">
                {/* Basic Information Section */}
                <div className="space-y-2">
                  <div className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider border-b border-sky-700/60 pb-0.5 flex items-center gap-1">
                    <Truck size={13} /> Basic Information
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                        Truck No. *
                      </label>
                      <input
                        type="text"
                        required
                        autoFocus
                        value={newTruckForm.truckNo}
                        onChange={(e) => setNewTruckForm({ ...newTruckForm, truckNo: e.target.value.toUpperCase() })}
                        placeholder="e.g. GJ28AA2626"
                        className="w-full bg-white text-slate-900 font-extrabold px-2 py-1 text-xs border border-sky-400 rounded focus:outline-none uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                        Owner Name
                      </label>
                      <input
                        type="text"
                        value={newTruckForm.ownerName}
                        onChange={(e) => setNewTruckForm({ ...newTruckForm, ownerName: e.target.value.toUpperCase() })}
                        placeholder="OWNER NAME"
                        className="w-full bg-white text-slate-900 font-bold px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                        Mobile No.
                      </label>
                      <input
                        type="text"
                        value={newTruckForm.mobileNo}
                        onChange={(e) => setNewTruckForm({ ...newTruckForm, mobileNo: e.target.value })}
                        placeholder="MOBILE NUMBER"
                        className="w-full bg-white text-slate-900 font-bold px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                        Address
                      </label>
                      <input
                        type="text"
                        value={newTruckForm.address}
                        onChange={(e) => setNewTruckForm({ ...newTruckForm, address: e.target.value.toUpperCase() })}
                        placeholder="CITY / ADDRESS"
                        className="w-full bg-white text-slate-900 font-medium px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Bank Details Section */}
                <div className="space-y-2 pt-1 border-t border-sky-700/60">
                  <div className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider border-b border-sky-700/60 pb-0.5 flex items-center gap-1">
                    <Building2 size={13} /> Bank Details
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                        Bank Name
                      </label>
                      <input
                        type="text"
                        value={newTruckForm.bankName}
                        onChange={(e) => setNewTruckForm({ ...newTruckForm, bankName: e.target.value.toUpperCase() })}
                        placeholder="e.g. HDFC BANK"
                        className="w-full bg-white text-slate-900 font-bold px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                        Account Name
                      </label>
                      <input
                        type="text"
                        value={newTruckForm.accountName}
                        onChange={(e) => setNewTruckForm({ ...newTruckForm, accountName: e.target.value.toUpperCase() })}
                        placeholder="ACCOUNT HOLDER NAME"
                        className="w-full bg-white text-slate-900 font-medium px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                        Account No.
                      </label>
                      <input
                        type="text"
                        value={newTruckForm.accountNo}
                        onChange={(e) => setNewTruckForm({ ...newTruckForm, accountNo: e.target.value })}
                        placeholder="ACCOUNT NUMBER"
                        className="w-full bg-white text-slate-900 font-mono font-bold px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        value={newTruckForm.ifscCode}
                        onChange={(e) => setNewTruckForm({ ...newTruckForm, ifscCode: e.target.value.toUpperCase() })}
                        placeholder="IFSC CODE"
                        className="w-full bg-white text-slate-900 font-mono font-bold px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                        Branch
                      </label>
                      <input
                        type="text"
                        value={newTruckForm.branch}
                        onChange={(e) => setNewTruckForm({ ...newTruckForm, branch: e.target.value.toUpperCase() })}
                        placeholder="BRANCH NAME"
                        className="w-full bg-white text-slate-900 font-medium px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="pt-2 border-t border-sky-700 flex justify-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddTruckModal(false)}
                    className="px-3 py-1 bg-slate-700 text-slate-300 font-bold rounded hover:bg-slate-600 text-xs uppercase cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded text-xs uppercase flex items-center gap-1 shadow cursor-pointer"
                  >
                    <Save size={14} /> Save & Select Truck
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add New Party Modal (Exact Party Master Screenshot Match) */}
        {showAddPartyModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3">
            <div className="bg-sky-900/90 border-2 border-yellow-400 rounded-lg max-w-2xl w-full shadow-2xl overflow-hidden backdrop-blur-sm flex flex-col max-h-[90vh]">

              {/* Form Title Header (Matches Screenshot) */}
              <div className="bg-sky-950 px-3 py-1.5 border-b border-yellow-400 flex justify-between items-center shrink-0">
                <h2 className="text-xs sm:text-sm font-black text-blue-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-yellow-400" /> + ADD NEW PARTY
                </h2>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 font-black rounded text-[10px] uppercase">
                    NEW ENTRY
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddPartyModal(false)}
                    className="text-slate-300 hover:text-white p-0.5 rounded transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Form Inputs (Matches Screenshot Layout) */}
              <form onSubmit={handleSaveNewParty} className="p-3 space-y-2 text-xs overflow-y-auto">

                {/* Party Name */}
                <div>
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    PARTY NAME *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newPartyForm.partyName}
                    onChange={(e) => setNewPartyForm({ ...newPartyForm, partyName: e.target.value.toUpperCase() })}
                    placeholder="ENTER PARTY NAME"
                    className="w-full bg-white text-slate-900 font-bold px-2 py-0.5 text-xs border border-sky-400 rounded focus:outline-none uppercase"
                  />
                </div>

                {/* Address Lines */}
                <div>
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    ADDRESS LINE 1, LINE 2 & LINE 3
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      value={newPartyForm.address1}
                      onChange={(e) => setNewPartyForm({ ...newPartyForm, address1: e.target.value.toUpperCase() })}
                      placeholder="ADDRESS LINE 1"
                      className="w-full bg-white text-slate-900 font-medium px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                    />
                    <input
                      type="text"
                      value={newPartyForm.address2}
                      onChange={(e) => setNewPartyForm({ ...newPartyForm, address2: e.target.value.toUpperCase() })}
                      placeholder="AREA / LANDMARK"
                      className="w-full bg-white text-slate-900 font-medium px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                    />
                    <input
                      type="text"
                      value={newPartyForm.address3}
                      onChange={(e) => setNewPartyForm({ ...newPartyForm, address3: e.target.value.toUpperCase() })}
                      placeholder="ADDRESS LINE 3"
                      className="w-full bg-white text-slate-900 font-medium px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                    />
                  </div>
                </div>

                {/* City, District, State & Code */}
                <div className="grid grid-cols-12 gap-1.5">
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                      CITY
                    </label>
                    <input
                      type="text"
                      value={newPartyForm.city}
                      onChange={(e) => setNewPartyForm({ ...newPartyForm, city: e.target.value.toUpperCase() })}
                      placeholder="CITY"
                      className="w-full bg-white text-slate-900 font-medium px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                    />
                  </div>
                  <div className="col-span-6 sm:col-span-3">
                    <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                      DISTRICT
                    </label>
                    <input
                      type="text"
                      value={newPartyForm.district}
                      onChange={(e) => setNewPartyForm({ ...newPartyForm, district: e.target.value.toUpperCase() })}
                      placeholder="DISTRICT"
                      className="w-full bg-white text-slate-900 font-medium px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                    />
                  </div>
                  <div className="col-span-8 sm:col-span-4">
                    <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                      STATE
                    </label>
                    <input
                      type="text"
                      value={newPartyForm.state}
                      onChange={(e) => handleStateChange(e.target.value.toUpperCase())}
                      placeholder="STATE"
                      className="w-full bg-white text-slate-900 font-bold px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                      CODE
                    </label>
                    <input
                      type="text"
                      value={newPartyForm.stateCode}
                      onChange={(e) => setNewPartyForm({ ...newPartyForm, stateCode: e.target.value })}
                      placeholder="CODE"
                      className="w-full bg-white text-slate-900 font-bold text-center px-1 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                    />
                  </div>
                </div>

                {/* GST No. & PAN No. */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                      GST NO.
                    </label>
                    <input
                      type="text"
                      value={newPartyForm.gstNo}
                      onChange={(e) => handleAddGstChange(e.target.value)}
                      placeholder="24ACCFB3501E1Z8"
                      className="w-full bg-white text-slate-900 font-mono font-bold px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                      PAN NO.
                    </label>
                    <input
                      type="text"
                      value={newPartyForm.panNo}
                      onChange={(e) => setNewPartyForm({ ...newPartyForm, panNo: e.target.value.toUpperCase() })}
                      placeholder="ACCFB3501E"
                      className="w-full bg-white text-slate-900 font-mono font-bold px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                    />
                  </div>
                </div>

                {/* Contact Person & Mobile Nos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div>
                    <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                      CONTACT PERSON
                    </label>
                    <input
                      type="text"
                      value={newPartyForm.contactName}
                      onChange={(e) => setNewPartyForm({ ...newPartyForm, contactName: e.target.value })}
                      placeholder="NAME"
                      className="w-full bg-white text-slate-900 font-medium px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                      MOBILE NUMBERS
                    </label>
                    <input
                      type="text"
                      value={newPartyForm.mobileNos}
                      onChange={(e) => setNewPartyForm({ ...newPartyForm, mobileNos: e.target.value })}
                      placeholder="MOBILE NO."
                      className="w-full bg-white text-slate-900 font-bold px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                    />
                  </div>
                </div>

                {/* Party Category Dropdown (Matches Screenshot) */}
                <div>
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    PARTY CATEGORY
                  </label>
                  <select
                    value={newPartyForm.selectType}
                    onChange={(e) => setNewPartyForm({ ...newPartyForm, selectType: e.target.value })}
                    className="w-full bg-yellow-400 text-slate-950 font-extrabold px-2 py-1 text-xs border-2 border-yellow-500 rounded focus:outline-none uppercase cursor-pointer"
                  >
                    <option value="CONSIGNEE">CONSIGNEE (माल प्राप्तकर्ता)</option>
                    <option value="CONSIGNOR">CONSIGNOR (माल भेजने वाला)</option>
                    <option value="BOTH">BOTH (दोनों)</option>
                  </select>
                </div>

                {/* Modal Action Buttons (Matches Screenshot: CLEAR FORM & SAVE NEW PARTY) */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-sky-700">
                  <button
                    type="button"
                    onClick={() => setNewPartyForm(initialBlankPartyForm)}
                    className="px-4 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded text-xs uppercase cursor-pointer"
                  >
                    CLEAR FORM
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-1 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded text-xs uppercase shadow-md cursor-pointer transition-all"
                  >
                    <Save size={14} />
                    <span>SAVE NEW PARTY</span>
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
