import { Box, useColorScheme, useTheme } from "@mui/material";
import Chart from "react-apexcharts";
import { useRef } from "react";
import {
  formatCryptoPriceChart,
  formatIsoToYMD,
} from "../../../util/stringUtils";
import { reduceLongRangeData } from "../../../util/chartDataUtils";
import { activatePanMode } from "./activatePanMode";
import useCtrlWheelZoom from "./useCtrlWheelZoom";

export default function ApexVolumeLineChart({
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
        y: ohlcv.volume,
      }))
    : [];
  const data = ["1Y", "YTD"].includes(datePicker)
    ? reduceLongRangeData(rawData)
    : rawData;
  const firstVolume = data[0]?.y;
  const lastVolume = data.at(-1)?.y;
  const lineColor =
    lastVolume >= firstVolume ? palette.success.light : palette.error.light;

  const series = [{ name: "Volume", data }];

  const options = {
    chart: {
      type: "line",
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
    zoom: {
      enabled: true,
      type: "x",
      autoScaleYaxis: true,
      allowMouseWheelZoom: true,
      resetControls: { visible: false },
    },
    theme: { mode: mode === "dark" ? "dark" : "light" },
    colors: [lineColor],
    stroke: {
      curve: "straight",
      width: 2,
    },
    markers: {
      size: 0,
      hover: { size: 5 },
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
    tooltip: {
      enabled: true,
      style: {
        fontFamily: typography.fontFamily,
        fontSize: "0.95rem",
      },
      custom: ({ seriesIndex, dataPointIndex, w }) => {
        const point = w.config.series[seriesIndex]?.data[dataPointIndex];
        if (!point) return "";

        const textColor = palette.grey[200];

        return `
          <div style="display:flex; flex-direction:column; border-radius:7px; padding:10px 0; background:#121212; color:${textColor}; font-family:${typography.fontFamily}; font-size:0.95rem; line-height:1.5;">
            <div style="padding:0 12px; margin-bottom:6px; color:${textColor}; font-weight:500;">
              ${point.x}
            </div>
            <div style="width:100%; height:1px; background-color:${palette.grey[800]}"></div>
            <div style="margin:5px 12px;">Volume: <b>${formatCryptoPriceChart(point.y)}</b></div>
          </div>
        `;
      },
    },
  };

  return (
    <Box
      className="apex-volume-chart apex-volume-line-chart"
      ref={chartContainerRef}
      sx={{ width: "100%", height: "300px", ...sx }}
    >
      <Chart options={options} series={series} type="line" height={300} />
    </Box>
  );
}
