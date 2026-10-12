// ===========================================================================
//OLD VOLUME BAR CHART -  CURRENTLY NOT IN USE!!!
//OLD VOLUME BAR CHART -  CURRENTLY NOT IN USE!!!
//OLD VOLUME BAR CHART -  CURRENTLY NOT IN USE!!!
//OLD VOLUME BAR CHART -  CURRENTLY NOT IN USE!!!
//OLD VOLUME BAR CHART -  CURRENTLY NOT IN USE!!!
//OLD VOLUME BAR CHART -  CURRENTLY NOT IN USE!!!
// ===========================================================================

import { useMemo, useState } from "react";
import { BarChart } from "@mui/x-charts/BarChart";
import { Box, useColorScheme, useTheme } from "@mui/material";
import {
  formatCryptoPriceChart,
  formatIsoToYMD,
} from "../../../util/stringUtils";

export default function VolumeChart({ formattedCoinOhlcvData, sx = {} }) {
  //==================== MUI chart state ===========================
  const [tickPlacement] = useState("extremities");
  const [tickLabelPlacement] = useState("middle");
  // ===============================================================
  const { palette } = useTheme();
  const { mode } = useColorScheme();

  const upColor = palette.success.light;
  const downColor = palette.error.light;

  //   const dataToDisplay = formattedCoinOhlcvData;

  //   const isBullish = useCallback((dataPoint) => {
  //     return dataPoint.close > dataPoint.open;
  //   }, []);

  //   const getBarColor = React.useCallback(
  //     (dataPoint) => {
  //       return isBullish(dataPoint) ? upColor : downColor;
  //     },
  //     [isBullish, upColor, downColor]
  //   );

  const dataToDisplay = useMemo(() => {
    if (!Array.isArray(formattedCoinOhlcvData)) return [];
    if (!formattedCoinOhlcvData || formattedCoinOhlcvData.length === 0)
      return [];

    return formattedCoinOhlcvData.map((ohlcv) => {
      const isBullish = ohlcv.close > ohlcv.open;
      return {
        open: ohlcv.open,
        close: ohlcv.close,
        volume: ohlcv.volume,
        date: formatIsoToYMD(ohlcv.date),
        color: isBullish ? upColor : downColor,
      };
    });
  }, [formattedCoinOhlcvData, upColor, downColor]);

  //======================= BAR COLOR LOGIC ===========================
  const colorValues = useMemo(() => {
    if (!Array.isArray(formattedCoinOhlcvData)) return [];
    if (!formattedCoinOhlcvData || formattedCoinOhlcvData.length === 0)
      return [];

    const greens = formattedCoinOhlcvData
      .filter((ohlcv) => ohlcv.close > ohlcv.open)
      .map((ohlcv) => {
        return {
          date: formatIsoToYMD(ohlcv.date),
          color: upColor,
        };
      });

    const reds = formattedCoinOhlcvData
      .filter((ohlcv) => ohlcv.close <= ohlcv.open)
      .map((ohlcv) => {
        return {
          date: formatIsoToYMD(ohlcv.date),
          color: downColor,
        };
      });

    return [...greens, ...reds];
  }, [formattedCoinOhlcvData, downColor, upColor]);
  // =================================================================

  // ===================== CHART PROPERTIES ==========================
  const chartSetting = {
    yAxis: [
      {
        width: 70,
        position: "right",
        valueFormatter: formatCryptoPriceChart,
      },
    ],
    series: [
      {
        dataKey: "volume",
        valueFormatter: formatCryptoPriceChart,
        // label: "Total traded Volume",
      },
    ],
    height: 300,
    margin: { left: 0 },
  };
  // ===================================================================

  // if (datePicker === "1D") {
  //   return (
  //     <Typography sx={{ color: "black" }}>There isn't enough data </Typography>
  //   );
  // }

  return (
    <Box style={{ width: "100%", ...sx }}>
      <BarChart
        skipAnimation
        gridHorizontal={true}
        sx={{
          "& .MuiBarElement-root": {
            // transform:
            //   datePicker === "1D" && "scaleX(0.2305) translateX(-140px)",
            // transformOrigin: "center",
          },
          "& .MuiChartsAxis-root line": {
            stroke: mode === "light" ? "rgba(0,0,0,0.6)" : palette.grey[300],
          },
          "& .MuiChartsAxis-root text": {
            fill: mode === "light" ? "rgba(0,0,0,0.6)" : palette.grey[300],
          },
        }}
        dataset={dataToDisplay}
        xAxis={[
          {
            dataKey: "date",
            tickPlacement,
            tickLabelPlacement,
            scaleType: "band",
            disableTicks: true,
            colorMap: {
              type: "ordinal",
              values: colorValues.map((v) => v.date),
              colors: colorValues.map((v) => v.color),
            },
          },
        ]}
        getItemColor={(datum) => datum.color}
        {...chartSetting}
      />
    </Box>
  );
}
