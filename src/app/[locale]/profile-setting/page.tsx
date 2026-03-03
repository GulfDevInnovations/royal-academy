import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { saveProfileSettings } from "./actions";

function inputStyle() {
  return {
    background:
      "linear-gradient(135deg, rgba(228,208,181,0.09) 0%, rgba(228,208,181,0.04) 100%)",
    border: "1px solid rgba(228,208,181,0.15)",
    color: "#e4d0b5",
  };
}

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
  const missingSet = new Set(
    (query.missing ?? "")
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean),
  );
  const requiredMessage = "This field is required!";
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

  const firstName = dbUser?.studentProfile?.firstName;
  const lastName = dbUser?.studentProfile?.lastName;
  const email = dbUser?.email ?? user.email ?? "";
  const phone = dbUser?.phone ?? user.phone ?? "";

  const dateOfBirth = dbUser?.studentProfile?.dateOfBirth
    ? dbUser.studentProfile.dateOfBirth.toISOString().slice(0, 10)
    : "";
  const gender = dbUser?.studentProfile?.gender ?? "";
  const address = dbUser?.studentProfile?.address ?? "";
  const city = dbUser?.studentProfile?.city ?? "";
  const country = dbUser?.studentProfile?.country ?? "";
  const emergencyContact = dbUser?.studentProfile?.emergencyContact ?? "";
  const [
    legacyEmergencyName = "",
    legacyEmergencyPhone = "",
    legacyEmergencyRelationship = "",
  ] = emergencyContact.split(" | ");
  const emergencyName =
    dbUser?.studentProfile?.emergencyContactName ?? legacyEmergencyName;
  const emergencyPhone =
    dbUser?.studentProfile?.emergencyContactPhone ?? legacyEmergencyPhone;
  const emergencyRelationship =
    dbUser?.studentProfile?.emergencyRelationship ??
    legacyEmergencyRelationship;
  const preferredTrack = dbUser?.studentProfile?.preferredTrack ?? "";
  const experience = dbUser?.studentProfile?.experience ?? "";
  const notes = dbUser?.studentProfile?.notes ?? "";

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
        firstName: "الاسم الأول",
        lastName: "اسم العائلة",
        email: "البريد الإلكتروني",
        phone: "رقم الهاتف",
        dob: "تاريخ الميلاد",
        gender: "الجنس",
        address: "العنوان",
        city: "المدينة",
        country: "الدولة",
        emergencyName: "اسم جهة الطوارئ",
        emergencyPhone: "رقم جهة الطوارئ",
        relationship: "صلة القرابة",
        track: "المسار المفضل",
        level: "الخبرة",
        notes: "ملاحظات",
        hasExperience: "لدي خبرة سابقة",
        hasMedicalCondition: "لدي حالة صحية يجب إبلاغ الأكاديمية بها",
        needsSupport: "أحتاج دعماً إضافياً أثناء الحصص",
        receiveEmail: "أوافق على استقبال التحديثات عبر البريد الإلكتروني",
        receiveWhatsapp: "أوافق على استقبال التحديثات عبر واتساب",
        agreePolicy: "أوافق على سياسة الخصوصية وشروط الأكاديمية",
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
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email Address",
        phone: "Phone Number",
        dob: "Date of Birth",
        gender: "Gender",
        address: "Address",
        city: "City",
        country: "Country",
        emergencyName: "Emergency Contact Name",
        emergencyPhone: "Emergency Contact Phone",
        relationship: "Relationship",
        track: "Preferred Track",
        level: "Experience",
        notes: "Notes",
        hasExperience: "I have prior experience",
        hasMedicalCondition:
          "I have a medical condition the academy should know about",
        needsSupport: "I need additional support during classes",
        receiveEmail: "I agree to receive updates by email",
        receiveWhatsapp: "I agree to receive updates by WhatsApp",
        agreePolicy: "I agree to the academy privacy policy and terms",
        save: "Save Profile",
        back: "Back to Home",
      };

  return (
    <main
      className="min-h-screen px-4 py-24"
      style={{ backgroundColor: "#227b81" }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "url('/images/pattern.svg')",
          backgroundRepeat: "repeat",
          backgroundSize: "1200px auto",
          opacity: 0.02,
          filter: "sepia(1) saturate(0.6) brightness(2)",
        }}
      />

      <section
        className="relative z-10 mx-auto w-full max-w-5xl rounded-3xl p-6 md:p-8"
        style={{
          background:
            "linear-gradient(135deg, rgba(228,208,181,0.13) 0%, rgba(228,208,181,0.05) 50%, rgba(228,208,181,0.10) 100%)",
          backdropFilter: "blur(24px) saturate(1.8)",
          WebkitBackdropFilter: "blur(24px) saturate(1.8)",
          border: "1px solid rgba(228,208,181,0.20)",
          boxShadow:
            "0 24px 64px rgba(0,0,0,0.25), inset 0 1px 1px rgba(228,208,181,0.30)",
        }}
      >
        <h1
          className="text-3xl font-light tracking-widest mb-2"
          style={{ color: "#e4d0b5" }}
        >
          {content.title}
        </h1>
        <p className="text-sm mb-8" style={{ color: "rgba(228,208,181,0.65)" }}>
          {content.subtitle}
        </p>

        {query.saved === "1" && (
          <p
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              color: "#86efac",
              background: "rgba(134,239,172,0.08)",
              border: "1px solid rgba(134,239,172,0.20)",
            }}
          >
            {content.saved}
          </p>
        )}

        {query.error === "required" && (
          <p
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              color: "#fca5a5",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.20)",
            }}
          >
            {content.requiredError}
          </p>
        )}
        {query.error === "invalid" && (
          <p
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              color: "#fca5a5",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.20)",
            }}
          >
            {content.invalidError}
          </p>
        )}
        {query.error === "duplicate" && (
          <p
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              color: "#fca5a5",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.20)",
            }}
          >
            {query.field === "phone"
              ? content.duplicatePhone
              : content.duplicateEmail}
          </p>
        )}
        {query.error === "role" && (
          <p
            className="mb-4 rounded-xl px-4 py-3 text-sm"
            style={{
              color: "#fca5a5",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.20)",
            }}
          >
            {content.roleError}
          </p>
        )}

        <form action={saveProfileSettings} className="space-y-8" noValidate>
          <input type="hidden" name="locale" value={locale} />
          <div>
            <h2
              className="text-lg tracking-wide mb-4"
              style={{ color: "#e4d0b5" }}
            >
              {content.personal}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm">
                  {content.firstName}{" "}
                  <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="firstName"
                  defaultValue={firstName}
                  required
                />
                {missingSet.has("firstName") && (
                  <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
                    {requiredMessage}
                  </p>
                )}
              </label>
              <label className="block">
                <span className="text-sm">
                  {content.lastName} <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="lastName"
                  defaultValue={lastName}
                  required
                />
                {missingSet.has("lastName") && (
                  <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
                    {requiredMessage}
                  </p>
                )}
              </label>
              <label className="block">
                <span className="text-sm">
                  {content.dob} <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  type="date"
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="dateOfBirth"
                  defaultValue={dateOfBirth}
                  required
                />
                {missingSet.has("dateOfBirth") && (
                  <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
                    {requiredMessage}
                  </p>
                )}
              </label>
              <label className="block">
                <span className="text-sm">
                  {content.gender} <span style={{ color: "#f87171" }}>*</span>
                </span>
                <select
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="gender"
                  defaultValue={gender}
                  required
                >
                  <option value="">Select</option>
                  <option value="MALE">{isArabic ? "ذكر" : "Male"}</option>
                  <option value="FEMALE">{isArabic ? "أنثى" : "Female"}</option>
                  <option value="OTHER">{isArabic ? "آخر" : "Other"}</option>
                </select>
                {missingSet.has("gender") && (
                  <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
                    {requiredMessage}
                  </p>
                )}
              </label>
            </div>
          </div>

          <div>
            <h2
              className="text-lg tracking-wide mb-4"
              style={{ color: "#e4d0b5" }}
            >
              {content.contact}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm">
                  {content.email} <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  type="email"
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="email"
                  defaultValue={email}
                  required
                />
                {missingSet.has("email") && (
                  <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
                    {requiredMessage}
                  </p>
                )}
              </label>
              <label className="block">
                <span className="text-sm">
                  {content.phone} <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  type="tel"
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="phone"
                  defaultValue={phone}
                  required
                />
                {missingSet.has("phone") && (
                  <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
                    {requiredMessage}
                  </p>
                )}
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm">{content.address}</span>
                <input
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="address"
                  defaultValue={address}
                />
              </label>
              <label className="block">
                <span className="text-sm">{content.city}</span>
                <input
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="city"
                  defaultValue={city}
                />
              </label>
              <label className="block">
                <span className="text-sm">{content.country}</span>
                <input
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="country"
                  defaultValue={country}
                />
              </label>
            </div>
          </div>

          <div>
            <h2
              className="text-lg tracking-wide mb-4"
              style={{ color: "#e4d0b5" }}
            >
              {content.emergency}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="block">
                <span className="text-sm">
                  {content.emergencyName}{" "}
                  <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="emergencyContactName"
                  defaultValue={emergencyName}
                  required
                />
                {missingSet.has("emergencyContactName") && (
                  <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
                    {requiredMessage}
                  </p>
                )}
              </label>
              <label className="block">
                <span className="text-sm">
                  {content.emergencyPhone}{" "}
                  <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  type="tel"
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="emergencyContactPhone"
                  defaultValue={emergencyPhone}
                  required
                />
                {missingSet.has("emergencyContactPhone") && (
                  <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
                    {requiredMessage}
                  </p>
                )}
              </label>
              <label className="block">
                <span className="text-sm">
                  {content.relationship}{" "}
                  <span style={{ color: "#f87171" }}>*</span>
                </span>
                <input
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="emergencyRelationship"
                  defaultValue={emergencyRelationship}
                  required
                />
                {missingSet.has("emergencyRelationship") && (
                  <p className="mt-1 text-xs" style={{ color: "#f87171" }}>
                    {requiredMessage}
                  </p>
                )}
              </label>
            </div>
          </div>

          <div>
            <h2
              className="text-lg tracking-wide mb-4"
              style={{ color: "#e4d0b5" }}
            >
              {content.learning}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm">{content.track}</span>
                <select
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="preferredTrack"
                  defaultValue={preferredTrack}
                >
                  <option value="">Select</option>
                  <option value="DANCE">{isArabic ? "الرقص" : "Dance"}</option>
                  <option value="MUSIC">
                    {isArabic ? "الموسيقى" : "Music"}
                  </option>
                  <option value="ART">{isArabic ? "الفن" : "Art"}</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm">{content.level}</span>
                <select
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none"
                  style={inputStyle()}
                  name="experience"
                  defaultValue={experience}
                >
                  <option value="">Select</option>
                  <option value="NO_EXPERIENCE">
                    {isArabic ? "بدون خبرة" : "No experience"}
                  </option>
                  <option value="LESS_THAN_ONE_YEAR">
                    {isArabic
                      ? "خبرة أقل من سنة"
                      : "Less than a year experience"}
                  </option>
                  <option value="MORE_THAN_ONE_YEAR">
                    {isArabic
                      ? "خبرة أكثر من سنة"
                      : "More than a year experience"}
                  </option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm">{content.notes}</span>
                <textarea
                  className="mt-2 w-full rounded-2xl px-4 py-3 outline-none min-h-28"
                  style={inputStyle()}
                  name="notes"
                  defaultValue={notes}
                />
              </label>
            </div>
          </div>

          <div>
            <h2
              className="text-lg tracking-wide mb-4"
              style={{ color: "#e4d0b5" }}
            >
              {content.boolean}
            </h2>
            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <input type="checkbox" name="hasExperience" className="mt-1" />
                <span>{content.hasExperience}</span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="hasMedicalCondition"
                  className="mt-1"
                />
                <span>{content.hasMedicalCondition}</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" name="needsSupport" className="mt-1" />
                <span>{content.needsSupport}</span>
              </label>
              <label className="flex items-start gap-3">
                <input type="checkbox" name="receiveEmail" className="mt-1" />
                <span>{content.receiveEmail}</span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="receiveWhatsapp"
                  className="mt-1"
                />
                <span>{content.receiveWhatsapp}</span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="agreePolicy"
                  className="mt-1"
                  required
                />
                <span>{content.agreePolicy}</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-2xl text-sm tracking-[0.2em] uppercase"
            style={{
              background:
                "linear-gradient(135deg, rgba(228,208,181,0.18) 0%, rgba(228,208,181,0.08) 50%, rgba(228,208,181,0.15) 100%)",
              border: "1px solid rgba(228,208,181,0.35)",
              color: "#e4d0b5",
              opacity: 1,
            }}
          >
            {content.save}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10">
          <Link
            href={`/${locale}`}
            className="text-xs tracking-widest uppercase transition-opacity hover:opacity-70"
            style={{ color: "rgba(228,208,181,0.55)" }}
          >
            {content.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
