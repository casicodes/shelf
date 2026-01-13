// Background service worker for Shelf extension
// Handles OAuth token capture and context menu actions

const SHELF_URL = "http://localhost:3000";
const API_URL = `${SHELF_URL}/api/bookmarks`;
const AUTH_CALLBACK_URL = `${SHELF_URL}/auth/extension-callback`;

// =============================================================================
// Context Menu Setup
// =============================================================================

chrome.runtime.onInstalled.addListener(() => {
  // Save current page
  chrome.contextMenus.create({
    id: "save-page",
    title: "Add to Shelf",
    contexts: ["page"],
  });

  // Save selected text as snippet
  chrome.contextMenus.create({
    id: "save-selection",
    title: "Add to Shelf",
    contexts: ["selection"],
  });

  // Save link
  chrome.contextMenus.create({
    id: "save-link",
    title: "Add to Shelf",
    contexts: ["link"],
  });
});

// Handle extension icon click
chrome.action.onClicked.addListener(async (tab) => {
  if (tab.url) {
    pendingSave = { url: tab.url, notes: null, tabId: tab.id };
    await injectOverlay(tab.id);
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  let url = null;
  let notes = null;

  if (info.menuItemId === "save-page") {
    url = tab.url;
  } else if (info.menuItemId === "save-selection") {
    url = tab.url;
    notes = info.selectionText;
  } else if (info.menuItemId === "save-link") {
    url = info.linkUrl;
  }

  if (url) {
    // Store pending save for after overlay is ready
    pendingSave = { url, notes, tabId: tab.id };
    await injectOverlay(tab.id);
  }
});

// Pending save data
let pendingSave = null;

// Get token
async function getToken() {
  const result = await chrome.storage.local.get(["shelf_token"]);
  return result.shelf_token || null;
}

// Save bookmark via API
async function saveBookmark(url, notes, tabId) {
  const token = await getToken();
  if (!token) {
    console.log("Shelf: No token");
    chrome.tabs.sendMessage(tabId, {
      type: "SHELF_SAVE_RESULT",
      status: "auth",
    });
    return;
  }

  try {
    const body = { url };
    if (notes) body.notes = notes;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    let status = "saved";

    if (!response.ok) {
      if (
        data.error?.toLowerCase().includes("duplicate") ||
        data.error?.toLowerCase().includes("already exists") ||
        data.error?.toLowerCase().includes("unique")
      ) {
        status = "duplicate";
      } else {
        status = "error";
      }
    }

    // Send result to content script
    chrome.tabs.sendMessage(tabId, { type: "SHELF_SAVE_RESULT", status });
  } catch (error) {
    console.error("Shelf: Save error", error);
    chrome.tabs.sendMessage(tabId, {
      type: "SHELF_SAVE_RESULT",
      status: "error",
    });
  }
}

// Listen for overlay ready message
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === "SHELF_OVERLAY_READY" && pendingSave) {
    const { url, notes, tabId } = pendingSave;
    pendingSave = null;
    saveBookmark(url, notes, tabId);
  }
  return true;
});

// Inject overlay content script into the current tab
async function injectOverlay(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
  } catch (error) {
    console.error("Shelf: Injection failed", error);
    // If injection fails (e.g., chrome:// pages), fall back to popup window
    if (pendingSave) {
      await chrome.storage.local.set({
        shelf_pending_save: { url: pendingSave.url, notes: pendingSave.notes },
      });
      pendingSave = null;
    }
    const currentWindow = await chrome.windows.getCurrent();
    chrome.windows.create({
      url: chrome.runtime.getURL("popup.html"),
      type: "popup",
      width: 360,
      height: 80,
      left: currentWindow.left + currentWindow.width - 380,
      top: currentWindow.top + 80,
    });
  }
}

// =============================================================================
// Auth Token Capture
// =============================================================================

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SHELF_AUTH_TOKEN" && message.token) {
    // Store the token
    chrome.storage.local.set({ shelf_token: message.token }, () => {
      console.log("Shelf: Token saved successfully");

      // Close the auth tab if it's the sender
      if (sender.tab?.id) {
        chrome.tabs.remove(sender.tab.id);
      }
    });
    sendResponse({ success: true });
  }
  return true;
});

// Inject content script into auth callback page to capture token
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === "complete" &&
    tab.url?.startsWith(AUTH_CALLBACK_URL)
  ) {
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: captureTokenFromPage,
    });
  }
});

// This function runs in the context of the auth callback page
function captureTokenFromPage() {
  // Listen for postMessage from the page
  window.addEventListener("message", (event) => {
    if (event.data?.type === "SHELF_AUTH_TOKEN" && event.data?.token) {
      // Send token to background script
      chrome.runtime.sendMessage({
        type: "SHELF_AUTH_TOKEN",
        token: event.data.token,
      });
    }
  });
}
