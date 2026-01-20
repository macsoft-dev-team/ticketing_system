const templateService = require("../service/templates");

const getTemplates = async (req, res) => {
  const { skip, take, filter } = req.query;
  try {
    const { templates, count } = await templateService.getTemplates(
      skip,
      take,
      filter,
    );
    res
      .status(200)
      .json({
        templates,
        totalPages: Math.ceil(count / take),
        currentPage: parseInt(skip) || 1,
      });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getTemplateById = async (req, res) => {
  const { id } = req.params;
  try {
    const template = await templateService.getTemplateById(id);
    if (!template) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.status(200).json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createTemplate = async (req, res) => {
  const templateData = req.body;
  try {
    if (templateData.customerId === "") {
      delete templateData.customerId;
    }
    const newTemplate = await templateService.createTemplate(templateData);
    res.status(201).json(newTemplate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateTemplate = async (req, res) => {
  const { id } = req.params;
  const templateData = req.body;

  try {
    if (templateData.customerId === "") {
      delete templateData.customerId;
    }

    const updatedTemplate = await templateService.updateTemplate(
      id,
      templateData,
    );
    if (!updatedTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.status(200).json(updatedTemplate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteTemplate = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedTemplate = await templateService.deleteTemplate(id);
    if (!deletedTemplate) {
      return res.status(404).json({ error: "Template not found" });
    }
    res.status(200).json(deletedTemplate);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};
