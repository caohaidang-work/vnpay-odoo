const express = require("express");
const crypto = require("crypto");

const app = express();

// ===== CONFIG =====
const vnp_TmnCode = "4LG143ND";
const vnp_HashSecret = "I5L1P7VO306L3SWY3TR20EJ8OON9BLCS";
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const returnUrl = "https://vnpay-odoo-production.up.railway.app/return";

// ===== SORT OBJECT =====
function sortObject(obj) {
    return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
            result[key] = obj[key];
            return result;
        }, {});
}

// ===== BUILD SIGN DATA (FIX QUAN TRỌNG) =====
function buildSignData(obj) {
    return Object.keys(obj)
        .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(obj[key]))
        .join("&");
}

// ===== FORMAT DATE =====
function formatDate(date) {
    const pad = (n) => n.toString().padStart(2, "0");

    let d = new Date(date.getTime() + 7 * 60 * 60 * 1000);

    return (
        d.getFullYear().toString() +
        pad(d.getMonth() + 1) +
        pad(d.getDate()) +
        pad(d.getHours()) +
        pad(d.getMinutes()) +
        pad(d.getSeconds())
    );
}

// ===== PAY =====
app.get("/pay", (req, res) => {

    // ===== FIX IP =====
    let ipAddr =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        req.ip;

    if (ipAddr.includes(",")) {
        ipAddr = ipAddr.split(",")[0];
    }

    if (ipAddr.startsWith("::ffff:")) {
        ipAddr = ipAddr.replace("::ffff:", "");
    }

    let createDate = formatDate(new Date());
    let expireDate = formatDate(new Date(Date.now() + 15 * 60 * 1000));

    let vnp_Params = {
        vnp_Version: "2.1.0",
        vnp_Command: "pay",
        vnp_TmnCode: vnp_TmnCode,
        vnp_Amount: 10000 * 100, // ✔️ nhớ *100
        vnp_CurrCode: "VND",
        vnp_TxnRef: Date.now().toString(),
        vnp_OrderInfo: "Thanh toan don hang",
        vnp_OrderType: "other",
        vnp_Locale: "vn",
        vnp_ReturnUrl: returnUrl,
        vnp_IpAddr: ipAddr,
        vnp_CreateDate: createDate,
        vnp_ExpireDate: expireDate
    };

    // ===== SORT =====
    vnp_Params = sortObject(vnp_Params);

    // ===== SIGN DATA (FIX CHUẨN) =====
    let signData = buildSignData(vnp_Params);

    let secureHash = crypto
        .createHmac("sha512", vnp_HashSecret)
        .update(signData, "utf-8")
        .digest("hex");

    vnp_Params["vnp_SecureHash"] = secureHash;

    // ===== BUILD URL =====
    let paymentUrl =
        vnp_Url + "?" + buildSignData(vnp_Params);

    console.log("SIGN DATA:", signData);
    console.log("HASH:", secureHash);

    res.redirect(paymentUrl);
});

// ===== RETURN =====
app.get("/return", (req, res) => {
    if (req.query.vnp_ResponseCode === "00") {
        res.send("✅ Thanh toán thành công");
    } else {
        res.send("❌ Thanh toán thất bại");
    }
});

app.listen(3000, () => {
    console.log("Server running on port 3000");
});
