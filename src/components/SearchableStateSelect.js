import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";

export const INDIAN_STATES = [
  { name: "ANDAMAN AND NICOBAR ISLANDS", code: "35" },
  { name: "ANDHRA PRADESH", code: "37" },
  { name: "ARUNACHAL PRADESH", code: "12" },
  { name: "ASSAM", code: "18" },
  { name: "BIHAR", code: "10" },
  { name: "CHANDIGARH", code: "04" },
  { name: "CHHATTISGARH", code: "22" },
  { name: "DADRA AND NAGAR HAVELI AND DAMAN AND DIU", code: "26" },
  { name: "DELHI", code: "07" },
  { name: "GOA", code: "30" },
  { name: "GUJARAT", code: "24" },
  { name: "HARYANA", code: "06" },
  { name: "HIMACHAL PRADESH", code: "02" },
  { name: "JAMMU AND KASHMIR", code: "01" },
  { name: "JHARKHAND", code: "20" },
  { name: "KARNATAKA", code: "29" },
  { name: "KERALA", code: "32" },
  { name: "LADAKH", code: "38" },
  { name: "LAKSHADWEEP", code: "31" },
  { name: "MADHYA PRADESH", code: "23" },
  { name: "MAHARASHTRA", code: "27" },
  { name: "MANIPUR", code: "14" },
  { name: "MEGHALAYA", code: "17" },
  { name: "MIZORAM", code: "15" },
  { name: "NAGALAND", code: "13" },
  { name: "ODISHA", code: "21" },
  { name: "PUDUCHERRY", code: "34" },
  { name: "PUNJAB", code: "03" },
  { name: "RAJASTHAN", code: "08" },
  { name: "SIKKIM", code: "11" },
  { name: "TAMIL NADU", code: "33" },
  { name: "TELANGANA", code: "36" },
  { name: "TRIPURA", code: "16" },
  { name: "UTTAR PRADESH", code: "09" },
  { name: "UTTARAKHAND", code: "05" },
  { name: "WEST BENGAL", code: "19" },
];

export const getStateCode = (stateName) => {
  if (!stateName || !stateName.trim()) return "";
  const upper = stateName.trim().toUpperCase();
  const match = INDIAN_STATES.find(
    (s) => s.name === upper || s.name.replace(/\s+/g, "") === upper.replace(/\s+/g, "")
  );
  return match ? match.code : "";
};

export default function SearchableStateSelect({
  value = "",
  onChange,
  placeholder = "STATE",
  className = "w-full bg-white text-slate-900 font-bold px-2 py-0.5 text-xs border border-sky-300 rounded focus:outline-none",
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredStates = INDIAN_STATES.filter((s) => {
    if (!searchTerm) return true;
    const query = searchTerm.trim().toUpperCase();
    return s.name.includes(query) || s.code.includes(query);
  });

  // Whenever searchTerm changes, reset highlighted index to 0
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchTerm]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (isOpen && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  }, [highlightedIndex, isOpen]);

  const focusNextInput = () => {
    if (!inputRef.current) return;
    const form = inputRef.current.form;
    if (!form) return;
    const focusable = Array.from(
      form.querySelectorAll(
        "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])"
      )
    ).filter(
      (el) => el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0
    );

    const index = focusable.indexOf(inputRef.current);
    if (index > -1 && index < focusable.length - 1) {
      focusable[index + 1].focus();
    }
  };

  const handleSelectState = (stateObj) => {
    setSearchTerm(stateObj.name);
    setIsOpen(false);
    if (onChange) {
      onChange(stateObj.name, stateObj.code);
    }
  };

  const handleInputChange = (e) => {
    const newVal = e.target.value.toUpperCase();
    setSearchTerm(newVal);
    setIsOpen(true);
    const code = getStateCode(newVal);
    if (onChange) {
      onChange(newVal, code);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex((prev) =>
          filteredStates.length === 0 ? 0 : (prev + 1) % filteredStates.length
        );
      }
    } else if (e.key === "ArrowUp") {
      if (isOpen) {
        e.preventDefault();
        e.stopPropagation();
        setHighlightedIndex((prev) =>
          filteredStates.length === 0
            ? 0
            : (prev - 1 + filteredStates.length) % filteredStates.length
        );
      }
    } else if (e.key === "Enter") {
      if (isOpen && filteredStates.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredStates.length) {
        e.preventDefault();
        e.stopPropagation();
        const selected = filteredStates[highlightedIndex];
        handleSelectState(selected);
        setTimeout(focusNextInput, 50);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    } else if (e.key === "Tab") {
      if (isOpen && filteredStates.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredStates.length) {
        const selected = filteredStates[highlightedIndex];
        handleSelectState(selected);
      }
      setIsOpen(false);
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onFocus={() => setIsOpen(true)}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={className}
        />
        {searchTerm ? (
          <X
            size={14}
            onClick={(e) => {
              e.stopPropagation();
              setSearchTerm("");
              if (onChange) onChange("", "");
            }}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-rose-600 cursor-pointer z-10"
          />
        ) : (
          <ChevronDown
            size={14}
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-500 cursor-pointer hover:text-slate-900 z-10"
          />
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-slate-900 border-2 border-yellow-400 rounded-md shadow-2xl z-50 max-h-48 overflow-y-auto divide-y divide-slate-800">
          {filteredStates.length > 0 ? (
            filteredStates.map((st, idx) => {
              const isSelected = searchTerm && searchTerm.toUpperCase() === st.name;
              const isHighlighted = idx === highlightedIndex;
              return (
                <div
                  key={st.code + st.name}
                  ref={(el) => (itemRefs.current[idx] = el)}
                  onClick={() => {
                    handleSelectState(st);
                    setTimeout(focusNextInput, 50);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`px-2.5 py-1.5 cursor-pointer text-xs flex justify-between items-center transition-colors ${
                    isHighlighted
                      ? "bg-amber-400 text-slate-950 font-black border-l-4 border-amber-600"
                      : isSelected
                      ? "bg-sky-900 text-yellow-300 font-black border-l-4 border-yellow-400"
                      : "text-slate-100 hover:bg-slate-800 hover:text-yellow-300"
                  }`}
                >
                  <span className="font-bold">{st.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                      isHighlighted ? "bg-slate-900/30 text-slate-950" : "bg-yellow-400/20 text-yellow-300"
                    }`}
                  >
                    Code: {st.code}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-2 text-center text-xs text-slate-400 italic">
              No matching state found
            </div>
          )}
        </div>
      )}
    </div>
  );
}

