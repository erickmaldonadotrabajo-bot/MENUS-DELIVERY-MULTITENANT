import React, { memo } from 'react';

export const Button = memo(({ onClick, children, variant = "primary", className = "", disabled = false, icon: IconComp, style }) => { 
    const variants = { 
        primary: "bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] text-white shadow-lg active:scale-95 hover:brightness-110 disabled:opacity-50 disabled:pointer-events-none", 
        secondary: "bg-gray-800 text-white hover:bg-gray-700", 
        danger: "bg-red-100 text-red-800 border border-red-200" 
    }; 
    return ( 
        <button 
            type="button" 
            onClick={onClick} 
            disabled={disabled} 
            className={`px-6 py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all text-lg ${variants[variant]} ${className}`}
            style={style}
        > 
            {IconComp && <IconComp size={28} />} {children} 
        </button> 
    ); 
});