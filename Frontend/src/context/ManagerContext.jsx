import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useToast from "../Components/useToast";
import Profile from "../assets/img/profile.png";

const ManagerContext = createContext();

export const ManagerProvider = ({ children }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("leave-requests");
  const [leaveData, setLeaveData] = useState([]);
  const [managerEmail, setManagerEmail] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [gender, setGender] = useState("");
  const [empid, setEmpid] = useState("");
  const [username, setUsername] = useState("");
  const [project, setProject] = useState("");
  const [designation, setDesignation] = useState("");
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [profileImage, setProfileImage] = useState(Profile);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userData, setUserData] = useState(null);
  const [file, setFile] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [error, setError] = useState("");
  const [leavePolicyRef, setLeavePolicyRef] = useState([]);
  const [mergedLeaveData, setMergedLeaveData] = useState([]);
  const [leavePolicies, setLeavePolicies] = useState([]);

  const navigate = useNavigate();
  const showToast = useToast();

  const [errors, setErrors] = useState({
    leaveType: "",
    from: "",
    to: "",
    reason: "",
    mismatch: "",
  });

  const [formData, setFormData] = useState({
    leaveType: "",
    applyDate: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  const year = new Date().getFullYear();

  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    console.log("storedUserData",storedUserData);
    if (storedUserData) {
      try {
        const parsedUserData = JSON.parse(storedUserData);
        if (parsedUserData) {
          setUserData(parsedUserData);
          setUsername(parsedUserData.empname || "");
          setEmpid(parsedUserData.empid || "");
          setManagerEmail(parsedUserData.managerEmail || "")
          setEmail(parsedUserData.email || "");
          setGender(parsedUserData.gender || "");
          setProject(parsedUserData.project || "");
          setRole(parsedUserData.role || "");
        }
      } catch (error) {
        console.error("Error parsing userData from localStorage:", error);
      }
    }
  }, []);

  return (
    <ManagerContext.Provider
      value={{
        modalOpen, setModalOpen,
        leaveHistory, setLeaveHistory,
        selectedLeave, setSelectedLeave,
        selectedCategory, setSelectedCategory,
        leaveData, setLeaveData,
        managerEmail, setManagerEmail,
        email, setEmail,
        gender, setGender,
        empid, setEmpid,
        username, setUsername,
        project, setProject,
        designation, setDesignation,
        leaveRequests, setLeaveRequests,
        holidays, setHolidays,
        profileImage, setProfileImage,
        newPassword, setNewPassword,
        confirmPassword, setConfirmPassword,
        userData, setUserData,
        role,setRole,
        file, setFile,
        selectedFilter, setSelectedFilter,
        error, setError,
        leavePolicyRef, setLeavePolicyRef,
        mergedLeaveData, setMergedLeaveData,
        errors, setErrors,
        formData, setFormData,
        leavePolicies, setLeavePolicies,
        navigate,
        showToast
      }}
    >
      {children}
    </ManagerContext.Provider>
  );
};

export const useManagerContext = () => {
  return useContext(ManagerContext);
};
