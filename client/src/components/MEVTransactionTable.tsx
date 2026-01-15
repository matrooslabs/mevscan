import {
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
} from '@mui/material';
import { Link } from 'react-router-dom';
import { chartColorPalette } from '../theme';
import './MEVTransactionTable.css';

// Helper to normalize MEV type for display
const normalizeMevType = (mevType: string): string => {
  const normalized = mevType.toLowerCase();
  if (normalized === 'atomic' || normalized === 'atomic_arb') return 'Atomic';
  if (normalized === 'cex_dex' || normalized === 'cexdex') return 'CexDex';
  if (normalized === 'liquidation') return 'Liquidation';
  return mevType;
};

// Helper to get chip color based on MEV type (using chartColorPalette)
const getMevTypeColor = (mevType: string): string => {
  const normalized = normalizeMevType(mevType);
  switch (normalized) {
    case 'Atomic':
      return chartColorPalette[0]; // '#8884d8'
    case 'CexDex':
      return chartColorPalette[1]; // '#82ca9d'
    case 'Liquidation':
      return chartColorPalette[2]; // '#ffc658'
    default:
      return chartColorPalette[0];
  }
};

// Helper to convert hex color to rgba with opacity
const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Helper to format tx hash for display
const formatTxHash = (hash: string): string => {
  if (hash.length <= 13) return hash;
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
};

export interface MEVTransaction {
  txHash: string;
  blockNumber: number;
  mevType: string;
  profitUsd: number;
}

interface MEVTransactionTableProps {
  transactions: MEVTransaction[];
  isConnected: boolean;
}

export default function MEVTransactionTable({
  transactions,
  isConnected,
}: MEVTransactionTableProps) {
  return (
    <Card className="mev-tx-table-card">
      <CardContent className="mev-tx-table-card-content">
        <Box className="mev-tx-table-title-container">
          <Typography variant="h6" component="h3" className="mev-tx-table-title">
            Transactions
          </Typography>
        </Box>
        <TableContainer component={Paper} className="mev-tx-table-container">
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Tx Hash</TableCell>
                <TableCell>Block Number</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Profit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {isConnected ? 'Waiting for transactions...' : 'Connecting to live feed...'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions
                  .slice()
                  .reverse()
                  .map((tx, index) => (
                    <TableRow key={index} className="mev-tx-table-row">
                      <TableCell className="mev-tx-table-hash monospace">
                        <Link
                          to={`https://arbiscan.io/tx/${tx.txHash}`}
                          className="hash-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {formatTxHash(tx.txHash)}
                        </Link>
                      </TableCell>
                      <TableCell className="monospace">{tx.blockNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={normalizeMevType(tx.mevType)}
                          size="small"
                          variant="outlined"
                          sx={{
                            borderColor: getMevTypeColor(tx.mevType),
                            color: getMevTypeColor(tx.mevType),
                            backgroundColor: hexToRgba(getMevTypeColor(tx.mevType), 0.08),
                            '&:hover': {
                              backgroundColor: hexToRgba(getMevTypeColor(tx.mevType), 0.15),
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell align="right" className="mev-tx-table-profit">
                        ${tx.profitUsd.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}
