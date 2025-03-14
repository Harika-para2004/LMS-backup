import { Modal, Box, TextField, Button, Typography } from "@mui/material";

const PasswordModal = ({ open, handleClose, formData, handleInputChange, errors, handleUpdatePassword, email }) => (
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
        type="password"
        name="newPassword"
        value={formData.newPassword}
        onChange={handleInputChange}
        fullWidth
        error={Boolean(errors.newPassword)}
        helperText={errors.newPassword}
      />

      <TextField
        label="Confirm Password"
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleInputChange}
        fullWidth
        error={Boolean(errors.confirmPassword)}
        helperText={errors.confirmPassword}
      />

      <Box display="flex" justifyContent="flex-end">
        <Button variant="outlined" onClick={handleClose} sx={{ mr: 2,color:"#313896",borderColor:"#313896" }}>
          Cancel
        </Button>
        <Button variant="contained" sx={{ color: "white", bgcolor: "#313896" }} onClick={() => handleUpdatePassword(email)}>
          Update
        </Button>
      </Box>
    </Box>
  </Modal>
);

export default PasswordModal;
