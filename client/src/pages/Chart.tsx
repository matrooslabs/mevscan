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

  // Example line chart data
  const data = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'MEV Profit (USD)',
        data: [12000, 19000, 3000, 5000, 2000, 3000, 8000],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
      },
      {
        label: 'Timeboost Profit (USD)',
        data: [2000, 3000, 20000, 5000, 1000, 4000, 6000],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
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
              <Line data={data} options={options} />
            </Box>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}

export default Chart;

