export const limpiarTexto = (texto, maxLength = 200) => {
    if (!texto) return "";
    return String(texto)
        .replace(/[<>]/g, '') 
        .substring(0, maxLength)
        .trim();
};

// Se usa formula de haversine con tortuosidad para calcular distancia estimada.
export const calculateDistance = (lat1, lon1, lat2, lon2) => { 
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180; 
    const dLon = (lon2 - lon1) * Math.PI / 180; 
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + 
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
              Math.sin(dLon / 2) * Math.sin(dLon / 2); 
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    
    const distanciaRectaKm = R * c;

    const FACTOR_DESVIO = 1.35; 

    return Number((distanciaRectaKm * FACTOR_DESVIO).toFixed(2)); 
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
        !cleanHostname.endsWith('vercel.app')
    
    );
};