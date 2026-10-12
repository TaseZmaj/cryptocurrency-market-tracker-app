import {
  Box,
  Typography,
  useColorScheme,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import InfoIconTooltip from "./InfoIconTooltip.jsx";
import { formatDate } from "../../util/stringUtils.js";
import useCoins from "../../hooks/useCoins.js";
import { motion } from "framer-motion";

//The titles for the cards of the right side of the Single Coins Page
//use this - "OHLCℹ️", "Volumeℹ️", "Trend Indicatorsℹ️", "Bollinger Bandsℹ️",...
function CardTitle({
  formattedCoinData,
  includeDate = true,
  tooltipType = "",
  isDateRangeChanging = false,
  children,
}) {
  const { mode } = useColorScheme();
  const { palette } = useTheme();
  const { coinLoading, coinError } = useCoins();
  const isMobile = useMediaQuery("(max-width: 600px)"); // Adjust the breakpoint as needed

  return (
    <Box>
      <Typography
        variant="h5"
        sx={{
          color: mode === "light" ? palette.text.primary : palette.common.white,
        }}
      >
        {children}
        <InfoIconTooltip
          placement={isMobile ? "top" : "right"}
          type={tooltipType}
          sx={{ top: -1, left: "2px", verticalAlign: "middle" }}
        />
      </Typography>

      {includeDate &&
      formattedCoinData != undefined &&
      formattedCoinData.length > 0 &&
      !isDateRangeChanging &&
      !coinLoading &&
      !coinError ? (
        <Typography
          component={motion.div}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          sx={{
            color: mode === "light" ? palette.text.primary : palette.grey[500],
          }}
        >
          {formatDate(formattedCoinData.at(0)?.date)}&nbsp;–&nbsp;
          {formatDate(formattedCoinData.at(-1)?.date)}
        </Typography>
      ) : null}
    </Box>
  );
}

export default CardTitle;
