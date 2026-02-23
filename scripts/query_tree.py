#!/usr/bin/env python3
"""
Query a transaction's trace tree from the mevscan API and reconstruct
the flattened arrays into a hierarchical call tree.

Usage:
    python scripts/query_tree.py <tx_hash>
    python scripts/query_tree.py <tx_hash> --pretty

Environment:
    MEVSCAN_API_URL - API base URL (default: http://localhost:3001)
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from dataclasses import dataclass, field
from typing import Optional


# ── Data classes ──────────────────────────────────────────────────────────────

@dataclass
class GasDetails:
    coinbase_transfer: Optional[str]
    priority_fee: str
    gas_used: str
    effective_gas_price: str

    def to_dict(self) -> dict:
        return {
            "coinbase_transfer": self.coinbase_transfer,
            "priority_fee": self.priority_fee,
            "gas_used": self.gas_used,
            "effective_gas_price": self.effective_gas_price,
        }


@dataclass
class TraceNode:
    trace_idx: int
    trace_address: list[int]
    action_kind: Optional[str]
    action: Optional[dict]
    children: list["TraceNode"] = field(default_factory=list)

    def to_dict(self) -> dict:
        d = {
            "trace_idx": self.trace_idx,
            "trace_address": self.trace_address,
        }
        if self.action_kind:
            d["action_kind"] = self.action_kind
        if self.action:
            d["action"] = self.action
        if self.children:
            d["children"] = [c.to_dict() for c in self.children]
        return d


@dataclass
class TransactionTree:
    block_number: int
    tx_hash: str
    tx_idx: int
    from_address: str
    to_address: Optional[str]
    gas_details: GasDetails
    root_nodes: list[TraceNode]
    timeboosted: bool

    def to_dict(self) -> dict:
        return {
            "block_number": self.block_number,
            "tx_hash": self.tx_hash,
            "tx_idx": self.tx_idx,
            "from": self.from_address,
            "to": self.to_address,
            "gas_details": self.gas_details.to_dict(),
            "timeboosted": self.timeboosted,
            "trace_tree": [n.to_dict() for n in self.root_nodes],
        }


# ── Tree reconstruction ──────────────────────────────────────────────────────

def build_tree(
    trace_idxs: list[int],
    trace_addresses: list[list[int]],
    action_kinds: list[Optional[str]],
    actions: list[Optional[str]],
) -> list[TraceNode]:
    nodes: list[TraceNode] = []
    for i in range(len(trace_idxs)):
        parsed_action = None
        if actions[i]:
            try:
                parsed_action = json.loads(actions[i])
            except (json.JSONDecodeError, TypeError):
                parsed_action = {"raw": actions[i]}

        nodes.append(TraceNode(
            trace_idx=trace_idxs[i],
            trace_address=trace_addresses[i],
            action_kind=action_kinds[i],
            action=parsed_action,
        ))

    nodes.sort(key=lambda n: n.trace_address)

    addr_to_node: dict[tuple, TraceNode] = {}
    roots: list[TraceNode] = []

    for node in nodes:
        addr = tuple(node.trace_address)
        addr_to_node[addr] = node

        if len(addr) == 0:
            roots.append(node)
        else:
            parent_addr = addr[:-1]
            parent = addr_to_node.get(parent_addr)
            if parent is not None:
                parent.children.append(node)
            else:
                roots.append(node)

    return roots


def row_to_tree(row: dict) -> TransactionTree:
    gas = row["gas_details"]
    gas_details = GasDetails(
        coinbase_transfer=gas[0],
        priority_fee=gas[1],
        gas_used=gas[2],
        effective_gas_price=gas[3],
    )

    root_nodes = build_tree(
        trace_idxs=row["trace_nodes.trace_idx"],
        trace_addresses=row["trace_nodes.trace_address"],
        action_kinds=row["trace_nodes.action_kind"],
        actions=row["trace_nodes.action"],
    )

    return TransactionTree(
        block_number=row["block_number"],
        tx_hash=row["tx_hash"],
        tx_idx=row["tx_idx"],
        from_address=row["from"],
        to_address=row["to"],
        gas_details=gas_details,
        root_nodes=root_nodes,
        timeboosted=row["timeboosted"],
    )


# ── Pretty printing ──────────────────────────────────────────────────────────

def format_node(node: TraceNode, indent: int = 0) -> str:
    prefix = "  " * indent
    kind = node.action_kind or "Unknown"
    addr_str = f"[{','.join(str(a) for a in node.trace_address)}]" if node.trace_address else "[]"

    summary = ""
    if node.action and isinstance(node.action, dict):
        for key in ("protocol", "pool", "token_in", "token_out", "from", "to", "amount"):
            if key in node.action:
                val = node.action[key]
                if isinstance(val, dict) and "symbol" in val:
                    val = val["symbol"]
                summary += f" {key}={val}"

    lines = [f"{prefix}{addr_str} [{node.trace_idx}] {kind}{summary}"]
    for child in node.children:
        lines.append(format_node(child, indent + 1))
    return "\n".join(lines)


def format_tree_pretty(tx_tree: TransactionTree) -> str:
    lines = [
        f"TX {tx_tree.tx_hash}",
        f"  block={tx_tree.block_number}  idx={tx_tree.tx_idx}  "
        f"from={tx_tree.from_address}  to={tx_tree.to_address}",
        f"  gas_used={tx_tree.gas_details.gas_used}  "
        f"effective_price={tx_tree.gas_details.effective_gas_price}  "
        f"coinbase_transfer={tx_tree.gas_details.coinbase_transfer}",
        f"  timeboosted={tx_tree.timeboosted}",
        "---",
    ]
    for root in tx_tree.root_nodes:
        lines.append(format_node(root))
    return "\n".join(lines)


# ── API client ────────────────────────────────────────────────────────────────

def fetch_tree(api_url: str, tx_hash: str) -> dict:
    url = f"{api_url}/api/tree/{tx_hash}"
    req = urllib.request.Request(url, headers={"User-Agent": "mevscan-cli/1.0"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            err = json.loads(body)
            sys.exit(f"Error {e.code}: {err.get('message', body)}")
        except json.JSONDecodeError:
            sys.exit(f"Error {e.code}: {body}")
    except urllib.error.URLError as e:
        sys.exit(f"Connection error: {e.reason}")


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Fetch and reconstruct a transaction trace tree from the mevscan API"
    )
    parser.add_argument(
        "tx_hash",
        help="Transaction hash to look up",
    )
    parser.add_argument(
        "--pretty", action="store_true",
        help="Human-readable tree format instead of JSON",
    )
    parser.add_argument(
        "--api-url", type=str, default=None,
        help="API base URL (default: from MEVSCAN_API_URL or http://localhost:3001)",
    )

    args = parser.parse_args()

    api_url = args.api_url or os.environ.get("MEVSCAN_API_URL", "http://localhost:3001")
    api_url = api_url.rstrip("/")

    row = fetch_tree(api_url, args.tx_hash)
    tree = row_to_tree(row)

    if args.pretty:
        print(format_tree_pretty(tree))
    else:
        print(json.dumps(tree.to_dict(), indent=2, default=str))


if __name__ == "__main__":
    main()
