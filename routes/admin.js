const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;
const ADMIN_ID = process.env.ADMIN_ID;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

// 管理者ログインエンドポイント
router.post("/admin/login", (req, res) => {
  const { id, password } = req.body;

  // 環境変数のIDとパスワードを検証
  if (id !== ADMIN_ID || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: "IDまたはパスワードが無効です。" });
  }

  // JWTトークンを生成
  const token = jwt.sign({ role: "admin" }, SECRET_KEY, {
    expiresIn: "3h",
  });

  res.status(200).json({ token });
});

// 認証ミドルウェア
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401); // トークンがない場合は401

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403); // トークンが無効な場合は403
    if (user.role !== "admin") return res.sendStatus(403); // 管理者以外は拒否
    req.user = user;
    next();
  });
}

// 管理者情報取得エンドポイント
router.get("/admin/me", authenticateAdmin, (req, res) => {
  res.status(200).json({
    id: ADMIN_ID,
    role: "admin",
    message: "管理者情報を取得しました。",
  });
});

module.exports = router;
