import Papa from 'papaparse';

// Export Candidate List to CSV
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

// Download 3-Column Sample CSV Template (Name, Phone, Email)
export function downloadSampleCsvTemplate() {
  const sampleData = [
    {
      "Candidate Name": "Rushikesh Pawar",
      "Mobile Number": "9874996960",
      "Email": "rushikesh.pawar@example.com"
    },
    {
      "Candidate Name": "Priyanka Jadhav",
      "Mobile Number": "9198234112",
      "Email": "priyanka.jadhav@example.com"
    },
    {
      "Candidate Name": "Swapnil Shinde",
      "Mobile Number": "9891583477",
      "Email": "swapnil.shinde@example.com"
    },
    {
      "Candidate Name": "Vishu Sudrik",
      "Mobile Number": "9578124590",
      "Email": "sudrikvm@gmail.com"
    },
    {
      "Candidate Name": "Avi Yadav",
      "Mobile Number": "8879654321",
      "Email": "avishakaryadav96@gmail.com"
    }
  ];

  const csv = Papa.unparse(sampleData);
  downloadBlob(csv, "candidate_3column_sample_template.csv", 'text/csv;charset=utf-8;');
}

// Helper to extract last 7 digits of phone number for Seat Number
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

// Parse uploaded CSV file (Name, Mobile, Email) with Admin Exam Title and Exam Centre
export function parseCandidateCsv(file, adminExamTitle = "गट क - पूर्व परीक्षा 2026", adminExamCentre = "(11-12) - Ramanbaug, New English School, Pune") {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedCandidates = results.data
            .filter(row => {
              // Filter out completely blank rows
              const keys = Object.keys(row);
              return keys.some(k => row[k] && String(row[k]).trim().length > 0);
            })
            .map((row, index) => {
              // Flexible 3-column matching
              const name =
                row["Candidate Name"] ||
                row["Student Name"] ||
                row["Name"] ||
                row["name"] ||
                row["Candidate"] ||
                row["Full Name"] ||
                `Candidate ${index + 1}`;

              const phone =
                row["Mobile Number"] ||
                row["Phone Number"] ||
                row["Phone"] ||
                row["Mobile"] ||
                row["mobile"] ||
                row["phone"] ||
                row["Contact"] ||
                "";

              const email =
                row["Email"] ||
                row["Gmail"] ||
                row["gmail"] ||
                row["Email Address"] ||
                row["email"] ||
                "";

              // Seat Number is automatically the last 7 digits of student phone number
              const seatNo = row["Seat No"] || row["Seat Number"] || extractSeatNoFromPhone(phone, index + 1);

              // Exam Title given by Admin (or from CSV if provided)
              const examTitle = adminExamTitle || row["Exam Title"] || row["Exam"] || "गट क - पूर्व परीक्षा 2026";

              // Exam Centre selected by Admin (or from CSV if provided)
              const examCentre = adminExamCentre || row["Exam Centre"] || row["Center"] || "(11-12) - Ramanbaug, New English School, Pune";

              const uniqueId = `CM-${Date.now().toString().slice(-4)}${index + 1}`;
              const uniqueCode = `CM-MPSC-${seatNo}`;

              return {
                id: uniqueId,
                uniqueCode: uniqueCode,
                name: String(name).trim(),
                phone: String(phone).trim(),
                email: String(email).trim(),
                seatNo: String(seatNo).trim(),
                examTitle: String(examTitle).trim(),
                examCentre: String(examCentre).trim(),
                photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
                attendanceStatus: "Not Marked",
                verifiedAt: null
              };
            });
          resolve(parsedCandidates);
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
