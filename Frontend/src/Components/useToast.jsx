import { useSnackbar } from "notistack";
import { motion } from "framer-motion";
import { SnackbarContent } from "@mui/material";
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

const useToast = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const showToast = (message, variant = "info", options = {}) => {
    enqueueSnackbar(message, {
      variant,
      persist: false,
      autoHideDuration: 3000,
      anchorOrigin: { vertical: "top", horizontal: "center" }, // Position at top center
      content: (key) => (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -10 }}
          transition={{ duration: 0.3 }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            padding: "12px 16px",
            borderRadius: "8px",
            borderLeft: `4px solid ${variantColors[variant]}`,
            background: "rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(10px)",
            color: "#333333",
            fontSize: "14px",
            fontWeight: 500,
            maxWidth: "340px",
            minWidth: "280px",
            boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            {iconVariant[variant]}
          </div>
          <span style={{ flex: 1 }}>{message}</span>
          <button
            onClick={() => closeSnackbar(key)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fff",
              cursor: "pointer",
              fontSize: "16px",
              padding: "4px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <CloseIcon style={{ fontSize: "20px", opacity: 0.7 }} />
          </button>
        </motion.div>
      ),
      ...options,
    });
  };

  return showToast;
};

// Icons (Properly Aligned)
const iconVariant = {
  success: <CheckCircleIcon style={{ color: "#4CAF50", fontSize: "24px" }} />,
  error: <ErrorIcon style={{ color: "#F44336", fontSize: "24px" }} />,
  warning: <WarningIcon style={{ color: "#FFC107", fontSize: "24px" }} />,
  info: <InfoIcon style={{ color: "#2196F3", fontSize: "24px" }} />,
};

// Border Colors
const variantColors = {
  success: "#4CAF50",
  error: "#F44336",
  warning: "#FFC107",
  info: "#2196F3",
};

export default useToast;
