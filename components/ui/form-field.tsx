"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { InlineError } from "@/components/ui/error-panel"

/**
 * Reusable form field dengan inline validation.
 * Menggantikan pattern ad-hoc di berbagai form.
 */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  children,
  className,
}: {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive-strong ml-1">*</span>}
      </Label>
      {children}
      {error ? (
        <InlineError message={error} />
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

/**
 * Text input dengan validation state.
 */
export function ValidatedInput({
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <Input
      className={cn(
        error && "border-destructive focus-visible:ring-destructive/30",
        className
      )}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? `${props.id}-error` : undefined}
      {...props}
    />
  )
}

/**
 * Textarea dengan validation state.
 */
export function ValidatedTextarea({
  error,
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: string }) {
  return (
    <textarea
      className={cn(
        "flex w-full resize-none rounded-lg border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-fast dark:bg-card dark:border-input/60",
        error && "border-destructive focus-visible:ring-destructive/30",
        className
      )}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? `${props.id}-error` : undefined}
      {...props}
    />
  )
}
