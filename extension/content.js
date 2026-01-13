// Content script to show save popup overlay
console.log("Shelf: Content script loaded");

(function () {
  const SHELF_URL = "http://localhost:3000";

  // Remove existing overlay if present
  const existing = document.getElementById("shelf-save-overlay");
  if (existing) existing.remove();
  const oldStyles = document.getElementById("shelf-save-styles");
  if (oldStyles) oldStyles.remove();

  // Create styles
  const styles = document.createElement("style");
  styles.id = "shelf-save-styles";
  styles.textContent = `
    #shelf-save-overlay {
      all: initial;
      position: fixed !important;
      top: 16px !important;
      right: 16px !important;
      z-index: 2147483647 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
    }

    #shelf-save-overlay .shelf-card {
      width: 280px;
      display: none !important;
      flex-direction: row !important;
      align-items: center !important;
      justify-content: space-between !important;
      padding: 16px 20px !important;
      background: white !important;
      border-radius: 12px !important;
     
      box-sizing: border-box !important;
      box-shadow: 0 1px 1px 0 rgba(38,38,43,.1),0 0 0 1px rgba(38,38,43,.04),0 2px 12px -4px rgba(38,38,43,.16) !important;
    }

    #shelf-save-overlay .shelf-card.active {
      display: flex !important;
    }

    #shelf-save-overlay .shelf-left {
      display: flex !important;
      flex-direction: row !important;
      align-items: center !important;
      gap: 10px !important;
    }

    #shelf-save-overlay .shelf-spinner {
      width: 20px !important;
      height: 20px !important;
      min-width: 20px !important;
      flex-shrink: 0 !important;
      border: 2px solid #e0e0e0 !important;
      border-top-color: #888 !important;
      border-radius: 50% !important;
      animation: shelf-spin 0.8s linear infinite !important;
      box-sizing: border-box !important;
    }

    @keyframes shelf-spin {
      to { transform: rotate(360deg); }
    }

    #shelf-save-overlay .shelf-icon {
      width: 20px !important;
      height: 20px !important;
      min-width: 20px !important;
      flex-shrink: 0 !important;
      background: #008236 !important;
      border-radius: 50% !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
    }

    #shelf-save-overlay .shelf-icon svg {
      width: 14px;
      height: 14px;
      color: white !important;
    }

    #shelf-save-overlay .shelf-text {
      font-size: 14px !important;
      font-weight: 500 !important;
      color: #1a1a1a !important;
      margin: 0 !important;
      padding: 0 !important;
      white-space: nowrap;
      line-height: 1.4 !important;
    }

    #shelf-save-overlay .shelf-link {
      font-size: 14px !important;
      color: #a3a3a3 !important;
      text-decoration: underline !important;
      margin-left: 4px;
    }

    #shelf-save-overlay .shelf-link:hover {
      color: #1a1a1a !important;
    }

    #shelf-save-overlay .shelf-btn {
      padding: 8px 16px !important;
      font-size: 13px !important;
      font-weight: 500 !important;
      background: #404040 !important;
      color: white !important;
      border: none !important;
      border-radius: 8px !important;
      cursor: pointer !important;
      white-space: nowrap !important;
    }

    #shelf-save-overlay .shelf-btn:hover {
      background: #2a2a2a !important;
    }
  `;
  document.head.appendChild(styles);

  // Create overlay
  const overlay = document.createElement("div");
  overlay.id = "shelf-save-overlay";
  overlay.innerHTML = `
    <div class="shelf-card active" id="shelf-saving">
      <div class="shelf-left">
        <div class="shelf-spinner"></div>
        <p class="shelf-text">Saving to Shelf...</p>
      </div>
    </div>
    <div class="shelf-card" id="shelf-saved">
      <div class="shelf-left">
        <div class="shelf-icon">
          <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <p class="shelf-text">Saved</p>
      </div>
      <a href="${SHELF_URL}" target="_blank" class="shelf-link">View in Shelf</a>
    </div>
    <div class="shelf-card" id="shelf-already-saved">
      <div class="shelf-left">
        <div class="shelf-icon">
          <svg fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <p class="shelf-text">Already saved</p>
      </div>
    </div>
    <div class="shelf-card" id="shelf-auth">
      <div class="shelf-left">
        <p class="shelf-text">Connect to save</p>
      </div>
      <button class="shelf-btn" id="shelf-connect-btn">Connect</button>
    </div>
  `;
  document.body.appendChild(overlay);

  console.log("Shelf: Overlay created");

  const AUTH_URL = `${SHELF_URL}/auth/extension-callback`;

  // Helper to show a card
  function showCard(id) {
    overlay
      .querySelectorAll(".shelf-card")
      .forEach((c) => c.classList.remove("active"));
    document.getElementById(id)?.classList.add("active");
  }

  // Helper to hide overlay with animation
  function hideOverlay(delay = 2500) {
    setTimeout(() => {
      overlay.style.opacity = "0";
      overlay.style.transform = "translateY(-10px)";
      overlay.style.transition = "all 0.2s ease-out";
      setTimeout(() => overlay.remove(), 200);
    }, delay);
  }

  // Connect button click
  document
    .getElementById("shelf-connect-btn")
    ?.addEventListener("click", () => {
      window.open(AUTH_URL, "_blank");
      hideOverlay(0);
    });

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message) => {
    console.log("Shelf: Received message", message);
    if (message.type === "SHELF_SAVE_RESULT") {
      if (message.status === "saved") {
        showCard("shelf-saved");
        hideOverlay();
      } else if (message.status === "duplicate") {
        showCard("shelf-already-saved");
        hideOverlay();
      } else if (message.status === "auth") {
        showCard("shelf-auth");
        // Don't auto-hide auth card
      } else {
        hideOverlay(0);
      }
    }
  });

  // Tell background we're ready
  chrome.runtime.sendMessage({ type: "SHELF_OVERLAY_READY" });
})();
