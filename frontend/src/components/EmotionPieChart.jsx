import React from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function EmotionPieChart({ emotions }) {
  const labels = emotions.map(e => e.label);
  const dataPoints = emotions.map(e => Math.round(e.score * 100));
  const backgroundColors = [
    "#E53E3E", // red
    "#D69E2E", // yellow
    "#38A169", // green
    "#3182CE", // blue
    "#805AD5"  // purple
  ].slice(0, labels.length);

  const data = {
    labels,
    datasets: [
      {
        data: dataPoints,
        backgroundColor: backgroundColors,
        borderWidth: 1
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: "right" }
    }
  };

  return <Pie data={data} options={options} />;
}
