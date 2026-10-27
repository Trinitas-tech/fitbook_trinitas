import { HttpParams } from '@angular/common/http';

type ParamValue = string | number | boolean | null | undefined;

/** Construit des HttpParams en ignorant les valeurs vides. */
export function buildParams(source: Record<string, ParamValue>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(source)) {
    if (value === null || value === undefined || value === '') {
      continue;
    }
    params = params.set(key, String(value));
  }
  return params;
}
