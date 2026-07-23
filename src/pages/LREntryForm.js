import React, { useState, useEffect } from "react";
import { getParties, saveLREntry, getNextLRNumber } from "../utils/storage";
import LRPrintDocument from "../components/LRPrintDocument";
import { Save, Printer, Download, Share2, Plus, RotateCcw } from "lucide-react";

export default function LREntryForm() {
  const [parties, setParties] = useState([]);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeLR, setActiveLR] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");

  const initialForm = {
    id: "",
    lrNumber: "",
    copyData: "N",
    fromPlace: "MORBI",
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
    descriptionOfGoods: "CERAMIC TILES+",
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
    const loadedParties = getParties();
    setParties(loadedParties);
    const nextNo = getNextLRNumber();
    setFormData((prev) => ({ ...prev, lrNumber: nextNo }));
  }, []);

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

  // Consignor selection handler
  const handleSelectConsignor = (partyName) => {
    const party = parties.find((p) => p.partyName === partyName);
    if (party) {
      const fullAddr = [party.address1, party.address2, party.address3, party.city, party.state]
        .filter(Boolean)
        .join(", ");
      setFormData((prev) => ({
        ...prev,
        consignorName: party.partyName,
        consignorAddress: fullAddr,
        consignorGst: party.gstNo || "",
      }));
    } else {
      setFormData((prev) => ({ ...prev, consignorName: partyName }));
    }
  };

  // Consignee selection handler
  const handleSelectConsignee = (partyName) => {
    const party = parties.find((p) => p.partyName === partyName);
    if (party) {
      const fullAddr = [party.address1, party.address2, party.address3, party.city, party.state]
        .filter(Boolean)
        .join(", ");
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

  // Save Record handler
  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!formData.consignorName.trim() || !formData.consigneeName.trim()) {
      alert("Please fill Consignor and Consignee details!");
      return;
    }
    const saved = saveLREntry(formData);
    setActiveLR(saved);
    flashMsg("✓ L/R Record saved successfully into Database!");
    return saved;
  };

  const handleSaveAndPrint = (e) => {
    const saved = handleSave(e);
    if (saved) {
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

  const consignorsList = parties.filter((p) => p.selectType === "CONSIGNOR" || p.selectType === "BOTH");
  const consigneesList = parties.filter((p) => p.selectType === "CONSIGNEE" || p.selectType === "BOTH");

  if (showPrintModal && activeLR) {
    return (
      <LRPrintDocument
        lrData={activeLR}
        onClose={() => setShowPrintModal(false)}
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
              <div className="text-[11px] text-sky-300 font-mono tracking-widest uppercase">
                PAERINA COMPUTESH - RAMCHOWK, WANKANER
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide uppercase font-sans">
                L/R ENTRY - ADD / EDIT / CHANGE / DELETE
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
          <form onSubmit={handleSave} className="p-4 sm:p-6 space-y-5">
            
            {/* Top Row: LR Number, Copy Data, From, To, Delivery At, Truck No, Date */}
            <div className="bg-sky-950/70 p-4 rounded-lg border border-sky-600/50 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">
              
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-yellow-300 uppercase block mb-1">
                  L/R NUMBER
                </label>
                <input
                  type="text"
                  required
                  value={formData.lrNumber}
                  onChange={(e) => setFormData({ ...formData, lrNumber: e.target.value })}
                  className="w-full bg-white text-slate-900 font-mono font-black text-base px-3 py-1.5 border-2 border-amber-400 rounded focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-yellow-300 uppercase block mb-1">
                  Copy Data &lt;Y/N&gt;
                </label>
                <select
                  value={formData.copyData}
                  onChange={(e) => setFormData({ ...formData, copyData: e.target.value })}
                  className="w-full bg-white text-slate-900 font-bold px-2 py-1.5 border border-sky-300 rounded"
                >
                  <option value="N">N</option>
                  <option value="Y">Y</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-yellow-300 uppercase block mb-1">
                  FROM ...
                </label>
                <input
                  type="text"
                  value={formData.fromPlace}
                  onChange={(e) => setFormData({ ...formData, fromPlace: e.target.value.toUpperCase() })}
                  placeholder="MORBI"
                  className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 border border-sky-300 rounded uppercase"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-xs font-bold text-yellow-300 uppercase block mb-1">
                  TO PLACE...
                </label>
                <input
                  type="text"
                  required
                  value={formData.toPlace}
                  onChange={(e) => setFormData({ ...formData, toPlace: e.target.value.toUpperCase() })}
                  placeholder="HYDERABAD"
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
                  required
                  value={formData.truckNo}
                  onChange={(e) => setFormData({ ...formData, truckNo: e.target.value.toUpperCase() })}
                  placeholder="GJ-36-V-8975"
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

                {/* Dropdown Select from Master */}
                <div>
                  <select
                    onChange={(e) => handleSelectConsignor(e.target.value)}
                    value={formData.consignorName}
                    className="w-full bg-white text-slate-900 font-bold px-3 py-2 border border-sky-400 rounded focus:outline-none text-sm cursor-pointer"
                  >
                    <option value="">-- Select Consignor Party --</option>
                    {consignorsList.map((p) => (
                      <option key={p.id} value={p.partyName}>
                        {p.partyName} ({p.city || p.state})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom/Selected Consignor Name */}
                <input
                  type="text"
                  required
                  value={formData.consignorName}
                  onChange={(e) => setFormData({ ...formData, consignorName: e.target.value.toUpperCase() })}
                  placeholder="CONSIGNOR NAME"
                  className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 border border-sky-300 rounded text-sm uppercase"
                />

                {/* Address */}
                <textarea
                  rows="2"
                  value={formData.consignorAddress}
                  onChange={(e) => setFormData({ ...formData, consignorAddress: e.target.value.toUpperCase() })}
                  placeholder="CONSIGNOR ADDRESS..."
                  className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 border border-sky-300 rounded text-xs uppercase"
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

                {/* Dropdown Select from Master */}
                <div>
                  <select
                    onChange={(e) => handleSelectConsignee(e.target.value)}
                    value={formData.consigneeName}
                    className="w-full bg-white text-slate-900 font-bold px-3 py-2 border border-sky-400 rounded focus:outline-none text-sm cursor-pointer"
                  >
                    <option value="">-- Select Consignee Party --</option>
                    {consigneesList.map((p) => (
                      <option key={p.id} value={p.partyName}>
                        {p.partyName} ({p.city || p.state})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Custom/Selected Consignee Name */}
                <input
                  type="text"
                  required
                  value={formData.consigneeName}
                  onChange={(e) => setFormData({ ...formData, consigneeName: e.target.value.toUpperCase() })}
                  placeholder="CONSIGNEE NAME"
                  className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 border border-sky-300 rounded text-sm uppercase"
                />

                {/* Address */}
                <textarea
                  rows="2"
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
                    placeholder="36ACUFS3612G1ZV"
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
                <div className="sm:col-span-2">Weight in KGS</div>
                <div className="sm:col-span-2">Rate Rs. Per Ton</div>
                <div className="sm:col-span-2">To Pay / Paid</div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-2 flex gap-1">
                  <input
                    type="text"
                    value={formData.noOfArticles}
                    onChange={(e) => setFormData({ ...formData, noOfArticles: e.target.value })}
                    placeholder="1267"
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
                    placeholder="CERAMIC TILES+"
                    className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 border rounded text-sm uppercase"
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={formData.weightKgs}
                    onChange={(e) => handleWeightRateChange("weightKgs", e.target.value)}
                    placeholder="35530"
                    className="w-full bg-white text-slate-900 font-mono font-bold px-3 py-1.5 border rounded text-sm"
                  />
                </div>

                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={formData.ratePerTon}
                    onChange={(e) => handleWeightRateChange("ratePerTon", e.target.value)}
                    placeholder="1250"
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
                      placeholder="5521"
                      className="w-full bg-white text-slate-900 font-bold px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-sky-200 block mb-1">Invoice Value Rs.:</label>
                    <input
                      type="text"
                      value={formData.invoiceValue}
                      onChange={(e) => setFormData({ ...formData, invoiceValue: e.target.value })}
                      placeholder="325239"
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
                      placeholder="Ramesh"
                      className="w-full bg-white text-slate-900 font-medium px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-sky-200 block mb-1">License No.:</label>
                    <input
                      type="text"
                      value={formData.licenseNumber}
                      onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                      placeholder="GJ362021004"
                      className="w-full bg-white text-slate-900 font-medium px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-sky-200 block mb-1">Driver Mobile:</label>
                    <input
                      type="text"
                      value={formData.driverMobile}
                      onChange={(e) => setFormData({ ...formData, driverMobile: e.target.value })}
                      placeholder="9879512345"
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
                      placeholder="682018313118"
                      className="w-full bg-white text-slate-900 font-mono font-bold px-2 py-1 border rounded"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-sky-200 block mb-1">Consignee E-Way Bill:</label>
                    <input
                      type="text"
                      value={formData.consigneeEwayBill}
                      onChange={(e) => setFormData({ ...formData, consigneeEwayBill: e.target.value })}
                      placeholder="Optional"
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

      </div>
    </div>
  );
}
