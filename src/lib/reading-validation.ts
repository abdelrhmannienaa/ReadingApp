export function getReadingEntryError(input: {
  minutes: number;
  page: number;
  currentPage: number;
  pageCount: number | null;
}): string | null {
  const { currentPage, minutes, page, pageCount } = input;

  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
    return "Enter how many minutes you read.";
  }
  if (!Number.isInteger(page) || page < 0) {
    return "Enter the page number you reached.";
  }
  if (page < currentPage) {
    return "Page reached cannot be earlier than your current page.";
  }
  if (pageCount !== null && page > pageCount) {
    return `This book only has ${pageCount} pages.`;
  }

  return null;
}
