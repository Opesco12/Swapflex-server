const bunyan = require("bunyan");

const logger = bunyan.createLogger({
  name: "swapflex",
  streams: [
    {
      level: "info",
      stream: process.stdout,
    },
    { level: "error", path: "error.log " },
  ],
});

module.exports = logger;
