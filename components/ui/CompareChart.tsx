"use client";

import { useEffect, useRef } from "react";
import type { EquityCurvePoint } from "@/lib/backtester";

interface CompareChartProps {
  seriesA: EquityCurvePoint[];
  seriesB: EquityCurvePoint[];
  labelA: string;
  labelB: string;
  height?: number;
}

export default function CompareChart({
  seriesA,
  seriesB,
  labelA,
  labelB,
  height = 380,
}: CompareChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current || seriesA.length === 0 || seriesB.length === 0)
      return;

    let mounted = true;

    async function initChart() {
      const lc = await import("lightweight-charts");
      if (!mounted || !containerRef.current) return;

      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }

      const chart = lc.createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height,
        layout: {
          background: { color: "#0F0F17" },
          textColor: "#555",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(255,255,255,0.03)" },
          horzLines: { color: "rgba(255,255,255,0.03)" },
        },
        crosshair: {
          vertLine: { color: "rgba(0, 212, 255, 0.3)", width: 1, style: 2 },
          horzLine: { color: "rgba(0, 212, 255, 0.3)", width: 1, style: 2 },
        },
        rightPriceScale: { borderColor: "rgba(255,255,255,0.06)" },
        timeScale: {
          borderColor: "rgba(255,255,255,0.06)",
          timeVisible: false,
        },
      });

      chartInstanceRef.current = chart;

      const areaOptionsA = {
        lineColor: "#00D4FF",
        topColor: "rgba(0, 212, 255, 0.12)",
        bottomColor: "rgba(0, 212, 255, 0.0)",
        lineWidth: 2 as const,
        title: labelA,
      };

      const lineOptionsB = {
        color: "#F59E0B",
        lineWidth: 2 as const,
        lineStyle: 0,
        title: labelB,
      };

      const benchmarkOptions = {
        color: "rgba(255, 255, 255, 0.15)",
        lineWidth: 1 as const,
        lineStyle: 2,
        title: "S&P 500",
      };

      type SimpleSetData = { setData: (d: { time: string; value: number }[]) => void };

      let seriesAChart: SimpleSetData;
      let seriesBChart: SimpleSetData;
      let benchmarkChart: SimpleSetData;

      if ("AreaSeries" in lc) {
        seriesAChart = chart.addSeries(
          lc.AreaSeries as Parameters<typeof chart.addSeries>[0],
          areaOptionsA
        );
        seriesBChart = chart.addSeries(
          lc.LineSeries as Parameters<typeof chart.addSeries>[0],
          lineOptionsB
        );
        benchmarkChart = chart.addSeries(
          lc.LineSeries as Parameters<typeof chart.addSeries>[0],
          benchmarkOptions
        );
      } else {
        const c = chart as unknown as {
          addAreaSeries: (opts: typeof areaOptionsA) => SimpleSetData;
          addLineSeries: (opts: typeof lineOptionsB | typeof benchmarkOptions) => SimpleSetData;
        };
        seriesAChart = c.addAreaSeries(areaOptionsA);
        seriesBChart = c.addLineSeries(lineOptionsB);
        benchmarkChart = c.addLineSeries(benchmarkOptions);
      }

      seriesAChart.setData(
        seriesA.map((d) => ({ time: d.date, value: d.portfolioValue }))
      );
      seriesBChart.setData(
        seriesB.map((d) => ({ time: d.date, value: d.portfolioValue }))
      );
      // Use seriesA's benchmark (both represent the same SPY over same period)
      benchmarkChart.setData(
        seriesA.map((d) => ({ time: d.date, value: d.benchmarkValue }))
      );

      chart.timeScale().fitContent();

      const handleResize = () => {
        if (containerRef.current) {
          chart.applyOptions({ width: containerRef.current.clientWidth });
        }
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }

    const cleanup = initChart();

    return () => {
      mounted = false;
      cleanup?.then?.((fn) => fn?.());
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [seriesA, seriesB, labelA, labelB, height]);

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
  );
}
