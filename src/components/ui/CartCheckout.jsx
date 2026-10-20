import React, { useState, useMemo, useEffect } from 'react';
import { Icons } from './Icons'; 
import { Button } from './Button'; 
import { useDeliveryZone } from '../../hooks/useDeliveryZone';
import { useCheckout } from '../../hooks/useCheckout';

export const CartCheckout = ({ 
    cart, updateQty, clearCart, showNotification, setShowCart,
    storeConfig, orderType, categoriesDB, setActiveCategory, pickupColor, deliveryColor 
}) => {
    // INICIALIZACIÓN LOCALSTORAGE (Solo Identidad)
    const [customer, setCustomer] = useState(() => {
        try {
            const saved = localStorage.getItem('menu_cliente_identidad');
            if (saved) {
                const parsed = JSON.parse(saved);
                return { 
                    name: parsed.name || '', 
                    phone: parsed.phone || '', 
                    customAnswers: {}, 
                    paymentMethod: '', 
                    paymentAmount: '', 
                    instructions: '', 
                    tip: '' 
                };
            }
        } catch (e) {
            console.warn("Fallo al leer caché de identidad");
        }
        return { name: '', phone: '', customAnswers: {}, paymentMethod: '', paymentAmount: '', instructions: '', tip: '' };
    });

    // SINCRONIZACIÓN AUTOMÁTICA (Exclusiva para Nombre y Teléfono)
    useEffect(() => {
        if (customer.name || customer.phone) {
            const cacheData = {
                name: customer.name,
                phone: customer.phone
            };
            localStorage.setItem('menu_cliente_identidad', JSON.stringify(cacheData));
        }
    }, [customer.name, customer.phone]);

    const { location, requestLocation } = useDeliveryZone(storeConfig, showNotification);

    const totals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const shipping = orderType === 'pickup' ? 0 : (location.allowed ? location.shippingCost : 0);
        const tip = parseFloat(customer.tip) || 0;
        const baseTotal = subtotal + shipping + tip;
        const cardFee = customer.paymentMethod === 'tarjeta' ? baseTotal * parseFloat(storeConfig.porcentaje_tarjeta || 0) : 0;
        const finalTotal = baseTotal + cardFee;
        return { subtotal, shipping, tip, cardFee, finalTotal };
    }, [cart, orderType, location, customer.tip, customer.paymentMethod, storeConfig.porcentaje_tarjeta]);

    const {
        isSubmitting, submitText, whatsappFallbackUrl,
        showWaitModal, closeWaitModal, handleCheckout, confirmAndSend,
        checkoutError 
    } = useCheckout({
        storeConfig, cart, customer, location, totals, orderType,
        clearCart, showNotification, categoriesDB, setActiveCategory, setShowCart
    });

    const handleCustomAnswer = (fieldId, value) => { 
        setCustomer(prev => ({ ...prev, customAnswers: { ...prev.customAnswers, [fieldId]: value } })); 
    };

    if (cart.length === 0) return null;

    return (
        <div id="cart" className="mt-10 bg-white rounded-3xl shadow-2xl overflow-hidden border-t-4 animate-slide-up" style={{ borderColor: orderType === 'pickup' ? pickupColor : deliveryColor }}>
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
                    <p className="text-base text-gray-800 font-bold mt-1">
                        ${item.price * item.qty}
                        {item.qty > 1 && (
                            <span className="text-xs font-normal text-gray-500 ml-1">
                                (${item.price} c/u)
                            </span>
                        )}
                        {item.isExtra && ` (${item.extraAppliedName})`}
                    </p>

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
                <input type="tel" placeholder="Número de Teléfono (10 dígitos)" value={customer.phone} onChange={e=>setCustomer({...customer, phone:e.target.value})} className="w-full p-4 bg-white border rounded-xl text-lg shadow-sm" />
                
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
                            {location.status === 'loading' ? '📍 Buscando...' : location.status === 'success' ? (location.allowed ? `✅ ${location.zoneName} ($${location.shippingCost})` : `🚫 Lo sentimos, no tenemos cobertura en tu zona.`) : 'Calcular distancia de tu ubicación actual para la entrega'}
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
                    <div className="relative mt-4">
                        <span className="absolute left-4 top-4 text-green-600 font-bold text-lg">$</span>
                        <input type="number" placeholder="¿Con cuánto pagas?" value={customer.paymentAmount} onChange={e=>setCustomer({...customer, paymentAmount:e.target.value})} className="w-full p-4 pl-8 border-2 border-green-400 bg-white rounded-xl text-lg font-bold outline-none" />
                    </div>
                )}
                {customer.paymentMethod === 'transferencia' && (
                    <div className="mt-4 p-5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 shadow-sm">
                        <p className="font-bold mb-2 flex items-center gap-2">🏦 DATOS BANCARIOS:</p>
                        <p className="font-mono whitespace-pre-wrap select-all text-sm">{storeConfig.datos_bancarios || 'Contacta al restaurante para obtener los datos de transferencia.'}</p>
                    </div>
                )}
                
                <div className="bg-orange-100/50 p-6 rounded-xl space-y-3 border border-orange-200 mt-6">
                    <div className="flex justify-between"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Envío</span><span>${totals.shipping.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center"><span>Propina</span><input type="number" placeholder="0" value={customer.tip} onChange={e => setCustomer({...customer, tip: e.target.value})} className="w-24 p-1 border rounded text-right" /></div>
                    {totals.cardFee > 0 && <div className="flex justify-between font-bold text-purple-700"><span>Comisión</span><span>${totals.cardFee.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-black text-3xl pt-2 border-t border-orange-200"><span>TOTAL</span><span>${totals.finalTotal.toFixed(2)}</span></div>
                </div>
                
                {/* ZONA DE ERRORES */}
                {checkoutError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mt-6 mb-2 font-bold text-center text-sm shadow-sm">
                        ⚠️ {checkoutError}
                    </div>
                )}

                {/* BOTÓN CON LÓGICA DE BLOQUEO ESTRICTA */}
                <Button 
                    onClick={handleCheckout} 
                    disabled={
                        !storeConfig.abierto || 
                        isSubmitting || 
                        (orderType === 'delivery' && location.status === 'success' && !location.allowed)
                    } 
                    className={`w-full py-5 text-xl shadow-xl mt-2 ${
                        storeConfig.abierto && !isSubmitting && !(orderType === 'delivery' && location.status === 'success' && !location.allowed) 
                        ? 'text-white' 
                        : 'bg-gray-400 opacity-60 cursor-not-allowed'
                    }`} 
                    icon={storeConfig.abierto ? Icons.Send : Icons.Clock} 
                    style={
                        storeConfig.abierto && !isSubmitting && !(orderType === 'delivery' && location.status === 'success' && !location.allowed) 
                        ? { background: orderType === 'pickup' ? pickupColor : deliveryColor } 
                        : {}
                    }
                >
                    {isSubmitting 
                        ? 'ENVIANDO...' 
                        : !storeConfig.abierto 
                            ? 'TIENDA CERRADA' 
                            : (orderType === 'delivery' && location.status === 'success' && !location.allowed)
                                ? 'FUERA DE ZONA'
                                : 'ENVIAR PEDIDO'
                    }
                </Button>
            </div>

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
                                <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight uppercase">¡YA CASI, SOLO CONFIRMA TU PEDIDO!</h3>
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
        </div>
    );
};