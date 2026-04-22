const express = require("express");
const crypto = require("crypto");
const qs = require("qs");

const app = express();

// ===== SORT OBJECT (Y CHANG DOC) =====
function sortObject(obj) {
    var sorted = {};
    var str = [];
    var key;

    for (key in obj){
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

// ===== HOME =====
app.get("/", (req, res) => {
    res.send("Server OK");
});

// ===== RETURN =====
app.get("/return", (req, res) => {
    console.log("VNPay trả về:", req.query);
    res.send("Return OK");
});

// ===== PAY =====
app.get("/pay", (req, res) => {

    const tmnCode = "2QXUI4J4";
    const secretKey = "SECRETKEY";
    const vnpUrl = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";
    const returnUrl = "https://vnpay-odoo-production.up.railway.app/return";

    var ipAddr = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    var date = new Date();
    var createDate = formatDate(date);
    var orderId = Date.now().toString();

    var vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = 'Test thanh toan';
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = 10000 * 100;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // 🔥 SORT (THEO DOC)
    vnp_Params = sortObject(vnp_Params);

    // 🔥 SIGN DATA (THEO DOC)
    let signData = qs.stringify(vnp_Params, { encode: false });

let hmac = crypto.createHmac("sha512", secretKey);
let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

vnp_Params['vnp_SecureHash'] = signed;

// 🔥 CHỖ QUAN TRỌNG
let paymentUrl = vnpUrl + '?' + qs.stringify(vnp_Params, { encode: true });

res.redirect(paymentUrl);
});

app.listen(3000, () => console.log("Server running"));
