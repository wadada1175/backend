// routes/attendance.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

// check-in update only
router.post("/attendance/checkin", async (req, res) => {
  try {
    const { staffProfileId, ProjectMemberId, checkInPlace } = req.body;

    const existing = await prisma.attendance.findFirst({
      where: {
        staffProfileId,
        ProjectMemberId,
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

module.exports = router;
