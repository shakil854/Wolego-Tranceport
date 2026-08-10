import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { fetchLRPdfBlobApi } from '../api/endpoints';

// Generate A4 HTML template string for Expo Print
export const generateLRHtmlForMobile = (lrData, signatureImg, selectedCopies = ["CONSIGNOR"]) => {
  const copiesStr = (selectedCopies || ["CONSIGNOR"]).join(" / ");
  const formatDate = (dateVal) => {
    if (!dateVal) return "";
    const cleanStr = String(dateVal).split("T")[0];
    const parts = cleanStr.split("-");
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return cleanStr;
  };

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
    <style>
      @page { size: A4 portrait; margin: 5mm; }
      body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; margin: 0; padding: 0; color: #0f172a; background: #fff; }
      .border-box { border: 2px solid #000; height: 98vh; box-sizing: border-box; padding: 8px; display: flex; flex-direction: column; justify-space-between; }
      .header-title { font-size: 22px; font-weight: 900; color: #009a44; text-align: center; text-transform: uppercase; margin: 2px 0; }
      .tagline { font-size: 11px; font-weight: 900; color: #78350f; text-align: center; font-style: italic; }
      .badge { background: #1e3a8a; color: white; padding: 2px 6px; font-size: 10px; font-weight: 900; display: inline-block; }
      .grid { display: flex; width: 100%; }
      .col-6 { width: 50%; }
      .col-12 { width: 100%; }
      .table { width: 100%; border-collapse: collapse; margin-top: 4px; }
      .table th, .table td { border: 1px solid #000; padding: 4px; font-size: 10px; font-weight: 700; text-align: left; }
      .table th { background: #e2e8f0; text-transform: uppercase; text-align: center; }
      .text-center { text-align: center; }
      .text-right { text-align: right; }
      .font-bold { font-weight: bold; }
    </style>
  </head>
  <body>
    <div class="border-box">
      <div style="text-align:center; font-size:9px; font-weight:bold; text-decoration:underline;">SUBJECT TO WANKANER JURISDICTION</div>
      <div class="header-title">WOLEGO TRANSPORT</div>
      <div class="tagline">EVERYTHING IS FAST</div>
      <div style="text-align:center; margin: 4px 0;"><span class="badge">TRANSPORT CONTRACTOR AND COMMISSION AGENT</span></div>
      <div style="text-align:center; font-size:9px; font-weight:bold; color:#7f1d1d;">
        SURVEY NUMBER NA 178P8, 27 NATIONAL HIGHWAY, CHANDRAPUR, WANKANER-363621 MORBI (GUJARAT)<br/>
        MOBILE: +91 99 79 111 555 | +91 81 41 111 555 | GSTIN: 24DLTPS8567M1ZT
      </div>
      <div style="background:#1e3a8a; color:#fff; text-align:center; font-weight:bold; padding:2px; margin-top:4px; font-size:10px;">
        GOODS CONSIGNMENT NOTE (${copiesStr} COPY)
      </div>

      <table class="table">
        <tr>
          <td><strong>L.R. NO. :</strong> <span style="color:#b91c1c;">${lrData.lrNumber || ''}</span></td>
          <td><strong>DATE :</strong> ${formatDate(lrData.dateTime)}</td>
          <td><strong>FROM :</strong> ${lrData.fromPlace || ''}</td>
          <td><strong>TO :</strong> ${lrData.toPlace || ''}</td>
        </tr>
        <tr>
          <td colspan="2"><strong>DELIVERY AT :</strong> ${lrData.deliveryAt || ''}</td>
          <td colspan="2"><strong>TRUCK NO. :</strong> ${lrData.truckNo || ''}</td>
        </tr>
      </table>

      <div class="grid" style="border: 1px solid #000; margin-top:4px;">
        <div class="col-6" style="padding:4px; border-right:1px solid #000;">
          <strong>CONSIGNOR:</strong><br/>
          ${lrData.consignorName || ''}<br/>
          ${lrData.consignorAddress || ''}<br/>
          GSTIN: ${lrData.consignorGst || 'AS PER BILL'}
        </div>
        <div class="col-6" style="padding:4px;">
          <strong>CONSIGNEE:</strong><br/>
          ${lrData.consigneeName || ''}<br/>
          ${lrData.consigneeAddress || ''}<br/>
          GSTIN: ${lrData.consigneeGst || ''}
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th>Articles</th>
            <th>Description</th>
            <th>Weight</th>
            <th>Rate</th>
            <th>Freight (${lrData.toPayOrPaid || 'TBB'})</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="text-center">${lrData.noOfArticles || ''} ${lrData.bundles || ''}</td>
            <td>${lrData.descriptionOfGoods || ''}</td>
            <td class="text-center">${lrData.weightKgs ? lrData.weightKgs + ' KG' : ''}</td>
            <td class="text-center">${lrData.ratePerTon || ''}</td>
            <td class="text-right">₹ ${lrData.freightAmount || 0}</td>
          </tr>
        </tbody>
      </table>

      <div class="grid" style="border: 1px solid #000; margin-top:4px;">
        <div class="col-6" style="padding:4px; border-right: 1px solid #000; font-size:9px;">
          <div>GST Payable By: <strong>${lrData.gstPayableBy || 'CONSIGNEE'}</strong></div>
          <div>Invoice No: <strong>${lrData.billNumbers || ''}</strong> | Value: ₹ <strong>${lrData.invoiceValue || ''}</strong></div>
          <div>Consignor E-Way: <strong>${lrData.consignorEwayBill || ''}</strong></div>
          <div>Driver Mobile: <strong>${lrData.driverMobile || ''}</strong></div>
          <div style="margin-top:4px; background:#fef2f2; color:#991b1b; padding:2px; font-weight:bold;">WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE</div>
        </div>
        <div class="col-6" style="padding:4px; font-size:9px;">
          <div style="display:flex; justify-content:space-between;"><span>Freight:</span> <span>₹ ${lrData.freightAmount || 0}</span></div>
          <div style="display:flex; justify-content:space-between;"><span>SGST (2.5%):</span> <span>₹ ${lrData.sgstAmount || '0.00'}</span></div>
          <div style="display:flex; justify-content:space-between;"><span>CGST (2.5%):</span> <span>₹ ${lrData.cgstAmount || '0.00'}</span></div>
          <div style="display:flex; justify-content:space-between;"><span>IGST (5%):</span> <span>₹ ${lrData.igstAmount || '0.00'}</span></div>
          <div style="display:flex; justify-content:space-between; font-weight:bold; background:#e2e8f0;"><span>Net Total:</span> <span>₹ ${lrData.netTotalAmount || lrData.freightAmount || 0}</span></div>
          <div style="text-align:center; margin-top:10px; font-weight:bold;">
            FOR, WOLEGO TRANSPORT<br/><br/>
            ${signatureImg ? `<img src="${signatureImg}" style="height:30px; object-fit:contain;" /><br/>` : ''}
            (AUTHORISED SIGNATORY)
          </div>
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

// Print LR or Statement directly via native print modal
export const printDocumentNative = async (htmlContent) => {
  try {
    await Print.printAsync({
      html: htmlContent,
    });
  } catch (error) {
    console.error("Native print error:", error);
    throw error;
  }
};

// Generate & save PDF locally using expo-print
export const generateAndSavePdfNative = async (htmlContent, filename = "document.pdf") => {
  try {
    const { uri } = await Print.printToFileAsync({
      html: htmlContent,
      base64: false,
    });

    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.moveAsync({
      from: uri,
      to: fileUri,
    });
    return fileUri;
  } catch (error) {
    console.error("PDF creation error:", error);
    throw error;
  }
};

// Fetch Backend Puppeteer PDF and save locally
export const fetchAndSaveBackendLRPdf = async (lrData, signatureImg, selectedCopies = ["CONSIGNOR"]) => {
  const lrNo = lrData?.lrNumber || "0000";
  let truck = (lrData?.truckNo || "").replace(/[^a-zA-Z0-9]/g, "").trim();
  const filename = truck ? `LR_${lrNo}_WolegoTransport_${truck}.pdf` : `LR_${lrNo}_WolegoTransport.pdf`;

  try {
    const pdfArrayBuffer = await fetchLRPdfBlobApi({
      lrData,
      signatureImg,
      selectedCopies,
    });

    // Convert ArrayBuffer to base64
    const base64Data = Buffer.from(pdfArrayBuffer).toString('base64');
    const fileUri = `${FileSystem.documentDirectory}${filename}`;
    
    await FileSystem.writeAsStringAsync(fileUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return fileUri;
  } catch (err) {
    console.warn("Backend PDF fetch failed, falling back to local Expo print PDF generation:", err);
    const html = generateLRHtmlForMobile(lrData, signatureImg, selectedCopies);
    return await generateAndSavePdfNative(html, filename);
  }
};
