export function getLayoutHeight(layoutHeight, visualViewport) {
  // A pinch changes only the visual viewport. Do not reflow the page into it.
  const isPinchZoom = visualViewport && Math.abs(visualViewport.scale - 1) > 0.01;
  const height = !visualViewport || isPinchZoom
    ? layoutHeight
    : Math.min(layoutHeight, visualViewport.height);
  return Math.abs(height - layoutHeight) < 1 ? layoutHeight : height;
}

export function initViewportSizing() {
  let frame;
  const update = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const layoutHeight = document.documentElement.getBoundingClientRect().height || window.innerHeight;
      const height = getLayoutHeight(layoutHeight, window.visualViewport);
      document.documentElement.style.setProperty('--viewport-height', `${height}px`);
    });
  };
  window.addEventListener('resize', update);
  window.visualViewport?.addEventListener('resize', update);
  update();
}
