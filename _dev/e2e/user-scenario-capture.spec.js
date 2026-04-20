import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.setTimeout(120000);

const CURRENT_YEAR = new Date().getFullYear();

const ESCAPE_REGEX = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#38bdf8', '#60a5fa', '#8b5cf6', '#c084fc',
  '#f43f5e', '#f59e0b', '#fb7185', '#10b981', '#06b6d4', '#6366f1', '#a855f7', '#ec4899', '#f97316', '#94a3b8',
];

const CATEGORY_ROWS = [
  { label: 'Housing', monthly: 14939, group: 'essential', preRate: 4.0, retRate: 3.0 },
  { label: 'Education', monthly: 5911, group: 'essential', preRate: 5.0, retRate: 4.0 },
  { label: 'Groceries', monthly: 3593, group: 'essential', preRate: 3.5, retRate: 3.0 },
  { label: 'Dining & Restaurants', monthly: 1618, group: 'disc', preRate: 4.5, retRate: 3.5 },
  { label: 'Auto & Transport', monthly: 1574, group: 'essential', preRate: 3.0, retRate: 2.5 },
  { label: 'Utilities & Bills', monthly: 1528, group: 'essential', preRate: 3.0, retRate: 2.8 },
  { label: 'Fashion & Clothing', monthly: 1071, group: 'disc', preRate: 3.0, retRate: 2.8 },
  { label: 'Health & Fitness', monthly: 693, group: 'essential', preRate: 5.0, retRate: 4.0 },
  { label: 'Travel & Hotels', monthly: 621, group: 'disc', preRate: 4.5, retRate: 3.5 },
  { label: 'General Shopping', monthly: 521, group: 'disc', preRate: 3.0, retRate: 2.8 },
  { label: 'Home & Household', monthly: 501, group: 'essential', preRate: 3.0, retRate: 2.8 },
  { label: 'Entertainment', monthly: 495, group: 'disc', preRate: 3.5, retRate: 3.0 },
  { label: 'Domestic Help', monthly: 281, group: 'essential', preRate: 2.5, retRate: 2.3 },
  { label: 'Uncategorized', monthly: 141, group: 'disc', preRate: 3.0, retRate: 2.5 },
  { label: 'Personal Care & Beauty', monthly: 115, group: 'disc', preRate: 3.0, retRate: 2.8 },
  { label: 'Government & Fees', monthly: 76, group: 'essential', preRate: 2.5, retRate: 2.2 },
  { label: 'Subscriptions & Digital', monthly: 34, group: 'disc', preRate: 2.0, retRate: 2.0 },
  { label: 'Gifts & Occasions', monthly: 31, group: 'disc', preRate: 3.0, retRate: 2.5 },
  { label: 'Insurance', monthly: 14, group: 'essential', preRate: 2.5, retRate: 2.2 },
  { label: 'Home Improvements', monthly: 12, group: 'disc', preRate: 3.5, retRate: 3.0 },
];

const rowKey = (label) => `csv_${label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;

const CATEGORY_DATA = CATEGORY_ROWS.map((row, idx) => {
  return {
    ...row,
    key: rowKey(row.label),
    annualPre: Math.round(row.monthly * 12),
    annualRet: Math.round(row.monthly * 12 * 0.7),
    color: COLORS[idx % COLORS.length],
  };
});

const sum = (list, mapper) => list.reduce((acc, item) => acc + mapper(item), 0);

const buildScenarioData = () => {
  const categories = CATEGORY_DATA.map((row) => ({
    key: row.key,
    label: row.label,
    color: row.color,
    group: row.group,
    icon: '📌',
    tooltip: row.label,
  }));

  const expenseCalculator = Object.fromEntries(CATEGORY_DATA.map((row) => [row.key, row.annualPre]));
  const retirementBudget = Object.fromEntries(CATEGORY_DATA.map((row) => [row.key, row.annualRet]));
  const expenseGrowthRates = Object.fromEntries(CATEGORY_DATA.map((row) => [row.key, row.preRate]));
  const retExpenseGrowthRates = Object.fromEntries(CATEGORY_DATA.map((row) => [row.key, row.retRate]));
  const expenseTags = Object.fromEntries(CATEGORY_DATA.map((row) => [row.key, row.group]));
  const expensePhaseOutYears = Object.fromEntries(CATEGORY_DATA.map((row) => [row.key, null]));
  const retExpensePhaseOutYears = Object.fromEntries(CATEGORY_DATA.map((row) => [row.key, null]));

  return {
    version: '2.0',
    currency: 'AED',
    exchangeRates: {
      AED: 1,
      USD: 3.67,
      CAD: 2.72,
      EUR: 4.01,
      GBP: 4.87,
    },
    profile: {
      currentAge: 37,
      retirementAge: 55,
      lifeExpectancy: 85,
      dependents: 2,
    },
    assets: {
      cash: 115000,
      investments: 600000,
      realEstate: 4000000,
      other: 35000,
      cashItems: [{ id: 1, name: 'Emergency + checking', amount: 115000 }],
      investmentItems: [{ id: 1, name: 'Investment portfolio', amount: 600000 }],
      realEstateItems: [{ id: 1, name: 'Primary real estate', amount: 4000000 }],
      otherItems: [{ id: 1, name: 'Other assets', amount: 35000 }],
    },
    liabilities: {
      mortgage: 1300000,
      loans: 250000,
      other: 0,
      mortgageItems: [{ id: 1, name: 'Mortgage', amount: 1300000, endYear: 2051 }],
      loanItems: [{ id: 1, name: 'Loans', amount: 250000, endYear: 2027 }],
      otherLiabilityItems: [{ id: 1, name: 'Other liabilities', amount: 0, endYear: null }],
    },
    income: {
      salary: 600000,
      passive: 96000,
      other: 0,
      salaryItems: [{ id: 1, name: 'Salary', amount: 600000, endYear: null }],
      passiveItems: [{ id: 1, name: 'Passive income', amount: 96000, endYear: null }],
      otherIncomeItems: [{ id: 1, name: 'Other income', amount: 0, endYear: null }],
    },
    expenses: {
      current: sum(CATEGORY_DATA, (row) => row.annualPre),
      retirement: sum(CATEGORY_DATA, (row) => row.annualRet),
    },
    expenseCategories: categories,
    expenseCalculator,
    retirementBudget,
    expenseGrowthRates,
    retExpenseGrowthRates,
    expenseTags,
    expensePhaseOutYears,
    retExpensePhaseOutYears,
    lifeEvents: [],
    assumptions: {
      salaryGrowth: 2.0,
      passiveGrowth: 2.0,
      otherIncomeGrowth: 2.0,
      investmentReturn: 6.5,
      investmentStdDev: 12.0,
      realEstateAppreciation: 3.5,
      realEstateStdDev: 7.0,
      otherAssetGrowth: 0.0,
      otherAssetStdDev: 5.0,
      enableDrawdown: true,
    },
    oneTimeExpenses: [
      { id: 1, year: 2031, description: 'New car', amount: 80000, category: rowKey('Auto & Transport'), endYear: null },
      { id: 2, year: 2048, description: 'Home renovation', amount: 180000, category: rowKey('Housing'), endYear: null },
    ],
    nestEggSwr: 4,
    surplusSplitInvest: 100,
    surplusSplitDebt: 0,
  };
};

const attachDialogHandler = (page) => {
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });
};

const tabByName = (page, label) => {
  return page.getByRole('button', {
    name: new RegExp(`(?:^|\\s)${ESCAPE_REGEX(label)}$`),
  }).first();
};

const openRibbonMenu = async (page) => {
  await page.getByRole('button', { name: '⋯' }).click();
};

const importJsonPayload = async (page, payload) => {
  await openRibbonMenu(page);
  await page.locator('input[type="file"][accept=".json"]').setInputFiles({
    name: 'user-scenario.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(payload)),
  });
  await page.waitForTimeout(350);
};

const setRangeValue = async (locator, value) => {
  await locator.evaluate((el, val) => {
    const next = String(val);
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    if (descriptor?.set) {
      descriptor.set.call(el, next);
    } else {
      el.value = next;
    }
    el.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, value);
};

const readRangeMeta = async (locator) => locator.evaluate((el) => ({
  value: el.value,
  min: el.min,
  max: el.max,
  step: el.step,
}));

const toFinite = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const readRunwayYears = (text, label) => {
  if (!text) return null;
  const m = text.match(new RegExp(`${label}[\\s\\S]*?(\\d+)yrs`, 'i'));
  return m ? Number(m[1]) : null;
};

const parseRunwayYearsSnapshot = (text) => ({
  pessimistic: readRunwayYears(text, 'Pessimistic'),
  base: readRunwayYears(text, 'Base'),
  optimistic: readRunwayYears(text, 'Optimistic'),
});

const assertRunwayControls = (state, expected, label) => {
  expect(toFinite(state?.pessimisticReturn?.value), `${label}: pessimistic return`).toBeCloseTo(expected.pessimisticReturn, 6);
  expect(toFinite(state?.pessimisticSpend?.value), `${label}: pessimistic spend`).toBeCloseTo(expected.pessimisticSpend, 6);
  expect(toFinite(state?.optimisticReturn?.value), `${label}: optimistic return`).toBeCloseTo(expected.optimisticReturn, 6);
  expect(toFinite(state?.optimisticSpend?.value), `${label}: optimistic spend`).toBeCloseTo(expected.optimisticSpend, 6);
};

const getPanelText = async (page, anchorText) => {
  const panel = page.locator('div').filter({ hasText: anchorText }).first();
  return panel.isVisible().then(async (visible) => {
    if (!visible) return null;
    return panel.innerText();
  });
};

test('capture user scenario outputs across tabs', async ({ page }) => {
  attachDialogHandler(page);
  await page.addInitScript(() => {
    window.localStorage.removeItem('nwn_autosave');
  });
  await page.goto('/');

  const payload = buildScenarioData();
  const clonePayload = (base) => JSON.parse(JSON.stringify(base));
  await importJsonPayload(page, payload);

  const capture = {
    generatedAt: new Date().toISOString(),
    scenario: {
      currentYear: CURRENT_YEAR,
      profile: payload.profile,
      assets: payload.assets,
      liabilities: payload.liabilities,
      income: payload.income,
      assumptions: payload.assumptions,
      nestEggSwr: payload.nestEggSwr,
      totals: payload.expenses,
      oneTimeExpenses: payload.oneTimeExpenses,
      categoryRows: CATEGORY_DATA,
    },
    panels: {},
    snapshots: {},
    debug: {},
  };

  // Dashboard baseline
  await tabByName(page, 'Dashboard').click();
  await page.waitForTimeout(200);
  capture.panels.dashboardBaseline = await page.locator('body').innerText();
  capture.panels.dashboardSurplusBaseline = await getPanelText(page, '💸 Surplus Deployment');

  // Open surplus details and test split extremes
  const surplusToggle = page.getByRole('button', { name: /Show Details|Hide Details/ }).first();
  if (await surplusToggle.isVisible()) {
    const txt = await surplusToggle.innerText();
    if (/Show Details/i.test(txt)) {
      await surplusToggle.click();
      await page.waitForTimeout(150);
    }
  }
  capture.panels.dashboardSurplusExpandedBaseline = await getPanelText(page, '💸 Surplus Deployment');

  const surplusPanel = page.locator('div').filter({ hasText: '💸 Surplus Deployment' }).first();
  const splitSliders = surplusPanel.locator('input[type="range"][min="0"][max="100"]');
  if (await splitSliders.count() >= 2) {
    const investSlider = splitSliders.nth(0);
    const debtSlider = splitSliders.nth(1);
    capture.debug.surplusSplitBefore = {
      invest: await readRangeMeta(investSlider),
      debt: await readRangeMeta(debtSlider),
    };

    await setRangeValue(investSlider, 0);
    await page.waitForTimeout(120);
    await setRangeValue(debtSlider, 100);
    await page.waitForTimeout(220);
    capture.debug.surplusSplitAfterDebtFirst = {
      invest: await readRangeMeta(investSlider),
      debt: await readRangeMeta(debtSlider),
    };
    capture.panels.dashboardSurplusDebtFirst = await surplusPanel.innerText();

    await setRangeValue(debtSlider, 0);
    await page.waitForTimeout(120);
    await setRangeValue(investSlider, 100);
    await page.waitForTimeout(220);
    capture.debug.surplusSplitAfterInvestFirst = {
      invest: await readRangeMeta(investSlider),
      debt: await readRangeMeta(debtSlider),
    };
    capture.panels.dashboardSurplusInvestFirst = await surplusPanel.innerText();
  }

  // Pre-retirement baseline
  await tabByName(page, 'Pre-Retirement').click();
  await page.waitForTimeout(250);
  capture.panels.preRetBudget = await getPanelText(page, '📋 Pre-Retirement Budget');
  capture.panels.preRetFutureProjectionBaseline = await getPanelText(page, '🔭 Project to a Future Year');

  // Open What-If and apply adjustments
  const whatIfPanel = page.locator('div').filter({ hasText: '🎯 What-If Scenarios' }).first();
  const whatIfToggle = whatIfPanel.getByRole('button', { name: /Show Details|Hide Details/ }).first();
  if (await whatIfToggle.isVisible()) {
    const txt = await whatIfToggle.innerText();
    if (/Show Details/i.test(txt)) {
      await whatIfToggle.click();
      await page.waitForTimeout(150);
    }
  }

  const picker = whatIfPanel.locator('select').first();
  const addButton = whatIfPanel.getByRole('button', { name: '+ Add adjustment' }).first();

  if (await picker.isVisible() && await addButton.isVisible()) {
    await picker.selectOption(rowKey('Housing'));
    await addButton.click();
    await picker.selectOption(rowKey('Education'));
    await addButton.click();
    await picker.selectOption(rowKey('Health & Fitness'));
    await addButton.click();

    const scenarioSliders = whatIfPanel.locator('input[type="range"][min="-10"][max="15"][step="0.5"]');
    if (await scenarioSliders.count() >= 3) {
      await setRangeValue(scenarioSliders.nth(0), 2.0);
      await setRangeValue(scenarioSliders.nth(1), 1.5);
      await setRangeValue(scenarioSliders.nth(2), 2.5);
      await page.waitForTimeout(150);
    }
  }

  capture.panels.preRetWhatIfAdjusted = await getPanelText(page, '🎯 What-If Scenarios');
  capture.panels.preRetFutureProjectionAdjusted = await getPanelText(page, '🔭 Project to a Future Year');

  // Reset to a clean imported state before retirement perturbations.
  await importJsonPayload(page, payload);

  // Retirement baseline
  await tabByName(page, 'Retirement').click();
  await page.waitForTimeout(300);
  capture.panels.retirementHealthBaseline = await getPanelText(page, '🏁 Retirement Health');
  capture.panels.retirementRunwayBaseline = await getPanelText(page, '🛬 Retirement Runway');

  // Open gap details if present
  const gapToggle = page.getByRole('button', { name: /Show Details|Hide Details/ }).first();
  if (await gapToggle.isVisible()) {
    const txt = await gapToggle.innerText();
    if (/Show Details/i.test(txt)) {
      await gapToggle.click();
      await page.waitForTimeout(150);
    }
  }
  capture.panels.retirementHealthGapDetails = await getPanelText(page, '🏁 Retirement Health');

  // SWR and volatility sensitivity via deterministic payload variants.
  const captureRetirementHealthVariant = async (variantPayload, outputKey) => {
    await importJsonPayload(page, variantPayload);
    await tabByName(page, 'Retirement').click();
    await page.waitForTimeout(300);
    const toggle = page.getByRole('button', { name: /Show Details|Hide Details/ }).first();
    if (await toggle.isVisible()) {
      const txt = await toggle.innerText();
      if (/Show Details/i.test(txt)) {
        await toggle.click();
        await page.waitForTimeout(120);
      }
    }
    capture.panels[outputKey] = await getPanelText(page, '🏁 Retirement Health');
  };

  const payloadSwr3 = clonePayload(payload);
  payloadSwr3.nestEggSwr = 3;
  await captureRetirementHealthVariant(payloadSwr3, 'retirementHealthSwr3');

  const payloadSwr4 = clonePayload(payload);
  payloadSwr4.nestEggSwr = 4;
  await captureRetirementHealthVariant(payloadSwr4, 'retirementHealthSwr4Reset');

  const payloadSwr5 = clonePayload(payload);
  payloadSwr5.nestEggSwr = 5;
  await captureRetirementHealthVariant(payloadSwr5, 'retirementHealthSwr5');

  const payloadVol20 = clonePayload(payload);
  payloadVol20.assumptions.investmentStdDev = 20;
  await captureRetirementHealthVariant(payloadVol20, 'retirementHealthVol20');

  const payloadVol12 = clonePayload(payload);
  payloadVol12.assumptions.investmentStdDev = 12;
  await captureRetirementHealthVariant(payloadVol12, 'retirementHealthVol12Reset');

  // Reset to clean baseline before runway perturbations.
  await importJsonPayload(page, payload);
  await tabByName(page, 'Retirement').click();
  await page.waitForTimeout(300);

  // Runway perturbation sliders
  const runwayPanel = page.locator('div').filter({ hasText: '🛬 Retirement Runway' }).first();
  const pessReturnSlider = runwayPanel.locator('input[type="range"][max="-1"]').first();
  const pessSpendSlider = runwayPanel.locator('input[type="range"][min="0"][max="50"]').first();
  const optReturnSlider = runwayPanel.locator('input[type="range"][min="1"][max="8"]').first();
  const optSpendSlider = runwayPanel.locator('input[type="range"][min="0"][max="50"]').nth(1);
  if (await pessReturnSlider.isVisible() && await pessSpendSlider.isVisible() && await optReturnSlider.isVisible() && await optSpendSlider.isVisible()) {
    capture.debug.runwayBefore = {
      pessimisticReturn: await readRangeMeta(pessReturnSlider),
      pessimisticSpend: await readRangeMeta(pessSpendSlider),
      optimisticReturn: await readRangeMeta(optReturnSlider),
      optimisticSpend: await readRangeMeta(optSpendSlider),
    };

    await setRangeValue(pessReturnSlider, -5.5); // pessimistic return offset (valid step from -5.5)
    await setRangeValue(pessSpendSlider, 20); // pessimistic spend increase
    await setRangeValue(optReturnSlider, 6);  // optimistic return offset
    await setRangeValue(optSpendSlider, 40); // optimistic spend cut
    await page.waitForTimeout(260);
    capture.debug.runwayPerturbed = {
      pessimisticReturn: await readRangeMeta(pessReturnSlider),
      pessimisticSpend: await readRangeMeta(pessSpendSlider),
      optimisticReturn: await readRangeMeta(optReturnSlider),
      optimisticSpend: await readRangeMeta(optSpendSlider),
    };
    assertRunwayControls(capture.debug.runwayPerturbed, {
      pessimisticReturn: -5.5,
      pessimisticSpend: 20,
      optimisticReturn: 6,
      optimisticSpend: 40,
    }, 'Perturbed runway controls');
    capture.panels.retirementRunwayPerturbed = await runwayPanel.innerText();

    await importJsonPayload(page, payload);
    await tabByName(page, 'Retirement').click();
    await page.waitForTimeout(300);
    const runwayPanelReset = page.locator('div').filter({ hasText: '🛬 Retirement Runway' }).first();
    const pessReturnSliderReset = runwayPanelReset.locator('input[type="range"][max="-1"]').first();
    const pessSpendSliderReset = runwayPanelReset.locator('input[type="range"][min="0"][max="50"]').first();
    const optReturnSliderReset = runwayPanelReset.locator('input[type="range"][min="1"][max="8"]').first();
    const optSpendSliderReset = runwayPanelReset.locator('input[type="range"][min="0"][max="50"]').nth(1);

    capture.debug.runwayReset = {
      pessimisticReturn: await readRangeMeta(pessReturnSliderReset),
      pessimisticSpend: await readRangeMeta(pessSpendSliderReset),
      optimisticReturn: await readRangeMeta(optReturnSliderReset),
      optimisticSpend: await readRangeMeta(optSpendSliderReset),
    };
    const baselineControls = {
      pessimisticReturn: toFinite(capture.debug.runwayBefore?.pessimisticReturn?.value),
      pessimisticSpend: toFinite(capture.debug.runwayBefore?.pessimisticSpend?.value),
      optimisticReturn: toFinite(capture.debug.runwayBefore?.optimisticReturn?.value),
      optimisticSpend: toFinite(capture.debug.runwayBefore?.optimisticSpend?.value),
    };
    assertRunwayControls(capture.debug.runwayReset, baselineControls, 'Reset runway controls');
    capture.panels.retirementRunwayReset = await runwayPanelReset.innerText();

    const baselineRunway = parseRunwayYearsSnapshot(capture.panels.retirementRunwayBaseline);
    const resetRunway = parseRunwayYearsSnapshot(capture.panels.retirementRunwayReset);
    for (const key of ['pessimistic', 'base', 'optimistic']) {
      expect(baselineRunway[key], `Baseline runway parse (${key})`).not.toBeNull();
      expect(resetRunway[key], `Reset runway parse (${key})`).not.toBeNull();
      expect(resetRunway[key], `Reset runway parity (${key})`).toBe(baselineRunway[key]);
    }
  }

  // Reset once more before final dashboard snapshot.
  await importJsonPayload(page, payload);

  await tabByName(page, 'Dashboard').click();
  await page.waitForTimeout(200);
  capture.panels.dashboardFinal = await page.locator('body').innerText();

  const outputDir = path.resolve(process.cwd(), '_dev', 'artifacts');
  fs.mkdirSync(outputDir, { recursive: true });
  const outputFile = path.join(outputDir, 'user_scenario_capture.json');
  fs.writeFileSync(outputFile, JSON.stringify(capture, null, 2), 'utf8');

  console.log(`CAPTURE_WRITTEN ${outputFile}`);
});
