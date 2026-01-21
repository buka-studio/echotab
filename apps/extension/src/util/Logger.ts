export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Silent = 4,
}

const levelColors: Record<LogLevel, string> = {
  [LogLevel.Debug]: "#9CA3AF",
  [LogLevel.Info]: "#3B82F6",
  [LogLevel.Warn]: "#F59E0B",
  [LogLevel.Error]: "#EF4444",
  [LogLevel.Silent]: "",
};

const levelLabels: Record<LogLevel, string> = {
  [LogLevel.Debug]: "DEBUG",
  [LogLevel.Info]: "INFO",
  [LogLevel.Warn]: "WARN",
  [LogLevel.Error]: "ERROR",
  [LogLevel.Silent]: "",
};

const DEFAULT_LEVEL = import.meta.env.PROD ? LogLevel.Warn : LogLevel.Debug;

export interface LoggerOptions {
  level?: LogLevel;
  namespace?: string;
  enabled?: boolean;
}

export class Logger {
  private level: LogLevel;
  private namespace: string;
  private enabled: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? DEFAULT_LEVEL;
    this.namespace = options.namespace ?? "";
    this.enabled = options.enabled ?? true;
  }

  private formatPrefix(level: LogLevel): string[] {
    const timestamp = new Date().toISOString().slice(11, 23);
    const label = levelLabels[level];
    const color = levelColors[level];
    const ns = this.namespace ? `[${this.namespace}]` : "";

    return [
      `%c${timestamp} %c${label}%c ${ns}`,
      "color: #6B7280",
      `color: ${color}; font-weight: bold`,
      "color: #A78BFA; font-weight: bold",
    ];
  }

  private log(level: LogLevel, ...args: unknown[]): void {
    if (!this.enabled || level < this.level) return;

    const [format, ...styles] = this.formatPrefix(level);
    const method =
      level === LogLevel.Error
        ? console.error
        : level === LogLevel.Warn
          ? console.warn
          : level === LogLevel.Debug
            ? console.debug
            : console.log;

    method(format, ...styles, ...args);
  }

  debug(...args: unknown[]): void {
    this.log(LogLevel.Debug, ...args);
  }

  info(...args: unknown[]): void {
    this.log(LogLevel.Info, ...args);
  }

  warn(...args: unknown[]): void {
    this.log(LogLevel.Warn, ...args);
  }

  error(...args: unknown[]): void {
    this.log(LogLevel.Error, ...args);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  child(namespace: string): Logger {
    const childNs = this.namespace ? `${this.namespace}:${namespace}` : namespace;
    return new Logger({
      level: this.level,
      namespace: childNs,
      enabled: this.enabled,
    });
  }
}

export const logger = new Logger();

export function createLogger(
  namespace: string,
  options?: Omit<LoggerOptions, "namespace">,
): Logger {
  return new Logger({ ...options, namespace });
}
