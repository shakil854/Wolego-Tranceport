import React, { useState, useEffect } from "react";
import { fetchPartiesFromDB, saveParty } from "../utils/storage";
import { Search, Plus, Edit, Save, Building2, Eye, X, CheckCircle2 } from "lucide-react";
import SearchableStateSelect, { getStateCode } from "../components/SearchableStateSelect";

export default function PartyMaster() {
  const [parties, setParties] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Modals state
  const [viewPartyModal, setViewPartyModal] = useState(null); // Party object or null
  const [editPartyModal, setEditPartyModal] = useState(null); // Party object or null

  // Initial blank form for New Party (Left Side Form)
  const initialBlankForm = {
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
    secondaryMobile: "", // Secondary Mobile No. (Master Record only, no portal login)
    selectType: "CONSIGNEE", // CONSIGNEE / CONSIGNOR / BOTH
    paymentDays: 30, // Default 30 days payment timeline
  };

  const [addFormData, setAddFormData] = useState(initialBlankForm);
  const [editFormData, setEditFormData] = useState(initialBlankForm);

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = async () => {
    const data = await fetchPartiesFromDB();
    setParties(data || []);
  };

  // State change handler for Add Form
  const handleAddStateChange = (stateName, stateCode) => {
    const code = stateCode !== undefined ? stateCode : getStateCode(stateName);
    setAddFormData((prev) => ({ ...prev, state: stateName, stateCode: code }));
  };

  // State change handler for Edit Form
  const handleEditStateChange = (stateName, stateCode) => {
    const code = stateCode !== undefined ? stateCode : getStateCode(stateName);
    setEditFormData((prev) => ({ ...prev, state: stateName, stateCode: code }));
  };

  // GST handler for Add Form (extracts PAN automatically)
  const handleAddGstChange = (val) => {
    const upperVal = val.toUpperCase();
    let pan = addFormData.panNo;
    if (upperVal.length >= 12) {
      pan = upperVal.substring(2, 12);
    }
    setAddFormData((prev) => ({ ...prev, gstNo: upperVal, panNo: pan }));
  };

  // GST handler for Edit Form
  const handleEditGstChange = (val) => {
    const upperVal = val.toUpperCase();
    let pan = editFormData.panNo;
    if (upperVal.length >= 12) {
      pan = upperVal.substring(2, 12);
    }
    setEditFormData((prev) => ({ ...prev, gstNo: upperVal, panNo: pan }));
  };

  // Submit Handler: Add New Party (Left Side Form)
  const handleSaveNewParty = async (e) => {
    if (e) e.preventDefault();
    if (!addFormData.partyName.trim()) {
      alert("Party Name is required!");
      return;
    }
    const updated = await saveParty(addFormData);
    setParties(updated || []);
    setAddFormData(initialBlankForm); // Reset form to fresh clean state
    showStatus(`New party "${addFormData.partyName}" added successfully to Database!`);
  };

  // Open Edit Modal
  const handleOpenEditModal = (party) => {
    setEditPartyModal(party);
    setEditFormData({ ...party });
  };

  // Submit Handler: Update Party (Inside Edit Modal)
  const handleUpdateParty = async (e) => {
    if (e) e.preventDefault();
    if (!editFormData.partyName.trim()) {
      alert("Party Name is required!");
      return;
    }
    const updated = await saveParty(editFormData);
    setParties(updated || []);
    setEditPartyModal(null);
    showStatus(`Party "${editFormData.partyName}" updated successfully in Database!`);
  };

  const showStatus = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 4000);
  };

  // Handle Key navigation (Enter, Up, Down, Left, Right Arrow) across form fields
  const handleFormKeyDown = (e) => {
    if (e.target.tagName === "BUTTON" || e.target.type === "submit") {
      return;
    }

    const keys = ["Enter", "ArrowDown", "ArrowUp", "ArrowRight", "ArrowLeft"];
    if (!keys.includes(e.key)) return;

    const form = e.currentTarget;
    const focusable = Array.from(
      form.querySelectorAll(
        "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])"
      )
    ).filter(
      (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
    );

    const index = focusable.indexOf(e.target);
    if (index === -1) return;

    const target = e.target;
    let moveForward = false;
    let moveBackward = false;

    if (e.key === "Enter") {
      moveForward = true;
    } else if (e.key === "ArrowDown") {
      if (target.tagName !== "SELECT") {
        moveForward = true;
      }
    } else if (e.key === "ArrowUp") {
      if (target.tagName !== "SELECT") {
        moveBackward = true;
      }
    } else if (e.key === "ArrowRight") {
      if (
        target.selectionStart === undefined ||
        target.selectionStart === null ||
        target.selectionStart === target.value?.length
      ) {
        moveForward = true;
      }
    } else if (e.key === "ArrowLeft") {
      if (
        target.selectionEnd === undefined ||
        target.selectionEnd === null ||
        target.selectionEnd === 0
      ) {
        moveBackward = true;
      }
    }

    if (moveForward && index < focusable.length - 1) {
      e.preventDefault();
      const nextEl = focusable[index + 1];
      nextEl.focus();
      if (typeof nextEl.select === "function" && nextEl.tagName === "INPUT") {
        nextEl.select();
      }
    } else if (moveBackward && index > 0) {
      e.preventDefault();
      const prevEl = focusable[index - 1];
      prevEl.focus();
      if (typeof prevEl.select === "function" && prevEl.tagName === "INPUT") {
        prevEl.select();
      }
    }
  };

  const filteredParties = parties.filter(
    (p) =>
      p.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.gstNo && p.gstNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.mobileNos && p.mobileNos.includes(searchQuery))
  );

  return (
    <div className="min-h-[calc(100vh-68px)] lg:h-[calc(100vh-68px)] overflow-y-auto lg:overflow-hidden bg-slate-900 p-2 sm:p-3 text-slate-100 font-sans flex flex-col pb-8 lg:pb-2">
      <div className="max-w-[1440px] w-full mx-auto flex-1 flex flex-col min-h-0 space-y-2">

        {/* Status Notification Alert */}
        {statusMessage && (
          <div className="bg-emerald-500 text-slate-950 px-3 py-1 rounded text-xs font-bold text-center flex items-center justify-center gap-2 shadow animate-pulse shrink-0">
            <CheckCircle2 size={15} /> {statusMessage}
          </div>
        )}

        {/* 50-50 Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 flex-1 min-h-0">
          
          {/* LEFT COLUMN: Clean Add New Party Form */}
          <div className="bg-sky-900/90 border-2 border-yellow-400 rounded-lg shadow-xl overflow-visible lg:overflow-hidden backdrop-blur-sm flex flex-col justify-between">
            
            {/* Form Title Header */}
            <div className="bg-sky-950 px-3 py-1.5 border-b border-yellow-400 flex justify-between items-center shrink-0">
              <h2 className="text-xs sm:text-sm font-black text-blue-100 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-yellow-400" /> Add New Party
              </h2>
              <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 font-black rounded text-[10px] uppercase">
                New Entry
              </span>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSaveNewParty} onKeyDown={handleFormKeyDown} className="p-2.5 space-y-2 lg:space-y-1 flex-1 flex flex-col lg:justify-between overflow-visible lg:overflow-hidden">
              
              {/* Party Name */}
              <div>
                <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                  Party Name *
                </label>
                <input
                  type="text"
                  required
                  value={addFormData.partyName}
                  onChange={(e) => setAddFormData({ ...addFormData, partyName: e.target.value.toUpperCase() })}
                  placeholder="ENTER PARTY NAME"
                  className="w-full bg-white text-slate-900 font-bold px-2 py-0.5 text-xs border border-sky-400 rounded focus:outline-none"
                />
              </div>

              {/* Address Lines */}
              <div>
                <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                  Address Line 1, Line 2 & Line 3
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    value={addFormData.address1}
                    onChange={(e) => setAddFormData({ ...addFormData, address1: e.target.value.toUpperCase() })}
                    placeholder="ADDRESS LINE 1"
                    className="w-full bg-white text-slate-900 font-medium px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                  />
                  <input
                    type="text"
                    value={addFormData.address2}
                    onChange={(e) => setAddFormData({ ...addFormData, address2: e.target.value.toUpperCase() })}
                    placeholder="AREA / LANDMARK"
                    className="w-full bg-white text-slate-900 font-medium px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                  />
                  <input
                    type="text"
                    value={addFormData.address3}
                    onChange={(e) => setAddFormData({ ...addFormData, address3: e.target.value.toUpperCase() })}
                    placeholder="ADDRESS LINE 3"
                    className="w-full bg-white text-slate-900 font-medium px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                  />
                </div>
              </div>

              {/* City, District, State & Code */}
              <div className="grid grid-cols-12 gap-1.5">
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={addFormData.city}
                    onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value.toUpperCase() })}
                    placeholder="CITY"
                    className="w-full bg-white text-slate-900 font-medium px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                  />
                </div>
                <div className="col-span-6 sm:col-span-3">
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    District
                  </label>
                  <input
                    type="text"
                    value={addFormData.district}
                    onChange={(e) => setAddFormData({ ...addFormData, district: e.target.value.toUpperCase() })}
                    placeholder="DISTRICT"
                    className="w-full bg-white text-slate-900 font-medium px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                  />
                </div>
                <div className="col-span-8 sm:col-span-4">
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    State
                  </label>
                  <SearchableStateSelect
                    value={addFormData.state}
                    onChange={(stateName, code) => handleAddStateChange(stateName, code)}
                    placeholder="STATE"
                    className="w-full bg-white text-slate-900 font-bold px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                  />
                </div>
                <div className="col-span-4 sm:col-span-2">
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    Code
                  </label>
                  <input
                    type="text"
                    value={addFormData.stateCode}
                    onChange={(e) => setAddFormData({ ...addFormData, stateCode: e.target.value })}
                    placeholder="CODE"
                    className="w-full bg-white text-slate-900 font-bold text-center px-1 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                  />
                </div>
              </div>

              {/* GST No. & PAN No. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    GST No.
                  </label>
                  <input
                    type="text"
                    value={addFormData.gstNo}
                    onChange={(e) => handleAddGstChange(e.target.value)}
                    placeholder="24ACCFB3501E1Z8"
                    className="w-full bg-white text-slate-900 font-mono font-bold px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    PAN No.
                  </label>
                  <input
                    type="text"
                    value={addFormData.panNo}
                    onChange={(e) => setAddFormData({ ...addFormData, panNo: e.target.value.toUpperCase() })}
                    placeholder="ACCFB3501E"
                    className="w-full bg-white text-slate-900 font-mono font-bold px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Contact Name, Primary Mobile & Secondary Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                <div>
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={addFormData.contactName}
                    onChange={(e) => setAddFormData({ ...addFormData, contactName: e.target.value })}
                    placeholder="NAME"
                    className="w-full bg-white text-slate-900 font-medium px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    Primary Mobile (Portal Login)
                  </label>
                  <input
                    type="text"
                    value={addFormData.mobileNos}
                    onChange={(e) => setAddFormData({ ...addFormData, mobileNos: e.target.value })}
                    placeholder="LOGIN MOBILE NO."
                    className="w-full bg-white text-slate-900 font-bold px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    Secondary Mobile (Master Only)
                  </label>
                  <input
                    type="text"
                    value={addFormData.secondaryMobile}
                    onChange={(e) => setAddFormData({ ...addFormData, secondaryMobile: e.target.value })}
                    placeholder="2ND MOBILE (NO LOGIN)"
                    className="w-full bg-white text-slate-900 font-bold px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none"
                  />
                </div>
              </div>

              {/* Select Type & Payment Timeline Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <div>
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    Party Category
                  </label>
                  <select
                    value={addFormData.selectType}
                    onChange={(e) => setAddFormData({ ...addFormData, selectType: e.target.value })}
                    className="w-full bg-yellow-300 text-slate-950 font-extrabold px-2 py-1 text-xs border-2 border-yellow-500 rounded focus:outline-none uppercase cursor-pointer"
                  >
                    <option value="CONSIGNEE">CONSIGNEE (माल प्राप्तकर्ता)</option>
                    <option value="CONSIGNOR">CONSIGNOR (माल भेजने वाला)</option>
                    <option value="BOTH">BOTH (दोनों)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    Payment Timeline (Days)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={addFormData.paymentDays !== undefined ? addFormData.paymentDays : 30}
                    onChange={(e) => setAddFormData({ ...addFormData, paymentDays: Number(e.target.value) || 0 })}
                    placeholder="e.g. 30"
                    className="w-full bg-white text-slate-900 font-extrabold px-2 py-1 text-xs border-2 border-yellow-400 rounded focus:outline-none"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="pt-1.5 border-t border-sky-700 flex justify-end shrink-0">
                <button
                  type="submit"
                  className="px-4 py-1 bg-yellow-400 text-slate-950 font-black rounded hover:bg-yellow-300 text-xs uppercase shadow flex items-center gap-1 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  <Save size={14} /> Save New Party
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT COLUMN: Directory List */}
          <div className="bg-slate-800 rounded-lg p-2.5 border border-slate-700 shadow-xl flex flex-col min-h-[400px] lg:min-h-0 overflow-visible lg:overflow-hidden">
            
            {/* Header & Search Bar */}
            <div className="flex justify-between items-center gap-2 border-b border-slate-700 pb-1.5 shrink-0">
              <h2 className="text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <Building2 className="w-4 h-4" /> Saved Parties Directory ({filteredParties.length})
              </h2>
              
              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Party / GST..."
                  className="w-full pl-8 pr-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Scrollable Table Container */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded border border-slate-700 mt-1.5">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 uppercase text-amber-400 font-extrabold sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Party Name</th>
                    <th className="p-2.5">City</th>
                    <th className="p-2.5">GST No</th>
                    <th className="p-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 font-medium">
                  {filteredParties.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-slate-700/60 transition-colors">
                      
                      {/* Category Badge */}
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.selectType === "CONSIGNEE" || p.selectType === "CONSIGNE"
                              ? "bg-purple-900 text-purple-200 border border-purple-700"
                              : p.selectType === "CONSIGNOR"
                              ? "bg-emerald-900 text-emerald-200 border border-emerald-700"
                              : "bg-amber-900 text-amber-200 border border-amber-700"
                          }`}
                        >
                          {p.selectType}
                        </span>
                      </td>

                      {/* Party Name & Mobiles */}
                      <td className="p-2.5 max-w-[160px]">
                        <div className="font-bold text-white truncate">{p.partyName}</div>
                        {p.mobileNos && (
                          <div className="text-[10px] text-amber-400 font-mono">📱 {p.mobileNos}</div>
                        )}
                        {p.secondaryMobile && (
                          <div className="text-[9.5px] text-slate-400 font-mono">📞 2nd: {p.secondaryMobile}</div>
                        )}
                      </td>

                      {/* City */}
                      <td className="p-2.5 text-slate-300">
                        {p.city || p.district || "N.A."}
                      </td>

                      {/* GST No */}
                      <td className="p-2.5 font-mono text-amber-300 font-semibold">
                        {p.gstNo || "-"}
                      </td>

                      {/* Actions: View (Eye), Edit (Modal) */}
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          
                          {/* View Button (Eye Icon) */}
                          <button
                            type="button"
                            onClick={() => setViewPartyModal(p)}
                            title="View Party Details"
                            className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-amber-400 font-bold rounded transition-all shadow border border-slate-600 flex items-center gap-1"
                          >
                            <Eye size={14} /> View
                          </button>

                          {/* Edit Button (Opens Edit Modal) */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit Party Details"
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition-all shadow flex items-center gap-1"
                          >
                            <Edit size={14} /> Edit
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredParties.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-slate-500 font-bold">
                        No parties found matching "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

      {/* VIEW PARTY MODAL */}
      {viewPartyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-800 px-5 py-3 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-lg font-black text-amber-400 flex items-center gap-2">
                <Eye className="w-5 h-5" /> Party Details Preview
              </h3>
              <button
                onClick={() => setViewPartyModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-sm text-slate-200">
              <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block">
                      Party Name
                    </span>
                    <h4 className="text-lg font-extrabold text-white">{viewPartyModal.partyName}</h4>
                  </div>
                  <span className="px-2.5 py-0.5 bg-amber-400 text-slate-950 font-black rounded text-xs">
                    {viewPartyModal.selectType || "CONSIGNEE"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">GST No</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">
                    {viewPartyModal.gstNo || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">PAN No</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {viewPartyModal.panNo || "N/A"}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-400 uppercase block">Address</span>
                <p className="font-medium text-slate-100 bg-slate-950 p-3 rounded border border-slate-800">
                  {[viewPartyModal.address1, viewPartyModal.address2, viewPartyModal.address3]
                    .filter(Boolean)
                    .join(", ") || "No address specified"}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">City / State</span>
                  <span className="font-bold text-white">
                    {[
                      viewPartyModal.city,
                      viewPartyModal.stateCode ? `(${viewPartyModal.stateCode})` : "",
                      viewPartyModal.state
                    ].filter(Boolean).join(" ") || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">Contact & Mobile</span>
                  <span className="font-bold text-white block">{viewPartyModal.contactName || "N/A"}</span>
                  <div className="font-mono text-amber-400 text-xs font-bold">Primary (Login): {viewPartyModal.mobileNos || "N/A"}</div>
                  {viewPartyModal.secondaryMobile && (
                    <div className="font-mono text-slate-300 text-xs">2nd (Master): {viewPartyModal.secondaryMobile}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-800 px-5 py-3 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setViewPartyModal(null)}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT PARTY MODAL */}
      {editPartyModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-sky-900 border-4 border-yellow-400 rounded-xl shadow-2xl w-full max-w-xl overflow-hidden my-8">
            
            {/* Modal Header */}
            <div className="bg-sky-950 px-5 py-3 border-b-2 border-yellow-400 flex justify-between items-center">
              <h3 className="text-lg font-black text-blue-100 uppercase tracking-wider flex items-center gap-2">
                <Edit className="w-5 h-5 text-yellow-400" /> Edit Party Details
              </h3>
              <button
                onClick={() => setEditPartyModal(null)}
                className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-sky-800"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateParty} onKeyDown={handleFormKeyDown} className="p-5 space-y-3">
              
              {/* Party Name */}
              <div>
                <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                  Party Name *
                </label>
                <input
                  type="text"
                  required
                  value={editFormData.partyName}
                  onChange={(e) => setEditFormData({ ...editFormData, partyName: e.target.value.toUpperCase() })}
                  className="w-full bg-white text-slate-900 font-bold px-3 py-2 text-sm border-2 border-sky-400 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* Address Lines */}
              <div>
                <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Address 1</label>
                <input
                  type="text"
                  value={editFormData.address1}
                  onChange={(e) => setEditFormData({ ...editFormData, address1: e.target.value.toUpperCase() })}
                  className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Address 2</label>
                  <input
                    type="text"
                    value={editFormData.address2}
                    onChange={(e) => setEditFormData({ ...editFormData, address2: e.target.value.toUpperCase() })}
                    className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Address 3</label>
                  <input
                    type="text"
                    value={editFormData.address3}
                    onChange={(e) => setEditFormData({ ...editFormData, address3: e.target.value.toUpperCase() })}
                    className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
              </div>

              {/* City & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">City</label>
                  <input
                    type="text"
                    value={editFormData.city}
                    onChange={(e) => setEditFormData({ ...editFormData, city: e.target.value.toUpperCase() })}
                    className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">District</label>
                  <input
                    type="text"
                    value={editFormData.district}
                    onChange={(e) => setEditFormData({ ...editFormData, district: e.target.value.toUpperCase() })}
                    className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
              </div>

              {/* State & Code */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">State</label>
                  <SearchableStateSelect
                    value={editFormData.state}
                    onChange={(stateName, code) => handleEditStateChange(stateName, code)}
                    placeholder="STATE"
                    className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 text-xs border border-sky-300 rounded focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Code</label>
                  <input
                    type="text"
                    value={editFormData.stateCode}
                    onChange={(e) => setEditFormData({ ...editFormData, stateCode: e.target.value })}
                    placeholder="CODE"
                    className="w-full bg-white text-slate-900 font-bold text-center px-2 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
              </div>

              {/* GST & PAN */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">GST No.</label>
                  <input
                    type="text"
                    value={editFormData.gstNo}
                    onChange={(e) => handleEditGstChange(e.target.value)}
                    className="w-full bg-white text-slate-900 font-mono font-bold px-3 py-1.5 text-xs border border-sky-300 rounded uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">PAN No.</label>
                  <input
                    type="text"
                    value={editFormData.panNo}
                    onChange={(e) => setEditFormData({ ...editFormData, panNo: e.target.value.toUpperCase() })}
                    className="w-full bg-white text-slate-900 font-mono font-bold px-3 py-1.5 text-xs border border-sky-300 rounded uppercase"
                  />
                </div>
              </div>

              {/* Contact, Primary Mobile & Secondary Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={editFormData.contactName}
                    onChange={(e) => setEditFormData({ ...editFormData, contactName: e.target.value })}
                    className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Primary Mobile (Login)</label>
                  <input
                    type="text"
                    value={editFormData.mobileNos}
                    onChange={(e) => setEditFormData({ ...editFormData, mobileNos: e.target.value })}
                    className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Secondary Mobile (Master Only)</label>
                  <input
                    type="text"
                    value={editFormData.secondaryMobile || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, secondaryMobile: e.target.value })}
                    placeholder="2ND MOBILE"
                    className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
              </div>

              {/* Select Type & Payment Timeline Days */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Party Category</label>
                  <select
                    value={editFormData.selectType}
                    onChange={(e) => setEditFormData({ ...editFormData, selectType: e.target.value })}
                    className="w-full bg-yellow-300 text-slate-950 font-extrabold px-3 py-2 text-xs border-2 border-yellow-500 rounded uppercase cursor-pointer"
                  >
                    <option value="CONSIGNEE">CONSIGNEE (माल प्राप्तकर्ता)</option>
                    <option value="CONSIGNOR">CONSIGNOR (माल भेजने वाला)</option>
                    <option value="BOTH">BOTH (दोनों)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Payment Timeline (Days)</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.paymentDays !== undefined ? editFormData.paymentDays : 30}
                    onChange={(e) => setEditFormData({ ...editFormData, paymentDays: Number(e.target.value) || 0 })}
                    placeholder="30"
                    className="w-full bg-white text-slate-900 font-extrabold px-3 py-2 text-xs border-2 border-yellow-400 rounded focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-4 border-t border-sky-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditPartyModal(null)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 font-bold rounded hover:bg-slate-600 text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-yellow-400 text-slate-950 font-black rounded hover:bg-yellow-300 text-xs uppercase shadow-lg flex items-center gap-1.5"
                >
                  <Save size={16} /> Update Party Record
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
