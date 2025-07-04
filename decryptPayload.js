// @ts-check

function sortJsonKeys(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map((item) => sortJsonKeys(item));
    }

    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};

    sortedKeys.forEach((key) => {
        sortedObj[key] = sortJsonKeys(obj[key]);
    });

    return sortedObj;
}

export function decrypt(encrypted, uuid) {
    const o = 'G^S}DNK8DNa>D`K}GK77';
    const L = o.length;

    const origLen = encrypted.length - L;
    const mapping = computeMapping(o, origLen, uuid);
    let base64Str = encrypted;
    const removeIdx = mapping.map((x) => x - 1).sort((a, b) => b - a);
    for (const idx of removeIdx) {
        base64Str = base64Str.slice(0, idx) + base64Str.slice(idx + 1);
    }

    const buf = Buffer.from(base64Str, 'base64');
    const latin1 = buf.toString('latin1');

    let pct = '';
    for (let i = 0; i < latin1.length; i++) {
        const hex = latin1.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
        pct += '%' + hex;
    }
    const xoredJson = decodeURIComponent(pct);

    let jsonStr = '';
    for (let i = 0; i < xoredJson.length; i++) {
        jsonStr += String.fromCharCode(xoredJson.charCodeAt(i) ^ 50);
    }

    return JSON.stringify(sortJsonKeys(JSON.parse(jsonStr)), null, 2);
}

function jt(str, key) {
    let r = '';
    for (let i = 0; i < str.length; i++) {
        r += String.fromCharCode(str.charCodeAt(i) ^ key);
    }
    return r;
}

function computeMapping(o, e, uuid) {
    const b64 = Buffer.from(uuid, 'utf8').toString('base64');
    const v = jt(b64, 10);

    let p = -1;
    for (let g = 0; g < o.length; g++) {
        const y = Math.floor(g / v.length + 1);
        const b = g >= v.length ? g % v.length : g;
        const T = v.charCodeAt(b) * v.charCodeAt(y);
        if (T > p) p = T;
    }

    const m = [];
    for (let E = 0; E < o.length; E++) {
        const S = Math.floor(E / v.length) + 1;
        const I = E % v.length;
        let A = v.charCodeAt(I) * v.charCodeAt(S);

        if (A >= e) {
            A = Math.floor((A / p) * (e - 1));
        }
        while (m.indexOf(A) !== -1) {
            A++;
        }
        m.push(A);
    }

    return m.sort((a, b) => a - b);
}
