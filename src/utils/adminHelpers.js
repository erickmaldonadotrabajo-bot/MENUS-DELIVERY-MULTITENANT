export const limpiarTexto = (texto, maxLength = 200) => {
    if (!texto) return "";
    return String(texto)
        .replace(/[<>]/g, '') 
        .substring(0, maxLength)
        .trim();
};