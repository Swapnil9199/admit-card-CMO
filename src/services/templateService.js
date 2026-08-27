/**
 * Client service to synchronize Template & Customizer settings across multiple devices
 */

async function safeParseResponse(response, defaultErrorMessage) {
  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      return {
        success: false,
        message: `Backend server error (${response.status} ${response.statusText}).`
      };
    }
    return { success: true };
  }
  try {
    return JSON.parse(text);
  } catch (err) {
    return {
      success: false,
      message: `Server returned non-JSON response (${response.status}): ${text.slice(0, 150)}...`
    };
  }
}

// Fetch active template configuration from backend
export async function getTemplateConfig() {
  try {
    const response = await fetch('/api/template-config');
    return await safeParseResponse(response, "Failed to fetch template configuration.");
  } catch (error) {
    console.error("Error fetching template config:", error);
    return { success: false, error: error.message };
  }
}

// Save template configuration to backend for all devices to sync
export async function saveTemplateConfig(config) {
  try {
    const response = await fetch('/api/template-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    return await safeParseResponse(response, "Failed to save template configuration.");
  } catch (error) {
    console.error("Error saving template config:", error);
    return { success: false, message: error.message };
  }
}
