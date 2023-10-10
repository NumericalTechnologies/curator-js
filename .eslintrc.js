module.exports = {
  parser: "@typescript-eslint/parser",
	parserOptions: {
    project: "./tsconfig.json",
    tsconfigRootDir: __dirname,
    sourceType: "module"
	},
  plugins: ["@typescript-eslint/eslint-plugin"],
  extends: [
    "airbnb-base", 
    "airbnb-typescript/base"
  ],
  root: true,
  env: {
    node: true,
    jest: true
  },
  rules: {
		"@typescript-eslint/quotes": ["warn", "double"],
    "max-len": ["warn", 200],
    "no-continue": "off",
    "no-await-in-loop": "off",
    "class-methods-use-this": "off",
    "import/prefer-default-export": "off",
    "consistent-return": "off",
    "max-classes-per-file": "off",
    "import/extensions": "off",
    "no-underscore-dangle": "off",
    "no-async-promise-executor": "warn",
    "@typescript-eslint/no-shadow": "off"
  },
  ignorePatterns: ["dist"]
}
