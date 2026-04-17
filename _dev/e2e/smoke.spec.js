import { test, expect } from '@playwright/test';

test('app shell loads and core planning views render', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle(/NetWorth Navigator/i);
  await expect(page.getByText(/Current Age/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /^💰 Pre-Retirement$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^🏖️ Retirement$/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^📊 Dashboard$/ })).toBeVisible();

  await page.getByRole('button', { name: /^🏖️ Retirement$/ }).click();
  await expect(page.getByText(/Required Nest Egg|Retirement Health|Survival Odds/i).first()).toBeVisible();

  await page.getByRole('button', { name: /^📊 Dashboard$/ }).click();
  await expect(page.getByText(/Financial Health|Surplus Deployment|Wealth Milestones/i).first()).toBeVisible();
});