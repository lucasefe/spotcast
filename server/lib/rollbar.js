const Rollbar = require("rollbar");
Rollbar.configure({
  enabled: process.env.NODE_ENV === 'production'
});

const rollbar = new Rollbar({
  accessToken: '05e603c0cf2e421f89fee70dfb6a92e4',
  captureUncaught: true,
  captureUnhandledRejections: true,
  enabled: process.env.NODE_ENV === 'production'
});

module.exports = rollbar