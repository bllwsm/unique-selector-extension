// Popup UI rendering and controls

// DOM element references
function el(id) { return document.getElementById(id); }
const startBtn = el('startBtn'), stopBtn = el('stopBtn'), snippetsList = el('snippetsList'),
      copyAll = el('copyAll'), clearAll = el('clearAll'),
      addNav = el('addNav'), saveConfigBtn = el('saveConfigBtn'), addConfigBtn = el('addConfigBtn'),
      configContent = el('configContent');

// Tab management
function switchTab(tabName) {
  // Update tab buttons
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  
  // Update tab content
  document.querySelectorAll('.tab-content').forEach(content => {
    content.classList.toggle('active', content.id === `${tabName}-tab`);
  });
  
  // Load config data when switching to config tab
  if (tabName === 'config') {
    loadAndRenderConfig();
  }
}

// Initialize tab switching
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    switchTab(btn.dataset.tab);
  });
});

function renderList(snippets) {
  snippetsList.innerHTML = '';
  if (!snippets || snippets.length === 0) {
    snippetsList.innerHTML = '<li class="small">No snippets recorded yet. Click "Start Recording" and interact with web pages.</li>';
    return;
  }
  
  snippets.slice().reverse().forEach((s) => {
    const li = document.createElement('li');
    li.className = 'snip';
    
    const timestamp = s.timestamp ? new Date(s.timestamp).toLocaleString() : '';
    const timestampHtml = timestamp ? `<div class="timestamp">${timestamp}</div>` : '';
    
    li.innerHTML = `
      <div class="snippet-header">
        <div class="small">${s.type.toUpperCase()}${s.desc ? (' - ' + s.desc) : ''}</div>
        ${timestampHtml}
      </div>
      <pre>${s.code}</pre>
    `;
    
    const del = document.createElement('button');
    del.className = 'delBtn';
    del.textContent = 'Delete';
    del.addEventListener('click', () => {
      deleteSnippet(s.id);
    });
    
    const copy = document.createElement('button');
    copy.className = 'copyBtn';
    copy.textContent = 'Copy';
    copy.addEventListener('click', () => {
      const format = document.getElementById('copyFormat')?.value || 'js';
      const textToCopy = format === 'steps' ? convertToStepFormat(s) : s.code;
      
      navigator.clipboard.writeText(textToCopy).then(() => {
        copy.textContent = 'Copied!';
        setTimeout(() => {
          copy.textContent = 'Copy';
        }, 1000);
      }).catch(err => {
        console.error('Error copying to clipboard:', err);
      });
    });
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.appendChild(copy);
    buttonContainer.appendChild(del);
    
    li.appendChild(buttonContainer);
    snippetsList.appendChild(li);
  });
}

async function setRecording(on) {
  console.log(`[SnippetGenerator] Setting recording to: ${on}`);
  
  const success = await setRecordingState(on);
  if (!success) {
    console.error('Error setting recording state');
    return;
  }
  
  console.log(`[SnippetGenerator] Storage updated, recording: ${on}`);
  
  // Control periodic refresh based on recording state
  if (on) {
    startPeriodicRefresh();
  } else {
    stopPeriodicRefresh();
  }
  
  startBtn.disabled = on;
  stopBtn.disabled = !on;
  
  // Update button text to show current state
  startBtn.textContent = on ? 'Recording...' : 'Start Recording';
  stopBtn.textContent = on ? 'Stop Recording' : 'Stopped';
  
  // Send message to all content scripts
  chrome.tabs.query({}, (tabs) => {
    console.log(`[SnippetGenerator] Found ${tabs.length} tabs`);
    
    tabs.forEach(tab => {
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://') && !tab.url.startsWith('moz-extension://')) {
        console.log(`[SnippetGenerator] Sending message to tab: ${tab.id} - ${tab.url}`);
        
        chrome.tabs.sendMessage(tab.id, {
          type: 'SET_RECORDING',
          recording: on
        }, (response) => {
          if (chrome.runtime.lastError) {
            console.log(`[SnippetGenerator] Could not send message to tab ${tab.id}: ${chrome.runtime.lastError.message}`);
          } else {
            console.log(`[SnippetGenerator] Message sent successfully to tab ${tab.id}:`, response);
          }
        });
      }
    });
  });
  
  console.log(`[SnippetGenerator] Recording ${on ? 'started' : 'stopped'}`);
}

// Event listeners
startBtn.addEventListener('click', () => {
  console.log('[SnippetGenerator] Start button clicked');
  setRecording(true);
});

stopBtn.addEventListener('click', () => {
  console.log('[SnippetGenerator] Stop button clicked');
  setRecording(false);
});

copyAll.addEventListener('click', copyAllSnippets);
clearAll.addEventListener('click', clearAllData);
addNav.addEventListener('click', addNavigationSnippet);
saveConfigBtn.addEventListener('click', saveConfigData);
addConfigBtn.addEventListener('click', addConfigVariable);

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('[SnippetGenerator] Popup loaded');
  
  try {
    // Reset recording state on popup load to prevent persistent recording
    await setRecordingState(false);
    
    // Ensure default storage keys exist
    const [snippets, config] = await Promise.all([getSnippets(), getConfig()]);
    
    if (!Array.isArray(snippets)) {
      await saveSnippets([]);
      console.log('[SnippetGenerator] Initialized snippets array');
    }
    
    if (typeof config !== 'object') {
      await saveConfig({});
      console.log('[SnippetGenerator] Initialized config object');
    }
    
    // Always start with recording off
    setRecording(false);
    loadAndRender();
    
    console.log('[SnippetGenerator] Popup initialization complete');
  } catch (error) {
    console.error('Error initializing popup:', error);
  }
});

// Listen for real-time updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SNIPPETS_UPDATED') {
    console.log('[SnippetGenerator] Received snippets update');
    loadAndRender(); // Refresh the UI
  }
});

// Periodic refresh as fallback (every 2 seconds when recording)
let refreshInterval;
function startPeriodicRefresh() {
  if (refreshInterval) return;
  refreshInterval = setInterval(async () => {
    const isRecording = await getRecordingState();
    if (isRecording) {
      loadAndRender();
    }
  }, 2000);
}

function stopPeriodicRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// Start periodic refresh on load
startPeriodicRefresh();

// Config management functions
async function loadAndRenderConfig() {
  try {
    const config = await getConfig();
    renderConfig(config);
  } catch (error) {
    console.error('Error loading config:', error);
  }
}

function renderConfig(config) {
  const keys = Object.keys(config || {});
  
  if (keys.length === 0) {
    configContent.innerHTML = '<div class="config-empty">No config variables yet. Click "Add Variable" to get started.</div>';
    return;
  }
  
  let html = '<table class="config-table"><tr><th>Key</th><th>Value</th><th>Delete</th></tr>';
  keys.forEach(key => {
    const value = config[key] || '';
    html += `<tr>
      <td><input type="text" value="${escapeHtml(key)}" data-key="${escapeHtml(key)}" class="config-key" /></td>
      <td><input type="text" value="${escapeHtml(value)}" data-key="${escapeHtml(key)}" class="config-val" /></td>
      <td><button class="delete-btn" data-key="${escapeHtml(key)}">Delete</button></td>
    </tr>`;
  });
  html += '</table>';
  configContent.innerHTML = html;
  
  // Attach delete handlers
  configContent.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const key = e.target.dataset.key;
      await deleteConfigKey(key);
    });
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function collectConfigFormData() {
  const keys = Array.from(configContent.querySelectorAll('.config-key'))
    .map(input => input.value.trim())
    .filter(Boolean);
  const vals = Array.from(configContent.querySelectorAll('.config-val'))
    .map(input => input.value);
  
  const obj = {};
  for (let i = 0; i < keys.length; i++) { 
    obj[keys[i]] = vals[i] || ''; 
  }
  return obj;
}

async function saveConfigData() {
  try {
    const configData = collectConfigFormData();
    await saveConfig(configData);
    
    // Show brief success feedback
    const originalText = saveConfigBtn.textContent;
    saveConfigBtn.textContent = 'Saved!';
    saveConfigBtn.style.background = '#28a745';
    setTimeout(() => {
      saveConfigBtn.textContent = originalText;
      saveConfigBtn.style.background = '';
    }, 1500);
    
    renderConfig(configData);
  } catch (error) {
    console.error('Error saving config:', error);
    alert('Error saving config');
  }
}

async function deleteConfigKey(key) {
  try {
    const config = await getConfig();
    delete config[key];
    await saveConfig(config);
    renderConfig(config);
  } catch (error) {
    console.error('Error deleting config key:', error);
  }
}

async function addConfigVariable() {
  const key = prompt('Enter variable name (e.g. MY_URL):');
  if (!key || !key.trim()) return;
  
  const trimmedKey = key.trim();
  
  try {
    const config = await getConfig();
    config[trimmedKey] = config[trimmedKey] || '';
    await saveConfig(config);
    renderConfig(config);
  } catch (error) {
    console.error('Error adding config variable:', error);
  }
}
