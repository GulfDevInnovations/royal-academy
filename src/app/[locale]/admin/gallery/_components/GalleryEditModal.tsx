"use client";

import { useRef, useState, useTransition } from "react";
import { X, Loader2, Video, ChevronDown, ChevronUp } from "lucide-react";
import {
  AdminInput,
  AdminSelect,
  AdminButton,
  adminColors,
} from "@/components/admin/ui";
import { updateGalleryItem } from "@/lib/actions/admin/gallery.actions";
import type {
  SerializedGalleryItem,
  SerializedCategory,
  SerializedPerson,
} from "./GalleryClient";
import { useTranslations } from "next-intl";
import DatePicker from "@/components/date-time/DatePicker";

interface Props {
  item: SerializedGalleryItem;
  categories: SerializedCategory[];
  persons: SerializedPerson[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function GalleryEditModal({
  item,
  categories,
  persons,
  onClose,
  onSuccess,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const t = useTranslations("admin");

  const [selectedPersons, setSelectedPersons] = useState<string[]>(
    item.persons.map((p) => p.person.id),
  );
  const [langTab, setLangTab] = useState<"en" | "ar">("en");

  const togglePerson = (id: string) =>
    setSelectedPersons((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const formData = new FormData(formRef.current!);
    formData.delete("personIds");
    selectedPersons.forEach((id) => formData.append("personIds", id));

    startTransition(async () => {
      const result = await updateGalleryItem(item.id, formData);
      if (result.error) setError(result.error);
      else onSuccess();
    });
  };

  const takenAtValue = item.takenAt
    ? new Date(item.takenAt).toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    borderColor: adminColors.border,
    color: adminColors.textPrimary,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative w-full max-w-2xl rounded-2xl border border-white/8 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
        style={{ background: "#1a1d27" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] sticky top-0 z-10"
          style={{ background: "#1a1d27" }}
        >
          <h2
            className="text-xl font-semibold"
            style={{ color: adminColors.textPrimary }}
          >
            Edit Media
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={16} style={{ color: adminColors.pinkText }} />
          </button>
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="px-6 py-5 space-y-4"
        >
          <div
            className="flex items-center gap-1 p-1 rounded-lg w-fit"
            style={{ background: "rgba(255,255,255,0.05)" }}
          >
            {(["en", "ar"] as const).map((lang) => (
              <button
                key={lang}
                type="button"
                onClick={() => setLangTab(lang)}
                className="px-3 py-1 rounded-md text-l font-medium transition-all"
                style={{
                  background:
                    langTab === lang ? "rgba(251,191,36,0.15)" : "transparent",
                  color: langTab === lang ? "#fbbf24" : adminColors.textMuted,
                  border:
                    langTab === lang
                      ? "1px solid rgba(251,191,36,0.3)"
                      : "1px solid transparent",
                }}
              >
                {lang === "en" ? "🇬🇧 English" : "🇴🇲 Arabic"}
              </button>
            ))}
          </div>
          {/* Preview */}
          <div
            className="w-full rounded-xl overflow-hidden flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.03)", minHeight: "80px" }}
          >
            {item.mediaType === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.url}
                alt={item.altText ?? item.title ?? ""}
                className="max-h-36 w-full object-contain"
              />
            ) : (
              <div className="flex items-center gap-3 py-5">
                <Video size={26} style={{ color: "#f59e0b" }} />
                <span
                  className="text-l"
                  style={{ color: adminColors.textSecondary }}
                >
                  {item.title ?? "Video"}
                </span>
              </div>
            )}
          </div>

          {/* Title */}

          <div className="space-y-1.5">
            <label
              className="text-l"
              style={{ color: adminColors.textSecondary }}
            >
              Title <span className="text-red-400">*</span>
              {langTab === "ar" && (
                <span
                  className="ml-1 text-[16px]"
                  style={{ color: adminColors.textMuted }}
                >
                  (Arabic)
                </span>
              )}
            </label>
            <input
              name="title"
              defaultValue={item?.title ?? ""}
              placeholder="e.g. Last event"
              className="w-full text-l rounded-lg border px-3 py-2 outline-none"
              style={{
                ...inputStyle,
                display: langTab === "en" ? "block" : "none",
              }}
            />
            <input
              name="title_ar"
              defaultValue={(item as any)?.title_ar ?? ""}
              dir="rtl"
              placeholder="مثال: آخر فعالية"
              className="w-full text-l rounded-lg border px-3 py-2 outline-none"
              style={{
                ...inputStyle,
                fontFamily: "var(--font-layla, sans-serif)",
                display: langTab === "ar" ? "block" : "none",
              }}
            />
          </div>

          {/* Category */}
          {categories.length > 0 && (
            <AdminSelect
              label="Category"
              name="categoryId"
              defaultValue={item.categoryId ?? ""}
            >
              <option value="" className="text-black">
                — No category —
              </option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="text-black">
                  {cat.name}
                </option>
              ))}
            </AdminSelect>
          )}

          {/* People */}
          {persons.length > 0 && (
            <div>
              <label
                className="block text-l font-medium mb-2"
                style={{ color: adminColors.textSecondary }}
              >
                Tag People
              </label>
              <div className="flex flex-wrap gap-2">
                {persons.map((p) => {
                  const selected = selectedPersons.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePerson(p.id)}
                      className="px-2.5 py-1 rounded-full text-l transition-all border"
                      style={{
                        borderColor: selected
                          ? "#f59e0b"
                          : "rgba(255,255,255,0.1)",
                        background: selected
                          ? "rgba(245,158,11,0.1)"
                          : "rgba(255,255,255,0.03)",
                        color: selected ? "#f59e0b" : adminColors.textSecondary,
                      }}
                    >
                      {p.displayName}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Advanced */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="flex items-center gap-1.5 text-l transition-colors"
              style={{ color: adminColors.textMuted }}
            >
              {showAdvanced ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
              Advanced options
            </button>

            {showAdvanced && (
              <div className="mt-3 space-y-3 pl-1">
                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-l">
                    Description
                    {langTab === "ar" && (
                      <span
                        className="ml-1 text-[16px]"
                        style={{ color: adminColors.textMuted }}
                      >
                        (Arabic)
                      </span>
                    )}
                  </label>
                  <textarea
                    name="description"
                    defaultValue={item?.description ?? ""}
                    rows={3}
                    className="w-full text-l rounded-lg border px-3 py-2 outline-none resize-none"
                    style={{
                      ...inputStyle,
                      display: langTab === "en" ? "block" : "none",
                    }}
                  />
                  <textarea
                    name="description_ar"
                    defaultValue={(item as any)?.description_ar ?? ""}
                    rows={3}
                    dir="rtl"
                    placeholder="الوصف بالعربي"
                    className="w-full text-l rounded-lg border px-3 py-2 outline-none resize-none"
                    style={{
                      ...inputStyle,
                      fontFamily: "var(--font-layla, sans-serif)",
                      display: langTab === "ar" ? "block" : "none",
                    }}
                  />
                </div>

                <AdminInput
                  label="Alt Text"
                  name="altText"
                  defaultValue={item.altText ?? ""}
                  placeholder="Describe for screen readers"
                />

                <AdminSelect
                  label="Visibility"
                  name="visibility"
                  defaultValue={item.visibility}
                >
                  <option value="PUBLISHED" className="text-black">
                    Published
                  </option>
                  <option value="DRAFT" className="text-black">
                    Draft
                  </option>
                  <option value="ARCHIVED" className="text-black">
                    Archived
                  </option>
                </AdminSelect>

                <div className="grid grid-cols-2 gap-3">
                  <AdminSelect
                    label="Featured"
                    name="isFeatured"
                    defaultValue={item.isFeatured ? "true" : "false"}
                  >
                    <option value="false" className="text-black">
                      No
                    </option>
                    <option value="true" className="text-black">
                      Yes
                    </option>
                  </AdminSelect>
                  <AdminInput
                    label="Sort Order"
                    name="sortOrder"
                    type="number"
                    defaultValue={item.sortOrder.toString()}
                  />
                </div>
                <DatePicker
                  id="takenAt"
                  name="takenAt"
                  label="Date Taken"
                  defaultValue={takenAtValue}
                  theme="dark"
                  fieldClassName="w-full px-3 py-2 rounded-lg border bg-white/4 text-white/80..."
                  inputStyle={{ borderColor: adminColors.border }}
                />
              </div>
            )}
          </div>

          {/* Hidden defaults when advanced is collapsed */}
          {!showAdvanced && (
            <>
              <input type="hidden" name="visibility" value={item.visibility} />
              <input
                type="hidden"
                name="isFeatured"
                value={item.isFeatured ? "true" : "false"}
              />
              <input
                type="hidden"
                name="sortOrder"
                value={item.sortOrder.toString()}
              />
              <input type="hidden" name="takenAt" value={takenAtValue} />
              <input
                type="hidden"
                name="description"
                value={item.description ?? ""}
              />
              <input type="hidden" name="altText" value={item.altText ?? ""} />
            </>
          )}

          {error && (
            <p className="text-l px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-1">
            <AdminButton type="button" variant="ghost" onClick={onClose}>
              Cancel
            </AdminButton>
            <AdminButton type="submit" variant="primary" disabled={isPending}>
              {isPending && <Loader2 size={16} className="animate-spin" />}
              Save Changes
            </AdminButton>
          </div>
        </form>
      </div>
    </div>
  );
}
