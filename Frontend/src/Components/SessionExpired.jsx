import expiredImg from "../assets/img/logo.jpg";
import { Card, CardContent, Typography, Button } from "@mui/material";

const SessionExpired = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "linear-gradient(135deg, #f3f4f6, #e0e7ff)",
    }}
  >
    <Card sx={{ p: 4, boxShadow: 3, maxWidth: 400, textAlign: "center", borderRadius: 3 }}>
      <CardContent>
        <img src={expiredImg} alt="Session Expired" style={{ width: "100px", marginBottom: "16px" }} />
        <Typography variant="h5" sx={{ fontWeight: "bold", color: "#333" }}>
          Session Expired
        </Typography>
        <Typography variant="body1" sx={{ mt: 1, color: "#666" }}>
          Your session has expired. Please log in again to continue.
        </Typography>
        <Button
          variant="contained"
          href="/"
          sx={{
            mt: 3,
            backgroundColor: "#6366F1",
            "&:hover": { backgroundColor: "#4F46E5" },
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: "bold",
            px: 3,
            py: 1.2,
          }}
        >
          Go to Login
        </Button>
      </CardContent>
    </Card>
  </div>
);

export default SessionExpired;
