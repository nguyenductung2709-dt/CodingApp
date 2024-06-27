const { test, expect } = require("@playwright/test");

test('After completing an assignment, move to the next assignment', async ({ page }) => {
    await page.goto("/");
    await page.locator('text=Task 1').click();
    const textarea = await page.locator('#codeBox');
    await textarea.fill(`def hello():
        return "Hello"
    `);
    page.on('dialog', async (dialog) => {
        await dialog.accept();  
    });
    await page.locator('text=Submit for grading').click();
    await expect(page.locator('text=Pending')).toHaveText('Pending...');
    await page.waitForEvent('dialog');
    await expect(page.locator('text=Write a function "hello" that returns the string "Hello world!"')).toHaveText('Write a function "hello" that returns the string "Hello world!"');
});
