import Papa from 'papaparse';

// Export Candidate List to CSV
export function exportCandidatesToCsv(candidates, filename = "candidates_list.csv") {
  const dataToExport = candidates.map((c, index) => ({
    "Sr No": index + 1,
    "Candidate ID": c.id,
    "Unique Code": c.uniqueCode,
    "Candidate Name": c.name,
    "Mobile Number": c.phone,
    "Email": c.email,
    "Exam Title": c.examTitle || "",
    "Seat No": c.seatNo || "",
    "Exam Centre": c.examCentre || "",
    "Attendance Status": c.attendanceStatus || "Not Marked",
    "Verified At": c.verifiedAt || ""
  }));

  const csv = Papa.unparse(dataToExport);
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
}

// Download Sample CSV Template for bulk import
export function downloadSampleCsvTemplate() {
  const sampleData = [
    {
      "Candidate Name": "Rushikesh Pawar",
      "Mobile Number": "7499696080",
      "Email": "rushikesh.pawar@example.com",
      "Exam Title": "गट क - पूर्व परीक्षा 2026",
      "Seat No": "1250042",
      "Exam Centre": "(11-12) - Ramanbaug, New English School, Pune",
      "Photo URL": ""
    },
    {
      "Candidate Name": "Priyanka Jadhav",
      "Mobile Number": "9823411290",
      "Email": "priyanka.jadhav@example.com",
      "Exam Title": "गट ब - पूर्व परीक्षा 2026",
      "Seat No": "1250043",
      "Exam Centre": "(11-12) - Ramanbaug, New English School, Pune",
      "Photo URL": ""
    },
    {
      "Candidate Name": "Swapnil Shinde",
      "Mobile Number": "9158347712",
      "Email": "swapnil.shinde@example.com",
      "Exam Title": "गट क - पूर्व परीक्षा 2026",
      "Seat No": "1250044",
      "Exam Centre": "(08-04) - Modern High School, Pune",
      "Photo URL": ""
    }
  ];

  const csv = Papa.unparse(sampleData);
  downloadBlob(csv, "candidate_import_sample_template.csv", 'text/csv;charset=utf-8;');
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
    "Status": c.attendanceStatus,
    "Timestamp": c.verifiedAt || "N/A"
  }));

  const csv = Papa.unparse(attendanceData);
  downloadBlob(csv, filename, 'text/csv;charset=utf-8;');
}

// Parse uploaded CSV file
export function parseCandidateCsv(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const parsedCandidates = results.data.map((row, index) => {
            // Flexible column matching
            const name = row["Candidate Name"] || row["Name"] || row["name"] || row["Candidate"] || `Candidate ${index + 1}`;
            const phone = row["Mobile Number"] || row["Phone"] || row["Mobile"] || row["phone"] || row["Contact"] || "";
            const email = row["Email"] || row["Email Address"] || row["email"] || "";
            const examTitle = row["Exam Title"] || row["Exam"] || row["examTitle"] || "गट क - पूर्व परीक्षा 2026";
            const seatNo = row["Seat No"] || row["Seat Number"] || row["Roll No"] || row["seatNo"] || `${1250000 + index + 1}`;
            const examCentre = row["Exam Centre"] || row["Center"] || row["Exam Center"] || "(11-12) - Ramanbaug, New English School, Pune";
            const photoUrl = row["Photo URL"] || row["Photo"] || row["photoUrl"] || "";

            const uniqueId = `CM-2026-${String(Date.now()).slice(-4)}${index + 1}`;
            const randomUniqueCode = `CM-MPSC-${Math.floor(1000000 + Math.random() * 9000000)}`;

            return {
              id: uniqueId,
              uniqueCode: randomUniqueCode,
              name: String(name).trim(),
              phone: String(phone).trim(),
              email: String(email).trim(),
              examTitle: String(examTitle).trim(),
              seatNo: String(seatNo).trim(),
              examCentre: String(examCentre).trim(),
              photoUrl: photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
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
