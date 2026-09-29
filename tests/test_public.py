"""Generated-output validation (`npm run check` helper) as a unittest.

Needs `npm run build` first; skipped when public/ is absent. Log: .temp/output/unittest_public.log
"""
import unittest

from tests.base import ROOT, ScriptTestCase


@unittest.skipUnless((ROOT / "public").is_dir(), "public/ not built (run `npm run build`)")
class PublicOutputTest(ScriptTestCase):
    script = "scripts/check_public.py"
    log_name = "unittest_public.log"

    def test_public_has_no_failures(self):
        result = self.run_script()
        self.assertEqual(result.returncode, 0, f"see .temp/output/{self.log_name}\n{result.stdout[-2000:]}")


if __name__ == "__main__":
    unittest.main()
