import React, { memo } from 'react';

export const DynamicStyles = memo(({ storeConfig }) => (
    <style>{`
        :root {
            --color-primary: ${storeConfig?.color_primario || '#f97316'};
            --color-secondary: ${storeConfig?.color_secundario || '#ef4444'};
            --color-bg: ${storeConfig?.color_fondo || '#111827'};
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fade-in-down { 0% { opacity: 0; transform: translateY(-10px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes slide-up { 0% { opacity: 0; transform: translateY(15px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
        .loader { border: 4px solid rgba(255,255,255,0.1); border-top: 4px solid var(--color-primary); border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes electric-glow {
            0% { box-shadow: 0 0 5px #fff, 0 0 10px #facc15, 0 0 20px #f97316; border-color: #ffffff; }
            50% { box-shadow: 0 0 20px #fff, 0 0 30px #facc15, 0 0 50px #ef4444; border-color: #fef08a; }
            100% { box-shadow: 0 0 5px #fff, 0 0 10px #facc15, 0 0 20px #f97316; border-color: #ffffff; }
        }
        .logo-electric { border-width: 6px; border-style: solid; animation: electric-glow 1.5s infinite alternate ease-in-out; }
        @keyframes shine-metal { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
        .text-metal-shine { background: linear-gradient(to right, #ca8a04 0%, #facc15 30%, #ffffff 50%, #facc15 70%, #ca8a04 100%); background-size: 200% auto; color: transparent; -webkit-background-clip: text; background-clip: text; animation: shine-metal 3s linear infinite; text-shadow: 0px 2px 4px rgba(0,0,0,0.3); }
    `}</style>
));