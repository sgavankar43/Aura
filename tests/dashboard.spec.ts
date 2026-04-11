import { test, expect } from '@playwright/test';

test.describe('Aura Dashboard Critical Journeys', () => {
  // Use a predictable test project name
  const projectName = `Test Project ${Date.now()}`;

  test.beforeEach(async ({ page }) => {
    // We would normally seed the DB here, but we will test the full flow
    await page.goto('/');
  });

  test('Login Flow', async ({ page }) => {
    // This is a placeholder test for the login flow since we don't have a live DB seeded
    // In a real E2E environment we'd use test.step to group actions

    // Assumes we redirect to login when unauthenticated
    await expect(page).toHaveURL(/.*login/);

    const emailInput = page.getByPlaceholder('admin@example.com');
    const passwordInput = page.getByPlaceholder('••••••••');
    const submitBtn = page.getByRole('button', { name: 'Sign in' });

    // Ensure elements exist
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    // We stop here to avoid actual network requests in the E2E scaffolding
    // unless the backend is running with a seeded test DB.
    test.fixme(true, 'Requires backend running with seeded test DB');
  });

  test('Project Creation & Flag Toggle Flow', async ({ page }) => {
    test.fixme(true, 'Requires backend running with seeded test DB and authenticated user context');

    // 1. Create Project
    await page.getByRole('button', { name: 'New Project' }).click();
    await page.getByPlaceholder('e.g. Frontend App').fill(projectName);
    await page.getByRole('button', { name: 'Create' }).click();

    // 2. Click into project
    await page.getByText(projectName).click();

    // 3. Ensure Feature Grid loads
    await expect(page.getByText('Feature Flags')).toBeVisible();

    // 4. Toggle a flag
    // (Assume a feature exists or we create one first)
    const toggleButton = page.getByRole('button', { name: 'OFF' }).first();
    await toggleButton.click();

    // 5. Verify optimistic update
    await expect(toggleButton).toHaveText('ON');
    await expect(toggleButton).toHaveClass(/success/);
  });
});
