"use client";

import {
  ArcElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend);

type UsageChartProps = {
  labels: string[];
  values: number[];
};

export function UsageChart({ labels, values }: UsageChartProps) {
  return (
    <Line
      data={{
        labels,
        datasets: [
          {
            label: "Env commits",
            data: values,
            borderColor: "rgba(212, 165, 116, 0.95)",
            backgroundColor: "rgba(212, 165, 116, 0.18)",
            tension: 0.35,
          },
        ],
      }}
      options={{
        responsive: true,
        plugins: {
          legend: {
            labels: { color: "#c8d2ce" },
          },
        },
        scales: {
          x: {
            ticks: { color: "#8d9a95" },
            grid: { color: "rgba(212, 165, 116, 0.18)" },
          },
          y: {
            ticks: { color: "#8d9a95" },
            grid: { color: "rgba(212, 165, 116, 0.18)" },
          },
        },
      }}
    />
  );
}
