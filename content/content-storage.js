// Storage operations for saving snippets and data

async function saveSnippet(snippet) {
  try {
    const [snippetsResult, configResult] = await Promise.all([
      getStorageData("snippets"),
      getStorageData("config")
    ]);
    
    const snippets = Array.isArray(snippetsResult.snippets) ? snippetsResult.snippets : [];
    snippet.id = Date.now().toString() + Math.floor(Math.random() * 1000);
    snippet.timestamp = new Date().toISOString();
    snippets.push(snippet);
    
    await setStorageData({ snippets });
    console.log("[SnippetGenerator] Snippet saved:", snippet);
    
    // Handle config variable for input and type snippets
    if ((snippet.type === 'input' || snippet.type === 'type') && snippet.configKey && snippet.value !== undefined) {
      const config = configResult.config || {};
      if (!(snippet.configKey in config)) {
        config[snippet.configKey] = snippet.value;
        await setStorageData({ config });
        console.log("[SnippetGenerator] Config variable set:", snippet.configKey);
      }
    }
    
    return true;
  } catch (error) {
    console.error("[SnippetGenerator] Error saving snippet:", error);
    throw error;
  }
}
