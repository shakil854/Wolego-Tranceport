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
        const dayStr = String(parseInt(d, 10)).padStart(2, "0");
        const monthStr = String(parseInt(m, 10)).padStart(2, "0");
        return `${dayStr}/${monthStr}/${y}`;
      }
    }
  }
  const d = parseLocalDate(dateVal);
  if (isNaN(d.getTime())) return "-";
  const dayStr = String(d.getDate()).padStart(2, "0");
  const monthStr = String(d.getMonth() + 1).padStart(2, "0");
  return `${dayStr}/${monthStr}/${d.getFullYear()}`;
};

// Format Date for Input Field (YYYY-MM-DD)
export const formatDateForInput = (dateVal) => {
  const d = parseLocalDate(dateVal);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
export const getNextLRNumber = (targetDate, lrs = []) => {
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

// Currency Formatter
export const formatCurrency = (val) => {
  const num = parseFloat(val) || 0;
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};
