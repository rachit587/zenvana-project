import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

export const getGeminiResponse = async (prompt) => {
    try {
        const result = await model.generateContent(prompt);
        return result.response.text();
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get response from Gemini. Please try again.");
    }
};

export const analyzeDocument = async (base64Image, financialSummary) => {
    try {
        const prompt = [
            `You are ZENVANA, a hyper-personalized AI financial advisor for India. Your task is to extract income and expense data from the following image of a financial document (e.g., bank statement, pay stub) and return it as a JSON object.

            **INSTRUCTIONS:**
            1.  Scan the document for keywords like "salary," "income," "credit," "rent," "bill," "EMI," "debit," etc.
            2.  Calculate the total monthly income and total monthly expenses.
            3.  Create a JSON object with two keys: "monthlyIncome" and "expenses".
            4.  For "expenses", provide a breakdown based on the categories in the user's current profile, if possible.
            5.  **DO NOT** include any personal or private information from the document in your response. Only provide the JSON object.
            6.  If no data can be extracted, return an empty JSON object: {}.
            7.  Your entire response must be a valid JSON object. Do not include any other text.
            
            Example JSON:
            {
                "monthlyIncome": 55000,
                "expenses": {
                    "housing": 15000,
                    "food": 8000,
                    "utilities": 3000,
                    "miscellaneous": 5000
                }
            }
            `,
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg"
                },
            },
        ];

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        return JSON.parse(responseText.trim());
    } catch (error) {
        console.error("Error analyzing document:", error);
        throw new Error("Failed to analyze the document. Please try again.");
    }
};
