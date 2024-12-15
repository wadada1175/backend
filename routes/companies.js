// routes/companies.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

// 会社登録エンドポイント
router.post("/registerCompany", async (req, res) => {
  const { companyName, address, postcode, phonenumber, email } = req.body;

  // 必須項目のチェック
  if (!companyName || !address || !postcode || !phonenumber || !email) {
    return res.status(400).json({
      message:
        "必須項目が未入力です: " +
        (companyName ? "" : "companyName, ") +
        (address ? "" : "address, ") +
        (postcode ? "" : "postcode, ") +
        (phonenumber ? "" : "phonenumber, ") +
        (email ? "" : "email"),
    });
  }

  try {
    // CompanyProfile の作成
    await prisma.company.create({
      data: {
        companyName,
        postcode,
        address,
        email,
        phonenumber,
      },
    });

    res.status(201).json({ message: "会社が正常に登録されました。" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "会社登録中にエラーが発生しました。" });
  }
});

// 会社一覧取得エンドポイント
router.get("/companies", async (req, res) => {
  try {
    const companies = await prisma.company.findMany();

    res.status(200).json(companies);
  } catch (error) {
    console.error("会社情報の取得中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "会社情報の取得中にエラーが発生しました。" });
  }
});

router.get("/companies/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const company = await prisma.company.findUnique({
      where: {
        id: parseInt(id),
      },
    });

    if (!company) {
      return res.status(404).json({ message: "会社が見つかりません。" });
    }

    res.json(company);
  } catch (error) {
    console.error("会社情報の取得中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "会社情報の取得中にエラーが発生しました。" });
  }
});

// 会社情報の更新エンドポイント
router.put("/companies/:id", async (req, res) => {
  const { id } = req.params;
  const { companyName, address, postcode, phonenumber, email } = req.body;

  try {
    const updatedCompany = await prisma.company.update({
      where: { id: Number(id) },
      data: {
        companyName,
        address,
        postcode,
        phonenumber,
        email,
      },
    });
    res.status(200).json(updatedCompany);
  } catch (error) {
    console.error("会社情報の更新中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "会社情報の更新中にエラーが発生しました。" });
  }
});

// 会社情報削除エンドポイント
router.delete("/companies/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // 関連するレコードを削除
    await prisma.company.delete({
      where: {
        id: parseInt(id),
      },
    });

    res.status(200).json({ message: "会社情報が削除されました。" });
  } catch (error) {
    console.error("会社情報の削除中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "会社情報の削除中にエラーが発生しました。" });
  }
});

module.exports = router;
