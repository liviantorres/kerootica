/**
 * Valida se um token JWT existe, tem formato válido e não está expirado.
 */
export function isTokenValid(token) {
    if (!token || typeof token !== 'string') return false;
    
    // Evita strings literais salvas por bug (ex: "undefined", "null", "")
    const trimmed = token.trim();
    if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') {
        return false;
    }

    try {
        const parts = trimmed.split('.');
        if (parts.length !== 3) return false;

        // Decodifica a parte do payload do JWT (segunda parte)
        const base64Url = parts[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );

        const payload = JSON.parse(jsonPayload);

        // Se tiver campo exp (em segundos), verifica se expirou
        if (payload.exp && typeof payload.exp === 'number') {
            const nowInSeconds = Math.floor(Date.now() / 1000);
            if (nowInSeconds >= payload.exp) {
                return false; // Token expirado
            }
        }

        return true;
    } catch {
        return false;
    }
}
