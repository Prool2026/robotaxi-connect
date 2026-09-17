import {chromium} from '@playwright/test';
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
try {
const page=await browser.newPage();
for(const width of [1440,390]) {
await page.setViewportSize({width,height:900});
for(const lang of ['de','en']) {
await page.goto(`http://127.0.0.1:3100/${lang}/demo/portal/account`);
if(await page.locator('input[name=current_password]').count()!==3) throw Error('Missing password fields');
if(await page.locator('input[name=confirm_delete]').isChecked()) throw Error('Deletion prechecked');
if(!(await page.locator('input[name=delete_word]').getAttribute('required')!==null)) throw Error('No confirmation');
if(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)) throw Error('Overflow');
await page.screenshot({path:`release/account-${lang}-${width}.png`,fullPage:true});
await page.goto(`http://127.0.0.1:3100/${lang}/register?type=technology`);
if(await page.locator('input[name=account_type]').getAttribute('value')!=='technology') throw Error('Provider type lost');
for(const path of ['konto','anbieter','admin/provider-accounts']) {
await page.goto(`http://127.0.0.1:3100/${lang}/${path}`);
if(!page.url().includes('/login')) throw Error('Private route accessible '+path);
}
}
}
console.log('DE/EN account layout desktop/mobile, explicit deletion confirmation, provider registration and anonymous access checks passed.');
} finally {await browser.close();}
