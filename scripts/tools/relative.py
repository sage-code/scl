import os
import re

def fix_hrefs_clean_urls(start_dir="."):
    """
    Recursively finds all .html files in subfolders of the start directory.
    For each .html file, it modifies 'href' attributes:
    - If it's a relative local link, it prepends the subfolder and removes .html, adding a trailing slash.
    - If it's already root-relative (starts with '/'), it removes .html and adds a trailing slash.
    - It ignores external links (http), anchor links (#), and already clean URLs (without .html).
    """
    for subdir, _, files in os.walk(start_dir):
        relative_folder = os.path.relpath(subdir, start_dir)
        subfolder_name = relative_folder.replace("\\", "/") + "/" if relative_folder != "." else ""

        for file in files:
            if file.endswith(".html"):
                filepath = os.path.join(subdir, file)

                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                def replace_href(match):
                    href_value = match.group(1)

                    if href_value.startswith("http") or href_value.startswith("#") or not href_value.endswith(".html"):
                        return f'href="{href_value}"'  # Don't modify external, anchor, or already clean URLs
                    elif href_value.startswith("/"):
                        updated_href = href_value[:-5] + "/"  # Remove .html and add slash
                        return f'href="{updated_href}"'
                    else:
                        updated_href = f"/{subfolder_name}{href_value[:-5]}/"  # Prepend subfolder, remove .html, add slash
                        return f'href="{updated_href}"'

                updated_content = re.sub(r'href="([^"]*?)"', replace_href, content)

                if updated_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(updated_content)
                        print(f"Updated hrefs in: {filepath}")

if __name__ == "__main__":
    print("Starting href cleaning process from the current folder.")
    fix_hrefs_clean_urls()
    print("Href cleaning process completed.")