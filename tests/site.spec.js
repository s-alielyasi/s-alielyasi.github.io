import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.beforeEach(async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
});

test("titles, SEO and professional content are present without duplicate headings", async ({ page, request }) => {
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  await expect(page).toHaveTitle("Ali Elyasi | Product Manager, Software & Quality");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("علی الیاسی مدیریت محصول، نرم‌افزار و کیفیت");
  for (const name of ["تجربه‌ها", "پروژه‌ها", "نوشته‌ها"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }
  const description = await page.locator('meta[name="description"]').getAttribute("content");
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", description);
  const data = await page.locator('script[type="application/ld+json"]').textContent();
  expect(JSON.parse(data)["@graph"].find(node => node["@type"] === "ProfilePage").description).toBe(description);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.ok()).toBeTruthy();
  expect(await sitemap.text()).toContain(`<loc>${canonical}</loc>`);
  const robots = await request.get("/robots.txt");
  expect(await robots.text()).toContain(`Sitemap: ${canonical}sitemap.xml`);
});

test("home actions open the intended sections and preserve browser history", async ({ page }) => {
  const home = page.locator("#st-panel-1");
  for (const [name, panel] of [["مشاهده رزومه", 2], ["گفت‌وگو درباره همکاری", 3],
    ["مرور سوابق", 2], ["جزئیات در رزومه", 2]]) {
    await home.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`#st-panel-${panel}$`));
    await expect(page.locator(`#st-push-${panel}`)).toHaveAttribute("aria-current", "location");
    await page.goBack();
    await expect(page.locator("#st-push-1")).toHaveAttribute("aria-current", "location");
    await page.goForward();
    await expect(page.locator(`#st-push-${panel}`)).toHaveAttribute("aria-current", "location");
    await page.goBack();
  }
  const writing = home.getByRole("link", { name: /مشاهده ویرگول/ });
  await expect(writing).toHaveAttribute("href", "https://virgool.io/@alielyasi/");
  await expect(writing).toHaveAttribute("target", "_blank");
  await expect(writing).toHaveAttribute("rel", "noopener noreferrer");
});

test("all sections remain reachable across portrait and landscape layouts", async ({ page }, testInfo) => {
  const initial = page.viewportSize();
  const sizes = testInfo.project.name.includes("mobile") || testInfo.project.name.includes("tablet")
    ? [initial, { width: initial.height, height: initial.width }]
    : [{ width: 320, height: 640 }, { width: 390, height: 844 }, { width: 768, height: 1024 },
       { width: 1024, height: 768 }, { width: 1440, height: 900 }, { width: 640, height: 360 }];
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const size of sizes) {
    await page.setViewportSize(size);
    for (let i = 1; i <= 4; i++) {
      const navigation = page.locator(`#st-push-${i}`);
      if (testInfo.project.use.hasTouch) await navigation.tap();
      else await navigation.click();
      await expect(page.locator(`#st-push-${i}`)).toHaveAttribute("aria-current", "location");
      await expect.poll(() => page.locator(`#st-panel-${i}`).evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(2);
      const state = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const overflow = [...document.querySelectorAll("h1,h2,p,.intro-card,.action-link,.text-link,.contact-links a,.st-push")]
          .filter(el => { const r = el.getBoundingClientRect(); return r.left < -1 || r.right > width + 1; })
          .map(el => el.textContent.trim());
        const clipped = [...document.querySelectorAll(".st-panel")].filter(el => el.scrollHeight > el.clientHeight + 2).map(el => el.id);
        return { overflow, clipped, width, scrollWidth: document.documentElement.scrollWidth };
      });
      expect(state.overflow, JSON.stringify({ size, state })).toEqual([]);
      expect(state.clipped, JSON.stringify({ size, state })).toEqual([]);
      expect(state.scrollWidth).toBeLessThanOrEqual(state.width);
    }
  }
  expect(errors).toEqual([]);
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  await testInfo.attach("homepage", { body: await page.screenshot(), contentType: "image/png" });
});

test("every link is reachable with Tab, has visible focus and stays above the bottom bar", async ({ page }) => {
  const links = page.locator("a[href]");
  for (let i = 0; i < await links.count(); i++) {
    await page.keyboard.press("Tab");
    await expect(links.nth(i)).toBeFocused();
    const state = await links.nth(i).evaluate(el => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const bar = document.querySelector("#st-push-box").getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, outline: style.outlineStyle,
        limit: el.closest("nav") ? innerHeight : bar.top };
    });
    expect(state.outline).not.toBe("none");
    expect(state.top).toBeGreaterThanOrEqual(-1);
    expect(state.bottom).toBeLessThanOrEqual(state.limit + 1);
  }
});

test("skip link and keyboard section navigation work", async ({ page }) => {
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  await page.locator("#st-push-4").focus();
  await page.keyboard.press("Enter");
  await expect(page.locator("#st-push-4")).toHaveAttribute("aria-current", "location");
  await expect(page.locator("#st-panel-4")).toBeFocused();
});

test("large text reflows and home links and the final action remain reachable", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await page.evaluate(() => { document.documentElement.style.fontSize = "200%"; });
  for (const link of await page.locator("#st-panel-1 a").all()) {
    await link.focus();
    const bounds = await link.evaluate(el => {
      const rect = el.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
        width: document.documentElement.clientWidth, barTop: document.querySelector("nav").getBoundingClientRect().top };
    });
    expect(bounds.left).toBeGreaterThanOrEqual(-1);
    expect(bounds.right).toBeLessThanOrEqual(bounds.width + 1);
    expect(bounds.top).toBeGreaterThanOrEqual(-1);
    expect(bounds.bottom).toBeLessThanOrEqual(bounds.barTop + 1);
  }
  await page.locator("#st-push-4").click();
  const action = page.locator("#st-panel-4 .action-link").last();
  await action.focus();
  const layout = await action.evaluate(el => ({
    right: el.getBoundingClientRect().right,
    bottom: el.getBoundingClientRect().bottom,
    width: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    barTop: document.querySelector("nav").getBoundingClientRect().top
  }));
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.width);
  expect(layout.right).toBeLessThanOrEqual(layout.width);
  expect(layout.bottom).toBeLessThanOrEqual(layout.barTop + 1);
});

test("WCAG automated checks and screen-reader semantics", async ({ page }) => {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(results.violations).toEqual([]);
  await expect(page.getByRole("navigation", { name: "بخش‌های سایت" })).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  const snapshot = await page.locator("main").ariaSnapshot();
  expect(snapshot).toContain('heading "علی الیاسی مدیریت محصول، نرم‌افزار و کیفیت" [level=1]');
  expect(snapshot).toContain('heading "رزومه من" [level=2]');
  expect(snapshot).not.toContain('generic: "۱"');
});

test("section links work with JavaScript disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL: "http://127.0.0.1:4173" });
  try {
    const page = await context.newPage();
    await page.goto("/");
    await page.locator("#st-push-4").click();
    await expect(page).toHaveURL(/#st-panel-4$/);
    await expect(page.locator("#st-panel-4 .action-link").first()).toBeInViewport();
    await expect(page.locator("nav [aria-current]")).toHaveCount(0);
  } finally {
    await context.close();
  }
});

test("release artifact serves fonts and resume, and excludes development files", async ({ request }) => {
  for (const file of ["/assets/fonts/vazir/Vazir-Regular-FD.woff2", "/assets/fonts/vazir/OFL.txt", "/resumes/AliElyasi_Resume_English.pdf", "/LICENSE"]) {
    const response = await request.get(file);
    expect(response.ok(), file).toBeTruthy();
    expect((await response.body()).length).toBeGreaterThan(0);
  }
  for (const file of ["/AGENTS.md", "/docs/memory.md", "/package.json", "/.git/config", "/resumes/AliElyasi_Resume_Persian.pdf"]) {
    expect((await request.get(file)).status(), file).toBe(404);
  }
});
