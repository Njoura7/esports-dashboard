// Minimal structured logging. Good enough for an MVP running on Vercel's log stream —
// upgrade to pino/similar only if log volume actually becomes a problem.

type Fields = Record<string, unknown>;

function line(level: string, msg: string, fields?: Fields) {
  const ts = new Date().toISOString();
  const suffix = fields ? " " + JSON.stringify(fields) : "";
  return `[${ts}] ${level} ${msg}${suffix}`;
}

// Node/ws errors (e.g. the Neon driver's WebSocket layer) often aren't real Error instances —
// they're plain objects or DOM-style ErrorEvents where the useful bits are .message/.error/.code.
// A bare String(err) on those gives you "[object Object]", which is useless in the logs.
function describeError(err: unknown): Fields {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, cause: err.cause ? String(err.cause) : undefined };
  }
  if (err && typeof err === "object") {
    const obj = err as Record<string, unknown>;
    const message = obj.message ?? (obj.error instanceof Error ? obj.error.message : obj.error);
    return {
      type: obj.type,
      message: message ?? undefined,
      code: obj.code,
    };
  }
  return { raw: String(err) };
}

export const logger = {
  info(msg: string, fields?: Fields) {
    console.log(line("INFO ", msg, fields));
  },
  warn(msg: string, fields?: Fields) {
    console.warn(line("WARN ", msg, fields));
  },
  error(msg: string, err: unknown, fields?: Fields) {
    console.error(line("ERROR", msg, { ...fields, ...describeError(err) }));
  },
};
