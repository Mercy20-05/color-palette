/**
 * Color Palette Generator
 * Supports: Random Hex Generation, Locked Swatches, WCAG Contrast Balancing, Clipboard API
 */

const SWATCH_COUNT = 5;
let swatches = []; // Array of { hex: string, locked: boolean }
let toastTimeout = null;

// DOM Elements
const paletteContainer = document.getElementById("palette-container");
const generateBtn = document.getElementById("generate-btn");
const toast = document.getElementById("toast");
const toastMessage = document.getElementById("toast-message");

/**
 * Generates a random 6-character hex color string.
 * @returns {string} e.g. "#4A90E2"
 */
function getRandomHex() {
  const characters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += characters[Math.floor(Math.random() * 16)];
  }
  return color;
}

/**
 * Calculates perceived relative luminance to determine optimal text color.
 * Uses the formula: Luminance = 0.299*R + 0.587*G + 0.114*B
 * @param {string} hex
 * @returns {boolean} true if color is light (use dark text), false if dark (use light text)
 */
function isLightColor(hex) {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55;
}

/**
 * Initializes the default set of swatch objects.
 */
function initSwatches() {
  swatches = Array.from({ length: SWATCH_COUNT }, () => ({
    hex: getRandomHex(),
    locked: false,
  }));
}

/**
 * Rerolls hex colors for all unlocked swatches and re-renders the UI.
 */
function generatePalette() {
  swatches = swatches.map((item) => {
    if (item.locked) return item;
    return { ...item, hex: getRandomHex() };
  });
  renderPalette();
}

/**
 * Toggles the lock status for a swatch at a given index.
 * @param {number} index
 */
function toggleLock(index) {
  swatches[index].locked = !swatches[index].locked;
  renderPalette();
}

/**
 * Copies hex code to the user's clipboard and triggers visual confirmation.
 * @param {string} hex
 */
async function copyToClipboard(hex) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(hex);
    } else {
      // Fallback for older browsers / insecure environments
      const tempInput = document.createElement("textarea");
      tempInput.value = hex;
      document.body.appendChild(tempInput);
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
    }
    showToast(`Copied ${hex} to clipboard!`);
  } catch (err) {
    showToast(`Failed to copy: ${err}`, true);
  }
}

/**
 * Displays an animated toast alert with dynamic messaging.
 * @param {string} msg
 */
function showToast(msg) {
  if (toastTimeout) clearTimeout(toastTimeout);
  toastMessage.textContent = msg;
  toast.classList.add("show");
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2200);
}

/**
 * Renders all swatches into the DOM with appropriate styles and listeners.
 */
function renderPalette() {
  paletteContainer.innerHTML = "";

  swatches.forEach((swatch, index) => {
    const isLight = isLightColor(swatch.hex);
    const contrastClass = isLight ? "text-dark" : "text-light";

    const swatchEl = document.createElement("section");
    swatchEl.className = `swatch ${contrastClass}`;
    swatchEl.style.backgroundColor = swatch.hex;
    swatchEl.setAttribute("aria-label", `Color ${swatch.hex}`);

    // Click on background copies color
    swatchEl.addEventListener("click", (e) => {
      // Avoid re-copying if the user clicks the lock button
      if (e.target.closest(".lock-btn")) return;
      copyToClipboard(swatch.hex);
    });

    swatchEl.innerHTML = `
      <div class="swatch-content">
        <button class="action-btn lock-btn ${swatch.locked ? "active" : ""}" 
                title="${swatch.locked ? "Unlock color" : "Lock color"}" 
                aria-label="${swatch.locked ? "Unlock color" : "Lock color"}">
          <i class="fa-solid ${swatch.locked ? "fa-lock" : "fa-lock-open"}"></i>
        </button>
        <span class="hex-code">${swatch.hex}</span>
        <span class="copy-instruction">Click to copy</span>
      </div>
    `;

    // Attach lock button handler
    const lockBtn = swatchEl.querySelector(".lock-btn");
    lockBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLock(index);
    });

    paletteContainer.appendChild(swatchEl);
  });
}

// Global Event Listeners
generateBtn.addEventListener("click", generatePalette);

// Spacebar shortcut to roll new palette
window.addEventListener("keydown", (e) => {
  if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
    e.preventDefault();
    generatePalette();
  }
});

// Initialization
initSwatches();
renderPalette();