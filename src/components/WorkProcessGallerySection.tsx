import React, { useState, useEffect, useRef } from 'react';
import { DEFAULT_PROCESS_PHOTOS, type WorkProcessPhotoItem } from '../data/landingData';
import { Camera, Upload, ZoomIn, X, RotateCcw } from 'lucide-react';

interface WorkProcessGallerySectionProps {
  onTrackEvent: (eventName: string, meta?: Record<string, string>) => void;
}

const STORAGE_KEY = 'rpk_custom_process_photos_v1';

export const WorkProcessGallerySection: React.FC<WorkProcessGallerySectionProps> = ({
  onTrackEvent,
}) => {
  const [photos, setPhotos] = useState<WorkProcessPhotoItem[]>(DEFAULT_PROCESS_PHOTOS);
  const [activePhoto, setActivePhoto] = useState<WorkProcessPhotoItem | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const batchInputRef = useRef<HTMLInputElement | null>(null);
  const singleInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    // Load persisted custom photos from backend or localStorage
    const loadSavedPhotos = async () => {
      try {
        const res = await fetch('/api/process-photos');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.photos) && data.photos.length > 0) {
            setPhotos(data.photos);
            return;
          }
        }
      } catch {
        // Fallback to localStorage on static hosting
      }

      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPhotos(parsed);
          }
        }
      } catch {
        // Ignore storage read errors
      }
    };
    loadSavedPhotos();
  }, []);

  const persistPhotos = async (nextPhotos: WorkProcessPhotoItem[]) => {
    setPhotos(nextPhotos);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextPhotos));
    } catch {
      // Ignore quota errors
    }

    try {
      await fetch('/api/process-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photos: nextPhotos }),
      });
    } catch {
      // Offline / static mode
    }
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleReplaceSinglePhoto = async (photoId: string, fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const updated = photos.map((item) =>
        item.id === photoId
          ? {
              ...item,
              imageUrl: dataUrl,
            }
          : item
      );
      await persistPhotos(updated);
      setUploadStatus(`Фото для блока «${ file.name }» обновлено и сохранено в проект.`);
      onTrackEvent('process_photo_replaced', { photoId, fileName: file.name });
    } catch {
      setUploadStatus('Не удалось прочитать выбранный файл изображения.');
    }
  };

  const handleBatchUploadPhotos = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, 8);
    try {
      const dataUrls = await Promise.all(files.map(readFileAsDataUrl));
      const updated = [...photos];

      dataUrls.forEach((dataUrl, idx) => {
        if (idx < updated.length) {
          updated[idx] = {
            ...updated[idx],
            imageUrl: dataUrl,
          };
        } else {
          updated.push({
            id: `process-custom-${Date.now()}-${idx}`,
            stageNumber: `Этап 0${idx + 1} · Фото с объекта`,
            title: files[idx].name.replace(/\.[^.]+$/, ''),
            subtitle: 'Демонстрация рабочего процесса на объекте',
            whatWeCheck: 'Контроль выполнения этапа, аккуратности монтажа и соблюдения технологии работ.',
            imageUrl: dataUrl,
          });
        }
      });

      await persistPhotos(updated);
      setUploadStatus(`Загружено фотографий процессов: ${files.length} шт. Они сразу сохранены в проект.`);
      onTrackEvent('process_photos_batch_uploaded', { count: String(files.length) });
    } catch {
      setUploadStatus('Не удалось загрузить фотографии.');
    }
  };

  const handleResetDefaultPhotos = async () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    await persistPhotos(DEFAULT_PROCESS_PHOTOS);
    setUploadStatus('Восстановлены базовые иллюстрации процессов работ.');
  };

  return (
    <section
      id="processes"
      className="py-16 sm:py-20 border-b border-stone-200 bg-white"
      aria-labelledby="processes-heading"
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-stone-500 mb-2">
              Наглядный ход работ · Контроль скрытых и черновых этапов
            </p>
            <h2
              id="processes-heading"
              className="text-2xl sm:text-3xl font-bold tracking-tight text-stone-900"
              style={{ textWrap: 'balance' }}
            >
              Как выглядят процессы работ на объекте
            </h2>
            <p className="mt-3 text-base text-stone-600 leading-relaxed">
              Доверие строится на понятных вещах: ровная разметка, аккуратная прокладка коммуникаций и фотофиксация каждого этапа до того, как стены будут закрыты отделкой.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <input
              ref={batchInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleBatchUploadPhotos(e.target.files)}
              className="sr-only"
              id="batch-process-photos-input"
            />
            <button
              type="button"
              onClick={() => batchInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-stone-800 bg-stone-100 border border-stone-300 rounded-lg hover:bg-stone-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-800" />
              Загрузить свои фото процессов
            </button>
            {photos !== DEFAULT_PROCESS_PHOTOS && (
              <button
                type="button"
                onClick={handleResetDefaultPhotos}
                className="inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-lg hover:text-stone-900 transition-colors cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Сбросить
              </button>
            )}
          </div>
        </div>

        {uploadStatus && (
          <div
            role="status"
            className="mb-6 p-3.5 rounded-lg bg-emerald-950/5 border border-emerald-800/20 flex items-center justify-between gap-4 text-xs text-stone-800"
          >
            <span>{uploadStatus}</span>
            <button
              type="button"
              onClick={() => setUploadStatus(null)}
              className="text-stone-500 hover:text-stone-900 font-medium cursor-pointer whitespace-nowrap shrink-0"
            >
              Скрыть
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {photos.map((item) => (
            <article
              key={item.id}
              className="group bg-[#FAF9F5] border border-stone-200 rounded-xl overflow-hidden flex flex-col justify-between transition-colors hover:border-stone-300"
            >
              <div>
                <div className="relative aspect-[4/3] w-full bg-stone-900 overflow-hidden border-b border-stone-200">
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.01]"
                  />

                  <div className="absolute top-3 right-3 flex items-center gap-2">
                    <input
                      ref={(el) => {
                        singleInputRefs.current[item.id] = el;
                      }}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleReplaceSinglePhoto(item.id, e.target.files)}
                      className="sr-only"
                    />
                    <button
                      type="button"
                      onClick={() => singleInputRefs.current[item.id]?.click()}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-stone-900/80 hover:bg-stone-900 rounded-md backdrop-blur-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      aria-label={`Заменить фото для этапа ${item.title}`}
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Заменить фото
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActivePhoto(item);
                        onTrackEvent('process_photo_zoom', { id: item.id, title: item.title });
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-white bg-stone-900/80 hover:bg-stone-900 rounded-md backdrop-blur-xs transition-colors cursor-pointer whitespace-nowrap shrink-0"
                      aria-label={`Увеличить фото: ${item.title}`}
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                      Крупнее
                    </button>
                  </div>
                </div>

                <div className="p-5">
                  <p className="text-xs font-mono font-semibold text-emerald-900 mb-1">
                    {item.stageNumber} · {item.subtitle}
                  </p>
                  <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-snug mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-stone-600 leading-relaxed">{item.whatWeCheck}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Lightbox Modal for Closer Inspection */}
        {activePhoto && (
          <dialog
            open
            className="fixed inset-0 z-50 m-0 w-full h-full bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-4"
            aria-label={activePhoto.title}
          >
            <div className="bg-white border border-stone-200 rounded-xl max-w-3xl w-full overflow-hidden shadow-xl">
              <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-stone-200">
                <div>
                  <p className="text-xs font-mono text-stone-500">{activePhoto.stageNumber}</p>
                  <h3 className="text-base font-bold text-stone-900">{activePhoto.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActivePhoto(null)}
                  aria-label="Закрыть просмотр фото"
                  className="p-2 text-stone-500 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-stone-900 aspect-[4/3] w-full overflow-hidden">
                <img
                  src={activePhoto.imageUrl}
                  alt={activePhoto.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="p-5 bg-[#FAF9F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-sm text-stone-700 leading-relaxed">{activePhoto.whatWeCheck}</p>
                <button
                  type="button"
                  onClick={() => setActivePhoto(null)}
                  className="px-4 py-2 text-xs font-semibold text-stone-800 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  Закрыть
                </button>
              </div>
            </div>
          </dialog>
        )}
      </div>
    </section>
  );
};
