#!/usr/bin/env node
// Scenario matrix for phased income, investment contributions, liabilities,
// recurring planned expenses, drawdown, and surplus deployment.

const currentYear = new Date().getFullYear();

const round = (value) => Math.round(value);
const toNum = (value) => Number(value || 0);
const assert = (condition, label) => {
  console.log(`${condition ? 'PASS' : 'FAIL'} ${label}`);
  if (!condition) process.exitCode = 1;
};
const approx = (actual, expected, tolerance, label) => {
  const pass = Math.abs(actual - expected) <= tolerance;
  console.log(`${pass ? 'PASS' : 'FAIL'} ${label}: actual=${round(actual)}, expected=${round(expected)}, tol=${tolerance}`);
  if (!pass) process.exitCode = 1;
};

const parseYearOrNull = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const year = parseInt(value, 10);
  return Number.isFinite(year) ? year : null;
};

const inRange = (year, startYear, endYear) => year >= startYear && year <= endYear;

const incomeStart = (item) => parseYearOrNull(item.startYear) || currentYear;
const incomeEnd = (item, fallbackEndYear) => {
  const startYear = incomeStart(item);
  const rawEndYear = parseYearOrNull(item.endYear);
  return Math.max(startYear, rawEndYear == null ? fallbackEndYear : rawEndYear);
};
const incomeForYear = (item, year, growthRatePct, fallbackEndYear) => {
  const base = toNum(item.amount);
  if (base <= 0) return 0;
  const startYear = incomeStart(item);
  const endYear = incomeEnd(item, fallbackEndYear);
  if (!inRange(year, startYear, endYear)) return 0;
  return base * Math.pow(1 + growthRatePct / 100, year - startYear);
};

const liabilityStart = (item) => parseYearOrNull(item.startYear) || currentYear;
const liabilityPayoff = (item, defaultTermYears) => {
  const startYear = liabilityStart(item);
  const rawEndYear = parseYearOrNull(item.endYear);
  return Math.max(startYear + 1, rawEndYear == null ? startYear + defaultTermYears : rawEndYear);
};
const liabilityBalance = (item, year, defaultTermYears) => {
  const amount = toNum(item.amount);
  if (amount <= 0) return 0;
  const startYear = liabilityStart(item);
  const payoffYear = liabilityPayoff(item, defaultTermYears);
  if (year < startYear || year >= payoffYear) return 0;
  return Math.max(0, amount * ((payoffYear - year) / (payoffYear - startYear)));
};
const liabilityCategoryBalance = (items, fallbackTotal, year, defaultTermYears) => {
  if (!items || items.length === 0) {
    const principal = toNum(fallbackTotal);
    return Math.max(0, principal - (principal / defaultTermYears) * Math.max(0, year - currentYear));
  }
  return items.reduce((sum, item) => sum + liabilityBalance(item, year, defaultTermYears), 0);
};

const contributionStart = (item) => parseYearOrNull(item.contribStartYear) || currentYear;
const contributionEnd = (item, retirementYear) => {
  const finalPreRetYear = Math.max(currentYear, retirementYear - 1);
  const startYear = contributionStart(item);
  const rawEndYear = parseYearOrNull(item.contribEndYear);
  return Math.max(startYear, Math.min(finalPreRetYear, rawEndYear == null ? finalPreRetYear : rawEndYear));
};
const contributionForYear = (item, year, retirementYear) => {
  const base = toNum(item.annualContrib);
  if (base <= 0 || year >= retirementYear) return 0;
  const startYear = contributionStart(item);
  const endYear = contributionEnd(item, retirementYear);
  if (!inRange(year, startYear, endYear)) return 0;
  return base * Math.pow(1 + toNum(item.contribGrowthRate) / 100, year - startYear);
};

const defaultCategories = [
  { key: 'housing', group: 'essential' },
  { key: 'food', group: 'essential' },
  { key: 'travel', group: 'disc' },
];

function buildProjection(scenario) {
  const profile = scenario.profile;
  const retirementYear = currentYear + (profile.retirementAge - profile.currentAge);
  const lifeYear = currentYear + (profile.lifeExpectancy - profile.currentAge);
  const categories = scenario.expenseCategories || defaultCategories;
  const expenseCalculator = scenario.expenseCalculator || {};
  const retirementBudget = scenario.retirementBudget || {};
  const expenseGrowthRates = scenario.expenseGrowthRates || {};
  const retExpenseGrowthRates = scenario.retExpenseGrowthRates || {};
  const expenseTags = scenario.expenseTags || {};
  const expensePhaseOutYears = scenario.expensePhaseOutYears || {};
  const retExpensePhaseOutYears = scenario.retExpensePhaseOutYears || {};
  const oneTimeExpenses = scenario.oneTimeExpenses || [];

  const getProjectedExpenses = (year, excludeOtes = false) => {
    let total = 0;
    for (const cat of categories) {
      if (expensePhaseOutYears[cat.key] && year >= expensePhaseOutYears[cat.key]) continue;
      total += toNum(expenseCalculator[cat.key]) * Math.pow(1 + toNum(expenseGrowthRates[cat.key]) / 100, year - currentYear);
    }
    if (!excludeOtes) total += getOneTimeExpense(year);
    return total;
  };

  const getRetNominal = (year) => {
    const yearsIntoRetirement = year - retirementYear;
    if (yearsIntoRetirement < 0) return 0;
    return categories.reduce((sum, cat) => {
      if (retExpensePhaseOutYears[cat.key] && year >= retExpensePhaseOutYears[cat.key]) return sum;
      const yearsFromToday = profile.retirementAge - profile.currentAge + yearsIntoRetirement;
      return sum + toNum(retirementBudget[cat.key]) * Math.pow(1 + toNum(retExpenseGrowthRates[cat.key]) / 100, yearsFromToday);
    }, 0);
  };

  const getOneTimeExpense = (year) => oneTimeExpenses.reduce((sum, ote) => {
    const endYear = parseYearOrNull(ote.endYear) || ote.year;
    if (year < ote.year || year > endYear) return sum;
    const category = ote.category && ote.category !== 'none' ? ote.category : null;
    const preRate = category ? toNum(expenseGrowthRates[category]) / 100 : 0;
    const retRate = category ? toNum(retExpenseGrowthRates[category]) / 100 : 0;
    if (year < retirementYear) {
      return sum + toNum(ote.amount) * Math.pow(1 + preRate, year - currentYear);
    }
    return sum + toNum(ote.amount)
      * Math.pow(1 + preRate, retirementYear - currentYear)
      * Math.pow(1 + retRate, year - retirementYear);
  }, 0);

  const incomeAtYear = (year, age) => {
    const finalSalaryYear = Math.max(currentYear, retirementYear - 1);
    const passiveFallbackEndYear = lifeYear;
    const salaryItems = scenario.income.salaryItems && scenario.income.salaryItems.length > 0 ? scenario.income.salaryItems : null;
    const passiveItems = scenario.income.passiveItems && scenario.income.passiveItems.length > 0 ? scenario.income.passiveItems : null;
    const otherItems = scenario.income.otherIncomeItems && scenario.income.otherIncomeItems.length > 0 ? scenario.income.otherIncomeItems : null;
    const i = year - currentYear;
    const salary = age < profile.retirementAge
      ? (salaryItems
        ? salaryItems.reduce((sum, item) => sum + incomeForYear(item, year, toNum(scenario.assumptions.salaryGrowth), finalSalaryYear), 0)
        : toNum(scenario.income.salary) * Math.pow(1 + toNum(scenario.assumptions.salaryGrowth) / 100, i))
      : 0;
    const passive = passiveItems
      ? passiveItems.reduce((sum, item) => sum + incomeForYear(item, year, toNum(scenario.assumptions.passiveGrowth), passiveFallbackEndYear), 0)
      : toNum(scenario.income.passive) * Math.pow(1 + toNum(scenario.assumptions.passiveGrowth) / 100, i);
    const other = otherItems
      ? otherItems.reduce((sum, item) => sum + incomeForYear(item, year, toNum(scenario.assumptions.otherIncomeGrowth), passiveFallbackEndYear), 0)
      : toNum(scenario.income.other) * Math.pow(1 + toNum(scenario.assumptions.otherIncomeGrowth) / 100, i);
    return { salary, passive, other, total: salary + passive + other };
  };

  let investments = toNum(scenario.assets.investments);
  let realEstate = toNum(scenario.assets.realEstate);
  let otherAssets = toNum(scenario.assets.other);
  const rows = [];

  for (let year = currentYear; year <= lifeYear; year += 1) {
    const age = profile.currentAge + (year - currentYear);
    const income = incomeAtYear(year, age);
    const baseExpense = age >= profile.retirementAge ? getRetNominal(year) : getProjectedExpenses(year, true);
    const oteExpense = getOneTimeExpense(year);
    const expenses = baseExpense + oteExpense;
    const savings = age < profile.retirementAge ? Math.max(0, income.total - expenses) : 0;
    const mortgage = liabilityCategoryBalance(scenario.liabilities.mortgageItems, scenario.liabilities.mortgage, year, 25);
    const loans = liabilityCategoryBalance(scenario.liabilities.loanItems, scenario.liabilities.loans, year, 5);
    const otherLiabilities = liabilityCategoryBalance(scenario.liabilities.otherLiabilityItems, scenario.liabilities.other, year, 5);
    const totalLiabilities = round(mortgage + loans + otherLiabilities);
    const totalAssets = investments + realEstate + toNum(scenario.assets.cash) + otherAssets;

    rows.push({
      year,
      age,
      investments: round(investments),
      income: round(income.total),
      salary: round(income.salary),
      passive: round(income.passive),
      otherIncome: round(income.other),
      expenses: round(expenses),
      savings: round(savings),
      totalLiabilities,
      mortgage: round(mortgage),
      loans: round(loans),
      netWorth: round(totalAssets - totalLiabilities),
    });

    const drawdown = scenario.assumptions.enableDrawdown && age >= profile.retirementAge
      ? Math.max(0, expenses - income.passive - income.other)
      : 0;
    const annualContribution = age < profile.retirementAge
      ? (scenario.assets.investmentItems || []).reduce((sum, item) => sum + contributionForYear(item, year, retirementYear), 0)
      : 0;
    investments = Math.max(0, investments * (1 + toNum(scenario.assumptions.investmentReturn) / 100) + annualContribution - drawdown);
    realEstate *= 1 + toNum(scenario.assumptions.realEstateAppreciation) / 100;
    otherAssets *= 1 + toNum(scenario.assumptions.otherAssetGrowth) / 100;
  }

  rows.requiredNestEggAtRetirement = () => getRetNominal(retirementYear) / (toNum(scenario.nestEggSwr) / 100);
  rows.fiAge = () => {
    const swr = toNum(scenario.nestEggSwr) / 100;
    if (swr <= 0) return null;
    for (const row of rows) {
      const year = row.year;
      const nominalExpense = year < retirementYear
        ? categories.reduce((sum, cat) => sum + toNum(retirementBudget[cat.key]) * Math.pow(1 + toNum(retExpenseGrowthRates[cat.key]) / 100, year - currentYear), 0)
        : getRetNominal(year);
      if (nominalExpense > 0 && row.investments >= nominalExpense / swr) return row.age;
    }
    return null;
  };
  rows.debtFreeAge = () => {
    const lastDebtIndex = rows.reduce((last, row, idx) => row.totalLiabilities > 0 ? idx : last, -1);
    return lastDebtIndex < 0 || !rows[lastDebtIndex + 1] ? null : rows[lastDebtIndex + 1].age;
  };
  rows.currentAnnualSavings = () => {
    const row = rows[0];
    return row.income - row.expenses;
  };
  rows.expenseBreakdown = { getProjectedExpenses, getRetNominal, getOneTimeExpense, expenseTags };
  return rows;
}

function simulateClearDebtFirst(scenario, projection) {
  const liabilityRows = [];
  const add = (items, fallbackTotal, defaultTermYears, prefix) => {
    if (items && items.length > 0) {
      items.forEach((item, index) => {
        if (toNum(item.amount) > 0) liabilityRows.push({ key: `${prefix}-${index}`, item: { ...item }, defaultTermYears, extraPaid: 0 });
      });
      return;
    }
    if (toNum(fallbackTotal) > 0) liabilityRows.push({ key: `${prefix}-fallback`, item: { amount: fallbackTotal }, defaultTermYears, extraPaid: 0 });
  };
  add(scenario.liabilities.mortgageItems, scenario.liabilities.mortgage, 25, 'mortgage');
  add(scenario.liabilities.loanItems, scenario.liabilities.loans, 5, 'loan');
  add(scenario.liabilities.otherLiabilityItems, scenario.liabilities.other, 5, 'other');

  let investmentBalance = toNum(scenario.assets.investments);
  const annual = [];
  for (const row of projection) {
    if (row.age >= scenario.profile.retirementAge) break;
    const openingInvestments = investmentBalance;
    investmentBalance *= 1 + toNum(scenario.assumptions.investmentReturn) / 100;
    let surplus = row.savings;
    let paid = 0;
    for (const liability of liabilityRows) {
      if (surplus <= 0) break;
      const scheduled = liabilityBalance(liability.item, row.year, liability.defaultTermYears);
      const activeRemaining = Math.max(0, scheduled - liability.extraPaid);
      const payment = Math.min(surplus, activeRemaining);
      liability.extraPaid += payment;
      surplus -= payment;
      paid += payment;
    }
    investmentBalance += surplus;
    annual.push({ year: row.year, openingInvestments, paid, invested: surplus, closingInvestments: investmentBalance });
  }
  return annual;
}

const baseScenario = {
  profile: { currentAge: 35, retirementAge: 55, lifeExpectancy: 85 },
  assets: {
    cash: 100000,
    investments: 250000,
    realEstate: 900000,
    other: 50000,
    investmentItems: [
      { annualContrib: 30000, contribStartYear: currentYear, contribEndYear: currentYear + 2, contribGrowthRate: 5 },
      { annualContrib: 45000, contribStartYear: currentYear + 5, contribEndYear: null, contribGrowthRate: 2 },
    ],
  },
  liabilities: {
    mortgage: 0,
    loans: 0,
    other: 0,
    mortgageItems: [{ amount: 800000, startYear: currentYear + 3, endYear: currentYear + 13 }],
    loanItems: [{ amount: 120000, startYear: currentYear, endYear: currentYear + 3 }],
    otherLiabilityItems: [],
  },
  income: {
    salary: 0,
    passive: 0,
    other: 0,
    salaryItems: [
      { amount: 240000, startYear: currentYear, endYear: currentYear + 10 },
      { amount: 360000, startYear: currentYear + 11, endYear: null },
    ],
    passiveItems: [{ amount: 30000, startYear: currentYear + 5, endYear: null }],
    otherIncomeItems: [{ amount: 10000, startYear: currentYear, endYear: currentYear + 1 }],
  },
  expenseCalculator: { housing: 100000, food: 50000, travel: 40000 },
  retirementBudget: { housing: 90000, food: 60000, travel: 50000 },
  expenseGrowthRates: { housing: 3, food: 4, travel: 5 },
  retExpenseGrowthRates: { housing: 2, food: 3, travel: 2 },
  expenseTags: { housing: 'essential', food: 'essential', travel: 'disc' },
  expensePhaseOutYears: {},
  retExpensePhaseOutYears: { travel: currentYear + 28 },
  oneTimeExpenses: [{ amount: 50000, year: currentYear + 4, endYear: currentYear + 6, category: 'travel', description: 'Education bridge' }],
  assumptions: {
    investmentReturn: 6,
    realEstateAppreciation: 2,
    otherAssetGrowth: 1,
    salaryGrowth: 4,
    passiveGrowth: 2,
    otherIncomeGrowth: 0,
    enableDrawdown: true,
  },
  nestEggSwr: 4,
};

const base = buildProjection(baseScenario);
const row = (projection, year) => projection.find((entry) => entry.year === year);
const retirementYear = currentYear + (baseScenario.profile.retirementAge - baseScenario.profile.currentAge);

console.log('\nScenario A: phased finances with recurring OTE and future liability');
assert(row(base, currentYear).salary === 240000, 'salary starts in current year');
assert(row(base, currentYear + 10).salary > 240000, 'first salary grows through inclusive end year');
assert(row(base, currentYear + 11).salary === 360000, 'new salary starts at base amount in from year');
assert(row(base, retirementYear).salary === 0, 'salary is zero at retirement age');
assert(row(base, retirementYear).passive > 0, 'passive income continues through retirement');
assert(row(base, currentYear).mortgage === 0 && row(base, currentYear).loans === 120000, 'future mortgage is inactive while current loan is active');
assert(row(base, currentYear + 3).mortgage === 800000 && row(base, currentYear + 3).loans === 0, 'mortgage activates in start year and loan is zero at payoff opening');
assert(row(base, currentYear + 13).mortgage === 0, 'liability is zero at payoff-year opening');
assert(row(base, currentYear + 4).expenses > row(base, currentYear + 3).expenses, 'recurring OTE increases expenses inside active range');
assert(row(base, currentYear + 7).expenses < row(base, currentYear + 6).expenses, 'recurring OTE stops after inclusive end year');
approx(row(base, currentYear + 1).investments, 250000 * 1.06 + 30000, 1, 'current-year contribution appears in next opening balance');
assert(base.debtFreeAge() === baseScenario.profile.currentAge + 13, 'debt-free age is after final future-start liability balance');
assert(base.requiredNestEggAtRetirement() > 0, 'required nest egg is finite and positive');

console.log('\nScenario B: passive income offsets retirement drawdown');
const passiveScenario = {
  ...baseScenario,
  profile: { currentAge: 54, retirementAge: 55, lifeExpectancy: 65 },
  assets: { ...baseScenario.assets, investments: 1000000, investmentItems: [] },
  liabilities: { mortgage: 0, loans: 0, other: 0, mortgageItems: [], loanItems: [], otherLiabilityItems: [] },
  income: {
    salary: 200000,
    passive: 0,
    other: 0,
    salaryItems: [],
    passiveItems: [{ amount: 250000, startYear: currentYear, endYear: null }],
    otherIncomeItems: [],
  },
  retirementBudget: { housing: 70000, food: 50000, travel: 25000 },
  oneTimeExpenses: [],
};
const passive = buildProjection(passiveScenario);
assert(row(passive, currentYear + 1).salary === 0, 'near-retiree salary stops in retirement year');
assert(row(passive, currentYear + 1).passive > row(passive, currentYear).passive, 'passive income grows and continues after retirement');
assert(row(passive, currentYear + 2).investments > row(passive, currentYear + 1).investments, 'passive surplus prevents retirement drawdown and portfolio still compounds');

console.log('\nScenario C: deficit years do not create deployable surplus');
const deficitScenario = {
  ...baseScenario,
  assets: { ...baseScenario.assets, investments: 100000, investmentItems: [] },
  income: { salary: 80000, passive: 0, other: 0, salaryItems: [], passiveItems: [], otherIncomeItems: [] },
  expenseCalculator: { housing: 120000, food: 50000, travel: 30000 },
  oneTimeExpenses: [],
};
const deficit = buildProjection(deficitScenario);
assert(deficit.currentAnnualSavings() < 0, 'current annual savings can be negative');
assert(row(deficit, currentYear).savings === 0, 'projection surplus floors deficits to zero for deployment scenarios');
assert(!deficit.some((entry) => entry.age < deficitScenario.profile.retirementAge && entry.savings > 0), 'no surplus deployment is available when all pre-retirement years are deficits');

console.log('\nScenario D: debt-first surplus invests before future-start liabilities');
const debtFirst = {
  ...baseScenario,
  assets: { ...baseScenario.assets, investments: 0, realEstate: 0, other: 0, investmentItems: [] },
  liabilities: {
    mortgage: 0,
    loans: 0,
    other: 0,
    mortgageItems: [{ amount: 300000, startYear: currentYear + 2, endYear: currentYear + 5 }],
    loanItems: [{ amount: 100000, startYear: currentYear + 4, endYear: currentYear + 6 }],
    otherLiabilityItems: [],
  },
  income: { salary: 300000, passive: 0, other: 0, salaryItems: [], passiveItems: [], otherIncomeItems: [] },
  expenseCalculator: { housing: 100000, food: 50000, travel: 0 },
  oneTimeExpenses: [],
  assumptions: { ...baseScenario.assumptions, investmentReturn: 0, salaryGrowth: 0 },
};
const debtProjection = buildProjection(debtFirst);
const debtSimulation = simulateClearDebtFirst(debtFirst, debtProjection);
assert(debtSimulation[0].paid === 0 && debtSimulation[0].invested > 0, 'surplus is invested before future liability starts');
assert(debtSimulation.find((entry) => entry.year === currentYear + 2).paid > 0, 'surplus pays debt once future liability activates');
assert(row(debtProjection, currentYear + 4).totalLiabilities > 0, 'multiple overlapping liabilities are included in net worth');
assert(debtProjection.debtFreeAge() === debtFirst.profile.currentAge + 6, 'debt-free age waits until all overlapping liabilities are cleared');

console.log('\nScenario matrix audit complete.');
