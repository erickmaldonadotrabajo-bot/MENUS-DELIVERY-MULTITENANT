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
    const [checkoutError, setCheckoutError] = useState(null);

    const closeWaitModal = () => { 
        setShowWaitModal(false); 
        setIsSubmitting(false); 
        setSubmitText("Confirmar Orden"); 
        setWhatsappFallbackUrl(null); 
        setCheckoutError(null);
    };

    const handleCheckout = async () => {
        setCheckoutError(null);

        if (orderType === 'delivery') {
            if (totals.subtotal < parseFloat(storeConfig.pedido_minimo)) return setCheckoutError(`Pedido mínimo: $${storeConfig.pedido_minimo}`);
            if (location.status === 'idle') return setCheckoutError("Calcula la tarifa de envío antes de pedir.");
            if (location.status === 'success' && !location.allowed) return setCheckoutError("Tu ubicación está fuera de nuestra zona de entrega.");
        }
        
        const telefonoLimpio = customer.phone ? customer.phone.replace(/[^0-9]/g, '') : '';
        
        if (!customer.name || !telefonoLimpio || !customer.paymentMethod || cart.length === 0) return setCheckoutError("Faltan datos obligatorios (Nombre, Teléfono o Método de Pago).");
        if (telefonoLimpio.length !== 10) return setCheckoutError("El número de teléfono debe ser exactamente de 10 dígitos.");
        
        if (customer.paymentMethod === 'efectivo') {
            const payAmount = parseFloat(customer.paymentAmount) || 0;
            if (payAmount < totals.finalTotal) return setCheckoutError(`El pago en efectivo debe cubrir el total de $${totals.finalTotal.toFixed(2)}`);
        }

        setWhatsappFallbackUrl(null);
        setShowWaitModal(true);
    };

    const confirmAndSend = async () => {
        if (isSubmitting) return; 
        
        // 1. RATE LIMITING FRONTAL (Protección contra Spam y Doble Clic)
        const ultimoPedido = localStorage.getItem('last_order_time');
        if (ultimoPedido && (Date.now() - parseInt(ultimoPedido)) < 60000) { 
            setCheckoutError("Por favor, espera un minuto antes de enviar otro pedido.");
            setShowWaitModal(false);
            return;
        }

        setIsSubmitting(true);
        setSubmitText("Generando pedido...");
        setCheckoutError(null);

        const shippingSeguro = orderType === 'pickup' ? 0 : (location.allowed ? location.shippingCost : 0);
        const tipSeguro = parseFloat(customer.tip) || 0;
        let baseTotalSeguro = totals.subtotal + shippingSeguro + tipSeguro;
        const cardFeeSeguro = customer.paymentMethod === 'tarjeta' ? baseTotalSeguro * parseFloat(storeConfig.porcentaje_tarjeta) : 0;
        const finalTotalSeguro = baseTotalSeguro + cardFeeSeguro;

        const title = orderType === 'pickup' ? "PEDIDO PICKUP" : "PEDIDO A DOMICILIO";
        const safePhone = customer.phone ? customer.phone.replace(/\D/g, '').substring(0, 15) : "N/D";

        let msg = `🔥 *${title}*\n\n👤 *Cliente:* ${limpiarTexto(customer.name, 50)}\n📱 *Tel:* ${safePhone}\n`;

        if (customer.customAnswers) {
            Object.keys(customer.customAnswers).forEach(key => {
                const fieldDef = storeConfig.checkout_options?.find(f => f.id === key);
                if (fieldDef && customer.customAnswers[key]) {
                    msg += `👉 *${limpiarTexto(fieldDef.label, 50)}:* ${limpiarTexto(customer.customAnswers[key], 100)}\n`;
                }
            });
        }

        msg += `---------------------\n`;
        cart.forEach(item => { 
            const detallesSeguros = item.details ? ` ${limpiarTexto(item.details, 100)}` : '';
            const extraSeguro = item.isExtra ? ` (${limpiarTexto(item.extraAppliedName, 50)})` : '';
            
            msg += `✅ *${item.qty}x* *${limpiarTexto(item.nombre, 100)}*${extraSeguro}${detallesSeguros} $${(item.price * item.qty).toFixed(2)}\n`; 
        });

        if (customer.instructions) {
            msg += `\n📝 *Notas:* ${limpiarTexto(customer.instructions, 200)}`;
        }

        msg += `\n--------------------\n\nSubtotal: $${totals.subtotal.toFixed(2)}\n\n`;

        if (orderType === 'delivery') {
            const zoneSafe = location.zoneName ? ` (${limpiarTexto(location.zoneName, 50)})` : '';
            msg += `🛵 Envío: $${shippingSeguro.toFixed(2)}${zoneSafe}\n\n`;
        } else {
            msg += `🛍️ Pickup: Sin costo de envío\n\n`;
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

        if (orderType === 'delivery' && location.lat && location.lng) {
            msg += `\n\n📍 *DIRECCIÓN DE ENTREGA:*\n https://www.google.com/maps/search/?api=1&query=${parseFloat(location.lat)},${parseFloat(location.lng)}`;
        }

        const adminPhone = storeConfig.telefono_whatsapp ? storeConfig.telefono_whatsapp.replace(/\D/g, '') : '';
        const whatsappUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(msg)}`;

        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        let preOpenedWindow = null;
        if (!isMobile) preOpenedWindow = window.open('', '_blank');

        if (storeConfig.tiene_panel_admin) {
            try {
                setSubmitText("🔐 Guardando...");

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

                const payloadSeguro = { 
                    tienda_id: storeConfig.id, 
                    cliente_nombre: limpiarTexto(customer.name, 50), 
                    cliente_telefono: safePhone, 
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

                // 2. INSERCIÓN CON PROTECCIÓN DE TIMEOUT Y MANEJO DE ERRORES ESTRICTO
                const insertPromise = supabase.from('pedidos').insert([payloadSeguro]);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT_DB')), 4000));
                
                const response = await Promise.race([insertPromise, timeoutPromise]);
                
                if (response && response.error) {
                    throw new Error(response.error.message);
                }

                // Si llegamos aquí, fue exitoso. Guardamos el timestamp.
                localStorage.setItem('last_order_time', Date.now().toString());

            } catch(err) {
                console.error("⚠️ Falló guardado DB crítico:", err);
                
                // 3. PROPAGACIÓN DEL ERROR A LA UI
                setCheckoutError(
                    err.message === 'TIMEOUT_DB' 
                    ? "Tu conexión es inestable. No pudimos enviar el pedido a la cocina. Intenta de nuevo." 
                    : "Error al enviar el pedido. Por favor intenta de nuevo."
                );
                
                setIsSubmitting(false);
                setSubmitText("Confirmar Orden");
                
                // Cerramos la ventana emergente si se abrió en Desktop para evitar ventanas huérfanas
                if (preOpenedWindow) preOpenedWindow.close();
                
                return; // Detiene la ejecución aquí. NO borra el carrito ni redirige a WhatsApp.
            }
        }

        // 4. FLUJO DE ÉXITO (Solo llega aquí si el try/catch no lanzó error, o si no usa panel admin)
        clearCart(); 
        setShowCart(false);
        setWhatsappFallbackUrl(whatsappUrl); 
        setSubmitText("Redirigiendo..."); 

        if (!isMobile && preOpenedWindow) {
            preOpenedWindow.location.href = whatsappUrl;
        } else {
            window.location.href = whatsappUrl;
        }
    };

    return {
        isSubmitting,
        submitText,
        whatsappFallbackUrl,
        showWaitModal,
        setShowWaitModal,
        closeWaitModal,
        handleCheckout,
        confirmAndSend,
        checkoutError 
    };
};
