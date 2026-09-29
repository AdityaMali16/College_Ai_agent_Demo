import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  sampleClasses,
  sampleAssignments,
  sampleAnnouncements,
  sampleEvents,
  sampleNotifications,
} from "./sampleData/xceed";
import {
  sampleErpProfile,
  sampleMobileNumber,
  sampleTimetable,
  sampleAttendance,
  sampleFees,
  sampleResults,
  sampleExams,
  sampleNotices,
  sampleRegistrations,
  sampleComplaints,
  sampleGuestHouseBookings,
  sampleGuestHouses,
  sampleEquipmentBookings,
  sampleConnectRequests,
  sampleExamRegistrations,
} from "./sampleData/erp";

export const checkSeeded = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("timetable")
      .withIndex("by_student", (q) => q.eq("studentUserId", args.userId))
      .collect();
    return rows.length > 0;
  },
});

export const clearUserData = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const jobs: Array<Promise<unknown>> = [];
    for (const entry of [
      { table: "timetable" as const, field: "studentUserId" as const },
      { table: "attendance" as const, field: "studentUserId" as const },
      { table: "fees" as const, field: "studentUserId" as const },
      { table: "results" as const, field: "studentUserId" as const },
      { table: "leaveApplications" as const, field: "studentUserId" as const },
      { table: "tickets" as const, field: "userId" as const },
      { table: "registrations" as const, field: "studentUserId" as const },
      { table: "actions" as const, field: "userId" as const },
      { table: "xceedClasses" as const, field: "userId" as const },
      { table: "xceedAssignments" as const, field: "userId" as const },
      { table: "xceedAnnouncements" as const, field: "userId" as const },
      { table: "xceedAttendance" as const, field: "userId" as const },
      { table: "xceedEvents" as const, field: "userId" as const },
      { table: "xceedNotifications" as const, field: "userId" as const },
      { table: "complaints" as const, field: "userId" as const },
      { table: "guestHouseBookings" as const, field: "userId" as const },
      { table: "equipmentBookings" as const, field: "userId" as const },
      { table: "connectRequests" as const, field: "userId" as const },
      { table: "examRegistrations" as const, field: "studentUserId" as const },
      { table: "syncMeta" as const, field: "userId" as const },
    ]) {
      const rows = await ctx.db
        .query(entry.table)
        .filter((q) => q.eq(q.field(entry.field), args.userId))
        .collect();
      for (const row of rows) {
        jobs.push(ctx.db.delete(row._id));
      }
    }
    await Promise.all(jobs);
  },
});

export const seedUserData = internalMutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const now = Date.now();
    const isoToMs = (iso: string | null | undefined) =>
      iso ? new Date(iso).getTime() : undefined;

    /* ---------- ERP portal profile ---------- */

    const profile = await ctx.db
      .query("campusProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .unique();
    if (profile) {
      await ctx.db.patch(profile._id, {
        rollNumber: sampleErpProfile.rollNumber,
        program: sampleErpProfile.program,
        semester: sampleErpProfile.semester,
        section: sampleErpProfile.section,
        hostel: sampleErpProfile.hostel,
        mentor: sampleErpProfile.mentor,
        portalEmail: sampleErpProfile.email,
        mobile: sampleMobileNumber,
      });
    }

    /* ---------- ERP data ---------- */

    for (const slot of sampleTimetable) {
      await ctx.db.insert("timetable", {
        studentUserId: args.userId,
        day: slot.day,
        startTime: slot.startTime,
        endTime: slot.endTime,
        courseCode: slot.courseCode,
        courseTitle: slot.courseTitle,
        room: slot.room,
        faculty: slot.faculty,
      });
    }

    for (const row of sampleAttendance) {
      await ctx.db.insert("attendance", {
        studentUserId: args.userId,
        courseCode: row.courseCode,
        held: row.held,
        attended: row.attended,
      });
    }

    for (const fee of sampleFees) {
      await ctx.db.insert("fees", {
        studentUserId: args.userId,
        label: fee.label,
        amount: fee.amount,
        dueDate: fee.dueDate,
        paid: fee.paid,
      });
    }

    for (const result of sampleResults) {
      await ctx.db.insert("results", {
        studentUserId: args.userId,
        courseCode: result.courseCode,
        courseTitle: result.courseTitle,
        credits: result.credits,
        grade: result.grade,
        gradePoints: result.gradePoints,
        semester: result.semester,
        declaredAt: new Date(result.declaredAt).getTime(),
      });
    }

    // Exams + notices are global; only insert once across all users.
    const existingExams = await ctx.db.query("examSchedule").collect();
    if (existingExams.length === 0) {
      for (const exam of sampleExams) {
        await ctx.db.insert("examSchedule", {
          courseCode: exam.courseCode,
          courseTitle: exam.courseTitle,
          date: exam.date,
          startTime: exam.startTime,
          room: exam.room,
          seat: exam.seat,
        });
      }
    }

    const existingNotices = await ctx.db.query("notices").collect();
    if (existingNotices.length === 0) {
      for (const notice of sampleNotices) {
        await ctx.db.insert("notices", {
          title: notice.title,
          body: notice.body,
          category: notice.category,
          authorRole: "admin",
          createdAt: now,
        });
      }
    }

    for (const course of sampleRegistrations) {
      await ctx.db.insert("registrations", {
        studentUserId: args.userId,
        courseCode: course.courseCode,
        courseTitle: course.courseTitle,
        credits: course.credits,
        semester: course.semester,
      });
    }

    /* ---------- ERP modules ---------- */

    const daysAgo = (days: number) => now - days * 86400000;
    const daysFromNow = (days: number) => now + days * 86400000;

    for (const complaint of sampleComplaints) {
      await ctx.db.insert("complaints", {
        userId: args.userId,
        mobile: sampleMobileNumber,
        complaintType: complaint.complaintType,
        location: complaint.location,
        roomNo: complaint.roomNo,
        description: complaint.description,
        status: complaint.status,
        createdAt: daysAgo(complaint.createdAtDaysAgo),
      });
    }

    for (const booking of sampleGuestHouseBookings) {
      const house = sampleGuestHouses.find(
        (h) => h.name === booking.guestHouse,
      );
      const rate =
        house?.officialRate ?? 600;
      await ctx.db.insert("guestHouseBookings", {
        userId: args.userId,
        guestName: booking.guestName,
        guestHouse: booking.guestHouse,
        checkIn: new Date(daysFromNow(booking.checkInDaysFromNow))
          .toISOString()
          .slice(0, 10),
        checkOut: new Date(
          daysFromNow(booking.checkInDaysFromNow + booking.nights),
        )
          .toISOString()
          .slice(0, 10),
        guests: booking.guests,
        purpose: booking.purpose,
        perNightRate: rate,
        status: booking.status,
        createdAt: daysAgo(2),
      });
    }

    for (const booking of sampleEquipmentBookings) {
      await ctx.db.insert("equipmentBookings", {
        userId: args.userId,
        equipmentName: booking.equipmentName,
        purpose: booking.purpose,
        remarks: booking.remarks,
        neededBy: new Date(daysFromNow(booking.neededByDaysFromNow))
          .toISOString()
          .slice(0, 10),
        status: booking.status,
        createdAt: daysAgo(booking.createdAtDaysAgo),
      });
    }

    for (const request of sampleConnectRequests) {
      await ctx.db.insert("connectRequests", {
        userId: args.userId,
        topic: request.topic,
        message: request.message,
        preferredMode: request.preferredMode,
        status: request.status,
        createdAt: daysAgo(request.createdAtDaysAgo),
      });
    }

    for (const registration of sampleExamRegistrations) {
      await ctx.db.insert("examRegistrations", {
        studentUserId: args.userId,
        examType: registration.examType,
        courseCode: registration.courseCode,
        courseTitle: registration.courseTitle,
        status: registration.status,
        createdAt: daysAgo(registration.createdAtDaysAgo),
      });
    }

    /* ---------- Xceed data ---------- */

    for (const cls of sampleClasses) {
      await ctx.db.insert("xceedClasses", {
        userId: args.userId,
        xceedId: cls._id,
        name: cls.name,
        subject: cls.subject,
        subjectCode: cls.subjectCode,
        section: cls.section,
        instructor: cls.ownerName,
        instructorEmail: cls.ownerEmail,
        dept: cls.dept,
        session: cls.session,
        coverColor: cls.coverColor,
        meetLink: cls.meetLink || undefined,
        syncedAt: now,
      });
    }

    for (const asg of sampleAssignments) {
      await ctx.db.insert("xceedAssignments", {
        userId: args.userId,
        xceedId: asg._id,
        classXceedId: asg.classId,
        title: asg.title,
        description: asg.description,
        dueAt: isoToMs(asg.dueAt),
        status: asg.submission
          ? asg.submission.score !== null
            ? "graded"
            : "submitted"
          : "pending",
        score: asg.submission?.score ?? undefined,
        maxScore: asg.submission?.maxScore ?? undefined,
        syncedAt: now,
      });
    }

    for (const ann of sampleAnnouncements) {
      await ctx.db.insert("xceedAnnouncements", {
        userId: args.userId,
        xceedId: ann._id,
        classXceedId: ann.classId ?? undefined,
        title: ann.title,
        body: ann.body,
        postedAt: isoToMs(ann.postedAt),
        syncedAt: now,
      });
    }

    // Xceed attendance mirrors the ERP attendance rows (course codes align).
    for (const cls of sampleClasses) {
      const match = sampleAttendance.find((a) => a.courseCode === cls.subjectCode);
      if (match) {
        await ctx.db.insert("xceedAttendance", {
          userId: args.userId,
          classXceedId: cls._id,
          subjectCode: cls.subjectCode,
          held: match.held,
          attended: match.attended,
          syncedAt: now,
        });
      }
    }

    for (const event of sampleEvents) {
      await ctx.db.insert("xceedEvents", {
        userId: args.userId,
        xceedId: event._id,
        title: event.title,
        description: event.description,
        club: event.club,
        startsAt: isoToMs(event.startsAt),
        endsAt: isoToMs(event.endsAt),
        venue: event.venue,
        status: event.status,
        syncedAt: now,
      });
    }

    for (const notif of sampleNotifications) {
      await ctx.db.insert("xceedNotifications", {
        userId: args.userId,
        xceedId: notif._id,
        title: notif.title,
        body: notif.message,
        kind: notif.type,
        isRead: notif.isRead,
        syncedAt: now,
      });
    }

    await ctx.runMutation(internal.seedInternals.seedKnowledgeBase);

    return { profile: sampleErpProfile.name };
  },
});

export const countDocuments = internalQuery({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query("documents").collect();
    return docs.length;
  },
});

export const seedKnowledgeBase = internalMutation({
  args: {},
  handler: async (ctx) => {
    const docs = [
      {
        title: "Attendance policy",
        category: "Academics",
        content:
          "A minimum of 75% attendance is required in every course to sit for the end-semester examination. Students below 75% but above 65% may be granted condonation by the Dean of Academics on medical grounds with a medical certificate within 7 days. Below 65%, the course must be repeated. Attendance is counted from the first working day of the semester. Duty leave for representing the college at sanctioned events is counted as attended.",
      },
      {
        title: "Fee payment rules",
        category: "Fees",
        content:
          "Semester fees are due two weeks before mid-semester examinations. Late payment attracts Rs 500 per week. Payments are made through the ERP portal; receipts are generated instantly. Fee refunds on withdrawal: 100% before the semester starts, 50% in the first two weeks, none afterwards. Scholarships and fee waivers are credited directly against the pending semester fee.",
      },
      {
        title: "Leave application rules",
        category: "Hostel",
        content:
          "Leave applications must be submitted at least 3 days in advance except for medical emergencies. Parent or guardian consent is required for students under 18. Overnight leave requires hostel warden approval; day leave is approved by the class mentor. A maximum of 10 days of ordinary leave is allowed per semester. Unused leave does not carry over.",
      },
      {
        title: "Examination rules",
        category: "Examinations",
        content:
          "Students must carry their college ID and hall ticket to every examination. Entry closes 15 minutes after the start time. Electronic devices, smart watches, and programmable calculators are prohibited unless explicitly permitted. A minimum of 40% in the end-semester exam and 50% overall is required to pass a course. Re-examination is permitted once per course within one academic year.",
      },
      {
        title: "Library rules",
        category: "Library",
        content:
          "Undergraduates may borrow 4 books for 14 days, renewable twice unless reserved. Late returns attract Rs 2 per day per book. Reference books, journals, and theses are library-use only. The digital library is accessible on campus network 24x7 and remotely via VPN. Loss of a borrowed book must be reported immediately; replacement with the same edition or latest edition plus a Rs 100 processing fee.",
      },
      {
        title: "Hostel rules",
        category: "Hostel",
        content:
          "Hostel gates close at 10:30 PM on weekdays and 11:30 PM on weekends. Late entries beyond three times a month are reported to the warden. Visitors are allowed in common areas between 9 AM and 6 PM only. Mess rebate requires application 3 days in advance; minimum rebate period is 3 days. Electric kettles and iron boxes are permitted; induction cookers and heaters are prohibited.",
      },
      {
        title: "Course registration rules",
        category: "Academics",
        content:
          "Students register for 16 to 24 credits per semester. The add and drop window closes at the end of week 2. Dropping below 16 credits requires special approval from the Dean. Prerequisites must be cleared before registering for a course; a maximum of two backlog courses may be co-registered with department approval. Audit courses need mentor consent and carry no credits.",
      },
      {
        title: "Grievance redressal",
        category: "Support",
        content:
          "Academic grievances go to the course instructor first, then the department committee within 15 days. Non-academic grievances such as hostel, mess, or facilities issues are raised through the ERP support portal and acknowledged within 48 hours. Anti-ragging and harassment complaints are handled by the Internal Complaints Committee with confidentiality guaranteed. Escalation to the Principal is available if unresolved in 30 days.",
      },
      {
        title: "Scholarships and financial aid",
        category: "Fees",
        content:
          "Merit scholarships cover 25% to 100% of tuition based on entrance rank and CGPA. Need-based aid covers up to 75% of tuition plus hostel. Applications open at the start of each academic year and close in the second week of August. A CGPA above 8.0 is required for renewal. National scholarships are processed through the fees office with documents verified in the ERP portal.",
      },
      {
        title: "IT and Wi-Fi policy",
        category: "Support",
        content:
          "Campus Wi-Fi is available in all academic buildings and hostels under SSIDs CampusNet and CampusNet-Res. One device limit per student on the residential network. Password resets are self-service via the ERP portal. File sharing on P2P networks is prohibited. Report lost devices to IT support to suspend network access. Labs are open 8 AM to 8 PM; the programming lab stays open until midnight during project weeks.",
      },
      {
        title: "Xceed learning module guide",
        category: "Support",
        content:
          "Xceed is the institute's learning and events platform. Each course has a class page with announcements, assignments, and attendance. Assignment deadlines trigger notifications; grades appear there first before the ERP results page updates. Event and club listings, including fest registrations, also live on Xceed.",
      },
      {
        title: "Guest house booking policy",
        category: "Guest House",
        content:
          "The institute has three guest houses: Main Guest House (near Shopping Complex, 8 rooms, Rs 800 per day for official guests and Rs 1000 for private guests), SAC Guest House (Student Activities Centre, 6 rooms, Rs 600 per day) and Mega Hostel Guest House (near Mega Boys Hostel, 6 rooms, Rs 600 per day). Check-in is 12 PM and check-out 11 AM. Bookings are allowed up to 15 days in advance from the check-in date. Alcohol is not allowed. All rooms are double-bed capacity. All visitors must carry and produce a valid original photo ID at check-in. Cancellation: 25% of the booking amount is charged if cancelled more than 24 hours before the 12 PM check-in time, 50% within 24 hours before check-in, and no cancellation is allowed after check-in or on no-show. Refunds take up to 14 working days. The institute may cancel any booking for official purposes with a full refund.",
      },
      {
        title: "Complaint portal guide",
        category: "Support",
        content:
          "Non-academic issues — electrical, plumbing, civil or furniture, housekeeping, internet or LAN, mess and food, library, and security — are registered through the ERP Complaint Portal. A complaint needs the complaint type, location, room number, and description; a photo screenshot can be attached. Complaints are acknowledged within 48 hours and trackable under My Complaints until resolved. Emergency facility failures should also be reported to the hostel warden directly.",
      },
      {
        title: "Equipment booking rules",
        category: "Support",
        content:
          "Projectors, laptops, cameras, tripods, PA systems, oscilloscopes, and function generators are booked through the ERP Equipment Booking module with a stated purpose and required date. Internal users book with their official institute email. Equipment must be returned in the same condition; late returns block future bookings. A faculty endorsement is needed for high-value items like cameras and oscilloscopes. Transactions history in the module shows all past bookings.",
      },
      {
        title: "CONNECT — Student Wellness Program",
        category: "Wellness",
        content:
          "CONNECT is the institute's Student Wellness Program. It provides a robust support system for students dealing with anxiety, depression, stress, fear of missing out (FOMO), and related challenges, and offers confidential conversations to share hidden emotions in a supportive, empathetic environment. Do not use CONNECT for academic or career-related queries — those go to mentors and the training and placement cell. Requests are submitted through the ERP Connect Portal and are confidential.",
      },
      {
        title: "Examination registrations (carry, makeup, supplementary)",
        category: "Examinations",
        content:
          "The ERP Academic Module handles carry subject registration, summer course registration, make-up exam registration, I-grade exam registration, supplementary exam registration, and special exam registration. Make-up exams are for students who missed a scheduled exam on medical or sanctioned grounds, with proof attached within 7 days. Carry subject rules apply when a course cannot be cleared alongside the regular load; at most two carry courses may run at once. Supplementary exams run once per academic year for failed courses. Registrations close one week before the exam window.",
      },
      {
        title: "Mess and mess advance payment",
        category: "Hostel",
        content:
          "The mess runs on a monthly advancing payment model through the ERP Academic Module's Mess Advance Payment page. Mess rebates require an application at least 3 days in advance with a minimum rebate period of 3 days. Monthly mess bills are displayed on the ERP portal and unpaid mess dues are added to the semester fee. Menu changes are routed through the mess committee with the warden's sign-off.",
      },
    ];

    for (const doc of docs) {
      await ctx.db.insert("documents", {
        title: doc.title,
        category: doc.category,
        content: doc.content,
        createdAt: Date.now(),
      });
    }
  },
});
