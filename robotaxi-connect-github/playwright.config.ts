import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  use: {
    baseURL: process.env.ROBOTAXI_BROWSER_URL || 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
  webServer: process.env.ROBOTAXI_BROWSER_URL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://127.0.0.1:3100/de',
        reuseExistingServer: true,
        env: { ROBOTAXI_DEMO: 'true' },
        timeout: 120000,
      },
});
