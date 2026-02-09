/**
 * Logger utility for development and production
 * Only logs in development mode to avoid console clutter in production
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
  /**
   * Logs messages only in development mode
   * @param {...any} args - Arguments to log
   */
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },

  /**
   * Logs warnings (always shown, but can be filtered)
   * @param {...any} args - Arguments to log
   */
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },

  /**
   * Logs errors (always shown for debugging)
   * @param {...any} args - Arguments to log
   */
  error: (...args) => {
    console.error(...args);
    // In production, you might want to send this to an error tracking service
    // e.g., Sentry, LogRocket, etc.
  },

  /**
   * Logs debug messages (only in development)
   * @param {...any} args - Arguments to log
   */
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },

  /**
   * Logs info messages (only in development)
   * @param {...any} args - Arguments to log
   */
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

export default logger;
