const { prisma } = require("../lib/clients");

const getAllProjects = async (skip, take, filter) => {
  try {
    const params = {};
    if (skip) params.skip = (parseInt(skip) - 1) * parseInt(take || 10);
    if (take) params.take = parseInt(take);

    let where = {};

    // Handle status filter
    if (filter?.status) {
      if (filter?.status === "ACTIVE") {
        where.isActive = true;
      } else if (filter?.status === "INACTIVE") {
        where.isActive = false;
      }
    }

    // Handle search filter
    if (filter?.search) {
      where.OR = [
        { name: { contains: filter?.search } },
        { projectCode: { contains: filter?.search } },
        { email: { contains: filter?.search } },
      ];
    }

    // Handle legacy filter parameter (for backward compatibility)
    if (filter && !filter?.status && !filter?.search) {
      if (filter === "ACTIVE") {
        where.isActive = true;
      } else if (filter === "INACTIVE") {
        where.isActive = false;
      } else {
        where.OR = [
          { name: { contains: filter?.search } },
          { projectCode: { contains: filter?.search } },
          { email: { contains: filter?.search } },
        ];
      }
    }

    params.where = where;
    const count = await prisma.project.count({ where: params.where });
    const projects = await prisma.project.findMany(params);
    return { projects, count };
  } catch (error) {
    console.error("Error fetching projects:", error);
    throw error;
  }
};

const getProjectById = async (projectId) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
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
