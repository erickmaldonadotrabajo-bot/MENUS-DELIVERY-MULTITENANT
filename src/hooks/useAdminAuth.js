import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { getCleanDomain, isPremiumDomain } from '../utils/helpers';

export const useAdminAuth = (parametroTienda) => {
    const [tiendaId, setTiendaId] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loadingAuth, setLoadingAuth] = useState(true);
    const [authError, setAuthError] = useState(null);

    useEffect(() => {
        const resolveTiendaAndAuth = async () => {
            try {
                const cleanHostname = getCleanDomain();
                const premium = isPremiumDomain();
                let data = null;

                if (premium) {
                    const { data: resData, error } = await supabase.from('tiendas').select('id, slug').ilike('dominio_personal', cleanHostname).maybeSingle();
                    if (error) throw error;
                    if (!resData) throw new Error("Dominio no asignado.");
                    data = resData;
                } else {
                    if (!parametroTienda) throw new Error("Falta el parámetro de la tienda.");
                    let query = supabase.from('tiendas').select('id, slug');
                    query = /^\d+$/.test(parametroTienda) ? query.eq('id', parseInt(parametroTienda)) : query.eq('slug', parametroTienda);
                    
                    const { data: resData, error } = await query.single();
                    if (error || !resData) throw new Error("Tienda no encontrada.");
                    data = resData;
                }
                
                setTiendaId(data.id);

                // Verificar sesión silenciosa
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data: perfil } = await supabase.from('perfiles').select('rol, tienda_id').eq('id', session.user.id).single();
                    if (perfil && (perfil.rol === 'superadmin' || perfil.tienda_id === data.id)) {
                        setIsAuthenticated(true);
                    }
                }
            } catch (err) {
                setAuthError(err.message);
            } finally {
                setLoadingAuth(false);
            }
        };
        
        resolveTiendaAndAuth();
    }, [parametroTienda]);

    const login = async (email, password) => {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError || !authData.user) throw new Error("Correo o contraseña incorrectos.");

        const { data: perfil, error: perfilError } = await supabase.from('perfiles').select('rol, tienda_id').eq('id', authData.user.id).single();
        if (perfilError || !perfil) {
            await supabase.auth.signOut();
            throw new Error("Usuario sin perfil asignado.");
        }

        if (perfil.rol !== 'superadmin' && perfil.tienda_id !== tiendaId) {
            await supabase.auth.signOut();
            throw new Error("No tienes acceso administrativo a esta tienda.");
        }

        setIsAuthenticated(true);
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setIsAuthenticated(false);
    };

    return { tiendaId, isAuthenticated, loadingAuth, authError, login, logout };
};