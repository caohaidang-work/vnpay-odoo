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
    const parts = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }).formatToParts(date);

    const get = (type) => parts.find(p => p.type === type).value;

    return get('year') +
           get('month') +
           get('day') +
           get('hour') +
           get('minute') +
           get('second');
}

// ===== SORT OBJECT (CHUẨN VNPay) =====
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

    // 🔥 LẤY IP THẬT
    let ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    if (ipAddr && ipAddr.includes(',')) {
        ipAddr = ipAddr.split(',')[0];
    }

    let date = new Date();

    // 🔥 CREATE + EXPIRE DATE
    let createDate = formatDate(date);

    let expireDate = new Date();
    expireDate.setMinutes(expireDate.getMinutes() + 15);
    let vnp_ExpireDate = formatDate(expireDate);

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = vnp_TmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = Date.now().toString();
    vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang'; // KHÔNG dấu
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = 10000 * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;
    vnp_Params['vnp_ExpireDate'] = vnp_ExpireDate;

    // 🔥 SORT + ENCODE (THEO DOC)
    vnp_Params = sortObject(vnp_Params);

    // 🔥 SIGN DATA (KHÔNG encode)
    let signData = qs.stringify(vnp_Params, { encode: false });

    console.log("SIGN DATA:", signData);

    let hmac = crypto.createHmac("sha512", vnp_HashSecret);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

    vnp_Params['vnp_SecureHash'] = signed;

    // 🔥 BUILD URL (PHẢI encode = true)
    let paymentUrl = vnp_Url + '?' + qs.stringify(vnp_Params, { encode: true });

    res.redirect(paymentUrl);
});

app.listen(3000, () => console.log("Server running on port 3000"));
