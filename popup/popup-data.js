// Popup data operations - load, save, delete snippets

async function loadAndRender() {
  try {
    const snippets = await getSnippets();
    renderList(snippets);
  } catch (error) {
    console.error('Error loading snippets:', error);
  }
}

async function deleteSnippet(id) {
  try {
    const [snippets, config] = await Promise.all([getSnippets(), getConfig()]);
    
    const updatedSnippets = snippets.filter(s => s.id !== id);
    
    // Remove any config keys that are no longer referenced
    const usedKeys = new Set(updatedSnippets.flatMap(s => s.configKey ? [s.configKey] : []));
    const updatedConfig = { ...config };
    Object.keys(updatedConfig).forEach(k => { 
      if (!usedKeys.has(k)) delete updatedConfig[k]; 
    });
    
    await Promise.all([
      saveSnippets(updatedSnippets),
      saveConfig(updatedConfig)
    ]);
    
    loadAndRender();
  } catch (error) {
    console.error('Error deleting snippet:', error);
  }
}

async function copyAllSnippets() {
  try {
    const snippets = await getSnippets();
    const text = snippets.map(s => s.code).join("\\n\\n");
    
    await navigator.clipboard.writeText(text);
    alert('Copied all snippets to clipboard');
  } catch (error) {
    console.error('Error copying snippets:', error);
  }
}

async function clearAllData() {
  if (!confirm('Clear all snippets and config?')) return;
  
  try {
    await Promise.all([
      saveSnippets([]),
      saveConfig({})
    ]);
    loadAndRender();
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}

async function addNavigationSnippet() {
  const url = prompt('Enter URL to navigate to (can include placeholders like CONFIG.MY_URL):', 'https://');
  if (!url) return;
  
  const key = prompt('Enter config key to store this URL under (e.g. MY_URL):', 'MY_URL');
  if (!key) return;
  
  try {
    const [snippets, config] = await Promise.all([getSnippets(), getConfig()]);
    
    const updatedConfig = { ...config, [key]: url };
    const newSnippet = {
      id: Date.now().toString(),
      type: 'navigate',
      desc: url,
      code: `window.location.href = CONFIG.${key};`,
      configKey: key,
      timestamp: new Date().toISOString()
    };
    
    const updatedSnippets = [...snippets, newSnippet];
    
    await Promise.all([
      saveSnippets(updatedSnippets),
      saveConfig(updatedConfig)
    ]);
    
    loadAndRender();
  } catch (error) {
    console.error('Error adding navigation snippet:', error);
  }
}
