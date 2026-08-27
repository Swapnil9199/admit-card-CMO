/**
 * Client service to communicate with backend Email & SMTP endpoints
 */

async function parseJsonResponse(response) {
  try {
    const text = await response.text();
    if (!text || text.trim() === '') {
      return {
        success: response.ok,
        message: response.ok ? 'Operation completed successfully.' : `Server returned HTTP ${response.status}`
      };
    }
    try {
      return JSON.parse(text);
    } catch {
      return {
        success: response.ok,
        message: text
      };
    }
  } catch (err) {
    return {
      success: false,
      message: err.message || 'Failed to read response from server.'
    };
  }
}

// Send individual admit card PDF
export async function sendAdmitCardEmail({
  recipientEmail,
  recipientName,
  seatNo,
  examTitle,
  examCentre,
  pdfBase64,
  filename
}) {
  try {
    const response = await fetch('/api/send-admit-card-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        recipientEmail,
        recipientName,
        seatNo,
        examTitle,
        examCentre,
        pdfBase64,
        filename
      })
    });

    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Email service network error:", error);
    return {
      success: false,
      message: "Admit card generated successfully, but we could not send it to the email address. Please try again.",
      error: error.message || "Network error while sending email."
    };
  }
}

// Fetch active SMTP configuration from backend
export async function getSmtpConfig() {
  try {
    const response = await fetch('/api/get-smtp');
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error fetching SMTP config:", error);
    return { success: false, error: error.message };
  }
}

// Save Admin SMTP configuration
export async function saveSmtpConfig(config) {
  try {
    const response = await fetch('/api/save-smtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error saving SMTP config:", error);
    return { success: false, message: error.message };
  }
}

// Test SMTP connection with configured credentials
export async function testSmtpConnection(config) {
  try {
    const response = await fetch('/api/test-smtp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    return await parseJsonResponse(response);
  } catch (error) {
    console.error("Error testing SMTP connection:", error);
    return { success: false, message: error.message };
  }
}
