const axios = require("axios");

// Fetch News from NewsAPI
const fetchNewsFromNewsAPI = async (req, res) => {
  try {
    const { category } = req.query;
    let apiUrl = `https://newsapi.org/v2/top-headlines?language=en&apiKey=${process.env.NEWS_API_KEY}`;
    
    // If category is provided, use it in the query
    if (category && category !== 'All') {
      apiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(category)}&language=en&apiKey=${process.env.NEWS_API_KEY}`;
    }
    
    const response = await axios.get(apiUrl);

    const articles = response.data.articles.map((article) => ({
      id: article.url,
      title: article.title || "No Title",
      description: article.description || "No Description",
      url: article.url || "#",
      source: article.source?.name || "Unknown",
      image: article.urlToImage || `https://source.unsplash.com/featured/800x600/?${category || 'news'}`,
      category: category || "General",
      publishedAt: article.publishedAt || new Date().toISOString(),
    }));

    res.json({ success: true, articles });
  } catch (error) {
    console.error("NewsAPI Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch news", error: error.message });
  }
};

// Fetch News from Guardian API
const fetchFromGuardian = async (req, res) => {
  try {
    const { category } = req.query;
    let queryParams = {
      "api-key": process.env.GUARDIAN_API_KEY,
      "show-fields": "headline,thumbnail,bodyText,shortUrl",
      "page-size": 10,
    };
    
    // If category is provided, use it in the query
    if (category && category !== 'All') {
      queryParams.q = category;
    }
    
    const response = await axios.get(`https://content.guardianapis.com/search`, {
      params: queryParams
    });

    const articles = response.data.response.results.map((article) => ({
      id: article.id,
      title: article.webTitle || "No Title",
      description: article.fields?.bodyText?.substring(0, 200) + "..." || "Read more about this topic...",
      url: article.fields?.shortUrl || article.webUrl || "#",
      source: "The Guardian",
      image: article.fields?.thumbnail || `https://source.unsplash.com/featured/800x600/?guardian-${category || 'news'}`,
      category: category || "General",
      publishedAt: article.webPublicationDate || new Date().toISOString(),
    }));

    res.json({ success: true, articles });
  } catch (error) {
    console.error("Guardian API Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch Guardian news", error: error.message });
  }
};

// Fetch News from MediaStack API
const fetchFromMediaStack = async (req, res) => {
  try {
    const { category } = req.query;
    let queryParams = {
      access_key: process.env.MEDIASTACK_API_KEY,
      languages: "en",
      limit: 10,
      sort: "published_desc",
    };
    
    // If category is provided, use it in the query
    if (category && category !== 'All') {
      queryParams.keywords = category;
    }
    
    const response = await axios.get(`http://api.mediastack.com/v1/news`, {
      params: queryParams
    });

    const articles = response.data.data.map((article) => ({
      id: article.url,
      title: article.title || "No Title",
      description: article.description || "Click to read more about this topic.",
      url: article.url || "#",
      source: article.source || "MediaStack",
      image: article.image || `https://source.unsplash.com/featured/800x600/?${category || 'news'}`,
      category: category || "General",
      publishedAt: article.published_at || new Date().toISOString(),
    }));

    res.json({ success: true, articles });
  } catch (error) {
    console.error("MediaStack API Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch MediaStack news", error: error.message });
  }
};

// Fetch News from all sources
const fetchAllNews = async (req, res) => {
  try {
    const { category } = req.query;
    let allArticles = [];
    
    try {
      const newsApiResponse = await axios.get(`http://localhost:${process.env.PORT}/api/news/newsapi`, {
        params: { category }
      });
      if (newsApiResponse.data.success) {
        allArticles = [...allArticles, ...newsApiResponse.data.articles];
      }
    } catch (error) {
      console.error("Error fetching from News API:", error.message);
    }
    
    try {
      const guardianResponse = await axios.get(`http://localhost:${process.env.PORT}/api/news/guardian`, {
        params: { category }
      });
      if (guardianResponse.data.success) {
        allArticles = [...allArticles, ...guardianResponse.data.articles];
      }
    } catch (error) {
      console.error("Error fetching from Guardian API:", error.message);
    }
    
    try {
      const mediaStackResponse = await axios.get(`http://localhost:${process.env.PORT}/api/news/mediastack`, {
        params: { category }
      });
      if (mediaStackResponse.data.success) {
        allArticles = [...allArticles, ...mediaStackResponse.data.articles];
      }
    } catch (error) {
      console.error("Error fetching from MediaStack API:", error.message);
    }
    
    // Remove duplicates based on title
    const uniqueArticles = Array.from(
      new Map(allArticles.map(item => [item.title, item])).values()
    );
    
    // Sort by date
    const sortedArticles = uniqueArticles.sort(
      (a, b) => new Date(b.publishedAt) - new Date(a.publishedAt)
    );
    
    res.json({ success: true, articles: sortedArticles });
  } catch (error) {
    console.error("Error fetching all news:", error.message);
    res.status(500).json({ success: false, message: "Failed to fetch news from all sources", error: error.message });
  }
};

// Fetch a single article by ID or URL
const fetchArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    let articleId = id;
    
    // Check if the ID is a URL that needs to be decoded
    if (id.includes('%')) {
      articleId = decodeURIComponent(id);
    }
    
    // Try to fetch from News API
    try {
      const newsApiResponse = await axios.get(`https://newsapi.org/v2/everything`, {
        params: {
          qInTitle: articleId,
          apiKey: process.env.NEWS_API_KEY,
          language: "en",
          pageSize: 1,
        },
      });
      
      if (newsApiResponse.data && newsApiResponse.data.articles && newsApiResponse.data.articles.length > 0) {
        const article = newsApiResponse.data.articles[0];
        return res.json({
          success: true,
          article: {
            id: article.url,
            title: article.title,
            description: article.description,
            content: article.content,
            image: article.urlToImage,
            url: article.url,
            source: article.source?.name,
            publishedAt: article.publishedAt,
            author: article.author,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching from News API:", error.message);
    }
    
    // Try to fetch from Guardian API
    try {
      // Extract possible Guardian ID from the URL
      let guardianId = articleId;
      if (articleId.includes('theguardian.com')) {
        const urlParts = articleId.split('/');
        guardianId = urlParts[urlParts.length - 1];
      }
      
      const guardianResponse = await axios.get(`https://content.guardianapis.com/${guardianId}`, {
        params: {
          "api-key": process.env.GUARDIAN_API_KEY,
          "show-fields": "headline,thumbnail,bodyText,byline,shortUrl,body",
        },
      });
      
      if (guardianResponse.data && guardianResponse.data.response && guardianResponse.data.response.content) {
        const article = guardianResponse.data.response.content;
        return res.json({
          success: true,
          article: {
            id: article.id,
            title: article.webTitle,
            description: article.fields?.bodyText?.substring(0, 200) + "..." || "Read more about this topic...",
            content: article.fields?.body || article.fields?.bodyText,
            image: article.fields?.thumbnail,
            url: article.webUrl,
            source: "The Guardian",
            publishedAt: article.webPublicationDate,
            author: article.fields?.byline,
          },
        });
      }
    } catch (error) {
      console.error("Error fetching from Guardian API:", error.message);
    }
    
    // If we couldn't find the article, return a 404
    res.status(404).json({
      success: false,
      message: "Article not found",
    });
  } catch (error) {
    console.error("Error fetching article by ID:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch article",
      error: error.message,
    });
  }
};

module.exports = { 
  fetchNewsFromNewsAPI,
  fetchFromGuardian,
  fetchFromMediaStack,
  fetchAllNews,
  fetchArticleById
};
