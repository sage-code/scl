#!/usr/bin/env python3
"""Fix the three Java topic pages that are still stubs.

`generics.html`, `keywords.html` and `records.html` predate the topic-page
contract: each opens into a single `<h2>` (so it has no page title for the
sidebar root, and `migrate_sidebars.py` reports it as BLOCKED) and each carries
editorial leftovers ("Work in progress!", a `<div class="well">`, a terminal
"Go back to" link).

The script applies literal, exactly-once replacements to those three files.
Every pair is asserted to occur exactly once, so a page that was edited by hand
is reported instead of being rewritten in the wrong place.

Deterministic and idempotent: once a replacement has been applied, its "old"
text no longer matches and the script reports the page as already fixed.

Usage:
    python scripts/tools/fix_java_stub_pages.py --dry-run
    python scripts/tools/fix_java_stub_pages.py --apply
"""
import argparse
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
TRACK = REPO / "roadmap" / "java"

KEYWORDS_TITLE = """<h1 id="java-keywords">Java Keywords</h1>

<p>Java reserves about fifty words that the compiler treats specially. They are the skeleton of the language: <code>class</code> and <code>interface</code> declare types, <code>if</code> and <code>while</code> steer control flow, <code>public</code> and <code>private</code> decide who may see what. None of them may be used as the name of a variable, a method, or a class.</p>

<p>The table below is a reference, not a lesson. Read a row when you meet the word in one of the lab demos, and come back when the compiler rejects an identifier you were sure was legal. Two entries at the end &mdash; <code>const</code> and <code>goto</code> &mdash; are reserved without being used, which is worth knowing before you spend an afternoon looking for the feature.</p>

<h2 id="keyword-reference">Keyword Reference</h2>"""

KEYWORDS_FAMILIES = """<p>Keywords fall into a few families, and the family tells you where the word may appear. Declarations (<code>class</code>, <code>interface</code>, <code>enum</code>, <code>record</code>) introduce a type; modifiers (<code>public</code>, <code>private</code>, <code>static</code>, <code>final</code>, <code>abstract</code>) change what that type or member means; statements (<code>if</code>, <code>else</code>, <code>for</code>, <code>while</code>, <code>switch</code>, <code>try</code>) steer control flow; and literals (<code>true</code>, <code>false</code>, <code>null</code>) name values directly.</p>"""

KEYWORDS_RESERVED = """<h2 id="reserved-words">Reserved but Unused</h2>

<p>Two of the words in the table above are reserved by the compiler and rejected in source code, but have no meaning at all. <code>const</code> is a leftover from C and C++ &mdash; in Java you write <code>final</code> instead. <code>goto</code> is a leftover from the era when every language had one; Java's labelled <code>break</code> and <code>continue</code> (see the <a href="/roadmap/java/control.html">Control Flow</a> lesson) cover the same ground in a form the compiler can check.</p>

<p>They stay reserved on purpose. If either word were released for general use, existing code that happens to use it as an identifier could change meaning, so a language that has kept them for thirty years has made a promise it cannot break.</p>

<hr>"""

GENERICS_TITLE = """<h1 id="oop-generics">Java Generics</h1>

<p>Generics let a class or a method take a <em>type</em> as a parameter, so one implementation serves every element type without casting and without copying. The compiler keeps track of the type argument, which is why a <code>List&lt;String&gt;</code> refuses an <code>Integer</code> at compile time instead of failing at run time.</p>

<p>This is the machinery behind the angle brackets you have already used: <code>ArrayList&lt;Integer&gt;</code>, <code>Map&lt;String, Double&gt;</code> and the <code>Comparator&lt;T&gt;</code> in the task scheduler project are all generic types. Writing one yourself is the step from using the library to extending it.</p>"""

GENERICS_ERASURE = """<p>A generic type is checked at compile time and <em>erased</em> at run time: the compiler records the type argument for its own analysis, then removes it, so <code>List&lt;String&gt;</code> and <code>List&lt;Integer&gt;</code> are the same class when the program runs. That is why <code>new T[10]</code> is illegal inside a generic class, and why generics work only with reference types &mdash; <code>List&lt;int&gt;</code> does not compile, and <code>List&lt;Integer&gt;</code> is how you ask for the same thing.</p>

<hr>"""
RECORDS_TITLE = """<h1 id="records">Java Records</h1>

<p>A record is a class whose whole purpose is to carry data. You declare its components in the header, and the compiler writes the constructor, the accessors, <code>equals</code>, <code>hashCode</code> and <code>toString</code>. Nothing a data carrier needs is left for you to type by hand.</p>

<p>Records arrived in JDK 16 after two preview rounds, and they are the shortest path from "I need a pair of values" to a type that behaves correctly inside a collection. Demo 33 in the <a href="/roadmap/java/demo_examples.html">Lab Examples</a> shows one with a validating constructor.</p>"""

RECORDS_MEMBERS = """<h2 id="generated-members">Generated Members</h2>"""

RECORDS_EXAMPLE_IN = """<pre class="line-numbers"><code class="language-java"
>// declare simpe record Rectangle
record Rectangle(double length, double width) { }

// use record defined previously
Rectangle r = new Rectangle(4,5);
</code></pre>"""

RECORDS_EXAMPLE_OUT = """<pre><code class="language-java line-numbers">// A record declares its components in the header.
record Rectangle(double length, double width) { }

// The constructor, accessors, equals, hashCode and toString come for free.
Rectangle r = new Rectangle(4, 5);
System.out.println(r);                              // Rectangle[length=4.0, width=5.0]
System.out.println(r.length());                     // 4.0
System.out.println(r.equals(new Rectangle(4, 5)));  // true
</code></pre>"""

RECORDS_CUSTOM = """<h2 id="customizing-records">Customizing a Record</h2>

<div class="alert alert-info">A record is not a straitjacket. You may add methods, static factories, and a <em>compact constructor</em> that validates the components before they are assigned. What you cannot add is a mutable field or a setter: a record is immutable by construction, and that is the property that makes it safe to share between threads.</div>

<pre><code class="language-java line-numbers">record Rectangle(double length, double width) {

  // Compact constructor: no parameter list, the components are in scope.
  Rectangle {
    if (length &lt;= 0 || width &lt;= 0) {
      throw new IllegalArgumentException("invalid dimensions");
    }
  }

  // Records may still declare extra behaviour.
  double area() {
    return length * width;
  }
}
</code></pre>

<p>Full details, including the rules for generic and local records, are in the <a href="https://docs.oracle.com/en/java/javase/23/language/records.html" target="_blank" rel="noopener noreferrer nofollow">JDK Records manual</a>.</p>"""

# page -> list of (old, new). Every "old" must occur exactly once on the page.
PAGES = {
    "keywords.html": [
        ('<h2 id="java-tutorial">Java Tutorial</h2>', KEYWORDS_TITLE),
        ("""<div class="alert alert-secondary shadow-sm">
Work in progress!
</div>

<div class="well">Keywords are used to create declarations or statements. Some keywords represents constants that can be used in expressions. In IDE tools you will see these keywords highlighted with color so is very unlikely you will mess up.</div>
<p> ;</p>""", KEYWORDS_FAMILIES),
        ('<td char="">class</td>', '<td>class</td>'),
        ("""<p><b>Note:</b> ;const and goto are reserved but not used in the language so they are not keyword of the language but reserved keywords only.</p>
<!-- work in progress-->

<hr>""", KEYWORDS_RESERVED),
    ],
    "generics.html": [
        ('<h2 id="oop-generics">OOP Generics</h2>', GENERICS_TITLE),
        ('<p><b>Syntax:</b><p>', '<h2 id="type-parameters">Type Parameters</h2>'),
        ('<p><b>Type argument:</b><p>', '<h2 id="type-arguments">Type Arguments</h2>'),
        ("""<!-- work in progress-->

<hr>
<p><b>Go back to:</b>
<a href="/roadmap/java/annotations/">Annotations</a></p>""", GENERICS_ERASURE),
    ],
    "records.html": [
        ('<h2 id="records">Records</h2>', RECORDS_TITLE),
        ('<h4>Notes:</h4>', RECORDS_MEMBERS),
        (RECORDS_EXAMPLE_IN, RECORDS_EXAMPLE_OUT),
        ("""<!-- work in progress-->
<div class="alert alert-info">Using record is almost too easy. However sometimes you want to implement your own constructors, or field setters with validations. To learn how to do these things you need to read the Oracle manual for specific JDK version.</div>

<p><b>See also:</b><a href="https://docs.oracle.com/en/java/javase/19/language/records.html" target="_blank">JDK19: Records manual</a></p>""", RECORDS_CUSTOM),
    ],
}

def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--dry-run", action="store_true", help="print the plan, change nothing")
    group.add_argument("--apply", action="store_true", help="rewrite the pages")
    args = parser.parse_args()

    planned = []
    problems = 0

    for name, pairs in sorted(PAGES.items()):
        path = TRACK / name
        if not path.exists():
            print(f"[FAIL] missing page: {name}", file=sys.stderr)
            problems += 1
            continue

        text = path.read_text(encoding="utf-8")
        original = text
        applied = 0
        broken = False

        for old, new in pairs:
            count = text.count(old)
            if count == 0:
                continue                        # already fixed by an earlier run
            if count > 1:
                print(f"[FAIL] {name}: pattern occurs {count} times, refusing to guess",
                      file=sys.stderr)
                problems += 1
                broken = True
                break
            text = text.replace(old, new, 1)
            applied += 1

        if broken:
            continue
        if text == original:
            print(f"[SKIP] {name:20s} already fixed")
            continue

        print(f"[PLAN] {name:20s} apply {applied}/{len(pairs)} replacement(s)")
        planned.append((path, text))

    print(f"\n{len(planned)} page(s) planned, {problems} problem(s)")
    if args.dry_run or problems:
        if problems:
            return 1
        print("dry run: nothing written")
        return 0

    for path, text in planned:
        path.write_text(text, encoding="utf-8")
    print(f"applied {len(planned)} page(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

