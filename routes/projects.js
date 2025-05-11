// routes/projects.js
const express = require("express");
const router = express.Router();
const prisma = require("../prismaClient");

// --- UTC helper --------------------------------------------------
const toIso = (d) => (d instanceof Date ? d.toISOString() : d);
const normalizeDescriptions = (descs) =>
  descs.map((pd) => ({
    ...pd,
    workDate: toIso(pd.workDate),
    startTime: toIso(pd.startTime),
    endTime: toIso(pd.endTime),
  }));
// -----------------------------------------------------------------

// プロジェクト登録エンドポイント
router.post("/registerProject", async (req, res) => {
  const {
    projectType, // 新規作成か既存プロジェクトかのフラグ
    projectName,
    companyId,
    phoneNumber,
    postcode,
    address,
    selectedQualifications,
    qualifiedMembersNeeded,
    requiredMembers,
    unitPriceType,
    unitPrice,
    workDate,
    startTime,
    endTime,
    managerName,
    phonenumber,
    memo,
    existingProjectId, // 既存プロジェクトのID（フロントエンドから受け取る）
  } = req.body;

  if (
    projectType === "new" && // 新規作成時に必須項目のチェック
    (!projectName ||
      !companyId ||
      !phoneNumber ||
      !postcode ||
      !address ||
      !requiredMembers ||
      !unitPriceType ||
      !unitPrice ||
      !workDate ||
      !startTime ||
      !endTime ||
      !managerName ||
      !phonenumber)
  ) {
    return res.status(400).json({ message: "必須項目が未入力です。" });
  }

  try {
    if (projectType === "new") {
      // 新規プロジェクトを作成する場合
      const newProject = await prisma.project.create({
        data: {
          projectName,
          companyId: parseInt(companyId),
          projectDescription: {
            create: {
              workDate: new Date(workDate),
              startTime: new Date(startTime),
              endTime: new Date(endTime),
              address,
              postcode,
              phonenumber,
              managerName,
              requiredMembers: parseInt(requiredMembers),
              unitPrice: parseInt(unitPrice),
              workTimeType: unitPriceType,
              memo,
              // 複数の資格をプロジェクトに関連付ける
              projectQualification: {
                create: selectedQualifications.map(
                  (qualificationId, index) => ({
                    qualificationId: parseInt(qualificationId),
                    numberOfMembersNeeded: qualifiedMembersNeeded[index],
                  })
                ),
              },
            },
          },
        },
      });
      return res
        .status(201)
        .json({ message: "プロジェクトが正常に登録されました。" });
    } else if (projectType === "existing") {
      if (projectType === "existing" && !existingProjectId) {
        return res
          .status(400)
          .json({ message: "既存プロジェクトIDが必要です。" });
      }
      // 既存プロジェクトに新しい詳細を追加する場合
      const updatedProject = await prisma.project.update({
        where: {
          id: parseInt(existingProjectId), // 既存プロジェクトIDを数値に変換して使用
        },
        data: {
          projectDescription: {
            create: {
              workDate: new Date(workDate),
              startTime: new Date(startTime),
              endTime: new Date(endTime),
              address,
              postcode,
              phonenumber,
              managerName,
              requiredMembers: parseInt(requiredMembers),
              unitPrice: parseInt(unitPrice),
              workTimeType: unitPriceType,
              memo,
              projectQualification: {
                create: selectedQualifications.map(
                  (qualificationId, index) => ({
                    qualificationId: parseInt(qualificationId),
                    numberOfMembersNeeded: qualifiedMembersNeeded[index],
                  })
                ),
              },
            },
          },
        },
      });
      return res
        .status(201)
        .json({ message: "既存プロジェクトに詳細が追加されました。" });
    } else {
      return res
        .status(400)
        .json({ message: "無効なプロジェクトタイプです。" });
    }
  } catch (error) {
    console.error("プロジェクト登録中にエラーが発生しました:", error);
    return res
      .status(500)
      .json({ message: "プロジェクト登録中にエラーが発生しました。" });
  }
});

router.get("/reprojects", async (req, res) => {
  try {
    const projects = await prisma.project.findMany({
      include: {
        company: true,
        projectDescription: true,
      },
    });
    res.json(projects);
  } catch (error) {
    console.error("プロジェクト情報の取得中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "プロジェクト情報の取得中にエラーが発生しました。" });
  }
});

// プロジェクト一覧取得エンドポイント
router.get("/projects", async (req, res) => {
  const { year, month } = req.query;

  // 年と月のバリデーション
  if (!year || !month || isNaN(year) || isNaN(month)) {
    return res
      .status(400)
      .json({ message: "無効な年または月が指定されました。" });
  }

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const projects = await prisma.project.findMany({
      where: {
        projectDescription: {
          some: {
            workDate: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      },
      include: {
        company: true,
        projectDescription: {
          include: {
            projectQualification: {
              include: {
                qualification: true,
              },
            },
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
                }, // 必要に応じてスタッフ情報も取得
              },
            },
          },
        },
      },
    });

    const normalized = projects.map((p) => ({
      ...p,
      projectDescription: normalizeDescriptions(p.projectDescription),
    }));
    return res.json(normalized);
    // res.json(projects);
  } catch (error) {
    console.error("プロジェクト情報の取得中にエラーが発生しました:", error);
    res
      .status(500)
      .json({ message: "プロジェクト情報の取得中にエラーが発生しました。" });
  }
});

// 個別のプロジェクト詳細情報取得エンドポイント
router.get(
  "/project/:projectId/description/:projectDescriptionId",
  async (req, res) => {
    const { projectId, projectDescriptionId } = req.params;

    try {
      const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId, 10) },
        include: {
          projectDescription: {
            where: {
              id: parseInt(projectDescriptionId, 10), // projectDescriptionIdでフィルタリング
            },
            include: {
              projectQualification: {
                include: {
                  qualification: true,
                },
              },
            },
          },
          company: true,
        },
      });

      if (!project || project.projectDescription.length === 0) {
        return res
          .status(404)
          .json({ message: "プロジェクト詳細が見つかりません。" });
      }

      const normalized = {
        ...project,
        projectDescription: normalizeDescriptions(project.projectDescription),
      };
      return res.json(normalized);
      // res.json(project);
    } catch (error) {
      console.error("プロジェクト詳細の取得中にエラーが発生しました:", error);
      res
        .status(500)
        .json({ message: "プロジェクト詳細の取得中にエラーが発生しました。" });
    }
  }
);

// プロジェクト詳細の削除エンドポイント
router.delete(
  "/project/:projectId/description/:projectDescriptionId",
  async (req, res) => {
    const { projectId, projectDescriptionId } = req.params;

    try {
      // プロジェクトの詳細の数を確認
      const project = await prisma.project.findUnique({
        where: { id: parseInt(projectId, 10) },
        include: { projectDescription: true },
      });

      if (!project) {
        return res
          .status(404)
          .json({ message: "プロジェクトが見つかりません。" });
      }

      // プロジェクト詳細が1つしかない場合、まずProjectDescriptionを削除してからProjectを削除
      if (project.projectDescription.length === 1) {
        // ProjectQualificationを削除
        await prisma.projectQualification.deleteMany({
          where: { projectDescriptionId: parseInt(projectDescriptionId, 10) },
        });

        await prisma.attendance.deleteMany({
          where: {
            ProjectMember: {
              projectDescriptionId: parseInt(projectDescriptionId, 10),
            },
          },
        });

        await prisma.projectMember.deleteMany({
          where: { projectDescriptionId: parseInt(projectDescriptionId, 10) },
        });

        await prisma.projectDescription.deleteMany({
          where: { projectId: parseInt(projectId, 10) },
        });

        await prisma.project.delete({
          where: { id: parseInt(projectId, 10) },
        });

        return res
          .status(200)
          .json({ message: "プロジェクト全体が削除されました。" });
      }

      // それ以外の場合はプロジェクト詳細のみを削除
      await prisma.projectQualification.deleteMany({
        where: { projectDescriptionId: parseInt(projectDescriptionId, 10) },
      });

      // Attendance を先に削除
      await prisma.attendance.deleteMany({
        where: {
          ProjectMember: {
            projectDescriptionId: parseInt(projectDescriptionId, 10),
          },
        },
      });

      await prisma.projectMember.deleteMany({
        where: { projectDescriptionId: parseInt(projectDescriptionId, 10) },
      });

      await prisma.projectDescription.delete({
        where: { id: parseInt(projectDescriptionId, 10) },
      });

      return res
        .status(200)
        .json({ message: "プロジェクト詳細が削除されました。" });
    } catch (error) {
      console.error("削除中にエラーが発生しました:", error);
      return res
        .status(500)
        .json({ message: "削除中にエラーが発生しました。" });
    }
  }
);

router.put(
  "/projects/:projectId/description/:projectDescriptionId",
  async (req, res) => {
    const { projectId, projectDescriptionId } = req.params;
    const {
      projectName,
      companyId,
      phoneNumber,
      postcode,
      address,
      selectedQualifications,
      qualifiedMembersNeeded,
      requiredMembers,
      unitPriceType,
      unitPrice,
      workDate,
      startTime,
      endTime,
      managerName,
      phonenumber,
      memo,
    } = req.body;

    try {
      // プロジェクト名や会社の更新
      const updatedProject = await prisma.project.update({
        where: { id: parseInt(projectId, 10) },
        data: {
          projectName,
          companyId: parseInt(companyId, 10),
        },
      });

      // プロジェクト詳細の更新
      const updatedProjectDescription = await prisma.projectDescription.update({
        where: { id: parseInt(projectDescriptionId, 10) },
        data: {
          workDate: new Date(workDate),
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          address,
          postcode,
          phonenumber,
          managerName,
          requiredMembers: parseInt(requiredMembers, 10),
          unitPrice: parseInt(unitPrice, 10),
          workTimeType: unitPriceType,
          memo,
        },
      });

      // 現在の資格情報を取得
      const currentQualifications = await prisma.projectQualification.findMany({
        where: { projectDescriptionId: parseInt(projectDescriptionId, 10) },
      });

      // 更新するデータを準備
      const validSelectedQualifications = Array.isArray(selectedQualifications)
        ? selectedQualifications
        : [];
      const validQualifiedMembersNeeded = Array.isArray(qualifiedMembersNeeded)
        ? qualifiedMembersNeeded
        : [];

      // 削除される資格 (データベースに存在するが、フロントエンドには送信されなかったもの)
      const qualificationsToDelete = currentQualifications.filter(
        (qual) => !validSelectedQualifications.includes(qual.qualificationId)
      );

      // 新規追加される資格 (フロントエンドで追加されたが、データベースに存在しないもの)
      const qualificationsToAdd = validSelectedQualifications.filter(
        (qualificationId) =>
          !currentQualifications.some(
            (qual) => qual.qualificationId === qualificationId
          )
      );

      // 上書き対象の資格 (すでにデータベースに存在し、フロントエンドから送信されたもの)
      const qualificationsToUpdate = currentQualifications.filter((qual) =>
        validSelectedQualifications.includes(qual.qualificationId)
      );

      // まず削除を行う
      await prisma.projectQualification.deleteMany({
        where: {
          id: {
            in: qualificationsToDelete.map((qual) => qual.id),
          },
        },
      });

      // 追加対象の資格を追加する
      await prisma.projectQualification.createMany({
        data: qualificationsToAdd.map((qualificationId, index) => ({
          qualificationId: parseInt(qualificationId, 10),
          numberOfMembersNeeded: validQualifiedMembersNeeded[index],
          projectDescriptionId: parseInt(projectDescriptionId, 10),
        })),
      });

      // 上書き対象の資格を更新する
      for (const qual of qualificationsToUpdate) {
        const index = validSelectedQualifications.indexOf(qual.qualificationId);
        await prisma.projectQualification.update({
          where: { id: qual.id },
          data: {
            numberOfMembersNeeded: validQualifiedMembersNeeded[index],
          },
        });
      }

      return res
        .status(200)
        .json({ message: "プロジェクト詳細が正常に更新されました。" });
    } catch (error) {
      console.error("更新中にエラーが発生しました:", error);
      return res
        .status(500)
        .json({ message: "プロジェクト詳細の更新中にエラーが発生しました。" });
    }
  }
);

// プロジェクトメンバーの追加エンドポイント
router.post("/project/:projectId/member", async (req, res) => {
  const { projectId } = req.params;
  const { memberId, projectDescriptionId } = req.body;

  if (!memberId || !projectDescriptionId) {
    return res.status(400).json({ message: "必須項目が未入力です。" });
  }

  try {
    const projectMember = await prisma.projectMember.create({
      data: {
        memberId: parseInt(memberId, 10),
        projectDescriptionId: parseInt(projectDescriptionId, 10),
      },
    });

    return res
      .status(201)
      .json({ message: "プロジェクトメンバーが正常に追加されました。" });
  } catch (error) {
    console.error("プロジェクトメンバーの追加中にエラーが発生しました:", error);
    return res.status(500).json({
      message: "プロジェクトメンバーの追加中にエラーが発生しました。",
    });
  }
});

// プロジェクトメンバーの更新エンドポイント
router.post("/projectMembers/update", async (req, res) => {
  const { updateProjectMembers } = req.body;

  if (!updateProjectMembers || typeof updateProjectMembers !== "object") {
    return res.status(400).json({ message: "無効なデータ形式です。" });
  }

  const projectDescriptionIds = Object.keys(updateProjectMembers);

  // const notifyShiftUpdated = require("../mail/shiftNotification");

  try {
    await prisma.$transaction(async (prisma) => {
      for (const projectDescriptionId of projectDescriptionIds) {
        const newMembers = updateProjectMembers[projectDescriptionId] || [];
        const pdId = parseInt(projectDescriptionId, 10);

        const existingMembers = await prisma.projectMember.findMany({
          where: {
            projectDescriptionId: pdId,
          },
          select: {
            id: true,
            staffProfileId: true,
          },
        });

        const existingMap = new Map(
          existingMembers.map((m) => [m.staffProfileId, m.id])
        );

        const newIds = new Set(newMembers.map((m) => m.staffProfileId));
        const existingIds = new Set(
          existingMembers.map((m) => m.staffProfileId)
        );

        const toAdd = [...newIds].filter((id) => !existingIds.has(id));
        const toDelete = [...existingIds].filter((id) => !newIds.has(id));

        // --- 削除処理 ---
        if (toDelete.length > 0) {
          const deleteProjectMemberIds = toDelete.map((id) =>
            existingMap.get(id)
          );

          await prisma.attendance.deleteMany({
            where: {
              ProjectMemberId: { in: deleteProjectMemberIds },
            },
          });

          await prisma.projectMember.deleteMany({
            where: {
              id: { in: deleteProjectMemberIds },
            },
          });
        }

        // --- 追加処理 ---
        for (const member of newMembers) {
          if (!toAdd.includes(member.staffProfileId)) continue;

          const createdMember = await prisma.projectMember.create({
            data: {
              staffProfileId: member.staffProfileId,
              projectDescriptionId: pdId,
            },
          });

          await prisma.attendance.create({
            data: {
              staffProfileId: member.staffProfileId,
              ProjectMemberId: createdMember.id,
              clockIn: false,
              clockOut: false,
              clockInTime: null,
              clockOutTime: null,
              submitPaper: "",
              checkInPlace: "",
              checkOutPlace: "",
            },
          });
        }
      }
    });

    // // ❶ 影響を受けた staffProfileId を収集
    // const affectedIds = Object.values(updateProjectMembers)
    //   .flat()
    //   .map((m) => m.staffProfileId);
    // const uniqueIds = [...new Set(affectedIds)];

    // // ❷ メールアドレス取得
    // const profiles = await prisma.staffProfile.findMany({
    //   where: { id: { in: uniqueIds } },
    //   select: { email: true, name: true },
    // });

    // // ❸ 並列送信
    // await Promise.all(profiles.map((p) => notifyShiftUpdated(p.email, p.name)));

    return res.status(200).json({
      message: "差分のみプロジェクトメンバーと勤怠情報を更新しました。",
    });
  } catch (error) {
    console.error("更新中にエラーが発生しました:", error);
    return res.status(500).json({ message: "更新中にエラーが発生しました。" });
  }
});

module.exports = router;
