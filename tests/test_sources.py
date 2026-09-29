"""Source-file validation (`npm run test`) as a unittest. Log: .temp/output/unittest_sources.log"""
import unittest

from tests.base import ScriptTestCase


class SourceFilesTest(ScriptTestCase):
    script = "scripts/test/test_sources.py"
    log_name = "unittest_sources.log"

    def test_sources_have_no_failures(self):
        result = self.run_script()
        self.assertEqual(result.returncode, 0, f"see .temp/output/{self.log_name}\n{result.stdout[-2000:]}")


if __name__ == "__main__":
    unittest.main()
