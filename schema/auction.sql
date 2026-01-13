CREATE TABLE timeboost.auction
(
    `block_number` Nullable(UInt64),
    `log_index` Nullable(UInt64),
    `tx_hash` Nullable(String),
    `contract_address` String,
    `is_multi_bid_auction` UInt8,
    `round` UInt64,
    `first_price_bidder` String,
    `first_price_express_lane_controller` String,
    `first_price_amount` String,
    `price` String,
    `round_start_timestamp` DateTime64(0, 'UTC'),
    `round_end_timestamp` DateTime64(0, 'UTC')
)
ENGINE = MergeTree
PARTITION BY toYYYYMM(round_start_timestamp)
ORDER BY (contract_address, round_start_timestamp, round)
SETTINGS index_granularity = 8192
