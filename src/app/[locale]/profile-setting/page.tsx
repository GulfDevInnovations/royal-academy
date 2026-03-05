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
  hasMedicalCondition: boolean;
  medicalConditionDetails: string;
  agreePolicy: boolean;
};

function inputStyle() {
  return {
    background:
      "linear-gradient(135deg, rgba(228,208,181,0.09) 0%, rgba(228,208,181,0.04) 100%)",
    border: "1px solid rgba(228,208,181,0.15)",
    color: "#e4d0b5",
  };
}

const fieldClassName =
  "mt-2 w-full rounded-2xl px-4 py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]";
const checkboxClassName =
  "mt-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]";
const primaryButtonFocusClassName =
  "w-full py-3 rounded-2xl text-sm tracking-[0.2em] uppercase focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e4d0b5]";

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
  const phone = draft?.phone ?? dbUser?.phone ?? user.phone ?? "";

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
    draft?.emergencyContactPhone ??
    dbUser?.studentProfile?.emergencyContactPhone ??
    "";
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
        agreePolicy: "I agree to the academy privacy policy and terms",
        save: "Save Profile",
        back: "Back to Home",
      };

  return (
    <main
      className="min-h-screen px-4 py-24 pb-40 md:pb-24"
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

        <div
          className="mb-6 rounded-xl px-4 py-3"
          style={{
            background: "rgba(228,208,181,0.06)",
            border: "1px solid rgba(228,208,181,0.18)",
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: "#e4d0b5" }}>
              {isArabic ? "تقدم الحقول المطلوبة" : "Required Fields Progress"}
            </p>
            <p className="text-xs" style={{ color: "rgba(228,208,181,0.75)" }}>
              {requiredCompletedCount}/{requiredTotal}
            </p>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${completionPercent}%`,
                background:
                  "linear-gradient(90deg, rgba(228,208,181,0.45), rgba(228,208,181,0.8))",
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
          className="space-y-8 pb-24 md:pb-0"
          noValidate
        >
          <InlineRequiredValidation fieldIds={requiredFieldIds} />
          <UnsavedChangesGuard formId="profile-settings-form" />
          <input type="hidden" name="locale" value={locale} />
          <MobileSection title={content.personal}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              <label htmlFor="gender" className="block">
                <span className="text-sm">
                  {content.gender} <span style={{ color: "#f87171" }}>*</span>
                </span>
                <select
                  id="gender"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="gender"
                  defaultValue={gender}
                  required
                  {...getFieldA11y("gender")}
                >
                  <option value="">{content.selectGender}</option>
                  <option value="MALE">{isArabic ? "ذكر" : "Male"}</option>
                  <option value="FEMALE">{isArabic ? "أنثى" : "Female"}</option>
                  <option value="OTHER">{isArabic ? "آخر" : "Other"}</option>
                </select>
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
                <input
                  id="phone"
                  type="tel"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="phone"
                  defaultValue={phone}
                  required
                  {...getFieldA11y("phone")}
                />
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
              <label htmlFor="city" className="block">
                <span className="text-sm">{content.city}</span>
                <input
                  id="city"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="city"
                  defaultValue={city}
                />
              </label>
              <label htmlFor="country" className="block">
                <span className="text-sm">{content.country}</span>
                <input
                  id="country"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="country"
                  defaultValue={country}
                />
              </label>
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
                <input
                  id="emergencyContactPhone"
                  type="tel"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="emergencyContactPhone"
                  defaultValue={emergencyPhone}
                  required
                  {...getFieldA11y("emergencyContactPhone")}
                />
                {renderRequiredMessage("emergencyContactPhone")}
              </label>
              <label htmlFor="emergencyRelationship" className="block">
                <span className="text-sm">{content.relationship}</span>
                <select
                  id="emergencyRelationship"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="emergencyRelationship"
                  defaultValue={emergencyRelationshipValue}
                >
                  <option value="">{content.selectRelationship}</option>
                  <option value="PARENT">{content.relationshipParent}</option>
                  <option value="GUARDIAN">{content.relationshipGuardian}</option>
                  <option value="FRIEND">{content.relationshipFriend}</option>
                  <option value="OTHER">{content.relationshipOther}</option>
                </select>
              </label>
            </div>
          </MobileSection>

          <MobileSection title={content.learning}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label htmlFor="preferredTrack" className="block">
                <span className="text-sm">{content.track}</span>
                <p className="mt-1 text-xs" style={{ color: "rgba(228,208,181,0.65)" }}>
                  {content.trackHelp}
                </p>
                <select
                  id="preferredTrack"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="preferredTrack"
                  defaultValue={preferredTrack}
                >
                  <option value="">{content.selectTrack}</option>
                  <option value="DANCE">{isArabic ? "الرقص" : "Dance"}</option>
                  <option value="MUSIC">
                    {isArabic ? "الموسيقى" : "Music"}
                  </option>
                  <option value="ART">{isArabic ? "الفن" : "Art"}</option>
                </select>
              </label>
              <label htmlFor="experience" className="block">
                <span className="text-sm">{content.level}</span>
                <p className="mt-1 text-xs" style={{ color: "rgba(228,208,181,0.65)" }}>
                  {content.experienceHelp}
                </p>
                <select
                  id="experience"
                  className={fieldClassName}
                  style={inputStyle()}
                  name="experience"
                  defaultValue={experience}
                >
                  <option value="">{content.selectExperience}</option>
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
              <label htmlFor="agreePolicy" className="flex items-start gap-3">
                <input
                  id="agreePolicy"
                  type="checkbox"
                  name="agreePolicy"
                  className={checkboxClassName}
                  defaultChecked={agreePolicy}
                  required
                  {...getFieldA11y("agreePolicy")}
                />
                <span>
                  {content.agreePolicy}{" "}
                  <span style={{ color: "#f87171" }}>*</span>
                </span>
              </label>
              {renderRequiredMessage("agreePolicy")}
            </div>
          </MobileSection>

          <button
            type="submit"
            className={`hidden md:block ${primaryButtonFocusClassName}`}
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

        <div
          className="fixed inset-x-0 bottom-0 z-40 px-4 pt-3 md:hidden"
          style={{
            background:
              "linear-gradient(to top, rgba(34,123,129,0.95), rgba(34,123,129,0.82), rgba(34,123,129,0))",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            borderTop: "1px solid rgba(228,208,181,0.15)",
            paddingBottom: "calc(env(safe-area-inset-bottom) + 0.75rem)",
          }}
        >
          <div className="mx-auto w-full max-w-5xl">
            <button
              type="submit"
              form="profile-settings-form"
              className={primaryButtonFocusClassName}
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
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/10">
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
