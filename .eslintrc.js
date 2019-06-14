module.exports = {
  parser: '@typescript-eslint/parser',
  extends: ['plugin:@typescript-eslint/recommended'],
  plugins: ['@typescript-eslint', 'mocha'],
  rules: {
    "@typescript-eslint/no-var-requires": "off",
    "indent": "off",
    "@typescript-eslint/indent": ["error", 2],
    "@typescript-eslint/member-delimiter-style": ['error', {
      "multiline": {
        "delimiter": "none",
      },
      "singleline": {
        "delimiter": "comma",
      }
    }],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-use-before-define': ['error', { 'functions': false, 'classes': true }],
    '@typescript-eslint/explicit-function-return-type': ['error', { allowExpressions: true }],
  },
  env: {
    mocha: true,
    node: true
  }
}
