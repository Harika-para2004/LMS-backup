

const express = require('express');
const LeavePolicy = require('../models/LeavePolicy');
const Leave = require('../models/Leave');

const router = express.Router();

const formatCase = (str) => {
  return str.toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
};

router.post('/create', async (req, res) => {
  try {
    const { leaveType, maxAllowedLeaves, description, carryForward, carryForwardLimit } = req.body;

    if (!leaveType || !description) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newPolicy = new LeavePolicy({ leaveType : formatCase(leaveType), maxAllowedLeaves, description, carryForward,
      carryForwardLimit: carryForward ? carryForwardLimit : null, // ✅ Set to null if false
   });
    await newPolicy.save();
    res.status(201).json({ message: "Leave policy created successfully!", data: newPolicy });
  } catch (error) {
    res.status(500).json({ message: "Error creating leave policy", error: error.message });
  }
});

// Get all leave policies
router.get('/', async (req, res) => {
  try {
    const policies = await LeavePolicy.find();
    res.status(200).json({ data: policies });

  } catch (error) {
    res.status(500).json({
      message: 'Error fetching leave policies',
      error: error.message,
    });
  }
});

// Update a leave policy
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { leaveType, maxAllowedLeaves, description, carryForward, carryForwardLimit } = req.body;

  try {
    const updatedPolicy = await LeavePolicy.findByIdAndUpdate(
      id,
      { leaveType : formatCase(leaveType), maxAllowedLeaves, description,carryForward,
        carryForwardLimit: carryForward ? carryForwardLimit : null, // ✅ Ensure null if carryForward is false
     },
      { new: true }
    );

    if (!updatedPolicy) {
      return res.status(404).json({ message: 'Leave policy not found' });
    }

    res.status(200).json({
      message: 'Leave policy updated successfully!',
      data: updatedPolicy,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error updating leave policy',
      error: error.message,
    });
  }
});

router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    // Find the leave policy
    const leavePolicy = await LeavePolicy.findById(id);
    if (!leavePolicy) {
      return res.status(404).json({ message: 'Leave policy not found' });
    }

    // Check if leaveType exists in the Leave collection
    const leaveExists = await Leave.exists({ leaveType: leavePolicy.leaveType });

    if (leaveExists) {
      return res.status(400).json({
        message: `Cannot delete policy. Leave type "${leavePolicy.leaveType}" is in use.`,
      });
    }

    // Proceed with deletion if no dependencies exist
    await LeavePolicy.findByIdAndDelete(id);
    res.status(200).json({ message: 'Leave policy deleted successfully!' });

  } catch (error) {
    res.status(500).json({
      message: 'Error deleting leave policy',
      error: error.message,
    });
  }
});


module.exports = router;