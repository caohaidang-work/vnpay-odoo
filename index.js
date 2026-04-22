const express = require("express");
const crypto = require("crypto");
const qs = require("qs");

const app = express();

// ===== CONFIG =====
const vnp_TmnCode = "P34X5LCK";
const vnp_HashSecret = "64B60W4RZVCZMO52AJ7D0OYQA5R8CFOG";
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const returnUrl = "https://vnpay-odoo-production.up.railway.app/return";


// ===== FORMAT DATE (VNPay GMT+7) =====
function formatDate(date) {
    const pad = (n) => n.toString().padStart(2, "0");

    let vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);

    return (
        vnTime.getFullYear().toString() +
        pad(vnTime.getMonth() + 1) +
        pad(vnTime.getDate()) +
        pad(vnTime.getHours()) +
        pad(vnTime.getMinutes()) +
        pad(vnTime.getSeconds())
    );
}


// ===== SORT OBJECT (VNPay STANDARD) =====
function sortObject(obj) {
    let sorted = {};
    let keys = [];

    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(encodeURIComponent(key));
        }
    }

    keys.sort();

    for (let i = 0; i < keys.length; i++) {
        let k = decodeURIComponent(keys[i]);
        sorted[keys[i]] = encodeURIComponent(obj[k]).replace(/%20/g, "+");
    }

    return sorted;
}


// ===== HOME =====
app.get("/", (req, res) => {
    res.send("VNPay Server OK");
});


// ===== RETURN URL =====
app.get("/return", (req, res) => {
    console.log("VNPay RETURN:", req.query);

    if (req.query.vnp_ResponseCode === "00") {
        res.send("✅ Thanh toán thành công");
    } else {
        res.send("❌ Thanh toán thất bại");
    }
});


// ===== PAY =====
app.get("/pay", (req, res) => {

    // ===== IP ADDRESS =====
    let ipAddr =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        req.ip;

    if (ipAddr && ipAddr.startsWith("::ffff:")) {
        ipAddr = ipAddr.replace("::ffff:", "");
    }

    // ===== TIME =====
    let now = new Date();
    let createDate = formatDate(now);
    let expireDate = new Date(now.getTime() + 15 * 60 * 1000);
    let vnp_ExpireDate = formatDate(expireDate);

    // ===== PARAMS =====
    let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnp_TmnCode,
        vnp_Amount: 10000 * 100,
        vnp_CurrCode: "VND",
        vnp_TxnRef: Date.now().toString(),
        vnp_OrderInfo: "Thanh toan don hang",
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: vnp_ExpireDate
    };

    // ===== SORT FIRST =====
    vnp_Params = sortObject(vnp_Params);

    // ===== CREATE SIGN STRING =====
    let signData = qs.stringify(vnp_Params, { encode: false });

    // ===== HASH SHA512 =====
    let secureHash = crypto
        .createHmac("sha512", vnp_HashSecret)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");

    vnp_Params["vnp_SecureHash"] = secureHash;

    // ===== BUILD URL (IMPORTANT: encode = true) =====
    let paymentUrl =
        vnp_Url + "?" + qs.stringify(vnp_Params, { encode: true });

    console.log("SIGN DATA:", signData);
    console.log("HASH:", secureHash);

    res.redirect(paymentUrl);
});


// ===== START SERVER =====
app.listen(3000, () => {
    console.log("Server running on port 3000");
});
