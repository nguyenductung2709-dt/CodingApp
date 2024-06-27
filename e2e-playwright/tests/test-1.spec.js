const { test, expect } = require("@playwright/test");

test('Server responds with feedback on correct submission', async ({ page }) => {
    await page.goto("/");
    await page.locator('text=Task 1').click();
    const textarea = await page.locator('#codeBox');
    await textarea.fill("incorrect code");
    page.on('dialog', async (dialog) => {
      const message = dialog.message();
      expect(message).toContain('Error');
      await dialog.accept();
    });
    await page.locator('text=Submit for grading').click();
    await expect(page.locator('text=Pending')).toHaveText('Pending...');
    await page.waitForEvent('dialog');
  });