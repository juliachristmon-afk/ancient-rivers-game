"""Verify arcade entry points, portrait, responsive layout, and return navigation."""
import os
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('ARCADE_URL', 'http://127.0.0.1:8000').rstrip('/')

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), headless=True, args=['--no-sandbox'])
    page = browser.new_page(viewport={'width': 1440, 'height': 1000})
    errors = []
    failures = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('response', lambda r: failures.append(r.url) if r.status >= 400 else None)
    page.goto(BASE)
    expect(page.get_by_role('heading', level=1)).to_have_text('Ancient WorldLearning Arcade')
    expect(page.locator('.class-subtitle')).to_have_text("Mrs. Christmon's Ancient Civilizations Class")
    portrait = page.get_by_role('img', name='Mrs. Christmon, your ancient civilizations teacher')
    expect(portrait).to_be_visible()
    assert portrait.evaluate('(img) => img.complete && img.naturalWidth > 0')
    assert page.locator('a[href="rivers/"]').count() == 4
    page.screenshot(path='/tmp/arcade-home-desktop.png', full_page=True)
    for width in [320, 390, 768, 1024, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), f'Overflow at {width}px'
        if width == 390:
            page.screenshot(path='/tmp/arcade-home-mobile.png', full_page=True)
    page.get_by_role('link', name='Play Ancient Rivers & Civilizations', exact=True).click()
    expect(page.get_by_role('heading', name='Big rivers. Brilliant civilizations.')).to_be_visible()
    page.set_viewport_size({'width': 320, 'height': 900})
    assert page.evaluate('document.documentElement.scrollWidth <= innerWidth'), 'Game header overflow at 320px'
    page.get_by_role('link', name='← Arcade', exact=True).click()
    expect(page.get_by_role('heading', level=1)).to_have_text('Ancient WorldLearning Arcade')
    page.locator('a[href="rivers/#guide"]').click()
    expect(page.locator('.guide-card')).to_have_count(6)
    page.get_by_role('link', name='← Arcade', exact=True).click()
    page.locator('a[href="rivers/#how"]').click()
    expect(page.get_by_role('heading', name='A few helpful trail notes')).to_be_visible()
    assert not errors, errors
    assert not failures, failures
    browser.close()
    print('PASS: homepage, portrait, game entry points, field guide, instructions, return navigation, and five responsive widths.')
