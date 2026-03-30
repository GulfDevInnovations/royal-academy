import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function hash(password: string) {
	return bcrypt.hash(password, 10);
}

function toSessionDatetime(date: Date, time: string): Date {
	const [hours, minutes] = time.split(":").map(Number);
	const d = new Date(date);
	d.setHours(hours, minutes, 0, 0);
	return d;
}

function addDays(base: Date, days: number): Date {
	const d = new Date(base);
	d.setDate(d.getDate() + days);
	return d;
}

async function main() {
	console.log("\n🌱  Running alternative seed (minimal-but-complete test data)…");

	// ── USERS (Admin / Teachers / Students) ───────────────────────────────────

	const adminUser = await prisma.user.upsert({
		where: { email: "alt-admin@royalacademy.om" },
		update: { role: "ADMIN", isActive: true, isVerified: true },
		create: {
			email: "alt-admin@royalacademy.om",
			phone: "+96891010001",
			passwordHash: await hash("Admin@1234"),
			role: "ADMIN",
			isActive: true,
			isVerified: true,
			adminProfile: {
				create: { firstName: "Alt", lastName: "Admin" },
			},
		},
	});

	const teacherUser1 = await prisma.user.upsert({
		where: { email: "alt-teacher1@royalacademy.om" },
		update: { role: "TEACHER", isActive: true, isVerified: true },
		create: {
			email: "alt-teacher1@royalacademy.om",
			phone: "+96891010002",
			passwordHash: await hash("Teacher@1234"),
			role: "TEACHER",
			isActive: true,
			isVerified: true,
		},
	});

	const teacherUser2 = await prisma.user.upsert({
		where: { email: "alt-teacher2@royalacademy.om" },
		update: { role: "TEACHER", isActive: true, isVerified: true },
		create: {
			email: "alt-teacher2@royalacademy.om",
			phone: "+96891010003",
			passwordHash: await hash("Teacher@1234"),
			role: "TEACHER",
			isActive: true,
			isVerified: true,
		},
	});

	const studentUser1 = await prisma.user.upsert({
		where: { email: "alt-student1@example.com" },
		update: { role: "STUDENT", isActive: true, isVerified: true },
		create: {
			email: "alt-student1@example.com",
			phone: "+96892010001",
			passwordHash: await hash("Student@1234"),
			role: "STUDENT",
			isActive: true,
			isVerified: true,
		},
	});

	const studentUser2 = await prisma.user.upsert({
		where: { email: "alt-student2@example.com" },
		update: { role: "STUDENT", isActive: true, isVerified: true },
		create: {
			email: "alt-student2@example.com",
			phone: "+96892010002",
			passwordHash: await hash("Student@1234"),
			role: "STUDENT",
			isActive: true,
			isVerified: true,
		},
	});

	// ── PROFILES ─────────────────────────────────────────────────────────────

	const teacher1 = await prisma.teacherProfile.upsert({
		where: { userId: teacherUser1.id },
		update: {},
		create: {
			userId: teacherUser1.id,
			firstName: "Alt",
			lastName: "Teacher One",
			bio: "Test teacher for end-to-end flows.",
			specialties: ["Hip-Hop", "Fitness"],
			isAvailable: true,
			isActive: true,
		},
	});

	const teacher2 = await prisma.teacherProfile.upsert({
		where: { userId: teacherUser2.id },
		update: {},
		create: {
			userId: teacherUser2.id,
			firstName: "Alt",
			lastName: "Teacher Two",
			bio: "Second test teacher.",
			specialties: ["Yoga", "Mobility"],
			isAvailable: true,
			isActive: true,
		},
	});

	// Admin-created teacher (no user account)
	const teacherNoUser = await prisma.teacherProfile.upsert({
		where: { id: "alt-teacher-no-user" },
		update: {},
		create: {
			id: "alt-teacher-no-user",
			userId: null,
			firstName: "Alt",
			lastName: "Guest Teacher",
			bio: "Teacher profile without a linked user account.",
			specialties: ["Workshop"],
			isAvailable: true,
			isActive: true,
		},
	});

	const student1 = await prisma.studentProfile.upsert({
		where: { userId: studentUser1.id },
		update: {},
		create: {
			userId: studentUser1.id,
			firstName: "Alt",
			lastName: "Student One",
			city: "Muscat",
			hasMedicalCondition: false,
			agreePolicy: true,
			preferredTrack: "DANCE",
			experience: "NO_EXPERIENCE",
			notes: "Seeded student for booking/payment tests.",
		},
	});

	const student2 = await prisma.studentProfile.upsert({
		where: { userId: studentUser2.id },
		update: {},
		create: {
			userId: studentUser2.id,
			firstName: "Alt",
			lastName: "Student Two",
			city: "Muscat",
			hasMedicalCondition: true,
			medicalConditionDetails: "Asthma (test data)",
			agreePolicy: true,
			preferredTrack: "MUSIC",
			experience: "LESS_THAN_ONE_YEAR",
		},
	});

	// ── CLASSES & SUBCLASSES ─────────────────────────────────────────────────

	const classDanceWellness = await prisma.class.upsert({
		where: { id: "alt-class-dance-wellness" },
		update: { isActive: true },
		create: {
			id: "alt-class-dance-wellness",
			name: "Dance & Wellness",
			description: "Alternative seed class for testing nested flows.",
			sortOrder: 10,
			isActive: true,
		},
	});

	const classMusic = await prisma.class.upsert({
		where: { id: "alt-class-music" },
		update: { isActive: true },
		create: {
			id: "alt-class-music",
			name: "Music",
			description: "Alternative seed music class.",
			sortOrder: 20,
			isActive: true,
		},
	});

	const subHipHop = await prisma.subClass.upsert({
		where: { id: "alt-sub-hiphop" },
		update: { isActive: true },
		create: {
			id: "alt-sub-hiphop",
			classId: classDanceWellness.id,
			name: "Hip-Hop",
			description: "Hip-Hop foundations and choreography.",
			capacity: 12,
			durationMinutes: 60,
			price: new Prisma.Decimal("25.00"),
			oncePriceMonthly: new Prisma.Decimal("90.00"),
			twicePriceMonthly: new Prisma.Decimal("160.00"),
			trialPrice: new Prisma.Decimal("10.00"),
			isTrialAvailable: true,
			sessionType: "PUBLIC",
			isReschedulable: false,
			isActive: true,
			level: "Beginner",
			ageGroup: "Teens & Adults",
		},
	});

	const subYoga = await prisma.subClass.upsert({
		where: { id: "alt-sub-yoga" },
		update: { isActive: true },
		create: {
			id: "alt-sub-yoga",
			classId: classDanceWellness.id,
			name: "Yoga",
			description: "Yoga flow for strength, mobility, and breath.",
			capacity: 14,
			durationMinutes: 60,
			price: new Prisma.Decimal("20.00"),
			oncePriceMonthly: new Prisma.Decimal("75.00"),
			twicePriceMonthly: new Prisma.Decimal("130.00"),
			trialPrice: new Prisma.Decimal("10.00"),
			isTrialAvailable: true,
			sessionType: "PUBLIC",
			isReschedulable: false,
			isActive: true,
			level: "All Levels",
			ageGroup: "Adults",
		},
	});

	const subPiano = await prisma.subClass.upsert({
		where: { id: "alt-sub-piano" },
		update: { isActive: true },
		create: {
			id: "alt-sub-piano",
			classId: classMusic.id,
			name: "Piano",
			description: "One-to-one piano lessons.",
			capacity: 1,
			durationMinutes: 45,
			price: new Prisma.Decimal("35.00"),
			oncePriceMonthly: new Prisma.Decimal("140.00"),
			twicePriceMonthly: new Prisma.Decimal("260.00"),
			trialPrice: new Prisma.Decimal("10.00"),
			isTrialAvailable: true,
			sessionType: "PUBLIC",
			isReschedulable: true,
			isActive: true,
			level: "Beginner",
			ageGroup: "Kids & Adults",
		},
	});

	await prisma.subClassTeacher.createMany({
		data: [
			{ teacherId: teacher1.id, subClassId: subHipHop.id },
			{ teacherId: teacher2.id, subClassId: subYoga.id },
			{ teacherId: teacher1.id, subClassId: subPiano.id },
			{ teacherId: teacherNoUser.id, subClassId: subHipHop.id },
		],
		skipDuplicates: true,
	});

	// ── AVAILABILITY ─────────────────────────────────────────────────────────

	const availabilitySeeds = [
		{
			id: `alt-avail-${teacher1.id}-MONDAY`,
			teacherId: teacher1.id,
			dayOfWeek: "MONDAY" as const,
			startTime: "10:00",
			endTime: "18:00",
		},
		{
			id: `alt-avail-${teacher2.id}-WEDNESDAY`,
			teacherId: teacher2.id,
			dayOfWeek: "WEDNESDAY" as const,
			startTime: "09:00",
			endTime: "17:00",
		},
	];

	for (const a of availabilitySeeds) {
		await prisma.teacherAvailability.upsert({
			where: { id: a.id },
			update: { isActive: true },
			create: { ...a, isActive: true },
		});
	}

	// ── SCHEDULES & SESSIONS (for reservation flows) ─────────────────────────

	const today = new Date();
	const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
	const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

	const hipHopSchedule = await prisma.classSchedule.upsert({
		where: { id: "alt-schedule-hiphop-mon" },
		update: { status: "ACTIVE" },
		create: {
			id: "alt-schedule-hiphop-mon",
			subClassId: subHipHop.id,
			teacherId: teacher1.id,
			dayOfWeek: "MONDAY",
			startTime: "17:00",
			endTime: "18:00",
			startDate,
			endDate,
			maxCapacity: 12,
			currentEnrolled: 0,
			isRecurring: true,
			status: "ACTIVE",
		},
	});

	const yogaSchedule = await prisma.classSchedule.upsert({
		where: { id: "alt-schedule-yoga-wed" },
		update: { status: "ACTIVE" },
		create: {
			id: "alt-schedule-yoga-wed",
			subClassId: subYoga.id,
			teacherId: teacher2.id,
			dayOfWeek: "WEDNESDAY",
			startTime: "16:00",
			endTime: "17:00",
			startDate,
			endDate,
			maxCapacity: 14,
			currentEnrolled: 0,
			isRecurring: true,
			status: "ACTIVE",
		},
	});

	const hipHopSessionDates = [addDays(today, 3), addDays(today, 10), addDays(today, 17)];
	for (let i = 0; i < hipHopSessionDates.length; i += 1) {
		const d = hipHopSessionDates[i];
		await prisma.classSession.upsert({
			where: { id: `alt-session-hiphop-${i + 1}` },
			update: { status: "ACTIVE" },
			create: {
				id: `alt-session-hiphop-${i + 1}`,
				scheduleId: hipHopSchedule.id,
				sessionDate: d,
				sessionDatetime: toSessionDatetime(d, hipHopSchedule.startTime),
				startTime: hipHopSchedule.startTime,
				endTime: hipHopSchedule.endTime,
				status: "ACTIVE",
			},
		});
	}

	const yogaSessionDates = [addDays(today, 5), addDays(today, 12)];
	for (let i = 0; i < yogaSessionDates.length; i += 1) {
		const d = yogaSessionDates[i];
		await prisma.classSession.upsert({
			where: { id: `alt-session-yoga-${i + 1}` },
			update: { status: "ACTIVE" },
			create: {
				id: `alt-session-yoga-${i + 1}`,
				scheduleId: yogaSchedule.id,
				sessionDate: d,
				sessionDatetime: toSessionDatetime(d, yogaSchedule.startTime),
				startTime: yogaSchedule.startTime,
				endTime: yogaSchedule.endTime,
				status: "ACTIVE",
			},
		});
	}

	const hipHopSession1 = await prisma.classSession.findUniqueOrThrow({
		where: { id: "alt-session-hiphop-1" },
	});

	const yogaSession1 = await prisma.classSession.findUniqueOrThrow({
		where: { id: "alt-session-yoga-1" },
	});

	// ── RESERVATIONS (Bookings + Trial + Workshop) ───────────────────────────

	const booking1 = await prisma.booking.upsert({
		where: {
			studentId_sessionId: { studentId: student1.id, sessionId: hipHopSession1.id },
		},
		update: { status: "CONFIRMED" },
		create: {
			studentId: student1.id,
			sessionId: hipHopSession1.id,
			status: "CONFIRMED",
			canCancel: true,
			notes: "Alt seed booking",
		},
	});

	await prisma.booking.upsert({
		where: {
			studentId_sessionId: { studentId: student2.id, sessionId: yogaSession1.id },
		},
		update: { status: "CONFIRMED" },
		create: {
			studentId: student2.id,
			sessionId: yogaSession1.id,
			status: "CONFIRMED",
			canCancel: true,
		},
	});

	const trial1 = await prisma.trialBooking.upsert({
		where: { studentId_subClassId: { studentId: student1.id, subClassId: subYoga.id } },
		update: { status: "CONFIRMED" },
		create: {
			studentId: student1.id,
			subClassId: subYoga.id,
			sessionId: yogaSession1.id,
			status: "CONFIRMED",
		},
	});

	const workshop = await prisma.workshop.upsert({
		where: { id: "alt-workshop-1" },
		update: { isActive: true },
		create: {
			id: "alt-workshop-1",
			title: "Alt Seed Workshop: Movement Lab",
			description: "One-off event for testing workshop booking + payments.",
			teacherId: teacherNoUser.id,
			eventDate: addDays(today, 21),
			startTime: "18:30",
			endTime: "20:00",
			capacity: 25,
			price: new Prisma.Decimal("15.00"),
			currency: "OMR",
			isActive: true,
		},
	});

	const workshopBooking = await prisma.workshopBooking.upsert({
		where: { workshopId_studentId: { workshopId: workshop.id, studentId: student2.id } },
		update: { status: "CONFIRMED" },
		create: {
			workshopId: workshop.id,
			studentId: student2.id,
			status: "CONFIRMED",
		},
	});

	// ── MONTHLY ENROLLMENT + MONTHLY PAYMENT ─────────────────────────────────

	const month = today.getMonth() + 1;
	const year = today.getFullYear();

	const monthlyEnrollment = await prisma.monthlyEnrollment.upsert({
		where: {
			studentId_subClassId_month_year: {
				studentId: student1.id,
				subClassId: subPiano.id,
				month,
				year,
			},
		},
		update: { status: "CONFIRMED" },
		create: {
			studentId: student1.id,
			subClassId: subPiano.id,
			month,
			year,
			frequency: "ONCE_PER_WEEK",
			preferredDays: ["MONDAY"],
			scheduleIds: [],
			status: "CONFIRMED",
			totalAmount: new Prisma.Decimal("140.00"),
			currency: "OMR",
		},
	});

	await prisma.monthlyPayment.upsert({
		where: { enrollmentId: monthlyEnrollment.id },
		update: { status: "PAID" },
		create: {
			enrollmentId: monthlyEnrollment.id,
			amount: new Prisma.Decimal("140.00"),
			currency: "OMR",
			status: "PAID",
			method: "CASH",
			paidAt: new Date(),
		},
	});

	// ── INVOICES + PAYMENTS ─────────────────────────────────────────────────

	const invoice1 = await prisma.invoice.upsert({
		where: { invoiceNo: `ALT-${year}-${String(month).padStart(2, "0")}-001` },
		update: { status: "PAID" },
		create: {
			invoiceNo: `ALT-${year}-${String(month).padStart(2, "0")}-001`,
			studentId: student1.id,
			amount: new Prisma.Decimal("25.00"),
			tax: new Prisma.Decimal("0.00"),
			totalAmount: new Prisma.Decimal("25.00"),
			currency: "OMR",
			status: "PAID",
			issuedAt: new Date(),
			paidAt: new Date(),
			notes: "Invoice for alt booking payment",
		},
	});

	const invoice2 = await prisma.invoice.upsert({
		where: { invoiceNo: `ALT-${year}-${String(month).padStart(2, "0")}-002` },
		update: { status: "PAID" },
		create: {
			invoiceNo: `ALT-${year}-${String(month).padStart(2, "0")}-002`,
			studentId: student2.id,
			amount: new Prisma.Decimal("15.00"),
			tax: new Prisma.Decimal("0.00"),
			totalAmount: new Prisma.Decimal("15.00"),
			currency: "OMR",
			status: "PAID",
			issuedAt: new Date(),
			paidAt: new Date(),
			notes: "Invoice for alt workshop payment",
		},
	});

	await prisma.payment.upsert({
		where: { id: "alt-payment-booking-1" },
		update: { status: "PAID" },
		create: {
			id: "alt-payment-booking-1",
			bookingId: booking1.id,
			invoiceId: invoice1.id,
			amount: new Prisma.Decimal("25.00"),
			currency: "OMR",
			status: "PAID",
			method: "CASH",
			paidAt: new Date(),
			metadata: { source: "alternativeSeed", kind: "booking" },
		},
	});

	await prisma.payment.upsert({
		where: { id: "alt-payment-trial-1" },
		update: { status: "PAID" },
		create: {
			id: "alt-payment-trial-1",
			trialBookingId: trial1.id,
			amount: new Prisma.Decimal("10.00"),
			currency: "OMR",
			status: "PAID",
			method: "CASH",
			paidAt: new Date(),
			metadata: { source: "alternativeSeed", kind: "trial" },
		},
	});

	await prisma.payment.upsert({
		where: { id: "alt-payment-workshop-1" },
		update: { status: "PAID" },
		create: {
			id: "alt-payment-workshop-1",
			workshopBookingId: workshopBooking.id,
			invoiceId: invoice2.id,
			amount: new Prisma.Decimal("15.00"),
			currency: "OMR",
			status: "PAID",
			method: "CASH",
			paidAt: new Date(),
			metadata: { source: "alternativeSeed", kind: "workshop" },
		},
	});

	// ── NOTIFICATIONS ────────────────────────────────────────────────────────

	await prisma.notification.upsert({
		where: { id: "alt-notif-1" },
		update: { status: "SENT" },
		create: {
			id: "alt-notif-1",
			userId: adminUser.id,
			type: "INAPP",
			status: "SENT",
			subject: "Alt seed ready",
			body: "Alternative seed data has been inserted successfully.",
			sentAt: new Date(),
			linkUrl: "/admin",
		},
	});

	await prisma.notification.upsert({
		where: { id: "alt-notif-2" },
		update: { status: "SENT" },
		create: {
			id: "alt-notif-2",
			userId: studentUser1.id,
			type: "INAPP",
			status: "SENT",
			subject: "Booking Confirmed",
			body: "Your Hip-Hop session reservation is confirmed (alt seed).",
			sentAt: new Date(),
			bookingId: booking1.id,
		},
	});

	// ── SUPPORT TICKETS ──────────────────────────────────────────────────────

	const ticket = await prisma.supportTicket.upsert({
		where: { id: "alt-ticket-1" },
		update: { status: "OPEN" },
		create: {
			id: "alt-ticket-1",
			userId: studentUser2.id,
			subject: "Alt seed: payment question",
			body: "I paid cash but want a receipt (test ticket).",
			status: "OPEN",
			priority: "NORMAL",
		},
	});

	await prisma.ticketReply.upsert({
		where: { id: "alt-ticket-reply-1" },
		update: {},
		create: {
			id: "alt-ticket-reply-1",
			ticketId: ticket.id,
			userId: adminUser.id,
			body: "Alt seed reply: invoice is available in Payments section.",
		},
	});

	// ── GALLERY (minimal) ────────────────────────────────────────────────────

	const galleryCategory = await prisma.galleryCategory.upsert({
		where: { slug: "alt-seed" },
		update: { isActive: true },
		create: {
			name: "Alt Seed",
			slug: "alt-seed",
			sortOrder: 999,
			isActive: true,
		},
	});

	const galleryPerson = await prisma.galleryPerson.upsert({
		where: { id: "alt-gallery-person-1" },
		update: {},
		create: {
			id: "alt-gallery-person-1",
			displayName: "Alt Seed Teacher",
			role: "Teacher",
			teacherId: teacher1.id,
		},
	});

	const galleryItem = await prisma.galleryItem.upsert({
		where: { id: "alt-gallery-item-1" },
		update: { visibility: "PUBLISHED" },
		create: {
			id: "alt-gallery-item-1",
			categoryId: galleryCategory.id,
			mediaType: "IMAGE",
			title: "Alt Seed Image",
			description: "Sample gallery item for testing gallery pages.",
			url: "https://example.com/alt-seed-image.jpg",
			thumbnailUrl: null,
			altText: "Alt seed image",
			visibility: "PUBLISHED",
			isFeatured: true,
			sortOrder: 1,
			uploadedBy: adminUser.id,
			storageKey: "alt-seed/alt-seed-image.jpg",
		},
	});

	await prisma.galleryItemPerson.createMany({
		data: [{ galleryItemId: galleryItem.id, galleryPersonId: galleryPerson.id }],
		skipDuplicates: true,
	});

	// ── AUDIT LOG (minimal) ──────────────────────────────────────────────────

	await prisma.auditLog.upsert({
		where: { id: "alt-audit-1" },
		update: {},
		create: {
			id: "alt-audit-1",
			userId: adminUser.id,
			action: "SEED",
			entity: "Database",
			entityId: "alternativeSeed",
			newValues: { ok: true },
			ipAddress: "127.0.0.1",
			userAgent: "alternativeSeed.ts",
		},
	});

	console.log("✅ Alternative seed completed.");
	console.log(
		[
			"\nCreated/updated:",
			"- Users: admin + 2 teachers + 2 students",
			"- Profiles: 3 teachers (incl. one without user) + 2 students",
			"- Classes/Subclasses: Dance & Wellness + Music",
			"- Reservation flows: schedules, sessions, bookings, trial, workshop",
			"- Payments/Invoices: booking + trial + workshop + monthly enrollment payment",
			"",
		].join("\n"),
	);
}

main()
	.catch((err) => {
		console.error("❌ alternativeSeed failed:\n", err);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});