export function activatePanMode(chartContext) {
  requestAnimationFrame(() => {
    chartContext?.el
      ?.querySelector(".apexcharts-pan-icon")
      ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}
