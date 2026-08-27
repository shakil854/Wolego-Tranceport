import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";
import {
  Users,
  UserPlus,
  Key,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  ShieldCheck,
  Shield,
  Building2,
  Truck,
  CheckCircle,
  AlertTriangle,
  X,
  Lock,
  Phone,
  Eye,
  EyeOff,
  User,
  Crown,
} from "lucide-react";

export default function UserManagementPage() {
  const { user: loggedInUser, isOwner } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("ALL");
  const [statusMsg, setStatusMsg] = useState("");

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPassModal, setShowResetPassModal] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  // Add User Form State
  const initialAddForm = {
    username: "",
    password: "",
    role: "OFFICE",
    partyName: "",
    mobileNo: "",
    actionPassword: "",
  };
  const [addForm, setAddForm] = useState(initialAddForm);
  const [showAddPassText, setShowAddPassText] = useState(false);

  // Edit User Form State
  const [editForm, setEditForm] = useState({
    id: "",
    username: "",
    role: "OFFICE",
    partyName: "",
    mobileNo: "",
  });

  // Direct Reset Password Form State
  const [resetPassForm, setResetPassForm] = useState({
    newPassword: "",
    newActionPassword: "",
  });
  const [showResetPassText, setShowResetPassText] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setUsers(data);
      } else {
        flashMsg("Failed to load users.", "error");
      }
    } catch (e) {
      console.error("Error fetching users:", e);
      flashMsg("Error connecting to server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const flashMsg = (text) => {
    setStatusMsg(text);
    setTimeout(() => setStatusMsg(""), 4000);
  };

  // Add New User Submit
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.username || !addForm.username.trim()) {
      alert("Username / Mobile Number is required.");
      return;
    }
    if (!addForm.password || !addForm.password.trim()) {
      alert("Password is required.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(addForm),
      });
      const data = await res.json();
      if (res.ok) {
        flashMsg(`User "${addForm.username}" created successfully!`);
        setShowAddModal(false);
        setAddForm(initialAddForm);
        fetchUsers();
      } else {
        alert(data.error || "Failed to create user.");
      }
    } catch (err) {
      console.error("Error adding user:", err);
      alert("Failed to connect to server.");
    }
  };

  // Edit User Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.username || !editForm.username.trim()) {
      alert("Username is required.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/${editForm.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        flashMsg(`User "${editForm.username}" updated successfully!`);
        setShowEditModal(false);
        fetchUsers();
      } else {
        alert(data.error || "Failed to update user.");
      }
    } catch (err) {
      console.error("Error updating user:", err);
      alert("Failed to connect to server.");
    }
  };

  // Direct Password Reset Submit (No old password needed!)
  const handleResetPassSubmit = async (e) => {
    e.preventDefault();
    if (!resetPassForm.newPassword && !resetPassForm.newActionPassword) {
      alert("Please enter a new password.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/users/${selectedUser.id}/reset-password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resetPassForm),
      });
      const data = await res.json();
      if (res.ok) {
        flashMsg(`Password for "${selectedUser.username}" changed successfully!`);
        setShowResetPassModal(false);
        setResetPassForm({ newPassword: "", newActionPassword: "" });
        fetchUsers();
      } else {
        alert(data.error || "Failed to reset password.");
      }
    } catch (err) {
      console.error("Error resetting password:", err);
      alert("Failed to connect to server.");
    }
  };

  // Filters & Search
  const filteredUsers = users.filter((u) => {
    // Role filter
    if (selectedRoleFilter !== "ALL" && u.role !== selectedRoleFilter) {
      return false;
    }
    // Text search
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchUsername = (u.username || "").toLowerCase().includes(q);
      const matchPartyName = (u.partyName || "").toLowerCase().includes(q);
      const matchMobile = (u.mobileNo || "").toLowerCase().includes(q);
      const matchRole = (u.role || "").toLowerCase().includes(q);
      return matchUsername || matchPartyName || matchMobile || matchRole;
    }
    return true;
  });

  // Count summaries
  const totalCount = users.length;
  const ownerCount = users.filter((u) => u.role === "OWNER").length;
  const officeCount = users.filter((u) => u.role === "OFFICE").length;
  const partyCount = users.filter((u) => u.role === "PARTY").length;
  const truckCount = users.filter((u) => u.role === "TRUCK").length;

  const getRoleBadge = (role) => {
    switch (role) {
      case "OWNER":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
            <Crown size={12} className="text-amber-400" /> OWNER
          </span>
        );
      case "OFFICE":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm">
            <Building2 size={12} className="text-sky-400" /> OFFICE
          </span>
        );
      case "PARTY":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm">
            <Users size={12} className="text-purple-400" /> PARTY
          </span>
        );
      case "TRUCK":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
            <Truck size={12} className="text-emerald-400" /> TRUCK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-slate-700 text-slate-300">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 font-sans space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl backdrop-blur flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 rounded-2xl shadow-lg font-black">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
                User Management
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
                Owner Only
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage system users, modify accounts, and directly reset passwords without old password.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={fetchUsers}
            disabled={loading}
            className="px-3.5 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Users"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAddForm(initialAddForm);
              setShowAddModal(true);
            }}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer transition transform active:scale-95"
          >
            <UserPlus size={16} /> + Add New User
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMsg && (
        <div className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-black text-center shadow-lg animate-fadeIn flex items-center justify-center gap-2">
          <CheckCircle size={16} />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Metric Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <div
          onClick={() => setSelectedRoleFilter("ALL")}
          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
            selectedRoleFilter === "ALL"
              ? "bg-slate-800 border-amber-500 ring-2 ring-amber-500/40 shadow-lg"
              : "bg-slate-800/70 border-slate-700/70 hover:border-slate-600"
          }`}
        >
          <div className="text-[11px] font-bold text-slate-400 uppercase">Total Accounts</div>
          <div className="text-xl font-black text-white font-mono mt-1">{totalCount}</div>
        </div>

        <div
          onClick={() => setSelectedRoleFilter("OFFICE")}
          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
            selectedRoleFilter === "OFFICE"
              ? "bg-sky-950/60 border-sky-400 ring-2 ring-sky-500/40 shadow-lg"
              : "bg-slate-800/70 border-slate-700/70 hover:border-sky-500/40"
          }`}
        >
          <div className="text-[11px] font-bold text-sky-300 uppercase flex items-center gap-1">
            <Building2 size={12} /> Office Staff
          </div>
          <div className="text-xl font-black text-sky-400 font-mono mt-1">{officeCount}</div>
        </div>

        <div
          onClick={() => setSelectedRoleFilter("PARTY")}
          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
            selectedRoleFilter === "PARTY"
              ? "bg-purple-950/60 border-purple-400 ring-2 ring-purple-500/40 shadow-lg"
              : "bg-slate-800/70 border-slate-700/70 hover:border-purple-500/40"
          }`}
        >
          <div className="text-[11px] font-bold text-purple-300 uppercase flex items-center gap-1">
            <Users size={12} /> Party Users
          </div>
          <div className="text-xl font-black text-purple-400 font-mono mt-1">{partyCount}</div>
        </div>

        <div
          onClick={() => setSelectedRoleFilter("TRUCK")}
          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
            selectedRoleFilter === "TRUCK"
              ? "bg-emerald-950/60 border-emerald-400 ring-2 ring-emerald-500/40 shadow-lg"
              : "bg-slate-800/70 border-slate-700/70 hover:border-emerald-500/40"
          }`}
        >
          <div className="text-[11px] font-bold text-emerald-300 uppercase flex items-center gap-1">
            <Truck size={12} /> Truck Owners
          </div>
          <div className="text-xl font-black text-emerald-400 font-mono mt-1">{truckCount}</div>
        </div>

        <div
          onClick={() => setSelectedRoleFilter("OWNER")}
          className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between col-span-2 sm:col-span-1 ${
            selectedRoleFilter === "OWNER"
              ? "bg-amber-950/60 border-amber-400 ring-2 ring-amber-500/40 shadow-lg"
              : "bg-slate-800/70 border-slate-700/70 hover:border-amber-500/40"
          }`}
        >
          <div className="text-[11px] font-bold text-amber-300 uppercase flex items-center gap-1">
            <Crown size={12} /> Owner Admin
          </div>
          <div className="text-xl font-black text-amber-400 font-mono mt-1">{ownerCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-3 shadow flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by username, mobile, name..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
          <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Role Filter Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700 w-full sm:w-auto overflow-x-auto">
          {["ALL", "OFFICE", "PARTY", "TRUCK", "OWNER"].map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition whitespace-nowrap cursor-pointer ${
                selectedRoleFilter === r
                  ? "bg-amber-500 text-slate-950 shadow"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 uppercase font-black tracking-wider text-[11px] border-b border-slate-700">
                <th className="py-3 px-4">User / Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Party / Name</th>
                <th className="py-3 px-4">Mobile No</th>
                <th className="py-3 px-4">Action PIN</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                    Loading users list...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    No matching users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCurrentLoggedIn = loggedInUser?.id === u.id || loggedInUser?.username === u.username;
                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-700/40 transition-colors group"
                    >
                      {/* Username */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 font-black text-xs shrink-0 shadow">
                            {u.role === "OWNER" ? <Crown size={15} /> : <User size={15} />}
                          </div>
                          <div>
                            <div className="font-mono font-black text-white text-xs flex items-center gap-1.5">
                              <span>{u.username}</span>
                              {isCurrentLoggedIn && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {u.id.length > 20 ? `${u.id.slice(0, 18)}...` : u.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4">{getRoleBadge(u.role)}</td>

                      {/* Party / Name */}
                      <td className="py-3 px-4">
                        <div className="text-white font-bold uppercase">
                          {u.partyName || "-"}
                        </div>
                        {u.partyId && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Ref: {u.partyId}
                          </div>
                        )}
                      </td>

                      {/* Mobile No */}
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {u.mobileNo || u.username || "-"}
                      </td>

                      {/* Action PIN */}
                      <td className="py-3 px-4">
                        {u.hasActionPassword ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-bold">
                            <ShieldCheck size={14} /> Set
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Not Set</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Reset Password Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setResetPassForm({ newPassword: "", newActionPassword: "" });
                              setShowResetPassModal(true);
                            }}
                            title="Direct Password Change (No old password needed)"
                            className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Key size={13} />
                            <span>Change Pass</span>
                          </button>

                          {/* Edit Details Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedUser(u);
                              setEditForm({
                                id: u.id,
                                username: u.username,
                                role: u.role,
                                partyName: u.partyName || "",
                                mobileNo: u.mobileNo || "",
                              });
                              setShowEditModal(true);
                            }}
                            title="Edit User Details"
                            className="px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit2 size={13} />
                            <span>Edit</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. ADD NEW USER MODAL */}
      {/* ========================================================================= */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border-2 border-amber-500/80 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    Create New User Account
                  </h3>
                  <p className="text-[11px] text-slate-400">Add login credentials & role</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-amber-300 uppercase mb-1">
                  Username / Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={addForm.username}
                  onChange={(e) => setAddForm({ ...addForm, username: e.target.value })}
                  placeholder="e.g. 9876543210 or staff_john"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-amber-300 uppercase mb-1">
                  Login Password *
                </label>
                <div className="relative">
                  <input
                    type={showAddPassText ? "text" : "password"}
                    required
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    placeholder="Enter initial password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-white font-mono focus:outline-none focus:border-amber-400 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassText(!showAddPassText)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showAddPassText ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Account Role *
                </label>
                <select
                  value={addForm.role}
                  onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400 cursor-pointer"
                >
                  <option value="OFFICE">🏢 OFFICE (Orders, LR Entry, Freight Receipt)</option>
                  <option value="PARTY">🏭 PARTY (Consignor/Consignee - Party Ledger)</option>
                  <option value="TRUCK">🚛 TRUCK (Truck Owner - Truck Accounting)</option>
                  <option value="OWNER">👑 OWNER (Full Admin Privileges)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Party / Display Name (Optional)
                </label>
                <input
                  type="text"
                  value={addForm.partyName}
                  onChange={(e) => setAddForm({ ...addForm, partyName: e.target.value })}
                  placeholder="e.g. SHREE GANESH TILES"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Mobile Number (Optional)
                </label>
                <input
                  type="text"
                  value={addForm.mobileNo}
                  onChange={(e) => setAddForm({ ...addForm, mobileNo: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus size={16} /> Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. DIRECT RESET PASSWORD MODAL (NO OLD PASSWORD NEEDED!) */}
      {/* ========================================================================= */}
      {showResetPassModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border-2 border-amber-500 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Key size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    Direct Password Change
                  </h3>
                  <p className="text-[11px] text-amber-400 font-bold">
                    No old password needed &bull; Set new password directly
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowResetPassModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-700 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Target User:</span>
                <span className="text-white font-mono font-bold">{selectedUser.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Role:</span>
                <span className="text-amber-300 font-bold">{selectedUser.role}</span>
              </div>
              {selectedUser.partyName && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Party Name:</span>
                  <span className="text-white font-bold">{selectedUser.partyName}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleResetPassSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-amber-300 uppercase mb-1">
                  New Login Password *
                </label>
                <div className="relative">
                  <input
                    type={showResetPassText ? "text" : "password"}
                    required
                    value={resetPassForm.newPassword}
                    onChange={(e) =>
                      setResetPassForm({ ...resetPassForm, newPassword: e.target.value })
                    }
                    placeholder="Enter new password"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-white font-mono focus:outline-none focus:border-amber-400 font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassText(!showResetPassText)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showResetPassText ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {selectedUser.role === "OWNER" && (
                <div>
                  <label className="block text-[11px] font-bold text-emerald-400 uppercase mb-1">
                    New Action Security PIN (Optional)
                  </label>
                  <input
                    type="password"
                    value={resetPassForm.newActionPassword}
                    onChange={(e) =>
                      setResetPassForm({ ...resetPassForm, newActionPassword: e.target.value })
                    }
                    placeholder="Set new action security PIN"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Used for protecting LR Edit/Delete & Truck Debit actions.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowResetPassModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Key size={16} /> Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. EDIT USER DETAILS MODAL */}
      {/* ========================================================================= */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-800 border-2 border-sky-500/80 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
                  <Edit2 size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wide">
                    Edit User Profile
                  </h3>
                  <p className="text-[11px] text-slate-400">Modify user role & details</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-sky-300 uppercase mb-1">
                  Username / Mobile Number *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-400 font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold focus:outline-none focus:border-sky-400 cursor-pointer"
                >
                  <option value="OFFICE">🏢 OFFICE (Orders, LR Entry, Freight Receipt)</option>
                  <option value="PARTY">🏭 PARTY (Consignor/Consignee)</option>
                  <option value="TRUCK">🚛 TRUCK (Truck Owner)</option>
                  <option value="OWNER">👑 OWNER (Full Admin)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Party / Display Name
                </label>
                <input
                  type="text"
                  value={editForm.partyName}
                  onChange={(e) => setEditForm({ ...editForm, partyName: e.target.value })}
                  placeholder="e.g. SHREE GANESH TILES"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white uppercase focus:outline-none focus:border-sky-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  value={editForm.mobileNo}
                  onChange={(e) => setEditForm({ ...editForm, mobileNo: e.target.value })}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-700">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs uppercase rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs uppercase rounded-xl shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle size={16} /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
