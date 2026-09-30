import React, { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, BedDouble, Lock, CheckCircle2 } from "lucide-react";

export interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  currentIndex: number;
  onIndexChange: (index: number) => void;
  title?: string;
  rooms?: Array<{
    name: string;
    status: string;
    isOccupied: boolean;
  }>;
}

export function ImageViewerModal({
  isOpen,
  onClose,
  images,
  currentIndex,
  onIndexChange,
  title,
  rooms,
}: ImageViewerModalProps) {
  const prev = useCallback(() => {
    if (images.length <= 1) return;
    onIndexChange(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  }, [currentIndex, images.length, onIndexChange]);

  const next = useCallback(() => {
    if (images.length <= 1) return;
    onIndexChange(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  }, [currentIndex, images.length, onIndexChange]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, prev, next]);

  if (!isOpen || images.length === 0) return null;

  const currentRoom = rooms?.[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 p-4 sm:p-6 backdrop-blur-md select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Top Header Bar */}
      <div
        className="w-full flex items-center justify-between z-50 text-white max-w-6xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col min-w-0 pr-4">
          {title && <h3 className="text-base sm:text-lg font-bold truncate text-white">{title}</h3>}
          {currentRoom && (
            <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-300">
              <span className="flex items-center gap-1 font-medium text-emerald-400">
                <BedDouble className="h-3.5 w-3.5" />
                {currentRoom.name}
              </span>
              <span>·</span>
              <span
                className={`font-semibold flex items-center gap-1 ${
                  currentRoom.isOccupied ? "text-rose-400" : "text-emerald-400"
                }`}
              >
                {currentRoom.isOccupied ? <Lock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                {currentRoom.status}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs sm:text-sm font-medium bg-white/10 px-3 py-1 rounded-full text-slate-200 backdrop-blur-sm">
            {currentIndex + 1} / {images.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/15 hover:bg-white/30 p-2 text-white transition-all hover:scale-110 shadow-lg focus:outline-none"
            aria-label="Close full-screen image viewer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="relative flex-1 w-full max-w-5xl my-4 flex items-center justify-center overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={images[currentIndex]}
          alt={`${title || "Boarding house photo"} - ${currentIndex + 1}`}
          className="max-h-[75vh] w-auto max-w-full object-contain rounded-lg shadow-2xl transition-all duration-300"
        />

        {/* Previous Arrow */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition-all hover:scale-110 shadow-2xl z-20 border border-white/20"
            aria-label="Previous photo"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}

        {/* Next Arrow */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 grid h-12 w-12 place-items-center rounded-full bg-black/70 hover:bg-black/90 text-white backdrop-blur-md transition-all hover:scale-110 shadow-2xl z-20 border border-white/20"
            aria-label="Next photo"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip */}
      {images.length > 1 && (
        <div
          className="w-full max-w-3xl flex gap-2 overflow-x-auto justify-center py-2 px-4 z-50 scrollbar-none"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((imgUrl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onIndexChange(i)}
              className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                i === currentIndex
                  ? "border-emerald-500 scale-105 shadow-md shadow-emerald-500/20"
                  : "border-transparent opacity-50 hover:opacity-100"
              }`}
            >
              <img src={imgUrl} alt={`Thumb ${i + 1}`} className="h-12 w-16 object-cover" />
              {rooms?.[i]?.isOccupied && (
                <span className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full p-0.5">
                  <Lock className="h-2 w-2" />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
