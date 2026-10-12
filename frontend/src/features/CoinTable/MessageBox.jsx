import {
  Box,
  Button,
  Typography,
  useColorScheme,
  useTheme,
} from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { motion } from "framer-motion";
import logo from "../../assets/logo_v2.png";

//This component is used for the the messages in the error pages
function MessageBox({
  type = null,
  title,
  subtitle = type === "initializing"
    ? "Pipeline is working"
    : type === "error"
      ? "Service unavailable"
      : null,
  children,
  buttonType = null,
  onClickFunc = null,
  sx,
}) {
  const { palette } = useTheme();
  const { mode } = useColorScheme();

  return (
    <Box
      component={motion.div}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
      }}
      sx={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        overflow: "hidden",
        textAlign: "center",
        "& > *:not(.message-watermark)": {
          position: "relative",
          zIndex: 1,
        },
        ...sx,
      }}
    >
      <Box
        className="message-watermark"
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: mode === "light" ? 0.075 : 0.065, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        component={motion.img}
        src={logo}
        alt=""
        aria-hidden="true"
        sx={{
          position: "absolute",
          inset: 0,
          margin: "auto",
          width: {
            xs: "min(88vw, 360px)",
            sm: "min(70vw, 520px)",
            lg: "620px",
          },
          height: "auto",
          opacity: mode === "light" ? 0.075 : 0.065,
          pointerEvents: "none",
          userSelect: "none",
        }}
      />
      <Typography
        variant="h1"
        sx={{
          fontSize: "5rem",
          color: mode === "light" ? palette.text.primary : palette.common.white,
        }}
        fontWeight="bold"
      >
        {title}
      </Typography>
      {subtitle ? (
        <Typography
          variant="h4"
          fontWeight="bold"
          sx={{ color: palette.error.main, mb: "24px" }}
        >
          {subtitle}
        </Typography>
      ) : null}
      <Typography
        variant="body1"
        sx={{
          color: mode === "light" ? palette.text.secondary : palette.grey[400],
        }}
      >
        {children}
      </Typography>
      <Button
        variant="contained"
        sx={{
          // border: `1px solid primary.${palette.primary.main}`,
          position: "relative",
          mt: "20px",
          pt: 0.65,
          pb: 0.65,
          color: palette.common.white,
        }}
        startIcon={buttonType === "refresh" ? <RefreshRoundedIcon /> : null}
        onClick={onClickFunc}
        disableElevation
        disableRipple
        disableFocusRipple
      >
        <Typography
          sx={{
            fontSize: "1.3rem",
            fontWeight: 500,
            color: "#fcfbfbf3",
          }}
        >
          {buttonType === "refresh" ? "TRY AGAIN" : null}
          {buttonType === "homepage" ? "Back to homepage" : null}
        </Typography>
      </Button>
    </Box>
  );
}

export default MessageBox;
