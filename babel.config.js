module.exports = {
  "presets": [
    "@babel/preset-typescript",
    "@babel/preset-react",
    [
      "@babel/preset-env",
      {
        "targets": {
          "ie": "10"
        }
      }
    ]
  ]
}
