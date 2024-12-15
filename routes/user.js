// routes/user.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;

// 認証ミドルウェアの再利用
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

// プロフィール取得エンドポイント
router.get("/profile", authenticateToken, async (req, res) => {
  try {
    const userProfile = await prisma.staffProfile.findUnique({
      where: {
        staffId: req.user.staffId, // 認証されたユーザーのIDを使用
      },
      include: {
        emergencyContact: true,
        qualifications: {
          include: {
            qualification: true,
          },
        },
      },
    });

    if (!userProfile) {
      return res
        .status(404)
        .json({ message: "ユーザープロフィールが見つかりません" });
    }

    res.json(userProfile);
  } catch (error) {
    res.status(500).json({ message: "サーバーエラーが発生しました" });
  }
});

module.exports = router;
