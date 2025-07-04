// @ts-check

import { traverse, types } from '@babel/core';
import { generate } from '@babel/generator';
import parser from '@babel/parser';
import axios from 'axios';
import fs from 'fs/promises';
import { JSDOM } from 'jsdom';
import { Script } from 'vm';
import {
    analyzeFunctionCalls,
    convertComputedToProperty,
    extractIIFEBody,
    inlineImmutableBindings,
    removeExcessiveParseIntFunctions,
    removeIntermediateFunctions,
} from './utils.js';

(async () => {
    const appId = 'PXzC5j78di';
    const url = `https://captcha.hsprotect.net/${appId}/captcha.js`;

    /** @type {string} */
    let originalScript = '';
    try {
        const response = await axios.get(url);
        originalScript = response.data;
    } catch (error) {
        console.error('Error fetching the script:', error);
        return;
    }

    const ast = parser.parse(originalScript);

    // Traverse the AST to find and replace function calls
    inlineImmutableBindings(ast);

    const fnCalls = analyzeFunctionCalls(ast);
    fnCalls.forEach((elem) => {
        const { path, fnFinalCallString } = elem;
        if (fnFinalCallString) {
            path.replaceWithSourceString(fnFinalCallString);
        }
    });

    // Remove intermediate functions that are not used
    removeIntermediateFunctions(ast, fnCalls);

    // Extract the body of the IIFE and execute it in a JSDOM context
    const iifeBodyResult = extractIIFEBody(ast);
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

    fnCalls.forEach((elem) => {
        const { path, fnFinalCallString } = elem;
        if (fnFinalCallString) {
            const result = window.eval(fnFinalCallString);
            // console.log(`Function call replaced: ${fnFinalCallString} => ${result}`);
            path.replaceWith(types.stringLiteral(result));
        }
    });

    // const chatCodeAtResults = findCharCodeAtCalls(ast);

    let replacedAttempts = 0;
    for (;;) {
        const replaceResults = [];
        traverse(ast, {
            CallExpression(path) {
                const node = path.node;

                if (node.arguments.length !== 1 || !types.isStringLiteral(node.arguments[0])) {
                    return;
                }

                const functionName = node.callee.name;
                if (!functionName || ['atob', 'parseInt'].includes(functionName)) return;

                // FIXME: handle the case where the function name is a single character
                if (functionName.length === 1) {
                    // console.log(`Found function call: ${functionName}`);
                    const stringArg = node.arguments[0].value;

                    try {
                        const stringResult = window.u(stringArg);
                        if (stringResult !== stringArg) {
                            replaceResults.push({
                                path,
                                stringResult,
                            });
                        }
                    } catch (err) {}
                } else {
                    // console.log(`Found function call: ${functionName} with argument: ${node.arguments[0].value}`);
                }
            },
        });

        if (replaceResults.length === 0) {
            ++replacedAttempts;
            if (replacedAttempts === 3) {
                break;
            }

            continue;
        }

        replacedAttempts = 0;

        replaceResults.forEach((result) => {
            const { path, stringResult } = result;
            path.replaceWith(types.stringLiteral(stringResult));
        });
    }

    // Convert computed properties to regular properties
    convertComputedToProperty(ast);

    // Remove excessive parseInt functions
    removeExcessiveParseIntFunctions(ast);

    // generate the modified script from the AST
    const modifiedScript = generate(ast, { retainLines: false }).code;

    // Save the modified script to a file
    const outputPath = './captcha.transformed.js';
    const prettier = await import('prettier');
    const prettierConfig = await prettier.resolveConfig(outputPath);
    const formatted = await prettier.format(modifiedScript, {
        ...prettierConfig,
        filepath: outputPath,
    });
    await fs.writeFile(outputPath, formatted, 'utf-8');
})();
