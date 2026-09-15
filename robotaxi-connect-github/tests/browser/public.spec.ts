import { test, expect } from '@playwright/test';
test('DE/EN switch updates content and document language', async ({ page }) => {
  await page.goto('/de');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Ihre Flotte');
  await page.getByRole('link', { name: 'EN', exact: true }).click();
  await expect(page).toHaveURL(/\/en$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Your fleet');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('registration consent starts unchecked and unavailable backend stays disabled', async ({
  page,
}) => {
  await page.goto('/de/register');
  await expect(page.getByRole('checkbox')).not.toBeChecked();
  await expect(page.getByLabel('Geschäftliche E-Mail-Adresse', { exact: false })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Weiter', exact: true })).toBeDisabled();
});
test('anonymous protected areas redirect and downloads deny access', async ({ page, request }) => {
  await page.goto('/de/admin');
  await expect(page).toHaveURL(/\/de\/login$/);
  await page.goto('/en/portal');
  await expect(page).toHaveURL(/\/en\/login$/);
  expect((await request.get('/api/documents/00000000-0000-4000-8000-000000000001')).status()).toBe(
    401,
  );
});
test('demo portal has no internal commissions and demo admin is clearly marked', async ({
  page,
}) => {
  await page.goto('/de/demo/portal');
  await expect(
    page.getByText('DEMO · ausschließlich fiktive Entwicklungsdaten', { exact: false }),
  ).toBeVisible();
  await expect(page.getByRole('main')).not.toContainText('Provision');
  await page.goto('/de/demo/admin');
  await expect(page.getByRole('heading', { name: 'Alles in Bewegung.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
