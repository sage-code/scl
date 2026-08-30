import os

def find_missing_sidebars(root_dir):
    roadmap_dir = "roadmap"
    todo_file = "TODO_DETAILED.md"
    results = []

    if not os.path.exists(roadmap_dir):
        return

    for lab in os.listdir(roadmap_dir):
        lab_path = os.path.join(roadmap_dir, lab)
        if not os.path.isdir(lab_path):
            continue
        
        data_path = os.path.join(lab_path, "data")
        
        # 1. Check if data folder exists
        if not os.path.exists(data_path):
            results.append(f"{lab}/ (Missing data/ folder)")
            continue
            
        # 2. Check if data folder is empty
        if not os.listdir(data_path):
            results.append(f"{lab}/ (Empty data/ folder)")
            continue
        
        # 3. Check for topics without JSON
        topics = [f for f in os.listdir(lab_path) if f.endswith(".html") and f != "index.html"]
        for topic_html in topics:
            topic_name = os.path.splitext(topic_html)[0]
            json_name = f"{topic_name}.json"
            json_path = os.path.join(data_path, json_name)
            
            if not os.path.exists(json_path):
                results.append(f"{lab}/{topic_html} (Missing {json_name})")

    with open(todo_file, "w") as f:
        f.write("# Detailed Sidebar Migration TODO\n\n")
        
        if not results:
            f.write("No sidebar issues detected!\n")
        else:
            for item in sorted(results):
                f.write(f"- [ ] {item}\n")
    
    print(f"Analysis complete. {len(results)} issues written to {todo_file}")

if __name__ == "__main__":
    find_missing_sidebars(".")
