const isDev = import.meta.env.DEV

export const logger = {
  log: (...args) => {
    if (isDev) console.log(...args)
  },
  error: (...args) => {
    if (isDev) console.error(...args)
    // In production, you can send to error tracking service like Sentry
  },
  warn: (...args) => {
    if (isDev) console.warn(...args)
  },
  info: (...args) => {
    if (isDev) console.info(...args)
  }
}

export default logger
