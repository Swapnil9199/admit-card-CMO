# QR Scanner & Camera Access Guide

The Admit Card Verification & Attendance system now features an upgraded **Camera & QR Scanner Engine** designed for fast, accurate attendance verification in exam halls.

---

## 📷 Features & How to Use Camera QR Scanning

### 1. Starting the Camera
1. Navigate to the **"QR Attendance Scanner"** tab in the top navigation bar.
2. Click **"Allow & Start Camera"**.
3. When prompted by your web browser, click **"Allow"** to grant camera permissions.
4. If multiple cameras exist on your device (e.g. Front / Back camera on a phone/tablet or external USB webcam on a PC), choose your desired camera from the camera dropdown.

### 2. Scanning a Candidate's Admit Card
- Hold the candidate's printed Hall Ticket or smartphone screen in front of the camera so the **QR code** is within the viewfinder box.
- The scanner will:
  1. Detect the unique candidate code (`CM-MPSC-XXXXXXX`).
  2. Play a distinct confirmation **beep chime**.
  3. Instantly display the candidate's verified profile (Photo, Name, Seat No, Phone, Email, Exam Centre).
  4. Automatically record their attendance with an exact date & time stamp.
  5. Fire celebration confetti!

### 3. Exam Hall Continuous Mode
- **Exam Hall Mode (Enabled by default)**: When scanning a line of students entering the exam hall, the camera remains active and automatically resets with a 2-second cooldown between candidates so invigilators can rapidly scan dozens of students consecutively without touching the keyboard.

### 4. Alternative Scanning Options
- **Upload QR Photo**: If a student sent a photo of their admit card or if a webcam is unavailable, click **"Upload QR Photo"** to scan a photo file directly.
- **Manual Code Lookup**: Enter the student's 7-digit Seat Number, Unique QR Code, or Mobile Number to verify instantly.

---

## 🔧 Camera Permission Troubleshooting

If the camera is not opening or permission was previously denied:
1. **Google Chrome / Brave / Edge**:
   - Click the **Lock / Tune icon (🔒)** to the left of the URL address bar (`http://localhost:5173`).
   - Find **Camera** and set it to **"Allow"**.
   - Refresh the page and click **"Allow & Start Camera"**.
2. **Apple Safari (macOS / iOS)**:
   - Go to **Safari > Settings > Websites > Camera**.
   - Set permission for `localhost` to **"Allow"**.
3. **Mozilla Firefox**:
   - Click the camera icon in the URL bar and select **"Allow"**.

---

## 📧 Gmail SMTP Tip (If using Gmail for Admin Emails)
When using Gmail:
- Port: `587` with **STARTTLS** (do NOT check SSL for 587) or Port `465` with **SSL**.
- Password: Must be a **16-character Google App Password** generated at [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) with 2-Step Verification turned ON.
