'use strict'

const winston = require('winston')
const onFinished = require('on-finished')
const { format } = require('util')

const CONTEXT_LOGGER = Symbol('context#logger')

const C = {
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  MSG: 'HTTP %s %s',
}

const defaultLevel = C.INFO

const getLogLevel = (statusCode = 200, defaultLevel = C.INFO) => {
  switch (Math.floor(statusCode / 100)) {
    case 5:
      return C.ERROR;
    case 4:
      return C.WARN;
    default:
      return defaultLevel;
  }
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
    this.opt = {
      msg: C.MSG,
      level: C.INFO,
      ...opt
    }
  }
  install (app) {
    if (app.context.hasOwnProperty(CONTEXT_LOGGER)) return
    const opt = Object.assign(Object.create(null), this.opt, app.$config && app.$config.logger)
    const winstonLogger = winston.createLogger({
      level: opt.level,
      format: winston.format.json(),
      defaultMeta: { service: 'user-service' },
      transports: [
        new winston.transports.Stream({ stream: process.stdout })
      ]
    })

    if (opt.path) {
      winstonLogger.add(new winston.transports.File({ filename: `${opt.path}error.log`, level: 'error' }))
      winstonLogger.add(new winston.transports.File({ filename: `${opt.path}log.log`}))
    }

    if (process.env.LONO_RUN_ENV === 'development' || opt.console) {
      winstonLogger.add(new winston.transports.Console({
        format: winston.format.simple(),
      }))
    }

    const onResponseFinished = (ctx, info) => {
      info.res = ctx.response;
      info.duration = Date.now() - info.started_at

      info.level = getLogLevel(info.res.status, defaultLevel)
      // @ts-ignore
      winstonLogger.log(info)
    }

    Object.defineProperties(app.context, {
      [CONTEXT_LOGGER]: {
        value: winstonLogger,
        writable: false
      },
      'logger': {
        value: winstonLogger,
        writable: false
      }
    })
    return  async (ctx, next) => {
      const info = {
        req: ctx.request,
        started_at: Date.now()
      }
      info.message = format(opt.msg, info.req.method, info.req.url)
      let error
      try {
        await next()
      } catch (e) {
        // catch and throw it later
        error = e
      } finally {
        onFinished(ctx.response, onResponseFinished.bind(null, ctx, info))
      }

      if (error) {
        throw error
      }
    }
  }
  getLogLevel (...agr) {
    return getLogLevel(...agr)
  }
}

export default function (...agr) {
  return new Logger(...agr)
}
