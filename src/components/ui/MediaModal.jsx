import React, { memo } from 'react';

export const MediaModal = ({ media, onClose }) => {
    if (!media) return null;
    const cleanUrl = String(media.url).trim();
    return createPortal(
        <div className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in-down" onClick={onClose}>
            <div className="relative w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl bg-gray-900 border border-gray-700 flex items-center justify-center min-h-[250px]" onClick={e => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 z-50 bg-black/70 text-white p-2 rounded-full hover:bg-white hover:text-black transition-colors border border-white/20 shadow-lg"><Icons.X /></button>
                {media.type === 'video' ? (
                    <video src={cleanUrl} className="w-full h-auto max-h-[80vh] object-contain" autoPlay={true} loop={true} muted={true} playsInline={true} preload="metadata" />
                ) : (
                    <img src={cleanUrl} className="w-full h-auto max-h-[80vh] object-contain" alt="Vista del producto" loading="lazy" />
                )}
            </div>
        </div>,
        document.body
    );
};