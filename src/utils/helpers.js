import React, { memo } from 'react';

export const limpiarTexto = (t) => t ? String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "").trim() : "";

export const calculateDistance = (lat1, lon1, lat2, lon2) => { 
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180; 
    const dLon = (lon2 - lon1) * Math.PI / 180; 
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; 
};
export const getCleanDomain = () => {
    let hostname = window.location.hostname;
    hostname = hostname.replace(/^www\./, '');
    hostname = hostname.split(':')[0];
    return hostname.trim().toLowerCase();
};

export const isPremiumDomain = () => {
    const cleanHostname = getCleanDomain();
    return (
        cleanHostname !== 'localhost' &&
        cleanHostname !== '127.0.0.1' &&
        !cleanHostname.endsWith('netlify.app') &&
        !cleanHostname.endsWith('netlify.com') &&
        !cleanHostname.endsWith('vercel.app')
    );
};