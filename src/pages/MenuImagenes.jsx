import { Link } from 'react-router-dom';
import { useLandingData } from '../hooks/useLandingData';

// Definimos los íconos localmente para evitar el Error 130 de dependencias no encontradas
const LocalIcons = {
  X: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Upload: () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
};

export default function MenuImagenes() {
  const { tienda, loading, errorMsg, isPremiumDomain } = useLandingData();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900">
        <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-orange-500 animate-spin"></div>
      </div>
    );
  }

  if (errorMsg || !tienda || !tienda.menu_imagenes_url) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900">
        <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center animate-fade-in transition-all">
          <div className="text-5xl mb-4">📖</div>
          <h2 className="text-2xl font-black mb-2 text-white uppercase tracking-wider">Menú no disponible</h2>
          <p className="text-gray-400 text-sm mb-6">Este restaurante aún no ha subido un menú en imágenes.</p>
          <button onClick={() => window.close()} className="w-full bg-orange-600 hover:bg-orange-500 font-bold py-3 rounded-xl shadow-lg transition-all text-white">
            VOLVER
          </button>
        </div>
      </div>
    );
  }

  const identificador = tienda.slug || tienda.id;
  const linkVolver = isPremiumDomain ? '/' : `/?tienda=${identificador}`;
  const linkMenu = isPremiumDomain ? '/menu' : `/menu?tienda=${identificador}`;

  return (
    <div 
      className="min-h-screen flex flex-col items-center relative pb-28" 
      style={{ backgroundColor: tienda.color_fondo || '#111827' }}
    >
      {/* HEADER FLOTANTE */}
      <div className="fixed top-0 left-0 w-full p-4 z-50 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <Link 
          to={linkVolver}
          className="flex items-center gap-2 bg-black/50 backdrop-blur-md text-white px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 transition-all font-bold text-sm"
        >
          <LocalIcons.X /> Cerrar
        </Link>
        <a 
          href={tienda.menu_imagenes_url} 
          download="Menu"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-gray-800/90 backdrop-blur-md text-white px-4 py-2 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg border border-gray-600"
        >
          <LocalIcons.Upload /> Descargar
        </a>
      </div>

      {/* VISOR DE IMAGEN */}
      <div className="w-full h-full min-h-screen flex items-center justify-center pt-20 px-4 animate-fade-in">
        <div className="max-w-4xl w-full bg-white rounded-xl overflow-hidden shadow-2xl">
          <img 
            src={tienda.menu_imagenes_url} 
            alt={`Menú de ${tienda.nombre}`} 
            className="w-full h-auto object-contain"
          />
        </div>
      </div>

      {/* BOTÓN FLOTANTE: "QUIERO PEDIR AHORA" */}
      <div className="fixed bottom-6 w-full flex justify-center z-50 px-4">
        <Link 
          to={linkMenu}
          className="flex items-center justify-center gap-2 w-full max-w-sm text-white font-black text-xl py-4 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.8)] hover:scale-105 active:scale-95 transition-all"
          style={{ background: `linear-gradient(to right, ${tienda.color_primario || '#f97316'}, ${tienda.color_secundario || '#ef4444'})` }}
        >
          🛵 QUIERO PEDIR AHORA
        </Link>
      </div>
    </div>
  );
}