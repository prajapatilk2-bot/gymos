import { describe, expect, it } from "vitest";

import {
  parseCsv,
  parseCsvWithHeader,
  toCsv,
} from "@/server/modules/members/csv";

describe("members csv helpers", () => {
  it("round-trips plain fields", () => {
    const rows = [
      ["name", "mobile"],
      ["Jane Doe", "9876543210"],
    ];
    const csv = toCsv(rows);
    expect(parseCsv(csv)).toEqual(rows);
  });

  it("quotes fields containing commas, quotes and newlines", () => {
    const rows = [
      ["name", "notes"],
      ["Jane, Doe", 'Said "hello"\nagain'],
    ];
    const csv = toCsv(rows);
    expect(csv).toContain('"Jane, Doe"');
    expect(parseCsv(csv)).toEqual(rows);
  });

  it("parses a CSV with a header row into records", () => {
    const csv =
      "name,mobile,email\nJane Doe,9876543210,jane@example.com\nJohn,111,";
    expect(parseCsvWithHeader(csv)).toEqual([
      { name: "Jane Doe", mobile: "9876543210", email: "jane@example.com" },
      { name: "John", mobile: "111", email: "" },
    ]);
  });

  it("returns an empty array for empty input", () => {
    expect(parseCsvWithHeader("")).toEqual([]);
  });
});
