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

router.get("/assigned-shifts", authenticateToken, async (req, res) => {
  try {
    const staffId = req.user.staffId;

    const profile = await prisma.staffProfile.findUnique({
      where: { staffId },
    });

    if (!profile) {
      return res.status(404).json({ message: "プロフィールが見つかりません" });
    }

    const assignments = await prisma.projectMember.findMany({
      where: { staffProfileId: profile.id },
      include: {
        projectDescription: {
          include: {
            project: { select: { id: true, projectName: true } },
            ProjectMember: {
              // フィールド名を正しく指定
              include: {
                staffProfile: {
                  include: {
                    qualifications: {
                      include: {
                        qualification: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const mappedAssignments = assignments.map((assignment) => ({
      projectMemberId: assignment.id,
      staffProfileId: assignment.staffProfileId,
      projectDescriptionId: assignment.projectDescriptionId,
      workDate: assignment.projectDescription.workDate,
      startTime: assignment.projectDescription.startTime,
      endTime: assignment.projectDescription.endTime,
      address: assignment.projectDescription.address,
      projectName: assignment.projectDescription.project.projectName,
      managerName: assignment.projectDescription.managerName,
      phonenumber: assignment.projectDescription.phonenumber,
      address: assignment.projectDescription.address,
      staffName: assignment.projectDescription.ProjectMember.map(
        (member) => member.staffProfile.name
      ),
    }));

    // console.log("Mapped Assignments:", mappedAssignments);

    res.json(mappedAssignments);
  } catch (error) {
    console.error("Error fetching assigned shifts:", error);
    res.status(500).json({ message: "シフトの取得中にエラーが発生しました" });
  }
});

module.exports = router;
