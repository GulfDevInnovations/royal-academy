"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { z } from "zod";
import {
  Gender,
  Prisma,
  ProfileExperience,
  ProfileTrack,
  Role,
} from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

const PROFILE_DRAFT_COOKIE = "profile_setting_draft";

const REQUIRED_FIELDS = [
  "firstName",
  "lastName",
  "dateOfBirth",
  "gender",
  "email",
  "phone",
  "emergencyContactName",
  "emergencyContactPhone",
  "emergencyRelationship",
  "country",
  "city",
  "preferredTrack",
  "experience",
];

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeLocalOmPhone(raw: string) {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("968") && digits.length >= 11) {
    return digits.slice(3, 11);
  }
  return digits.slice(0, 8);
}

const profileSchema = z.object({
  locale: z.enum(["en", "ar"]).default("en"),
  firstName: z.string().trim().min(1),
  lastName: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone: z.string().regex(/^\d{8}$/),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum([Gender.MALE, Gender.FEMALE, Gender.OTHER]),
  emergencyContactName: z.string().trim().min(1),
  emergencyContactPhone: z.string().regex(/^\d{8}$/),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
  imageUrl: z.string().trim().optional(),
  hasMedicalCondition: z.boolean().default(false),
  medicalConditionDetails: z.string().trim().optional(),
  agreePolicy: z.literal(true),
  emergencyRelationship: z.string().trim().min(1),   // was optional
preferredTrack: z.enum([ProfileTrack.DANCE, ProfileTrack.MUSIC, ProfileTrack.ART]),  // remove .optional()
experience: z.enum([
  ProfileExperience.NO_EXPERIENCE,
  ProfileExperience.LESS_THAN_ONE_YEAR,
  ProfileExperience.MORE_THAN_ONE_YEAR,
]),  // remove .optional()
city: z.string().trim().min(1),      // was optional
country: z.string().trim().min(1),   // was optional
});

export async function saveProfileSettings(formData: FormData) {
  console.log("DEBUG fields received:", Object.fromEntries(formData.entries()));
  const cookieStore = await cookies();
  const rawLocale = formData.get("locale");
  const locale = rawLocale === "ar" ? "ar" : "en";

  const draft = {
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    email: getString(formData, "email"),
    phone: normalizeLocalOmPhone(getString(formData, "phone")),
    dateOfBirth: getString(formData, "dateOfBirth"),
    gender: getString(formData, "gender"),
    emergencyContactName: getString(formData, "emergencyContactName"),
    emergencyContactPhone: normalizeLocalOmPhone(
      getString(formData, "emergencyContactPhone"),
    ),
    emergencyRelationship: getString(formData, "emergencyRelationship"),
    preferredTrack: getString(formData, "preferredTrack"),
    experience: getString(formData, "experience"),
    address: getString(formData, "address"),
    city: getString(formData, "city"),
    country: getString(formData, "country"),
    notes: getString(formData, "notes"),
    imageUrl: getString(formData, "imageUrl"),
    hasMedicalCondition: formData.get("hasMedicalCondition") === "on",
    medicalConditionDetails: getString(formData, "medicalConditionDetails"),
    agreePolicy: formData.get("agreePolicy") === "on",
  };

  cookieStore.set(
    PROFILE_DRAFT_COOKIE,
    encodeURIComponent(JSON.stringify(draft)),
    {
      path: "/",
      maxAge: 60 * 30,
      httpOnly: true,
      sameSite: "lax",
    },
  );

  const missingFields = REQUIRED_FIELDS.filter(
  (field) => getString(formData, field).length === 0,
);
if (formData.get("agreePolicy") !== "on") {
  missingFields.push("agreePolicy");
}

  if (missingFields.length > 0) {
    const missing = encodeURIComponent(missingFields.join(","));
    redirect(`/${locale}/profile-setting?error=required&missing=${missing}`);
  }

  const parsed = profileSchema.safeParse({
    locale: formData.get("locale"),
    firstName: getString(formData, "firstName"),
    lastName: getString(formData, "lastName"),
    email: getString(formData, "email"),
    phone: normalizeLocalOmPhone(getString(formData, "phone")),
    dateOfBirth: getString(formData, "dateOfBirth"),
    gender: formData.get("gender"),
    emergencyContactName: getString(formData, "emergencyContactName"),
    emergencyContactPhone: normalizeLocalOmPhone(
      getString(formData, "emergencyContactPhone"),
    ),
    emergencyRelationship: getString(formData, "emergencyRelationship"),
    preferredTrack: getString(formData, "preferredTrack"),
    experience: getString(formData, "experience"),
    address: getString(formData, "address"),
    city: getString(formData, "city"),
    country: getString(formData, "country"),
    notes: getString(formData, "notes"),
    imageUrl: getString(formData, "imageUrl"),
    hasMedicalCondition: formData.get("hasMedicalCondition") === "on",
    medicalConditionDetails: getString(formData, "medicalConditionDetails"),
    agreePolicy: formData.get("agreePolicy") === "on",
  });

  if (!parsed.success) {
    console.log("Profile validation errors:", parsed.error.flatten());
    redirect(`/${locale}/profile-setting?error=invalid`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login?redirectTo=/${locale}/profile-setting`);
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  console.log("AUTH_USER_ID", user?.id);

  if (!dbUser) {
    console.log("DB_USER_NOT_FOUND_FOR_SUPABASE_ID", user.id);
    redirect(`/${locale}/profile-setting?error=invalid`);
  }

  // Role-safe profile strategy: this form persists StudentProfile only.
  if (dbUser.role !== Role.STUDENT) {
    redirect(`/${locale}/profile-setting?error=role`);
  }

  const data = parsed.data;

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        email: data.email,
        phone: `+968${data.phone}`,
        image: data.imageUrl || null,
        studentProfile: {
          upsert: {
            create: {
              firstName: data.firstName,
              lastName: data.lastName,
              dateOfBirth: new Date(data.dateOfBirth),
              gender: data.gender,
              address: data.address || null,
              city: data.city || null,
              country: data.country || null,
              emergencyContactName: data.emergencyContactName,
              emergencyContactPhone: `+968${data.emergencyContactPhone}`,
              emergencyRelationship: data.emergencyRelationship,
              hasMedicalCondition: data.hasMedicalCondition,
              medicalConditionDetails: data.hasMedicalCondition
                ? (data.medicalConditionDetails || null)
                : null,
              agreePolicy: data.agreePolicy,
              preferredTrack: data.preferredTrack ?? null,
              experience: data.experience ?? null,
              notes: data.notes || null,
            },
            update: {
              firstName: data.firstName,
              lastName: data.lastName,
              dateOfBirth: new Date(data.dateOfBirth),
              gender: data.gender,
              address: data.address || null,
              city: data.city || null,
              country: data.country || null,
              emergencyContactName: data.emergencyContactName,
              emergencyContactPhone: `+968${data.emergencyContactPhone}`,
              emergencyRelationship: data.emergencyRelationship,
              hasMedicalCondition: data.hasMedicalCondition,
              medicalConditionDetails: data.hasMedicalCondition
                ? (data.medicalConditionDetails || null)
                : null,
              agreePolicy: data.agreePolicy,
              preferredTrack: data.preferredTrack ?? null,
              experience: data.experience ?? null,
              notes: data.notes || null,
            },
          },
        },
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target.join(",")
        : String(error.meta?.target ?? "");
      const conflictField = target.includes("phone")
        ? "phone"
        : target.includes("email")
          ? "email"
          : "unknown";
      redirect(
        `/${locale}/profile-setting?error=duplicate&field=${conflictField}`
      );
    }
    throw error;
  }

  cookieStore.set(PROFILE_DRAFT_COOKIE, "", {
    path: "/",
    maxAge: 0,
  });

  redirect(`/${data.locale}/profile-setting?saved=1`);
}
