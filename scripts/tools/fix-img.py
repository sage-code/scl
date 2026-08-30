import os
import re

def fix_image_links(start_dir="."):
    """
    Recursively finds all .html files in subfolders of the start directory.
    For each .html file, it fixes 'src' attributes of image tags that
    start with './' to include the current subfolder in the path,
    creating a root-relative URL.

    Args:
        start_dir (str): The starting directory (defaults to the current folder).
    """
    for subdir, _, files in os.walk(start_dir):
        relative_folder = os.path.relpath(subdir, start_dir)
        subfolder_path = relative_folder.replace("\\", "/")
        if subfolder_path != ".":
            subfolder_path += "/"

        for file in files:
            if file.endswith(".html"):
                filepath = os.path.join(subdir, file)

                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                def replace_image_src(match):
                    src_value = match.group(1)
                    if src_value.startswith("./"):
                        new_src = f"/{subfolder_path}{src_value[2:]}"
                        return f'src="{new_src}"'
                    return match.group(0)

                updated_content = re.sub(r'src="([^"]*?)"', replace_image_src, content)

                if updated_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(updated_content)
                        print(f"Fixed image links in: {filepath}")

if __name__ == "__main__":
    print("Starting image link fixing process from the current folder.")
    fix_image_links()
    print("Image link fixing process completed.")