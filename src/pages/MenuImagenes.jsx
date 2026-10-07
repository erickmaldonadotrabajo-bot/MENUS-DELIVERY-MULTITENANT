import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLandingData } from '../hooks/useLandingData';

export default function MenuImagenes() {
    const { tienda, loading, errorMsg, isPremiumDomain } = useLandingData();
    const [imagenes, setImagenes] = useState([]);

    useEffect(() => {
        if (tienda && tienda.menu_imagenes_url) {
            // Convierte el string separado por comas en un array de URLs, tal como lo tenías en tu HTML original
            const urlsArray = tienda.menu_imagenes_url
                .split(',')
                .map(url => url.trim())
                .filter(url => url.length > 0);
            setImagenes(urlsArray);
        }
    }, [tienda]);

    // PANTALLAS DE ESTADO (Carga y Error)
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900">
                <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-orange-500 animate-spin"></div>
            </div>
        );
    }

    if (errorMsg || !tienda) {
        return (
            <div className="min-h-screen flex items-center justify-center p-6 text-center bg-gray-900">
                <div className="bg-red-900/40 border border-red-500 p-6 rounded-2xl max-w-sm animate-fade-in">
                    <h2 className="text-xl font-bold text-white mb-2">Tienda no encontrada</h2>
                    <Link to="/" className="text-gray-300 text-sm underline hover:text-white transition-colors">Volver al inicio</Link>
                </div>
            </div>
        );
    }

    // ENLACES INTELIGENTES
    const identificador = tienda.slug || tienda.id;
    const linkInicio = isPremiumDomain ? '/' : `/?tienda=${identificador}`;
    const linkMenus = isPremiumDomain ? '/menu' : `/menu?tienda=${identificador}`;

    return (
        <div 
            className="min-h-screen pb-10 text-white animate-fade-in relative"
            style={{ backgroundColor: tienda.color_fondo || '#111827' }}
        >
            {/* ELEMENTO BLOQUE CABECERA (Fijación magnética / Sticky) */}
            <div 
                className="sticky top-0 backdrop-blur-xl p-4 text-center z-50 border-b border-gray-800 shadow-lg" 
                style={{ backgroundColor: `${tienda.color_fondo || '#111827'}CC` }}
            >
                <h1 
                    className="font-black text-2xl tracking-widest uppercase drop-shadow-md" 
                    style={{ color: tienda.color_primario || '#f97316' }}
                >
                    NUESTRO MENÚ
                </h1>
                <Link to={linkInicio} className="text-gray-400 text-sm font-bold mt-1 inline-block hover:text-white transition-colors">
                    ⬅ Volver al inicio
                </Link>
            </div>

            {/* CONTENEDOR DE IMÁGENES Y BOTONES */}
            <div className="max-w-md mx-auto flex flex-col items-center gap-8 mt-6 px-4">
                {imagenes.length > 0 ? (
                    imagenes.map((url, index) => (
                        <div key={index} className="w-full flex flex-col gap-3 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                            <img 
                                src={url} 
                                alt={`Menú ${tienda.nombre} página ${index + 1}`} 
                                className="w-full rounded-2xl shadow-2xl border border-gray-700 bg-gray-800 object-cover" 
                                loading={index === 0 ? "eager" : "lazy"} 
                            />

                            <Link 
                                to={linkMenus} 
                                className="block w-full text-white text-center font-black text-xl py-4 rounded-xl shadow-lg active:scale-95 transition-transform"
                                style={{ 
                                    background: `linear-gradient(to right, ${tienda.color_primario || '#f97316'}, ${tienda.color_secundario || '#ef4444'})`,
                                    border: `1px solid ${tienda.color_primario || '#f97316'}`
                                }}
                            >
                                🛵 ¡QUIERO PEDIR AHORA!
                            </Link>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-gray-900/50 w-full rounded-2xl border border-gray-800">
                        <p className="text-gray-400 font-medium">Esta tienda aún no ha subido imágenes de su menú.</p>
                    </div>
                )}
            </div>
        </div>
    );
}