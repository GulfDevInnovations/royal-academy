// lib/data/locations.ts
// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for country → city → district data.
// No external API. No cache logic. Just import and use.
//
// Structure:
//   - Each country has an English name, optional Arabic name, and a cities array.
//   - Each city has an English name, optional Arabic name, and an optional
//     districts array (only populated where we support sub-district selection,
//     i.e. Oman's Muscat Governorate wilayats).
// ─────────────────────────────────────────────────────────────────────────────

export type District = {
  name: string;
  nameAr?: string;
};

export type City = {
  name: string;
  nameAr?: string;
  districts?: District[];
};

export type Country = {
  name: string;
  nameAr?: string;
  cities: City[];
};

export const LOCATIONS: Country[] = [
  // ── Oman (pinned first) ────────────────────────────────────────────────────
  {
    name: "Oman",
    nameAr: "عُمان",
    cities: [
      // ── Muscat Governorate wilayats (trigger district dropdown) ──────────
      {
        name: "Muscat",
        nameAr: "مسقط",
        districts: [
          { name: "Al Alam",                nameAr: "العلم" },
          { name: "Al Bustan",              nameAr: "البستان" },
          { name: "Al Hamriyah",            nameAr: "الحمرية" },
          { name: "Al Khuwair",             nameAr: "الخوير" },
          { name: "Al Maabilah",            nameAr: "المعبيلة" },
          { name: "Al Mina",                nameAr: "الميناء" },
          { name: "Al Qurm",                nameAr: "القرم" },
          { name: "Al Wadi Al Kabir",       nameAr: "الوادي الكبير" },
          { name: "Azaiba",                 nameAr: "العذيبة" },
          { name: "Darsait",                nameAr: "دارسيت" },
          { name: "Ghubrah",                nameAr: "الغبرة" },
          { name: "Jibroo",                 nameAr: "جبرو" },
          { name: "Madinat Sultan Qaboos",  nameAr: "مدينة السلطان قابوس" },
          { name: "Mutrah Corniche",        nameAr: "كورنيش مطرح" },
          { name: "Ruwi",                   nameAr: "الروي" },
          { name: "Shatti Al Qurum",        nameAr: "شاطئ القرم" },
          { name: "Wattayah",               nameAr: "الوطية" },
        ],
      },
      {
        name: "Seeb",
        nameAr: "السيب",
        districts: [
          { name: "Al Khoudh",                          nameAr: "الخوض" },
          { name: "Al Mawaleh",                         nameAr: "الموالح" },
          { name: "Al Seeb",                            nameAr: "السيب" },
          { name: "Falaj Al Qabail",                    nameAr: "فلج القبائل" },
          { name: "Madinat Al Ilam",                    nameAr: "مدينة الإعلام" },
          { name: "Muscat International Airport Area",  nameAr: "منطقة مطار مسقط الدولي" },
          { name: "Rusayl",                             nameAr: "الرسيل" },
        ],
      },
      {
        name: "Bawshar",
        nameAr: "بوشر",
        districts: [
          { name: "Al Ansab",         nameAr: "الأنصب" },
          { name: "Al Azaiba South",  nameAr: "العذيبة جنوب" },
          { name: "Al Ghubrah South", nameAr: "الغبرة جنوب" },
          { name: "Al Khuwair South", nameAr: "الخوير جنوب" },
          { name: "Bawshar",          nameAr: "بوشر" },
          { name: "Bawshar Heights",  nameAr: "مرتفعات بوشر" },
          { name: "Hay Al Muna",      nameAr: "حي المنى" },
          { name: "Qurum Heights",    nameAr: "مرتفعات القرم" },
          { name: "Wadi Adai",        nameAr: "وادي عدي" },
        ],
      },
      {
        name: "Al Amerat",
        nameAr: "العامرات",
        districts: [
          { name: "Al Amerat City",   nameAr: "مدينة العامرات" },
          { name: "Al Amerat North",  nameAr: "العامرات شمال" },
          { name: "Al Amerat South",  nameAr: "العامرات جنوب" },
          { name: "Al Hajar",         nameAr: "الحجر" },
          { name: "Al Hail",          nameAr: "الحيل" },
          { name: "Al Hail North",    nameAr: "الحيل شمال" },
          { name: "Al Hail South",    nameAr: "الحيل جنوب" },
          { name: "Wadi Al Amerat",   nameAr: "وادي العامرات" },
        ],
      },
      {
        name: "Qurayyat",
        nameAr: "قريات",
        districts: [
          { name: "Al Hajir",           nameAr: "الهجير" },
          { name: "Dibab",              nameAr: "دباب" },
          { name: "Fins",               nameAr: "فنيس" },
          { name: "Mazara",             nameAr: "مزارع" },
          { name: "Qurayyat City",      nameAr: "مدينة قريات" },
          { name: "Shab",               nameAr: "شاب" },
          { name: "Tiwi",               nameAr: "طيوي" },
          { name: "Wadi Dayqah Area",   nameAr: "منطقة وادي ضيقة" },
        ],
      },
      {
        name: "Mutrah",
        nameAr: "مطرح",
        districts: [
          { name: "Al Lawatiyah",     nameAr: "اللواتية" },
          { name: "Al Waljat",        nameAr: "الولجة" },
          { name: "Corniche Mutrah",  nameAr: "كورنيش مطرح" },
          { name: "Kalbuh",           nameAr: "كلبوه" },
          { name: "Mutrah City",      nameAr: "مدينة مطرح" },
          { name: "Mutrah Port Area", nameAr: "منطقة ميناء مطرح" },
          { name: "Riyam",            nameAr: "ريام" },
          { name: "Wadi Adei",        nameAr: "وادي عدي" },
        ],
      },
      // ── Other Oman governorates (no districts needed) ────────────────────
      { name: "Salalah",  nameAr: "صلالة" },
      { name: "Sohar",    nameAr: "صحار" },
      { name: "Nizwa",    nameAr: "نزوى" },
      { name: "Sur",      nameAr: "صور" },
      { name: "Buraimi",  nameAr: "البريمي" },
      { name: "Ibri",     nameAr: "عبري" },
    ],
  },

  // ── Rest of the world (alphabetical, major cities only) ───────────────────
  {
    name: "Australia",
    nameAr: "أستراليا",
    cities: [
      { name: "Sydney",     nameAr: "سيدني" },
      { name: "Melbourne",  nameAr: "ملبورن" },
      { name: "Brisbane",   nameAr: "بريزبان" },
      { name: "Perth",      nameAr: "بيرث" },
      { name: "Adelaide",   nameAr: "أديلايد" },
      { name: "Canberra",   nameAr: "كانبيرا" },
    ],
  },
  {
    name: "Bahrain",
    nameAr: "البحرين",
    cities: [
      { name: "Manama",     nameAr: "المنامة" },
      { name: "Riffa",      nameAr: "الرفاع" },
      { name: "Muharraq",   nameAr: "المحرق" },
      { name: "Hamad Town", nameAr: "مدينة حمد" },
      { name: "A'ali",      nameAr: "عالي" },
    ],
  },
  {
    name: "Canada",
    nameAr: "كندا",
    cities: [
      { name: "Toronto",    nameAr: "تورنتو" },
      { name: "Montreal",   nameAr: "مونتريال" },
      { name: "Vancouver",  nameAr: "فانكوفر" },
      { name: "Calgary",    nameAr: "كالغاري" },
      { name: "Ottawa",     nameAr: "أوتاوا" },
      { name: "Edmonton",   nameAr: "إدمونتون" },
    ],
  },
  {
    name: "Egypt",
    nameAr: "مصر",
    cities: [
      { name: "Cairo",        nameAr: "القاهرة" },
      { name: "Alexandria",   nameAr: "الإسكندرية" },
      { name: "Giza",         nameAr: "الجيزة" },
      { name: "Mansoura",     nameAr: "المنصورة" },
      { name: "Tanta",        nameAr: "طنطا" },
      { name: "Asyut",        nameAr: "أسيوط" },
    ],
  },
  {
    name: "France",
    nameAr: "فرنسا",
    cities: [
      { name: "Paris",      nameAr: "باريس" },
      { name: "Marseille",  nameAr: "مرسيليا" },
      { name: "Lyon",       nameAr: "ليون" },
      { name: "Toulouse",   nameAr: "تولوز" },
      { name: "Nice",       nameAr: "نيس" },
      { name: "Nantes",     nameAr: "نانت" },
    ],
  },
  {
    name: "Germany",
    nameAr: "ألمانيا",
    cities: [
      { name: "Berlin",     nameAr: "برلين" },
      { name: "Hamburg",    nameAr: "هامبورغ" },
      { name: "Munich",     nameAr: "ميونيخ" },
      { name: "Cologne",    nameAr: "كولونيا" },
      { name: "Frankfurt",  nameAr: "فرانكفورت" },
      { name: "Stuttgart",  nameAr: "شتوتغارت" },
    ],
  },
  {
    name: "India",
    nameAr: "الهند",
    cities: [
      { name: "Mumbai",     nameAr: "مومباي" },
      { name: "Delhi",      nameAr: "دلهي" },
      { name: "Bengaluru",  nameAr: "بنغالور" },
      { name: "Hyderabad",  nameAr: "حيدر آباد" },
      { name: "Chennai",    nameAr: "تشيناي" },
      { name: "Kolkata",    nameAr: "كولكاتا" },
      { name: "Pune",       nameAr: "بيون" },
      { name: "Ahmedabad",  nameAr: "أحمد آباد" },
    ],
  },
  {
    name: "Iran",
    nameAr: "إيران",
    cities: [
      { name: "Tehran",       nameAr: "طهران" },
      { name: "Mashhad",      nameAr: "مشهد" },
      { name: "Isfahan",      nameAr: "أصفهان" },
      { name: "Shiraz",       nameAr: "شيراز" },
      { name: "Tabriz",       nameAr: "تبريز" },
      { name: "Karaj",        nameAr: "كرج" },
      { name: "Ahvaz",        nameAr: "الأهواز" },
      { name: "Qom",          nameAr: "قم" },
      { name: "Kermanshah",   nameAr: "كرمانشاه" },
      { name: "Rasht",        nameAr: "رشت" },
    ],
  },
  {
    name: "Italy",
    nameAr: "إيطاليا",
    cities: [
      { name: "Rome",     nameAr: "روما" },
      { name: "Milan",    nameAr: "ميلانو" },
      { name: "Naples",   nameAr: "نابولي" },
      { name: "Turin",    nameAr: "تورين" },
      { name: "Bologna",  nameAr: "بولونيا" },
      { name: "Florence", nameAr: "فلورنسا" },
    ],
  },
  {
    name: "Jordan",
    nameAr: "الأردن",
    cities: [
      { name: "Amman",  nameAr: "عمّان" },
      { name: "Zarqa",  nameAr: "الزرقاء" },
      { name: "Irbid",  nameAr: "إربد" },
      { name: "Aqaba",  nameAr: "العقبة" },
    ],
  },
  {
    name: "Kuwait",
    nameAr: "الكويت",
    cities: [
      { name: "Kuwait City",  nameAr: "مدينة الكويت" },
      { name: "Hawalli",      nameAr: "حولي" },
      { name: "Salmiya",      nameAr: "السالمية" },
      { name: "Farwaniya",    nameAr: "الفروانية" },
      { name: "Jahra",        nameAr: "الجهراء" },
    ],
  },
  {
    name: "Lebanon",
    nameAr: "لبنان",
    cities: [
      { name: "Beirut",   nameAr: "بيروت" },
      { name: "Tripoli",  nameAr: "طرابلس" },
      { name: "Sidon",    nameAr: "صيدا" },
      { name: "Tyre",     nameAr: "صور" },
    ],
  },
  {
    name: "Netherlands",
    nameAr: "هولندا",
    cities: [
      { name: "Amsterdam",  nameAr: "أمستردام" },
      { name: "Rotterdam",  nameAr: "روتردام" },
      { name: "The Hague",  nameAr: "لاهاي" },
      { name: "Utrecht",    nameAr: "أوتريخت" },
      { name: "Eindhoven",  nameAr: "آيندهوفن" },
    ],
  },
  {
    name: "Pakistan",
    nameAr: "باكستان",
    cities: [
      { name: "Karachi",      nameAr: "كراتشي" },
      { name: "Lahore",       nameAr: "لاهور" },
      { name: "Islamabad",    nameAr: "إسلام آباد" },
      { name: "Rawalpindi",   nameAr: "راولبندي" },
      { name: "Faisalabad",   nameAr: "فيصل آباد" },
    ],
  },
  {
    name: "Qatar",
    nameAr: "قطر",
    cities: [
      { name: "Doha",       nameAr: "الدوحة" },
      { name: "Al Rayyan",  nameAr: "الريان" },
      { name: "Al Wakrah",  nameAr: "الوكرة" },
      { name: "Umm Salal",  nameAr: "أم صلال" },
      { name: "Al Khor",    nameAr: "الخور" },
    ],
  },
  {
    name: "Saudi Arabia",
    nameAr: "المملكة العربية السعودية",
    cities: [
      { name: "Riyadh",   nameAr: "الرياض" },
      { name: "Jeddah",   nameAr: "جدة" },
      { name: "Mecca",    nameAr: "مكة المكرمة" },
      { name: "Medina",   nameAr: "المدينة المنورة" },
      { name: "Dammam",   nameAr: "الدمام" },
      { name: "Khobar",   nameAr: "الخبر" },
    ],
  },
  {
    name: "Spain",
    nameAr: "إسبانيا",
    cities: [
      { name: "Madrid",     nameAr: "مدريد" },
      { name: "Barcelona",  nameAr: "برشلونة" },
      { name: "Valencia",   nameAr: "فالنسيا" },
      { name: "Seville",    nameAr: "إشبيلية" },
      { name: "Malaga",     nameAr: "مالقة" },
      { name: "Bilbao",     nameAr: "بلباو" },
    ],
  },
  {
    name: "Turkey",
    nameAr: "تركيا",
    cities: [
      { name: "Istanbul",   nameAr: "إسطنبول" },
      { name: "Ankara",     nameAr: "أنقرة" },
      { name: "Izmir",      nameAr: "إزمير" },
      { name: "Bursa",      nameAr: "بورصة" },
      { name: "Antalya",    nameAr: "أنطاليا" },
      { name: "Konya",      nameAr: "قونيه" },
    ],
  },
  {
    name: "United Arab Emirates",
    nameAr: "الإمارات العربية المتحدة",
    cities: [
      { name: "Dubai",          nameAr: "دبي" },
      { name: "Abu Dhabi",      nameAr: "أبوظبي" },
      { name: "Sharjah",        nameAr: "الشارقة" },
      { name: "Ajman",          nameAr: "عجمان" },
      { name: "Ras Al Khaimah", nameAr: "رأس الخيمة" },
      { name: "Fujairah",       nameAr: "الفجيرة" },
      { name: "Umm Al Quwain",  nameAr: "أم القيوين" },
    ],
  },
  {
    name: "United Kingdom",
    nameAr: "المملكة المتحدة",
    cities: [
      { name: "London",       nameAr: "لندن" },
      { name: "Birmingham",   nameAr: "برمنغهام" },
      { name: "Manchester",   nameAr: "مانشستر" },
      { name: "Glasgow",      nameAr: "غلاسكو" },
      { name: "Liverpool",    nameAr: "ليفربول" },
      { name: "Leeds",        nameAr: "ليدز" },
    ],
  },
  {
    name: "United States",
    nameAr: "الولايات المتحدة",
    cities: [
      { name: "New York",       nameAr: "نيويورك" },
      { name: "Los Angeles",    nameAr: "لوس أنجلوس" },
      { name: "Chicago",        nameAr: "شيكاغو" },
      { name: "Houston",        nameAr: "هيوستن" },
      { name: "Phoenix",        nameAr: "فينيكس" },
      { name: "San Francisco",  nameAr: "سان فرانسيسكو" },
      { name: "Miami",          nameAr: "ميامي" },
    ],
  },
  {
    name: "Yemen",
    nameAr: "اليمن",
    cities: [
      { name: "Sanaa",  nameAr: "صنعاء" },
      { name: "Aden",   nameAr: "عدن" },
      { name: "Taiz",   nameAr: "تعز" },
      { name: "Hodeidah", nameAr: "الحديدة" },
    ],
  },
];