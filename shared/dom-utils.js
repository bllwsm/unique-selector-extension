// DOM manipulation utilities

function createStyledElement(tag, styles, textContent = '') {
  const element = document.createElement(tag);
  element.style.cssText = styles;
  if (textContent) element.textContent = textContent;
  return element;
}

function safeRemoveElement(element) {
  if (element && element.parentNode) {
    element.remove();
  }
}

function addTempStyle(element, property, value, duration = 1500) {
  const originalValue = element.style[property];
  element.style[property] = value;
  
  setTimeout(() => {
    element.style[property] = originalValue;
  }, duration);
}

function getElementById(id) {
  return document.getElementById(id);
}
