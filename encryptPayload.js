// @ts-check

function t(e) {
    return (
        (t =
            'function' == typeof Symbol && 'symbol' == typeof Symbol.iterator
                ? function (t) {
                      return typeof t;
                  }
                : function (t) {
                      return t && 'function' == typeof Symbol && t.constructor === Symbol && t !== Symbol.prototype
                          ? 'symbol'
                          : typeof t;
                  }),
        t(e)
    );
}

var G = {
    '\b': '\\b',
    '\t': '\\t',
    '\n': '\\n',
    '\f': '\\f',
    '\r': '\\r',
    '': '\\v',
    '"': '\\"',
    '\\': '\\\\',
};

function W(t) {
    var e = G[t];
    return e || '\\u' + ('0000' + t.charCodeAt(0).toString(16)).slice(-4);
}

var F =
    /[\\\"\u0000-\u001f\u007f-\u009f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;

function L(t) {
    F.lastIndex = 0;
    return '"' + (F.test(t) ? t.replace(F, W) : t) + '"';
}

function j(e) {
    var n;
    switch (t(e)) {
        case 'undefined':
            return 'null';
        case 'boolean':
            return String(e);
        case 'number':
            var r = String(e);
            return 'NaN' === r || 'Infinity' === r ? 'null' : r;
        case 'string':
            return L(e);
    }
    if (null === e || e instanceof RegExp) {
        return 'null';
    }
    if (e instanceof Date) {
        return [
            '"',
            e.getFullYear(),
            '-',
            e.getMonth() + 1,
            '-',
            e.getDate(),
            'T',
            e.getHours(),
            ':',
            e.getMinutes(),
            ':',
            e.getSeconds(),
            '.',
            e.getMilliseconds(),
            '"',
        ].join('');
    }
    if (e instanceof Array) {
        var a;
        n = ['['];
        for (a = 0; a < e.length; a++) {
            n.push(j(e[a]) || '"undefined"', ',');
        }
        n[n.length > 1 ? n.length - 1 : n.length] = ']';
        return n.join('');
    }
    n = ['{'];
    for (var o in e)
        if (e.hasOwnProperty(o) && undefined !== e[o]) {
            n.push(L(o), ':', j(e[o]) || '"undefined"', ',');
        }
    n[n.length > 1 ? n.length - 1 : n.length] = '}';
    return n.join('');
}

function jt(t, e) {
    var n = '';
    for (var r = 0; r < t.length; r++) {
        n += String.fromCharCode(e ^ t.charCodeAt(r));
    }
    return n;
}

var w = window.btoa;
var x = t(w);

function B(t) {
    return x === 'function'
        ? w(
              encodeURIComponent(t).replace(/%([0-9A-F]{2})/g, function (t, e) {
                  return String.fromCharCode('0x' + e);
              })
          )
        : (function (t) {
              var e;
              var n;
              var r;
              var a;
              var o;
              var i = window.unescape || window.decodeURI;
              var c = 0;
              var u = 0;
              var s = [];
              if (!t) {
                  return t;
              }
              try {
                  t = i(encodeURIComponent(t));
              } catch (e) {
                  return t;
              }
              do {
                  e = ((o = (t.charCodeAt(c++) << 16) | (t.charCodeAt(c++) << 8) | t.charCodeAt(c++)) >> 18) & 63;
                  n = (o >> 12) & 63;
                  r = (o >> 6) & 63;
                  a = 63 & o;
                  s[u++] =
                      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.charAt(e) +
                      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.charAt(n) +
                      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.charAt(r) +
                      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.charAt(a);
              } while (c < t.length);
              var l = s.join('');
              var f = t.length % 3;
              return (f ? l.slice(0, f - 3) : l) + '==='.slice(f || 3);
          })(t);
}

export function encrypt(t, uuid) {
    var a = t.slice();
    var o = 'G^S}DNK8DNa>D`K}GK77';
    a = B(jt(j(a), 50));
    var i = uuid;
    var c = (function (t, e, n) {
        var v = jt(B(n), 10);
        var m = [];
        var p = -1;
        for (var g = 0; g < t.length; g++) {
            var y = Math.floor(g / v.length + 1);
            var b = g >= v.length ? g % v.length : g;
            var T = v.charCodeAt(b) * v.charCodeAt(y);
            if (T > p) {
                p = T;
            }
        }
        for (var E = 0; t.length > E; E++) {
            var S = Math.floor(E / v.length) + 1;
            var I = E % v.length;
            var A = v.charCodeAt(I) * v.charCodeAt(S);
            for (A >= e && (A = Math.floor(((A - 0) / (p - 0)) * (e - 1 - 0) + 0)); -1 !== m.indexOf(A); ) {
                A += 1;
            }
            m.push(A);
        }
        var R = m.sort(function (t, e) {
            return t - e;
        });
        return R;
    })(o, a.length, i);
    a = (function (t, e, n) {
        var o = '';
        var i = 0;
        var c = t.split('');
        for (var u = 0; u < t.length; u++) {
            o += e.substring(i, n[u] - u - 1) + c[u];
            i = n[u] - u - 1;
        }
        o += e.substring(i);
        return o;
    })(o, a, c);
    return a;
}
