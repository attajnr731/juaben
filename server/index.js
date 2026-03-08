import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
import votersRoutes from "./routes/voters.js";
import settingsRoutes from "./routes/settings.js";
import candidatesRoutes from "./routes/candidates.js";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ CORS setup
app.use(
  cors({
    origin: ["http://localhost:5173", "https://kete-nm.onrender.com"], // your frontend origins
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-OTP", "X-Email"],
    credentials: true,
  }),
);

// CRITICAL: Parse JSON bodies
app.use(express.json()); // ADD THIS

// Parse URL-encoded (for forms) — optional but safe
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/voters", votersRoutes);
app.use("/api/candidates", candidatesRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
