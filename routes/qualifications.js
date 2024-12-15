// routes/qualifications.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

// 資格情報登録エンドポイント
router.post("/registerQualification", async (req, res) => {
  const { qualificationName } = req.body;

  // 必須項目のチェック
  if (!qualificationName) {
    return res.status(400).json({ message: "必須項目が未入力です。" });
  }

  try {
    // Qualification の作成
    await prisma.qualification.create({
      data: {
        qualificationName,
      },
    });

    res.status(201).json({ message: "資格が正常に登録されました。" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "資格登録中にエラーが発生しました。" });
  }
});

// 資格一覧取得エンドポイント
router.get("/qualifications", async (req, res) => {
  try {
    const qualifications = await prisma.qualification.findMany();

    res.status(200).json(qualifications);
  } catch (error) {
    console.error("資格情報の取得中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "資格情報の取得中にエラーが発生しました。" });
  }
});

// 資格情報取得エンドポイント
router.get("/qualifications/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const qualification = await prisma.qualification.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!qualification) {
      return res.status(404).json({ message: "資格が見つかりません。" });
    }

    res.json(qualification);
  } catch (error) {
    console.error("資格情報の取得中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "資格情報の取得中にエラーが発生しました。" });
  }
});

// 資格情報の更新エンドポイント
router.put("/qualifications/:id", async (req, res) => {
  const { id } = req.params;
  const { qualificationName } = req.body;

  try {
    const updatedQualification = await prisma.qualification.update({
      where: { id: Number(id) },
      data: {
        qualificationName,
      },
    });
    res.status(200).json(updatedQualification);
  } catch (error) {
    console.error("資格情報の更新中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "資格情報の更新中にエラーが発生しました。" });
  }
});

// 資格情報削除エンドポイント
router.delete("/qualifications/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 関連するレコードを削除
    await prisma.qualification.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.status(200).json({ message: "資格情報が削除されました。" });
  } catch (error) {
    console.error("資格情報の削除中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "資格情報の削除中にエラーが発生しました。" });
  }
});

module.exports = router;
