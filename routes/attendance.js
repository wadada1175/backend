// routes/attendance.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;

// --- UTC helper --------------------------------------------------
const toIso = (d) => (d instanceof Date ? d.toISOString() : d);
const normalizeDescriptions = (descs) =>
  descs.map((pd) => ({
    ...pd,
    workDate: toIso(pd.workDate),
    startTime: toIso(pd.startTime),
    endTime: toIso(pd.endTime),
  }));

// --- UTC helper for Attendance -----------------------------------
const normalizeAttendances = (atts) =>
  atts.map((a) => ({
    ...a,
    clockInTime: toIso(a.clockInTime),
    clockOutTime: toIso(a.clockOutTime),
    ProjectMember: a.ProjectMember
      ? {
          ...a.ProjectMember,
          projectDescription: a.ProjectMember.projectDescription
            ? {
                ...a.ProjectMember.projectDescription,
                ...normalizeDescriptions([
                  a.ProjectMember.projectDescription,
                ])[0],
              }
            : undefined,
        }
      : undefined,
  }));
// -----------------------------------------------------------------

// 日ごとの出勤記録を取得するエンドポイント
router.get("/attendance/day", authenticateToken, async (req, res) => {
  try {
    const { date } = req.query; // 例 "2025-07-21"
    if (!date) return res.status(400).json({ message: "date が必要です" });

    // 当日 00:00–翌日 00:00 (UTC) を作成
    const startOfDay = new Date(`${date}T00:00:00Z`);
    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

    const attendances = await prisma.attendance.findMany({
      where: {
        clockInTime: { gte: startOfDay, lt: endOfDay },
      },
      include: {
        staffProfile: true,
        ProjectMember: {
          include: {
            projectDescription: {
              include: { project: true },
            },
          },
        },
      },
      orderBy: { staffProfileId: "asc" },
    });

    const normalized = normalizeAttendances(attendances);
    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "サーバーエラー" });
  }
});

// 週ごとの出勤記録を取得するエンドポイント
router.get("/attendance/week", authenticateToken, async (req, res) => {
  try {
    const { start } = req.query; // 例 "2025-07-21"
    if (!start) {
      return res.status(400).json({ message: "start が必要です" });
    }

    // UTC で週の開始〜終了を作成
    const startDate = new Date(`${start}T00:00:00Z`);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 7);

    // 週内すべての勤怠を取得
    const attendances = await prisma.attendance.findMany({
      where: {
        clockInTime: { gte: startDate, lt: endDate },
      },
      include: {
        staffProfile: true,
        ProjectMember: {
          include: {
            projectDescription: {
              include: { project: true },
            },
          },
        },
      },
      orderBy: [{ staffProfileId: "asc" }, { clockInTime: "asc" }],
    });

    const normalized = normalizeAttendances(attendances);
    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "サーバーエラー" });
  }
});

// 月ごとの出勤記録を取得するエンドポイント
router.get("/attendance/month", authenticateToken, async (req, res) => {
  try {
    const { year, month } = req.query; // 例 year=2025, month=07
    if (!year || !month) {
      return res.status(400).json({ message: "year と month が必要です" });
    }

    // UTC で対象月の開始と翌月開始を算出
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
    const endDate = new Date(startDate);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);

    // 月内の勤怠を取得
    const attendances = await prisma.attendance.findMany({
      where: {
        clockInTime: { gte: startDate, lt: endDate },
      },
      include: {
        staffProfile: true,
        ProjectMember: {
          include: {
            projectDescription: true,
          },
        },
      },
      orderBy: [{ staffProfileId: "asc" }, { clockInTime: "asc" }],
    });

    const normalized = normalizeAttendances(attendances);
    res.json(normalized);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "サーバーエラー" });
  }
});

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
    const { staffProfileId, ProjectMemberId, checkInPlace, clockInTime } =
      req.body;

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

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        clockIn: true,
        clockInTime,
        checkInPlace,
      },
    });

    console.log("clockInTime:", clockInTime);

    res.status(200).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update check-in" });
  }
});

router.patch("/attendance/checkout", async (req, res) => {
  try {
    const { staffProfileId, ProjectMemberId, checkOutPlace, clockOutTime } =
      req.body;

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

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        clockOut: true,
        clockOutTime,
        checkOutPlace,
      },
    });

    console.log("clockOutTime:", clockOutTime);

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

    const normalized = normalizeAttendances(attendances);
    res.json(normalized);
    // console.log("出勤記録:", attendances);
  } catch (err) {
    console.error("サーバーエラー:", err);
    res.status(500).json({ message: "サーバーエラー" });
  }
});

module.exports = router;
