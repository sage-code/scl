
import re

file_path = 'roadmap/go/examples.html'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find table rows
# We need to find tbody rows
# Example row:
# <tr>
#     <td> </td>
#     <td><a ...>...</a></td>
#     <td>...</td>
# </tr>

# Since we want to number them globally, we need to find all tbody rows
# And replace the first td content

count = 1

def replace_td(match):
    global count
    # match.group(1) is the leading whitespace/content
    # match.group(2) is the rest of the td tag
    # We want to replace it with <td>{count:02}</td>
    res = f'    <td>{count:02}</td>'
    count += 1
    return res

# This regex might be too simple, let's look at the structure again
# <tr>
#     <td> </td>
#     <td><a ...

# Let's iterate over the content and process matches.
# A regex that matches <tr>\n\s*<td>\s*<\/td>
# And replaces the <td> </td> with <td>01</td>

# Actually, the file content has:
# 58 | <tr>
# 59 |     <td> </td>

# Let's use re.sub with a counter.
# The structure is:
# <tr>
#     <td> </td>

new_content = content
def increment(match):
    global count
    # Keep the indent
    indent = match.group(1)
    res = f'{indent}<td>{count:02}</td>'
    count += 1
    return res

# Regex to find <tr>\n\s+<td>\s*<\/td>
# Wait, the <tr> is on the previous line.
# Let's search for (^\s*)<td>\s*<\/td> inside a <tr> block?
# That's hard with regex.

# Let's split by table or just iterate through all <tr> in tbody.
# Actually, the file seems to have tables with <tbody>.

# Let's just find all occurrences of <td> </td>
# But we need to make sure they are in the right place.
# The ones we want to replace are <td> </td> followed by <td><a ...

# Let's be more robust:
# We iterate through the lines.
# If we see <tr>, we set a flag 'in_tbody'.
# If we are in_tbody and see <td> </td>, we replace it.
# Wait, how do we know if it's the first td?
# Usually it's the first td after <tr>.

# Let's implement a line-by-line processor.
lines = content.split('\n')
new_lines = []
in_tbody = False
table_found = False

for line in lines:
    if '<tbody>' in line:
        in_tbody = True
        new_lines.append(line)
        continue
    if '</tbody>' in line:
        in_tbody = False
        new_lines.append(line)
        continue
    
    if in_tbody and '<tr>' in line:
        # Next line should be the td
        # We need to handle this.
        # But wait, the <td> might be on the same line or next line.
        # Looking at the file, it seems the <td> is on the next line.
        new_lines.append(line)
        continue
        
    if in_tbody and '<td> </td>' in line:
        # Check if it's the first td.
        # The structure is <td> </td> (with some spaces)
        # We replace it with <td>{count:02}</td>
        # count += 1
        indent = re.match(r'^\s*', line).group(0)
        new_lines.append(f'{indent}<td>{count:02}</td>')
        count += 1
        continue
    
    if '<th>00</th>' in line:
        # Change header
        new_lines.append(line.replace('<th>00</th>', '<th>#</th>'))
        continue

    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(new_lines))
