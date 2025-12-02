const { prisma } = require("../lib/clients");

const getAllProjects = async (skip, take, filter) => {
  try {
     
    const params = {};
    // skip should be used as-is, not calculated
    if (skip && parseInt(skip) > 0) {
      params.skip = parseInt(skip);
    }
    if (take && parseInt(take) > 0) {
      params.take = parseInt(take);
    }

    let where = {};

    // Handle status filter
    if (filter?.status) {
      if (filter?.status === "ACTIVE") {
        where.isActive = true;
      } else if (filter?.status === "INACTIVE") {
        where.isActive = false;
      }
    }

    // Handle organisation filter
    if (filter?.organisationId) {
      const orgId = typeof filter.organisationId === 'string' ? filter.organisationId.trim() : String(filter.organisationId);
      if (orgId !== '') {
        where.organisationId = parseInt(orgId);
      }
    }

    // Handle search filter
    if (filter?.search) {
      const searchValue = typeof filter.search === 'string' ? filter.search.trim() : String(filter.search);
      if (searchValue !== '') {
        const searchTerm = searchValue;
        const organisationId = filter.organisationId ? parseInt(typeof filter.organisationId === 'string' ? filter.organisationId : String(filter.organisationId)) : NaN;
        const stateId = filter.stateId ? parseInt(typeof filter.stateId === 'string' ? filter.stateId : String(filter.stateId)) : NaN;
        where.OR = [
          { name: { contains: searchTerm } },
          { projectCode: { contains: searchTerm } },
          { email: { contains: searchTerm } },
          { organisationId: isNaN(organisationId) ? undefined : organisationId },
          { stateId: isNaN(stateId) ? undefined : stateId }
        ];
      }
    }

    params.where = where;
    params.include = { organisation: true };

    const _statusCount = await prisma.project.groupBy({
      by: ["isActive"],
      _count: {
        id: true,
      },
      where: params.where,
    });

    const statusCount = _statusCount.reduce((acc, item) => {
      acc[item.isActive ? "ACTIVE" : "INACTIVE"] = item._count.id;
      acc["ALL"] = (acc["ALL"] || 0) + item._count.id;
      return acc;
    }, {});



    const count = await prisma.project.count({ where: params.where });
    const projects = await prisma.project.findMany({
      ...params,
      orderBy: [{ createdAt: "desc" }]
    });
        
    return { projects, count, statusCount };
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

const getProjectById = async (projectId) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId,
      include: { organisation: true}
       },
    });
    return project;
  } catch (error) {
    console.error("Error fetching project by ID:", error);
    throw error;
  }
};
const createProject = async (projectData) => {
  try {
    const newProject = await prisma.project.create({
      data: projectData,
      include: { organisation: true },
    });
    return newProject;
  } catch (error) {
    console.error("Error creating project:", error);
    throw error;
  }
};

const updateProject = async (projectId, projectData) => {
  try {
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: projectData,
      include: { organisation: true },
    });
    return updatedProject;
  } catch (error) {
    console.error("Error updating project:", error);
    throw error;
  }
};
const deleteProject = async (projectId) => {
  try {
    const deletedProject = await prisma.project.delete({
      where: { id: projectId },
      include: { organisation: true },
    });
    return deletedProject;
  } catch (error) {
    console.error("Error deleting project:", error);
    throw error;
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
};
