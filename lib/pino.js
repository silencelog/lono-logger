'use strict'

import pinoHttp from 'pino-http'

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

class Logger {
  constructor (opt) {
    this.isLono = true
    this.opt = opt
  }
  install (app) {
    const opt = this.opt || (app.$config && app.$config.logger)
    app.use(logger(opt))
    // return async function (ctx, next) {
    //   await next()
    // }
  }
}

export default function (...agr) {
  return new Logger(...agr)
}
