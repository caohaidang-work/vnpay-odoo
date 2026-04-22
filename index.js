const express = require("express");
const crypto = require("crypto");

const app = express();

// ===== CONFIG =====
const vnp_TmnCode = "P34X5LCK";
const vnp_HashSecret = "64B60W4RZVCZMO52AJ7D0OYQA5R8CFOG";
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const returnUrl = "https://vnpay-odoo-production.up.railway.app/return";

// ===== FORMAT DATE =====
function formatDate(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    return date.getFullYear().toString() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds());
}

// ===== SORT + ENCODE PARAMS =====
function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();

    for (let key of keys) {
        sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    }

    return sorted;
}

// ===== HOME =====
app.get("/", (req, res) => {
    res.send("Server OK");
});

// ===== RETURN =====
app.get("/return", (req, res) => {
    console.log("VNPay trả về:", req.query);

    if (req.query.vnp_ResponseCode === "00") {
        res.send("✅ Thanh toán thành công");
    } else {
        res.send("❌ Thanh toán thất bại");
    }
});

// ===== PAY =====
app.get("/pay", (req, res) => {

    let params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnp_TmnCode,
        vnp_Amount: 10000 * 100,
        vnp_CurrCode: "VND",
        vnp_TxnRef: Date.now().toString(),
        vnp_OrderInfo: "Thanh toan khoa hoc",
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: "127.0.0.1",
        vnp_CreateDate: formatDate(new Date())
    };

    // 🔥 SORT + ENCODE
    let sortedParams = sortObject(params);

    // 🔥 BUILD SIGN DATA
    let signData = Object.keys(sortedParams)
        .map(key => key + "=" + sortedParams[key])
        .join("&");

    // DEBUG (nếu cần)
    console.log("SIGN DATA:", signData);

    // 🔥 HASH
    let hmac = crypto.createHmac("sha512", vnp_HashSecret);
    let signed = hmac.update(signData, 'utf-8').digest("hex");

    // 🔥 BUILD URL
    let paymentUrl = vnp_Url + "?" + signData + "&vnp_SecureHash=" + signed;

    res.redirect(paymentUrl);
});

app.listen(3000, () => console.log("Server running on port 3000"));
