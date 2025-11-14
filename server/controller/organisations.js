const organisationService = require("../service/organisations");
const moment = require("moment");

const getAll = async (req, res) => {
  try {
    const { skip, take, filter } = req.query;
    const userId = req.user.id;
    const { organisations, count, statusCount } =
      await organisationService.getAll(skip, take, filter, userId);

    const _transformedOrgs = organisations.map((org) => ({
      ...org,
      status: org.isActive ? "ACTIVE" : "INACTIVE",
      createdAt:  moment(org.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    }));
    res.status(200).json({
      organisations: _transformedOrgs,
      statusCount,
      totalPages: Math.ceil(count / 10),
      currentPage: Math.ceil(skip / take),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getAll,
};
