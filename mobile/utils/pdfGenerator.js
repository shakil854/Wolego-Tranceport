import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import { getApiBaseUrl } from "../config/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const generateLRHTML = (lr) => {
  const lrNo = lr.lrNumber || "-";
  const date = lr.date || "-";
  const consignor = lr.consignorName || "-";
  const consignee = lr.consigneeName || "-";
  const truckNo = lr.truckNo || "-";
  const fromLoc = lr.fromLocation || "-";
  const toLoc = lr.toLocation || "-";
  const weight = lr.weightMT || "0";
  const rate = lr.ratePerMT || "0";
  const freight = Number(lr.freightAmount || 0).toLocaleString("en-IN");
  const advance = Number(lr.advanceAmount || 0).toLocaleString("en-IN");
  const delivery = Number(lr.deliveryCharges || 0).toLocaleString("en-IN");
  const netTotal = Number(lr.netTotalAmount || 0).toLocaleString("en-IN");
  const balance = Number(lr.balanceAmount || 0).toLocaleString("en-IN");
  const remarks = lr.remarks || "-";

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
        <style>
          body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 20px; color: #1e293b; font-size: 13px; }
          .header { text-align: center; border-bottom: 3px double #009a44; padding-bottom: 10px; margin-bottom: 15px; }
          .brand { font-size: 24px; font-weight: 900; color: #009a44; letter-spacing: 1px; font-family: serif; }
          .tagline { font-size: 12px; font-weight: 800; color: #b45309; font-style: italic; letter-spacing: 2px; }
          .sub { font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 4px; }
          
          .top-grid { display: flex; justify-content: space-between; margin-bottom: 15px; background: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 8px; }
          .box { width: 48%; }
          .box-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 4px; }
          .val { font-size: 14px; font-weight: 800; color: #0f172a; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #cbd5e1; padding: 8px 10px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: 800; color: #334155; text-transform: uppercase; font-size: 11px; }
          
          .math-table { margin-top: 15px; width: 50%; float: right; }
          .math-table td { font-weight: 700; }
          .highlight { background-color: #fef3c7; color: #92400e; font-weight: 900; font-size: 15px; }
          
          .clear { clear: both; }
          .footer-notes { margin-top: 30px; font-size: 10px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">WOLEGO TRANSPORT</div>
          <div class="tagline">EVERYTHING IS FAST</div>
          <div class="sub">LORRY RECEIPT / TRANSPORTATION BILLING MEMO</div>
        </div>

        <div class="top-grid">
          <div class="box">
            <div class="box-title">Lorry Receipt No</div>
            <div class="val" style="color:#009a44;">LR #${lrNo}</div>
          </div>
          <div class="box" style="text-align:right;">
            <div class="box-title">Date</div>
            <div class="val">${date}</div>
          </div>
        </div>

        <table>
          <tr>
            <th>Consignor (Shipper)</th>
            <td><strong>${consignor}</strong></td>
          </tr>
          <tr>
            <th>Consignee (Receiver)</th>
            <td><strong>${consignee}</strong></td>
          </tr>
          <tr>
            <th>Truck Number</th>
            <td><strong>${truckNo}</strong></td>
          </tr>
          <tr>
            <th>Route</th>
            <td>From <strong>${fromLoc}</strong> To <strong>${toLoc}</strong></td>
          </tr>
          <tr>
            <th>Weight (MT)</th>
            <td>${weight} MT</td>
          </tr>
          <tr>
            <th>Rate Per MT</th>
            <td>₹${rate}</td>
          </tr>
          <tr>
            <th>Remarks / Memo</th>
            <td>${remarks}</td>
          </tr>
        </table>

        <table class="math-table">
          <tr>
            <td>Freight Amount</td>
            <td style="text-align:right;">₹${freight}</td>
          </tr>
          <tr>
            <td>Delivery Charges</td>
            <td style="text-align:right;">₹${delivery}</td>
          </tr>
          <tr>
            <td><strong>Net Total Freight</strong></td>
            <td style="text-align:right;"><strong>₹${netTotal}</strong></td>
          </tr>
          <tr>
            <td>Advance Paid</td>
            <td style="text-align:right; color:#059669;">- ₹${advance}</td>
          </tr>
          <tr class="highlight">
            <td>Balance Payable</td>
            <td style="text-align:right;">₹${balance}</td>
          </tr>
        </table>

        <div class="clear"></div>

        <div class="footer-notes">
          Subject to Ahmedabad Jurisdiction. Computer generated Lorry Receipt by Wolego Transport.
        </div>
      </body>
    </html>
  `;
};

// Fetch Backend PDF via Puppeteer Endpoint /api/lr-entries/generate-pdf
export const fetchBackendLRPDF = async (lr) => {
  try {
    const baseUrl = await getApiBaseUrl();
    const token = await AsyncStorage.getItem("wolego_token");

    const res = await fetch(`${baseUrl}/lr-entries/generate-pdf`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({ lrData: lr }),
    });

    if (res.ok) {
      const blob = await res.blob();
      return blob;
    }
  } catch (err) {
    console.warn("Backend PDF generation endpoint call notice:", err.message);
  }
  return null;
};

// Print LR Document (Supports Backend API PDF & Local Expo Print)
export const printLRDocument = async (lr) => {
  try {
    const html = generateLRHTML(lr);
    await Print.printAsync({ html });
  } catch (err) {
    console.error("Print LR error:", err);
    Alert.alert("Print Error", "Failed to open print dialog.");
  }
};

// Share LR Document as PDF via Backend Endpoint or Local PDF Generator
export const shareLRPDF = async (lr) => {
  try {
    const html = generateLRHTML(lr);
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        UTI: ".pdf",
        mimeType: "application/pdf",
        dialogTitle: `Share LR #${lr.lrNumber} PDF`,
      });
    } else {
      Alert.alert("PDF Generated", `Saved to ${uri}`);
    }
  } catch (err) {
    console.error("Share PDF error:", err);
    Alert.alert("PDF Error", "Failed to generate or share PDF.");
  }
};
