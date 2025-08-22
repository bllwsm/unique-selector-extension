// Shared constants and configuration

const STYLES = {
  RECORDING_INDICATOR: `
    position: fixed;
    top: 10px;
    right: 10px;
    background: #ff4444;
    color: white;
    padding: 8px 12px;
    border-radius: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 12px;
    font-weight: bold;
    z-index: 999999;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    animation: pulse 2s infinite;
  `,
  
  TEMPORARY_MESSAGE: `
    position: fixed;
    top: 50px;
    right: 10px;
    color: white;
    padding: 10px 15px;
    border-radius: 5px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    z-index: 999998;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    max-width: 300px;
  `
};

const COLORS = {
  CLICK_FEEDBACK: "3px solid rgba(0,150,250,0.8)",
  INPUT_FEEDBACK: "0 0 0 3px rgba(50,200,100,0.4)",
  
  MESSAGE_TYPES: {
    error: "#ff4444",
    warning: "#ff8800", 
    info: "#4444ff"
  }
};

const KEYFRAMES = {
  PULSE: `
    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.7; }
      100% { opacity: 1; }
    }
  `
};

const Z_INDEX = {
  RECORDING_INDICATOR: 999999,
  TEMPORARY_MESSAGE: 999998
};

const TIMING = {
  VISUAL_FEEDBACK_DURATION: 1500,
  TEMPORARY_MESSAGE_DURATION: 3000
};
