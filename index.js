const express = require("express");
const crypto = require("crypto");
const qs = require("qs");

const app = express();

// ===== CONFIG =====
const vnp_TmnCode = "P34X5LCK";
const vnp_HashSecret = "64B60W4RZVCZMO52AJ7D0OYQA5R8CFOG";
const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
const returnUrl = "https://vnpay-odoo-production.up.railway.app/return";

// ===== FORMAT DATE (GMT+7 - SAFE) =====
function formatDate(date) {
    const pad = (n) => n.toString().padStart(2, '0');

    // clone để tránh phá object gốc
    let d = new Date(date.getTime());
    d.setHours(d.getHours() + 7);

    return d.getFullYear().toString() +
        pad(d.getMonth() + 1) +
        pad(d.getDate()) +
        pad(d.getHours()) +
        pad(d.getMinutes()) +
        pad(d.getSeconds());
}

// ===== SORT OBJECT (Y CHUẨN VNPay) =====
function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;

    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }

    str.sort();

    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
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

    // ===== IP =====
    let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ipAddr && ipAddr.includes(',')) {
        ipAddr = ipAddr.split(',')[0];
    }

    // ===== DATE (SAFE) =====
    let now = new Date();

    let createDate = formatDate(now);

    let expireDate = new Date(now.getTime());
    expireDate.setMinutes(expireDate.getMinutes() + 15);
    let vnp_ExpireDate = formatDate(expireDate);

    // ===== PARAMS =====
    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = vnp_TmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = Date.now().toString();
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang';
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = 10000 * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = vnp_ExpireDate;

    // ===== SORT + ENCODE =====
    vnp_Params = sortObject(vnp_Params);

    // ===== SIGN =====
    let signData = qs.stringify(vnp_Params, { encode: false });
    console.log("SIGN DATA:", signData);

    let hmac = crypto.createHmac("sha512", vnp_HashSecret);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    vnp_Params['vnp_SecureHash'] = signed;

    // ===== BUILD URL (encode = true) =====
    let paymentUrl = vnp_Url + '?' + qs.stringify(vnp_Params, { encode: true });

    res.redirect(paymentUrl);
});

app.listen(3000, () => console.log("Server running on port 3000"));
