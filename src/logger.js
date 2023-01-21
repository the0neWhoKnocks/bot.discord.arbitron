const NAMESPACE = 'bot';
const ulog = require('ulog');
// NOTE: Overriding the log_format because of: https://github.com/Download/ulog/issues/68
ulog.config.log_format = 'lvl noPadName message';
ulog.use({
  use: [ require('ulog/mods/formats') ],
  formats: {
    noPadName: () => {
      const fmt = (rec) => rec.name;
      fmt.color = 'logger';
      return fmt;
    },
  },
});

const aL = require('anylogger');
const rootLogger = aL(NAMESPACE);

function logger(namespace = '', isCustom) {
  let _logger;
  
  if (isCustom) {
    _logger = aL(namespace);
  }
  else {
    _logger = (namespace)
      ? aL(`${NAMESPACE}:${namespace}`)
      : rootLogger;
  }
  
  return _logger;
}
logger.custom = (...args) => logger(...args, true);
  
module.exports = logger;
