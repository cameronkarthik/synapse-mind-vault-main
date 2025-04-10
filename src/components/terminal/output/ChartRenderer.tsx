
import React from 'react';
import { 
  ChartContainer,
  ChartTooltipContent
} from '@/components/ui/chart';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface ChartData {
  title?: string;
  type: 'bar' | 'line';
  data: Array<{
    name: string;
    value: number;
  }>;
}

interface ChartRendererProps {
  charts: ChartData[];
}

const ChartRenderer: React.FC<ChartRendererProps> = ({ charts }) => {
  if (!charts || charts.length === 0) {
    return null;
  }

  return (
    <>
      {charts.map((chart, chartIndex) => (
        <div key={`chart-${chartIndex}`} className="my-4 bg-gray-900 rounded-lg p-2 border border-gray-700">
          <h3 className="text-base font-semibold mb-2 text-syndicate-purple">{chart.title || 'Data Visualization'}</h3>
          <ChartContainer className="h-64 w-full" config={{ data: { label: 'Data', color: '#8B5CF6' } }}>
            {chart.type === 'bar' ? (
              <BarChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="value" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chart.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis dataKey="name" stroke="#aaa" />
                <YAxis stroke="#aaa" />
                <Tooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            )}
          </ChartContainer>
        </div>
      ))}
    </>
  );
};

export default ChartRenderer;
