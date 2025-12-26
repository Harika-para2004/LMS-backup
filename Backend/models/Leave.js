const mongoose = require("mongoose");
const LeavePolicy = require("./LeavePolicy");
const Holiday = require("./Holiday");
const User = require("./User");

const LeaveSchema = new mongoose.Schema({
  email: { type: String, required: true },
  empname: { type: String, required: true },
  empid: { type: String, required: true },
  managerEmail: { type: String },
  leaveType: { type: String, required: true },
  applyDate: { type: [Date], required: true },
  startDate: { type: [Date], required: true },
  endDate: { type: [Date], required: true },
  reason: { type: [String] },
  status: { type: [String], default: [] },
  totalLeaves: { type: Number, default: null },
  usedLeaves: { type: Number, default: 0 },
  carryForwardedLeaves: { type: Number, default: 0 }, // ✅ NEW: Store carry forwarded leaves
  availableLeaves: { 
    type: Number, 
   
  },
  createdAt: { type: Date, default: Date.now },
  attachments: { type: [String] },
  duration: { type: [[Number]] }, 
  year: { type: [[Number]] },
  month: { type: [[Number]] },
  rejectionComment: { type: [String], default: [] } ,
  childNumber:{type:Number,default:0},
  continous:{type:Boolean,default:false},
});

LeaveSchema.pre("save", async function (next) {
  // 🔹 JOIN DATE (manual for now – later fetch from User table)
  /*changes*/
  const user = await User.findOne({ email: this.email });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.joinDate) {
      return res.status(400).json({ message: "Join date missing" });
    }

    const joinDate = new Date(user.joinDate);
    console.log(joinDate);
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth() + 1;
  
/*changes*/
  if (
    !this.isNew &&
    this.isModified("status") &&
    !this.isModified("startDate") &&
    !this.isModified("endDate")
  ) {
    return next(); // Skip recalculation when approving/rejecting leave
  }

  try {
    const durationArray = [];
    const monthsArray = [];
    const yearsArray = [];
    const holidays = await Holiday.find({ type: "Mandatory" });
    const holidayDates = holidays.map((holiday) =>
      new Date(holiday.date).toDateString()
    );

    this.startDate.forEach((start, index) => {
      const end = this.endDate[index];
      let currentDate = new Date(start);
      let durationPerMonth = {};

      while (currentDate <= new Date(end)) {
        const dayOfWeek = currentDate.getDay();
        const formattedDate = currentDate.toDateString();
        const currentMonth = currentDate.getMonth() + 1;
        const currentYear = currentDate.getFullYear();

        if (
          this.leaveType === "Maternity Leave" || 
          (!holidayDates.includes(formattedDate) && dayOfWeek !== 0 && dayOfWeek !== 6)
        )  {
          if (!durationPerMonth[currentYear]) {
            durationPerMonth[currentYear] = {};
          }
          if (!durationPerMonth[currentYear][currentMonth]) {
            durationPerMonth[currentYear][currentMonth] = 0;
          }
          durationPerMonth[currentYear][currentMonth]++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      const sortedYears = [
        ...new Set(Object.keys(durationPerMonth).map(Number)),
      ].sort((a, b) => a - b);
      const sortedMonths = sortedYears.map((year) =>
        Object.keys(durationPerMonth[year])
          .map(Number)
          .sort((a, b) => a - b)
      );
      const sortedDurations = sortedYears.map((year) =>
        sortedMonths[sortedYears.indexOf(year)].map(
          (month) => durationPerMonth[year][month]
        )
      );

      // ✅ Fix: Store [[2025, 2025]] for same-year multiple months
      if (sortedYears.length === 1 && sortedMonths.flat().length > 1) {
        yearsArray.push(
          new Array(sortedMonths.flat().length).fill(sortedYears[0])
        );
      } else if (sortedYears.length === 2 && sortedMonths.flat().includes(1)) {
        // Handle year transition (e.g., [11, 12, 1] should be [2025, 2025, 2026])
        const expandedYears = sortedMonths
          .flat()
          .map((month) => (month === 1 ? sortedYears[1] : sortedYears[0]));
        yearsArray.push(expandedYears);
      } else {
        yearsArray.push(sortedYears);
      }
      monthsArray.push(sortedMonths.flat());
      durationArray.push(sortedDurations.flat());
    });

    this.duration = durationArray;
    this.month = monthsArray;
    this.year = yearsArray;
    const year = Array.isArray(this.startDate) && this.startDate.length > 0
    ? new Date(this.startDate[0]).getFullYear()
    : new Date().getFullYear(); // Default to the current year if empty
    // ✅ Fetch Leave Policy and Set Leave Limits
    //updated available leaves
    const policy = await LeavePolicy.findOne({ leaveType: this.leaveType });
    /*changes*/
    if (policy) {
      if (policy.maxAllowedLeaves) {
    
        // ✅ JOIN-DATE BASED TOTAL LEAVES (NEW LOGIC)
        let eligibleLeaves = 0;
    
        if (joinYear < year) {
          // Joined before this year → full quota
          eligibleLeaves = policy.maxAllowedLeaves;
        } 
        else if (joinYear === year) {
          // ✅ Joined in this year → prorated with minimum 1 leave
          const remainingMonths = 12 - joinMonth + 1;
        
          const calculatedLeaves =
            (policy.maxAllowedLeaves / 12) * remainingMonths;
        
          // ✅ Minimum 1 leave for ALL leave types
          eligibleLeaves = Math.max(1, Math.ceil(calculatedLeaves));
        } 
        else {
          // ❌ Joined after this year → no leaves
          eligibleLeaves = 0;
        }
        
    
        const isCurrentYear = year === new Date().getFullYear();
    
        // ✅ Preserve carry forward
        this.totalLeaves =
          eligibleLeaves + (isCurrentYear ? this.carryForwardedLeaves : 0);
    /*changes*/
               
        // Ensure available leaves reflect the updated total leaves
   // Fetch all past leaves to correctly calculate available leaves
// Fetch all past leaves for this employee and leave type
const pastLeaves = await mongoose.model("leaveData").find({
  email: this.email,
  leaveType: this.leaveType,
});

// 🔹 Track used and available leaves per year
const usedLeavesByYear = {};
const availableLeavesByYear = {};

// 🔹 Count approved leaves per year
pastLeaves.forEach((leave) => {
  leave.year.flat().forEach((yr, index) => {
    if (!usedLeavesByYear[yr]) usedLeavesByYear[yr] = 0;

    // Only count "Approved" leaves
    if (leave.status[index] === "Approved") {
      usedLeavesByYear[yr] += leave.duration.flat()[index] || 0;
    }
  });
});

// 🔹 Assign available leaves per year
this.year.flat().forEach((yr) => {
  const usedLeaves = usedLeavesByYear[yr] || 0;
  availableLeavesByYear[yr] = Math.max(this.totalLeaves - usedLeaves, 0);
});

// 🔹 Set availableLeaves for the latest year
const latestYear = Math.max(...this.year.flat());
this.availableLeaves = availableLeavesByYear[latestYear] || this.totalLeaves;
      } else {
        this.totalLeaves = this.carryForwardedLeaves || 0;
      }
    } else {
      throw new Error(`Leave policy not found for: ${this.leaveType}`);
    }
    

       // ✅ Maternity Leave Adjustment
       if (this.leaveType === "Maternity Leave") {
        // Fetch past approved maternity leave records
        const pastMaternityLeaves = await mongoose.model("leaveData").find({
            email: this.email,
            leaveType: "Maternity Leave",
        });
    
        // Find the highest childNumber from past records
        let maxChildNumber = 0;
        pastMaternityLeaves.forEach(leave => {
            if (leave.childNumber > maxChildNumber) {
                maxChildNumber = leave.childNumber;
            }
        });
    
        // Count the number of approved maternity leaves
        const maternityLeavesTaken = pastMaternityLeaves.length;
    
        // Determine leave allocation
        if (maternityLeavesTaken >= 2 && maxChildNumber >= 2) {
            this.totalLeaves = 84;
            this.availableLeaves = 84;
        } else if (maternityLeavesTaken == 1 && maxChildNumber >= 2) {
            this.totalLeaves = 84;
            this.availableLeaves = 84;
        }
    
        // ✅ **NEW CONDITION: Add previously approved leaves in the same year**
        const approvedMaternityLeavesSameYear = await mongoose.model("leaveData").find({
            email: this.email,
            leaveType: "Maternity Leave",
            status: "Approved",
            "year.0": this.year[0] // Match the current application year
        });
    
        let previouslyApprovedLeaves = 0;
        approvedMaternityLeavesSameYear.forEach(leave => {
            previouslyApprovedLeaves += leave.usedLeaves; // Sum all used leaves for the same year
        });
    
        // Adjust total leaves
        this.totalLeaves += previouslyApprovedLeaves;
        this.availableLeaves = this.totalLeaves - this.usedLeaves; 
    }
    
    
  
    next();
  } catch (error) {
    console.error("Error in LeaveSchema pre-save:", error);
    next(error);
  }
});

module.exports = mongoose.model("leaveData", LeaveSchema);