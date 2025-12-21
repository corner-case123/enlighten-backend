const { GoogleGenerativeAI } = require("@google/generative-ai");

// Ensure environment variables are loaded
require('dotenv').config();

// Initialize Gemini
if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY environment variable is not set");
  console.error("Make sure you have a .env file with GEMINI_API_KEY=your_api_key");
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const translateText = async (text, targetLanguage, mode = 'neutral') => {
  try {
    let systemPrompt = '';
    
    // Define translation prompts based on mode
    switch (mode) {
      case 'polite':
        systemPrompt = `You are a professional translator. Translate the given text to ${getLanguageName(targetLanguage)} in a very polite, formal, and respectful manner. Use honorifics and formal language wherever appropriate. For example, use formal pronouns like 'আপনি' in Bengali, 'आप' in Hindi, 'آپ' in Urdu, and polite expressions like "please" in English. Provide ONLY the translation, no explanations or alternatives.`;
        break;
      case 'aggressive':
        systemPrompt = `You are a direct translator. Translate the given text to ${getLanguageName(targetLanguage)} in a casual, direct, and informal manner. Use casual pronouns like 'তুমি/তুই' in Bengali, 'तुम' in Hindi, 'تم' in Urdu. Make the translation sound direct and straightforward, removing unnecessary politeness. For common greetings, use casual forms like "কেমন আছিস" instead of "কেমন আছেন" in Bengali. Provide ONLY the translation, no explanations.`;
        break;
      default: // neutral
        systemPrompt = `You are a professional translator. Translate the given text to ${getLanguageName(targetLanguage)} accurately while maintaining natural and grammatically correct language. Use the standard, commonly used forms of words and expressions. Provide ONLY the translation, no explanations.`;
        break;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(systemPrompt + '\n\nTranslate: ' + text);
    const response = await result.response;
    const translatedText = response.text().trim();

    return translatedText;
  } catch (error) {
    console.error('Translation error:', error);
    throw error;
  }
};

// Generate 4 quiz options using Gemini Flash and determine the correct one
const generateQuizOptions = async (text, targetLanguage, difficulty = 'medium') => {
  try {
    let systemPrompt = '';
    
    // Create difficulty-specific prompts
    switch (difficulty) {
      case 'easy':
        systemPrompt = `You are a language quiz generator. Create a multiple choice translation quiz.

Given text: "${text}"
Target language: ${getLanguageName(targetLanguage)}

Generate exactly 4 translation options:
1. One CORRECT translation
2. Three OBVIOUSLY WRONG translations (completely different meanings, wrong language, or grammatical nonsense)

Make the wrong options clearly distinguishable from the correct one.

Respond ONLY with a JSON object in this exact format:
{
  "options": ["option1", "option2", "option3", "option4"],
  "correctIndex": 0
}

Where correctIndex is the position (0-3) of the correct translation in the options array.`;
        break;
      case 'medium':
        systemPrompt = `You are a language quiz generator. Create a multiple choice translation quiz.

Given text: "${text}"
Target language: ${getLanguageName(targetLanguage)}

Generate exactly 4 translation options:
1. One CORRECT translation
2. Three MODERATELY WRONG translations (similar context but wrong meaning, or grammatically correct but semantically incorrect)

Make the wrong options plausible but still clearly incorrect to someone who knows the language well.

Respond ONLY with a JSON object in this exact format:
{
  "options": ["option1", "option2", "option3", "option4"],
  "correctIndex": 0
}

Where correctIndex is the position (0-3) of the correct translation in the options array.`;
        break;
      case 'hard':
        systemPrompt = `You are a language quiz generator. Create a challenging multiple choice translation quiz.

Given text: "${text}"
Target language: ${getLanguageName(targetLanguage)}

Generate exactly 4 translation options:
1. One CORRECT translation (most accurate and natural)
2. Three SUBTLE VARIATIONS that are almost correct but have small errors:
   - One with slightly wrong formality level (too formal or informal)
   - One with correct meaning but awkward phrasing
   - One with a subtle grammatical or vocabulary mistake

All options should be in the target language and look plausible to intermediate speakers.

Respond ONLY with a JSON object in this exact format:
{
  "options": ["option1", "option2", "option3", "option4"],
  "correctIndex": 0
}

Where correctIndex is the position (0-3) of the correct translation in the options array.`;
        break;
      default:
        systemPrompt = `You are a language quiz generator. Create a multiple choice translation quiz.

Given text: "${text}"
Target language: ${getLanguageName(targetLanguage)}

Generate exactly 4 translation options:
1. One CORRECT translation
2. Three MODERATELY WRONG translations (similar context but wrong meaning, or grammatically correct but semantically incorrect)

Make the wrong options plausible but still clearly incorrect to someone who knows the language well.

Respond ONLY with a JSON object in this exact format:
{
  "options": ["option1", "option2", "option3", "option4"],
  "correctIndex": 0
}

Where correctIndex is the position (0-3) of the correct translation in the options array.`;
        break;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const responseText = response.text().trim();

    // Parse the JSON response
    let quizData;
    try {
      // Remove markdown code block wrapping if present
      let cleanResponse = responseText;
      if (responseText.includes('```json')) {
        cleanResponse = responseText.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
      } else if (responseText.includes('```')) {
        cleanResponse = responseText.replace(/```\s*/g, '').replace(/```\s*$/g, '');
      }
      
      quizData = JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', responseText);
      throw new Error('Invalid response format from AI');
    }

    // Validate the response structure
    if (!quizData.options || !Array.isArray(quizData.options) || quizData.options.length !== 4) {
      throw new Error('Invalid options array from AI');
    }

    if (typeof quizData.correctIndex !== 'number' || quizData.correctIndex < 0 || quizData.correctIndex > 3) {
      throw new Error('Invalid correctIndex from AI');
    }

    return quizData;
  } catch (error) {
    console.error('Quiz generation error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    throw error;
  }
};

// Helper function to get language names
const getLanguageName = (code) => {
  const languages = {
    'en': 'English',
    'bn': 'Bengali (বাংলা)',
    'hi': 'Hindi (हिन्दी)',
    'ur': 'Urdu (اردو)',
    'ar': 'Arabic (العربية)',
    'fr': 'French (Français)',
    'zh-CN': 'Chinese (中文)',
    'zh': 'Chinese (中文)',
    'es': 'Spanish (Español)',
    'de': 'German (Deutsch)',
    'ja': 'Japanese (日本語)',
    'ko': 'Korean (한국어)',
    'pt': 'Portuguese (Português)',
    'ru': 'Russian (Русский)',
    'it': 'Italian (Italiano)',
    'nl': 'Dutch (Nederlands)',
    'tr': 'Turkish (Türkçe)',
    'pl': 'Polish (Polski)',
    'th': 'Thai (ไทย)',
    'vi': 'Vietnamese (Tiếng Việt)'
  };
  
  return languages[code] || code;
};

const verifyTranslation = async (req, res) => {
  const { originalText, translation, targetLanguage } = req.body;
  
  if (!originalText || !translation || !targetLanguage) {
    return res.status(400).json({ error: "Original text, translation, and target language are required" });
  }

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `You are a professional translation accuracy checker. 

Original text: "${originalText}"
Translation: "${translation}"
Target language: ${getLanguageName(targetLanguage)}

Is this translation accurate and correct? Consider:
1. Meaning accuracy
2. Grammar correctness
3. Natural language usage
4. Cultural appropriateness

Respond with only "CORRECT" or "INCORRECT" followed by a brief reason.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text().trim();

    const isCorrect = responseText.toLowerCase().includes('correct') && !responseText.toLowerCase().includes('incorrect');
    
    res.json({ 
      isCorrect,
      explanation: responseText,
      originalText,
      translation,
      targetLanguage
    });
  } catch (error) {
    console.error("Error verifying translation:", error);
    res.status(500).json({ error: "Failed to verify translation" });
  }
};

const generateQuizOptionsController = async (req, res) => {
  const { text, targetLanguage, difficulty = 'medium' } = req.body;
  
  if (!text || !targetLanguage) {
    return res.status(400).json({ error: "Text and target language are required" });
  }

  try {
    const quizData = await generateQuizOptions(text, targetLanguage, difficulty);
    res.json({
      options: quizData.options,
      correctIndex: quizData.correctIndex,
      difficulty: difficulty,
      originalText: text,
      targetLanguage: targetLanguage
    });
  } catch (error) {
    console.error("Error generating quiz options:", error);
    console.error("Error details:", error.message);
    console.error("Request data:", { text, targetLanguage, difficulty });
    res.status(500).json({ error: "Failed to generate quiz options", details: error.message });
  }
};

const tranlate = async (req, res) => {
  const { text, targetLanguage, mode = 'neutral' } = req.body;
  
  if (!text || !targetLanguage) {
    return res.status(400).json({ error: "Text and target language are required" });
  }

  try {
    const translatedText = await translateText(text, targetLanguage, mode);
    res.json({ translatedText, mode, targetLanguage });
  } catch (error) {
    console.error("Error translating text:", error);
    res.status(500).json({ error: "Failed to translate text" });
  }
};

module.exports = {
  tranlate,
  verifyTranslation,
  generateQuizOptionsController,
};
