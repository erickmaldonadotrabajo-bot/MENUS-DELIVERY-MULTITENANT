import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

const getCleanDomain = () => {
  let hostname = window.location.hostname;
  hostname = hostname.replace(/^www\./, '');
  hostname = hostname.split(':')[0];
  return hostname.trim().toLowerCase();
};

const isPremiumDomain = () => {
  const cleanHostname = getCleanDomain();
  return (
    cleanHostname !== 'localhost' &&
    cleanHostname !== '127.0.0.1' &&
    !cleanHostname.endsWith('netlify.app') &&
    !cleanHostname.endsWith('netlify.com') &&
    !cleanHostname.endsWith('vercel.app')
  );
};

export default function Home() {
  const [tienda, setTienda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchTienda = async () => {
      try {
        let data = null;
        const cleanHostname = getCleanDomain();
        const premium = isPremiumDomain();
        const urlParams = new URLSearchParams(window.location.search);
        const parametroTienda = urlParams.get('tienda');

        if (premium) {
          const { data: resData, error } = await supabase
            .from('tiendas')
            .select('*')
            .ilike('dominio_personal', cleanHostname)
            .maybeSingle();

          if (error) throw new Error(`Error BD: ${error.message}`);
          if (!resData) throw new Error(`El dominio [${cleanHostname}] no está asignado.`);
          data = resData;
        } else {
          if (!parametroTienda || parametroTienda.trim() === '') {
            throw new Error("ERROR ACCESO DENEGADO.");
          }

          let query = supabase.from('tiendas').select('*');
          if (/^\d+$/.test(parametroTienda)) {
            query = query.eq('id', parseInt(parametroTienda));
          } else {
            query = query.eq('slug', parametroTienda);
          }

          const { data: resData, error } = await query.single();
          if (error || !resData) throw new Error("La tienda solicitada no existe.");
          data = resData;

          if (data.slug && parametroTienda !== data.slug) {
            window.history.replaceState(null, '', `${window.location.pathname}?tienda=${data.slug}`);
          }
        }
        
        document.title = data.nombre;

        if (data.logo_url) {
          // 1. GENERADOR DE PWA (Manifest dinámico)
          const manifestJSON = {
            name: data.nombre,
            short_name: data.nombre,
            start_url: window.location.href,
            display: "standalone",
            background_color: data.color_fondo || "#111827",
            theme_color: data.color_primario || "#f97316",
            icons: [
              { src: data.logo_url, sizes: "192x192", type: "image/png" },
              { src: data.logo_url, sizes: "512x512", type: "image/png", purpose: "any maskable" }
            ]
          };
          
          const manifestBlob = new Blob([JSON.stringify(manifestJSON)], { type: 'application/json' });
          const manifestLink = document.createElement('link');
          manifestLink.rel = 'manifest';
          manifestLink.href = URL.createObjectURL(manifestBlob);
          document.head.appendChild(manifestLink);

          // 2. INYECCIÓN DINÁMICA DEL FAVICON (Pestaña del navegador)
          let linkIcon = document.querySelector("link[rel~='icon']");
          if (!linkIcon) {
            linkIcon = document.createElement('link');
            linkIcon.rel = 'icon';
            document.head.appendChild(linkIcon);
          }
          linkIcon.href = data.logo_url;

          // 3. INYECCIÓN DEL APPLE TOUCH ICON (Para accesos directos en iOS/iPhone)
          let appleIcon = document.querySelector("link[rel='apple-touch-icon']");
          if (!appleIcon) {
            appleIcon = document.createElement('link');
            appleIcon.rel = 'apple-touch-icon';
            document.head.appendChild(appleIcon);
          }
          appleIcon.href = data.logo_url;
        }

        setTienda(data);
      } catch (err) {
        setErrorMsg(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTienda();
  }, []);

  // FUNCIÓN PARA COMPARTIR NATIVO
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: tienda.nombre,
          text: `¡Mira el menú de ${tienda.nombre} y realiza tu pedido!`,
          url: window.location.href 
        });
      } catch (err) { 
        console.log('Error compartiendo:', err); 
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("¡Enlace copiado al portapapeles!");
    }
  };

  // PANTALLA DE CARGA
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900">
        <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-orange-500 animate-spin"></div>
      </div>
    );
  }

  // PANTALLA DE ERROR
  if (errorMsg || !tienda) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-900">
        <div className="bg-red-900/40 border border-red-500 p-6 rounded-2xl max-w-sm w-full shadow-2xl text-center animate-fade-in transition-all">
          <div className="text-5xl mb-4">🚫</div>
          <h2 className="text-2xl font-black mb-2 text-white uppercase tracking-wider">Acceso Denegado</h2>
          <p className="text-red-300 text-sm">{errorMsg}</p>
        </div>
      </div>
    );
  }

  // VARIABLES DE ENLACES
  const premium = isPremiumDomain();
  const identificador = tienda.slug || tienda.id;
  const linkMenu = premium ? '/menu' : `/menu?tienda=${identificador}`;
  const linkImagenes = premium ? '/menu-imagenes' : `/menu-imagenes?tienda=${identificador}`;

  // INTERFAZ PRINCIPAL
  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden text-white font-sans"
      style={{ backgroundColor: tienda.color_fondo || '#111827' }} 
    >
      <div className="w-full max-w-sm mx-auto animate-fade-in relative z-10 duration-500 ease-out">
        
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-[100px] opacity-20 pointer-events-none -z-10"
          style={{ backgroundColor: tienda.color_primario || '#f97316' }}
        ></div>

        <img 
          src={tienda.logo_url || "https://cdn-icons-png.flaticon.com/512/900/900797.png"} 
          alt="Logo" 
          className="w-40 h-40 rounded-full mx-auto mb-6 object-cover border-4 shadow-[0_0_25px_rgba(0,0,0,0.5)]" 
          style={{ 
            borderColor: tienda.color_primario || '#f97316', 
            boxShadow: `0 0 25px ${tienda.color_primario || '#f97316'}`,
            backgroundColor: tienda.color_fondo || '#111827'
          }}
        />
        
        <h1 className="text-4xl font-black text-white mb-2 tracking-wider uppercase drop-shadow-md">
          {tienda.nombre}
        </h1>
        
        <p 
          className="font-bold tracking-widest text-sm mb-10 uppercase drop-shadow-md" 
          style={{ color: tienda.color_primario || '#f97316' }}
        >
          {tienda.mensaje_bienvenida || 'El mejor sabor hasta tu casa'}
        </p>

        <div className="space-y-4 relative z-20">
          
          <Link 
            to={linkMenu} 
            className="flex items-center justify-center gap-2 w-full text-white font-bold text-xl py-5 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all" 
            style={{ background: `linear-gradient(to right, ${tienda.color_primario || '#f97316'}, ${tienda.color_secundario || '#ef4444'})` }}
          >
            🛵 HACER UN PEDIDO
          </Link>

          {tienda.menu_imagenes_url ? (
            <a 
              href={linkImagenes} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 w-full bg-gray-800 text-white font-bold text-lg py-4 rounded-2xl border-2 hover:bg-gray-700 active:scale-95 transition-all" 
              style={{ borderColor: tienda.color_primario || '#374151' }}
            >
              📖 VER MENÚ EN IMÁGENES
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2 w-full bg-gray-800/50 text-gray-500 font-bold text-sm py-4 rounded-2xl border border-gray-800 cursor-not-allowed">
              📖 Menú en imágenes no disponible
            </div>
          )}

          {tienda.latitud && tienda.longitud && (
            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${tienda.latitud},${tienda.longitud}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center justify-center gap-2 w-full bg-blue-600/10 text-blue-400 font-bold text-lg py-4 rounded-2xl border border-blue-600/30 hover:bg-blue-600 hover:text-white active:scale-95 transition-all"
            >
              📍 VER UBICACIÓN
            </a>
          )}

          <button 
            onClick={handleShare} 
            className="flex items-center justify-center gap-2 w-full bg-gray-800 text-white font-bold text-lg py-4 rounded-2xl border-2 hover:bg-gray-700 active:scale-95 transition-all" 
            style={{ borderColor: tienda.color_primario || '#374151' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            COMPARTIR TIENDA
          </button>
        </div>

        <p className="text-gray-500 text-xs mt-12 font-medium">
          © {new Date().getFullYear()} {tienda.nombre}. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
}