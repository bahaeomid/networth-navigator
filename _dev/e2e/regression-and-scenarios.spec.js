import { test, expect } from '@playwright/test';

test.setTimeout(90000);

const CURRENT_YEAR = new Date().getFullYear();

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const EXCHANGE_RATES = {
  AED: 1,
  USD: 3.67,
  CAD: 2.72,
  EUR: 4.01,
  GBP: 4.87,
};

const CATEGORY_TEMPLATE = [
  { key: 'housing', label: 'Housing', color: '#ef4444', group: 'essential', icon: '🏠', tooltip: 'Housing costs' },
  { key: 'bills', label: 'Bills', color: '#f97316', group: 'essential', icon: '💡', tooltip: 'Utilities and bills' },
  { key: 'groceries', label: 'Groceries', color: '#eab308', group: 'essential', icon: '🛒', tooltip: 'Food and groceries' },
  { key: 'healthBasic', label: 'Health', color: '#14b8a6', group: 'essential', icon: '🏥', tooltip: 'Healthcare' },
  { key: 'travel', label: 'Travel', color: '#38bdf8', group: 'disc', icon: '✈️', tooltip: 'Travel and holidays' },
  { key: 'entertainment', label: 'Entertainment', color: '#fb923c', group: 'disc', icon: '🎭', tooltip: 'Leisure and hobbies' },
];

const mapFromCategories = (categories, mapper) => {
  return Object.fromEntries(categories.map((cat) => [cat.key, mapper(cat)]));
};

const sumValues = (obj) => Object.values(obj).reduce((sum, v) => sum + (v || 0), 0);

const buildScenarioData = (scenario) => {
  const categories = CATEGORY_TEMPLATE.map((cat) => ({ ...cat }));
  const pre = { ...scenario.preExpenses };
  const ret = { ...scenario.retExpenses };
  const preRates = { ...scenario.preRates };
  const retRates = { ...scenario.retRates };
  const tags = mapFromCategories(categories, (cat) => cat.group);
  const phaseOut = mapFromCategories(categories, () => null);

  return {
    version: '2.0',
    currency: scenario.currency || 'AED',
    exchangeRates: EXCHANGE_RATES,
    profile: {
      currentAge: scenario.currentAge,
      retirementAge: scenario.retirementAge,
      lifeExpectancy: scenario.lifeExpectancy,
      dependents: scenario.dependents || 0,
    },
    assets: {
      cash: scenario.assets.cash,
      investments: scenario.assets.investments,
      realEstate: scenario.assets.realEstate,
      other: scenario.assets.other,
      cashItems: [{ id: 1, name: 'Cash', amount: scenario.assets.cash }],
      investmentItems: [{ id: 1, name: 'Portfolio', amount: scenario.assets.investments }],
      realEstateItems: [{ id: 1, name: 'Property', amount: scenario.assets.realEstate }],
      otherItems: [{ id: 1, name: 'Other', amount: scenario.assets.other }],
    },
    liabilities: {
      mortgage: scenario.liabilities.mortgage,
      loans: scenario.liabilities.loans,
      other: scenario.liabilities.other,
      mortgageItems: [{ id: 1, name: 'Mortgage', amount: scenario.liabilities.mortgage, endYear: CURRENT_YEAR + 20 }],
      loanItems: [{ id: 1, name: 'Loan', amount: scenario.liabilities.loans, endYear: CURRENT_YEAR + 5 }],
      otherLiabilityItems: [{ id: 1, name: 'Other', amount: scenario.liabilities.other, endYear: CURRENT_YEAR + 4 }],
    },
    income: {
      salary: scenario.income.salary,
      passive: scenario.income.passive,
      other: scenario.income.other,
      salaryItems: [{ id: 1, name: 'Salary', amount: scenario.income.salary, endYear: null }],
      passiveItems: [{ id: 1, name: 'Passive', amount: scenario.income.passive, endYear: null }],
      otherIncomeItems: [{ id: 1, name: 'Other', amount: scenario.income.other, endYear: null }],
    },
    expenses: {
      current: sumValues(pre),
      retirement: sumValues(ret),
    },
    expenseCategories: categories,
    expenseCalculator: pre,
    retirementBudget: ret,
    expenseGrowthRates: preRates,
    retExpenseGrowthRates: retRates,
    expenseTags: tags,
    expensePhaseOutYears: phaseOut,
    retExpensePhaseOutYears: phaseOut,
    lifeEvents: scenario.lifeEvents || [],
    assumptions: {
      salaryGrowth: scenario.assumptions.salaryGrowth,
      passiveGrowth: scenario.assumptions.passiveGrowth,
      otherIncomeGrowth: scenario.assumptions.otherIncomeGrowth,
      investmentReturn: scenario.assumptions.investmentReturn,
      investmentStdDev: scenario.assumptions.investmentStdDev,
      realEstateAppreciation: scenario.assumptions.realEstateAppreciation,
      realEstateStdDev: scenario.assumptions.realEstateStdDev,
      otherAssetGrowth: scenario.assumptions.otherAssetGrowth,
      otherAssetStdDev: scenario.assumptions.otherAssetStdDev,
      enableDrawdown: true,
    },
    oneTimeExpenses: scenario.oneTimeExpenses,
    nestEggSwr: scenario.nestEggSwr,
    surplusSplitInvest: 100,
    surplusSplitDebt: 0,
  };
};

const SCENARIOS = [
  {
    name: 'early-career-growth',
    currentAge: 30,
    retirementAge: 60,
    lifeExpectancy: 92,
    currency: 'AED',
    assets: { cash: 40000, investments: 180000, realEstate: 250000, other: 20000 },
    liabilities: { mortgage: 240000, loans: 15000, other: 4000 },
    income: { salary: 210000, passive: 12000, other: 18000 },
    preExpenses: { housing: 90000, bills: 24000, groceries: 22000, healthBasic: 10000, travel: 18000, entertainment: 9000 },
    retExpenses: { housing: 60000, bills: 22000, groceries: 26000, healthBasic: 22000, travel: 20000, entertainment: 12000 },
    preRates: { housing: 3.0, bills: 3.5, groceries: 3.2, healthBasic: 4.5, travel: 5.0, entertainment: 3.8 },
    retRates: { housing: 2.8, bills: 3.2, groceries: 3.0, healthBasic: 4.2, travel: 4.0, entertainment: 3.2 },
    assumptions: { salaryGrowth: 5.0, passiveGrowth: 2.0, otherIncomeGrowth: 2.5, investmentReturn: 8.0, investmentStdDev: 15.0, realEstateAppreciation: 3.8, realEstateStdDev: 8.0, otherAssetGrowth: 2.0, otherAssetStdDev: 9.0 },
    oneTimeExpenses: [
      { id: 1, year: CURRENT_YEAR + 3, description: 'Vehicle replacement', amount: 70000, category: 'travel', endYear: null },
      { id: 2, year: CURRENT_YEAR + 8, description: 'Home upgrade', amount: 120000, category: 'housing', endYear: null },
    ],
    nestEggSwr: 4,
  },
  {
    name: 'family-high-expenses',
    currentAge: 40,
    retirementAge: 58,
    lifeExpectancy: 90,
    currency: 'USD',
    assets: { cash: 120000, investments: 500000, realEstate: 900000, other: 60000 },
    liabilities: { mortgage: 620000, loans: 40000, other: 15000 },
    income: { salary: 420000, passive: 30000, other: 50000 },
    preExpenses: { housing: 200000, bills: 60000, groceries: 55000, healthBasic: 50000, travel: 70000, entertainment: 45000 },
    retExpenses: { housing: 130000, bills: 52000, groceries: 58000, healthBasic: 70000, travel: 50000, entertainment: 30000 },
    preRates: { housing: 3.5, bills: 4.0, groceries: 3.8, healthBasic: 5.0, travel: 5.5, entertainment: 4.0 },
    retRates: { housing: 3.0, bills: 3.5, groceries: 3.2, healthBasic: 4.8, travel: 4.2, entertainment: 3.2 },
    assumptions: { salaryGrowth: 3.5, passiveGrowth: 2.2, otherIncomeGrowth: 2.0, investmentReturn: 7.2, investmentStdDev: 13.0, realEstateAppreciation: 3.2, realEstateStdDev: 7.0, otherAssetGrowth: 1.8, otherAssetStdDev: 8.0 },
    oneTimeExpenses: [
      { id: 1, year: CURRENT_YEAR + 2, description: 'Tuition year 1', amount: 90000, category: 'groceries', endYear: CURRENT_YEAR + 5 },
      { id: 2, year: CURRENT_YEAR + 9, description: 'Major travel', amount: 130000, category: 'travel', endYear: null },
    ],
    nestEggSwr: 3.8,
  },
  {
    name: 'late-starter-gap',
    currentAge: 50,
    retirementAge: 61,
    lifeExpectancy: 88,
    currency: 'AED',
    assets: { cash: 60000, investments: 260000, realEstate: 350000, other: 10000 },
    liabilities: { mortgage: 200000, loans: 25000, other: 10000 },
    income: { salary: 230000, passive: 10000, other: 18000 },
    preExpenses: { housing: 115000, bills: 30000, groceries: 30000, healthBasic: 18000, travel: 22000, entertainment: 15000 },
    retExpenses: { housing: 80000, bills: 28000, groceries: 34000, healthBasic: 30000, travel: 25000, entertainment: 14000 },
    preRates: { housing: 3.2, bills: 3.6, groceries: 3.4, healthBasic: 4.6, travel: 4.8, entertainment: 3.5 },
    retRates: { housing: 2.9, bills: 3.2, groceries: 3.1, healthBasic: 4.5, travel: 4.1, entertainment: 3.0 },
    assumptions: { salaryGrowth: 2.5, passiveGrowth: 1.5, otherIncomeGrowth: 1.8, investmentReturn: 6.5, investmentStdDev: 12.0, realEstateAppreciation: 2.8, realEstateStdDev: 6.0, otherAssetGrowth: 1.2, otherAssetStdDev: 6.0 },
    oneTimeExpenses: [
      { id: 1, year: CURRENT_YEAR + 1, description: 'Medical procedure', amount: 80000, category: 'healthBasic', endYear: null },
      { id: 2, year: CURRENT_YEAR + 6, description: 'Family support', amount: 60000, category: 'housing', endYear: null },
    ],
    nestEggSwr: 3.5,
  },
  {
    name: 'coast-fi-strong',
    currentAge: 45,
    retirementAge: 60,
    lifeExpectancy: 92,
    currency: 'EUR',
    assets: { cash: 300000, investments: 3500000, realEstate: 1200000, other: 300000 },
    liabilities: { mortgage: 120000, loans: 0, other: 0 },
    income: { salary: 260000, passive: 100000, other: 70000 },
    preExpenses: { housing: 120000, bills: 35000, groceries: 28000, healthBasic: 24000, travel: 50000, entertainment: 28000 },
    retExpenses: { housing: 85000, bills: 32000, groceries: 32000, healthBasic: 40000, travel: 45000, entertainment: 22000 },
    preRates: { housing: 2.6, bills: 3.0, groceries: 3.0, healthBasic: 4.0, travel: 4.0, entertainment: 3.2 },
    retRates: { housing: 2.4, bills: 2.8, groceries: 2.8, healthBasic: 3.8, travel: 3.5, entertainment: 2.8 },
    assumptions: { salaryGrowth: 2.5, passiveGrowth: 2.2, otherIncomeGrowth: 2.0, investmentReturn: 7.5, investmentStdDev: 11.0, realEstateAppreciation: 3.0, realEstateStdDev: 6.0, otherAssetGrowth: 2.0, otherAssetStdDev: 7.0 },
    oneTimeExpenses: [
      { id: 1, year: CURRENT_YEAR + 4, description: 'Charity commitment', amount: 50000, category: 'entertainment', endYear: CURRENT_YEAR + 6 },
      { id: 2, year: CURRENT_YEAR + 10, description: 'Property refresh', amount: 180000, category: 'housing', endYear: null },
    ],
    nestEggSwr: 4.2,
  },
  {
    name: 'deficit-stress',
    currentAge: 38,
    retirementAge: 63,
    lifeExpectancy: 93,
    currency: 'CAD',
    assets: { cash: 25000, investments: 120000, realEstate: 220000, other: 8000 },
    liabilities: { mortgage: 260000, loans: 50000, other: 20000 },
    income: { salary: 160000, passive: 8000, other: 12000 },
    preExpenses: { housing: 100000, bills: 28000, groceries: 26000, healthBasic: 18000, travel: 26000, entertainment: 16000 },
    retExpenses: { housing: 72000, bills: 25000, groceries: 27000, healthBasic: 32000, travel: 18000, entertainment: 12000 },
    preRates: { housing: 3.4, bills: 3.8, groceries: 3.6, healthBasic: 4.8, travel: 5.0, entertainment: 3.8 },
    retRates: { housing: 3.0, bills: 3.2, groceries: 3.2, healthBasic: 4.6, travel: 4.0, entertainment: 3.0 },
    assumptions: { salaryGrowth: 2.0, passiveGrowth: 1.0, otherIncomeGrowth: 1.5, investmentReturn: 6.8, investmentStdDev: 16.0, realEstateAppreciation: 2.7, realEstateStdDev: 7.0, otherAssetGrowth: 1.5, otherAssetStdDev: 8.0 },
    oneTimeExpenses: [
      { id: 1, year: CURRENT_YEAR + 2, description: 'Debt settlement', amount: 70000, category: 'housing', endYear: null },
      { id: 2, year: CURRENT_YEAR + 2, description: 'Family support', amount: 35000, category: 'bills', endYear: null },
      { id: 3, year: CURRENT_YEAR + 8, description: 'Support program', amount: 15000, category: 'bills', endYear: CURRENT_YEAR + 11 },
    ],
    nestEggSwr: 3.6,
  },
];

const attachDialogHandler = (page) => {
  page.on('dialog', async (dialog) => {
    await dialog.accept();
  });
};

const tabByName = (page, label) => page.getByRole('button', {
  name: new RegExp(`(?:^|\\s)${escapeRegex(label)}$`),
}).first();

const openRibbonMenu = async (page) => {
  await page.getByRole('button', { name: '⋯' }).click();
};

const importJsonPayload = async (page, payload) => {
  await openRibbonMenu(page);
  await page.locator('input[type="file"][accept=".json"]').setInputFiles({
    name: 'scenario.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(payload)),
  });
  await page.waitForTimeout(200);
};

const importCsvPayload = async (page, csvText) => {
  await openRibbonMenu(page);
  await page.locator('input[type="file"][accept=".csv"]').setInputFiles({
    name: 'expenses.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csvText),
  });
  await page.waitForTimeout(200);
};

const expectNoDisplayArtifacts = async (page) => {
  const text = await page.locator('body').innerText();
  expect(text).not.toContain('Infinity');
  expect(text).not.toContain('NaN');
  expect(text).not.toContain('5.300000000000001');
  expect(text).not.toMatch(/\d+\.\d{6,}%\/yr/);
};

test('regression: CSV category-key replacement keeps What-If and Planned Expense visuals in sync', async ({ page }) => {
  attachDialogHandler(page);
  await page.goto('/');

  const csv = [
    'Category,Monthly Planning Budget (USD),Description,Expense Type',
    'Housing,15000,Rent and maintenance,Essential',
    'Bills,3500,Utilities and services,Essential',
    'Groceries,2200,Food and household,Essential',
    'Travel,2400,Trips and holidays,Discretionary',
    'Entertainment,1100,Leisure and subscriptions,Discretionary',
  ].join('\n');

  await importCsvPayload(page, csv);

  await tabByName(page, 'Finances').click();
  const plannedSection = page.locator('div').filter({ hasText: '📋 Planned Expenses' }).first();
  const categoryValues = await plannedSection.locator('select').evaluateAll((els) => els.map((el) => el.value));
  expect(categoryValues.some((v) => v === 'none')).toBeTruthy();
  expect(categoryValues.some((v) => v.startsWith('csv_'))).toBeTruthy();

  await tabByName(page, 'Pre-Retirement').click();
  const showDetailsBtn = page.getByRole('button', { name: /Show Details/ }).first();
  if (await showDetailsBtn.isVisible()) await showDetailsBtn.click();

  const addAdjustmentBtn = page.getByRole('button', { name: '+ Add adjustment' }).first();
  await expect(addAdjustmentBtn).toBeVisible();
  await addAdjustmentBtn.click();

  const adjSlider = page.locator('input[type="range"][min="-10"][max="15"][step="0.5"]').first();
  await expect(adjSlider).toBeVisible();
  await expect(page.getByText(/\+1\.0%\s*→\s*-?\d+\.\d+%\/yr/)).toBeVisible();
  await adjSlider.focus();
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(page.getByText(/\+2\.0%\s*→\s*-?\d+\.\d+%\/yr/)).toBeVisible();
  await expect(page.getByText(/\+1\.0%\s*→/)).toHaveCount(0);

  const orangeDots = await page.locator('svg circle[fill="#f59e0b"]').count();
  expect(orangeDots).toBeGreaterThan(0);
});

test('regression: uncategorized OTE affects total only (not discretionary line)', async ({ page }) => {
  attachDialogHandler(page);
  await page.goto('/');

  await tabByName(page, 'Finances').click();
  const plannedSection = page.locator('div').filter({ hasText: '📋 Planned Expenses' }).first();
  const categorySelects = plannedSection.locator('select');
  const selectCount = await categorySelects.count();
  for (let i = 0; i < selectCount; i++) {
    await categorySelects.nth(i).selectOption('none');
  }

  await tabByName(page, 'Pre-Retirement').click();
  const noTotalBtn = page.locator('div[style*="cursor: pointer"]').filter({ hasText: 'Total' }).first();
  await noTotalBtn.click();

  const orangeDots = await page.locator('svg circle[fill="#f59e0b"]').count();
  expect(orangeDots).toBe(0);
});

test('regression: retire-later recommendation is reproducible and runway percentages are normalized', async ({ page }) => {
  attachDialogHandler(page);
  await page.goto('/');

  const retireLaterCase = buildScenarioData({
    name: 'retire-later-case',
    currentAge: 40,
    retirementAge: 55,
    lifeExpectancy: 90,
    currency: 'AED',
    assets: { cash: 120000, investments: 900000, realEstate: 600000, other: 50000 },
    liabilities: { mortgage: 220000, loans: 20000, other: 5000 },
    income: { salary: 300000, passive: 20000, other: 25000 },
    preExpenses: { housing: 130000, bills: 35000, groceries: 30000, healthBasic: 22000, travel: 26000, entertainment: 18000 },
    retExpenses: { housing: 80000, bills: 26000, groceries: 28000, healthBasic: 28000, travel: 20000, entertainment: 14000 },
    preRates: { housing: 3.0, bills: 3.4, groceries: 3.2, healthBasic: 4.5, travel: 4.0, entertainment: 3.2 },
    retRates: { housing: 2.8, bills: 3.0, groceries: 3.0, healthBasic: 4.3, travel: 3.5, entertainment: 3.0 },
    assumptions: { salaryGrowth: 3.0, passiveGrowth: 2.0, otherIncomeGrowth: 2.0, investmentReturn: 8.0, investmentStdDev: 12.0, realEstateAppreciation: 3.0, realEstateStdDev: 7.0, otherAssetGrowth: 2.0, otherAssetStdDev: 7.0 },
    oneTimeExpenses: [
      { id: 1, year: CURRENT_YEAR + 5, description: 'Home repair', amount: 70000, category: 'housing', endYear: null },
      { id: 2, year: CURRENT_YEAR + 9, description: 'Family event', amount: 45000, category: 'entertainment', endYear: null },
    ],
    nestEggSwr: 4,
  });
  await importJsonPayload(page, retireLaterCase);

  await tabByName(page, 'Retirement').click();
  const gapShowBtn = page.getByRole('button', { name: /Show Details/ }).first();
  if (await gapShowBtn.isVisible()) await gapShowBtn.click();

  const retireCard = page.locator('div').filter({ hasText: /Retire later/i }).filter({ hasText: /retire at age/i }).first();
  await expect(retireCard).toBeVisible();
  const retireText = (await retireCard.textContent()) || '';
  const ageMatch = retireText.match(/retire at age\s*(\d+)/i);
  expect(ageMatch).not.toBeNull();
  const suggestedAge = Number(ageMatch[1]);

  await tabByName(page, 'Profile').click();
  const profileCard = page.locator('div').filter({ hasText: '🎯 Profile' }).first();
  const retirementAgeInput = profileCard.locator('input').nth(1);
  await retirementAgeInput.click();
  await retirementAgeInput.fill(String(suggestedAge));
  await retirementAgeInput.press('Tab');

  await tabByName(page, 'Retirement').click();
  await expect(page.getByText('Surplus').first()).toBeVisible();
  await expect(page.getByText(/Ways to close the/i)).toHaveCount(0);

  const runwayCard = page.locator('div').filter({ hasText: /Retirement Runway/i }).first();
  await expect(runwayCard).toBeVisible();
  const runwayText = (await runwayCard.textContent()) || '';
  expect(runwayText).not.toContain('5.300000000000001');
  expect(runwayText).not.toMatch(/\d+\.\d{6,}%\/yr/);
});

test('regression: retire-later does not recommend age at or beyond life expectancy', async ({ page }) => {
  attachDialogHandler(page);
  await page.goto('/');

  const edgeCase = buildScenarioData({
    name: 'retire-later-life-cap',
    currentAge: 55,
    retirementAge: 60,
    lifeExpectancy: 62,
    currency: 'AED',
    assets: { cash: 30000, investments: 210000, realEstate: 180000, other: 10000 },
    liabilities: { mortgage: 90000, loans: 10000, other: 0 },
    income: { salary: 120000, passive: 5000, other: 4000 },
    preExpenses: { housing: 70000, bills: 18000, groceries: 16000, healthBasic: 12000, travel: 8000, entertainment: 7000 },
    retExpenses: { housing: 3500, bills: 1300, groceries: 1300, healthBasic: 1300, travel: 800, entertainment: 600 },
    preRates: { housing: 3.0, bills: 3.2, groceries: 3.1, healthBasic: 4.2, travel: 3.4, entertainment: 3.0 },
    retRates: { housing: 3.1, bills: 3.4, groceries: 3.2, healthBasic: 4.4, travel: 3.6, entertainment: 3.1 },
    assumptions: { salaryGrowth: 2.0, passiveGrowth: 1.0, otherIncomeGrowth: 1.0, investmentReturn: 5.5, investmentStdDev: 12.0, realEstateAppreciation: 2.0, realEstateStdDev: 6.0, otherAssetGrowth: 1.0, otherAssetStdDev: 6.0 },
    oneTimeExpenses: [
      { id: 1, year: CURRENT_YEAR + 1, description: 'Medical', amount: 50000, category: 'healthBasic', endYear: null },
    ],
    nestEggSwr: 3.5,
  });
  await importJsonPayload(page, edgeCase);

  await tabByName(page, 'Retirement').click();
  const gapShowBtn = page.getByRole('button', { name: /Show Details/ }).first();
  if (await gapShowBtn.isVisible()) await gapShowBtn.click();

  await expect(page.getByText(/Would require retiring at or after life expectancy/i)).toBeVisible();
  await expect(page.getByText(/retire at age\s*62/i)).toHaveCount(0);
  await expect(page.getByText(/retire at age\s*63/i)).toHaveCount(0);
});

for (const scenario of SCENARIOS) {
  test(`scenario stress: ${scenario.name}`, async ({ page }) => {
    attachDialogHandler(page);
    await page.goto('/');
    await importJsonPayload(page, buildScenarioData(scenario));

    await tabByName(page, 'Profile').click();
    await expect(page.getByText('🎯 Profile')).toBeVisible();

    await tabByName(page, 'Finances').click();
    await expect(page.getByText('💎 Assets')).toBeVisible();
    await expect(page.getByText('📋 Planned Expenses')).toBeVisible();

    await tabByName(page, 'Pre-Retirement').click();
    await expect(page.getByText(/Pre-Retirement Budget/)).toBeVisible();
    await expect(page.getByText(/Pre-retirement Expenses Over Time/i)).toBeVisible();

    const preRetShowBtn = page.getByRole('button', { name: /Show Details/ }).first();
    if (await preRetShowBtn.isVisible()) await preRetShowBtn.click();
    const whatIfPanel = page.locator('div').filter({ hasText: /What-If Scenarios/i }).first();
    await whatIfPanel.getByRole('button', { name: '+ Add adjustment' }).click();
    const slider = whatIfPanel.locator('input[type="range"]').first();
    await slider.evaluate((el) => {
      el.value = '6';
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });

    await tabByName(page, 'Retirement').click();
    await expect(page.getByText(/Retirement Health/)).toBeVisible();
    await expect(page.getByText(/Retirement Runway/)).toBeVisible();

    await tabByName(page, 'Dashboard').click();
    await expect(page.getByText(/Financial Health/)).toBeVisible();
    await expect(page.getByText(/Net Worth Over Time/)).toBeVisible();

    const svgCount = await page.locator('svg').count();
    expect(svgCount).toBeGreaterThan(2);
    await expectNoDisplayArtifacts(page);
  });
}
