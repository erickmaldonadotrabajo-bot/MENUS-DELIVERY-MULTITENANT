import { useState } from 'react';
import { calculateDistance } from '../utils/helpers';

export const useDeliveryZone = (storeConfig, showNotification) => {
    const [location, setLocation] = useState({ 
        lat: null, lng: null, status: 'idle', shippingCost: 0, zoneName: '', distance: 0, allowed: false 
    });

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocation(prev => ({ ...prev, status: 'error' }));
            showNotification("⚠️ Tu navegador no soporta geolocalización.");
            return;
        }

        setLocation(prev => ({ ...prev, status: 'loading' }));

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const distKm = calculateDistance(storeConfig.latitud, storeConfig.longitud, pos.coords.latitude, pos.coords.longitude);
                
                if (distKm > storeConfig.max_delivery_radius) {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: 'success', allowed: false, shippingCost: 0, zoneName: 'Fuera de rango', distance: distKm });
                    showNotification(`🚫 FUERA DE COBERTURA: Estás a ${distKm.toFixed(2)} km. Límite: ${storeConfig.max_delivery_radius} km.`);
                    return;
                }
                
                const matchedTier = storeConfig.delivery_tiers.find(tier => distKm <= tier.maxDistance);
                
                if (matchedTier) {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: 'success', allowed: true, shippingCost: matchedTier.cost, zoneName: matchedTier.name, distance: distKm });
                    showNotification(`✅ Zona confirmada: ${matchedTier.name}. Envío: $${matchedTier.cost}`);
                } else {
                    setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, status: 'success', allowed: false, shippingCost: 0, zoneName: 'Error de tarifa', distance: distKm });
                    showNotification(`⚠️ Algo salió mal al calcular la tarifa.`);
                }
            },
            (err) => { 
                setLocation(prev => ({ ...prev, status: 'error' })); 
                showNotification("⚠️ Permiso de ubicación denegado o no disponible."); 
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 }
        );
    };

    return { location, setLocation, requestLocation };
};