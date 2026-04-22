const express = require("express");
const crypto = require("crypto");
const qs = require("qs");

const app = express();

// ===== CONFIG =====
const vnp_TmnCode = "P34X5LCK";
const vnp_HashSecret = "64B60W4RZVCZMO52AJ7D0OYQA5R8CFOG";
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const returnUrl = "https://vnpay-odoo-production.up.railway.app/return";

// ===== FORMAT DATE (GMT+7) =====
function formatDate(date) {
    const pad = (n) => n.toString().padStart(2, '0');

    // 👉 lấy timestamp +7h (KHÔNG mutate)
    let vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);

    return vnTime.getFullYear().toString() +
        pad(vnTime.getMonth() + 1) +
        pad(vnTime.getDate()) +
        pad(vnTime.getHours()) +
        pad(vnTime.getMinutes()) +
        pad(vnTime.getSeconds());
}

// ===== SORT OBJECT (CHUẨN VNPay) =====
function sortObject(obj) {
    return Object.keys(obj)
        .sort()
        .reduce((result, key) => {
            result[key] = obj[key];
            return result;
        }, {});
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

    // 🔥 LẤY IP THẬT
    let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ipAddr && ipAddr.includes(',')) {
        ipAddr = ipAddr.split(',')[0];
    }

    let now = new Date();

let createDate = formatDate(now);

let expireDate = new Date(now.getTime() + 15 * 60 * 1000);

let vnp_ExpireDate = formatDate(expireDate);
    
   let vnp_Params = {
    vnp_Version: '2.1.0',
    vnp_Command: 'pay',
    vnp_TmnCode: vnp_TmnCode,
    vnp_Amount: 10000 * 100,
    vnp_CurrCode: 'VND',
    vnp_TxnRef: Date.now().toString(),
    vnp_OrderInfo: 'Thanh toan don hang',
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr,
    vnp_CreateDate: createDate,
    vnp_ExpireDate: vnp_ExpireDate
};

    // 🔥 SORT + ENCODE (THEO DOC)
    vnp_Params = sortObject(vnp_Params);

    // 🔥 SIGN DATA (KHÔNG encode)
    let signData = qs.stringify(vnp_Params, { encode: false });

let signed = crypto
    .createHmac("sha512", vnp_HashSecret)
    .update(Buffer.from(signData, 'utf-8'))
    .digest("hex");

vnp_Params['vnp_SecureHash'] = signed;

    // 🔥 BUILD URL (PHẢI encode = true)
    let paymentUrl = vnp_Url + '?' + qs.stringify(vnp_Params, { encode: true });

    res.redirect(paymentUrl);
});

app.listen(3000, () => console.log("Server running on port 3000"));
