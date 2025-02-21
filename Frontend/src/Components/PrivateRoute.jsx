import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children, allowedRoles }) => {
    const [role, setRole] = useState(null);
    const [admin, setAdmin] = useState(null);

    useEffect(() => {
        
        const storedUserData = localStorage.getItem("userData");
        const adminData = localStorage.getItem("admin");

        console.log(storedUserData)
        if (storedUserData || adminData) {
            try {
                const parsedUserData = JSON.parse(storedUserData);
                const parsedadmin = JSON.parse(adminData);

                const userRole = parsedUserData?.role ? String(parsedUserData.role).trim() : "";
                const admin = parsedadmin ? String(parsedadmin).trim() : "";

                setRole(userRole || "guest");

                setAdmin(admin || "");

            } catch (error) {
                console.error("Error parsing userData from localStorage:", error);
                setRole("guest");
            }
        } else {
            setRole("guest");
        }
    }, []);
    console.log("role :",role);

    // Show loading spinner
    if (role === null && admin == null) {
        return (
            <div style={styles.loaderContainer}>
                <style>
                    {`
                        @keyframes spin {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                        }
                    `}
                </style>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Checking access...</p>
            </div>
        );
    }

    if (!allowedRoles.some(r => r.toLowerCase() === role.toLowerCase()) && admin !== "admin@gmail.com") {
        return <Navigate to="/session-expired" replace />;
    }

    return children;
};

// Styles
const styles = {
    loaderContainer: {
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f8f9fa",
    },
    spinner: {
        width: "50px",
        height: "50px",
        border: "5px solid rgba(0, 0, 0, 0.1)",
        borderTop: "5px solid #007bff",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    },
    loadingText: {
        marginTop: "10px",
        fontSize: "18px",
        fontWeight: "bold",
        color: "#555",
    },
};

export default PrivateRoute;