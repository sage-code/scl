import os
import shutil
import glob

def migrate_to_data_architecture(root_dir):
    # Iterate through roadmaps and projects directories
    for base_folder in ["roadmap", "projects"]:
        base_path = os.path.join(root_dir, base_folder)
        if not os.path.exists(base_path):
            continue
            
        for entry in os.listdir(base_path):
            dir_path = os.path.join(base_path, entry)
            
            # Process only subdirectories
            if os.path.isdir(dir_path):
                # Skip 'data' or 'img' or other system folders if necessary
                if entry in ['data', 'img', 'demo', 'extra']:
                    continue

                data_path = os.path.join(dir_path, "data")
                
                # Ensure data folder exists
                if not os.path.exists(data_path):
                    os.makedirs(data_path)
                    print(f"Created {data_path}")
                
                # Move json files to data folder
                json_files = glob.glob(os.path.join(dir_path, "*.json"))
                for json_file in json_files:
                    # Don't move files already in data
                    if os.path.dirname(json_file) == data_path:
                        continue
                    
                    target_file = os.path.join(data_path, os.path.basename(json_file))
                    shutil.move(json_file, target_file)
                    print(f"Moved {os.path.basename(json_file)} to {target_file}")

if __name__ == "__main__":
    migrate_to_data_architecture(".")
    print("Migration complete.")
