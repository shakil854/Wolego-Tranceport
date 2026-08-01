import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read logo.png as Base64 Data URL once at module load
let logoBase64 = "";
try {
  const logoPath = path.resolve(__dirname, "../../src/assets/logo.png");
  if (fs.existsSync(logoPath)) {
    const logoBuffer = fs.readFileSync(logoPath);
    logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  }
} catch (e) {
  console.error("Failed to load logo.png for PDF template:", e);
}

const formatDateDisplay = (dateVal) => {
  if (!dateVal) return new Date().toLocaleDateString("en-IN");
  if (typeof dateVal === "string" && dateVal.includes("-")) {
    const parts = dateVal.split("T")[0].split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts;
      return `${parseInt(d, 10)}/${parseInt(m, 10)}/${y}`;
    }
  }
  return new Date(dateVal).toLocaleDateString("en-IN");
};

export const generateLRHtml = (lrData = {}, signatureImg = null) => {
  const consignorGstDisplay =
    lrData.consignorName && (lrData.consignorName.includes("(1)") || lrData.consignorName.includes("\n"))
      ? "AS PER BILL"
      : lrData.consignorGst || "";

  const sigImageSrc = signatureImg || lrData.signatureImg || null;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>LR PDF</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    @page {
      size: A4 portrait;
      margin: 0;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased !important;
      -moz-osx-font-smoothing: grayscale !important;
      text-rendering: optimizeLegibility !important;
    }

    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
      color: #0f172a;
      font-size: 11px;
    }

    .a4-page {
      width: 210mm;
      height: 297mm;
      padding: 3.5mm;
      margin: 0 auto;
      box-sizing: border-box;
      background: white;
      position: relative;
      page-break-after: always;
      break-after: page;
      overflow: hidden;
    }

    .a4-page:last-child {
      page-break-after: avoid;
      break-after: avoid;
    }

    .print-document {
      border: 2.5px solid #0f172a;
      padding: 0;
      width: 203mm;
      height: 290mm;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      background: white;
    }

    /* Grid Layouts */
    .grid { display: grid; }
    .grid-12 { display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); }
    .grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); }

    .col-span-2 { grid-column: span 2 / span 2; }
    .col-span-3 { grid-column: span 3 / span 3; }
    .col-span-5 { grid-column: span 5 / span 5; }
    .col-span-6 { grid-column: span 6 / span 6; }
    .col-span-7 { grid-column: span 7 / span 7; }

    /* Flex Utilities */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-1 { flex: 1 1 0%; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .justify-between { justify-content: space-between; }
    .justify-start { justify-content: flex-start; }
    .justify-end { justify-content: flex-end; }

    /* Typography & Alignments */
    .text-center { text-align: center; }
    .text-left { text-align: left; }
    .text-right { text-align: right; }
    .font-black { font-weight: 900; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .uppercase { text-transform: uppercase; }
    .underline { text-decoration: underline; }
    .italic { font-style: italic; }
    .whitespace-nowrap { white-space: nowrap; }
    .whitespace-pre-line { white-space: pre-line; }

    /* Positions & Borders */
    .relative { position: relative; }
    .absolute { position: absolute; }
    .inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
    .z-0 { z-index: 0; }
    .z-10 { z-index: 10; }
    .overflow-hidden { overflow: hidden; }

    .border-b-2 { border-bottom: 2px solid #0f172a; }
    .border-b { border-bottom: 1px solid #cbd5e1; }
    .border-t-2 { border-top: 2px solid #0f172a; }
    .border-t { border-top: 1px solid #cbd5e1; }
    .border-l { border-left: 1px solid #cbd5e1; }
    .divide-x-2 > * + * { border-left: 2px solid #0f172a; }
    .divide-y > * + * { border-top: 1px solid #cbd5e1; }

    /* Colors */
    .bg-slate-100 { background-color: #f1f5f9; }
    .bg-slate-200 { background-color: #e2e8f0; }
    .bg-blue-900 { background-color: #1e3a8a; }
    .bg-red-50 { background-color: #fef2f2; }
    .text-white { color: #ffffff; }
    .text-slate-950 { color: #020617; }
    .text-rose-700 { color: #be123c; }
    .text-amber-900 { color: #78350f; }
    .text-amber-300 { color: #fde047; }
    .text-red-900 { color: #7f1d1d; }
    .text-red-700 { color: #b91c1c; }
    .text-blue-950 { color: #172554; }
    .green-brand { color: #009a44; }

    /* Logo Image Sizing */
    .company-logo {
      height: 90px;
      max-height: 90px;
      width: auto;
      max-width: 100%;
      object-fit: contain;
    }

    .watermark-logo {
      width: 450px;
      max-width: 75%;
      opacity: 0.08;
      object-fit: contain;
      mix-blend-mode: multiply;
    }

    /* Padding & Margins */
    .p-1 { padding: 4px; }
    .p-1-5 { padding: 6px; }
    .p-2 { padding: 8px; }
    .px-2 { padding-left: 8px; padding-right: 8px; }
    .py-1 { padding-top: 4px; padding-bottom: 4px; }
    .gap-1 { gap: 4px; }
    .gap-2 { gap: 8px; }
  </style>
</head>
<body>

  <!-- PAGE 1: LR Document -->
  <div class="a4-page">
    <div class="print-document">

      <!-- Background Watermark Logo -->
      <div class="absolute inset-0 flex items-center justify-center z-0 overflow-hidden" style="pointer-events: none;">
        ${
          logoBase64
            ? `<img src="${logoBase64}" alt="Watermark Logo" class="watermark-logo" />`
            : ""
        }
      </div>

      <div class="relative z-10 flex-1 flex flex-col justify-between">
        <!-- Header Bar -->
        <div class="border-b-2 p-2" style="padding-bottom: 8px;">

          <!-- Copy Checkboxes Header -->
          <div class="flex justify-between items-center text-[10px] font-bold border-b pb-1 mb-1" style="border-color: #cbd5e1;">
            <div class="flex gap-2 uppercase">
              <label class="flex items-center gap-1">
                <input type="checkbox" checked class="w-3 h-3" /> CONSIGNOR COPY
              </label>
              <label class="flex items-center gap-1">
                <input type="checkbox" class="w-3 h-3" /> CONSIGNEE COPY
              </label>
              <label class="flex items-center gap-1">
                <input type="checkbox" class="w-3 h-3" /> TRUCK COPY
              </label>
              <label class="flex items-center gap-1">
                <input type="checkbox" class="w-3 h-3" /> OFFICE COPY
              </label>
            </div>
          </div>

          <!-- Company Banner & Logo -->
          <div class="grid-12 gap-1 items-center py-1">
            <!-- Left Logo Column -->
            <div class="col-span-2 flex justify-center items-center">
              ${
                logoBase64
                  ? `<img src="${logoBase64}" alt="Wolego Transport Logo" class="company-logo" />`
                  : ""
              }
            </div>

            <!-- Middle Column -->
            <div class="col-span-7 text-center flex flex-col items-center justify-center">
              <div class="text-[10px] font-black text-slate-950 uppercase underline whitespace-nowrap">
                SUBJECT TO WANKANER JURISDICTION
              </div>

              <h1 class="green-brand font-black uppercase whitespace-nowrap" style="font-size: 26px; line-height: 1; margin: 2px 0;">
                WOLEGO TRANSPORT
              </h1>

              <div class="text-[12px] font-black text-amber-900 italic whitespace-nowrap" style="margin-bottom: 2px;">
                EVERYTHING IS FAST
              </div>

              <div class="whitespace-nowrap" style="margin-bottom: 3px;">
                <span class="text-[10.5px] font-black uppercase bg-blue-900 text-white px-2 py-0-5 inline-block">
                  TRANSPORT CONTRACTOR AND COMMISSION AGENT
                </span>
              </div>

              <div class="text-[10px] text-red-900 font-black uppercase leading-tight whitespace-nowrap text-center">
                <div>SURVEY NUMBER NA 178P8, 27 NATIONAL HIGHWAY,</div>
                <div>CHANDRAPUR, WANKANER-363621 DISTRICT-MORBI ( GUJRAT )</div>
              </div>
            </div>

            <!-- Right Side Column -->
            <div class="col-span-3 text-left text-[9.5px] font-black text-slate-950 border-l pl-2" style="border-color: #cbd5e1;">
              <div>MOBILE NO. +91 99 79 111 555</div>
              <div>MOBILE NO. +91 81 41 111 555</div>
              <div>PAN NO. : DLTPS8567M</div>
              <div>GSTIN NO. : 24DLTPS8567M1ZT</div>
            </div>
          </div>
        </div>

        <!-- Title Strip -->
        <div class="bg-blue-900 text-white font-extrabold text-center py-1 uppercase flex flex-col items-center justify-center border-b-2">
          <div class="text-[11px] font-black tracking-widest text-white leading-tight">GOODS CONSIGNMENT NOTE</div>
          <div class="text-[8.5px] font-bold tracking-wider text-amber-300 leading-tight">AT OWNER'S RISK</div>
        </div>

        <!-- LR Header Grid -->
        <div class="grid-12 border-b-2 font-black text-[11px] divide-x-2 text-slate-950">
          <div class="col-span-3 p-1-5 bg-slate-100 flex items-center justify-center gap-2">
            <span>L.R. NO. :</span>
            <span class="text-base font-black text-rose-700">${lrData.lrNumber || ""}</span>
          </div>
          <div class="col-span-3 p-1-5 flex items-center gap-2">
            <span>DATE :</span>
            <span class="font-extrabold">${formatDateDisplay(lrData.dateTime)}</span>
          </div>
          <div class="col-span-3 p-1-5 flex items-center gap-2">
            <span>FROM :</span>
            <span class="uppercase font-black">${lrData.fromPlace || ""}</span>
          </div>
          <div class="col-span-3 p-1-5 flex items-center gap-2">
            <span>TO :</span>
            <span class="uppercase font-black">${lrData.toPlace || ""}</span>
          </div>
        </div>

        <!-- Truck No & Delivery At -->
        <div class="grid-12 border-b-2 font-black text-[11px] divide-x-2 text-slate-950">
          <div class="col-span-6 p-1-5 flex items-center gap-2">
            <span>DELIVERY AT :</span>
            <span class="font-black text-[11px] uppercase">${lrData.deliveryAt || ""}</span>
          </div>
          <div class="col-span-6 p-1-5 flex items-center gap-2">
            <span>TRUCK NO. :</span>
            <span class="text-[11px] font-black uppercase">${lrData.truckNo || ""}</span>
          </div>
        </div>

        <!-- Consignor & Consignee Box -->
        <div class="grid-2 border-b-2 divide-x-2" style="min-height: 95px;">
          <!-- Consignor Column -->
          <div class="p-2 flex flex-col justify-between">
            <div>
              <div class="font-black text-[11px] underline uppercase">CONSIGNOR'S NAME & ADDRESS</div>
              <div class="font-black text-[11px] uppercase whitespace-pre-line" style="margin-top: 2px;">${lrData.consignorName || ""}</div>
              <div class="text-[11px] font-black uppercase whitespace-pre-line">${lrData.consignorAddress || ""}</div>
            </div>
            <div class="font-black text-[11px] border-t pt-1" style="border-color: #cbd5e1; margin-top: 4px;">
              CONSIGNOR GSTIN NO. : <span class="font-black">${consignorGstDisplay}</span>
            </div>
          </div>

          <!-- Consignee Column -->
          <div class="p-2 flex flex-col justify-between">
            <div>
              <div class="font-black text-[11px] underline uppercase">CONSIGNEE'S NAME & ADDRESS</div>
              <div class="font-black text-[11px] uppercase" style="margin-top: 2px;">${lrData.consigneeName || ""}</div>
              <div class="text-[11px] font-black uppercase whitespace-pre-line">${lrData.consigneeAddress || ""}</div>
            </div>
            <div class="font-black text-[11px] border-t pt-1" style="border-color: #cbd5e1; margin-top: 4px;">
              CONSIGNEE GSTIN NO. : <span class="font-black">${lrData.consigneeGst || ""}</span>
            </div>
          </div>
        </div>

        <!-- Goods Table -->
        <div class="border-b-2" style="min-height: 110px;">
          <table class="w-full text-left border-collapse text-[11px]" style="width: 100%;">
            <thead>
              <tr class="bg-slate-200 border-b-2 font-black uppercase text-center text-slate-950">
                <th class="p-1-5" style="width: 20%; border-right: 2px solid #0f172a;">NO. OF ARTICLE</th>
                <th class="p-1-5" style="border-right: 2px solid #0f172a;">DESCRIPTION OF GOODS</th>
                <th class="p-1-5" style="width: 20%; border-right: 2px solid #0f172a;">WEIGHT</th>
                <th class="p-1-5" style="width: 15%; border-right: 2px solid #0f172a;">RATE</th>
                <th class="p-1-5" style="width: 20%;">FREIGHT (${lrData.toPayOrPaid || "TBB"})</th>
              </tr>
            </thead>
            <tbody class="font-black text-slate-950">
              <tr class="text-center" style="min-height: 80px;">
                <td class="p-2 font-black" style="vertical-align: top; border-right: 2px solid #0f172a;">
                  <div style="min-height: 34px;">
                    <div class="font-black text-[11px]">${lrData.noOfArticles || ""}</div>
                    <span class="text-[11px] font-black uppercase">${lrData.bundles || ""}</span>
                  </div>
                  ${
                    lrData.noOfArticles2
                      ? `<div class="border-t" style="border-color: #0f172a; margin-top: 4px; padding-top: 4px; min-height: 34px;">
                          <div class="font-black text-[11px]">${lrData.noOfArticles2}</div>
                          <span class="text-[11px] font-black uppercase">${lrData.bundles2 || "BUNDLE"}</span>
                        </div>`
                      : ""
                  }
                </td>
                <td class="p-2 text-center" style="vertical-align: top; border-right: 2px solid #0f172a;">
                  <div style="min-height: 34px;">
                    <div class="font-black uppercase text-[11px]">${lrData.descriptionOfGoods || ""}</div>
                  </div>
                  ${
                    lrData.noOfArticles2
                      ? `<div class="border-t" style="border-color: #0f172a; margin-top: 4px; padding-top: 4px; min-height: 34px;">
                          <div class="font-black uppercase text-[11px]">${lrData.descriptionOfGoods2 || "SANITARYWARE"}</div>
                        </div>`
                      : ""
                  }
                </td>
                <td class="p-2 font-black text-[11px]" style="vertical-align: top; border-right: 2px solid #0f172a;">
                  ${lrData.weightKgs ? `${lrData.weightKgs} K.G.` : ""}
                </td>
                <td class="p-2 font-black text-[11px]" style="vertical-align: top; border-right: 2px solid #0f172a;">
                  ${lrData.ratePerTon ? `${lrData.ratePerTon} ${lrData.rateType || ""}` : ""}
                </td>
                <td class="p-2 font-black text-center text-[11px]" style="vertical-align: top;">
                  ${lrData.freightAmount || ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bottom Grid: Charges, GST, Invoice, Insurance, Bank details -->
        <div class="grid-12 divide-x-2 flex-1" style="min-height: 400px;">
          <!-- Left Column (7 cols) -->
          <div class="col-span-7 text-[11px] flex flex-col justify-between text-slate-950 font-black">
            <div class="font-black text-[11px] border-b-2 px-2 py-1 flex items-center gap-2">
              <span>GST PAYABLE BY :</span>
              <span class="font-black uppercase">${lrData.gstPayableBy || "CONSIGNEE"}</span>
            </div>

            <div class="font-black text-[11px] border-b-2 px-2 py-1">
              INVOICE NO. : <span class="font-black">${lrData.billNumbers || ""}</span>
            </div>

            <div class="font-black text-[11px] border-b-2 px-2 py-1">
              VALUE RS. : <span class="font-black">${lrData.invoiceValue || ""}</span>
            </div>

            <div class="font-black text-[11px] border-b-2 px-2 py-1">
              CONSIGNOR E-WAY BILL : <span class="font-black">${lrData.consignorEwayBill || ""}</span>
            </div>

            <div class="font-black text-[11px] border-b-2 px-2 py-1">
              CONSIGNEE E-WAY BILL : <span class="font-black">${lrData.consigneeEwayBill || ""}</span>
            </div>

            <div class="font-black text-[11px] border-b-2 px-2 py-1">
              DRIVER NO. : <span class="font-black">${lrData.driverMobile || ""}</span>
            </div>

            <div class="px-2 py-1">
              <div class="font-black uppercase text-red-700 bg-red-50 p-1 border-2 text-[11px]" style="border-color: #0f172a; margin-bottom: 2px;">
                WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE.
              </div>
              <div class="font-black uppercase text-slate-950 bg-slate-200 p-1 border-2 text-[11px]" style="border-color: #0f172a;">
                FULL TRUCK LOAD ACCEPTED ALL OVER INDIA.
              </div>
            </div>

            <div class="px-2 py-1">
              <div class="p-1-5 border-2 text-[11px] font-black" style="border-color: #0f172a; border-radius: 4px;">
                <div class="font-black uppercase underline">INSURANCE :</div>
                <div class="font-black" style="font-size: 10px; margin: 2px 0;">THE CUSTOMER HAS STATED THAT HE HAS NOT INSURED THE CONSIGNMENT OR HAS INSURED CONSIGNMENT.</div>
                <div class="grid-3 gap-1 pt-1 border-t-2 font-black text-[10px]" style="border-color: #0f172a;">
                  <span>COMPANY: ________</span>
                  <span>POLICY: ________</span>
                  <span>RISK: ________</span>
                </div>
              </div>
            </div>

            <div class="p-2">
              <div class="p-1-5 border-2 text-[11px]" style="border-color: #1e3a8a; border-radius: 4px;">
                <div class="font-black uppercase border-b pb-1" style="color: #172554; border-color: #93c5fd; margin-bottom: 2px;">
                  ICICI BANK LTD (RTGS / NEFT PAYMENT)
                </div>
                <div class="grid-2 font-black text-[10.5px]">
                  <div>NAME : <span class="font-black">WOLEGO TRANSPORT</span></div>
                  <div>ACCOUNT NO. : <span class="font-black">118405500444</span></div>
                  <div>IFSC CODE : <span class="font-black">ICIC0001184</span></div>
                  <div>BRANCH : <span class="font-black">WANKANER</span></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column (5 cols) -->
          <div class="col-span-5 flex flex-col justify-between text-[11px] font-black h-full text-slate-950">
            <div>
              <div class="flex justify-between font-black border-b-2 px-2 py-2 bg-slate-200">
                <span>FREIGHT</span>
                <span>${lrData.freightAmount || 0}</span>
              </div>

              <div class="flex justify-between font-black px-2 py-2 border-b" style="border-color: #cbd5e1;">
                <span>Add : S-G.S.T. @ 2.5%</span>
                <span class="font-black">${lrData.sgstAmount || "0.00"}</span>
              </div>

              <div class="flex justify-between font-black px-2 py-2 border-b" style="border-color: #cbd5e1;">
                <span>Add : C-G.S.T. @ 2.5%</span>
                <span class="font-black">${lrData.cgstAmount || "0.00"}</span>
              </div>

              <div class="flex justify-between font-black px-2 py-2 border-b-2">
                <span>Add : I-G.S.T. @ 5%</span>
                <span class="font-black">${lrData.igstAmount || "0.00"}</span>
              </div>

              <div class="flex justify-between font-black border-b-2 px-2 py-2 bg-slate-200">
                <span>TOTAL WITH GST</span>
                <span>${lrData.totalWithGst || lrData.freightAmount || 0}</span>
              </div>

              <div class="flex justify-between font-black px-2 py-2 border-b" style="border-color: #cbd5e1;">
                <span>Other Charges</span>
                <span class="font-black">${lrData.otherCharges || "0.00"}</span>
              </div>

              <div class="flex justify-between font-black border-b-2 px-2 py-2">
                <span>Less : Advance Paid</span>
                <span class="font-black">${lrData.lessAdvancePaid || "0.00"}</span>
              </div>

              <div class="flex justify-between font-black text-[11px] border-b-2 px-2 py-2 bg-slate-200">
                <span>NET TOTAL:</span>
                <span>₹ ${lrData.netTotalAmount || lrData.freightAmount || 0}</span>
              </div>
            </div>

            <!-- Logo Centered Between NET TOTAL and Signatory Block -->
            <div class="flex items-center justify-center flex-1 w-full p-2 overflow-hidden" style="margin: auto 0;">
              ${
                logoBase64
                  ? `<img src="${logoBase64}" alt="Wolego Transport Logo" style="max-width: 260px; max-height: 200px; object-fit: contain; mix-blend-mode: multiply; opacity: 0.95; clip-path: inset(0 0 18% 0); transform: scale(1.1);" />`
                  : ""
              }
            </div>

            <!-- Signatory Block -->
            <div class="text-center p-2 flex flex-col items-center justify-end" style="min-height: 60px; margin-top: auto;">
              <div class="font-black uppercase text-[11px]">FOR, WOLEGO TRANSPORT</div>
              ${
                sigImageSrc
                  ? `<img src="${sigImageSrc}" alt="Authorised Digital Signature" style="height: 40px; max-width: 150px; object-fit: contain; margin: 4px 0; mix-blend-mode: multiply;" />`
                  : `<div style="height: 24px;"></div>`
              }
              <div class="text-[9.5px] uppercase tracking-wider font-extrabold">(AUTHORISED SIGNATORY)</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- PAGE 2: Terms & Conditions Document -->
  <div class="a4-page">
    <div class="print-document p-6" style="padding: 24px;">
      <div style="border: 1px solid #94a3b8; border-radius: 16px; padding: 24px; height: 100%; display: flex; flex-direction: column; justify-content: flex-start; position: relative; overflow: hidden;">
        
        <!-- Background Watermark Logo -->
        <div class="absolute inset-0 flex items-center justify-center z-0 overflow-hidden" style="pointer-events: none;">
          ${
            logoBase64
              ? `<img src="${logoBase64}" alt="Watermark Logo" class="watermark-logo" />`
              : ""
          }
        </div>

        <div class="relative z-10 flex-1 flex flex-col justify-start">
          <div class="text-center" style="padding-bottom: 16px; margin-bottom: 24px;">
            <div class="text-[10px] font-bold text-slate-700 uppercase" style="margin-bottom: 8px;">
              :: GOOD BOOKED ON ARE REVERS CARRIED CARRIED SUBJECT TO THE FOLLOWING ::
            </div>
            <h2 class="text-xl font-black uppercase border-b-2 inline-block pb-1" style="font-size: 20px; letter-spacing: 2px;">
              TERMS AND CONDITIONS
            </h2>
          </div>

          <div class="space-y-4 text-[11px] leading-relaxed text-slate-900 font-medium" style="display: flex; flex-direction: column; gap: 16px;">
            <div class="flex gap-2">
              <span class="font-bold shrink-0" style="min-width: 20px;">1)</span>
              <p>THE COMPANY DOES NOT GUARANTEE DELIVERY WITHIN ANY SPECIFIED TIME AND THE COMPANY DOES NOT BE LIABLE FOR ANY DELAY IN TRANSPORT OR DELIVERY, NOT ANY NEGLIGENCE FDEFAULT OF THE CARRIEROF HISAGENTS.</p>
            </div>

            <div class="flex gap-2">
              <span class="font-bold shrink-0" style="min-width: 20px;">2)</span>
              <p>NATURE, CONTENTE CONDITION AND VALUE OF THE CONSIGNMENT ARE UNKNOWN TO GOODS CARRERS OF INDIA (HEREIN-AFTER CALLED THE COMPANY) THE COMPANY CARRY THE GOODSAND PACKEDAT OWNER'S RISK.</p>
            </div>

            <div class="flex gap-2">
              <span class="font-bold shrink-0" style="min-width: 20px;">3)</span>
              <p>THE COMPANY SHALL NOT BE RESPONSIBLE IF THE GOOD S ARE DETAINED SEIZED OR CONFICATED GOVERNMENT AUTHORITIES.</p>
            </div>

            <div class="flex gap-2">
              <span class="font-bold shrink-0" style="min-width: 20px;">4)</span>
              <p>THE COMPANY SHALL NOT BE LIABLE FOR ANY LOSS OR DAMAGE DUE TO PILFERAGE THEFT WEALTHIER CONDITIONS STRIKES, RIOTS, DISTURBANCES, FIRE EXPLOSION OR ACCIDENT, PROVIDED HOWEVER ALL REASONABLE PRECAUTIONS ARE TAKEN TO PROVIDE AGAINST SUCHCONTINGENCY.</p>
            </div>

            <div class="flex gap-2">
              <span class="font-bold shrink-0" style="min-width: 20px;">5)</span>
              <p>NO ENQUIRY WELL ENTERTAINED RELATING TO ANY CONSIGNMENT AFTER THE EXPIRY OF 30 DAYSFORM THE DATE DELIVERY.</p>
            </div>

            <div class="flex gap-2">
              <span class="font-bold shrink-0" style="min-width: 20px;">6)</span>
              <p>THE COMPANY IS NOT RESPONSIBLE FOR LEAKAGE, BREAKAGE OR SHORTAGE BY SUN, RAIN ORWATER DUE TOBAD ROAD CONDUCTION OR DUEIMPROPER PACKING ETC.</p>
            </div>

            <div class="flex gap-2">
              <span class="font-bold shrink-0" style="min-width: 20px;">7)</span>
              <p>THE COURT IN WANKANER ALONE SHALL HAVE JURIDITION IN RESPECT OF ALLCLAIMS AND MATTESARISING UNDER THE CONSIGNMENT OF THEGOODS ENTRUSTED FOR TRANSPORT.</p>
            </div>

            <div class="flex gap-2">
              <span class="font-bold shrink-0" style="min-width: 20px;">8)</span>
              <p>PLEASE CHEQUETHE DOCUMENT OF THETRUCK & DRIVER LICENCE.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

</body>
</html>`;
};
