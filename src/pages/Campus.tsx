import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AppShell } from "@/components/AppShell";
import { CampusGate } from "@/components/CampusGate";
import { api } from "@/convex/_generated/api";
import {
  sampleGuestHouses,
  sampleGuestHousePolicies,
  sampleEquipmentCatalog,
  sampleSoftwareCatalog,
} from "@/convex/sampleData/erp";
import { useQuery } from "convex/react";
import {
  Building2,
  GraduationCap,
  Loader2,
  MessageSquareHeart,
  Printer,
  ShieldAlert,
  UserRoundCheck,
} from "lucide-react";

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-b-0">
      {children}
    </div>
  );
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

/* ---------- ERP tabs ---------- */

function TimetableTab() {
  const rows = useQuery(api.erp.myTimetable);
  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty text="No timetable yet." />;

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {DAYS.filter((day) => rows.some((r) => r.day === day)).map((day) => (
        <div key={day}>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {day}
          </p>
          <div className="mt-3">
            {rows
              .filter((r) => r.day === day)
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map((slot) => (
                <Row key={slot._id}>
                  <div>
                    <p className="text-sm font-medium">
                      {slot.courseCode} · {slot.courseTitle}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {slot.faculty} · {slot.room}
                    </p>
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {slot.startTime}–{slot.endTime}
                  </span>
                </Row>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function AttendanceTab() {
  const rows = useQuery(api.erp.myAttendance);
  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty text="No attendance records." />;

  return (
    <div>
      {rows.map((row) => {
        const pct = row.held > 0 ? Math.round((row.attended / row.held) * 100) : 0;
        return (
          <Row key={row._id}>
            <div>
              <p className="text-sm font-medium">{row.courseCode}</p>
              <p className="text-xs text-muted-foreground">
                {row.attended}/{row.held} classes
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1 w-28 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${pct >= 75 ? "bg-foreground" : "bg-destructive"}`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm tabular-nums">{pct}%</span>
            </div>
          </Row>
        );
      })}
    </div>
  );
}

function ExamsTab() {
  const rows = useQuery(api.erp.listExamSchedule);
  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty text="No exams scheduled." />;

  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  return (
    <div>
      {sorted.map((exam) => (
        <Row key={exam._id}>
          <div>
            <p className="text-sm font-medium">
              {exam.courseCode} · {exam.courseTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {exam.room} · Seat {exam.seat}
            </p>
          </div>
          <span className="text-xs tabular-nums text-muted-foreground">
            {exam.date} · {exam.startTime}
          </span>
        </Row>
      ))}
    </div>
  );
}

function FeesTab() {
  const rows = useQuery(api.erp.myFees);
  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty text="No fee records." />;

  return (
    <div>
      {rows.map((fee) => (
        <Row key={fee._id}>
          <div>
            <p className="text-sm font-medium">{fee.label}</p>
            <p className="text-xs text-muted-foreground">Due {fee.dueDate}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm tabular-nums">₹{fee.amount.toLocaleString("en-IN")}</span>
            <Badge
              variant="outline"
              className={
                fee.paid
                  ? "text-muted-foreground"
                  : "border-foreground/40 text-foreground"
              }
            >
              {fee.paid ? "Paid" : "Due"}
            </Badge>
          </div>
        </Row>
      ))}
    </div>
  );
}

function ResultsTab() {
  const rows = useQuery(api.xceed.myResults);
  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty text="No results declared yet." />;

  const bySemester = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = bySemester.get(row.semester) ?? [];
    list.push(row);
    bySemester.set(row.semester, list);
  }

  const totalCredits = rows.reduce((sum, r) => sum + r.credits, 0);
  const totalPoints = rows.reduce((sum, r) => sum + r.credits * r.gradePoints, 0);
  const cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "—";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex gap-10">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">SGPA</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{cgpa}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Credits earned</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums">{totalCredits}</p>
        </div>
      </div>
      {[...bySemester.entries()].map(([semester, list]) => (
        <div key={semester}>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            {semester}
          </p>
          <div className="mt-3">
            {list.map((result) => (
              <Row key={result._id}>
                <div>
                  <p className="text-sm font-medium">
                    {result.courseCode} · {result.courseTitle}
                  </p>
                  <p className="text-xs text-muted-foreground">{result.credits} credits</p>
                </div>
                <Badge
                  variant="outline"
                  className="border-foreground/40 tabular-nums"
                >
                  {result.grade}
                </Badge>
              </Row>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function LeaveTab() {
  const rows = useQuery(api.erp.myLeaves);
  if (!rows) return <Loading />;
  if (rows.length === 0)
    return <Empty text="No leave applications. Ask the agent to apply for leave." />;

  return (
    <div>
      {rows
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((leave) => (
          <Row key={leave._id}>
            <div>
              <p className="text-sm">{leave.reason.slice(0, 80)}</p>
              <p className="text-xs text-muted-foreground">
                {leave.fromDate} → {leave.toDate}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                leave.status === "approved"
                  ? "text-muted-foreground"
                  : leave.status === "declined"
                    ? "text-destructive"
                    : "border-foreground/40 text-foreground"
              }
            >
              {leave.status}
            </Badge>
          </Row>
        ))}
    </div>
  );
}

function TicketsTab() {
  const rows = useQuery(api.erp.myTickets);
  if (!rows) return <Loading />;
  if (rows.length === 0)
    return <Empty text="No tickets. Ask the agent to raise one." />;

  return (
    <div>
      {rows
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((ticket) => (
          <Row key={ticket._id}>
            <div>
              <p className="text-sm">{ticket.subject}</p>
              <p className="text-xs text-muted-foreground">
                {ticket.detail.slice(0, 90)}
              </p>
            </div>
            <Badge variant="outline" className="text-muted-foreground">
              {ticket.status}
            </Badge>
          </Row>
        ))}
    </div>
  );
}

function RegistrationsTab() {
  const rows = useQuery(api.erp.myRegistrations);
  if (!rows) return <Loading />;
  if (rows.length === 0) return <Empty text="No registrations yet." />;

  const credits = rows.reduce((sum, r) => sum + r.credits, 0);
  return (
    <div>
      <p className="mb-4 text-sm text-muted-foreground">
        {rows.length} courses · {credits} credits · Monsoon 2026
      </p>
      {rows.map((reg) => (
        <Row key={reg._id}>
          <div>
            <p className="text-sm font-medium">
              {reg.courseCode} · {reg.courseTitle}
            </p>
            <p className="text-xs text-muted-foreground">{reg.semester}</p>
          </div>
          <span className="text-sm tabular-nums">{reg.credits} cr</span>
        </Row>
      ))}
    </div>
  );
}

/* ---------- Xceed sections ---------- */

function AssignmentsTab() {
  const assignments = useQuery(api.xceed.myAssignments);
  const classes = useQuery(api.xceed.myClasses);
  if (!assignments || !classes) return <Loading />;
  if (assignments.length === 0) return <Empty text="No assignments on Xceed." />;

  const className = (id: string) =>
    classes.find((c) => c.xceedId === id)?.subjectCode ?? "";

  const pending = assignments
    .filter((a) => a.status === "pending" && a.dueAt)
    .sort((a, b) => (a.dueAt ?? 0) - (b.dueAt ?? 0));
  const done = assignments.filter((a) => a.status !== "pending");

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Upcoming deadlines
        </p>
        <div className="mt-3">
          {pending.length === 0 ? (
            <Empty text="Nothing due. Nice." />
          ) : (
            pending.map((asg) => (
              <Row key={asg._id}>
                <div>
                  <p className="text-sm font-medium">{asg.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {className(asg.classXceedId)} ·{" "}
                    {asg.dueAt &&
                      new Date(asg.dueAt).toLocaleDateString([], {
                        month: "short",
                        day: "numeric",
                      })}
                  </p>
                </div>
                <Badge variant="outline" className="border-foreground/40">
                  Due
                </Badge>
              </Row>
            ))
          )}
        </div>
      </div>
      {done.length > 0 && (
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Submitted
          </p>
          <div className="mt-3">
            {done.map((asg) => (
              <Row key={asg._id}>
                <div>
                  <p className="text-sm">{asg.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {className(asg.classXceedId)}
                  </p>
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                  {asg.status === "graded" && asg.score !== undefined
                    ? `${asg.score}/${asg.maxScore ?? 20}`
                    : asg.status}
                </Badge>
              </Row>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EventsTab() {
  const events = useQuery(api.xceed.myEvents);
  if (!events) return <Loading />;
  if (events.length === 0) return <Empty text="No events on Xceed." />;

  const sorted = [...events].sort(
    (a, b) => (a.startsAt ?? 0) - (b.startsAt ?? 0),
  );
  return (
    <div>
      {sorted.map((event) => (
        <Row key={event._id}>
          <div>
            <p className="text-sm font-medium">{event.title}</p>
            <p className="text-xs text-muted-foreground">
              {event.club}
              {event.venue ? ` · ${event.venue}` : ""}
              {event.startsAt
                ? ` · ${new Date(event.startsAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}`
                : ""}
            </p>
          </div>
          <Badge
            variant="outline"
            className={
              event.status === "upcoming"
                ? "border-foreground/40"
                : "text-muted-foreground"
            }
          >
            {event.status}
          </Badge>
        </Row>
      ))}
    </div>
  );
}

/* ---------- ERP module tabs (mirrors the v1.nitj.ac.in/erp modules) ---------- */

function ComplaintsTab() {
  const rows = useQuery(api.erp.myComplaints);
  if (!rows) return <Loading />;
  if (rows.length === 0)
    return <Empty text='No complaints. Try "file a complaint about the wifi in LH-3".' />;

  return (
    <div>
      {rows
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((complaint) => (
          <Row key={complaint._id}>
            <div>
              <p className="text-sm">
                {complaint.complaintType} · {complaint.location}
                {complaint.roomNo ? ` · Room ${complaint.roomNo}` : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {complaint.description.slice(0, 90)}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                complaint.status === "resolved"
                  ? "text-muted-foreground"
                  : "border-foreground/40"
              }
            >
              {complaint.status}
            </Badge>
          </Row>
        ))}
    </div>
  );
}

function GuestHouseTab() {
  const bookings = useQuery(api.erp.myGuestHouseBookings);
  if (!bookings) return <Loading />;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Available guest houses
        </p>
        <div className="mt-3 grid gap-4 md:grid-cols-3">
          {sampleGuestHouses.map((house) => (
            <div
              key={house.name}
              className="rounded-lg border border-border/80 bg-card p-4"
            >
              <p className="text-sm font-medium">{house.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {house.location} · {house.rooms} rooms
              </p>
              <p className="mt-2 text-sm tabular-nums">
                ₹{house.officialRate}
                <span className="text-xs text-muted-foreground"> / day official</span>
              </p>
              {house.privateRate && (
                <p className="text-xs tabular-nums text-muted-foreground">
                  ₹{house.privateRate} / day private
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          My booking requests
        </p>
        <div className="mt-3">
          {bookings.length === 0 ? (
            <Empty text='No bookings. Try "book the guest house for my father from 2026-10-10 to 2026-10-12".' />
          ) : (
            bookings
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((booking) => (
                <Row key={booking._id}>
                  <div>
                    <p className="text-sm font-medium">
                      {booking.guestHouse} · {booking.guestName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {booking.checkIn} → {booking.checkOut} · {booking.guests} guest
                      {booking.guests === 1 ? "" : "s"} · ₹{booking.perNightRate}/night
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      booking.status === "confirmed"
                        ? "border-foreground/40"
                        : "text-muted-foreground"
                    }
                  >
                    {booking.status}
                  </Badge>
                </Row>
              ))
          )}
        </div>
      </div>
      <div className="rounded-lg border border-border/80 bg-muted/30 p-5">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Policy highlights
        </p>
        <ul className="mt-3 space-y-1.5 text-xs leading-5 text-muted-foreground">
          <li>
            Check-in {sampleGuestHousePolicies.checkIn} · Check-out{" "}
            {sampleGuestHousePolicies.checkOut} · up to{" "}
            {sampleGuestHousePolicies.advanceDays} days in advance.
          </li>
          {sampleGuestHousePolicies.cancellationRules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function EquipmentTab() {
  const bookings = useQuery(api.erp.myEquipmentBookings);
  if (!bookings) return <Loading />;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          My bookings
        </p>
        <div className="mt-3">
          {bookings.length === 0 ? (
            <Empty text='No equipment bookings. Try "book a projector for my presentation on 2026-09-20".' />
          ) : (
            bookings
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((booking) => (
                <Row key={booking._id}>
                  <div>
                    <p className="text-sm font-medium">{booking.equipmentName}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.purpose.slice(0, 80)}
                      {booking.neededBy ? ` · needed by ${booking.neededBy}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      booking.status === "approved"
                        ? "border-foreground/40"
                        : "text-muted-foreground"
                    }
                  >
                    {booking.status}
                  </Badge>
                </Row>
              ))
          )}
        </div>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Catalog
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[...sampleEquipmentCatalog, ...sampleSoftwareCatalog].map((item) => (
            <span
              key={item}
              className="rounded-full border border-border/70 px-3 py-1.5 text-xs text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function WellnessTab() {
  const requests = useQuery(api.erp.myConnectRequests);
  if (!requests) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg border border-border/80 bg-muted/30 p-5">
        <p className="text-sm font-medium">Student Wellness Program — CONNECT</p>
        <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
          Confidential support for anxiety, stress, low mood, FOMO, and related
          challenges. Not for academic or career queries — those go to your
          mentor. Requests are visible only to you.
        </p>
      </div>
      <div>
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          My requests
        </p>
        <div className="mt-3">
          {requests.length === 0 ? (
            <Empty text='No requests. Try "I want to talk to a counsellor about stress".' />
          ) : (
            requests
              .slice()
              .sort((a, b) => b.createdAt - a.createdAt)
              .map((request) => (
                <Row key={request._id}>
                  <div>
                    <p className="text-sm font-medium">{request.topic}</p>
                    <p className="text-xs text-muted-foreground">
                      {request.message.slice(0, 90)}
                      {request.preferredMode ? ` · ${request.preferredMode}` : ""}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      request.status === "closed"
                        ? "text-muted-foreground"
                        : "border-foreground/40"
                    }
                  >
                    {request.status}
                  </Badge>
                </Row>
              ))
          )}
        </div>
      </div>
    </div>
  );
}

const EXAM_TYPE_LABELS: Record<string, string> = {
  carry: "Carry subject",
  makeup: "Make-up exam",
  supplementary: "Supplementary",
  i_grade: "I-Grade exam",
  summer: "Summer course",
};

function ExamRegistrationsTab() {
  const rows = useQuery(api.erp.myExamRegistrations);
  if (!rows) return <Loading />;
  if (rows.length === 0)
    return <Empty text='No exam registrations. Try "register for a makeup exam for CSDC0304".' />;

  return (
    <div>
      {rows
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map((reg) => (
          <Row key={reg._id}>
            <div>
              <p className="text-sm font-medium">
                {EXAM_TYPE_LABELS[reg.examType] ?? reg.examType} · {reg.courseCode}
              </p>
              <p className="text-xs text-muted-foreground">{reg.courseTitle}</p>
            </div>
            <Badge
              variant="outline"
              className={
                reg.status === "approved"
                  ? "border-foreground/40"
                  : reg.status === "rejected"
                    ? "text-destructive"
                    : "text-muted-foreground"
              }
            >
              {reg.status}
            </Badge>
          </Row>
        ))}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" />
      Loading…
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-10 text-sm text-muted-foreground">{text}</p>;
}

export default function Campus() {
  const profile = useQuery(api.campus.myProfile);
  const notices = useQuery(api.erp.listNotices);
  const classes = useQuery(api.xceed.myClasses);
  const announcements = useQuery(api.xceed.myAnnouncements);
  const notifications = useQuery(api.xceed.myNotifications);

  return (
    <AppShell>
      <CampusGate profile={profile}>
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Campus records</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything the agent can see and act on — ERP and Xceed, in one
              place.
            </p>
          </div>

          {/* ERP modules — mirrors the v1.nitj.ac.in/erp home */}
          <section>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              ERP modules
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  icon: GraduationCap,
                  title: "Academic Module",
                  description:
                    "Personal details, attendance, evaluation, registration, exam results.",
                  tab: "examreg",
                },
                {
                  icon: ShieldAlert,
                  title: "Complaint Portal",
                  description:
                    "Electrical, plumbing, LAN, mess and other campus issues.",
                  tab: "complaints",
                },
                {
                  icon: Building2,
                  title: "Guest House Booking",
                  description:
                    "Main, SAC and Mega Hostel guest houses for visiting guests.",
                  tab: "guesthouse",
                },
                {
                  icon: Printer,
                  title: "Equipment Booking",
                  description:
                    "Projectors, laptops, cameras, oscilloscopes and software.",
                  tab: "equipment",
                },
                {
                  icon: MessageSquareHeart,
                  title: "Connect Portal",
                  description:
                    "Student Wellness Program — confidential support requests.",
                  tab: "wellness",
                },
              ].map((module) => (
                <div
                  key={module.title}
                  className="rounded-lg border border-border/80 bg-card p-5"
                >
                  <module.icon className="size-4" strokeWidth={1.75} />
                  <p className="mt-3 text-sm font-medium">{module.title}</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {module.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* ERP student profile */}
          <section className="rounded-lg border border-border/80 bg-card p-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Student profile
            </p>
            <div className="mt-4 grid gap-x-10 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Name", profile?.displayName],
                ["Roll number", profile?.rollNumber],
                ["Program", profile?.program],
                ["Branch", profile?.department],
                ["Semester", profile?.semester],
                ["Section", profile?.section],
                ["Hostel", profile?.hostel],
                ["Mentor", profile?.mentor],
                ["Portal email", profile?.portalEmail],
                ["Mobile", profile?.mobile],
              ].map(([label, value]) => (
                <div key={label as string}>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">
                    {label}
                  </p>
                  <p className="mt-1">{value ?? "—"}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Xceed classes */}
          <section>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Xceed classes
            </p>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(classes ?? []).map((cls) => (
                <div
                  key={cls._id}
                  className="overflow-hidden rounded-lg border border-border/80 bg-card"
                >
                  <div
                    className="h-1.5 w-full"
                    style={{ backgroundColor: cls.coverColor ?? "#000" }}
                  />
                  <div className="p-5">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground">
                      {cls.subjectCode ?? "Course"}
                    </p>
                    <p className="mt-2 text-sm font-medium">{cls.name}</p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      {cls.instructor}
                      {cls.section ? ` · ${cls.section}` : ""}
                    </p>
                    {cls.meetLink && (
                      <a
                        href={cls.meetLink}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 inline-block text-xs underline underline-offset-4 hover:text-foreground"
                      >
                        Join link
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Notice board + Xceed feed */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                ERP notice board
              </p>
              <div className="mt-4 rounded-lg border border-border/80 bg-card px-5">
                {(notices ?? []).slice(0, 5).map((notice) => (
                  <div
                    key={notice._id}
                    className="border-b border-border/60 py-3 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs uppercase tracking-widest text-muted-foreground">
                        {notice.category}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{notice.title}</p>
                    <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                      {notice.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
                Xceed announcements
              </p>
              <div className="mt-4 rounded-lg border border-border/80 bg-card px-5">
                {(announcements ?? []).map((ann) => (
                  <div
                    key={ann._id}
                    className="border-b border-border/60 py-3 last:border-b-0"
                  >
                    <p className="text-sm font-medium">{ann.title}</p>
                    {ann.body && (
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                        {ann.body}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              {(notifications ?? []).length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(notifications ?? [])
                    .filter((n) => !n.isRead)
                    .map((n) => (
                      <span
                        key={n._id}
                        className="rounded-full border border-border/70 px-2.5 py-1 text-[11px] text-muted-foreground"
                      >
                        {n.title}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </section>

          {/* ERP + Xceed tabs */}
          <Tabs defaultValue="timetable">
            <TabsList className="h-9 justify-start gap-1 rounded-md bg-transparent p-0">
              {[
                ["timetable", "Timetable"],
                ["attendance", "Attendance"],
                ["assignments", "Assignments"],
                ["exams", "Exams"],
                ["examreg", "Exam registrations"],
                ["results", "Results"],
                ["fees", "Fees"],
                ["registrations", "Registrations"],
                ["events", "Events"],
                ["complaints", "Complaints"],
                ["guesthouse", "Guest house"],
                ["equipment", "Equipment"],
                ["wellness", "Wellness"],
                ["leave", "Leave"],
                ["tickets", "Tickets"],
              ].map(([value, label]) => (
                <TabsTrigger
                  key={value}
                  value={value}
                  className="rounded-md px-3 text-sm data-[state=active]:bg-muted data-[state=active]:text-foreground"
                >
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="timetable" className="mt-6">
              <TimetableTab />
            </TabsContent>
            <TabsContent value="attendance" className="mt-6">
              <AttendanceTab />
            </TabsContent>
            <TabsContent value="assignments" className="mt-6">
              <AssignmentsTab />
            </TabsContent>
            <TabsContent value="exams" className="mt-6">
              <ExamsTab />
            </TabsContent>
            <TabsContent value="examreg" className="mt-6">
              <ExamRegistrationsTab />
            </TabsContent>
            <TabsContent value="results" className="mt-6">
              <ResultsTab />
            </TabsContent>
            <TabsContent value="fees" className="mt-6">
              <FeesTab />
            </TabsContent>
            <TabsContent value="registrations" className="mt-6">
              <RegistrationsTab />
            </TabsContent>
            <TabsContent value="events" className="mt-6">
              <EventsTab />
            </TabsContent>
            <TabsContent value="complaints" className="mt-6">
              <ComplaintsTab />
            </TabsContent>
            <TabsContent value="guesthouse" className="mt-6">
              <GuestHouseTab />
            </TabsContent>
            <TabsContent value="equipment" className="mt-6">
              <EquipmentTab />
            </TabsContent>
            <TabsContent value="wellness" className="mt-6">
              <WellnessTab />
            </TabsContent>
            <TabsContent value="leave" className="mt-6">
              <LeaveTab />
            </TabsContent>
            <TabsContent value="tickets" className="mt-6">
              <TicketsTab />
            </TabsContent>
          </Tabs>
        </div>
      </CampusGate>
    </AppShell>
  );
}
