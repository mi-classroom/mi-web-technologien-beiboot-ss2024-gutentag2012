import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseXhrResponse(xhr: XMLHttpRequest) {
  if (!xhr.responseText) return null
  if (xhr.getResponseHeader("Content-Type")?.includes("application/json")) {
    try {
      return JSON.parse(xhr.responseText)
    } catch {
      return xhr.responseText
    }
  }
  return xhr.responseText
}
