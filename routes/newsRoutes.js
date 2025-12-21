const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { 
  fetchNewsFromNewsAPI, 
  fetchFromGuardian, 
  fetchFromMediaStack,
  fetchAllNews,
  fetchArticleById 
} = require("../controllers/newsController");

// Route to fetch from News API
router.get("/newsapi", fetchNewsFromNewsAPI);

// Route to fetch from Guardian API
router.get("/guardian", fetchFromGuardian);

// Route to fetch from MediaStack API
router.get("/mediastack", fetchFromMediaStack);

// Route to fetch from all sources
router.get("/all", fetchAllNews);

// Route to fetch a single article by ID
router.get("/article/:id", fetchArticleById);

// Default route for backward compatibility
router.get("/", fetchAllNews);

module.exports = router;
