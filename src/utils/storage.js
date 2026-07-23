// Local Storage persistence engine for Wolego Transport

const PARTIES_STORAGE_KEY = "wolego_parties";
const LRS_STORAGE_KEY = "wolego_lr_entries";

// Default Initial Seed Data based on uploaded images
const INITIAL_PARTIES = [
  {
    id: "PARTY-101",
    partyName: "ALIEN PORCELANO LLP",
    address1: "PIPLI-JETPAR ROAD, NEAR BELA",
    address2: "AT. RANGPAR",
    address3: "MORBI-363642 (GUJARAT)",
    city: "MORBI",
    district: "MORBI",
    state: "GUJARAT",
    stateCode: "24",
    gstNo: "24ACCFB3501E1Z8",
    panNo: "ACCFB3501E",
    contactName: "Bhavik Bhai",
    mobileNos: "09979111555",
    selectType: "CONSIGNOR", // CONSIGNOR / CONSIGNEE / BOTH
  },
  {
    id: "PARTY-102",
    partyName: "DREAM TILES WORLD",
    address1: "H.NO. 3 9 110 SY NO.86,87&89,",
    address2: "SRI RAM NAGAR, MANSOORABAD,",
    address3: "HYDERABAD-500068 (TELANGANA)",
    city: "HYDERABAD",
    district: "HYDERABAD",
    state: "TELANGANA",
    stateCode: "36",
    gstNo: "36ATXPB1649L1Z5",
    panNo: "ATXPB1649L",
    contactName: "Rajesh Kumar",
    mobileNos: "08885051118",
    selectType: "CONSIGNEE",
  },
  {
    id: "PARTY-103",
    partyName: "SAI MARKETING",
    address1: "H NO. 8 7 21/12/2, SY NO.17 18,",
    address2: "NEAR HP GAS, OLD BOWENPALLY,",
    address3: "HYDERABAD-500011 (TELANGANA)",
    city: "HYDERABAD",
    district: "HYDERABAD",
    state: "TELANGANA",
    stateCode: "36",
    gstNo: "36ACUFS3612G1ZV",
    panNo: "ACUFS3612G",
    contactName: "Srinivas Rao",
    mobileNos: "09849012345",
    selectType: "CONSIGNEE",
  }
];

const INITIAL_LRS = [
  {
    id: "LR-4380",
    lrNumber: "4380",
    copyData: "N",
    fromPlace: "MORBI",
    toPlace: "HYDERABAD",
    deliveryAt: "DOOR",
    truckNo: "GJ-36-V-8975",
    dateTime: "2025-12-09T10:30",
    
    // Consignor details
    consignorName: "ALIEN PORCELANO LLP",
    consignorAddress: "PIPLI-JETPAR ROAD, NEAR BELA, AT. RANGPAR, MORBI-363642 (GUJARAT)",
    consignorGst: "24ACCFB3501E1Z8",
    saveConsignorInMaster: "N",

    // Consignee details
    consigneeName: "SAI MARKETING",
    consigneeAddress: "H NO. 8 7 21/12/2, SY NO.17 18, NEAR HP GAS, OLD BOWENPALLY, HYDERABAD-500011 (TELANGANA)",
    consigneeGst: "36ACUFS3612G1ZV",
    saveConsigneeInMaster: "N",

    // Goods particulars
    noOfArticles: "1267",
    bundles: "BOX",
    descriptionOfGoods: "CERAMIC TILES+",
    weightKgs: "35530",
    ratePerTon: "1250",
    rateType: "P.M.T.",
    toPayOrPaid: "TO-PAY",
    freightAmount: 44413,

    // GST & Charges
    gstPayableBy: "CONSIGNEE", // CONSIGNEE / CONSIGNOR / TRANSPORTER
    sgstPercent: 2.5,
    sgstAmount: 0,
    cgstPercent: 2.5,
    cgstAmount: 0,
    igstPercent: 5.0,
    igstAmount: 0,
    totalWithGst: 44413,
    otherCharges: 0,
    lessAdvancePaid: 0,
    chequeYn: "N",
    netTotalAmount: 44413,

    // Meta details
    billNumbers: "5521",
    invoiceValue: "325239",
    driverName: "Ramesh Singh",
    licenseNumber: "GJ362021004921",
    driverMobile: "9879512345",
    consignorEwayBill: "682018313118",
    consigneeEwayBill: "",
    remarks: "WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE. FULL TRUCK LOAD ACCEPTED ALL OVER INDIA.",
    debitAmountTo: "CONSIGNEE",
    createdAt: new Date().toISOString()
  }
];

export const getParties = () => {
  const data = localStorage.getItem(PARTIES_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(PARTIES_STORAGE_KEY, JSON.stringify(INITIAL_PARTIES));
    return INITIAL_PARTIES;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_PARTIES;
  }
};

export const saveParty = (partyData) => {
  const parties = getParties();
  let updated;
  if (partyData.id) {
    updated = parties.map((p) => (p.id === partyData.id ? { ...p, ...partyData } : p));
  } else {
    const newId = "PARTY-" + Date.now().toString().slice(-4);
    updated = [...parties, { ...partyData, id: newId }];
  }
  localStorage.setItem(PARTIES_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const deleteParty = (partyId) => {
  const parties = getParties();
  const updated = parties.filter((p) => p.id !== partyId);
  localStorage.setItem(PARTIES_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};

export const getLREntries = () => {
  const data = localStorage.getItem(LRS_STORAGE_KEY);
  if (!data) {
    localStorage.setItem(LRS_STORAGE_KEY, JSON.stringify(INITIAL_LRS));
    return INITIAL_LRS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return INITIAL_LRS;
  }
};

export const getNextLRNumber = () => {
  const lrs = getLREntries();
  if (!lrs || lrs.length === 0) return "1001";
  const numArr = lrs.map((item) => parseInt(item.lrNumber, 10)).filter((n) => !isNaN(n));
  if (numArr.length === 0) return "1001";
  const maxNum = Math.max(...numArr);
  return (maxNum + 1).toString();
};

export const saveLREntry = (lrData) => {
  const lrs = getLREntries();
  let updated;
  let savedRecord;

  if (lrData.id) {
    savedRecord = { ...lrData };
    updated = lrs.map((item) => (item.id === lrData.id ? savedRecord : item));
  } else {
    const newId = "LR-" + (lrData.lrNumber || Date.now().toString().slice(-4));
    savedRecord = { ...lrData, id: newId, createdAt: new Date().toISOString() };
    updated = [savedRecord, ...lrs];
  }

  // Also auto save party to master if requested
  if (lrData.saveConsignorInMaster === "Y" && lrData.consignorName) {
    const parties = getParties();
    if (!parties.find((p) => p.partyName.trim().toLowerCase() === lrData.consignorName.trim().toLowerCase())) {
      saveParty({
        partyName: lrData.consignorName,
        address1: lrData.consignorAddress || "",
        gstNo: lrData.consignorGst || "",
        selectType: "CONSIGNOR"
      });
    }
  }

  if (lrData.saveConsigneeInMaster === "Y" && lrData.consigneeName) {
    const parties = getParties();
    if (!parties.find((p) => p.partyName.trim().toLowerCase() === lrData.consigneeName.trim().toLowerCase())) {
      saveParty({
        partyName: lrData.consigneeName,
        address1: lrData.consigneeAddress || "",
        gstNo: lrData.consigneeGst || "",
        selectType: "CONSIGNEE"
      });
    }
  }

  localStorage.setItem(LRS_STORAGE_KEY, JSON.stringify(updated));
  return savedRecord;
};

export const deleteLREntry = (id) => {
  const lrs = getLREntries();
  const updated = lrs.filter((item) => item.id !== id);
  localStorage.setItem(LRS_STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
