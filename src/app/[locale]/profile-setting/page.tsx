import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { saveProfileSettings } from "./actions";
import TimedAlert from "./TimedAlert";
import ScrollToMissingField from "./ScrollToMissingField";
import InlineRequiredValidation from "./InlineRequiredValidation";
import UnsavedChangesGuard from "./UnsavedChangesGuard";
import MedicalConditionField from "./MedicalConditionField";
import AvatarUploadField from "./AvatarUploadField";
import TermsConsentField from "./TermsConsentField";
import CountryCityFields from "./CountryCityFields";
import GlassSelectField from "./GlassSelectField";

const PROFILE_DRAFT_COOKIE = "profile_setting_draft";

type ProfileDraft = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyRelationship: string;
  preferredTrack: string;
  experience: string;
  address: string;
  city: string;
  country: string;
  notes: string;
  imageUrl: string;
  hasMedicalCondition: boolean;
  medicalConditionDetails: string;
  agreePolicy: boolean;
};

function inputStyle() {
  return {
    background:
      "linear-gradient(135deg, rgba(228,208,181,0.56) 0%, rgba(228,208,181,0.48) 100%)",
    border: "1px solid rgba(75,48,68,0.22)",
    color: "#4b3044",
    fontFamily: "Tahoma, Arial, 'Noto Sans Arabic', sans-serif",
  };
}

const fieldClassName =
  "mt-2 w-full rounded-2xl px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]";
const checkboxClassName =
  "mt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]";
const primaryButtonFocusClassName =
  "w-full py-3 rounded-2xl text-sm tracking-[0.2em] uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]";

function toLocalOmPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("968") && digits.length >= 11) {
    return digits.slice(3, 11);
  }
  return digits.slice(0, 8);
}

function MobileSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details open className="rounded-2xl border border-white/10 md:border-0">
      <summary
        className="cursor-pointer list-none px-4 py-3 text-sm tracking-wide md:hidden [&::-webkit-details-marker]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]"
        style={{ color: "#e4d0b5" }}
      >
        {title}
      </summary>
      <div className="px-4 pb-4 md:px-0 md:pb-0">
        <h2
          className="hidden md:block text-lg tracking-wide mb-4"
          style={{ color: "#e4d0b5" }}
        >
          {title}
        </h2>
        {children}
      </div>
    </details>
  );
}

const termsSectionsEn = [
  {
    title: "Registration & Fees",
    items: [
      "All students must complete the online registration form before attending classes.",
      "Program fees must be paid upon registration to secure the student's place.",
      "A 10 OMR registration fee applies to new Ballet students, which includes ballet shoes and a leotard.",
    ],
  },
  {
    title: "Attendance Policy",
    items: [
      "Group classes are non-refundable and non-reschedulable.",
      "Missed classes due to student absence cannot be refunded or carried forward.",
    ],
  },
  {
    title: "Private Sessions",
    items: [
      "Private sessions may be rescheduled with minimum 24 hours notice.",
      "Rescheduled sessions must take place within one week, subject to availability.",
    ],
  },
  {
    title: "Communication",
    items: [
      "Parents/Guardians must provide an accurate WhatsApp number and email address for academy communication.",
      "The academy is not responsible for missed information due to incorrect contact details.",
    ],
  },
  {
    title: "Schedule Adjustments",
    items: [
      "The academy reserves the right to adjust class schedules, instructors, or programs when necessary.",
      "If a class is canceled by the academy, a make-up class or replacement session will be arranged.",
    ],
  },
  {
    title: "Withdrawal Policy",
    items: [
      "Enrollment is confirmed on a monthly basis. Once a month has started, fees are non-refundable and non-transferable.",
    ],
  },
  {
    title: "Health & Safety",
    items: [
      "Parents/Guardians must inform the academy of any medical conditions before classes begin.",
      "Students are supervised only during their scheduled class time.",
    ],
  },
  {
    title: "Conduct",
    items: [
      "Students must behave respectfully toward teachers, staff, and fellow students.",
      "Disruptive behavior may result in removal from class without refund.",
    ],
  },
  {
    title: "Media & Liability",
    items: [
      "The academy may capture photos or videos during classes or events for educational or promotional use.",
      "Participation in academy activities is voluntary, and the academy is not liable for injuries occurring during classes or on the premises.",
    ],
  },
];

const termsSectionsAr = [
  {
    title: "التسجيل والرسوم",
    items: [
      "يجب على جميع الطلاب إكمال نموذج التسجيل الإلكتروني قبل حضور الحصص.",
      "يجب دفع رسوم البرنامج عند التسجيل لتأكيد حجز مقعد الطالب.",
      "تُطبق رسوم تسجيل بقيمة 10 ريال عماني على طلاب الباليه الجدد، وتشمل حذاء الباليه ولباس الباليه.",
    ],
  },
  {
    title: "سياسة الحضور",
    items: [
      "الحصص الجماعية غير قابلة للاسترداد أو إعادة الجدولة.",
      "الحصص الفائتة بسبب غياب الطالب لا يمكن استرداد رسومها أو ترحيلها.",
    ],
  },
  {
    title: "الحصص الخاصة",
    items: [
      "يمكن إعادة جدولة الحصص الخاصة بإشعار لا يقل عن 24 ساعة.",
      "يجب أن تتم الحصة المعاد جدولتها خلال أسبوع واحد حسب التوفر.",
    ],
  },
  {
    title: "التواصل",
    items: [
      "يجب على أولياء الأمور/الأوصياء تقديم رقم واتساب وبريد إلكتروني صحيحين للتواصل مع الأكاديمية.",
      "الأكاديمية غير مسؤولة عن فوات أي معلومات بسبب بيانات تواصل غير صحيحة.",
    ],
  },
  {
    title: "تعديلات الجدول",
    items: [
      "تحتفظ الأكاديمية بحق تعديل جداول الحصص أو المدربين أو البرامج عند الحاجة.",
      "إذا تم إلغاء حصة من قبل الأكاديمية، سيتم ترتيب حصة تعويضية أو جلسة بديلة.",
    ],
  },
  {
    title: "سياسة الانسحاب",
    items: [
      "يتم تأكيد التسجيل على أساس شهري. بعد بدء الشهر، الرسوم غير قابلة للاسترداد أو التحويل.",
    ],
  },
  {
    title: "الصحة والسلامة",
    items: [
      "يجب على أولياء الأمور/الأوصياء إبلاغ الأكاديمية بأي حالات صحية قبل بدء الحصص.",
      "يتم الإشراف على الطلاب فقط خلال وقت حصصهم المجدول.",
    ],
  },
  {
    title: "السلوك",
    items: [
      "يجب على الطلاب التصرف باحترام تجاه المعلمين والموظفين وباقي الطلاب.",
      "قد يؤدي السلوك المزعج إلى الاستبعاد من الحصة دون استرداد.",
    ],
  },
  {
    title: "الصور والمسؤولية",
    items: [
      "قد تلتقط الأكاديمية صورًا أو مقاطع فيديو خلال الحصص أو الفعاليات للاستخدام التعليمي أو الترويجي.",
      "المشاركة في أنشطة الأكاديمية طوعية، والأكاديمية غير مسؤولة عن الإصابات التي قد تحدث أثناء الحصص أو داخل المقر.",
    ],
  },
];

export default async function ProfileSettingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{
    saved?: string;
    error?: string;
    missing?: string;
    field?: string;
  }>;
}) {
  const { locale } = await params;
  const query = (await searchParams) ?? {};
  const cookieStore = await cookies();
  const draftRaw = cookieStore.get(PROFILE_DRAFT_COOKIE)?.value;
  let draft: ProfileDraft | null = null;
  if (draftRaw) {
    try {
      draft = JSON.parse(decodeURIComponent(draftRaw)) as ProfileDraft;
    } catch {
      draft = null;
    }
  }
  const missingSet = new Set(
    (query.missing ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );
  const requiredFieldIds = [
    "firstName",
    "lastName",
    "dateOfBirth",
    "gender",
    "email",
    "phone",
    "emergencyContactName",
    "emergencyContactPhone",
    "agreePolicy",
  ];
  const missingFields = [...missingSet];
  const requiredMessage =
    locale === "ar" ? "هذا الحقل مطلوب!" : "This field is required!";
  const renderRequiredMessage = (fieldName: string) => (
    <p
      id={`${fieldName}__required`}
      data-initial-visible={missingSet.has(fieldName) ? "1" : "0"}
      className="mt-1 text-xs"
      aria-live="polite"
      style={{
        color: "#f87171",
        display: missingSet.has(fieldName) ? "block" : "none",
      }}
    >
      {requiredMessage}
    </p>
  );
  const getFieldA11y = (fieldName: string) => ({
    "aria-invalid": missingSet.has(fieldName) ? true : undefined,
    "aria-describedby": missingSet.has(fieldName)
      ? `${fieldName}__required`
      : undefined,
  });
  const isArabic = locale === "ar";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirectTo=/${locale}/profile-setting`);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      studentProfile: true,
    },
  });

  const firstName = draft?.firstName ?? dbUser?.studentProfile?.firstName ?? "";
  const lastName = draft?.lastName ?? dbUser?.studentProfile?.lastName ?? "";
  const email = draft?.email ?? dbUser?.email ?? user.email ?? "";
  const phone = toLocalOmPhone(draft?.phone ?? dbUser?.phone ?? user.phone ?? "");

  const dbDateOfBirth = dbUser?.studentProfile?.dateOfBirth
    ? dbUser.studentProfile.dateOfBirth.toISOString().slice(0, 10)
    : "";
  const dateOfBirth = draft?.dateOfBirth ?? dbDateOfBirth;
  const gender = draft?.gender ?? dbUser?.studentProfile?.gender ?? "";
  const address = draft?.address ?? dbUser?.studentProfile?.address ?? "";
  const city = draft?.city ?? dbUser?.studentProfile?.city ?? "";
  const country = draft?.country ?? dbUser?.studentProfile?.country ?? "";
  const emergencyName =
    draft?.emergencyContactName ??
    dbUser?.studentProfile?.emergencyContactName ??
    "";
  const emergencyPhone =
    toLocalOmPhone(
      draft?.emergencyContactPhone ??
        dbUser?.studentProfile?.emergencyContactPhone ??
        "",
    );
  const emergencyRelationship =
    draft?.emergencyRelationship ??
    dbUser?.studentProfile?.emergencyRelationship ??
    "";
  const emergencyRelationshipValue =
    emergencyRelationship === "PARENT" ||
    emergencyRelationship === "GUARDIAN" ||
    emergencyRelationship === "FRIEND" ||
    emergencyRelationship === "OTHER"
      ? emergencyRelationship
      : emergencyRelationship
        ? "OTHER"
        : "";
  const preferredTrack =
    draft?.preferredTrack ?? dbUser?.studentProfile?.preferredTrack ?? "";
  const experience =
    draft?.experience ?? dbUser?.studentProfile?.experience ?? "";
  const notes = draft?.notes ?? dbUser?.studentProfile?.notes ?? "";
  const imageUrl = draft?.imageUrl ?? dbUser?.image ?? "";
  const hasMedicalCondition =
    draft?.hasMedicalCondition ??
    dbUser?.studentProfile?.hasMedicalCondition ??
    false;
  const medicalConditionDetails =
    draft?.medicalConditionDetails ??
    dbUser?.studentProfile?.medicalConditionDetails ??
    "";
  const agreePolicy =
    draft?.agreePolicy ?? dbUser?.studentProfile?.agreePolicy ?? false;

  const requiredFieldValues = {
    firstName,
    lastName,
    dateOfBirth,
    gender,
    email,
    phone,
    emergencyName,
    emergencyPhone,
  };
  const requiredTotal = Object.keys(requiredFieldValues).length + 1;
  const requiredMissingCount =
    Object.values(requiredFieldValues).filter(
      (value) => String(value ?? "").trim().length === 0,
    ).length + (agreePolicy ? 0 : 1);
  const requiredCompletedCount = requiredTotal - requiredMissingCount;
  const completionPercent =
    requiredTotal > 0
      ? Math.round((requiredCompletedCount / requiredTotal) * 100)
      : 0;

  const content = isArabic
    ? {
        title: "إعدادات الملف الشخصي",
        subtitle: "حدّث معلوماتك بالكامل من خلال النموذج التالي.",
        saved: "تم حفظ الملف الشخصي بنجاح.",
        requiredError:
          "يرجى تعبئة جميع الحقول المطلوبة قبل حفظ إعدادات الملف الشخصي.",
        invalidError: "يرجى التأكد من صحة البيانات المدخلة.",
        duplicateEmail: "هذا البريد الإلكتروني مستخدم بالفعل.",
        duplicatePhone: "رقم الهاتف مستخدم بالفعل.",
        roleError:
          "هذه الصفحة مخصصة للطلاب حالياً. تواصل مع الإدارة لتحديث نوع الحساب.",
        personal: "المعلومات الشخصية",
        contact: "معلومات التواصل",
        emergency: "جهة الاتصال للطوارئ",
        learning: "معلومات الدراسة",
        boolean: "خيارات الموافقة والتفضيلات",
        avatar: "الصورة الشخصية",
        avatarHelp:
          "ارفع صورة واضحة (الحد الأقصى 2MB). سيتم حفظها في ملفك الشخصي.",
        uploadAvatar: "رفع صورة",
        uploadingAvatar: "جارٍ الرفع...",
        avatarUploadError: "فشل رفع الصورة.",
        firstName: "الاسم الأول",
        lastName: "اسم العائلة",
        email: "البريد الإلكتروني",
        phone: "رقم الهاتف",
        dob: "تاريخ الميلاد",
        gender: "الجنس",
        address: "العنوان",
        country: "الدولة",
        city: "المدينة",
        countryPlaceholder: "ابحث عن الدولة",
        cityPlaceholder: "ابحث عن المدينة",
        noResults: "لا توجد نتائج",
        selectCountryFirst: "اختر الدولة أولًا",
        loadingLocations: "جارٍ تحميل قائمة الدول والمدن...",
        locationLoadError: "تعذر تحميل القوائم. حاول مرة أخرى.",
        emergencyName: "اسم جهة الطوارئ",
        emergencyPhone: "رقم جهة الطوارئ",
        relationship: "صلة القرابة",
        selectRelationship: "اختر صلة القرابة (اختياري)",
        relationshipParent: "ولي أمر",
        relationshipGuardian: "وصي",
        relationshipFriend: "صديق",
        relationshipOther: "أخرى",
        track: "المسار المفضل",
        trackHelp: "اختر المسار الفني الأساسي الذي ترغب بالتركيز عليه.",
        level: "الخبرة",
        experienceHelp: "اختر مستوى خبرتك الحالي في هذا المسار.",
        selectGender: "اختر الجنس",
        selectTrack: "اختر المسار المفضل",
        selectExperience: "اختر مستوى الخبرة",
        notes: "ملاحظات",
        hasExperience: "لدي خبرة سابقة",
        hasMedicalCondition: "لدي حالة صحية يجب إبلاغ الأكاديمية بها",
        medicalConditionDetails: "تفاصيل الحالة الصحية",
        medicalConditionPlaceholder: "اذكر الحالة الصحية أو أي ملاحظات مهمة",
        phonePlaceholder: "87654321",
        agreePolicy: "أوافق على سياسة الخصوصية وشروط الأكاديمية",
        viewTerms: "عرض الشروط والأحكام",
        termsTitle: "الشروط والأحكام",
        termsIntro: "يرجى قراءة البنود التالية قبل تأكيد الموافقة.",
        termsCancel: "إغلاق",
        termsConfirm: "تأكيد الموافقة",
        termsAccepted: "تمت الموافقة على الشروط والأحكام.",
        termsConfirmLine:
          "I confirm that I have read and agree to the Royal Academy Terms and Polocies",
        termsSections: termsSectionsAr,
        save: "حفظ البيانات",
        back: "العودة إلى الرئيسية",
      }
    : {
        title: "Profile Settings",
        subtitle:
          "Update your complete profile information using the form below.",
        saved: "Profile saved successfully.",
        requiredError:
          "Please fill all required fields before saving profile settings.",
        invalidError: "Please check your input values and try again.",
        duplicateEmail: "This email is already in use.",
        duplicatePhone: "This phone number is already in use.",
        roleError:
          "This settings page currently supports student profiles only. Please contact admin.",
        personal: "Personal Information",
        contact: "Contact Information",
        emergency: "Emergency Contact",
        learning: "Learning Details",
        boolean: "Consent & Preferences",
        avatar: "Profile Photo",
        avatarHelp:
          "Upload a clear image (max 2MB). It will be saved to your profile.",
        uploadAvatar: "Upload Photo",
        uploadingAvatar: "Uploading...",
        avatarUploadError: "Avatar upload failed.",
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email Address",
        phone: "Phone Number",
        dob: "Date of Birth",
        gender: "Gender",
        address: "Address",
        country: "Country",
        city: "City",
        countryPlaceholder: "Search country",
        cityPlaceholder: "Search city",
        noResults: "No results",
        selectCountryFirst: "Select country first",
        loadingLocations: "Loading countries and cities...",
        locationLoadError: "Could not load location lists. Please try again.",
        emergencyName: "Emergency Contact Name",
        emergencyPhone: "Emergency Contact Phone",
        relationship: "Relationship",
        selectRelationship: "Select relationship (optional)",
        relationshipParent: "Parent",
        relationshipGuardian: "Guardian",
        relationshipFriend: "Friend",
        relationshipOther: "Other",
        track: "Preferred Track",
        trackHelp: "Choose the main art track you want to focus on.",
        level: "Experience",
        experienceHelp: "Choose your current experience level in this track.",
        selectGender: "Select gender",
        selectTrack: "Select preferred track",
        selectExperience: "Select experience level",
        notes: "Notes",
        hasExperience: "I have prior experience",
        hasMedicalCondition:
          "I have a medical condition the academy should know about",
        medicalConditionDetails: "Medical Condition Details",
        medicalConditionPlaceholder:
          "Please describe the condition or important notes",
        phonePlaceholder: "87654321",
        agreePolicy: "I agree to the academy privacy policy and terms",
        viewTerms: "Read terms and policies",
        termsTitle: "Terms & Conditions",
        termsIntro: "Please read the following policies before confirming.",
        termsCancel: "Close",
        termsConfirm: "Confirm agreement",
        termsAccepted: "Terms and policies accepted.",
        termsConfirmLine:
          "I confirm that I have read and agree to the Royal Academy Terms and Polocies",
        termsSections: termsSectionsEn,
        save: "Save Profile",
        back: "Back to Home",
      };

  const genderA11y = getFieldA11y("gender");
  const genderOptions = [
    { value: "", label: content.selectGender },
    { value: "MALE", label: isArabic ? "ذكر" : "Male" },
    { value: "FEMALE", label: isArabic ? "أنثى" : "Female" },
    { value: "OTHER", label: isArabic ? "آخر" : "Other" },
  ];
  const relationshipOptions = [
    { value: "", label: content.selectRelationship },
    { value: "PARENT", label: content.relationshipParent },
    { value: "GUARDIAN", label: content.relationshipGuardian },
    { value: "FRIEND", label: content.relationshipFriend },
    { value: "OTHER", label: content.relationshipOther },
  ];
  const trackOptions = [
    { value: "", label: content.selectTrack },
    { value: "DANCE", label: isArabic ? "الرقص" : "Dance" },
    { value: "MUSIC", label: isArabic ? "الموسيقى" : "Music" },
    { value: "ART", label: isArabic ? "الفن" : "Art" },
  ];
  const experienceOptions = [
    { value: "", label: content.selectExperience },
    {
      value: "NO_EXPERIENCE",
      label: isArabic ? "بدون خبرة" : "No experience",
    },
    {
      value: "LESS_THAN_ONE_YEAR",
      label: isArabic ? "خبرة أقل من سنة" : "Less than a year experience",
    },
    {
      value: "MORE_THAN_ONE_YEAR",
      label: isArabic ? "خبرة أكثر من سنة" : "More than a year experience",
    },
  ];

  return (
    <main
      className="min-h-screen px-4 py-14 md:py-16"
      style={{ backgroundColor: "transparent" }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/pattern.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "1200px auto",
          opacity: 0.08,
          filter: "sepia(1) saturate(0.6) brightness(2)",
        }}
      />

      <section className="relative z-10 mx-auto w-full max-w-5xl rounded-3xl p-6 md:p-8 liquid-glass">
        <h1
          className="text-3xl font-light tracking-widest mb-2"
          style={{ color: "#e4d0b5" }}
        >
          {content.title}
        </h1>
        <p className="text-sm mb-8" style={{ color: "rgba(228,208,181,0.65)" }}>
          {content.subtitle}
        </p>

        <div className="mb-6 rounded-xl px-4 py-3 liquid-glass">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "#e4d0b5" }}>
              {isArabic ? "تقدم الحقول المطلوبة" : "Required Fields Progress"}
            </p>
            <p className="text-xs" style={{ color: "rgba(228,208,181,0.75)" }}>
              {requiredCompletedCount}/{requiredTotal}
            </p>
          </div>
          <div
            className="mt-2 h-2 w-full rounded-full overflow-hidden"
            style={{ border: "1px solid rgba(228,208,181,0.22)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${completionPercent}%`,
                background: "rgba(228,208,181,0.55)",
              }}
            />
          </div>
          <p className="mt-2 text-xs" style={{ color: "rgba(228,208,181,0.75)" }}>
            {requiredMissingCount === 0
              ? isArabic
                ? "تم إكمال جميع الحقول المطلوبة."
                : "All required fields are complete."
              : isArabic
                ? `يوجد ${requiredMissingCount} حقول مطلوبة ناقصة.`
                : `${requiredMissingCount} required fields missing.`}
          </p>
        </div>

        {query.saved === "1" && (
          <TimedAlert message={content.saved} tone="success" />
        )}

        {query.error === "required" && (
          <TimedAlert message={content.requiredError} tone="error" />
        )}
        {query.error === "required" && missingFields.length > 0 && (
          <>
            <ScrollToMissingField fieldIds={missingFields} />
            <p className="mb-4 text-sm" style={{ color: "#f87171" }}>
              {isArabic
                ? `${missingFields.length} حقول مطلوبة ناقصة.`
                : `${missingFields.length} required fields missing.`}
            </p>
          </>
        )}
        {query.error === "invalid" && (
          <TimedAlert message={content.invalidError} tone="error" />
        )}
        {query.error === "duplicate" && (
          <TimedAlert
            message={
              query.field === "phone"
                ? content.duplicatePhone
                : content.duplicateEmail
            }
            tone="error"
          />
        )}
        {query.error === "role" && (
          <TimedAlert message={content.roleError} tone="error" />
        )}

        <form
          id="profile-settings-form"
          action={saveProfileSettings}
          className="space-y-8"
          noValidate
        >
          <InlineRequiredValidation fieldIds={requiredFieldIds} />
          <UnsavedChangesGuard formId="profile-settings-form" />
          <input type="hidden" name="locale" value={locale} />
          <MobileSection title={content.personal}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AvatarUploadField
                initialUrl={imageUrl}
                label={content.avatar}
                helperText={content.avatarHelp}
                uploadText={content.uploadAvatar}
                uploadingText={content.uploadingAvatar}
                uploadErrorPrefix={content.avatarUploadError}
              />
              <label htmlFor="firstName" className="block">
                <span className="text-sm">
                  {content.firstName}{" "}
                  <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  id="firstName"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="firstName"
                  defaultValue={firstName}
                  required
                  {...getFieldA11y("firstName")}
                />
                {renderRequiredMessage("firstName")}
              </label>
              <label htmlFor="lastName" className="block">
                <span className="text-sm">
                  {content.lastName} <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  id="lastName"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="lastName"
                  defaultValue={lastName}
                  required
                  {...getFieldA11y("lastName")}
                />
                {renderRequiredMessage("lastName")}
              </label>
              <label htmlFor="dateOfBirth" className="block">
                <span className="text-sm">
                  {content.dob} <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  id="dateOfBirth"
                  type="date"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="dateOfBirth"
                  defaultValue={dateOfBirth}
                  required
                  {...getFieldA11y("dateOfBirth")}
                />
                {renderRequiredMessage("dateOfBirth")}
              </label>
              <label htmlFor="genderDisplay" className="block">
                <span className="text-sm">
                  {content.gender} <span style={{ color: "#f87171" }}>*</span>
                </span>
                <GlassSelectField
                  id="gender"
                  name="gender"
                  value={gender}
                  options={genderOptions}
                  placeholder={content.selectGender}
                  noResultsText={content.noResults}
                  inputClassName={fieldClassName}
                  inputStyle={inputStyle()}
                  ariaInvalid={Boolean(genderA11y["aria-invalid"])}
                  ariaDescribedBy={genderA11y["aria-describedby"]}
                />
                {renderRequiredMessage("gender")}
              </label>
            </div>
          </MobileSection>

          <MobileSection title={content.contact}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label htmlFor="email" className="block">
                <span className="text-sm">
                  {content.email} <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  id="email"
                  type="email"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="email"
                  defaultValue={email}
                  required
                  {...getFieldA11y("email")}
                />
                {renderRequiredMessage("email")}
              </label>
              <label htmlFor="phone" className="block">
                <span className="text-sm">
                  {content.phone} <span style={{ color: "#f87171" }}>*</span>
                </span>
                <div
                  className="mt-2 flex items-center gap-2 rounded-2xl px-4 py-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#e4d0b5]"
                  style={{ ...inputStyle(), direction: "ltr" }}
                >
                  <span
                    className="text-sm select-none"
                    style={{ color: "rgba(75,48,68,0.82)", direction: "ltr" }}
                  >
                    +968
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{8}"
                    maxLength={8}
                    className="w-full bg-transparent text-[#4b3044] outline-none placeholder:text-[#4b304499]"
                    style={{ direction: "ltr", textAlign: "left" }}
                    name="phone"
                    defaultValue={phone}
                    placeholder={content.phonePlaceholder}
                    required
                    {...getFieldA11y("phone")}
                  />
                </div>
                {renderRequiredMessage("phone")}
              </label>
              <label htmlFor="address" className="block md:col-span-2">
                <span className="text-sm">{content.address}</span>
                <input
                  id="address"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="address"
                  defaultValue={address}
                />
              </label>
              <CountryCityFields
                locale={locale}
                countryLabel={content.country}
                cityLabel={content.city}
                countryPlaceholder={content.countryPlaceholder}
                cityPlaceholder={content.cityPlaceholder}
                noResultsText={content.noResults}
                selectCountryFirstText={content.selectCountryFirst}
                loadingText={content.loadingLocations}
                loadErrorText={content.locationLoadError}
                initialCountry={country}
                initialCity={city}
                inputClassName={fieldClassName}
                inputStyle={inputStyle()}
              />
            </div>
          </MobileSection>

          <MobileSection title={content.emergency}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label htmlFor="emergencyContactName" className="block">
                <span className="text-sm">
                  {content.emergencyName}{" "}
                  <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  id="emergencyContactName"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="emergencyContactName"
                  defaultValue={emergencyName}
                  required
                  {...getFieldA11y("emergencyContactName")}
                />
                {renderRequiredMessage("emergencyContactName")}
              </label>
              <label htmlFor="emergencyContactPhone" className="block">
                <span className="text-sm">
                  {content.emergencyPhone}{" "}
                  <span style={{ color: "#f87171" }}>*</span>
                </span>
                <div
                  className="mt-2 flex items-center gap-2 rounded-2xl px-4 py-3 focus-within:outline focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#e4d0b5]"
                  style={{ ...inputStyle(), direction: "ltr" }}
                >
                  <span
                    className="text-sm select-none"
                    style={{ color: "rgba(75,48,68,0.82)", direction: "ltr" }}
                  >
                    +968
                  </span>
                  <input
                    id="emergencyContactPhone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{8}"
                    maxLength={8}
                    className="w-full bg-transparent text-[#4b3044] outline-none placeholder:text-[#4b304499]"
                    style={{ direction: "ltr", textAlign: "left" }}
                    name="emergencyContactPhone"
                    defaultValue={emergencyPhone}
                    placeholder={content.phonePlaceholder}
                    required
                    {...getFieldA11y("emergencyContactPhone")}
                  />
                </div>
                {renderRequiredMessage("emergencyContactPhone")}
              </label>
              <label htmlFor="emergencyRelationshipDisplay" className="block">
                <span className="text-sm">{content.relationship}</span>
                <GlassSelectField
                  id="emergencyRelationship"
                  name="emergencyRelationship"
                  value={emergencyRelationshipValue}
                  options={relationshipOptions}
                  placeholder={content.selectRelationship}
                  noResultsText={content.noResults}
                  inputClassName={fieldClassName}
                  inputStyle={inputStyle()}
                />
              </label>
            </div>
          </MobileSection>

          <MobileSection title={content.learning}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label htmlFor="preferredTrackDisplay" className="block">
                <span className="text-sm">{content.track}</span>
                <p className="mt-1 text-xs" style={{ color: "rgba(228,208,181,0.65)" }}>
                  {content.trackHelp}
                </p>
                <GlassSelectField
                  id="preferredTrack"
                  name="preferredTrack"
                  value={preferredTrack}
                  options={trackOptions}
                  placeholder={content.selectTrack}
                  noResultsText={content.noResults}
                  inputClassName={fieldClassName}
                  inputStyle={inputStyle()}
                />
              </label>
              <label htmlFor="experienceDisplay" className="block">
                <span className="text-sm">{content.level}</span>
                <p className="mt-1 text-xs" style={{ color: "rgba(228,208,181,0.65)" }}>
                  {content.experienceHelp}
                </p>
                <GlassSelectField
                  id="experience"
                  name="experience"
                  value={experience}
                  options={experienceOptions}
                  placeholder={content.selectExperience}
                  noResultsText={content.noResults}
                  inputClassName={fieldClassName}
                  inputStyle={inputStyle()}
                />
              </label>
              <label htmlFor="notes" className="block md:col-span-2">
                <span className="text-sm">{content.notes}</span>
                <textarea
                  id="notes"
                  className={`${fieldClassName} min-h-28`}
                  style={inputStyle()}
                  name="notes"
                  defaultValue={notes}
                />
              </label>
            </div>
          </MobileSection>

          <MobileSection title={content.boolean}>
            <div className="space-y-3">
              <MedicalConditionField
                defaultChecked={hasMedicalCondition}
                defaultDetails={medicalConditionDetails}
                checkboxClassName={checkboxClassName}
                fieldClassName={fieldClassName}
                inputStyle={inputStyle()}
                label={content.hasMedicalCondition}
                detailsLabel={content.medicalConditionDetails}
                detailsPlaceholder={content.medicalConditionPlaceholder}
              />
              <TermsConsentField
                defaultChecked={agreePolicy}
                checkboxClassName={checkboxClassName}
                label={content.agreePolicy}
                viewTermsText={content.viewTerms}
                modalTitle={content.termsTitle}
                modalIntro={content.termsIntro}
                sections={content.termsSections}
                confirmLine={content.termsConfirmLine}
                cancelText={content.termsCancel}
                confirmText={content.termsConfirm}
                acceptedHint={content.termsAccepted}
                fieldA11y={getFieldA11y("agreePolicy")}
              />
              {renderRequiredMessage("agreePolicy")}
            </div>
          </MobileSection>

          <button
            type="submit"
            className={`${primaryButtonFocusClassName} liquid-glass-gold shimmer`}
            style={{
              color: "#e4d0b5",
              opacity: 1,
            }}
          >
            {content.save}
          </button>
        </form>
        <div className="mt-4 pt-4 border-t border-white/10">
          <Link
            href={`/${locale}`}
            className="text-xs tracking-widest uppercase transition-opacity hover:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]"
            style={{ color: "rgba(228,208,181,0.55)" }}
          >
            {content.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
