const projectService = require("../service/projects");
const moment = require("moment");
const getAllProjects = async (req, res) => {
  try {
    const { skip, take, filter } = req.query;
    const _transformedFilter = filter ? JSON.parse(filter) : undefined;

    const { projects, count, statusCount } =
      await projectService.getAllProjects(skip, take, _transformedFilter);

    const _transformedProjects = projects.map((project) => ({
      ...project,
      status: project.isActive ? "ACTIVE" : "INACTIVE",
      organisationName: project.organisation
        ? project.organisation.name
        : "N/A",
      organizationCode: project.organisation
        ? project.organisation.orgCode
        : "N/A",
      createdAt: moment(project.createdAt).format("YYYY-MM-DD HH:mm:ss"),
    }));

    const takeNum = take ? parseInt(take) : 10;
    const skipNum = skip ? parseInt(skip) : 0;

    res.status(200).json({
      projects: _transformedProjects,
      totalPages: Math.ceil(count / takeNum),
      currentPage: Math.floor(skipNum / takeNum) + 1,
      total: count,
      skip: skipNum,
      take: takeNum,
      statusCount,
    });
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getProjectById = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await projectService.getProjectById(parseInt(id));
    if (!project) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(project);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const createProject = async (req, res) => {
  const projectData = req.body;
  try {
    projectData.stateId = parseInt(projectData.stateId) || null;
    projectData.organisationId = parseInt(projectData.organisationId) || null;
    const newProject = await projectService.createProject(projectData);
    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateProject = async (req, res) => {
  const { id } = req.params;
  const projectData = req.body;
  try {
    projectData.stateId = parseInt(projectData.stateId) || null;
    projectData.organisationId = parseInt(projectData.organisationId) || null;
    const updatedProject = await projectService.updateProject(
      parseInt(id),
      projectData
    );
    if (!updatedProject) {
      return res.status(404).json({ error: "Project not found" });
    }
    res.json(updatedProject);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    await projectService.deleteProject(parseInt(id));
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
