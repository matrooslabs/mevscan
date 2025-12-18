CREATE TABLE IF NOT EXISTS ethereum.blocks
(
    `block_number` UInt64,
    `block_hash` String,
    `block_timestamp` UInt64,
    `valid` UInt8,

    PROJECTION proj_by_block_number
    (
        SELECT
            block_number,
            block_timestamp,
            block_hash,
            valid
        ORDER BY block_number
    )
)
ENGINE = MergeTree()
ORDER BY (block_timestamp, block_number)