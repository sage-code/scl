import subprocess
import sys

def run_test():
    # node build.js
    subprocess.run(["node", "build.js"], check=True)
    # python scripts/test/validate_site.py
    subprocess.run([sys.executable, "scripts/test/validate_site.py"], check=True)
    print("Local test checks passed.")

if __name__ == "__main__":
    run_test()
