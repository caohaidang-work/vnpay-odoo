const express = require("express");
const crypto = require("crypto");
const qs = require("qs");

const app = express();

function sortObject(obj) {
    let sorted = {};
    let keys = Object.keys(obj).sort();

    for (let key of keys) {
        sorted[key] = obj[key];
    }
    return sorted;
}

function formatDate(date) {
    const pad = (n) => n.toString().padStart(2, '0');
    return date.getFullYear().toString() +
        pad(date.getMonth() + 1) +
        pad(date.getDate()) +
        pad(date.getHours()) +
        pad(date.getMinutes()) +
        pad(date.getSeconds());
}

// HOME
app.get("/", (req, res) => {
    res.send("Server OK");
});

// RETURN
app.get("/return", (req, res) => {
    console.log("VNPay trả về:", req.query);
    res.send("Return OK");
});

// PAY
app.get("/pay", (req, res) => {

    const vnp_TmnCode = "P34X5LCK";
    const vnp_HashSecret = "64B60W4RZVCZMO52AJ7D0OYQA5R8CFOG";
    const vnp_Url = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = vnp_TmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = Date.now().toString();
    vnp_Params['vnp_OrderInfo'] = 'Test thanh toan'; // KHÔNG dấu
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = 10000 * 100;
    vnp_Params['vnp_ReturnUrl'] = 'https://vnpay-odoo-production.up.railway.app/return';
    vnp_Params['vnp_IpAddr'] = '127.0.0.1';
    vnp_Params['vnp_CreateDate'] = formatDate(new Date());

    // 🔥 SORT
    vnp_Params = sortObject(vnp_Params);

    // 🔥 KHÔNG ENCODE
    let signData = qs.stringify(vnp_Params, { encode: false });

    console.log("SIGN DATA:", signData);

    let hmac = crypto.createHmac("sha512", vnp_HashSecret);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    vnp_Params['vnp_SecureHash'] = signed;

    let paymentUrl = vnp_Url + '?' + qs.stringify(vnp_Params, { encode: false });

    res.redirect(paymentUrl);
});

app.listen(3000, () => console.log("Server running"));
console.log("SIGN DATA:", signData);
console.log("HASH:", signed);
