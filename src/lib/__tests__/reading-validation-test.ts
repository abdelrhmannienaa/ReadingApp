import { getReadingEntryError } from "../reading-validation";

describe("getReadingEntryError", () => {
  const validInput = {
    minutes: 15,
    page: 20,
    currentPage: 8,
    pageCount: 100,
  };

  test("accepts a valid reading entry", () => {
    expect(getReadingEntryError(validInput)).toBeNull();
  });

  test("rejects a page earlier than the reader's saved progress", () => {
    expect(getReadingEntryError({ ...validInput, page: 7 })).toBe(
      "Page reached cannot be earlier than your current page.",
    );
  });

  test("rejects more than a day of reading", () => {
    expect(getReadingEntryError({ ...validInput, minutes: 1441 })).toBe(
      "Enter how many minutes you read.",
    );
  });
});
