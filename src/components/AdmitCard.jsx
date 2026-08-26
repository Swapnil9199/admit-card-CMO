import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function AdmitCard({ candidate, instituteInfo, timetable, rules, prohibitedItems, id = "admit-card-view" }) {
  if (!candidate) {
    return (
      <div className="p-8 text-center text-slate-400">
        No candidate selected. Please select a candidate from the list.
      </div>
    );
  }

  // QR Code data payload: clean high-contrast identifier for ultra-fast instant camera scanning
  const qrCodeValue = candidate.uniqueCode || (candidate.seatNo ? `CM-MPSC-${candidate.seatNo}` : candidate.id);

  return (
    <div id={id} className="admit-card-container flex flex-col gap-8 w-[780px] min-w-[780px] mx-auto text-slate-900 select-text shrink-0">
      {/* ================= PAGE 1: HALL TICKET ================= */}
      <div className="admit-card-page bg-white p-7 sm:p-8 border-2 border-slate-900 shadow-2xl relative w-[780px] min-w-[780px] aspect-[1/1.414] flex flex-col justify-between overflow-hidden shrink-0">
        <div>
          {/* Header Section (Unbreakable 3-Column Grid) */}
          <div className="grid grid-cols-[130px_1fr_105px] items-center gap-3 border-b-2 border-slate-900 pb-4 mb-4">
            {/* Institute Logo */}
            <div className="w-[130px] h-[160px] border border-slate-300 rounded p-1 flex items-center justify-center bg-white shadow-sm overflow-hidden shrink-0">
              <img
                src={instituteInfo?.logoUrl || "/assets/combine_mentor_logo.jpg"}
                alt="Institute Logo"
                className="w-full h-full object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span class="text-xs font-bold text-center text-slate-700">COMBINE MENTOR</span>';
                }}
              />
            </div>

            {/* Institute Name & Address */}
            <div className="text-center px-2 min-w-0">
              <h1 className="text-xl sm:text-2xl font-black tracking-wider text-slate-950 uppercase font-sans leading-tight">
                {instituteInfo?.instituteName || "COMBINE MENTOR OFFICIAL"}
              </h1>
              {instituteInfo?.instituteTagline && (
                <p className="text-xs font-semibold text-blue-700 tracking-wide mt-0.5">
                  {instituteInfo.instituteTagline}
                </p>
              )}
              <p className="text-[11px] text-slate-700 leading-snug max-w-md mx-auto mt-1">
                {instituteInfo?.instituteAddress || "3rd Floor above Balaji Maharaj Mandir, NC Kelkar Road, Near Pharaskhana Police station, ABC Chowk, Pune, 411002"}
              </p>
            </div>

            {/* QR Code */}
            <div className="w-[105px] flex flex-col items-end shrink-0">
              <div className="p-1 border-2 border-slate-900 rounded bg-white shadow-sm flex flex-col items-center">
                <QRCodeSVG
                  value={qrCodeValue}
                  size={92}
                  level="M"
                  includeMargin={true}
                />
                <span className="text-[9px] font-mono font-bold tracking-tight text-slate-800 mt-0.5">
                  {candidate.uniqueCode || candidate.id}
                </span>
              </div>
            </div>
          </div>

          {/* Title Banner */}
          <div className="text-center my-3" style={{ textAlign: 'center' }}>
            <div
              className="inline-block px-8 py-1.5 rounded-sm shadow"
              style={{
                display: 'inline-block',
                backgroundColor: '#020617',
                color: '#ffffff',
                padding: '6px 32px',
                borderRadius: '2px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
              }}
            >
              <h2
                className="text-lg sm:text-xl font-extrabold uppercase"
                style={{
                  color: '#ffffff',
                  fontSize: '18px',
                  fontWeight: '800',
                  letterSpacing: '3px',
                  textTransform: 'uppercase',
                  margin: 0,
                  padding: 0,
                  lineHeight: '1.2'
                }}
              >
                ADMIT CARD
              </h2>
            </div>
            <p className="text-xs sm:text-sm font-bold text-slate-800 mt-1.5 tracking-wide" style={{ color: '#1e293b', fontWeight: '700', fontSize: '13px', marginTop: '6px' }}>
              {candidate.examTitle || instituteInfo?.examTitle || "MPSC Combine Group B & C Services"}
            </p>
          </div>

          {/* Candidate Details Section */}
          <div className="mt-4">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-950 mb-1.5">
              CANDIDATE DETAILS
            </h3>
            <div className="flex gap-4 items-stretch">
              {/* Info Table */}
              <table className="flex-1 text-xs border-collapse border border-slate-900">
                <tbody>
                  <tr className="border-b border-slate-900">
                    <td className="w-36 bg-slate-100/90 font-bold p-2 text-slate-900 border-r border-slate-900">
                      Candidate Name:
                    </td>
                    <td className="p-2 font-bold text-slate-950 uppercase tracking-wide">
                      {candidate.name}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <td className="bg-slate-100/90 font-bold p-2 text-slate-900 border-r border-slate-900">
                      Contact / Mobile No:
                    </td>
                    <td className="p-2 font-bold text-slate-950 font-mono text-xs">
                      {candidate.phone || "N/A"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <td className="bg-slate-100/90 font-bold p-2 text-slate-900 border-r border-slate-900">
                      Candidate Email ID:
                    </td>
                    <td className="p-2 font-semibold text-slate-900 text-xs">
                      {candidate.email || "N/A"}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-900">
                    <td className="bg-slate-100/90 font-bold p-2 text-slate-900 border-r border-slate-900">
                      Exam Title:
                    </td>
                    <td className="p-2 font-medium text-slate-900">
                      {candidate.examTitle || "MPSC Combine Group C Examination 2026 (संयुक्त गट क - पूर्व परीक्षा 2026)"}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-slate-100/90 font-bold p-2 text-slate-900 border-r border-slate-900">
                      Unique Verification Code:
                    </td>
                    <td className="p-2 font-mono font-bold text-blue-900 tracking-wider">
                      {candidate.uniqueCode || candidate.id}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Photo Box */}
              <div className="w-28 sm:w-32 border-2 border-dashed border-slate-400 p-1 flex flex-col items-center justify-center bg-slate-50 relative shrink-0">
                {candidate.photoUrl ? (
                  <img
                    src={candidate.photoUrl}
                    alt={candidate.name}
                    className="w-full h-full object-cover rounded-sm"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div
                  className={`w-full h-full flex flex-col items-center justify-center text-center p-2 ${candidate.photoUrl ? 'hidden' : 'flex'}`}
                >
                  <span className="text-[10px] text-slate-500 font-medium leading-tight">
                    Affix Passport Size Photo
                  </span>
                  <span className="text-[9px] text-slate-400 mt-1 font-mono">
                    ({candidate.seatNo})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Examination Details Section */}
          <div className="mt-4">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-950 mb-1.5">
              Examination Details
            </h3>
            <table className="w-full text-xs border-collapse border border-slate-900 text-center">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-900 font-bold">
                  <th className="p-2 w-1/3 border-r border-slate-900">Exam Seat No</th>
                  <th className="p-2 text-left pl-4">Exam Centre</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2.5 font-bold font-mono text-sm border-r border-slate-900 text-slate-950">
                    {candidate.seatNo || "1250042"}
                  </td>
                  <td className="p-2.5 text-left pl-4 font-semibold text-slate-900">
                    {candidate.examCentre || instituteInfo?.examCentre || "Biology building S.P. College (Sir Parashurambhau College), Tilak Road, Pune"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Examination Timetable Section */}
          <div className="mt-4">
            <h3 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-950 mb-1.5">
              Examination Timetable
            </h3>
            <table className="w-full text-[11px] sm:text-xs border-collapse border border-slate-900">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-900 text-slate-950 font-bold">
                  <th className="p-2 text-left border-r border-slate-900">SUBJECT</th>
                  <th className="p-2 text-center w-28 border-r border-slate-900">DATE</th>
                  <th className="p-2 text-center w-40">TIME</th>
                </tr>
              </thead>
              <tbody>
                {(timetable && timetable.length > 0 ? timetable : [
                  { id: 1, subject: "Comprehensive Test 1", date: "23-08-2026", time: "11:00 AM - 12:00 PM" },
                  { id: 2, subject: "Comprehensive Test 2", date: "30-08-2026", time: "11:00 AM - 12:00 PM" },
                  { id: 3, subject: "Comprehensive Test 3", date: "06-09-2026", time: "11:00 AM - 12:00 PM" },
                  { id: 4, subject: "Comprehensive Test 4", date: "14-09-2026", time: "11:00 AM - 12:00 PM" },
                  { id: 5, subject: "Comprehensive Test 5", date: "27-09-2026", time: "11:00 AM - 12:00 PM" },
                  { id: 6, subject: "Comprehensive Test 6", date: "04-10-2026", time: "11:00 AM - 12:00 PM" },
                  { id: 7, subject: "Comprehensive Test 7", date: "11-10-2026", time: "11:00 AM - 12:00 PM" },
                ]).map((row, idx) => (
                  <tr key={idx} className="border-b border-slate-300 hover:bg-slate-50/50">
                    <td className="p-1.5 font-medium border-r border-slate-300 pl-3">
                      {row.subject}
                    </td>
                    <td className="p-1.5 text-center font-mono font-medium border-r border-slate-300">
                      {row.date}
                    </td>
                    <td className="p-1.5 text-center font-mono font-medium">
                      {row.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer with Stamp & Signatory */}
        <div className="flex items-end justify-between pt-6 border-t border-slate-300 mt-4">
          {/* Official Stamp */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full border-2 border-purple-800 flex flex-col items-center justify-center p-1 text-center text-purple-900 shadow-inner bg-purple-50/40 relative">
              <span className="text-[7px] font-black tracking-tighter uppercase">COMBINE MENTOR</span>
              <span className="text-[6px] font-bold">★ SEAL ★</span>
              <span className="text-[7px] font-black">PUNE</span>
            </div>
            <div className="text-[10px] text-slate-500 font-medium italic">
              Official Examination Stamp
            </div>
          </div>

          {/* Signatory Authority */}
          <div className="text-right">
            <div className="inline-block border-b border-slate-900 pb-0.5 mb-1 px-4">
              <span className="text-sm font-bold text-slate-900 font-serif">
                {instituteInfo?.signatoryName || "Ganesh Pawar"}
              </span>
            </div>
            <p className="text-[11px] font-extrabold tracking-wider uppercase text-slate-950">
              {instituteInfo?.signatoryTitle || "HEAD OF EXAM OPERATIONS"}
            </p>
            <p className="text-[10px] text-slate-600">
              {instituteInfo?.signatorySubtext || "Combine Mentor Official, Pune"}
            </p>
          </div>
        </div>
      </div>

      {/* ================= PAGE 2: RULES & REGULATIONS ================= */}
      <div className="admit-card-page bg-white p-7 sm:p-8 border-2 border-slate-900 shadow-2xl relative w-[780px] min-w-[780px] aspect-[1/1.414] flex flex-col justify-between overflow-hidden shrink-0">
        <div>
          {/* Page 2 Title */}
          <div className="border-b-2 border-slate-900 pb-2 mb-4">
            <h2 className="text-lg sm:text-xl font-black tracking-wider text-slate-950 uppercase font-sans">
              RULES & REGULATIONS
            </h2>
            <h3 className="text-sm font-bold text-slate-800 mt-0.5 font-marathi">
              परीक्षार्थ्यांसाठी महत्त्वाच्या सूचना (Important Instructions)
            </h3>
          </div>

          {/* Rules List */}
          <div className="mt-2">
            <h4 className="text-xs font-bold text-slate-950 uppercase mb-2">
              सर्वसाधारण सूचना:
            </h4>
            <ol className="list-decimal pl-5 text-[11px] sm:text-xs text-slate-800 space-y-2 leading-relaxed">
              {(rules && rules.length > 0 ? rules : [
                "प्रत्येक विद्यार्थ्याने हॉल तिकीट ची छापील प्रत स्वतःबरोबर आणणे बंधनकारक आहे.",
                "छापील हॉल तिकीट शिवाय कोणालाही प्रवेश दिला जाणार नाही.",
                "परीक्षा केंद्रावर दिलेल्या वेळेच्या अर्धा तास अगोदर उपस्थित राहणे अनिवार्य आहे.",
                "टेस्ट सिरीज च्या वेळापत्रकात बदल केल्यास तशी पूर्वसूचना विद्यार्थ्यांना देण्यात येईल.",
                "परीक्षेसंबंधी काही शंका असल्यास अगोदरच ऑफिसशी संपर्क साधणे आवश्यक आहे.",
                "सर्व अधिकार Combine Mentor Official कडे राखीव असतील.",




              ]).map((rule, index) => (
                <li key={index} className="pl-1">
                  {rule}
                </li>
              ))}
            </ol>
          </div>

          {/* Prohibited Items Section */}
          <div className="mt-5 p-3.5 bg-slate-50 border border-slate-300 rounded-sm">
            <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
              <span>⚠</span> Prohibited Items:
            </h4>
            <p className="text-[11px] sm:text-xs text-slate-800 leading-relaxed">
              {prohibitedItems || "उमेदवारांनी परीक्षा कक्षेत प्रवेश केल्यावर आपले इलेक्ट्रॉनिक उपकरणे उदा. मोबाईल आणि हेडफोन्स बंद करून ठेवावेत. उमेदवारांना केवळ काळ्या शाईचे बॉल पेन आणि पाण्याची बॉटल परीक्षा कक्षात घेऊन जाण्याची परवानगी देण्यात आली आहे."}
            </p>
          </div>
        </div>

        {/* Page 2 Footer */}
        <div className="border-t border-slate-300 pt-4 mt-4 flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-900 flex items-center gap-1.5">
              <span>☑</span> Best wishes for your examination!
            </p>
            <p className="text-[11px] font-semibold text-slate-700 mt-1">
              {instituteInfo?.instituteName || "COMBINE MENTOR OFFICIAL"}
            </p>
            <p className="text-[10px] text-slate-500">
              Test Series & Examination Department
            </p>
          </div>
          <div className="text-right text-[10px] text-slate-500 font-mono">
            Candidate ID: {candidate.uniqueCode || candidate.id}
          </div>
        </div>
      </div>
    </div>
  );
}
