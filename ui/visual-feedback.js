// Visual feedback - recording indicator, element outlining

let recordingIndicator = null;

function updateRecordingIndicator(isRecording) {
  if (isRecording && !recordingIndicator) {
    recordingIndicator = createStyledElement('div', STYLES.RECORDING_INDICATOR, '🔴 Recording');
    recordingIndicator.id = 'snippet-recording-indicator';
    
    // Add pulse animation
    const style = document.createElement('style');
    style.textContent = KEYFRAMES.PULSE;
    document.head.appendChild(style);
    document.body.appendChild(recordingIndicator);
  } else if (!isRecording && recordingIndicator) {
    safeRemoveElement(recordingIndicator);
    recordingIndicator = null;
  }
}

function showClickFeedback(element) {
  element.style.outline = COLORS.CLICK_FEEDBACK;
  element.style.outlineOffset = "2px";
  
  setTimeout(() => {
    element.style.outline = '';
    element.style.outlineOffset = '';
  }, TIMING.VISUAL_FEEDBACK_DURATION);
}

function showInputFeedback(element) {
  element.style.boxShadow = COLORS.INPUT_FEEDBACK;
  
  setTimeout(() => {
    element.style.boxShadow = '';
  }, TIMING.VISUAL_FEEDBACK_DURATION);
}
