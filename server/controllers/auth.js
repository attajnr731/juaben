import Admin from "../models/Admin.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res
        .status(400)
        .json({ message: "Email and password are required." });

    const admin = await Admin.findOne({ email });
    if (!admin)
      return res.status(401).json({ message: "Invalid email or password." });

    const match = await bcrypt.compare(password, admin.password);
    if (!match)
      return res.status(401).json({ message: "Invalid email or password." });

    const token = jwt.sign(
      { id: admin._id, email: admin.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.status(200).json({
      message: "Login successful",
      token,
      admin: { id: admin._id, name: admin.name, email: admin.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error." });
  }
};

// ✅ Logout — just tells the client to discard the token
export const logout = (req, res) => {
  return res.status(200).json({ message: "Logout successful" });
};

// ✅ Update profile
export const updateProfile = async (req, res) => {
  const { userId, phone, oldPassword, newPassword } = req.body;

  try {
    const user = await Admin.findById(userId);
    if (!user) return res.status(404).json({ message: "Admin not found" });

    if (phone) user.phone = phone;

    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch)
        return res.status(400).json({ message: "Old password is incorrect" });

      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    return res
      .status(200)
      .json({ message: "Profile updated successfully", user });
  } catch (error) {
    return res.status(500).json({ message: "Server error", error });
  }
};

export const addAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, isActive } = req.body;

    if (!name || !email || !password || !phone)
      return res.status(400).json({ message: "All fields are required" });

    const existing = await Admin.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Admin already exists" });

    const newAdmin = new Admin({
      name,
      email,
      password,
      phone,
      isActive: isActive ?? true,
    });

    await newAdmin.save();

    return res.status(201).json({
      message: "Admin added successfully",
      user: {
        id: newAdmin._id,
        name: newAdmin.name,
        email: newAdmin.email,
        phone: newAdmin.phone,
        isActive: newAdmin.isActive,
      },
    });
  } catch (error) {
    console.error("Error adding admin:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
