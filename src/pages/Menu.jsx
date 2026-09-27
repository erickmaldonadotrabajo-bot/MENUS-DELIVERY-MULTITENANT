import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';

// ==========================================
// UTILIDADES
// ==========================================
const limpiarTexto = (t) => t ? String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "").trim() : "";

const calculateDistance = (lat1, lon1, lat2, lon2) => { 
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180; 
    const dLon = (lon2 - lon1) * Math.PI / 180; 
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
};

// ==========================================
// COMPONENTES REUTILIZABLES (Iconos y Botones)
// ==========================================
const Icon = memo(({ d, size = 28, className = "" }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d={d} />
    </svg>
));

const Icons = {
    Cart: (p) => <svg {...p} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>, 
    Map: (p) => <svg {...p} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>, 
    Check: (p) => <Icon {...p} d="M20 6L9 17l-5-5" />, 
    Plus: (p) => <Icon {...p} d="M12 5v14M5 12h14" />, 
    Minus: (p) => <Icon {...p} d="M5 12h14" />, 
    Send: (p) => <svg {...p} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>, 
    Info: (p) => <svg {...p} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>, 
    Cash: (p) => <svg {...p} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><line x1="12" y1="7" x2="12" y2="21"></line><path d="M16.5 13.5h.01"></path><path d="M7.5 13.5h.01"></path></svg>, 
    Phone: (p) => <svg {...p} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>, 
    Card: (p) => <svg {...p} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>, 
    Search: (p) => <svg {...p} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>, 
    Clock: (p) => <svg {...p} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>, 
    X: (p) => <svg {...p} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>,
    Eye: (p) => <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>,
    ShareNode: (p) => <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
};

const Button = memo(({ onClick, children, variant = "primary", className = "", disabled = false, icon: IconComp, style }) => { 
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

const MediaModal = ({ media, onClose }) => {
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

const ProductItem = memo(({ item, category, onAdd, config, onShowMedia }) => {
    const [conTodo, setConTodo] = useState(true);
    const [exclusions, setExclusions] = useState({});
    const [selectedExtras, setSelectedExtras] = useState([]); 
    
    const isAvailable = item.disponible;
    const availableToppings = useMemo(() => item.removables || [], [item]);

    const parsedExtras = useMemo(() => {
        if (Array.isArray(item.extras) && item.extras.length > 0) return item.extras;
        if (item.has_extra && item.extra_name) return [{ nombre: item.extra_name, precio: item.extra_precio }];
        return [];
    }, [item.extras, item.has_extra, item.extra_name, item.extra_precio]);

    const extrasTotal = selectedExtras.reduce((sum, ext) => sum + (parseFloat(ext.precio) || 0), 0);
    const currentPrice = parseFloat(item.precio) + extrasTotal;
    
    useEffect(() => { 
        setConTodo(true); 
        setExclusions({}); 
        setSelectedExtras([]);
    }, [item.nombre]);
    
    const toggleConTodo = useCallback(() => { 
        if (!conTodo) { setConTodo(true); setExclusions({}); } 
    }, [conTodo]);
    
    const toggleExclusion = useCallback((topping) => { 
        setExclusions(prev => { 
            const newState = !prev[topping]; 
            const newExclusions = { ...prev, [topping]: newState }; 
            const anyExcluded = Object.values(newExclusions).some(val => val === true); 
            setConTodo(!anyExcluded); 
            return newExclusions; 
        }); 
    }, []);

    const toggleExtra = useCallback((extra) => {
        setSelectedExtras(prev => {
            const isSelected = prev.find(e => e.nombre === extra.nombre);
            if (isSelected) return prev.filter(e => e.nombre !== extra.nombre);
            return [...prev, extra];
        });
    }, []);
    
    const handleAdd = useCallback(() => { 
        let details = ""; 
        const activeExclusions = Object.entries(exclusions).filter(([_, isExcluded]) => isExcluded).map(([name]) => name); 
        
        if (availableToppings.length === 0) details = ""; 
        else if (conTodo) details = " (Con Todo)"; 
        else if (activeExclusions.length === availableToppings.length) details = " (SIN NADA / SOLO)"; 
        else if (activeExclusions.length > 0) details = ` (SIN ${activeExclusions.join(', SIN ')})`; 
        else details = " (Con Todo)"; 
        
        const hasAnyExtra = selectedExtras.length > 0;
        const extrasNombres = selectedExtras.map(e => e.nombre).join(', ');

        onAdd({ 
            ...item, 
            name: item.nombre, 
            price: currentPrice, 
            isExtra: hasAnyExtra, 
            extraAppliedName: extrasNombres, 
            details: details 
        }); 

        setSelectedExtras([]);
        setConTodo(true);
        setExclusions({});
    }, [exclusions, conTodo, availableToppings, onAdd, item, currentPrice, selectedExtras]);

    return (
        <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col animate-slide-up h-full ${!isAvailable ? 'opacity-60 bg-gray-100' : ''}`}>
            <div className="p-2 flex-grow">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-gray-900 text-xl leading-tight">{item.nombre}</h3>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                        <span className="bg-orange-50 text-[var(--color-primary)] px-3 py-1 rounded-lg font-bold text-lg whitespace-nowrap ml-2 border border-[var(--color-primary)]/20">
                            ${currentPrice.toFixed(2)}
                        </span>
                        {!isAvailable && <span className="text-xs bg-red-600 text-white px-2 py-1 rounded mt-1 font-bold">AGOTADO</span>}
                    </div>
                </div>

                {item.descripcion && (
                    <p className="text-sm text-gray-500 mb-3 leading-snug break-words">{item.descripcion}</p>
                )}

                {(item.video_url || item.image_url) && (
                    <button 
                        onClick={() => onShowMedia({ url: item.video_url || item.image_url, type: item.video_url ? 'video' : 'image' })} 
                        className="mb-4 flex items-center gap-1 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-full hover:bg-orange-600 transition-colors shadow-sm"
                    >
                        <Icons.Eye /> Ver Producto
                    </button>
                )}

                {isAvailable && availableToppings.length > 0 && (
                    <div className="mb-4 flex flex-col gap-2 pt-2 border-t border-gray-100">
                        <p className='text-sm text-gray-500 mb-1 font-semibold'>Personalizar:</p>
                        <label className="flex items-center gap-3 text-base font-bold text-gray-900 cursor-pointer select-none p-2 rounded bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors">
                            <input type="checkbox" checked={conTodo} onChange={toggleConTodo} className="w-5 h-5 rounded" style={{accentColor: config.color_primario || '#f97316'}} />
                            Con Todo
                        </label>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                            {availableToppings.map(t => ( 
                                <label key={t} className={`flex items-center gap-2 text-sm cursor-pointer select-none p-2 rounded border transition-colors ${exclusions[t] ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}>
                                    <input type="checkbox" checked={exclusions[t] || false} onChange={() => toggleExclusion(t)} className="w-4 h-4 rounded" style={{accentColor: '#dc2626'}} />
                                    Sin {t}
                                </label> 
                            ))}
                        </div>
                    </div>
                )}

                {parsedExtras.length > 0 && isAvailable && (
                    <div className="mb-4 flex flex-col gap-2 border-t border-gray-100 pt-3 mt-2">
                        <p className='text-sm text-gray-500 mb-1 font-semibold'>Extras disponibles:</p>
                        {parsedExtras.map((ext, idx) => {
                            const isSelected = selectedExtras.some(e => e.nombre === ext.nombre);
                            const extPrice = parseFloat(ext.precio) || 0;
                            return (
                                <div key={idx} onClick={() => toggleExtra(ext)} role="button" className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'border-[var(--color-primary)] bg-orange-50 ring-1 ring-[var(--color-primary)]' : 'border-gray-200 bg-gray-50 hover:bg-gray-100'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-white border-gray-400'}`}>
                                            {isSelected && <Icons.Check size={14} className="text-white" />}
                                        </div>
                                        <span className="text-sm font-medium text-gray-800">{ext.nombre}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700">+{extPrice > 0 ? `$${extPrice.toFixed(2)}` : 'Gratis'}</span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
            
            <div className="p-4 pt-0 mt-auto">
                <Button onClick={handleAdd} disabled={!isAvailable} className="w-full text-lg py-3" icon={Icons.Plus}>
                    {isAvailable ? 'Agregar' : 'No disponible'}
                </Button>
            </div>
        </div>
    );
});

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function Menu() {
    const [searchParams] = useSearchParams();
    const parametroTienda = searchParams.get('tienda');

    // Estados de Tienda
    const [storeConfig, setStoreConfig] = useState(null);
    const [categoriesDB, setCategoriesDB] = useState([]);
    const [menuItemsDB, setMenuItemsDB] = useState([]);
    
    // Estados UI
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [activeMedia, setActiveMedia] = useState(null); 
    const categoriesRef = useRef(null);
    
    const [whatsappFallbackUrl, setWhatsappFallbackUrl] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitText, setSubmitText] = useState("Confirmar Orden");
    const [cartAnimate, setCartAnimate] = useState(false);
    const [cart, setCart] = useState([]);
    const [activeCategory, setActiveCategory] = useState("");
    const [showCart, setShowCart] = useState(false);
    const [notification, setNotification] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showWaitModal, setShowWaitModal] = useState(false);
    const [showDrinkUpsell, setShowDrinkUpsell] = useState(false);
    
    const [orderType, setOrderType] = useState('delivery'); 
    const [location, setLocation] = useState({ lat: null, lng: null, status: 'idle', shippingCost: 0, zoneName: '', distance: 0, allowed: false });
    
    const [customer, setCustomer] = useState({ name: '', phone: '', customAnswers: {}, paymentMethod: '', paymentAmount: '', instructions: '', tip: '' });

    // ESTILOS INYECTADOS
    const InjectedStyles = () => (
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
    );

    // Carga de Datos Principal
    useEffect(() => {
        const getCleanDomain = () => {
            let hostname = window.location.hostname;
            hostname = hostname.replace(/^www\./, ''); 
            hostname = hostname.split(':')[0]; 
            return hostname.trim().toLowerCase(); 
        };

        const cleanHostname = getCleanDomain();
        const isPremiumDomain = cleanHostname !== 'localhost' 
                             && cleanHostname !== '127.0.0.1' 
                             && !cleanHostname.endsWith('netlify.app')
                             && !cleanHostname.endsWith('netlify.com')
                             && !cleanHostname.endsWith('vercel.app');

        let channel = null;

        const fetchStoreData = async () => {
            try {
                let tiendaData = null;

                if (isPremiumDomain) {
                    const res = await supabase.from('tiendas').select('*').ilike('dominio_personal', cleanHostname).maybeSingle();
                    if (res.error || !res.data) throw new Error("Tienda no encontrada por dominio.");
                    tiendaData = res.data;
                } else {
                    if (!parametroTienda || parametroTienda.trim() === '') throw new Error("Falta el parámetro en el enlace.");
                    let query = supabase.from('tiendas').select('*');
                    if (/^\d+$/.test(parametroTienda)) query = query.eq('id', parseInt(parametroTienda));
                    else query = query.eq('slug', parametroTienda);
                    
                    const res = await query.single();
                    if (res.error || !res.data) throw new Error("La tienda solicitada no existe.");
                    tiendaData = res.data;
                }
                
                setStoreConfig(tiendaData);
                document.title = `Menú | ${tiendaData.nombre}`;

                // Íconos PWA
                document.querySelectorAll("link[rel='icon'], link[rel='apple-touch-icon']").forEach(el => el.remove());
                if (tiendaData.logo_url) {
                    const favicon = document.createElement('link'); favicon.rel = 'icon'; favicon.href = tiendaData.logo_url; document.head.appendChild(favicon);
                    const appleIcon = document.createElement('link'); appleIcon.rel = 'apple-touch-icon'; appleIcon.href = tiendaData.logo_url; document.head.appendChild(appleIcon);
                }

                // Categorías y Productos
                const { data: cats } = await supabase.from('categorias').select('*').eq('tienda_id', tiendaData.id).order('orden', { ascending: true });
                setCategoriesDB(cats || []);
                if (cats && cats.length > 0) setActiveCategory(cats[0].nombre);

                const { data: items } = await supabase.from('menu_items').select('*').eq('tienda_id', tiendaData.id).order('orden', { ascending: true });
                setMenuItemsDB(items || []);

                // Suscripción Realtime (con ID único para evitar bugs en StrictMode)
                const uniqueChannelId = `tienda-channel-${tiendaData.id}-${Math.random().toString(36).substring(2, 9)}`;
                channel = supabase.channel(uniqueChannelId)
                    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'tiendas', filter: `id=eq.${tiendaData.id}` }, payload => {
                        setStoreConfig(prev => ({...prev, abierto: payload.new.abierto}));
                    }).subscribe();

            } catch (err) {
                console.error("Error cargando app:", err);
                setErrorMsg(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchStoreData();
        return () => { if (channel) supabase.removeChannel(channel); };
    }, [parametroTienda]);

    // Local Storage Sincronización
    useEffect(() => { 
        if(storeConfig?.id) {
            localStorage.setItem(`saasClient_${storeConfig.id}`, JSON.stringify({ name: customer.name, phone: customer.phone, paymentMethod: customer.paymentMethod })); 
        }
    }, [customer.name, customer.phone, customer.paymentMethod, storeConfig]);
    
    useEffect(() => { 
        if(storeConfig?.id) {
            const savedClient = localStorage.getItem(`saasClient_${storeConfig.id}`);
            if (savedClient) {
                try { setCustomer(prev => ({ ...prev, ...JSON.parse(savedClient) })); } catch(e){}
            }
            const savedCart = localStorage.getItem(`saasCart_${storeConfig.id}`); 
            if (savedCart) {
                try { setCart(JSON.parse(savedCart)); } catch (e) {} 
            }
        }
    }, [storeConfig?.id]);
    
    useEffect(() => { 
        if(storeConfig?.id) localStorage.setItem(`saasCart_${storeConfig.id}`, JSON.stringify(cart)); 
    }, [cart, storeConfig]);

    // Handlers
    const handleShareMenu = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `MENU DIGITAL DE ${storeConfig.nombre}`,
                    text: `¡Mira el menú de ${storeConfig.nombre} y pidamos algo buenísimo! 🍔🔥`,
                    url: window.location.href
                });
            } catch (err) { console.log('Error compartiendo:', err); }
        } else {
            navigator.clipboard.writeText(window.location.href);
            showNotification("¡Enlace copiado al portapapeles!");
        }
    };

    const handleCustomAnswer = (fieldId, value) => { setCustomer(prev => ({ ...prev, customAnswers: { ...prev.customAnswers, [fieldId]: value } })); };
    const showNotification = useCallback((msg) => { setNotification(msg); setTimeout(() => setNotification(null), 2500); }, []); 
    
    const addToCart = useCallback((product) => { 
        const key = `${product.nombre}-${product.price}-${product.details}-${product.isExtra}-${product.extraAppliedName}`; 
        setCart(prev => { 
            const existingIndex = prev.findIndex(p => p.key === key); 
            if (existingIndex > -1) { 
                const newCart = [...prev]; 
                newCart[existingIndex].qty += 1; 
                return newCart; 
            } 
            return [...prev, { ...product, qty: 1, key }]; 
        }); 
        showNotification(`¡${product.nombre}${product.isExtra ? ` (${product.extraAppliedName})` : ""} agregado!`); 
        setCartAnimate(true); 
        setTimeout(() => setCartAnimate(false), 300);
    }, [showNotification]);
    
    const updateQty = useCallback((key, delta) => { 
        setCart(prev => prev.map(p => p.key === key ? { ...p, qty: Math.max(0, p.qty + delta) } : p).filter(p => p.qty > 0)); 
    }, []);

    const requestLocation = () => {
        if (!navigator.geolocation) return setLocation(prev => ({ ...prev, status: 'error' }));
        if(!window.confirm(`📍 Necesitamos verificar tu zona de entrega.\n\nACEPTAR para continuar.`)) return;
        
        setLocation(prev => ({ ...prev, status: 'loading' }));
        
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const distKm = calculateDistance(storeConfig.latitud, storeConfig.longitud, pos.coords.latitude, pos.coords.longitude);
                
                if (distKm > storeConfig.max_delivery_radius) {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: 'success', allowed: false, shippingCost: 0, zoneName: 'Fuera de rango', distance: distKm });
                    alert(`⚠️ FUERA DE COBERTURA\nEstás a ${distKm.toFixed(2)} km.\nLímite máximo: ${storeConfig.max_delivery_radius} km.`);
                    return;
                }
                
                const matchedTier = storeConfig.delivery_tiers.find(tier => distKm <= tier.maxDistance);
                
                if (matchedTier) {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: 'success', allowed: true, shippingCost: matchedTier.cost, zoneName: matchedTier.name, distance: distKm });
                    showNotification(`✅ Estás en ${matchedTier.name}. Tarifa: $${matchedTier.cost}`);
                } else {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: 'success', allowed: false, shippingCost: 0, zoneName: 'Error de tarifa', distance: distKm });
                    alert(`⚠️ Algo salió mal al calcular la tarifa.`);
                }
            },
            (err) => { 
                setLocation(prev => ({ ...prev, status: 'error' })); 
                showNotification("⚠️ No pudimos obtener tu ubicación."); 
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
        );
    };

    const totals = useMemo(() => { 
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0); 
        const tip = parseFloat(customer.tip) || 0; 
        const shipping = orderType === 'pickup' ? 0 : (location.allowed ? location.shippingCost : 0);
        let baseTotal = subtotal + shipping + tip; 
        const cardFee = customer.paymentMethod === 'tarjeta' ? baseTotal * parseFloat(storeConfig?.porcentaje_tarjeta || 0) : 0; 
        return { subtotal, tip, cardFee, shipping, finalTotal: baseTotal + cardFee }; 
    }, [cart, customer.tip, customer.paymentMethod, orderType, location.allowed, location.shippingCost, storeConfig]);

    const closeWaitModal = () => { 
        setShowWaitModal(false); setIsSubmitting(false); setSubmitText("Confirmar Orden"); setWhatsappFallbackUrl(null); 
    };

    const handleCheckout = async () => {
        if (orderType === 'delivery') {
            if (totals.subtotal < parseFloat(storeConfig.pedido_minimo)) return showNotification(`⚠️ Pedido mínimo: $${storeConfig.pedido_minimo}`);
            if (location.status === 'idle') return showNotification("⚠️ Valida tu ubicación antes de pedir");
            if (!location.allowed) return showNotification("⚠️ Fuera de zona a domicilio");
        }
        
        const telefonoLimpio = customer.phone.replace(/[^0-9]/g, '');
        
        if (!customer.name || !telefonoLimpio || !customer.paymentMethod || cart.length === 0) return showNotification("⚠️ Faltan datos obligatorios");
        if (telefonoLimpio.length !== 10) return showNotification("⚠️ Teléfono debe ser de 10 dígitos");
        
        if (customer.paymentMethod === 'efectivo') {
            const payAmount = parseFloat(customer.paymentAmount) || 0;
            if (payAmount < totals.finalTotal) return showNotification(`⚠️ El pago debe cubrir el total de $${totals.finalTotal.toFixed(2)}`);
        }

        if (storeConfig.upsell_config?.enabled) {
            const targetCat = categoriesDB.find(c => c.nombre === storeConfig.upsell_config.targetCategoryName);
            if (targetCat) {
                const hasTargetItem = cart.some(item => item.categoria_id === targetCat.id);
                if (!hasTargetItem) {
                    setShowDrinkUpsell(true);
                    return; 
                }
            }
        }

        setWhatsappFallbackUrl(null);
        setShowWaitModal(true);
    };

    const confirmAndSend = async () => {
        if (isSubmitting) return; 
        setIsSubmitting(true);
        setSubmitText("🔐 Guardando...");

        const shippingSeguro = orderType === 'pickup' ? 0 : (location.allowed ? location.shippingCost : 0);
        const tipSeguro = parseFloat(customer.tip) || 0;
        let baseTotalSeguro = totals.subtotal + shippingSeguro + tipSeguro;
        const cardFeeSeguro = customer.paymentMethod === 'tarjeta' ? baseTotalSeguro * parseFloat(storeConfig.porcentaje_tarjeta) : 0;
        const finalTotalSeguro = baseTotalSeguro + cardFeeSeguro;
        
        const title = orderType === 'pickup' ? "PEDIDO PICKUP" : "PEDIDO A DOMICILIO";
        let msg = `🔥 *${title}* 🔥\n\n👤 *Cliente:* ${limpiarTexto(customer.name)}\n📱 *Tel:* ${customer.phone}\n`;
        
        Object.keys(customer.customAnswers).forEach(key => {
            const fieldDef = storeConfig.checkout_options.find(f => f.id === key);
            if (fieldDef && customer.customAnswers[key]) msg += `👉 *${fieldDef.label.replace(/[^a-zA-Z0-9 ]/g, '')}:* ${limpiarTexto(customer.customAnswers[key])}\n`;
        });

        msg += `--------------------------------\n`;
        cart.forEach(item => { msg += `✅ *${item.qty}* x *${limpiarTexto(item.nombre)}* ${item.isExtra ? '('+limpiarTexto(item.extraAppliedName)+')' : ''} ${item.details || ''}- $${(item.price * item.qty).toFixed(2)}\n`; });
        if (customer.instructions) msg += `\n📝 *Notas:* ${limpiarTexto(customer.instructions)}`;
        msg += `\n--------------------\n\nSubtotal: $${totals.subtotal.toFixed(2)}\n\n`;
        
        if (orderType === 'delivery') msg += `🛵 Envío: $${shippingSeguro.toFixed(2)} ${location.zoneName ? '('+location.zoneName+')' : ''}\n`;
        else msg += `🛍️ Pickup: Sin costo de envío\n`;
        
        if (tipSeguro > 0) msg += `💸 Propina: *$${tipSeguro.toFixed(2)}*\n\n`;
        
        let pagoInfo = "";
        if (customer.paymentMethod === 'efectivo') {
            const pagoCon = parseFloat(customer.paymentAmount) || 0;
            pagoInfo = `EFECTIVO\n (Con: $${pagoCon}) -> *Cambio*: $${(pagoCon - finalTotalSeguro > 0) ? (pagoCon - finalTotalSeguro).toFixed(2) : '0.00'}`;
        } else {
            pagoInfo = limpiarTexto(customer.paymentMethod).toUpperCase();
        }

        msg += `*💰 TOTAL: $${finalTotalSeguro.toFixed(2)}*\n\n*Pago:* ${pagoInfo}`;
        
        if (orderType === 'delivery' && location.lat && location.lng) {
            msg += `\n\n📍 *DIRECCIÓN DE ENTREGA:*\n https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`;
        }

        const whatsappUrl = `https://wa.me/${storeConfig.telefono_whatsapp}?text=${encodeURIComponent(msg)}`;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        let preOpenedWindow = null;
        
        if (!isMobile) preOpenedWindow = window.open('', '_blank');

        try {
            const insertPromise = supabase.from('pedidos').insert([{ 
                tienda_id: storeConfig.id, cliente_nombre: customer.name, cliente_telefono: customer.phone, tipo_entrega: orderType,
                metodo_pago: customer.paymentMethod, pago_con: customer.paymentMethod === 'efectivo' ? parseFloat(customer.paymentAmount) : null,
                latitud: location.lat, longitud: location.lng, total_subtotal: totals.subtotal, total_envio: shippingSeguro,
                total_comision: cardFeeSeguro, total_propina: tipSeguro, total_final: finalTotalSeguro, detalle_json: cart,
                respuestas_checkout: customer.customAnswers, nota_cliente: customer.instructions, estado: 'pendiente'
            }]);
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 4000));
            await Promise.race([insertPromise, timeoutPromise]);
        } catch(err) {
            console.warn("⚠️ Falló guardado DB, enviando a WP de todos modos.", err);
        }

        setCart([]); localStorage.removeItem(`saasCart_${storeConfig.id}`); setShowCart(false);
        setWhatsappFallbackUrl(whatsappUrl); setSubmitText("Redirigiendo..."); 

        if (!isMobile && preOpenedWindow) preOpenedWindow.location.href = whatsappUrl;
        else window.location.href = whatsappUrl;
    };

    const processedMenu = useMemo(() => {
        let activeCats = categoriesDB;
        if (!searchTerm && activeCategory) activeCats = categoriesDB.filter(c => c.nombre === activeCategory);
        
        return activeCats.map(cat => {
            let catItems = menuItemsDB.filter(item => item.categoria_id === cat.id && item.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
            catItems.sort((a, b) => a.orden - b.orden);
            return { id: cat.id, category: cat.nombre, prepNote: cat.nota_preparacion, items: catItems };
        }).filter(cat => cat.items.length > 0 || searchTerm); 
    }, [categoriesDB, menuItemsDB, searchTerm, activeCategory]);

    const handleCategoryClick = (catName) => {
        setActiveCategory(catName);
        if (categoriesRef.current) {
            const topOffset = categoriesRef.current.getBoundingClientRect().top + window.scrollY - 10;
            window.scrollTo({ top: topOffset, behavior: 'smooth' });
        }
    };

    // Vistas de Estado
    if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900"><InjectedStyles/><div className="loader mb-4"></div><p className="text-gray-400">Cargando restaurante...</p></div>;
    if (errorMsg || !storeConfig) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><InjectedStyles/><div className="bg-red-900/40 border border-red-500 p-6 rounded-2xl max-w-sm w-full text-center"><div className="text-5xl mb-4">🚫</div><h2 className="text-2xl font-black mb-2 text-white uppercase">Error</h2><p className="text-red-300">{errorMsg}</p></div></div>;
    
    if (!storeConfig.abierto) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center animate-fade-in-down">
                <InjectedStyles/>
                <div className="mb-10 relative">
                    <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 rounded-full"></div>
                    <img src={storeConfig.logo_url} className="w-40 h-40 sm:h-48 sm:w-48 rounded-full shadow-2xl logo-electric relative z-10 grayscale object-cover" />
                </div>
                <h1 className="text-3xl font-black text-white mb-4 tracking-widest uppercase">CERRADO</h1>
                <p className="text-gray-400 text-lg">{storeConfig.mensaje_cerrado}</p>
            </div>
        );
    }

    const deliveryColor = storeConfig.color_delivery || '#f97316';
    const pickupColor = storeConfig.color_pickup || '#a855f7';

    // RENDER PRINCIPAL
    return (
        <div className="relative min-h-screen pb-24 text-base transition-colors duration-700 bg-[var(--color-bg)] font-sans text-gray-800 selection:bg-[var(--color-primary)] selection:text-white">
            <InjectedStyles />
            <div className="fixed inset-0 z-0 pointer-events-none transition-colors duration-700" style={{ background: orderType === 'pickup' ? `linear-gradient(to bottom right, ${pickupColor}, #1e1b4b)` : `linear-gradient(to bottom right, #facc15, ${deliveryColor}, #991b1b)` }}>
                <div className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay transition-opacity duration-700" style={{ backgroundImage: `url(${storeConfig.logo_url})` }} />
            </div>

            <header className="bg-black/90 backdrop-blur-md shadow-2xl border-b-4 rounded-b-3xl mx-auto max-w-2xl px-4 py-8 text-center z-50 relative transition-colors duration-700 flex flex-col items-center" style={{ borderColor: orderType === 'pickup' ? pickupColor : deliveryColor }}>
                <img src={storeConfig.logo_url} className="h-40 w-40 sm:h-48 sm:w-48 rounded-full logo-electric mb-4 relative z-10 object-cover" loading="eager" />
                <h1 className="text-3xl font-black text-metal-shine tracking-widest drop-shadow-sm mb-4">{storeConfig.nombre}</h1>
                
                <button onClick={handleShareMenu} className="inline-flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-500/40 text-blue-100 px-6 py-3 rounded-xl font-bold border border-blue-400/30 transition-colors shadow-sm mb-6 w-full max-w-xs">
                    <Icons.ShareNode /> Compartir menú con amigos
                </button>

                <div className="bg-gray-900 p-1.5 rounded-full flex gap-1 border border-gray-700 shadow-inner w-full max-w-sm mb-5">
                    <button onClick={() => setOrderType('delivery')} className={`flex-1 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${orderType === 'delivery' ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white'}`} style={{ backgroundColor: orderType === 'delivery' ? deliveryColor : 'transparent' }}>🛵 Domicilio</button>
                    <button onClick={() => setOrderType('pickup')} className={`flex-1 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${orderType === 'pickup' ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white'}`} style={{ backgroundColor: orderType === 'pickup' ? pickupColor : 'transparent' }}>🛍️ Pickup</button>
                </div>

                {storeConfig.latitud && storeConfig.longitud && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${storeConfig.latitud},${storeConfig.longitud}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold border border-white/20 transition-colors shadow-sm mb-5 w-full max-w-xs">
                        <Icons.Map size={22} /> Ver nuestra ubicación
                    </a>
                )}

                {orderType === 'delivery' && (
                    <div className="bg-orange-500/20 border border-orange-500/50 text-orange-200 px-5 py-3 rounded-xl inline-flex items-center gap-2 text-sm sm:text-base font-bold shadow-sm">
                        <Icons.Clock size={20} className="text-orange-400"/> Tiempo de entrega: 45 a 60 min
                    </div>
                )}
                {orderType === 'pickup' && (
                    <div className="bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-200 px-5 py-3 rounded-xl inline-flex items-center gap-2 text-sm sm:text-base font-bold shadow-sm">
                        <Icons.Clock size={20} className="text-fuchsia-400"/> Pasa a recoger en mostrador
                    </div>
                )}
            </header>

            <main className="max-w-4xl mx-auto p-4 relative z-10 mt-4">
                <div ref={categoriesRef} className="sticky top-0 z-40 -mx-4 pt-4 bg-gradient-to-b from-black/60 to-transparent backdrop-blur-sm mb-4 pb-2">
                    <div className="px-4 pb-4 max-w-lg mx-auto">
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Icons.Search className="text-gray-400" /></div>
                            <input type="text" placeholder="Buscar en el menú..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-gray-900/80 text-white pl-10 pr-4 py-3 rounded-2xl border border-gray-600 focus:border-[var(--color-primary)] outline-none shadow-lg" />
                            {searchTerm && (<button onClick={() => setSearchTerm('')} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400">✕</button>)}
                        </div>
                    </div>
                    
                    {!searchTerm && ( 
                        <div className="flex flex-wrap justify-center gap-2 pb-4 px-4">
                            {categoriesDB.map(cat => ( 
                                <button key={cat.id} onClick={() => handleCategoryClick(cat.nombre)} className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-base transition-all transform active:scale-95 shadow-md ${activeCategory === cat.nombre ? 'bg-[var(--color-primary)] text-white scale-105 border-2 border-orange-300' : 'bg-black/60 text-white border border-white/20 hover:bg-[var(--color-primary)]'}`}>
                                    {cat.nombre}
                                </button> 
                            ))}
                        </div> 
                    )}
                </div>

                {processedMenu.map(cat => (
                    <div key={cat.id} id={`cat-${cat.id}`} className="animate-slide-up min-h-[20vh] mb-12">
                        <h2 className="text-white font-bold text-2xl mb-4 pl-2 border-l-4 drop-shadow-md" style={{ borderColor: orderType === 'pickup' ? pickupColor : deliveryColor }}>{cat.category}</h2>
                        {cat.prepNote && !searchTerm && (
                            <div className="bg-white/90 backdrop-blur-sm border-l-4 p-3 rounded-r-lg mb-4 flex items-center gap-2 text-sm shadow-lg" style={{ borderColor: orderType === 'pickup' ? pickupColor : deliveryColor }}>
                                <Icons.Info className="flex-shrink-0" size={20} style={{ color: orderType === 'pickup' ? pickupColor : deliveryColor }} />
                                <p className="italic text-gray-800 font-medium">{cat.prepNote}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {cat.items.map((item) => (<ProductItem key={item.id} item={item} category={cat} onAdd={addToCart} config={storeConfig} onShowMedia={setActiveMedia} />))}
                        </div>
                    </div>
                ))}

                <div id="cart" className={`transition-all duration-500 transform ${cart.length > 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 h-0 overflow-hidden'}`}>
                    {cart.length > 0 && (
                        <div className="mt-10 bg-white rounded-3xl shadow-2xl overflow-hidden border-t-4" style={{ borderColor: orderType === 'pickup' ? pickupColor : deliveryColor }}>
                            <div className="bg-gray-900 p-6 flex items-center gap-3 text-white">
                                <Icons.Cart size={32} style={{ color: orderType === 'pickup' ? pickupColor : deliveryColor }} />
                                <h2 className="font-bold text-2xl">Tu Pedido</h2>
                            </div>
                            
                            <div className="p-6 max-h-[500px] overflow-y-auto custom-scrollbar space-y-4">
                                {cart.map(item => ( 
                                    <div key={item.key} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <span className="bg-orange-100 text-orange-800 font-bold w-10 h-10 flex items-center justify-center rounded-lg text-lg">{item.qty}</span>
                                            <div className="min-w-0 pr-2">
                                                <p className="font-bold text-gray-900 text-lg leading-tight break-words">{item.nombre}</p>
                                                <p className="text-sm text-gray-600 mt-1 break-words">{item.details}</p>
                                                <p className="text-base text-gray-800 font-bold mt-1">${item.price} {item.isExtra && `(+${item.extraAppliedName})`}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 shrink-0">
                                            <button onClick={() => updateQty(item.key, -1)} className="p-3 bg-white border rounded-lg text-gray-500 hover:text-red-500 active:bg-gray-100"><Icons.Minus size={20} /></button>
                                            <button onClick={() => updateQty(item.key, 1)} className="p-3 text-white rounded-lg shadow-md active:scale-95 transition-all" style={{ backgroundColor: orderType === 'pickup' ? pickupColor : deliveryColor }}><Icons.Plus size={20} /></button>
                                        </div>
                                    </div> 
                                ))}
                            </div>

                            <div className="bg-gray-50 p-6 border-t space-y-6">
                                <h3 className="font-bold text-gray-600 text-base uppercase flex items-center gap-2"><Icons.Map size={24} /> Datos de Entrega</h3>
                                <input type="text" placeholder="Nombre Completo" value={customer.name} onChange={e=>setCustomer({...customer, name:e.target.value})} className="w-full p-4 bg-white border rounded-xl text-lg shadow-sm" />
                                <input type="tel" placeholder="Número de Teléfono" value={customer.phone} onChange={e=>setCustomer({...customer, phone:e.target.value})} className="w-full p-4 bg-white border rounded-xl text-lg shadow-sm" />
                                
                                {storeConfig.checkout_options && storeConfig.checkout_options.map(field => (
                                    <div key={field.id} className="space-y-2">
                                        <p className="text-sm font-bold text-gray-500 uppercase ml-1">{field.label}</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {field.options.map(opt => (
                                                <button key={opt} type="button" onClick={() => handleCustomAnswer(field.id, opt)} className={`py-3 px-2 rounded-xl text-sm font-bold border-2 transition-all active:scale-95 flex items-center justify-center gap-2 ${customer.customAnswers[field.id] === opt ? 'bg-orange-100 border-[var(--color-primary)] text-orange-700 shadow-sm' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{opt}</button>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <textarea className="w-full p-4 bg-white border border-gray-300 rounded-xl text-lg shadow-sm" placeholder="Instrucciones adicionales..." rows="2" value={customer.instructions} onChange={e => setCustomer({...customer, instructions: e.target.value})} />
                                
                                {orderType === 'delivery' && (
                                    <div className="space-y-2">
                                        <Button onClick={requestLocation} variant={location.status === 'success' ? (location.allowed ? 'primary' : 'danger') : 'secondary'} className={`w-full text-base py-4 ${location.status === 'success' && location.allowed ? 'bg-green-600' : ''}`} icon={Icons.Map}>
                                            {location.status === 'loading' ? '📍 Buscando...' : location.status === 'success' ? (location.allowed ? `✅ ${location.zoneName} ($${location.shippingCost})` : `🚫 Fuera de Rango`) : '📍 Calcular Tarifa de Envío'}
                                        </Button>
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                    {['efectivo', 'transferencia', 'tarjeta'].map(m => ( 
                                        <button key={m} onClick={() => setCustomer({...customer, paymentMethod: m})} className={`py-4 rounded-xl text-sm font-bold uppercase border flex flex-col items-center gap-2 ${customer.paymentMethod === m ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'}`}>
                                            {m === 'efectivo' && <Icons.Cash size={28} />} 
                                            {m === 'transferencia' && <Icons.Phone size={28} />} 
                                            {m === 'tarjeta' && <Icons.Card size={28} />} 
                                            {m}
                                        </button> 
                                    ))}
                                </div>
                                
                                {customer.paymentMethod === 'efectivo' && (
                                    <div className="space-y-3 bg-green-50 p-4 rounded-xl border border-green-200">
                                        <p className="text-sm font-bold text-green-800 uppercase ml-1">💵 ¿Con cuánto vas a pagar?</p>
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                            <button type="button" onClick={() => setCustomer({...customer, paymentAmount: totals.finalTotal})} className="whitespace-nowrap px-4 py-2 bg-green-600 text-white font-bold rounded-lg shadow-sm hover:bg-green-700 active:scale-95 transition-all">Exacto</button>
                                            {Array.from(new Set([ Math.ceil((totals.finalTotal + 1) / 50) * 50, Math.ceil((totals.finalTotal + 1) / 100) * 100, Math.ceil((totals.finalTotal + 1) / 200) * 200, Math.ceil((totals.finalTotal + 1) / 500) * 500 ])).sort((a,b)=>a-b).slice(0, 3).map(amount => ( 
                                                <button key={amount} type="button" onClick={() => setCustomer({...customer, paymentAmount: amount})} className="whitespace-nowrap px-4 py-2 bg-white text-green-700 font-bold rounded-lg border border-green-300 shadow-sm hover:bg-green-50 active:scale-95 transition-all">${amount}</button> 
                                            ))}
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-4 top-4 text-green-600 font-bold text-lg">$</span>
                                            <input type="number" placeholder="Otro monto..." value={customer.paymentAmount} onChange={e=>setCustomer({...customer, paymentAmount:e.target.value})} className="w-full p-4 pl-8 border-2 border-green-400 bg-white rounded-xl text-lg font-bold text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-200 transition-all shadow-inner" />
                                        </div>
                                    </div>
                                )}
                                {customer.paymentMethod === 'transferencia' && (
                                    <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                                        <p className="font-bold mb-2">DATOS BANCARIOS:</p>
                                        <p className="font-mono whitespace-pre-wrap select-all">{storeConfig.datos_bancarios}</p>
                                    </div>
                                )}
                                
                                <div className="bg-orange-100/50 p-6 rounded-xl space-y-3 border border-orange-200">
                                    <div className="flex justify-between"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
                                    <div className="flex justify-between"><span>Envío ({orderType === 'pickup' ? 'Pickup' : (location.allowed ? location.zoneName : 'Por validar')})</span><span>${totals.shipping.toFixed(2)}</span></div>
                                    <div className="flex justify-between items-center"><span>Propina</span><input type="number" placeholder="0" value={customer.tip} onChange={e => setCustomer({...customer, tip: e.target.value})} className="w-24 p-1 border rounded text-right" /></div>
                                    {totals.cardFee > 0 && <div className="flex justify-between font-bold text-purple-700"><span>Comisión</span><span>${totals.cardFee.toFixed(2)}</span></div>}
                                    <div className="flex justify-between font-black text-3xl pt-2 border-t border-orange-200"><span>TOTAL</span><span>${totals.finalTotal.toFixed(2)}</span></div>
                                </div>
                                
                                <Button onClick={handleCheckout} disabled={!storeConfig.abierto} className={`w-full py-5 text-xl shadow-xl ${storeConfig.abierto ? 'text-white' : 'bg-gray-400 opacity-60 cursor-not-allowed text-white'}`} icon={storeConfig.abierto ? Icons.Send : Icons.Clock} style={storeConfig.abierto ? { background: orderType === 'pickup' ? pickupColor : deliveryColor } : {}}>
                                    {storeConfig.abierto ? 'ENVIAR PEDIDO' : 'TIENDA CERRADA'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            
            {cart.length > 0 && ( 
                <div className="fixed bottom-6 w-full px-4 sm:px-6 left-1/2 transform -translate-x-1/2 z-50 max-w-4xl mx-auto flex justify-end pointer-events-none">
                    <button onClick={() => { setShowCart(!showCart); if(!showCart) setTimeout(() => document.getElementById('cart')?.scrollIntoView({ behavior: 'smooth' }), 100); else { if(categoriesRef.current){ window.scrollTo({top: categoriesRef.current.offsetTop - 20, behavior: 'smooth'}) } else {window.scrollTo({ top: 0, behavior: 'smooth' });} } }} className="pointer-events-auto bg-gray-900/90 backdrop-blur-xl text-white pl-5 pr-6 py-4 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 flex items-center gap-4 border border-white/10 transition-all duration-300 group">
                        <div className="relative flex items-center">
                            <div className="p-2.5 rounded-full text-white group-hover:rotate-12 transition-transform shadow-[0_0_15px_rgba(var(--color-primary),0.6)]" style={{ backgroundColor: orderType === 'pickup' ? pickupColor : deliveryColor }}><Icons.Cart size={24} /></div>
                            <span className={`absolute -top-3 -right-3 font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-lg transition-all duration-300 ${cartAnimate ? 'bg-yellow-400 text-black scale-125 rotate-12' : 'bg-red-600 text-white scale-100 rotate-0 text-xs'}`}>{cart.reduce((a,c) => a + c.qty, 0)}</span>
                        </div>
                        <div className="border-l-2 pl-3 flex flex-col items-start leading-none" style={{ borderColor: orderType === 'pickup' ? pickupColor : deliveryColor }}>
                            <span className="text-[10px] font-bold text-gray-300 uppercase tracking-wider">Ver pedido</span>
                            <span className="font-black text-lg">${totals.subtotal.toFixed(2)}</span>
                        </div>
                    </button> 
                </div>
            )}
            
            {notification && ( 
                <div className="fixed top-1/2 left-[5%] transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/95 backdrop-blur-md text-white px-8 py-6 rounded-2xl shadow-2xl z-[9999] flex flex-col items-center justify-center gap-4 text-xl font-bold animate-fade-in-down border border-gray-700 text-center min-w-[300px] max-w-[90%]">
                    <div className="bg-green-500 rounded-full p-2 animate-bounce"><Icons.Check size={32} className="text-white" /></div>{notification}
                </div> 
            )}

            {showDrinkUpsell && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in-down">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: orderType === 'pickup' ? pickupColor : deliveryColor }}></div>
                        <div className="text-6xl mb-4">🥤</div>
                        <p className="text-gray-600 text-lg mb-8 leading-relaxed">{storeConfig.upsell_config?.message}</p>
                        <div className="flex flex-col gap-4">
                            <button onClick={() => { setShowDrinkUpsell(false); setShowCart(false); handleCategoryClick(storeConfig.upsell_config?.targetCategoryName); }} className="w-full py-4 rounded-xl text-white font-bold shadow-lg hover:brightness-110 active:scale-95 transition-all text-lg flex justify-center items-center gap-2" style={{ backgroundColor: orderType === 'pickup' ? pickupColor : deliveryColor }}>{storeConfig.upsell_config?.buttonText}</button>
                            <button onClick={() => { setShowDrinkUpsell(false); setShowWaitModal(true); }} className="w-full py-4 rounded-xl border-2 border-gray-200 text-gray-500 font-bold hover:bg-gray-50 active:scale-95 transition-all">Enviar mi pedido sin bebidas</button>
                        </div>
                    </div>
                </div>
            )}
            
            {showWaitModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in-down">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2" style={{ backgroundColor: orderType === 'pickup' ? pickupColor : deliveryColor }}></div>
                        
                        {whatsappFallbackUrl ? (
                            <div className="animate-fade-in-down">
                                <div className="text-6xl mb-4">✅</div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase">¡Pedido Generado!</h3>
                                <p className="text-gray-600 mb-6">Te estamos redirigiendo a WhatsApp para confirmar...</p>
                                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6">
                                    <p className="text-sm text-gray-700 font-bold mb-2">¿No se abrió WhatsApp automáticamente?</p>
                                    <p className="text-xs text-gray-500 mb-4">(Suele pasar si abriste el menú desde Facebook o tu red es lenta)</p>
                                    <a href={whatsappFallbackUrl} target="_blank" onClick={closeWaitModal} className="block w-full py-4 rounded-xl bg-green-500 text-white font-bold shadow-lg shadow-green-500/30 hover:scale-105 active:scale-95 transition-all text-lg">💬 Enviar por WhatsApp</a>
                                </div>
                                <button onClick={closeWaitModal} className="text-gray-400 underline text-sm">Cerrar y Volver al Menú</button>
                            </div>
                        ) : (
                            <>
                                <div className="mx-auto mb-6 relative">
                                    <div className="absolute inset-0 blur-xl opacity-20 rounded-full" style={{ backgroundColor: orderType === 'pickup' ? pickupColor : deliveryColor }}></div>
                                    <img src={storeConfig.logo_url} className="w-32 h-32 rounded-full mx-auto shadow-xl border-4 border-white relative z-10 object-cover" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">¡YA CASI, SOLO CONFIRMA TU PEDIDO POR WHATSAPP!</h3>
                                <p className="text-gray-800 text-lg mb-8 leading-relaxed">
                                    {orderType === 'delivery' ? (
                                        <>🚨 ESTIMADO CLIENTE: 🕗 EL TIEMPO DE ESPERA es de 60 a 80 minutos 🚨<br/><br/><span className="text-sm font-bold text-gray-600 uppercase tracking-widest">¡Le agradecemos su PACIENCIA Y PREFERENCIA! 🙏</span></>
                                    ) : (
                                        <>🚨 ESTIMADO CLIENTE: NOSOTROS LE AVISAREMOS via WhatsApp cuando su pedido esté listo para recoger! 🚨<br/><br/><span className="text-sm font-bold text-gray-400 uppercase tracking-widest">¡Gracias por su PACIENCIA Y PREFERENCIA! 🙏</span></>
                                    )}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button disabled={isSubmitting} onClick={closeWaitModal} className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${isSubmitting ? 'border-gray-200 text-gray-300 cursor-not-allowed' : 'border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-300'}`}>Cancelar</button>
                                    <button disabled={isSubmitting} onClick={confirmAndSend} className={`flex-1 py-4 rounded-xl text-white font-bold shadow-xl transition-all flex justify-center items-center gap-2 ${isSubmitting ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'hover:scale-105 active:scale-95'}`} style={{ backgroundColor: isSubmitting ? undefined : (orderType === 'pickup' ? pickupColor : deliveryColor) }}>{submitText}</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            
            <MediaModal media={activeMedia} onClose={() => setActiveMedia(null)} />
        </div>
    );
}