const BLOCKED_CTRL_SHIFT_KEYS = new Set(["i", "j", "c"]);

function isDevtoolsGuardEnabled(): boolean {
  const envValue = import.meta.env.VITE_DISABLE_DEVTOOLS_GUARD;
  return envValue !== "false";
}

export function setupBrowserHardening(): void {
  if (!import.meta.env.PROD || !isDevtoolsGuardEnabled()) {
    return;
  }

  document.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  document.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    const blockDevtoolsShortcut =
      key === "f12" ||
      (event.ctrlKey && event.shiftKey && BLOCKED_CTRL_SHIFT_KEYS.has(key)) ||
      (event.ctrlKey && key === "u");

    if (blockDevtoolsShortcut) {
      event.preventDefault();
    }
  });
}
