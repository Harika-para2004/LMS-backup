
import { useState } from "react";
import { Modal, Box, TextField, Button, Typography, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

const PasswordModal = ({ open, handleClose, formData, handleInputChange, errors, handleUpdatePassword, email }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="password-modal">
      <Box
        component="form"
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <Typography variant="h5" textAlign="center">
          Update Password
        </Typography>

        <TextField
          label="New Password"
          type={showPassword ? "text" : "password"}
          name="newPassword"
          value={formData.newPassword}
          onChange={handleInputChange}
          fullWidth
          error={Boolean(errors.newPassword)}
          helperText={errors.newPassword}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Confirm Password"
          type={showConfirmPassword ? "text" : "password"}
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          fullWidth
          error={Boolean(errors.confirmPassword)}
          helperText={errors.confirmPassword}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                  {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box display="flex" justifyContent="flex-end">
          <Button variant="outlined" onClick={handleClose} sx={{ mr: 2, color: "#313896", borderColor: "#313896" }}>
            Cancel
          </Button>
          <Button variant="contained" sx={{ color: "white", bgcolor: "#313896" }} onClick={() => handleUpdatePassword(email)}>
            Update
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default PasswordModal;
