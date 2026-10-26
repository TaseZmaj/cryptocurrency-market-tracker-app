// ===========================================================================
//OLD OHLC CHART -  CURRENTLY NOT IN USE!!!
//OLD OHLC CHART -  CURRENTLY NOT IN USE!!!
//OLD OHLC CHART -  CURRENTLY NOT IN USE!!!
//OLD OHLC CHART -  CURRENTLY NOT IN USE!!!
//OLD OHLC CHART -  CURRENTLY NOT IN USE!!!
//OLD OHLC CHART -  CURRENTLY NOT IN USE!!!
// ===========================================================================

import React, { useEffect, useRef, useState } from "react";
import { createChart, CandlestickSeries } from "lightweight-charts";
import { useColorScheme, useTheme } from "@mui/material";
import {
  formatCryptoPriceChart,
  formatIsoToYMD,
} from "../../../util/stringUtils";

const OFFSET = {
  "1D": 1.73,
  "1W": 0.01,
  "1M": 1,
  "6M": 0,
  "1Y": 0,
  ALL: 0,
};

//====================== OHLCV Candlestick Chart ===========================
function CandlestickChart({ datePicker, formattedCoinOhlcvData, height }) {
  //======================== CHART REFS =================================
  //Since the charting library is not a React one, these
  //Refs are used for selecting an element in the DOM and
  //making it be the chart
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const seriesRef = useRef(null);
  //====================================================================

  const { palette } = useTheme();
  const { mode } = useColorScheme();

  //======================== MARQUEE ZOOM LOGIC =========================
  // Visual marquee selection box
  const [selection, setSelection] = useState({
    isVisible: false,
    x: 0,
    width: 0,
  });
  //=====================================================================

  // ================== FORMAT DATA (PURE, SAFE) ========================
  const dataToDisplay = React.useMemo(() => {
    if (!formattedCoinOhlcvData || formattedCoinOhlcvData.length === 0)
      return [];

    return formattedCoinOhlcvData.map((ohlcv) => ({
      open: ohlcv.open,
      high: ohlcv.high,
      low: ohlcv.low,
      close: ohlcv.close,
      time: formatIsoToYMD(ohlcv.date), // formats to YYYY-MM-DD (data must be in this format)
    }));
  }, [formattedCoinOhlcvData]);
  //=====================================================================

  // ============== 1️⃣ CREATE CHART ONCE (MOUNT ONLY) ===================
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const container = chartContainerRef.current;
    const chartHeight = Number(height);
    const chartWidth = Math.max(1, container.getBoundingClientRect().width);
    const chart = createChart(chartContainerRef.current, {
      width: chartWidth,
      height: chartHeight,
      layout: {
        background: { color: "transparent" },
        textColor: "rgba(0,0,0,0.6)",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: {
          color: mode === "light" ? palette.grey[200] : palette.grey[900],
        },
      },
      crosshair: { mode: 1 },
      rightPriceScale: {
        visible: true,
        scaleMargins: { bottom: 0.015 },
        borderColor: "rgba(0,0,0, 0.6)",
      },
      timeScale: {
        borderColor: "rgba(0,0,0, 0.6)",
        rightOffset: 5,
        barSpacing: 1,
        fixLeftEdge: false,
      },
      handleScroll: {
        vertTouchDrag: false,
        horzTouchDrag: false,
        mouseWheel: false,
        pressedMouseMove: false,
      },
      handleScale: {
        axisPressedMouseMove: false,
        mouseWheel: false,
        pinch: true,
      },
    });

    chartInstanceRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: palette.success.light,
      downColor: palette.error.light,
      borderVisible: false,
      wickColor: "#75888e",
      priceFormat: {
        type: "custom",
        formatter: formatCryptoPriceChart,
        precision: 8,
        minMove: 0.00000001,
      },
    });

    seriesRef.current = series;

    //Marquee zoom logic
    let isDragging = false;
    let startX = null;
    const Y_AXIS_WIDTH = 65;

    const getRelativeX = (clientX) =>
      clientX - chartContainerRef.current.getBoundingClientRect().left;

    const handleMouseDown = (e) => {
      if (!e.clientX) return;
      isDragging = true;
      startX = getRelativeX(e.clientX);

      setSelection({
        isVisible: true,
        x: startX,
        width: 0,
      });
    };

    const handleMouseMove = (e) => {
      if (!isDragging || !e.clientX || startX === null) return;

      const currentX = getRelativeX(e.clientX);
      const rightLimit = container.clientWidth - Y_AXIS_WIDTH;

      const clampedX = Math.min(currentX, rightLimit);
      const x = Math.min(startX, clampedX);
      const w = Math.abs(clampedX - startX);

      setSelection({ isVisible: true, x, width: w });
    };

    const handleMouseUp = (e) => {
      if (!isDragging || !e.clientX || startX === null) return;
      isDragging = false;

      const endX = getRelativeX(e.clientX);
      const rightLimit = container.clientWidth - Y_AXIS_WIDTH;
      const clampedEndX = Math.min(endX, rightLimit);

      if (Math.abs(startX - clampedEndX) > 5) {
        const logicalStart = chartInstanceRef.current
          .timeScale()
          .coordinateToLogical(startX);
        const logicalEnd = chartInstanceRef.current
          .timeScale()
          .coordinateToLogical(clampedEndX);

        const targetRange = {
          from: Math.min(logicalStart, logicalEnd),
          to: Math.max(logicalStart, logicalEnd),
        };

        const currentRange = chartInstanceRef.current
          .timeScale()
          .getVisibleLogicalRange();

        if (currentRange) {
          let startTime = null;
          const ANIMATION_DURATION = 500; // ms

          const animateZoom = (timestamp) => {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;

            const linearProgress = Math.min(1, elapsed / ANIMATION_DURATION);
            const easedProgress = 1 - Math.pow(1 - linearProgress, 3); // cubic ease-out

            const lerp = (start, end, progress) =>
              start + (end - start) * progress;

            const newRange = {
              from: lerp(currentRange.from, targetRange.from, easedProgress),
              to: lerp(currentRange.to, targetRange.to, easedProgress),
            };

            chartInstanceRef.current
              .timeScale()
              .setVisibleLogicalRange(newRange);

            if (linearProgress < 1) {
              requestAnimationFrame(animateZoom);
            }
          };

          requestAnimationFrame(animateZoom);
        }
      }

      setSelection({ isVisible: false, x: 0, width: 0 });
      startX = null;
    };

    container.addEventListener("mousedown", handleMouseDown);
    container.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    const resizeChart = () => {
      const nextWidth = Math.floor(container.getBoundingClientRect().width);
      if (nextWidth > 0) {
        chart.resize(nextWidth, chartHeight);
        if (seriesRef.current) {
          chart.timeScale().fitContent();
        }
      }
    };
    const resizeObserver = new ResizeObserver(resizeChart);
    window.addEventListener("resize", resizeChart);
    resizeObserver.observe(container);
    const initialResizeFrame = requestAnimationFrame(resizeChart);

    return () => {
      cancelAnimationFrame(initialResizeFrame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", resizeChart);
      chart.remove();
      container.removeEventListener("mousedown", handleMouseDown);
      container.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 🔒 DO NOT ADD DEPENDENCIES!

  // ======================= 2️⃣ UPDATE DATA ===================================
  useEffect(() => {
    if (!seriesRef.current || dataToDisplay.length === 0) return;

    seriesRef.current.setData(dataToDisplay);

    chartInstanceRef.current.timeScale().fitContent();
    chartInstanceRef.current.timeScale().applyOptions({
      rightOffset: OFFSET[datePicker],
    });

    // chartInstanceRef.current.timeScale().applyOptions({
    //   barSpacing: desiredSpacing,
    // });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataToDisplay]);
  //===========================================================================

  // ======================================================

  // ========================= 3️⃣ THEME CHANGE ================================
  //Since this is a .js library, theme doesn't qite work without this useEffect
  useEffect(() => {
    if (!chartInstanceRef.current) return;
    chartInstanceRef.current.applyOptions({
      grid: {
        vertLines: { visible: false },
        horzLines: {
          color: mode === "light" ? palette.grey[200] : palette.grey[900],
        },
      },
      layout: {
        textColor: mode === "light" ? "rgba(0,0,0,0.6)" : palette.grey[300],
      },
      rightPriceScale: {
        borderColor: mode === "light" ? "rgba(0,0,0,0.6)" : palette.grey[300],
      },
      timeScale: {
        borderColor: mode === "light" ? "rgba(0,0,0,0.6)" : palette.grey[300],
      },
    });
  }, [mode, palette]);
  // =======================================================================

  return (
    // The container MUST have position: relative for absolute child positioning
    <div
      ref={chartContainerRef}
      style={{
        position: "relative",
        width: "100%",
        height: `${height}px`,
        // display: "flex",
        // justifyContent: "center",
      }}
    >
      {/* Reset Zoom Button */}
      {/* <Button
        onClick={handleResetZoom}
        style={{
          position: "absolute",
          top: 10,
          left: 65,
          zIndex: 20, // Make sure it's above the chart and selection box
          padding: "4px 8px",
          fontSize: "12px",
          cursor: "pointer",
          // Optional styling based on your MUI theme (using inline styles for example)
          backgroundColor: palette.background.paper || "white",
          color: palette.text.primary || "#000",
          border: `1px solid ${palette.divider || "#ccc"}`,
          borderRadius: "4px",
          opacity: 0.8,
        }}
      >
        <Typography>Reset Zoom</Typography>
      </Button> */}
      {/* MARQUEE ZOOM BOX */}
      {selection.isVisible && (
        <div
          style={{
            position: "absolute",
            bottom: 26,
            left: selection.x,
            width: selection.width,
            height: "272px",
            backgroundColor: "rgba(52,152,219,0.2)",
            border: "1px dashed rgba(52,152,219,0.8)",
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}

export default CandlestickChart;
