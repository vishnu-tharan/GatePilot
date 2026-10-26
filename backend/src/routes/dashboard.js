const { VehicleRecord } = require("../models");
const { verifyToken } = require("../../middleware/authMiddleware");
const { wrap, scope } = require("../http");
function registerDashboardRoutes(app) {
  app.get(
    "/dashboard",
    verifyToken,
    wrap(async (req, res) => {
      const filter = scope(req),
        start = new Date();
      start.setUTCHours(0, 0, 0, 0);
      const [inside, pending, today, recent, gateCounts] = await Promise.all([
        VehicleRecord.countDocuments({
          ...filter,
          outTime: null,
        }),
        VehicleRecord.countDocuments({
          ...filter,
          outTime: null,
          approvalStatus: "Pending Approval",
        }),
        VehicleRecord.countDocuments({
          ...filter,
          inTime: {
            $gte: start.toISOString(),
          },
        }),
        VehicleRecord.find(filter)
          .sort({
            updatedAt: -1,
            _id: -1,
          })
          .limit(6),
        VehicleRecord.aggregate([
          { $match: { ...filter, outTime: null } },
          { $group: { _id: "$entryGate", inside: { $sum: 1 } } },
        ]),
      ]);
      res.json({
        inside,
        pending,
        today,
        recent,
        gates: req.settings.gates.map(({ name: gate }) => ({
          gate,
          inside: gateCounts.find((item) => item._id === gate)?.inside || 0,
        })),
      });
    }),
  );
}
module.exports = { registerDashboardRoutes };
