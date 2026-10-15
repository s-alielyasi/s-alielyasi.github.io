"use strict";

const navigationLinks = Array.from(document.querySelectorAll(".st-push"));
const panels = Array.from(document.querySelectorAll(".st-panel"));
let updatePending = false;

function updateActiveLink() {
  updatePending = false;
  const readingLine = window.innerHeight * 0.4;
  let activePanel = panels[0];

  for (const panel of panels) {
    if (panel.getBoundingClientRect().top <= readingLine) {
      activePanel = panel;
    }
  }

  for (const link of navigationLinks) {
    if (link.hash === `#${activePanel.id}`) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

function scheduleUpdate() {
  if (!updatePending) {
    updatePending = true;
    window.requestAnimationFrame(updateActiveLink);
  }
}

window.addEventListener("scroll", scheduleUpdate, { passive: true });
window.addEventListener("resize", scheduleUpdate);
window.addEventListener("hashchange", scheduleUpdate);
window.addEventListener("pageshow", scheduleUpdate);
document.fonts.ready.then(scheduleUpdate);
updateActiveLink();
