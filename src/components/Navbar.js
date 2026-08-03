import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChangePasswordModal from "./ChangePasswordModal";
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
  Key,
  LayoutDashboard,
  Bell,
} from "lucide-react";
import logoImg from "../assets/logo.png";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isOwner, isParty, isTruck } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Primary Navigation Items for Owner
  const ownerPrimaryItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "L/R Entry", path: "/lr-entry", icon: Truck },
    { name: "LR Records", path: "/lr-list", icon: FileText },
    { name: "Freight Receipt", path: "/freight-receipt", icon: Receipt },
  ];

  // Primary Navigation Items for Party
  const partyPrimaryItems = [
    { name: "My Accounting", path: "/accounting", icon: Calculator },
    { name: "My LR Records", path: "/party-lr-records", icon: FileText },
  ];

  // Primary Navigation Items for Truck Owner
  const truckPrimaryItems = [
    { name: "My Truck Accounting", path: "/truck-accounting", icon: Truck },
  ];

  const primaryItems = isTruck ? truckPrimaryItems : isParty ? partyPrimaryItems : ownerPrimaryItems;

  // Dropdown Items (Owner only)
  const dropdownItems = [
    { name: "Daily Report", path: "/daily-report", icon: FileText },
    { name: "Accounting", path: "/accounting", icon: Calculator },
    { name: "Party LR Records", path: "/party-lr-records", icon: FileText },
    { name: "Range LR Print", path: "/range-lr-print", icon: Printer },
    { name: "Party Statement", path: "/party-statement", icon: FileSpreadsheet },
    { name: "CA Excel", path: "/ca-excel", icon: FileSpreadsheet },
    { name: "Party Master", path: "/party-master", icon: Users },
    { name: "Truck Master", path: "/truck-master", icon: Truck },
    { name: "Letter Pad", path: "/letter-pad", icon: FileText },
    { name: "Truck Debit", path: "/truck-payments", icon: Truck },
    { name: "Payment Alerts", path: "/payment-alerts", icon: Bell },
    { name: "Truck Coming", path: "/truck-coming", icon: Truck },
  ];

  const isActive = (path) => {
    if (path === "/dashboard" && (location.pathname === "/" || location.pathname === "/dashboard")) return true;
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
    <header className="bg-white text-slate-900 shadow-md sticky top-0 z-50 border-b border-slate-200 font-sans">

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">

          {/* Logo / Brand */}
          <Link to={isParty ? "/accounting" : isTruck ? "/truck-accounting" : "/"} className="flex items-center space-x-2.5 shrink-0 group">
            {/* Crown & W Logo (Enlarged & Bottom Text Cropped Out) */}
            <div className="h-9 sm:h-11 w-9 sm:w-11 overflow-hidden flex items-start justify-center shrink-0">
              <img
                src={logoImg}
                alt="Wolego Transport Logo"
                className="h-12 sm:h-14 w-auto object-cover object-top transform group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="flex flex-col justify-center items-center text-center">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#009a44] font-serif leading-none whitespace-nowrap">
                WOLEGO TRANSPORT
              </span>
              <span className="text-[9px] sm:text-[10px] font-black italic tracking-widest text-[#0072bc] uppercase leading-tight font-serif whitespace-nowrap mt-0.5 text-center w-full">
                EVERYTHING IS FAST
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {/* Primary Nav Items */}
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${active
                      ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                      : "text-slate-700 hover:bg-slate-100 hover:text-amber-600"
                    }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{item.name}</span>
                </Link>
              );
            })}

            {/* Dropdown Menu for Owner Only */}
            {isOwner && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  onMouseEnter={() => setDropdownOpen(true)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${isDropdownActive
                      ? "bg-amber-500 text-slate-950 shadow-md font-extrabold"
                      : "text-slate-700 hover:bg-slate-100 hover:text-amber-600"
                    }`}
                >
                  <FolderKanban className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">Reports & Master</span>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>

                {/* Dropdown Card */}
                {dropdownOpen && (
                  <div
                    onMouseLeave={() => setDropdownOpen(false)}
                    className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl py-2 z-50 divide-y divide-slate-100 animate-fadeIn"
                  >
                    {dropdownItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.path);
                      return (
                        <Link
                          key={item.name}
                          to={item.path}
                          onClick={() => setDropdownOpen(false)}
                          className={`flex items-center space-x-3 px-4 py-2.5 text-sm font-semibold transition-all ${active
                              ? "bg-amber-50 text-amber-800 font-extrabold border-l-4 border-amber-500"
                              : "text-slate-700 hover:bg-slate-100 hover:text-amber-600"
                            }`}
                        >
                          <Icon className="w-4 h-4 text-amber-600" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Auth / User Status Badge & Change Password & Logout */}
            <div className="pl-3 border-l border-slate-200 flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="bg-slate-100 border border-slate-300 px-3 py-1 rounded-xl flex items-center gap-2">
                    <User className="w-4 h-4 text-amber-600" />
                    <div className="text-xs">
                      <div className="font-extrabold text-amber-700 leading-none">
                        {isOwner ? "OWNER" : isTruck ? "TRUCK OWNER" : user.partyName || user.username}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono font-medium leading-tight">
                        {user.username}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsChangePasswordOpen(true)}
                    title="Change Password (पासवर्ड बदलें)"
                    className="p-2 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-xl transition cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <Key className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-200 rounded-xl transition cursor-pointer"
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
          <div className="md:hidden flex items-center gap-1 shrink-0">
            {user && (
              <>
                <button
                  onClick={() => setIsChangePasswordOpen(true)}
                  className="p-1.5 text-amber-700 hover:bg-amber-100 rounded-lg bg-amber-50 border border-amber-200"
                  title="Change Password"
                >
                  <Key className="w-4 h-4" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-rose-600 hover:bg-rose-100 rounded-lg bg-rose-50 border border-rose-200"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 rounded-md text-slate-700 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 px-2 pt-2 pb-3 space-y-1 sm:px-3 shadow-2xl">

          {user && (
            <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg mb-2 flex justify-between items-center">
              <div>
                <div className="text-xs font-bold text-amber-700">
                  {isOwner ? "👑 OWNER ADMIN" : `🏢 ${user.partyName}`}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">Mobile: {user.username}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsChangePasswordOpen(true);
                  }}
                  className="text-xs text-amber-800 font-bold bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded flex items-center gap-1 border border-amber-300"
                >
                  <Key size={13} /> Password
                </button>
                <button
                  onClick={handleLogout}
                  className="text-xs text-rose-700 font-bold bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded border border-rose-200"
                >
                  Logout
                </button>
              </div>
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
                className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-bold ${active
                    ? "bg-amber-500 text-slate-950 font-extrabold"
                    : "text-slate-700 hover:bg-slate-100 hover:text-amber-600"
                  }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {isOwner && (
            <div className="pt-2 border-t border-slate-200">
              <div className="px-3 text-xs font-bold uppercase text-amber-700 tracking-wider mb-1">
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
                    className={`flex items-center space-x-3 px-3 py-2.5 rounded-md text-sm font-semibold ${active
                        ? "bg-amber-50 text-amber-800 font-extrabold border-l-4 border-amber-500"
                        : "text-slate-700 hover:bg-slate-100 hover:text-amber-600"
                      }`}
                  >
                    <Icon className="w-4 h-4 text-amber-600" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onClose={() => setIsChangePasswordOpen(false)}
        user={user}
      />
    </header>
  );
}

