import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile } from "node:fs/promises";

async function expectReflow(page) {
  const state = await page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const overflow = [];
    const walker = document.createTreeWalker(document.querySelector("main"), NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || node.parentElement.closest('.visually-hidden,[aria-hidden="true"]')) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      if ([...range.getClientRects()].some(r => r.left < -1 || r.right > width + 1)) {
        overflow.push(node.textContent.trim());
      }
    }
    const clipped = [...document.querySelectorAll(".st-panel,.intro-card,.resume-card,.contact-card,.order-card,.contact-social,.resume-timeline li,.skill-tags li,.action-link,.request-checklist li")]
      // The rotated decorative marker intentionally extends outside the panel's clip.
      .filter(el => (!el.matches(".st-panel") && el.scrollWidth > el.clientWidth + 2) ||
        (getComputedStyle(el).overflowY !== "visible" && el.scrollHeight > el.clientHeight + 2))
      .map(el => ({ element: el.className, width: el.clientWidth, scrollWidth: el.scrollWidth,
        height: el.clientHeight, scrollHeight: el.scrollHeight }));
    return { overflow, clipped, width, scrollWidth: document.documentElement.scrollWidth };
  });
  expect(state.overflow).toEqual([]);
  expect(state.clipped).toEqual([]);
  expect(state.scrollWidth).toBeLessThanOrEqual(state.width);
}

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

test("resume offers a real PDF download, a viewing link and contact navigation", async ({ page, request }) => {
  await page.locator("#st-push-2").click();
  const resume = page.locator("#st-panel-2");
  await expect(page.locator("#st-push-2")).toHaveAttribute("aria-current", "location");
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    resume.getByRole("link", { name: "دریافت رزومه انگلیسی", exact: true }).click()
  ]);
  expect(download.suggestedFilename()).toBe("AliElyasi_Resume_English.pdf");
  const downloaded = await readFile(await download.path());
  const pdf = await request.get("/resumes/AliElyasi_Resume_English.pdf");
  expect(pdf.ok()).toBeTruthy();
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect(downloaded.equals(await pdf.body())).toBeTruthy();
  expect(downloaded.subarray(0, 5).toString()).toBe("%PDF-");
  const viewing = resume.getByRole("link", { name: "مشاهده رزومه", exact: true });
  await expect(viewing).toHaveAttribute("href", "resumes/AliElyasi_Resume_English.pdf");
  await expect(viewing).not.toHaveAttribute("download");
  await resume.getByRole("link", { name: "تماس برای همکاری", exact: true }).click();
  await expect(page).toHaveURL(/#st-panel-3$/);
  await expect(page.locator("#st-push-3")).toHaveAttribute("aria-current", "location");
});

test("contact channels open their exact destinations in a new tab with keyboard activation", async ({ page, context }) => {
  await page.locator("#st-push-3").click();
  const contact = page.locator("#st-panel-3");
  await expect(page.locator("#st-push-3")).toHaveAttribute("aria-current", "location");
  const channels = [
    ["ارسال پیام در تلگرام", "https://t.me/s_alielyasi"],
    ["مشاهده لینکداین", "https://www.linkedin.com/in/seyedalielyasi/"],
    ["گیت‌هاب", "https://github.com/s-alielyasi"],
    ["ویرگول", "https://virgool.io/@alielyasi/"],
    ["گودریدز", "https://www.goodreads.com/s_alielyasi"]
  ];
  for (const [name, destination] of channels) {
    // Intercept the popup's first request so no social service is contacted.
    await context.route(destination, route => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Link destination check</title>" }));
    const link = contact.getByRole("link", { name: new RegExp(name) });
    await expect(link).toHaveAttribute("href", destination);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    await expect(link).toHaveAccessibleName(/در تب جدید باز می‌شود/);
    const [popup] = await Promise.all([page.waitForEvent("popup"), link.press("Enter")]);
    await popup.waitForLoadState("domcontentloaded");
    expect(popup.url()).toBe(destination);
    await popup.close();
  }
});

test("order keeps payment available, centers the form action and links to contact", async ({ page, context }) => {
  await page.locator("#st-push-4").click();
  const order = page.locator("#st-panel-4");
  await expect(page.locator("#st-push-4")).toHaveAttribute("aria-current", "location");
  // Check payment first: it must work without visiting the request form.
  for (const [name, destination] of [
    ["ورود به درگاه پرداخت", "https://zarinp.al/@alielyasi1"],
    ["تکمیل فرم سفارش", "https://docs.google.com/forms/d/e/1FAIpQLSeuGtriWNfBJgca-vpARM9chJB3V3ERJe99U915ctJtJj7P5g/viewform?usp=sf_link"]
  ]) {
    await context.route(destination, route => route.fulfill({ contentType: "text/html", body: "<!doctype html><title>Order destination check</title>" }));
    const link = order.getByRole("link", { name: new RegExp(name) });
    await expect(link).toHaveAttribute("href", destination);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    const [popup] = await Promise.all([page.waitForEvent("popup"), link.press("Enter")]);
    await expect(popup).toHaveURL(destination);
    await popup.close();
  }
  const centered = await order.locator(".order-request").evaluate(card => {
    const bounds = card.getBoundingClientRect();
    const action = card.querySelector(".action-link").getBoundingClientRect();
    const note = card.querySelector(".order-note").getBoundingClientRect();
    return { buttonOffset: Math.abs((action.left + action.right - bounds.left - bounds.right) / 2),
      noteOffset: Math.abs((note.left + note.right - bounds.left - bounds.right) / 2) };
  });
  expect(centered.buttonOffset).toBeLessThan(1);
  expect(centered.noteOffset).toBeLessThan(1);
  await order.getByRole("link", { name: "تماس با من", exact: true }).click();
  await expect(page).toHaveURL(/#st-panel-3$/);
  await expect(page.locator("#st-push-3")).toHaveAttribute("aria-current", "location");
});

test("all sections remain reachable across portrait and landscape layouts", async ({ page }, testInfo) => {
  test.setTimeout(120_000);
  const initial = page.viewportSize();
  const sizes = testInfo.project.name.includes("mobile") || testInfo.project.name.includes("tablet")
    ? [initial, { width: initial.height, height: initial.width }]
    : [{ width: 320, height: 640 }, { width: 360, height: 640 }, { width: 390, height: 844 },
       { width: 430, height: 932 }, { width: 768, height: 1024 }, { width: 820, height: 1180 },
       { width: 1024, height: 768 }, { width: 1440, height: 900 }, { width: 1536, height: 1024 },
       { width: 640, height: 360 }, { width: 844, height: 390 }];
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("requestfailed", request => errors.push(request.url()));
  page.on("response", response => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  for (const size of sizes) {
    await page.setViewportSize(size);
    await expectReflow(page);
    for (let i = 1; i <= 4; i++) {
      const navigation = page.locator(`#st-push-${i}`);
      if (testInfo.project.use.hasTouch) await navigation.tap();
      else await navigation.click();
      await expect(page.locator(`#st-push-${i}`)).toHaveAttribute("aria-current", "location");
      await expect(page.locator("nav [aria-current]")).toHaveCount(1);
      await expect.poll(() => page.locator(`#st-panel-${i}`).evaluate(el => Math.abs(el.getBoundingClientRect().top))).toBeLessThan(2);
      const state = await page.evaluate(() => {
        const width = document.documentElement.clientWidth;
        const overflow = [...document.querySelectorAll("h1,h2,h3,h4,p,.intro-card,.resume-card,.contact-card,.order-card,.order-badge,.request-checklist li,.experience-badge,.skill-tags li,.action-link,.text-link,.contact-links a,.st-push")]
          .filter(el => { const r = el.getBoundingClientRect(); return r.left < -1 || r.right > width + 1; })
          .map(el => el.textContent.trim());
        const clipped = [...document.querySelectorAll(".st-panel")].filter(el => el.scrollHeight > el.clientHeight + 2).map(el => el.id);
        return { overflow, clipped, width, scrollWidth: document.documentElement.scrollWidth };
      });
      expect(state.overflow, JSON.stringify({ size, state })).toEqual([]);
      expect(state.clipped, JSON.stringify({ size, state })).toEqual([]);
      expect(state.scrollWidth).toBeLessThanOrEqual(state.width);
      const panel = page.locator(`#st-panel-${i}`);
      const spacing = await panel.evaluate(el => ({
        decoration: el.querySelector(".st-deco").getBoundingClientRect().bottom,
        content: el.querySelector("header").getBoundingClientRect().top
      }));
      expect(spacing.content).toBeGreaterThanOrEqual(spacing.decoration - 2);
      await testInfo.attach(`panel-${i}-${size.width}x${size.height}`, {
        body: await page.screenshot(), contentType: "image/png"
      });
      const lastLink = panel.locator("a").last();
      // Enter keyboard modality after mouse/touch navigation, as a keyboard user would.
      await page.keyboard.press("Tab");
      await lastLink.focus();
      await expect.poll(() => lastLink.evaluate(el => el.getBoundingClientRect().bottom -
        document.querySelector("nav").getBoundingClientRect().top)).toBeLessThanOrEqual(1);
    }
  }
  expect(errors).toEqual([]);
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

test("large text reflows and all section links remain reachable", async ({ page }) => {
  test.setTimeout(90_000);
  for (const size of [{ width: 320, height: 640 }, { width: 640, height: 360 }]) {
    await page.setViewportSize(size);
    // Representative home-indicator inset; this does not emulate physical hardware.
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
      document.documentElement.style.setProperty("--safe-bottom", "34px");
    });
    await expectReflow(page);
    for (const link of await page.locator(".st-panel a").all()) {
      await link.focus();
      const bounds = await link.evaluate(el => {
        const rect = el.getBoundingClientRect();
        return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom,
          width: document.documentElement.clientWidth, barTop: document.querySelector("nav").getBoundingClientRect().top };
      });
      expect(bounds.left).toBeGreaterThanOrEqual(-1);
      expect(bounds.right).toBeLessThanOrEqual(bounds.width + 1);
      expect(bounds.top).toBeGreaterThanOrEqual(-1);
      // An action taller than the available landscape viewport must still be scrollable.
      if (bounds.bottom - bounds.top <= bounds.barTop - 16) {
        expect(bounds.bottom).toBeLessThanOrEqual(bounds.barTop + 1);
      }
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const footer = page.locator(".order-support");
    expect(await footer.evaluate(el => el.getBoundingClientRect().bottom -
      document.querySelector("nav").getBoundingClientRect().top)).toBeLessThanOrEqual(-8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();
  }
});

test("direct hashes, scrolling and resize keep one active section", async ({ page }) => {
  for (let i = 4; i >= 1; i--) {
    await page.goto(`/?direct=${i}#st-panel-${i}`);
    await expect(page.locator(`#st-push-${i}`)).toHaveAttribute("aria-current", "location");
    await expect(page.locator("nav [aria-current]")).toHaveCount(1);
  }
  for (const size of [{ width: 390, height: 844 }, { width: 1024, height: 768 }]) {
    await page.setViewportSize(size);
    for (let i = 1; i <= 4; i++) {
      await page.locator(`#st-panel-${i}`).evaluate(el => {
        window.scrollTo({ top: el.offsetTop + el.offsetHeight * 0.3, behavior: "instant" });
      });
      await expect(page.locator(`#st-push-${i}`)).toHaveAttribute("aria-current", "location");
      await expect(page.locator("nav [aria-current]")).toHaveCount(1);
    }
  }
  await page.emulateMedia({ reducedMotion: "no-preference" });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("smooth");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
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
    const contact = page.locator("#st-panel-4").getByRole("link", { name: "تماس با من", exact: true });
    await contact.focus();
    await expect(contact).toBeInViewport();
    await contact.press("Enter");
    await expect(page).toHaveURL(/#st-panel-3$/);
    await expect(page.locator("#contact-title")).toBeInViewport();
    await expect(page.locator("nav [aria-current]")).toHaveCount(0);
    await page.setViewportSize({ width: 320, height: 640 });
    // CSS remains readable when scripting is unavailable, including enlarged menu labels.
    await context.route("**/assets/css/style.css", async route => {
      const response = await route.fetch();
      await route.fulfill({ response, body: `${await response.text()}\n:root { font-size: 200%; --safe-bottom: 34px; }` });
    });
    await page.reload();
    await page.locator("#st-push-4").click();
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
    await expect.poll(() => page.locator(".order-support").evaluate(el => el.getBoundingClientRect().bottom -
      document.querySelector("nav").getBoundingClientRect().top)).toBeLessThanOrEqual(-8);
    await expectReflow(page);
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
