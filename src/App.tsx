import React, { useState, useEffect } from 'react';
import {
  HERO_CONTENT,
  TRUST_PILLARS,
  SIMPLE_STEPS,
  RESPONSIBILITY_POINTS,
  FAQ_ITEMS,
} from './data/landingData';
import { WorkProcessGallerySection } from './components/WorkProcessGallerySection';
import { LeadFormSection } from './components/LeadFormSection';
import { PrivacyPolicyModal, OwnerLaunchKitModal } from './components/OwnerModals';
import type { FunnelStage, LeadRecord } from './utils/renovationLogic';
import {
  ArrowRight,
  ChevronDown,
  Check,
  Settings,
} from 'lucide-react';

const INITIAL_DEMO_LEADS: LeadRecord[] = [
  {
    id: 'DEMO-01',
    createdAt: '17.10.2026',
    name: '[Пример заявки] Сергей',
    phone: '+7 (918) 000-00-00',
    preferredChannel: 'telegram',
    objectType: 'Новостройка — нужен отдельный этап (электрика / сантехника / штукатурка)',
    district: 'Прикубанский округ (Губернский, Панорама, Восточно-Кругликовский)',
    startTimeline: 'По договорённости',
    comment: 'Нужен осмотр квартиры и расчёт чернового этапа по факту.',
    photosCount: 1,
    photoNames: ['plan_kvartiry.pdf'],
    funnelStage: 'site_inspection',
  },
];

export default function App() {
  const [prefillComment, setPrefillComment] = useState('');
  const [openFaqIds, setOpenFaqIds] = useState<Record<string, boolean>>({
    'faq-1': true,
    'faq-2': true,
  });
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isOwnerModalOpen, setIsOwnerModalOpen] = useState(false);
  const [leads, setLeads] = useState<LeadRecord[]>(INITIAL_DEMO_LEADS);

  const trackEvent = (eventName: string, meta: Record<string, string> = {}) => {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventName, meta }),
    }).catch(() => {});
  };

  useEffect(() => {
    trackEvent('page_view', { path: window.location.pathname });
    fetch('/api/leads')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data.leads) && data.leads.length > 0) {
          setLeads(data.leads);
        }
      })
      .catch(() => {});
  }, []);

  const handleJumpToForm = (contextComment?: string) => {
    if (contextComment) {
      setPrefillComment(contextComment);
    }
    trackEvent('cta_click_to_form', { context: contextComment || 'direct' });
    const formEl = document.getElementById('lead-form');
    if (formEl) {
      formEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLeadSubmitted = (newLead: LeadRecord) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleUpdateLeadStage = (id: string, stage: FunnelStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === id ? { ...l, funnelStage: stage } : l))
    );
    fetch(`/api/leads/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ funnelStage: stage }),
    }).catch(() => {});
  };

  const toggleFaq = (id: string) => {
    setOpenFaqIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 font-sans antialiased selection:bg-emerald-950 selection:text-white">
      {/* Top Bar Contract: 3 zones */}
      <header className="sticky top-0 z-40 h-14 bg-[#FAF9F5]/95 backdrop-blur-xs border-b border-stone-200 px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-8">
        <a
          href="#top"
          className="text-sm sm:text-lg font-bold tracking-tight text-stone-900 whitespace-nowrap shrink-0"
        >
          Ремонт под контролем
        </a>

        <nav
          aria-label="Основная навигация"
          className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600"
        >
          <a
            href="#approach"
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Подход
          </a>
          <a
            href="#processes"
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Процессы работ
          </a>
          <a
            href="#steps"
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Этапы
          </a>
          <a
            href="#faq"
            className="hover:text-stone-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Вопросы
          </a>
        </nav>

        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => handleJumpToForm()}
            className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-emerald-950 rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Обсудить ремонт
          </button>
        </div>
      </header>

      <main id="top">
        {/* HERO SECTION */}
        <section
          className="py-12 sm:py-16 lg:py-20 border-b border-stone-200"
          aria-labelledby="hero-heading"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
              {/* Left Column */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-stone-600 mb-4">
                    <span className="text-emerald-950 font-semibold">
                      {HERO_CONTENT.regionLine}
                    </span>
                  </p>

                  <h1
                    id="hero-heading"
                    className="font-bold tracking-tight text-stone-900 leading-[1.1] mb-5"
                    style={{
                      fontSize: 'clamp(2rem, 3.8vw, 3.35rem)',
                      textWrap: 'balance',
                    }}
                  >
                    {HERO_CONTENT.h1}
                  </h1>

                  <p className="text-base sm:text-lg text-stone-700 leading-relaxed max-w-[60ch] mb-5">
                    {HERO_CONTENT.lead}
                  </p>

                  <div className="p-4 rounded-xl bg-white border border-stone-200 max-w-[60ch] mb-8">
                    <p className="text-sm font-semibold text-stone-900">
                      Честный принцип без иллюзий:
                    </p>
                    <p className="mt-1 text-sm text-stone-600 leading-relaxed">
                      {HERO_CONTENT.factNote}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleJumpToForm()}
                      className="px-6 py-3.5 text-sm font-semibold text-white bg-emerald-950 rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer whitespace-nowrap shrink-0 text-center"
                    >
                      {HERO_CONTENT.primaryCta}
                    </button>
                    <a
                      href="#processes"
                      className="inline-flex items-center justify-center sm:justify-start gap-2 py-2 text-sm font-semibold text-stone-800 hover:text-emerald-950 transition-colors whitespace-nowrap shrink-0"
                    >
                      <span className="underline underline-offset-4">
                        {HERO_CONTENT.secondaryCta}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Column: Visual Card with original repo interior photo + summary */}
              <div className="lg:col-span-5 flex">
                <div className="w-full bg-white border border-stone-200 rounded-xl overflow-hidden flex flex-col justify-between shadow-xs">
                  <div className="relative aspect-[16/10] w-full bg-stone-900 overflow-hidden border-b border-stone-200">
                    <img
                      src="./assets/interior.jpg"
                      alt="Спокойный организованный ремонт квартиры"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <p className="text-xs font-mono text-emerald-300">
                        Организация и контроль этапов
                      </p>
                      <p className="text-sm font-bold text-white mt-0.5">
                        Вы занимаетесь своими делами — мы организуем процесс на объекте
                      </p>
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 space-y-3.5">
                    <h2 className="text-sm font-bold text-stone-900">
                      Как строим работу без лишней бюрократии:
                    </h2>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-stone-700">
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                        <span>
                          Встречаемся на квартире и оцениваем реальный объём работ по факту
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                        <span>
                          Вместе с прорабом подбираем мастеров под конкретный этап
                        </span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                        <span>
                          Присылаем фото скрытых работ в мессенджер и сдаём результат поэтапно
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: 4 SIMPLE PILLARS OF TRUST */}
        <section
          id="approach"
          className="py-14 sm:py-18 border-b border-stone-200 bg-[#FAF9F5]"
          aria-labelledby="approach-heading"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-medium text-stone-500 mb-2">
                Простой и понятный подход
              </p>
              <h2
                id="approach-heading"
                className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900"
                style={{ textWrap: 'balance' }}
              >
                Почему со мной проще, чем искать каждую бригаду самому
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {TRUST_PILLARS.map((item) => (
                <article
                  key={item.index}
                  className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col justify-between"
                >
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-900">
                      {item.index}.
                    </span>
                    <h3 className="text-base font-bold text-stone-900 mt-2 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-sm text-stone-600 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 2: WORK PROCESS PHOTOS GALLERY */}
        <WorkProcessGallerySection onTrackEvent={trackEvent} />

        {/* SECTION 3: 4 SIMPLE STEPS & TRANSPARENCY */}
        <section
          id="steps"
          className="py-16 sm:py-20 border-b border-stone-200 bg-[#FAF9F5]"
          aria-labelledby="steps-heading"
        >
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mb-10">
              <p className="text-xs font-medium text-stone-500 mb-2">
                Пошаговый порядок работы
              </p>
              <h2
                id="steps-heading"
                className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900"
                style={{ textWrap: 'balance' }}
              >
                Как всё происходит — от звонка до готового этапа
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
              {SIMPLE_STEPS.map((s) => (
                <div
                  key={s.step}
                  className="bg-white border border-stone-200 rounded-xl p-5"
                >
                  <p className="font-mono text-xs font-bold text-emerald-900 mb-2">
                    Шаг {s.step}
                  </p>
                  <h3 className="text-base font-bold text-stone-900 mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">
                    {s.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Clean 2-column Responsibility Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {RESPONSIBILITY_POINTS.map((block) => (
                <div
                  key={block.role}
                  className="bg-white border border-stone-200 rounded-xl p-6"
                >
                  <h3 className="text-base font-bold text-stone-900 mb-4">
                    {block.role}
                  </h3>
                  <ul className="space-y-3 text-sm text-stone-700">
                    {block.items.map((point) => (
                      <li key={point} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SECTION 4: CONCISE FAQ (5 KEY QUESTIONS) */}
        <section
          id="faq"
          className="py-16 sm:py-20 bg-white"
          aria-labelledby="faq-heading"
        >
          <div className="max-w-[900px] mx-auto px-4 sm:px-6">
            <div className="mb-8">
              <p className="text-xs font-medium text-stone-500 mb-2">
                Коротко о главном
              </p>
              <h2
                id="faq-heading"
                className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900"
                style={{ textWrap: 'balance' }}
              >
                Частые вопросы перед осмотром квартиры
              </h2>
            </div>

            <div className="divide-y divide-stone-200 border-t border-b border-stone-200">
              {FAQ_ITEMS.map((item) => {
                const isOpen = !!openFaqIds[item.id];
                return (
                  <div key={item.id} className="py-4">
                    <button
                      type="button"
                      onClick={() => toggleFaq(item.id)}
                      aria-expanded={isOpen}
                      className="w-full flex items-center justify-between gap-4 text-left py-1.5 cursor-pointer group"
                    >
                      <span className="text-base font-bold text-stone-900 group-hover:text-emerald-950 transition-colors">
                        {item.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-stone-500 shrink-0 transition-transform duration-150 ${
                          isOpen ? 'rotate-180 text-stone-900' : ''
                        }`}
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-2.5 pr-8 text-sm text-stone-600 leading-relaxed">
                        {item.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 5: LEAD FORM */}
        <LeadFormSection
          prefillComment={prefillComment}
          onOpenPrivacyPolicy={() => setIsPrivacyOpen(true)}
          onLeadSubmitted={handleLeadSubmitted}
          onTrackEvent={trackEvent}
        />
      </main>

      {/* QUIET FOOTER */}
      <footer className="bg-stone-900 text-stone-300 py-10 border-t border-stone-800">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-stone-800">
            <div>
              <p className="text-base font-bold text-white">Ремонт под контролем</p>
              <p className="mt-1 text-xs text-stone-400">
                Организация ремонта квартир в Краснодаре · Расчёт только по факту осмотра объекта
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs">
              <button
                type="button"
                onClick={() => setIsPrivacyOpen(true)}
                className="text-stone-400 hover:text-white underline underline-offset-4 cursor-pointer"
              >
                Политика конфиденциальности (152-ФЗ)
              </button>
              <button
                type="button"
                onClick={() => setIsOwnerModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 bg-stone-800 border border-stone-700 rounded-lg hover:bg-stone-700 hover:text-white transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Публикация в GitHub и заявки ({leads.length})</span>
              </button>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-stone-500">
            <p>© {new Date().getFullYear()} Проект «Ремонт под контролем» · г. Краснодар. Информация на сайте не является публичной офертой.</p>
            <a href="#top" className="hover:text-stone-300">
              Наверх ↑
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PrivacyPolicyModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
      <OwnerLaunchKitModal
        isOpen={isOwnerModalOpen}
        onClose={() => setIsOwnerModalOpen(false)}
        leads={leads}
        onUpdateLeadStage={handleUpdateLeadStage}
      />
    </div>
  );
}
