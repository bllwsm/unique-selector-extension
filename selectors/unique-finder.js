// Element uniqueness detection and CSS selector generation

function isEditableOrInteractiveField(el) {
  const tagName = el.tagName.toLowerCase();
  
  // Only truly editable fields should trigger text prompts
  // Input fields (but only text-type inputs), textareas, and contenteditable elements
  if (tagName === 'textarea') {
    return true;
  }
  
  if (tagName === 'input') {
    const inputType = el.type?.toLowerCase() || 'text';
    // Only text-type inputs should be considered editable for text prompts
    return ['text', 'email', 'password', 'search', 'tel', 'url', 'number', 'date', 'datetime-local', 'month', 'week', 'time'].includes(inputType);
  }
  
  if (tagName === 'select') {
    return true;
  }
  
  // Contenteditable elements
  if (el.hasAttribute('contenteditable') && el.getAttribute('contenteditable') !== 'false') {
    return true;
  }
  
  // Check if element is inside a contenteditable container (like ProseMirror editors)
  let parent = el.parentElement;
  while (parent) {
    if (parent.hasAttribute('contenteditable') && parent.getAttribute('contenteditable') !== 'false') {
      return true;
    }
    parent = parent.parentElement;
  }
  
  // Don't treat buttons, links, and other clickable elements as editable fields
  // They can still get text-based selectors but won't trigger automatic prompts
  return false;
}

function generateTextBasedSelector(searchText, elementType = '*', matchType = 'contains') {
  // Escape quotes in the search text
  const escapedText = searchText.replace(/"/g, '\\"');
  
  let findCode = '';
  
  switch (matchType) {
    case 'exact':
      findCode = `Array.from(document.querySelectorAll('${elementType}')).find(el => el.textContent.trim() === "${escapedText}")`;
      break;
    case 'contains':
      findCode = `Array.from(document.querySelectorAll('${elementType}')).find(el => el.textContent.includes("${escapedText}"))`;
      break;
    case 'startsWith':
      findCode = `Array.from(document.querySelectorAll('${elementType}')).find(el => el.textContent.trim().startsWith("${escapedText}"))`;
      break;
    case 'endsWith':
      findCode = `Array.from(document.querySelectorAll('${elementType}')).find(el => el.textContent.trim().endsWith("${escapedText}"))`;
      break;
    default:
      findCode = `Array.from(document.querySelectorAll('${elementType}')).find(el => el.textContent.includes("${escapedText}"))`;
  }
  
  return {
    type: 'text-based',
    code: `(${findCode})?.click();`,
    findCode: findCode, // Just the finding part, without .click()
    searchText: searchText,
    elementType: elementType,
    matchType: matchType,
    description: `Find ${elementType} containing "${searchText}"`
  };
}

function generateXPathTextSelector(searchText, elementType = '*', matchType = 'contains') {
  const escapedText = searchText.replace(/'/g, "\\'");
  
  let xpathExpression = '';
  
  switch (matchType) {
    case 'exact':
      xpathExpression = `//${elementType}[text()="${escapedText}"]`;
      break;
    case 'contains':
      xpathExpression = `//${elementType}[contains(text(), "${escapedText}")]`;
      break;
    case 'startsWith':
      xpathExpression = `//${elementType}[starts-with(text(), "${escapedText}")]`;
      break;
    default:
      xpathExpression = `//${elementType}[contains(text(), "${escapedText}")]`;
  }
  
  const selectorCode = `document.evaluate("${xpathExpression}", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue`;
  
  return {
    type: 'xpath-text',
    code: selectorCode,
    xpath: xpathExpression,
    searchText: searchText,
    elementType: elementType,
    matchType: matchType,
    description: `XPath: Find ${elementType} containing "${searchText}"`
  };
}

function findClickableParent(el) {
  // List of elements that are typically clickable
  const clickableElements = ['button', 'a', 'input', 'select', 'textarea'];
  
  let current = el;
  let depth = 0;
  const maxDepth = 3; // Don't go too far up
  
  while (current && current.nodeType === 1 && depth <= maxDepth) {
    const tagName = current.tagName.toLowerCase();
    
    // If we find a clickable parent, use that instead
    if (clickableElements.includes(tagName)) {
      return current;
    }
    
    // Also check for elements with click handlers or roles
    if (current.hasAttribute('onclick') || 
        current.hasAttribute('role') && ['button', 'link'].includes(current.getAttribute('role'))) {
      return current;
    }
    
    current = current.parentElement;
    depth++;
  }
  
  // If no clickable parent found, return original element
  return el;
}

function scoreAttribute(name, value) {
  const scores = {
    'data-testid': 100,
    'data-test': 95,
    'label': 92, // Button labels are very stable and human-readable
    'data-cy': 90, // Cypress
    'data-qa': 90,
    'data-automation': 85,
    'id': 85,
    'name': 80,
    'aria-label': 75,
    'title': 70,
    'alt': 65,
    'placeholder': 60,
    'role': 55
  };
  
  let score = scores[name] || (name.startsWith('data-') ? 50 : 30);
  
  // Bonus for short, meaningful values (prefer human-readable)
  if (value && value.length < 30 && /^[a-zA-Z0-9\s\-_]+$/.test(value)) {
    score += 10;
  }
  
  // Extra bonus for very short, simple values (like "Save", "Edit", "Delete")
  if (value && value.length <= 10 && /^[a-zA-Z\s]+$/.test(value)) {
    score += 15;
  }
  
  return score;
}

function tryTextContent(el) {
  // Only use text for interactive elements where text is meaningful and stable
  const interactiveElements = ['button', 'a', 'span', 'div'];
  if (!interactiveElements.includes(el.tagName.toLowerCase())) return null;
  
  const text = el.textContent?.trim();
  if (!text || text.length > 50) return null; // Avoid very long text
  
  // Avoid generic text that's likely to change or appear multiple times
  const genericTexts = ['click', 'submit', 'save', 'cancel', 'ok', 'yes', 'no', 'back', 'next', 'close'];
  if (genericTexts.includes(text.toLowerCase())) return null;
  
  // Check if text is unique enough
  const textSelector = `${el.tagName.toLowerCase()}:contains("${text}")`;
  // Since :contains is not standard CSS, let's use a different approach
  
  // Try with exact text content using XPath-like approach via attributes
  // For now, let's use a combination of tag and nearby stable attributes
  return null; // Skip text-based selectors for now due to :contains limitations
}

function tryBestAttributes(el) {
  const candidates = [];
  
  for (const attr of el.attributes) {
    if (attr.value && attr.value.trim()) {
      const score = scoreAttribute(attr.name, attr.value);
      candidates.push({ name: attr.name, value: attr.value.trim(), score });
    }
  }
  
  // Try attributes in order of score (highest first)
  candidates.sort((a, b) => b.score - a.score);
  
  for (const candidate of candidates.slice(0, 5)) { // Limit to top 5 to avoid performance issues
    const sel = `${el.tagName.toLowerCase()}[${candidate.name}="${CSS.escape(candidate.value)}"]`;
    if (validateSelector(sel, el)) return sel;
  }
  
  return null;
}

function generateUniqueSelector(el, options = {}) {
  try {
    if (!el || el.nodeType !== 1) return null;
    
    const { enableTextPrompt = true } = options; // Enable by default
    
    // First, check if we should target a clickable parent instead
    const targetElement = findClickableParent(el);
    
    // Check if this is an editable/interactive field and text prompting is enabled
    if (enableTextPrompt && isEditableOrInteractiveField(targetElement)) {
      const useTextSelector = confirm(
        '🎯 This is an interactive element!\n\n' +
        'Do you want to create a text-based selector instead?\n\n' +
        '✅ YES: Create selector based on visible text\n' +
        '❌ NO: Use normal attribute-based selector'
      );
      
      if (useTextSelector) {
        return showTextSelectorDialog(targetElement);
      }
    }
    
    // Otherwise, generate normal selector
    return generateNormalSelector(targetElement);
    
  } catch (e) {
    console.error("[UniqueSelector] Error generating selector:", e);
    return null;
  }
}

function showTextSelectorDialog(element) {
  const suggestions = generateTextSuggestions(element);
  const elementType = element.tagName.toLowerCase();
  
  // Create suggestions text for the prompt
  let suggestionsText = '';
  if (suggestions.length > 0) {
    suggestionsText = '\n\n📋 Available text options:\n';
    suggestions.forEach((suggestion, index) => {
      suggestionsText += `${index + 1}. ${suggestion.description}\n`;
    });
    suggestionsText += '\nYou can use any of these or enter custom text.';
  }
  
  const searchText = prompt(
    `🔍 Enter text to search for in ${elementType} elements:${suggestionsText}\n\n` +
    '💡 This will find elements containing your text.',
    suggestions[0]?.value || ''
  );
  
  if (!searchText) {
    // User cancelled, return normal selector
    return generateNormalSelector(element);
  }
  
  // Ask for match type
  const matchType = prompt(
    '🎯 How should the text match?\n\n' +
    '1. contains - Text appears anywhere (recommended)\n' +
    '2. exact - Text matches exactly\n' +
    '3. startsWith - Text appears at the beginning\n' +
    '4. endsWith - Text appears at the end\n\n' +
    'Enter: contains, exact, startsWith, or endsWith',
    'contains'
  );
  
  if (!matchType || !['contains', 'exact', 'startsWith', 'endsWith'].includes(matchType)) {
    // Invalid input, use default
    return generateTextBasedSelector(searchText, elementType, 'contains');
  }
  
  return generateTextBasedSelector(searchText, elementType, matchType);
}

function generateNormalSelector(targetElement) {
    // Strategy 1: Try ID selector
    if (targetElement.id) {
      const idSel = '#' + CSS.escape(targetElement.id);
      if (validateSelector(idSel, targetElement)) return idSel;
    }
    
    // Strategy 2: Try data attributes and high-priority attributes
    const highPriorityAttrs = tryBestAttributes(targetElement);
    if (highPriorityAttrs) return highPriorityAttrs;
    
    // Strategy 2.5: Try ARIA attributes for better semantic targeting
    const ariaAttributes = ['aria-label', 'aria-labelledby', 'role', 'aria-describedby', 'title', 'alt', 'placeholder'];
    for (const attr of ariaAttributes) {
      if (targetElement.hasAttribute(attr)) {
        const value = targetElement.getAttribute(attr);
        if (value && value.trim()) {
          const sel = `${targetElement.tagName.toLowerCase()}[${attr}="${CSS.escape(value)}"]`;
          if (validateSelector(sel, targetElement)) return sel;
        }
      }
    }
    
    // Strategy 3: Try name attribute for form elements
    if (targetElement.name) {
      const sel = `${targetElement.tagName.toLowerCase()}[name="${CSS.escape(targetElement.name)}"]`;
      if (validateSelector(sel, targetElement)) return sel;
    }
    
    // Strategy 4: Try text content for interactive elements (buttons, links)
    const textSelector = tryTextContent(targetElement);
    if (textSelector) return textSelector;
    
    // Strategy 5: Skip class-based selectors (unreliable in modern web apps)
    // Classes often change or are auto-generated in frameworks
    
    // Strategy 6: Build path with improved logic (no classes)
    const path = buildElementPath(targetElement);
    if (path && validateSelector(path, targetElement)) return path;
    
    // Strategy 6: Fallback to nth-child
    const parent = targetElement.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children);
      const index = siblings.indexOf(targetElement) + 1;
      const parentSelector = generateUniqueSelector(parent);
      if (parentSelector) {
        const sel = `${parentSelector} > ${targetElement.tagName.toLowerCase()}:nth-child(${index})`;
        if (validateSelector(sel, targetElement)) return sel;
      }
    }
    
    return null;
}

function generateTextSuggestions(element) {
  const suggestions = [];
  
  // Get text content
  const textContent = element.textContent?.trim();
  if (textContent && textContent.length > 0 && textContent.length <= 50) {
    suggestions.push({
      type: 'textContent',
      value: textContent,
      description: `Text: "${textContent}"`
    });
  }
  
  // Get placeholder text
  const placeholder = element.placeholder;
  if (placeholder) {
    suggestions.push({
      type: 'placeholder',
      value: placeholder,
      description: `Placeholder: "${placeholder}"`
    });
  }
  
  // Get value for input fields
  const value = element.value;
  if (value && value.length <= 50) {
    suggestions.push({
      type: 'value',
      value: value,
      description: `Value: "${value}"`
    });
  }
  
  // Get aria-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel) {
    suggestions.push({
      type: 'ariaLabel',
      value: ariaLabel,
      description: `ARIA Label: "${ariaLabel}"`
    });
  }
  
  // Get label text from associated label
  if (element.id) {
    const label = document.querySelector(`label[for="${element.id}"]`);
    if (label && label.textContent) {
      suggestions.push({
        type: 'labelText',
        value: label.textContent.trim(),
        description: `Label: "${label.textContent.trim()}"`
      });
    }
  }
  
  return suggestions;
}

function buildElementPath(el, maxDepth = 8) {
  const path = [];
  let node = el;
  let depth = 0;
  
  while (node && node.nodeType === 1 && depth < maxDepth) {
    let selector = node.tagName.toLowerCase();
    
    // Prioritize semantic elements (these are stable)
    if (['main', 'nav', 'aside', 'header', 'footer', 'section', 'article'].includes(selector)) {
      path.unshift(selector);
      break; // Stop at semantic landmarks
    }
    
    // Add ID if available (most stable)
    if (node.id) {
      selector = `#${CSS.escape(node.id)}`;
      path.unshift(selector);
      break; // ID should be unique, stop here
    }
    
    // Add stable attributes instead of classes
    let attributeFound = false;
    const stableAttrs = ['label', 'data-testid', 'data-test', 'data-qa', 'role', 'name', 'aria-label'];
    for (const attr of stableAttrs) {
      if (node.hasAttribute(attr)) {
        const value = node.getAttribute(attr);
        if (value && value.trim()) {
          selector = `${selector}[${attr}="${CSS.escape(value.trim())}"]`;
          attributeFound = true;
          break;
        }
      }
    }
    
    // If no stable attributes, just use tag name
    path.unshift(selector);
    node = node.parentElement;
    depth++;
    
    // If we found a stable attribute, we can be more confident
    if (attributeFound && path.length >= 2) {
      break;
    }
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

// Main API functions for the Chrome extension
window.SelectorGenerator = {
  // Generate selector with automatic prompting for interactive elements
  generate: (element, options = {}) => {
    const result = generateUniqueSelector(element, options);
    
    // If it's a text-based selector, show the user what was generated
    if (result && result.type === 'text-based') {
      console.log('📝 Generated text-based selector:', {
        description: result.description,
        code: result.code,
        searchText: result.searchText,
        matchType: result.matchType
      });
      
      // Show user a friendly message
      alert(
        '✅ Text-based selector created!\n\n' +
        `🎯 ${result.description}\n\n` +
        `📋 Selector code:\n${result.code}`
      );
    }
    
    return result;
  },
  
  // Generate text-based selector without prompting
  generateTextSelector: (searchText, elementType = '*', matchType = 'contains') => 
    generateTextBasedSelector(searchText, elementType, matchType),
  
  // Generate XPath text selector  
  generateXPathSelector: (searchText, elementType = '*', matchType = 'contains') =>
    generateXPathTextSelector(searchText, elementType, matchType),
  
  // Check if element supports text-based selection
  canUseTextSelection: (element) => isEditableOrInteractiveField(element),
  
  // Get text suggestions for an element
  getTextSuggestions: (element) => generateTextSuggestions(element),
  
  // Generate normal selector (no text prompting)
  generateNormal: (element) => generateNormalSelector(findClickableParent(element))
};
