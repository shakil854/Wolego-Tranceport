import React, { useState, useEffect } from "react";
import { getParties, saveParty, deleteParty } from "../utils/storage";
import { Search, Plus, Edit, Trash2, Save, Building2 } from "lucide-react";

export default function PartyMaster() {
  const [parties, setParties] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const initialForm = {
    id: "",
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

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    loadParties();
  }, []);

  const loadParties = () => {
    const data = getParties();
    setParties(data);
    if (data.length > 0) {
      setFormData(data[0]);
      setCurrentIndex(0);
    }
  };

  // State code auto handler (GST first 2 digits standard mapping)
  const handleStateChange = (stateName) => {
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
      "ANDHRA PRADESH": "37"
    };
    const code = stateMap[stateName.toUpperCase()] || "24";
    setFormData((prev) => ({ ...prev, state: stateName, stateCode: code }));
  };

  // PAN auto-extract from GST (digits 3 to 12)
  const handleGstChange = (val) => {
    const upperVal = val.toUpperCase();
    let pan = formData.panNo;
    if (upperVal.length >= 12) {
      pan = upperVal.substring(2, 12);
    }
    setFormData((prev) => ({ ...prev, gstNo: upperVal, panNo: pan }));
  };

  // Navigation handlers
  const handleTop = () => {
    if (parties.length === 0) return;
    setCurrentIndex(0);
    setFormData(parties[0]);
    setIsEditing(false);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      const idx = currentIndex - 1;
      setCurrentIndex(idx);
      setFormData(parties[idx]);
      setIsEditing(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < parties.length - 1) {
      const idx = currentIndex + 1;
      setCurrentIndex(idx);
      setFormData(parties[idx]);
      setIsEditing(false);
    }
  };

  const handleEnd = () => {
    if (parties.length > 0) {
      const idx = parties.length - 1;
      setCurrentIndex(idx);
      setFormData(parties[idx]);
      setIsEditing(false);
    }
  };

  const handleAdd = () => {
    setFormData(initialForm);
    setIsEditing(true);
    showStatus("New Party entry started. Enter details and click Save.");
  };

  const handleEdit = () => {
    setIsEditing(true);
    showStatus("Editing current party.");
  };

  const handleDelete = () => {
    if (!formData.id) return;
    if (window.confirm(`Are you sure you want to delete "${formData.partyName}"?`)) {
      const updated = deleteParty(formData.id);
      setParties(updated);
      showStatus("Party deleted successfully.");
      if (updated.length > 0) {
        setCurrentIndex(0);
        setFormData(updated[0]);
      } else {
        setFormData(initialForm);
      }
      setIsEditing(false);
    }
  };

  const handleSave = (e) => {
    if (e) e.preventDefault();
    if (!formData.partyName.trim()) {
      alert("Party Name is required!");
      return;
    }
    const updatedParties = saveParty(formData);
    setParties(updatedParties);
    setIsEditing(false);
    showStatus("Party saved successfully into Master!");
    
    // Find index of saved party
    const newIdx = updatedParties.findIndex((p) => p.partyName.toLowerCase() === formData.partyName.toLowerCase());
    if (newIdx !== -1) {
      setCurrentIndex(newIdx);
      setFormData(updatedParties[newIdx]);
    }
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
    <div className="min-h-screen bg-slate-900 py-6 px-4 sm:px-6 lg:px-8 text-slate-100">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Main Classic Software Card Frame (Styled like Photo 1) */}
        <div className="bg-sky-900/90 border-4 border-yellow-400 rounded-xl shadow-2xl overflow-hidden backdrop-blur-sm">
          
          {/* Title Header */}
          <div className="bg-sky-950 px-6 py-4 border-b-2 border-yellow-400 flex flex-col md:flex-row justify-between items-center text-center md:text-left gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-blue-100 tracking-wider uppercase font-sans drop-shadow-md">
                PARTY MASTER UPDATION
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 bg-yellow-400 text-slate-950 font-bold rounded text-xs">
                {formData.selectType || "CONSIGNEE"}
              </span>
              <span className="text-xs font-mono text-blue-200">
                Record {parties.length > 0 ? currentIndex + 1 : 0} of {parties.length}
              </span>
            </div>
          </div>

          {/* Alert Message */}
          {statusMessage && (
            <div className="bg-emerald-500 text-slate-950 px-4 py-2 text-sm font-bold text-center animate-pulse">
              ✓ {statusMessage}
            </div>
          )}

          {/* Form Content Body */}
          <form onSubmit={handleSave} className="p-6 space-y-4">
            
            {/* Party Name */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-sm font-bold text-yellow-300 md:text-right uppercase">
                Partyname:
              </label>
              <div className="md:col-span-3">
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={formData.partyName}
                  onChange={(e) => setFormData({ ...formData, partyName: e.target.value.toUpperCase() })}
                  placeholder="ENTER PARTY NAME (E.G. DREAM TILES WORLD)"
                  className="w-full bg-white text-slate-900 font-bold px-3 py-2 border-2 border-sky-400 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-200 disabled:text-slate-800"
                />
              </div>
            </div>

            {/* Address Line 1 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-sm font-bold text-yellow-300 md:text-right uppercase">
                Address1:
              </label>
              <div className="md:col-span-3">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.address1}
                  onChange={(e) => setFormData({ ...formData, address1: e.target.value.toUpperCase() })}
                  placeholder="H.NO. / STREET ADDRESS"
                  className="w-full bg-white text-slate-900 font-medium px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-200"
                />
              </div>
            </div>

            {/* Address Line 2 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-sm font-bold text-yellow-300 md:text-right uppercase">
                Address2:
              </label>
              <div className="md:col-span-3">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.address2}
                  onChange={(e) => setFormData({ ...formData, address2: e.target.value.toUpperCase() })}
                  placeholder="AREA / LANDMARK"
                  className="w-full bg-white text-slate-900 font-medium px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-200"
                />
              </div>
            </div>

            {/* Address Line 3 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-sm font-bold text-yellow-300 md:text-right uppercase">
                Address3:
              </label>
              <div className="md:col-span-3">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.address3}
                  onChange={(e) => setFormData({ ...formData, address3: e.target.value.toUpperCase() })}
                  placeholder="CITY - PINCODE (STATE)"
                  className="w-full bg-white text-slate-900 font-medium px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-200"
                />
              </div>
            </div>

            {/* City & District */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-sm font-bold text-yellow-300 md:text-right uppercase">
                City / Dist:
              </label>
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value.toUpperCase() })}
                  placeholder="City (e.g. HYDERABAD)"
                  className="w-full bg-white text-slate-900 font-medium px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-200"
                />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value.toUpperCase() })}
                  placeholder="District (e.g. HYDERABAD)"
                  className="w-full bg-white text-slate-900 font-medium px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-200"
                />
              </div>
            </div>

            {/* State & Code */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-sm font-bold text-yellow-300 md:text-right uppercase">
                State & Code:
              </label>
              <div className="md:col-span-3 flex gap-3">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.state}
                  onChange={(e) => handleStateChange(e.target.value.toUpperCase())}
                  placeholder="State (e.g. TELANGANA)"
                  className="flex-1 bg-white text-slate-900 font-bold px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-200"
                />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.stateCode}
                  onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                  placeholder="Code"
                  className="w-20 bg-white text-slate-900 font-bold text-center px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-200"
                />
              </div>
            </div>

            {/* GST No. & PAN No. */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-sm font-bold text-yellow-300 md:text-right uppercase">
                GST No. / PAN:
              </label>
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.gstNo}
                  onChange={(e) => handleGstChange(e.target.value)}
                  placeholder="36ATXPB1649L1Z5"
                  className="w-full bg-white text-slate-900 font-mono font-bold px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-200 uppercase"
                />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.panNo}
                  onChange={(e) => setFormData({ ...formData, panNo: e.target.value.toUpperCase() })}
                  placeholder="PAN NO (ATXPB1649L)"
                  className="w-full bg-white text-slate-900 font-mono font-bold px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-200 uppercase"
                />
              </div>
            </div>

            {/* Contact Name & Mobile Nos. */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <label className="text-sm font-bold text-yellow-300 md:text-right uppercase">
                Contact & Mobile:
              </label>
              <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  placeholder="Contact Person Name"
                  className="w-full bg-white text-slate-900 font-medium px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-200"
                />
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.mobileNos}
                  onChange={(e) => setFormData({ ...formData, mobileNos: e.target.value })}
                  placeholder="Mobile Numbers (e.g. 08885051118)"
                  className="w-full bg-white text-slate-900 font-bold px-3 py-2 border border-sky-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-slate-200"
                />
              </div>
            </div>

            {/* Select Type (CONSIGNEE / CONSIGNOR / BOTH) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center pt-2">
              <label className="text-sm font-bold text-yellow-300 md:text-right uppercase">
                Select Type:
              </label>
              <div className="md:col-span-3">
                <select
                  disabled={!isEditing}
                  value={formData.selectType}
                  onChange={(e) => setFormData({ ...formData, selectType: e.target.value })}
                  className="w-full md:w-1/2 bg-yellow-300 text-slate-950 font-extrabold px-3 py-2 border-2 border-yellow-500 rounded focus:outline-none focus:ring-2 focus:ring-yellow-400 disabled:bg-yellow-100 uppercase cursor-pointer"
                >
                  <option value="CONSIGNEE">CONSIGNEE (माल प्राप्तकर्ता)</option>
                  <option value="CONSIGNOR">CONSIGNOR (माल भेजने वाला)</option>
                  <option value="BOTH">BOTH (दोनों)</option>
                </select>
              </div>
            </div>

            {/* Action Buttons Toolbar (Exactly matching Photo 1 buttons: Top, Prev, Next, End, Search, Add, Edit, Delete, Close/Save) */}
            <div className="pt-6 border-t border-sky-700">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleTop}
                  className="px-3 py-2 bg-slate-200 text-slate-900 font-bold rounded hover:bg-white text-xs uppercase shadow transition-colors"
                >
                  Top
                </button>
                <button
                  type="button"
                  onClick={handlePrev}
                  className="px-3 py-2 bg-slate-200 text-slate-900 font-bold rounded hover:bg-white text-xs uppercase shadow transition-colors"
                >
                  Prev
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-3 py-2 bg-slate-200 text-slate-900 font-bold rounded hover:bg-white text-xs uppercase shadow transition-colors"
                >
                  Next
                </button>
                <button
                  type="button"
                  onClick={handleEnd}
                  className="px-3 py-2 bg-slate-200 text-slate-900 font-bold rounded hover:bg-white text-xs uppercase shadow transition-colors"
                >
                  End
                </button>
                
                <span className="h-6 border-r border-sky-500 mx-1 hidden sm:inline"></span>

                <button
                  type="button"
                  onClick={handleAdd}
                  className="px-4 py-2 bg-emerald-500 text-slate-950 font-extrabold rounded hover:bg-emerald-400 text-xs uppercase shadow flex items-center gap-1 transition-colors"
                >
                  <Plus size={14} /> Add
                </button>

                <button
                  type="button"
                  onClick={handleEdit}
                  className="px-4 py-2 bg-amber-400 text-slate-950 font-extrabold rounded hover:bg-amber-300 text-xs uppercase shadow flex items-center gap-1 transition-colors"
                >
                  <Edit size={14} /> Edit
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-2 bg-rose-600 text-white font-extrabold rounded hover:bg-rose-500 text-xs uppercase shadow flex items-center gap-1 transition-colors"
                >
                  <Trash2 size={14} /> Delete
                </button>

                {isEditing ? (
                  <button
                    type="submit"
                    className="px-5 py-2 bg-yellow-400 text-slate-950 font-black rounded hover:bg-yellow-300 text-xs uppercase shadow-lg flex items-center gap-1 transition-all transform scale-105"
                  >
                    <Save size={14} /> Save Record
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => loadParties()}
                    className="px-4 py-2 bg-slate-400 text-slate-950 font-bold rounded hover:bg-slate-300 text-xs uppercase shadow transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>

        {/* Quick Search & Master Parties List */}
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <h2 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Saved Master Parties Directory ({parties.length})
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Party / GST / Mobile..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-600 rounded-lg text-sm text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900 text-xs uppercase text-amber-400 font-bold">
                <tr>
                  <th className="p-3">Type</th>
                  <th className="p-3">Party Name</th>
                  <th className="p-3">City / State</th>
                  <th className="p-3">GST No</th>
                  <th className="p-3">Mobile</th>
                  <th className="p-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredParties.map((p, idx) => (
                  <tr
                    key={p.id || idx}
                    className={`hover:bg-slate-700/50 cursor-pointer ${
                      formData.id === p.id ? "bg-sky-950/60 border-l-4 border-amber-400" : ""
                    }`}
                    onClick={() => {
                      setFormData(p);
                      setCurrentIndex(parties.findIndex((item) => item.id === p.id));
                      setIsEditing(false);
                    }}
                  >
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.selectType === "CONSIGNE" || p.selectType === "CONSIGNEE"
                            ? "bg-purple-900 text-purple-200"
                            : p.selectType === "CONSIGNOR"
                            ? "bg-emerald-900 text-emerald-200"
                            : "bg-amber-900 text-amber-200"
                        }`}
                      >
                        {p.selectType}
                      </span>
                    </td>
                    <td className="p-3 font-bold text-white">{p.partyName}</td>
                    <td className="p-3">{p.city || p.district || "N.A."} ({p.stateCode})</td>
                    <td className="p-3 font-mono text-xs text-amber-300">{p.gstNo || "N/A"}</td>
                    <td className="p-3">{p.mobileNos || "N/A"}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setFormData(p);
                          setIsEditing(true);
                        }}
                        className="text-amber-400 hover:text-amber-300 px-2 py-1 font-bold text-xs"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredParties.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center py-6 text-slate-500">
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
  );
}
