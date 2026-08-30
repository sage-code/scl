import subprocess
import sys
import os

def run_dev(port=4173):
    # node build.js
    subprocess.run(["node", "build.js"], check=True)
    # python scripts/python/validate_site.py
    subprocess.run([sys.executable, "scripts/python/validate_site.py"], check=True)
    # python -m http.server $Port --directory public
    print(f"Serving ./public on http://localhost:{port}")
    
    # Change directory to public to serve it correctly
    os.chdir("public")
    subprocess.run([sys.executable, "-m", "http.server", str(port)])

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 4173
    run_dev(port)
