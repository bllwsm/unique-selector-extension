// Content script main entry point - state management and initialization

console.log("[SnippetGenerator] Content script loaded on:", window.location.href);

// Global state accessible to all content script modules
window.isRecording = false;

// Initialize recording state
chrome.storage.local.get("recording", (res) => {
  if (chrome.runtime.lastError) {
    console.error("[SnippetGenerator] Error getting recording state:", chrome.runtime.lastError);
    return;
  }
  
  window.isRecording = !!res.recording;
  console.log("[SnippetGenerator] Initial recording state:", window.isRecording);
  updateRecordingIndicator(window.isRecording);
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[SnippetGenerator] Received message:", message);
  
  if (message.type === 'SET_RECORDING') {
    window.isRecording = message.recording;
    console.log("[SnippetGenerator] Recording state updated to:", window.isRecording);
    updateRecordingIndicator(window.isRecording);
    sendResponse({success: true, recording: window.isRecording});
  }
  
  return true; // Keep the message channel open for async response
});

// Attach event listeners
document.addEventListener('click', handleClick, true);
document.addEventListener('blur', handleBlur, true);
