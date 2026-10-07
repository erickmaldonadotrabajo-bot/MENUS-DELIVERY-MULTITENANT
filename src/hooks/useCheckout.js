import { useState } from 'react';
import { supabase } from '../supabase';
import { limpiarTexto } from '../utils/helpers';

export const useCheckout = ({
    storeConfig, cart, customer, location, totals, orderType,
    clearCart, showNotification, categoriesDB, setActiveCategory, setShowCart
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitText, setSubmitText] = useState("Confirmar Orden");
    const [whatsappFallbackUrl, setWhatsappFallbackUrl] = useState(null);
    const [showWaitModal, setShowWaitModal] = useState(false);
    const [showDrinkUpsell, setShowDrinkUpsell] = useState(false);

    const closeWaitModal = () => { 
        setShowWaitModal(false); 
        setIsSubmitting(false); 
        setSubmitText("Confirmar Orden"); 
        setWhatsappFallbackUrl(null); 
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
        setSubmitText("Generando pedido...");

        // 1. CÁLCULO DE TOTALES
        const shippingSeguro = orderType === 'pickup' ? 0 : (location.allowed ? location.shippingCost : 0);
        const tipSeguro = parseFloat(customer.tip) || 0;
        let baseTotalSeguro = totals.subtotal + shippingSeguro + tipSeguro;
        const cardFeeSeguro = customer.paymentMethod === 'tarjeta' ? baseTotalSeguro * parseFloat(storeConfig.porcentaje_tarjeta) : 0;
        const finalTotalSeguro = baseTotalSeguro + cardFeeSeguro;

        // 2. Refactorización del constructor de la orden
        const title = orderType === 'pickup' ? "PEDIDO PICKUP" : "PEDIDO A DOMICILIO";

        // BLINDAJE: El teléfono del cliente solo debe contener números (máximo 15 dígitos)
        const safePhone = customer.phone ? customer.phone.replace(/\D/g, '').substring(0, 15) : "N/D";

        let msg = `🔥 *${title}* 🔥\n\n👤 *Cliente:* ${limpiarTexto(customer.name, 50)}\n📱 *Tel:* ${safePhone}\n`;

        if (customer.customAnswers) {
            Object.keys(customer.customAnswers).forEach(key => {
        const fieldDef = storeConfig.checkout_options?.find(f => f.id === key);
        if (fieldDef && customer.customAnswers[key]) {
            msg += `👉 *${limpiarTexto(fieldDef.label, 50)}:* ${limpiarTexto(customer.customAnswers[key], 100)}\n`;
        }
            });
        }

        msg += `--------------------------------\n`;
        cart.forEach(item => { 
        // BLINDAJE: Aplicamos sanitización a detalles que olvidaste proteger
        const detallesSeguros = item.details ? ` ${limpiarTexto(item.details, 100)}` : '';
    const extraSeguro = item.isExtra ? ` (${limpiarTexto(item.extraAppliedName, 50)})` : '';
    
    msg += `✅ *${item.qty}* x *${limpiarTexto(item.nombre, 100)}*${extraSeguro}${detallesSeguros} - $${(item.price * item.qty).toFixed(2)}\n`; 
});

if (customer.instructions) {
    msg += `\n📝 *Notas:* ${limpiarTexto(customer.instructions, 200)}`;
}

msg += `\n--------------------\n\nSubtotal: $${totals.subtotal.toFixed(2)}\n\n`;

if (orderType === 'delivery') {
    const zoneSafe = location.zoneName ? ` (${limpiarTexto(location.zoneName, 50)})` : '';
    msg += `🛵 Envío: $${shippingSeguro.toFixed(2)}${zoneSafe}\n`;
} else {
    msg += `🛍️ Pickup: Sin costo de envío\n`;
}

if (tipSeguro > 0) msg += `💸 Propina: *$${tipSeguro.toFixed(2)}*\n\n`;

let pagoInfo = "";
if (customer.paymentMethod === 'efectivo') {
    const pagoCon = parseFloat(customer.paymentAmount) || 0;
    const cambio = (pagoCon - finalTotalSeguro > 0) ? (pagoCon - finalTotalSeguro).toFixed(2) : '0.00';
    pagoInfo = `EFECTIVO\n (Con: $${pagoCon.toFixed(2)}) -> *Cambio*: $${cambio}`;
        } else {
            pagoInfo = limpiarTexto(customer.paymentMethod, 30).toUpperCase();
        }

        msg += `*💰 TOTAL: $${finalTotalSeguro.toFixed(2)}*\n\n*Pago:* ${pagoInfo}`;

        // BLINDAJE: Forzar latitud y longitud a valores numéricos (float) evita inyección en la URL de Maps
        if (orderType === 'delivery' && location.lat && location.lng) {
            msg += `\n\n📍 *DIRECCIÓN DE ENTREGA:*\n https://www.google.com/maps/search/?api=1&query=${parseFloat(location.lat)},${parseFloat(location.lng)}`;
        }

        // CORRECCIÓN CRÍTICA Y BLINDAJE DE URL: 
        // 1. Limpiamos el teléfono del local para asegurar formato internacional.
        // 2. Corregimos el dominio roto a 'wa.me'.
        const adminPhone = storeConfig.telefono_whatsapp ? storeConfig.telefono_whatsapp.replace(/\D/g, '') : '';
        const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;

        // 3. LOGICA DE VENTANA PARA EVITAR BLOQUEO DE POPUPS
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        let preOpenedWindow = null;
        if (!isMobile) preOpenedWindow = window.open('', '_blank');

        // 4. OPTIMIZACIÓN: Solo escribimos en la DB si el cliente paga el Panel Admin
        if (storeConfig.tiene_panel_admin) {
            try {
                setSubmitText("🔐 Guardando...");

                // BLINDAJE: Sanitización profunda de arrays y objetos anidados
                const carritoSeguro = cart.map(item => ({
                    ...item,
                    nombre: limpiarTexto(item.nombre, 100),
                    details: item.details ? limpiarTexto(item.details, 100) : '',
                    extraAppliedName: item.extraAppliedName ? limpiarTexto(item.extraAppliedName, 50) : ''
                }));

                const respuestasSeguras = {};
                if (customer.customAnswers) {
                    Object.keys(customer.customAnswers).forEach(key => {
                        respuestasSeguras[key] = limpiarTexto(customer.customAnswers[key], 100);
                    });
                }

                const telefonoSeguro = customer.phone ? customer.phone.replace(/\D/g, '').substring(0, 15) : null;

                // BLINDAJE: Construcción del Payload final seguro
                const payloadSeguro = { 
                    tienda_id: storeConfig.id, 
                    cliente_nombre: limpiarTexto(customer.name, 50), 
                    cliente_telefono: telefonoSeguro, 
                    tipo_entrega: orderType,
                    metodo_pago: limpiarTexto(customer.paymentMethod, 30), 
                    pago_con: customer.paymentMethod === 'efectivo' ? parseFloat(customer.paymentAmount) : null,
                    latitud: location.lat ? parseFloat(location.lat) : null, 
                    longitud: location.lng ? parseFloat(location.lng) : null, 
                    total_subtotal: parseFloat(totals.subtotal), 
                    total_envio: parseFloat(shippingSeguro),
                    total_comision: parseFloat(cardFeeSeguro), 
                    total_propina: parseFloat(tipSeguro), 
                    total_final: parseFloat(finalTotalSeguro), 
                    detalle_json: carritoSeguro,
                    respuestas_checkout: respuestasSeguras, 
                    nota_cliente: limpiarTexto(customer.instructions, 150), 
                    estado: 'pendiente'
                };

                const insertPromise = supabase.from('pedidos').insert([payloadSeguro]);
                
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 4000));
                await Promise.race([insertPromise, timeoutPromise]);
            } catch(err) {
                console.warn("⚠️ Falló guardado DB, enviando a WP de todos modos.", err);
            }
        }

        // 5. REDIRECCIÓN A WHATSAPP Y LIMPIEZA
        clearCart(); 
        setShowCart(false);
        setWhatsappFallbackUrl(whatsappUrl); 
        setSubmitText("Redirigiendo..."); 

        if (!isMobile && preOpenedWindow) preOpenedWindow.location.href = whatsappUrl;
        else window.location.href = whatsappUrl;
    };

    return {
        isSubmitting,
        submitText,
        whatsappFallbackUrl,
        showWaitModal,
        setShowWaitModal,
        closeWaitModal,
        showDrinkUpsell,
        setShowDrinkUpsell,
        handleCheckout,
        confirmAndSend
    };
};