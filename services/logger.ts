type LogArg = unknown;

function write(method: 'log' | 'info' | 'warn' | 'error', ...args: LogArg[]) {
  if (!__DEV__) {
    return;
  }

  console[method](...args);
}

export const logger = {
  debug: (...args: LogArg[]) => write('log', ...args),
  info: (...args: LogArg[]) => write('info', ...args),
  warn: (...args: LogArg[]) => write('warn', ...args),
  error: (...args: LogArg[]) => write('error', ...args),
};
