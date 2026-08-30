import os
import json

def analyze_roadmaps_v2():
    roadmap_dir = "roadmap"
    todo_file = "TODO.md"
    results = []

    if not os.path.exists(roadmap_dir):
        return

    for lab in os.listdir(roadmap_dir):
        lab_path = os.path.join(roadmap_dir, lab)
        if not os.path.isdir(lab_path):
            continue
        
        data_path = os.path.join(lab_path, "data")
        
        # Get all html topics (excluding index.html)
        topics = [f for f in os.listdir(lab_path) if f.endswith(".html") and f != "index.html"]
        
        for topic_html in topics:
            topic_name = os.path.splitext(topic_html)[0]
            json_name = f"{topic_name}.json"
            json_path = os.path.join(data_path, json_name)
            
            # Check for missing JSON or empty JSON
            if not os.path.exists(json_path):
                results.append(f"{lab}/{topic_html} (Missing JSON: {json_path})")
            else:
                with open(json_path, 'r', encoding='utf-8') as f:
                    try:
                        data = json.load(f)
                        if not data:
                            results.append(f"{lab}/{topic_html} (Empty JSON)")
                    except json.JSONDecodeError:
                        results.append(f"{lab}/{topic_html} (Invalid JSON)")

    with open(todo_file, "w") as f:
        f.write("# Roadmap Sidebar Migration TODO (V2)\n\n")
        f.write("## Issues detected:\n")
        
        if not results:
            f.write("No sidebar issues detected!\n")
        else:
            for item in sorted(results):
                f.write(f"- [ ] {item}\n")
    
    print(f"Analysis complete. {len(results)} issues written to {todo_file}")

if __name__ == "__main__":
    analyze_roadmaps_v2()
