import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? 'https://seeyasoon.digital';
  return raw.startsWith('http') ? raw : `https://${raw}`;
}
