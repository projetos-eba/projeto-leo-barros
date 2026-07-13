import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FinancialPlanChart, RevenueTrendChart } from "./admin-financial-charts";

let measuredWidth = 336;

class MockResizeObserver implements ResizeObserver {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    Object.defineProperty(target, "getBoundingClientRect", {
      configurable: true,
      value: () => ({
        bottom: 0,
        height: 220,
        left: 0,
        right: measuredWidth,
        toJSON: () => ({}),
        top: 0,
        width: measuredWidth,
        x: 0,
        y: 0,
      }),
    });
    this.callback([], this);
  }

  unobserve() {}

  disconnect() {}

  takeRecords() {
    return [];
  }
}

const longPlanName = "Plano Completo - Nutricao + Treinamento + Acompanhamento";

const data = [
  {
    color: "#2d9cff",
    count: 12,
    label: longPlanName,
    percent: 100,
    value: 12,
  },
];

const revenueData = [
  { label: "jan/26", mrr: 120, newRevenue: 24 },
  { label: "fev/26", mrr: 132, newRevenue: 18 },
  { label: "mar/26", mrr: 141, newRevenue: 32 },
];

describe("RevenueTrendChart", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("respeita a largura medida em containers estreitos", async () => {
    measuredWidth = 234;
    render(<RevenueTrendChart data={revenueData} />);

    const chart = screen.getByTestId("revenue-trend-chart");

    await waitFor(() => {
      expect(chart.querySelector("svg")).toHaveAttribute("width", "234");
    });
  });
});

describe("FinancialPlanChart", () => {
  beforeEach(() => {
    vi.stubGlobal("ResizeObserver", MockResizeObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("empilha grafico e legenda em containers estreitos", async () => {
    measuredWidth = 336;
    render(<FinancialPlanChart data={data} />);

    const chart = screen.getByTestId("financial-plan-chart");

    await waitFor(() => {
      expect(chart).toHaveAttribute("data-layout", "stacked");
    });

    expect(screen.getByText(longPlanName)).toHaveAttribute("title", longPlanName);
    expect(screen.getAllByText("12").length).toBeGreaterThan(0);
  });

  it("usa layout horizontal apenas quando ha largura interna suficiente", async () => {
    measuredWidth = 560;
    render(<FinancialPlanChart data={data} />);

    await waitFor(() => {
      expect(screen.getByTestId("financial-plan-chart")).toHaveAttribute(
        "data-layout",
        "horizontal",
      );
    });
  });
});
