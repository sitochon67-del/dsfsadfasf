import React from "react";
import { createRoot } from "react-dom/client";
// ROOT APP
import App from "./app/App";

import "./styles/app/app.scss";

const blockEvent = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

const lockPage = () => {
  try {
    document.body.innerHTML =
      '<div style="font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;background:#000;color:#fff;font-size:18px;">Acceso restringido</div>';
  } catch {
    window.location.href = "about:blank";
  }
};

const installInteractionGuards = () => {
  window.addEventListener("contextmenu", blockEvent, true);
  document.addEventListener("contextmenu", blockEvent, true);
  document.addEventListener("copy", blockEvent, true);
  document.addEventListener("cut", blockEvent, true);
  document.addEventListener("paste", blockEvent, true);
  document.addEventListener("selectstart", blockEvent, true);
  document.addEventListener("dragstart", blockEvent, true);

  window.addEventListener(
    "keydown",
    (event) => {
      const key = String(event.key || "").toLowerCase();
      const ctrlOrCmd = event.ctrlKey || event.metaKey;
      const shift = event.shiftKey;

      const blockedByKey =
        key === "f12" ||
        (ctrlOrCmd && shift && (key === "i" || key === "j" || key === "c")) ||
        (ctrlOrCmd && (key === "u" || key === "s" || key === "p" || key === "a"));

      if (blockedByKey) {
        event.preventDefault();
        event.stopPropagation();
      }
    },
    true,
  );

  // Detector heurístico de DevTools abierto (best-effort)
  window.setInterval(() => {
    const widthGap = window.outerWidth - window.innerWidth > 160;
    const heightGap = window.outerHeight - window.innerHeight > 160;
    if (widthGap || heightGap) {
      lockPage();
    }
  }, 700);
};

installInteractionGuards();

const root = createRoot(document.getElementById("root"));

root.render(
  <App />
);
