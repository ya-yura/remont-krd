import React, { useState, useEffect } from 'react';
import {
  KRASNODAR_DISTRICTS,
  OBJECT_TYPES,
} from '../data/landingData';
import {
  validateLeadForm,
  formatPhoneDisplay,
  type LeadRecord,
} from '../utils/renovationLogic';
import { Send, CheckCircle2, Paperclip, AlertCircle } from 'lucide-react';

interface LeadFormSectionProps {
  prefillComment?: string;
  onOpenPrivacyPolicy: () => void;
  onLeadSubmitted: (lead: LeadRecord) => void;
  onTrackEvent: (eventName: string, meta?: Record<string, string>) => void;
}

declare global {
  interface Window {
    SITE_CONFIG?: {
      city?: string;
      ownerName?: string;
      phoneDisplay?: string;
      phoneHref?: string;
      telegramUrl?: string;
      whatsappUrl?: string;
      formEndpoint?: string;
    };
  }
}

export const LeadFormSection: React.FC<LeadFormSectionProps> = ({
  prefillComment = '',
  onOpenPrivacyPolicy,
  onLeadSubmitted,
  onTrackEvent,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredChannel, setPreferredChannel] = useState<'phone' | 'telegram' | 'whatsapp'>('phone');
  const [objectType, setObjectType] = useState('');
  const [district, setDistrict] = useState('');
  const [comment, setComment] = useState(prefillComment);
  const [photoNames, setPhotoNames] = useState<string[]>([]);
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [honeypot, setHoneypot] = useState('');
  const [hasStartedForm, setHasStartedForm] = useState(false);

  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    consentAccepted?: string;
    honeypot?: string;
    form?: string;
  }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedLead, setSubmittedLead] = useState<LeadRecord | null>(null);

  useEffect(() => {
    if (prefillComment) {
      setComment(prefillComment);
    }
  }, [prefillComment]);

  const handleFieldFocus = () => {
    if (!hasStartedForm) {
      setHasStartedForm(true);
      onTrackEvent('form_start');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const names: string[] = [];
    for (let i = 0; i < Math.min(files.length, 5); i++) {
      names.push(files[i].name);
    }
    setPhotoNames(names);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateLeadForm({
      name,
      phone,
      preferredChannel,
      objectType,
      district,
      comment,
      photosCount: photoNames.length,
      photoNames,
      consentAccepted,
      honeypot,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      onTrackEvent('form_validation_error', {
        fields: Object.keys(validation.errors).join(','),
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const payload = {
      name: name.trim(),
      phone: formatPhoneDisplay(phone),
      preferredChannel,
      objectType: objectType || 'Не указано',
      district: district || 'Не указан',
      startTimeline: 'По договорённости',
      comment: comment.trim(),
      photosCount: photoNames.length,
      photoNames,
      consentAccepted,
      honeypot,
    };

    try {
      let savedLead: LeadRecord | null = null;
      try {
        const res = await fetch('/api/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const data = await res.json();
          savedLead = data.lead;
        }
      } catch {
        // Static deployment fallback
      }

      const externalEndpoint = window.SITE_CONFIG?.formEndpoint?.trim();
      if (externalEndpoint && externalEndpoint.startsWith('https://')) {
        await fetch(externalEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify(payload),
        });
      }

      if (!savedLead) {
        savedLead = {
          id: `LOCAL-${Date.now().toString().slice(-5)}`,
          createdAt: new Date().toLocaleDateString('ru-RU'),
          name: payload.name,
          phone: payload.phone,
          preferredChannel: payload.preferredChannel,
          objectType: payload.objectType,
          district: payload.district,
          startTimeline: payload.startTimeline,
          comment: payload.comment,
          photosCount: payload.photosCount,
          photoNames: payload.photoNames,
          funnelStage: 'inquiry',
        };
      }

      setSubmittedLead(savedLead);
      onLeadSubmitted(savedLead);
      onTrackEvent('form_submit_success', {
        channel: preferredChannel,
      });
    } catch {
      setErrors({
        form: 'Не удалось отправить заявку. Проверьте подключение и попробуйте ещё раз.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="lead-form"
      className="py-16 sm:py-20 bg-[#F3F1EB] border-t border-stone-200"
      aria-labelledby="lead-form-heading"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left column: Simple explanation */}
          <div className="lg:col-span-5">
            <p className="text-xs font-medium text-stone-500 mb-2">
              Спокойное обсуждение · Без навязывания
            </p>
            <h2
              id="lead-form-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900 mb-4"
              style={{ textWrap: 'balance' }}
            >
              Договоримся об осмотре квартиры и расчёте по факту
            </h2>
            <p className="text-base text-stone-700 leading-relaxed mb-6">
              Оставьте имя и телефон. Мы свяжемся удобным для вас способом, узнаем задачу и договоримся о встрече на объекте в Краснодаре.
            </p>

            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
              <h3 className="text-sm font-bold text-stone-900">
                Как пройдёт первый разговор:
              </h3>
              <ol className="space-y-3 text-sm text-stone-700">
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs font-semibold text-emerald-900 pt-0.5 shrink-0">
                    01.
                  </span>
                  <span>
                    Свяжемся с вами в выбранном мессенджере или по телефону без спама и автодозвонов.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs font-semibold text-emerald-900 pt-0.5 shrink-0">
                    02.
                  </span>
                  <span>
                    Согласуем время осмотра квартиры, чтобы посмотреть стены, углы и инженерные выводы вживую.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="font-mono text-xs font-semibold text-emerald-900 pt-0.5 shrink-0">
                    03.
                  </span>
                  <span>
                    Только по факту осмотра составим реальный перечень работ и честный расчёт.
                  </span>
                </li>
              </ol>
            </div>
          </div>

          {/* Right column: Simple Form */}
          <div className="lg:col-span-7 bg-white border border-stone-200 rounded-xl p-6 sm:p-8 shadow-xs">
            {submittedLead ? (
              <div
                data-testid="lead-form-success"
                className="py-6 space-y-5"
              >
                <div className="w-11 h-11 rounded-lg bg-emerald-900/10 text-emerald-900 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-mono text-emerald-900 mb-1">
                    Заявка № {submittedLead.id} принята
                  </p>
                  <h3 className="text-xl font-bold text-stone-900">
                    Спасибо, {submittedLead.name}! Мы скоро свяжемся с вами
                  </h3>
                  <p className="mt-2 text-sm text-stone-600 leading-relaxed">
                    Ваш контакт <span className="font-mono font-semibold text-stone-900">{submittedLead.phone}</span> получен. Мы напишем или позвоним, чтобы спокойно обсудить квартиру и согласовать осмотр.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedLead(null);
                      setName('');
                      setPhone('');
                      setComment('');
                      setPhotoNames([]);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Отправить ещё одно обращение
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* Honeypot */}
                <div className="sr-only" aria-hidden="true">
                  <label htmlFor="bot_trap_token">Служебное поле</label>
                  <input
                    id="bot_trap_token"
                    name="bot_trap_token"
                    type="text"
                    tabIndex={-1}
                    autoComplete="off"
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="lead-name"
                      className="block text-xs font-semibold text-stone-800 mb-1.5"
                    >
                      Ваше имя <span className="text-red-700">*</span>
                    </label>
                    <input
                      id="lead-name"
                      name="name"
                      type="text"
                      required
                      value={name}
                      onFocus={handleFieldFocus}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (errors.name) setErrors({ ...errors, name: undefined });
                      }}
                      placeholder="Например, Александр"
                      className={`w-full px-3.5 py-2.5 text-sm text-stone-900 bg-[#FAF9F5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-900 transition-colors ${
                        errors.name ? 'border-red-600' : 'border-stone-300'
                      }`}
                    />
                    {errors.name && (
                      <p role="alert" className="mt-1.5 text-xs text-red-700 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="lead-phone"
                      className="block text-xs font-semibold text-stone-800 mb-1.5"
                    >
                      Телефон для связи <span className="text-red-700">*</span>
                    </label>
                    <input
                      id="lead-phone"
                      name="phone"
                      type="tel"
                      required
                      value={phone}
                      onFocus={handleFieldFocus}
                      onChange={(e) => {
                        setPhone(e.target.value);
                        if (errors.phone) setErrors({ ...errors, phone: undefined });
                      }}
                      placeholder="+7 (918) 000-00-00"
                      className={`w-full px-3.5 py-2.5 text-sm font-mono text-stone-900 bg-[#FAF9F5] border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-900 transition-colors ${
                        errors.phone ? 'border-red-600' : 'border-stone-300'
                      }`}
                    />
                    {errors.phone && (
                      <p role="alert" className="mt-1.5 text-xs text-red-700 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.phone}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Preferred communication channel */}
                <div>
                  <span className="block text-xs font-semibold text-stone-800 mb-1.5">
                    Где вам удобнее ответить?
                  </span>
                  <div className="grid grid-cols-3 gap-2 p-1 bg-stone-100 rounded-lg border border-stone-200">
                    {[
                      { id: 'phone', label: 'Звонок' },
                      { id: 'telegram', label: 'Telegram' },
                      { id: 'whatsapp', label: 'WhatsApp' },
                    ].map((ch) => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() =>
                          setPreferredChannel(ch.id as 'phone' | 'telegram' | 'whatsapp')
                        }
                        className={`py-2 px-3 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          preferredChannel === ch.id
                            ? 'bg-white text-stone-900 shadow-xs'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="lead-object-type"
                      className="block text-xs font-semibold text-stone-800 mb-1.5"
                    >
                      Какая задача (необязательно)
                    </label>
                    <select
                      id="lead-object-type"
                      name="objectType"
                      value={objectType}
                      onFocus={handleFieldFocus}
                      onChange={(e) => setObjectType(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-stone-900 bg-[#FAF9F5] border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-900"
                    >
                      <option value="">Выберите вариант...</option>
                      {OBJECT_TYPES.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label
                      htmlFor="lead-district"
                      className="block text-xs font-semibold text-stone-800 mb-1.5"
                    >
                      Район Краснодара (необязательно)
                    </label>
                    <select
                      id="lead-district"
                      name="district"
                      value={district}
                      onFocus={handleFieldFocus}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm text-stone-900 bg-[#FAF9F5] border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-900"
                    >
                      <option value="">Выберите район...</option>
                      {KRASNODAR_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>
                          {dist}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="lead-comment"
                    className="block text-xs font-semibold text-stone-800 mb-1.5"
                  >
                    Коротко о квартире (необязательно)
                  </label>
                  <textarea
                    id="lead-comment"
                    name="comment"
                    rows={2}
                    value={comment}
                    onFocus={handleFieldFocus}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Например: ЖК Губернский, 1-комнатная, нужно посмотреть объём работ по факту"
                    className="w-full px-3.5 py-2.5 text-sm text-stone-900 bg-[#FAF9F5] border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-900"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lead-files"
                    className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-stone-700 bg-[#FAF9F5] border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-stone-500" />
                    <span>
                      {photoNames.length > 0
                        ? `Прикреплено файлов: ${photoNames.length} (${photoNames.join(', ')})`
                        : 'Прикрепить план квартиры или фото (по желанию)'}
                    </span>
                  </label>
                  <input
                    id="lead-files"
                    type="file"
                    multiple
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </div>

                {/* Consent checkbox */}
                <div className="pt-1">
                  <div className="flex items-start gap-2.5">
                    <input
                      id="lead-consent"
                      name="consentAccepted"
                      type="checkbox"
                      checked={consentAccepted}
                      onChange={(e) => {
                        setConsentAccepted(e.target.checked);
                        if (errors.consentAccepted) {
                          setErrors({ ...errors, consentAccepted: undefined });
                        }
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-stone-300 text-emerald-900 focus:ring-emerald-900 cursor-pointer"
                    />
                    <label htmlFor="lead-consent" className="text-xs text-stone-600 leading-relaxed">
                      Соглашаюсь на обработку персональных данных в соответствии с{' '}
                      <button
                        type="button"
                        onClick={onOpenPrivacyPolicy}
                        className="underline text-stone-800 hover:text-emerald-900 font-medium cursor-pointer"
                      >
                        политикой конфиденциальности
                      </button>
                      . Контакты используются только для ответа по вашей задаче.
                    </label>
                  </div>
                  {errors.consentAccepted && (
                    <p role="alert" className="mt-1.5 text-xs text-red-700 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{errors.consentAccepted}</span>
                    </p>
                  )}
                </div>

                {errors.form && (
                  <p role="alert" className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">
                    {errors.form}
                  </p>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white bg-emerald-950 rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Отправка...' : 'Договориться об осмотре квартиры'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
