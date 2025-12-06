export interface TimeSeriesPoint {
  time: string
  total: number
  normal: number
  timeboost: number
}

export interface ProtocolProfitPoint {
  time: string | number
  proto: string | number
  profit_usd: number
}

export interface ExpressLaneMEVPercentage {
  total: number
  timeboost: number
}

export interface ExpressLaneMEVPercentagePerMinute {
  time: string
  percentage: number
}

export interface ExpressLaneNetProfitEntry {
  round: number
  net_profit: number
}

export interface ExpressLaneProfitByControllerEntry {
  controller?: string
  net_profit_total?: number
}

export interface TimeboostGrossRevenue {
  total_second_price?: number
}

export interface TimeboostRevenue {
  total_first_price?: number
  total_second_price?: number
}

export interface BidsPerAddressEntry {
  bidder?: string
  bid_count?: number
}

export interface AuctionWinCountEntry {
  address?: string
  wins?: number
}

export interface BidsPerRoundEntry {
  round: number
  bid_count?: number
}

export interface ExpressLanePriceEntry {
  round: number
  first_price?: number
  second_price?: number
}

