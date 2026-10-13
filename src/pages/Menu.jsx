import React, { useState, useEffect, useMemo, useCallback, memo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';

// Componentes y Utilidades Propias
import { limpiarTexto, calculateDistance } from '../utils/helpers';
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
import { useDeliveryZone } from '../hooks/useDeliveryZone';

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export default function Menu() {
    const [searchParams] = useSearchParams();
    const parametroTienda = searchParams.get('tienda');
    const categoriesRef = useRef(null);

    // 1. CARGA DE DATOS (Tenant) - Reemplaza los useState duplicados
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
    
    // 2. ESTADOS DEL CLIENTE Y PEDIDO (Deben existir antes de usar useCart)
    const [orderType, setOrderType] = useState('delivery');
    const [activeMedia, setActiveMedia] = useState(null); 
    // Estados UI adicionales

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
        setShowWaitModal, // Lo necesitamos para cerrar modales desde la UI
        closeWaitModal,
        showDrinkUpsell,
        setShowDrinkUpsell,
        handleCheckout,
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
    // 4. FUNCIÓN FALTANTE RESTAURADA
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

    const handleCustomAnswer = (fieldId, value) => { setCustomer(prev => ({ ...prev, customAnswers: { ...prev.customAnswers, [fieldId]: value } })); };
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
                    <img src={storeConfig.logo_url} className="w-40 h-40 sm:h-48 sm:w-48 rounded-full shadow-2xl logo-electric relative z-10 grayscale object-cover" />
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
                <img src={storeConfig.logo_url} className="h-40 w-40 sm:h-48 sm:w-48 rounded-full logo-electric mb-4 relative z-10 object-cover" loading="eager" />
                <h1 className="text-3xl font-black text-metal-shine tracking-widest drop-shadow-sm mb-4">{storeConfig.nombre}</h1>
                
                <button onClick={handleShareMenu} className="inline-flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-500/40 text-blue-100 px-6 py-3 rounded-xl font-bold border border-blue-400/30 transition-colors shadow-sm mb-6 w-full max-w-xs">
                    <Icons.ShareNode /> COMPARTIR MENÚ
                </button>

                <div className="bg-gray-900 p-1.5 rounded-full flex gap-1 border border-gray-700 shadow-inner w-full max-w-sm mb-5">
                    <button onClick={() => setOrderType('delivery')} className={`flex-1 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${orderType === 'delivery' ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white'}`} style={{ backgroundColor: orderType === 'delivery' ? deliveryColor : 'transparent' }}>🛵 A DOMICILIO</button>
                    <button onClick={() => setOrderType('pickup')} className={`flex-1 py-2.5 rounded-full font-bold text-sm sm:text-base transition-all duration-300 ${orderType === 'pickup' ? 'text-white shadow-lg' : 'text-gray-400 hover:text-white'}`} style={{ backgroundColor: orderType === 'pickup' ? pickupColor : 'transparent' }}>🛍️ PASAR A RECOGER</button>
                </div>

                {storeConfig.latitud && storeConfig.longitud && (
                    <a href={`https://www.google.com/maps/search/?api=1&query=${storeConfig.latitud},${storeConfig.longitud}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-bold border border-green/20 transition-colors shadow-sm mb-5 w-full max-w-xs">
                        <Icons.Map size={22} /> VER NUESTRA UBICACIÓN
                    </a>
                )}

                {orderType === 'delivery' && (
                    <div className="bg-orange-500/20 border border-orange-500/50 text-orange-200 px-5 py-3 rounded-xl inline-flex items-center gap-2 text-sm sm:text-base font-bold shadow-sm">
                        <Icons.Clock size={20} className="text-orange-400"/> TIEMPO DE ENTREGA: 45 - 60 MINUTOS
                    </div>
                )}
                {orderType === 'pickup' && (
                    <div className="bg-fuchsia-500/20 border border-fuchsia-500/50 text-fuchsia-200 px-5 py-3 rounded-xl inline-flex items-center gap-2 text-sm sm:text-base font-bold shadow-sm">
                        <Icons.Clock size={20} className="text-fuchsia-400"/> Pasa a recoger tu pedido 
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
                                <h3 className="font-bold text-gray-600 text-base uppercase flex items-center gap-2"><Icons.Map size={28} /> Datos de Entrega</h3>
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
                                        <Button onClick={() => requestLocation(showNotification)} variant={location.status === 'success' ? (location.allowed ? 'primary' : 'danger') : 'secondary'} className={`w-full text-base py-4 ${location.status === 'success' && location.allowed ? 'bg-green-600' : ''}`} icon={Icons.Map}>
                                            {location.status === 'loading' ? '📍 Buscando...' : location.status === 'success' ? (location.allowed ? `✅ ${location.zoneName} ($${location.shippingCost})` : `🚫 Tu ubicación está fuera de cobertura, pero puedes pedir PICKUP`) : '📍 Clic para obtener tu ubicación de entrega \n (Tu Ubicación Actual) \n Máximo 2km'}
                                        </Button>
                                    </div>
                                )}

                                <div className="grid grid-cols-3 gap-4">
                                    {['efectivo', 'transferencia', 'tarjeta'].map(m => ( 
                                        <button key={m} onClick={() => setCustomer({...customer, paymentMethod: m})} className={`py-4 rounded-xl text-sm font-bold uppercase border flex flex-col items-center gap-2 ${customer.paymentMethod === m ? 'bg-gray-800 text-white' : 'bg-white text-gray-600'}`}>
                                            {m === 'efectivo' && <Icons.Cash size={30} />} 
                                            {m === 'transferencia' && <Icons.Phone size={30} />} 
                                            {m === 'tarjeta' && <Icons.Card size={30} />} 
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
                <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-900/95 backdrop-blur-md text-white px-8 py-6 rounded-2xl shadow-2xl z-[9999] flex flex-col items-center justify-center gap-4 text-xl font-bold animate-fade-in-down border border-gray-700 text-center min-w-[300px] w-[90%] max-w-md">
                    <div className="bg-green-500 rounded-full p-2 animate-bounce">
                        <Icons.Check size={32} className="text-white" />
                    </div>
                    {notification}
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
                                <p className="text-gray-600 mb-6">Te estamos redirigiendo a WhatsApp para confirmar tu pedido...</p>
                                <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl mb-6">
                                    <p className="text-sm text-gray-700 font-bold mb-2">¿No se abrió WhatsApp automáticamente?</p>
                                    <p className="text-xs text-gray-500 mb-4">(Suele pasar si abriste el menú desde Facebook o la red es lenta)</p>
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