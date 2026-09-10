from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[1]


class CrawlWorkflowTest(unittest.TestCase):
    def test_goofish_uses_china_only_keywords(self):
        workflow = (ROOT / ".github" / "workflows" / "crawl.yml").read_text(encoding="utf-8")

        self.assertIn("default: joongna,bunjang,guheyo,mercari,goofish", workflow)
        self.assertIn(
            "CHINA_KEYWORDS: ${{ inputs.china_keywords || '三亩S80,三亩s58m,MetaKeebs,realforce' }}",
            workflow,
        )
        self.assertIn('--keywords="$CHINA_KEYWORDS" --markets="goofish"', workflow)
        self.assertIn('--keywords="$KEYWORDS" --markets="$non_china_markets"', workflow)
        self.assertIn('if ! node crawl.js --keywords="$CHINA_KEYWORDS" --markets="goofish"', workflow)
        self.assertIn('::warning::Goofish crawl failed; keeping the previous data and manifest error.', workflow)

    def test_crawl_panel_selects_goofish(self):
        panel = (ROOT / "index.html").read_text(encoding="utf-8")

        self.assertIn(
            '<input name="crawl-market" type="checkbox" value="goofish" checked /> 🇨🇳 Goofish',
            panel,
        )


if __name__ == "__main__":
    unittest.main()
