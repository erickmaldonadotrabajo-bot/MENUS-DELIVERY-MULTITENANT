import React, { useState, useMemo } from 'react';
import { Icons } from './Icons'; 
import { Button } from './Button'; 
import { useDeliveryZone } from '../../hooks/useDeliveryZone';
import { useCheckout } from '../../hooks/useCheckout';
import { useCart } from '../../hooks/useCart';

export const CartCheckout = ({ 
    cart, updateQty, clearCart, showNotification, setShowCart,
    storeConfig, orderType, categoriesDB, setActiveCategory, pickupColor, deliveryColor 
}) => {
    // ESTADO LOCAL: Esto evita que el menú principal se re-renderice al teclear
    const [customer, setCustomer] = useState({ 
        name: '', phone: '', customAnswers: {}, paymentMethod: '', paymentAmount: '', instructions: '', tip: '' 
    });

    // CONTROLADORES AISLADOS
    const { location, requestLocation } = useDeliveryZone(storeConfig, showNotification);

    // CÁLCULO ESTRICTO DE TOTALES EN TIEMPO REAL
    const totals = useMemo(() => {
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        const shipping = orderType === 'pickup' ? 0 : (location.allowed ? location.shippingCost : 0);
        const tip = parseFloat(customer.tip) || 0;
        const baseTotal = subtotal + shipping + tip;
        const cardFee = customer.paymentMethod === 'tarjeta' ? baseTotal * parseFloat(storeConfig.porcentaje_tarjeta || 0) : 0;
        const finalTotal = baseTotal + cardFee;
        return { subtotal, shipping, tip, cardFee, finalTotal };
    }, [cart, orderType, location, customer.tip, customer.paymentMethod, storeConfig.porcentaje_tarjeta]);

    // MOTOR DE CHECKOUT INYECTADO AQUÍ
    const {
        isSubmitting, submitText, whatsappFallbackUrl,
        showWaitModal, setShowWaitModal, closeWaitModal,
        showDrinkUpsell, setShowDrinkUpsell, handleCheckout, confirmAndSend
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
                
                {/* AQUÍ ESTÁN LOS INPUTS AISLADOS */}
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
                
                {/* LOGICA CONDICIONAL DE PAGOS (Oculta para brevedad, asumo que usas tu mismo código del panel de pagos) */}
                {customer.paymentMethod === 'efectivo' && (
                    <div className="relative mt-4">
                        <span className="absolute left-4 top-4 text-green-600 font-bold text-lg">$</span>
                        <input type="number" placeholder="¿Con cuánto pagas?" value={customer.paymentAmount} onChange={e=>setCustomer({...customer, paymentAmount:e.target.value})} className="w-full p-4 pl-8 border-2 border-green-400 bg-white rounded-xl text-lg font-bold outline-none" />
                    </div>
                )}
                
                <div className="bg-orange-100/50 p-6 rounded-xl space-y-3 border border-orange-200 mt-6">
                    <div className="flex justify-between"><span>Subtotal</span><span>${totals.subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>Envío</span><span>${totals.shipping.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center"><span>Propina</span><input type="number" placeholder="0" value={customer.tip} onChange={e => setCustomer({...customer, tip: e.target.value})} className="w-24 p-1 border rounded text-right" /></div>
                    {totals.cardFee > 0 && <div className="flex justify-between font-bold text-purple-700"><span>Comisión</span><span>${totals.cardFee.toFixed(2)}</span></div>}
                    <div className="flex justify-between font-black text-3xl pt-2 border-t border-orange-200"><span>TOTAL</span><span>${totals.finalTotal.toFixed(2)}</span></div>
                </div>
                
                <Button onClick={handleCheckout} disabled={!storeConfig.abierto} className={`w-full py-5 text-xl shadow-xl ${storeConfig.abierto ? 'text-white' : 'bg-gray-400 opacity-60 cursor-not-allowed'}`} icon={storeConfig.abierto ? Icons.Send : Icons.Clock} style={storeConfig.abierto ? { background: orderType === 'pickup' ? pickupColor : deliveryColor } : {}}>
                    {storeConfig.abierto ? 'ENVIAR PEDIDO' : 'TIENDA CERRADA'}
                </Button>
            </div>

            {/* MODALES TRASLADADOS AQUÍ PARA NO ENSUCIAR MENU.JSX */}
            {showWaitModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in-down">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center relative overflow-hidden">
                        {whatsappFallbackUrl ? (
                            <div>
                                <h3 className="text-2xl font-black mb-2">¡Pedido Generado!</h3>
                                <a href={whatsappFallbackUrl} target="_blank" onClick={closeWaitModal} className="block w-full py-4 rounded-xl bg-green-500 text-white font-bold">💬 Enviar por WhatsApp</a>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xl font-black mb-4">CONFIRMA TU PEDIDO</h3>
                                <button disabled={isSubmitting} onClick={confirmAndSend} className="w-full py-4 rounded-xl text-white font-bold bg-green-600">{submitText}</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};