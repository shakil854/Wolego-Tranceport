import React, { useState, useEffect } from "react";
import { getParties, saveParty } from "../utils/storage";
import { Search, Plus, Edit, Save, Building2, Eye, X, CheckCircle2 } from "lucide-react";

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
    state: "GUJARAT",
    stateCode: "24",
    gstNo: "",
    panNo: "",
    contactName: "",
    mobileNos: "",
    selectType: "CONSIGNEE", // CONSIGNEE / CONSIGNOR / BOTH
  };

  const [addFormData, setAddFormData] = useState(initialBlankForm);
  const [editFormData, setEditFormData] = useState(initialBlankForm);

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = () => {
    const data = getParties();
    setParties(data || []);
  };

  // State code mapping helper
  const getStateCode = (stateName) => {
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
    return stateMap[stateName.toUpperCase()] || "24";
  };

  // State change handler for Add Form
  const handleAddStateChange = (stateName) => {
    const code = getStateCode(stateName);
    setAddFormData((prev) => ({ ...prev, state: stateName, stateCode: code }));
  };

  // State change handler for Edit Form
  const handleEditStateChange = (stateName) => {
    const code = getStateCode(stateName);
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
  const handleSaveNewParty = (e) => {
    if (e) e.preventDefault();
    if (!addFormData.partyName.trim()) {
      alert("Party Name is required!");
      return;
    }
    const updated = saveParty(addFormData);
    setParties(updated);
    setAddFormData(initialBlankForm); // Reset form to fresh clean state
    showStatus(`New party "${addFormData.partyName}" added successfully!`);
  };

  // Open Edit Modal
  const handleOpenEditModal = (party) => {
    setEditPartyModal(party);
    setEditFormData({ ...party });
  };

  // Submit Handler: Update Party (Inside Edit Modal)
  const handleUpdateParty = (e) => {
    if (e) e.preventDefault();
    if (!editFormData.partyName.trim()) {
      alert("Party Name is required!");
      return;
    }
    const updated = saveParty(editFormData);
    setParties(updated);
    setEditPartyModal(null);
    showStatus(`Party "${editFormData.partyName}" updated successfully!`);
  };

  const showStatus = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 4000);
  };

  const filteredParties = parties.filter(
    (p) =>
      p.partyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.gstNo && p.gstNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.mobileNos && p.mobileNos.includes(searchQuery))
  );

  return (
    <div className="min-h-screen bg-slate-900 py-6 px-3 sm:px-6 lg:px-8 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        
        {/* Top Header Bar */}
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg flex justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-amber-400 flex items-center gap-2">
              <Building2 className="w-6 h-6" /> Party Master Directory & Management
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Left: Add New Party (Always Fresh Form) | Right: Directory with View, Edit Modal & Delete Actions
            </p>
          </div>
          <div className="text-xs text-slate-400 font-bold hidden sm:block">
            Total Parties: <span className="text-amber-400 font-mono text-sm">{parties.length}</span>
          </div>
        </div>

        {/* Status Notification Alert */}
        {statusMessage && (
          <div className="bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-lg text-sm font-bold text-center flex items-center justify-center gap-2 shadow-lg animate-pulse">
            <CheckCircle2 size={18} /> {statusMessage}
          </div>
        )}

        {/* 50-50 Split Layout: Left Always Clean Add Form | Right List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          
          {/* LEFT COLUMN (50% Width): Always Fresh Add New Party Form */}
          <div className="bg-sky-900/90 border-4 border-yellow-400 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
            
            {/* Form Title Header */}
            <div className="bg-sky-950 px-5 py-3 border-b-2 border-yellow-400 flex justify-between items-center">
              <h2 className="text-base md:text-lg font-black text-blue-100 uppercase tracking-wider flex items-center gap-2">
                <Plus className="w-5 h-5 text-yellow-400" /> Add New Party
              </h2>
              <span className="px-2.5 py-0.5 bg-yellow-400 text-slate-950 font-black rounded text-[11px] uppercase">
                Clean Entry Form
              </span>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSaveNewParty} className="p-4 sm:p-5 space-y-3">
              
              {/* Party Name */}
              <div>
                <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                  Party Name *
                </label>
                <input
                  type="text"
                  required
                  value={addFormData.partyName}
                  onChange={(e) => setAddFormData({ ...addFormData, partyName: e.target.value.toUpperCase() })}
                  placeholder="ENTER PARTY NAME (E.G. ALIEN PORCELANO LLP)"
                  className="w-full bg-white text-slate-900 font-bold px-3 py-2 text-sm border-2 border-sky-400 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* Address Line 1 */}
              <div>
                <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                  Address 1
                </label>
                <input
                  type="text"
                  value={addFormData.address1}
                  onChange={(e) => setAddFormData({ ...addFormData, address1: e.target.value.toUpperCase() })}
                  placeholder="H.NO. / STREET ADDRESS"
                  className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
              </div>

              {/* Address Line 2 & Line 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                    Address 2
                  </label>
                  <input
                    type="text"
                    value={addFormData.address2}
                    onChange={(e) => setAddFormData({ ...addFormData, address2: e.target.value.toUpperCase() })}
                    placeholder="AREA / LANDMARK"
                    className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                    Address 3
                  </label>
                  <input
                    type="text"
                    value={addFormData.address3}
                    onChange={(e) => setAddFormData({ ...addFormData, address3: e.target.value.toUpperCase() })}
                    placeholder="CITY - PINCODE (STATE)"
                    className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* City & District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={addFormData.city}
                    onChange={(e) => setAddFormData({ ...addFormData, city: e.target.value.toUpperCase() })}
                    placeholder="City (e.g. MORBI)"
                    className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    value={addFormData.district}
                    onChange={(e) => setAddFormData({ ...addFormData, district: e.target.value.toUpperCase() })}
                    placeholder="District (e.g. MORBI)"
                    className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* State & State Code */}
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={addFormData.state}
                    onChange={(e) => handleAddStateChange(e.target.value.toUpperCase())}
                    placeholder="State (e.g. GUJARAT)"
                    className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    value={addFormData.stateCode}
                    onChange={(e) => setAddFormData({ ...addFormData, stateCode: e.target.value })}
                    placeholder="24"
                    className="w-full bg-white text-slate-900 font-bold text-center px-2 py-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* GST No. & PAN No. */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                    GST No.
                  </label>
                  <input
                    type="text"
                    value={addFormData.gstNo}
                    onChange={(e) => handleAddGstChange(e.target.value)}
                    placeholder="24ACCFB3501E1Z8"
                    className="w-full bg-white text-slate-900 font-mono font-bold px-3 py-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                    PAN No.
                  </label>
                  <input
                    type="text"
                    value={addFormData.panNo}
                    onChange={(e) => setAddFormData({ ...addFormData, panNo: e.target.value.toUpperCase() })}
                    placeholder="ACCFB3501E"
                    className="w-full bg-white text-slate-900 font-mono font-bold px-3 py-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase"
                  />
                </div>
              </div>

              {/* Contact Name & Mobile Nos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={addFormData.contactName}
                    onChange={(e) => setAddFormData({ ...addFormData, contactName: e.target.value })}
                    placeholder="Contact Person Name"
                    className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                    Mobile Numbers
                  </label>
                  <input
                    type="text"
                    value={addFormData.mobileNos}
                    onChange={(e) => setAddFormData({ ...addFormData, mobileNos: e.target.value })}
                    placeholder="09979111555"
                    className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 text-xs border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
              </div>

              {/* Select Type (CONSIGNEE / CONSIGNOR / BOTH) */}
              <div>
                <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                  Party Category
                </label>
                <select
                  value={addFormData.selectType}
                  onChange={(e) => setAddFormData({ ...addFormData, selectType: e.target.value })}
                  className="w-full bg-yellow-300 text-slate-950 font-extrabold px-3 py-2 text-xs border-2 border-yellow-500 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 uppercase cursor-pointer"
                >
                  <option value="CONSIGNEE">CONSIGNEE (माल प्राप्तकर्ता)</option>
                  <option value="CONSIGNOR">CONSIGNOR (माल भेजने वाला)</option>
                  <option value="BOTH">BOTH (दोनों)</option>
                </select>
              </div>

              {/* Save Button */}
              <div className="pt-4 border-t border-sky-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddFormData(initialBlankForm)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 font-bold rounded hover:bg-slate-600 text-xs uppercase transition-colors"
                >
                  Clear Form
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-yellow-400 text-slate-950 font-black rounded hover:bg-yellow-300 text-xs uppercase shadow-lg flex items-center gap-1.5 transition-all transform hover:scale-105"
                >
                  <Save size={16} /> Save New Party
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT COLUMN (50% Width): Party Master List Table */}
          <div className="bg-slate-800 rounded-xl p-4 sm:p-5 border border-slate-700 shadow-xl space-y-3">
            
            {/* Header & Search Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-700 pb-3">
              <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Saved Parties Directory ({filteredParties.length})
              </h2>
              
              <div className="relative w-full sm:w-60">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Party / GST / Mobile..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-600 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Scrollable Table Container */}
            <div className="overflow-x-auto max-h-[580px] overflow-y-auto rounded-lg border border-slate-700">
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

                      {/* Party Name */}
                      <td className="p-2.5 font-bold text-white max-w-[140px] truncate">
                        {p.partyName}
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
                    {viewPartyModal.city || "N/A"} ({viewPartyModal.stateCode || "24"}) - {viewPartyModal.state}
                  </span>
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase block">Contact & Mobile</span>
                  <span className="font-bold text-white block">{viewPartyModal.contactName || "N/A"}</span>
                  <span className="font-mono text-amber-400 text-xs">{viewPartyModal.mobileNos || "N/A"}</span>
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
            <form onSubmit={handleUpdateParty} className="p-5 space-y-3">
              
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
                  <input
                    type="text"
                    value={editFormData.state}
                    onChange={(e) => handleEditStateChange(e.target.value.toUpperCase())}
                    className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Code</label>
                  <input
                    type="text"
                    value={editFormData.stateCode}
                    onChange={(e) => setEditFormData({ ...editFormData, stateCode: e.target.value })}
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

              {/* Contact & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Mobile Numbers</label>
                  <input
                    type="text"
                    value={editFormData.mobileNos}
                    onChange={(e) => setEditFormData({ ...editFormData, mobileNos: e.target.value })}
                    className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
              </div>

              {/* Select Type */}
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
