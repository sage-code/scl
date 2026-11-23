#!/usr/bin/env python3
"""Inspect IPv4 CIDR network, broadcast, and usable host range."""

import ipaddress


def describe_subnet(cidr: str) -> None:
    net = ipaddress.ip_network(cidr, strict=False)
    hosts = list(net.hosts())
    print(f"CIDR:       {net}")
    print(f"Netmask:    {net.netmask}")
    print(f"Network:    {net.network_address}")
    print(f"Broadcast:  {net.broadcast_address}")
    print(f"Host Range: {hosts[0]} - {hosts[-1]} ({len(hosts)} usable)")


if __name__ == "__main__":
    describe_subnet("10.24.16.0/22")
