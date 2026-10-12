import { Box, IconButton, useColorScheme, useTheme } from "@mui/material";
import GitHubIcon from "@mui/icons-material/GitHub";
import GitLabLogoLight from "../assets/gitlab-logo-700-rgb.svg";
import GitLabLogoDark from "../assets/gitlab-logo-600-rgb.svg";
import { footerHeight } from "../util/uiVars";

function Footer({ sx }) {
  const { palette } = useTheme();
  const { mode } = useColorScheme();

  return (
    <Box
      as="footer"
      sx={{
        boxSizing: "border-box",
        width: "100%",
        height: footerHeight,
        bgcolor:
          mode === "light" ? palette.common.white : palette.background.dark,
        color: mode === "light" ? palette.text.primary : palette.common.white,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        ...sx,
      }}
    >
      <a
        href="https://github.com/TaseZmaj/cryptocurreny-market-tracker-app"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 3,
        }}
      >
        <GitHubIcon
          sx={{
            width: 27,
            height: 27,
            color:
              mode === "light" ? palette.common.black : palette.common.white,
          }}
        />
      </a>
      {/* <a
        href="https://gitlab.finki.ukim.mk/users/233105/projects"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          marginTop: "3px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={mode === "light" ? GitLabLogoDark : GitLabLogoLight}
          alt={mode === "light" ? "Dark Gitlab logo" : "Light Gitlab logo"}
          width={40}
          height={40}
        />
      </a> */}
    </Box>
  );
}

export default Footer;
