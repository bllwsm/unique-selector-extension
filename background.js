// Background script for side panel functionality

// Open side panel when extension icon is clicked
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Set side panel behavior for all tabs
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Listen for storage changes and notify side panel
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.snippets) {
    // Broadcast to all extension contexts (including side panel)
    chrome.runtime.sendMessage({
      type: 'SNIPPETS_UPDATED',
      snippets: changes.snippets.newValue
    }).catch(() => {
      // Ignore errors if no listeners are active
    });
  }
});
