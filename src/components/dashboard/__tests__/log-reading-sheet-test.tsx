import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { logReadingSession } from "@/api";
import { LogReadingSheet } from "../log-reading-sheet";

jest.mock("@/api", () => ({ logReadingSession: jest.fn() }));

const mockLogReadingSession = logReadingSession as jest.Mock;

const book = {
  book_id: "book-1",
  title: "A Test Book",
  author: "Test Author",
  cover_url: null,
  page_count: 100,
  current_page: 8,
  status: "reading",
};

describe("LogReadingSheet", () => {
  beforeEach(() => jest.clearAllMocks());

  test("shows a validation error when a reader enters a page past the book end", async () => {
    const view = await render(
      <LogReadingSheet book={book} onClose={jest.fn()} onLogged={jest.fn()} />,
    );

    await fireEvent.changeText(view.getByLabelText("Minutes read"), "15");
    await fireEvent.changeText(view.getByLabelText("Page reached"), "101");
    await fireEvent.press(view.getByRole("button", { name: "Save" }));

    expect(view.getByText("This book only has 100 pages.")).toBeTruthy();
    expect(mockLogReadingSession).not.toHaveBeenCalled();
  });

  test("logs a reading session from the quick-minute control", async () => {
    const onLogged = jest.fn();
    mockLogReadingSession.mockResolvedValue(undefined);
    const view = await render(
      <LogReadingSheet book={book} onClose={jest.fn()} onLogged={onLogged} />,
    );

    await fireEvent.press(view.getByRole("button", { name: "15 min" }));
    await fireEvent.press(view.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(mockLogReadingSession).toHaveBeenCalledWith({
        book,
        minutes: 15,
        page: 8,
      }),
    );
    expect(onLogged).toHaveBeenCalledTimes(1);
  });
});
