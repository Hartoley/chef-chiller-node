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

    const result = await cloudinary.uploader.upload(image.path, {
      folder: "products",
    });

    // Validate required fields
    if (!title || !description || !features || !technologies) {
      return res
        .status(400)
        .json({ message: "All required fields must be provided." });
    }

    // Parse features and technologies (JSON strings from the frontend)
    let featureArray, technologyArray;
    try {
      featureArray = JSON.parse(features); // Parse JSON string into an array
      technologyArray = JSON.parse(technologies); // Parse JSON string into an array
    } catch (error) {
      return res.status(400).json({
        message: "Features and technologies must be valid JSON arrays.",
        error: error.message,
      });
    }

    // Create the new project
    const newProject = new Project({
      title,
      description,
      features: featureArray, // Save as an array
      technologies: technologyArray, // Save as an array
      liveDemoLink,
      repoLink,
      status,
      image: result.secure_url,
    });

    // Save the project and emit event
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
    const project = await Project.findById(req.params.id);
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
