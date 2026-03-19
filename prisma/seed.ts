// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

async function hash(password: string) {
  return bcrypt.hash(password, 10);
}

/** Build a sessionDatetime from a date + "HH:MM" string */
function toSessionDatetime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const d = new Date(date);
  d.setHours(h, m, 0, 0);
  return d;
}

/** Return every occurrence of `dayOfWeek` within a given month/year */
function sessionsInMonth(
  year: number,
  month: number, // 1-based
  dayOfWeek: number // 0 = Sun, 1 = Mon … 6 = Sat
): Date[] {
  const dates: Date[] = [];
  const d = new Date(year, month - 1, 1);
  while (d.getMonth() === month - 1) {
    if (d.getDay() === dayOfWeek) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────

async function main() {
  console.log("🌱  Seeding Royal Academy database…");

  // ── 1. USERS ──────────────────────────────────────────────────────────────

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@royalacademy.om" },
    update: {},
    create: {
      email: "admin@royalacademy.om",
      phone: "+96891000001",
      passwordHash: await hash("Admin@1234"),
      role: "ADMIN",
      isActive: true,
      isVerified: true,
      adminProfile: {
        create: { firstName: "Sara", lastName: "Al-Balushi" },
      },
    },
  });

  // Teachers
  const teacherUser1 = await prisma.user.upsert({
    where: { email: "layla@royalacademy.om" },
    update: {},
    create: {
      email: "layla@royalacademy.om",
      phone: "+96891000002",
      passwordHash: await hash("Teacher@1234"),
      role: "TEACHER",
      isActive: true,
      isVerified: true,
    },
  });

  const teacherUser2 = await prisma.user.upsert({
    where: { email: "omar@royalacademy.om" },
    update: {},
    create: {
      email: "omar@royalacademy.om",
      phone: "+96891000003",
      passwordHash: await hash("Teacher@1234"),
      role: "TEACHER",
      isActive: true,
      isVerified: true,
    },
  });

  const teacherUser3 = await prisma.user.upsert({
    where: { email: "nadia@royalacademy.om" },
    update: {},
    create: {
      email: "nadia@royalacademy.om",
      phone: "+96891000004",
      passwordHash: await hash("Teacher@1234"),
      role: "TEACHER",
      isActive: true,
      isVerified: true,
    },
  });

  // A teacher without a user account (admin-created only)
  // Students
  const studentUser1 = await prisma.user.upsert({
    where: { email: "ahmed@example.com" },
    update: {},
    create: {
      email: "ahmed@example.com",
      phone: "+96892000001",
      passwordHash: await hash("Student@1234"),
      role: "STUDENT",
      isActive: true,
      isVerified: true,
    },
  });

  const studentUser2 = await prisma.user.upsert({
    where: { email: "fatima@example.com" },
    update: {},
    create: {
      email: "fatima@example.com",
      phone: "+96892000002",
      passwordHash: await hash("Student@1234"),
      role: "STUDENT",
      isActive: true,
      isVerified: true,
    },
  });

  const studentUser3 = await prisma.user.upsert({
    where: { email: "khalid@example.com" },
    update: {},
    create: {
      email: "khalid@example.com",
      phone: "+96892000003",
      passwordHash: await hash("Student@1234"),
      role: "STUDENT",
      isActive: true,
      isVerified: true,
    },
  });

  const studentUser4 = await prisma.user.upsert({
    where: { email: "maryam@example.com" },
    update: {},
    create: {
      email: "maryam@example.com",
      phone: "+96892000004",
      passwordHash: await hash("Student@1234"),
      role: "STUDENT",
      isActive: true,
      isVerified: true,
    },
  });

  console.log("  ✓ Users created");

  // ── 2. TEACHER PROFILES ───────────────────────────────────────────────────

  const teacher1 = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser1.id },
    update: {},
    create: {
      userId: teacherUser1.id,
      firstName: "Layla",
      lastName: "Al-Rashdi",
      bio: "Professional pianist with 12 years of teaching experience. Trained at the Royal Conservatoire of Scotland.",
      specialties: ["Piano", "Music Theory", "Classical"],
      isAvailable: true,
      isActive: true,
    },
  });

  const teacher2 = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser2.id },
    update: {},
    create: {
      userId: teacherUser2.id,
      firstName: "Omar",
      lastName: "Al-Hinai",
      bio: "Contemporary and hip-hop dance instructor. Performed internationally and teaches all ages.",
      specialties: ["Hip-Hop", "Contemporary", "Dance Fitness"],
      isAvailable: true,
      isActive: true,
    },
  });

  const teacher3 = await prisma.teacherProfile.upsert({
    where: { userId: teacherUser3.id },
    update: {},
    create: {
      userId: teacherUser3.id,
      firstName: "Nadia",
      lastName: "Al-Farsi",
      bio: "Classical ballet dancer and certified RAD teacher. Specialises in children and teen ballet.",
      specialties: ["Ballet", "Contemporary", "Stretching"],
      isAvailable: true,
      isActive: true,
    },
  });

  // Admin-created teacher (no user account)
  const teacher4 = await prisma.teacherProfile.upsert({
    where: { id: "teacher4-seed-id" },
    update: {},
    create: {
      id: "teacher4-seed-id",
      userId: null,
      firstName: "Yusuf",
      lastName: "Al-Lawati",
      bio: "Oud and Arabic music specialist. Over 15 years of performing and teaching traditional Omani music.",
      specialties: ["Oud", "Arabic Music Theory", "Maqam"],
      isAvailable: true,
      isActive: true,
    },
  });

  console.log("  ✓ Teacher profiles created");

  // ── 3. TEACHER AVAILABILITY ───────────────────────────────────────────────

  const availabilityData = [
    // Layla — Mon/Wed/Sat
    { teacherId: teacher1.id, dayOfWeek: "MONDAY" as const,    startTime: "09:00", endTime: "17:00" },
    { teacherId: teacher1.id, dayOfWeek: "WEDNESDAY" as const, startTime: "09:00", endTime: "17:00" },
    { teacherId: teacher1.id, dayOfWeek: "SATURDAY" as const,  startTime: "09:00", endTime: "14:00" },
    // Omar — Tue/Thu/Fri
    { teacherId: teacher2.id, dayOfWeek: "TUESDAY" as const,   startTime: "10:00", endTime: "18:00" },
    { teacherId: teacher2.id, dayOfWeek: "THURSDAY" as const,  startTime: "10:00", endTime: "18:00" },
    { teacherId: teacher2.id, dayOfWeek: "FRIDAY" as const,    startTime: "14:00", endTime: "20:00" },
    // Nadia — Mon/Wed/Thu
    { teacherId: teacher3.id, dayOfWeek: "MONDAY" as const,    startTime: "10:00", endTime: "17:00" },
    { teacherId: teacher3.id, dayOfWeek: "WEDNESDAY" as const, startTime: "10:00", endTime: "17:00" },
    { teacherId: teacher3.id, dayOfWeek: "THURSDAY" as const,  startTime: "10:00", endTime: "17:00" },
    // Yusuf — Wed/Sat/Sun
    { teacherId: teacher4.id, dayOfWeek: "WEDNESDAY" as const, startTime: "11:00", endTime: "19:00" },
    { teacherId: teacher4.id, dayOfWeek: "SATURDAY" as const,  startTime: "10:00", endTime: "16:00" },
    { teacherId: teacher4.id, dayOfWeek: "SUNDAY" as const,    startTime: "10:00", endTime: "16:00" },
  ];

  for (const a of availabilityData) {
    await prisma.teacherAvailability.upsert({
      where: {
        id: `avail-${a.teacherId}-${a.dayOfWeek}`,
      },
      update: {},
      create: {
        id: `avail-${a.teacherId}-${a.dayOfWeek}`,
        ...a,
        isActive: true,
      },
    });
  }

  console.log("  ✓ Teacher availability created");

  // ── 4. STUDENT PROFILES ───────────────────────────────────────────────────

  const student1 = await prisma.studentProfile.upsert({
    where: { userId: studentUser1.id },
    update: {},
    create: {
      userId: studentUser1.id,
      firstName: "Ahmed",
      lastName: "Al-Balushi",
      dateOfBirth: new Date("1998-04-15"),
      gender: "MALE",
      city: "Muscat",
      country: "Oman",
      emergencyContactName: "Khalid Al-Balushi",
      emergencyContactPhone: "+96899000001",
      emergencyRelationship: "Father",
      hasMedicalCondition: false,
      agreePolicy: true,
      preferredTrack: "MUSIC",
      experience: "LESS_THAN_ONE_YEAR",
    },
  });

  const student2 = await prisma.studentProfile.upsert({
    where: { userId: studentUser2.id },
    update: {},
    create: {
      userId: studentUser2.id,
      firstName: "Fatima",
      lastName: "Al-Zadjali",
      dateOfBirth: new Date("2005-11-22"),
      gender: "FEMALE",
      city: "Muscat",
      country: "Oman",
      emergencyContactName: "Hessa Al-Zadjali",
      emergencyContactPhone: "+96899000002",
      emergencyRelationship: "Mother",
      hasMedicalCondition: false,
      agreePolicy: true,
      preferredTrack: "DANCE",
      experience: "NO_EXPERIENCE",
    },
  });

  const student3 = await prisma.studentProfile.upsert({
    where: { userId: studentUser3.id },
    update: {},
    create: {
      userId: studentUser3.id,
      firstName: "Khalid",
      lastName: "Al-Rawahi",
      dateOfBirth: new Date("1995-07-30"),
      gender: "MALE",
      city: "Muscat",
      country: "Oman",
      emergencyContactName: "Salim Al-Rawahi",
      emergencyContactPhone: "+96899000003",
      emergencyRelationship: "Brother",
      hasMedicalCondition: false,
      agreePolicy: true,
      preferredTrack: "MUSIC",
      experience: "MORE_THAN_ONE_YEAR",
    },
  });

  const student4 = await prisma.studentProfile.upsert({
    where: { userId: studentUser4.id },
    update: {},
    create: {
      userId: studentUser4.id,
      firstName: "Maryam",
      lastName: "Al-Habsi",
      dateOfBirth: new Date("2008-03-10"),
      gender: "FEMALE",
      city: "Muscat",
      country: "Oman",
      emergencyContactName: "Aisha Al-Habsi",
      emergencyContactPhone: "+96899000004",
      emergencyRelationship: "Mother",
      hasMedicalCondition: false,
      agreePolicy: true,
      preferredTrack: "DANCE",
      experience: "NO_EXPERIENCE",
    },
  });

  console.log("  ✓ Student profiles created");

  // ── 5. CLASSES ────────────────────────────────────────────────────────────

  const classMusic = await prisma.class.upsert({
    where: { id: "class-music" },
    update: {},
    create: {
      id: "class-music",
      name: "Music",
      description: "Instrumental and vocal lessons for all ages and skill levels.",
      isActive: true,
      sortOrder: 1,
    },
  });

  const classDance = await prisma.class.upsert({
    where: { id: "class-dance" },
    update: {},
    create: {
      id: "class-dance",
      name: "Dance & Wellness",
      description: "Contemporary, ballet, hip-hop, and wellness movement classes.",
      isActive: true,
      sortOrder: 2,
    },
  });

  const classArt = await prisma.class.upsert({
    where: { id: "class-art" },
    update: {},
    create: {
      id: "class-art",
      name: "Art",
      description: "Visual arts, painting, drawing, and mixed media for all levels.",
      isActive: true,
      sortOrder: 3,
    },
  });

  console.log("  ✓ Classes created");

  // ── 6. SUBCLASSES ─────────────────────────────────────────────────────────

  // MUSIC — private/reschedulable
  const subPiano = await prisma.subClass.upsert({
    where: { id: "sub-piano" },
    update: {},
    create: {
      id: "sub-piano",
      classId: classMusic.id,
      name: "Piano",
      description: "One-on-one piano lessons tailored to the student's pace and goals.",
      capacity: 1,
      durationMinutes: 60,
      price: 35,
      currency: "OMR",
      level: "All Levels",
      ageGroup: "All Ages",
      isActive: true,
      sessionType: "PRIVATE",
      oncePriceMonthly: 35,
      twicePriceMonthly: 60,
      trialPrice: 10,
      isTrialAvailable: true,
      isReschedulable: true,   // ← private lesson
    },
  });

  const subOud = await prisma.subClass.upsert({
    where: { id: "sub-oud" },
    update: {},
    create: {
      id: "sub-oud",
      classId: classMusic.id,
      name: "Oud",
      description: "Traditional Omani Oud lessons from foundation to advanced Maqam.",
      capacity: 1,
      durationMinutes: 60,
      price: 35,
      currency: "OMR",
      level: "All Levels",
      ageGroup: "All Ages",
      isActive: true,
      sessionType: "PRIVATE",
      oncePriceMonthly: 35,
      twicePriceMonthly: 60,
      trialPrice: 10,
      isTrialAvailable: true,
      isReschedulable: true,   // ← private lesson
    },
  });

  const subMusicAwakening = await prisma.subClass.upsert({
    where: { id: "sub-music-awakening" },
    update: {},
    create: {
      id: "sub-music-awakening",
      classId: classMusic.id,
      name: "Music Awakening",
      description: "Fun group music exploration for kids aged 3–6. Rhythm, song, and movement.",
      capacity: 10,
      durationMinutes: 45,
      price: 20,
      currency: "OMR",
      level: "Beginner",
      ageGroup: "Kids",
      isActive: true,
      sessionType: "PUBLIC",
      oncePriceMonthly: 20,
      twicePriceMonthly: 35,
      trialPrice: 10,
      isTrialAvailable: true,
      isReschedulable: false,  // ← group/public class
    },
  });

  // DANCE — mix of public and private
  const subHipHop = await prisma.subClass.upsert({
    where: { id: "sub-hiphop" },
    update: {},
    create: {
      id: "sub-hiphop",
      classId: classDance.id,
      name: "Hip-Hop",
      description: "High-energy hip-hop dance for teens and adults. No prior experience needed.",
      capacity: 15,
      durationMinutes: 60,
      price: 18,
      currency: "OMR",
      level: "Beginner",
      ageGroup: "Teens & Adults",
      isActive: true,
      sessionType: "PUBLIC",
      oncePriceMonthly: 18,
      twicePriceMonthly: 30,
      trialPrice: 10,
      isTrialAvailable: true,
      isReschedulable: false,  // ← group/public class
    },
  });

  const subBallet = await prisma.subClass.upsert({
    where: { id: "sub-ballet" },
    update: {},
    create: {
      id: "sub-ballet",
      classId: classDance.id,
      name: "Ballet",
      description: "Classical ballet technique for children and teens. RAD syllabus.",
      capacity: 12,
      durationMinutes: 60,
      price: 22,
      currency: "OMR",
      level: "All Levels",
      ageGroup: "Kids & Teens",
      isActive: true,
      sessionType: "PUBLIC",
      oncePriceMonthly: 22,
      twicePriceMonthly: 38,
      trialPrice: 10,
      isTrialAvailable: true,
      isReschedulable: false,  // ← group/public class
    },
  });

  const subPrivateDance = await prisma.subClass.upsert({
    where: { id: "sub-private-dance" },
    update: {},
    create: {
      id: "sub-private-dance",
      classId: classDance.id,
      name: "Private Dance",
      description: "One-on-one private dance coaching. Any style, any level.",
      capacity: 1,
      durationMinutes: 60,
      price: 40,
      currency: "OMR",
      level: "All Levels",
      ageGroup: "All Ages",
      isActive: true,
      sessionType: "PRIVATE",
      oncePriceMonthly: 40,
      twicePriceMonthly: 70,
      trialPrice: 10,
      isTrialAvailable: true,
      isReschedulable: true,   // ← private lesson
    },
  });

  // ART — public
  const subArtStudio = await prisma.subClass.upsert({
    where: { id: "sub-art-studio" },
    update: {},
    create: {
      id: "sub-art-studio",
      classId: classArt.id,
      name: "Art Studio",
      description: "Mixed-media visual arts for all ages. Painting, drawing, and sculpture.",
      capacity: 12,
      durationMinutes: 90,
      price: 20,
      currency: "OMR",
      level: "All Levels",
      ageGroup: "All Ages",
      isActive: true,
      sessionType: "PUBLIC",
      oncePriceMonthly: 20,
      twicePriceMonthly: 35,
      trialPrice: 10,
      isTrialAvailable: true,
      isReschedulable: false,  // ← group/public class
    },
  });

  console.log("  ✓ SubClasses created");

  // ── 7. SUBCLASS–TEACHER ASSIGNMENTS ──────────────────────────────────────

  const subClassTeacherPairs = [
    { teacherId: teacher1.id, subClassId: subPiano.id },
    { teacherId: teacher4.id, subClassId: subOud.id },
    { teacherId: teacher1.id, subClassId: subMusicAwakening.id },
    { teacherId: teacher2.id, subClassId: subHipHop.id },
    { teacherId: teacher3.id, subClassId: subBallet.id },
    { teacherId: teacher2.id, subClassId: subPrivateDance.id },
    { teacherId: teacher3.id, subClassId: subArtStudio.id },
  ];

  for (const pair of subClassTeacherPairs) {
    await prisma.subClassTeacher.upsert({
      where: { teacherId_subClassId: pair },
      update: {},
      create: pair,
    });
  }

  console.log("  ✓ SubClass–Teacher assignments created");

  // ── 8. CLASS SCHEDULES ────────────────────────────────────────────────────

  const scheduleStartDate = new Date("2026-01-01");

  // Piano — Wednesday 10:00 (Layla, private)
  const schedulePiano = await prisma.classSchedule.upsert({
    where: { id: "sched-piano-wed" },
    update: {},
    create: {
      id: "sched-piano-wed",
      subClassId: subPiano.id,
      teacherId: teacher1.id,
      dayOfWeek: "WEDNESDAY",
      startTime: "10:00",
      endTime: "11:00",
      startDate: scheduleStartDate,
      maxCapacity: 1,
      currentEnrolled: 1,
      isRecurring: true,
      status: "ACTIVE",
    },
  });

  // Oud — Saturday 11:00 (Yusuf, private)
  const scheduleOud = await prisma.classSchedule.upsert({
    where: { id: "sched-oud-sat" },
    update: {},
    create: {
      id: "sched-oud-sat",
      subClassId: subOud.id,
      teacherId: teacher4.id,
      dayOfWeek: "SATURDAY",
      startTime: "11:00",
      endTime: "12:00",
      startDate: scheduleStartDate,
      maxCapacity: 1,
      currentEnrolled: 0,
      isRecurring: true,
      status: "ACTIVE",
    },
  });

  // Music Awakening — Monday 09:30 (Layla, group)
  const scheduleMusicAwakening = await prisma.classSchedule.upsert({
    where: { id: "sched-music-awakening-mon" },
    update: {},
    create: {
      id: "sched-music-awakening-mon",
      subClassId: subMusicAwakening.id,
      teacherId: teacher1.id,
      dayOfWeek: "MONDAY",
      startTime: "09:30",
      endTime: "10:15",
      startDate: scheduleStartDate,
      maxCapacity: 10,
      currentEnrolled: 2,
      isRecurring: true,
      status: "ACTIVE",
    },
  });

  // Hip-Hop — Tuesday 17:00 (Omar, group)
  const scheduleHipHop = await prisma.classSchedule.upsert({
    where: { id: "sched-hiphop-tue" },
    update: {},
    create: {
      id: "sched-hiphop-tue",
      subClassId: subHipHop.id,
      teacherId: teacher2.id,
      dayOfWeek: "TUESDAY",
      startTime: "17:00",
      endTime: "18:00",
      startDate: scheduleStartDate,
      maxCapacity: 15,
      currentEnrolled: 3,
      isRecurring: true,
      status: "ACTIVE",
    },
  });

  // Ballet — Thursday 16:00 (Nadia, group)
  const scheduleBallet = await prisma.classSchedule.upsert({
    where: { id: "sched-ballet-thu" },
    update: {},
    create: {
      id: "sched-ballet-thu",
      subClassId: subBallet.id,
      teacherId: teacher3.id,
      dayOfWeek: "THURSDAY",
      startTime: "16:00",
      endTime: "17:00",
      startDate: scheduleStartDate,
      maxCapacity: 12,
      currentEnrolled: 1,
      isRecurring: true,
      status: "ACTIVE",
    },
  });

  // Private Dance — Thursday 18:00 (Omar, private)
  const schedulePrivateDance = await prisma.classSchedule.upsert({
    where: { id: "sched-private-dance-thu" },
    update: {},
    create: {
      id: "sched-private-dance-thu",
      subClassId: subPrivateDance.id,
      teacherId: teacher2.id,
      dayOfWeek: "THURSDAY",
      startTime: "18:00",
      endTime: "19:00",
      startDate: scheduleStartDate,
      maxCapacity: 1,
      currentEnrolled: 1,
      isRecurring: true,
      status: "ACTIVE",
    },
  });

  console.log("  ✓ Class schedules created");

  // ── 9. CLASS SESSIONS (Jan + Feb + Mar 2026) ──────────────────────────────
  //
  // We generate ClassSession rows for each schedule for 3 months.
  // dayOfWeek → JS getDay() mapping:
  //   0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat

  type ScheduleSeed = {
    scheduleId: string;
    dayJs: number;
    startTime: string;
    endTime: string;
  };

  const schedulesToGenerate: ScheduleSeed[] = [
    { scheduleId: schedulePiano.id,         dayJs: 3, startTime: "10:00", endTime: "11:00" },
    { scheduleId: scheduleOud.id,           dayJs: 6, startTime: "11:00", endTime: "12:00" },
    { scheduleId: scheduleMusicAwakening.id,dayJs: 1, startTime: "09:30", endTime: "10:15" },
    { scheduleId: scheduleHipHop.id,        dayJs: 2, startTime: "17:00", endTime: "18:00" },
    { scheduleId: scheduleBallet.id,        dayJs: 4, startTime: "16:00", endTime: "17:00" },
    { scheduleId: schedulePrivateDance.id,  dayJs: 4, startTime: "18:00", endTime: "19:00" },
  ];

  const months = [
    { year: 2026, month: 1 },
    { year: 2026, month: 2 },
    { year: 2026, month: 3 },
  ];

  // Store created session ids keyed by scheduleId + ISO date string
  const sessionMap: Record<string, string> = {};

  for (const { scheduleId, dayJs, startTime, endTime } of schedulesToGenerate) {
    for (const { year, month } of months) {
      const dates = sessionsInMonth(year, month, dayJs);
      for (const date of dates) {
        const sessionDatetime = toSessionDatetime(date, startTime);
        const key = `${scheduleId}-${date.toISOString().slice(0, 10)}`;
        const session = await prisma.classSession.upsert({
          where: { id: key },
          update: {},
          create: {
            id: key,
            scheduleId,
            sessionDate: date,
            sessionDatetime,
            startTime,
            endTime,
            status: "ACTIVE",
          },
        });
        sessionMap[key] = session.id;
      }
    }
  }

  console.log(`  ✓ Class sessions created (${Object.keys(sessionMap).length} total)`);

  // ── 10. MONTHLY ENROLLMENTS ───────────────────────────────────────────────
  //
  // Ahmed → Piano, January 2026, once/week (single-month booking)
  // Khalid → Piano, Jan+Feb+Mar 2026, twice/week (multi-month booking)
  // Fatima → Hip-Hop, January 2026, once/week (single-month booking)
  // Maryam → Ballet, January 2026, once/week

  // Ahmed single-month
  const enrollAhmedPianoJan = await prisma.monthlyEnrollment.upsert({
    where: {
      studentId_subClassId_month_year: {
        studentId: student1.id,
        subClassId: subPiano.id,
        month: 1,
        year: 2026,
      },
    },
    update: {},
    create: {
      studentId: student1.id,
      subClassId: subPiano.id,
      month: 1,
      year: 2026,
      frequency: "ONCE_PER_WEEK",
      preferredDays: ["WEDNESDAY"],
      status: "CONFIRMED",
      totalAmount: 35,
      currency: "OMR",
    },
  });

  await prisma.monthlyPayment.upsert({
    where: { enrollmentId: enrollAhmedPianoJan.id },
    update: {},
    create: {
      enrollmentId: enrollAhmedPianoJan.id,
      amount: 35,
      currency: "OMR",
      status: "PAID",
      method: "CREDIT_CARD",
      paidAt: new Date("2025-12-28"),
    },
  });

  // Fatima single-month Hip-Hop Jan
  const enrollFatimaHipHopJan = await prisma.monthlyEnrollment.upsert({
    where: {
      studentId_subClassId_month_year: {
        studentId: student2.id,
        subClassId: subHipHop.id,
        month: 1,
        year: 2026,
      },
    },
    update: {},
    create: {
      studentId: student2.id,
      subClassId: subHipHop.id,
      month: 1,
      year: 2026,
      frequency: "ONCE_PER_WEEK",
      preferredDays: ["TUESDAY"],
      status: "CONFIRMED",
      totalAmount: 18,
      currency: "OMR",
    },
  });

  await prisma.monthlyPayment.upsert({
    where: { enrollmentId: enrollFatimaHipHopJan.id },
    update: {},
    create: {
      enrollmentId: enrollFatimaHipHopJan.id,
      amount: 18,
      currency: "OMR",
      status: "PAID",
      method: "DEBIT_CARD",
      paidAt: new Date("2025-12-29"),
    },
  });

  // Maryam Ballet Jan
  const enrollMaryamBalletJan = await prisma.monthlyEnrollment.upsert({
    where: {
      studentId_subClassId_month_year: {
        studentId: student4.id,
        subClassId: subBallet.id,
        month: 1,
        year: 2026,
      },
    },
    update: {},
    create: {
      studentId: student4.id,
      subClassId: subBallet.id,
      month: 1,
      year: 2026,
      frequency: "ONCE_PER_WEEK",
      preferredDays: ["THURSDAY"],
      status: "CONFIRMED",
      totalAmount: 22,
      currency: "OMR",
    },
  });

  await prisma.monthlyPayment.upsert({
    where: { enrollmentId: enrollMaryamBalletJan.id },
    update: {},
    create: {
      enrollmentId: enrollMaryamBalletJan.id,
      amount: 22,
      currency: "OMR",
      status: "PAID",
      method: "BANK_TRANSFER",
      paidAt: new Date("2025-12-30"),
    },
  });

  console.log("  ✓ Single-month enrollments created");

  // ── 11. MULTI-MONTH ENROLLMENT (Khalid → Piano × 3 months) ───────────────

  const multiEnrollKhalidPiano = await prisma.multiMonthEnrollment.upsert({
    where: { id: "multi-khalid-piano-jan-mar" },
    update: {},
    create: {
      id: "multi-khalid-piano-jan-mar",
      studentId: student3.id,
      subClassId: subPiano.id,
      frequency: "TWICE_PER_WEEK",
      preferredDays: ["WEDNESDAY"],
      startMonth: 1,
      startYear: 2026,
      endMonth: 3,
      endYear: 2026,
      totalMonths: 3,
      totalAmount: 180, // 60 OMR × 3 months (twice/week price)
      currency: "OMR",
      status: "CONFIRMED",
    },
  });

  await prisma.multiMonthPayment.upsert({
    where: { multiMonthEnrollmentId: multiEnrollKhalidPiano.id },
    update: {},
    create: {
      multiMonthEnrollmentId: multiEnrollKhalidPiano.id,
      amount: 180,
      currency: "OMR",
      status: "PAID",
      method: "CREDIT_CARD",
      paidAt: new Date("2025-12-27"),
    },
  });

  // Create the three child MonthlyEnrollment rows linked to the parent
  const khalidMonths = [
    { month: 1, year: 2026 },
    { month: 2, year: 2026 },
    { month: 3, year: 2026 },
  ];

  for (const { month, year } of khalidMonths) {
    await prisma.monthlyEnrollment.upsert({
      where: {
        studentId_subClassId_month_year: {
          studentId: student3.id,
          subClassId: subPiano.id,
          month,
          year,
        },
      },
      update: {},
      create: {
        studentId: student3.id,
        subClassId: subPiano.id,
        month,
        year,
        frequency: "TWICE_PER_WEEK",
        preferredDays: ["WEDNESDAY"],
        status: "CONFIRMED",
        totalAmount: 60,
        currency: "OMR",
        multiMonthEnrollmentId: multiEnrollKhalidPiano.id,
      },
    });
  }

  console.log("  ✓ Multi-month enrollment created (Khalid, Piano, Jan–Mar)");

  // ── 12. BOOKINGS for January sessions ────────────────────────────────────
  //
  // We create Booking rows for every January session for each enrolled student.
  // Piano Wednesday sessions in January 2026: 7, 14, 21, 28

  const pianoWedJanDates = sessionsInMonth(2026, 1, 3); // 3 = Wednesday

  // Ahmed's Piano bookings (Jan, enrolled)
  const ahmedPianoBookings: { id: string; sessionId: string }[] = [];
  for (const date of pianoWedJanDates) {
    const sessionKey = `${schedulePiano.id}-${date.toISOString().slice(0, 10)}`;
    const sessionId = sessionMap[sessionKey];
    if (!sessionId) continue;
    const bookingId = `booking-ahmed-piano-${date.toISOString().slice(0, 10)}`;
    await prisma.booking.upsert({
      where: { id: bookingId },
      update: {},
      create: {
        id: bookingId,
        studentId: student1.id,
        sessionId,
        status: "CONFIRMED",
        canCancel: true,
      },
    });
    ahmedPianoBookings.push({ id: bookingId, sessionId });
  }

  // Khalid's Piano bookings (Jan, multi-month)
  for (const date of pianoWedJanDates) {
    const sessionKey = `${schedulePiano.id}-${date.toISOString().slice(0, 10)}`;
    const sessionId = sessionMap[sessionKey];
    if (!sessionId) continue;
    const bookingId = `booking-khalid-piano-${date.toISOString().slice(0, 10)}`;
    await prisma.booking.upsert({
      where: { id: bookingId },
      update: {},
      create: {
        id: bookingId,
        studentId: student3.id,
        sessionId,
        status: "CONFIRMED",
        canCancel: true,
      },
    });
  }

  // Hip-Hop Tuesday sessions in Jan 2026
  const hipHopTueDates = sessionsInMonth(2026, 1, 2);
  for (const date of hipHopTueDates) {
    const sessionKey = `${scheduleHipHop.id}-${date.toISOString().slice(0, 10)}`;
    const sessionId = sessionMap[sessionKey];
    if (!sessionId) continue;
    const bookingId = `booking-fatima-hiphop-${date.toISOString().slice(0, 10)}`;
    await prisma.booking.upsert({
      where: { id: bookingId },
      update: {},
      create: {
        id: bookingId,
        studentId: student2.id,
        sessionId,
        status: "CONFIRMED",
        canCancel: false, // group class — no cancel
      },
    });
  }

  // Ballet Thursday sessions in Jan 2026
  const balletThuDates = sessionsInMonth(2026, 1, 4);
  for (const date of balletThuDates) {
    const sessionKey = `${scheduleBallet.id}-${date.toISOString().slice(0, 10)}`;
    const sessionId = sessionMap[sessionKey];
    if (!sessionId) continue;
    const bookingId = `booking-maryam-ballet-${date.toISOString().slice(0, 10)}`;
    await prisma.booking.upsert({
      where: { id: bookingId },
      update: {},
      create: {
        id: bookingId,
        studentId: student4.id,
        sessionId,
        status: "CONFIRMED",
        canCancel: false,
      },
    });
  }

  console.log("  ✓ January bookings created");

  // ── 13. RESCHEDULE SCENARIO ───────────────────────────────────────────────
  //
  // Ahmed reschedules his 2nd Piano session (Jan 14) to Jan 21.
  // Jan 14 booking → RESCHEDULED
  // Jan 21 booking → new booking (status CONFIRMED)
  // RescheduleLog row created.
  //
  // Note: this is illustrative. In a real scenario Jan 21 would already have a
  // booking, so the server would handle the capacity check first. Here we mark
  // the Jan 14 booking as RESCHEDULED and log it.

  const jan14Key = `${schedulePiano.id}-2026-01-14`;
  const jan21Key = `${schedulePiano.id}-2026-01-21`;
  const oldBookingId = `booking-ahmed-piano-2026-01-14`;
  const newReschedBookingId = `booking-ahmed-piano-resched-2026-01-21`;

  if (sessionMap[jan14Key] && sessionMap[jan21Key]) {
    // Mark old booking as rescheduled
    await prisma.booking.update({
      where: { id: oldBookingId },
      data: {
        status: "RESCHEDULED",
        rescheduledFrom: oldBookingId,
        canCancel: false,
      },
    });

    // Create new booking for the rescheduled slot
    const reschedNewBooking = await prisma.booking.upsert({
      where: { id: newReschedBookingId },
      update: {},
      create: {
        id: newReschedBookingId,
        studentId: student1.id,
        sessionId: sessionMap[jan21Key],
        status: "CONFIRMED",
        rescheduledFrom: oldBookingId,
        canCancel: true,
      },
    });

    // Write the audit log row
    await prisma.rescheduleLog.upsert({
      where: { id: "resched-ahmed-jan14-to-jan21" },
      update: {},
      create: {
        id: "resched-ahmed-jan14-to-jan21",
        studentId: student1.id,
        oldBookingId,
        newBookingId: reschedNewBooking.id,
        oldSessionId: sessionMap[jan14Key],
        newSessionId: sessionMap[jan21Key],
        wasLost: false,
      },
    });
  }

  console.log("  ✓ Reschedule scenario created");

  // ── 14. TRIAL BOOKING ─────────────────────────────────────────────────────
  //
  // Fatima books a trial for Ballet (first Thursday in Jan)

  const balletTrialDate = balletThuDates[0];
  const balletTrialSessionKey = `${scheduleBallet.id}-${balletTrialDate.toISOString().slice(0, 10)}`;
  const balletTrialSessionId = sessionMap[balletTrialSessionKey];

  if (balletTrialSessionId) {
    const trialBooking = await prisma.trialBooking.upsert({
      where: {
        studentId_subClassId: {
          studentId: student2.id,
          subClassId: subBallet.id,
        },
      },
      update: {},
      create: {
        studentId: student2.id,
        subClassId: subBallet.id,
        sessionId: balletTrialSessionId,
        status: "CONFIRMED",
      },
    });

    await prisma.payment.upsert({
      where: { id: `payment-trial-fatima-ballet` },
      update: {},
      create: {
        id: `payment-trial-fatima-ballet`,
        trialBookingId: trialBooking.id,
        amount: 10,
        currency: "OMR",
        status: "PAID",
        method: "CREDIT_CARD",
        paidAt: new Date("2025-12-31"),
      },
    });
  }

  console.log("  ✓ Trial booking created");

  // ── 15. WORKSHOP ──────────────────────────────────────────────────────────

  const workshop1 = await prisma.workshop.upsert({
    where: { id: "workshop-hip-hop-special" },
    update: {},
    create: {
      id: "workshop-hip-hop-special",
      title: "Hip-Hop Intensive Workshop",
      description:
        "A full-day hip-hop workshop covering choreography, freestyle, and battle techniques. Open to all levels.",
      teacherId: teacher2.id,
      eventDate: new Date("2026-02-14"),
      startTime: "10:00",
      endTime: "17:00",
      capacity: 20,
      price: 25,
      currency: "OMR",
      isActive: true,
    },
  });

  // Ahmed books the workshop
  const workshopBooking = await prisma.workshopBooking.upsert({
    where: {
      workshopId_studentId: {
        workshopId: workshop1.id,
        studentId: student1.id,
      },
    },
    update: {},
    create: {
      workshopId: workshop1.id,
      studentId: student1.id,
      status: "CONFIRMED",
    },
  });

  await prisma.payment.upsert({
    where: { id: "payment-workshop-ahmed" },
    update: {},
    create: {
      id: "payment-workshop-ahmed",
      workshopBookingId: workshopBooking.id,
      amount: 25,
      currency: "OMR",
      status: "PAID",
      method: "CREDIT_CARD",
      paidAt: new Date("2026-01-15"),
    },
  });

  console.log("  ✓ Workshop and booking created");

  // ── 16. NOTIFICATIONS ─────────────────────────────────────────────────────

  await prisma.notification.createMany({
    skipDuplicates: true,
    data: [
      // Booking confirmation for Ahmed
      {
        id: "notif-ahmed-booking-confirm",
        userId: studentUser1.id,
        type: "EMAIL",
        status: "SENT",
        subject: "Your booking is confirmed — Piano, January 2026",
        body: "Hi Ahmed, your Piano lessons for January 2026 have been confirmed. See you on Wednesdays at 10:00!",
        sentAt: new Date("2025-12-28T09:00:00Z"),
      },
      // Reschedule notification for Ahmed
      {
        id: "notif-ahmed-reschedule",
        userId: studentUser1.id,
        type: "EMAIL",
        status: "SENT",
        subject: "Session rescheduled — Piano Jan 14 → Jan 21",
        body: "Hi Ahmed, your Piano session on January 14 has been rescheduled to January 21 at 10:00.",
        sentAt: new Date("2026-01-10T11:00:00Z"),
      },
      // Reschedule notification for admin
      {
        id: "notif-admin-reschedule",
        userId: adminUser.id,
        type: "BOTH",
        status: "SENT",
        subject: "Reschedule: Ahmed Al-Balushi — Piano Jan 14 → Jan 21",
        body: "Ahmed Al-Balushi has rescheduled his Piano session from January 14 to January 21 at 10:00.",
        sentAt: new Date("2026-01-10T11:00:00Z"),
      },
      // Reschedule SMS for teacher (Layla has a userId, so this is valid)
      {
        id: "notif-teacher-reschedule",
        userId: teacherUser1.id,
        type: "SMS",
        status: "SENT",
        subject: null,
        body: "Royal Academy: Ahmed Al-Balushi has rescheduled his Piano session from Jan 14 to Jan 21 at 10:00. Please confirm.",
        sentAt: new Date("2026-01-10T11:00:00Z"),
      },
      // Booking confirmation for Fatima
      {
        id: "notif-fatima-booking-confirm",
        userId: studentUser2.id,
        type: "EMAIL",
        status: "SENT",
        subject: "Your booking is confirmed — Hip-Hop, January 2026",
        body: "Hi Fatima, your Hip-Hop lessons for January 2026 have been confirmed. See you Tuesdays at 17:00!",
        sentAt: new Date("2025-12-29T09:00:00Z"),
      },
    ],
  });

  console.log("  ✓ Notifications created");

  // ── 17. SUPPORT TICKET ────────────────────────────────────────────────────

  const ticket1 = await prisma.supportTicket.upsert({
    where: { id: "ticket-khalid-001" },
    update: {},
    create: {
      id: "ticket-khalid-001",
      userId: studentUser3.id,
      subject: "Unable to access my multi-month booking details",
      body: "I booked Piano lessons for 3 months but I can only see January in my profile. Please help.",
      status: "RESOLVED",
      priority: "NORMAL",
    },
  });

  await prisma.ticketReply.upsert({
    where: { id: "ticket-reply-admin-001" },
    update: {},
    create: {
      id: "ticket-reply-admin-001",
      ticketId: ticket1.id,
      userId: adminUser.id,
      body: "Hi Khalid, thank you for reaching out. We've confirmed your multi-month booking is active for January through March. The profile view has been updated to show all three months. Please let us know if you need anything else.",
    },
  });

  console.log("  ✓ Support ticket created");

  // ── 18. AUDIT LOG ─────────────────────────────────────────────────────────

  await prisma.auditLog.createMany({
    data: [
      {
        userId: studentUser1.id,
        action: "BOOKING_CREATED",
        entity: "MonthlyEnrollment",
        entityId: enrollAhmedPianoJan.id,
        newValues: { month: 1, year: 2026, subClassId: subPiano.id },
        ipAddress: "10.0.0.1",
      },
      {
        userId: studentUser1.id,
        action: "BOOKING_RESCHEDULED",
        entity: "Booking",
        entityId: oldBookingId,
        oldValues: { status: "CONFIRMED", sessionId: sessionMap[jan14Key] },
        newValues: { status: "RESCHEDULED", sessionId: sessionMap[jan21Key] },
        ipAddress: "10.0.0.1",
      },
      {
        userId: adminUser.id,
        action: "SCHEDULE_CREATED",
        entity: "ClassSchedule",
        entityId: schedulePiano.id,
        newValues: { subClassId: subPiano.id, teacherId: teacher1.id, dayOfWeek: "WEDNESDAY" },
        ipAddress: "10.0.0.2",
      },
    ],
  });

  console.log("  ✓ Audit logs created");

  console.log("\n✅  Seed complete!\n");
  console.log("  Logins:");
  console.log("  Admin   → admin@royalacademy.om   / Admin@1234");
  console.log("  Teacher → layla@royalacademy.om   / Teacher@1234");
  console.log("  Teacher → omar@royalacademy.om    / Teacher@1234");
  console.log("  Teacher → nadia@royalacademy.om   / Teacher@1234");
  console.log("  Student → ahmed@example.com        / Student@1234");
  console.log("  Student → fatima@example.com       / Student@1234");
  console.log("  Student → khalid@example.com       / Student@1234");
  console.log("  Student → maryam@example.com       / Student@1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
