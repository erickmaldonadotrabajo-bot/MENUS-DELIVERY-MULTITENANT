import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase'; 

export const useStoreData = (parametroTienda) => {
    const [storeConfig, setStoreConfig] = useState(null);
    const [categoriesDB, setCategoriesDB] = useState([]);
    const [menuItemsDB, setMenuItemsDB] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState(null);
    const [activeCategory, setActiveCategory] = useState("");
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchStoreData = async () => {
            try {
                // 1. Detección de dominio limpia
                const hostname = window.location.hostname.replace(/^www\./, '').split(':')[0].trim().toLowerCase();
                const isPremiumDomain = !['localhost', '127.0.0.1'].includes(hostname) && 
                                        !hostname.endsWith('netlify.app') && 
                                        !hostname.endsWith('netlify.com') && 
                                        !hostname.endsWith('vercel.app');

                let tiendaData = null;

                // 2. Fetch de la tienda
                if (isPremiumDomain) {
                    const { data, error } = await supabase.from('tiendas').select('*').ilike('dominio_personal', hostname).maybeSingle();
                    if (error || !data) throw new Error("Tienda no encontrada por dominio.");
                    tiendaData = data;
                } else {
                    if (!parametroTienda || parametroTienda.trim() === '') throw new Error("Falta el parámetro en el enlace.");
                    let query = supabase.from('tiendas').select('*');
                    query = /^\d+$/.test(parametroTienda) ? query.eq('id', parseInt(parametroTienda)) : query.eq('slug', parametroTienda);
                    
                    const { data, error } = await query.single();
                    if (error || !data) throw new Error("La tienda solicitada no existe.");
                    tiendaData = data;
                }
                
                setStoreConfig(tiendaData);
                document.title = `Menú | ${tiendaData.nombre}`;

                document.querySelectorAll("link[rel='icon'], link[rel='apple-touch-icon']").forEach(el => el.remove());
                if (tiendaData.logo_url) {
                    const favicon = document.createElement('link'); favicon.rel = 'icon'; favicon.href = tiendaData.logo_url; document.head.appendChild(favicon);
                    const appleIcon = document.createElement('link'); appleIcon.rel = 'apple-touch-icon'; appleIcon.href = tiendaData.logo_url; document.head.appendChild(appleIcon);
                }

                // 3. OPTIMIZACIÓN: Fetch de categorías y productos en paralelo
                const [catsRes, itemsRes] = await Promise.all([
                    supabase.from('categorias').select('*').eq('tienda_id', tiendaData.id).order('orden', { ascending: true }),
                    supabase.from('menu_items').select('*').eq('tienda_id', tiendaData.id).order('orden', { ascending: true })
                ]);

                setCategoriesDB(catsRes.data || []);
                if (catsRes.data && catsRes.data.length > 0) {
                    setActiveCategory(catsRes.data[0].nombre);
                }
                setMenuItemsDB(itemsRes.data || []);

            } catch (err) {
                console.error("Error cargando app:", err);
                setErrorMsg(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchStoreData();
    }, [parametroTienda]);

    const processedMenu = useMemo(() => {
        let activeCats = categoriesDB;
        if (!searchTerm && activeCategory) activeCats = categoriesDB.filter(c => c.nombre === activeCategory);
        
        return activeCats.map(cat => {
            let catItems = menuItemsDB.filter(item => item.categoria_id === cat.id && item.nombre.toLowerCase().includes(searchTerm.toLowerCase()));
            catItems.sort((a, b) => a.orden - b.orden);
            return { id: cat.id, category: cat.nombre, prepNote: cat.nota_preparacion, items: catItems };
        }).filter(cat => cat.items.length > 0 || searchTerm); 
    }, [categoriesDB, menuItemsDB, searchTerm, activeCategory]);

    return {
        storeConfig,
        categoriesDB,
        isLoading,
        errorMsg,
        activeCategory,
        setActiveCategory,
        searchTerm,
        setSearchTerm,
        processedMenu
    };
};