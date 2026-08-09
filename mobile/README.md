# Wolego Transport Mobile Application (Expo + React Native)

Official mobile application for **Wolego Transport** built with React Native and Expo. The mobile app connects to the existing Node.js backend (`backend/`) and supports all three user roles: **OWNER**, **PARTY**, and **TRUCK**.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- Expo CLI (`npm install -g expo-cli` or via `npx expo`)
- Expo Go App on Android/iOS device OR Android Studio Emulator

---

### 2. Installation

Navigate into the `mobile` directory and install dependencies:

```bash
cd mobile
npm install
```

---

### 3. Running the Mobile Application

Start the Expo development server:

```bash
# Inside the mobile directory:
npm start
```

Or run directly for Android / iOS:

```bash
# Run on Android Emulator / Connected Device
npm run android

# Run on iOS Simulator (Mac)
npm run ios

# Run in Web Browser
npm run web
```

---

## 🌐 Configuring Backend API Server URL

By default, the mobile app points to `http://10.0.2.2:8002/api` (Android Emulator default localhost).

### Changing Backend API URL in App:
1. Open the Mobile App.
2. On the Login Screen, click **Configure API Server URL** or click the Settings icon in the top header.
3. Enter your backend server URL:
   - **Android Emulator**: `http://10.0.2.2:8002/api`
   - **Local LAN Testing**: `http://<YOUR-COMPUTER-IP>:8002/api` (e.g. `http://192.168.1.10:8002/api`)
   - **Production Server**: `https://wolegotransport.com/api`
4. Tap **Save URL**.

---

## 📱 User Roles & Features

### 1. 👑 OWNER Role
- **Dashboard**: Key business metrics (Total LRs, Party Pending Amount, Truck Pending Freight, Active Masters).
- **LR Entry**: Complete form for creating/editing LRs with automatic freight calculation (`Weight * Rate`), delivery charges, and balance amounts.
- **LR Records**: List, search, and manage LRs with security action password verification for edit and delete actions.
- **Party Master**: View, search, create, edit, and delete Consignor/Consignee parties.
- **Truck Master**: View, search, create, edit, and delete Trucks and driver details.
- **Party & Truck Ledgers**: Billed vs received accounting statements.

### 2. 🏢 PARTY Role
- **Party Ledger**: View billed amounts, received payments, and pending balances for the logged-in party.
- **Party Orders**: Submit and track load order requests.

### 3. 🚛 TRUCK Role
- **Truck Freight Ledger**: View trip freight, advance payments, and balance payable.
- **Truck Trips & Orders**: Post truck availability and route requests.

---

## 📁 Directory Structure

```
mobile/
├── App.js                     # Root Application Entry
├── app.json                   # Expo App Configuration
├── babel.config.js            # Babel Configuration
├── package.json               # Dependencies & Scripts
├── README.md                  # Documentation Guide
├── config/
│   └── api.js                 # Configurable API Host Service
├── context/
│   └── AuthContext.js         # Authentication Context & Session Storage
├── services/
│   └── apiService.js          # REST Client for Node.js Backend API
├── components/
│   ├── ActionPasswordModal.js # Security Action Verification Modal
│   ├── Badge.js               # Status Badges
│   ├── Card.js                # Custom Container Cards
│   ├── CustomButton.js        # Touch Pressable Buttons with Loading State
│   ├── CustomInput.js         # Text Input Component with Icons
│   ├── Header.js              # Top Branding Bar & Action Controls
│   └── SearchablePickerModal.js # Searchable Selection Modal for Parties/Trucks
├── navigation/
│   └── AppNavigator.js        # React Navigation Setup (Stack + Bottom Tabs)
└── screens/
    ├── LoginScreen.js         # Authentication Screen
    ├── DashboardScreen.js     # Owner Dashboard
    ├── LREntryScreen.js       # LR Creation & Edit Form
    ├── LRListScreen.js        # LR Records & Security Verification
    ├── PartyMasterScreen.js   # Party Management
    ├── TruckMasterScreen.js   # Truck Management
    ├── AccountingScreen.js    # Party Accounting & Ledger
    ├── TruckAccountingScreen.js # Truck Accounting & Ledger
    ├── PartyOrdersScreen.js   # Party Orders Management
    ├── TruckOrdersScreen.js   # Truck Orders Management
    └── SettingsScreen.js      # Backend API Server Configuration
```

---

## 🔒 Security Features
- Protected actions (Edit/Delete LR) require entering the Action Security Password, matching the web security architecture.
- JWT/Auth Token persistence handled via `@react-native-async-storage/async-storage`.
