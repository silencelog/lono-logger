const pinoHttp = require('pino-http');

function logger(opts, stream) {
  const wrap = pinoHttp(opts, stream);

  function pino(ctx, next) {
    wrap(ctx.req, ctx.res);
    ctx.log = ctx.request.log = ctx.response.log = ctx.req.log;
    return next().catch(function (err) {
      ctx.log.error({
        err
      });
      throw err;
    });
  }

  pino.logger = wrap.logger;
  return pino;
}

class LodeLogger {
  constructor(opt) {
    this.isLode = true;
    this.opt = opt;
  }

  install(lode) {
    const opt = this.opt || lode.$config.logger;
    lode.use(logger(opt));
    return async function (ctx, next) {
      ctx.log.info('test');
      await next();
    };
  }

}

module.exports = function (...agr) {
  return new LodeLogger(...agr);
};