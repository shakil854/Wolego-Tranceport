import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import puppeteer from "puppeteer";
import { generateLRHtml } from "../utils/lrHtmlTemplate.js";

let browserInstance = null;

const findChromeExecutable = () => {
  const isWin = process.platform === "win32";

  // 1. Direct System Paths
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
        "/opt/google/chrome/chrome",
        "/opt/google/chrome/google-chrome",
        "/usr/local/bin/chrome",
        "/usr/local/bin/chromium",
        "/usr/bin/headless-shell",
      ];

  for (const p of systemPaths) {
    if (p && fs.existsSync(p)) {
      return p;
    }
  }

  // Recursive search helper
  const findBinaryRecursively = (dir, targetNames, maxDepth = 4) => {
    if (!fs.existsSync(dir) || maxDepth <= 0) return null;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isFile()) {
          const lowerName = entry.name.toLowerCase();
          if (targetNames.includes(lowerName)) {
            return fullPath;
          }
        } else if (entry.isDirectory()) {
          const found = findBinaryRecursively(fullPath, targetNames, maxDepth - 1);
          if (found) return found;
        }
      }
    } catch (e) {
      // Ignore read errors
    }
    return null;
  };

  const targetNames = isWin
    ? ["chrome.exe"]
    : ["chrome", "google-chrome", "chromium", "chromium-browser", "chrome-headless-shell"];

  // 2. Scan all possible Puppeteer cache roots (/root/.cache/puppeteer, ~/.cache/puppeteer, /home/*/.cache/puppeteer)
  const possibleCacheRoots = [
    path.join(process.env.HOME || "/root", ".cache", "puppeteer"),
    path.join(process.env.USERPROFILE || "C:\\Users\\shakil", ".cache", "puppeteer"),
    "/root/.cache/puppeteer",
    "/home",
  ];

  for (const root of possibleCacheRoots) {
    if (fs.existsSync(root)) {
      const found = findBinaryRecursively(root, targetNames, 5);
      if (found) return found;
    }
  }

  // 3. Try Puppeteer built-in executablePath
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

const installChromeIfNeeded = () => {
  try {
    console.log("Automated Puppeteer Chrome installation starting via npx...");
    execSync("npx puppeteer browsers install chrome", {
      stdio: "inherit",
      timeout: 180000,
    });
    console.log("Automated Puppeteer Chrome installation completed.");
  } catch (e) {
    console.warn("Auto Chrome installation failed or timed out:", e?.message);
  }
};

const getBrowserInstance = async () => {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }

  const baseArgs = [
    "--no-sandbox",
    "--disable-setuid-sandbox",
    "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas",
    "--disable-gpu",
    "--no-first-run",
    "--no-zygote",
    "--disable-extensions",
    "--disable-background-networking",
  ];

  // Tier 1: Try system Chrome/Chromium installation
  const systemChrome = findChromeExecutable();
  if (systemChrome) {
    try {
      browserInstance = await puppeteer.launch({
        executablePath: systemChrome,
        headless: "new",
        args: baseArgs,
      });
      console.log("Puppeteer launched using system Chrome at:", systemChrome);
      return browserInstance;
    } catch (err1) {
      console.warn("Launch failed with system Chrome at", systemChrome, ":", err1?.message);
    }
  }

  // Tier 2: Try default Puppeteer bundled Chrome (no custom executablePath)
  try {
    browserInstance = await puppeteer.launch({
      headless: "new",
      args: baseArgs,
    });
    console.log("Puppeteer launched using default bundled Chrome.");
    return browserInstance;
  } catch (err2) {
    console.warn("Default Puppeteer launch failed:", err2?.message);
  }

  // Tier 3: Legacy headless mode fallback with single-process
  try {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: [...baseArgs, "--single-process"],
      executablePath: systemChrome || undefined,
    });
    console.log("Puppeteer launched using legacy headless mode.");
    return browserInstance;
  } catch (err3) {
    console.error("All Puppeteer launch attempts failed:", err3?.message);
    throw err3;
  }
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

    // Load HTML content instantly & wait for webfonts/CSS to be 100% loaded
    await page.setContent(htmlContent, {
      waitUntil: ["domcontentloaded", "networkidle0"],
      timeout: 30000,
    });

    // Ensure all custom fonts (Inter, Google Fonts) are completely rendered before PDF capture
    await page.evaluateHandle("document.fonts.ready").catch(() => {});

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
