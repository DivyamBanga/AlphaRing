"use client";

import { useEffect, useRef } from "react";
import type { EquityCurvePoint } from "@/lib/backtester";

interface EquityCurveProps {
  data: EquityCurvePoint[];
  height?: number;
}

export default function EquityCurve({ data, height = 350 }: EquityCurveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartInstanceRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (!containerRef.current || data.length === 0) return;

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
          vertLine: {
            color: "rgba(0, 212, 255, 0.3)",
            width: 1,
            style: 2,
          },
          horzLine: {
            color: "rgba(0, 212, 255, 0.3)",
            width: 1,
            style: 2,
          },
        },
        rightPriceScale: {
          borderColor: "rgba(255,255,255,0.06)",
        },
        timeScale: {
          borderColor: "rgba(255,255,255,0.06)",
          timeVisible: false,
        },
      });

      chartInstanceRef.current = chart;

      const areaOptions = {
        lineColor: "#00D4FF",
        topColor: "rgba(0, 212, 255, 0.15)",
        bottomColor: "rgba(0, 212, 255, 0.01)",
        lineWidth: 2 as const,
        title: "Portfolio",
      };

      const lineOptions = {
        color: "rgba(255, 255, 255, 0.2)",
        lineWidth: 1 as const,
        lineStyle: 2,
        title: "S&P 500",
      };

      let portfolioSeries: {
        setData: (d: { time: string; value: number }[]) => void;
      };
      let benchmarkSeries: {
        setData: (d: { time: string; value: number }[]) => void;
      };

      if ("AreaSeries" in lc) {
        portfolioSeries = chart.addSeries(
          lc.AreaSeries as Parameters<typeof chart.addSeries>[0],
          areaOptions
        );
        benchmarkSeries = chart.addSeries(
          lc.LineSeries as Parameters<typeof chart.addSeries>[0],
          lineOptions
        );
      } else {
        const c = chart as unknown as {
          addAreaSeries: (
            opts: typeof areaOptions
          ) => typeof portfolioSeries;
          addLineSeries: (
            opts: typeof lineOptions
          ) => typeof benchmarkSeries;
        };
        portfolioSeries = c.addAreaSeries(areaOptions);
        benchmarkSeries = c.addLineSeries(lineOptions);
      }

      portfolioSeries.setData(
        data.map((d) => ({ time: d.date, value: d.portfolioValue }))
      );

      benchmarkSeries.setData(
        data.map((d) => ({ time: d.date, value: d.benchmarkValue }))
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
  }, [data, height]);

  return (
    <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />
  );
}
