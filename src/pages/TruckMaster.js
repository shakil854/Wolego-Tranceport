import React, { useState, useEffect } from "react";
import { fetchTrucksFromDB, saveTruck } from "../utils/storage";
import { Search, Plus, Edit, Save, Truck, Eye, X, CheckCircle2, Landmark, Package } from "lucide-react";

export default function TruckMaster() {
  const [trucks, setTrucks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  // Modals state
  const [viewTruckModal, setViewTruckModal] = useState(null); // Truck object or null
  const [editTruckModal, setEditTruckModal] = useState(null); // Truck object or null

  // Initial blank form for New Truck
  const initialBlankForm = {
    truckNo: "",
    ownerName: "",
    mobileNo: "",
    address: "",
    loadingDetail: "",
    bankName: "",
    accountName: "",
    accountNo: "",
    ifscCode: "",
    branch: "",
  };

  const [addFormData, setAddFormData] = useState(initialBlankForm);
  const [editFormData, setEditFormData] = useState(initialBlankForm);

  useEffect(() => {
    loadTrucks();
  }, []);

  const loadTrucks = async () => {
    const data = await fetchTrucksFromDB();
    setTrucks(data || []);
  };

  const showStatus = (msg) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(""), 4000);
  };

  // Handle Enter key navigation across form fields
  const handleFormKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.target.tagName === "BUTTON" || e.target.type === "submit") {
        return;
      }
      e.preventDefault();
      const form = e.currentTarget;
      const focusable = Array.from(
        form.querySelectorAll(
          "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])"
        )
      ).filter(
        (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
      );

      const index = focusable.indexOf(e.target);
      if (index > -1 && index < focusable.length - 1) {
        focusable[index + 1].focus();
      }
    }
  };

  // Submit Handler: Add New Truck
  const handleSaveNewTruck = async (e) => {
    if (e) e.preventDefault();
    if (!addFormData.truckNo.trim()) {
      alert("Truck Number is required!");
      return;
    }
    const updated = await saveTruck({
      ...addFormData,
      truckNo: addFormData.truckNo.toUpperCase().trim(),
    });
    setTrucks(updated || []);
    setAddFormData(initialBlankForm);
    showStatus(`New truck "${addFormData.truckNo.toUpperCase()}" saved successfully!`);
  };

  // Open Edit Modal
  const handleOpenEditModal = (truck) => {
    setEditTruckModal(truck);
    setEditFormData({ ...truck, loadingDetail: truck.loadingDetail || "" });
  };

  // Submit Handler: Update Truck
  const handleUpdateTruck = async (e) => {
    if (e) e.preventDefault();
    if (!editFormData.truckNo.trim()) {
      alert("Truck Number is required!");
      return;
    }
    const updated = await saveTruck({
      ...editFormData,
      truckNo: editFormData.truckNo.toUpperCase().trim(),
    });
    setTrucks(updated || []);
    setEditTruckModal(null);
    showStatus(`Truck "${editFormData.truckNo.toUpperCase()}" updated successfully!`);
  };

  const filteredTrucks = trucks.filter(
    (t) =>
      (t.truckNo && t.truckNo.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.ownerName && t.ownerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.mobileNo && t.mobileNo.includes(searchQuery)) ||
      (t.loadingDetail && t.loadingDetail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.bankName && t.bankName.toLowerCase().includes(searchQuery.toLowerCase()))
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

          {/* LEFT COLUMN: Add New Truck Form */}
          <div className="bg-sky-900/90 border-2 border-yellow-400 rounded-lg shadow-xl overflow-visible lg:overflow-hidden backdrop-blur-sm flex flex-col justify-between">

            {/* Form Header */}
            <div className="bg-sky-950 px-3 py-1.5 border-b border-yellow-400 flex justify-between items-center shrink-0">
              <h2 className="text-xs sm:text-sm font-black text-blue-100 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-yellow-400" /> Add New Truck (ट्रक मास्टर)
              </h2>
              <span className="px-2 py-0.5 bg-yellow-400 text-slate-950 font-black rounded text-[10px] uppercase">
                New Master
              </span>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleSaveNewTruck} onKeyDown={handleFormKeyDown} className="p-2.5 space-y-2.5 lg:space-y-2 flex-1 flex flex-col lg:justify-between overflow-y-auto">

              {/* Basic Truck & Owner Info */}
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
                      value={addFormData.truckNo}
                      onChange={(e) => setAddFormData({ ...addFormData, truckNo: e.target.value.toUpperCase() })}
                      placeholder="e.g. GJ01AB1234"
                      className="w-full bg-white text-slate-900 font-extrabold px-2 py-1 text-xs border border-sky-400 rounded focus:outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                      Owner Name
                    </label>
                    <input
                      type="text"
                      value={addFormData.ownerName}
                      onChange={(e) => setAddFormData({ ...addFormData, ownerName: e.target.value.toUpperCase() })}
                      placeholder="OWNER NAME"
                      className="w-full bg-white text-slate-900 font-bold px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none"
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
                      value={addFormData.mobileNo}
                      onChange={(e) => setAddFormData({ ...addFormData, mobileNo: e.target.value })}
                      placeholder="MOBILE NUMBER"
                      className="w-full bg-white text-slate-900 font-bold px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                      Address
                    </label>
                    <input
                      type="text"
                      value={addFormData.address}
                      onChange={(e) => setAddFormData({ ...addFormData, address: e.target.value.toUpperCase() })}
                      placeholder="CITY / ADDRESS"
                      className="w-full bg-white text-slate-900 font-medium px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                    Loading Detail (लोडिंग डिटेल / क्षमता)
                  </label>
                  <input
                    type="text"
                    value={addFormData.loadingDetail}
                    onChange={(e) => setAddFormData({ ...addFormData, loadingDetail: e.target.value.toUpperCase() })}
                    placeholder="e.g. 25 TON / 32 FT CONTAINER / OPEN BODY"
                    className="w-full bg-white text-slate-900 font-bold px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none uppercase"
                  />
                </div>
              </div>

              {/* Bank Details Section */}
              <div className="space-y-2 pt-1 border-t border-sky-700/60">
                <div className="text-[11px] font-extrabold text-amber-300 uppercase tracking-wider border-b border-sky-700/60 pb-0.5 flex items-center gap-1">
                  <Landmark size={13} /> Bank Details
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={addFormData.bankName}
                      onChange={(e) => setAddFormData({ ...addFormData, bankName: e.target.value.toUpperCase() })}
                      placeholder="e.g. HDFC BANK"
                      className="w-full bg-white text-slate-900 font-bold px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-yellow-300 uppercase mb-0.5">
                      Account Name
                    </label>
                    <input
                      type="text"
                      value={addFormData.accountName}
                      onChange={(e) => setAddFormData({ ...addFormData, accountName: e.target.value.toUpperCase() })}
                      placeholder="ACCOUNT HOLDER NAME"
                      className="w-full bg-white text-slate-900 font-medium px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none"
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
                      value={addFormData.accountNo}
                      onChange={(e) => setAddFormData({ ...addFormData, accountNo: e.target.value })}
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
                      value={addFormData.ifscCode}
                      onChange={(e) => setAddFormData({ ...addFormData, ifscCode: e.target.value.toUpperCase() })}
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
                      value={addFormData.branch}
                      onChange={(e) => setAddFormData({ ...addFormData, branch: e.target.value.toUpperCase() })}
                      placeholder="BRANCH NAME"
                      className="w-full bg-white text-slate-900 font-medium px-2 py-1 text-xs border border-sky-300 rounded focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Save / Clear Buttons */}
              <div className="pt-2 border-t border-sky-700 flex justify-end shrink-0">
                <button
                  type="submit"
                  className="px-4 py-1 bg-yellow-400 text-slate-950 font-black rounded hover:bg-yellow-300 text-xs uppercase shadow flex items-center gap-1 transition-all focus:outline-none focus:ring-2 focus:ring-yellow-300"
                >
                  <Save size={14} /> Save Truck Master
                </button>
              </div>

            </form>
          </div>

          {/* RIGHT COLUMN: Directory List */}
          <div className="bg-slate-800 rounded-lg p-2.5 border border-slate-700 shadow-xl flex flex-col min-h-[400px] lg:min-h-0 overflow-visible lg:overflow-hidden">

            {/* Header & Search Bar */}
            <div className="flex justify-between items-center gap-2 border-b border-slate-700 pb-1.5 shrink-0">
              <h2 className="text-xs sm:text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <Truck className="w-4 h-4" /> Saved Trucks Directory ({filteredTrucks.length})
              </h2>

              <div className="relative w-48 sm:w-56">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Truck / Owner / Loading..."
                  className="w-full pl-8 pr-2 py-1 bg-slate-900 border border-slate-600 rounded text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Scrollable Table Container */}
            <div className="flex-1 min-h-0 overflow-y-auto rounded border border-slate-700 mt-1.5">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 uppercase text-amber-400 font-extrabold sticky top-0 z-10">
                  <tr>
                    <th className="p-2.5">Truck No.</th>
                    <th className="p-2.5">Owner Name</th>
                    <th className="p-2.5">Mobile</th>
                    <th className="p-2.5">Loading Detail</th>
                    <th className="p-2.5">Bank Name</th>
                    <th className="p-2.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700 font-medium">
                  {filteredTrucks.map((t, idx) => (
                    <tr key={t.id || idx} className="hover:bg-slate-700/60 transition-colors">

                      {/* Truck No */}
                      <td className="p-2.5 font-black text-amber-400 font-mono text-xs whitespace-nowrap">
                        {t.truckNo}
                      </td>

                      {/* Owner Name */}
                      <td className="p-2.5 font-bold text-white max-w-[120px] truncate">
                        {t.ownerName || "-"}
                      </td>

                      {/* Mobile */}
                      <td className="p-2.5 font-mono text-slate-200 whitespace-nowrap">
                        {t.mobileNo || "-"}
                      </td>

                      {/* Loading Detail */}
                      <td className="p-2.5 font-semibold text-sky-300 max-w-[130px] truncate text-[11px]">
                        {t.loadingDetail || "-"}
                      </td>

                      {/* Bank Name */}
                      <td className="p-2.5 text-slate-300 max-w-[110px] truncate">
                        {t.bankName ? `${t.bankName}${t.branch ? ` (${t.branch})` : ""}` : "-"}
                      </td>

                      {/* Actions: View, Edit */}
                      <td className="p-2.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* View Button */}
                          <button
                            type="button"
                            onClick={() => setViewTruckModal(t)}
                            title="View Details"
                            className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-amber-400 font-bold rounded transition-all shadow border border-slate-600 flex items-center gap-1 text-[11px]"
                          >
                            <Eye size={13} /> View
                          </button>

                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(t)}
                            title="Edit Truck"
                            className="px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded transition-all shadow flex items-center gap-1 text-[11px]"
                          >
                            <Edit size={13} /> Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredTrucks.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-8 text-slate-500 font-bold">
                        No trucks found matching "{searchQuery}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>

      </div>

      {/* VIEW TRUCK MODAL */}
      {viewTruckModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            
            {/* Modal Header */}
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
              <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                <Truck className="w-5 h-5" /> Truck Master Details
              </h3>
              <button
                onClick={() => setViewTruckModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-3 text-xs text-slate-200">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                    Truck Number
                  </span>
                  <h4 className="text-lg font-black font-mono text-white">{viewTruckModal.truckNo}</h4>
                </div>
                {viewTruckModal.mobileNo && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Mobile No.</span>
                    <span className="font-mono font-bold text-amber-300">{viewTruckModal.mobileNo}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-800/50 p-3 rounded border border-slate-700/60">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Owner Name</span>
                  <span className="font-bold text-white text-xs">{viewTruckModal.ownerName || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Address</span>
                  <span className="font-medium text-slate-200 text-xs">{viewTruckModal.address || "N/A"}</span>
                </div>
              </div>

              {/* Loading Detail Card */}
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700/60 flex items-start gap-2.5">
                <Package size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-bold text-amber-400 uppercase block">Loading Detail</span>
                  <span className="font-bold text-sky-300 text-xs">{viewTruckModal.loadingDetail || "N/A"}</span>
                </div>
              </div>

              {/* Bank Details Card */}
              <div className="bg-sky-950/80 p-3 rounded-lg border border-sky-800 space-y-2">
                <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-sky-800 pb-1">
                  <Landmark size={14} /> Bank Account Details
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-sky-300 uppercase block">Bank Name</span>
                    <span className="font-bold text-white">{viewTruckModal.bankName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-sky-300 uppercase block">Branch</span>
                    <span className="font-medium text-slate-200">{viewTruckModal.branch || "N/A"}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-sky-300 uppercase block">Account Name</span>
                    <span className="font-semibold text-white">{viewTruckModal.accountName || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-sky-300 uppercase block">IFSC Code</span>
                    <span className="font-mono font-bold text-amber-300">{viewTruckModal.ifscCode || "N/A"}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-sky-300 uppercase block">Account Number</span>
                  <span className="font-mono font-bold text-lg text-amber-400 tracking-wider">
                    {viewTruckModal.accountNo || "N/A"}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-800 px-4 py-2.5 border-t border-slate-700 flex justify-end">
              <button
                onClick={() => setViewTruckModal(null)}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg text-xs uppercase"
              >
                Close Preview
              </button>
            </div>

          </div>
        </div>
      )}

      {/* EDIT TRUCK MODAL */}
      {editTruckModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-sky-900 border-4 border-yellow-400 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden my-6">

            {/* Modal Header */}
            <div className="bg-sky-950 px-4 py-3 border-b-2 border-yellow-400 flex justify-between items-center">
              <h3 className="text-sm font-black text-blue-100 uppercase tracking-wider flex items-center gap-2">
                <Edit className="w-4 h-4 text-yellow-400" /> Edit Truck Master
              </h3>
              <button
                onClick={() => setEditTruckModal(null)}
                className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-sky-800"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleUpdateTruck} onKeyDown={handleFormKeyDown} className="p-4 space-y-3">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Truck No. *</label>
                  <input
                    type="text"
                    required
                    value={editFormData.truckNo}
                    onChange={(e) => setEditFormData({ ...editFormData, truckNo: e.target.value.toUpperCase() })}
                    className="w-full bg-white text-slate-900 font-extrabold px-3 py-1.5 text-xs border border-sky-300 rounded uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Owner Name</label>
                  <input
                    type="text"
                    value={editFormData.ownerName}
                    onChange={(e) => setEditFormData({ ...editFormData, ownerName: e.target.value.toUpperCase() })}
                    className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Mobile No.</label>
                  <input
                    type="text"
                    value={editFormData.mobileNo}
                    onChange={(e) => setEditFormData({ ...editFormData, mobileNo: e.target.value })}
                    className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">Address</label>
                  <input
                    type="text"
                    value={editFormData.address}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value.toUpperCase() })}
                    className="w-full bg-white text-slate-900 font-medium px-3 py-1.5 text-xs border border-sky-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-yellow-300 uppercase mb-1">
                  Loading Detail (लोडिंग डिटेल)
                </label>
                <input
                  type="text"
                  value={editFormData.loadingDetail || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, loadingDetail: e.target.value.toUpperCase() })}
                  placeholder="e.g. 25 TON / 32 FT CONTAINER / OPEN BODY"
                  className="w-full bg-white text-slate-900 font-bold px-3 py-1.5 text-xs border border-sky-300 rounded uppercase"
                />
              </div>

              <div className="pt-2 border-t border-sky-700/60 space-y-2">
                <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">Bank Details</div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-yellow-300 uppercase mb-1">Bank Name</label>
                    <input
                      type="text"
                      value={editFormData.bankName}
                      onChange={(e) => setEditFormData({ ...editFormData, bankName: e.target.value.toUpperCase() })}
                      className="w-full bg-white text-slate-900 font-bold px-2 py-1 text-xs border border-sky-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-yellow-300 uppercase mb-1">Account Name</label>
                    <input
                      type="text"
                      value={editFormData.accountName}
                      onChange={(e) => setEditFormData({ ...editFormData, accountName: e.target.value.toUpperCase() })}
                      className="w-full bg-white text-slate-900 font-medium px-2 py-1 text-xs border border-sky-300 rounded"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-yellow-300 uppercase mb-1">Account No.</label>
                    <input
                      type="text"
                      value={editFormData.accountNo}
                      onChange={(e) => setEditFormData({ ...editFormData, accountNo: e.target.value })}
                      className="w-full bg-white text-slate-900 font-mono font-bold px-2 py-1 text-xs border border-sky-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-yellow-300 uppercase mb-1">IFSC Code</label>
                    <input
                      type="text"
                      value={editFormData.ifscCode}
                      onChange={(e) => setEditFormData({ ...editFormData, ifscCode: e.target.value.toUpperCase() })}
                      className="w-full bg-white text-slate-900 font-mono font-bold px-2 py-1 text-xs border border-sky-300 rounded uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-yellow-300 uppercase mb-1">Branch</label>
                    <input
                      type="text"
                      value={editFormData.branch}
                      onChange={(e) => setEditFormData({ ...editFormData, branch: e.target.value.toUpperCase() })}
                      className="w-full bg-white text-slate-900 font-medium px-2 py-1 text-xs border border-sky-300 rounded"
                    />
                  </div>
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="pt-3 border-t border-sky-700 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditTruckModal(null)}
                  className="px-3 py-1.5 bg-slate-700 text-slate-300 font-bold rounded hover:bg-slate-600 text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 bg-yellow-400 text-slate-950 font-black rounded hover:bg-yellow-300 text-xs uppercase shadow-lg flex items-center gap-1.5"
                >
                  <Save size={15} /> Update Truck Master
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
