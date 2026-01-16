export function mergeOIDCCookies(
    oldCookies: string[],
    setCookie?: string | string[]
): string[] {
    if (!setCookie) return oldCookies;
    const map = new Map<string, string>();

    const setCookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];

    for (const c of oldCookies) {
        const [nameValue] = c.split(';');
        const [name] = nameValue.split('=');
        map.set(name, nameValue);
    }

    for (const c of setCookieArray) {
        const [nameValue] = c.split(';');
        const [name] = nameValue.split('=');
        map.set(name, nameValue);
    }

    return Array.from(map.values());
}
