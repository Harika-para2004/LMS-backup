const express = require("express");
const Project = require("../models/Project");
const User = require("../models/User");
const router = express.Router();

// ✅ Add Project
router.post("/projects", async (req, res) => {
  const { projectName } = req.body;
  
  if (!projectName) {
    return res.status(400).json({ message: "Project Name is required" });
  }

  try {
    // ✅ Convert Project Name to Lowercase Before Storing
    const lowerCaseProjectName = projectName.toLowerCase();

    // ✅ Check if project already exists (case-insensitive)
    const existingProject = await Project.findOne({ projectName: lowerCaseProjectName });
    if (existingProject) {
      return res.status(400).json({ message: "Project already exists" });
    }

    // ✅ Create a new project with lowercase projectName
    const newProject = await Project.create({ projectName: lowerCaseProjectName });

    res.status(201).json(newProject);
  } catch (error) {
    res.status(500).json({ message: "Error adding project", error: error.message });
  }
});

// ✅ Get All Projects
router.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find();
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects" });
  }
});
router.put("/projects/:id", async (req, res) => {
  const { projectName } = req.body;

  try {
    // ✅ Find the project before updating
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ✅ Check if the new project name already exists (excluding the current project)
    const existingProject = await Project.findOne({
      projectName: { $regex: new RegExp("^" + projectName + "$", "i") },
      _id: { $ne: req.params.id }
    });

    if (existingProject) {
      return res.status(400).json({ message: "Project already exists" });
    }

    // ✅ Convert project name to lowercase before updating
    const lowerCaseProjectName = projectName.toLowerCase();

    // ✅ Update Project in Project Collection
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { projectName: lowerCaseProjectName }, // Store in lowercase
      { new: true }
    );

    // ✅ Update Project Name in User Collection (for both Manager and Employee)
    await User.updateMany(
      { project: project.projectName.toLowerCase() }, // Match old project name (in lowercase)
      { $set: { project: lowerCaseProjectName } } // Set new project name (in lowercase)
    );

    res.status(200).json(updatedProject);
  } catch (error) {
    res.status(500).json({ message: "Error updating project" });
  }
});


// ✅ Delete Project (Sync with User Collection)
// router.delete("/projects/:id", async (req, res) => {
//   try {
//     // ✅ Find the project before deleting
//     const project = await Project.findById(req.params.id);
//     if (!project) {
//       return res.status(404).json({ message: "Project not found" });
//     }

//     // ✅ Delete the project from Project Collection
//     await Project.findByIdAndDelete(req.params.id);

//     // ✅ Remove Project from Manager (who had that project)
//     await User.updateMany(
//       { project: project.projectName.toLowerCase() }, 
//       { $set: { project: "" } } 
//     );

//     res.status(200).json({ message: "Project deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: "Error deleting project" });
//   }
// });
router.delete("/projects/:id", async (req, res) => {
  try {
    // ✅ Find the project before attempting to delete
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ✅ Check if any user is assigned to this project
    const assignedUsers = await User.findOne({ project: project.projectName.toLowerCase() });
    if (assignedUsers) {
      return res.status(400).json({ message: "Cannot delete project. Users are assigned to this project." });
    }

    // ✅ If no users are assigned, delete the project
    await Project.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting project" });
  }
});


module.exports = router;