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
        
        // 2. CONSTRUCCIÓN DEL MENSAJE DE WHATSAPP
        const title = orderType === 'pickup' ? "PEDIDO PICKUP" : "PEDIDO A DOMICILIO";
        let msg = `🔥 *${title}* 🔥\n\n👤 *Cliente:* ${limpiarTexto(customer.name)}\n📱 *Tel:* ${customer.phone}\n`;
        
        if (customer.customAnswers) {
            Object.keys(customer.customAnswers).forEach(key => {
                const fieldDef = storeConfig.checkout_options?.find(f => f.id === key);
                if (fieldDef && customer.customAnswers[key]) msg += `👉 *${fieldDef.label.replace(/[^a-zA-Z0-9 ]/g, '')}:* ${limpiarTexto(customer.customAnswers[key])}\n`;
            });
        }

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
        
        // 3. LOGICA DE VENTANA PARA EVITAR BLOQUEO DE POPUPS
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        let preOpenedWindow = null;
        if (!isMobile) preOpenedWindow = window.open('', '_blank');

        // 4. OPTIMIZACIÓN: Solo escribimos en la DB si el cliente paga el Panel Admin
        if (storeConfig.tiene_panel_admin) {
            try {
                setSubmitText("🔐 Guardando...");
                const insertPromise = supabase.from('pedidos').insert([{ 
                    tienda_id: storeConfig.id, 
                    cliente_nombre: customer.name, 
                    cliente_telefono: customer.phone, 
                    tipo_entrega: orderType,
                    metodo_pago: customer.paymentMethod, 
                    pago_con: customer.paymentMethod === 'efectivo' ? parseFloat(customer.paymentAmount) : null,
                    latitud: location.lat, 
                    longitud: location.lng, 
                    total_subtotal: totals.subtotal, 
                    total_envio: shippingSeguro,
                    total_comision: cardFeeSeguro, 
                    total_propina: tipSeguro, 
                    total_final: finalTotalSeguro, 
                    detalle_json: cart,
                    respuestas_checkout: customer.customAnswers, 
                    nota_cliente: customer.instructions, 
                    estado: 'pendiente'
                }]);
                
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