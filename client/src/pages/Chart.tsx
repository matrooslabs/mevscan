import { Card, CardContent, Typography, Box } from '@mui/material';
import './Chart.css';

function Chart() {
  return (
    <div className="chart-container">
      <Box sx={{ padding: 'var(--spacing-lg)' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Chart
        </Typography>
        <Card>
          <CardContent>
            <Typography variant="body1">
              Chart page content coming soon...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
}

export default Chart;

