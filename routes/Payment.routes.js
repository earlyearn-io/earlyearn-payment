const express = require("express");
const { handleCreatePaymentIntent, handleGetPaymentMetaData } = require("../controllers/PaymentController.js");

const router = express.Router();

router.post("/intent", handleCreatePaymentIntent);
router.get("/metadata", handleGetPaymentMetaData);

module.exports = router;
