// MySQL API Database Persistence Engine for Wolego Transport

const API_BASE_URL = "http://localhost:8002/api";

let partiesCache = [];
let lrCache = [];

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
    console.warn("Backend MySQL API offline:", err.message);
  }
  return partiesCache;
};

// Fetch all LRs directly from MySQL Database API
export const fetchLREntriesFromDB = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/lr-entries`);
    if (res.ok) {
      const data = await res.json();
      lrCache = data || [];
      return lrCache;
    }
  } catch (err) {
    console.warn("Backend MySQL API offline:", err.message);
  }
  return lrCache;
};

// Synchronous getters (returns currently loaded cache)
export const getParties = () => partiesCache;
export const getLREntries = () => lrCache;

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
    console.error("Save Party MySQL API error:", err);
  }
  
  // Fallback cache update if API fails
  if (partyData.id) {
    partiesCache = partiesCache.map((p) => (p.id === partyData.id ? { ...p, ...partyData } : p));
  } else {
    const newId = "PARTY-" + Date.now().toString().slice(-4);
    partiesCache = [{ ...partyData, id: newId }, ...partiesCache];
  }
  return partiesCache;
};

// Save or Update LR in MySQL Database API
export const saveLREntry = async (lrData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/lr-entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lrData),
    });
    if (res.ok) {
      await fetchLREntriesFromDB(); // Reload fresh list from MySQL
    }
  } catch (err) {
    console.error("Save LR MySQL API error:", err);
  }
  return lrData;
};

// Delete Party from MySQL Database API
export const deleteParty = async (partyId) => {
  try {
    await fetch(`${API_BASE_URL}/parties/${partyId}`, { method: "DELETE" });
    return await fetchPartiesFromDB();
  } catch (err) {
    partiesCache = partiesCache.filter((p) => p.id !== partyId);
  }
  return partiesCache;
};

// Delete LR from MySQL Database API
export const deleteLREntry = async (id) => {
  try {
    await fetch(`${API_BASE_URL}/lr-entries/${id}`, { method: "DELETE" });
    return await fetchLREntriesFromDB();
  } catch (err) {
    lrCache = lrCache.filter((item) => item.id !== id);
  }
  return lrCache;
};

// Get Next LR Number
export const getNextLRNumber = () => {
  const lrs = lrCache;
  if (!lrs || lrs.length === 0) return "1001";
  const numArr = lrs.map((item) => parseInt(item.lrNumber, 10)).filter((n) => !isNaN(n));
  if (numArr.length === 0) return "1001";
  const maxNum = Math.max(...numArr);
  return (maxNum + 1).toString();
};

export const clearLocalStorage = () => {
  localStorage.clear();
};
