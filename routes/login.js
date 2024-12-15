// routes/login.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;

// ログインエンドポイントの追加
router.post("/login", async (req, res) => {
  const { staffId, password } = req.body;

  try {
    // StaffAccountをstaffIdで検索
    const staffAccount = await prisma.staffAccount.findUnique({
      where: {
        staffId: staffId,
      },
    });

    if (!staffAccount) {
      return res
        .status(401)
        .json({ message: "隊員番号またはパスワードが無効です。" });
    }

    // パスワードを比較
    const validPassword = await bcrypt.compare(password, staffAccount.password);

    if (!validPassword) {
      return res
        .status(401)
        .json({ message: "隊員番号またはパスワードが無効です。" });
    }

    // JWTトークンを生成
    const token = jwt.sign({ staffId: staffAccount.staffId }, SECRET_KEY, {
      expiresIn: "3h", // 1時間でトークンの有効期限を設定
    });

    res.status(200).json({ token });
  } catch (error) {
    console.error("ログイン中にエラーが発生しました:", error);
    res.status(500).json({ message: "ログイン中にエラーが発生しました。" });
  }
});

module.exports = router;
