import { useState, useEffect, useCallback, useMemo } from 'react';

export const useCart = (storeConfig, customer, orderType, location) => {
    // 1. Estado inicial del carrito
    const [cart, setCart] = useState([]);
    const [cartAnimate, setCartAnimate] = useState(false);
    const [notification, setNotification] = useState(null);

    // 2. Utilidad interna para notificaciones
    const showNotification = useCallback((msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 2500);
    }, []);

    // 3. Sincronización con localStorage al inicio
    useEffect(() => { 
        if(storeConfig?.id) {
            const savedCart = localStorage.getItem(`saasCart_${storeConfig.id}`); 
            if (savedCart) {
                try { setCart(JSON.parse(savedCart)); } catch (e) { console.error("Error parsing cart", e); } 
            }
        }
    }, [storeConfig?.id]);
    
    // 4. Guardar en localStorage cuando cambie el carrito
    useEffect(() => { 
        if(storeConfig?.id) {
            localStorage.setItem(`saasCart_${storeConfig.id}`, JSON.stringify(cart)); 
        }
    }, [cart, storeConfig?.id]);

    // 5. Handlers
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

    const clearCart = useCallback(() => {
        setCart([]);
        if(storeConfig?.id) localStorage.removeItem(`saasCart_${storeConfig.id}`);
    }, [storeConfig?.id]);

    // 6. Cálculo de totales memorizado
    const totals = useMemo(() => { 
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0); 
        const tip = parseFloat(customer?.tip) || 0; 
        const shipping = orderType === 'pickup' ? 0 : (location?.allowed ? location.shippingCost : 0);
        let baseTotal = subtotal + shipping + tip; 
        const cardFee = customer?.paymentMethod === 'tarjeta' ? baseTotal * parseFloat(storeConfig?.porcentaje_tarjeta || 0) : 0; 
        return { subtotal, tip, cardFee, shipping, finalTotal: baseTotal + cardFee }; 
    }, [cart, customer?.tip, customer?.paymentMethod, orderType, location?.allowed, location?.shippingCost, storeConfig?.porcentaje_tarjeta]);

    // Retornamos todo lo que el componente Menu va a necesitar
    return {
        cart,
        cartAnimate,
        notification,
        totals,
        addToCart,
        updateQty,
        clearCart,
        showNotification
    };
};