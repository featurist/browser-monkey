var expressApp = (require('express'))();
expressApp.get('/api/frameworks', (req, res) => {
  res.json([
    'browser-monkey',
    'hyperdom',
    'vinehill',
  ]);
});

module.exports = expressApp;
