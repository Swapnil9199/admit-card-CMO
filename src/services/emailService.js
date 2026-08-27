/**
 * Client service to communicate with backend Email & SMTP endpoints
 */

async function safeParseResponse(response, defaultErrorMessage) {
  const text = await response.text();
  if (!text) {
    if (!response.ok) {
      return {
        success: false,
        message: `Backend server error (${response.status} ${response.statusText}). Please verify the backend server is running on port 5001.`
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

    return await safeParseResponse(response, "Failed to send admit card email.");
  } catch (error) {
    console.error("Email service network error:", error);
    return {
      success: false,
      message: "Admit card generated successfully, but we could not send it to the email address. Please check your backend connection.",
      error: error.message || "Network error while sending email."
    };
  }
}

// Fetch active SMTP configuration from backend
export async function getSmtpConfig() {
  try {
    const response = await fetch('/api/get-smtp');
    return await safeParseResponse(response, "Failed to fetch SMTP configuration.");
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
    return await safeParseResponse(response, "Failed to save SMTP configuration.");
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
    return await safeParseResponse(response, "Failed to test SMTP connection.");
  } catch (error) {
    console.error("Error testing SMTP connection:", error);
    return { success: false, message: error.message };
  }
}
