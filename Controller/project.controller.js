const { Project } = require("../Model/user.model");
const eventEmitter = require("../eventemmiter");

const addProject = async (req, res) => {
  try {
    const {
      title,
      description,
      features,
      technologies,
      liveDemoLink,
      repoLink,
      status,
    } = req.body;
    let image = req.file ? req.file.path : null;

    if (image) {
      image = image.replace(/\\/g, "/"); // Replace all backslashes with forward slashes
    }

    if (!title || !description || !features || !technologies) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    const featureArray = Array.isArray(features)
      ? features
      : features.split(",");
    const technologyArray = Array.isArray(technologies)
      ? technologies
      : technologies.split(",");

    const newProject = new Project({
      title,
      description,
      features: featureArray,
      technologies: technologyArray,
      liveDemoLink,
      repoLink,
      status,
      image,
    });

    const savedProject = await newProject.save();
    eventEmitter.emit("newProject", savedProject);

    res
      .status(201)
      .json({ message: "Project added successfully!", project: savedProject });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.pId);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update Project
const updateProject = async (req, res) => {
  try {
    const {
      title,
      description,
      features,
      technologies,
      liveDemoLink,
      repoLink,
      status,
    } = req.body;
    const image = req.file ? req.file.path : null;

    const updatedData = {
      title,
      description,
      features: Array.isArray(features) ? features : features.split(","),
      technologies: Array.isArray(technologies)
        ? technologies
        : technologies.split(","),
      liveDemoLink,
      repoLink,
      status,
    };

    if (image) updatedData.image = image;

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      updatedData,
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found." });
    }

    // Emit event to WebSocket clients when a project is updated
    eventEmitter.emit("projectUpdated", updatedProject);

    res.status(200).json({
      message: "Project updated successfully!",
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete Project
const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found." });
    }

    eventEmitter.emit("projectDeleted", deletedProject);

    res.status(200).json({ message: "Project deleted successfully!" });
  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  addProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
};
