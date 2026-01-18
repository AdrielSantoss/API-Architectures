import { createLocalJWKSet } from 'jose';

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

export const JWKSLocal = createLocalJWKSet({
    keys: [
        {
            kty: 'RSA',
            use: 'sig',
            kid: 'keystore-CHANGE-ME',
            alg: 'RS256',
            e: 'AQAB',
            n: 'xwQ72P9z9OYshiQ-ntDYaPnnfwG6u9JAdLMZ5o0dmjlcyrvwQRdoFIKPnO65Q8mh6F_LDSxjxa2Yzo_wdjhbPZLjfUJXgCzm54cClXzT5twzo7lzoAfaJlkTsoZc2HFWqmcri0BuzmTFLZx2Q7wYBm0pXHmQKF0V-C1O6NWfd4mfBhbM-I1tHYSpAMgarSm22WDMDx-WWI7TEzy2QhaBVaENW9BKaKkJklocAZCxk18WhR0fckIGiWiSM5FcU1PY2jfGsTmX505Ub7P5Dz75Ygqrutd5tFrcqyPAtPTFDk8X1InxkkUwpP3nFU5o50DGhwQolGYKPGtQ-ZtmbOfcWQ',
        },
    ],
});
