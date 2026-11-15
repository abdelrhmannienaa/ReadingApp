import { logReadingSession, type CurrentRead } from "@/api";
import { supabase } from "@/lib/supabase";

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: { getUser: jest.fn() },
    from: jest.fn(),
  },
}));

const mockGetUser = supabase.auth.getUser as jest.Mock;
const mockFrom = supabase.from as jest.Mock;

const book: CurrentRead = {
  book_id: "book-1",
  title: "A Test Book",
  author: "Test Author",
  cover_url: null,
  page_count: 300,
  current_page: 10,
  status: "reading",
};

describe("logReadingSession system flow", () => {
  const userBooks = {
    update: jest.fn(),
    eq: jest.fn(),
    select: jest.fn(),
  };
  const sessions = { insert: jest.fn() };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 10, 15, 12));
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: "reader-1" } }, error: null });
    userBooks.update.mockReturnValue(userBooks);
    userBooks.eq.mockReturnValue(userBooks);
    userBooks.select.mockResolvedValue({ data: [{ book_id: "book-1" }], error: null });
    sessions.insert.mockResolvedValue({ error: null });
    mockFrom.mockImplementation((table: string) =>
      table === "user_books" ? userBooks : sessions,
    );
  });

  afterEach(() => jest.useRealTimers());

  test("updates progress then records a dated reading session", async () => {
    await logReadingSession({ book, minutes: 25, page: 42 });

    expect(userBooks.update).toHaveBeenCalledWith({
      current_page: 42,
      status: "reading",
    });
    expect(sessions.insert).toHaveBeenCalledWith({
      user_id: "reader-1",
      book_id: "book-1",
      minutes: 25,
      page_reached: 42,
      read_on: "2026-11-15",
    });
  });

  test("marks a book finished when the submitted page reaches its total", async () => {
    await logReadingSession({ book, minutes: 15, page: 300 });

    expect(userBooks.update).toHaveBeenCalledWith({
      current_page: 300,
      status: "finished",
    });
    expect(sessions.insert).toHaveBeenCalledTimes(1);
  });
});
