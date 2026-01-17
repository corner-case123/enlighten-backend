const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();
const axios = require("axios");

async function checkModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is missing in .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("Checking models for API key...");

    try {
        const response = await axios.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        console.log("Found Models (checking access...):");
        const models = response.data.models;

        for (const modelInfo of models) {
            if (modelInfo.supportedGenerationMethods && modelInfo.supportedGenerationMethods.includes("generateContent")) {
                const modelName = modelInfo.name.replace("models/", "");
                process.stdout.write(`Testing ${modelName} ... `);
                try {
                    const model = genAI.getGenerativeModel({ model: modelName });
                    const result = await model.generateContent("Hello");
                    const response = await result.response;
                    console.log("SUCCESS ✅");
                } catch (err) {
                    console.log(`FAILED ❌ (${err.message.split(']')[0]}]...)`);
                }
            }
        }
    } catch (error) {
        console.error("Error fetching models list:", error.response ? error.response.data : error.message);
    }
}

checkModels();
