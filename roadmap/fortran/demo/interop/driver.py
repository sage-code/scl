"""Python driver for the F2PY bridge in 20_euler.f90.
Build first:  python -m numpy.f2py -c euler.f90 -m easolver
Then run:     python driver.py
The orchestration loop lives in Python; every compute call lands in Fortran.
"""
import numpy as np
import easolver                      # the compiled Fortran module

def main():
    n = 100_000
    y = np.zeros(n, dtype=np.float64)
    dt = 0.01

    for _ in range(1000):            # per-time-step driver loop (Python)
        y = easolver.euler_step(y, dt)   # Fortran computes the step

    print("final sum:", float(y.sum()))
    print("finite:  ", bool(np.all(np.isfinite(y))))

if __name__ == "__main__":
    main()