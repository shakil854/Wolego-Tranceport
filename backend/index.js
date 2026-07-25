import dotenv from "dotenv";
import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import session from "express-session";
import sequelize from "./config/database.js";
import partyRoutes from "./routes/partyRoutes.js";
import lrRoutes from "./routes/lrRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "wolego-transport-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// Register API Routes
app.use("/api/auth", authRoutes);
app.use("/api/parties", partyRoutes);
app.use("/api/lr-entries", lrRoutes);

app.get("/", (req, res) => {
  res.send("Wolego Transport Billing Server is Running!");
});

// Sync database models if connected
(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log("Database models synchronized successfully.");
  } catch (error) {
    console.log("Database connection error:", error.message);
  }
})();

// Start Server
const PORT = process.env.PORT || 8002;

app.listen(PORT, () => {
  console.log(`Wolego Transport server running on http://localhost:${PORT}`);
});
