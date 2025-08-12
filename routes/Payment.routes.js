const express = require("express");
const { handleCreatePaymentIntent, handleGetPrices } = require("../controllers/PaymentController.js");

const router = express.Router();

router.post("/intent", handleCreatePaymentIntent);
router.post("/get-prices", handleGetPrices);

module.exports = router;
