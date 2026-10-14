import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';

// Componentes y Utilidades Propias
import { limpiarTexto, calculateDistance } from '../utils/helpers';
import { useDeliveryZone } from '../hooks/useDeliveryZone';
import { Icons } from '../components/ui/Icons';
import { Button } from '../components/ui/Button';
import { MediaModal } from '../components/ui/MediaModal';
import { DynamicStyles } from '../components/ui/DynamicStyles';
import { CartCheckout } from '../components/ui/CartCheckout';
import { ProductItem } from '../components/ui/ProductItem';

// hooks
import { useCart } from '../hooks/useCart';
import { useStoreData } from '../hooks/useStoreData';
import { useCheckout } from '../hooks/useCheckout';

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function Menu() {
    const [searchParams] = useSearchParams();
    const parametroTienda = searchParams.get('tienda');
    const categoriesRef = useRef(null);

    // 1. CARGA DE DATOS (Tenant)
    const {
        storeConfig,
        categoriesDB,
        isLoading,
        errorMsg,
        activeCategory,
        setActiveCategory,
        searchTerm,
        setSearchTerm,
        processedMenu
    } = useStoreData(parametroTienda);
    
    // 2. ESTADOS DEL CLIENTE Y PEDIDO
    const [orderType, setOrderType] = useState('delivery');
    const [activeMedia, setActiveMedia] = useState(null); 
    const [showCart, setShowCart] = useState(false);

    // 3. INICIALIZACIÓN DEL CARRITO
    const { 
        cart, cartAnimate, 
        notification, totals, 
        addToCart, updateQty, 
        clearCart, showNotification
    } = useCart(storeConfig,orderType);

    // 4. MOTOR DE TRANSACCIONES (Checkout)
    const {
        isSubmitting,
        submitText,
        whatsappFallbackUrl,
        showWaitModal,
        setShowWaitModal,
        closeWaitModal,
        confirmAndSend
    } = useCheckout({
        storeConfig, 
        cart,  
        location, 
        totals, 
        orderType,
        clearCart, 
        showNotification, 
        categoriesDB, 
        setActiveCategory, 
        setShowCart
    });

    const handleShareMenu = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `MENU DIGITAL DE ${storeConfig?.nombre || ''}`,
                    text: `¡Mira el menú de ${storeConfig?.nombre || ''} y pidamos algo buenísimo! 🔥`,
                    url: window.location.href
                });
            } catch (err) { console.log('Error compartiendo:', err); }
        } else {
            navigator.clipboard.writeText(window.location.href);
            showNotification("¡Enlace copiado al portapapeles!");
        }
    };

    const handleCategoryClick = (catName) => {
        setActiveCategory(catName);
        if (categoriesRef.current) {
            const topOffset = categoriesRef.current.getBoundingClientRect().top + window.scrollY - 10;
            window.scrollTo({ top: topOffset, behavior: 'smooth' });
        }
    };

    // Vistas de Estado
    if (isLoading) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900"><DynamicStyles storeConfig={storeConfig} /><div className="loader mb-4"></div><p className="text-gray-400">Cargando restaurante...</p></div>;
    if (errorMsg || !storeConfig) return <div className="min-h-screen bg-gray-900 flex items-center justify-center"><DynamicStyles storeConfig={storeConfig} /><div className="bg-red-900/40 border border-red-500 p-6 rounded-2xl max-w-sm w-full text-center"><div className="text-5xl mb-4">🚫</div><h2 className="text-2xl font-black mb-2 text-white uppercase">Error</h2><p className="text-red-300">{errorMsg}</p></div></div>;
    
    if (!storeConfig.abierto) {
        return (
            <div className="min-h-screen bg-[var(--color-bg)] flex flex-col items-center justify-center p-6 text-center animate-fade-in-down">
                <DynamicStyles storeConfig={storeConfig} />
                <div className="mb-10 relative">
                    <div className="absolute inset-0 bg-red-500 blur-2xl opacity-20 rounded-full"></div>
                    <img src={storeConfig.logo_url} className="w-80 h-80 sm:h-48 sm:w-48 rounded-full shadow-2xl logo-electric relative z-10 grayscale object-cover" />
                </div>
                <h1 className="text-3xl font-black text-white mb-4 tracking-widest uppercase">CERRADO </h1>
                <p className="text-gray-400 text-lg">{storeConfig.mensaje_cerrado}</p>
            </div>
        );
    }

    const deliveryColor = storeConfig.color_delivery || '#f97316';
    const pickupColor = storeConfig.color_pickup || '#a855f7';

    // RENDER PRINCIPAL
    return (
        <div className="relative min-h-screen pb-24 text-base transition-colors duration-700 bg-[var(--color-bg)] font-sans text-gray-800 selection:bg-[var(--color-primary)] selection:text-white">
            <DynamicStyles storeConfig={storeConfig} />
            <div className="fixed inset-0 z-0 pointer-events-none transition-colors duration-700" style={{ background: orderType === 'pickup' ? `linear-gradient(to bottom right, ${pickupColor}, #1e1b4b)` : `linear-gradient(to bottom right, #facc15, ${deliveryColor}, #991b1b)` }}>
                <div className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay transition-opacity duration-700" style={{ backgroundImage: `url(${storeConfig.logo_url})` }} />
            </div>

            <header className="bg-black/90 backdrop-blur-md shadow-2xl border-b-4 rounded-b-3xl mx-auto max-w-2xl px-4 py-8 text-center z-50 relative transition-colors duration-700 flex flex-col items-center" style={{ borderColor: orderType === 'pickup' ? pickupColor : deliveryColor }}>
                <img src={storeConfig.logo_url} className="h-80 w-80 sm:h-48 sm:w-48 rounded-full logo-electric mb-4 relative z-10 object-cover" loading="eager" />
                <h1 className="text-3xl font-black text-metal-shine tracking-widest drop-shadow-sm mb-4">{storeConfig.nombre}</h1>

                <div className="bg-gray-900 p-1.5 rounded-full flex gap-1 border border-gray-700 shadow-inner w-full max-w-sm mb-5">
                    <button onClick={() => setOrderType('delivery')} className={`flex-1 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${orderType === 'delivery' ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white'}`} style={{ backgroundColor: orderType === 'delivery' ? deliveryColor : 'transparent' }}>🛵 A DOMICILIO</button>
                    <button onClick={() => setOrderType('pickup')} className={`flex-1 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${orderType === 'pickup' ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white'}`} style={{ backgroundColor: orderType === 'pickup' ? pickupColor : 'transparent' }}>🛍️ PASAR A RECOGER</button>
                </div>

                {orderType === 'delivery' && (
                    <div className="bg-orange-500/20 border border-orange-500/50 text-orange-200 px-5 py-3 rounded-xl inline-flex items-center gap-2 text-sm sm:text-base font-bold shadow-sm">
                        <Icons.Clock size={20} className="text-orange-400"/> TIEMPO DE ENTREGA: 45 - 60 MINUTOS
                    </div>
                )}
                {orderType === 'pickup' && (
                    <div className="bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-200 px-5 py-3 rounded-xl inline-flex items-center gap-2 text-sm sm:text-base font-bold shadow-sm">
                        <Icons.Clock size={20} className="text-fuchsia-400"/> ¡SIN FILA! PASA A RECOGER TU PEDIDO 
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
                            {cat.items.map((item) => (
                        <ProductItem 
                            key={item.id} 
                            item={item} 
                            onAdd={addToCart} 
                            themeColor={storeConfig.color_primario} 
                            onShowMedia={setActiveMedia} 
                        />
                ))}
                        </div>
                    </div>
                ))}
            </main>

            {/* MODAL DEL CARRITO DE CHECKOUT CON PERSISTENCIA DE ESTADO */}
                <div className={`fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 transition-all duration-300 ${showCart ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                    <div className={`w-full max-w-2xl bg-gray-100 rounded-3xl shadow-2xl relative flex flex-col max-h-[90vh] transition-transform duration-300 ${showCart ? 'scale-100 translate-y-0' : 'scale-95 translate-y-10'}`}>
                        
                        <button 
                            onClick={() => setShowCart(false)} 
                            className="absolute -top-4 -right-2 sm:top-4 sm:right-4 z-[160] bg-white border border-gray-300 text-gray-800 p-2 px-4 rounded-full shadow-xl font-black hover:bg-red-100 hover:text-red-600 active:scale-95 transition-all text-sm"
                        >
                            ✕ CERRAR
                        </button>
                        
                        <div className="flex-1 overflow-y-auto custom-scrollbar rounded-3xl pb-6">
                            <CartCheckout 
                                cart={cart}
                                updateQty={updateQty}
                                clearCart={clearCart}
                                showNotification={showNotification}
                                setShowCart={setShowCart}
                                storeConfig={storeConfig}
                                orderType={orderType}
                                categoriesDB={categoriesDB}
                                setActiveCategory={setActiveCategory}
                                pickupColor={pickupColor}
                                deliveryColor={deliveryColor}
                            />
                        </div>
                    </div>
                </div>
            
            {cart.length > 0 && ( 
                <div className="fixed bottom-6 w-full px-4 sm:px-6 left-1/2 transform -translate-x-1/2 z-50 max-w-4xl mx-auto flex justify-end pointer-events-none">
                    <button onClick={() => setShowCart(true)} className="pointer-events-auto bg-gray-900/90 backdrop-blur-xl text-white pl-5 pr-6 py-4 rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 flex items-center gap-4 border border-white/10 transition-all duration-300 group">
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
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/95 backdrop-blur-md text-white px-8 py-6 rounded-2xl shadow-2xl z-[9999] flex flex-col items-center justify-center gap-4 text-xl font-bold animate-fade-in-down border border-gray-700 text-center min-w-[300px] w-[90%] max-w-md">
                    <div className="bg-green-500 rounded-full p-2 animate-bounce">
                        <Icons.Check size={32} className="text-white" />
                    </div>
                    {notification}
                </div> 
            )} 

            <MediaModal media={activeMedia} onClose={() => setActiveMedia(null)} />
        </div>
    );
}