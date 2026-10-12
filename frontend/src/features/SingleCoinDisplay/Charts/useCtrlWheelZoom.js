import { useEffect } from "react";

export default function useCtrlWheelZoom(chartContainerRef) {
  useEffect(() => {
    const chartContainer = chartContainerRef.current;
    if (!chartContainer) return undefined;

    const handleWheel = (event) => {
      if (!event.ctrlKey) {
        event.stopPropagation();
      }
    };

    chartContainer.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: true,
    });

    return () => {
      chartContainer.removeEventListener("wheel", handleWheel, true);
    };
  }, [chartContainerRef]);
}
