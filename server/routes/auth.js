import express from "express";
import { addAdmin, login, logout, updateProfile } from "../controllers/auth.js";

const router = express.Router();

// Routes
router.post("/login", login);
router.post("/logout", logout);
router.put("/update", updateProfile);
router.post("/add-admin", addAdmin);

export default router;
