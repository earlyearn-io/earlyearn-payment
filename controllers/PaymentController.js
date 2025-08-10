const crypto = require('crypto');
const axios = require("axios");
const logger = require("../util/log.js");
const { encryptSecret, decryptSecret, getIpAddress } = require("../util/util.js");

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
    const { paymentMode, presaleId, network, amount, signature } = req.body;

    try {

        const webUserId = getOrCreateEncryptedWebUserId(req, res);
        const linkCode = req.cookies?.link_code || undefined;
        const ipAddress = getIpAddress(req);
        const userAgent = req.headers['user-agent'];

        const response = await axios.post(
            `${apiUrl}/api/payment/intent`,
            {
                paymentMode,
                webUserId,
                presaleId,
                network,
                amount,
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

const handleGetPaymentMetaData = async (req, res) => {
    const ip = getIpAddress(req);
    const userAgent = req.headers['user-agent'];

    const metaData = JSON.stringify({ ip, userAgent });

    const encrypted = encryptSecret(metaData);

    const base64 = Buffer.from(JSON.stringify(encrypted)).toString('base64');

    res.status(200).json({ success: true, data: base64 });
};

module.exports = {
    handleCreatePaymentIntent,
    handleGetPaymentMetaData,
};
