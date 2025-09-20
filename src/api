import axios from 'axios';

const groqClient = axios.create({
    baseURL: 'https://api.groq.com/openai/v1/chat/completions',
    headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_GROQ_API_KEY}`,
        'Content-Type': 'application/json',
    },
});

export const getGroqResponse = async (messages) => {
    try {
        const response = await groqClient.post('', {
            messages: messages,
            model: "llama3-8b-8192"
        });
        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error calling Groq API:", error);
        throw new Error("Failed to get response from Groq. Please try again.");
    }
};
