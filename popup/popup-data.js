// Popup data operations - load, save, delete snippets

// Helper functions for format conversion
function getElementName(snippet) {
  // Extract meaningful names from selectors
  if (snippet.selector && typeof snippet.selector === 'string') {
    if (snippet.selector.includes('[label=')) {
      const match = snippet.selector.match(/label="([^"]+)"/);
      return match ? match[1] : 'element';
    }
    if (snippet.selector.includes('[data-testid=')) {
      const match = snippet.selector.match(/data-testid="([^"]+)"/);
      return match ? match[1] : 'element';
    }
    if (snippet.selector.includes('button')) return 'button';
    if (snippet.selector.includes('input')) return 'input';
    if (snippet.selector.includes('textarea')) return 'textarea';
  }
  
  // Fallback to description or type
  return snippet.desc || snippet.type || 'element';
}

function toCamelCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(word => word.length > 0)
    .map((word, index) => 
      index === 0 ? word.toLowerCase() : 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function convertToStepFormat(snippet) {
  const elementName = getElementName(snippet);
  const camelCaseName = toCamelCase(elementName);
  
  switch(snippet.type) {
    case 'click':
      // Handle text-based selectors differently
      if (snippet.selector && typeof snippet.selector === 'object' && snippet.selector.type === 'text-based') {
        return `// Click ${elementName}
${snippet.code.replace('.click();', '')}
if (!foundElement) {
  throw new Error("Could not find ${elementName}");
}
foundElement.click();
await context.sleep(1000);`;
      } else {
        return `// Click ${elementName}
const ${camelCaseName} = document.querySelector('${snippet.selector}');
if (!${camelCaseName}) {
  throw new Error("Could not find ${elementName}");
}
${camelCaseName}.click();
await context.sleep(1000);`;
      }

    case 'input':
      return `// Fill ${elementName}
const ${camelCaseName} = document.querySelector('${snippet.selector}');
if (!${camelCaseName}) {
  throw new Error("Could not find ${elementName}");
}
${camelCaseName}.value = CONFIG.${snippet.configKey || 'VALUE'};
await context.sleep(500);`;

    case 'navigate':
      return `// Navigate to ${elementName}
window.location.href = CONFIG.${snippet.configKey || 'URL'};
await context.sleep(2000);`;

    default:
      return `// ${snippet.type} - ${elementName}
${snippet.code}
await context.sleep(1000);`;
  }
}

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
    const format = document.getElementById('copyFormat')?.value || 'js';
    
    let text;
    if (format === 'steps') {
      text = snippets.map(s => convertToStepFormat(s)).join('\n\n');
    } else {
      text = snippets.map(s => s.code).join('\n\n');
    }
    
    await navigator.clipboard.writeText(text);
    alert(`Copied all snippets in ${format === 'steps' ? 'Step Runner' : 'Raw JavaScript'} format to clipboard`);
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
