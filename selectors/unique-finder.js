// Element uniqueness detection and CSS selector generation

function generateUniqueSelector(el) {
  try {
    if (!el || el.nodeType !== 1) return null;
    
    // Strategy 1: Try ID selector
    if (el.id) {
      const idSel = '#' + CSS.escape(el.id);
      if (validateSelector(idSel, el)) return idSel;
    }
    
    // Strategy 2: Try data attributes
    for (const attr of el.attributes) {
      if (attr.name.startsWith('data-') && attr.value) {
        const sel = `${el.tagName.toLowerCase()}[${attr.name}="${CSS.escape(attr.value)}"]`;
        if (validateSelector(sel, el)) return sel;
      }
    }
    
    // Strategy 3: Try name attribute for form elements
    if (el.name) {
      const sel = `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`;
      if (validateSelector(sel, el)) return sel;
    }
    
    // Strategy 4: Try class combinations
    if (el.className && typeof el.className === 'string') {
      const classes = el.className.split(/\s+/).filter(c => c.length > 0);
      for (let i = 1; i <= Math.min(classes.length, 3); i++) {
        const classCombo = classes.slice(0, i).map(c => CSS.escape(c)).join('.');
        const sel = `${el.tagName.toLowerCase()}.${classCombo}`;
        if (validateSelector(sel, el)) return sel;
      }
    }
    
    // Strategy 5: Build path with improved logic
    const path = buildElementPath(el);
    if (path && validateSelector(path, el)) return path;
    
    // Strategy 6: Fallback to nth-child
    const parent = el.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(el) + 1;
      const parentSelector = generateUniqueSelector(parent);
      if (parentSelector) {
        const sel = `${parentSelector} > ${el.tagName.toLowerCase()}:nth-child(${index})`;
        if (validateSelector(sel, el)) return sel;
      }
    }
    
    return null;
  } catch (e) {
    console.error("[UniqueSelector] Error generating selector:", e);
    return null;
  }
}

function buildElementPath(el, maxDepth = 8) {
  const path = [];
  let node = el;
  let depth = 0;
  
  while (node && node.nodeType === 1 && depth < maxDepth) {
    let selector = node.tagName.toLowerCase();
    
    // Add class if available and not too common
    if (node.className && typeof node.className === 'string') {
      const classes = node.className.split(/\s+/).filter(c => c.length > 0);
      const uniqueClass = classes.find(c => {
        const testSel = `${selector}.${CSS.escape(c)}`;
        return document.querySelectorAll(testSel).length <= 5;
      });
      if (uniqueClass) {
        selector += '.' + CSS.escape(uniqueClass);
      }
    }
    
    path.unshift(selector);
    node = node.parentElement;
    depth++;
  }
  
  return path.join(' > ');
}

function validateSelector(selector, expectedElement) {
  try {
    const elements = document.querySelectorAll(selector);
    return elements.length === 1 && elements[0] === expectedElement;
  } catch (e) {
    return false;
  }
}
