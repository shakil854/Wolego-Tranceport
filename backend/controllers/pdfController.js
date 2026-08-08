import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { generateLRHtml } from "../utils/lrHtmlTemplate.js";

let browserInstance = null;

const findChromeExecutable = () => {
  const isWin = process.platform === "win32";

  // 1. System Chrome/Chromium installation paths
  const systemPaths = isWin
    ? [
        "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
        path.join(process.env.LOCALAPPDATA || "", "Google", "Chrome", "Application", "chrome.exe"),
        path.join(process.env.USERPROFILE || "C:\\Users\\shakil", "AppData", "Local", "Google", "Chrome", "Application", "chrome.exe"),
      ]
    : [
        "/usr/bin/google-chrome",
        "/usr/bin/google-chrome-stable",
        "/usr/bin/chromium",
        "/usr/bin/chromium-browser",
        "/snap/bin/chromium",
      ];

  for (const p of systemPaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }

  // 2. Scan Puppeteer Cache Directory dynamically
  try {
    const homeDir = process.env.HOME || process.env.USERPROFILE || "C:\\Users\\shakil";
    const cacheDir = path.join(homeDir, ".cache", "puppeteer", "chrome");

    if (fs.existsSync(cacheDir)) {
      const dirs = fs.readdirSync(cacheDir);
      for (const d of dirs) {
        const winExe = path.join(cacheDir, d, "chrome-win64", "chrome.exe");
        const win32Exe = path.join(cacheDir, d, "chrome-win32", "chrome.exe");
        const linuxExe = path.join(cacheDir, d, "chrome-linux64", "chrome");
        const linuxBin = path.join(cacheDir, d, "chrome-linux", "chrome");

        if (fs.existsSync(winExe)) return winExe;
        if (fs.existsSync(win32Exe)) return win32Exe;
        if (fs.existsSync(linuxExe)) return linuxExe;
        if (fs.existsSync(linuxBin)) return linuxBin;
      }
    }
  } catch (e) {
    // Ignore scan errors
  }

  // 3. Try Puppeteer's built-in executablePath resolver
  try {
    const pPath = puppeteer.executablePath();
    if (pPath && fs.existsSync(pPath)) {
      return pPath;
    }
  } catch (e) {
    // Ignore
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
        "--no-first-run",
        "--no-zygote",
        "--disable-extensions",
        "--disable-background-networking",
      ],
    };

    const chromeExecutablePath = findChromeExecutable();
    if (chromeExecutablePath) {
      launchOptions.executablePath = chromeExecutablePath;
    }

    try {
      browserInstance = await puppeteer.launch(launchOptions);
    } catch (launchErr) {
      if (launchOptions.executablePath) {
        console.warn("Failed to launch with custom executablePath, retrying default puppeteer.launch:", launchErr.message);
        delete launchOptions.executablePath;
        browserInstance = await puppeteer.launch(launchOptions);
      } else {
        throw launchErr;
      }
    }
  }
  return browserInstance;
};

// Pre-warm browser instance on server start
getBrowserInstance().catch((e) => {
  console.warn("Pre-warm browser launch warning:", e?.message);
});

export const generateLRPdf = async (req, res) => {
  let page = null;
  try {
    const { lrData, signatureImg, selectedCopies, selectedCopyType } = req.body || {};

    if (!lrData) {
      return res.status(400).json({ error: "LR data is required." });
    }

    // 1. Generate full HTML in memory
    const htmlContent = generateLRHtml(lrData, signatureImg, selectedCopies || selectedCopyType);

    // 2. Obtain pre-warmed Puppeteer browser instance (with retry on failure)
    let browser;
    try {
      browser = await getBrowserInstance();
      page = await browser.newPage();
    } catch (err) {
      console.warn("Retrying Puppeteer browser launch after error:", err.message);
      if (browserInstance) {
        try { await browserInstance.close(); } catch (e) { }
        browserInstance = null;
      }
      browser = await getBrowserInstance();
      page = await browser.newPage();
    }

    // Set viewport matching exact A4 pixel dimensions (794x1123) with 4x Ultra-HD DPI scale factor
    await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 4 });

    // Load HTML content instantly
    await page.setContent(htmlContent, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
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
    if (browserInstance) {
      try { await browserInstance.close(); } catch (e) { }
      browserInstance = null;
    }
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
