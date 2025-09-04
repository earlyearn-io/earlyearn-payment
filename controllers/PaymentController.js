const crypto = require('crypto');
const axios = require("axios");
const logger = require("../util/log.js");
const { encryptSecret, decryptSecret, getIpAddress } = require("../util/util.js");
const { fetchPrices } = require('../util/coingecko.js');

const apiUrl = process.env.API_URL;
const cookiesDomain = process.env.COOKIES_DOMAIN;

const cookiesSecure = process.env.NODE_ENV != 'development';
const cookieName = "ee_user_id";
const ivCookieName = `${cookieName}_iv`;

const getOrCreateEncryptedWebUserId = (req, res) => {
    const { [cookieName]: encryptedUserId, [ivCookieName]: iv } = req.cookies || {};
    let rawWebUserId;

    if (encryptedUserId && iv) {
        try {
            rawWebUserId = decryptSecret(encryptedUserId, iv);
        } catch (err) {
            console.warn("Decryption failed, generating new user ID");
        }
    }

    if (!rawWebUserId) {
        rawWebUserId = crypto.randomUUID();
        const { encryptedSecret, iv: newIv } = encryptSecret(rawWebUserId);

        res.cookie(cookieName, encryptedSecret, {
            httpOnly: true,
            secure: cookiesSecure,
            sameSite: "Strict",
            domain: cookiesDomain,
            maxAge: 365 * 24 * 60 * 60 * 1000
        });

        res.cookie(ivCookieName, newIv, {
            httpOnly: true,
            secure: cookiesSecure,
            sameSite: "Strict",
            domain: cookiesDomain,
            maxAge: 365 * 24 * 60 * 60 * 1000
        });
    }

    return rawWebUserId;
};

const handleCreatePaymentIntent = async (req, res) => {
    const { paymentMode, presaleId, network, amount, address, signature, linkCode } = req.body;

    try {

        const webUserId = getOrCreateEncryptedWebUserId(req, res);        
        const ipAddress = getIpAddress(req);
        const userAgent = req.headers['user-agent'];

        console.log(`${apiUrl}/api/payment/intent`);
        const response = await axios.post(
            `${apiUrl}/api/payment/intent`,
            {
                paymentMode,
                webUserId,
                presaleId,
                network,
                amount,
                address,
                signature,
                linkCode,                
            },
            {
                headers: {
                    "X-Forwarded-For": ipAddress,
                    "User-Agent": userAgent,
                }
            }
        );

        console.log("Got response", response);        

        if (response.data?.success) {
            res.status(201).json({ success: true, data: response.data.data });
        } else {
            res.status(400).json({ success: false, message: "Invalid response", error: response.data });
        }
    } catch (error) {
        logger.error(error?.response?.data || error.message);
        res.status(500).json({ success: false, message: "Server Error", error: error.message });
    }
};

let cachedPrices = null;
const CACHE_TTL = 60000;

const handleGetPrices = async (req, res) => {
    const now = Date.now();
  
    if (!cachedPrices || now - cachedPrices.timestamp > CACHE_TTL) {
        try {
            cachedPrices = await fetchPrices();
        } catch (error) {
            logger.error(error);            
            return res.status(500).json({ success: false, message: 'Failed to fetch price' });
        }
    }

    res.status(200).json({ success: true, data: cachedPrices });
};

module.exports = {
    handleCreatePaymentIntent,
    handleGetPrices,
};
