const express = require("express");
const router = express.Router();
const subscriptionController = require("../controllers/subscriptionController");
const auth = require("../middleware/auth");
const Subscription = require("../models/Subscription.js");
const { protect } = require("../middleware/authMiddleware.js");

// Stripe webhook endpoint - no auth required as it's called by Stripe
router.post("/webhook", subscriptionController.handleStripeWebhook);

// Get user's subscription status - requires authentication
router.get("/status", auth, async (req, res) => {
  try {
    const subscription = await subscriptionController.getUserSubscription(
      req,
      res
    );
    return subscription;
  } catch (error) {
    console.error("Subscription Status Error:", error);
    return res
      .status(500)
      .json({ error: "Error fetching subscription status" });
  }
});

router.get("/check-subscription", protect, async (req, res) => {
  try {
    // PAYWALL BYPASS: Always return premium
    return res.status(200).json({
      isSubscribed: true,
      message: "User has an active premium subscription (bypass)",
    });
  } catch (error) {
    console.error("Error checking subscription:", error);
    res
      .status(500)
      .json({ message: "Server error while checking subscription" });
  }
});

module.exports = router;
