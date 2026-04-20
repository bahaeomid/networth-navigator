import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const capturePath = path.resolve(root, '_dev', 'artifacts', 'user_scenario_capture.json');
const outputPath = path.resolve(root, '_dev', 'artifacts', 'user_scenario_extracted.json');

const raw = fs.readFileSync(capturePath, 'utf8');
const data = JSON.parse(raw);
const panels = data.panels || {};

const find = (text, re) => {
  if (!text) return null;
  const m = text.match(re);
  if (!m) return null;
  return (m[1] ?? m[0]).trim();
};

const findAll = (text, re) => {
  if (!text) return [];
  return Array.from(text.matchAll(re)).map((m) => (m[1] ?? m[0]).trim());
};

const cleanMinus = (value) => value ? value.replace(/^−/, '-') : value;

const parseDashboard = (text) => ({
  netWorth: find(text, /NET WORTH[\s\S]*?(AED\s[0-9.,]+(?:[MK])?)/),
  debtFreeAge: find(text, /DEBT FREE[\s\S]*?Age\s*(\d+)/),
  firstMillionYear: find(text, /FIRST \$1M USD[\s\S]*?(\d{4})/),
  plannedRetirementYears: find(text, /PLANNED RETIREMENT[\s\S]*?in\s*(\d+)yrs/),
  savingsRate: find(text, /SAVINGS RATE[\s\S]*?([0-9.]+%)/),
  nwMultiple: find(text, /NW MULTIPLE[\s\S]*?([0-9.]+×)/),
  debtRatio: find(text, /DEBT RATIO[\s\S]*?([0-9.]+%)/),
  emergencyFundMonths: find(text, /EMERGENCY FUND[\s\S]*?([0-9.]+)mo/),
  investmentMix: find(text, /INVESTMENT MIX[\s\S]*?([0-9.]+%)/),
  retirementFunding: find(text, /RETIREMENT FUNDING[\s\S]*?([0-9.]+%)/),
  incomeReplacement: find(text, /INCOME REPLACEMENT[\s\S]*?([0-9.]+%)/),
  swrNeededToday: find(text, /SWR needed today[\s\S]*?([0-9.]+%)/),
  runwaySurvivalOdds: find(text, /Runway survival odds[\s\S]*?([0-9.]+%)/),
  investmentsExhaustedAge: find(text, /Investments exhausted at[\s\S]*?Age\s*(\d+)/),
});

const parseSurplus = (text) => {
  const clearDebtDebtFreeAge =
    find(text, /CLEAR DEBT FIRST[\s\S]*?DEBT-FREE AGE[\s\S]*?\)\s*Age\s*(\d+)/) ||
    find(text, /CLEAR DEBT FIRST[\s\S]*?DEBT-FREE AGE[\s\S]*?Age\s*(\d+)\s*\n▲/);

  return {
    investAllFiAge: find(text, /INVEST ALL SURPLUS[\s\S]*?FI AGE IMPACT[\s\S]*?Age\s*(\d+)/),
    investAllFiStatus: find(text, /INVEST ALL SURPLUS[\s\S]*?FI AGE IMPACT[\s\S]*?(Not reached within dashboard horizon)/),
    investAllExtraAtRetirement: find(text, /EXTRA INVESTMENTS AT TARGET RETIREMENT[\s\S]*?([+\-]?AED\s[0-9.,]+(?:[MK])?)/),
    clearDebtDebtFreeAge,
    clearDebtFiAge: find(text, /CLEAR DEBT FIRST[\s\S]*?FI AGE IMPACT[\s\S]*?Age\s*(\d+)/),
    clearDebtFiStatus: find(text, /CLEAR DEBT FIRST[\s\S]*?FI AGE IMPACT[\s\S]*?(Not reached within dashboard horizon)/),
    customInvestPct: find(text, /CUSTOM SPLIT[\s\S]*?Invest\s*\n(\d+)%/),
    customDebtPct: find(text, /CUSTOM SPLIT[\s\S]*?Debt\s*\n(\d+)%/),
    customCashPct: find(text, /CUSTOM SPLIT[\s\S]*?Cash \(held idle\)\s*\n(\d+)%/),
    customFiAge: find(text, /CUSTOM SPLIT[\s\S]*?FI AGE IMPACT[\s\S]*?Age\s*(\d+)/),
    customFiStatus: find(text, /CUSTOM SPLIT[\s\S]*?FI AGE IMPACT[\s\S]*?(Not reached within dashboard horizon)/),
  };
};

const parsePreRetScenario = (text) => {
  const table = find(text, /Total\n(AED\s[^\n]+)\n(AED\s[^\n]+)\n(AED\s[^\n]+)\n(AED\s[^\n]+)/);
  const tableMatches = text ? text.match(/Total\n(AED\s[^\n]+)\n(AED\s[^\n]+)\n(AED\s[^\n]+)\n(AED\s[^\n]+)/) : null;

  return {
    annualTotal: find(text, /ANNUAL[\s\S]*?(AED\s[0-9.,]+(?:[MK])?)/),
    monthlyTotal: find(text, /MONTHLY[\s\S]*?(AED\s[0-9.,]+(?:[MK])?)/),
    lowScenario: find(text, /↓ LOW[\s\S]*?(AED\s[0-9.,]+(?:[MK])?)/),
    baseScenario: find(text, /◎ BASE[\s\S]*?(AED\s[0-9.,]+(?:[MK])?)/),
    highScenario: find(text, /↑ HIGH[\s\S]*?(AED\s[0-9.,]+(?:[MK])?)/),
    whatIfAge: find(text, /YOUR SCENARIO AT AGE\s*(\d+)\s*VS PRESETS/),
    whatIfTable: table ? {
      low: tableMatches?.[1] ?? null,
      base: tableMatches?.[2] ?? null,
      high: tableMatches?.[3] ?? null,
      yourScenario: tableMatches?.[4] ?? null,
    } : null,
    whatIfVsBase: find(text, /vs Base[\s\S]*?([+\-]AED\s[^\n]+\([+\-]?[0-9.]+%\))/),
  };
};

const parseRetirementHealth = (text) => ({
  requiredNestEgg: find(text, /REQUIRED NEST EGG[\s\S]*?(AED\s[0-9.,]+(?:[MK])?)/),
  projectedInvestments: find(text, /PROJECTED INVESTMENTS AT\s*55[\s\S]*?(AED\s[0-9.,]+(?:[MK])?)/),
  gapOrSurplus: cleanMinus(find(text, /(?:RETIREMENT GAP|SURPLUS)[\s\S]*?([−\-+]?AED\s[0-9.,]+(?:[MK])?)/)),
  fundedPct: find(text, /Nest egg funded[\s\S]*?([0-9]+%)/),
  saveMore: find(text, /💰 SAVE MORE[\s\S]*?\n([^\n]+)/),
  retireLater: find(text, /📅 RETIRE LATER[\s\S]*?\n([^\n]+)/),
  higherReturn: find(text, /📈 HIGHER RETURN[\s\S]*?\n([^\n]+)/),
  survivalOdds: find(text, /\n([0-9]+%)\nsurvival\nodds/),
  runsOutAge: find(text, /Runs out\nat age\s*(\d+)/),
  verdict: find(text, /(?:✓|⚠|✗)\n([^\n]+)/),
});

const parseRunwayCard = (text, label) => {
  if (!text || !label) return { years: null, exhaustedAge: null, survivesTo: null };
  const cardRe = new RegExp(`${label}[\\s\\S]*?\\n(\\d+)yrs[\\s\\S]*?(?:Exhausted age\\s*(\\d+)|Survives to\\s*(\\d+))`);
  const m = text.match(cardRe);
  if (!m) return { years: null, exhaustedAge: null, survivesTo: null };
  return {
    years: m[1] ? `${m[1]}yrs` : null,
    exhaustedAge: m[2] || null,
    survivesTo: m[3] || null,
  };
};

const parseRunway = (text) => ({
  pessimistic: parseRunwayCard(text, 'PESSIMISTIC'),
  base: parseRunwayCard(text, 'BASE'),
  optimistic: parseRunwayCard(text, 'OPTIMISTIC'),
  footnote: find(text, /Portfolio[\s\S]*?(Review spending or boost retirement savings\.|survives to age\s*\d+[^\n]*\.)/i),
});

const out = {
  generatedAt: data.generatedAt,
  inputSummary: {
    currentYear: data.scenario?.currentYear ?? null,
    profile: data.scenario?.profile ?? null,
    totals: data.scenario?.totals ?? null,
    assumptions: data.scenario?.assumptions ?? null,
  },
  dashboard: {
    baseline: parseDashboard(panels.dashboardBaseline),
    final: parseDashboard(panels.dashboardFinal),
  },
  surplusDeployment: {
    baseline: parseSurplus(panels.dashboardSurplusBaseline),
    debtFirstSnapshot: parseSurplus(panels.dashboardSurplusDebtFirst),
    investFirstSnapshot: parseSurplus(panels.dashboardSurplusInvestFirst),
  },
  preRetirement: {
    baselineProjection: parsePreRetScenario(panels.preRetFutureProjectionBaseline),
    whatIfAdjusted: parsePreRetScenario(panels.preRetWhatIfAdjusted),
  },
  retirementHealth: {
    baseline: parseRetirementHealth(panels.retirementHealthBaseline),
    gapDetails: parseRetirementHealth(panels.retirementHealthGapDetails),
  },
  swrPerturbation: {
    swr3: parseRetirementHealth(panels.retirementHealthSwr3),
    swr4Reset: parseRetirementHealth(panels.retirementHealthSwr4Reset),
    swr5: parseRetirementHealth(panels.retirementHealthSwr5),
  },
  volatilityPerturbation: {
    vol20: parseRetirementHealth(panels.retirementHealthVol20),
    vol12Reset: parseRetirementHealth(panels.retirementHealthVol12Reset),
  },
  runway: {
    baseline: parseRunway(panels.retirementRunwayBaseline),
    perturbed: parseRunway(panels.retirementRunwayPerturbed),
    reset: parseRunway(panels.retirementRunwayReset),
  },
};

fs.writeFileSync(outputPath, JSON.stringify(out, null, 2), 'utf8');
console.log(JSON.stringify(out, null, 2));
