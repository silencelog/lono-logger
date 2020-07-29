'use strict'

const pinoHttp = require('pino-http')

function logger (opts, stream) {
  const wrap = pinoHttp(opts, stream)
  function pino (ctx, next) {
    wrap(ctx.req, ctx.res)
    ctx.log = ctx.request.log = ctx.response.log = ctx.req.log
    return next().catch(function (err) {
      ctx.log.error({ err })
      throw err
    })
  }
  pino.logger = wrap.logger
  return pino
}

// TODO 异常关闭输出日志
// process.on('uncaughtException', pinoHttp.final(logger, (err, finalLogger) => {
//   finalLogger.error(err, 'uncaughtException')
//   process.exit(1)
// }))

// process.on('unhandledRejection', pinoHttp.final(logger, (err, finalLogger) => {
//   finalLogger.error(err, 'unhandledRejection')
//   process.exit(1)
// }))

// process.on('unhandledRejection', (reason, promise) => {
//   console.warn('未处理的拒绝：', promise, '原因：', reason)
//   // 记录日志、抛出错误、或其他逻辑。
// })

class LodeLogger {
  constructor (opt) {
    this.isLode = true
    this.opt = opt
  }
  install (lode) {
    const opt = this.opt || (lode.$config && lode.$config.logger)
    lode.use(logger(opt))
    // return async function (ctx, next) {
    //   await next()
    // }
  }
}

module.exports = function (...agr) {
  return new LodeLogger(...agr)
}
