import { Box, Button, Typography } from "@mui/material";
import { useTheme, useColorScheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo_v2.png";
import { motion } from "framer-motion";

function Home() {
  const { mode } = useColorScheme();
  const { palette } = useTheme();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        bgcolor:
          mode === "light" ? palette.common.white : palette.background.dark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <Box
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: mode === "light" ? 0.075 : 0.065, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        component={motion.img}
        src={logo}
        alt=""
        aria-hidden="true"
        sx={{
          position: "absolute",
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

      <Box
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        component={motion.div}
      >
        <Box
          sx={{ display: "flex", flexDirection: "row", position: "relative" }}
        >
          <Typography
            variant="h2"
            sx={{
              fontSize: { xs: "2.6rem", md: "3.5rem", lg: "4rem" },
              marginTop: "120px",
              color:
                mode === "light" ? palette.text.primary : palette.common.white,
            }}
          >
            Cryptocurrency Market Tracker
          </Typography>
        </Box>

        <Typography
          variant="body1"
          color={mode === "light" ? palette.grey[600] : palette.grey[400]}
          sx={{
            fontWeight: 100,
            mt: "6px",
            fontSize: { xs: "1.12rem", md: "1.2rem", lg: "1.3rem" },
            position: "relative",
          }}
        >
          Discover and Analyze the Top Cryptocurrencies at a glance.
        </Typography>

        <Button
          variant="contained"
          sx={{
            // border: `1px solid primary.${palette.primary.main}`,
            position: "relative",
            mt: 6,
            pt: 1.3,
            pb: 1.3,
            "&:hover": {},

            marginBottom: "120px",
          }}
          onClick={() => navigate("/coins")}
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
            Get Started
          </Typography>
        </Button>
      </Box>
    </Box>
  );
}

export default Home;
