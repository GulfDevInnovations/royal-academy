// prisma/seed.ts
import { PrismaClient, Role, Gender, ClassStatus, DayOfWeek } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding started...')

  // ─────────────────────────────────────────────
  // CLEAN DATABASE FIRST (order matters because of foreign keys)
  // ─────────────────────────────────────────────
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.classSession.deleteMany()
  await prisma.classSchedule.deleteMany()
  await prisma.teacherAvailability.deleteMany()
  await prisma.subClass.deleteMany()
  await prisma.class.deleteMany()
  await prisma.room.deleteMany()
  await prisma.location.deleteMany()
  await prisma.adminProfile.deleteMany()
  await prisma.teacherProfile.deleteMany()
  await prisma.studentProfile.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()

  console.log('🧹 Database cleaned')

  // ─────────────────────────────────────────────
  // USERS — ADMIN
  // ─────────────────────────────────────────────
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@royalacademy.com',
      phone: '+96891000001',
      passwordHash: await hash('Admin@1234', 12),
      role: Role.ADMIN,
      isActive: true,
      isVerified: true,
      adminProfile: {
        create: {
          firstName: 'Royal',
          lastName: 'Admin',
        }
      }
    }
  })
  console.log('✅ Admin created:', adminUser.email)

  // ─────────────────────────────────────────────
  // USERS — TEACHERS
  // ─────────────────────────────────────────────
  const teacher1User = await prisma.user.create({
    data: {
      email: 'sara.dance@royalacademy.com',
      phone: '+96891000002',
      passwordHash: await hash('Teacher@1234', 12),
      role: Role.TEACHER,
      isActive: true,
      isVerified: true,
      teacherProfile: {
        create: {
          firstName: 'Sara',
          lastName: 'Al Balushi',
          bio: 'Professional ballet and contemporary dance instructor with 10 years of experience.',
          specialties: ['Ballet', 'Contemporary', 'Jazz'],
          isAvailable: true,
        }
      }
    },
    include: { teacherProfile: true }
  })

  const teacher2User = await prisma.user.create({
    data: {
      email: 'ahmed.music@royalacademy.com',
      phone: '+96891000003',
      passwordHash: await hash('Teacher@1234', 12),
      role: Role.TEACHER,
      isActive: true,
      isVerified: true,
      teacherProfile: {
        create: {
          firstName: 'Ahmed',
          lastName: 'Al Rashdi',
          bio: 'Classically trained pianist with a passion for teaching kids and adults.',
          specialties: ['Piano', 'Music Theory', 'Composition'],
          isAvailable: true,
        }
      }
    },
    include: { teacherProfile: true }
  })

  const teacher3User = await prisma.user.create({
    data: {
      email: 'lina.art@royalacademy.com',
      phone: '+96891000004',
      passwordHash: await hash('Teacher@1234', 12),
      role: Role.TEACHER,
      isActive: true,
      isVerified: true,
      teacherProfile: {
        create: {
          firstName: 'Lina',
          lastName: 'Hassan',
          bio: 'Fine arts graduate specializing in oil painting and watercolor for all age groups.',
          specialties: ['Oil Painting', 'Watercolor', 'Sketching'],
          isAvailable: true,
        }
      }
    },
    include: { teacherProfile: true }
  })

  console.log('✅ Teachers created')

  // ─────────────────────────────────────────────
  // USERS — STUDENTS
  // ─────────────────────────────────────────────
  const student1User = await prisma.user.create({
    data: {
      email: 'student1@gmail.com',
      phone: '+96891000005',
      passwordHash: await hash('Student@1234', 12),
      role: Role.STUDENT,
      isActive: true,
      isVerified: true,
      studentProfile: {
        create: {
          firstName: 'Mona',
          lastName: 'Al Siyabi',
          dateOfBirth: new Date('2000-05-15'),
          gender: Gender.FEMALE,
          address: 'Muscat, Oman',
          city: 'Muscat',
          country: 'Oman',
        }
      }
    },
    include: { studentProfile: true }
  })

  const student2User = await prisma.user.create({
    data: {
      email: 'student2@gmail.com',
      phone: '+96891000006',
      passwordHash: await hash('Student@1234', 12),
      role: Role.STUDENT,
      isActive: true,
      isVerified: true,
      studentProfile: {
        create: {
          firstName: 'Khalid',
          lastName: 'Al Farsi',
          dateOfBirth: new Date('1998-11-20'),
          gender: Gender.MALE,
          address: 'Muscat, Oman',
          city: 'Muscat',
          country: 'Oman',
        }
      }
    },
    include: { studentProfile: true }
  })

  console.log('✅ Students created')

  // ─────────────────────────────────────────────
  // LOCATIONS & ROOMS
  // ─────────────────────────────────────────────
  const mainLocation = await prisma.location.create({
    data: {
      name: 'Royal Academy Main Branch',
      address: 'Al Khuwair Street',
      city: 'Muscat',
      country: 'Oman',
      isOnline: false,
      isActive: true,
      rooms: {
        create: [
          { name: 'Dance Studio A', capacity: 15, hasOnline: false },
          { name: 'Dance Studio B', capacity: 10, hasOnline: false },
          { name: 'Music Room 1',   capacity: 5,  hasOnline: true  },
          { name: 'Music Room 2',   capacity: 5,  hasOnline: true  },
          { name: 'Art Studio',     capacity: 12, hasOnline: false },
        ]
      }
    },
    include: { rooms: true }
  })

  const onlineLocation = await prisma.location.create({
    data: {
      name: 'Online',
      isOnline: true,
      isActive: true,
      rooms: {
        create: [
          { name: 'Online Room', capacity: 20, hasOnline: true }
        ]
      }
    },
    include: { rooms: true }
  })

  const danceStudioA = mainLocation.rooms.find(r => r.name === 'Dance Studio A')!
  const musicRoom1   = mainLocation.rooms.find(r => r.name === 'Music Room 1')!
  const artStudio    = mainLocation.rooms.find(r => r.name === 'Art Studio')!
  const onlineRoom   = onlineLocation.rooms[0]

  console.log('✅ Locations and rooms created')

  // ─────────────────────────────────────────────
  // CLASSES & SUBCLASSES
  // ─────────────────────────────────────────────
  const danceClass = await prisma.class.create({
    data: {
      name: 'Dance',
      description: 'Explore the art of movement through ballet, contemporary, and jazz.',
      isActive: true,
      sortOrder: 1,
    }
  })

  const musicClass = await prisma.class.create({
    data: {
      name: 'Music',
      description: 'Learn music through piano, theory, and composition.',
      isActive: true,
      sortOrder: 2,
    }
  })

  const paintingClass = await prisma.class.create({
    data: {
      name: 'Painting',
      description: 'Express yourself through oil painting, watercolor, and sketching.',
      isActive: true,
      sortOrder: 3,
    }
  })

  // Dance subclasses
  const ballet = await prisma.subClass.create({
    data: {
      classId:         danceClass.id,
      teacherId:       teacher1User.teacherProfile!.id,
      name:            'Ballet',
      description:     'Classical ballet for all levels.',
      capacity:        12,
      durationMinutes: 60,
      price:           15.00,
      currency:        'OMR',
      level:           'All Levels',
      ageGroup:        'Adults',
      isActive:        true,
    }
  })

  const balletKids = await prisma.subClass.create({
    data: {
      classId:         danceClass.id,
      teacherId:       teacher1User.teacherProfile!.id,
      name:            'Ballet for Kids',
      description:     'Fun and structured ballet classes for children.',
      capacity:        10,
      durationMinutes: 45,
      price:           12.00,
      currency:        'OMR',
      level:           'Beginner',
      ageGroup:        'Kids',
      isActive:        true,
    }
  })

  const contemporary = await prisma.subClass.create({
    data: {
      classId:         danceClass.id,
      teacherId:       teacher1User.teacherProfile!.id,
      name:            'Contemporary Dance',
      description:     'Modern movement and expressive dance techniques.',
      capacity:        12,
      durationMinutes: 60,
      price:           15.00,
      currency:        'OMR',
      level:           'Intermediate',
      ageGroup:        'Adults',
      isActive:        true,
    }
  })

  // Music subclasses
  const piano = await prisma.subClass.create({
    data: {
      classId:         musicClass.id,
      teacherId:       teacher2User.teacherProfile!.id,
      name:            'Piano',
      description:     'Classical and modern piano for beginners and intermediate students.',
      capacity:        4,
      durationMinutes: 60,
      price:           20.00,
      currency:        'OMR',
      level:           'All Levels',
      ageGroup:        'Adults',
      isActive:        true,
    }
  })

  const pianoKids = await prisma.subClass.create({
    data: {
      classId:         musicClass.id,
      teacherId:       teacher2User.teacherProfile!.id,
      name:            'Piano for Kids',
      description:     'Playful and structured piano lessons designed for children.',
      capacity:        4,
      durationMinutes: 45,
      price:           18.00,
      currency:        'OMR',
      level:           'Beginner',
      ageGroup:        'Kids',
      isActive:        true,
    }
  })

  // Painting subclasses
  const oilPainting = await prisma.subClass.create({
    data: {
      classId:         paintingClass.id,
      teacherId:       teacher3User.teacherProfile!.id,
      name:            'Oil Painting',
      description:     'Learn oil painting techniques from scratch.',
      capacity:        10,
      durationMinutes: 90,
      price:           18.00,
      currency:        'OMR',
      level:           'All Levels',
      ageGroup:        'Adults',
      isActive:        true,
    }
  })

  const watercolor = await prisma.subClass.create({
    data: {
      classId:         paintingClass.id,
      teacherId:       teacher3User.teacherProfile!.id,
      name:            'Watercolor',
      description:     'Explore the delicate and expressive world of watercolor painting.',
      capacity:        10,
      durationMinutes: 90,
      price:           18.00,
      currency:        'OMR',
      level:           'Beginner',
      ageGroup:        'All Ages',
      isActive:        true,
    }
  })

  console.log('✅ Classes and subclasses created')

  // ─────────────────────────────────────────────
  // TEACHER AVAILABILITY
  // ─────────────────────────────────────────────
  const teacher1 = teacher1User.teacherProfile!
  const teacher2 = teacher2User.teacherProfile!
  const teacher3 = teacher3User.teacherProfile!

  await prisma.teacherAvailability.createMany({
    data: [
      // Sara — Dance teacher
      { teacherId: teacher1.id, dayOfWeek: DayOfWeek.MONDAY,    startTime: '09:00', endTime: '17:00' },
      { teacherId: teacher1.id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '09:00', endTime: '17:00' },
      { teacherId: teacher1.id, dayOfWeek: DayOfWeek.FRIDAY,    startTime: '09:00', endTime: '14:00' },
      // Ahmed — Music teacher
      { teacherId: teacher2.id, dayOfWeek: DayOfWeek.TUESDAY,   startTime: '10:00', endTime: '18:00' },
      { teacherId: teacher2.id, dayOfWeek: DayOfWeek.THURSDAY,  startTime: '10:00', endTime: '18:00' },
      { teacherId: teacher2.id, dayOfWeek: DayOfWeek.SATURDAY,  startTime: '10:00', endTime: '15:00' },
      // Lina — Art teacher
      { teacherId: teacher3.id, dayOfWeek: DayOfWeek.MONDAY,    startTime: '11:00', endTime: '17:00' },
      { teacherId: teacher3.id, dayOfWeek: DayOfWeek.WEDNESDAY, startTime: '11:00', endTime: '17:00' },
      { teacherId: teacher3.id, dayOfWeek: DayOfWeek.SATURDAY,  startTime: '09:00', endTime: '14:00' },
    ]
  })

  console.log('✅ Teacher availability created')

  // ─────────────────────────────────────────────
  // CLASS SCHEDULES
  // ─────────────────────────────────────────────
  const scheduleStartDate = new Date('2025-03-01')
  const scheduleEndDate   = new Date('2025-12-31')

  const balletSchedule = await prisma.classSchedule.create({
    data: {
      subClassId:      ballet.id,
      teacherId:       teacher1.id,
      roomId:          danceStudioA.id,
      dayOfWeek:       DayOfWeek.MONDAY,
      startTime:       '10:00',
      endTime:         '11:00',
      startDate:       scheduleStartDate,
      endDate:         scheduleEndDate,
      maxCapacity:     12,
      currentEnrolled: 0,
      isRecurring:     true,
      status:          ClassStatus.ACTIVE,
    }
  })

  const pianoSchedule = await prisma.classSchedule.create({
    data: {
      subClassId:      piano.id,
      teacherId:       teacher2.id,
      roomId:          musicRoom1.id,
      dayOfWeek:       DayOfWeek.TUESDAY,
      startTime:       '11:00',
      endTime:         '12:00',
      startDate:       scheduleStartDate,
      endDate:         scheduleEndDate,
      maxCapacity:     4,
      currentEnrolled: 0,
      isRecurring:     true,
      status:          ClassStatus.ACTIVE,
    }
  })

  const oilSchedule = await prisma.classSchedule.create({
    data: {
      subClassId:      oilPainting.id,
      teacherId:       teacher3.id,
      roomId:          artStudio.id,
      dayOfWeek:       DayOfWeek.WEDNESDAY,
      startTime:       '14:00',
      endTime:         '15:30',
      startDate:       scheduleStartDate,
      endDate:         scheduleEndDate,
      maxCapacity:     10,
      currentEnrolled: 0,
      isRecurring:     true,
      status:          ClassStatus.ACTIVE,
    }
  })

  console.log('✅ Class schedules created')

  // ─────────────────────────────────────────────
  // CLASS SESSIONS (generate a few per schedule)
  // ─────────────────────────────────────────────
  const balletSession1 = await prisma.classSession.create({
    data: {
      scheduleId:  balletSchedule.id,
      sessionDate: new Date('2025-03-03'),
      startTime:   '10:00',
      endTime:     '11:00',
      status:      ClassStatus.ACTIVE,
    }
  })

  const balletSession2 = await prisma.classSession.create({
    data: {
      scheduleId:  balletSchedule.id,
      sessionDate: new Date('2025-03-10'),
      startTime:   '10:00',
      endTime:     '11:00',
      status:      ClassStatus.ACTIVE,
    }
  })

  const pianoSession1 = await prisma.classSession.create({
    data: {
      scheduleId:  pianoSchedule.id,
      sessionDate: new Date('2025-03-04'),
      startTime:   '11:00',
      endTime:     '12:00',
      status:      ClassStatus.ACTIVE,
    }
  })

  console.log('✅ Class sessions created')

  // ─────────────────────────────────────────────
  // BOOKINGS
  // ─────────────────────────────────────────────
  const student1 = student1User.studentProfile!
  const student2 = student2User.studentProfile!

  const booking1 = await prisma.booking.create({
    data: {
      studentId: student1.id,
      sessionId: balletSession1.id,
      status:    'CONFIRMED',
      bookedAt:  new Date(),
      canCancel: true,
    }
  })

  const booking2 = await prisma.booking.create({
    data: {
      studentId: student2.id,
      sessionId: pianoSession1.id,
      status:    'CONFIRMED',
      bookedAt:  new Date(),
      canCancel: true,
    }
  })

  console.log('✅ Bookings created')

  // ─────────────────────────────────────────────
  // INVOICES & PAYMENTS
  // ─────────────────────────────────────────────
  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNo:   'INV-2025-0001',
      studentId:   student1.id,
      amount:      15.00,
      tax:         0,
      totalAmount: 15.00,
      currency:    'OMR',
      status:      'PAID',
      issuedAt:    new Date(),
      dueDate:     new Date(),
      paidAt:      new Date(),
    }
  })

  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNo:   'INV-2025-0002',
      studentId:   student2.id,
      amount:      20.00,
      tax:         0,
      totalAmount: 20.00,
      currency:    'OMR',
      status:      'ISSUED',
      issuedAt:    new Date(),
      dueDate:     new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    }
  })

  await prisma.payment.create({
    data: {
      bookingId:  booking1.id,
      invoiceId:  invoice1.id,
      amount:     15.00,
      currency:   'OMR',
      status:     'PAID',
      method:     'CREDIT_CARD',
      paidAt:     new Date(),
    }
  })

  await prisma.payment.create({
    data: {
      bookingId: booking2.id,
      invoiceId: invoice2.id,
      amount:    20.00,
      currency:  'OMR',
      status:    'PENDING',
    }
  })

  console.log('✅ Invoices and payments created')

  // ─────────────────────────────────────────────
  // NOTIFICATIONS
  // ─────────────────────────────────────────────
  await prisma.notification.createMany({
    data: [
      {
        userId:       student1User.id,
        bookingId:    booking1.id,
        type:         'EMAIL',
        status:       'SENT',
        subject:      'Your Ballet class is confirmed!',
        body:         'Hi Mona, your Ballet class on March 3rd at 10:00 AM is confirmed.',
        sentAt:       new Date(),
        scheduledFor: new Date(),
      },
      {
        userId:       student1User.id,
        bookingId:    booking1.id,
        type:         'SMS',
        status:       'PENDING',
        body:         'Reminder: Your Ballet class is tomorrow at 10:00 AM. Royal Academy.',
        scheduledFor: new Date('2025-03-02T10:00:00'), // 24h before
      },
      {
        userId:       student2User.id,
        bookingId:    booking2.id,
        type:         'EMAIL',
        status:       'SENT',
        subject:      'Your Piano class is confirmed!',
        body:         'Hi Khalid, your Piano class on March 4th at 11:00 AM is confirmed.',
        sentAt:       new Date(),
        scheduledFor: new Date(),
      },
    ]
  })

  console.log('✅ Notifications created')
  console.log('🎉 Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })