/**
 * Client service to communicate with backend MongoDB Attendance endpoints
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

// Fetch all attendance logs from the database
export async function getAttendance() {
  try {
    const response = await fetch('/api/attendance');
    return await safeParseResponse(response, "Failed to fetch attendance logs from database.");
  } catch (error) {
    console.error("Error fetching attendance logs:", error);
    return { success: false, error: error.message };
  }
}

// Save or update attendance log in MongoDB
export async function markAttendance({
  candidateId,
  name,
  seatNo,
  attendanceStatus,
  verifiedAt
}) {
  try {
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        candidateId,
        name,
        seatNo,
        attendanceStatus,
        verifiedAt
      })
    });
    return await safeParseResponse(response, "Failed to save attendance record.");
  } catch (error) {
    console.error("Error marking attendance:", error);
    return { success: false, message: error.message };
  }
}

// Reset all attendance logs in the database
export async function resetAttendance() {
  try {
    const response = await fetch('/api/attendance/reset', {
      method: 'POST'
    });
    return await safeParseResponse(response, "Failed to reset attendance in database.");
  } catch (error) {
    console.error("Error resetting attendance:", error);
    return { success: false, message: error.message };
  }
}
