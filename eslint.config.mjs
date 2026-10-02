// Minimal lint config — catches undefined identifiers (the class of bug that
// breaks at runtime but slips past a production build, because Rollup treats
// an unknown capitalised identifier as a global rather than a missing import)
// and unused imports. Run with: npx eslint src
export default [
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        window: 'readonly', document: 'readonly', navigator: 'readonly',
        localStorage: 'readonly', console: 'readonly', fetch: 'readonly',
        setTimeout: 'readonly', clearTimeout: 'readonly', setInterval: 'readonly',
        clearInterval: 'readonly', process: 'readonly', import: 'readonly',
        Intl: 'readonly', Date: 'readonly', Math: 'readonly', JSON: 'readonly',
        Array: 'readonly', Object: 'readonly', String: 'readonly', Number: 'readonly',
        Promise: 'readonly', RegExp: 'readonly', Error: 'readonly', Set: 'readonly',
        Map: 'readonly', Boolean: 'readonly', isNaN: 'readonly', parseInt: 'readonly',
        parseFloat: 'readonly', URL: 'readonly', TextDecoder: 'readonly',
        TextEncoder: 'readonly', FormData: 'readonly', Blob: 'readonly',
        performance: 'readonly', structuredClone: 'readonly', globalThis: 'readonly',
        alert: 'readonly', confirm: 'readonly', prompt: 'readonly',
        requestAnimationFrame: 'readonly', cancelAnimationFrame: 'readonly',
        IntersectionObserver: 'readonly', ResizeObserver: 'readonly',
        MutationObserver: 'readonly', Worker: 'readonly', Headers: 'readonly',
        Request: 'readonly', Response: 'readonly', AbortController: 'readonly',
        WebAssembly: 'readonly', crypto: 'readonly', atob: 'readonly', btoa: 'readonly'
      }
    },
    linterOptions: { reportUnusedDisableDirectives: true },
    rules: {
      'no-undef': 'error',
      'no-unused-vars': ['warn', { varsIgnorePattern: '^[A-Z_]' }]
    }
  },
  { ignores: ['dist/**', 'node_modules/**'] }
];
