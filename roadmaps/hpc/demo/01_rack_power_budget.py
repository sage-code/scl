#!/usr/bin/env python3
"""Calculate rack power draw, UPS runtime margin, and Power Usage Effectiveness (PUE)."""


def rack_power_report(servers: int, watts_per_server: float, total_facility_kw: float) -> None:
    it_load_kw = (servers * watts_per_server) / 1000.0
    pue = total_facility_kw / it_load_kw
    # 80% continuous load rule for breaker sizing
    recommended_circuit_kw = it_load_kw / 0.80
    print(f"IT Load:              {it_load_kw:.2f} kW")
    print(f"Facility Total Load:  {total_facility_kw:.2f} kW")
    print(f"PUE:                  {pue:.2f}")
    print(f"Min Circuit Capacity: {recommended_circuit_kw:.2f} kW (80% derating)")


if __name__ == "__main__":
    rack_power_report(servers=24, watts_per_server=450, total_facility_kw=14.5)
