// Config page UI and rendering

function render(config) {
  const container = document.getElementById('content');
  const keys = Object.keys(config || {});
  
  if (keys.length === 0) {
    container.innerHTML = '<div class="small">No config variables yet.</div>';
    return;
  }
  
  let html = '<table><tr><th>Key</th><th>Value</th><th>Delete</th></tr>';
  keys.forEach(k => {
    html += `<tr><td><input type="text" value="${k}" data-key="${k}" class="key" /></td>
             <td><input type="text" value="${config[k] || ''}" data-key="${k}" class="val" /></td>
             <td><button class="del" data-key="${k}">Delete</button></td></tr>`;
  });
  html += '</table>';
  container.innerHTML = html;
  
  // Attach delete handlers
  Array.from(document.getElementsByClassName('del')).forEach(b => {
    b.addEventListener('click', async (e) => {
      const k = e.target.dataset.key;
      const updatedConfig = await deleteConfigKey(k);
      if (updatedConfig) {
        render(updatedConfig);
      }
    });
  });
}

// Event listeners
document.getElementById('saveBtn').addEventListener('click', async () => {
  const configData = collectFormData();
  const success = await saveConfigData(configData);
  if (success) {
    render(configData);
  }
});

document.getElementById('addBtn').addEventListener('click', async () => {
  const k = prompt('New key name (e.g. RELEASE_NUMBER):');
  if (!k) return;
  
  const updatedConfig = await addConfigKey(k);
  if (updatedConfig) {
    render(updatedConfig);
  }
});

document.getElementById('closeBtn').addEventListener('click', () => window.close());

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  const config = await loadConfig();
  render(config);
});
