import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { generateLRHtml } from "../utils/lrHtmlTemplate.js";

let browserInstance = null;

const findChromeExecutable = () => {
  const userProfile = process.env.USERPROFILE || "C:\\Users\\shakil";
  const localAppData = process.env.LOCALAPPDATA || "";

  const possiblePaths = [
    path.join(userProfile, ".cache", "puppeteer", "chrome", "win64-151.0.7922.47", "chrome-win64", "chrome.exe"),
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
  ];

  for (const p of possiblePaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }

  try {
    const cacheDir = path.join(userProfile, ".cache", "puppeteer", "chrome");
    if (fs.existsSync(cacheDir)) {
      const dirs = fs.readdirSync(cacheDir);
      for (const d of dirs) {
        const exePath = path.join(cacheDir, d, "chrome-win64", "chrome.exe");
        if (fs.existsSync(exePath)) {
          return exePath;
        }
      }
    }
  } catch (e) {
    // Ignore scan errors
  }

  return null;
};

const getBrowserInstance = async () => {
  if (!browserInstance || !browserInstance.connected) {
    const launchOptions = {
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    };

    const chromeExecutablePath = findChromeExecutable();
    if (chromeExecutablePath) {
      launchOptions.executablePath = chromeExecutablePath;
    }

    browserInstance = await puppeteer.launch(launchOptions);
  }
  return browserInstance;
};

export const generateLRPdf = async (req, res) => {
  let page = null;
  try {
    const { lrData, signatureImg } = req.body || {};

    if (!lrData) {
      return res.status(400).json({ error: "LR data is required." });
    }

    // 1. Generate full HTML in memory
    const htmlContent = generateLRHtml(lrData, signatureImg);

    // 2. Obtain Puppeteer browser instance
    const browser = await getBrowserInstance();
    page = await browser.newPage();

    // Set viewport matching A4 portrait aspect ratio
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });

    // Load HTML content
    await page.setContent(htmlContent, {
      waitUntil: ["load", "networkidle0"],
    });

    // 3. Generate PDF Buffer in memory (NO DISK SAVE)
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });

    // Helper to format filename: LR_0004_WolegoTransport_GJ28AA2626.pdf
    const lrNo = lrData?.lrNumber || "0000";
    let truck = (lrData?.truckNo || "").replace(/[^a-zA-Z0-9]/g, "").trim();
    const filename = truck
      ? `LR_${lrNo}_WolegoTransport_${truck}.pdf`
      : `LR_${lrNo}_WolegoTransport.pdf`;

    // 4. Send as binary PDF response directly from memory
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.status(200).send(Buffer.from(pdfBuffer));
  } catch (error) {
    console.error("PDF generation controller error:", error);
    res.status(500).json({ error: "Failed to generate PDF", details: error.message });
  } finally {
    // 5. Memory Cleanup: Close page to release RAM immediately
    if (page) {
      try {
        await page.close();
      } catch (e) {
        console.error("Error closing puppeteer page:", e);
      }
    }
  }
};
