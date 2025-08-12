const express = require("express");
const { handleCreatePaymentIntent, handleGetPrices } = require("../controllers/PaymentController.js");

const router = express.Router();

router.post("/intent", handleCreatePaymentIntent);
router.post("/get-prices", handleGetPrices);

router.get("/health", (req, res) => {
    res.status(200).json({ success: true });
});

module.exports = router;
