export const DEFAULT_EXAM_CENTRES = [
  "S.P. College (Sir Parashurambhau College), Tilak Road, Pune"
];

export const DEFAULT_INSTITUTE_INFO = {
  logoUrl: "/assets/combine_mentor_logo.jpg",
  instituteName: "COMBINE MENTOR OFFICIAL",
  instituteTagline: "Vision of Every Aspirant's",
  instituteAddress: "3rd Floor, Balaji Chambers, Near ABC Chowk, NC Kelkar Road, Pune - 411002",
  examTitle: "MPSC Combine Group B & C Services (गट ब व गट क संयुक्त पूर्व परीक्षा 2026)",
  examCentre: "S.P. College (Sir Parashurambhau College), Tilak Road, Pune",
  signatoryName: "Umesh V. Kudale",
  signatoryTitle: "HEAD OF EXAM OPERATIONS",
  signatorySubtext: "Rayat Prabodhini / Combine Mentor Official, Pune",
  telegramChannel: "@rayattest26",
  websiteUrl: "https://rayattest.in"
};

export const DEFAULT_TIMETABLE = [
  { id: 1, subject: "Comprehensive Test 1 (General Studies & CSAT)", date: "23-08-2026", time: "11:00 AM - 12:00 PM" },
  { id: 2, subject: "Comprehensive Test 2 (History & Polity)", date: "30-08-2026", time: "11:00 AM - 12:00 PM" },
  { id: 3, subject: "Comprehensive Test 3 (Geography & Agriculture)", date: "06-09-2026", time: "11:00 AM - 12:00 PM" },
  { id: 4, subject: "Comprehensive Test 4 (Economy & Planning)", date: "14-09-2026", time: "11:00 AM - 12:00 PM" },
  { id: 5, subject: "Comprehensive Test 5 (General Science & Tech)", date: "27-09-2026", time: "11:00 AM - 12:00 PM" },
  { id: 6, subject: "Comprehensive Test 6 (Current Affairs & Aptitude)", date: "04-10-2026", time: "11:00 AM - 12:00 PM" },
  { id: 7, subject: "Comprehensive Test 7 (Full Length Mock Exam)", date: "11-10-2026", time: "11:00 AM - 12:00 PM" }
];

export const DEFAULT_RULES_MARATHI = [
  "प्रवेश अनिवार्य: परीक्षा केंद्रात प्रवेशासाठी हॉल तिकीटची छापील प्रत (Printed Hard Copy) सोबत असणे बंधनकारक आहे. प्रवेशपत्रावरील माहितीच्या आधारेच पडताळणी (Verification) केली जाईल.",
  "सामायिक प्रवेशपत्र: संपूर्ण सराव परीक्षा मालिकेसाठी (Test Series) हे एकच प्रवेशपत्र लागू असेल. प्रत्येक पेपरच्या वेळी विद्यार्थ्याने हेच प्रवेशपत्र सोबत आणावे.",
  "प्रिंट गुणवत्ता: प्रवेशपत्रावरील QR कोड आणि Barcode स्कॅनिंगसाठी सुस्पष्ट असावेत, यासाठी प्रिंटची गुणवत्ता (Good Quality) चांगली असावी.",
  "आसन क्रमांक: OMR शीटवर प्रवेशपत्रात नमूद केलेला ७ अंकी आसन क्रमांक (Seat No.) अचूक भरावा.",
  "उपस्थिती: परीक्षा सुरू होण्यापूर्वी किमान ३० मिनिटे अगोदर परीक्षा केंद्रावर हजर राहावे.",
  "वेळापत्रक व अधिकार: परीक्षेचे वेळापत्रक खालील तक्त्यात दिले आहे. अपरिहार्य कारणास्तव परीक्षा केंद्र किंवा वेळेत बदल करण्याचा अधिकार संस्थेने राखून ठेवला आहे.",
  "महत्त्वाचे अपडेट्स: परीक्षेच्या माहितीसाठी व मदतीसाठी Telegram वर @rayattest26 सर्च करून चॅनेल जॉईन करावे, तसेच rayattest.in या संकेतस्थळाला (Website) नियमित भेट द्यावी.",
  "सर्व यंत्रणा ऑनलाईन पद्धतीने असल्यामुळे विद्यार्थ्यांना केवळ त्यांच्या नियोजित वेळेत आणि नियोजित परीक्षा केंद्रावरच परीक्षा देता येईल.",
  "कुठल्याही परिस्थितीत उमेदवाराच्या परीक्षा केंद्रात आणि वेळेत तांत्रिक अडचणीच्या पार्श्वभूमीवर बदल करता येत नाही."
];

export const DEFAULT_PROHIBITED_ITEMS = "उमेदवारांनी परीक्षा कक्षेत प्रवेश केल्यावर आपले इलेक्ट्रॉनिक उपकरणे उदा. मोबाईल आणि हेडफोन्स बंद करून ठेवावेत. उमेदवारांना केवळ काळ्या शाईचे बॉल पेन आणि पाण्याची बॉटल परीक्षा कक्षात घेऊन जाण्याची परवानगी देण्यात आली आहे.";

export const INITIAL_CANDIDATES = [
  {
    id: "CM-2026-001",
    uniqueCode: "CM-MPSC-8849102",
    name: "Rushikesh Pawar",
    phone: "7499696080",
    email: "rushikesh.pawar@example.com",
    examTitle: "गट क - पूर्व परीक्षा 2026",
    seatNo: "9696080",
    examCentre: "S.P. College (Sir Parashurambhau College), Tilak Road, Pune",
    photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=240&fit=crop&crop=faces",
    attendanceStatus: "Present",
    verifiedAt: "2026-08-24 10:45 AM"
  },
  {
    id: "CM-2026-002",
    uniqueCode: "CM-MPSC-7938201",
    name: "Priyanka Jadhav",
    phone: "9823411290",
    email: "priyanka.jadhav@example.com",
    examTitle: "गट ब - पूर्व परीक्षा 2026",
    seatNo: "3411290",
    examCentre: "S.P. College (Sir Parashurambhau College), Tilak Road, Pune",
    photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=240&fit=crop&crop=faces",
    attendanceStatus: "Not Marked",
    verifiedAt: null
  },
  {
    id: "CM-2026-003",
    uniqueCode: "CM-MPSC-4582910",
    name: "Swapnil Shinde",
    phone: "9158347712",
    email: "swapnil.shinde@example.com",
    examTitle: "गट क - पूर्व परीक्षा 2026",
    seatNo: "8347712",
    examCentre: "S.P. College (Sir Parashurambhau College), Tilak Road, Pune",
    photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=240&fit=crop&crop=faces",
    attendanceStatus: "Present",
    verifiedAt: "2026-08-24 10:52 AM"
  },
  {
    id: "CM-2026-004",
    uniqueCode: "CM-MPSC-9102834",
    name: "Snehal Deshmukh",
    phone: "9421098877",
    email: "snehal.deshmukh@example.com",
    examTitle: "गट ब - पूर्व परीक्षा 2026",
    seatNo: "1098877",
    examCentre: "S.P. College (Sir Parashurambhau College), Tilak Road, Pune",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=240&fit=crop&crop=faces",
    attendanceStatus: "Not Marked",
    verifiedAt: null
  },
  {
    id: "CM-2026-005",
    uniqueCode: "CM-MPSC-3920194",
    name: "Akash Gaikwad",
    phone: "9766543210",
    email: "akash.gaikwad@example.com",
    examTitle: "गट क - पूर्व परीक्षा 2026",
    seatNo: "6543210",
    examCentre: "S.P. College (Sir Parashurambhau College), Tilak Road, Pune",
    photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=240&fit=crop&crop=faces",
    attendanceStatus: "Not Marked",
    verifiedAt: null
  }
];
