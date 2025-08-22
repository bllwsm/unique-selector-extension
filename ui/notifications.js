// Temporary messages, alerts, user notifications

function showTemporaryMessage(message, type = "info") {
  const messageEl = document.createElement('div');
  messageEl.textContent = message;
  
  const backgroundColor = COLORS.MESSAGE_TYPES[type] || COLORS.MESSAGE_TYPES.info;
  const styles = STYLES.TEMPORARY_MESSAGE + `background: ${backgroundColor};`;
  
  messageEl.style.cssText = styles;
  document.body.appendChild(messageEl);
  
  setTimeout(() => {
    safeRemoveElement(messageEl);
  }, TIMING.TEMPORARY_MESSAGE_DURATION);
}
