// routes/members.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;

// ユーザー登録エンドポイント
router.post("/register", async (req, res) => {
  const {
    staffId,
    password,
    fullName,
    fullNameRoman,
    address,
    postcode,
    phoneNumber,
    email,
    birthday,
    hireDate,
    role,
    emergencyContacts,
    ngStaff,
    staffQualifications,
  } = req.body;

  // 必須項目のチェック（省略）

  try {
    // フルネームを分割（姓と名）
    const [surname, givenName] = fullName.split(" ");
    const [romanSurname, romanGivenName] = fullNameRoman.split(" ");

    // パスワードをハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    // StaffProfile の作成
    const staffProfile = await prisma.staffProfile.create({
      data: {
        staffId,
        name: `${surname} ${givenName}`,
        romanname: `${romanSurname} ${romanGivenName}`,
        address,
        postcode,
        phonenumber: phoneNumber,
        email,
        birthday: new Date(birthday),
        hiredate: new Date(hireDate),
        role,
      },
    });

    // StaffAccount の作成
    await prisma.staffAccount.create({
      data: {
        staffId,
        password: hashedPassword,
      },
    });

    // 緊急連絡先の作成
    for (const contact of emergencyContacts) {
      const { name, relationship, phoneNumber } = contact;
      await prisma.emergencyContact.create({
        data: {
          nameOfEmergency: name,
          relationship,
          phoneNumber,
          staffProfileId: staffProfile.id,
        },
      });
    }

    // NGスタッフリストの作成
    for (const ngStaffId of ngStaff) {
      await prisma.NGStaff.create({
        data: {
          staffProfileId: staffProfile.id,
          ngStaffId: ngStaffId,
        },
      });
    }

    // 資格情報の作成
    for (const qualificationId of staffQualifications) {
      await prisma.staffQualification.create({
        data: {
          staffProfileId: staffProfile.id,
          qualificationId: qualificationId,
        },
      });
    }

    res.status(201).json({ message: "ユーザーが正常に登録されました。" });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "ユーザー登録中にエラーが発生しました。",
      error: error.message,
    });
  }
});

// メンバー情報取得エンドポイント
router.get("/members", async (req, res) => {
  try {
    const members = await prisma.staffProfile.findMany({
      include: {
        emergencyContact: true, // 緊急連絡先を含める
        qualifications: {
          include: {
            qualification: true,
          },
        },
      },
    });

    // 必要な形式にデータを整形して返す
    const formattedMembers = members.map((member) => ({
      id: member.id,
      staffId: member.staffId,
      name: member.name,
      romanname: member.romanname,
      address: member.address,
      postcode: member.postcode,
      phonenumber: member.phonenumber,
      email: member.email,
      birthday: member.birthday,
      hiredate: member.hiredate,
      role: member.role,
      emergencyContacts: member.emergencyContact.map((contact) => ({
        name: contact.nameOfEmergency,
        relationship: contact.relationship,
        phoneNumber: contact.phoneNumber,
      })),
      qualifications: member.qualifications.map((qual) => ({
        qualificationName: qual.qualification.qualificationName,
      })),
      ngStaffList: "なし", // 仮のデータ
      bannedInfo: "なし", // 仮のデータ
      selfBanned: "なし", // 仮のデータ
    }));

    res.status(200).json(formattedMembers);
  } catch (error) {
    console.error("メンバー情報の取得中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "メンバー情報の取得中にエラーが発生しました。" });
  }
});

router.get("/members/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const member = await prisma.staffProfile.findUnique({
      where: {
        id: parseInt(id),
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

    if (!member) {
      return res.status(404).json({ message: "メンバーが見つかりません。" });
    }

    res.json(member);
  } catch (error) {
    console.error("メンバー情報の取得中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "メンバー情報の取得中にエラーが発生しました。" });
  }
});

// メンバー情報の更新エンドポイント
router.put("/members/:id", async (req, res) => {
  const { id } = req.params;
  const {
    staffId,
    name,
    romanname,
    address,
    postcode,
    phonenumber,
    email,
    birthday,
    hiredate,
  } = req.body;

  try {
    const updatedMember = await prisma.staffProfile.update({
      where: { id: Number(id) },
      data: {
        staffId,
        name,
        romanname,
        address,
        postcode,
        phonenumber,
        email,
        birthday: new Date(birthday),
        hiredate: new Date(hiredate),
      },
    });
    res.status(200).json(updatedMember);
  } catch (error) {
    console.error("メンバー情報の更新中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "メンバー情報の更新中にエラーが発生しました。" });
  }
});

// メンバー情報削除エンドポイント
router.delete("/members/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // トランザクションを使用して、関連するレコードをすべて削除する
    await prisma.$transaction(async (prisma) => {
      // 1. 関連する StaffAccount を削除
      await prisma.staffAccount.deleteMany({
        where: {
          staffId: id,
        },
      });

      // 2. 関連する EmergencyContact を削除
      await prisma.emergencyContact.deleteMany({
        where: {
          staffProfileId: parseInt(id),
        },
      });

      // 他の関連レコードの削除処理が必要であればここに追加

      // 最後に StaffProfile を削除
      await prisma.staffProfile.delete({
        where: {
          id: parseInt(id),
        },
      });
    });

    res.status(200).json({ message: "メンバー情報が削除されました。" });
  } catch (error) {
    console.error("メンバー情報の削除中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "メンバー情報の削除中にエラーが発生しました。" });
  }
});

module.exports = router;
