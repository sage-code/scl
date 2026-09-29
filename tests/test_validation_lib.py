"""Unit tests for scripts/validation_lib.py."""
import unittest

from tests.base import ROOT  # noqa: F401  (puts scripts/ on sys.path)
from validation_lib import html_markup_issues, sidebar_issues, validate_json_syntax

REL = "roadmap/a/data/b.json"


class JsonSyntaxTest(unittest.TestCase):
    def test_valid(self):
        self.assertEqual(validate_json_syntax('{"a": 1}'), (None, {"a": 1}))

    def test_invalid(self):
        err, data = validate_json_syntax("{bad")
        self.assertIn("Invalid JSON", err)
        self.assertIsNone(data)


class SidebarIssuesTest(unittest.TestCase):
    def test_valid_hierarchy(self):
        data = [{"title": "T", "children": [{"title": "c", "link": "x.html"}]}]
        self.assertEqual(sidebar_issues(data, REL), [])

    def test_children_must_be_list(self):
        issues = sidebar_issues([{"title": "T", "children": "no"}], REL)
        self.assertEqual([lvl for lvl, _ in issues], ["fail"])

    def test_child_missing_link(self):
        issues = sidebar_issues([{"title": "T", "children": [{"title": "c"}]}], REL)
        self.assertEqual([lvl for lvl, _ in issues], ["fail"])


class HtmlMarkupTest(unittest.TestCase):
    def test_balanced(self):
        self.assertEqual(html_markup_issues("<div><p>x</p></div>", "a.html"), [])

    def test_unbalanced_is_reported(self):
        self.assertTrue(html_markup_issues("<div><p>x</div>", "a.html"))


if __name__ == "__main__":
    unittest.main()
