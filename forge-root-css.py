import os
import re

def force_root_stylesheet(start_dir=".", target_filename="sage.css"):
    """
    Recursively finds all .html files in subfolders of the start directory
    and replaces all <link rel="stylesheet" href="..."> tags to point
    specifically to the root stylesheet: <link rel="stylesheet" href="/sage.css">.

    Args:
        start_dir (str): The starting directory (defaults to the current folder).
        target_filename (str): The name of the root stylesheet file (default: "sage.css").
    """
    for subdir, _, files in os.walk(start_dir):
        for file in files:
            if file.endswith(".html"):
                filepath = os.path.join(subdir, file)

                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Regex to find <link rel="stylesheet" href="...">
                style_regex = re.compile(r'<link\s+rel="stylesheet"\s+href="([^"]*?)"\s*>')

                def replace_stylesheet(match):
                    return f'<link rel="stylesheet" href="/{target_filename}">'

                updated_content = style_regex.sub(replace_stylesheet, content)

                if updated_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(updated_content)
                        print(f"Forced root stylesheet in: {filepath}")

if __name__ == "__main__":
    print("Starting stylesheet replacement process from the current folder.")
    force_root_stylesheet()
    print("Stylesheet replacement process completed.")