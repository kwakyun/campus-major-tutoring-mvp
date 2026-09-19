import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from "react";

export interface FormFieldBaseProps {
  label: string;
  fieldId: string;
  errorText?: string;
  helperText?: string;
  required?: boolean;
}

export interface InputFormFieldProps
  extends FormFieldBaseProps,
    Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  as?: "input";
}

export interface TextareaFormFieldProps
  extends FormFieldBaseProps,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "id"> {
  as: "textarea";
}

export interface SelectFormFieldProps
  extends FormFieldBaseProps,
    Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  as: "select";
  children: ReactNode;
}

export type FormFieldProps = InputFormFieldProps | TextareaFormFieldProps | SelectFormFieldProps;

export function FormField(props: FormFieldProps) {
  const { label, fieldId, errorText, helperText, required, as = "input", className = "", ...rest } = props;

  return (
    <div className={`cmt-form-field ${errorText ? "cmt-form-field--error" : ""} ${className}`.trim()}>
      <label htmlFor={fieldId} className="cmt-form-field__label">
        {label}
        {required ? <span className="cmt-form-field__required" aria-hidden="true">*</span> : null}
      </label>

      {as === "textarea" ? (
        <textarea
          id={fieldId}
          className="cmt-form-field__textarea"
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : as === "select" ? (
        <select
          id={fieldId}
          className="cmt-form-field__select"
          {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}
        >
          {(props as SelectFormFieldProps).children}
        </select>
      ) : (
        <input
          id={fieldId}
          className="cmt-form-field__input"
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}

      {helperText && !errorText ? (
        <p className="cmt-form-field__helper">{helperText}</p>
      ) : null}

      {errorText ? (
        <p role="alert" className="cmt-form-field__error">
          {errorText}
        </p>
      ) : null}
    </div>
  );
}
