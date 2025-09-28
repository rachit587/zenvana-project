// src/api/yahooFinance.js

const RAPIDAPI_KEY = process.env.REACT_APP_RAPIDAPI_KEY;
const RAPIDAPI_HOST = process.env.REACT_APP_RAPIDAPI_HOST;

export const getMarketData = async (symbols) => {
    // Using the correct endpoint that is typically available on free plans
    const url = `https://${RAPIDAPI_HOST}/get-quotes?region=IN&symbols=${symbols.join(',')}`;
    
    const options = {
        method: 'GET',
        headers: {
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST
        }
    };

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`Yahoo Finance API responded with status: ${response.status}`);
        }
        const result = await response.json();
        return result?.quoteResponse?.result || [];
    } catch (error) {
        console.error("Error fetching market data:", error);
        return null;
    }
};