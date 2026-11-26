// Minimal RFC 4180 CSV encode/decode. No dependency is pulled in for this —
// the format needed (comma-separated, double-quote escaping) is small
// enough to hand-write and test directly.

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(encodeCsvField).join(",")).join("\r\n");
}

// Formula-injection guard: Excel/Google Sheets treat a cell starting with
// =, +, -, @, tab or CR as a formula when the file is opened. Prefixing
// with an apostrophe forces spreadsheet apps to read it as plain text
// instead. Only leading spaces are stripped before the check (so " =1+1"
// isn't missed, since Excel itself ignores leading spaces before a
// formula) — tab/CR are left in place so a value that leads with one of
// those is still caught by the same check rather than being trimmed away
// first. This is one-way hardening for export only — parseCsv never strips
// this prefix back off, since import must round-trip exactly what the user
// typed.
const FORMULA_TRIGGER_CHARS = /^[=+\-@\t\r]/;

function encodeCsvField(value: string): string {
  const needsFormulaGuard = FORMULA_TRIGGER_CHARS.test(
    value.replace(/^ +/, ""),
  );
  const safeValue = needsFormulaGuard ? `'${value}` : value;
  if (/[",\r\n]/.test(safeValue)) {
    return `"${safeValue.replace(/"/g, '""')}"`;
  }
  return safeValue;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        inQuotes = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      i += 1;
      continue;
    }
    if (char === "\r") {
      i += 1;
      continue;
    }
    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/** Parses a CSV with a header row into an array of header→value objects. */
export function parseCsvWithHeader(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.trim());
  return rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    header.forEach((key, index) => {
      record[key] = (row[index] ?? "").trim();
    });
    return record;
  });
}
