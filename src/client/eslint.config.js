import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import unicorn from 'eslint-plugin-unicorn';
import sonarjs from 'eslint-plugin-sonarjs';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '*.config.js', '*.config.ts', 'src/workers/**'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: ['./tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      '@stylistic': stylistic,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
      unicorn,
      sonarjs,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true,
          project: './tsconfig.app.json',
        },
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
    },
    rules: {
      // ============================================
      // 🔧 ANGEPASSTE REGELN - Experimentelle deaktiviert
      // ============================================

      // 🔴 EXPERIMENTELLE REACT HOOKS REGELN (React 19 Compiler Vorbereitung)
      // Diese sind noch nicht produktionsreif und blockieren legitime Patterns
      // Siehe: https://github.com/facebook/react/issues/29107
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',

      // 🟡 Template Expressions: Numbers/Booleans in Template Literals erlauben
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          allowBoolean: true,
          allowNullish: false,
          allowRegExp: false,
        },
      ],

      // 🟡 Array Callback: forEach ohne useless return check
      'array-callback-return': ['error', { allowImplicit: true, checkForEach: false }],

      // ============================================
      // 🚨 REACT CORE RULES
      // Diese hätten den MUI Menu Fragment Error gefangen
      // ============================================

      // JSX Fragment Rules - CATCHES MUI MENU FRAGMENT ERROR!
      'react/jsx-no-useless-fragment': ['error', { allowExpressions: true }],
      'react/jsx-fragments': ['error', 'syntax'],

      // JSX Key Rules - Prevents "missing key" warnings
      'react/jsx-key': [
        'error',
        {
          checkFragmentShorthand: true,
          checkKeyMustBeforeSpread: true,
          warnOnDuplicates: true,
        },
      ],
      'react/no-array-index-key': 'warn',

      // Prevent Common React Mistakes
      'react/no-children-prop': 'error',
      'react/no-danger': 'warn',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',

      // Performance & Optimization
      'react/jsx-no-constructed-context-values': 'error',
      'react/jsx-no-leaked-render': ['error', { validStrategies: ['ternary', 'coerce'] }],
      'react/no-unstable-nested-components': ['error', { allowAsProps: true }],
      'react/no-object-type-as-default-prop': 'error',

      // JSX Best Practices
      'react/jsx-boolean-value': ['error', 'never'],
      'react/jsx-curly-brace-presence': [
        'error',
        {
          props: 'never',
          children: 'never',
          propElementValues: 'always',
        },
      ],
      'react/jsx-no-target-blank': ['error', { enforceDynamicLinks: 'always' }],
      'react/jsx-no-script-url': 'error',
      'react/jsx-pascal-case': ['error', { allowAllCaps: true }],
      'react/self-closing-comp': 'error',
      'react/void-dom-elements-no-children': 'error',

      // Function Components
      'react/function-component-definition': [
        'error',
        {
          namedComponents: 'arrow-function',
          unnamedComponents: 'arrow-function',
        },
      ],
      'react/hook-use-state': 'warn',

      // ============================================
      // React Hooks Rules
      // ============================================
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/rules-of-hooks': 'error',

      // ============================================
      // 📦 IMPORT RULES (NEU!)
      // Ordnung, Duplikate, zyklische Abhängigkeiten
      // ============================================

      // Import Order - Konsistente Reihenfolge
      'import/order': [
        'error',
        {
          groups: [
            'builtin', // Node.js built-in modules
            'external', // npm packages
            'internal', // Internal aliases (@/...)
            'parent', // Parent directory imports
            'sibling', // Same directory imports
            'index', // Index file imports
            'object', // Object imports
            'type', // Type imports
          ],
          pathGroups: [
            { pattern: 'react', group: 'builtin', position: 'before' },
            { pattern: 'react-dom', group: 'builtin', position: 'before' },
            { pattern: '@mui/**', group: 'external', position: 'after' },
            { pattern: '@/**', group: 'internal', position: 'before' },
          ],
          pathGroupsExcludedImportTypes: ['react', 'react-dom'],
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],

      // Import Errors
      'import/no-duplicates': 'error', // Merge duplicate imports
      'import/no-self-import': 'error', // No self-imports
      'import/no-cycle': ['error', { maxDepth: 5, ignoreExternal: true }], // Zyklische Dependencies
      'import/no-useless-path-segments': 'error', // ./foo/./bar → ./foo/bar
      'import/no-relative-packages': 'off', // Erlaubt für Monorepo

      // Import Best Practices
      'import/first': 'error', // Imports müssen am Anfang sein
      'import/newline-after-import': 'error', // Leerzeile nach Imports
      'import/no-mutable-exports': 'error', // Keine mutierenden Exports
      'import/no-named-default': 'error', // import { default as foo } → import foo
      'import/no-anonymous-default-export': [
        'warn',
        {
          allowArray: true,
          allowArrowFunction: false,
          allowAnonymousClass: false,
          allowAnonymousFunction: false,
          allowCallExpression: true,
          allowLiteral: true,
          allowObject: true,
        },
      ],

      // Module System
      'import/no-commonjs': 'error', // Kein require() in ESM
      'import/no-amd': 'error', // Kein AMD (define)
      'import/no-nodejs-modules': [
        'error',
        {
          // Keine Node.js Module im Browser
          allow: ['path', 'url'],
        },
      ],

      // ============================================
      // 🦄 UNICORN RULES (NEU!)
      // Moderne JavaScript Best Practices
      // ============================================

      // Bessere Alternativen
      'unicorn/prefer-array-find': 'error', // filter()[0] → find()
      'unicorn/prefer-array-flat': 'error', // [].concat(...arr) → arr.flat()
      'unicorn/prefer-array-flat-map': 'error', // map().flat() → flatMap()
      'unicorn/prefer-array-index-of': 'error', // findIndex(x => x === y) → indexOf()
      'unicorn/prefer-array-some': 'error', // filter().length > 0 → some()
      'unicorn/prefer-at': 'error', // arr[arr.length - 1] → arr.at(-1)
      'unicorn/prefer-includes': 'error', // indexOf !== -1 → includes()
      'unicorn/prefer-string-replace-all': 'error', // replace(/x/g, y) → replaceAll()
      'unicorn/prefer-string-slice': 'error', // substr/substring → slice()
      'unicorn/prefer-string-starts-ends-with': 'error', // RegEx → startsWith/endsWith
      'unicorn/prefer-string-trim-start-end': 'error', // trimLeft → trimStart
      'unicorn/prefer-modern-math-apis': 'error', // Math.pow → **
      'unicorn/prefer-number-properties': 'error', // isNaN → Number.isNaN
      'unicorn/prefer-object-from-entries': 'error', // reduce → Object.fromEntries
      'unicorn/prefer-set-has': 'error', // array.includes → set.has
      'unicorn/prefer-spread': 'error', // Array.from → [...arr]
      'unicorn/prefer-date-now': 'error', // new Date().getTime() → Date.now()
      'unicorn/prefer-dom-node-append': 'error', // appendChild → append
      'unicorn/prefer-dom-node-remove': 'error', // removeChild → remove
      'unicorn/prefer-dom-node-text-content': 'error', // innerText → textContent
      'unicorn/prefer-query-selector': 'error', // getElementById → querySelector
      'unicorn/prefer-add-event-listener': 'error', // onclick → addEventListener
      'unicorn/prefer-keyboard-event-key': 'error', // keyCode → key
      'unicorn/prefer-event-target': 'error', // EventEmitter → EventTarget

      // Error Handling
      'unicorn/prefer-type-error': 'error', // throw Error → throw TypeError
      'unicorn/throw-new-error': 'error', // throw Error() → throw new Error()
      'unicorn/error-message': 'error', // Errors brauchen Messages
      'unicorn/no-useless-promise-resolve-reject': 'error',

      // Code Quality
      'unicorn/no-array-push-push': 'error', // push(); push() → push(a, b)
      'unicorn/no-for-loop': 'error', // for-loop → for-of
      'unicorn/no-lonely-if': 'error', // else { if } → else if
      'unicorn/no-negated-condition': 'warn', // !a ? b : c → a ? c : b
      'unicorn/no-nested-ternary': 'warn',
      'unicorn/no-new-array': 'error', // new Array() → []
      'unicorn/no-object-as-default-parameter': 'error',
      'unicorn/no-useless-length-check': 'error', // arr.length && arr.forEach
      'unicorn/no-useless-spread': 'error', // [...[1,2,3]] → [1,2,3]
      'unicorn/no-useless-undefined': 'error', // return undefined → return
      'unicorn/no-zero-fractions': 'error', // 1.0 → 1
      'unicorn/prefer-default-parameters': 'error', // x = x || default → x = default
      'unicorn/prefer-logical-operator-over-ternary': 'error', // a ? a : b → a || b
      'unicorn/prefer-optional-catch-binding': 'error', // catch (e) { } → catch { }
      'unicorn/prefer-regexp-test': 'error', // match() → test()
      'unicorn/prefer-ternary': 'off', // Manchmal weniger lesbar
      'unicorn/switch-case-braces': ['error', 'avoid'], // Keine {} in case

      // Naming
      'unicorn/filename-case': [
        'error',
        {
          cases: {
            camelCase: true,
            pascalCase: true,
          },
          ignore: ['vite-env.d.ts', '\\.test\\.', '\\.spec\\.'],
        },
      ],
      'unicorn/no-keyword-prefix': 'off', // new_foo erlaubt
      'unicorn/prevent-abbreviations': 'off', // Zu strikt für die meisten Projekte

      // Disabled - zu strikt oder nicht relevant
      'unicorn/consistent-function-scoping': 'off', // Manchmal gewollt
      'unicorn/no-array-callback-reference': 'off', // arr.map(fn) ist OK
      'unicorn/no-array-for-each': 'off', // forEach ist OK
      'unicorn/no-array-reduce': 'off', // reduce ist OK
      'unicorn/no-null': 'off', // null ist OK mit TypeScript
      'unicorn/no-static-only-class': 'off', // TypeScript utilities
      'unicorn/prefer-module': 'off', // Wir nutzen ESM sowieso
      'unicorn/prefer-top-level-await': 'off', // Nicht überall verfügbar
      'unicorn/prefer-export-from': 'off', // Manchmal braucht man den Import

      // ============================================
      // 🔍 SONARJS RULES (NEU!)
      // Code Smells & Complexity - SonarJS v3
      // ============================================

      // Bugs & Logic Errors
      'sonarjs/no-all-duplicated-branches': 'error', // if (a) {x} else {x}
      'sonarjs/no-element-overwrite': 'error', // arr[0] = 1; arr[0] = 2;
      'sonarjs/no-empty-collection': 'error', // Loop über leere Collection
      'sonarjs/no-extra-arguments': 'error', // Zu viele Argumente
      'sonarjs/no-identical-conditions': 'error', // if (a) {} else if (a) {}
      'sonarjs/no-identical-expressions': 'error', // a === a
      'sonarjs/no-ignored-return': 'error', // slice() ohne Verwendung
      'sonarjs/no-use-of-empty-return-value': 'error', // x = void_function()
      'sonarjs/no-gratuitous-expressions': 'error', // if (true)

      // Code Smells & Complexity
      'sonarjs/cognitive-complexity': ['warn', 15], // Kognitive Komplexität
      'sonarjs/no-collapsible-if': 'error', // if (a) { if (b) } → if (a && b)
      'sonarjs/no-collection-size-mischeck': 'error', // arr.length >= 0 (immer true)
      'sonarjs/no-duplicate-string': ['warn', { threshold: 4 }], // Gleicher String 4x
      'sonarjs/no-duplicated-branches': 'error', // Gleiche Branches
      'sonarjs/no-identical-functions': 'error', // Identische Funktionen
      'sonarjs/no-inverted-boolean-check': 'error', // if (!a) {} else {} → if (a)
      'sonarjs/no-nested-switch': 'error', // Switch in Switch
      'sonarjs/no-nested-template-literals': 'warn', // Template in Template
      'sonarjs/no-redundant-boolean': 'error', // if (a) return true else return false
      'sonarjs/no-redundant-jump': 'error', // Nutzloses break/continue
      'sonarjs/no-same-line-conditional': 'error', // if () x; else y;
      'sonarjs/no-small-switch': 'warn', // Switch mit < 3 Cases
      'sonarjs/no-unused-collection': 'error', // Collection nur gefüllt, nie gelesen
      'sonarjs/no-useless-catch': 'error', // catch (e) { throw e; }
      'sonarjs/prefer-immediate-return': 'error', // const x = 1; return x → return 1
      'sonarjs/prefer-object-literal': 'error', // {} statt new Object()
      'sonarjs/prefer-single-boolean-return': 'error', // if return true else return false
      'sonarjs/prefer-while': 'error', // for(;cond;) → while(cond)

      // Additional SonarJS v3 Rules
      'sonarjs/no-nested-conditional': 'off', // Nested ternary/conditionals
      'sonarjs/no-redundant-assignments': 'error', // x = 1; x = 2;
      'sonarjs/jsx-no-leaked-render': 'error', // 0 && <Component />
      'sonarjs/prefer-promise-shorthand': 'error', // new Promise(r => r(x)) → Promise.resolve(x)
      'sonarjs/no-dead-store': 'warn', // Unused variable assignments
      'sonarjs/no-useless-increment': 'error', // return x++;
      'sonarjs/no-invariant-returns': 'error', // Function always returns same value

      // ============================================
      // 🔒 ERROR PREVENTION RULES
      // Erkennt potenzielle Runtime-Fehler beim Build
      // ============================================

      // Array/Loop Issues
      // 🔧 GEÄNDERT: checkForEach: false - forEach mit implizitem return ist OK
      // 'array-callback-return': ['error', { allowImplicit: true, checkForEach: false }],
      'no-unreachable-loop': 'error',
      'no-await-in-loop': 'warn',

      // Promise/Async Issues
      'no-async-promise-executor': 'error',
      'no-promise-executor-return': 'error',
      'require-atomic-updates': 'error',

      // Logic Errors
      'no-constant-binary-expression': 'error',
      'no-constructor-return': 'error',
      'no-self-assign': ['error', { props: true }],
      'no-template-curly-in-string': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-unreachable': 'error',

      // Comparisons
      'no-compare-neg-zero': 'error',
      'use-isnan': 'error',
      'valid-typeof': 'error',

      // Security
      'no-script-url': 'error',
      'no-new-native-nonconstructor': 'error',

      // ============================================
      // STRICT TypeScript Rules
      // ============================================
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-empty-object-type': 'error',
      '@typescript-eslint/explicit-function-return-type': [
        'warn',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
          allowDirectConstAssertionInArrowFunctions: true,
          allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-import-type-side-effects': 'error',
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'] },
        { selector: 'typeAlias', format: ['PascalCase'] },
        { selector: 'enum', format: ['PascalCase'] },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/strict-boolean-expressions': [
        'warn',
        {
          allowString: true,
          allowNumber: true,
          allowNullableObject: true,
          allowNullableBoolean: true,
          allowNullableString: true,
          allowNullableNumber: false,
          allowAny: false,
        },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': [
        'error',
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
      '@typescript-eslint/await-thenable': 'error',
      '@typescript-eslint/require-await': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/prefer-as-const': 'error',

      // 🔧 KONFLIKT-AUFLÖSUNG: unicorn/prefer-default-parameters vs no-useless-default-assignment
      // Diese beiden Regeln sind in direktem Konflikt - wir deaktivieren die TypeScript-Regel
      // zugunsten des modernen unicorn-Ansatzes mit Default-Parametern
      '@typescript-eslint/no-useless-default-assignment': 'off',

      // TypeScript - Zusätzliche Regeln
      '@typescript-eslint/no-confusing-void-expression': ['error', { ignoreArrowShorthand: true }],
      '@typescript-eslint/no-duplicate-enum-values': 'error',
      '@typescript-eslint/no-duplicate-type-constituents': 'error',
      '@typescript-eslint/no-meaningless-void-operator': 'error',
      '@typescript-eslint/no-mixed-enums': 'error',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/no-unnecessary-boolean-literal-compare': 'error',
      '@typescript-eslint/no-unnecessary-template-expression': 'error',
      '@typescript-eslint/prefer-includes': 'error',
      '@typescript-eslint/prefer-string-starts-ends-with': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // ============================================
      // Stylistic Rules (Airbnb-style)
      // ============================================
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
      '@stylistic/comma-dangle': ['error', 'es5'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/func-call-spacing': ['error', 'never'],
      '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
      '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/space-before-blocks': 'error',
      '@stylistic/space-before-function-paren': [
        'error',
        {
          anonymous: 'always',
          named: 'never',
          asyncArrow: 'always',
        },
      ],
      '@stylistic/space-in-parens': ['error', 'never'],
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/max-len': [
        'warn',
        {
          code: 120,
          tabWidth: 2,
          ignoreUrls: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: true,
          ignoreRegExpLiterals: true,
          ignoreComments: true,
          ignorePattern: '^import |^export ',
        },
      ],
      '@stylistic/jsx-quotes': ['error', 'prefer-double'],

      // ============================================
      // Best Practices (Airbnb-style)
      // ============================================
      'no-console': ['warn', { allow: ['warn', 'error', 'debug'] }],
      'no-debugger': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      curly: ['error', 'all'],
      'default-case': 'warn',
      'default-case-last': 'error',
      'default-param-last': 'off',
      '@typescript-eslint/default-param-last': 'error',
      'dot-notation': 'off',
      '@typescript-eslint/dot-notation': 'error',
      'no-else-return': ['error', { allowElseIf: false }],
      'no-empty-function': 'off',
      '@typescript-eslint/no-empty-function': ['warn', { allow: ['arrowFunctions'] }],
      'no-eval': 'error',
      'no-implied-eval': 'off',
      '@typescript-eslint/no-implied-eval': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-lone-blocks': 'error',
      'no-loop-func': 'off',
      '@typescript-eslint/no-loop-func': 'error',
      'no-multi-spaces': 'error',
      'no-new': 'warn',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-param-reassign': ['error', { props: false }],
      'no-proto': 'error',
      'no-return-assign': ['error', 'always'],
      'no-self-compare': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'off',
      '@typescript-eslint/only-throw-error': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'prefer-promise-reject-errors': 'off',
      '@typescript-eslint/prefer-promise-reject-errors': 'error',
      radix: 'error',
      yoda: 'error',

      // Zusätzliche Best Practices (Airbnb)
      'grouped-accessor-pairs': ['error', 'getBeforeSet'],
      'guard-for-in': 'error',
      'no-alert': 'warn',
      'no-caller': 'error',
      'no-case-declarations': 'error',
      'no-div-regex': 'error',
      'no-empty-pattern': 'error',
      'no-eq-null': 'off',
      'no-fallthrough': 'error',
      'no-floating-decimal': 'error',
      'no-global-assign': 'error',
      'no-implicit-coercion': ['error', { allow: ['!!', '+'] }],
      'no-implicit-globals': 'error',
      'no-invalid-this': 'off',
      'no-iterator': 'error',
      'no-labels': 'error',
      'no-lonely-if': 'error',
      'no-multi-str': 'error',
      'no-negated-condition': 'off', // Unicorn handles this
      'no-nested-ternary': 'off', // Unicorn handles this
      'no-nonoctal-decimal-escape': 'error',
      'no-octal': 'error',
      'no-octal-escape': 'error',
      'no-restricted-properties': [
        'error',
        { object: 'arguments', property: 'callee', message: 'arguments.callee is deprecated' },
        { object: 'global', property: 'isFinite', message: 'Use Number.isFinite instead' },
        { object: 'self', property: 'isFinite', message: 'Use Number.isFinite instead' },
        { object: 'window', property: 'isFinite', message: 'Use Number.isFinite instead' },
        { object: 'global', property: 'isNaN', message: 'Use Number.isNaN instead' },
        { object: 'self', property: 'isNaN', message: 'Use Number.isNaN instead' },
        { object: 'window', property: 'isNaN', message: 'Use Number.isNaN instead' },
      ],
      'no-return-await': 'off',
      '@typescript-eslint/return-await': ['error', 'in-try-catch'],
      'no-unneeded-ternary': ['error', { defaultAssignment: false }],
      'no-useless-call': 'error',
      'no-useless-catch': 'off', // SonarJS handles this
      'no-void': ['error', { allowAsStatement: true }],
      'no-with': 'error',
      'operator-assignment': ['error', 'always'],
      'prefer-exponentiation-operator': 'error',
      'prefer-named-capture-group': 'off',
      'prefer-object-has-own': 'error',
      'prefer-object-spread': 'error',
      'prefer-regex-literals': ['error', { disallowRedundantWrapping: true }],

      // ============================================
      // Variables (Airbnb-style)
      // ============================================
      'no-shadow': 'off',
      '@typescript-eslint/no-shadow': 'error',
      'no-undef-init': 'error',
      'no-use-before-define': 'off',
      '@typescript-eslint/no-use-before-define': [
        'error',
        { functions: false, classes: true, variables: true },
      ],
      'no-delete-var': 'error',
      'no-label-var': 'error',
      'no-restricted-globals': [
        'error',
        { name: 'event', message: 'Use local event parameter instead.' },
        { name: 'fdescribe', message: 'Do not commit fdescribe. Use describe instead.' },
      ],
      'no-undef': 'off',

      // ============================================
      // ES6+ (Airbnb-style)
      // ============================================
      'arrow-body-style': ['error', 'as-needed'],
      'no-duplicate-imports': 'off', // import/no-duplicates handles this
      'no-useless-computed-key': 'error',
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': 'error',
      'no-useless-rename': 'error',
      'object-shorthand': ['error', 'always'],
      'prefer-arrow-callback': 'error',
      'prefer-destructuring': [
        'warn',
        {
          VariableDeclarator: { array: false, object: true },
          AssignmentExpression: { array: false, object: false },
        },
      ],
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'prefer-template': 'error',
      'rest-spread-spacing': ['error', 'never'],
      'template-curly-spacing': 'error',
      'symbol-description': 'error',
      'no-restricted-exports': ['error', { restrictedNamedExports: ['default', 'then'] }],

      // ============================================
      // JSX Accessibility (jsx-a11y)
      // ============================================
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/autocomplete-valid': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/iframe-has-title': 'error',
      'jsx-a11y/img-redundant-alt': 'error',
      'jsx-a11y/interactive-supports-focus': 'warn',
      'jsx-a11y/label-has-associated-control': 'warn',
      'jsx-a11y/lang': 'error',
      'jsx-a11y/media-has-caption': 'warn',
      'jsx-a11y/mouse-events-have-key-events': 'warn',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-interactive-element-to-noninteractive-role': 'warn',
      'jsx-a11y/no-noninteractive-element-interactions': 'warn',
      'jsx-a11y/no-noninteractive-element-to-interactive-role': 'warn',
      'jsx-a11y/no-noninteractive-tabindex': 'warn',
      'jsx-a11y/no-redundant-roles': 'error',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/prefer-tag-over-role': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'warn',
    },
  },
  // Prettier must be last to override conflicting rules
  eslintConfigPrettier
);
