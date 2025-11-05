import React, { useEffect } from 'react';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';

interface SkillRadarChartProps {
  skills: { name: string; level: number }[];
}

// Register the required components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

const SkillRadarChart: React.FC<SkillRadarChartProps> = ({ skills }) => {
  // Force re-register components when the component mounts
  useEffect(() => {
    ChartJS.register(
      RadialLinearScale,
      PointElement,
      LineElement,
      Filler,
      Tooltip,
      Legend
    );
  }, []);

  // Placeholder si Chart.js n'est pas installé
  if (!skills || skills.length === 0) {
    return <div className="bg-gray-100 rounded-lg p-8 text-center text-gray-400">No skills to display</div>;
  }

  // Préparer les données pour Chart.js
  const data = {
    labels: skills.map((s) => s.name),
    datasets: [
      {
        label: 'Niveau',
        data: skills.map((s) => s.level),
        backgroundColor: 'rgba(139,92,246,0.2)',
        borderColor: 'rgba(139,92,246,1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(139,92,246,1)',
      },
    ],
  };

  const options = {
    scales: {
      r: {
        angleLines: {
          display: true
        },
        beginAtZero: true,
        min: 0,
        max: 5,
        ticks: {
          stepSize: 1
        }
      }
    },
    plugins: {
      legend: { display: false },
    },
    responsive: true,
    maintainAspectRatio: false,
  };

  return (
    <div style={{ height: 320 }}>
      <Radar data={data} options={options} />
    </div>
  );
};

export default SkillRadarChart; 