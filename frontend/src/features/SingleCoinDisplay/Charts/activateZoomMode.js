export function activateZoomMode(chartContext) {
  const chartElement = chartContext?.el;
  if (!chartElement) return;

  let attempts = 0;
  const activate = () => {
    const zoomButton = chartElement.querySelector(
      ".apexcharts-zoom-icon, [title='Zoom']",
    );

    if (zoomButton && !zoomButton.classList.contains("active")) {
      zoomButton.click();
      return;
    }

    if (zoomButton) return;

    attempts += 1;
    if (attempts < 20) {
      requestAnimationFrame(activate);
    }
  };

  requestAnimationFrame(activate);
}
