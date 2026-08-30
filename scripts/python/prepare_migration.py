import os
import subprocess
import argparse

def prepare(mode, apply):
    folders = [
        "assets",
        "assets/css",
        "assets/js",
        "assets/images",
        "content",
        "content/labs",
        "layouts",
        "public",
        "scripts",
        "scripts/python",
        "tests",
        "config"
    ]
    
    for folder in folders:
        if not os.path.exists(folder):
            os.makedirs(folder)
            
    cmd = ["python", "scripts/python/migrate_to_static_structure.py", "--mode", mode]
    if apply:
        cmd.append("--apply")
        
    subprocess.run(cmd, check=True)
    subprocess.run(["python", "scripts/python/migration_status_report.py"], check=True)
    print("Migration prep completed.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--mode", choices=["copy", "move"], default="copy")
    args = parser.parse_args()
    prepare(args.mode, args.apply)
