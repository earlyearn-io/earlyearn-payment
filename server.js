process.env.TZ = 'UTC';

const logger = require("./util/log.js");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const paymentRoutes = require("./routes/Payment.routes.js");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cookieParser());
app.use(express.json({ limit: "50mb" })); 
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

app.use((req, res, next) => { 
    logger.info("********** REQUEST ************");        
    logger.info(`${req.method} ${req.url}`); 
    logger.info(req.headers);
    logger.info(req.body);
    logger.info("******************************");    

    const originalSend = res.send;
    res.send = function (body) {
        res.send = originalSend;
        res.body = body;
        
        logger.info("********** RESPONSE ************");
        logger.info(`Status: ${res.statusCode}`);
        logger.info(res.getHeaders());
        
        if (typeof body === "string" && body.length > 0) {
            logger.info(`Body: ${body.substring(0, 200)}`);
        } else if (Buffer.isBuffer(body)) {
            logger.info("Body contains media, skipping log.");
        }
        
        logger.info("********************************");
        return res.send(body);
    };

    next();      
});

if (process.env.NODE_ENV === 'development') {
    console.log("Adding cors");
    const corsOptions = {
        origin: 'http://localhost',
        methods: 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
        allowedHeaders: 'Content-Type,Authorization',
        credentials: true
    };

    app.use(cors(corsOptions));
    app.options("*", cors(corsOptions));
}

if (process.env.PAYMENT_ROUTES_ENABLED == 1) {
    app.use("/api/payment", paymentRoutes);
}

app.get('/health', (req, res) => {
    res.status(200).send('OK');
    return;
});

app.use((req, res, next) => {
    res.redirect(302, process.env.WEBSITE_URL);    
});

app.listen(PORT, () => {
    console.log("Server started at http://localhost:" + PORT, new Date());
});
