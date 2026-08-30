import os

def analyze_roadmaps():
    roadmap_dir = "roadmap"
    todo_file = "TODO.md"
    results = []

    # Ensure roadmap directory exists
    if not os.path.exists(roadmap_dir):
        print(f"Roadmap directory {roadmap_dir} not found.")
        return

    for lab in os.listdir(roadmap_dir):
        lab_path = os.path.join(roadmap_dir, lab)
        if not os.path.isdir(lab_path):
            continue
        
        data_path = os.path.join(lab_path, "data")
        
        # Get all html topics (excluding index.html)
        # Assuming typical lab structure where topic files are directly in roadmap/<lab>/
        topics = [f for f in os.listdir(lab_path) if f.endswith(".html") and f != "index.html"]
        
        if not topics:
            continue
            
        for topic_html in topics:
            topic_name = os.path.splitext(topic_html)[0]
            json_name = f"{topic_name}.json"
            json_path = os.path.join(data_path, json_name)
            
            if not os.path.exists(json_path):
                results.append(f"{lab}/{topic_html}")

    with open(todo_file, "w") as f:
        f.write("# Roadmap Sidebar Migration TODO\n\n")
        f.write("## Instructions\n")
        f.write("- To mark a task as done, change `- [ ]` to `- [x]`.\n\n")
        
        if not results:
            f.write("All roadmaps have sidebars!\n")
        else:
            for item in sorted(results):
                f.write(f"- [ ] {item}\n")
    
    print(f"Analysis complete. {len(results)} items written to {todo_file}")

if __name__ == "__main__":
    analyze_roadmaps()
