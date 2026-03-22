import { captureException, captureMessage } from '@/services/sentry';

type LogArg = unknown;

function write(method: 'log' | 'info' | 'warn' | 'error', ...args: LogArg[]) {
  if (__DEV__) {
    console[method](...args);
    return;
  }

  // In production, forward errors and warnings to Sentry
  if (method === 'error') {
    const first = args[0];
    if (first instanceof Error) {
      captureException(first, { extra: args.slice(1) });
    } else {
      captureException(new Error(String(first)), {
        extra: args.slice(1),
      });
    }
  } else if (method === 'warn') {
    captureMessage(String(args[0]), 'warning');
  }
}

export const logger = {
  debug: (...args: LogArg[]) => write('log', ...args),
  info: (...args: LogArg[]) => write('info', ...args),
  warn: (...args: LogArg[]) => write('warn', ...args),
  error: (...args: LogArg[]) => write('error', ...args),
};
