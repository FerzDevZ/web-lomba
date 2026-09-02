"use client"

import { useState, useCallback } from "react"
import { z } from "zod"

/**
 * Form validation hook dengan Zod schemas.
 * Menampilkan error inline di field yang salah.
 */
export function useFormValidation<T extends Record<string, unknown>>(
  schema: z.ZodType<T>,
  initialValues: T
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({})
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({})

  const validate = useCallback(
    (data: T) => {
      const result = schema.safeParse(data)
      if (result.success) {
        setErrors({})
        return true
      }
      const fieldErrors: Partial<Record<keyof T, string>> = {}
      for (const issue of result.error.issues) {
        const path = issue.path.join(".")
        if (path && !fieldErrors[path as keyof T]) {
          fieldErrors[path as keyof T] = issue.message
        }
      }
      setErrors(fieldErrors)
      return false
    },
    [schema]
  )

  const setValue = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => {
      setValues((prev) => {
        const next = { ...prev, [key]: value }
        // Validate on change if field was touched
        if (touched[key]) {
          const result = schema.safeParse(next)
          if (result.success) {
            setErrors((prev) => ({ ...prev, [key]: undefined }))
          } else {
            const fieldErrors = result.error.issues
              .filter((i) => i.path[0] === key)
              .map((i) => i.message)
            setErrors((prev) => ({
              ...prev,
              [key]: fieldErrors[0] || undefined,
            }))
          }
        }
        return next
      })
    },
    [schema, touched]
  )

  const setFieldTouched = useCallback(
    <K extends keyof T>(key: K) => {
      setTouched((prev) => ({ ...prev, [key]: true }))
      // Validate on blur
      const result = schema.safeParse(values)
      if (!result.success) {
        const fieldErrors = result.error.issues
          .filter((i) => i.path[0] === key)
          .map((i) => i.message)
        setErrors((prev) => ({
          ...prev,
          [key]: fieldErrors[0] || undefined,
        }))
      }
    },
    [schema, values]
  )

  const validateAll = useCallback(() => {
    setTouched(
      Object.keys(values).reduce(
        (acc, key) => ({ ...acc, [key]: true }),
        {} as Partial<Record<keyof T, boolean>>
      )
    )
    return validate(values)
  }, [values, validate])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateAll,
    reset,
    isValid: Object.keys(errors).length === 0,
  }
}

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, "Email wajib diisi")
  .email("Format email tidak valid")

export const passwordSchema = z
  .string()
  .min(6, "Password minimal 6 karakter")
  .max(100, "Password maksimal 100 karakter")

export const nameSchema = z
  .string()
  .min(2, "Nama minimal 2 karakter")
  .max(100, "Nama maksimal 100 karakter")

export const phoneSchema = z
  .string()
  .optional()
  .refine(
    (val) => !val || /^[0-9+\-\s()]{8,20}$/.test(val),
    "Format nomor HP tidak valid"
  )

export const addressSchema = z
  .string()
  .min(5, "Alamat minimal 5 karakter")
  .max(500, "Alamat maksimal 500 karakter")

export const priceSchema = z
  .number()
  .positive("Harga harus lebih dari 0")
  .max(100_000_000, "Harga terlalu besar")

export const titleSchema = z
  .string()
  .min(3, "Judul minimal 3 karakter")
  .max(100, "Judul maksimal 100 karakter")

export const descriptionSchema = z
  .string()
  .min(10, "Deskripsi minimal 10 karakter")
  .max(2000, "Deskripsi maksimal 2000 karakter")
