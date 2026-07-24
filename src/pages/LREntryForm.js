import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { fetchPartiesFromDB, fetchLREntriesFromDB, saveLREntry, getNextLRNumber } from "../utils/storage";
import LRPrintDocument from "../components/LRPrintDocument";
import SearchablePartySelect from "../components/SearchablePartySelect";
import { Save, Printer, Download, Share2, Plus, RotateCcw, Search, X, Building2 } from "lucide-react";

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

  const initialForm = {
    id: "",
    lrNumber: "",
    copyData: "N",
    fromPlace: "",
    toPlace: "",
    deliveryAt: "DOOR",
    truckNo: "",
    dateTime: new Date().toISOString().slice(0, 16),

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
    weightKgs: "",
    ratePerTon: "",
    rateType: "P.M.T.",
    toPayOrPaid: "TO-PAY", // TO-PAY / PAID
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
    remarks: "WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE.",
    debitAmountTo: "CONSIGNEE",
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    const loadInitData = async () => {
      const loadedParties = await fetchPartiesFromDB();
      await fetchLREntriesFromDB();
      setParties(loadedParties || []);
      if (location.state && location.state.editLR) {
        setFormData(location.state.editLR);
        flashMsg(`Editing LR #${location.state.editLR.lrNumber}`);
      } else {
        const nextNo = getNextLRNumber();
        setFormData((prev) => ({ ...prev, lrNumber: nextNo }));
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
    const addr3Parts = [party.address3, party.city, party.state].filter(Boolean);
    const addr3 = addr3Parts.join(", ").trim();

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

      const rawAddr1 = [c1.address1, c1.city].filter(Boolean).join(", ");
      const rawAddr2 = [c2.address1, c2.city].filter(Boolean).join(", ");

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
      const gstVal = `(1) ${c1.gstNo || ""}   (2) ${c2.gstNo || ""}`;

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
      const gstVal = list.map((c, idx) => `(${idx + 1}) ${c.gstNo || ""}`).join("  ");

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
        toPlace: party.city || prev.toPlace,
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
    const nextNo = getNextLRNumber();
    setFormData({ ...initialForm, lrNumber: nextNo });
  };

  const flashMsg = (text) => {
    setStatusMsg(text);
    setTimeout(() => setStatusMsg(""), 4000);
  };

  // Fast Data Entry: Move to next input field on Enter press & auto-scroll into view
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // If pressing Enter on submit button, let form submit naturally
      if (e.target.tagName === "BUTTON" && e.target.type === "submit") {
        return;
      }

      // Allow multiline entry in textarea if Shift+Enter is pressed
      if (e.target.tagName === "TEXTAREA" && e.shiftKey) {
        return;
      }

      // Prevent default form submit action on enter key
      e.preventDefault();

      const form = e.currentTarget;
      const focusable = Array.from(
        form.querySelectorAll(
          "input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button[type='submit']:not([disabled])"
        )
      ).filter((el) => el.tabIndex !== -1 && el.offsetParent !== null);

      const index = focusable.indexOf(e.target);
      if (index > -1 && index < focusable.length - 1) {
        const next = focusable[index + 1];
        next.focus();
        if (typeof next.select === "function" && next.tagName === "INPUT") {
          next.select();
        }
        next.scrollIntoView({ behavior: "smooth", block: "center" });
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
    <div className="min-h-screen bg-slate-900 py-6 px-3 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Main Classic Software Card Frame (Styled like Photo 2) */}
        <div className="bg-sky-900/90 border-4 border-sky-400 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">

          {/* Header Bar */}
          <div className="bg-sky-950 px-6 py-3 border-b-2 border-sky-400 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left gap-2">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase font-sans">
                L/R ENTRY - ADD / EDIT / CHANGE
              </h1>
            </div>
            <button
              onClick={handleReset}
              className="px-3 py-1.5 bg-yellow-400 text-slate-950 font-extrabold rounded text-xs uppercase shadow hover:bg-yellow-300 transition-colors flex items-center gap-1"
            >
              <Plus size={14} /> New Entry
            </button>
          </div>

          {/* Flash Alert */}
          {statusMsg && (
            <div className="bg-emerald-500 text-slate-950 px-4 py-2 text-sm font-bold text-center animate-pulse">
              {statusMsg}
            </div>
          )}

          {/* Form Content */}
          <form onSubmit={handleSave} onKeyDown={handleKeyDown} className="p-4 sm:p-6 space-y-5">

            {/* Top Row: LR Number, Copy Data, From, To, Delivery At, Truck No, Date */}
            <div className="bg-sky-950/70 p-4 rounded-lg border border-sky-600/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-yellow-300 uppercase block mb-1">
                  L/R NUMBER
                </label>
                <input
                  type="text"
                  value={formData.lrNumber}
                  onChange={(e) => setFormData({ ...formData, lrNumber: e.target.value })}
                  placeholder="LR NO."
                  className="w-full bg-white text-slate-900 font-mono font-black text-base px-3 py-1.5 border-2 border-amber-400 rounded focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-yellow-300 uppercase block mb-1">
                  FROM ...
                </label>
                <input
                  type="text"
                  value={formData.fromPlace}
                  onChange={(e) => setFormData({ ...formData, fromPlace: e.target.value.toUpperCase() })}
                  placeholder="FROM PLACE"
                  className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 border border-sky-300 rounded uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-yellow-300 uppercase block mb-1">
                  TO PLACE...
                </label>
                <input
                  type="text"
                  value={formData.toPlace}
                  onChange={(e) => setFormData({ ...formData, toPlace: e.target.value.toUpperCase() })}
                  placeholder="TO PLACE"
                  className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 border border-sky-300 rounded uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-yellow-300 uppercase block mb-1">
                  DELIVERY AT
                </label>
                <input
                  type="text"
                  value={formData.deliveryAt}
                  onChange={(e) => setFormData({ ...formData, deliveryAt: e.target.value.toUpperCase() })}
                  placeholder="DOOR"
                  className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 border border-sky-300 rounded uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-yellow-300 uppercase block mb-1">
                  TRUCK NO.
                </label>
                <input
                  type="text"
                  value={formData.truckNo}
                  onChange={(e) => setFormData({ ...formData, truckNo: e.target.value.toUpperCase() })}
                  placeholder="TRUCK NO."
                  className="w-full bg-white text-slate-900 font-mono font-black px-3 py-1.5 border-2 border-sky-400 rounded uppercase"
                />
              </div>

            </div>

            {/* Consignor & Consignee Columns (Matching Photo 2 Box Layout) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* CONSIGNOR BOX */}
              <div className="bg-sky-950/80 p-4 rounded-lg border-2 border-sky-500 space-y-3">
                <div className="flex justify-between items-center border-b border-sky-700 pb-1">
                  <h3 className="text-sm font-extrabold text-yellow-300 uppercase tracking-wider">
                    CONSIGNOR (माल भेजने वाला)
                  </h3>
                  <div className="text-xs flex items-center gap-1 text-sky-200">
                    <span>Save in Master?</span>
                    <select
                      value={formData.saveConsignorInMaster}
                      onChange={(e) => setFormData({ ...formData, saveConsignorInMaster: e.target.value })}
                      className="bg-yellow-400 text-slate-950 font-bold px-1 rounded text-xs"
                    >
                      <option value="N">N</option>
                      <option value="Y">Y</option>
                    </select>
                  </div>
                </div>

                {/* Selected Consignors Badges / Chips */}
                {selectedConsignors.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-sky-900/60 rounded border border-sky-600">
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[11px] font-extrabold text-yellow-300 uppercase">
                        Selected Consignors ({selectedConsignors.length}):
                      </span>
                      <button
                        type="button"
                        onClick={() => applyConsignorsFormatting([])}
                        className="text-[10px] text-red-300 hover:text-red-100 font-bold underline"
                      >
                        Clear All
                      </button>
                    </div>
                    {selectedConsignors.map((c, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-xs font-black shadow">
                        ({idx + 1}) {c.partyName}
                        <button
                          type="button"
                          onClick={() => handleRemoveConsignor(idx)}
                          className="hover:text-red-700 ml-1 font-extrabold text-xs"
                          title="Remove Consignor"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Searchable Combobox Select & Search Button for Consignor */}
                <SearchablePartySelect
                  parties={consignorsList}
                  value=""
                  onSelectParty={(name) => handleAddConsignor(name)}
                  placeholder={selectedConsignors.length > 0 ? "+ Add Another Consignor Party..." : "-- Search or Select Consignor Party --"}
                  partyType="Consignor"
                  onSearchButtonClick={() => {
                    setPartySearchQuery("");
                    setSearchConsignorModal(true);
                  }}
                />

                {/* Custom/Selected Consignor Name (Textarea for multi-line support) */}
                <textarea
                  rows={selectedConsignors.length > 2 ? Math.min(selectedConsignors.length, 5) : selectedConsignors.length === 2 ? 4 : 2}
                  value={formData.consignorName}
                  onChange={(e) => setFormData({ ...formData, consignorName: e.target.value.toUpperCase() })}
                  placeholder="CONSIGNOR NAME"
                  className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 border border-sky-300 rounded text-xs uppercase font-mono"
                />

                {/* Address */}
                <textarea
                  rows={selectedConsignors.length === 2 ? 3 : 2}
                  value={formData.consignorAddress}
                  onChange={(e) => setFormData({ ...formData, consignorAddress: e.target.value.toUpperCase() })}
                  placeholder="CONSIGNOR ADDRESS..."
                  className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 border border-sky-300 rounded text-xs uppercase font-mono"
                />

                {/* GST Tin No. */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-yellow-300 uppercase whitespace-nowrap">
                    GST Tin No.:
                  </label>
                  <input
                    type="text"
                    value={formData.consignorGst}
                    onChange={(e) => setFormData({ ...formData, consignorGst: e.target.value.toUpperCase() })}
                    placeholder="24ACCFB3501E1Z8"
                    className="w-full bg-white text-slate-900 font-mono font-bold px-3 py-1 border border-sky-300 rounded text-xs uppercase"
                  />
                </div>
              </div>

              {/* CONSIGNEE BOX */}
              <div className="bg-sky-950/80 p-4 rounded-lg border-2 border-sky-500 space-y-3">
                <div className="flex justify-between items-center border-b border-sky-700 pb-1">
                  <h3 className="text-sm font-extrabold text-yellow-300 uppercase tracking-wider">
                    CONSIGNEE (माल प्राप्तकर्ता)
                  </h3>
                  <div className="text-xs flex items-center gap-1 text-sky-200">
                    <span>Save in Master?</span>
                    <select
                      value={formData.saveConsigneeInMaster}
                      onChange={(e) => setFormData({ ...formData, saveConsigneeInMaster: e.target.value })}
                      className="bg-yellow-400 text-slate-950 font-bold px-1 rounded text-xs"
                    >
                      <option value="N">N</option>
                      <option value="Y">Y</option>
                    </select>
                  </div>
                </div>

                {/* Searchable Combobox Select & Search Button for Consignee */}
                <SearchablePartySelect
                  parties={consigneesList}
                  value={formData.consigneeName}
                  onSelectParty={(name) => handleSelectConsignee(name)}
                  placeholder="-- Search or Select Consignee Party --"
                  partyType="Consignee"
                  onSearchButtonClick={() => {
                    setPartySearchQuery("");
                    setSearchConsigneeModal(true);
                  }}
                />

                {/* Custom/Selected Consignee Name */}
                <input
                  type="text"
                  value={formData.consigneeName}
                  onChange={(e) => setFormData({ ...formData, consigneeName: e.target.value.toUpperCase() })}
                  placeholder="CONSIGNEE NAME"
                  className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 border border-sky-300 rounded text-sm uppercase"
                />

                {/* Address */}
                <textarea
                  rows="3"
                  value={formData.consigneeAddress}
                  onChange={(e) => setFormData({ ...formData, consigneeAddress: e.target.value.toUpperCase() })}
                  placeholder="CONSIGNEE ADDRESS..."
                  className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 border border-sky-300 rounded text-xs uppercase"
                />

                {/* GST Tin No. */}
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-yellow-300 uppercase whitespace-nowrap">
                    GST Tin No.:
                  </label>
                  <input
                    type="text"
                    value={formData.consigneeGst}
                    onChange={(e) => setFormData({ ...formData, consigneeGst: e.target.value.toUpperCase() })}
                    placeholder="GSTIN NO."
                    className="w-full bg-white text-slate-900 font-mono font-bold px-3 py-1 border border-sky-300 rounded text-xs uppercase"
                  />
                </div>
              </div>

            </div>

            {/* Particulars Table (Matching Photo 2 Goods Section) */}
            <div className="bg-sky-950/90 p-4 rounded-lg border-2 border-sky-500 space-y-2 overflow-x-auto">
              <h3 className="text-xs font-bold text-yellow-300 uppercase tracking-wider">
                GOODS DETAILS & FREIGHT
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs font-bold text-sky-200 uppercase">
                <div className="sm:col-span-2">No. of Articles</div>
                <div className="sm:col-span-4">Description of Goods</div>
                <div className="sm:col-span-2">Weight</div>
                <div className="sm:col-span-2">Rate Rs. Per Ton</div>
                <div className="sm:col-span-2">To Pay / Paid</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-2 flex gap-1">
                  <input
                    type="text"
                    value={formData.noOfArticles}
                    onChange={(e) => setFormData({ ...formData, noOfArticles: e.target.value })}
                    placeholder="QTY/NO."
                    className="w-2/3 bg-white text-slate-900 font-bold px-2 py-1.5 border rounded text-sm"
                  />
                  <input
                    type="text"
                    value={formData.bundles}
                    onChange={(e) => setFormData({ ...formData, bundles: e.target.value.toUpperCase() })}
                    placeholder="BOX"
                    className="w-1/3 bg-white text-slate-900 font-bold px-1 py-1.5 border rounded text-xs text-center uppercase"
                  />
                </div>

                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={formData.descriptionOfGoods}
                    onChange={(e) => setFormData({ ...formData, descriptionOfGoods: e.target.value.toUpperCase() })}
                    placeholder="CERAMIC TILES"
                    className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 border rounded text-sm uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={formData.weightKgs}
                    onChange={(e) => handleWeightRateChange("weightKgs", e.target.value)}
                    placeholder="WEIGHT"
                    className="w-full bg-white text-slate-900 font-mono font-bold px-3 py-1.5 border rounded text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={formData.ratePerTon}
                    onChange={(e) => handleWeightRateChange("ratePerTon", e.target.value)}
                    placeholder="RATE"
                    className="w-full bg-white text-slate-900 font-mono font-bold px-3 py-1.5 border rounded text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <select
                    value={formData.toPayOrPaid}
                    onChange={(e) => setFormData({ ...formData, toPayOrPaid: e.target.value })}
                    className="w-full bg-yellow-400 text-slate-950 font-black px-2 py-1.5 border rounded text-sm uppercase cursor-pointer"
                  >
                    <option value="TO-PAY">TO-PAY</option>
                    <option value="PAID">PAID</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Grid: Left Metadata & Right Calculations */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">

              {/* Left Column (7 cols): GST Payable By (3 Options), Bills, Driver, E-Way Bill */}
              <div className="md:col-span-7 bg-sky-950/80 p-4 rounded-lg border-2 border-sky-500 space-y-3 text-xs">

                {/* User Requested: GST PAYABLE BY 3 OPTIONS (CONSIGNEE / CONSIGNOR / TRANSPORTER) */}
                <div className="bg-sky-900 p-2.5 rounded border border-yellow-400 flex items-center justify-between gap-2">
                  <label className="font-extrabold text-yellow-300 uppercase text-xs">
                    GST PAYABLE BY:
                  </label>
                  <select
                    value={formData.gstPayableBy}
                    onChange={(e) => setFormData({ ...formData, gstPayableBy: e.target.value })}
                    className="bg-yellow-400 text-slate-950 font-black text-sm px-3 py-1 rounded border-2 border-amber-500 focus:outline-none cursor-pointer uppercase"
                  >
                    <option value="CONSIGNEE">CONSIGNEE (प्राप्तकर्ता)</option>
                    <option value="CONSIGNOR">CONSIGNOR (भेजने वाला)</option>
                    <option value="TRANSPORTER">TRANSPORTER (ट्रांसपोर्टर)</option>
                  </select>
                </div>

                {/* Bill Numbers & Invoice Amount */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-sky-200 block mb-1">Bill Numbers:</label>
                    <input
                      type="text"
                      value={formData.billNumbers}
                      onChange={(e) => setFormData({ ...formData, billNumbers: e.target.value })}
                      placeholder="BILL NO."
                      className="w-full bg-white text-slate-900 font-bold px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-sky-200 block mb-1">Invoice Value Rs.:</label>
                    <input
                      type="text"
                      value={formData.invoiceValue}
                      onChange={(e) => setFormData({ ...formData, invoiceValue: e.target.value })}
                      placeholder="INVOICE VALUE"
                      className="w-full bg-white text-slate-900 font-mono font-bold px-2 py-1 border rounded"
                    />
                  </div>
                </div>

                {/* Driver Details */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-sky-200 block mb-1">Driver Name:</label>
                    <input
                      type="text"
                      value={formData.driverName}
                      onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                      placeholder="DRIVER NAME"
                      className="w-full bg-white text-slate-900 font-medium px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-sky-200 block mb-1">License No.:</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      placeholder="LICENSE NO."
                      className="w-full bg-white text-slate-900 font-medium px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-sky-200 block mb-1">Driver Mobile:</label>
                    <input
                      type="text"
                      value={formData.driverMobile}
                      onChange={(e) => setFormData({ ...formData, driverMobile: e.target.value })}
                      placeholder="MOBILE NO."
                      className="w-full bg-white text-slate-900 font-bold px-2 py-1 border rounded"
                    />
                  </div>
                </div>

                {/* E-Way Bill Numbers */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-sky-200 block mb-1">Consignor E-Way Bill:</label>
                    <input
                      type="text"
                      value={formData.consignorEwayBill}
                      onChange={(e) => setFormData({ ...formData, consignorEwayBill: e.target.value })}
                      placeholder="E-WAY BILL NO."
                      className="w-full bg-white text-slate-900 font-mono font-bold px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-sky-200 block mb-1">Consignee E-Way Bill:</label>
                    <input
                      type="text"
                      value={formData.consigneeEwayBill}
                      onChange={(e) => setFormData({ ...formData, consigneeEwayBill: e.target.value })}
                      placeholder="E-WAY BILL NO."
                      className="w-full bg-white text-slate-900 font-mono font-bold px-2 py-1 border rounded"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="font-bold text-sky-200 block mb-1">Remarks if Any...</label>
                  <input
                    type="text"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE."
                    className="w-full bg-white text-slate-900 font-medium px-2 py-1 border rounded"
                  />
                </div>

              </div>

              {/* Right Column (5 cols): Freight Calculations & Totals (Matching Photo 2 Right Side) */}
              <div className="md:col-span-5 bg-sky-950/90 p-4 rounded-lg border-2 border-yellow-400 space-y-2 text-xs font-bold">
                <h3 className="text-yellow-300 border-b border-sky-700 pb-1 uppercase tracking-wider">
                  FREIGHT & GST CALCULATIONS
                </h3>

                <div className="flex justify-between items-center py-1">
                  <span className="text-sky-200">Freight Total:</span>
                  <input
                    type="number"
                    value={formData.freightAmount}
                    onChange={(e) => setFormData({ ...formData, freightAmount: parseFloat(e.target.value) || 0 })}
                    className="w-32 bg-white text-slate-900 text-right font-mono font-black px-2 py-1 border rounded text-sm"
                  />
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-sky-200">Add: S-G.S.T. %:</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="%"
                      value={formData.sgstPercent}
                      onChange={(e) => setFormData({ ...formData, sgstPercent: parseFloat(e.target.value) || 0 })}
                      className="w-14 bg-white text-slate-900 text-center font-bold px-1 py-0.5 border rounded"
                    />
                    <span className="w-20 font-mono text-right py-0.5">{formData.sgstAmount}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-0.5">
                  <span className="text-sky-200">Add: C-G.S.T. %:</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="%"
                      value={formData.cgstPercent}
                      onChange={(e) => setFormData({ ...formData, cgstPercent: parseFloat(e.target.value) || 0 })}
                      className="w-14 bg-white text-slate-900 text-center font-bold px-1 py-0.5 border rounded"
                    />
                    <span className="w-20 font-mono text-right py-0.5">{formData.cgstAmount}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-0.5 border-b border-sky-700 pb-1">
                  <span className="text-sky-200">Add: I-G.S.T. %:</span>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="%"
                      value={formData.igstPercent}
                      onChange={(e) => setFormData({ ...formData, igstPercent: parseFloat(e.target.value) || 0 })}
                      className="w-14 bg-white text-slate-900 text-center font-bold px-1 py-0.5 border rounded"
                    />
                    <span className="w-20 font-mono text-right py-0.5">{formData.igstAmount}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-1 font-extrabold text-white text-sm">
                  <span>Total With GST:</span>
                  <span className="font-mono text-yellow-300">₹ {formData.totalWithGst}</span>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-sky-200">Other Charges:</span>
                  <input
                    type="number"
                    value={formData.otherCharges}
                    onChange={(e) => setFormData({ ...formData, otherCharges: parseFloat(e.target.value) || 0 })}
                    className="w-28 bg-white text-slate-900 text-right font-mono font-bold px-2 py-1 border rounded"
                  />
                </div>

                <div className="flex justify-between items-center py-1 border-b border-sky-700 pb-1">
                  <span className="text-sky-200">Less: Advance Paid:</span>
                  <input
                    type="number"
                    value={formData.lessAdvancePaid}
                    onChange={(e) => setFormData({ ...formData, lessAdvancePaid: parseFloat(e.target.value) || 0 })}
                    className="w-28 bg-white text-slate-900 text-right font-mono font-bold px-2 py-1 border rounded"
                  />
                </div>

                <div className="bg-yellow-400 text-slate-950 p-2.5 rounded-lg flex justify-between items-center shadow-lg mt-2">
                  <span className="font-black text-sm uppercase">Net Total Amount:</span>
                  <span className="font-mono font-black text-xl">₹ {formData.netTotalAmount}</span>
                </div>
              </div>

            </div>

            {/* Bottom Actions Toolbar */}
            <div className="pt-4 border-t-2 border-sky-700 flex flex-wrap justify-center sm:justify-end gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs uppercase shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105"
              >
                <Save size={16} /> OK / Save LR
              </button>

              <button
                type="button"
                onClick={handleSaveAndPrint}
                className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-slate-950 font-black rounded-lg text-xs uppercase shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105"
              >
                <Printer size={16} /> Save & Print A4
              </button>

              <button
                type="button"
                onClick={() => {
                  const saved = handleSave();
                  if (saved) {
                    setShowPrintModal(true);
                  }
                }}
                className="px-4 py-2.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-extrabold rounded-lg text-xs uppercase shadow flex items-center gap-1.5 transition-colors"
              >
                <Download size={16} /> Export PDF
              </button>

              <button
                type="button"
                onClick={() => {
                  const saved = handleSave();
                  if (saved) {
                    setShowPrintModal(true);
                  }
                }}
                className="px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-extrabold rounded-lg text-xs uppercase shadow flex items-center gap-1.5 transition-colors"
              >
                <Share2 size={16} /> WhatsApp Share
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 bg-slate-600 hover:bg-slate-500 text-white font-bold rounded-lg text-xs uppercase shadow transition-colors flex items-center gap-1"
              >
                <RotateCcw size={14} /> Reset / Exit
              </button>
            </div>

          </form>
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

      </div>
    </div>
  );
}
