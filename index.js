const express = require("express");
const crypto = require("crypto");
const qs = require("qs");

const app = express();

// ===== CONFIG =====
const vnp_TmnCode = "P34X5LCK";
const vnp_HashSecret = "64B60W4RZVCZMO52AJ7D0OYQA5R8CFOG";
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const returnUrl = "https://vnpay-odoo-production.up.railway.app/return";


// ===== SORT OBJECT (VNPay chuẩn demo) =====
function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();

    for (let key of keys) {
        sorted[key] = obj[key];
    }

    return sorted;
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

    let ipAddr =
        req.headers["x-forwarded-for"] ||
        req.socket.remoteAddress ||
        req.ip;

    if (ipAddr.startsWith("::ffff:")) {
        ipAddr = ipAddr.replace("::ffff:", "");
    }

    let createDate = formatDate(new Date());
    let expireDate = formatDate(new Date(Date.now() + 15 * 60 * 1000));

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
        vnp_ExpireDate: expireDate
    };

    // ===== SORT =====
    vnp_Params = sortObject(vnp_Params);

    // ===== SIGN DATA (QUAN TRỌNG: encode=false) =====
    let signData = qs.stringify(vnp_Params, { encode: false });

    let secureHash = crypto
        .createHmac("sha512", vnp_HashSecret)
        .update(Buffer.from(signData, "utf-8"))
        .digest("hex");

    vnp_Params["vnp_SecureHash"] = secureHash;

    // ===== BUILD URL (QUAN TRỌNG: encode=true) =====
    let paymentUrl =
        vnp_Url + "?" + qs.stringify(vnp_Params, { encode: true });

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

app.listen(3000);
