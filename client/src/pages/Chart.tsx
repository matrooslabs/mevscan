import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, Typography, Box, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
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
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PUBNUB_CHANNELS, TIME_RANGES } from '@mevscan/shared/constants';
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
  Legend,
  Filler
);

function Chart() {
  const pubnubRef = useRef<PubNub | null>(null);
  const [allGrossMevData, setAllGrossMevData] = useState<GrossMevDataResponse[]>([]);
  const [grossMevData, setGrossMevData] = useState<GrossMevDataResponse[]>([]);
  const [timeRange, setTimeRange] = useState<string>('15min');

  // Helper function to format time range label
  const formatTimeRangeLabel = (range: string): string => {
    if (range === '5min') return '5 min';
    if (range === '15min') return '15 min';
    if (range === '30min') return '30 min';
    if (range === '1hour') return '1 hour';
    if (range === '12hours') return '12 hours';
    return range;
  };

  // Helper function to get number of data points based on time range
  const getDataPointLimit = (range: string): number => {
    switch (range) {
      case '5min':
        return 5;
      case '15min':
        return 15;
      case '30min':
        return 30;
      case '1hour':
        return 60;
      case '12hours':
        return 720;
      default:
        return 15;
    }
  };

  
  // Initialize PubNub and subscribe to channel
  useEffect(() => {
    const pubnub = new PubNub({
      subscribeKey: import.meta.env.VITE_PUBNUB_SUBSCRIBE_KEY || '',
      userId: 'chart-client',
    });

    pubnubRef.current = pubnub;

    // Helper function to merge new data with existing data
    const mergeData = (newData: GrossMevDataResponse[], existingData: GrossMevDataResponse[]): GrossMevDataResponse[] => {
      // Combine existing and new data
      const combined = [...existingData, ...newData];
      
      // Sort by time and remove duplicates
      const sortedData = combined.sort((a, b) => a.time - b.time);
      const uniqueData: GrossMevDataResponse[] = [];
      for (let i = 0; i < sortedData.length; i++) {
        if (i === 0 || sortedData[i].time !== sortedData[i - 1].time) {
          uniqueData.push(sortedData[i]);
        }
      }
      
      return uniqueData;
    };

    // Subscribe to Gross MEV channel
    pubnub.subscribe({
      channels: [PUBNUB_CHANNELS.GROSS_MEV],
    });

    // Listen for real-time messages
    const listener = {
      message: (event: any) => {
        if (event.channel === PUBNUB_CHANNELS.GROSS_MEV) {
          const newData = (event.message as unknown as GrossMevDataResponse[]) || [];
          if (newData.length > 0) {
            setAllGrossMevData((prevData) => mergeData(newData, prevData));
          }
        }
      },
    };

    pubnub.addListener(listener);

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

        setAllGrossMevData(uniqueData);
      } catch (error) {
        console.error('Error fetching messages from PubNub:', error);
      }
    })();

    // Cleanup on unmount
    return () => {
      pubnub.removeListener(listener);
      pubnub.unsubscribe({
        channels: [PUBNUB_CHANNELS.GROSS_MEV],
      });
    };
  }, []);

  // Filter data based on selected time range
  useEffect(() => {
    const limit = getDataPointLimit(timeRange);
    const filtered = allGrossMevData.slice(-limit);
    setGrossMevData(filtered);
  }, [timeRange, allGrossMevData]);

  // Transform sample data into chart format
  const chartData = {
    labels: grossMevData.map(item => {
      const date = new Date(item.time * 1000);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    }),
    datasets: [
      {
        label: 'Total MEV Profit (USD)',
        data: grossMevData.map(item => item.total),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Normal MEV Profit (USD)',
        data: grossMevData.map(item => item.normal),
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.1,
        fill: true,
      },
      {
        label: 'Timeboost MEV Profit (USD)',
        data: grossMevData.map(item => item.timeboost),
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.1,
        fill: true,
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
            const item = grossMevData[index];
            if (!item) return '';
            const date = new Date(item.time * 1000);
            return `${date.toLocaleDateString()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
          },
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
          <Typography variant="h4" component="h1">
            Chart
          </Typography>
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel id="time-range-select-label">Time Range</InputLabel>
            <Select
              labelId="time-range-select-label"
              id="time-range-select"
              value={timeRange}
              label="Time Range"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {TIME_RANGES.map((range) => (
                <MenuItem key={range} value={range}>
                  {formatTimeRangeLabel(range)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
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

