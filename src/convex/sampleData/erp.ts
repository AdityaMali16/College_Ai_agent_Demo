/**
 * Sample data mirroring the NITJ ERP portal (v1.nitj.ac.in/erp) response
 * shapes — student profile, timetable, attendance, fees, results, exams,
 * and notices as the portal would return them.
 */

export interface SampleErpProfile {
  name: string;
  rollNumber: string;
  email: string;
  program: string;
  branch: string;
  semester: string;
  section: string;
  hostel: string;
  mentor: string;
}

// Mirrors the ERP student profile page
export const sampleErpProfile: SampleErpProfile = {
  name: "Aditya Mali",
  rollNumber: "24103007",
  email: "adityam.cs.24@nitj.ac.in",
  program: "B.Tech",
  branch: "Computer Science and Engineering",
  semester: "5th",
  section: "CSE-5A",
  hostel: "Ravi Bhawan",
  mentor: "Jagdeep Kaur",
};

export const sampleMobileNumber = "8770496150";

/* ---------- ERP modules (mirror of v1.nitj.ac.in/erp home) ---------- */

// Complaint Portal dropdown options as in the real form
export const sampleComplaintTypes = [
  "Electrical",
  "Plumbing",
  "Civil / Furniture",
  "Housekeeping",
  "Internet / LAN",
  "Mess / Food",
  "Library",
  "Security",
  "Other",
] as const;

export const sampleComplaintLocations = [
  "Boys Hostel",
  "Girls Hostel",
  "Academic Block",
  "Central Library",
  "Mess",
  "SAC",
  "Admin Block",
  "Sports Complex",
] as const;

export interface SampleComplaint {
  complaintType: string;
  location: string;
  roomNo: string;
  description: string;
  status: "submitted" | "in_progress" | "resolved";
  createdAtDaysAgo: number;
}

// Pre-existing complaints so "My Complaints" isn't empty
export const sampleComplaints: SampleComplaint[] = [
  {
    complaintType: "Electrical",
    location: "Boys Hostel",
    roomNo: "B-214",
    description: "Tube light in the room flickers and sometimes trips the breaker at night.",
    status: "resolved",
    createdAtDaysAgo: 12,
  },
  {
    complaintType: "Internet / LAN",
    location: "Academic Block",
    roomNo: "LH-3",
    description: "CampusNet keeps dropping during the 10 AM lecture hour in lecture hall 3.",
    status: "in_progress",
    createdAtDaysAgo: 3,
  },
];

// Guest House module — mirrors the portal's three guest houses exactly
export interface SampleGuestHouse {
  name: string;
  location: string;
  rooms: number;
  officialRate: number;
  privateRate: number | null;
}

export const sampleGuestHouses: SampleGuestHouse[] = [
  { name: "Main Guest House", location: "Near Shopping Complex", rooms: 8, officialRate: 800, privateRate: 1000 },
  { name: "SAC Guest House", location: "Student Activities Centre", rooms: 6, officialRate: 600, privateRate: null },
  { name: "Mega Hostel Guest House", location: "Near Mega Boys Hostel", rooms: 6, officialRate: 600, privateRate: null },
];

export const sampleGuestHousePolicies = {
  checkIn: "12 PM",
  checkOut: "11 AM",
  advanceDays: 15,
  cancellationRules: [
    "25% of the booking amount is charged if cancelled more than 24 hours before check-in time (12:00 PM).",
    "50% is charged if cancelled within 24 hours before check-in.",
    "No cancellation after check-in time or in case of a no-show.",
    "Refunds take up to 14 working days.",
  ],
  notes: [
    "Alcohol is not allowed.",
    "All rooms are double-bed capacity.",
    "All guests must carry a valid original photo ID at check-in.",
    "Institute may cancel bookings for official purposes with full refund.",
  ],
};

export interface SampleGuestHouseBooking {
  guestName: string;
  guestHouse: string;
  checkInDaysFromNow: number;
  nights: number;
  guests: number;
  purpose: string;
  status: "requested" | "confirmed" | "cancelled";
}

export const sampleGuestHouseBookings: SampleGuestHouseBooking[] = [
  {
    guestName: "Rakesh Mali",
    guestHouse: "Main Guest House",
    checkInDaysFromNow: 10,
    nights: 2,
    guests: 2,
    purpose: "Parents visiting for mid-semester weekend",
    status: "confirmed",
  },
];

// Equipment module — “View All Equipments” catalog
export const sampleEquipmentCatalog = [
  "HD Projector (Epson EB-X49)",
  "Laptop — Dell Latitude 5440",
  "Digital Camera — Canon EOS 1500D",
  "Tripod",
  "Portable PA System",
  "Oscilloscope — DSO 4-channel",
  "Function Generator",
  "DSLR Lens Kit",
] as const;

export const sampleSoftwareCatalog = [
  "MATLAB R2026a",
  "Altium Designer",
  "ANSYS Student",
  "Adobe Creative Cloud",
] as const;

export interface SampleEquipmentBooking {
  equipmentName: string;
  purpose: string;
  remarks: string;
  neededByDaysFromNow: number;
  status: "requested" | "approved" | "returned" | "rejected";
  createdAtDaysAgo: number;
}

export const sampleEquipmentBookings: SampleEquipmentBooking[] = [
  {
    equipmentName: "HD Projector (Epson EB-X49)",
    purpose: "Data Mining course presentation for mini-project review",
    remarks: "Needed for one lecture hour in LH-3",
    neededByDaysFromNow: 4,
    status: "approved",
    createdAtDaysAgo: 2,
  },
  {
    equipmentName: "Digital Camera — Canon EOS 1500D",
    purpose: "Photography club — fest coverage shoot",
    remarks: "Will return within 24 hours",
    neededByDaysFromNow: 16,
    status: "requested",
    createdAtDaysAgo: 1,
  },
];

// CONNECT — Student Wellness Program
export const sampleConnectTopics = [
  "Anxiety",
  "Stress",
  "Low mood / depression",
  "FOMO",
  "Peer relationships",
  "Family matters",
  "Something else (personal)",
] as const;

export interface SampleConnectRequest {
  topic: string;
  message: string;
  preferredMode: string;
  status: "submitted" | "scheduled" | "closed";
  createdAtDaysAgo: number;
}

export const sampleConnectRequests: SampleConnectRequest[] = [
  {
    topic: "Stress",
    message: "Would like to talk about managing coursework stress before mid-sems.",
    preferredMode: "In-person",
    status: "scheduled",
    createdAtDaysAgo: 6,
  },
];

// Academic module — exam registration types from the Academic Menu
export const sampleExamRegistrationTypes = [
  "Carry Subject Registration",
  "Summer Course Registration",
  "Make-up Exam Registration",
  "I Grade Exam Registration",
  "Supplementary Exam Registration",
  "Special Exam Registration",
] as const;

export interface SampleExamRegistration {
  examType: "carry" | "makeup" | "supplementary" | "i_grade" | "summer";
  courseCode: string;
  courseTitle: string;
  status: "requested" | "approved" | "rejected";
  createdAtDaysAgo: number;
}

export const sampleExamRegistrations: SampleExamRegistration[] = [
  {
    examType: "makeup",
    courseCode: "CSDC0304",
    courseTitle: "Computer Networks",
    status: "approved",
    createdAtDaysAgo: 8,
  },
];

export interface SampleTimetableSlot {
  day: string;
  startTime: string;
  endTime: string;
  courseCode: string;
  courseTitle: string;
  room: string;
  faculty: string;
}

// Mirrors the ERP weekly timetable view
export const sampleTimetable: SampleTimetableSlot[] = [
  { day: "Monday", startTime: "09:00", endTime: "09:50", courseCode: "CSDC0307", courseTitle: "Data Mining and Analytics", room: "LH-3", faculty: "Jagdeep Kaur" },
  { day: "Monday", startTime: "10:00", endTime: "10:50", courseCode: "CSDC0305", courseTitle: "Compiler Design", room: "LH-1", faculty: "Dr. Amanpreet Singh" },
  { day: "Monday", startTime: "14:00", endTime: "16:40", courseCode: "CSDP0310", courseTitle: "OS Lab", room: "Lab-2", faculty: "Prof. Sandeep Sharma" },
  { day: "Tuesday", startTime: "09:00", endTime: "09:50", courseCode: "CSDC0304", courseTitle: "Computer Networks", room: "LH-2", faculty: "Dr. Ravinder Kumar" },
  { day: "Tuesday", startTime: "11:00", endTime: "11:50", courseCode: "CSDC0307", courseTitle: "Data Mining and Analytics", room: "LH-3", faculty: "Jagdeep Kaur" },
  { day: "Tuesday", startTime: "12:00", endTime: "12:50", courseCode: "CSDS0311", courseTitle: "Deep Learning", room: "LH-5", faculty: "Dr. Neha Bhatia" },
  { day: "Wednesday", startTime: "10:00", endTime: "11:40", courseCode: "CSDC0305", courseTitle: "Compiler Design", room: "LH-1", faculty: "Dr. Amanpreet Singh" },
  { day: "Wednesday", startTime: "14:00", endTime: "15:40", courseCode: "CSDS0311", courseTitle: "Deep Learning Lab", room: "Lab-4", faculty: "Dr. Neha Bhatia" },
  { day: "Thursday", startTime: "09:00", endTime: "09:50", courseCode: "CSDC0304", courseTitle: "Computer Networks", room: "LH-2", faculty: "Dr. Ravinder Kumar" },
  { day: "Thursday", startTime: "10:00", endTime: "10:50", courseCode: "CSDC0307", courseTitle: "Data Mining and Analytics", room: "LH-3", faculty: "Jagdeep Kaur" },
  { day: "Friday", startTime: "10:00", endTime: "11:40", courseCode: "CSDC0304", courseTitle: "Networks Lab", room: "Lab-1", faculty: "Dr. Ravinder Kumar" },
  { day: "Friday", startTime: "12:00", endTime: "12:50", courseCode: "CSDC0305", courseTitle: "Compiler Design", room: "LH-1", faculty: "Dr. Amanpreet Singh" },
];

export interface SampleAttendanceRow {
  courseCode: string;
  courseTitle: string;
  held: number;
  attended: number;
}

// Mirrors the ERP attendance summary (note CN below threshold — mirrors the
// real Xceed notification sample)
export const sampleAttendance: SampleAttendanceRow[] = [
  { courseCode: "CSDC0307", courseTitle: "Data Mining and Analytics", held: 32, attended: 29 },
  { courseCode: "CSDC0305", courseTitle: "Compiler Design", held: 30, attended: 26 },
  { courseCode: "CSDC0304", courseTitle: "Computer Networks", held: 30, attended: 21 },
  { courseCode: "CSDP0310", courseTitle: "OS Lab", held: 12, attended: 11 },
  { courseCode: "CSDS0311", courseTitle: "Deep Learning", held: 24, attended: 22 },
];

export interface SampleFee {
  label: string;
  amount: number;
  dueDate: string;
  paid: boolean;
  receiptNo: string | null;
}

// Mirrors the ERP fees page
export const sampleFees: SampleFee[] = [
  {
    label: "Semester fee — Monsoon 2026",
    amount: 52500,
    dueDate: daysFromNowISODate(9),
    paid: false,
    receiptNo: null,
  },
  {
    label: "Hostel fee — Odd sem 2026",
    amount: 32000,
    dueDate: daysFromNowISODate(20),
    paid: false,
    receiptNo: null,
  },
  {
    label: "Lab fee — Monsoon 2026",
    amount: 2500,
    dueDate: daysFromNowISODate(-5),
    paid: true,
    receiptNo: "NITJ/2026/LF/08421",
  },
];

export interface SampleResult {
  courseCode: string;
  courseTitle: string;
  credits: number;
  grade: string;
  gradePoints: number;
  semester: string;
  declaredAt: string;
}

// Mirrors the ERP results page (previous semester — even sem 2026)
export const sampleResults: SampleResult[] = [
  { courseCode: "CSDC0201", courseTitle: "Design and Analysis of Algorithms", credits: 4, grade: "A", gradePoints: 9, semester: "Spring 2026", declaredAt: daysFromNowISODate(-95) },
  { courseCode: "CSDC0203", courseTitle: "Database Management Systems", credits: 4, grade: "A-", gradePoints: 8, semester: "Spring 2026", declaredAt: daysFromNowISODate(-95) },
  { courseCode: "CSDC0205", courseTitle: "Theory of Computation", credits: 3, grade: "B+", gradePoints: 7, semester: "Spring 2026", declaredAt: daysFromNowISODate(-95) },
  { courseCode: "CSDC0207", courseTitle: "Microprocessors", credits: 3, grade: "A", gradePoints: 9, semester: "Spring 2026", declaredAt: daysFromNowISODate(-95) },
  { courseCode: "CSDP0209", courseTitle: "DBMS Lab", credits: 2, grade: "A+", gradePoints: 10, semester: "Spring 2026", declaredAt: daysFromNowISODate(-95) },
  { courseCode: "HSDE0103", courseTitle: "Economics for Engineers", credits: 2, grade: "B", gradePoints: 6, semester: "Spring 2026", declaredAt: daysFromNowISODate(-95) },
];

export interface SampleExam {
  courseCode: string;
  courseTitle: string;
  date: string;
  startTime: string;
  room: string;
  seat: string;
}

// Mirrors the ERP exam schedule (mid-sem)
export const sampleExams: SampleExam[] = [
  { courseCode: "CSDC0307", courseTitle: "Data Mining and Analytics", date: daysFromNowISODate(14), startTime: "09:30", room: "Exam Hall A", seat: "A-12" },
  { courseCode: "CSDC0305", courseTitle: "Compiler Design", date: daysFromNowISODate(16), startTime: "14:00", room: "Exam Hall B", seat: "B-07" },
  { courseCode: "CSDC0304", courseTitle: "Computer Networks", date: daysFromNowISODate(18), startTime: "09:30", room: "Exam Hall A", seat: "A-04" },
  { courseCode: "CSDS0311", courseTitle: "Deep Learning", date: daysFromNowISODate(21), startTime: "14:00", room: "Exam Hall C", seat: "C-15" },
  { courseCode: "CSDP0310", courseTitle: "OS Lab", date: daysFromNowISODate(23), startTime: "10:00", room: "Lab-2", seat: "L-01" },
];

export interface SampleNotice {
  title: string;
  body: string;
  category: string;
}

// Mirrors the ERP notice board
export const sampleNotices: SampleNotice[] = [
  {
    title: "Mid-semester examination schedule released",
    body: "The mid-semester examination schedule for Monsoon 2026 is now available on the ERP portal. Carry your student ID to every exam; entry closes 15 minutes after start.",
    category: "Examinations",
  },
  {
    title: "Fee payment window — Monsoon 2026",
    body: "The fee payment window closes two weeks after mid-sems. A late fee of Rs 500 per week applies after the due date. Payments accepted via the ERP portal only.",
    category: "Fees",
  },
  {
    title: "Library extended hours during exams",
    body: "The central library will remain open until 2:00 AM from the week before mid-sems until they conclude. Silence zone rules apply on floors 2 and 3.",
    category: "Library",
  },
  {
    title: "Hostel day-scholar shuttle revised",
    body: "The evening shuttle to the north campus now departs at 5:45 PM and 7:15 PM on weekdays. Weekend service remains at 10 AM and 6 PM.",
    category: "Hostel",
  },
  {
    title: "Utkansh 2026 volunteer registrations open",
    body: "Students interested in volunteering for the annual cultural fest may register through the Xceed events module until Friday.",
    category: "Events",
  },
];

export interface SampleCourse {
  courseCode: string;
  courseTitle: string;
  credits: number;
  semester: string;
}

// Mirrors the ERP course registration page (current semester)
export const sampleRegistrations: SampleCourse[] = [
  { courseCode: "CSDC0307", courseTitle: "Data Mining and Analytics", credits: 4, semester: "Monsoon 2026" },
  { courseCode: "CSDC0305", courseTitle: "Compiler Design", credits: 4, semester: "Monsoon 2026" },
  { courseCode: "CSDC0304", courseTitle: "Computer Networks", credits: 4, semester: "Monsoon 2026" },
  { courseCode: "CSDS0311", courseTitle: "Deep Learning", credits: 3, semester: "Monsoon 2026" },
  { courseCode: "CSDP0310", courseTitle: "OS Lab", credits: 2, semester: "Monsoon 2026" },
];

function daysFromNowISODate(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}
