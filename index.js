const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Server OK");
});

const crypto = require("crypto");
const qs = require("qs");

app.get("/pay", (req, res) => {

    const vnp_TmnCode = "TESTCODE";
    const vnp_HashSecret = "SECRET";

    let params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnp_TmnCode,
        vnp_Amount: 10000 * 100,
        vnp_CurrCode: "VND",
        vnp_TxnRef: "TEST123",
        vnp_OrderInfo: "Test thanh toan",
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: "vnpay-odoo-production.up.railway.app/",
        vnp_IpAddr: "127.0.0.1",
        vnp_CreateDate: new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0,14)
    };

    let signData = qs.stringify(params, { encode: false });

    let hmac = crypto.createHmac("sha512", vnp_HashSecret);
    let signed = hmac.update(signData).digest("hex");

    params.vnp_SecureHash = signed;

    let paymentUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?" 
        + qs.stringify(params, { encode: false });

    res.redirect(paymentUrl);
});

app.listen(3000, () => console.log("Server running"));
