#!/usr/bin/env python3
"""Compute usable storage capacity and fault tolerance across common RAID levels."""


def raid_summary(disk_count: int, disk_tb: float) -> None:
    specs = {
        "RAID 0 (Stripe)": (disk_count * disk_tb, 0),
        "RAID 1 (Mirror)": (disk_tb if disk_count >= 2 else 0.0, disk_count - 1),
        "RAID 5 (Single Parity)": ((disk_count - 1) * disk_tb if disk_count >= 3 else 0.0, 1),
        "RAID 6 (Dual Parity)": ((disk_count - 2) * disk_tb if disk_count >= 4 else 0.0, 2),
        "RAID 10 (Stripe+Mirror)": ((disk_count // 2) * disk_tb if disk_count >= 4 and disk_count % 2 == 0 else 0.0, 1),
    }
    print(f"Array: {disk_count} x {disk_tb:.1f} TB drives")
    for level, (usable, fault_tol) in specs.items():
        print(f"  {level:<24} usable={usable:>5.1f} TB   max_failed_drives={fault_tol}")


if __name__ == "__main__":
    raid_summary(disk_count=6, disk_tb=4.0)
