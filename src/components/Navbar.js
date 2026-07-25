import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Truck,
  Users,
  FileText,
  Receipt,
  Menu,
  X,
  Phone,
  ShieldCheck,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  FolderKanban,
  Calculator,
  LogOut,
  LogIn,
  User,
} from "lucide-react";
import logoImg from "../assets/logo.png";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isOwner, isParty } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Primary Navigation Items for Owner
  const ownerPrimaryItems = [
    { name: "L/R Entry", path: "/lr-entry", icon: Truck },
    { name: "LR Records", path: "/lr-list", icon: FileText },
    { name: "Freight Receipt", path: "/freight-receipt", icon: Receipt },
  ];

  // Primary Navigation Items for Party
  const partyPrimaryItems = [
    { name: "My Accounting", path: "/accounting", icon: Calculator },
  ];

  const primaryItems = isParty ? partyPrimaryItems : ownerPrimaryItems;

  // Dropdown Items (Owner only)
  const dropdownItems = [
    { name: "Accounting", path: "/accounting", icon: Calculator },
    { name: "Range LR Print", path: "/range-lr-print", icon: Printer },
    { name: "Party Statement", path: "/party-statement", icon: FileSpreadsheet },
    { name: "CA Excel", path: "/ca-excel", icon: FileSpreadsheet },
    { name: "Party Master", path: "/party-master", icon: Users },
  ];

  const isActive = (path) => {
    if (path === "/lr-entry" && (location.pathname === "/" || location.pathname === "/lr-entry")) return true;
    return location.pathname.startsWith(path);
  };

  const isDropdownActive = dropdownItems.some((item) => isActive(item.path));

  // Close dropdown when user clicks outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Hide Navbar before login or on /login page
  if (!user || location.pathname === "/login") {
    return null;
  }

  return (
    <header className="bg-slate-900 text-white shadow-md sticky top-0 z-50 border-b border-amber-500/40 font-sans">
      
      {/* Top Info Bar */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 px-4 py-1 text-xs font-semibold flex justify-between items-center text-white">
        <div className="flex items-center space-x-3 overflow-hidden text-ellipsis whitespace-nowrap">
          <span>📍 8-A NATIONAL HIGHWAY, CHOTILA ROAD, WANKANER-363621 (GUJ.)</span>
          <span className="hidden md:inline">| GSTIN: 24DLTPS8567M1ZT</span>
        </div>
        <div className="flex items-center space-x-3 text-amber-100 shrink-0">
          <span className="flex items-center gap-1"><Phone size={12}/> +91 9979111555</span>
          <span className="hidden sm:inline-flex items-center gap-1"><ShieldCheck size={12}/> Goods Consignment Note</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo / Brand */}
          <Link to={isParty ? "/accounting" : "/"} className="flex items-center space-x-3 group">
            <div className="bg-white p-1 rounded-lg shadow-lg transform group-hover:scale-105 transition-transform flex items-center justify-center">
              <img src={logoImg} alt="Wolego Transport Logo" className="h-10 w-auto object-contain" />
            </div>
            <div>
              <div className="font-extrabold text-xl tracking-wider text-amber-400 font-serif leading-none flex items-center gap-2">
                WOLEGO TRANSPORT
              </div>
              <div className="text-[10px] uppercase tracking-widest text-slate-400 font-medium">
                Transport Contractor & Commission Agent
              </div>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-2">
            {/* Primary Nav Items */}
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                    active
                      ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                      : "text-slate-200 hover:bg-slate-800 hover:text-amber-400"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Dropdown Menu for Owner Only */}
            {isOwner && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onMouseEnter={() => setDropdownOpen(true)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                    isDropdownActive
                      ? "bg-amber-500 text-slate-950 shadow-md font-bold"
                      : "text-slate-200 hover:bg-slate-800 hover:text-amber-400"
                  }`}
                >
                  <FolderKanban className="w-4 h-4" />
                  <span>Reports & Master</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Card */}
                {dropdownOpen && (
                  <div
                    onMouseLeave={() => setDropdownOpen(false)}
                    className="absolute right-0 mt-1 w-56 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 divide-y divide-slate-700/50 animate-fadeIn"
                  >
                    {dropdownItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-2.5 text-sm font-medium transition-all ${
                            active
                              ? "bg-amber-500/20 text-amber-400 font-bold border-l-4 border-amber-400"
                              : "text-slate-200 hover:bg-slate-700 hover:text-amber-400"
                          }`}
                        >
                          <Icon className="w-4 h-4 text-amber-400" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Auth / User Status Badge & Logout */}
            <div className="pl-3 border-l border-slate-700 flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="bg-slate-800 border border-amber-500/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-400" />
                    <div className="text-xs">
                      <div className="font-extrabold text-amber-400 leading-none">
                        {isOwner ? "OWNER" : user.partyName || user.username}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono leading-tight">
                        {user.username}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition shadow"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Link>
              )}
            </div>
          </nav>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <button
                onClick={handleLogout}
                className="p-2 text-red-400 hover:bg-slate-800 rounded-lg"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-t border-slate-800 px-2 pt-2 pb-3 space-y-1 sm:px-3 shadow-2xl">
          
          {user && (
            <div className="px-3 py-2 bg-slate-800 rounded-lg mb-2 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-amber-400">
                  {isOwner ? "👑 OWNER ADMIN" : `🏢 ${user.partyName}`}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">Mobile: {user.username}</div>
              </div>
              <button
                onClick={handleLogout}
                className="text-xs text-red-400 font-bold bg-red-500/10 px-2.5 py-1 rounded"
              >
                Logout
              </button>
            </div>
          )}

          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium ${
                  active
                    ? "bg-amber-500 text-slate-950 font-bold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-amber-400"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {isOwner && (
            <div className="pt-2 border-t border-slate-800">
              <div className="px-3 text-xs font-bold uppercase text-amber-400 tracking-wider mb-1">
                Reports & Party Master
              </div>
              {dropdownItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-medium ${
                      active
                        ? "bg-amber-500/20 text-amber-400 font-bold border-l-2 border-amber-400"
                        : "text-slate-300 hover:bg-slate-800 hover:text-amber-400"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-amber-400" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
