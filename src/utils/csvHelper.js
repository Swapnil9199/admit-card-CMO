import Papa from 'papaparse';

// Comprehensive aliases for smart column detection
const NAME_ALIASES = [
  'candidate name', 'student name', 'full name', 'name', 'student', 'candidate',
  'applicant name', 'applicant', 'नाव', 'विद्यार्थ्याचे नाव', 'उमेदवाराचे नाव',
  'fullname', 'cname', 'first name', 'participant', 'attendee', 'person name'
];

const PHONE_ALIASES = [
  'mobile number', 'phone number', 'mobile', 'phone', 'contact', 'contact number',
  'whatsapp number', 'whatsapp', 'cell', 'telephone', 'मोबाईल नंबर', 'फोन नंबर',
  'मोबाईल', 'दूरध्वनी', 'mob', 'tel', 'cellphone', 'contact no', 'phone no',
  'mobile no', 'contact_no', 'phone_number', 'mobile_number'
];

const EMAIL_ALIASES = [
  'email', 'email address', 'gmail', 'mail', 'e-mail', 'ईमेल', 'ई-मेल',
  'student email', 'email id', 'emailid', 'gmail id', 'gmail address',
  'candidate email', 'user email', 'email_address', 'e_mail'
];

// Helper to check if string matches an email
export function isEmail(val) {
  if (!val || typeof val !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
}

// Helper to check if string looks like a phone number
export function isPhoneNumber(val) {
  if (!val) return false;
  const digits = String(val).replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

// Smart column detector from headers and sample rows
export function detectCsvColumns(headers = [], sampleRows = []) {
  const result = {
    nameColumn: '',
    phoneColumn: '',
    emailColumn: '',
    detectedMethod: 'auto'
  };

  const normalizedHeaders = headers.map(h => ({
    original: h,
    clean: String(h).trim().toLowerCase()
  }));

  // 1. Check by header name aliases
  for (const h of normalizedHeaders) {
    if (!result.nameColumn && NAME_ALIASES.includes(h.clean)) {
      result.nameColumn = h.original;
    }
    if (!result.phoneColumn && PHONE_ALIASES.includes(h.clean)) {
      result.phoneColumn = h.original;
    }
    if (!result.emailColumn && EMAIL_ALIASES.includes(h.clean)) {
      result.emailColumn = h.original;
    }
  }

  // Also check if any header contains the keyword
  for (const h of normalizedHeaders) {
    if (!result.nameColumn && NAME_ALIASES.some(alias => h.clean.includes(alias))) {
      result.nameColumn = h.original;
    }
    if (!result.phoneColumn && PHONE_ALIASES.some(alias => h.clean.includes(alias))) {
      result.phoneColumn = h.original;
    }
    if (!result.emailColumn && EMAIL_ALIASES.some(alias => h.clean.includes(alias))) {
      result.emailColumn = h.original;
    }
  }

  // 2. Content-based Value Sniffing (Fallback for any missing column)
  if ((!result.nameColumn || !result.phoneColumn || !result.emailColumn) && sampleRows.length > 0) {
    for (const h of headers) {
      if (h === result.nameColumn || h === result.phoneColumn || h === result.emailColumn) continue;

      let emailMatches = 0;
      let phoneMatches = 0;
      let textMatches = 0;
      const totalChecked = Math.min(sampleRows.length, 10);

      for (let i = 0; i < totalChecked; i++) {
        const val = sampleRows[i]?.[h];
        if (isEmail(val)) emailMatches++;
        else if (isPhoneNumber(val)) phoneMatches++;
        else if (val && String(val).trim().length > 1 && !/^\d+$/.test(String(val).trim())) textMatches++;
      }

      if (!result.emailColumn && emailMatches >= Math.ceil(totalChecked * 0.5)) {
        result.emailColumn = h;
      } else if (!result.phoneColumn && phoneMatches >= Math.ceil(totalChecked * 0.5)) {
        result.phoneColumn = h;
      } else if (!result.nameColumn && textMatches >= Math.ceil(totalChecked * 0.5)) {
        result.nameColumn = h;
      }
    }
  }

  // Final fallback: use 1st column for Name, 2nd for Phone, 3rd for Email if available
  if (!result.nameColumn && headers.length > 0) result.nameColumn = headers[0];
  if (!result.phoneColumn && headers.length > 1) result.phoneColumn = headers[1];
  if (!result.emailColumn && headers.length > 2) result.emailColumn = headers[2];

  return result;
}

// Clean phone number & extract last 7 digits for Seat Number
export function extractSeatNoFromPhone(phone, fallbackIndex = 1) {
  if (!phone) {
    return String(1250000 + fallbackIndex);
  }
  const cleanDigits = String(phone).replace(/\D/g, '');
  if (cleanDigits.length >= 7) {
    return cleanDigits.slice(-7);
  }
  if (cleanDigits.length > 0) {
    return cleanDigits.padStart(7, '0');
  }
  return String(1250000 + fallbackIndex);
}

// Format Name nicely (capitalize words)
export function formatCandidateName(name) {
  if (!name) return "Candidate";
  return String(name)
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Parse uploaded CSV in any format and extract Name, Phone, Email
export function parseAnyCsvFile(file, columnMapping = {}, adminExamTitle = "गट क - पूर्व परीक्षा 2026", adminExamCentre = "(11-12) - Ramanbaug, New English School, Pune") {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        try {
          const rawRows = results.data.filter(row => {
            const keys = Object.keys(row);
            return keys.some(k => row[k] && String(row[k]).trim().length > 0);
          });

          if (rawRows.length === 0) {
            resolve({ candidates: [], headers: [], detectedMapping: {} });
            return;
          }

          const headers = results.meta?.fields || Object.keys(rawRows[0] || {});
          const detected = detectCsvColumns(headers, rawRows);

          // Use provided mapping or fallback to auto-detected
          const nameKey = columnMapping.nameColumn || detected.nameColumn;
          const phoneKey = columnMapping.phoneColumn || detected.phoneColumn;
          const emailKey = columnMapping.emailColumn || detected.emailColumn;

          const parsedCandidates = rawRows.map((row, index) => {
            const rawName = row[nameKey] || `Candidate ${index + 1}`;
            const rawPhone = row[phoneKey] || "";
            const rawEmail = row[emailKey] || "";

            const cleanName = formatCandidateName(rawName);
            const cleanPhone = String(rawPhone).replace(/[^\d+]/g, '').trim();
            const cleanEmail = String(rawEmail).trim().toLowerCase();

            // Seat Number is automatically the last 7 digits of candidate's phone number
            const seatNo = extractSeatNoFromPhone(cleanPhone, index + 1);

            const uniqueId = `CM-${Date.now().toString().slice(-4)}${index + 1}`;
            const uniqueCode = `CM-MPSC-${seatNo}`;

            return {
              id: uniqueId,
              uniqueCode: uniqueCode,
              name: cleanName,
              phone: cleanPhone || "N/A",
              email: cleanEmail || "N/A",
              seatNo: seatNo,
              examTitle: adminExamTitle,
              examCentre: adminExamCentre,
              photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
              attendanceStatus: "Not Marked",
              verifiedAt: null
            };
          });

          resolve({
            candidates: parsedCandidates,
            headers,
            detectedMapping: detected,
            totalRows: rawRows.length
          });
        } catch (err) {
          reject(err);
        }
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// Download Sample 3-Column Template
export function downloadSampleCsvTemplate() {
  const sampleData = [
    {
      "Candidate Name": "Rushikesh Pawar",
      "Mobile Number": "9874996960",
      "Email Address": "rushikesh.pawar@example.com"
    },
    {
      "Candidate Name": "Priyanka Jadhav",
      "Mobile Number": "9198234112",
      "Email Address": "priyanka.jadhav@example.com"
    },
    {
      "Candidate Name": "Swapnil Shinde",
      "Mobile Number": "9891583477",
      "Email Address": "swapnil.shinde@example.com"
    },
    {
      "Candidate Name": "Vishu Sudrik",
      "Mobile Number": "9578124590",
      "Email Address": "sudrikvm@gmail.com"
    },
    {
      "Candidate Name": "Avi Yadav",
      "Mobile Number": "8879654321",
      "Email Address": "avishakaryadav96@gmail.com"
    }
  ];

  const csv = Papa.unparse(sampleData);
  downloadBlob(csv, "candidate_sample_template.csv", 'text/csv;charset=utf-8;');
}

// Export Full Candidate List
export function exportCandidatesToCsv(candidates, filename = "candidates_list.csv") {
  const dataToExport = candidates.map((c, index) => ({
    "Sr No": index + 1,
    "Candidate Name": c.name,
    "Mobile Number": c.phone,
    "Email": c.email,
    "Seat No": c.seatNo || "",
    "Exam Title": c.examTitle || "",
    "Exam Centre": c.examCentre || "",
    "Unique Code": c.uniqueCode,
    "Attendance Status": c.attendanceStatus || "Not Marked",
    "Verified At": c.verifiedAt || ""
  }));

  const csv = Papa.unparse(dataToExport);
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
}

// Export Attendance Report
export function exportAttendanceReport(candidates, filename = "attendance_report.csv") {
  const attendanceData = candidates.map((c, index) => ({
    "Sr No": index + 1,
    "Seat No": c.seatNo,
    "Candidate Name": c.name,
    "Mobile": c.phone,
    "Email": c.email,
    "Unique Code": c.uniqueCode,
    "Exam Title": c.examTitle || "",
    "Exam Centre": c.examCentre || "",
    "Status": c.attendanceStatus,
    "Timestamp": c.verifiedAt || "N/A"
  }));

  const csv = Papa.unparse(attendanceData);
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
}

function downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
