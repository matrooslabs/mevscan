import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import PubNub from 'pubnub';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PUBNUB_CHANNELS } from '@mevscan/shared/constants';
import './Chart.css';
import { GrossMevDataResponse } from '@mevscan/shared';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Chart() {
  const pubnubRef = useRef<PubNub | null>(null);
  const [grossMevData, setGrossMevData] = useState<GrossMevDataResponse[]>([]);

  // Initialize PubNub and subscribe to channel
  useEffect(() => {
    const pubnub = new PubNub({
      subscribeKey: import.meta.env.VITE_PUBNUB_SUBSCRIBE_KEY || '',
      userId: 'chart-client',
    });

    pubnubRef.current = pubnub;

    // Subscribe to Gross MEV channel
    pubnub.subscribe({
      channels: [PUBNUB_CHANNELS.GROSS_MEV],
    });

    // Fetch historical messages on startup
    (async () => {
      try {
        const message = await pubnub.fetchMessages({
          channels: [PUBNUB_CHANNELS.GROSS_MEV],
          count: 360,
        });

        if (!message) {
          return;
        }

        const fetchedMessage = message.channels[PUBNUB_CHANNELS.GROSS_MEV];
        if (!fetchedMessage || fetchedMessage.length === 0) {
          return;
        }

        // Flatten all messages from all fetched messages
        const flattenedData = fetchedMessage.flatMap(msg =>
          (msg.message as unknown as GrossMevDataResponse[]) || []
        );

        // Sort by time first, then filter out duplicates by comparing with previous element
        const sortedData = flattenedData.sort((a, b) => a.time - b.time);
        const uniqueData: GrossMevDataResponse[] = [];
        for (let i = 0; i < sortedData.length; i++) {
          if (i === 0 || sortedData[i].time !== sortedData[i - 1].time) {
            uniqueData.push(sortedData[i]);
          }
        }

        setGrossMevData(uniqueData);
        console.log(`grossMevData: ${JSON.stringify(uniqueData)}`);
      } catch (error) {
        console.error('Error fetching messages from PubNub:', error);
      }
    })();

    // Cleanup on unmount
    return () => {
      pubnub.unsubscribe({
        channels: [PUBNUB_CHANNELS.GROSS_MEV],
      });
    };
  }, []);

  // Sample data for chart
  const sampleData: GrossMevDataResponse[] = [
    { time: Math.floor(Date.now() / 1000) - 3600, total: 12000, normal: 8000, timeboost: 4000 },
    { time: Math.floor(Date.now() / 1000) - 3300, total: 15000, normal: 10000, timeboost: 5000 },
    { time: Math.floor(Date.now() / 1000) - 3000, total: 18000, normal: 12000, timeboost: 6000 },
    { time: Math.floor(Date.now() / 1000) - 2700, total: 14000, normal: 9000, timeboost: 5000 },
    { time: Math.floor(Date.now() / 1000) - 2400, total: 16000, normal: 11000, timeboost: 5000 },
    { time: Math.floor(Date.now() / 1000) - 2100, total: 19000, normal: 13000, timeboost: 6000 },
    { time: Math.floor(Date.now() / 1000) - 1800, total: 17000, normal: 11500, timeboost: 5500 },
    { time: Math.floor(Date.now() / 1000) - 1500, total: 20000, normal: 14000, timeboost: 6000 },
    { time: Math.floor(Date.now() / 1000) - 1200, total: 22000, normal: 15000, timeboost: 7000 },
    { time: Math.floor(Date.now() / 1000) - 900, total: 18000, normal: 12000, timeboost: 6000 },
    { time: Math.floor(Date.now() / 1000) - 600, total: 21000, normal: 14500, timeboost: 6500 },
    { time: Math.floor(Date.now() / 1000) - 300, total: 23000, normal: 16000, timeboost: 7000 },
  ];

  // Transform sample data into chart format
  const chartData = {
    labels: sampleData.map(item => {
      const date = new Date(item.time * 1000);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: 'Total MEV Profit (USD)',
        data: sampleData.map(item => item.total),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'MEV Profit Over Time',
      },
      tooltip: {
        enabled: true,
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: (context: any) => {
            const index = context[0]?.dataIndex;
            if (index === undefined) return '';
            const item = sampleData[index];
            if (!item) return '';
            const date = new Date(item.time * 1000);
            return `${date.toLocaleDateString()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          },
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          },
          afterBody: (context: any) => {
            const index = context[0]?.dataIndex;
            if (index === undefined) return '';
            const item = sampleData[index];
            if (!item) return '';
            return [
              '',
              'All Values:',
              `Total: $${item.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              `Normal: $${item.normal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              `Timeboost: $${item.timeboost.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
            ];
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="chart-container">
      <Box sx={{ padding: 'var(--spacing-lg)' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Chart
        </Typography>
        <Card>
          <CardContent>
            <Box sx={{ height: 400 }}>
              <Line data={chartData} options={options} />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}

export default Chart;

