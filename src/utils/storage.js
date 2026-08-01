import { API_BASE_URL } from "../config/api";

let partiesCache = [];
let lrCache = [];
let trucksCache = [];

// Fetch all Parties directly from MySQL Database API
export const fetchPartiesFromDB = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/parties`);
    if (res.ok) {
      const data = await res.json();
      partiesCache = data || [];
      return partiesCache;
    }
  } catch (err) {
    console.error("Backend MySQL API Error (Parties):", err.message);
  }
  return partiesCache;
};

// Helper to sort LRs numerically by LR Number
export const sortLRsByNumber = (lrs, ascending = true) => {
  if (!lrs || !Array.isArray(lrs)) return [];
  return [...lrs].sort((a, b) => {
    const numA = parseInt(a.lrNumber, 10);
    const numB = parseInt(b.lrNumber, 10);
    if (!isNaN(numA) && !isNaN(numB)) {
      return ascending ? numA - numB : numB - numA;
    }
    const strA = String(a.lrNumber || "");
    const strB = String(b.lrNumber || "");
    return ascending
      ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: "base" })
      : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: "base" });
  });
};

// Fetch all LRs directly from MySQL Database API
export const fetchLREntriesFromDB = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/lr-entries`);
    if (res.ok) {
      const data = await res.json();
      lrCache = sortLRsByNumber(data || []);
      return lrCache;
    }
  } catch (err) {
    console.error("Backend MySQL API Error (LR Entries):", err.message);
  }
  return lrCache;
};

// Fetch all Trucks directly from MySQL Database API
export const fetchTrucksFromDB = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/trucks`);
    if (res.ok) {
      const data = await res.json();
      trucksCache = data || [];
      return trucksCache;
    }
  } catch (err) {
    console.error("Backend MySQL API Error (Trucks):", err.message);
  }
  return trucksCache;
};

// Synchronous getters
export const getParties = () => partiesCache;
export const getLREntries = () => lrCache;
export const getTrucks = () => trucksCache;

// Save or Update Truck in MySQL Database API
export const saveTruck = async (truckData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/trucks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(truckData),
    });
    if (res.ok) {
      return await fetchTrucksFromDB();
    }
  } catch (err) {
    console.error("Save Truck MySQL API Error:", err);
  }
  return trucksCache;
};

// Delete Truck from MySQL Database API
export const deleteTruck = async (truckId) => {
  try {
    await fetch(`${API_BASE_URL}/trucks/${truckId}`, { method: "DELETE" });
    return await fetchTrucksFromDB();
  } catch (err) {
    console.error("Delete Truck MySQL API Error:", err);
  }
  return trucksCache;
};

// Save or Update Party in MySQL Database API
export const saveParty = async (partyData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/parties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partyData),
    });
    if (res.ok) {
      return await fetchPartiesFromDB(); // Reload fresh list from MySQL
    }
  } catch (err) {
    console.error("Save Party MySQL API Error:", err);
  }
  return partiesCache;
};

// Save or Update LR directly in MySQL Database API
export const saveLREntry = async (lrData) => {
  const dataToSave = { ...lrData };
  if (!dataToSave.id) {
    dataToSave.id = "LR-" + (dataToSave.lrNumber || Date.now().toString().slice(-4));
  }

  try {
    const res = await fetch(`${API_BASE_URL}/lr-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSave),
    });
    if (res.ok) {
      const apiRes = await res.json();
      await fetchLREntriesFromDB(); // Reload fresh list from MySQL DB
      if (apiRes && apiRes.lr) {
        return apiRes.lr;
      }
    }
  } catch (err) {
    console.error("Save LR MySQL API Error:", err);
  }
  return dataToSave;
};

// Delete Party from MySQL Database API
export const deleteParty = async (partyId) => {
  try {
    await fetch(`${API_BASE_URL}/parties/${partyId}`, { method: "DELETE" });
    return await fetchPartiesFromDB();
  } catch (err) {
    console.error("Delete Party MySQL API Error:", err);
  }
  return partiesCache;
};

// Delete LR directly from MySQL Database API
export const deleteLREntry = async (id) => {
  try {
    await fetch(`${API_BASE_URL}/lr-entries/${id}`, { method: "DELETE" });
    return await fetchLREntriesFromDB();
  } catch (err) {
    console.error("Delete LR MySQL API Error:", err);
  }
  return lrCache;
};

// Safe Local Date Parser (Prevents UTC timezone rollback e.g. 2027-04-01 turning into 2027-03-31)
export const parseLocalDate = (dateInput) => {
  if (!dateInput) return new Date();
  if (dateInput instanceof Date) return dateInput;

  if (typeof dateInput === "string") {
    const cleanStr = dateInput.split("T")[0];
    const match = cleanStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) {
      const [, y, m, d] = match;
      return new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    }
  }
  const d = new Date(dateInput);
  return isNaN(d.getTime()) ? new Date() : d;
};

// Robust Date Formatter (DD/MM/YYYY)
export const formatDateDisplay = (dateVal) => {
  if (!dateVal) return "-";
  if (typeof dateVal === "string") {
    const cleanStr = dateVal.split("T")[0];
    if (cleanStr.includes("-")) {
      const parts = cleanStr.split("-");
      if (parts.length === 3) {
        const [y, m, d] = parts;
        return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
      }
    }
  }
  const d = parseLocalDate(dateVal);
  return isNaN(d.getTime()) ? "-" : `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
};

// Financial Year Helper (1 April to 31 March)
export const getFinancialYear = (dateInput) => {
  const d = parseLocalDate(dateInput);

  const year = d.getFullYear();
  const month = d.getMonth(); // 0-indexed: Jan=0, Feb=1, Mar=2, Apr=3...

  let startYear, endYear;
  if (month >= 3) {
    // April 1st to Dec 31st
    startYear = year;
    endYear = year + 1;
  } else {
    // Jan 1st to March 31st
    startYear = year - 1;
    endYear = year;
  }

  const label = `${startYear}-${String(endYear).slice(-2)}`; // e.g. "2026-27"
  const fullLabel = `${startYear}-${endYear}`; // e.g. "2026-2027"

  return {
    startYear,
    endYear,
    label,
    fullLabel,
  };
};

// Get Next LR Number for specific Financial Year (starts at 0001 on 1 April)
export const getNextLRNumber = (targetDate) => {
  const lrs = lrCache;
  const targetFY = getFinancialYear(targetDate || new Date());

  // Filter LRs that belong to target financial year
  const fyLrs = (lrs || []).filter((item) => {
    if (!item.dateTime) return false;
    return getFinancialYear(item.dateTime).label === targetFY.label;
  });

  if (!fyLrs || fyLrs.length === 0) {
    return "0001";
  }

  const numArr = fyLrs
    .map((item) => parseInt(item.lrNumber, 10))
    .filter((n) => !isNaN(n));

  if (numArr.length === 0) {
    return "0001";
  }

  const maxNum = Math.max(...numArr);
  const nextNum = maxNum + 1;
  return String(nextNum).padStart(4, "0");
};

export const clearLocalStorage = () => {
  localStorage.clear();
};
