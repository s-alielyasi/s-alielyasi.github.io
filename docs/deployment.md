# انتشار در GitHub Pages

مخزن هدف `s-alielyasi/s-alielyasi.github.io` و شاخهٔ اصلی/انتشار `master` است. دامنهٔ ثبت‌شده در سورس `ali-elyasi.ir` است. سایت همچنان فایل‌های استاتیک دارد؛ Node.js فقط برای ابزارهای توسعه و آماده‌سازی artifact استفاده می‌شود.

## مسئولیت عملیات

ایجاد و ادغام پول‌ریکوئست، کار با GitHub Actions و تنظیم و انتشار GitHub Pages را مالک از رابط گیت‌هاب انجام می‌دهد. تحویل تغییرات توسعه روی برنچ مستقل انجام می‌شود؛ عامل بدون درخواست صریح مرتبط، PR ایجاد یا ادغام نمی‌کند، workflow اجرا نمی‌کند و تنظیمات یا انتشار Pages را تغییر نمی‌دهد. اتصال GitHub عامل پیش‌نیاز توسعه و تحویل محلی نیست.

workflow و ابزارهای ساخت و تست برای استفادهٔ مالک نگه‌داری می‌شوند. triggerهای فعلی روی PR و push همچنان فعال‌اند؛ کنترل عملیات توسط مالک به معنی تبدیل workflow به اجرای صرفاً دستی نیست.

## مسیر انتشار توسط مالک

1. تغییرات شاخهٔ کاری و نتیجهٔ بررسی محلی مرور و شاخه به همان مخزن push شود.
2. از رابط گیت‌هاب پول‌ریکوئست به `master` باز شود؛ عنوان و شرح آن متناسب با همان تغییر نوشته شوند. job با نام `checks`، نصب وابستگی‌ها از lockfile، اعتبارسنجی فایل‌ها و تست‌های Playwright/axe را اجرا می‌کند. گزارش HTML تست‌ها artifact اجراست.
3. در Settings → Pages، مقدار Source برابر **GitHub Actions** باشد؛ دامنهٔ سفارشی و HTTPS موجود حفظ شوند. تغییر این تنظیم به دسترسی مدیریت Pages نیاز دارد.
4. پس از بررسی و ادغام PR در `master`، همان checks دوباره اجرا می‌شوند. فقط در صورت موفقیت آن‌ها، artifact آماده و job با نام `deploy` اجرا می‌شود.
5. `configure-pages` و `deploy-pages` نسخهٔ `dist/` را در محیط `github-pages` منتشر می‌کنند. اگر environment نیازمند تأیید مالک باشد، اجرای GitHub در همان مرحله منتظر می‌ماند.
6. آخرین گام، نسخهٔ زنده را با `scripts/verify-live.mjs` بررسی می‌کند. عنوان، description، canonical، JSON-LD، robots، sitemap و hash کل HTML و فایل‌های CSS، JavaScript، فونت و رزومه باید با همین کامیت هماهنگ باشند. برای انتشار CDN تا حدود دو دقیقه تلاش مجدد انجام می‌شود.

workflow روی PR به سایت زنده deploy نمی‌کند. اجرای دستی از تب Actions نیز فقط با انتخاب شاخهٔ `master` انتشار دارد. اسکریپت بررسی زنده موفقیت HTTP را با همسان بودن نسخهٔ منتشرشده اشتباه نمی‌گیرد.

برای اجرای دستی، در Actions، workflow با نام **Site checks and Pages deployment** را باز کنید، **Run workflow** و شاخهٔ `master` را انتخاب کنید. پس از پایان، نتیجهٔ هر دو job با نام‌های `checks` و `deploy` و گام **Verify the deployed version over HTTPS** را ببینید. انتخاب شاخهٔ دیگر فقط checks را اجرا می‌کند. آخرین نتیجهٔ تأییدشده در [status.md](status.md) ثبت می‌شود؛ موفقیت اجرای قبلی جایگزین بررسی اجرای جدید نیست.

## آماده‌سازی محلی

Node.js حداقل 22.12 و سیستم‌عامل پشتیبانی‌شدهٔ Playwright لازم است:

```bash
npm ci
npm run check
npm run test:release
npx playwright install --with-deps chromium firefox webkit
npm test
npm run build
node scripts/serve.mjs
```

نسخهٔ آماده در `http://127.0.0.1:4173` دیده می‌شود.

`test:release` با test runner خود Node و OpenSSL، fixtureهای HTTPS محلی می‌سازد؛ پذیرش نسخهٔ صحیح، رد عنوان/HTML/asset قدیمی و رد HTTP ساده را بررسی می‌کند. گواهی آزمایشی فقط برای فرایند فرزند همان تست معتبر می‌شود و تنظیم TLS عمومی تغییر نمی‌کند.

اگر دریافت Chrome for Testing از محل اجرا محدود باشد، Chrome نصب‌شده با متغیر `PW_CHROME_CHANNEL=chrome` برای پروژه‌های Chromium قابل استفاده است؛ در این حالت فقط Firefox و WebKit با Playwright نصب شوند. این جایگزین در تست محلی استفاده شده و تنظیمات CI به‌صورت پیش‌فرض مرورگرهای خود Playwright را نصب می‌کند.

بعد از انتشار می‌توان مستقل از workflow اجرا کرد:

```bash
npm run verify:live
```

پیش از انتشار، شکست این دستور به دلیل تفاوت نسخهٔ زنده با سورس محلی مورد انتظار است.

## محتویات artifact

فقط `index.html`، `assets/`، `resumes/`، `robots.txt`، `sitemap.xml`، `CNAME`، `LICENSE` و `.nojekyll` تولیدشده در `dist/` منتشر می‌شوند. مجوز فونت داخل assets باقی می‌ماند. مستندات توسعه، تست‌ها، node_modules، تنظیمات CI و `.git` وارد artifact نمی‌شوند. پوشهٔ `dist/` در گیت ثبت نمی‌شود.

اکشن‌ها به SHA کامل نسخهٔ رسمی قفل شده‌اند. سطح دسترسی checks فقط خواندن سورس است؛ دسترسی `pages: write` و `id-token: write` به job انتشار محدود است. workflow از `pull_request_target` استفاده نمی‌کند.

## بررسی و رفع اشکال

- نتیجهٔ checks و گزارش Playwright از تب Actions همان PR دیده شود؛ خطای تست با deploy مجدد رفع نمی‌شود.
- برای خطای Pages، Source، تنظیمات محیط `github-pages` و پیام job انتشار بررسی شوند. `CNAME` به‌تنهایی منبع انتشار را عوض نمی‌کند.
- در شکست بررسی نسخهٔ زنده، عنوان و assetهای زنده با همان commit مقایسه شوند. در صورت تأخیر CDN، بررسی دوباره انجام شود.
- تغییر DNS یا دامنه فقط پس از دیدن وضعیت موجود انجام شود؛ در این تغییر نیازی به تغییر دامنهٔ فعلی تعریف نشده است.
- تأیید ایندکس و canonical انتخابی موتور جست‌وجو به بررسی پس از انتشار و در صورت نیاز دسترسی Search Console نیاز دارد؛ تست محلی یا deploy موفق آن را اثبات نمی‌کند.

## بررسی‌های انسانی

تست‌های دستگاه در Playwright شبیه‌سازی‌اند. برای بستن کامل بررسی واقعی موبایل/تبلت، Safari روی دستگاه Apple، چرخش و safe area و کار با صفحه‌خوان، روی سخت‌افزار/ابزار مناسب بررسی و نتیجه ثبت شود. وجود ساختار ARIA و موفقیت axe بخشی از این بررسی است.

تست عمومی لینک‌ها با `npm run test:links -- docs/link-checks.json` انجام می‌شود. پاسخ‌های 401، 403، 429 و 999 یا خطای شبکه، وضعیت محدود/نامطمئن هستند و به‌تنهایی اثبات حذف مقصد نیستند؛ تنظیمات دسترسی فرم گوگل باید توسط مالک فرم بررسی شوند.

منابع: [انتشار با workflow سفارشی GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)، [منبع انتشار Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)، [Playwright](https://playwright.dev/docs/intro) و [Docker رسمی Playwright](https://playwright.dev/docs/docker).
