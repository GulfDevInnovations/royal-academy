"use client";

import { useState } from "react";
import type { CSSProperties } from "react";

type MedicalConditionFieldProps = {
  defaultChecked: boolean;
  defaultDetails: string;
  checkboxClassName: string;
  fieldClassName: string;
  inputStyle: CSSProperties;
  label: string;
  detailsLabel: string;
  detailsPlaceholder: string;
};

export default function MedicalConditionField({
  defaultChecked,
  defaultDetails,
  checkboxClassName,
  fieldClassName,
  inputStyle,
  label,
  detailsLabel,
  detailsPlaceholder,
}: MedicalConditionFieldProps) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <>
      <label
        htmlFor="hasMedicalCondition"
        className="flex items-start gap-3 cursor-pointer"
      >
        <input
          id="hasMedicalCondition"
          type="checkbox"
          name="hasMedicalCondition"
          className="sr-only"
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
        <div
          className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all duration-200"
          style={{
            background: checked
              ? "linear-gradient(145deg, #c9b89a, #e4d0b5)"
              : "linear-gradient(145deg, #c9b89a, #f0e2cc)",
            boxShadow: checked
              ? "inset 2px 2px 5px rgba(0,0,0,0.25), inset -1px -1px 3px rgba(255,255,255,0.15)"
              : "3px 3px 6px rgba(0,0,0,0.2), -2px -2px 5px rgba(255,255,255,0.15)",
            border: "1px solid rgba(75,48,68,0.2)",
          }}
        >
          {checked && (
            <svg
              viewBox="0 0 12 10"
              fill="none"
              className="w-3.5 h-3.5"
              stroke="#4b3044"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M1 5l3.5 3.5L11 1" />
            </svg>
          )}
        </div>
        <span>{label}</span>
      </label>

      {checked && (
        <div className="pl-7">
          <label htmlFor="medicalConditionDetails" className="block">
            <span className="text-sm">{detailsLabel}</span>
            <textarea
              id="medicalConditionDetails"
              name="medicalConditionDetails"
              defaultValue={defaultDetails}
              placeholder={detailsPlaceholder}
              className={`${fieldClassName} min-h-24`}
              style={inputStyle}
            />
          </label>
        </div>
      )}
    </>
  );
}
