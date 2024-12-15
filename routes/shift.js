// routes/shift.js
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

function formatDate(date) {
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2); // 月は0始まりなので+1
  const day = `0${date.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
}

// シフト提出または休暇申請エンドポイント
router.post("/submitShiftRequest", authenticateToken, async (req, res) => {
  const { selectedDate, memo, requestType, projectDescriptionId } = req.body;
  const staffId = req.user.staffId;

  try {
    // StaffProfile の取得
    const staffProfile = await prisma.staffProfile.findUnique({
      where: { staffId },
    });

    if (!staffProfile) {
      return res.status(404).json({ message: "スタッフが見つかりません。" });
    }

    // バリデーション
    if (!selectedDate || !requestType) {
      return res
        .status(400)
        .json({ message: "必須フィールドが不足しています。" });
    }

    let projectDescription = null;
    if (requestType === "SHIFT" && projectDescriptionId) {
      projectDescription = await prisma.projectDescription.findUnique({
        where: { id: Number(projectDescriptionId) },
      });

      if (!projectDescription) {
        return res
          .status(404)
          .json({ message: "指定されたプロジェクトが見つかりません。" });
      }

      // 選択した日付とプロジェクトの日付が一致するか確認
      const projectDate = formatDate(new Date(projectDescription.workDate));
      if (projectDate !== selectedDate) {
        return res.status(400).json({
          message: "選択した日付とプロジェクトの日付が一致しません。",
        });
      }
    }

    // ShiftRequest の作成
    const shiftRequest = await prisma.shiftRequest.create({
      data: {
        staffProfileId: staffProfile.id,
        date: new Date(selectedDate),
        requestType,
        memo,
        projectDescriptionId: projectDescriptionId
          ? Number(projectDescriptionId)
          : null,
      },
    });

    res
      .status(201)
      .json({ message: "リクエストが正常に提出されました。", shiftRequest });
  } catch (error) {
    console.error("リクエスト提出中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "リクエスト提出中にエラーが発生しました。" });
  }
});

// 特定の日付のプロジェクトを取得するエンドポイント
router.get("/projects/:date", authenticateToken, async (req, res) => {
  const { date } = req.params;

  try {
    const projects = await prisma.projectDescription.findMany({
      where: {
        workDate: new Date(date),
      },
      select: {
        id: true,
        project: {
          select: {
            projectName: true,
          },
        },
      },
    });

    const projectList = projects.map((p) => ({
      id: p.id,
      name: p.project.projectName,
    }));

    res.status(200).json({ projects: projectList });
  } catch (error) {
    console.error("プロジェクト取得中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "プロジェクト取得中にエラーが発生しました。" });
  }
});

// シフト申請または休暇申請の削除エンドポイント
router.delete(
  "/deleteShiftRequest/:id",
  authenticateToken,
  async (req, res) => {
    const { id } = req.params;
    const staffId = req.user.staffId;

    try {
      // StaffProfile の取得
      const staffProfile = await prisma.staffProfile.findUnique({
        where: { staffId },
      });

      if (!staffProfile) {
        return res.status(404).json({ message: "スタッフが見つかりません。" });
      }

      // 削除対象の ShiftRequest の取得
      const shiftRequest = await prisma.shiftRequest.findUnique({
        where: { id: Number(id) },
      });

      if (!shiftRequest) {
        return res
          .status(404)
          .json({ message: "シフト申請が見つかりません。" });
      }

      // リクエストの所有者が一致するか確認
      if (shiftRequest.staffProfileId !== staffProfile.id) {
        return res
          .status(403)
          .json({ message: "このシフト申請を削除する権限がありません。" });
      }

      // シフト申請の削除
      await prisma.shiftRequest.delete({
        where: { id: Number(id) },
      });

      res.status(200).json({ message: "シフト申請を削除しました。" });
    } catch (error) {
      console.error("シフト申請の削除中にエラーが発生しました:", error);
      res
        .status(500)
        .json({ message: "シフト申請の削除中にエラーが発生しました。" });
    }
  }
);

module.exports = router;
