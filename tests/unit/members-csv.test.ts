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

  describe("CSV injection guard (export hardening)", () => {
    it.each([
      ["=1+1", "'=1+1"],
      ["+1+1", "'+1+1"],
      ["-1+1", "'-1+1"],
      ["@SUM(A1:A2)", "'@SUM(A1:A2)"],
    ])(
      "prefixes a value starting with %j with an apostrophe",
      (value, expected) => {
        const csv = toCsv([[value]]);
        expect(csv).toBe(expected);
      },
    );

    it("leaves a normal value unchanged", () => {
      const csv = toCsv([["Jane Doe"]]);
      expect(csv).toBe("Jane Doe");
    });

    it("does not flag a value that merely contains, but doesn't start with, a trigger char", () => {
      const csv = toCsv([["Total = 5"]]);
      expect(csv).toBe("Total = 5");
    });

    it("catches a formula hidden behind leading spaces", () => {
      const csv = toCsv([["  =1+1"]]);
      expect(csv).toBe("'  =1+1");
    });

    // Export round-trip note: the apostrophe guard is intentionally one-way
    // hardening, not reversible import logic. Re-parsing exported CSV with
    // parseCsv gives back the value WITH its leading apostrophe
    // (`'=1+1`, not `=1+1`) — that's expected and correct, since
    // parseCsv/importMembersCsv must round-trip exactly what a user typed
    // (a name genuinely starting with "-" must import unchanged), and can't
    // tell a defensively-added apostrophe apart from one a user typed
    // themselves.
    it("round-trips the guarded value as-is (prefix is not stripped back off on parse)", () => {
      const csv = toCsv([["=1+1"]]);
      expect(parseCsv(csv)).toEqual([["'=1+1"]]);
    });

    it("does not alter a value starting with '-' on parseCsv (import stays exact)", () => {
      const csv = "name\n-5 Reps Club";
      expect(parseCsvWithHeader(csv)).toEqual([{ name: "-5 Reps Club" }]);
    });
  });
});
