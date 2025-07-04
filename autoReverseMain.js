// @ts-check

import { traverse, types } from '@babel/core';
import { generate } from '@babel/generator';
import parser from '@babel/parser';
import axios from 'axios';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import { deobfuscate } from 'obfuscator-io-deobfuscator';
import { Script } from 'vm';
import { convertComputedToProperty, extractIIFEBodyMain1, inlineImmutableBindings } from './utils.js';

(async () => {
    const appId = 'PXzC5j78di';
    const url = `https://client.px-cloud.net/${appId}/main.min.js`;

    /** @type {string} */
    let originalScript = '';
    try {
        const response = await axios.get(url);
        originalScript = response.data;
    } catch (err) {
        console.error('Error fetching the script:', err);
        return;
    }

    const deobfedScript = deobfuscate(originalScript, {
        objectSimplification: { isEnabled: true },
        objectPacking: { isEnabled: true },
        proxyFunctionInlining: { isEnabled: true },
        stringRevealing: { isEnabled: true },
        expressionSimplification: { isEnabled: true },
        constantPropagation: { isEnabled: true },
        reassignmentRemoval: { isEnabled: true },
        sequenceSplitting: { isEnabled: true },
        controlFlowRecovery: { isEnabled: true },
        deadBranchRemoval: { isEnabled: false },
        antiTamperRemoval: { isEnabled: true },
        unusedVariableRemoval: { isEnabled: true },
        propertySimplification: { isEnabled: true },
    });

    const ast = parser.parse(deobfedScript);

    // Extract the body of the IIFE and execute it in a JSDOM context
    const iifeBodyResult = extractIIFEBodyMain1(ast);
    const jsdom = new JSDOM(
        `

    <!doctype html>
    <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <meta http-equiv="X-UA-Compatible" content="IE=edge" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>HUMAN Iframe Page</title>
            <style>
                #px-captcha {
                    text-align: center;
                    margin: auto;
                }
            </style>
        </head>
        <body>
            <div id="px-captcha"></div>
            <script>
                'use strict';
                var c = '';
                function y(t) {
                    return t
                        .substring(1)
                        .split('&')
                        .reduce(function (t, n) {
                            try {
                                var e = n.split('='),
                                    o = e[0],
                                    c = e[1];
                                t[o] = decodeURIComponent(c);
                            } catch (t) {}
                            return t;
                        }, {});
                }
                function h() {
                    c = y(window.location.search);

                    c.app_id = '${appId}';
                    c.session_id = '6ee4f253d917a777f9c1bb93f9de737a';

                    window._pxAppId = c.app_id || null;
                    window._pxParam1 = c.session_id || null;
                    window._pxOnCaptchaSuccess = function () {};
                }
                function _() {
                    h();
                }
                _();
            </script>
        </body>
    </html>

            `,
        {
            runScripts: 'dangerously',
        }
    );

    const script = new Script(iifeBodyResult?.code || '');

    // Execute the IIFE body in jsdom context
    try {
        script.runInContext(jsdom.getInternalVMContext());
    } catch (err) {}

    // run the IIFE body in a JSDOM context
    const { window } = jsdom;

    for (;;) {
        const needToReplaceNumberCalls = [];
        traverse(ast, {
            CallExpression(path) {
                const node = path.node;

                if (node.arguments.length !== 1) return;

                const arg1Value = path.get('arguments.0').evaluate();
                if (arg1Value.confident && typeof arg1Value.value === 'number') {
                    const fnName = node.callee.name;
                    if (fnName && typeof window[fnName] === 'function') {
                        const result = window[fnName](arg1Value.value);
                        needToReplaceNumberCalls.push({
                            path,
                            result,
                        });
                    }
                }
            },
        });

        needToReplaceNumberCalls.forEach((elem) => {
            const { path, result } = elem;
            path.replaceWith(types.stringLiteral(result));
        });

        const needToReplaceStrCalls = [];
        traverse(ast, {
            CallExpression(path) {
                const node = path.node;

                if (node.arguments.length !== 1) return;

                const arg1Value = path.get('arguments.0').evaluate();
                if (arg1Value.confident && typeof arg1Value.value === 'string') {
                    const fnName = node.callee.name;
                    if (fnName && typeof window[fnName] === 'function') {
                        try {
                            const result = window[fnName](arg1Value.value);
                            if (typeof result === 'string') {
                                needToReplaceStrCalls.push({
                                    path,
                                    result,
                                });
                            }
                        } catch (err) {}
                    }
                }
            },
        });

        needToReplaceStrCalls.forEach((elem) => {
            const { path, result } = elem;
            path.replaceWith(types.stringLiteral(result));
        });

        if (needToReplaceNumberCalls.length === 0 && needToReplaceStrCalls.length === 0) {
            break;
        }
    }

    // Traverse the AST to find and replace function calls
    inlineImmutableBindings(ast);

    // Convert computed properties to regular properties
    convertComputedToProperty(ast);

    window.close();

    // generate the modified script from the AST
    const modifiedScript = generate(ast, { retainLines: false }).code;

    // Save the modified script to a file
    const outputPath = `./main_${appId}.transformed.js`;
    const prettier = await import('prettier');
    const prettierConfig = await prettier.resolveConfig(outputPath);
    const formatted = await prettier.format(modifiedScript, {
        ...prettierConfig,
        filepath: outputPath,
    });
    await fs.writeFile(outputPath, formatted, 'utf-8');
})();
