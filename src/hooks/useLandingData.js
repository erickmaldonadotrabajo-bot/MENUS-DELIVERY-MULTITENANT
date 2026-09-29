import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { getCleanDomain, isPremiumDomain } from '../utils/helpers';

export const useLandingData = () => {
    const [tienda, setTienda] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);

    useEffect(() => {
        const fetchTienda = async () => {
            try {
                let data = null;
                const cleanHostname = getCleanDomain();
                const premium = isPremiumDomain();
                const urlParams = new URLSearchParams(window.location.search);
                const parametroTienda = urlParams.get('tienda');

                if (premium) {
                    const { data: resData, error } = await supabase
                        .from('tiendas')
                        .select('*')
                        .ilike('dominio_personal', cleanHostname)
                        .maybeSingle();

                    if (error) throw new Error(`Error BD: ${error.message}`);
                    if (!resData) throw new Error(`El dominio [${cleanHostname}] no está asignado.`);
                    data = resData;
                } else {
                    if (!parametroTienda || parametroTienda.trim() === '') {
                        throw new Error("Falta el parámetro en el enlace (ej. ?tienda=slug).");
                    }

                    let query = supabase.from('tiendas').select('*');
                    if (/^\d+$/.test(parametroTienda)) query = query.eq('id', parseInt(parametroTienda));
                    else query = query.eq('slug', parametroTienda);

                    const { data: resData, error } = await query.single();
                    if (error || !resData) throw new Error("La tienda solicitada no existe.");
                    data = resData;

                    if (data.slug && parametroTienda !== data.slug) {
                        window.history.replaceState(null, '', `${window.location.pathname}?tienda=${data.slug}`);
                    }
                }
                
                document.title = data.nombre;

                // Generador de PWA encapsulado
                if (data.logo_url) {
                    const manifestJSON = {
                        name: data.nombre,
                        short_name: data.nombre,
                        start_url: window.location.href,
                        display: "standalone",
                        background_color: data.color_fondo || "#111827",
                        theme_color: data.color_primario || "#f97316",
                        icons: [
                            { src: data.logo_url, sizes: "192x192", type: "image/png" },
                            { src: data.logo_url, sizes: "512x512", type: "image/png", purpose: "any maskable" }
                        ]
                    };
                    
                    const manifestBlob = new Blob([JSON.stringify(manifestJSON)], { type: 'application/json' });
                    const manifestLink = document.createElement('link');
                    manifestLink.rel = 'manifest';
                    manifestLink.href = URL.createObjectURL(manifestBlob);
                    document.head.appendChild(manifestLink);
                }

                setTienda(data);
            } catch (err) {
                setErrorMsg(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchTienda();
    }, []);

    return { tienda, loading, errorMsg, isPremiumDomain: isPremiumDomain() };
};