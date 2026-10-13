// src/hooks/useDeliveryZone.js
import { useState, useCallback } from 'react';
import { calculateDistance } from '../utils/helpers'; // o geoHelpers.js

export const useDeliveryZone = (storeConfig) => {
    // El estado de ubicación que tenías suelto en Menu.jsx ahora vive aquí
    const [location, setLocation] = useState({ 
        lat: null, lng: null, status: 'idle', shippingCost: 0, zoneName: '', distance: 0, allowed: false 
    });

    const requestLocation = useCallback((showNotification) => {
        if (!navigator.geolocation) {
            setLocation(prev => ({ ...prev, status: 'error' }));
            return;
        }

        if(!window.confirm(`📍 ACEPTAR para obtener tu ubicación para la entrega de tu pedido.`)) return;
        
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
                    if(showNotification) showNotification(`✅ Estás en ${matchedTier.name}. Tarifa: $${matchedTier.cost}`);
                } else {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: 'success', allowed: false, shippingCost: 0, zoneName: 'Error de tarifa', distance: distKm });
                    alert(`⚠️ Algo salió mal al obtener la ubicación, porfavor haz tu pedido PICKUP y envía tu ubicación actual por WhatsApp.`);
                }
            },
            (err) => { 
                setLocation(prev => ({ ...prev, status: 'error' })); 
                if(showNotification) showNotification("⚠️ No pudimos obtener tu ubicación.\n Haz tu pedido PICKUP\n Envianos tu ubicación ACTUAL por WhatsApp."); 
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
        );
    }, [storeConfig]);

    return { location, requestLocation, setLocation };
};