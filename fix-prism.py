import os
import re

def fix_prism_paths(start_dir=".", prism_css="prism.css", prism_js="prism.js"):
    """
    Recursively finds all .html files in subfolders of the start directory
    and fixes the paths for prism.css and prism.js to point to the root.
    Starts the scan from the current folder.

    Args:
        start_dir (str): The starting directory (defaults to the current folder).
        prism_css (str): The filename of the Prism CSS file (default: "prism.css").
        prism_js (str): The filename of the Prism JS file (default: "prism.js").
    """
    for subdir, _, files in os.walk(start_dir):
        for file in files:
            if file.endswith(".html"):
                filepath = os.path.join(subdir, file)

                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Fix prism.css href
                css_pattern = re.compile(r'href="\/go\/\.\.\/' + re.escape(prism_css) + r'"')
                updated_content = css_pattern.sub(f'href="/{prism_css}"', content)

                # Fix prism.js src (assuming it's referenced with "../prism.js")
                js_pattern = re.compile(r'src="\.\.\/' + re.escape(prism_js) + r'"')
                updated_content = js_pattern.sub(f'src="/{prism_js}"', updated_content)

                if updated_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(updated_content)
                        print(f"Fixed Prism paths in: {filepath}")

if __name__ == "__main__":
    print("Starting Prism path fixing process from the current folder.")
    prism_css_file = input(f"Enter the filename of your Prism CSS (default: prism.css): ") or "prism.css"
    prism_js_file = input(f"Enter the filename of your Prism JS (default: prism.js): ") or "prism.js"

    fix_prism_paths(prism_css=prism_css_file, prism_js=prism_js_file)
    print("Prism path fixing process completed.")