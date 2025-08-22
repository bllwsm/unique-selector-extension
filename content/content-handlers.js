// Event handlers for click, input, blur events

// Track elements that were handled by click to avoid duplicate blur handling
const processedElements = new WeakSet();

function handleClick(ev) {
  console.log("[SnippetGenerator] Click detected, recording state:", window.isRecording);
  
  try {
    if (ev.button !== 0) {
      console.log("[SnippetGenerator] Ignoring non-left click");
      return; // only left-click
    }
    
    const el = ev.target;
    
    // Check if this is an input field click (always handle, regardless of recording state)
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || 
        el.contentEditable === 'true' || el.hasAttribute('contenteditable')) {
      handleInputFieldClick(el, ev);
      return;
    }
    
    if (!window.isRecording) {
      console.log("[SnippetGenerator] Not recording, ignoring click");
      return; // use cached recording state
    }
    
    console.log("[SnippetGenerator] Processing click on:", ev.target);
    
    const selector = generateUniqueSelector(el);
    
    if (!selector) {
      console.warn("[SnippetGenerator] Could not generate unique selector for element:", el);
      showTemporaryMessage("Could not generate selector for this element", "warning");
      return;
    }
    
    console.log("[SnippetGenerator] Generated selector:", selector);
    
    const code = `document.querySelector("${selector}").click();`;
    const snippet = {
      type: 'click',
      selector,
      desc: `${el.tagName}${el.id ? '#' + el.id : ''}${el.className ? '.' + el.className.split(' ')[0] : ''}`,
      code
    };
    
    console.log("[SnippetGenerator] Click recorded:", snippet);
    
    // Visual feedback using modular function
    showClickFeedback(el);
    
    // Save snippet with error handling
    saveSnippet(snippet).catch(error => {
      console.error("[SnippetGenerator] Error saving click snippet:", error);
      showTemporaryMessage("Error saving snippet", "error");
    });
    
  } catch (e) {
    console.error("[SnippetGenerator] Error in handleClick:", e);
    showTemporaryMessage("Error recording click", "error");
  }
}

function handleInputFieldClick(el, ev) {
  try {
    // Prevent the default click behavior to show our prompt
    ev.preventDefault();
    ev.stopPropagation();
    
    const selector = generateUniqueSelector(el);
    if (!selector) {
      console.warn("[SnippetGenerator] Could not generate unique selector for input:", el);
      showTemporaryMessage("Could not generate selector for this input", "warning");
      return;
    }
    
    // Handle different types of editable elements
    const isContentEditable = el.contentEditable === 'true' || el.hasAttribute('contenteditable');
    const currentValue = isContentEditable ? 
      (el.textContent || el.innerText || '').trim() : 
      (el.value || '');
    
    let promptText, configKey, targetValue;
    
    if (currentValue.trim()) {
      // Field has content - ask what to replace it with
      targetValue = prompt(`This field contains: "${currentValue}"\\n\\nWhat would you like to replace it with?`, currentValue);
      if (targetValue === null) return; // User cancelled
      
      const fieldName = el.name || el.id || el.placeholder || el.getAttribute('data-placeholder') || 'field';
      configKey = prompt('Enter config key for this value (e.g. RELEASE_NUMBER):', 
        fieldName.replace(/[^\\w]/g, '_').toUpperCase());
      if (!configKey) return;
      
    } else {
      // Field is empty - ask what to enter
      const placeholderText = el.placeholder || el.getAttribute('data-placeholder') || '';
      const promptMessage = placeholderText ? 
        `This field is empty (placeholder: "${placeholderText}").\\n\\nWhat would you like to enter?` :
        'This field is empty.\\n\\nWhat would you like to enter?';
      
      targetValue = prompt(promptMessage, '');
      if (targetValue === null || targetValue === '') return; // User cancelled or entered nothing
      
      const fieldName = el.name || el.id || el.placeholder || el.getAttribute('data-placeholder') || 'field';
      configKey = prompt('Enter config key for this value (e.g. USERNAME):', 
        fieldName.replace(/[^\\w]/g, '_').toUpperCase());
      if (!configKey) return;
    }
    
    // Generate code that simulates proper user interaction for different element types
    let code;
    if (isContentEditable) {
      code = `// Simulate user typing in contenteditable field
const element = document.querySelector("${selector}");
if (element) {
  element.focus();
  element.textContent = '';
  element.textContent = CONFIG.${configKey};
  
  // Trigger proper events for contenteditable elements
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  element.blur();
}`;
    } else {
      code = `// Simulate user typing in form field
const element = document.querySelector("${selector}");
if (element) {
  element.focus();
  element.value = '';
  element.value = CONFIG.${configKey};
  
  // Trigger proper events that modern web apps expect
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.blur();
}`;
    }
    
    const elementType = isContentEditable ? 'contenteditable' : el.tagName.toLowerCase();
    const snippet = {
      type: 'input',
      selector,
      desc: `Fill ${elementType}: ${el.name || el.id || el.placeholder || el.getAttribute('data-placeholder') || selector}`,
      code,
      configKey,
      value: targetValue
    };
    
    console.log("[SnippetGenerator] Input field interaction recorded:", snippet);
    
    // Mark this element as processed to prevent blur handler duplication
    processedElements.add(el);
    
    // Visual feedback using modular function
    showInputFeedback(el);
    
    // Save snippet with error handling
    saveSnippet(snippet).catch(error => {
      console.error("[SnippetGenerator] Error saving input snippet:", error);
      showTemporaryMessage("Error saving input snippet", "error");
    });
    
  } catch (e) {
    console.error("[SnippetGenerator] Error in handleInputFieldClick:", e);
    showTemporaryMessage("Error processing input field", "error");
  }
}

function handleBlur(ev) {
  try {
    if (!window.isRecording) return; // use cached recording state
    
    const el = ev.target;
    if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
    
    // Skip if this element was already processed by click handler
    if (processedElements.has(el)) {
      console.log("[SnippetGenerator] Skipping blur handler - element already processed by click");
      return;
    }
    
    const value = el.value || '';
    if (!value.trim()) return; // don't record empty values
    
    const selector = generateUniqueSelector(el);
    if (!selector) {
      console.warn("[SnippetGenerator] Could not generate unique selector for input:", el);
      showTemporaryMessage("Could not generate selector for this input", "warning");
      return;
    }
    
    const base = (el.name || el.id || el.placeholder || 'value')
      .replace(/[^\\w]/g, '_')
      .toUpperCase()
      .substring(0, 20); // limit length
    const configKey = `${base}_${Date.now().toString().slice(-4)}`;
    
    const code = `document.querySelector("${selector}").value = CONFIG.${configKey};`;
    const snippet = {
      type: 'type',
      selector,
      desc: `Input: ${el.name || el.id || el.placeholder || selector}`,
      code,
      configKey,
      value
    };
    
    console.log("[SnippetGenerator] Type recorded:", selector, "ConfigKey:", configKey, "Value:", value);
    
    // Visual feedback using modular function
    showInputFeedback(el);
    
    // Save snippet with error handling
    saveSnippet(snippet).catch(error => {
      console.error("[SnippetGenerator] Error saving type snippet:", error);
      showTemporaryMessage("Error saving input snippet", "error");
    });
    
    // Clean up processed elements reference after a delay
    setTimeout(() => {
      processedElements.delete(el);
    }, 5000);
    
  } catch (e) {
    console.error("[SnippetGenerator] Error in handleBlur:", e);
    showTemporaryMessage("Error recording input", "error");
  }
}
