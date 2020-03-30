module.exports = {
    root: true,
    env: {
        node: true,
        es6: true,
        amd: true
    },
    parser: "@typescript-eslint/parser",
    parserOptions: {
        ecmaVersion: 10
    },
    plugins: ["@typescript-eslint", "arca", "sort-imports-es6-autofix", "align-assignments"],
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/eslint-recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    rules: {
        "align-assignments/align-assignments": [2, { "requiresOnly": false } ],
        "array-bracket-spacing": ["error", "always", { objectsInArrays: false }],
        "arrow-parens": ["error", "as-needed"],
        "arrow-spacing": 2,
        "block-spacing": 2,
        "brace-style": 2,
        "comma-dangle": ["error", "never"],
        "comma-spacing": [2, { before: false, after: true }],
        "comma-style": [2, "last"],
        "consistent-return": 2,
        "consistent-this": [2, "self"],
        curly: [2, "multi-or-nest"],
        "default-case": 2,
        "dot-location": [2, "property"],
        "dot-notation": 2,
        "eol-last": 2,
        eqeqeq: [2, "smart"],
        "func-style": [2, "declaration"],
        "global-require": 2,
        "handle-callback-err": [2, "error"],
        indent: [2, 2, { SwitchCase: 1 }],
        "key-spacing": [
            2,
            { beforeColon: false, afterColon: true, mode: "minimum", align: "value" }
        ],
        "keyword-spacing": 2,
        "max-depth": [2, 3],
        "max-nested-callbacks": [2, 3],
        "max-params": [2, 3],
        "max-statements": [2, 30],
        "new-cap": [2, { newIsCap: true, capIsNew: false }],
        "new-parens": 2,
        "no-buffer-constructor": 2,
        "no-caller": 2,
        "no-catch-shadow": 2,
        "no-confusing-arrow": [2, { allowParens: true }],
        "no-const-assign": 2,
        "no-constant-condition": 2,
        "no-dupe-class-members": 2,
        "no-console": 2,
        "no-eval": 2,
        "no-extra-bind": 2,
        "no-fallthrough": 2,
        "no-labels": 2,
        "no-lonely-if": 2,
        "no-loop-func": 2,
        "no-magic-numbers": 0,
        "no-negated-condition": 2,
        "no-nested-ternary": 2,
        "no-new": 2,
        "no-octal-escape": 2,
        "no-octal": 2,
        "no-param-reassign": [2, { props: true }],
        "no-process-exit": 2,
        "no-proto": 2,
        "no-return-assign": 2,
        "no-self-compare": 2,
        "no-sequences": 2,
        "no-shadow": [2, { builtinGlobals: true, allow: ["URL"] }],
        "no-spaced-func": 2,
        "no-this-before-super": 2,
        "no-throw-literal": 2,
        "no-trailing-spaces": 2,
        "no-unneeded-ternary": 2,
        "no-unused-expressions": 2,
        "no-use-before-define": [2, "nofunc"],
        "no-var": 2,
        "no-void": 2,
        "no-with": 2,
        "object-curly-newline": ["error", { multiline: true, consistent: true }],
        "object-curly-spacing": [2, "always"],
        "object-property-newline": [
            "error",
            { allowAllPropertiesOnSameLine: true }
        ],
        "object-shorthand": ["error", "always"],
        "one-var": [2, "never"],
        "operator-linebreak": [2, "after"],
        "quote-props": [2, "consistent-as-needed"],
        quotes: [2, "single", "avoid-escape"],
        "prefer-const": 2,
        "prefer-spread": 2,
        "prefer-template": 2,
        radix: 2,
        "rest-spread-spacing": [2, "never"],
        "require-atomic-updates": 0,
        "require-yield": 2,
        semi: [2, "always"],
        "semi-spacing": 2,
        "sort-vars": 2,
        "sort-imports-es6-autofix/sort-imports-es6": [
            2,
            {
                ignoreCase: true,
                ignoreMemberSort: false,
                memberSyntaxSortOrder: ["none", "all", "multiple", "single"]
            }
        ],
        "space-before-blocks": [2, "always"],
        "space-before-function-paren": [2, "never"],
        "space-in-parens": ["error", "never"],
        "space-infix-ops": 2,
        "space-unary-ops": 2,
        "spaced-comment": [2, "always"],
        "wrap-iife": 2,
        "valid-jsdoc": 1,
        yoda: 2,
        "arca/import-align": 2
    }
};
