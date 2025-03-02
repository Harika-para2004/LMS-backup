// const express = require('express');
// const LeavePolicy = require('../models/LeavePolicy');

// const router = express.Router();

// // Create a new leave policy
// router.post('/create', async (req, res) => {
//     try {
//       const { leaveType, maxAllowedLeaves } = req.body;
  
//       if (!leaveType || !maxAllowedLeaves) {
//         return res.status(400).json({ message: "All fields are required." });
//       }
  
//       const newPolicy = new LeavePolicy({ leaveType, maxAllowedLeaves });
//       await newPolicy.save();
//       res.status(201).json({ message: "Leave policy created successfully!", data: newPolicy });
//     } catch (error) {
//       console.error("Error creating leave policy:", error.message);
//       res.status(500).json({ message: "Error creating leave policy", error: error.message });
//     }
//   });

// // Get all leave policies
// router.get('/', async (req, res) => {
//   try {
//     const policies = await LeavePolicy.find();
//     res.status(200).json({ data: policies });
//   } catch (error) {
//     console.error('Error fetching leave policies:', error);
//     res.status(500).json({
//       message: 'Error fetching leave policies',
//       error: error.message,
//     });
//   }
// });

// // Update a leave policy
// router.put('/update/:id', async (req, res) => {
//   const { id } = req.params;
//   const { leaveType, maxAllowedLeaves } = req.body;

//   try {
//     const updatedPolicy = await LeavePolicy.findByIdAndUpdate(
//       id,
//       { leaveType, maxAllowedLeaves },
//       { new: true }
//     );

//     if (!updatedPolicy) {
//       return res.status(404).json({ message: 'Leave policy not found' });
//     }

//     res.status(200).json({
//       message: 'Leave policy updated successfully!',
//       data: updatedPolicy,
//     });
//   } catch (error) {
//     console.error('Error updating leave policy:', error);
//     res.status(500).json({
//       message: 'Error updating leave policy',
//       error: error.message,
//     });
//   }
// });

// // Delete a leave policy
// router.delete('/delete/:id', async (req, res) => {
//   const { id } = req.params;

//   try {
//     const deletedPolicy = await LeavePolicy.findByIdAndDelete(id);

//     if (!deletedPolicy) {
//       return res.status(404).json({ message: 'Leave policy not found' });
//     }

//     res.status(200).json({ message: 'Leave policy deleted successfully!' });
//   } catch (error) {
//     console.error('Error deleting leave policy:', error);
//     res.status(500).json({
//       message: 'Error deleting leave policy',
//       error: error.message,
//     });
//   }
// });

// module.exports = router;

const express = require('express');
const LeavePolicy = require('../models/LeavePolicy');

const router = express.Router();

router.post('/create', async (req, res) => {
  try {
    const { leaveType, maxAllowedLeaves, description } = req.body;

    if (!leaveType || !description) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const newPolicy = new LeavePolicy({ leaveType, maxAllowedLeaves, description });
    await newPolicy.save();
    res.status(201).json({ message: "Leave policy created successfully!", data: newPolicy });
  } catch (error) {
    console.error("Error creating leave policy:", error.message);
    res.status(500).json({ message: "Error creating leave policy", error: error.message });
  }
});

// Get all leave policies
router.get('/', async (req, res) => {
  try {
    const policies = await LeavePolicy.find();
    res.status(200).json({ data: policies });
  } catch (error) {
    console.error('Error fetching leave policies:', error);
    res.status(500).json({
      message: 'Error fetching leave policies',
      error: error.message,
    });
  }
});

// Update a leave policy
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { leaveType, maxAllowedLeaves, description } = req.body;

  try {
    const updatedPolicy = await LeavePolicy.findByIdAndUpdate(
      id,
      { leaveType, maxAllowedLeaves, description },
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
    console.error('Error updating leave policy:', error);
    res.status(500).json({
      message: 'Error updating leave policy',
      error: error.message,
    });
  }
});

// Delete a leave policy
router.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const deletedPolicy = await LeavePolicy.findByIdAndDelete(id);

    if (!deletedPolicy) {
      return res.status(404).json({ message: 'Leave policy not found' });
    }

    res.status(200).json({ message: 'Leave policy deleted successfully!' });
  } catch (error) {
    console.error('Error deleting leave policy:', error);
    res.status(500).json({
      message: 'Error deleting leave policy',
      error: error.message,
    });
  }
});

module.exports = router;