// src/api/cloudflare.js

const CLOUDFLARE_WORKER_URL = process.env.REACT_APP_CLOUDFLARE_WORKER_URL;

const TEXT_MODEL = "@cf/meta/llama-3-8b-instruct";
const VISION_MODEL = "@cf/llava-hf/llava-1.5-7b-hf";

export const getCloudflareResponse = async (messages) => {
    if (!CLOUDFLARE_WORKER_URL) {
        console.error("Cloudflare Worker URL is not configured.");
        return "My apologies, the Zenvana analysis AI is not configured correctly.";
    }
    try {
        const response = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: TEXT_MODEL, messages, stream: false })
        });
        if (!response.ok) throw new Error(`Cloudflare AI responded with status: ${response.status}`);
        const result = await response.json();
        return result.response || "No response text found.";
    } catch (error) {
        console.error("Error calling Cloudflare AI:", error);
        return "My apologies, the Zenvana analysis AI is currently experiencing high traffic.";
    }
};

export const getCloudflareStreamedResponse = async (messages, onChunk) => {
    if (!CLOUDFLARE_WORKER_URL) {
        onChunk("My apologies, the Zenvana analysis AI is not configured correctly.");
        return;
    }
    try {
        const response = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: TEXT_MODEL, messages, stream: true })
        });
        if (!response.ok) throw new Error(`Cloudflare AI responded with status: ${response.status}`);
        
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));
            for (const line of lines) {
                const jsonString = line.substring(6);
                if (jsonString.trim() === '[DONE]') continue;
                try {
                    const parsed = JSON.parse(jsonString);
                    if(parsed.response) onChunk(parsed.response);
                } catch (e) {
                    // Ignore non-JSON chunks
                }
            }
        }
    } catch (error) {
        console.error("Error calling Cloudflare AI stream:", error);
        onChunk("My apologies, the Zenvana analysis AI is currently experiencing high traffic.");
    }
};

export const analyzeImageWithCloudflare = async (base64Image, textPrompt) => {
    if (!CLOUDFLARE_WORKER_URL) {
        return "My apologies, the Zenvana vision AI is not configured correctly.";
    }
    const imageWithoutPrefix = base64Image.split(',')[1];
    try {
        const response = await fetch(CLOUDFLARE_WORKER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: VISION_MODEL,
                prompt: textPrompt,
                image: Array.from(Uint8Array.from(atob(imageWithoutPrefix), c => c.charCodeAt(0)))
            })
        });
        if (!response.ok) throw new Error(`Cloudflare Vision AI responded with status: ${response.status}`);
        const result = await response.json();
        return result.description || "I was able to see the document, but could not extract any information.";
    } catch(error) {
        console.error("Error calling Cloudflare Vision AI:", error);
        return "My apologies, I encountered an error trying to analyze the document.";
    }
};