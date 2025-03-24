import "./Navbar.css";
import usePasswordUpdate from "./usePasswordUpdate";
import PasswordModal from "./PasswordModal"; // ✅ Import separately
const backendUrl = import.meta.env.VITE_BACKEND_URL;

const Navbar = ({ userType, email }) => {
  const { open, handleOpen, handleClose, formData, handleInputChange, errors, handleUpdatePassword } = usePasswordUpdate();

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="nav-title">Leave Management System</div>
        <button className="update-password-btn" onClick={handleOpen}>
          Reset Password
        </button>
      </div>

      {open && (
        <PasswordModal
          open={open}
          handleClose={handleClose}
          formData={formData}
          handleInputChange={handleInputChange}
          errors={errors}
          handleUpdatePassword={handleUpdatePassword}
          email={email}
        />
      )}
    </nav>
  );
};

export default Navbar;
