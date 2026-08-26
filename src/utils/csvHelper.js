import Papa from 'papaparse';

// Comprehensive aliases for smart column detection
const NAME_ALIASES = [
  'candidate name', 'student name', 'full name', 'name', 'student', 'candidate',
  'applicant name', 'applicant', 'नाव', 'विद्यार्थ्याचे नाव', 'उमेदवाराचे नाव',
  'fullname', 'cname', 'first name', 'participant', 'attendee', 'person name',
  'name of student', 'name of candidate', 'student_name', 'candidate_name'
];

const PHONE_ALIASES = [
  'mobile number', 'phone number', 'mobile', 'phone', 'contact', 'contact number',
  'whatsapp number', 'whatsapp', 'cell', 'telephone', 'मोबाईल नंबर', 'फोन नंबर',
  'मोबाईल', 'दूरध्वनी', 'mob', 'tel', 'cellphone', 'contact no', 'phone no',
  'mobile no', 'contact_no', 'phone_number', 'mobile_number', 'mobile_no.',
  'phone_no.', 'contact_number', 'student phone', 'student mobile', 'contact no.'
];

const EMAIL_ALIASES = [
  'email', 'email address', 'gmail', 'mail', 'e-mail', 'ईमेल', 'ई-मेल',
  'student email', 'email id', 'emailid', 'gmail id', 'gmail address',
  'candidate email', 'user email', 'email_address', 'e_mail', 'email_id',
  'student_email', 'candidate_email', 'mail id', 'mail_id'
];

// Helper to check if string matches an email
export function isEmail(val) {
  if (!val) return false;
  const s = String(val).trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) || (s.includes('@') && (s.endsWith('.com') || s.endsWith('.in') || s.endsWith('.org') || s.endsWith('.net') || s.endsWith('.edu') || s.endsWith('.co')));
}

// Clean and extract valid email from any messy text string
export function extractEmail(val) {
  if (!val) return '';
  const s = String(val).trim().toLowerCase();
  const match = s.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : '';
}

// Helper to check if string looks like a phone number
export function isPhoneNumber(val) {
  if (!val) return false;
  const s = String(val).trim();
  // Check scientific notation e.g. 9.87654E+09
  if (/^[\d.]+[eE]\+\d+$/.test(s)) {
    const num = Number(s);
    return !isNaN(num) && num >= 1000000;
  }
  const digits = s.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15;
}

// Clean and extract phone number digits
export function cleanPhoneNumber(val) {
  if (!val) return '';
  const s = String(val).trim();

  // Handle scientific notation e.g. 9.07573E+09
  if (/^[\d.]+[eE]\+\d+$/.test(s)) {
    const num = Number(s);
    if (!isNaN(num)) {
      return String(Math.round(num));
    }
  }

  // Remove non-digits
  const digits = s.replace(/\D/g, '');
  // If starts with country code 91 and has 12 digits, keep standard 10 digits
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits.slice(2);
  }
  // If starts with leading 0 and has 11 digits, trim leading 0
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }

  return digits;
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

  // 1. Check by exact header name aliases
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

  // 2. Check if any header contains the keyword
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

  // 3. Content-based Value Sniffing across sample rows
  if ((!result.nameColumn || !result.phoneColumn || !result.emailColumn) && sampleRows.length > 0) {
    for (const h of headers) {
      if (h === result.nameColumn || h === result.phoneColumn || h === result.emailColumn) continue;

      let emailMatches = 0;
      let phoneMatches = 0;
      let textMatches = 0;
      const totalChecked = Math.min(sampleRows.length, 15);

      for (let i = 0; i < totalChecked; i++) {
        const val = sampleRows[i]?.[h];
        if (extractEmail(val)) emailMatches++;
        else if (isPhoneNumber(val)) phoneMatches++;
        else if (val && String(val).trim().length > 1 && !/^\d+$/.test(String(val).trim())) textMatches++;
      }

      if (!result.emailColumn && emailMatches >= Math.ceil(totalChecked * 0.3)) {
        result.emailColumn = h;
      } else if (!result.phoneColumn && phoneMatches >= Math.ceil(totalChecked * 0.3)) {
        result.phoneColumn = h;
      } else if (!result.nameColumn && textMatches >= Math.ceil(totalChecked * 0.3)) {
        result.nameColumn = h;
      }
    }
  }

  // Final fallback: assign positionally if not detected
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
  const str = String(name).trim();
  if (!str) return "Candidate";
  return str
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Parse uploaded CSV in ANY format with Per-Row Deep Sniffing for 100% reliable extraction
export function parseAnyCsvFile(
  file,
  columnMapping = {},
  adminExamTitle = "गट क - पूर्व परीक्षा 2026",
  adminExamCentre = "S.P. College (Sir Parashurambhau College), Tilak Road, Pune"
) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: (h) => h.trim(),
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

          // Active mapping keys
          const nameKey = columnMapping.nameColumn || detected.nameColumn;
          const phoneKey = columnMapping.phoneColumn || detected.phoneColumn;
          const emailKey = columnMapping.emailColumn || detected.emailColumn;

          const parsedCandidates = rawRows.map((row, index) => {
            // Row-level cell values
            const allEntries = Object.entries(row);

            // 1. Extract Phone (Primary mapped key -> alias match -> any cell with 10 digits)
            let rawPhone = row[nameKey === phoneKey ? '' : phoneKey];
            let cleanPhone = cleanPhoneNumber(rawPhone);

            if (!cleanPhone || cleanPhone.length < 7) {
              // Deep Sniff: check other cells in this specific row
              for (const [k, v] of allEntries) {
                const kLower = k.toLowerCase();
                if (PHONE_ALIASES.some(alias => kLower.includes(alias))) {
                  const candidatePhone = cleanPhoneNumber(v);
                  if (candidatePhone && candidatePhone.length >= 7) {
                    cleanPhone = candidatePhone;
                    break;
                  }
                }
              }
            }

            if (!cleanPhone || cleanPhone.length < 7) {
              // Universal Sniff: find any cell containing 10 digits
              for (const [, v] of allEntries) {
                const candidatePhone = cleanPhoneNumber(v);
                if (candidatePhone && candidatePhone.length >= 7 && candidatePhone.length <= 15) {
                  cleanPhone = candidatePhone;
                  break;
                }
              }
            }

            // 2. Extract Email (Primary mapped key -> alias match -> any cell with @)
            let rawEmail = row[nameKey === emailKey ? '' : emailKey];
            let cleanEmail = extractEmail(rawEmail);

            if (!cleanEmail) {
              // Deep Sniff: check other cells in this specific row
              for (const [k, v] of allEntries) {
                const kLower = k.toLowerCase();
                if (EMAIL_ALIASES.some(alias => kLower.includes(alias))) {
                  const candidateEmail = extractEmail(v);
                  if (candidateEmail) {
                    cleanEmail = candidateEmail;
                    break;
                  }
                }
              }
            }

            if (!cleanEmail) {
              // Universal Sniff: find any cell with @ and .
              for (const [, v] of allEntries) {
                const candidateEmail = extractEmail(v);
                if (candidateEmail) {
                  cleanEmail = candidateEmail;
                  break;
                }
              }
            }

            // 3. Extract Name (Primary mapped key -> alias match -> text cell)
            let rawName = row[nameKey];
            let cleanName = '';

            if (rawName && String(rawName).trim() && !isEmail(rawName) && !isPhoneNumber(rawName)) {
              cleanName = formatCandidateName(rawName);
            }

            if (!cleanName || cleanName.startsWith('Candidate ')) {
              // Deep Sniff: check alias cells in this row
              for (const [k, v] of allEntries) {
                const kLower = k.toLowerCase();
                if (NAME_ALIASES.some(alias => kLower.includes(alias))) {
                  if (v && String(v).trim() && !isEmail(v) && !isPhoneNumber(v)) {
                    cleanName = formatCandidateName(v);
                    break;
                  }
                }
              }
            }

            if (!cleanName) {
              // Universal Sniff: pick first text cell that is not phone/email/number
              for (const [, v] of allEntries) {
                const vStr = String(v).trim();
                if (vStr.length >= 2 && !isEmail(vStr) && !isPhoneNumber(vStr) && !/^\d+$/.test(vStr)) {
                  cleanName = formatCandidateName(vStr);
                  break;
                }
              }
            }

            if (!cleanName) {
              cleanName = `Candidate ${index + 1}`;
            }

            // 4. Seat Number is automatically the last 7 digits of candidate's phone number
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
    "Unique Verification Code": c.uniqueCode || "",
    "Exam Title": c.examTitle || "",
    "Exam Centre": c.examCentre || "",
    "Attendance Status": c.attendanceStatus || "Not Marked",
    "Attendance Timestamp": c.verifiedAt || ""
  }));

  const csv = Papa.unparse(dataToExport);
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
}

// Export Attendance Report
export function exportAttendanceReport(candidates, filename = "attendance_report.csv") {
  const dataToExport = candidates.map((c, index) => ({
    "Sr No": index + 1,
    "Candidate Name": c.name,
    "Seat Number": c.seatNo || "",
    "Mobile Number": c.phone || "",
    "Email Address": c.email || "",
    "Attendance Status": c.attendanceStatus || "Not Marked",
    "Verified Timestamp": c.verifiedAt || "N/A",
    "Examination Centre": c.examCentre || "",
    "Unique ID": c.uniqueCode || c.id || ""
  }));

  const csv = Papa.unparse(dataToExport);
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
}

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const pom = document.createElement('a');
  pom.href = url;
  pom.setAttribute('download', filename);
  pom.click();
  URL.revokeObjectURL(url);
}
