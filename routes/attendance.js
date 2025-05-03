// routes/attendance.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

//初期登録エンドポイント

// Create attendance record (check-in)
router.post("/attendance", async (req, res) => {
  try {
    const {
      staffProfileId,
      ProjectMemberId,
      clockIn,
      clockOut,
      clockInTime,
      submitPaper,
    } = req.body;
    const attendance = await prisma.attendance.create({
      data: {
        staffProfileId,
        ProjectMemberId,
        clockIn,
        clockOut,
        clockInTime: new Date(clockInTime),
        submitPaper,
      },
    });
    res.status(201).json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create attendance record" });
  }
});

// Update attendance record (check-out)
router.patch("/attendance/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { clockOut, clockOutTime } = req.body;
    const attendance = await prisma.attendance.update({
      where: { id: Number(id) },
      data: {
        clockOut,
        clockOutTime: clockOutTime ? new Date(clockOutTime) : undefined,
      },
    });
    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update attendance record" });
  }
});

module.exports = router;
