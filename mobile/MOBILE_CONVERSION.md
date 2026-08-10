# 📱 Wolego Transport Mobile Conversion Checklist

This checklist tracks 100% feature parity between the existing Wolego Transport React Web Application (`src/`) and the React Native + Expo Mobile Application (`mobile/`).

---

## 🔐 1. Authentication, Security & Roles
| Feature | Web Location | API Endpoint | Mobile Location | Status |
|---|---|---|---|---|
| User Login (Owner/Party/Truck) | `src/pages/LoginPage.js` | `POST /api/auth/login` | `mobile/src/screens/auth/LoginScreen.js` | ✅ DONE |
| Session Persistence | `src/context/AuthContext.js` | AsyncStorage | `mobile/src/context/AuthContext.js` | ✅ DONE |
| Role Auto-Detection | `src/App.js` | Role routing | `mobile/src/navigation/AppNavigator.js` | ✅ DONE |
| Change Login Password | `src/components/ChangePasswordModal.js` | `POST /api/auth/change-password` | `mobile/src/components/ChangePasswordModal.js` | ✅ DONE |
| Change Security Action Password | `src/components/ChangeActionPasswordModal.js` | `POST /api/auth/change-action-password` | `mobile/src/components/ChangePasswordModal.js` | ✅ DONE |
| Security Action Password Verification Prompt | `src/components/PasswordConfirmModal.js` | `POST /api/auth/verify-password` | `mobile/src/components/PasswordConfirmModal.js` | ✅ DONE |

---

## 📊 2. Owner Dashboard
| Feature | Web Location | API Endpoint | Mobile Location | Status |
|---|---|---|---|---|
| Summary KPI Cards (Billed, Paid, Remaining, LRs, Active Parties/Trucks) | `src/pages/DashboardPage.js` | `/parties`, `/trucks`, `/lr-entries` | `mobile/src/screens/owner/DashboardScreen.js` | ✅ DONE |
| Financial Year Filter (e.g. 2024-25, 2025-26, ALL) | `src/pages/DashboardPage.js` | Local calculation | `mobile/src/screens/owner/DashboardScreen.js` | ✅ DONE |
| Quick Action Tiles (New LR, Masters, Reports, Statements, Alerts) | `src/pages/DashboardPage.js` | Nav state | `mobile/src/screens/owner/DashboardScreen.js` | ✅ DONE |

---

## 📑 3. LR Management & Entry Engine
| Feature | Web Location | API Endpoint | Mobile Location | Status |
|---|---|---|---|---|
| Financial Year Next LR No Generator (0001 start) | `src/utils/storage.js` | Local FY calculation | `mobile/src/utils/dateUtils.js` | ✅ DONE |
| LR Entry Form (Party Select, Goods, Weight, Rate, GST, Freight) | `src/pages/LREntryForm.js` | `POST /api/lr-entries` | `mobile/src/screens/owner/LREntryScreen.js` | ✅ DONE |
| GST Calculations (SGST 2.5%, CGST 2.5%, IGST 5%, Total with GST) | `src/pages/LREntryForm.js` | Local math | `mobile/src/screens/owner/LREntryScreen.js` | ✅ DONE |
| E-Way Bills, Invoice Value, Remarks, Insurance, Digital Sign | `src/pages/LREntryForm.js` | `POST /api/lr-entries` | `mobile/src/screens/owner/LREntryScreen.js` | ✅ DONE |
| LR Records List (Search, Filter by FY/Date/Status, Pagination) | `src/pages/LRList.js` | `GET /api/lr-entries` | `mobile/src/screens/owner/LRListScreen.js` | ✅ DONE |
| LR Edit with Action Password Prompt | `src/pages/LRList.js` | `POST /api/lr-entries` | `mobile/src/screens/owner/LRListScreen.js` | ✅ DONE |
| LR Delete with Action Password Prompt | `src/pages/LRList.js` | `DELETE /api/lr-entries/:id` | `mobile/src/screens/owner/LRListScreen.js` | ✅ DONE |
| Quick Update Party Payment Status (Paid/Pending/Amount/Date/Cheque) | `src/pages/LRList.js` | `PUT /api/lr-entries/:id/payment-status` | `mobile/src/screens/owner/LRListScreen.js` | ✅ DONE |
| Quick Update Truck Payment Status | `src/pages/LRList.js` | `PUT /api/lr-entries/:id/payment-status` | `mobile/src/screens/owner/LRListScreen.js` | ✅ DONE |

---

## 🖨️ 4. PDF, Native Printing & Sharing Engine
| Feature | Web Location | API / Native Library | Mobile Location | Status |
|---|---|---|---|---|
| A4 LR PDF Generation | `src/components/LRPrintDocument.js` | `POST /api/lr/generate-pdf` & `expo-print` | `mobile/src/utils/pdfGenerator.js` | ✅ DONE |
| Device Native A4 Printing | `window.print()` | `expo-print` | `mobile/src/utils/pdfGenerator.js` | ✅ DONE |
| PDF Export & Local Storage Save | Browser Download | `expo-file-system` | `mobile/src/utils/pdfGenerator.js` | ✅ DONE |
| Direct WhatsApp PDF Sharing | `navigator.share` / Web link | `expo-sharing` & WhatsApp deep link | `mobile/src/utils/shareUtils.js` | ✅ DONE |

---

## 👥 5. Party & Truck Masters
| Feature | Web Location | API Endpoint | Mobile Location | Status |
|---|---|---|---|---|
| Party Master (Search, Create, Edit, Delete, Mobile Nos, GST) | `src/pages/PartyMaster.js` | `/api/parties` | `mobile/src/screens/owner/PartyMasterScreen.js` | ✅ DONE |
| Truck Master (Search, Create, Edit, Delete, Driver, Mobile, Capacity) | `src/pages/TruckMaster.js` | `/api/trucks` | `mobile/src/screens/owner/TruckMasterScreen.js` | ✅ DONE |

---

## 💰 6. Financial Reports & Management
| Feature | Web Location | API Endpoint | Mobile Location | Status |
|---|---|---|---|---|
| Freight Receipt Generator & Print/PDF | `src/pages/FreightReceipt.js` | `/api/lr-entries` | `mobile/src/screens/owner/FreightReceiptScreen.js` | ✅ DONE |
| Party Statement (Billed, Paid, Remaining Ledger, Print/PDF) | `src/pages/PartyStatement.js` | `/api/parties`, `/api/lr-entries` | `mobile/src/screens/owner/PartyStatementScreen.js` | ✅ DONE |
| Daily Dispatch Report (Total Weight, Freight, Print/PDF) | `src/pages/DailyReport.js` | `/api/lr-entries` | `mobile/src/screens/owner/DailyReportScreen.js` | ✅ DONE |
| CA Excel / CSV Export | `src/pages/CAExcelExport.js` | `/api/lr-entries` | `mobile/src/screens/owner/CAExcelExportScreen.js` | ✅ DONE |
| Range LR Print (Bulk Multi-LR PDF/Print) | `src/pages/BulkLRPrintPage.js` | `/api/lr-entries` | `mobile/src/screens/owner/BulkLRPrintScreen.js` | ✅ DONE |
| Letter Pad Builder (Custom Body, Print/PDF) | `src/pages/LetterPadPage.js` | Local storage | `mobile/src/screens/owner/LetterPadScreen.js` | ✅ DONE |
| Truck Payments (Debit/Credit/Advance/Commission/Balance + Password Prompt) | `src/pages/TruckPaymentPage.js` | `/api/truck-payments` | `mobile/src/screens/owner/TruckPaymentsScreen.js` | ✅ DONE |
| Payment Alerts Dashboard (Overdue party/truck payments, WhatsApp reminders) | `src/pages/PaymentAlertsPage.js` | `/api/lr-entries`, `/api/truck-payments` | `mobile/src/screens/owner/PaymentAlertsScreen.js` | ✅ DONE |
| Truck Arriving Alerts & Dismissal | `src/pages/TruckComingPage.js` | `PUT /api/lr-entries/:id/dismiss-truck-coming` | `mobile/src/screens/owner/TruckComingScreen.js` | ✅ DONE |

---

## 🏢 7. Party Portal Role (`PARTY`)
| Feature | Web Location | API Endpoint | Mobile Location | Status |
|---|---|---|---|---|
| Party Accounting Ledger | `src/pages/AccountingPage.js` | `/api/parties`, `/api/lr-entries` | `mobile/src/screens/party/PartyAccountingScreen.js` | ✅ DONE |
| Party LR Records (View, Print, PDF) | `src/pages/PartyLRRecordsPage.js` | `/api/lr-entries` | `mobile/src/screens/party/PartyLRRecordsScreen.js` | ✅ DONE |
| Party Orders (Place transport request, Track Status) | `src/pages/PartyOrdersPage.js` | `/api/party-orders` | `mobile/src/screens/party/PartyOrdersScreen.js` | ✅ DONE |

---

## 🚚 8. Truck Portal Role (`TRUCK`)
| Feature | Web Location | API Endpoint | Mobile Location | Status |
|---|---|---|---|---|
| Truck Accounting Ledger | `src/pages/TruckAccountingPage.js` | `/api/truck-payments`, `/api/lr-entries` | `mobile/src/screens/truck/TruckAccountingScreen.js` | ✅ DONE |
| Truck Orders (View assigned trips, Update status) | `src/pages/TruckOrdersPage.js` | `/api/truck-orders` | `mobile/src/screens/truck/TruckOrdersScreen.js` | ✅ DONE |
