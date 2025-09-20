import axios from 'axios';

const rapidApiClient = axios.create({
    baseURL: 'https://yahoo-finance15.p.rapidapi.com/api/v1',
    headers: {
        'X-RapidAPI-Key': process.env.REACT_APP_RAPIDAPI_KEY,
        'X-RapidAPI-Host': process.env.REACT_APP_RAPIDAPI_HOST,
    },
});

export const getMarketData = async (symbols) => {
    try {
        const response = await rapidApiClient.get('/finance/quotes', {
            params: { symbols: symbols.join(',') },
        });
        return response.data.marketSummary;
    } catch (error) {
        console.error("Error fetching market data:", error);
        throw new Error("Failed to fetch market data. Please check your API key.");
    }
};

export const getIndianStockPrices = async () => {
    try {
        const symbols = ['^NSEI', '^BSESN', 'RELIANCE.NS', 'HDFC.NS', 'TCS.NS']; // Example Indian symbols
        const response = await rapidApiClient.get('/finance/quotes', {
            params: { symbols: symbols.join(',') },
        });
        return response.data.marketSummary;
    } catch (error) {
        console.error("Error fetching Indian stock prices:", error);
        throw new Error("Failed to fetch Indian stock prices. Please check your API key.");
    }
};
