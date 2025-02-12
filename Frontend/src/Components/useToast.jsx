import { useSnackbar } from "notistack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import InfoIcon from "@mui/icons-material/Info";

const useToast = () => {
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();

  const showToast = (message, variant = "default", options = {}) => {
    enqueueSnackbar(message, {
      variant,
      action: (key) => (
        <button
          onClick={() => closeSnackbar(key)}
          style={{
            background: "none",
            border: "none",
            color: "#fff",
            cursor: "pointer",
            fontSize: "16px",
            marginRight: "10px",
          }}
        >
          ✖
        </button>
      ), // ✅ Wrapped JSX inside an arrow function
      iconVariant: {
        success: <CheckCircleIcon style={{ color: "#4caf50" }} />,
        error: <ErrorIcon style={{ color: "#f44336" }} />,
        warning: <WarningAmberIcon style={{ color: "yellow" }} />,
        info: <InfoIcon style={{ color: "blue" }} />,
      },
      autoHideDuration: 2000,
      anchorOrigin: { vertical: "top", horizontal: "right" },
      style: {
        fontSize: "14px",
        padding: "5px 10px",
        borderRadius: "8px",
      },
      ...options,
    });
  };

  return showToast;
};

export default useToast;
