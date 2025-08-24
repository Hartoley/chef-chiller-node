const { Project } = require("../Model/user.model");
const eventEmitter = require("../eventemmiter");
const { cloudinary } = require("../utils/cloudinary");
const { JSDOM } = require('jsdom')


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

    if (!title || !description || !features || !technologies || !req.file) {
      return res.status(400).json({
        message: "All required fields and an image file must be provided.",
      });
    }

    let featureArray, technologyArray;
    try {
      featureArray = JSON.parse(features);
      technologyArray = JSON.parse(technologies);
    } catch (error) {
      return res.status(400).json({
        message: "Features and technologies must be valid JSON arrays.",
        error: error.message,
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "products",
    });

    const newProject = new Project({
      title,
      description,
      features: featureArray,
      technologies: technologyArray,
      liveDemoLink,
      repoLink,
      status,
      image: result.secure_url,
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
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found." });
    }
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

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

    const updatedData = {};

    if (title !== undefined) updatedData.title = title;
    if (description !== undefined) updatedData.description = description;

    if (features !== undefined) {
      updatedData.features = Array.isArray(features)
        ? features
        : JSON.parse(features);
    }

    if (technologies !== undefined) {
      updatedData.technologies = Array.isArray(technologies)
        ? technologies
        : JSON.parse(technologies);
    }

    if (liveDemoLink !== undefined) updatedData.liveDemoLink = liveDemoLink;
    if (repoLink !== undefined) updatedData.repoLink = repoLink;
    if (status !== undefined) updatedData.status = status;
    if (image) updatedData.image = image;

    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updatedData }, // ✅ only updates provided fields
      { new: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found." });
    }

    eventEmitter.emit("projectUpdated", updatedProject);

    res.status(200).json({
      message: "Project updated successfully!",
      project: updatedProject,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



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
