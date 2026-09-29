/**
 * Sample data mirroring the Xceed API shapes captured from the live portal
 * (xceed.nitj.ac.in). Shapes match the real responses so a future live sync
 * can replace these without touching the schema.
 */

export interface SampleXceedClass {
  _id: string;
  name: string;
  subject: string;
  subjectCode: string;
  section: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  dept: string;
  academicYear: string;
  semester: string;
  session: string;
  coverColor: string;
  meetLink: string;
  status: string;
}

// Mirrors GET /api/v1/learningmodule/classes
export const sampleClasses: SampleXceedClass[] = [
  {
    _id: "6aa3c9fce135fadab2d06c03",
    name: "Data Mining and Analytics",
    subject: "DMA",
    subjectCode: "CSDC0307",
    section: "Sem B.Tech-CSE-5A",
    ownerId: "6a96be07509c95b5ba055be5",
    ownerName: "Jagdeep Kaur",
    ownerEmail: "kaurj@nitj.ac.in",
    dept: "Computer Science and Engineering",
    academicYear: "",
    semester: "B.Tech-CSE-5A",
    batch: "",
    session: "2026-2027 (Odd)",
    coverColor: "#1967d2",
    meetLink: "",
    status: "active",
  } as SampleXceedClass,
  {
    _id: "6aa3c9fce135fadab2d06c04",
    name: "Compiler Design",
    subject: "CD",
    subjectCode: "CSDC0305",
    section: "Sem B.Tech-CSE-5A",
    ownerId: "6a96be07509c95b5ba055be6",
    ownerName: "Dr. Amanpreet Singh",
    ownerEmail: "amanpreet.s@nitj.ac.in",
    dept: "Computer Science and Engineering",
    academicYear: "",
    semester: "B.Tech-CSE-5A",
    batch: "",
    session: "2026-2027 (Odd)",
    coverColor: "#7b1fa2",
    meetLink: "",
    status: "active",
  } as SampleXceedClass,
  {
    _id: "6aa3c9fce135fadab2d06c05",
    name: "Computer Networks",
    subject: "CN",
    subjectCode: "CSDC0304",
    section: "Sem B.Tech-CSE-5A",
    ownerId: "6a96be07509c95b5ba055be7",
    ownerName: "Dr. Ravinder Kumar",
    ownerEmail: "ravinder.k@nitj.ac.in",
    dept: "Computer Science and Engineering",
    academicYear: "",
    semester: "B.Tech-CSE-5A",
    batch: "",
    session: "2026-2027 (Odd)",
    coverColor: "#00897b",
    meetLink: "",
    status: "active",
  } as SampleXceedClass,
  {
    _id: "6aa3c9fce135fadab2d06c06",
    name: "Operating Systems Lab",
    subject: "OS Lab",
    subjectCode: "CSDP0310",
    section: "Sem B.Tech-CSE-5A",
    ownerId: "6a96be07509c95b5ba055be8",
    ownerName: "Prof. Sandeep Sharma",
    ownerEmail: "sandeep.s@nitj.ac.in",
    dept: "Computer Science and Engineering",
    academicYear: "",
    semester: "B.Tech-CSE-5A",
    batch: "",
    session: "2026-2027 (Odd)",
    coverColor: "#ef6c00",
    meetLink: "",
    status: "active",
  } as SampleXceedClass,
  {
    _id: "6aa3c9fce135fadab2d06c07",
    name: "Professional Elective - Deep Learning",
    subject: "DL",
    subjectCode: "CSDS0311",
    section: "Sem B.Tech-CSE-5A",
    ownerId: "6a96be07509c95b5ba055be9",
    ownerName: "Dr. Neha Bhatia",
    ownerEmail: "neha.b@nitj.ac.in",
    dept: "Computer Science and Engineering",
    academicYear: "",
    semester: "B.Tech-CSE-5A",
    batch: "",
    session: "2026-2027 (Odd)",
    coverColor: "#c62828",
    meetLink: "",
    status: "active",
  } as SampleXceedClass,
];

export interface SampleXceedAssignment {
  _id: string;
  classId: string;
  title: string;
  description: string;
  dueAt: string | null;
  submission: { submittedAt: string | null; score: number | null; maxScore: number } | null;
}

// Mirrors GET /api/v1/learningmodule/class/:id/assignments
export const sampleAssignments: SampleXceedAssignment[] = [
  {
    _id: "asg-dma-01",
    classId: "6aa3c9fce135fadab2d06c03",
    title: "Assignment 1 — Association Rule Mining",
    description:
      "Run Apriori and FP-Growth on the provided retail dataset. Compare frequent itemsets and discuss runtime differences.",
    dueAt: daysFromNowISO(3),
    submission: null,
  },
  {
    _id: "asg-cd-01",
    classId: "6aa3c9fce135fadab2d06c04",
    title: "Lexical Analyzer Assignment",
    description:
      "Implement a lexical analyzer for a C subset using flex. Submit the .l file and a report with test cases.",
    dueAt: daysFromNowISO(5),
    submission: null,
  },
  {
    _id: "asg-cn-01",
    classId: "6aa3c9fce135fadab2d06c05",
    title: "Socket Programming Lab",
    description:
      "Build a TCP client-server file transfer application with error handling. Demo in next lab session.",
    dueAt: daysFromNowISO(-2),
    submission: { submittedAt: daysFromNowISO(-3), score: null, maxScore: 20 },
  },
  {
    _id: "asg-dl-01",
    classId: "6aa3c9fce135fadab2d06c07",
    title: "Backpropagation from Scratch",
    description:
      "Implement backpropagation on a 2-layer network using NumPy only. Train on MNIST subset, report accuracy.",
    dueAt: daysFromNowISO(7),
    submission: null,
  },
  {
    _id: "asg-dma-02",
    classId: "6aa3c9fce135fadab2d06c03",
    title: "Quiz 1 — Classification",
    description: "Closed-book quiz covering decision trees, Naive Bayes, and evaluation metrics.",
    dueAt: daysFromNowISO(-8),
    submission: { submittedAt: daysFromNowISO(-8), score: 17.5, maxScore: 20 },
  },
];

export interface SampleXceedAnnouncement {
  _id: string;
  classId: string | null;
  title: string;
  body: string;
  postedAt: string;
}

// Mirrors GET /api/v1/learningmodule/class/:id/announcements
export const sampleAnnouncements: SampleXceedAnnouncement[] = [
  {
    _id: "ann-dma-01",
    classId: "6aa3c9fce135fadab2d06c03",
    title: "DMA mid-sem syllabus",
    body: "Units 1-3 will be covered in the mid-semester examination. Preprocessing, association rules, classification.",
    postedAt: daysFromNowISO(-4),
  },
  {
    _id: "ann-cd-01",
    classId: "6aa3c9fce135fadab2d06c04",
    title: "Compiler Design lab rescheduled",
    body: "This week's lab moves from Thursday 2 PM to Friday 10 AM due to a faculty commitment.",
    postedAt: daysFromNowISO(-2),
  },
  {
    _id: "ann-cn-01",
    classId: "6aa3c9fce135fadab2d06c05",
    title: "CN Assignment 2 released",
    body: "Subnetting and routing assignment is now live. Due next Tuesday.",
    postedAt: daysFromNowISO(-1),
  },
  {
    _id: "ann-gen-01",
    classId: null,
    title: "Institute homepage scheduled maintenance",
    body: "The ERP portal will be unavailable Sunday 2-4 AM for scheduled maintenance.",
    postedAt: daysFromNowISO(-1),
  },
];

export interface SampleXceedEvent {
  _id: string;
  title: string;
  description: string;
  club: string;
  startsAt: string;
  endsAt: string | null;
  venue: string;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
}

// Mirrors the Xceed event module listing
export const sampleEvents: SampleXceedEvent[] = [
  {
    _id: "evt-01",
    title: "Utkansh — Annual Cultural Fest",
    description:
      "Three days of music, dance, drama and the celebrity night. Registrations open for all events.",
    club: "Student Council",
    startsAt: daysFromNowISO(12),
    endsAt: daysFromNowISO(14),
    venue: "Main Auditorium & Grounds",
    status: "upcoming",
  },
  {
    _id: "evt-02",
    title: "HackNITJ 4.0",
    description: "36-hour national level hackathon. Teams of 2-4. Cash prizes across three tracks.",
    club: "Coding Club",
    startsAt: daysFromNowISO(20),
    endsAt: daysFromNowISO(21),
    venue: "CSE Department Block",
    status: "upcoming",
  },
  {
    _id: "evt-03",
    title: "Tech talk: Systems research careers",
    description: "Alumni panel on MS/PhD paths and industry research labs.",
    club: "ACM Student Chapter",
    startsAt: daysFromNowISO(4),
    endsAt: null,
    venue: "Seminar Hall 2",
    status: "upcoming",
  },
  {
    _id: "evt-04",
    title: "Inter-branch football semifinal",
    description: "CSE vs Mechanical. Winners advance to the finals during Utkansh.",
    club: "Sports Board",
    startsAt: daysFromNowISO(-1),
    endsAt: null,
    venue: "Football Ground",
    status: "completed",
  },
];

export interface SampleXceedNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

// Mirrors GET /api/v1/learningmodule/notifications
export const sampleNotifications: SampleXceedNotification[] = [
  {
    _id: "ntf-01",
    title: "Assignment due tomorrow",
    message: "Socket Programming Lab (CN) submission closes tomorrow at 11:59 PM.",
    type: "assignment",
    isRead: false,
    createdAt: daysFromNowISO(-1),
  },
  {
    _id: "ntf-02",
    title: "Grade published",
    message: "Quiz 1 — Classification (DMA): 17.5/20.",
    type: "grade",
    isRead: false,
    createdAt: daysFromNowISO(-2),
  },
  {
    _id: "ntf-03",
    title: "New announcement in Compiler Design",
    message: "Lab rescheduled to Friday 10 AM this week.",
    type: "announcement",
    isRead: true,
    createdAt: daysFromNowISO(-2),
  },
  {
    _id: "ntf-04",
    title: "Attendance below threshold",
    message: "Your CN attendance is 70%, below the 75% requirement.",
    type: "attendance",
    isRead: false,
    createdAt: daysFromNowISO(-3),
  },
];

function daysFromNowISO(days: number): string {
  return new Date(Date.now() + days * 86400000).toISOString();
}
