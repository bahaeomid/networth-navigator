import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const capturePath = path.resolve(root, '_dev', 'artifacts', 'user_scenario_capture.json');
const extractedPath = path.resolve(root, '_dev', 'artifacts', 'user_scenario_extracted.json');
const outputPath = path.resolve(root, '_dev', 'artifacts', 'full_element_coverage_report.json');

const capture = JSON.parse(fs.readFileSync(capturePath, 'utf8'));
const extracted = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));

const scenario = capture.scenario || {};
const panels = capture.panels || {};

const currentYear = scenario.currentYear;
const profile = scenario.profile || {};
const assets = scenario.assets || {};
const liabilities = scenario.liabilities || {};
const income = scenario.income || {};
const assumptions = scenario.assumptions || {};
const oneTimeExpenses = scenario.oneTimeExpenses || [];
const categories = scenario.categoryRows || [];
const nestEggSwr = Number(scenario.nestEggSwr || 4);

const yearsToRetirement = profile.retirementAge - profile.currentAge;
const retirementCalYear = currentYear + yearsToRetirement;

const categoryByKey = Object.fromEntries(categories.map((c) => [c.key, c]));

const toNum = (v) => Number(v || 0);
const round = (v) => Math.round(v);

const parseMoney = (txt) => {
  if (!txt || typeof txt !== 'string') return null;
  const m = txt.replace(/,/g, '').match(/([+\-−]?\s*AED\s*[0-9.]+\s*[MK]?)/i);
  if (!m) return null;
  const raw = m[1].replace(/\s+/g, '').replace(/^\+/, '');
  const neg = raw.startsWith('-') || raw.startsWith('−');
  const numPart = raw.replace(/^[-−]/, '').replace(/^AED/i, '');
  const unit = numPart.endsWith('M') ? 'M' : numPart.endsWith('K') ? 'K' : '';
  const base = parseFloat(unit ? numPart.slice(0, -1) : numPart);
  if (Number.isNaN(base)) return null;
  const mul = unit === 'M' ? 1_000_000 : unit === 'K' ? 1_000 : 1;
  const val = base * mul;
  return neg ? -val : val;
};

const parsePercent = (txt) => {
  if (!txt || typeof txt !== 'string') return null;
  const m = txt.match(/([+\-−]?[0-9]+(?:\.[0-9]+)?)%/);
  if (!m) return null;
  return Number(m[1].replace('−', '-'));
};

const approx = (a, b, absTol = 0, relTol = 0) => {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const abs = Math.abs(a - b);
  if (abs <= absTol) return true;
  if (relTol <= 0) return false;
  const denom = Math.max(1, Math.abs(b));
  return abs / denom <= relTol;
};

const results = [];
const pushCheck = ({ element, metric, expected, observed, absTol = 0, relTol = 0, predicate }) => {
  const pass = typeof predicate === 'function'
    ? Boolean(predicate(expected, observed))
    : approx(Number(observed), Number(expected), absTol, relTol);
  results.push({ element, metric, expected, observed, pass });
};

const annualIncomeAtYear = (year, i, age) => {
  const salItems = income.salaryItems && income.salaryItems.length > 0 ? income.salaryItems : null;
  const passItems = income.passiveItems && income.passiveItems.length > 0 ? income.passiveItems : null;
  const otherItems = income.otherIncomeItems && income.otherIncomeItems.length > 0 ? income.otherIncomeItems : null;

  const salaryGrowth = toNum(assumptions.salaryGrowth) / 100;
  const passiveGrowth = toNum(assumptions.passiveGrowth) / 100;
  const otherGrowth = toNum(assumptions.otherIncomeGrowth) / 100;

  const salary = age < profile.retirementAge
    ? (salItems
      ? salItems.reduce((s, item) => {
          if (item.endYear && year >= item.endYear) return s;
          return s + toNum(item.amount) * Math.pow(1 + salaryGrowth, i);
        }, 0)
      : toNum(income.salary) * Math.pow(1 + salaryGrowth, i))
    : 0;

  const passive = passItems
    ? passItems.reduce((s, item) => {
        if (item.endYear && year >= item.endYear) return s;
        return s + toNum(item.amount) * Math.pow(1 + passiveGrowth, i);
      }, 0)
    : toNum(income.passive) * Math.pow(1 + passiveGrowth, i);

  const otherIncome = otherItems
    ? otherItems.reduce((s, item) => {
        if (item.endYear && year >= item.endYear) return s;
        return s + toNum(item.amount) * Math.pow(1 + otherGrowth, i);
      }, 0)
    : toNum(income.other) * Math.pow(1 + otherGrowth, i);

  return { salary, passive, otherIncome, total: salary + passive + otherIncome };
};

const getProjectedExpenses = (targetYear, opts = {}) => {
  const yearsAhead = targetYear - currentYear;
  if (yearsAhead < 0) return toNum(scenario.totals?.current);

  const rateOverrideDelta = toNum(opts.rateOverrideDelta);
  const adjMap = opts.adjMap || {};
  const excludeOTEs = Boolean(opts.excludeOTEs);

  let total = 0;

  for (const cat of categories) {
    const base = toNum(cat.annualPre);
    const rate = Math.max(0, toNum(cat.preRate) + rateOverrideDelta + toNum(adjMap[cat.key]));
    total += base * Math.pow(1 + rate / 100, yearsAhead);
  }

  if (!excludeOTEs) {
    for (const e of oneTimeExpenses) {
      const endYear = e.endYear || e.year;
      if (targetYear < e.year || targetYear > endYear) continue;
      const key = e.category;
      const baseRate = key && categoryByKey[key] ? toNum(categoryByKey[key].preRate) : 0;
      const rate = Math.max(0, baseRate + rateOverrideDelta + toNum(adjMap[key]));
      const yearsFromToday = targetYear - currentYear;
      total += toNum(e.amount) * Math.pow(1 + rate / 100, yearsFromToday);
    }
  }

  return round(total);
};

const getRetNominalForYear = (calYear) => {
  const yearsIntoRet = calYear - retirementCalYear;
  if (yearsIntoRet < 0) return 0;
  let total = 0;
  for (const cat of categories) {
    const base = toNum(cat.annualRet);
    const rate = toNum(cat.retRate) / 100;
    total += base * Math.pow(1 + rate, yearsToRetirement + yearsIntoRet);
  }
  return total;
};

const getLifeStageExpense = (year) => {
  const age = profile.currentAge + (year - currentYear);
  if (age >= profile.retirementAge) return getRetNominalForYear(year);
  return getProjectedExpenses(year, { excludeOTEs: true });
};

const getOneTimeExpenseForYear = (year) => {
  const retCalYear = retirementCalYear;
  let total = 0;
  for (const e of oneTimeExpenses) {
    const endYear = e.endYear || e.year;
    if (year < e.year || year > endYear) continue;
    const key = e.category;
    const preRate = key && categoryByKey[key] ? toNum(categoryByKey[key].preRate) / 100 : 0;
    const retRate = key && categoryByKey[key] ? toNum(categoryByKey[key].retRate) / 100 : 0;
    let inflated;
    if (year < retCalYear) {
      inflated = toNum(e.amount) * Math.pow(1 + preRate, year - currentYear);
    } else {
      const yearsIntoRet = year - retCalYear;
      inflated = toNum(e.amount) * Math.pow(1 + preRate, yearsToRetirement) * Math.pow(1 + retRate, yearsIntoRet);
    }
    total += inflated;
  }
  return total;
};

const amortizeLiability = (items, fallbackTotal, defaultTerm, year, i) => {
  if (!items || items.length === 0) {
    return Math.max(0, toNum(fallbackTotal) - (toNum(fallbackTotal) / defaultTerm) * i);
  }
  return items.reduce((sum, item) => {
    const term = item.endYear ? item.endYear - currentYear : defaultTerm;
    if (term <= 0) return sum;
    const endYr = item.endYear || (currentYear + defaultTerm);
    if (year >= endYr) return sum;
    return sum + Math.max(0, toNum(item.amount) * ((endYr - year) / term));
  }, 0);
};

const buildWealthProjection = () => {
  const projectionYears = Math.max(0, profile.lifeExpectancy - profile.currentAge);

  let investmentBalance = toNum(assets.investments);
  let realEstateValue = toNum(assets.realEstate);
  let otherAssetValue = toNum(assets.other);
  const cash = toNum(assets.cash);

  let exhaustionAge = null;
  const data = [];

  for (let i = 0; i <= projectionYears; i++) {
    const year = currentYear + i;
    const age = profile.currentAge + i;

    const inflationAdjustedExpense = getLifeStageExpense(year);
    const oneTimeExpense = getOneTimeExpenseForYear(year);

    const incomeParts = annualIncomeAtYear(year, i, age);
    const yearIncome = incomeParts.total;
    const yearExpenses = inflationAdjustedExpense + oneTimeExpense;
    const yearSavings = age < profile.retirementAge ? Math.max(0, yearIncome - yearExpenses) : 0;

    const totalAssets = investmentBalance + realEstateValue + cash + otherAssetValue;

    const mortgageBalance = amortizeLiability(liabilities.mortgageItems, liabilities.mortgage, 25, year, i);
    const loansBalance = amortizeLiability(liabilities.loanItems, liabilities.loans, 5, year, i);
    const otherLiabilities = amortizeLiability(liabilities.otherLiabilityItems, liabilities.other, 5, year, i);

    const totalLiabilities = round(mortgageBalance + loansBalance + otherLiabilities);

    if (assumptions.enableDrawdown && age > profile.retirementAge && investmentBalance === 0 && exhaustionAge === null) {
      exhaustionAge = age;
    }

    data.push({
      year,
      age,
      netWorth: round(totalAssets - totalLiabilities),
      investments: round(investmentBalance),
      realEstate: round(realEstateValue),
      cash: round(cash),
      other: round(otherAssetValue),
      totalAssets: round(totalAssets),
      totalLiabilities,
      income: round(yearIncome),
      salary: round(incomeParts.salary),
      passive: round(incomeParts.passive),
      otherIncome: round(incomeParts.otherIncome),
      expenses: round(yearExpenses),
      savings: round(yearSavings),
    });

    let drawdownAmount = 0;
    if (assumptions.enableDrawdown && age > profile.retirementAge) {
      const postRetIncome = incomeParts.passive + incomeParts.otherIncome;
      drawdownAmount = Math.max(0, inflationAdjustedExpense + oneTimeExpense - postRetIncome);
    }

    investmentBalance = Math.max(0, investmentBalance * (1 + toNum(assumptions.investmentReturn) / 100) - drawdownAmount);
    realEstateValue = realEstateValue * (1 + toNum(assumptions.realEstateAppreciation) / 100);
    otherAssetValue = otherAssetValue * (1 + toNum(assumptions.otherAssetGrowth) / 100);
  }

  data.exhaustionAge = exhaustionAge;
  return data;
};

const wealthProjection = buildWealthProjection();

const findFiAge = (projection, swrPct) => {
  if (swrPct <= 0) return null;
  for (const d of projection) {
    const calYear = currentYear + (d.age - profile.currentAge);
    let nominalExpense;
    if (calYear < retirementCalYear) {
      const yearsAhead = d.age - profile.currentAge;
      nominalExpense = categories.reduce((s, cat) => {
        return s + toNum(cat.annualRet) * Math.pow(1 + toNum(cat.retRate) / 100, yearsAhead);
      }, 0);
    } else {
      nominalExpense = getRetNominalForYear(calYear);
    }
    if (nominalExpense <= 0) continue;
    const threshold = nominalExpense / (swrPct / 100);
    if (d.investments >= threshold) return d.age;
  }
  return null;
};

const fiAgeExpected = findFiAge(wealthProjection, nestEggSwr);

const simulateSurplus = () => {
  const r = toNum(assumptions.investmentReturn) / 100;
  const baseInvestAtRet = (wealthProjection.find((d) => d.age === profile.retirementAge) || {}).investments || 0;
  const totalDebtToday = toNum(liabilities.mortgage) + toNum(liabilities.loans) + toNum(liabilities.other);

  const fiThresholdForAge = (age) => {
    if (nestEggSwr <= 0) return Number.POSITIVE_INFINITY;
    const calYear = currentYear + (age - profile.currentAge);
    let nominalExpense;
    if (calYear < retirementCalYear) {
      const yearsAhead = age - profile.currentAge;
      nominalExpense = categories.reduce((s, cat) => {
        return s + toNum(cat.annualRet) * Math.pow(1 + toNum(cat.retRate) / 100, yearsAhead);
      }, 0);
    } else {
      nominalExpense = getRetNominalForYear(calYear);
    }
    return nominalExpense > 0 ? nominalExpense / (nestEggSwr / 100) : Number.POSITIVE_INFINITY;
  };

  // Invest all surplus
  {
    let bal = toNum(assets.investments);
    let fi = null;
    let balAtRet = bal;
    for (const wp of wealthProjection) {
      if (fi === null && bal >= fiThresholdForAge(wp.age)) fi = wp.age;
      if (wp.age === profile.retirementAge) balAtRet = bal;
      const yearSurplus = wp.age < profile.retirementAge ? toNum(wp.savings) : 0;
      bal = bal * (1 + r) + yearSurplus;
    }
    var investAll = { fiAge: fi, extraAtRet: balAtRet - baseInvestAtRet };
  }

  // Clear debt first
  {
    let bal = toNum(assets.investments);
    let remainingDebt = totalDebtToday;
    let debtFreeAt = null;
    let fi = null;
    for (const wp of wealthProjection) {
      if (fi === null && bal >= fiThresholdForAge(wp.age)) fi = wp.age;
      if (wp.age >= profile.retirementAge) {
        bal = bal * (1 + r);
        continue;
      }
      const yearSurplus = toNum(wp.savings);
      bal = bal * (1 + r);
      if (remainingDebt > 0) {
        const debtPayment = Math.max(0, Math.min(yearSurplus, remainingDebt));
        remainingDebt -= debtPayment;
        const leftover = yearSurplus - debtPayment;
        bal += leftover;
        if (remainingDebt <= 0 && debtFreeAt === null) debtFreeAt = wp.age + 1;
      } else {
        bal += yearSurplus;
      }
    }
    var clearDebtFirst = { fiAge: fi, debtFreeAge: debtFreeAt };
  }

  const customSplit = (splitInvest, splitDebt) => {
    const effInvest = Math.min(splitInvest, 100);
    const effDebt = Math.min(splitDebt, 100 - effInvest);

    let bal = toNum(assets.investments);
    let remainingDebt = totalDebtToday;
    let fi = null;

    for (const wp of wealthProjection) {
      if (fi === null && bal >= fiThresholdForAge(wp.age)) fi = wp.age;
      if (wp.age >= profile.retirementAge) {
        bal = bal * (1 + r);
        continue;
      }
      const yearSurplus = toNum(wp.savings);
      const toInvest = yearSurplus * effInvest / 100;
      const toDebt = yearSurplus * effDebt / 100;

      bal = bal * (1 + r) + toInvest;
      if (remainingDebt > 0) {
        const debtPayment = Math.max(0, Math.min(toDebt, remainingDebt));
        remainingDebt -= debtPayment;
        bal += toDebt - debtPayment;
      } else {
        bal += toDebt;
      }
    }

    return fi;
  };

  return {
    investAll,
    clearDebtFirst,
    custom100_0: customSplit(100, 0),
    custom0_100: customSplit(0, 100),
  };
};

const surplusExpected = simulateSurplus();

const simulateRunway = (returnRateOffset, spendMultiplier) => {
  const retirementData = wealthProjection.find((d) => d.age === profile.retirementAge);
  let balance = retirementData ? retirementData.investments : 0;
  const baseReturn = toNum(assumptions.investmentReturn) + returnRateOffset;
  const result = [];

  for (let age = profile.retirementAge; age <= profile.lifeExpectancy; age++) {
    const yearsIn = age - profile.retirementAge;
    const calYear = retirementCalYear + yearsIn;

    const inflationAdjusted = categories.reduce((s, cat) => {
      const base = toNum(cat.annualRet);
      const rate = toNum(cat.retRate) / 100;
      return s + base * Math.pow(1 + rate, yearsToRetirement + yearsIn);
    }, 0) * spendMultiplier;

    const oneTime = oneTimeExpenses.reduce((s, e) => {
      const endYear = e.endYear || e.year;
      if (calYear < e.year || calYear > endYear) return s;
      const key = e.category;
      const preRate = key && categoryByKey[key] ? toNum(categoryByKey[key].preRate) / 100 : 0;
      const retRate = key && categoryByKey[key] ? toNum(categoryByKey[key].retRate) / 100 : 0;
      const inflated = toNum(e.amount) * Math.pow(1 + preRate, yearsToRetirement) * Math.pow(1 + retRate, yearsIn);
      return s + inflated;
    }, 0);

    const yearsTotal = yearsToRetirement + yearsIn;
    const passiveGrowth = toNum(assumptions.passiveGrowth) / 100;
    const otherGrowth = toNum(assumptions.otherIncomeGrowth) / 100;

    const passiveInRet = (income.passiveItems && income.passiveItems.length > 0
      ? income.passiveItems.reduce((sum, item) => {
          if (item.endYear && calYear >= item.endYear) return sum;
          return sum + toNum(item.amount) * Math.pow(1 + passiveGrowth, yearsTotal);
        }, 0)
      : toNum(income.passive) * Math.pow(1 + passiveGrowth, yearsTotal));

    const otherInRet = (income.otherIncomeItems && income.otherIncomeItems.length > 0
      ? income.otherIncomeItems.reduce((sum, item) => {
          if (item.endYear && calYear >= item.endYear) return sum;
          return sum + toNum(item.amount) * Math.pow(1 + otherGrowth, yearsTotal);
        }, 0)
      : toNum(income.other) * Math.pow(1 + otherGrowth, yearsTotal));

    const netWithdrawal = Math.max(0, inflationAdjusted + oneTime - passiveInRet - otherInRet);

    result.push({ age, balance: round(Math.max(0, balance)) });

    if (age > profile.retirementAge) {
      balance = Math.max(0, balance * (1 + baseReturn / 100) - netWithdrawal);
    } else {
      balance = Math.max(0, balance * (1 + baseReturn / 100));
    }
  }

  const exhaustion = result.find((d) => d.balance === 0);
  const exhaustionAge = exhaustion ? exhaustion.age : null;
  const years = exhaustionAge !== null ? exhaustionAge - profile.retirementAge : profile.lifeExpectancy - profile.retirementAge;

  return { years, exhaustionAge, survivesTo: exhaustionAge === null ? profile.lifeExpectancy : null };
};

const runwayExpected = {
  baseline: {
    pessimistic: simulateRunway(-3, 1),
    base: simulateRunway(0, 1),
    optimistic: simulateRunway(+3, 0.75),
  },
  perturbed: {
    pessimistic: simulateRunway(-4, 1.2),
    base: simulateRunway(0, 1),
    optimistic: simulateRunway(+6, 0.6),
  },
};

const annualIncomeNow = annualIncomeAtYear(currentYear, 0, profile.currentAge).total;
const currentExpenses = toNum(scenario.totals?.current);
const retirementExpensesToday = toNum(scenario.totals?.retirement);
const totalAssetsNow = toNum(assets.cash) + toNum(assets.investments) + toNum(assets.realEstate) + toNum(assets.other);
const totalLiabilitiesNow = toNum(liabilities.mortgage) + toNum(liabilities.loans) + toNum(liabilities.other);
const netWorthNow = totalAssetsNow - totalLiabilitiesNow;
const debtRatio = totalAssetsNow > 0 ? (totalLiabilitiesNow / totalAssetsNow) * 100 : 0;
const savingsRate = annualIncomeNow > 0 ? ((annualIncomeNow - currentExpenses) / annualIncomeNow) * 100 : 0;
const nwMultiple = toNum(income.salary) > 0 ? netWorthNow / toNum(income.salary) : null;
const emergencyMonths = currentExpenses > 0 ? toNum(assets.cash) / (currentExpenses / 12) : 0;
const investmentMix = totalAssetsNow > 0 ? (toNum(assets.investments) / totalAssetsNow) * 100 : 0;
const retirementFunding = (() => {
  const retData = wealthProjection.find((d) => d.age === profile.retirementAge);
  const retInvest = retData ? retData.investments : 0;
  const reqNestEgg = nestEggSwr > 0 ? getRetNominalForYear(retirementCalYear) / (nestEggSwr / 100) : 0;
  return reqNestEgg > 0 ? (retInvest / reqNestEgg) * 100 : 0;
})();
const incomeReplacement = annualIncomeNow > 0 ? (retirementExpensesToday / annualIncomeNow) * 100 : 0;
const reqSWRToday = toNum(assets.investments) > 0 ? (getRetNominalForYear(retirementCalYear) / toNum(assets.investments)) * 100 : null;

const debtFreeAgeExpected = (() => {
  const hit = wealthProjection.find((d) => d.totalLiabilities === 0);
  return hit ? hit.age : null;
})();

const firstMillionUsdYearExpected = (() => {
  const usdRate = 3.67;
  const thresholdAED = 1_000_000 * usdRate;
  const hit = wealthProjection.find((d) => d.netWorth >= thresholdAED);
  return hit ? hit.year : null;
})();

const targetAge = Number(extracted.preRetirement?.whatIfAdjusted?.whatIfAge || 42);
const targetYear = currentYear + (targetAge - profile.currentAge);

const lowExpected = getProjectedExpenses(targetYear, { rateOverrideDelta: -2.5 });
const baseExpected = getProjectedExpenses(targetYear, {});
const highExpected = getProjectedExpenses(targetYear, { rateOverrideDelta: +3.5 });
const whatIfExpected = getProjectedExpenses(targetYear, {
  adjMap: {
    csv_housing: 2.0,
    csv_education: 1.5,
    csv_health_fitness: 2.5,
  },
});
const whatIfVsBaseExpected = whatIfExpected - baseExpected;
const whatIfVsBasePctExpected = baseExpected > 0 ? (whatIfVsBaseExpected / baseExpected) * 100 : 0;

const dashboardObs = extracted.dashboard?.baseline || {};
const preRetBaseObs = extracted.preRetirement?.baselineProjection || {};
const preRetAdjObs = extracted.preRetirement?.whatIfAdjusted || {};
const healthObs = extracted.retirementHealth?.baseline || {};
const healthGapObs = extracted.retirementHealth?.gapDetails || {};
const surplusObs = extracted.surplusDeployment || {};
const runwayObs = extracted.runway || {};
const runwayDebug = capture.debug || {};

const runwayMetaValue = (meta) => {
  const parsed = Number(meta?.value);
  return Number.isFinite(parsed) ? parsed : null;
};

const runwayBeforeControls = {
  pessimisticReturn: runwayMetaValue(runwayDebug.runwayBefore?.pessimisticReturn),
  pessimisticSpend: runwayMetaValue(runwayDebug.runwayBefore?.pessimisticSpend),
  optimisticReturn: runwayMetaValue(runwayDebug.runwayBefore?.optimisticReturn),
  optimisticSpend: runwayMetaValue(runwayDebug.runwayBefore?.optimisticSpend),
};

const runwayPerturbedControls = {
  pessimisticReturn: runwayMetaValue(runwayDebug.runwayPerturbed?.pessimisticReturn),
  pessimisticSpend: runwayMetaValue(runwayDebug.runwayPerturbed?.pessimisticSpend),
  optimisticReturn: runwayMetaValue(runwayDebug.runwayPerturbed?.optimisticReturn),
  optimisticSpend: runwayMetaValue(runwayDebug.runwayPerturbed?.optimisticSpend),
};

const runwayResetControls = {
  pessimisticReturn: runwayMetaValue(runwayDebug.runwayReset?.pessimisticReturn),
  pessimisticSpend: runwayMetaValue(runwayDebug.runwayReset?.pessimisticSpend),
  optimisticReturn: runwayMetaValue(runwayDebug.runwayReset?.optimisticReturn),
  optimisticSpend: runwayMetaValue(runwayDebug.runwayReset?.optimisticSpend),
};

// Requested section coverage checks
pushCheck({ element: '5 Key Metrics', metric: 'Net Worth', expected: netWorthNow, observed: parseMoney(dashboardObs.netWorth), absTol: 50_000 });
pushCheck({ element: '5 Key Metrics', metric: 'Debt Free Age', expected: debtFreeAgeExpected, observed: Number(dashboardObs.debtFreeAge), predicate: (e, o) => e === o });
pushCheck({ element: '5 Key Metrics', metric: 'First $1M USD Year', expected: firstMillionUsdYearExpected, observed: Number(dashboardObs.firstMillionYear), predicate: (e, o) => e === o });
pushCheck({ element: '5 Key Metrics', metric: 'Years To Planned Retirement', expected: profile.retirementAge - profile.currentAge, observed: Number(dashboardObs.plannedRetirementYears), predicate: (e, o) => e === o });
pushCheck({ element: '5 Key Metrics', metric: 'SWR Needed Today', expected: reqSWRToday, observed: parsePercent(dashboardObs.swrNeededToday), absTol: 0.2 });

pushCheck({ element: '7 Financial Health Cards', metric: 'Savings Rate', expected: savingsRate, observed: parsePercent(dashboardObs.savingsRate), absTol: 0.2 });
pushCheck({ element: '7 Financial Health Cards', metric: 'NW Multiple', expected: nwMultiple, observed: Number((dashboardObs.nwMultiple || '').replace('×', '')), absTol: 0.2 });
pushCheck({ element: '7 Financial Health Cards', metric: 'Debt Ratio', expected: debtRatio, observed: parsePercent(dashboardObs.debtRatio), absTol: 0.2 });
pushCheck({ element: '7 Financial Health Cards', metric: 'Emergency Fund (months)', expected: emergencyMonths, observed: Number(dashboardObs.emergencyFundMonths), absTol: 0.2 });
pushCheck({ element: '7 Financial Health Cards', metric: 'Investment Mix', expected: investmentMix, observed: parsePercent(dashboardObs.investmentMix), absTol: 0.2 });
pushCheck({ element: '7 Financial Health Cards', metric: 'Retirement Funding', expected: retirementFunding, observed: parsePercent(dashboardObs.retirementFunding), absTol: 0.8 });
pushCheck({ element: '7 Financial Health Cards', metric: 'Income Replacement', expected: incomeReplacement, observed: parsePercent(dashboardObs.incomeReplacement), absTol: 1.0 });

pushCheck({ element: 'Pre-retirement Expenses Over Time', metric: 'Current Annual Total', expected: currentExpenses, observed: parseMoney(preRetBaseObs.annualTotal), absTol: 1_000 });
pushCheck({ element: 'Project to a Future Year', metric: 'Low Scenario', expected: lowExpected, observed: parseMoney(preRetBaseObs.lowScenario), absTol: 1_000 });
pushCheck({ element: 'Project to a Future Year', metric: 'Base Scenario', expected: baseExpected, observed: parseMoney(preRetBaseObs.baseScenario), absTol: 1_000 });
pushCheck({ element: 'Project to a Future Year', metric: 'High Scenario', expected: highExpected, observed: parseMoney(preRetBaseObs.highScenario), absTol: 1_000 });

const whatIfTable = preRetAdjObs.whatIfTable || {};
pushCheck({ element: 'What-If Scenarios', metric: 'Adjusted Scenario Total', expected: whatIfExpected, observed: parseMoney(whatIfTable.yourScenario), absTol: 1_000 });
pushCheck({ element: 'What-If Scenarios', metric: 'Delta vs Base (amount)', expected: whatIfVsBaseExpected, observed: parseMoney(preRetAdjObs.whatIfVsBase), absTol: 1_000 });
pushCheck({ element: 'What-If Scenarios', metric: 'Delta vs Base (%)', expected: whatIfVsBasePctExpected, observed: parsePercent(preRetAdjObs.whatIfVsBase), absTol: 0.2 });

// Chart coverage through core derived anchors
pushCheck({ element: 'Net Worth Over Time', metric: 'Exhaustion Age', expected: wealthProjection.exhaustionAge, observed: Number(dashboardObs.investmentsExhaustedAge), predicate: (e, o) => e === o });
pushCheck({ element: 'Assets Over Time', metric: 'Current Total Assets', expected: totalAssetsNow, observed: parseMoney((panels.dashboardBaseline || '').match(/TOTAL ASSETS\n(AED\s?[0-9.,]+[MK]?)/)?.[1]), absTol: 100_000 });
pushCheck({ element: 'Cash Flow Over Time', metric: 'Current Savings (from annual)', expected: annualIncomeNow - currentExpenses, observed: parseMoney((panels.dashboardBaseline || '').match(/SAVINGS RATE[\s\S]*?(AED\s?[0-9.,]+[MK]?)\/yr/)?.[1]), absTol: 2_000 });

pushCheck({ element: 'Surplus Deployment', metric: 'Invest-All Extra At Retirement', expected: surplusExpected.investAll.extraAtRet, observed: parseMoney(surplusObs.baseline?.investAllExtraAtRetirement), absTol: 120_000 });
pushCheck({ element: 'Surplus Deployment', metric: 'Clear Debt First Debt-Free Age', expected: surplusExpected.clearDebtFirst.debtFreeAge, observed: Number(surplusObs.baseline?.clearDebtDebtFreeAge), predicate: (e, o) => e === o });
pushCheck({ element: 'Surplus Deployment', metric: 'Custom Split 100/0 FI Age', expected: surplusExpected.custom100_0, observed: Number(surplusObs.investFirstSnapshot?.customFiAge), predicate: (e, o) => e === o });
pushCheck({ element: 'Surplus Deployment', metric: 'Custom Split 0/100 FI Age', expected: surplusExpected.custom0_100, observed: Number(surplusObs.debtFirstSnapshot?.customFiAge), predicate: (e, o) => e === o });

const reqNestEggExpected = nestEggSwr > 0 ? getRetNominalForYear(retirementCalYear) / (nestEggSwr / 100) : 0;
const projectedAtRetExpected = (wealthProjection.find((d) => d.age === profile.retirementAge) || {}).investments || 0;
const gapExpected = projectedAtRetExpected - reqNestEggExpected;
pushCheck({ element: 'Retirement Health', metric: 'Required Nest Egg', expected: reqNestEggExpected, observed: parseMoney(healthObs.requiredNestEgg), absTol: 120_000 });
pushCheck({ element: 'Retirement Health', metric: 'Projected Investments @55', expected: projectedAtRetExpected, observed: parseMoney(healthObs.projectedInvestments), absTol: 80_000 });
pushCheck({ element: 'Retirement Health', metric: 'Gap', expected: gapExpected, observed: parseMoney(healthObs.gapOrSurplus), absTol: 120_000 });
pushCheck({ element: 'Retirement Health', metric: 'Save More Lever (monthly)', expected: null, observed: parseMoney(healthGapObs.saveMore), predicate: (e, o) => Number.isFinite(o) && o > 0 });

pushCheck({ element: 'Retirement Runway', metric: 'Baseline Pessimistic Years', expected: runwayExpected.baseline.pessimistic.years, observed: Number((runwayObs.baseline?.pessimistic?.years || '').replace('yrs', '')), predicate: (e, o) => e === o });
pushCheck({ element: 'Retirement Runway', metric: 'Baseline Base Years', expected: runwayExpected.baseline.base.years, observed: Number((runwayObs.baseline?.base?.years || '').replace('yrs', '')), predicate: (e, o) => e === o });
pushCheck({ element: 'Retirement Runway', metric: 'Baseline Optimistic Years', expected: runwayExpected.baseline.optimistic.years, observed: Number((runwayObs.baseline?.optimistic?.years || '').replace('yrs', '')), predicate: (e, o) => e === o });
pushCheck({ element: 'Retirement Runway', metric: 'Perturbed Pessimistic Years', expected: runwayExpected.perturbed.pessimistic.years, observed: Number((runwayObs.perturbed?.pessimistic?.years || '').replace('yrs', '')), predicate: (e, o) => e === o });
pushCheck({ element: 'Retirement Runway', metric: 'Perturbed Optimistic Years', expected: runwayExpected.perturbed.optimistic.years, observed: Number((runwayObs.perturbed?.optimistic?.years || '').replace('yrs', '')), predicate: (e, o) => e === o });

pushCheck({ element: 'Runway Control Parity', metric: 'Perturbed Pessimistic Return Offset', expected: -5.5, observed: runwayPerturbedControls.pessimisticReturn, absTol: 1e-6 });
pushCheck({ element: 'Runway Control Parity', metric: 'Perturbed Pessimistic Spend Increase', expected: 20, observed: runwayPerturbedControls.pessimisticSpend, absTol: 1e-6 });
pushCheck({ element: 'Runway Control Parity', metric: 'Perturbed Optimistic Return Offset', expected: 6, observed: runwayPerturbedControls.optimisticReturn, absTol: 1e-6 });
pushCheck({ element: 'Runway Control Parity', metric: 'Perturbed Optimistic Spend Cut', expected: 40, observed: runwayPerturbedControls.optimisticSpend, absTol: 1e-6 });

pushCheck({ element: 'Runway Control Parity', metric: 'Reset Pessimistic Return Matches Baseline', expected: runwayBeforeControls.pessimisticReturn, observed: runwayResetControls.pessimisticReturn, absTol: 1e-6 });
pushCheck({ element: 'Runway Control Parity', metric: 'Reset Pessimistic Spend Matches Baseline', expected: runwayBeforeControls.pessimisticSpend, observed: runwayResetControls.pessimisticSpend, absTol: 1e-6 });
pushCheck({ element: 'Runway Control Parity', metric: 'Reset Optimistic Return Matches Baseline', expected: runwayBeforeControls.optimisticReturn, observed: runwayResetControls.optimisticReturn, absTol: 1e-6 });
pushCheck({ element: 'Runway Control Parity', metric: 'Reset Optimistic Spend Matches Baseline', expected: runwayBeforeControls.optimisticSpend, observed: runwayResetControls.optimisticSpend, absTol: 1e-6 });

// Reset should equal baseline if import/reset behavior is correct.
pushCheck({
  element: 'Retirement Runway',
  metric: 'Reset Matches Baseline (Pessimistic Years)',
  expected: Number((runwayObs.baseline?.pessimistic?.years || '').replace('yrs', '')),
  observed: Number((runwayObs.reset?.pessimistic?.years || '').replace('yrs', '')),
  predicate: (e, o) => e === o,
});

const passed = results.filter((r) => r.pass).length;
const failed = results.length - passed;

const elementSummary = Object.entries(results.reduce((acc, r) => {
  if (!acc[r.element]) acc[r.element] = { pass: 0, fail: 0 };
  if (r.pass) acc[r.element].pass += 1;
  else acc[r.element].fail += 1;
  return acc;
}, {})).map(([element, s]) => ({ element, pass: s.pass, fail: s.fail }));

const report = {
  generatedAt: new Date().toISOString(),
  sourceCaptureGeneratedAt: capture.generatedAt,
  sourceExtractedGeneratedAt: extracted.generatedAt,
  totals: { checks: results.length, passed, failed },
  elementSummary,
  failures: results.filter((r) => !r.pass),
  checks: results,
};

fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
