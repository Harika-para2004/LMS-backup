import { useState } from "react";
import axios from "axios";
import useToast from "./useToast";

const usePasswordUpdate = () => {
  const [open, setOpen] = useState(false);
  const showToast = useToast();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setFormData({ newPassword: "", confirmPassword: "" }); // ✅ Clear form fields
    setErrors({}); // ✅ Clear errors
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleUpdatePassword = async (email) => {
    if (formData.newPassword !== formData.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    try {
      const response = await axios.put("http://localhost:5001/updatepassword", {
        email,
        newPassword: formData.newPassword,
      });

      if (response.status === 200) {
        showToast("Password updated successfully!","success");
        handleClose();
      } else {
        alert("Failed to update password. Try again.");
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error updating password.");
    }
  };

  return { open, handleOpen, handleClose, formData, handleInputChange, errors, handleUpdatePassword };
};

export default usePasswordUpdate;
