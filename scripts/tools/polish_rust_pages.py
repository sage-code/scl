#!/usr/bin/env python3
"""Polish two Rust pages: retitle objects -> Traits & Generics, frameworks -> Frameworks & Ecosystem,
and fix their metadata and alert framing. Substring replacements to avoid whitespace pitfalls."""
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TRACK = ROOT / "roadmap" / "rust"

def apply(path, pairs):
    text = path.read_text(encoding="utf-8")
    orig = text
    for old, new in pairs:
        if old in text:
            text = text.replace(old, new)
        else:
            print(f"  [!] not found in {path.name}: {old[:60]}...")
    if text != orig:
        path.write_text(text, encoding="utf-8")
        print(f"[OK] {path.name}")
    return text != orig

objects = [
    ("<title>Rust OOP</title>", "<title>Traits &amp; Generics</title>"),
    ('<meta name="description" content="Object oriented Rust implementation. Rust OOP.">',
     '<meta name="description" content="Traits, generics, and trait objects: how Rust achieves abstraction, code reuse, and polymorphism.">'),
    ('<meta name="keywords" content="rust, oop, class, syntax, methods, objects, classes">',
     '<meta name="keywords" content="rust, traits, generics, trait objects, polymorphism, impl, tutorial">'),
    ("<h1 id=\"rust-objects\">Rust Objects</h1>", "<h1 id=\"rust-objects\">Traits &amp; Generics</h1>"),
    ('<div class="alert alert-secondary">Object-Oriented Programming (OOP) is a programming paradigm centered around the idea of objects, which are a combination of data and related methods. OOP allows developers to write code that is modular, re-usable, and easy to maintain.</div>',
     '<div class="alert alert-secondary shadow-sm">Rust has no classes and no inheritance. Instead it models behavior with <strong>traits</strong>, reuse with <strong>generics</strong>, and dynamic dispatch with <strong>trait objects</strong> — the same modularity and polymorphism OOP promises, without class-hierarchy pitfalls.</div>'),
]

frameworks = [
    ("<title>Rust Frameworks</title>", "<title>Frameworks &amp; Ecosystem</title>"),
    ('<meta name="description" content="Template page for tutorials.">',
     '<meta name="description" content="Rust frameworks and ecosystem: web servers, async runtimes, embedded databases, and middleware.">'),
    ('<meta name="keywords" content="rust, syntax">',
     '<meta name="keywords" content="rust, frameworks, actix, rocket, tower, hyper, tokio, ecosystem">'),
    ("<h2 id=\"rust-frameworks\">Rust Frameworks</h2>", "<h1 id=\"rust-frameworks\">Frameworks &amp; Ecosystem</h1>"),
]

apply(TRACK / "objects.html", objects)
apply(TRACK / "frameworks.html", frameworks)
print("done")
