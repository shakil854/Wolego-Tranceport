import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";
import sequelize from "./config/database.js";
import partyRoutes from "./routes/partyRoutes.js";
import lrRoutes from "./routes/lrRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import truckRoutes from "./routes/truckRoutes.js";
import truckPaymentRoutes from "./routes/truckPaymentRoutes.js";
import partyOrderRoutes from "./routes/partyOrderRoutes.js";
import truckOrderRoutes from "./routes/truckOrderRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "wolego-transport-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Register API Routes (support both /api/* and /* to prevent Nginx proxy mismatch 404s)
app.use("/api/auth", authRoutes);
app.use("/auth", authRoutes);

app.use("/api/parties", partyRoutes);
app.use("/parties", partyRoutes);

app.use("/api/lr-entries", lrRoutes);
app.use("/lr-entries", lrRoutes);

app.use("/api/lr", lrRoutes);
app.use("/lr", lrRoutes);

app.use("/api/trucks", truckRoutes);
app.use("/trucks", truckRoutes);

app.use("/api/truck-payments", truckPaymentRoutes);
app.use("/truck-payments", truckPaymentRoutes);

app.use("/api/party-orders", partyOrderRoutes);
app.use("/party-orders", partyOrderRoutes);

app.use("/api/truck-orders", truckOrderRoutes);
app.use("/truck-orders", truckOrderRoutes);

app.get("/", (req, res) => {
  res.send("Wolego Transport Billing Server is Running!");
});

// Sync database models if connected (Tries alter: true first, falls back smoothly if 64 keys limit is hit)
(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database models synchronized successfully with alter.");
  } catch (error) {
    if (error?.message?.includes("Too many keys")) {
      console.warn("MySQL 64-keys index limit reached. Synchronizing safely with standard sync...");
      try {
        await sequelize.sync();
        console.log("Database models synchronized successfully.");
      } catch (fallbackErr) {
        console.error("Database connection error:", fallbackErr.message);
      }
    } else {
      console.error("Database connection error:", error.message);
    }
  }
})();

// Start Server
const PORT = process.env.PORT || 8002;

app.listen(PORT, () => {
  console.log(`Wolego Transport server running on http://localhost:${PORT}`);
});
