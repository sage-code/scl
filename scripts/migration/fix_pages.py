
import os

def fix_html_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the h1 tag and the following alert and hr tags
    h1_start = content.find('<h1>')
    hr_end = content.find('<hr>', h1_start) + len('<hr>')
    
    if h1_start == -1 or hr_end == -1:
        print(f"Could not find h1 and hr tags in {file_path}")
        return

    # Create the new header
    new_header = f"""<div class="container-fluid">
  <div class="row">
    <nav id="sidebar" class="col-md-3 col-lg-2 d-md-block bg-light sidebar collapse">
      <div class="position-sticky">
        <div class="progress" style="height: 25px;">
          <div id="main-progress" class="progress-bar" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
        </div>
        <ul id="sidebar-list" class="nav flex-column">
        </ul>
      </div>
    </nav>
    <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
    {content[h1_start:hr_end]}
    """

    # Create the new footer
    new_footer = f"""
    </main>
  </div>
</div>
<script src="/sidebar.js"></script>
<script src="/progress.js"></script>
"""
    # Find the last closing tag
    last_closing_tag = content.rfind('</p>') + len('</p>')
    if last_closing_tag == -1:
      last_closing_tag = content.rfind('</blockquote>') + len('</blockquote>')
    if last_closing_tag == -1:
        print(f"Could not find closing tag in {file_path}")
        return
        
    # Create the new content
    new_content = new_header + content[hr_end:last_closing_tag] + new_footer

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

def main():
    engineering_dir = 'engineering'
    for filename in os.listdir(engineering_dir):
        if filename.endswith('.html') and filename != 'index.html':
            file_path = os.path.join(engineering_dir, filename)
            fix_html_file(file_path)

if __name__ == '__main__':
    main()
