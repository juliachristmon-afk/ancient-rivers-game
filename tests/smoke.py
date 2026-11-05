"""Browser integration checks. Run against the local development server.
Requires Python Playwright and system Chromium (no application dependencies).
"""
import os
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('GAME_URL', 'http://127.0.0.1:8000/rivers')


def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
        page = browser.new_page(viewport={'width': 1440, 'height': 1000}, device_scale_factor=1)
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto(BASE)
        page.get_by_role('heading', name='Big rivers. Brilliant civilizations.').wait_for()
        assert page.locator('[data-explore]').count() == 12
        page.locator('.river-tab[data-explore="indus"]').click()
        assert 'Indus Valley civilization' in page.locator('#explorer-card').inner_text()
        page.get_by_role('link', name='Field guide', exact=True).click()
        expect(page.locator('.guide-card')).to_have_count(6)
        page.get_by_role('link', name='The challenge', exact=True).click()
        page.get_by_role('heading', name='Big rivers. Brilliant civilizations.').wait_for()
        page.screenshot(path='/tmp/ancient-rivers-desktop.png', full_page=True)

        # Full round: all 24 unique questions, all four skills; spelling aliases,
        # whitespace/case normalization, scoring lock, final storage and review.
        page.locator('[data-start="mixed"]').first.click()
        questions = page.evaluate('game.questions')
        assert len(questions) == 24
        assert len({(q['river'], q['type']) for q in questions}) == 24
        seen = set()
        for index in range(24):
            q = page.evaluate('game.questions[game.index]')
            seen.add(q['type'])
            if q['type'] == 'spell':
                if q['river'] == 'huanghe':
                    answer = '  YELLOW   RIVER  '
                elif q['river'] == 'yangtze':
                    answer = ' Chang   Jiang '
                else:
                    answer = '  ' + q['answer'].upper() + '  '
                page.locator('#spelling-input').fill(answer)
                page.get_by_role('button', name='Check my spelling').click()
            else:
                if q['type'] == 'map':
                    marker = page.locator(f'g[data-map-answer="{q["answer"]}"]')
                    marker.focus()
                    marker.press('Enter')
                else:
                    page.locator(f'[data-answer="{q["answer"]}"]').click()
                page.locator('#check-answer').click()
            assert page.locator('#feedback').get_attribute('class') == 'feedback positive'
            assert page.evaluate('game.score') == (index + 1) * 10
            page.evaluate('submitAnswer(game.questions[game.index].answer)')
            assert page.evaluate('game.score') == (index + 1) * 10
            page.locator('#next-question').click()
        assert len(seen) == 4
        assert '240' in page.locator('.result-stats').inner_text()
        assert '100%' in page.locator('.best-note').inner_text()
        assert page.locator('.review-item').count() == 0
        page.screenshot(path='/tmp/ancient-rivers-results.png', full_page=True)

        # Every dedicated mode, wrong answers, hints, review and exact scores.
        for mode in ['map', 'spell', 'civilization', 'country']:
            page.goto(BASE + '/#home')
            page.locator(f'[data-start="{mode}"]').click()
            assert page.evaluate('game.questions.length') == 6
            for index in range(6):
                q = page.evaluate('game.questions[game.index]')
                if mode == 'spell':
                    if index == 0:
                        page.locator('#hint-button').click()
                        assert page.locator('#hint-text').is_visible()
                        # Whitespace-only submissions must not consume a turn.
                        page.locator('#spelling-input').fill('   ')
                        page.get_by_role('button', name='Check my spelling').click()
                        assert not page.evaluate('game.submitted')
                        page.locator('#spelling-input').fill('Nile')
                    answer = '<script>invalid</script>' if index % 2 == 0 else q['answer']
                    page.locator('#spelling-input').fill(answer)
                    page.get_by_role('button', name='Check my spelling').click()
                else:
                    options = q['options']
                    chosen = next(o['value'] for o in options if o['value'] != q['answer']) if index % 2 == 0 else q['answer']
                    if mode == 'map':
                        page.locator(f'g[data-map-answer="{chosen}"]').focus()
                        page.keyboard.press('Space')
                    else:
                        page.locator(f'[data-answer="{chosen}"]').click()
                    page.locator('#check-answer').click()
                assert page.locator('#feedback').get_attribute('class') == ('feedback negative' if index % 2 == 0 else 'feedback positive')
                page.locator('#next-question').click()
            assert page.evaluate('game.score') == 30
            assert page.locator('.review-item').count() == 3
            assert '50%' in page.locator('.best-note').inner_text()
        page.get_by_role('button', name='Explore again').click()
        page.locator('.back-link').click()
        expect(page.locator('#leave-dialog')).to_be_visible()
        page.locator('#keep-playing').click()
        assert page.evaluate('game.index') == 0
        page.locator('.back-link').click()
        page.locator('#leave-game').click()
        assert page.get_by_role('heading', name='Big rivers. Brilliant civilizations.').is_visible()
        page.get_by_role('link', name='How to play', exact=True).click()
        page.locator('#clear-scores').click()
        assert 'cleared' in page.locator('#storage-message').inner_text()
        assert page.evaluate('localStorage.getItem("ancient-rivers-best-mixed")') is None
        page.locator('#sources-button').click()
        assert page.locator('#sources-dialog').is_visible()
        page.locator('.dialog-close').click()

        # Narrow screen layout and playable answers.
        page.set_viewport_size({'width': 390, 'height': 844})
        page.goto(BASE + '/#home')
        page.screenshot(path='/tmp/ancient-rivers-mobile.png', full_page=True)
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.locator('[data-start="map"]').click()
        page.locator('.map-region-select').select_option('mesopotamia')
        assert page.locator('.atlas').get_attribute('viewBox') == '120 100 330 220'
        page.locator('[data-answer]').first.click()
        page.locator('#check-answer').click()
        assert page.locator('#feedback').is_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth')
        page.screenshot(path='/tmp/ancient-rivers-mobile-game.png', full_page=True)

        # A browser with storage blocked can still complete a full skill round.
        private = browser.new_context()
        private.add_init_script('Object.defineProperty(window, "localStorage", {get(){throw new Error("Storage blocked")}})')
        offline = private.new_page()
        offline.goto(BASE)
        offline.locator('[data-start="spell"]').click()
        for _ in range(6):
            answer = offline.evaluate('game.questions[game.index].answer')
            offline.locator('#spelling-input').fill(answer)
            offline.get_by_role('button', name='Check my spelling').click()
            offline.locator('#next-question').click()
        assert offline.evaluate('game.score') == 60
        assert offline.locator('.result-stats').is_visible()
        assert 'storage is unavailable' in offline.locator('.best-note').inner_text()
        # All loaded game activities remain functional with network disabled.
        disconnected = browser.new_context()
        local = disconnected.new_page()
        local.goto(BASE)
        disconnected.set_offline(True)
        local.locator('[data-start="spell"]').click()
        local.locator('#spelling-input').fill(local.evaluate('game.questions[game.index].answer'))
        local.get_by_role('button', name='Check my spelling').click()
        assert local.evaluate('game.score') == 10
        assert not errors, errors
        browser.close()
        print('PASS: 56 answered questions, all modes, scoring, aliases, review, keyboard map, navigation, mobile layouts, blocked storage, and offline play after loading.')


if __name__ == '__main__':
    run()
