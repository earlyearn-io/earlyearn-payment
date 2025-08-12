const axios = require('axios');
const logger = require('./log');

const fetchPrices = async () => {    
    if (process.env.NODE_ENV == 'development') {        
        return {
            prices: {
                sol: { usd: 174.32 },
               usdc: { usd: 0.99923 }, 
            }
        };
    }

    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price?symbols=sol,usdc&vs_currencies=usd');    
    logger.info(`Got coingecko response: ${JSON.stringify(response.data)}`);        
    return {
        prices: response.data,
        timestamp: Date.now()
    };
};

module.exports = {
    fetchPrices
}