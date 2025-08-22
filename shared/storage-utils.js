// Chrome storage API helpers and utilities

// Promise-based wrapper for chrome.storage.local.get
function getStorageData(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result);
      }
    });
  });
}

// Promise-based wrapper for chrome.storage.local.set
function setStorageData(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// Specific getters for common data
async function getRecordingState() {
  try {
    const result = await getStorageData("recording");
    return !!result.recording;
  } catch (error) {
    console.error("[StorageUtils] Error getting recording state:", error);
    return false;
  }
}

async function getSnippets() {
  try {
    const result = await getStorageData("snippets");
    return Array.isArray(result.snippets) ? result.snippets : [];
  } catch (error) {
    console.error("[StorageUtils] Error getting snippets:", error);
    return [];
  }
}

async function getConfig() {
  try {
    const result = await getStorageData("config");
    return result.config || {};
  } catch (error) {
    console.error("[StorageUtils] Error getting config:", error);
    return {};
  }
}

// Specific setters for common operations
async function setRecordingState(recording) {
  try {
    await setStorageData({ recording });
    return true;
  } catch (error) {
    console.error("[StorageUtils] Error setting recording state:", error);
    return false;
  }
}

async function saveSnippets(snippets) {
  try {
    await setStorageData({ snippets });
    return true;
  } catch (error) {
    console.error("[StorageUtils] Error saving snippets:", error);
    return false;
  }
}

async function saveConfig(config) {
  try {
    await setStorageData({ config });
    return true;
  } catch (error) {
    console.error("[StorageUtils] Error saving config:", error);
    return false;
  }
}
