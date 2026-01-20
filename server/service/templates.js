const { prisma } = require("../lib/clients");
const getTemplates = async (skip, take, filter) => {
  try {
    const params = {};
    if (skip) params.skip = (parseInt(skip) - 1) * parseInt(take) || 0;
    if (take) params.take = parseInt(take);
    if (filter) {
      if (filter.search) {
        params.where = {
          name: {
            contains: filter.search,
          },
        };
      }
    }
    const count = await prisma.template.count({
      where: params.where || {},
    });
    const templates = await prisma.template.findMany(params);
    return { templates, count };
  } catch (error) {
    throw new Error("Error fetching templates");
  }
};

const getTemplateById = async (id) => {
  try {
    const template = await prisma.template.findUnique({
      where: { id },
    });
    return template;
  } catch (error) {
    throw new Error("Error fetching template");
  }
};

const createTemplate = async (templateData) => {
  try {
    const newTemplate = await prisma.template.create({
      data: templateData,
    });
    return newTemplate;
  } catch (error) {
    throw new Error("Error creating template");
  }
};

const updateTemplate = async (id, templateData) => {
  try {
    const updatedTemplate = await prisma.template.update({
      where: { id },
      data: templateData,
    });
    return updatedTemplate;
  } catch (error) {
    throw new Error("Error updating template");
  }
};

const deleteTemplate = async (id) => {
  try {
    const deletedTemplate = await prisma.template.delete({
      where: { id },
    });
    return deletedTemplate;
  } catch (error) {
    throw new Error("Error deleting template");
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
