const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Server OK");
});

// 👉 TEST LINK THANH TOÁN
app.get("/pay", (req, res) => {
  res.send("Thanh toán OK (test bước 1)");
});

app.listen(3000, () => console.log("Server running"));
