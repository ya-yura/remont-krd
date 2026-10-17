import React, { useState } from 'react';
import {
  FUNNEL_STAGE_LABELS,
  generateCsvFromLeads,
  type FunnelStage,
  type LeadRecord,
} from '../utils/renovationLogic';
import { X, Download, Copy, Check, UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react';

interface PrivacyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <dialog
      open
      aria-labelledby="privacy-modal-title"
      className="fixed inset-0 z-50 m-0 w-full h-full bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="bg-white border border-stone-200 rounded-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-lg">
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-stone-200">
          <h2 id="privacy-modal-title" className="text-base font-bold text-stone-900">
            Политика в отношении обработки персональных данных (152-ФЗ)
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть политику конфиденциальности"
            className="p-1.5 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-4 text-sm text-stone-700 leading-relaxed">
          <p className="text-xs text-stone-500 bg-stone-100 p-3 rounded-lg border border-stone-200">
            Перед запуском рекламы укажите в файле <code className="font-mono">config.js</code> ваши фактические ФИО и статус (самозанятый / ИП), а также контактный email или телефон для обращений по вопросам обработки персональных данных.
          </p>

          <h3 className="text-sm font-bold text-stone-900">1. Общие положения</h3>
          <p>
            Настоящая Политика определяет порядок обработки и защиты персональных данных физических лиц, оставляющих обращение на сайте проекта «Ремонт под контролем» (г. Краснодар), в соответствии с Федеральным законом РФ от 27.07.2006 № 152-ФЗ «О персональных данных».
          </p>

          <h3 className="text-sm font-bold text-stone-900">2. Какие данные собираются</h3>
          <p>
            Оператор обрабатывает только те данные, которые пользователь добровольно указывает в форме обратной связи:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Имя (или обращение);</li>
            <li>Контактный номер телефона и выбранный способ связи;</li>
            <li>Сведения о задаче по ремонту, районе объекта и прикреплённые материалы (при наличии).</li>
          </ul>

          <h3 className="text-sm font-bold text-stone-900">3. Цели обработки персональных данных</h3>
          <p>
            Персональные данные используются исключительно для обратной связи с пользователем, уточнения задачи по ремонту квартиры и согласования осмотра объекта.
          </p>

          <h3 className="text-sm font-bold text-stone-900">4. Хранение, защита и отзыв согласия</h3>
          <p>
            Данные не публикуются в открытом доступе и не передаются сторонним рекламным сервисам. Пользователь вправе в любой момент потребовать удаления своих данных, направив сообщение по контактам, указанным на сайте.
          </p>
        </div>

        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Понятно, закрыть
          </button>
        </div>
      </div>
    </dialog>
  );
};

interface OwnerLaunchKitModalProps {
  isOpen: boolean;
  onClose: () => void;
  leads: LeadRecord[];
  onUpdateLeadStage: (id: string, stage: FunnelStage) => void;
}

export const OwnerLaunchKitModal: React.FC<OwnerLaunchKitModalProps> = ({
  isOpen,
  onClose,
  leads,
  onUpdateLeadStage,
}) => {
  const [activeTab, setActiveTab] = useState<'github' | 'funnel' | 'config'>('github');
  const [copiedConfig, setCopiedConfig] = useState(false);

  // GitHub direct deployment state
  const [githubRepo, setGithubRepo] = useState('ya-yura/remont-pod-kontrolem');
  const [githubBranch, setGithubBranch] = useState('main');
  const [githubToken, setGithubToken] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployResult, setDeployResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  // Config generator state
  const [cfgOwnerName, setCfgOwnerName] = useState('');
  const [cfgPhone, setCfgPhone] = useState('');
  const [cfgTelegram, setCfgTelegram] = useState('');
  const [cfgWhatsapp, setCfgWhatsapp] = useState('');
  const [cfgFormEndpoint, setCfgFormEndpoint] = useState('');

  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    const csv = generateCsvFromLeads(leads);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `remont-pod-kontrolem-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const generatedConfigJs = `// Конфигурация контактов и формы для GitHub Pages (config.js)
window.SITE_CONFIG = {
  city: "Краснодар",
  ownerName: ${JSON.stringify(cfgOwnerName || 'Укажите имя и статус (самозанятый / ИП)')},
  phoneDisplay: ${JSON.stringify(cfgPhone || '')},
  phoneHref: ${JSON.stringify(cfgPhone ? 'tel:' + cfgPhone.replace(/[^+\d]/g, '') : '')},
  telegramUrl: ${JSON.stringify(cfgTelegram || '')},
  whatsappUrl: ${JSON.stringify(cfgWhatsapp || '')},
  formEndpoint: ${JSON.stringify(cfgFormEndpoint || '')}
};`;

  const handleCopyConfig = () => {
    navigator.clipboard.writeText(generatedConfigJs);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleDeployToGithub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!githubToken.trim()) {
      setDeployResult({
        ok: false,
        message: 'Введите ваш GitHub Personal Access Token (с правами repo и workflow), чтобы отправить изменения в репозиторий.',
      });
      return;
    }

    setIsDeploying(true);
    setDeployResult(null);
    try {
      const res = await fetch('/api/deploy-github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: githubRepo.trim(),
          branch: githubBranch.trim() || 'main',
          token: githubToken.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setDeployResult({
          ok: true,
          message:
            data.message ||
            'Код и сборка успешно отправлены в репозиторий GitHub! GitHub Actions обновит сайт https://ya-yura.github.io/remont-pod-kontrolem/ в течение 1 минуты.',
        });
      } else {
        setDeployResult({
          ok: false,
          message: data.error || 'Не удалось выполнить git push. Проверьте права токена.',
        });
      }
    } catch {
      setDeployResult({
        ok: false,
        message: 'Ошибка соединения с локальным сервером при отправке в GitHub.',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <dialog
      open
      aria-labelledby="owner-kit-title"
      className="fixed inset-0 z-50 m-0 w-full h-full bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
    >
      <div className="bg-white border border-stone-200 rounded-xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-stone-900 text-white">
          <div>
            <h2 id="owner-kit-title" className="text-base sm:text-lg font-bold">
              Управление сайтом и публикация на GitHub
            </h2>
            <p className="text-xs text-stone-400">
              Репозиторий: https://github.com/ya-yura/remont-pod-kontrolem · Сайт: https://ya-yura.github.io/remont-pod-kontrolem/
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть панель владельца"
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 px-6 py-3 bg-stone-100 border-b border-stone-200">
          {[
            { id: 'github', label: 'Деплой на GitHub Pages' },
            { id: 'funnel', label: `Заявки (${leads.length})` },
            { id: 'config', label: 'Контакты (config.js)' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-700 border border-stone-200 hover:text-stone-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAF9F5]">
          {activeTab === 'github' && (
            <div className="space-y-6">
              <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
                <h3 className="text-base font-bold text-stone-900">
                  Развёртывание в тот же репозиторий GitHub (`ya-yura/remont-pod-kontrolem`)
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  В проект уже добавлен workflow <code className="font-mono">.github/workflows/pages.yml</code>, скрипт проверки <code className="font-mono">npm run check</code> и статическая сборка <code className="font-mono">npm run build</code> (в папку <code className="font-mono">dist/</code> с относительными путями для <code className="font-mono">/remont-pod-kontrolem/</code>).
                </p>

                <form onSubmit={handleDeployToGithub} className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Репозиторий GitHub
                      </label>
                      <input
                        type="text"
                        value={githubRepo}
                        onChange={(e) => setGithubRepo(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAF9F5] border border-stone-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Ветка
                      </label>
                      <input
                        type="text"
                        value={githubBranch}
                        onChange={(e) => setGithubBranch(e.target.value)}
                        className="w-full px-3 py-2 text-xs font-mono bg-[#FAF9F5] border border-stone-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="gh-token-input"
                      className="block text-xs font-semibold text-stone-700 mb-1"
                    >
                      GitHub Personal Access Token (для автоматического git push в ваш репозиторий)
                    </label>
                    <input
                      id="gh-token-input"
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_... или github_pat_..."
                      className="w-full px-3 py-2 text-xs font-mono bg-[#FAF9F5] border border-stone-300 rounded-lg"
                    />
                    <p className="mt-1 text-[11px] text-stone-500">
                      Токен не сохраняется в коде и используется один раз для выполнения <code className="font-mono">git push origin main</code> с сервера. Также вы можете нажать иконку GitHub в верхнем меню AI Studio.
                    </p>
                  </div>

                  {deployResult && (
                    <div
                      role="alert"
                      className={`p-3.5 rounded-lg border text-xs flex items-start gap-2.5 ${
                        deployResult.ok
                          ? 'bg-emerald-950/5 border-emerald-800/30 text-emerald-950'
                          : 'bg-red-50 border-red-200 text-red-800'
                      }`}
                    >
                      {deployResult.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-700 shrink-0 mt-0.5" />
                      )}
                      <span>{deployResult.message}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isDeploying}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-emerald-950 rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap shrink-0"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>
                      {isDeploying
                        ? 'Отправка в GitHub...'
                        : 'Развернуть в ya-yura/remont-pod-kontrolem'}
                    </span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'funnel' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Таблица заявок
                  </h3>
                  <p className="text-xs text-stone-600">
                    Все обращения с сайта с возможностью выгрузки в CSV
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-950 rounded-lg hover:bg-emerald-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Скачать CSV</span>
                </button>
              </div>

              <div className="bg-white border border-stone-200 rounded-xl overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-600">
                      <th className="py-3 px-4">ID / Дата</th>
                      <th className="py-3 px-4">Имя и контакт</th>
                      <th className="py-3 px-4">Район и задача</th>
                      <th className="py-3 px-4">Комментарий</th>
                      <th className="py-3 px-4">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 text-xs">
                    {leads.map((lead) => (
                      <tr key={lead.id} className="hover:bg-stone-50/70">
                        <td className="py-3 px-4 font-mono text-stone-600 whitespace-nowrap">
                          <div className="font-bold text-stone-900">{lead.id}</div>
                          <div>{lead.createdAt}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-900">{lead.name}</div>
                          <div className="font-mono text-stone-700">{lead.phone}</div>
                          <div className="text-stone-500">Канал: {lead.preferredChannel}</div>
                        </td>
                        <td className="py-3 px-4 text-stone-700">
                          <div className="font-medium text-stone-900">{lead.district}</div>
                          <div>{lead.objectType}</div>
                        </td>
                        <td className="py-3 px-4 text-stone-600 max-w-[220px]">
                          <div>{lead.comment || '—'}</div>
                        </td>
                        <td className="py-3 px-4">
                          <select
                            aria-label={`Этап для заявки ${lead.id}`}
                            value={lead.funnelStage}
                            onChange={(e) =>
                              onUpdateLeadStage(lead.id, e.target.value as FunnelStage)
                            }
                            className="px-2.5 py-1.5 text-xs font-medium bg-[#FAF9F5] border border-stone-300 rounded-md text-stone-900"
                          >
                            {Object.entries(FUNNEL_STAGE_LABELS).map(([stageKey, label]) => (
                              <option key={stageKey} value={stageKey}>
                                {label}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Генератор файла <code className="font-mono">public/config.js</code>
                  </h3>
                  <p className="text-xs text-stone-600">
                    Заполните поля, чтобы обновить контакты и endpoint приёма заявок (например, Formspree) для GitHub Pages:
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyConfig}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {copiedConfig ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedConfig ? 'Скопировано' : 'Скопировать config.js'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Имя и статус (для подвала)
                  </label>
                  <input
                    type="text"
                    value={cfgOwnerName}
                    onChange={(e) => setCfgOwnerName(e.target.value)}
                    placeholder="Например: Юрий П., самозанятый"
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Телефон
                  </label>
                  <input
                    type="text"
                    value={cfgPhone}
                    onChange={(e) => setCfgPhone(e.target.value)}
                    placeholder="+7 (918) 000-00-00"
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-stone-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Ссылка на Telegram
                  </label>
                  <input
                    type="text"
                    value={cfgTelegram}
                    onChange={(e) => setCfgTelegram(e.target.value)}
                    placeholder="https://t.me/username"
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-stone-300 rounded-lg font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Ссылка на WhatsApp
                  </label>
                  <input
                    type="text"
                    value={cfgWhatsapp}
                    onChange={(e) => setCfgWhatsapp(e.target.value)}
                    placeholder="https://wa.me/79180000000"
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-stone-300 rounded-lg font-mono"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">
                    HTTPS Form Endpoint (Formspree для GitHub Pages)
                  </label>
                  <input
                    type="text"
                    value={cfgFormEndpoint}
                    onChange={(e) => setCfgFormEndpoint(e.target.value)}
                    placeholder="https://formspree.io/f/xxxxxx"
                    className="w-full px-3 py-2 bg-[#FAF9F5] border border-stone-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              <pre className="p-3.5 bg-stone-900 text-stone-100 rounded-lg text-xs font-mono overflow-x-auto">
                {generatedConfigJs}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-stone-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Закрыть
          </button>
        </div>
      </div>
    </dialog>
  );
};
