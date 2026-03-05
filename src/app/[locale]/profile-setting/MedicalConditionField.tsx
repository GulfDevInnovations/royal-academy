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
      <label htmlFor="hasMedicalCondition" className="flex items-start gap-3">
        <input
          id="hasMedicalCondition"
          type="checkbox"
          name="hasMedicalCondition"
          className={checkboxClassName}
          checked={checked}
          onChange={(event) => setChecked(event.target.checked)}
        />
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
