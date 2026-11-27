export type TokenType = 'comment' | 'string' | 'number' | 'keyword' | 'type' | 'fn' | 'plain';

export interface Token {
  type: TokenType;
  text: string;
}

const KEYWORDS = new Set([
  'import', 'export', 'from', 'function', 'const', 'let', 'var', 'return', 'if', 'else',
  'for', 'while', 'async', 'await', 'new', 'throw', 'try', 'catch', 'type', 'interface',
  'as', 'of', 'in', 'default', 'class', 'extends', 'null', 'undefined', 'true', 'false',
]);

// Groups: 1 comment, 2 string, 3 number, 4 identifier. Anything else is plain text.
const PATTERN =
  /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|(\b\d[\d_]*(?:\.\d+)?\b)|([A-Za-z_$][\w$]*)|([\s\S])/g;

/** A tiny single-line highlighter, just enough for the landing page demo. */
export function highlight(line: string): Token[] {
  const tokens: Token[] = [];

  for (const match of line.matchAll(PATTERN)) {
    const [text, comment, str, num, ident] = match;
    let type: TokenType = 'plain';

    if (comment) type = 'comment';
    else if (str) type = 'string';
    else if (num) type = 'number';
    else if (ident) {
      const next = line[(match.index ?? 0) + text.length];
      if (KEYWORDS.has(ident)) type = 'keyword';
      else if (/^[A-Z]/.test(ident)) type = 'type';
      else if (next === '(') type = 'fn';
    }

    // Merge neighbouring plain characters so the DOM stays small.
    const last = tokens[tokens.length - 1];
    if (type === 'plain' && last?.type === 'plain') last.text += text;
    else tokens.push({ type, text });
  }

  return tokens;
}
