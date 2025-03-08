const express = require("express");
const router = express.Router();
const Project = require("../models/Project"); // Adjust path if needed
const User=require('../models/User')
router.get("/fetchprojects", async (req, res) => {
  try {
    const { managerEmail } = req.query;

    let query = {};
    if (managerEmail) {
      query.managerEmail = managerEmail; // Filter projects by manager
    }

    const projects = await Project.find(query, "projectName managerEmail");

    // Get all distinct manager emails for selection dropdown
    const managers = await Project.distinct("managerEmail");

    res.json({ projects, managers });
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects and managers" });
  }
});


// Get all projects
router.get("/projects", async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: "Error fetching projects" });
  }
});
const formatCase = (text) => {
  return text
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, ""); // Removing spaces to convert into CamelCase
};
// ✅ Add new project and automatically update User collection
router.post("/projects", async (req, res) => {
  let { projectName, managerEmail } = req.body;

  if (!projectName || !managerEmail) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // ✅ Convert project name to camel case
  projectName = formatCase(projectName);

  try {
    // ✅ Check if the project already exists
    const existingProject = await Project.findOne({ projectName });

    if (existingProject) {
      return res.status(400).json({ message: "Project already exists" });
    }

    // ✅ Save new project in Project Collection
    const newProject = new Project({ projectName, managerEmail });
    await newProject.save();

    // ✅ Find the User (Manager) only if role === Manager
    const user = await User.findOne({ email: managerEmail, role: "Manager" });

    let updatedUser = null;

    if (user) {
      let currentProjects = user.project ? user.project.split(",") : [];

      // ✅ Prevent duplicate project entry
      if (!currentProjects.includes(projectName.toLowerCase())) {
        currentProjects.push(projectName.toLowerCase());
      }

      // ✅ Update the Manager's Project List
      user.project = currentProjects.join(",");
      updatedUser = await user.save();
    }

    // ✅ Send success response
    res.status(201).json({
      message: "Project added successfully and User updated!",
      newProject,
      updatedUser,
    });

  } catch (error) {
    console.error("Error adding project:", error);
    res.status(500).json({ message: "Error adding project" });
  }
});
router.put("/projects/:id", async (req, res) => {
  let { projectName, managerEmail } = req.body;

  try {
    // ✅ Step 1: Fetch the old project details
    const oldProject = await Project.findById(req.params.id);

    // ✅ Step 2: Update Project Collection
    const updatedProject = await Project.findByIdAndUpdate(
      req.params.id,
      { projectName, managerEmail },
      { new: true }
    );

    // ✅ Step 3: Remove project from OLD Manager (if manager changed)
    if (oldProject.managerEmail !== managerEmail) {
      const oldManager = await User.findOne({
        email: oldProject.managerEmail,
        role: "Manager"
      });

      if (oldManager) {
        // ✅ Split the project and remove only the old project
        let oldProjects = oldManager.project ? oldManager.project.split(",") : [];
        oldProjects = oldProjects.filter(p => p.toLowerCase() !== oldProject.projectName.toLowerCase());

        // ✅ Join the projects back and save
        oldManager.project = oldProjects.join(",");
        await oldManager.save();
      }

      // ✅ Step 4: Add the project to NEW Manager
      const newManager = await User.findOne({
        email: managerEmail,
        role: "Manager"
      });

      if (newManager) {
        let newProjects = newManager.project ? newManager.project.split(",") : [];
        if (!newProjects.includes(projectName.toLowerCase())) {
          newProjects.push(projectName.toLowerCase());
        }

        // ✅ Join the projects back and save
        newManager.project = newProjects.join(",");
        await newManager.save();
      }
    }

    // ✅ Step 5: Update Only Employees (DO NOT update Manager's managerEmail)
    await User.updateMany(
      {
        managerEmail: oldProject.managerEmail,
        project: oldProject.projectName
      },
      {
        $set: {
          project: projectName,
          managerEmail: managerEmail
        }
      }
    );

    // ✅ Step 6: Update Only the Manager's Project without affecting others
    const manager = await User.findOne({
      email: oldProject.managerEmail,
      role: "Manager"
    });

    if (manager) {
      let projects = manager.project ? manager.project.split(",") : [];
      let updatedProjects = projects.map(p =>
        p.toLowerCase() === oldProject.projectName.toLowerCase() ? projectName : p
      );

      manager.project = updatedProjects.join(",");
      await manager.save();
    }

    res.status(200).json({ message: "Project updated and manager reassigned", updatedProject });

  } catch (error) {
    console.error("Error updating project:", error);
    res.status(500).json({ message: "Error updating project" });
  }
});
router.delete("/projects/:id", async (req, res) => {
  try {
    // ✅ Fetch the Project before deleting
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // ✅ Step 1: Remove the project from Manager
    const manager = await User.findOne({
      email: project.managerEmail,
      role: "Manager"
    });

    if (manager) {
      let projects = manager.project ? manager.project.split(",") : [];
      projects = projects.filter(p => p.toLowerCase() !== project.projectName.toLowerCase());
      manager.project = projects.join(",");
      await manager.save();
    }

    // ✅ Step 2: Remove project from Employees
    await User.updateMany(
      {
        project: project.projectName
      },
      {
        $set: { project: "" }
      }
    );

    // ✅ Step 3: Delete the Project
    await Project.findByIdAndDelete(req.params.id);

    res.json({ message: "Project deleted successfully." });

  } catch (error) {
    console.error("Error deleting project:", error);
    res.status(500).json({ message: "Error deleting project" });
  }
});



module.exports = router; 