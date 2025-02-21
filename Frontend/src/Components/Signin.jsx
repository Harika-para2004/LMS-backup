import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai"; // Importing eye icons from react-icons
import "./../assets/css/styles.css";
import logo from "./../assets/img/logo.jpg";
import authImage from "./../assets/img/authentication.svg";

const LoginForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false); // State for password visibility
  const navigate = useNavigate();

  useEffect( () => {
    localStorage.removeItem("userData");
    localStorage.removeItem("admin");
  },[]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible); // Toggle password visibility
  };

  //handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.email === "admin@gmail.com" && formData.password === "1234") {
      localStorage.setItem("admin", JSON.stringify(formData.email));

      navigate(`/admin`);
    } else {
      try {
        const apiUrl = "http://localhost:5001/api/auth/signin";
        const response = await axios.post(apiUrl, formData);

        if (response.status === 200 || response.status === 201) {
          const userDataResponse = await axios.get(
            `http://localhost:5001/api/auth/user/${response.data.userId}`
          );
          const userData = userDataResponse.data;

          localStorage.setItem("userData", JSON.stringify(userData));
          if (
            userData.role === "Manager"
          ) {
            navigate(`/manager`);
          } else {
            navigate(`/employee`, { state: { userData } });
          }
        }
      } catch (error) {
        alert(error.response?.data?.message || "Something went wrong");
      }
    }
  };

  return (
    // <div className="l-form">
    //   <div className="shape2"></div>
    //   <div className="shape1"></div>

    //   <div className="form">
    //     <div className="circle"></div>
    //     <img src={logo} alt="Quadface Logo" className="logo1" />
    //     <img src={authImage} alt="Authentication" className="form__img" />

    //     <form onSubmit={handleSubmit} className="form__content">
    //       <div>
    //         {" "}
    //         <h2 style={{ textAlign: "center" }}>Welcome</h2>
    //         <br />
    //       </div>
    //       <div className="form__div form__div-one">
    //         <div className="form__icon">
    //           <i className="bx bx-user-circle"></i>
    //         </div>

    //         <div className="form__div-input">
    //           <input
    //             type="email"
    //             id="email"
    //             name="email"
    //             className="form__input"
    //             value={formData.email}
    //             onChange={handleInputChange}
    //             placeholder=" "
    //             required
    //           />
    //           <label htmlFor="email" className="form__label">
    //             Email
    //           </label>
    //         </div>
    //       </div>

    //       <div className="form__div">
    //         <div className="form__icon">
    //           <i className="bx bx-lock"></i>
    //         </div>

    //         <div className="form__div-input">
    //           <input
    //             type={passwordVisible ? "text" : "password"} // Toggle input type based on visibility
    //             id="password"
    //             name="password"
    //             className="form__input"
    //             value={formData.password}
    //             onChange={handleInputChange}
    //             placeholder=" "
    //             required
    //           />
    //           <label htmlFor="password" className="form__label">
    //             Password
    //           </label>
    //           <span className="eye-icon" onClick={togglePasswordVisibility}>
    //             {passwordVisible ? <AiFillEyeInvisible /> : <AiFillEye />}
    //           </span>
    //         </div>
    //       </div>

    //       <a href="#" className="form__forgot">
    //         Forgot Password?
    //       </a>

    //       <input type="submit" className="form__button" value="Sign In" />
    //     </form>
    //   </div>
    // </div>
    <div className="l-form">
  <div className="shape2"></div>
  <div className="shape1"></div>


  <div className="form">
    <div className="circle"></div>
    <img src={logo} alt="Quadface Logo" className="logo1" />
    <h2 style={{ textAlign:"center",marginRight:"-70%" ,color:'var(--deep-blue)',fontSize:"36px"}}>Leave Management System</h2><br/><br/>

    <img src={authImage} alt="Authentication" className="form__img" />

    <form onSubmit={handleSubmit} className="form__content">
      <div>
        <h2 className="welcome-text">Welcome</h2>
        <br />
      </div>

      <div className="form__div form__div-one">
        <div className="form__icon">
          <i className="bx bx-user-circle"></i>
        </div>

        <div className="form__div-input">
          <input
            type="email"
            id="email"
            name="email"
            className="form__input"
            value={formData.email}
            onChange={handleInputChange}
            placeholder=" "
            required
          />
          <label htmlFor="email" className="form__label">Email</label>
        </div>
      </div>

      <div className="form__div">
        <div className="form__icon">
          <i className="bx bx-lock"></i>
        </div>

        <div className="form__div-input">
          <input
            type={passwordVisible ? "text" : "password"}
            id="password"
            name="password"
            className="form__input"
            value={formData.password}
            onChange={handleInputChange}
            placeholder=" "
            required
          />
          <label htmlFor="password" className="form__label">Password</label>
          <span className="eye-icon" onClick={togglePasswordVisibility}>
            {passwordVisible ? <AiFillEyeInvisible /> : <AiFillEye />}
          </span>
        </div>
      </div>

      {/* <a href="#" className="form__forgot">Forgot Password?</a> */}
      <input type="submit" className="form__button" value="Sign In" />
    </form>
  </div>
</div>

  );
};

export default LoginForm;
