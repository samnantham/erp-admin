import { useMemo } from 'react';
import dayjs from 'dayjs';

type UseIsFormFieldsChangedProps<T> = {
  fields: Record<string, any>;
  initialValues: Partial<T> | null;
  keys: (keyof T)[];
};

export function isFormFieldsChanged<T>({
  fields,
  initialValues,
  keys,
}: UseIsFormFieldsChangedProps<T>): boolean {
  return useMemo(() => {
    if (!initialValues) return false;

    return keys.some((key) => {
      const current = unwrapFormValue(fields[key as string]);
      const initial = unwrapFormValue(initialValues[key]);
      const isMatch = deepEqualObjects(current, initial);
      if (!isMatch) {
        console.log(
          `COMPARE FIELD: ${String(key)}\n→ current:`,
          current,
          `\n→ initial:`,
          initial,
          `\n→ match:`,
          isMatch ? '✅ YES' : '❌ NO'
        );
      }

      return !isMatch;
    });
  }, [fields, initialValues, keys]);
}

// 🔁 Deep unwraps `.value` recursively from Formiz field objects
function unwrapFormValue(value: any): any {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (Array.isArray(value)) {
    return value.map(unwrapFormValue);
  }

  if (value && typeof value === 'object') {
    if ('value' in value && Object.keys(value).length > 1) {
      return unwrapFormValue(value.value);
    }

    // Normalize Dayjs/Date to YYYY-MM-DD for fair comparison
    if (
      value instanceof Date ||
      (typeof value === 'object' &&
        value?.isValid &&
        typeof value.format === 'function')
    ) {
      return dayjs(value).format('YYYY-MM-DD');
    }

    const result: Record<string, any> = {};
    for (const key in value) {
      result[key] = unwrapFormValue(value[key]);
    }
    return result;
  }

  // Normalize ISO date strings to YYYY-MM-DD if valid
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const parsed = dayjs(value);
    return parsed.isValid() ? parsed.format('YYYY-MM-DD') : value;
  }

  return value;
}

// 🔍 Robust deep object comparison
function deepEqualObjects(a: any, b: any): boolean {
  if (a === b) return true;
  if (a === null && b === null) return true;
  if (typeof a !== typeof b || a == null || b == null) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqualObjects(item, b[i]));
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => deepEqualObjects(a[key], b[key]));
  }

  return false;
}
