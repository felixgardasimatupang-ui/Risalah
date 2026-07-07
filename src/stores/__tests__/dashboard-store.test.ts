import { describe, it, expect, beforeEach } from "vitest";
import { useDashboardStore, type WidgetConfig } from "../dashboard-store";

describe("DashboardStore", () => {
  beforeEach(() => {
    useDashboardStore.setState({ widgets: [] });
  });

  it("should toggle widget visibility", () => {
    const w: WidgetConfig = { id: "stat-cards", title: "Stats", description: "", visible: true, order: 0, size: "full" };
    useDashboardStore.setState({ widgets: [w] });

    useDashboardStore.getState().toggleWidget("stat-cards");
    expect(useDashboardStore.getState().widgets[0].visible).toBe(false);

    useDashboardStore.getState().toggleWidget("stat-cards");
    expect(useDashboardStore.getState().widgets[0].visible).toBe(true);
  });

  it("should reorder widgets", () => {
    const widgets: WidgetConfig[] = [
      { id: "stat-cards", title: "A", description: "", visible: true, order: 0, size: "full" },
      { id: "meeting-trend", title: "B", description: "", visible: true, order: 1, size: "full" },
      { id: "participant-bars", title: "C", description: "", visible: true, order: 2, size: "full" },
    ];
    useDashboardStore.setState({ widgets });

    useDashboardStore.getState().reorderWidgets(0, 2);
    const result = useDashboardStore.getState().widgets;
    expect(result[0].id).toBe("meeting-trend");
    expect(result[1].id).toBe("participant-bars");
    expect(result[2].id).toBe("stat-cards");
  });

  it("should reset to default widgets", () => {
    useDashboardStore.getState().resetWidgets();
    const result = useDashboardStore.getState().widgets;
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].id).toBe("stat-cards");
    expect(result.find((w) => w.id === "ai-insights")?.visible).toBe(false);
  });
});
