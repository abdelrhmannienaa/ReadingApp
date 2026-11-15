import { fireEvent, render, waitFor } from "@testing-library/react-native";
import { setDailyGoal } from "@/api";
import { GoalSheet } from "../goal-sheet";

jest.mock("@/api", () => ({ setDailyGoal: jest.fn() }));

const mockSetDailyGoal = setDailyGoal as jest.Mock;

describe("GoalSheet", () => {
  beforeEach(() => jest.clearAllMocks());

  test("shows a visible validation message instead of saving an invalid goal", async () => {
    const view = await render(
      <GoalSheet currentGoal={null} onClose={jest.fn()} onSaved={jest.fn()} />,
    );

    await fireEvent.changeText(view.getByLabelText("Daily goal in minutes"), "0");
    await fireEvent.press(view.getByRole("button", { name: "Save Goal" }));

    expect(view.getByText("Enter a goal between 1 and 1440 minutes.")).toBeTruthy();
    expect(mockSetDailyGoal).not.toHaveBeenCalled();
  });

  test("lets a reader select a preset and save the daily goal", async () => {
    const onSaved = jest.fn();
    mockSetDailyGoal.mockResolvedValue(undefined);
    const view = await render(
      <GoalSheet currentGoal={null} onClose={jest.fn()} onSaved={onSaved} />,
    );

    await fireEvent.press(view.getByRole("button", { name: "30 min" }));
    await fireEvent.press(view.getByRole("button", { name: "Save Goal" }));

    await waitFor(() => expect(mockSetDailyGoal).toHaveBeenCalledWith(30));
    expect(onSaved).toHaveBeenCalledTimes(1);
  });
});
