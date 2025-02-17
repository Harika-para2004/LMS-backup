import expiredImg from "../assets/img/logo.jpg";

const SessionExpired = () => (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
        <img src={expiredImg} alt="Session Expired" style={{ width: "300px" }} />
        <h2>Session Expired</h2>
        <p>Your session has expired. Please log in again.</p>
        <a href="/">Go to Login</a>
    </div>
);

export default SessionExpired;