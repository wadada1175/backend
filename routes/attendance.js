// routes/attendance.js
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

// check-in update only
router.post("/attendance/checkin", async (req, res) => {
  try {
    const { staffProfileId, ProjectMemberId, checkInPlace } = req.body;

    const existing = await prisma.attendance.findFirst({
      where: {
        staffProfileId,
        ProjectMemberId,
        clockIn: false, // 出勤してない最新の出勤記録
        clockOut: false, // 下番してない最新の出勤記録
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        clockIn: true,
        clockInTime: nowJST,
        checkInPlace,
      },
    });

    res.status(200).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update check-in" });
  }
});

router.patch("/attendance/checkout", async (req, res) => {
  try {
    const { staffProfileId, ProjectMemberId, checkOutPlace } = req.body;

    const existing = await prisma.attendance.findFirst({
      where: {
        staffProfileId,
        ProjectMemberId,
        clockIn: true, // 出勤している最新の出勤記録
        clockOut: false,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: "Attendance record not found" });
    }

    const nowJST = new Date(Date.now() + 9 * 60 * 60 * 1000);

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        clockOut: true,
        clockOutTime: nowJST,
        checkOutPlace,
      },
    });

    res.status(200).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update check-out" });
  }
});

// routes/attendance.js
router.get("/attendances", authenticateToken, async (req, res) => {
  try {
    console.log("JWT payload:", req.user);

    const staffId = req.user?.staffId;
    if (!staffId) {
      return res.status(400).json({ message: "staffId がありません" });
    }

    const profile = await prisma.staffProfile.findUnique({
      where: { staffId },
    });
    if (!profile) {
      return res.status(404).json({ message: "プロフィールが見つかりません" });
    }

    const attendances = await prisma.attendance.findMany({
      where: { staffProfileId: profile.id },
    });

    res.json(attendances);
    console.log("出勤記録:", attendances);
  } catch (err) {
    console.error("サーバーエラー:", err);
    res.status(500).json({ message: "サーバーエラー" });
  }
});

module.exports = router;
