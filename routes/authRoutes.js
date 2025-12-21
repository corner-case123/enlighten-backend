const express = require("express");
const User = require("../models/User.js");
const Member = require("../models/Members.js");
const Profile = require("../models/Profile.js");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { protect } = require("../middleware/authMiddleware.js");
const dotenv = require("dotenv");

dotenv.config();

const router = express.Router();

// Generate JWT Token
const generateToken = (res, userId) => {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  // Set the token in a cookie with proper settings
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", // Changed from strict to lax to allow cross-site requests
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/", // Make cookie available on all paths
    domain: process.env.NODE_ENV === "production" ? undefined : "localhost"
  });

  return token;
};

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, dateOfBirth, location } = req.body;
    console.log(req.body);
    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      dateOfBirth,
      location,
    });

    // Create profile for the user
    const profile = await Profile.create({
      userId: user._id,
      name: user.name,
      dateOfBirth: dateOfBirth,
      location: location,
      description: "",
      speaks: [],
      learns: [],
      about: "",
      partnerPreference: "",
      learningGoals: "",
      nativeLanguage: "",
      fluentLanguage: "",
      learningLanguage: "",
      translateLanguage: "",
      communication: "Not set",
      timeCommitment: "Not set",
      learningSchedule: "Not set",
      correctionPreference: "Not set",
      topics: ["Life"],
      showLocation: true,
      notifications: true,
      profilePicture: "",
    });

    // Generate JWT token
    const token = generateToken(res, user._id);

    // Send response with token
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      dateOfBirth: user.dateOfBirth,
      location: user.location,
      token, // Token is sent in the response
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// @route   POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      // Generate token and set it in cookie
      const token = generateToken(res, user._id);
      
      // Return user data without sensitive information
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        dateOfBirth: user.dateOfBirth,
        location: user.location,
        token
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// @route   GET /api/auth/verify/me
router.get("/verify/me", protect, async (req, res) => {
  res.json(req.user);
});

// Verify login status
router.get("/verify/login", protect, async (req, res) => {
  try {
    // If the protect middleware passes, the user is authenticated
    res.status(200).json({
      success: true,
      user: req.user, // User data from the protect middleware
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// @route   POST /api/auth/logout
router.post("/logout", (req, res) => {
  // Clear the cookie with the same settings used when setting it
  res.cookie("token", "", { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
    domain: process.env.NODE_ENV === "production" ? undefined : "localhost"
  });
  res.json({ message: "Logged out successfully" });
});

// @route   DELETE /api/auth/delete-account
// @desc    Delete user account and all associated data
// @access  Private
router.delete("/delete-account", protect, async (req, res) => {
  try {
    const userId = req.user._id;

    // Delete user's profile
    await Profile.findOneAndDelete({ userId: userId });

    // Delete user's member data
    await Member.findOneAndDelete({ user: userId });

    // Delete user's chat data (assuming you have a Chat model)
    // await Chat.deleteMany({ $or: [{ sender: userId }] });

    // Delete user's subscription data (assuming you have a Subscription model)
    // await Subscription.findOneAndDelete({ userId: userId });

    // Finally, delete the user
    await User.findByIdAndDelete(userId);

    // Clear the authentication cookie
    res.cookie("token", "", { httpOnly: true, expires: new Date(0) });

    res.json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Account deletion error:", error);
    res.status(500).json({ message: "Failed to delete account" });
  }
});

module.exports = router;
