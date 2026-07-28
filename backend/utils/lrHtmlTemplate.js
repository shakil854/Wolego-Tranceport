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
  <script src="https://cdn.tailwindcss.com"></script>
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
    }

    html, body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
      color: #0f172a;
      -webkit-font-smoothing: antialiased;
    }

    .a4-page {
      width: 210mm;
      height: 297mm;
      padding: 4mm;
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
      border: 2px solid #0f172a;
      padding: 0;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      position: relative;
      overflow: hidden;
      background: white;
    }
  </style>
</head>
<body class="bg-white">

  <!-- PAGE 1: LR Document -->
  <div class="a4-page">
    <div class="print-document">

      <!-- Background Watermark Logo -->
      <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
        ${
          logoBase64
            ? `<img src="${logoBase64}" alt="Watermark Logo" class="w-[450px] max-w-[75%] opacity-[0.08] object-contain mix-blend-multiply" />`
            : ""
        }
      </div>

      <div class="relative z-10 flex-1 flex flex-col justify-between">
        <!-- Header Bar -->
        <div class="border-b-2 border-slate-900 p-2.5 pb-2">

          <!-- Copy Checkboxes Header -->
          <div class="flex flex-wrap justify-between items-center text-[10px] font-bold border-b border-slate-300 pb-1 mb-1">
            <div class="flex space-x-4 uppercase">
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" checked class="w-3 h-3 accent-slate-900" /> CONSIGNOR COPY
              </label>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" class="w-3 h-3 accent-slate-900" /> CONSIGNEE COPY
              </label>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" class="w-3 h-3 accent-slate-900" /> TRUCK COPY
              </label>
              <label class="flex items-center gap-1 cursor-pointer">
                <input type="checkbox" class="w-3 h-3 accent-slate-900" /> OFFICE COPY
              </label>
            </div>
          </div>

          <!-- Company Banner & Logo -->
          <div class="grid grid-cols-12 gap-1 items-center my-1">
            <!-- Left Logo Column -->
            <div class="col-span-2 flex justify-center items-center">
              ${
                logoBase64
                  ? `<img src="${logoBase64}" alt="Wolego Transport Logo" class="h-24 sm:h-28 w-auto object-contain max-w-full" />`
                  : ""
              }
            </div>

            <!-- Middle Column -->
            <div class="col-span-7 text-center flex flex-col items-center justify-center space-y-1">
              <div class="text-[10px] font-black text-slate-950 uppercase underline tracking-wider whitespace-nowrap">
                SUBJECT TO WANKANER JURISDICTION
              </div>

              <h1 class="text-2xl sm:text-3xl font-black text-[#009a44] tracking-wider font-serif uppercase leading-none whitespace-nowrap">
                WOLEGO TRANSPORT
              </h1>

              <div class="text-xs sm:text-sm font-black text-amber-900 italic font-serif whitespace-nowrap">
                EVERYTHING IS FAST
              </div>

              <div class="whitespace-nowrap">
                <span class="text-[10.5px] sm:text-xs font-black uppercase tracking-wider bg-blue-900 text-white px-3 py-0.5 inline-block">
                  TRANSPORT CONTRACTOR AND COMMISSION AGENT
                </span>
              </div>

              <div class="text-[10px] sm:text-[10.5px] text-red-900 font-black tracking-tight uppercase leading-tight space-y-0.5 whitespace-nowrap text-center">
                <div>SURVEY NUMBER NA 178P8, 27 NATIONAL HIGHWAY,</div>
                <div>CHANDRAPUR, WANKANER-363621 DISTRICT-MORBI ( GUJRAT )</div>
              </div>
            </div>

            <!-- Right Side Column -->
            <div class="col-span-3 text-left text-[9.5px] sm:text-[10px] font-black text-slate-950 space-y-0.5 border-l border-slate-300 pl-3">
              <div>MOBILE NO. +91 99 79 111 555</div>
              <div>MOBILE NO. +91 81 41 111 555</div>
              <div>PAN NO. : DLTPS8567M</div>
              <div>GSTIN NO. : 24DLTPS8567M1ZT</div>
            </div>
          </div>
        </div>

        <!-- Title Strip -->
        <div class="bg-blue-900 text-white font-extrabold text-center py-0.5 tracking-wider uppercase flex flex-col items-center justify-center border-b-2 border-blue-900">
          <div class="text-[11px] font-black tracking-widest text-white leading-tight">GOODS CONSIGNMENT NOTE</div>
          <div class="text-[8.5px] font-bold tracking-wider text-amber-300 leading-tight">AT OWNER'S RISK</div>
        </div>

        <!-- LR Header Grid -->
        <div class="grid grid-cols-12 border-b-2 border-slate-900 font-extrabold text-[11px] divide-x-2 divide-slate-900 text-slate-950">
          <div class="col-span-3 p-1.5 bg-slate-100 flex items-center justify-center gap-2">
            <span>L.R. NO. :</span>
            <span class="text-lg font-black text-rose-700 font-mono">${lrData.lrNumber || ""}</span>
          </div>
          <div class="col-span-3 p-1.5 flex items-center gap-2">
            <span>DATE :</span>
            <span class="font-extrabold">${formatDateDisplay(lrData.dateTime)}</span>
          </div>
          <div class="col-span-3 p-1.5 flex items-center gap-2">
            <span>FROM :</span>
            <span class="uppercase font-black text-slate-950">${lrData.fromPlace || ""}</span>
          </div>
          <div class="col-span-3 p-1.5 flex items-center gap-2">
            <span>TO :</span>
            <span class="uppercase font-black text-slate-950">${lrData.toPlace || ""}</span>
          </div>
        </div>

        <!-- Truck No & Delivery At -->
        <div class="grid grid-cols-12 border-b-2 border-slate-900 font-extrabold text-[11px] divide-x-2 divide-slate-900 text-slate-950">
          <div class="col-span-6 p-1.5 flex items-center gap-2">
            <span>DELIVERY AT :</span>
            <span class="font-black uppercase text-slate-950">${lrData.deliveryAt || ""}</span>
          </div>
          <div class="col-span-6 p-1.5 flex items-center gap-2">
            <span>TRUCK NO. :</span>
            <span class="font-sans text-base font-black tracking-wider uppercase text-slate-950">${lrData.truckNo || ""}</span>
          </div>
        </div>

        <!-- Consignor & Consignee Box -->
        <div class="grid grid-cols-2 border-b-2 border-slate-900 divide-x-2 divide-slate-900 min-h-[95px]">
          <!-- Consignor Column -->
          <div class="p-2 flex flex-col justify-between">
            <div class="space-y-0.5">
              <div class="font-black text-[11px] underline uppercase text-slate-950">CONSIGNOR'S NAME & ADDRESS</div>
              <div class="font-black text-xs text-slate-950 uppercase whitespace-pre-line leading-tight">${lrData.consignorName || ""}</div>
              <div class="text-[10.5px] font-bold text-slate-950 leading-tight uppercase whitespace-pre-line">${lrData.consignorAddress || ""}</div>
            </div>
            <div class="font-sans font-extrabold text-[11px] pt-1 border-t border-slate-400 mt-1 text-slate-950">
              CONSIGNOR GSTIN NO. : <span class="font-black text-slate-950">${consignorGstDisplay}</span>
            </div>
          </div>

          <!-- Consignee Column -->
          <div class="p-2 flex flex-col justify-between">
            <div class="space-y-0.5">
              <div class="font-black text-[11px] underline uppercase text-slate-950">CONSIGNEE'S NAME & ADDRESS</div>
              <div class="font-black text-sm text-slate-950 uppercase">${lrData.consigneeName || ""}</div>
              <div class="text-[10.5px] font-bold text-slate-950 leading-tight uppercase whitespace-pre-line">${lrData.consigneeAddress || ""}</div>
            </div>
            <div class="font-sans font-extrabold text-[11px] pt-1 border-t border-slate-400 mt-1 text-slate-950">
              CONSIGNEE GSTIN NO. : <span class="font-black text-slate-950">${lrData.consigneeGst || ""}</span>
            </div>
          </div>
        </div>

        <!-- Goods Table -->
        <div class="border-b-2 border-slate-900 min-h-[110px]">
          <table class="w-full text-left border-collapse text-[11px]">
            <thead>
              <tr class="bg-slate-200 border-b-2 border-slate-900 font-black uppercase text-center divide-x-2 divide-slate-900 text-slate-950">
                <th class="p-1.5 w-24">NO. OF ARTICLE</th>
                <th class="p-1.5">DESCRIPTION OF GOODS</th>
                <th class="p-1.5 w-32">WEIGHT</th>
                <th class="p-1.5 w-28">RATE</th>
                <th class="p-1.5 w-36">FREIGHT (${lrData.toPayOrPaid || "TBB"})</th>
              </tr>
            </thead>
            <tbody class="divide-y border-b-2 border-slate-900 font-extrabold text-slate-950">
              <tr class="divide-x-2 divide-slate-900 text-center min-h-[80px]">
                <td class="p-2 font-black align-top text-slate-950">
                  <div class="min-h-[34px] flex flex-col justify-start">
                    <div class="font-black text-sm">${lrData.noOfArticles || ""}</div>
                    <span class="text-[10.5px] font-extrabold text-slate-950 uppercase">${lrData.bundles || ""}</span>
                  </div>
                  ${
                    lrData.noOfArticles2
                      ? `<div class="mt-1 pt-1 border-t border-slate-900 min-h-[34px] flex flex-col justify-start">
                          <div class="font-black text-sm">${lrData.noOfArticles2}</div>
                          <span class="text-[10.5px] font-extrabold text-slate-950 uppercase">${lrData.bundles2 || "BUNDLE"}</span>
                        </div>`
                      : ""
                  }
                </td>
                <td class="p-2 align-top text-center">
                  <div class="min-h-[34px] flex flex-col justify-start">
                    <div class="font-black uppercase text-sm text-slate-950">${lrData.descriptionOfGoods || ""}</div>
                  </div>
                  ${
                    lrData.noOfArticles2
                      ? `<div class="mt-1 pt-1 border-t border-slate-900 min-h-[34px] flex flex-col justify-start">
                          <div class="font-black uppercase text-sm text-slate-950">${lrData.descriptionOfGoods2 || "SANITARYWARE"}</div>
                        </div>`
                      : ""
                  }
                </td>
                <td class="p-2 font-sans font-black align-top text-slate-950">
                  ${lrData.weightKgs ? `${lrData.weightKgs} K.G.` : ""}
                </td>
                <td class="p-2 font-sans font-black align-top text-slate-950">
                  ${lrData.ratePerTon ? `${lrData.ratePerTon} ${lrData.rateType || ""}` : ""}
                </td>
                <td class="p-2 font-sans font-black text-center align-top text-sm text-slate-950">
                  ${lrData.freightAmount || ""}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Bottom Grid: Charges, GST, Invoice, Insurance, Bank details -->
        <div class="grid grid-cols-12 divide-x-2 divide-slate-900 flex-1 min-h-[400px]">
          <!-- Left Column (7 cols) -->
          <div class="col-span-7 text-[10px] flex flex-col justify-between h-full text-slate-950">
            <div class="font-black text-slate-950 border-b-2 border-slate-900 px-2 py-1 flex items-center gap-2">
              <span>GST PAYABLE BY :</span>
              <span class="font-black uppercase text-slate-950">${lrData.gstPayableBy || "CONSIGNEE"}</span>
            </div>

            <div class="font-black text-slate-950 border-b-2 border-slate-900 px-2 py-1">
              INVOICE NO. : <span class="font-black text-xs text-slate-950">${lrData.billNumbers || ""}</span>
            </div>

            <div class="font-black text-slate-950 border-b-2 border-slate-900 px-2 py-1">
              VALUE RS. : <span class="font-black text-xs text-slate-950">${lrData.invoiceValue || ""}</span>
            </div>

            <div class="font-black text-slate-950 border-b-2 border-slate-900 px-2 py-1">
              CONSIGNOR E-WAY BILL : <span class="font-black text-xs text-slate-950">${lrData.consignorEwayBill || ""}</span>
            </div>

            <div class="font-black text-slate-950 border-b-2 border-slate-900 px-2 py-1">
              CONSIGNEE E-WAY BILL : <span class="font-black text-xs text-slate-950">${lrData.consigneeEwayBill || ""}</span>
            </div>

            <div class="font-black text-slate-950 border-b-2 border-slate-900 px-2 py-1">
              DRIVER NO. : <span class="font-black text-xs text-slate-950">${lrData.driverMobile || ""}</span>
            </div>

            <div class="px-2 py-1 space-y-1">
              <div class="font-black uppercase text-red-700 bg-red-50 p-1 border-2 border-slate-900 text-[9.5px]">
                WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE.
              </div>
              <div class="font-black uppercase text-slate-950 bg-slate-200 p-1 border-2 border-slate-900 text-[9.5px]">
                FULL TRUCK LOAD ACCEPTED ALL OVER INDIA.
              </div>
              ${
                lrData.remarks &&
                lrData.remarks !== "WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE." &&
                lrData.remarks !== "FULL TRUCK LOAD ACCEPTED ALL OVER INDIA." &&
                lrData.remarks !== "WE ARE NOT RESPONSIBLE FOR LEAKAGE & BREAKAGE. FULL TRUCK LOAD ACCEPTED ALL OVER INDIA."
                  ? `<div class="font-black text-slate-950 text-[9.5px] uppercase p-1 border border-slate-900 bg-slate-100">
                      REMARKS: <span class="font-black">${lrData.remarks}</span>
                    </div>`
                  : ""
              }
            </div>

            <div class="px-2 py-1">
              <div class="border-2 border-slate-900 p-1.5 rounded text-[9.5px] bg-transparent space-y-0.5 text-slate-950 font-bold">
                <div class="font-black uppercase underline text-slate-950">INSURANCE :</div>
                <div class="font-bold text-slate-950">THE CUSTOMER HAS STATED THAT HE HAS NOT INSURED THE CONSIGNMENT OR HAS INSURED CONSIGNMENT.</div>
                <div class="grid grid-cols-3 gap-1 pt-0.5 border-t-2 border-slate-900 font-sans font-extrabold text-slate-950">
                  <span>COMPANY: ________</span>
                  <span>POLICY: ________</span>
                  <span>RISK: ________</span>
                </div>
              </div>
            </div>

            <div class="p-2">
              <div class="border-2 border-blue-900 p-1.5 rounded bg-transparent text-[9.5px] text-slate-950">
                <div class="font-black text-blue-950 uppercase border-b border-blue-300 pb-0.5 mb-0.5">
                  ICICI BANK LTD (RTGS / NEFT PAYMENT)
                </div>
                <div class="grid grid-cols-2 gap-x-2 gap-y-0.5 font-bold text-slate-950">
                  <div>NAME : <span class="font-black text-slate-950">WOLEGO TRANSPORT</span></div>
                  <div>ACCOUNT NO. : <span class="font-sans font-black text-slate-950">118405500444</span></div>
                  <div>IFSC CODE : <span class="font-sans font-black text-slate-950">ICIC0001184</span></div>
                  <div>BRANCH : <span class="font-black text-slate-950">WANKANER</span></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column (5 cols) -->
          <div class="col-span-5 bg-transparent flex flex-col justify-between font-sans text-xs h-full text-slate-950">
            <div>
              <div class="flex justify-between font-black border-b-2 border-slate-900 px-2.5 py-2 text-xs bg-slate-200 text-slate-950">
                <span>FREIGHT</span>
                <span>${lrData.freightAmount || 0}</span>
              </div>

              <div class="flex justify-between font-bold text-slate-950 px-2.5 py-2 border-b border-slate-300">
                <span>Add : S-G.S.T. @ 2.5%</span>
                <span class="font-extrabold text-slate-950">${lrData.sgstAmount || "0.00"}</span>
              </div>

              <div class="flex justify-between font-bold text-slate-950 px-2.5 py-2 border-b border-slate-300">
                <span>Add : C-G.S.T. @ 2.5%</span>
                <span class="font-extrabold text-slate-950">${lrData.cgstAmount || "0.00"}</span>
              </div>

              <div class="flex justify-between font-bold text-slate-950 px-2.5 py-2 border-b-2 border-slate-900">
                <span>Add : I-G.S.T. @ 5%</span>
                <span class="font-extrabold text-slate-950">${lrData.igstAmount || "0.00"}</span>
              </div>

              <div class="flex justify-between font-black border-b-2 border-slate-900 px-2.5 py-2 text-xs bg-slate-200 text-slate-950">
                <span>TOTAL WITH GST</span>
                <span>${lrData.totalWithGst || lrData.freightAmount || 0}</span>
              </div>

              <div class="flex justify-between font-bold text-slate-950 px-2.5 py-2 border-b border-slate-300">
                <span>Other Charges</span>
                <span class="font-extrabold text-slate-950">${lrData.otherCharges || "0.00"}</span>
              </div>

              <div class="flex justify-between font-bold text-slate-950 border-b-2 border-slate-900 px-2.5 py-2">
                <span>Less : Advance Paid</span>
                <span class="font-extrabold text-slate-950">${lrData.lessAdvancePaid || "0.00"}</span>
              </div>

              <div class="flex justify-between font-black text-sm border-b-2 border-slate-900 px-2.5 py-2.5 text-slate-950 bg-slate-200">
                <span>NET TOTAL:</span>
                <span>₹ ${lrData.netTotalAmount || lrData.freightAmount || 0}</span>
              </div>
            </div>

            <!-- Signatory Block -->
            <div class="text-center font-sans p-2 mt-auto flex flex-col items-center justify-end min-h-[60px]">
              <div class="font-black uppercase text-[11px] text-slate-950">FOR, WOLEGO TRANSPORT</div>
              ${
                sigImageSrc
                  ? `<img src="${sigImageSrc}" alt="Authorised Digital Signature" class="h-10 w-auto max-w-[150px] object-contain my-1 mix-blend-multiply" />`
                  : `<div class="h-6"></div>`
              }
              <div class="text-[9.5px] text-slate-950 uppercase tracking-wider font-extrabold">(AUTHORISED SIGNATORY)</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>

  <!-- PAGE 2: Terms & Conditions Document -->
  <div class="a4-page">
    <div class="print-document p-6 sm:p-10 relative">
      <div class="border border-slate-400 rounded-2xl p-6 sm:p-8 h-full flex flex-col justify-start relative overflow-hidden">
        
        <!-- Background Watermark Logo -->
        <div class="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
          ${
            logoBase64
              ? `<img src="${logoBase64}" alt="Watermark Logo" class="w-[450px] max-w-[75%] opacity-[0.08] object-contain mix-blend-multiply" />`
              : ""
          }
        </div>

        <div class="relative z-10 flex-1 flex flex-col justify-start">
          <div class="pb-4 mb-6 text-center">
            <div class="text-[10px] sm:text-[11px] font-bold text-slate-700 tracking-wider uppercase mb-2">
              :: GOOD BOOKED ON ARE REVERS CARRIED CARRIED SUBJECT TO THE FOLLOWING ::
            </div>
            <h2 class="text-xl sm:text-2xl font-black text-slate-950 uppercase tracking-widest border-b-2 border-slate-900 inline-block pb-1">
              TERMS AND CONDITIONS
            </h2>
          </div>

          <div class="space-y-4 text-[11px] sm:text-xs leading-relaxed text-slate-900 font-medium">
            <div class="flex gap-2.5">
              <span class="font-bold text-slate-950 shrink-0 min-w-[20px]">1)</span>
              <p>THE COMPANY DOES NOT GUARANTEE DELIVERY WITHIN ANY SPECIFIED TIME AND THE COMPANY DOES NOT BE LIABLE FOR ANY DELAY IN TRANSPORT OR DELIVERY, NOT ANY NEGLIGENCE FDEFAULT OF THE CARRIEROF HISAGENTS.</p>
            </div>

            <div class="flex gap-2.5">
              <span class="font-bold text-slate-950 shrink-0 min-w-[20px]">2)</span>
              <p>NATURE, CONTENTE CONDITION AND VALUE OF THE CONSIGNMENT ARE UNKNOWN TO GOODS CARRERS OF INDIA (HEREIN-AFTER CALLED THE COMPANY) THE COMPANY CARRY THE GOODSAND PACKEDAT OWNER'S RISK.</p>
            </div>

            <div class="flex gap-2.5">
              <span class="font-bold text-slate-950 shrink-0 min-w-[20px]">3)</span>
              <p>THE COMPANY SHALL NOT BE RESPONSIBLE IF THE GOOD S ARE DETAINED SEIZED OR CONFICATED GOVERNMENT AUTHORITIES.</p>
            </div>

            <div class="flex gap-2.5">
              <span class="font-bold text-slate-950 shrink-0 min-w-[20px]">4)</span>
              <p>THE COMPANY SHALL NOT BE LIABLE FOR ANY LOSS OR DAMAGE DUE TO PILFERAGE THEFT WEALTHIER CONDITIONS STRIKES, RIOTS, DISTURBANCES, FIRE EXPLOSION OR ACCIDENT, PROVIDED HOWEVER ALL REASONABLE PRECAUTIONS ARE TAKEN TO PROVIDE AGAINST SUCHCONTINGENCY.</p>
            </div>

            <div class="flex gap-2.5">
              <span class="font-bold text-slate-950 shrink-0 min-w-[20px]">5)</span>
              <p>NO ENQUIRY WELL ENTERTAINED RELATING TO ANY CONSIGNMENT AFTER THE EXPIRY OF 30 DAYSFORM THE DATE DELIVERY.</p>
            </div>

            <div class="flex gap-2.5">
              <span class="font-bold text-slate-950 shrink-0 min-w-[20px]">6)</span>
              <p>THE COMPANY IS NOT RESPONSIBLE FOR LEAKAGE, BREAKAGE OR SHORTAGE BY SUN, RAIN ORWATER DUE TOBAD ROAD CONDUCTION OR DUEIMPROPER PACKING ETC.</p>
            </div>

            <div class="flex gap-2.5">
              <span class="font-bold text-slate-950 shrink-0 min-w-[20px]">7)</span>
              <p>THE COURT IN WANKANER ALONE SHALL HAVE JURIDITION IN RESPECT OF ALLCLAIMS AND MATTESARISING UNDER THE CONSIGNMENT OF THEGOODS ENTRUSTED FOR TRANSPORT.</p>
            </div>

            <div class="flex gap-2.5">
              <span class="font-bold text-slate-950 shrink-0 min-w-[20px]">8)</span>
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
