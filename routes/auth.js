// routes/members.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;
// 認証ミドルウェアの作成
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer TOKEN" の形式を想定

  if (token == null) return res.sendStatus(401); // トークンがない場合は401を返す

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403); // トークンが無効な場合は403を返す
    req.user = user;
    next();
  });
}

// `/me` エンドポイントの追加
router.get("/me", authenticateToken, async (req, res) => {
  try {
    // トークンから取得したstaffIdを使用してユーザー情報を取得
    const staffProfile = await prisma.staffProfile.findUnique({
      where: {
        staffId: req.user.staffId,
      },
      select: {
        staffId: true,
        name: true,
        role: true,
      },
    });

    if (!staffProfile) {
      return res.status(404).json({ message: "ユーザーが見つかりません。" });
    }

    res.status(200).json({
      staffId: staffProfile.staffId,
      name: staffProfile.name,
      role: staffProfile.role,
    });
  } catch (error) {
    console.error("ユーザー情報の取得中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "ユーザー情報の取得中にエラーが発生しました。" });
  }
});

module.exports = router;
