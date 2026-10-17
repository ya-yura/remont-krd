import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizePhoneDigits,
  formatPhoneDisplay,
  validateLeadForm,
  hasAnyPriceIllusion,
  generateCsvFromLeads,
} from './renovationLogic.ts';

test('normalizePhoneDigits handles 10-digit and 11-digit Russian numbers', () => {
  assert.equal(normalizePhoneDigits('8 (918) 123-45-67'), '79181234567');
  assert.equal(normalizePhoneDigits('+7 918 123 45 67'), '79181234567');
  assert.equal(normalizePhoneDigits('9181234567'), '79181234567');
  assert.equal(normalizePhoneDigits('123'), '123');
});

test('formatPhoneDisplay formats valid Russian mobile numbers cleanly', () => {
  assert.equal(formatPhoneDisplay('89181234567'), '+7 (918) 123-45-67');
  assert.equal(formatPhoneDisplay('9180001122'), '+7 (918) 000-11-22');
});

test('validateLeadForm rejects empty required fields and missing consent', () => {
  const result = validateLeadForm({
    name: 'А',
    phone: '12345',
    consentAccepted: false,
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.name);
  assert.ok(result.errors.phone);
  assert.ok(result.errors.consentAccepted);
});

test('validateLeadForm blocks honeypot spam submissions', () => {
  const result = validateLeadForm({
    name: 'Иван',
    phone: '+7 (918) 555-44-33',
    consentAccepted: true,
    honeypot: 'http://spam-bot.example',
  });
  assert.equal(result.valid, false);
  assert.ok(result.errors.honeypot);
});

test('validateLeadForm accepts valid name, Russian phone, and consent', () => {
  const result = validateLeadForm({
    name: 'Алексей',
    phone: '8 918 555-44-33',
    consentAccepted: true,
    honeypot: '',
  });
  assert.equal(result.valid, true);
  assert.equal(result.normalizedPhone, '79185554433');
});

test('hasAnyPriceIllusion detects ruble figures and price promises', () => {
  assert.equal(hasAnyPriceIllusion('Ремонт от 15 000 ₽ за м2'), true);
  assert.equal(hasAnyPriceIllusion('Смета 450000 руб'), true);
  assert.equal(hasAnyPriceIllusion('Стоимость рассчитывается только по факту осмотра квартиры.'), false);
});

test('generateCsvFromLeads exports semicolon-separated table with funnel stages', () => {
  const csv = generateCsvFromLeads([
    {
      id: 'L-101',
      createdAt: '2026-10-17',
      name: 'Мария',
      phone: '+7 (918) 111-22-33',
      preferredChannel: 'telegram',
      objectType: 'Новостройка 1-комн.',
      district: 'Фестивальный (ФМР)',
      startTimeline: 'В течение 2 недель',
      comment: 'Нужен осмотр квартиры',
      photosCount: 1,
      photoNames: ['plan.jpg'],
      funnelStage: 'site_inspection',
    },
  ]);
  assert.ok(csv.includes('L-101'));
  assert.ok(csv.includes('4. Осмотр объекта'));
  assert.ok(csv.includes('Фестивальный (ФМР)'));
});
