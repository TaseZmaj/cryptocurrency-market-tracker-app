import { Box, useColorScheme, useTheme } from "@mui/material";
import Chart from "react-apexcharts";
import { useRef } from "react";
import {
  formatCryptoPriceChart,
  formatIsoToYMD,
} from "../../../util/stringUtils";
import { reduceLongRangeData } from "../../../util/chartDataUtils";
// import { activateZoomMode } from "./activateZoomMode";
import { activatePanMode } from "./activatePanMode";
import useCtrlWheelZoom from "./useCtrlWheelZoom";

export default function ApexCandlestickChart({
  datePicker,
  formattedCoinOhlcvData,
  sx = {},
}) {
  const { mode } = useColorScheme();
  const { palette, typography } = useTheme();
  const chartContainerRef = useRef(null);
  useCtrlWheelZoom(chartContainerRef);
  const hideDateLabels = ["1M", "6M", "1Y", "YTD"].includes(datePicker);
  const hideTicks = ["6M", "1Y", "YTD"].includes(datePicker);

  const rawData = Array.isArray(formattedCoinOhlcvData)
    ? formattedCoinOhlcvData.map((ohlcv) => ({
        x: formatIsoToYMD(ohlcv.date),
        y: [ohlcv.open, ohlcv.high, ohlcv.low, ohlcv.close],
      }))
    : [];
  const data = ["1Y", "YTD"].includes(datePicker)
    ? reduceLongRangeData(rawData)
    : rawData;

  const series = [
    {
      name: "OHLC",
      data,
    },
  ];

  const options = {
    chart: {
      type: "candlestick",
      height: 300,
      toolbar: {
        show: true,
        tools: {
          download: false,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      animations: { enabled: false },
      zoom: {
        enabled: true,
        type: "x",
        autoScaleYaxis: true,
        allowMouseWheelZoom: true,
      },
      background: "transparent",
      events: {
        mounted: (chartContext) => {
          activatePanMode(chartContext);
        },
      },
    },

    dataLabels: {
      enabled: false,
    },
    theme: { mode: mode === "dark" ? "dark" : "light" },
    plotOptions: {
      candlestick: {
        colors: {
          upward: palette.success.light,
          downward: palette.error.light,
        },
        wick: { useFillColor: true },
      },
    },
    grid: {
      borderColor: mode === "light" ? palette.grey[200] : palette.grey[900],
      xaxis: { lines: { show: false } },
    },
    xaxis: {
      type: "category",
      labels: {
        show: !hideDateLabels,
        style: {
          colors: mode === "light" ? "rgba(0,0,0,0.6)" : palette.grey[300],
          fontFamily: typography.fontFamily,
          fontSize: "0.75rem",
        },
      },
      axisBorder: {
        color: mode === "light" ? "rgba(0,0,0,0.6)" : palette.grey[300],
      },
      axisTicks: { show: !hideTicks },
    },
    yaxis: {
      opposite: true,
      labels: {
        style: {
          colors: mode === "light" ? "rgba(0,0,0,0.6)" : palette.grey[300],
        },
        formatter: formatCryptoPriceChart,
      },
      axisBorder: {
        show: true,
        color: mode === "light" ? "rgba(0,0,0,0.6)" : palette.grey[300],
      },
    },
    zoom: {
      enabled: true,
      type: "x",
      autoScaleYaxis: true,
      allowMouseWheelZoom: true,
      resetControls: { visible: false },
    },
    tooltip: {
      enabled: true,
      style: {
        fontFamily: typography.fontFamily,
        fontSize: "0.95rem",
      },
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const candle = w.config.series[seriesIndex]?.data[dataPointIndex];
        if (!candle) return "";

        const [open, high, low, close] = candle.y;
        const textColor = palette.grey[200];
        // const mutedColor =
        //   mode === "light" ? palette.grey[600] : palette.grey[400];
        // const backgroundColor = palette.background.dark;

        return `
          <div style="display:flex; flex-direction:column; border-radius:7px; padding: 10px 0px; background:#121212; color: ${textColor}; font-family: ${typography.fontFamily}; font-size: 0.95rem; line-height: 1.5;">
            <div style="padding:0px 12px; margin-bottom: 6px; color: ${textColor}; font-weight: 500;">
                ${candle.x}
            </div>
            <div style="width:100%; height:1px; background-color: ${palette.grey[800]}"></div>

            <div style="margin:4px 12px 5px 12px;">Open: <b>${formatCryptoPriceChart(open)}</b></div>
            <div style="margin:5px 12px;">High: <b>${formatCryptoPriceChart(high)}</b></div>
            <div style="margin:5px 12px;">Low: <b>${formatCryptoPriceChart(low)}</b></div>
            <div style="margin:5px 12px;">Close: <b>${formatCryptoPriceChart(close)}</b></div>
          </div>
        `;
      },
    },
  };

  return (
    <Box
      className="apex-candlestick-chart"
      ref={chartContainerRef}
      sx={{ width: "100%", height: "300px", ...sx }}
    >
      <Chart
        options={options}
        series={series}
        type="candlestick"
        height={300}
      />
    </Box>
  );
}
