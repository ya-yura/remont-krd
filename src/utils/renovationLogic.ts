export interface LeadFormInput {
  name: string;
  phone: string;
  preferredChannel?: 'phone' | 'telegram' | 'whatsapp';
  objectType?: string;
  district?: string;
  startTimeline?: string;
  comment?: string;
  photosCount?: number;
  photoNames?: string[];
  consentAccepted: boolean;
  honeypot?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: {
    name?: string;
    phone?: string;
    consentAccepted?: string;
    honeypot?: string;
  };
  normalizedPhone: string;
}

export type FunnelStage =
  | 'visit'
  | 'inquiry'
  | 'qualified_lead'
  | 'site_inspection'
  | 'estimate_agreed'
  | 'contract_signed'
  | 'stage_completed_paid';

export const FUNNEL_STAGE_LABELS: Record<FunnelStage, string> = {
  visit: '1. Посещение',
  inquiry: '2. Обращение',
  qualified_lead: '3. Целевая заявка',
  site_inspection: '4. Осмотр объекта',
  estimate_agreed: '5. Расчёт по факту',
  contract_signed: '6. Договор',
  stage_completed_paid: '7. Выполненный этап',
};

export interface LeadRecord {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  preferredChannel: 'phone' | 'telegram' | 'whatsapp';
  objectType: string;
  district: string;
  startTimeline: string;
  comment: string;
  photosCount: number;
  photoNames: string[];
  funnelStage: FunnelStage;
}

/**
 * Normalizes Russian phone numbers to 11 digits starting with 7.
 */
export function normalizePhoneDigits(rawPhone: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length === 10) {
    return '7' + digits;
  }
  if (digits.length === 11 && digits.startsWith('8')) {
    return '7' + digits.slice(1);
  }
  return digits;
}

/**
 * Formats normalized 11-digit phone into +7 (XXX) XXX-XX-XX
 */
export function formatPhoneDisplay(rawPhone: string): string {
  const norm = normalizePhoneDigits(rawPhone);
  if (norm.length !== 11 || !norm.startsWith('7')) {
    return rawPhone.trim();
  }
  return `+7 (${norm.slice(1, 4)}) ${norm.slice(4, 7)}-${norm.slice(7, 9)}-${norm.slice(9, 11)}`;
}

/**
 * Validates the lead form input without silently substituting fallback values.
 */
export function validateLeadForm(input: LeadFormInput): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (input.honeypot && input.honeypot.trim().length > 0) {
    errors.honeypot = 'Обнаружена автоматическая отправка.';
  }

  const trimmedName = (input.name || '').trim();
  if (!trimmedName || trimmedName.length < 2) {
    errors.name = 'Укажите ваше имя (минимум 2 символа).';
  }

  const normalizedPhone = normalizePhoneDigits(input.phone || '');
  if (normalizedPhone.length !== 11 || !normalizedPhone.startsWith('7')) {
    errors.phone = 'Введите корректный номер телефона (10 или 11 цифр, например +7 918 000-00-00).';
  }

  if (!input.consentAccepted) {
    errors.consentAccepted = 'Необходимо согласие на обработку персональных данных для обратной связи.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    normalizedPhone,
  };
}

/**
 * Verifies that text does not contain price illusions (ruble signs, "от ... руб", etc.)
 */
export function hasAnyPriceIllusion(text: string): boolean {
  const pricePattern = /(\d+\s*₽|\d+\s*руб|от\s+\d+\s*(тыс|р|₽))/i;
  return pricePattern.test(text);
}

/**
 * Generates RFC-4180 compliant CSV string for the owner's lead funnel table.
 */
export function generateCsvFromLeads(leads: LeadRecord[]): string {
  const headers = [
    'ID',
    'Дата',
    'Этап воронки',
    'Имя',
    'Телефон',
    'Канал связи',
    'Район',
    'Тип квартиры / задача',
    'Комментарий',
    'Файлы',
  ];

  const escapeCsvCell = (val: string | number): string => {
    const str = String(val ?? '');
    if (/[",\n\r;]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = leads.map((lead) => [
    lead.id,
    lead.createdAt,
    FUNNEL_STAGE_LABELS[lead.funnelStage] || lead.funnelStage,
    lead.name,
    lead.phone,
    lead.preferredChannel,
    lead.district,
    lead.objectType,
    lead.comment,
    lead.photoNames.join(', '),
  ]);

  return [
    headers.map(escapeCsvCell).join(';'),
    ...rows.map((r) => r.map(escapeCsvCell).join(';')),
  ].join('\r\n');
}
