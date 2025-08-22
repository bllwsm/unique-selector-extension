// Config variable CRUD operations

async function loadConfig() {
  try {
    return await getConfig();
  } catch (error) {
    console.error('Error loading config:', error);
    return {};
  }
}

async function saveConfigData(configData) {
  try {
    await saveConfig(configData);
    alert('Saved');
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    alert('Error saving config');
    return false;
  }
}

async function deleteConfigKey(key) {
  try {
    const config = await getConfig();
    delete config[key];
    await saveConfig(config);
    return config;
  } catch (error) {
    console.error('Error deleting config key:', error);
    return null;
  }
}

async function addConfigKey(key) {
  try {
    const config = await getConfig();
    config[key] = config[key] || '';
    await saveConfig(config);
    return config;
  } catch (error) {
    console.error('Error adding config key:', error);
    return null;
  }
}

function collectFormData() {
  const keys = Array.from(document.getElementsByClassName('key'))
    .map(i => i.value.trim())
    .filter(Boolean);
  const vals = Array.from(document.getElementsByClassName('val'))
    .map(i => i.value);
  
  const obj = {};
  for (let i = 0; i < keys.length; i++) { 
    obj[keys[i]] = vals[i] || ''; 
  }
  return obj;
}
