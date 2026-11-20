import { ALIAS, FIELD_TYPES, isAlias, type SourceToken, type TokenType } from "./schema";

export interface ResolvedToken extends Omit<SourceToken, "value"> {
  /** No aliases left. */
  value: unknown;
  /** The direct reference of a whole-value alias, e.g. "color.gray.900". */
  aliasOf?: string;
}

/** Sorted by path. */
export type Resolved = Map<string, ResolvedToken>;

export class TokenResolveError extends Error {
  override name = "TokenResolveError";
}

const refOf = (v: string) => (ALIAS.exec(v) as RegExpExecArray)[1] as string;
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Resolves every alias; later layers win per path. */
export function resolve(base: SourceToken[], ...overrides: SourceToken[][]): Resolved {
  const source = new Map<string, SourceToken>();
  for (const layer of [base, ...overrides]) for (const tok of layer) source.set(tok.path, tok);
  const done = new Map<string, ResolvedToken>();
  const stack: string[] = [];

  function deref(from: SourceToken, ref: string, expected?: TokenType): unknown {
    const target = source.get(ref);
    if (!target) throw new TokenResolveError(`${from.path}: unknown reference {${ref}}`);
    const resolved = visit(target);
    if (expected && resolved.type !== expected) {
      throw new TokenResolveError(
        `${from.path}: type mismatch, ${expected} aliases ${resolved.type} ${ref}`,
      );
    }
    return resolved.value;
  }

  function deep(from: SourceToken, v: unknown, fields?: Record<string, TokenType>): unknown {
    if (isAlias(v)) return deref(from, refOf(v));
    if (Array.isArray(v)) return v.map((x) => deep(from, x, fields));
    if (isRecord(v)) {
      return Object.fromEntries(
        Object.entries(v).map(([k, x]) => {
          const expected = fields?.[k];
          return [k, expected && isAlias(x) ? deref(from, refOf(x), expected) : deep(from, x)];
        }),
      );
    }
    return v;
  }

  function visit(tok: SourceToken): ResolvedToken {
    const hit = done.get(tok.path);
    if (hit) return hit;
    const at = stack.indexOf(tok.path);
    if (at >= 0) {
      throw new TokenResolveError(`alias cycle: ${[...stack.slice(at), tok.path].join(" → ")}`);
    }
    stack.push(tok.path);
    const whole = isAlias(tok.value);
    const value = whole
      ? deref(tok, refOf(tok.value as string), tok.type)
      : deep(tok, tok.value, FIELD_TYPES[tok.type]);
    stack.pop();
    const out: ResolvedToken = {
      ...tok,
      value,
      ...(whole ? { aliasOf: refOf(tok.value as string) } : {}),
    };
    done.set(tok.path, out);
    return out;
  }

  for (const path of [...source.keys()].sort()) visit(source.get(path) as SourceToken);
  return new Map([...done].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}
