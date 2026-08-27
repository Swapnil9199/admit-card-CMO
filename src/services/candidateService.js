/**
 * Client service to communicate with backend MongoDB Candidate endpoints.
 * Mirrors the pattern of attendanceService.js.
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

/**
 * Fetch all candidates saved in MongoDB.
 * Returns { success, candidates[] } or { success: false, message }
 */
export async function getCandidates() {
  try {
    const response = await fetch('/api/candidates');
    return await safeParseResponse(response, 'Failed to fetch candidates from database.');
  } catch (error) {
    console.error('Error fetching candidates:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk upsert a list of candidates into MongoDB.
 * Deduplication is handled server-side by uniqueCode — importing the same CSV
 * multiple times will never create duplicate rows.
 * Returns { success, upsertedCount, message } or { success: false, message }
 */
export async function bulkUpsertCandidates(candidates) {
  try {
    const response = await fetch('/api/candidates/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ candidates })
    });
    return await safeParseResponse(response, 'Failed to save candidates to database.');
  } catch (error) {
    console.error('Error bulk upserting candidates:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Delete a single candidate from MongoDB by their app id.
 * Returns { success, message } or { success: false, message }
 */
export async function deleteCandidate(id) {
  try {
    const response = await fetch(`/api/candidates/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return await safeParseResponse(response, 'Failed to delete candidate from database.');
  } catch (error) {
    console.error('Error deleting candidate:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Delete ALL candidates from MongoDB (full reset).
 * Returns { success, message } or { success: false, message }
 */
export async function deleteAllCandidates() {
  try {
    const response = await fetch('/api/candidates', {
      method: 'DELETE'
    });
    return await safeParseResponse(response, 'Failed to delete all candidates from database.');
  } catch (error) {
    console.error('Error deleting all candidates:', error);
    return { success: false, message: error.message };
  }
}
