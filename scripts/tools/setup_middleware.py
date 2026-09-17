
with open(".temp/paths.txt", "r") as f:
    paths = [line.strip() for line in f if line.strip()]

content = "import { NextResponse } from 'next/server';\n\nconst GONE_PATHS = new Set([\n" + ",\n".join([f"  '{p}'" for p in paths]) + "\n]);\n\nexport function middleware(request) {\n  const { pathname } = request.nextUrl;\n  \n  if (GONE_PATHS.has(pathname)) {\n    return new NextResponse(null, { \n      status: 410,\n      statusText: 'Gone' \n    });\n  }\n  \n  return NextResponse.next();\n}\n"

with open("middleware.js", "w") as f:
    f.write(content)
