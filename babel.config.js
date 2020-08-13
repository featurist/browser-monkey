module.exports = {
  "presets": [
    "@babel/preset-react",
    [
      "@babel/preset-env",
      {
        "targets": {
          // "ie": "10"
          "node": true
        }
      }
    ]
  ]
}
