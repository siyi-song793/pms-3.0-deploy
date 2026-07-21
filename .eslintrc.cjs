module.exports = {
  root: true,
  env: { browser: true, es2021: true, node: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', project: './tsconfig.json' },
  plugins: ['@typescript-eslint', 'prettier'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended-type-checked',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:prettier/recommended'
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'complexity': ['error', { max: 12 }],
    'max-lines-per-function': ['error', { max: 80 }],
    'no-restricted-syntax': [
      'error',
      {
        selector: 'Literal[value=/http:\/\/www\.w3\.org\/2000\/svg/]',
        message: '禁止直接引用W3C SVG命名空间URL'
      },
      {
        selector: 'Literal[value=/github.*\.svg/]',
        message: '禁止外链GitHub SVG资源'
      }
    ]
  },
  ignorePatterns: ['dist', 'node_modules', '.devcontainer']
}