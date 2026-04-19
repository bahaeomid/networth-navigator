import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea, Dot } from 'recharts';

// Currency definitions
const CURRENCIES = {
  AED: { symbol: 'AED', rate: 1 },
  USD: { symbol: 'USD', rate: 3.67 },
  CAD: { symbol: 'CAD', rate: 2.72 },
  EUR: { symbol: 'EUR', rate: 4.01 },
  GBP: { symbol: 'GBP', rate: 4.87 },
};

// Milestone colors
const MILESTONE_COLORS = {
  retirement: { color: '#a78bfa', label: 'Retirement' },
  milestone: { color: '#34d399', label: 'Financial Milestone' },
  life: { color: '#60a5fa', label: 'Life Event' },
  expense: { color: '#f59e0b', label: 'Planned Expense' },
};

// Format number with commas
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// HTML-escape user-controlled strings before interpolation into HTML templates
const escapeHtml = (str) => {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
};

// Currency formatting with commas
const formatCurrency = (amountInAED, currency, exchangeRates) => {
  const rate = exchangeRates[currency] || 1;
  const amount = amountInAED / rate;
  const cfg = CURRENCIES[currency];
  
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) {
    return `${amount < 0 ? '-' : ''}${cfg.symbol} ${((absAmount / 1000000) % 1 === 0 ? (absAmount/1000000).toFixed(0) : (absAmount/1000000).toFixed(1))}M`;
  } else if (absAmount >= 1000) {
    return `${amount < 0 ? '-' : ''}${cfg.symbol} ${formatNumber(Math.round(absAmount / 1000))}K`;
  } else {
    return `${amount < 0 ? '-' : ''}${cfg.symbol} ${formatNumber(Math.round(absAmount))}`;
  }
};

// Currency formatting with 1 decimal for K values
const formatCurrencyDecimal = (amountInAED, currency, exchangeRates) => {
  const rate = exchangeRates[currency] || 1;
  const amount = amountInAED / rate;
  const cfg = CURRENCIES[currency];
  const absAmount = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';
  if (absAmount >= 1000000) {
    const val = absAmount / 1000000;
    const str = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
    return `${sign}${cfg.symbol} ${str}M`;
  } else if (absAmount >= 1000) {
    const val = absAmount / 1000;
    const str = val % 1 === 0 ? val.toFixed(0) : val.toFixed(1);
    return `${sign}${cfg.symbol} ${str}K`;
  } else {
    return `${sign}${cfg.symbol} ${Math.round(absAmount).toLocaleString()}`;
  }
};

// Currency conversion helpers for input fields
// All values stored internally as AED. These convert for display/entry.
const toDisplay = (aedVal, rate) => {
  if (!rate || rate <= 0 || rate === 1) return aedVal;
  return Math.round((aedVal / rate) * 100) / 100;
};
const fromDisplay = (displayVal, rate) => {
  if (!rate || rate === 1) return Math.round(parseFloat(displayVal) || 0);
  return Math.round((parseFloat(displayVal) || 0) * rate);
};
// Format a display-currency number with commas (no symbol)
const formatDisplayNumber = (aedVal, rate) => {
  const d = toDisplay(aedVal, rate);
  return d.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Tooltips
const TOOLTIPS = {
  currentAge: "Your current age in years. Used as the starting point for all projections.",
  retirementAge: "The age you plan to stop working. Income stops and retirement expenses begin at this age.",
  lifeExpectancy: "Expected age of death for planning purposes. Standard is 90-95 years.",
  cash: "Liquid cash in bank accounts, emergency funds. Low/no growth expected.",
  investments: "Stocks, bonds, mutual funds, ETFs. Subject to investment return assumptions.",
  realEstate: "Property value (your home + investment properties). Appreciates based on real estate rate.",
  otherAssets: "Other valuable assets: business equity, collectibles, precious metals, vehicles, etc. Treated as illiquid — this category appreciates at the Other growth rate but does not contribute to SWR drawdown capacity. Only Investments and Cash are considered liquid for retirement funding purposes.",
  mortgage: "Outstanding mortgage balance on all properties. The 'end year' field on each sub-item sets the calendar year it's paid off — balance amortizes linearly to zero by then. Without an end year, the balance amortizes linearly over a default 25-year term from today.",
  loans: "Car loans, personal loans, student loans, etc. The 'end year' field on each sub-item sets the payoff year — balance amortizes to zero by then. Without an end year, the balance amortizes linearly over a default 5-year term from today.",
  otherLiabilities: "Credit card debt, lines of credit, other debts. The 'end year' field on each sub-item sets the payoff year — balance amortizes to zero by then. Without an end year, the balance amortizes linearly over a default 5-year term from today.",
  salary: "Annual salary income. Grows each year at the Salary Growth rate until your retirement age, then stops. The 'end year' field on each sub-item overrides this — useful for fixed-term or contract roles. If you pay income tax, enter your after-tax take-home pay for more accurate projections — the app does not model tax brackets.",
  bonuses: "Annual bonuses, RSUs, stock options, performance pay.",
  rentalIncome: "Annual rental income from investment properties.",
  otherIncome: "Freelance, side hustles, dividends, interest, etc.",
  passiveIncome: "Rental income, dividends, royalties, and other passive income. Grows annually at the Passive Growth rate set here. Use the 'end year' field on each sub-item to model income that stops at a specific year, e.g. a rental property you plan to sell.",
  otherIncome2: "Bonuses, freelance, side hustles, and other variable income. Grows annually at the Other Income Growth rate set here. Use the 'end year' field on each sub-item to model income that stops at a specific year.",
  salaryGrowth: "Annual salary increase %. Applied to your Salary only. Typical range: 3-5%. Growth stops at retirement. Set separate growth rates for Passive and Other Income below.",
  currentExpense: "Auto-calculated from the Expense Calculator tab. Total of all Essential and Discretionary expenses.",
  retirementExpense: "Your annual spending in retirement at the point you retire (in today's terms). This is independent of the Expense Calculator — set it to roughly 70-80% of pre-retirement spend. Once in retirement, this figure grows each year at the Retirement Expense Growth rate (under Economic Assumptions).",
  // inflationRate tooltip removed — superseded by per-category retExpenseGrowthRates
  investmentReturn: "Expected annual return on investments (stocks/bonds). Historical avg: 7-8%. Enter your after-tax return — if your gains are subject to capital gains or dividend tax, subtract the drag (typically 0.5–1.5pp) from your gross expected return.",
  investmentStdDev: "Volatility of investment returns. Used in Monte Carlo simulation. Typical: 12-15%.",
  realEstateAppreciation: "Annual property value growth %. Typical range: 3–6% depending on market and location.",
  savingsRate: "Annual savings as % of gross income. This surplus is undeployed by default — use Surplus Deployment in the Dashboard tab to model investing it or paying down debt. Target: 10% minimum · 20% healthy · 30%+ accelerates wealth building.",
  netWorth: "Total assets minus total liabilities. Liabilities amortize linearly to their end year — set end years on mortgages and loans in the Finances tab to reflect scheduled payoffs. Without an end year: mortgages default to a 25-year term, loans and other liabilities to 5 years.",
  retirementReadiness: "Survival odds: % of 1,000 market scenarios where your money lasts through your life expectancy. Above 80% = strong plan. Below 60% = review your retirement budget or savings rate. Uses your Retirement Budget (entered in today's terms, inflated to retirement day) as the annual withdrawal amount.",
  yearsToRetirement: "Years until your planned retirement age. FI Age (in the Retirement Health card) shows the earliest you could theoretically retire based on current savings — ideally it lands before or at this date.",
  drawdown: "When enabled, retirement expenses are withdrawn annually from your Investments balance — simulating the real depletion of your portfolio during retirement. Withdrawals are funded from Investments only (stocks, ETFs, index funds, retirement accounts), since real estate appreciates passively and other assets are treated as illiquid. The annual withdrawal equals your inflation-adjusted retirement expenses, reduced by any passive or other income continuing through retirement — only the net shortfall is withdrawn from your portfolio to cover your retirement expenses. Disable to see gross asset growth without any depletion effect.",
};

// Global tooltip state — a simple pub/sub so the popup renders at the root level
// avoiding all z-index / overflow stacking context problems
const _tooltipListeners = [];
const _tooltipBus = {
  set: (state) => _tooltipListeners.forEach(fn => fn(state)),
};

const TooltipLayer = () => {
  const [tip, setTip] = React.useState(null);
  React.useEffect(() => {
    _tooltipListeners.push(setTip);
    return () => {
      const i = _tooltipListeners.indexOf(setTip);
      if (i > -1) _tooltipListeners.splice(i, 1);
    };
  }, []);
  if (!tip) return null;
  // Smart positioning: center on trigger, then shift so the box stays within viewport.
  // maxWidth is 320px so half-width is at most 160px. Add 8px margin from edges.
  const MARGIN = 8;
  const MAX_HALF = 160;
  const rawLeft = tip.left;
  // How far we'd need to shift to keep the box on screen
  const overflowRight = (rawLeft + MAX_HALF + MARGIN) - window.innerWidth;
  const overflowLeft  = MARGIN + MAX_HALF - rawLeft;
  let left = rawLeft;
  let transformX = '-50%';
  if (overflowRight > 0) {
    // Shift left: move anchor left and compensate transform so box edge hits margin
    left = window.innerWidth - MAX_HALF - MARGIN;
    transformX = '-50%';
  } else if (overflowLeft > 0) {
    // Shift right: pin left edge to margin
    left = MARGIN;
    transformX = '0%';
  }
  return (
    <div style={{
      position: 'fixed',
      top: tip.top,
      left,
      transform: `translateX(${transformX})`,
      background: 'rgba(8, 18, 36, 0.98)',
      border: '1px solid rgba(96, 165, 250, 0.35)',
      borderRadius: '8px',
      padding: '0.65rem 0.9rem',
      fontSize: '0.78rem',
      minWidth: '200px',
      maxWidth: '320px',
      width: 'max-content',
      zIndex: 2147483647,
      lineHeight: 1.55,
      boxShadow: '0 6px 24px rgba(0, 0, 0, 0.6)',
      color: '#d1d5db',
      whiteSpace: 'pre-wrap',
      pointerEvents: 'none',
    }}>
      {tip.text}
    </div>
  );
};

const InfoTooltip = ({ text }) => {
  const triggerRef = React.useRef(null);
  const show = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      _tooltipBus.set({ text, top: rect.bottom + 7, left: rect.left + rect.width / 2 });
    }
  };
  const hide = () => _tooltipBus.set(null);
  return (
    <span
      ref={triggerRef}
      onMouseEnter={show}
      onMouseLeave={hide}
      style={{
        marginLeft: '0.35rem',
        cursor: 'help',
        color: '#60a5fa',
        fontSize: '0.78rem',
        fontWeight: '400',
        lineHeight: 1.1,
        display: 'inline-flex',
        alignItems: 'center',
        verticalAlign: 'middle',
        textTransform: 'none',
        letterSpacing: 'normal',
        fontStyle: 'normal',
        userSelect: 'none',
      }}
    >
      ⓘ
    </span>
  );
};

const CalcInput = ({ icon, label, value, field, tooltip, color, onChange, growthRate, onGrowthChange, currency: ciCurrency, rate: ciRate, tag, onTagToggle, phaseOutYear, onPhaseOutChange, onRename, onStartEdit, isEditing, onRemove, canRemove, monthly }) => {
  const _ciCurrency = ciCurrency || 'AED';
  const _ciRate = ciRate || 1;
  const _ciToDisplay = (aed) => { const d = toDisplay(aed, _ciRate); return monthly ? Math.round(d / 12).toLocaleString() : Math.round(d).toLocaleString(); };
  const [displayValue, setDisplayValue] = React.useState(_ciToDisplay(value));
  const [isFocused, setIsFocused] = React.useState(false);
  const [growthDisplay, setGrowthDisplay] = React.useState(growthRate != null ? growthRate.toString() : '');
  const [growthFocused, setGrowthFocused] = React.useState(false);

  React.useEffect(() => {
    if (!isFocused) setDisplayValue(_ciToDisplay(value));
  }, [value, isFocused, _ciRate, monthly]);

  React.useEffect(() => {
    if (!growthFocused && growthRate != null) setGrowthDisplay(growthRate.toString());
  }, [growthRate, growthFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(displayValue.replace(/,/g, ''));
  };
  const handleBlur = () => {
    setIsFocused(false);
    const rawDisplay = parseFloat(displayValue.replace(/,/g, '')) || 0;
    // If monthly mode: user typed monthly amount → convert to annual for storage
    const displayInCurrency = monthly ? rawDisplay * 12 : rawDisplay;
    const aedValue = fromDisplay(displayInCurrency, _ciRate);
    onChange(field, aedValue);
    setDisplayValue(_ciToDisplay(aedValue));
  };
  const handleChange = (e) => {
    const val = e.target.value.replace(/,/g, '');
    if (val === '' || /^[\d.]*$/.test(val)) setDisplayValue(val);
  };

  const handleGrowthFocus = () => { setGrowthFocused(true); };
  const handleGrowthBlur = () => {
    setGrowthFocused(false);
    const num = parseFloat(growthDisplay) || 0;
    const clamped = Math.min(GROWTH_RATE_MAX, Math.max(0, num));
    if (onGrowthChange) onGrowthChange(field, clamped);
    setGrowthDisplay(clamped.toString());
  };
  const handleGrowthChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) setGrowthDisplay(val);
  };

  const bg = onTagToggle ? 'rgba(255,255,255,0.02)' : color.replace('0.15', '0.05');
  return (
    <div className={onRemove ? 'cat-row-hover' : ''} style={{ padding: '0.45rem 0.75rem', background: bg, borderRadius: '8px', border: onTagToggle ? '1px solid rgba(255,255,255,0.07)' : `1px solid ${color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
        {onTagToggle && (
          <button
            onClick={onTagToggle}
            title={tag === 'essential' ? 'Essential — click to mark Discretionary' : 'Discretionary — click to mark Essential'}
            style={{
              fontSize: '0.58rem', fontWeight: '800', letterSpacing: '0.06em',
              padding: '0.15rem 0.4rem', borderRadius: '4px', cursor: 'pointer', border: 'none',
              background: tag === 'essential' ? 'rgba(239,68,68,0.2)' : 'rgba(96,165,250,0.2)',
              color: tag === 'essential' ? '#f87171' : '#93c5fd',
              lineHeight: 1.4, whiteSpace: 'nowrap', flexShrink: 0
            }}
          >{tag === 'essential' ? 'E' : 'D'}</button>
        )}
        {isEditing && onRename ? (
          <input
            autoFocus
            defaultValue={label}
            onBlur={e => onRename(field, e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') e.target.blur(); if (e.key === 'Escape') onRename(field, label); }}
            style={{ fontSize: '0.82rem', fontWeight: '600', color: '#e8e9ed', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(167,139,250,0.6)', borderRadius: '4px', padding: '0.1rem 0.35rem', width: '110px', outline: 'none' }}
          />
        ) : (
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', cursor: onRename ? 'pointer' : 'default' }}
            onClick={() => onStartEdit && onStartEdit(field)}
            className={onRename ? 'cat-label-hover' : ''}
          >
            <label style={{ fontSize: '0.82rem', fontWeight: '600', color: '#e8e9ed', whiteSpace: 'nowrap', cursor: 'inherit', pointerEvents: 'none' }}>
              {onTagToggle ? null : icon} {label}
            </label>
            {onRename && (
              <svg className="cat-edit-icon" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            )}
          </div>
        )}
        <InfoTooltip text={tooltip} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {onGrowthChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <input
              type="text"
              value={growthDisplay}
              onChange={handleGrowthChange}
              onFocus={handleGrowthFocus}
              onBlur={handleGrowthBlur}
              style={{
                width: '44px',
                padding: '0.3rem 0.35rem',
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                color: '#f59e0b',
                fontSize: '0.8rem',
                fontFamily: 'JetBrains Mono, monospace',
                textAlign: 'center',
                fontWeight: '600'
              }}
            />
            <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>%</span>
          </div>
        )}
        {onTagToggle && (
          <input
            type="number"
            placeholder="ends"
            value={phaseOutYear || ''}
            onChange={onPhaseOutChange}
            style={{
              width: '68px', padding: '0.3rem 0.35rem',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: phaseOutYear ? '#f59e0b' : '#4b5563',
              fontSize: '0.8rem',
              fontFamily: 'JetBrains Mono, monospace',
              textAlign: 'center', outline: 'none',
              fontWeight: '600'
            }}
          />
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
          <input
            type="text"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            style={{
              width: '130px',
              padding: '0.38rem 0.5rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: '#e8e9ed',
              fontSize: '0.9rem',
              fontFamily: 'JetBrains Mono, monospace',
              textAlign: 'right',
              fontWeight: '600',
            }}
            placeholder="0"
          />
          <span style={{ fontSize: '0.62rem', color: '#4b5563', whiteSpace: 'nowrap' }}>{_ciCurrency}/{monthly ? 'mo' : 'yr'}</span>
        </div>
      </div>
      {onRemove && (
        <button
          className="cat-edit-icon"
          onClick={() => canRemove ? onRemove(field) : null}
          title={canRemove ? 'Remove category' : 'Cannot remove — last in group'}
          style={{ background: 'none', border: 'none', cursor: canRemove ? 'pointer' : 'not-allowed', padding: '0.2rem', opacity: 0, transition: 'opacity 0.15s', flexShrink: 0, display: 'flex', alignItems: 'center' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={canRemove ? '#ef4444' : '#4b5563'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      )}
    </div>
  );
};

// Monte Carlo simulation
const runMonteCarloSimulation = (portfolioAssets, yearsToProject, annualContribution, assumptions, annualWithdrawal, oneTimers, retirementCalYear, phaseOutSchedule) => {
  // Simulates survival of the liquid Investment portfolio only.
  // Real estate and other illiquid assets are excluded — SWR withdrawals come from
  // Investments alone, consistent with how the Required Nest Egg is defined.
  //
  // phaseOutSchedule: { retExpensePhaseOutYears, retirementBudget, yearsToRetirement }
  // When provided, withdrawal for each simulation year is recomputed from the budget
  // with phased-out categories zeroed — matching the user's actual plan.
  // The phase-out schedule is deterministic (not random) so it's computed once per year
  // outside the simulation loop for performance.
  const simulations = 1000;
  let successCount = 0;
  const safeOneTimers = oneTimers || [];
  const safeRetCalYear = retirementCalYear || 0;
  // Pre-compute per-year nominal withdrawals using per-category rates from phaseOutSchedule
  const yearlyWithdrawals = [];
  for (let year = 0; year < yearsToProject; year++) {
    const calYear = safeRetCalYear + year;
    let withdrawal;
    if (phaseOutSchedule) {
      const { retExpensePhaseOutYears: pos, retirementBudget: rb, yearsToRetirement: ytr, expenseCategories: cats, retExpenseGrowthRates: rgr, passiveIncomeSchedule: pis } = phaseOutSchedule;
      const grossWithdrawal = cats.reduce((s, cat) => {
        const po = pos[cat.key];
        if (po && calYear >= po) return s;
        const base = rb[cat.key] || 0;
        const rate = ((rgr && rgr[cat.key]) || 0) / 100;
        return s + base * Math.pow(1 + rate, ytr + year);
      }, 0);
      // Net passive + other income against withdrawal — resolve sub-items with endYear
      const passiveOffset = pis ? (() => {
        const calYear = safeRetCalYear + year;
        const pGrowth = pis.passiveGrowth || 0;
        const oGrowth = pis.otherGrowth || 0;
        const yearsFromNow = ytr + year;
        const passiveAmt = pis.passiveItems
          ? pis.passiveItems.reduce((sum, item) => {
              if (item.endYear && calYear >= item.endYear) return sum;
              return sum + (item.amount || 0) * Math.pow(1 + pGrowth, yearsFromNow);
            }, 0)
          : (pis.passive || 0) * Math.pow(1 + pGrowth, yearsFromNow);
        const otherAmt = pis.otherItems
          ? pis.otherItems.reduce((sum, item) => {
              if (item.endYear && calYear >= item.endYear) return sum;
              return sum + (item.amount || 0) * Math.pow(1 + oGrowth, yearsFromNow);
            }, 0)
          : (pis.other || 0) * Math.pow(1 + oGrowth, yearsFromNow);
        return passiveAmt + otherAmt;
      })() : 0;
      withdrawal = Math.max(0, grossWithdrawal - passiveOffset);
    } else {
      withdrawal = annualWithdrawal;
    }
    yearlyWithdrawals.push(withdrawal);
  }

  for (let sim = 0; sim < simulations; sim++) {
    let investments = portfolioAssets.investments;
    
    for (let year = 0; year < yearsToProject; year++) {
      // Box-Muller transform for normally distributed returns — more realistic tail risk than uniform
      const _u1 = Math.random() || 1e-10; // avoid log(0)
      const _u2 = Math.random();
      const _z = Math.sqrt(-2 * Math.log(_u1)) * Math.cos(2 * Math.PI * _u2);
      const investmentReturn = assumptions.investmentReturn + _z * assumptions.investmentStdDev;
      investments = investments * (1 + investmentReturn / 100);
      investments += annualContribution;
      // Apply pre-computed phase-out-aware withdrawal for this year
      investments -= yearlyWithdrawals[year];
      // Deduct any one-time expense scheduled for this calendar year
      const calYear = safeRetCalYear + year;
      const oneTimeHit = safeOneTimers.find(function(e) { return e.year === calYear; });
      if (oneTimeHit) investments -= oneTimeHit.amount;
      // Portfolio exhausted — no illiquid backstop
      if (investments <= 0) { investments = 0; break; }
    }
    
    if (investments > 0) successCount++;
  }
  
  return (successCount / simulations) * 100;
};

// Stable target year input
const TargetYearInput = ({ value, onChange, minYear, maxYear }) => {
  const [display, setDisplay] = React.useState(value.toString());
  const [isFocused, setIsFocused] = React.useState(false);
  React.useEffect(() => {
    if (!isFocused) setDisplay(value.toString());
  }, [value, isFocused]);
  const handleFocus = (e) => { setIsFocused(true); e.target.select(); };
  const handleBlur = () => {
    setIsFocused(false);
    const parsed = parseInt(display) || value;
    const clamped = Math.max(minYear, Math.min(maxYear, parsed));
    onChange(clamped);
    setDisplay(clamped.toString());
  };
  const handleChange = (e) => {
    if (/^\d{0,4}$/.test(e.target.value)) setDisplay(e.target.value);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
    if (e.key === 'ArrowUp') onChange(Math.min(maxYear, value + 1));
    if (e.key === 'ArrowDown') onChange(Math.max(minYear, value - 1));
  };
  return (
    <input
      type="text"
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      style={{
        width: '80px', padding: '0.5rem 0.6rem',
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(167,139,250,0.4)',
        borderRadius: '8px', color: '#e8e9ed',
        fontSize: '0.95rem', fontFamily: 'JetBrains Mono, monospace',
        textAlign: 'center'
      }}
    />
  );
};

// Shared rotated label for ReferenceLine — renders text along the vertical line, no clash with adjacent labels
// position='top': anchors text near top of line. position='middle': centers vertically.
const RotatedRefLabel = ({ viewBox, value, fill, offsetX, position }) => {
  const safeOffsetX = offsetX !== undefined ? offsetX : 0;
  const safePosition = position !== undefined ? position : 'top';
  const { x, y, height } = viewBox;
  const textX = x + 9 + safeOffsetX;
  const textY = safePosition === 'top' ? y + 55 : y + height / 2;
  return (
    <text
      x={textX} y={textY}
      fill={fill}
      fontSize={9}
      fontWeight={600}
      opacity={0.55}
      textAnchor="middle"
      dominantBaseline="middle"
      transform={`rotate(-90, ${textX}, ${textY})`}
      style={{ pointerEvents: 'none' }}
    >
      {value}
    </text>
  );
};

// Vertical label for ReferenceArea bands — renders rotated text near left edge of band
// All bands use identical offset from their left boundary for visual consistency
const makeBandLabel = (text, fill, bandIndex) => ({ viewBox }) => {
  if (!viewBox) return null;
  const { x, y, height } = viewBox;
  // Fixed offset from left boundary — same for every band regardless of index
  const textX = x + 9;
  const textY = y + Math.min(55, (height || 80) / 2);
  return (
    <text
      x={textX} y={textY}
      fill={fill}
      fontSize={9} fontWeight={600} opacity={0.8}
      textAnchor="middle" dominantBaseline="middle"
      transform={`rotate(-90, ${textX}, ${textY})`}
      style={{ pointerEvents: 'none' }}
    >
      {text}
    </text>
  );
};

const MC_STRONG_THRESHOLD   = 80;   // Monte Carlo success % = strong plan
const MC_CAUTION_THRESHOLD  = 60;   // Monte Carlo success % = caution zone
const GROWTH_RATE_MAX       = 20;   // CalcInput growth rate cap (%)
const SWR_MIN               = 0.1;  // Safe withdrawal rate minimum (%)
const SWR_MAX               = 6;    // Above 4% is historically risky; 6% is an outer bound for short-horizon cases
const clampSwr = (value, fallback = 4) => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(SWR_MAX, Math.max(SWR_MIN, n));
};
const WEALTH_MILESTONES_USD = [1000000, 5000000, 10000000, 25000000]; // Significant wealth milestones
const ASSET_TYPES = [
  { key: 'investments', name: 'Investments', color: '#60a5fa' },
  { key: 'realEstate',  name: 'Real Estate',  color: '#34d399' },
  { key: 'cash',        name: 'Cash',         color: '#f59e0b' },
  { key: 'other',       name: 'Other',        color: '#a78bfa' },
];
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_EXPENSE_CATEGORIES = [
  // preAmt: default pre-retirement annual amount (AED)
  // retAmt: default retirement annual amount (AED)
  // growthRate: default annual growth rate (%) — used for both pre-ret and retirement
  { key: 'housing',       label: 'Housing',        color: '#ef4444', group: 'essential', icon: '🏠', tooltip: 'Rent, mortgage, or housing costs',               preAmt: 280000, retAmt: 180000, growthRate: 3.0 },
  { key: 'bills',         label: 'Bills',          color: '#f97316', group: 'essential', icon: '💡', tooltip: 'Utilities, insurance, phone, internet, streaming', preAmt:  60000, retAmt:  48000, growthRate: 4.0 },
  { key: 'groceries',     label: 'Groceries',      color: '#eab308', group: 'essential', icon: '🛒', tooltip: 'Groceries and household supplies',                preAmt:  48000, retAmt:  54000, growthRate: 3.5 },
  { key: 'autoFixed',     label: 'Auto Fixed',     color: '#84cc16', group: 'essential', icon: '🚗', tooltip: 'Insurance, registration',                        preAmt:  36000, retAmt:  20000, growthRate: 2.0 },
  { key: 'autoVariable',  label: 'Auto Variable',  color: '#22c55e', group: 'essential', icon: '🚙', tooltip: 'Fuel, maintenance, parking',                     preAmt:  24000, retAmt:  12000, growthRate: 3.0 },
  { key: 'healthBasic',   label: 'Health Basic',   color: '#14b8a6', group: 'essential', icon: '🏥', tooltip: 'Health insurance, out-of-pocket medical',        preAmt:  24000, retAmt:  48000, growthRate: 5.0 },
  { key: 'school',        label: 'School',         color: '#fbbf24', group: 'essential', icon: '🎓', tooltip: 'Tuition, school fees, education costs',          preAmt:  80000, retAmt:      0, growthRate: 8.0 },
  { key: 'miscExpenses',  label: 'Misc',           color: '#f43f5e', group: 'essential', icon: '📋', tooltip: 'Admin, legal, incidentals',                      preAmt:  30000, retAmt:  24000, growthRate: 3.0 },
  { key: 'clothing',      label: 'Clothing',       color: '#8b5cf6', group: 'disc',      icon: '👕', tooltip: 'Clothing and apparel',                           preAmt:  12000, retAmt:   8000, growthRate: 3.0 },
  { key: 'maidService',   label: 'Maid',           color: '#a78bfa', group: 'disc',      icon: '🧹', tooltip: 'Household help and cleaning services',           preAmt:  36000, retAmt:  36000, growthRate: 4.0 },
  { key: 'personalCare',  label: 'Personal Care',  color: '#c084fc', group: 'disc',      icon: '💅', tooltip: 'Grooming, cosmetics, self-care',                 preAmt:   8000, retAmt:  10000, growthRate: 3.0 },
  { key: 'healthWellness',label: 'Wellness',       color: '#60a5fa', group: 'disc',      icon: '💪', tooltip: 'Gym, supplements, wellness',                     preAmt:  15000, retAmt:  30000, growthRate: 4.0 },
  { key: 'travel',        label: 'Travel',         color: '#38bdf8', group: 'disc',      icon: '✈️', tooltip: 'Holidays, flights, hotels',                     preAmt:  40000, retAmt:  60000, growthRate: 5.0 },
  { key: 'gifts',         label: 'Gifts',          color: '#34d399', group: 'disc',      icon: '🎁', tooltip: 'Birthday parties, gifts to family and friends',  preAmt:  10000, retAmt:  15000, growthRate: 3.0 },
  { key: 'entertainment', label: 'Entertainment',  color: '#fb923c', group: 'disc',      icon: '🎭', tooltip: 'Restaurants, cinema, subscriptions, leisure',    preAmt:  25000, retAmt:  20000, growthRate: 3.0 },
];

// Derive default expense state objects from DEFAULT_EXPENSE_CATEGORIES — single source of truth
const buildDefaultExpenseState = (cats) => {
  const expenseCalculator    = Object.fromEntries(cats.map(c => [c.key, c.preAmt    ?? 0]));
  const retirementBudget     = Object.fromEntries(cats.map(c => [c.key, c.retAmt    ?? 0]));
  const expenseGrowthRates   = Object.fromEntries(cats.map(c => [c.key, c.growthRate ?? 3]));
  const retExpenseGrowthRates= Object.fromEntries(cats.map(c => [c.key, c.growthRate ?? 3]));
  const expenseTags          = Object.fromEntries(cats.map(c => [c.key, c.group]));
  const expensePhaseOutYears = Object.fromEntries(cats.map(c => [c.key, null]));
  const retExpensePhaseOutYears = Object.fromEntries(cats.map(c => [c.key, null]));
  const currentTotal   = cats.reduce((s, c) => s + (c.preAmt ?? 0), 0);
  const retirementTotal= cats.reduce((s, c) => s + (c.retAmt ?? 0), 0);
  return { expenseCalculator, retirementBudget, expenseGrowthRates, retExpenseGrowthRates, expenseTags, expensePhaseOutYears, retExpensePhaseOutYears, currentTotal, retirementTotal };
};

// Extracted to module scope to prevent re-creation on every render
const MilestoneLegend = () => (
  <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
    {Object.entries(MILESTONE_COLORS).filter(([key]) => key !== 'retirement' && key !== 'expense').map(([key, { color, label }]) => (
      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, border: '2px solid white' }} />
        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{label}</span>
      </div>
    ))}
  </div>
);

// Extracted to module scope to prevent re-creation on every render
const ExchangeRateInput = ({ currency, exchangeRates, setExchangeRates, fxStatus }) => {
  const [displayValue, setDisplayValue] = useState(exchangeRates[currency].toFixed(2));
  const [isFocused, setIsFocused] = useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(exchangeRates[currency].toFixed(2));
    }
  }, [exchangeRates, currency, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(exchangeRates[currency].toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    const numValue = parseFloat(displayValue) || 1;
    setExchangeRates({...exchangeRates, [currency]: numValue});
    setDisplayValue(numValue.toFixed(2));
  };

  const handleChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
      setDisplayValue(val);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem' }}>
      <span style={{ color: '#9ca3af' }}>Rate:</span>
      <input
        type="text"
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        style={{
          width: '70px',
          padding: '0.25rem 0.5rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '4px',
          color: '#e8e9ed',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: '0.85rem',
        }}
      />
      <span style={{ color: '#9ca3af' }}>AED/{currency}</span>
      <span style={{
        fontSize: '0.6rem',
        fontWeight: '600',
        color: fxStatus === 'live' ? '#34d399' : '#6b7280',
      }}>
        {fxStatus === 'live' ? '●' : '○'}
      </span>
    </div>
  );
};

const SubItemAmountInput = ({ value, onChange, rate, width, style }) => {
  const _rate = rate || 1;
  const toDisplayStr = (aed) => {
    const d = toDisplay(aed, _rate);
    return d % 1 === 0
      ? d.toLocaleString()
      : d.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  const [displayVal, setDisplayVal] = React.useState(toDisplayStr(value));
  const [focused, setFocused] = React.useState(false);

  React.useEffect(() => {
    if (!focused) setDisplayVal(toDisplayStr(value));
  }, [value, focused, _rate]);

  return (
    <input
      type="text"
      value={displayVal}
      onFocus={() => {
        setFocused(true);
        setDisplayVal(displayVal.replace(/,/g, ''));
      }}
      onChange={(e) => {
        const v = e.target.value.replace(/,/g, '');
        if (v === '' || /^[\d.]*$/.test(v)) setDisplayVal(v);
      }}
      onBlur={() => {
        setFocused(false);
        const aed = fromDisplay(displayVal.replace(/,/g, ''), _rate);
        onChange(aed);
        setDisplayVal(toDisplayStr(aed));
      }}
      placeholder="Amount"
      style={{
        padding: '0.4rem 0.5rem',
        background: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '6px',
        color: '#e8e9ed',
        fontSize: '0.82rem',
        fontFamily: 'JetBrains Mono, monospace',
        width: width || '95px',
        ...(style || {})
      }}
    />
  );
};

const NumberInput = ({ label, value, onChange, prefix, suffix, step, tooltip, rate }) => {
  const _rate = rate || 1;
  const _prefix = prefix !== undefined ? prefix : '';
  const _suffix = suffix !== undefined ? suffix : '';
  const _step = step !== undefined ? step : 1000;
  const toDisplayStr = (aedVal) => {
    const d = toDisplay(aedVal, _rate);
    return d % 1 === 0 ? formatNumber(d) : d.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };
  const [displayValue, setDisplayValue] = useState(toDisplayStr(value));
  const [isFocused, setIsFocused] = useState(false);

  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(toDisplayStr(value));
    }
  }, [value, isFocused, _rate]);

  const handleFocus = () => {
    setIsFocused(true);
    setDisplayValue(toDisplay(value, _rate).toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    const aedValue = fromDisplay(displayValue.replace(/,/g, ''), _rate);
    onChange(aedValue);
    setDisplayValue(toDisplayStr(aedValue));
  };

  const handleChange = (e) => {
    const val = e.target.value.replace(/,/g, '');
    if (val === '' || /^-?\d*\.?\d*$/.test(val)) {
      setDisplayValue(val);
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
      <label style={{ display: 'flex', alignItems: 'center', fontSize: '0.9rem', color: '#9ca3af', marginBottom: '0.5rem', fontWeight: '500' }}>
        {label}
        {tooltip && <InfoTooltip text={tooltip} />}
      </label>
      <div style={{ position: 'relative' }}>
        {_prefix && <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', pointerEvents: 'none', zIndex: 1 }}>{_prefix}</span>}
        <input
          type="text"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={{
            width: '100%',
            padding: '0.75rem 1rem',
            paddingLeft: prefix ? '3.5rem' : '1rem',
            paddingRight: suffix ? '3rem' : '1rem',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            color: '#e8e9ed',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '1rem',
          }}
        />
        {_suffix && <span style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.9rem', pointerEvents: 'none', zIndex: 1 }}>{_suffix}</span>}
      </div>
    </div>
  );
};

const NetWorthNavigator = () => {
  // Default state values
  const _defs = buildDefaultExpenseState(DEFAULT_EXPENSE_CATEGORIES);
  const DEFAULT_STATE = {
    currency: 'AED',
    exchangeRates: { AED: 1, USD: 3.67, CAD: 2.72, EUR: 4.01, GBP: 4.87 },
    profile: { 
      currentAge: 35, 
      retirementAge: 55, 
      lifeExpectancy: 85,
      dependents: []
    },
    assets: { 
      cash: 50000, 
      investments: 300000, 
      realEstate: 800000, 
      other: 50000,
      // Sub-items for detailed tracking
      cashItems: [
        { id: 1, name: 'Emergency Fund', amount: 30000 },
        { id: 2, name: 'Checking Account', amount: 20000 }
      ],
      investmentItems: [
        { id: 1, name: 'Savings Account', amount: 100000 },
        { id: 2, name: 'Investment Portfolio', amount: 200000 }
      ],
      realEstateItems: [
        { id: 1, name: 'Primary Residence', amount: 600000 },
        { id: 2, name: 'Rental Property', amount: 200000 }
      ],
      otherItems: [
        { id: 1, name: 'Vehicle', amount: 50000 }
      ]
    },
    liabilities: { 
      mortgage: 600000, 
      loans: 20000, 
      other: 0,
      // Sub-items for detailed tracking
      mortgageItems: [
        { id: 1, name: 'Primary Home Mortgage', amount: 600000, endYear: new Date().getFullYear() + 25 }
      ],
      loanItems: [
        { id: 1, name: 'Car Loan', amount: 20000, endYear: new Date().getFullYear() + 5 }
      ],
      otherLiabilityItems: [{ id: 1, name: 'Other', amount: 0 }]
    },
    income: { 
      salary: 300000, 
      passive: 40000, // Renamed from rental
      other: 60000, // Includes bonuses now
      // Sub-items for detailed tracking
      salaryItems: [
        { id: 1, name: 'Base Salary', amount: 300000, endYear: null }
      ],
      passiveItems: [
        { id: 1, name: 'Rental Property', amount: 40000, endYear: null }
      ],
      otherIncomeItems: [
        { id: 1, name: 'Annual Bonus', amount: 50000, endYear: null },
        { id: 2, name: 'Freelance', amount: 10000, endYear: null }
      ]
    },
    expenseCalculator:       _defs.expenseCalculator,
    retirementBudget:        _defs.retirementBudget,
    expenseGrowthRates:      _defs.expenseGrowthRates,
    retExpenseGrowthRates:   _defs.retExpenseGrowthRates,
    expenseTags:             _defs.expenseTags,
    expensePhaseOutYears:    _defs.expensePhaseOutYears,
    retExpensePhaseOutYears: _defs.retExpensePhaseOutYears,
    expenses: { current: _defs.currentTotal, retirement: _defs.retirementTotal },
    lifeEvents: [],
    assumptions: {
      salaryGrowth: 4.0,
      passiveGrowth: 2.0,
      otherIncomeGrowth: 2.0,
      investmentReturn: 7.0,
      investmentStdDev: 12.0,
      realEstateAppreciation: 3.5,
      realEstateStdDev: 8.0,
      otherAssetGrowth: 2.0,
      otherAssetStdDev: 10.0,
      enableDrawdown: true,        // Phase 4A: retirement withdrawal simulation — on by default
    },
    oneTimeExpenses: (() => {
      const y = new Date().getFullYear();
      return [
        { id: 1, year: y + 1, description: 'New car',          amount:  80000, category: 'autoFixed', endYear: null },
        { id: 2, year: y + 4, description: 'Home renovation',   amount: 150000, category: 'housing',   endYear: null },
      ];
    })(),
  };

  const [currency, setCurrency] = useState(DEFAULT_STATE.currency);
  const [exchangeRates, setExchangeRates] = useState(DEFAULT_STATE.exchangeRates);
  const [fxStatus, setFxStatus] = useState('cached');
  const [activeTab, setActiveTab] = useState('profile');
  const [hiddenLines, setHiddenLines] = useState({});
  const [nestEggSwr, setNestEggSwr] = useState(4);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState({ surplusDeployment: true });
  
  const [profile, setProfile] = useState(DEFAULT_STATE.profile);
  const [assets, setAssets] = useState(DEFAULT_STATE.assets);
  const [liabilities, setLiabilities] = useState(DEFAULT_STATE.liabilities);
  const [income, setIncome] = useState(DEFAULT_STATE.income);
  const [expenses, setExpenses] = useState(DEFAULT_STATE.expenses);
  const [expenseCategories, setExpenseCategories] = useState(DEFAULT_EXPENSE_CATEGORIES);
  const [expenseCalculator, setExpenseCalculator] = useState(DEFAULT_STATE.expenseCalculator);
  const [retirementBudget, setRetirementBudget] = useState(DEFAULT_STATE.retirementBudget);
  const [expenseGrowthRates, setExpenseGrowthRates] = useState(DEFAULT_STATE.expenseGrowthRates);
  const [retExpenseGrowthRates, setRetExpenseGrowthRates] = useState(DEFAULT_STATE.retExpenseGrowthRates);
  const [expenseTags, setExpenseTags] = useState(DEFAULT_STATE.expenseTags);
  const [expensePhaseOutYears, setExpensePhaseOutYears] = useState(DEFAULT_STATE.expensePhaseOutYears);
  const [retExpensePhaseOutYears, setRetExpensePhaseOutYears] = useState(DEFAULT_STATE.retExpensePhaseOutYears);
  const [projectionTargetYear, setProjectionTargetYear] = useState(new Date().getFullYear() + 5);
  const [hiddenCalcLines, setHiddenCalcLines] = useState({});
  const [hiddenAssetLines, setHiddenAssetLines] = useState({});
  const [selectedChartCats, setSelectedChartCats] = useState([]);
  const [chartCatDropdownOpen, setChartCatDropdownOpen] = useState(false);
  const [assetDropdownOpen, setAssetDropdownOpen] = useState(false);
  const [sensitivityAdj, setSensitivityAdj] = useState([]);
  const [sensitivityCatPicker, setSensitivityCatPicker] = useState(DEFAULT_EXPENSE_CATEGORIES[0].key);
  const [lifeEvents, setLifeEvents] = useState(DEFAULT_STATE.lifeEvents);
  const [assumptions, setAssumptions] = useState(DEFAULT_STATE.assumptions);
  const [oneTimeExpenses, setOneTimeExpenses] = useState(DEFAULT_STATE.oneTimeExpenses);
  
  // Editable scenario assumptions (Phase 3B polish)
  const [lowDelta, setLowDelta] = useState(-2.5);
  const [highDelta, setHighDelta] = useState(3.5);
  const [editingScenario, setEditingScenario] = useState(null); // 'low' | 'high' | null
  const [breakdownPopupOpen, setBreakdownPopupOpen] = useState(false);
  const [retirementBudgetCollapsed, setRetirementBudgetCollapsed] = useState(true);
  const [preRetirementBudgetCollapsed, setPreRetirementBudgetCollapsed] = useState(false);
  const [sensitivityCollapsed, setSensitivityCollapsed] = useState(true);
  const [preRetCatCollapsed, setPreRetCatCollapsed] = useState(false);
  const [retCatCollapsed, setRetCatCollapsed] = useState(false);
  const [nestEggBreakdownOpen, setNestEggBreakdownOpen] = useState(false);
  const [editingCatLabel, setEditingCatLabel] = useState(null); // key of category being renamed, or null
  const [surplusSplitInvest, setSurplusSplitInvest] = useState(100);
  const [surplusSplitDebt, setSurplusSplitDebt] = useState(0);

  const [runwayHiddenLines, setRunwayHiddenLines] = useState({});
  const [runwayConservativeOffset, setRunwayConservativeOffset] = useState(-3);
  const [runwayOptimisticOffset, setRunwayOptimisticOffset] = useState(3);
  const [runwayPessSpend, setRunwayPessSpend] = useState(0);   // % spend increase for pessimistic
  const [runwayOptSpend, setRunwayOptSpend] = useState(25);    // % spend reduction for optimistic
  const [ribbonMenuOpen, setRibbonMenuOpen] = useState(false);
  const [assumptionsOpen, setAssumptionsOpen] = useState(false);
  const [expenseViewMode, setExpenseViewMode] = useState('annual'); // 'annual' | 'monthly'

  // Auto-save state to localStorage (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const dataToSave = {
          version: '2.0',
          currency,
          exchangeRates,
          profile,
          assets,
          liabilities,
          income,
          expenses,
          expenseCategories,
          expenseCalculator,
          retirementBudget,
          expenseGrowthRates,
          expenseTags,
          expensePhaseOutYears,
          retExpensePhaseOutYears,
          retExpenseGrowthRates,
          lifeEvents,
          assumptions,
          oneTimeExpenses,
          nestEggSwr,
          surplusSplitInvest,
          surplusSplitDebt,
        };
        localStorage.setItem('nwn_autosave', JSON.stringify(dataToSave));
      } catch (e) {
        // localStorage full or unavailable — silent fail
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [currency, exchangeRates, profile, assets, liabilities, income, expenses,
      expenseCategories, expenseCalculator, retirementBudget, expenseGrowthRates,
      expenseTags, expensePhaseOutYears, retExpensePhaseOutYears, retExpenseGrowthRates,
      lifeEvents, assumptions, oneTimeExpenses, nestEggSwr, surplusSplitInvest, surplusSplitDebt]);

  // Auto-restore from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('nwn_autosave');
      if (!saved) return;
      const data = JSON.parse(saved);
      if (!data || data.version !== '2.0') return;
      if (data.currency) setCurrency(data.currency);
      if (data.exchangeRates) setExchangeRates(data.exchangeRates);
      if (data.profile) setProfile(data.profile);
      if (data.assets) setAssets(data.assets);
      if (data.liabilities) setLiabilities(data.liabilities);
      if (data.income) setIncome(data.income);
      if (data.expenses) setExpenses(data.expenses);
      if (data.expenseCategories) setExpenseCategories(data.expenseCategories);
      if (data.expenseCalculator) setExpenseCalculator(data.expenseCalculator);
      if (data.retirementBudget) setRetirementBudget(data.retirementBudget);
      if (data.expenseGrowthRates) setExpenseGrowthRates(data.expenseGrowthRates);
      if (data.expenseTags) setExpenseTags(data.expenseTags);
      if (data.expensePhaseOutYears) setExpensePhaseOutYears(data.expensePhaseOutYears);
      if (data.retExpensePhaseOutYears) setRetExpensePhaseOutYears(data.retExpensePhaseOutYears);
      if (data.retExpenseGrowthRates) setRetExpenseGrowthRates(data.retExpenseGrowthRates);
      if (data.lifeEvents) setLifeEvents(data.lifeEvents);
      if (data.assumptions) setAssumptions(data.assumptions);
      if (data.oneTimeExpenses) setOneTimeExpenses(data.oneTimeExpenses);
      if (data.nestEggSwr !== undefined) setNestEggSwr(clampSwr(data.nestEggSwr));
      if (data.surplusSplitInvest !== undefined) setSurplusSplitInvest(data.surplusSplitInvest);
      if (data.surplusSplitDebt !== undefined) setSurplusSplitDebt(data.surplusSplitDebt);
    } catch (e) {
      // Corrupted or unavailable — start with defaults
    }
  }, []);

  // Fetch live FX rates
  const fetchFxRates = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      const response = await fetch('https://open.er-api.com/v6/latest/AED', { signal: controller.signal });
      clearTimeout(timeoutId);
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      if (data.rates) {
        const usd = data.rates.USD;
        const cad = data.rates.CAD;
        const eur = data.rates.EUR;
        const gbp = data.rates.GBP;
        if (!usd || !cad || !eur || !gbp) throw new Error('Missing or zero FX rate');
        setExchangeRates({
          AED: 1,
          USD: 1 / usd,
          CAD: 1 / cad,
          EUR: 1 / eur,
          GBP: 1 / gbp,
        });
        setFxStatus('live');
        return true;
      }
    } catch (err) {
      // FX fetch failed — cached/default rates will be used
    }
    return false;
  };

  // Fetch live FX rates on mount
  useEffect(() => {
    fetchFxRates();
  }, []);

  // Export data as JSON file
  const exportData = () => {
    const dataToExport = {
      version: '2.0',
      note: 'All monetary values stored in AED regardless of display currency.',
      lastUpdated: new Date().toISOString(),
      currency,
      exchangeRates,
      profile,
      assets,
      liabilities,
      income,
      expenses,
      expenseCategories,
      expenseCalculator,
      retirementBudget,
      expenseGrowthRates,
      expenseTags,
      expensePhaseOutYears,
      retExpensePhaseOutYears,
      retExpenseGrowthRates,
      lifeEvents,
      assumptions,
      oneTimeExpenses,
      nestEggSwr,
      surplusSplitInvest,
      surplusSplitDebt,
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `net-worth-navigator-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Export HTML report
  const exportHTMLReport = () => {
    const currentYear = new Date().getFullYear();
    const exportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const retirementCalYear = currentYear + (profile.retirementAge - profile.currentAge);
    const yearsToRet = profile.retirementAge - profile.currentAge;
    const yearsInRet = profile.lifeExpectancy - profile.retirementAge;

    // ── Core metrics ──
    const totalAssets = (assets.cash||0)+(assets.investments||0)+(assets.realEstate||0)+(assets.other||0);
    const totalLiabilities = (liabilities.mortgage||0)+(liabilities.loans||0)+(liabilities.other||0);
    const liquidAssets = (assets.cash||0)+(assets.investments||0);
    const illiquidAssets = (assets.realEstate||0)+(assets.other||0);
    const liquidPct = totalAssets>0 ? Math.round((liquidAssets/totalAssets)*100) : 0;
    const netWorth = totalAssets - totalLiabilities;
    const totalSalary = income.salaryItems ? income.salaryItems.reduce((s,i)=>s+(i.amount||0),0) : (income.salary||0);
    const totalPassive = income.passiveItems ? income.passiveItems.reduce((s,i)=>s+(i.amount||0),0) : (income.passive||0);
    const totalOther = income.otherIncomeItems ? income.otherIncomeItems.reduce((s,i)=>s+(i.amount||0),0) : (income.other||0);
    const totalAnnualIncome = totalSalary + totalPassive + totalOther;
    const totalPreRetExpenses = Object.values(expenseCalculator).reduce((s,v)=>s+(v||0),0);
    const totalRetExpenses = Object.values(retirementBudget).reduce((s,v)=>s+(v||0),0);
    const surplus = totalAnnualIncome - totalPreRetExpenses;
    const savingsRate = totalAnnualIncome>0 ? (surplus/totalAnnualIncome)*100 : 0;
    const debtRatio = totalAssets>0 ? (totalLiabilities/totalAssets)*100 : 0;
    const monthlyExpenses = totalPreRetExpenses/12;
    const emergencyMonths = monthlyExpenses>0 ? (assets.cash||0)/monthlyExpenses : 0;
    const nwMultiple = totalSalary>0 ? netWorth/totalSalary : null;
    const retirementWealth = retirementMetrics ? retirementMetrics.retirementWealth : 0;
    const successProb = retirementMetrics ? Math.round(retirementMetrics.successProbability) : 0;
    const retNominalExpense = getRetNominalForYear(currentYear + yearsToRet);
    const requiredNestEgg = nestEggSwr>0 ? retNominalExpense/(nestEggSwr/100) : 0;
    const fundingPct = requiredNestEgg>0 ? (retirementWealth/requiredNestEgg)*100 : 0;
    const irrPct = totalAnnualIncome>0 && totalRetExpenses>0 ? (totalRetExpenses/totalAnnualIncome)*100 : 0;
    const investmentMixPct = totalAssets>0 ? (assets.investments/totalAssets)*100 : 0;
    const exhaustionAge = wealthProjection.exhaustionAge || null;
    let nwTarget = null;
    let nwRatio = null;
    if (totalSalary > 0) {
      const age = profile.currentAge;
      if (age <= 30) {
        nwTarget = age / 30;
      } else if (age >= profile.retirementAge) {
        nwTarget = 10;
      } else {
        const brackets = [
          { age: 30, target: 1 },
          { age: 40, target: 3 },
          { age: 55, target: 7 },
          { age: profile.retirementAge, target: 10 },
        ];
        let lo = brackets[0];
        let hi = brackets[brackets.length - 1];
        for (let i = 0; i < brackets.length - 1; i++) {
          if (age >= brackets[i].age && age <= brackets[i + 1].age) {
            lo = brackets[i];
            hi = brackets[i + 1];
            break;
          }
        }
        const t = (age - lo.age) / (hi.age - lo.age);
        nwTarget = lo.target + t * (hi.target - lo.target);
      }
      nwRatio = nwTarget > 0 ? nwMultiple / nwTarget : null;
    }

    // ── Helpers ──
    const fmt = (v) => formatCurrency(v, currency, exchangeRates);
    const fmtPct = (v, dp=1) => v!=null ? v.toFixed(dp)+'%' : '—';
    const statusDot = (color) => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${color};margin-right:6px;flex-shrink:0;"></span>`;
    const scoreColor = (val, thresholds, colors) => {
      for(let i=0;i<thresholds.length;i++) if(val>=thresholds[i]) return colors[i];
      return colors[colors.length-1];
    };

    // ── Key-years projection table ──
    const keyYears = wealthProjection.filter(d => {
      const isRet = d.age === profile.retirementAge;
      const isFI = fiAge && d.age === fiAge;
      const isDebtFree = debtFreeAge && d.age === debtFreeAge;
      const isMilestone = wealthMilestones.some(m => m.age === d.age);
      const isLifeEvent = lifeEvents.some(e => e.year === d.year);
      const isOTE = oneTimeExpenses.some(e => d.year >= e.year && d.year <= (e.endYear||e.year));
      const every5 = (d.age - profile.currentAge) % 5 === 0;
      return every5 || isRet || isFI || isDebtFree || isMilestone || isLifeEvent || isOTE;
    });

    const projectionRows = keyYears.map(d => {
      const isRet = d.age === profile.retirementAge;
      const isFI = fiAge && d.age === fiAge;
      const isDebt = debtFreeAge && d.age === debtFreeAge;
      const milestone = wealthMilestones.find(m => m.age === d.age);
      const lifeEv = lifeEvents.find(e => e.year === d.year);
      const ote = oneTimeExpenses.filter(e => d.year >= e.year && d.year <= (e.endYear||e.year));
      const tags = [];
      if (isRet) tags.push('<span class="tag ret">Retirement</span>');
      if (isFI) tags.push('<span class="tag fi">FI Age</span>');
      if (isDebt) tags.push('<span class="tag debt">Debt Free</span>');
      if (milestone) tags.push(`<span class="tag ms">${escapeHtml(milestone.label)}</span>`);
      if (lifeEv) tags.push(`<span class="tag ev">${escapeHtml(lifeEv.description)}</span>`);
      ote.forEach(e => tags.push(`<span class="tag ote">${escapeHtml(e.description)}</span>`));
      const rowBg = isRet ? 'background:#f5f3ff;font-weight:600;' : '';
      const savings = (d.income||0)-(d.expenses||0);
      const savColor = savings>=0 ? '#16a34a' : '#dc2626';
      return `<tr style="${rowBg}">
        <td>${d.year}</td>
        <td style="text-align:center;">${d.age}</td>
        <td class="num">${fmt(d.netWorth)}</td>
        <td class="num">${fmt(d.investments)}</td>
        <td class="num">${fmt(d.totalAssets)}</td>
        <td class="num">${fmt(d.totalLiabilities)}</td>
        <td class="num">${fmt(d.income)}</td>
        <td class="num">${fmt(d.expenses)}</td>
        <td class="num" style="color:${savColor};">${savings>=0?'+':''}${fmt(savings)}</td>
        <td style="font-size:0.72rem;">${tags.join(' ')}</td>
      </tr>`;
    }).join('');

    // ── Pre-ret expense categories ──
    const essentialCats = expenseCategories.filter(c=>(expenseTags[c.key]||c.group)==='essential');
    const discCats = expenseCategories.filter(c=>(expenseTags[c.key]||c.group)==='disc');
    const preEssTotal = essentialCats.reduce((s,c)=>s+(expenseCalculator[c.key]||0),0);
    const preDiscTotal = discCats.reduce((s,c)=>s+(expenseCalculator[c.key]||0),0);
    const retEssTotal = essentialCats.reduce((s,c)=>s+(retirementBudget[c.key]||0),0);
    const retDiscTotal = discCats.reduce((s,c)=>s+(retirementBudget[c.key]||0),0);

    const expCatRows = expenseCategories.map(c => {
      const tag = (expenseTags[c.key]||c.group)==='essential' ? 'E' : 'D';
      const tagColor = tag==='E' ? '#dc2626' : '#2563eb';
      const preAmt = expenseCalculator[c.key]||0;
      const retAmt = retirementBudget[c.key]||0;
      const preGr = expenseGrowthRates[c.key]||0;
      const retGr = retExpenseGrowthRates[c.key]||0;
      const phaseOut = expensePhaseOutYears[c.key];
      const retPhaseOut = retExpensePhaseOutYears[c.key];
      const label = getCatLabel(c.key);
      return `<tr>
        <td><span style="display:inline-block;width:18px;height:18px;border-radius:3px;background:${c.color};margin-right:6px;vertical-align:middle;opacity:0.8;"></span>${escapeHtml(label)}</td>
        <td style="text-align:center;"><span style="font-size:0.68rem;font-weight:700;color:${tagColor};border:1px solid ${tagColor};border-radius:3px;padding:1px 4px;">${tag}</span></td>
        <td class="num">${fmt(preAmt)}</td>
        <td class="num dim">${preGr}%/yr${phaseOut?` · ends ${phaseOut}`:''}</td>
        <td class="num">${fmt(retAmt)}</td>
        <td class="num dim">${retGr}%/yr${retPhaseOut?` · ends ${retPhaseOut}`:''}</td>
      </tr>`;
    }).join('');

    // ── Income sub-items ──
    const salaryRows = (income.salaryItems||[]).map(i=>`<tr><td>${escapeHtml(i.name||'Salary')}</td><td class="num">${fmt(i.amount||0)}</td><td class="dim">+${assumptions.salaryGrowth}%/yr${i.endYear?` · ends ${i.endYear}`:''}</td></tr>`).join('');
    const passiveRows = (income.passiveItems||[]).map(i=>`<tr><td>${escapeHtml(i.name||'Passive')}</td><td class="num">${fmt(i.amount||0)}</td><td class="dim">+${assumptions.passiveGrowth||0}%/yr${i.endYear?` · ends ${i.endYear}`:''}</td></tr>`).join('');
    const otherRows = (income.otherIncomeItems||[]).map(i=>`<tr><td>${escapeHtml(i.name||'Other')}</td><td class="num">${fmt(i.amount||0)}</td><td class="dim">+${assumptions.otherIncomeGrowth||0}%/yr${i.endYear?` · ends ${i.endYear}`:''}</td></tr>`).join('');

    // ── Liability sub-items ──
    const mortgageRows = (liabilities.mortgageItems||[]).filter(i=>i.amount>0).map(i=>`<tr><td>${escapeHtml(i.name||'Mortgage')}</td><td class="num red">${fmt(i.amount||0)}</td><td class="dim">${i.endYear?`ends ${i.endYear}`:'no end year'}</td></tr>`).join('');
    const loanRows = (liabilities.loanItems||[]).filter(i=>i.amount>0).map(i=>`<tr><td>${escapeHtml(i.name||'Loan')}</td><td class="num red">${fmt(i.amount||0)}</td><td class="dim">${i.endYear?`ends ${i.endYear}`:'no end year'}</td></tr>`).join('');
    const otherLiabRows = (liabilities.otherLiabilityItems||[]).filter(i=>i.amount>0).map(i=>`<tr><td>${escapeHtml(i.name||'Other')}</td><td class="num red">${fmt(i.amount||0)}</td><td class="dim">${i.endYear?`ends ${i.endYear}`:'no end year'}</td></tr>`).join('');

    // ── OTE rows ──
    const oteRows = oneTimeExpenses.length>0 ? oneTimeExpenses.map(e=>`<tr>
      <td>${e.year}${e.endYear&&e.endYear>e.year?` – ${e.endYear}`:''}</td>
      <td>${escapeHtml(e.description||'—')}</td>
      <td class="num">${fmt(e.amount)}</td>
      <td class="dim">${e.category&&e.category!=='none'?escapeHtml(getCatLabel(e.category)):e.category==='none'?'Uncategorised':'Uncategorised'}</td>
    </tr>`).join('') : '<tr><td colspan="4" class="dim" style="text-align:center;">No planned expenses entered</td></tr>';

    // ── Life events ──
    const lifeEventRows = lifeEvents.length>0 ? lifeEvents.map(e=>`<tr><td>${e.year}</td><td>${e.age}</td><td>${escapeHtml(e.description)}</td><td class="dim">${escapeHtml(e.stage||'')}</td></tr>`).join('') : '<tr><td colspan="4" class="dim" style="text-align:center;">No life events entered</td></tr>';

    // ── Health metric helpers ──
    const srColor = savingsRate>=20?'#16a34a':savingsRate>=10?'#d97706':'#dc2626';
    const nwColor = nwRatio === null ? '#64748b' : nwRatio >= 1 ? '#16a34a' : nwRatio >= 0.75 ? '#d97706' : '#dc2626';
    const drColor = debtRatio<30?'#16a34a':debtRatio<50?'#d97706':'#dc2626';
    const efColor = emergencyMonths>=6?'#16a34a':emergencyMonths>=3?'#d97706':'#dc2626';
    const imColor = investmentMixPct>=40?'#16a34a':investmentMixPct>=20?'#d97706':'#dc2626';
    const rfColor = fundingPct>=100?'#16a34a':fundingPct>=85?'#16a34a':fundingPct>=50?'#d97706':'#dc2626';
    const mcColor = successProb>=80?'#16a34a':successProb>=60?'#d97706':'#dc2626';
    const irrColor = irrPct>=80&&irrPct<=120?'#16a34a':irrPct>120?'#d97706':irrPct>=70?'#d97706':'#dc2626';

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Financial Independence Report — ${exportDate}</title>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f8fafc;color:#1e293b;line-height:1.6;font-size:14px;}
  .page{max-width:1100px;margin:0 auto;padding:40px 24px;}
  /* Cover */
  .cover{background:linear-gradient(135deg,#1e3a5f 0%,#2d5a8e 50%,#1a2f4e 100%);color:white;padding:56px 48px;border-radius:16px;margin-bottom:32px;position:relative;overflow:hidden;}
  .cover::before{content:'';position:absolute;top:-60px;right:-60px;width:300px;height:300px;border-radius:50%;background:rgba(255,255,255,0.04);}
  .cover::after{content:'';position:absolute;bottom:-40px;left:-40px;width:200px;height:200px;border-radius:50%;background:rgba(255,255,255,0.03);}
  .cover-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;flex-wrap:wrap;gap:16px;}
  .cover-badge{font-size:0.7rem;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:rgba(255,255,255,0.5);margin-bottom:8px;}
  .cover h1{font-size:2.2rem;font-weight:800;color:white;line-height:1.2;margin-bottom:6px;}
  .cover-sub{font-size:1rem;color:rgba(255,255,255,0.65);}
  .cover-meta{text-align:right;font-size:0.82rem;color:rgba(255,255,255,0.55);line-height:2;}
  .cover-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:16px;margin-top:24px;padding-top:24px;border-top:1px solid rgba(255,255,255,0.12);}
  .cover-stat-label{font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;color:rgba(255,255,255,0.45);margin-bottom:4px;}
  .cover-stat-value{font-size:1.4rem;font-weight:700;color:white;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;}
  .cover-stat-sub{font-size:0.72rem;color:rgba(255,255,255,0.45);margin-top:2px;}
  /* Sections */
  .section{background:white;border:1px solid #e2e8f0;border-radius:12px;padding:28px 32px;margin-bottom:24px;page-break-inside:avoid;}
  .section-header{display:flex;align-items:center;gap:10px;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid #f1f5f9;}
  .section-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;}
  .section-title{font-size:1.15rem;font-weight:700;color:#1e293b;}
  .section-sub{font-size:0.8rem;color:#94a3b8;margin-top:1px;}
  /* KPI strip */
  .kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;margin-bottom:20px;}
  .kpi{padding:16px 18px;border-radius:10px;border:1px solid #e2e8f0;background:#f8fafc;}
  .kpi-label{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:#94a3b8;margin-bottom:6px;}
  .kpi-value{font-size:1.6rem;font-weight:800;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;line-height:1;color:#1e293b;}
  .kpi-sub{font-size:0.72rem;color:#94a3b8;margin-top:4px;}
  .kpi.green{border-color:#bbf7d0;background:#f0fdf4;} .kpi.green .kpi-value{color:#16a34a;}
  .kpi.amber{border-color:#fde68a;background:#fffbeb;} .kpi.amber .kpi-value{color:#d97706;}
  .kpi.red{border-color:#fecaca;background:#fef2f2;}   .kpi.red .kpi-value{color:#dc2626;}
  .kpi.purple{border-color:#ddd6fe;background:#faf5ff;} .kpi.purple .kpi-value{color:#7c3aed;}
  .kpi.blue{border-color:#bfdbfe;background:#eff6ff;}  .kpi.blue .kpi-value{color:#1d4ed8;}
  /* Health scorecard */
  .health-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;}
  .health-card{padding:14px 16px;border-radius:8px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:12px;}
  .health-card-icon{font-size:1.1rem;flex-shrink:0;}
  .health-card-body{}
  .health-card-label{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:2px;}
  .health-card-value{font-size:1.1rem;font-weight:800;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;}
  .health-card-bench{font-size:0.68rem;color:#94a3b8;margin-top:1px;}
  /* Two col */
  .two-col{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
  .three-col{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;}
  /* Tables */
  table.data{width:100%;border-collapse:collapse;font-size:0.84rem;}
  table.data th{background:#f1f5f9;padding:9px 12px;text-align:left;font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#64748b;border-bottom:1px solid #e2e8f0;}
  table.data th.r{text-align:right;}
  table.data td{padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#334155;}
  table.data tr:last-child td{border-bottom:none;}
  table.data tr:hover{background:#f8fafc;}
  .num{text-align:right;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:0.82rem;}
  .dim{color:#94a3b8;font-size:0.78rem;}
  .red{color:#dc2626;}
  .green-text{color:#16a34a;}
  /* Projection table */
  .proj-table{font-size:0.78rem;}
  .proj-table th{font-size:0.64rem;}
  .proj-table td{padding:6px 10px;}
  /* Tags */
  .tag{display:inline-block;padding:1px 6px;border-radius:4px;font-size:0.65rem;font-weight:700;margin-right:3px;}
  .tag.ret{background:#ede9fe;color:#6d28d9;}
  .tag.fi{background:#d1fae5;color:#065f46;}
  .tag.debt{background:#dbeafe;color:#1e40af;}
  .tag.ms{background:#fef3c7;color:#92400e;}
  .tag.ev{background:#f0f9ff;color:#0369a1;}
  .tag.ote{background:#fce7f3;color:#9d174d;}
  /* Milestone timeline */
  .timeline{position:relative;padding-left:24px;}
  .timeline::before{content:'';position:absolute;left:7px;top:4px;bottom:4px;width:2px;background:#e2e8f0;}
  .tl-item{position:relative;padding:0 0 18px 18px;}
  .tl-dot{position:absolute;left:-18px;top:4px;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 0 2px #e2e8f0;flex-shrink:0;}
  .tl-year{font-size:0.7rem;font-weight:700;color:#94a3b8;margin-bottom:2px;letter-spacing:0.05em;}
  .tl-label{font-size:0.88rem;font-weight:600;color:#1e293b;}
  .tl-sub{font-size:0.75rem;color:#64748b;margin-top:1px;}
  /* Verdict bullets */
  .verdict-cols{display:grid;grid-template-columns:1fr 1fr;gap:6px 24px;margin-top:10px;}
  .verdict-bullet{display:flex;align-items:flex-start;gap:7px;font-size:0.82rem;color:#475569;line-height:1.5;padding:3px 0;}
  .verdict-bullet-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:5px;}
  .verdict{padding:18px 22px;border-radius:10px;margin-bottom:20px;}
  .verdict.good{background:#f0fdf4;border:1px solid #bbf7d0;}
  .verdict.warn{background:#fffbeb;border:1px solid #fde68a;}
  .verdict.bad{background:#fef2f2;border:1px solid #fecaca;}
  .verdict-title{font-weight:700;font-size:0.95rem;margin-bottom:6px;display:flex;align-items:center;}
  .verdict p{font-size:0.85rem;color:#475569;line-height:1.7;margin-top:4px;}
  /* Chart containers */
  .chart-wrap{position:relative;height:280px;margin:16px 0;}
  .chart-wrap.tall{height:340px;}
  .chart-wrap.short{height:220px;}
  /* Assumptions grid */
  .assume-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;}
  .assume-item{padding:12px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;}
  .assume-label{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:4px;}
  .assume-value{font-size:1.05rem;font-weight:700;color:#1e293b;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;}
  /* Sub-section heading */
  .sub-head{font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin:20px 0 10px;padding-bottom:6px;border-bottom:1px solid #f1f5f9;}
  /* Footer */
  .footer{text-align:center;color:#94a3b8;font-size:0.78rem;margin-top:32px;padding-top:20px;border-top:1px solid #e2e8f0;}
  .footer strong{color:#64748b;}
  /* Notes to Financial Statements */
  .notes-page{background:white;margin-top:32px;padding:40px 48px;border-top:3px solid #1e293b;page-break-before:always;}
  .notes-title{font-size:1.05rem;font-weight:800;color:#1e293b;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;}
  .notes-subtitle{font-size:0.72rem;color:#94a3b8;margin-bottom:28px;padding-bottom:14px;border-bottom:1px solid #e2e8f0;}
  .note-block{margin-bottom:22px;}
  .note-heading{font-size:0.78rem;font-weight:800;color:#1e293b;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px;display:flex;align-items:baseline;gap:8px;}
  .note-num{font-size:0.68rem;font-weight:700;color:#94a3b8;min-width:18px;}
  .note-body{font-size:0.72rem;color:#475569;line-height:1.7;padding-left:26px;}
  .note-body p{margin:0 0 4px 0;}
  .note-body ul{margin:4px 0;padding-left:16px;}
  .note-body li{margin-bottom:3px;}
  .note-body strong{color:#1e293b;font-weight:700;}
  .note-rule{border:none;border-top:1px solid #f1f5f9;margin:0 0 22px 0;}
  @media print{
    body{background:white;}
    .section{page-break-inside:avoid;box-shadow:none;}
    .cover{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
    .notes-page{page-break-before:always;}
  }
</style>
</head>
<body>
<div class="page">

<!-- ═══════════════════════ COVER ═══════════════════════ -->
<div class="cover">
  <div class="cover-top">
    <div>
      <div class="cover-badge">Financial Independence Report</div>
      <h1>NetWorth Navigator</h1>
      <div class="cover-sub">Personal Financial Snapshot &amp; Retirement Projection</div>
    </div>
    <div class="cover-meta">
      Generated ${exportDate}<br>
      Currency: ${currency}<br>
      Age: ${profile.currentAge} → ${profile.retirementAge} → ${profile.lifeExpectancy}<br>
      Planning horizon: ${profile.lifeExpectancy - profile.currentAge} years
    </div>
  </div>
  <div class="cover-stats">
    <div>
      <div class="cover-stat-label">Net Worth</div>
      <div class="cover-stat-value">${fmt(netWorth)}</div>
      <div class="cover-stat-sub">Assets ${fmt(totalAssets)} · Liabilities ${fmt(totalLiabilities)}</div>
    </div>
    <div>
      <div class="cover-stat-label">Annual Income</div>
      <div class="cover-stat-value">${fmt(totalAnnualIncome)}</div>
      <div class="cover-stat-sub">Savings rate ${fmtPct(savingsRate)} · ${surplus>=0?'+'+fmt(surplus)+'/yr surplus':fmt(surplus)+'/yr deficit'}</div>
    </div>
    <div>
      <div class="cover-stat-label">Retirement Target</div>
      <div class="cover-stat-value">${retirementCalYear}</div>
      <div class="cover-stat-sub">Age ${profile.retirementAge} · ${yearsToRet} years away</div>
    </div>
    <div>
      <div class="cover-stat-label">Required Nest Egg</div>
      <div class="cover-stat-value">${fmt(requiredNestEgg)}</div>
      <div class="cover-stat-sub">${nestEggSwr}% SWR · ${Math.min(fundingPct,999).toFixed(0)}% funded</div>
    </div>
    <div>
      <div class="cover-stat-label">Monte Carlo</div>
      <div class="cover-stat-value">${successProb}%</div>
      <div class="cover-stat-sub">${successProb>=80?'Probability funds last through retirement':'⚠ Risk of running out — '+successProb+'% of scenarios succeed'}</div>
    </div>
    ${fiAge ? `<div>
      <div class="cover-stat-label">FI Age</div>
      <div class="cover-stat-value">${fiAge}</div>
      <div class="cover-stat-sub">${fiAge <= profile.retirementAge ? 'On track — investments reach nest egg by planned retirement' : `${fiAge - profile.retirementAge} year${fiAge-profile.retirementAge>1?'s':''} after planned retirement`}</div>
    </div>` : ''}
  </div>
</div>

<!-- ═══════════════════════ 1. EXECUTIVE SUMMARY ═══════════════════════ -->
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#eff6ff;">📋</div>
    <div><div class="section-title">Executive Summary</div><div class="section-sub">Overall financial health at a glance</div></div>
  </div>

  ${(() => {
    const items = [];
    if (savingsRate >= 20) items.push({type:'good', text:`Savings rate of ${fmtPct(savingsRate)} — ${fmt(surplus)}/yr surplus · on a wealth-building pace`});
    else if (savingsRate < 0) items.push({type:'bad', text:`Expenses exceed income by ${fmt(Math.abs(surplus))}/yr (${fmtPct(Math.abs(savingsRate))} overspend) — no savings being generated`});
    else if (savingsRate < 10) items.push({type:'bad', text:`Low savings rate of ${fmtPct(savingsRate)} — target 20%+ for meaningful wealth accumulation`});
    else items.push({type:'warn', text:`Savings rate of ${fmtPct(savingsRate)} — adequate but below the 20%+ wealth-building threshold`});
    if (successProb >= 80) items.push({type:'good', text:`Monte Carlo: ${successProb}% of simulations succeed — retirement plan is robust`});
    else if (successProb === 0) items.push({type:'bad', text:`Monte Carlo: 0 of 1,000 simulations succeed — portfolio is far too small to fund retirement as planned`});
    else items.push({type:'bad', text:`Monte Carlo: only ${successProb}% of simulations succeed — high risk of running out of money in retirement`});
    if (fundingPct >= 100) items.push({type:'good', text:`Retirement fully funded — projected ${fmt(retirementWealth)} exceeds ${fmt(requiredNestEgg)} nest egg target`});
    else if (fundingPct < 50) items.push({type:'bad', text:`Significant funding gap — projected investments are only ${Math.round(fundingPct)}% of the ${fmt(requiredNestEgg)} required nest egg`});
    else items.push({type:'warn', text:`Partially funded at ${Math.round(fundingPct)}% of the ${fmt(requiredNestEgg)} required nest egg — on a reasonable path`});
    if (debtRatio > 50) items.push({type:'bad', text:`High debt ratio of ${fmtPct(debtRatio)} — liabilities represent more than half of total assets${debtFreeAge?' · projected debt-free at age '+debtFreeAge:''}`});
    else if (debtRatio > 30) items.push({type:'warn', text:`Moderate debt ratio of ${fmtPct(debtRatio)}${debtFreeAge?' · projected debt-free at age '+debtFreeAge:''}`});
    else items.push({type:'good', text:`Healthy debt ratio of ${fmtPct(debtRatio)}${debtFreeAge?' · projected debt-free at age '+debtFreeAge:''}`});
    if (emergencyMonths < 3) items.push({type:'bad', text:`Emergency fund of ${emergencyMonths.toFixed(1)} months — below the 3-month minimum · top up cash reserves`});
    else if (emergencyMonths < 6) items.push({type:'warn', text:`Emergency fund of ${emergencyMonths.toFixed(1)} months — adequate but 6+ months is recommended`});
    else items.push({type:'good', text:`Emergency fund of ${emergencyMonths.toFixed(1)} months — well covered`});
    if (exhaustionAge) items.push({type:'bad', text:`Portfolio exhaustion at age ${exhaustionAge} — investments run out ${profile.lifeExpectancy-exhaustionAge} years before life expectancy`});
    else items.push({type:'good', text:'Investments projected to last through life expectancy under current drawdown plan'});
    if (fiAge && fiAge <= profile.retirementAge) items.push({type:'good', text:`FI Age ${fiAge} — portfolio reaches nest egg target by or before planned retirement`});
    else if (fiAge) items.push({type:'warn', text:`FI Age ${fiAge} is ${fiAge-profile.retirementAge} year${fiAge-profile.retirementAge>1?'s':''} after planned retirement — consider delaying retirement or growing investments`});
    else items.push({type:'bad', text:'FI Age not reached — investments never reach the required nest egg under current projections'});
    const allBad = items.every(i=>i.type==='bad');
    const anyBad = items.some(i=>i.type==='bad');
    const verdict = allBad||items.filter(i=>i.type==='bad').length>=3 ? 'bad' : anyBad||items.some(i=>i.type==='warn') ? 'warn' : 'good';
    const titleText = verdict==='good' ? 'Plan looks solid' : verdict==='warn' ? 'Plan is on track with areas to watch' : 'Plan has significant gaps requiring attention';
    const titleIcon = verdict==='good' ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#16a34a;color:white;font-size:11px;margin-right:8px;flex-shrink:0;">✓</span>' : verdict==='warn' ? '<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#d97706;color:white;font-size:11px;margin-right:8px;flex-shrink:0;">!</span>' : '<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#dc2626;color:white;font-size:10px;font-weight:900;margin-right:8px;flex-shrink:0;">✕</span>';
    const title = titleIcon + titleText;
    const dotColor = {good:'#16a34a', warn:'#d97706', bad:'#dc2626'};
    return `<div class="verdict ${verdict}">
      <div class="verdict-title">${title}</div>
      <div class="verdict-cols">
        ${items.map(i=>`<div class="verdict-bullet"><div class="verdict-bullet-dot" style="background:${dotColor[i.type]};"></div><span>${i.text}</span></div>`).join('')}
      </div>
    </div>`;
  })()}

  <div class="kpi-grid">
    <div class="kpi ${netWorth>0?'green':'red'}">
      <div class="kpi-label">Net Worth</div>
      <div class="kpi-value">${fmt(netWorth)}</div>
      <div class="kpi-sub">Assets ${fmt(totalAssets)}</div>
    </div>
    <div class="kpi ${savingsRate>=20?'green':savingsRate>=10?'amber':'red'}">
      <div class="kpi-label">Savings Rate</div>
      <div class="kpi-value">${fmtPct(savingsRate)}</div>
      <div class="kpi-sub">${fmt(surplus)}/yr · target 20%+</div>
    </div>
    <div class="kpi ${successProb>=80?'green':successProb>=60?'amber':'red'}">
      <div class="kpi-label">Monte Carlo</div>
      <div class="kpi-value">${successProb}%</div>
      <div class="kpi-sub">${successProb>=80?'Scenarios where funds last — target 80%+':successProb===0?'All scenarios fail — portfolio far too small':'Only '+successProb+'% of scenarios succeed · target 80%+'}</div>
    </div>
    <div class="kpi ${fundingPct>=100?'green':fundingPct>=50?'amber':'red'}">
      <div class="kpi-label">Nest Egg Funded</div>
      <div class="kpi-value">${Math.min(fundingPct,999).toFixed(0)}%</div>
      <div class="kpi-sub">Target ${fmt(requiredNestEgg)}</div>
    </div>
    <div class="kpi purple">
      <div class="kpi-label">FI Age</div>
      <div class="kpi-value">${fiAge || '—'}</div>
      <div class="kpi-sub">Planned retirement: ${profile.retirementAge}</div>
    </div>
    <div class="kpi blue">
      <div class="kpi-label">Retirement Wealth</div>
      <div class="kpi-value">${fmt(retirementWealth)}</div>
      <div class="kpi-sub">Investments at age ${profile.retirementAge}</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════ 2. FINANCIAL HEALTH SCORECARD ═══════════════════════ -->
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#f0fdf4;">🏥</div>
    <div><div class="section-title">Financial Health Scorecard</div><div class="section-sub">7 key metrics benchmarked against financial planning standards</div></div>
  </div>
  <div class="health-grid">
    <div class="health-card" style="border-color:${srColor}33;background:${srColor}08;">
      <div class="health-card-icon">💰</div>
      <div class="health-card-body">
        <div class="health-card-label">Savings Rate</div>
        <div class="health-card-value" style="color:${srColor};">${fmtPct(savingsRate)}</div>
        <div class="health-card-bench">${savingsRate>=20?'✓ Wealth-building pace':savingsRate>=10?'↑ Adequate — aim for 20%+':'⚠ At risk — below 10%'}</div>
      </div>
    </div>
    <div class="health-card" style="border-color:${drColor}33;background:${drColor}08;">
      <div class="health-card-icon">📉</div>
      <div class="health-card-body">
        <div class="health-card-label">Debt Ratio</div>
        <div class="health-card-value" style="color:${drColor};">${fmtPct(debtRatio)}</div>
        <div class="health-card-bench">${debtRatio<30?'✓ Healthy leverage':debtRatio<50?'↑ Moderate — watch trajectory':'⚠ High leverage'}${debtFreeAge?` · debt free at ${debtFreeAge}`:''}</div>
      </div>
    </div>
    <div class="health-card" style="border-color:${efColor}33;background:${efColor}08;">
      <div class="health-card-icon">🛡️</div>
      <div class="health-card-body">
        <div class="health-card-label">Emergency Fund</div>
        <div class="health-card-value" style="color:${efColor};">${emergencyMonths.toFixed(1)} mo</div>
        <div class="health-card-bench">${emergencyMonths>=6?'✓ 6+ months — well covered':emergencyMonths>=3?'↑ 3–6 months — adequate':'⚠ Under 3 months — top up'}</div>
      </div>
    </div>
    <div class="health-card" style="border-color:${imColor}33;background:${imColor}08;">
      <div class="health-card-icon">📊</div>
      <div class="health-card-body">
        <div class="health-card-label">Investment Mix</div>
        <div class="health-card-value" style="color:${imColor};">${fmtPct(investmentMixPct)}</div>
        <div class="health-card-bench">${investmentMixPct>=40?'✓ Well-positioned for growth':investmentMixPct>=20?'↑ Moderate liquid exposure':'⚠ Low — compounding limited'}</div>
      </div>
    </div>
    <div class="health-card" style="border-color:${rfColor}33;background:${rfColor}08;">
      <div class="health-card-icon">🎯</div>
      <div class="health-card-body">
        <div class="health-card-label">Retirement Funding</div>
        <div class="health-card-value" style="color:${rfColor};">${Math.min(fundingPct,999).toFixed(0)}%</div>
        <div class="health-card-bench">${fundingPct>=100?'✓ On track':fundingPct>=85?'↑ Approaching target':fundingPct>=50?'↑ On a reasonable path':'⚠ Significant gap'} of ${fmt(requiredNestEgg)}</div>
      </div>
    </div>
    <div class="health-card" style="border-color:${nwColor}33;background:${nwColor}08;">
      <div class="health-card-icon">📈</div>
      <div class="health-card-body">
        <div class="health-card-label">NW Multiple</div>
        <div class="health-card-value" style="color:${nwColor};">${nwMultiple!==null?`${nwMultiple.toFixed(1)}×`:'—'}</div>
        <div class="health-card-bench">${nwMultiple!==null?(nwRatio>=1?'✓ At or above target':nwRatio>=0.75?'↑ Close to target':'⚠ Behind target') + ` · target ${nwTarget.toFixed(1)}×`:'Requires non-zero salary'}</div>
      </div>
    </div>
    <div class="health-card" style="border-color:${irrColor}33;background:${irrColor}08;">
      <div class="health-card-icon">🔄</div>
      <div class="health-card-body">
        <div class="health-card-label">Income Replacement</div>
        <div class="health-card-value" style="color:${irrColor};">${Math.round(irrPct)}%</div>
        <div class="health-card-bench">${irrPct>120?'⚠ Retirement costs exceed current income — review budget':irrPct>=80?'✓ Replacement ratio in the strong range · target 80–120%':irrPct>=70?'↑ Caution — below the strong 80% threshold':'⚠ Lifestyle gap below 70%'}</div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════ 3. BALANCE SHEET ═══════════════════════ -->
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#faf5ff;">🏦</div>
    <div><div class="section-title">Balance Sheet</div><div class="section-sub">Assets, liabilities and net worth as of ${exportDate}</div></div>
  </div>
  <div class="two-col">
    <div>
      <div class="sub-head">Assets</div>
      <table class="data">
        <thead><tr><th>Asset</th><th class="r">Value</th><th class="r">% of Total</th><th>Growth Rate</th></tr></thead>
        <tbody>
          <tr><td>Investments</td><td class="num">${fmt(assets.investments)}</td><td class="num">${totalAssets>0?((assets.investments/totalAssets)*100).toFixed(1):0}%</td><td class="dim">+${assumptions.investmentReturn}%/yr</td></tr>
          <tr><td>Real Estate</td><td class="num">${fmt(assets.realEstate)}</td><td class="num">${totalAssets>0?((assets.realEstate/totalAssets)*100).toFixed(1):0}%</td><td class="dim">+${assumptions.realEstateAppreciation}%/yr</td></tr>
          <tr><td>Cash</td><td class="num">${fmt(assets.cash)}</td><td class="num">${totalAssets>0?((assets.cash/totalAssets)*100).toFixed(1):0}%</td><td class="dim">No growth</td></tr>
          <tr><td>Other Illiquid</td><td class="num">${fmt(assets.other)}</td><td class="num">${totalAssets>0?((assets.other/totalAssets)*100).toFixed(1):0}%</td><td class="dim">+${assumptions.otherAssetGrowth||0}%/yr</td></tr>
          <tr style="font-weight:700;background:#f8fafc;border-top:2px solid #e2e8f0;"><td>Total Assets</td><td class="num green-text">${fmt(totalAssets)}</td><td class="num">100%</td><td></td></tr>
          <tr><td class="dim">↳ Liquid (Cash + Investments)</td><td class="num dim">${fmt(liquidAssets)}</td><td class="num dim">${liquidPct}%</td><td></td></tr>
          <tr><td class="dim">↳ Illiquid (RE + Other)</td><td class="num dim">${fmt(illiquidAssets)}</td><td class="num dim">${100-liquidPct}%</td><td></td></tr>
        </tbody>
      </table>
    </div>
    <div>
      <div class="sub-head">Liabilities</div>
      <table class="data">
        <thead><tr><th>Liability</th><th class="r">Balance</th><th class="r">% of Total</th><th>End Year</th></tr></thead>
        <tbody>
          ${totalLiabilities>0 ? `
          ${(liabilities.mortgageItems||[]).filter(i=>i.amount>0).map(i=>`<tr><td>${i.name||'Mortgage'}</td><td class="num red">${fmt(i.amount)}</td><td class="num dim">${((i.amount/totalLiabilities)*100).toFixed(1)}%</td><td class="dim">${i.endYear||'—'}</td></tr>`).join('')}
          ${(liabilities.loanItems||[]).filter(i=>i.amount>0).map(i=>`<tr><td>${i.name||'Loan'}</td><td class="num red">${fmt(i.amount)}</td><td class="num dim">${((i.amount/totalLiabilities)*100).toFixed(1)}%</td><td class="dim">${i.endYear||'—'}</td></tr>`).join('')}
          ${(liabilities.otherLiabilityItems||[]).filter(i=>i.amount>0).map(i=>`<tr><td>${i.name||'Other'}</td><td class="num red">${fmt(i.amount)}</td><td class="num dim">${((i.amount/totalLiabilities)*100).toFixed(1)}%</td><td class="dim">${i.endYear||'—'}</td></tr>`).join('')}
          <tr style="font-weight:700;background:#f8fafc;border-top:2px solid #e2e8f0;"><td>Total Liabilities</td><td class="num red">${fmt(totalLiabilities)}</td><td class="num">100%</td><td></td></tr>
          ` : '<tr><td colspan="4" class="dim" style="text-align:center;padding:16px;">No liabilities entered — debt free</td></tr>'}
        </tbody>
      </table>
      <div style="margin-top:16px;padding:14px 16px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="font-size:0.82rem;font-weight:700;color:#1e293b;">Net Worth</span>
          <span style="font-size:0.95rem;font-weight:800;color:${netWorth>=0?'#16a34a':'#dc2626'};font-family:'SF Mono',monospace;">${fmt(netWorth)}</span>
        </div>
        <div style="font-size:0.72rem;color:#94a3b8;">Debt ratio: ${fmtPct(debtRatio)} · Liquid coverage: ${liquidPct}% of assets</div>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════════ 4. INCOME ═══════════════════════ -->
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#f0fdf4;">💼</div>
    <div><div class="section-title">Income Profile</div><div class="section-sub">Current annual income across all sources</div></div>
  </div>
  <div class="three-col">
    <div>
      <div class="sub-head">Salary</div>
      <table class="data">
        <thead><tr><th>Source</th><th class="r">Annual</th><th>Notes</th></tr></thead>
        <tbody>
          ${salaryRows||`<tr><td colspan="3" class="dim">No salary items</td></tr>`}
          <tr style="font-weight:700;background:#f8fafc;"><td>Total Salary</td><td class="num">${fmt(totalSalary)}</td><td></td></tr>
        </tbody>
      </table>
    </div>
    <div>
      <div class="sub-head">Passive Income</div>
      <table class="data">
        <thead><tr><th>Source</th><th class="r">Annual</th><th>Notes</th></tr></thead>
        <tbody>
          ${passiveRows||`<tr><td colspan="3" class="dim">No passive items</td></tr>`}
          <tr style="font-weight:700;background:#f8fafc;"><td>Total Passive</td><td class="num">${fmt(totalPassive)}</td><td></td></tr>
        </tbody>
      </table>
    </div>
    <div>
      <div class="sub-head">Other Income</div>
      <table class="data">
        <thead><tr><th>Source</th><th class="r">Annual</th><th>Notes</th></tr></thead>
        <tbody>
          ${otherRows||`<tr><td colspan="3" class="dim">No other items</td></tr>`}
          <tr style="font-weight:700;background:#f8fafc;"><td>Total Other</td><td class="num">${fmt(totalOther)}</td><td></td></tr>
        </tbody>
      </table>
    </div>
  </div>
  <div style="margin-top:14px;padding:12px 16px;background:${surplus>=0?'#f0fdf4':'#fef2f2'};border-radius:8px;border:1px solid ${surplus>=0?'#bbf7d0':'#fecaca'};display:flex;gap:32px;flex-wrap:wrap;">
    <div><span style="font-size:0.68rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Total Annual Income</span><br><strong style="font-size:1.1rem;color:#16a34a;font-family:'SF Mono',monospace;">${fmt(totalAnnualIncome)}</strong></div>
    <div><span style="font-size:0.68rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Annual Surplus</span><br><strong style="font-size:1.1rem;color:${surplus>=0?'#16a34a':'#dc2626'};font-family:'SF Mono',monospace;">${surplus>=0?'+':''}${fmt(surplus)}</strong></div>
    <div><span style="font-size:0.68rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Savings Rate</span><br><strong style="font-size:1.1rem;color:${srColor};font-family:'SF Mono',monospace;">${fmtPct(savingsRate)}</strong></div>
    <div><span style="font-size:0.68rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;">Monthly Take-Home</span><br><strong style="font-size:1.1rem;color:#1d4ed8;font-family:'SF Mono',monospace;">${fmt(totalAnnualIncome/12)}</strong></div>
  </div>
  <p style="font-size:0.72rem;color:#94a3b8;margin-top:10px;">Note: salary stops at retirement. Passive and other income continue through retirement and are netted against drawdown requirements.</p>
</div>

<!-- ═══════════════════════ 5. EXPENSE BUDGETS ═══════════════════════ -->
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#fef2f2;">💸</div>
    <div><div class="section-title">Expense Budgets</div><div class="section-sub">Pre-retirement and retirement spending by category (today's terms)</div></div>
  </div>
  <table class="data">
    <thead>
      <tr>
        <th>Category</th>
        <th style="text-align:center;">Type</th>
        <th class="r">Pre-Retirement</th>
        <th class="r">Growth / Phase-out</th>
        <th class="r">Retirement</th>
        <th class="r">Growth / Phase-out</th>
      </tr>
    </thead>
    <tbody>
      <tr style="background:#fef2f2;"><td colspan="6" style="font-size:0.7rem;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.06em;padding:6px 12px;">Essential</td></tr>
      ${essentialCats.map(c=>{
        const preAmt=expenseCalculator[c.key]||0;const retAmt=retirementBudget[c.key]||0;
        const preGr=expenseGrowthRates[c.key]||0;const retGr=retExpenseGrowthRates[c.key]||0;
        const phaseOut=expensePhaseOutYears[c.key];const retPhaseOut=retExpensePhaseOutYears[c.key];
        return `<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${c.color};margin-right:6px;vertical-align:middle;"></span>${getCatLabel(c.key)}</td><td style="text-align:center;"><span style="font-size:0.65rem;font-weight:700;color:#dc2626;border:1px solid #dc2626;border-radius:3px;padding:1px 4px;">E</span></td><td class="num">${fmt(preAmt)}</td><td class="num dim">${preGr}%/yr${phaseOut?` · ends ${phaseOut}`:''}</td><td class="num">${fmt(retAmt)}</td><td class="num dim">${retGr}%/yr${retPhaseOut?` · ends ${retPhaseOut}`:''}</td></tr>`;
      }).join('')}
      <tr style="font-weight:700;background:#fef2f2;border-top:1px solid #fecaca;"><td style="padding-left:24px;">Essential Subtotal</td><td></td><td class="num">${fmt(preEssTotal)}</td><td></td><td class="num">${fmt(retEssTotal)}</td><td></td></tr>
      <tr style="background:#eff6ff;"><td colspan="6" style="font-size:0.7rem;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:0.06em;padding:6px 12px;">Discretionary</td></tr>
      ${discCats.map(c=>{
        const preAmt=expenseCalculator[c.key]||0;const retAmt=retirementBudget[c.key]||0;
        const preGr=expenseGrowthRates[c.key]||0;const retGr=retExpenseGrowthRates[c.key]||0;
        const phaseOut=expensePhaseOutYears[c.key];const retPhaseOut=retExpensePhaseOutYears[c.key];
        return `<tr><td><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${c.color};margin-right:6px;vertical-align:middle;"></span>${getCatLabel(c.key)}</td><td style="text-align:center;"><span style="font-size:0.65rem;font-weight:700;color:#1d4ed8;border:1px solid #1d4ed8;border-radius:3px;padding:1px 4px;">D</span></td><td class="num">${fmt(preAmt)}</td><td class="num dim">${preGr}%/yr${phaseOut?` · ends ${phaseOut}`:''}</td><td class="num">${fmt(retAmt)}</td><td class="num dim">${retGr}%/yr${retPhaseOut?` · ends ${retPhaseOut}`:''}</td></tr>`;
      }).join('')}
      <tr style="font-weight:700;background:#eff6ff;border-top:1px solid #bfdbfe;"><td style="padding-left:24px;">Discretionary Subtotal</td><td></td><td class="num">${fmt(preDiscTotal)}</td><td></td><td class="num">${fmt(retDiscTotal)}</td><td></td></tr>
      <tr style="font-weight:800;background:#f1f5f9;border-top:2px solid #cbd5e1;"><td>Grand Total</td><td></td><td class="num" style="color:#1e293b;">${fmt(totalPreRetExpenses)}</td><td class="dim">Pre-retirement annual</td><td class="num" style="color:#1e293b;">${fmt(totalRetExpenses)}</td><td class="dim">Retirement annual (today's terms)</td></tr>
    </tbody>
  </table>
  <p style="font-size:0.72rem;color:#94a3b8;margin-top:10px;">All amounts in today's terms. Each category grows at its own rate (shown above) both pre- and post-retirement. Phase-out years zero a category from the specified year onwards.</p>
</div>

<!-- ═══════════════════════ 6. RETIREMENT PLAN ═══════════════════════ -->
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#faf5ff;">🏖️</div>
    <div><div class="section-title">Retirement Plan</div><div class="section-sub">Nest egg, drawdown, and longevity analysis</div></div>
  </div>
  <div class="kpi-grid">
    <div class="kpi blue">
      <div class="kpi-label">Retirement Year</div>
      <div class="kpi-value">${retirementCalYear}</div>
      <div class="kpi-sub">Age ${profile.retirementAge} · ${yearsToRet} years away</div>
    </div>
    <div class="kpi blue">
      <div class="kpi-label">Years in Retirement</div>
      <div class="kpi-value">${yearsInRet}</div>
      <div class="kpi-sub">Age ${profile.retirementAge} → ${profile.lifeExpectancy}</div>
    </div>
    <div class="kpi ${retirementWealth>=requiredNestEgg?'green':fundingPct>=50?'amber':'red'}">
      <div class="kpi-label">Projected Investments at Retirement</div>
      <div class="kpi-value">${fmt(retirementWealth)}</div>
      <div class="kpi-sub">Liquid investments only</div>
    </div>
    <div class="kpi purple">
      <div class="kpi-label">Required Nest Egg</div>
      <div class="kpi-value">${fmt(requiredNestEgg)}</div>
      <div class="kpi-sub">${nestEggSwr}% SWR · retirement-day expenses</div>
    </div>
    <div class="kpi ${successProb>=80?'green':successProb>=60?'amber':'red'}">
      <div class="kpi-label">Monte Carlo Success</div>
      <div class="kpi-value">${successProb}%</div>
      <div class="kpi-sub">1,000 simulations · ${assumptions.investmentStdDev}% volatility</div>
    </div>
    <div class="kpi ${irrPct>=80&&irrPct<=120?'green':irrPct>120?'amber':'red'}">
      <div class="kpi-label">Income Replacement</div>
      <div class="kpi-value">${Math.round(irrPct)}%</div>
      <div class="kpi-sub">${irrPct>120?'Retirement budget exceeds current income — review retirement spending':irrPct>=80?'Retirement budget ÷ current income · target 80–120%':irrPct>=70?'Retirement budget ÷ current income · below the strong 80% threshold':'Retirement budget ÷ current income · below 70% target'}</div>
    </div>
  </div>
  <div class="sub-head">Drawdown Structure</div>
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:16px;">
    <div style="padding:12px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <div style="font-size:0.68rem;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Annual Budget (today's terms)</div>
      <div style="font-size:1rem;font-weight:700;color:#1e293b;font-family:'SF Mono',monospace;">${fmt(totalRetExpenses)}</div>
    </div>
    <div style="padding:12px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <div style="font-size:0.68rem;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Annual Budget (retirement-day, nominal)</div>
      <div style="font-size:1rem;font-weight:700;color:#1e293b;font-family:'SF Mono',monospace;">${fmt(retNominalExpense)}</div>
    </div>
    <div style="padding:12px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <div style="font-size:0.68rem;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Continuing Passive Income</div>
      <div style="font-size:1rem;font-weight:700;color:#16a34a;font-family:'SF Mono',monospace;">${fmt(totalPassive * Math.pow(1 + (assumptions.passiveGrowth||2)/100, yearsToRet))}</div>
      <div style="font-size:0.7rem;color:#94a3b8;margin-top:2px;">Nominal at retirement · today's: ${fmt(totalPassive)}</div>
    </div>
    <div style="padding:12px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <div style="font-size:0.68rem;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Expense Growth (post-retirement)</div>
      <div style="font-size:1rem;font-weight:700;color:#1e293b;font-family:'SF Mono',monospace;">Per-category rates</div>
      <div style="font-size:0.7rem;color:#94a3b8;margin-top:2px;">See Expense Budgets section</div>
    </div>
    <div style="padding:12px 14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;">
      <div style="font-size:0.68rem;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Safe Withdrawal Rate</div>
      <div style="font-size:1rem;font-weight:700;color:#1e293b;font-family:'SF Mono',monospace;">${nestEggSwr}%</div>
    </div>
    <div style="padding:12px 14px;background:${exhaustionAge?'#fef2f2':'#f0fdf4'};border-radius:8px;border:1px solid ${exhaustionAge?'#fecaca':'#bbf7d0'};">
      <div style="font-size:0.68rem;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;">Portfolio Exhaustion</div>
      <div style="font-size:1rem;font-weight:700;color:${exhaustionAge?'#dc2626':'#16a34a'};font-family:'SF Mono',monospace;">${exhaustionAge?`Age ${exhaustionAge}`:'None projected'}</div>
      <div style="font-size:0.7rem;color:#94a3b8;margin-top:2px;">${exhaustionAge?`Investments run out ${profile.lifeExpectancy-exhaustionAge} years before life expectancy`:'Investments last through life expectancy'}</div>
    </div>
  </div>
</div>

<!-- ═══════════════════════ 7. MILESTONES & EVENTS ═══════════════════════ -->
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#fffbeb;">🎯</div>
    <div><div class="section-title">Milestones &amp; Timeline</div><div class="section-sub">Key financial events across your planning horizon</div></div>
  </div>
  <div class="two-col">
    <div>
      <div class="sub-head">Financial Milestones</div>
      <div class="timeline">
        ${[
          fiAge ? {age: fiAge, html: `<div class="tl-dot" style="background:#16a34a;box-shadow:0 0 0 2px #bbf7d0;"></div><div class="tl-year">${currentYear+(fiAge-profile.currentAge)} · Age ${fiAge}</div><div class="tl-label">FI Age — Investments reach nest egg</div><div class="tl-sub">Portfolio hits ${fmt(requiredNestEgg)} required nest egg</div>`} : null,
          {age: profile.retirementAge, html: `<div class="tl-dot" style="background:#7c3aed;box-shadow:0 0 0 2px #ddd6fe;"></div><div class="tl-year">${retirementCalYear} · Age ${profile.retirementAge}</div><div class="tl-label">Planned Retirement</div><div class="tl-sub">Portfolio: ${fmt(retirementWealth)} · ${yearsInRet} year retirement horizon</div>`},
          exhaustionAge ? {age: exhaustionAge, html: `<div class="tl-dot" style="background:#dc2626;box-shadow:0 0 0 2px #fecaca;"></div><div class="tl-year">${currentYear+(exhaustionAge-profile.currentAge)} · Age ${exhaustionAge}</div><div class="tl-label">⚠ Portfolio Exhaustion</div><div class="tl-sub">Investments depleted — review drawdown strategy</div>`} : null,
          debtFreeAge ? {age: debtFreeAge, html: `<div class="tl-dot" style="background:#2563eb;box-shadow:0 0 0 2px #bfdbfe;"></div><div class="tl-year">${currentYear+(debtFreeAge-profile.currentAge)} · Age ${debtFreeAge}</div><div class="tl-label">Debt Free</div><div class="tl-sub">All liabilities fully amortised</div>`} : null,
          ...wealthMilestones.map(m=>({age: m.age, html: `<div class="tl-dot" style="background:#d97706;box-shadow:0 0 0 2px #fde68a;"></div><div class="tl-year">${m.year} · Age ${m.age}</div><div class="tl-label">${m.label} USD milestone</div><div class="tl-sub">${fmt(m.thresholdAED)}</div>`}))
        ].filter(Boolean).sort((a,b)=>a.age-b.age).map(item=>`<div class="tl-item">${item.html}</div>`).join('')}
      </div>
    </div>
    <div>
      <div class="sub-head">Life Events</div>
      ${lifeEvents.length>0?`<table class="data"><thead><tr><th>Year</th><th>Age</th><th>Event</th><th>Stage</th></tr></thead><tbody>${lifeEventRows}</tbody></table>`:'<p class="dim" style="padding:12px 0;">No life events entered</p>'}
      <div class="sub-head" style="margin-top:20px;">Planned One-Time Expenses</div>
      <table class="data"><thead><tr><th>Year(s)</th><th>Description</th><th class="r">Amount</th><th>Category</th></tr></thead><tbody>${oteRows}</tbody></table>
      ${oneTimeExpenses.length>0?`<div style="margin-top:8px;font-size:0.78rem;color:#64748b;">Total: <strong>${fmt(oneTimeExpenses.reduce((s,e)=>s+(e.amount||0),0))}</strong></div>`:''}
    </div>
  </div>
</div>

<!-- ═══════════════════════ 8. PROJECTIONS CHART ═══════════════════════ -->
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#eff6ff;">📈</div>
    <div><div class="section-title">Wealth Projections</div><div class="section-sub">Net worth, investment portfolio, and cashflow over time</div></div>
  </div>
  <div style="font-size:0.78rem;color:#94a3b8;margin-bottom:12px;">Vertical dashed line = planned retirement age ${profile.retirementAge}${exhaustionAge?` · red dashed = portfolio exhaustion at age ${exhaustionAge}`:''}</div>
  <div class="chart-wrap tall"><canvas id="nwChart"></canvas></div>
  <div class="two-col" style="margin-top:16px;">
    <div><div class="chart-wrap short"><canvas id="cfChart"></canvas></div></div>
    <div><div class="chart-wrap short"><canvas id="allocChart"></canvas></div></div>
  </div>
</div>

<!-- ═══════════════════════ 9. KEY-YEAR PROJECTION TABLE ═══════════════════════ -->
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#f0fdf4;">📊</div>
    <div><div class="section-title">Projection Table</div><div class="section-sub">Every 5 years + all milestone years · highlighted row = planned retirement</div></div>
  </div>
  <table class="data proj-table">
    <thead>
      <tr>
        <th>Year</th>
        <th style="text-align:center;">Age</th>
        <th class="r">Net Worth</th>
        <th class="r">Investments</th>
        <th class="r">Total Assets</th>
        <th class="r">Liabilities</th>
        <th class="r">Income</th>
        <th class="r">Expenses</th>
        <th class="r">Cashflow</th>
        <th>Events</th>
      </tr>
    </thead>
    <tbody>${projectionRows}</tbody>
  </table>
  <p style="font-size:0.72rem;color:#94a3b8;margin-top:10px;">Cashflow = income − expenses pre-retirement; passive income − expenses post-retirement. Net worth continues growing after investment exhaustion because real estate and other illiquid assets keep appreciating — those assets are not drawn down in this model.</p>

<!-- ═══════════════════════ 10. PLANNING ASSUMPTIONS ═══════════════════════ -->
<div class="section">
  <div class="section-header">
    <div class="section-icon" style="background:#f8fafc;">⚙️</div>
    <div><div class="section-title">Planning Assumptions</div><div class="section-sub">All rates and parameters driving this projection</div></div>
  </div>
  <div class="two-col">
    <div>
      <div class="sub-head">Growth Rates</div>
      <div class="assume-grid">
        <div class="assume-item"><div class="assume-label">Investment Return</div><div class="assume-value">${assumptions.investmentReturn}%/yr</div></div>
        <div class="assume-item"><div class="assume-label">Investment Volatility</div><div class="assume-value">±${assumptions.investmentStdDev}%</div></div>
        <div class="assume-item"><div class="assume-label">Real Estate Appreciation</div><div class="assume-value">${assumptions.realEstateAppreciation}%/yr</div></div>
        <div class="assume-item"><div class="assume-label">Salary Growth</div><div class="assume-value">${assumptions.salaryGrowth}%/yr</div></div>
        <div class="assume-item"><div class="assume-label">Passive Income Growth</div><div class="assume-value">${assumptions.passiveGrowth||0}%/yr</div></div>
        <div class="assume-item"><div class="assume-label">Other Income Growth</div><div class="assume-value">${assumptions.otherIncomeGrowth||0}%/yr</div></div>
        <div class="assume-item"><div class="assume-label">Other Asset Growth</div><div class="assume-value">${assumptions.otherAssetGrowth||0}%/yr</div></div>
      </div>
    </div>
    <div>
      <div class="sub-head">Planning Parameters</div>
      <div class="assume-grid">
        <div class="assume-item"><div class="assume-label">Current Age</div><div class="assume-value">${profile.currentAge}</div></div>
        <div class="assume-item"><div class="assume-label">Retirement Age</div><div class="assume-value">${profile.retirementAge}</div></div>
        <div class="assume-item"><div class="assume-label">Life Expectancy</div><div class="assume-value">${profile.lifeExpectancy}</div></div>
        <div class="assume-item"><div class="assume-label">Planning Horizon</div><div class="assume-value">${profile.lifeExpectancy-profile.currentAge} yrs</div></div>
        <div class="assume-item"><div class="assume-label">Safe Withdrawal Rate</div><div class="assume-value">${nestEggSwr}%</div></div>
        <div class="assume-item"><div class="assume-label">Drawdown Mode</div><div class="assume-value">${assumptions.enableDrawdown?'On':'Off'}</div></div>
        <div class="assume-item"><div class="assume-label">Currency</div><div class="assume-value">${currency}</div></div>
        ${currency!=='AED'?`<div class="assume-item"><div class="assume-label">Exchange Rate</div><div class="assume-value">1 ${currency} = ${(exchangeRates[currency]||1).toFixed(4)} AED</div></div>`:''}
      </div>
      ${profile.dependents&&profile.dependents.length>0?`<div class="sub-head" style="margin-top:16px;">Dependents</div><p style="font-size:0.82rem;color:#64748b;">${profile.dependents.map(d=>d.name||'Dependent').join(', ')}</p>`:''}
    </div>
  </div>
</div>

<!-- ═══════════════════════ NOTES TO FINANCIAL STATEMENTS ═══════════════════════ -->
<div class="notes-page">
  <div class="notes-title">Notes to the Financial Projections</div>
  <div class="notes-subtitle">NetWorth Navigator · Personal Financial Report · For informational purposes only · Not a substitute for professional financial advice</div>

  <div class="note-block">
    <div class="note-heading"><span class="note-num">1.</span> Basis of Preparation</div>
    <div class="note-body">
      <p>This report was generated by NetWorth Navigator, a personal financial planning tool. All projections are prepared on a <strong>going-concern basis</strong> using deterministic compounding for base-case scenarios and Monte Carlo simulation for retirement survival probability. All monetary values are stored internally in UAE Dirhams (AED) and converted to the display currency at the exchange rate prevailing at the time of export. Figures are rounded to the nearest whole unit of display currency.</p>
      <p>The report date is <strong>${exportDate}</strong>. All projections are forward-looking and subject to the assumptions described in Note 3.</p>
    </div>
  </div>
  <hr class="note-rule"/>

  <div class="note-block">
    <div class="note-heading"><span class="note-num">2.</span> Scope and Limitations</div>
    <div class="note-body">
      <p>This report does not constitute financial, legal, tax, or investment advice. Projections are illustrative only and should not be relied upon as a guarantee of future outcomes. The following material limitations apply:</p>
      <ul>
        <li><strong>No tax modelling.</strong> Income, capital gains, inheritance, and withholding taxes are not modelled. Users should enter after-tax income figures and consult a tax adviser for jurisdiction-specific obligations.</li>
        <li><strong>No currency risk.</strong> Exchange rates are held static at the export-date snapshot. Multi-currency portfolios may be materially affected by rate fluctuations not reflected here.</li>
        <li><strong>No sequence-of-returns risk beyond Monte Carlo.</strong> The base-case projection applies a constant annual return. The Monte Carlo simulation (Note 6) partially addresses sequence risk but assumes independent, identically distributed (IID) normally distributed returns — each year's return is drawn independently with no modelling of return correlation, momentum, or autocorrelation. This may understate tail risk in severe market dislocations.</li>
        <li><strong>Illiquid assets excluded from retirement drawdown.</strong> Real estate and other illiquid assets grow passively in the model and are not drawn upon in retirement. Only the investment portfolio services retirement withdrawals.</li>
        <li><strong>Liability amortisation defaults.</strong> Where no end year is specified on a liability sub-item, mortgages are amortised linearly over 25 years and all other liabilities over 5 years from today. Actual amortisation schedules may differ.</li>
      </ul>
    </div>
  </div>
  <hr class="note-rule"/>

  <div class="note-block">
    <div class="note-heading"><span class="note-num">3.</span> Significant Assumptions</div>
    <div class="note-body">
      <p>The projections are sensitive to the following assumptions, which are user-defined and applied consistently across all scenarios unless otherwise stated:</p>
      <ul>
        <li><strong>Investment return (${assumptions.investmentReturn}% p.a.).</strong> Applied to the liquid investment portfolio (pre- and post-retirement). This is a nominal, pre-fee return. Adviser fees, fund management charges, and transaction costs are not deducted.</li>
        <li><strong>Real estate appreciation (${assumptions.realEstateAppreciation}% p.a.).</strong> Applied uniformly to the entire real estate portfolio. Regional, property-type, and leverage effects are not modelled.</li>
        <li><strong>Salary growth (${assumptions.salaryGrowth}% p.a.).</strong> Applied to earned income until the stated retirement age, after which salary is assumed to cease.</li>
        <li><strong>Passive income growth (${assumptions.passiveGrowth}% p.a.) and other income growth (${assumptions.otherIncomeGrowth}% p.a.).</strong> Continued post-retirement unless an end year is specified on the income sub-item.</li>
        <li><strong>Expense growth.</strong> Each expense category grows at its own user-defined rate, both pre- and post-retirement. Categories with a phase-out year are set to zero from that year onwards. Amounts are entered in today's terms and inflated forward.</li>
        <li><strong>Safe withdrawal rate (${nestEggSwr}%).</strong> Used to size the Required Nest Egg (see Note 9 for formula and caveats). A common heuristic — does not guarantee portfolio survival under all market conditions.</li>
        <li><strong>Life expectancy (Age ${profile.lifeExpectancy}).</strong> Projections terminate at this age. Longevity beyond this point is not modelled.</li>
      </ul>
    </div>
  </div>
  <hr class="note-rule"/>

  <div class="note-block">
    <div class="note-heading"><span class="note-num">4.</span> One-Time and Recurring Expenses</div>
    <div class="note-body">
      <p>One-time expenses are entered in today's terms and inflated forward using a two-segment approach: at the pre-retirement category growth rate from today to retirement, then at the post-retirement category growth rate for expenses falling within retirement. Recurring one-time expenses (those with both a start year and an end year) are expanded into per-year entries for projection and Monte Carlo purposes. One-time expenses are excluded from the milestone overlay on the net worth chart to avoid visual clutter but are fully reflected in the underlying projection data.</p>
    </div>
  </div>
  <hr class="note-rule"/>

  <div class="note-block">
    <div class="note-heading"><span class="note-num">5.</span> Retirement Projections and Financial Independence Age</div>
    <div class="note-body">
      <p>The <strong>Financial Independence (FI) Age</strong> is defined as the earliest age at which the projected investment portfolio balance equals or exceeds the Required Nest Egg for that year, calculated as the nominal retirement expense divided by the safe withdrawal rate. The FI Age uses a per-year nominal threshold — the required portfolio size increases each year with expense inflation, so it is not a fixed target calculated once at retirement date. For the Required Nest Egg formula and its caveats, see Note 9.</p>
      <p>The <strong>drawdown simulation</strong> (when enabled) deducts net retirement expenses (gross expenses less passive and other income) from the investment portfolio annually, post-retirement. Only the liquid investment portfolio is drawn upon — real estate and other illiquid assets grow passively and are excluded (see Note 2). The portfolio balance is floored at zero; exhaustion age is the first year the balance reaches zero.</p>
    </div>
  </div>
  <hr class="note-rule"/>

  <div class="note-block">
    <div class="note-heading"><span class="note-num">6.</span> Monte Carlo Simulation Methodology</div>
    <div class="note-body">
      <p>Retirement survival probability is estimated using <strong>1,000 independent Monte Carlo simulations</strong>. In each simulation, annual investment returns are drawn from a normal distribution parameterised by the user's stated expected return (${assumptions.investmentReturn}% p.a.) and standard deviation (${assumptions.investmentStdDev}% p.a.) using the Box-Muller transform. The simulation:</p>
      <ul>
        <li>Operates on the liquid investment portfolio only, starting from its projected balance at retirement date</li>
        <li>Applies per-year nominal withdrawal amounts computed from the retirement budget, including category-specific growth rates and phase-out schedules</li>
        <li>Nets passive and other income against withdrawals (only the shortfall is drawn from investments)</li>
        <li>Incorporates one-time post-retirement expenses using the two-segment inflation approach described in Note 8</li>
        <li>Records a simulation as successful if the portfolio balance remains above zero through life expectancy</li>
      </ul>
      <p>Success probability thresholds: <strong>≥80% = strong plan</strong>; 60–79% = caution; <strong>&lt;60% = plan review recommended</strong>. These thresholds are conventional guidelines, not actuarial standards.</p>
    </div>
  </div>
  <hr class="note-rule"/>

  <div class="note-block">
    <div class="note-heading"><span class="note-num">7.</span> Key Metrics Tiles</div>
    <div class="note-body">
      <p>The five Key Metrics tiles on the Overview tab display the following derived values:</p>
      <ul>
        <li><strong>Net Worth.</strong> Total assets (investments + real estate + cash + other) minus total liabilities (mortgage + loans + other), at today's balances. Not projected — this is a point-in-time snapshot.</li>
        <li><strong>Debt Free Age.</strong> The first projected year in which total liabilities reach zero, based on the liability amortisation schedule described in Note 2. Displayed as an age and calendar year. If all liabilities already carry an end year via sub-items, this reflects the latest payoff date.</li>
        <li><strong>First $1M USD.</strong> The projected age and calendar year at which net worth first crosses USD 1,000,000, converted from AED at the export-date exchange rate. See Note 12 for the full set of wealth milestones and the rationale for USD denomination.</li>
        <li><strong>Planned Retirement.</strong> The retirement age and calendar year as entered in the Profile tab. This is a user input, not a derived value. The FI Age (earliest age at which the portfolio could support retirement) is shown separately in the Retirement Health tile and may differ.</li>
        <li><strong>Retirement Health.</strong> A composite summary showing FI Age, SWR needed today (the withdrawal rate implied by current investments relative to the required retirement spend), Monte Carlo survival odds, and the projected portfolio exhaustion age (if drawdown is enabled and the portfolio runs out before life expectancy).</li>
      </ul>
    </div>
  </div>
  <hr class="note-rule"/>

  <div class="note-block">
    <div class="note-heading"><span class="note-num">8.</span> Financial Health Scorecards</div>
    <div class="note-body">
      <p>Seven scorecard tiles provide a snapshot of current financial health. All metrics use today's values unless stated otherwise. Thresholds are general guidelines derived from common personal finance benchmarks and are not actuarial standards.</p>
      <ul>
        <li><strong>Savings Rate.</strong> Formula: (Annual Income − Current Annual Expenses) ÷ Annual Income. Thresholds: ≥20% = green (wealth-building); 10–19% = amber (adequate); &lt;10% = red (at risk). Income uses today's totals across all income streams. Expenses use today's entered totals. Surplus is undeployed by default — see Surplus Deployment (Note 11) to model putting it to work.</li>
        <li><strong>NW Multiple.</strong> Formula: Current Net Worth ÷ Annual Salary. Benchmarked against Fidelity age-based targets: 1× at 30, 3× at 40, 7× at 55, 10× at retirement age. Intermediate ages are linearly interpolated between brackets. Green = at or above target; amber = 75–99% of target; red = below 75%. Requires a non-zero salary to calculate.</li>
        <li><strong>Debt Ratio.</strong> Formula: Total Liabilities ÷ Total Assets. Thresholds: &lt;30% = green (healthy leverage); 30–49% = amber (moderate); ≥50% = red (high leverage). A ratio above 50% means liabilities exceed half of total assets.</li>
        <li><strong>Emergency Fund.</strong> Formula: Cash Balance ÷ (Current Annual Expenses ÷ 12). Expressed in months of expenses covered. Thresholds: ≥6 months = green; 3–5 months = amber; &lt;3 months = red. Uses the cash asset field only — other liquid assets are excluded.</li>
        <li><strong>Investment Mix.</strong> Formula: Investments ÷ Total Assets. Thresholds: ≥40% = green; 20–39% = amber; &lt;20% = red. Measures the proportion of wealth held in liquid, growth-oriented investments versus real estate and other assets. A low mix may indicate concentration in illiquid assets.</li>
        <li><strong>Retirement Funding.</strong> Formula: Projected Investments at Retirement ÷ Required Nest Egg. Thresholds: ≥100% = green (fully funded); 85–99% = light green (approaching); 50–84% = amber; &lt;50% = red. The Required Nest Egg formula is defined in Note 9.</li>
        <li><strong>Income Replacement Ratio.</strong> Formula: Retirement Budget (today's terms) ÷ Current Annual Income. Both values are in today's dollars for a like-for-like comparison. Thresholds: 80–120% = green (strong fit), 70–79% = amber (lean replacement), above 120% = amber (retirement lifestyle exceeds current income), below 70% = red (significant lifestyle reduction).</li>
      </ul>
    </div>
  </div>
  <hr class="note-rule"/>

  <div class="note-block">
    <div class="note-heading"><span class="note-num">9.</span> Retirement Health Card — Q1 and Gap-Closing Levers</div>
    <div class="note-body">
      <p>The Retirement Health card addresses two questions. <strong>Q1</strong> assesses whether the projected investment portfolio at retirement is sufficient. <strong>Q2</strong> (Monte Carlo, Note 6) assesses whether it will last.</p>
      <p><strong>Required Nest Egg</strong> = Day-1 Nominal Retirement Expense ÷ Safe Withdrawal Rate. Day-1 expenses are the sum of all retirement budget categories inflated from today to retirement date at each category's growth rate, with no phase-outs applied (conservative upper bound).</p>
      <p><strong>Projected Investments at Retirement</strong> = the investment portfolio balance in the base-case wealthProjection at the retirement age entry. This reflects investment compounding and drawdown (if enabled) but does not include undeployed surplus — surplus must be actively invested via the Surplus Deployment section to appear here.</p>
      <p><strong>Retirement Gap</strong> = Projected Investments − Required Nest Egg. Negative = shortfall.</p>
      <p>The <strong>overall verdict</strong> is a 6-state classification combining Q1 (on track vs gap) and Q2 (≥80% strong, 60–79% caution, &lt;60% weak): Strong · Moderate risk · High risk · Gap with strong odds · Gap detected · High risk with gap and low odds.</p>
      <p>When a gap exists, three independent levers are shown — each closes the gap in isolation, holding all else constant:</p>
      <ul>
        <li><strong>Save More.</strong> The additional monthly investment required to accumulate the gap amount by retirement, assuming contributions compound at the investment return using a future-value annuity formula. Your existing monthly surplus partially offsets this requirement.</li>
        <li><strong>Retire Later.</strong> The number of additional working years (beyond planned retirement) needed for your investments to reach the required nest egg. During each extra year, existing investments compound at the current return AND net savings (projected income minus expenses, if positive) are added. Income grows at the configured growth rates. Displays "Gap too large" if not achievable within 30 extra years.</li>
        <li><strong>Higher Return.</strong> The CAGR required for existing investments alone (no new contributions) to reach the required nest egg by retirement, solved via: (Required Nest Egg ÷ Current Investments)^(1 ÷ Years) − 1. Displays "unrealistic" if the required return exceeds 30%/yr.</li>
      </ul>
      <p>All three levers are illustrative. A combination strategy will always close the gap more efficiently than any single lever in isolation.</p>
    </div>
  </div>
  <hr class="note-rule"/>

  <div class="note-block">
    <div class="note-heading"><span class="note-num">10.</span> Retirement Runway</div>
    <div class="note-body">
      <p>Retirement Runway shows how long the investment portfolio survives under three return and spending scenarios, measured in years from the retirement date. Requires Drawdown Mode to be enabled.</p>
      <p><strong>Runway years</strong> = Portfolio Exhaustion Age − Retirement Age (or Life Expectancy − Retirement Age if the portfolio never exhausts). Portfolio exhaustion is the first year the investment balance reaches zero in the deterministic drawdown simulation.</p>
      <p>The three scenarios share the same retirement expense base but apply independent adjustments:</p>
      <ul>
        <li><strong>Base.</strong> No adjustments — uses the configured investment return and the full retirement budget as entered. This is identical to the main wealthProjection drawdown.</li>
        <li><strong>Pessimistic.</strong> Return offset slider (default −3pp) reduces the investment return. Spend increase slider (default Off) inflates annual retirement withdrawals by an additional percentage. Both adjustments compound over the retirement horizon.</li>
        <li><strong>Optimistic.</strong> Return offset slider (default +3pp) increases the investment return. Spend cut slider (default −25%) reduces annual withdrawals. Models a scenario where returns beat expectations and the retiree spends less than planned.</li>
      </ul>
      <p>All three scenarios net passive and other income against withdrawals before drawing from investments — consistent with the main projection. Sliders affect only the Runway visualisation and do not modify any other metric or the base projection.</p>
    </div>
  </div>
  <hr class="note-rule"/>

  <div class="note-block">
    <div class="note-heading"><span class="note-num">11.</span> Surplus Deployment Scenarios</div>
    <div class="note-body">
      <p>The Surplus Deployment section models three strategies for allocating annual pre-retirement savings surplus. All three scenarios use the actual year-by-year surplus from the base projection (which reflects salary growth, expense inflation, and one-time costs) rather than a fixed annual figure. The FI Age shown in each tile uses the same per-year nominal threshold as the main FI Age calculation (Note 5) and is therefore directly comparable. Scenarios are illustrative only — they do not update the base projection or any other metric in the report.</p>
    </div>
  </div>
  <hr class="note-rule"/>

  <div class="note-block">
    <div class="note-heading"><span class="note-num">12.</span> Wealth Milestones</div>
    <div class="note-body">
      <p>Wealth milestones ($1M, $5M, $10M, $25M) are denominated in <strong>United States Dollars (USD)</strong> regardless of the display currency, as these represent globally recognised psychological and planning thresholds. Milestone ages are derived from the projected net worth series and reflect the first year the net worth (total assets minus total liabilities) crosses each threshold at the exchange rate prevailing at export date.</p>
    </div>
  </div>

</div>
<!-- /notes -->

<!-- ═══════════════════════ FOOTER ═══════════════════════ -->
<div class="footer">
  <strong>NetWorth Navigator</strong> · Financial Independence Report · Generated ${exportDate}<br>
  <span style="margin-top:6px;display:block;">This report is for personal record-keeping and informational purposes only. Projections are based on assumptions that may not reflect actual future conditions. Past performance does not guarantee future results. Consult a qualified financial advisor before making investment or retirement decisions.</span>
</div>

</div><!-- /page -->

<script>
Chart.defaults.color='#64748b';
Chart.defaults.font.family='-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif';
Chart.defaults.borderColor='rgba(0,0,0,0.06)';

const ages=${JSON.stringify(wealthProjection.map(d=>d.age))};
const nwData=${JSON.stringify(wealthProjection.map(d=>Math.round(d.netWorth)))};
const invData=${JSON.stringify(wealthProjection.map(d=>Math.round(d.investments)))};
const reData=${JSON.stringify(wealthProjection.map(d=>Math.round(d.realEstate)))};
const incData=${JSON.stringify(wealthProjection.map(d=>Math.round(d.income)))};
const expData=${JSON.stringify(wealthProjection.map(d=>Math.round(d.expenses)))};
const retAge=${profile.retirementAge};
const exhAge=${exhaustionAge||'null'};
const retIdx=ages.indexOf(retAge);

const fmtVal=v=>v>=1000000?(v/1000000).toFixed(1)+'M':v>=1000?(v/1000).toFixed(0)+'K':v;

// SVG overlay helper — draws vertical dashed lines on a Chart.js canvas
// after render using the chart's own pixel scale (no plugin needed)
function addVerticalLines(chart, lines) {
  const canvas = chart.canvas;
  const parent = canvas.parentElement;
  // ensure parent is positioned
  parent.style.position = 'relative';
  lines.forEach(({age, color, label, dash}) => {
    const xScale = chart.scales.x;
    if (!xScale) return;
    const x = xScale.getPixelForValue(age);
    const top = chart.chartArea.top;
    const bottom = chart.chartArea.bottom;
    const height = bottom - top;
    // SVG line + rotated label (mirrors RotatedRefLabel in app)
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.style.cssText = 'position:absolute;left:'+x+'px;top:'+top+'px;width:1px;height:'+height+'px;overflow:visible;pointer-events:none;';
    const line = document.createElementNS('http://www.w3.org/2000/svg','line');
    line.setAttribute('x1','0'); line.setAttribute('y1','0');
    line.setAttribute('x2','0'); line.setAttribute('y2',height);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width','2');
    line.setAttribute('stroke-dasharray', dash||'6,4');
    svg.appendChild(line);
    const textX = 9;
    const textY = 55;
    const txt = document.createElementNS('http://www.w3.org/2000/svg','text');
    txt.setAttribute('x', textX); txt.setAttribute('y', textY);
    txt.setAttribute('fill', color);
    txt.setAttribute('font-size', '9');
    txt.setAttribute('font-weight', '600');
    txt.setAttribute('opacity', '0.7');
    txt.setAttribute('text-anchor', 'middle');
    txt.setAttribute('dominant-baseline', 'middle');
    txt.setAttribute('transform', 'rotate(-90,'+textX+','+textY+')');
    txt.style.pointerEvents = 'none';
    txt.textContent = label;
    svg.appendChild(txt);
    parent.appendChild(svg);
  });
}

// Net Worth chart
const nwChart = new Chart(document.getElementById('nwChart'),{
  type:'line',
  data:{labels:ages,datasets:[
    {label:'Net Worth',data:nwData,borderColor:'#1d4ed8',backgroundColor:'rgba(29,78,216,0.06)',borderWidth:2.5,fill:true,tension:0.3,pointRadius:0,pointHoverRadius:4},
    {label:'Investments',data:invData,borderColor:'#16a34a',backgroundColor:'rgba(22,163,74,0.04)',borderWidth:2,fill:false,tension:0.3,borderDash:[4,3],pointRadius:0,pointHoverRadius:4},
    {label:'Real Estate',data:reData,borderColor:'#d97706',backgroundColor:'rgba(217,119,6,0.04)',borderWidth:2,fill:false,tension:0.3,borderDash:[2,4],pointRadius:0,pointHoverRadius:4},
  ]},
  options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
    plugins:{legend:{position:'top',labels:{boxWidth:12,padding:16}},
      tooltip:{callbacks:{label:c=>'  '+c.dataset.label+': ${currency} '+fmtVal(c.parsed.y)}},
    },
    scales:{
      x:{type:'linear',title:{display:true,text:'Age',color:'#94a3b8',font:{size:11}},grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#94a3b8',font:{size:10},stepSize:5}},
      y:{title:{display:true,text:'${currency}',color:'#94a3b8',font:{size:11}},grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#94a3b8',font:{size:10},callback:v=>fmtVal(v)}}
    }
  }
});
// Draw vertical lines on nwChart after render
const nwLines = [{age:retAge, color:'#7c3aed', label:'Retirement'}];
if(exhAge) nwLines.push({age:exhAge, color:'#dc2626', label:'Exhaustion', dash:'4,3'});
addVerticalLines(nwChart, nwLines);

// Cashflow chart
const cfChart = new Chart(document.getElementById('cfChart'),{
  type:'line',
  data:{labels:ages,datasets:[
    {label:'Income',data:incData,borderColor:'#16a34a',backgroundColor:'rgba(22,163,74,0.08)',borderWidth:2,fill:true,tension:0.3,pointRadius:0},
    {label:'Expenses',data:expData,borderColor:'#dc2626',backgroundColor:'rgba(220,38,38,0.08)',borderWidth:2,fill:true,tension:0.3,pointRadius:0}
  ]},
  options:{responsive:true,maintainAspectRatio:false,interaction:{mode:'index',intersect:false},
    plugins:{legend:{position:'top',labels:{boxWidth:10,padding:12,font:{size:11}}},title:{display:true,text:'Income vs Expenses',color:'#1e293b',font:{size:12,weight:'bold'}},
      tooltip:{callbacks:{label:c=>'  '+c.dataset.label+': ${currency} '+fmtVal(c.parsed.y)}},
    },
    scales:{x:{type:'linear',grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#94a3b8',font:{size:9},stepSize:5}},y:{grid:{color:'rgba(0,0,0,0.04)'},ticks:{color:'#94a3b8',font:{size:9},callback:v=>fmtVal(v)}}}
  }
});
addVerticalLines(cfChart, [{age:retAge, color:'#7c3aed', label:'Retirement'}]);

// Asset allocation donut
const allocData=[${assets.investments},${assets.realEstate},${assets.cash},${assets.other}];
const allocTotal=allocData.reduce((a,b)=>a+b,0);
const allocLabels=['Investments','Real Estate','Cash','Other Illiquid'];
const allocCenterPlugin={id:'allocCenter',afterDraw(chart){
  const {ctx,chartArea:{top,bottom,left,right}}=chart;
  const cx=(left+right)/2, cy=(top+bottom)/2;
  const total=allocData.reduce((a,b)=>a+b,0);
  const label=fmtVal(total);
  ctx.save();
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillStyle='#94a3b8'; ctx.font='600 10px -apple-system,sans-serif';
  ctx.fillText('Total Assets',cx,cy-10);
  ctx.fillStyle='#1e293b'; ctx.font='700 13px -apple-system,sans-serif';
  ctx.fillText('${currency} '+label,cx,cy+6);
  ctx.restore();
}};
new Chart(document.getElementById('allocChart'),{
  type:'doughnut',
  data:{
    labels:allocLabels,
    datasets:[{data:allocData,
      backgroundColor:['rgba(29,78,216,0.75)','rgba(217,119,6,0.75)','rgba(15,118,110,0.75)','rgba(124,58,237,0.75)'],
      borderColor:['#1d4ed8','#d97706','#0f766e','#7c3aed'],borderWidth:2,hoverOffset:6}]
  },
  plugins:[allocCenterPlugin],
  options:{responsive:true,maintainAspectRatio:false,cutout:'60%',
    plugins:{
      legend:{position:'right',labels:{boxWidth:11,padding:12,font:{size:10},
        generateLabels:chart=>{
          const ds=chart.data.datasets[0];
          return chart.data.labels.map((lbl,i)=>{
            const val=ds.data[i];
            const pct=allocTotal>0?((val/allocTotal)*100).toFixed(1):'0.0';
            return {text:lbl+' '+pct+'%',fillStyle:ds.backgroundColor[i],strokeStyle:ds.borderColor[i],lineWidth:1,index:i,hidden:false};
          });
        }
      }},
      title:{display:true,text:'Asset Allocation Today',color:'#1e293b',font:{size:12,weight:'bold'}},
      tooltip:{callbacks:{label:c=>{const t=c.dataset.data.reduce((a,b)=>a+b,0);return '  '+c.label+': ${currency} '+fmtVal(c.parsed)+' ('+((c.parsed/t)*100).toFixed(1)+'%)';}}}
    }
  }
});
</script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NWN-Report-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

    // Import data from JSON file
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        const v = imported.version;
        if (v === '1.0' || v === '2.0') {
          setCurrency(imported.currency || DEFAULT_STATE.currency);
          setExchangeRates(imported.exchangeRates || DEFAULT_STATE.exchangeRates);
          setProfile(imported.profile || DEFAULT_STATE.profile);
          setAssets(imported.assets || DEFAULT_STATE.assets);
          setLiabilities(imported.liabilities || DEFAULT_STATE.liabilities);
          setIncome(imported.income || DEFAULT_STATE.income);
          setExpenses(imported.expenses || DEFAULT_STATE.expenses);
          if (imported.expenseCategories && imported.expenseCategories.length > 0) setExpenseCategories(imported.expenseCategories);
          if (imported.expenseCalculator) setExpenseCalculator(imported.expenseCalculator);
          if (imported.retirementBudget) setRetirementBudget(imported.retirementBudget);
          if (imported.expenseGrowthRates) setExpenseGrowthRates(imported.expenseGrowthRates);
          if (imported.expenseTags) setExpenseTags(imported.expenseTags);
          if (imported.expensePhaseOutYears) setExpensePhaseOutYears(imported.expensePhaseOutYears);
          if (imported.retExpensePhaseOutYears) setRetExpensePhaseOutYears(imported.retExpensePhaseOutYears);
          if (imported.retExpenseGrowthRates) setRetExpenseGrowthRates(imported.retExpenseGrowthRates);
          setLifeEvents(imported.lifeEvents || DEFAULT_STATE.lifeEvents);
          setAssumptions(imported.assumptions || DEFAULT_STATE.assumptions);
          setOneTimeExpenses(imported.oneTimeExpenses || DEFAULT_STATE.oneTimeExpenses);
          setNestEggSwr(clampSwr(imported.nestEggSwr));
          if (imported.surplusSplitInvest !== undefined) setSurplusSplitInvest(imported.surplusSplitInvest);
          if (imported.surplusSplitDebt   !== undefined) setSurplusSplitDebt(imported.surplusSplitDebt);
          alert('Data imported successfully! All values are in AED — switch currency above if needed.');
        } else {
          alert('Incompatible file format. Please use a file exported from NetWorth Navigator.');
        }
      } catch (error) {
        console.error('Error importing data:', error);
        alert('Error reading file. Please check it is a valid NetWorth Navigator export.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  // Import pre-retirement expenses from CSV
  const importExpensesCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;

        // RFC 4180-compliant CSV row parser — handles quoted fields containing commas/newlines
        const parseCSVRow = (line) => {
          const fields = [];
          let cur = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
              if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
              else if (ch === '"') { inQuotes = false; }
              else { cur += ch; }
            } else {
              if (ch === '"') { inQuotes = true; }
              else if (ch === ',') { fields.push(cur.trim()); cur = ''; }
              else { cur += ch; }
            }
          }
          fields.push(cur.trim());
          return fields;
        };

        const cleanText = text.replace(/^\uFEFF/, ''); // strip UTF-8 BOM if present
        const lines = cleanText.split(/\r?\n/).filter(l => l.trim().length > 0);

        // Find the header row (must contain "Category" and "Monthly Planning Budget (AED)")
        let headerIdx = -1;
        let categoryCol = -1;
        let monthlyCol = -1;
        let descriptionCol = -1;
        let expenseTypeCol = -1;
        let csvCurrency = 'AED'; // detected from "Monthly Estimate (XXX)" header, fallback AED
        for (let i = 0; i < Math.min(lines.length, 5); i++) {
          const cols = parseCSVRow(lines[i]);
          const cIdx = cols.findIndex(c => c.toLowerCase() === 'category');
          // Match either "Monthly Planning Budget (AED)" or variants for backward compat
const mIdx = cols.findIndex(c =>
  c.toLowerCase().replace(/\s+/g, ' ').includes('monthly planning budget') ||
  c.toLowerCase().includes('monthly estimate')
); // allow old files too
          if (cIdx !== -1 && mIdx !== -1) {
            headerIdx = i;
            categoryCol = cIdx;
            monthlyCol = mIdx;
            // Detect currency from header e.g. "Monthly Estimate (EUR)" → "EUR"
            const currMatch = cols[mIdx].match(/\(([A-Z]{3})\)/i);
            if (currMatch) {
              const detected = currMatch[1].toUpperCase();
              // Accept if it's a known currency in exchangeRates, otherwise fall back to AED
              csvCurrency = exchangeRates[detected] !== undefined ? detected : 'AED';
            }
            // Optional columns
            descriptionCol = cols.findIndex(c => c.toLowerCase() === 'description');
            expenseTypeCol = cols.findIndex(c => c.toLowerCase().replace(/\s+/g, ' ') === 'expense type');
            break;
          }
        }

        if (headerIdx === -1) {
          alert('CSV format not recognised.\n\nExpected columns: "Category" and "Monthly Planning Budget (AED)".\nPlease check the file format and try again.');
          event.target.value = '';
          return;
        }

        // Parse data rows
        const dataRows = lines.slice(headerIdx + 1);
        const CAT_COLORS = [
          '#ef4444','#f97316','#eab308','#84cc16','#22c55e',
          '#14b8a6','#fbbf24','#f43f5e','#8b5cf6','#a78bfa',
          '#c084fc','#60a5fa','#38bdf8','#34d399','#fb923c',
        ];

        const newCats = [];
        const newCalc = {};
        const newRetBudget = {};
        const newGrowthRates = {};
        const newRetGrowthRates = {};
        const newTags = {};
        let colorIndex = 0;

        dataRows.forEach(line => {
          const cols = parseCSVRow(line);
          const label = cols[categoryCol];
          const rawAmt = cols[monthlyCol];
          if (!label || !rawAmt) return;
          // Skip summary/total rows
          if (/^(total|subtotal|grand total)$/i.test(label.trim())) return;

          const monthlyAmtInCsvCurrency = parseFloat(rawAmt.replace(/[^0-9.-]/g, ''));
          if (isNaN(monthlyAmtInCsvCurrency)) return;

          // Convert from CSV currency to AED for internal storage
          // exchangeRates[X] = how many AED per 1 unit of X (e.g. EUR: 4.01 means 1 EUR = 4.01 AED)
          const csvRate = exchangeRates[csvCurrency] || 1;
          const monthlyAmt = monthlyAmtInCsvCurrency * csvRate;
          const annualAmt = Math.round(monthlyAmt * 12);
          // Build a stable key from the label
          const key = 'csv_' + label.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');

          // Use Description column as tooltip if present, else fall back to label
          const tooltip = (descriptionCol !== -1 && cols[descriptionCol])
            ? cols[descriptionCol]
            : label;

          // Resolve expense type — optional column; defaults to 'essential' if absent or unrecognised
          let group = 'essential';
          if (expenseTypeCol !== -1 && cols[expenseTypeCol]) {
            const rawType = cols[expenseTypeCol].trim().toLowerCase();
            if (rawType === 'discretionary' || rawType === 'disc' || rawType === 'd') {
              group = 'disc';
            }
          }

          const icon = '📋';
          const color = CAT_COLORS[colorIndex % CAT_COLORS.length];
          colorIndex++;

          newCats.push({ key, label, color, group, icon, tooltip });
          newCalc[key] = annualAmt;
          newRetBudget[key] = annualAmt; // Use same figure as retirement placeholder
          newGrowthRates[key] = 3.0;
          newRetGrowthRates[key] = 3.0;
          newTags[key] = group;
        });

        if (newCats.length === 0) {
          alert('No valid expense rows found in the CSV. Please check your file and try again.');
          event.target.value = '';
          return;
        }

        // Replace expense categories & amounts entirely with CSV data
        setExpenseCategories(newCats);
        setExpenseCalculator(newCalc);
        setRetirementBudget(newRetBudget);
        setExpenseGrowthRates(newGrowthRates);
        setRetExpenseGrowthRates(newRetGrowthRates);
        setExpenseTags(newTags);
        setExpensePhaseOutYears({});
        setRetExpensePhaseOutYears({});

        // Switch the app display currency to match the CSV base currency
        if (CURRENCIES[csvCurrency]) {
          setCurrency(csvCurrency);
        }

        const withDesc = newCats.filter(c => c.tooltip && c.tooltip !== c.label).length;
        const discCount = newCats.filter(c => c.group === 'disc').length;
        const essCount = newCats.length - discCount;
        const typeNote = expenseTypeCol !== -1
          ? `\n• Expense types applied: ${essCount} Essential, ${discCount} Discretionary.`
          : '\n• Expense Type column not found — all categories defaulted to Essential. Add an "Expense Type" column with "Essential" or "Discretionary" to set E/D tags on import.';
        const currencyNote = csvCurrency !== 'AED'
          ? `\n• Detected base currency: ${csvCurrency} — amounts converted to AED internally; display switched to ${csvCurrency}.`
          : `\n• Detected base currency: AED — amounts stored as-is.`;
        alert(`✅ CSV imported successfully!\n\n${newCats.length} expense categories loaded${withDesc > 0 ? ` (${withDesc} with descriptions as tooltips)` : ''}.\n\n• Pre-retirement amounts set to the monthly figures × 12.\n• Retirement amounts pre-filled with the same values as a starting placeholder — adjust them in the Retirement tab.\n• Growth rates default to 3% per year; update them per category as needed.${currencyNote}${typeNote}`);
      } catch (err) {
        console.error('CSV import error:', err);
        alert('Error reading CSV. Please ensure the file is a valid comma-separated file and try again.');
      }
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  // Reset to default values
  const resetToDefaults = () => {
    setShowResetConfirm(true);
  };

  // Colour palette for new user-added categories (cycles through if exhausted)
  const CAT_COLOR_PALETTE = [
    '#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6',
    '#06b6d4','#84cc16','#f97316','#a78bfa','#34d399',
  ];

  const handleAddCat = (group) => {
    const newLabel = 'New Category';
    // Generate unique key: slugify label + timestamp suffix to guarantee uniqueness
    const baseKey = 'cat_' + Date.now();
    // Pick next color from palette (cycle based on current custom cat count)
    const customCats = expenseCategories.filter(c => !DEFAULT_EXPENSE_CATEGORIES.find(d => d.key === c.key));
    const color = CAT_COLOR_PALETTE[customCats.length % CAT_COLOR_PALETTE.length];
    const newCat = { key: baseKey, label: newLabel, color, group, icon: '📌', tooltip: '' };
    // Update all 7 state objects atomically
    setExpenseCategories(prev => [...prev, newCat]);
    setExpenseCalculator(prev => ({ ...prev, [baseKey]: 0 }));
    setRetirementBudget(prev => ({ ...prev, [baseKey]: 0 }));
    setExpenseGrowthRates(prev => ({ ...prev, [baseKey]: 3 }));
    setRetExpenseGrowthRates(prev => ({ ...prev, [baseKey]: 3 }));
    setExpenseTags(prev => ({ ...prev, [baseKey]: group }));
    setExpensePhaseOutYears(prev => ({ ...prev, [baseKey]: null }));
    setRetExpensePhaseOutYears(prev => ({ ...prev, [baseKey]: null }));
    // Auto-open editing so user can immediately rename it
    setEditingCatLabel(baseKey);
  };

  const getCatLabel = (key) => {
    const cat = expenseCategories.find(c => c.key === key);
    return cat ? cat.label : key;
  };

  const handleRenameCat = (key, newLabel) => {
    const trimmed = newLabel.trim();
    if (!trimmed) return; // ignore empty
    setExpenseCategories(prev => prev.map(c => c.key === key ? { ...c, label: trimmed } : c));
    setEditingCatLabel(null);
  };

  const handleRemoveCat = (key) => {
    // Guard: don't remove if it's the last category in its group
    const cat = expenseCategories.find(c => c.key === key);
    if (!cat) return;
    const effectiveGroup = expenseTags[key] || cat.group;
    const groupCount = expenseCategories.filter(c => (expenseTags[c.key] || c.group) === effectiveGroup).length;
    if (groupCount <= 1) return; // silent guard — button should already be disabled
    // Remove from expenseCategories and all 7 state objects
    setExpenseCategories(prev => prev.filter(c => c.key !== key));
    setExpenseCalculator(prev => { const n = {...prev}; delete n[key]; return n; });
    setRetirementBudget(prev => { const n = {...prev}; delete n[key]; return n; });
    setExpenseGrowthRates(prev => { const n = {...prev}; delete n[key]; return n; });
    setRetExpenseGrowthRates(prev => { const n = {...prev}; delete n[key]; return n; });
    setExpenseTags(prev => { const n = {...prev}; delete n[key]; return n; });
    setExpensePhaseOutYears(prev => { const n = {...prev}; delete n[key]; return n; });
    setRetExpensePhaseOutYears(prev => { const n = {...prev}; delete n[key]; return n; });
    // If this category was used in any OTE, clear that assignment
    setOneTimeExpenses(prev => prev.map(e => e.category === key ? {...e, category: 'none'} : e));
  };

  const handleRetGrowthChange = (field, rate) => {
    setRetExpenseGrowthRates({ ...retExpenseGrowthRates, [field]: rate });
  };

  const handleRetCalcChange = (field, num) => {
    const newBudget = {...retirementBudget, [field]: num};
    setRetirementBudget(newBudget);
    const retTotal = Object.values(newBudget).reduce(function(sum, v) { return sum + v; }, 0);
    setExpenses({...expenses, retirement: retTotal});
  };

  // Retirement expense in today's terms (plain sum; phase-out for retirement is a future feature)
  const retirementCalendarYear = new Date().getFullYear() + (profile.retirementAge - profile.currentAge);
  const effectiveRetirementExpense = Object.values(retirementBudget).reduce((s, v) => s + (v || 0), 0);

  const addOneTimeExpense = () => {
    const newId = oneTimeExpenses.length > 0 ? Math.max(...oneTimeExpenses.map(e => e.id)) + 1 : 1;
    setOneTimeExpenses([...oneTimeExpenses, { 
      id: newId, 
      year: new Date().getFullYear() + 1, 
      description: 'New expense', 
      amount: 0,
      category: expenseCategories[0]?.key || 'miscExpenses',
      endYear: null
    }]);
  };
  
  const updateOneTimeExpense = (id, field, value) => {
    setOneTimeExpenses(oneTimeExpenses.map(e => 
      e.id === id ? { ...e, [field]: value } : e
    ));
  };
  
  const removeOneTimeExpense = (id) => {
    setOneTimeExpenses(oneTimeExpenses.filter(e => e.id !== id));
  };
  
  // Sub-item management functions
  const addSubItem = (category, itemType) => {
    const currentItems = assets[itemType] || liabilities[itemType] || income[itemType] || [];
    const newId = currentItems.length > 0 ? Math.max(...currentItems.map(item => item.id)) + 1 : 1;
    const newItem = { id: newId, name: 'New Item', amount: 0 };
    
    if (category === 'assets') {
      setAssets({ ...assets, [itemType]: [...currentItems, newItem] });
    } else if (category === 'liabilities') {
      setLiabilities({ ...liabilities, [itemType]: [...currentItems, newItem] });
    } else if (category === 'income') {
      setIncome({ ...income, [itemType]: [...currentItems, newItem] });
    }
  };
  
  const updateSubItem = (category, itemType, id, field, value) => {
    const updateItems = (items) => items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    
    if (category === 'assets') {
      setAssets({ ...assets, [itemType]: updateItems(assets[itemType]) });
    } else if (category === 'liabilities') {
      setLiabilities({ ...liabilities, [itemType]: updateItems(liabilities[itemType]) });
    } else if (category === 'income') {
      setIncome({ ...income, [itemType]: updateItems(income[itemType]) });
    }
  };
  
  const removeSubItem = (category, itemType, id) => {
    if (category === 'assets') {
      setAssets({ ...assets, [itemType]: assets[itemType].filter(item => item.id !== id) });
    } else if (category === 'liabilities') {
      setLiabilities({ ...liabilities, [itemType]: liabilities[itemType].filter(item => item.id !== id) });
    } else if (category === 'income') {
      setIncome({ ...income, [itemType]: income[itemType].filter(item => item.id !== id) });
    }
  };
  
  const currentNetWorth = useMemo(() => {
    const totalAssets = (assets.cash || 0) + (assets.investments || 0) + (assets.realEstate || 0) + (assets.other || 0);
    const totalLiabilities = (liabilities.mortgage || 0) + (liabilities.loans || 0) + (liabilities.other || 0);
    return totalAssets - totalLiabilities;
  }, [assets, liabilities]);
  
  const annualIncome = useMemo(() => {
    // Re-sum from sub-items if present (mirrors HTML export logic) so rollup stays accurate
    const sal = income.salaryItems && income.salaryItems.length > 0
      ? income.salaryItems.reduce((s, i) => s + (i.amount || 0), 0)
      : (income.salary || 0);
    const pas = income.passiveItems && income.passiveItems.length > 0
      ? income.passiveItems.reduce((s, i) => s + (i.amount || 0), 0)
      : (income.passive || 0);
    const oth = income.otherIncomeItems && income.otherIncomeItems.length > 0
      ? income.otherIncomeItems.reduce((s, i) => s + (i.amount || 0), 0)
      : (income.other || 0);
    return sal + pas + oth;
  }, [income]);
  
  const annualSavings = useMemo(() => {
    return annualIncome - (expenses.current || 0);
  }, [annualIncome, expenses.current]);
  
  const savingsRate = useMemo(() => {
    return annualIncome > 0 ? (annualSavings / annualIncome) * 100 : 0;
  }, [annualSavings, annualIncome]);
  
  // Compute projected annual expenses for any given year using per-category growth rates
  const getProjectedExpenses = (targetYear, opts) => {
    const _opts = opts !== undefined ? opts : {};
    const currentYear = new Date().getFullYear();
    const yearsAhead = targetYear - currentYear;
    if (yearsAhead < 0) return expenses.current;

    const lifestyleInflation = _opts.lifestyleInflation !== undefined ? _opts.lifestyleInflation : 0;
    // rateOverrideDelta: shift every category's own rate by this amount (used for low/high scenarios)
    const rateOverrideDelta = _opts.rateOverrideDelta !== undefined ? _opts.rateOverrideDelta : 0;

    let total = 0;

    expenseCategories.forEach(cat => {
      const field = cat.key;
      const base = expenseCalculator[field] || 0;
      const isEssential = (expenseTags[field] || cat.group) === 'essential';
      let rate = (expenseGrowthRates[field] || 0) + rateOverrideDelta;
      rate = Math.max(0, rate); // floor at 0 — growth rate can't be negative
      if (!isEssential) rate += lifestyleInflation;
      const phaseOutYr = expensePhaseOutYears[field];
      if (phaseOutYr && targetYear >= phaseOutYr) { return; }
      total += base * Math.pow(1 + rate / 100, yearsAhead);
    });

    // Add OTEs active in targetYear, inflated from today (amounts entered in today's terms)
    // Skipped when called via getLifeStageExpense — wealthProjection handles OTEs separately
    if (!_opts.excludeOTEs) {
      const _currentYear = new Date().getFullYear();
      oneTimeExpenses
        .filter(e => targetYear >= e.year && targetYear <= (e.endYear || e.year))
        .forEach(e => {
          const base = e.amount || 0;
          const cat = e.category && e.category !== 'none' ? e.category : null;
          let rate = cat ? ((expenseGrowthRates[cat] || 0) + rateOverrideDelta) : rateOverrideDelta;
          rate = Math.max(0, rate);
          const yearsFromToday = targetYear - _currentYear;
          total += base * Math.pow(1 + rate / 100, yearsFromToday);
        });
    }

    return Math.round(total);
  };

  const getSensitivityExpenses = (targetYear, adjList) => {
    const currentYear = new Date().getFullYear();
    const yearsAhead = targetYear - currentYear;
    if (yearsAhead < 0) return expenses.current;
    let total = 0;
    expenseCategories.forEach(cat => {
      const field = cat.key;
      const base = expenseCalculator[field] || 0;
      const baseRate = expenseGrowthRates[field] || 0;
      const adj = adjList.find(a => a.category === field);
      const rate = baseRate + (adj ? adj.delta : 0);
      const phaseOutYr = expensePhaseOutYears[field];
      if (phaseOutYr && targetYear >= phaseOutYr) return;
      total += base * Math.pow(1 + rate / 100, yearsAhead);
    });
    // Sum all OTE entries active in targetYear — inflated from today (amounts in today's terms) + sensitivity adj
    const _currentYear2 = new Date().getFullYear();
    oneTimeExpenses
      .filter(e => targetYear >= e.year && targetYear <= (e.endYear || e.year))
      .forEach(e => {
        const base = e.amount || 0;
        const cat = e.category && e.category !== 'none' ? e.category : null;
        const baseRate = cat ? (expenseGrowthRates[cat] || 0) : 0;
        const adj = cat ? adjList.find(a => a.category === cat) : null;
        const rate = baseRate + (adj ? adj.delta : 0);
        const yearsFromToday = targetYear - _currentYear2;
        total += base * Math.pow(1 + rate / 100, yearsFromToday);
      });
    return Math.round(total);
  };

  // Returns the nominal retirement expense for a specific calendar year.
  // Each category is inflated at its own retExpenseGrowthRate from today,
  // for (yearsToRetirement + yearsIntoRetirement) years total.
  // Phase-outs respected. Used by all retirement calc surfaces for consistency.
  const getRetNominalForYear = (calYear) => {
    const currentYear = new Date().getFullYear();
    const yearsToRet = profile.retirementAge - profile.currentAge;
    const retirementCalYear = currentYear + yearsToRet;
    const yearsIntoRet = calYear - retirementCalYear;
    if (yearsIntoRet < 0) return 0;
    return expenseCategories.reduce((s, cat) => {
      const po = retExpensePhaseOutYears[cat.key];
      if (po && calYear >= po) return s;
      const base = retirementBudget[cat.key] || 0;
      const rate = (retExpenseGrowthRates[cat.key] || 0) / 100;
      return s + base * Math.pow(1 + rate, yearsToRet + yearsIntoRet);
    }, 0);
  };

  const getLifeStageExpense = (year) => {
    const currentYear = new Date().getFullYear();
    const age = profile.currentAge + (year - currentYear);
    // Post-retirement: getRetNominalForYear returns per-category inflated nominal value.
    if (age >= profile.retirementAge) return getRetNominalForYear(year);
    return getProjectedExpenses(year, { excludeOTEs: true });
  };
  
  const wealthProjection = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const projectionYears = Math.max(0, profile.lifeExpectancy - profile.currentAge);
    const data = [];
    
    let investmentBalance = assets.investments;
    let realEstateValue = assets.realEstate;
    let otherAssetValue = assets.other;
    let exhaustionAge = null; // first age where investments hit 0 under drawdown
    
    for (let i = 0; i <= projectionYears; i++) {
      const year = currentYear + i;
      const age = profile.currentAge + i;
      
      // getLifeStageExpense delegates to getRetNominalForYear post-retirement (already nominal)
      // and getProjectedExpenses pre-retirement (also already nominal). No further inflation needed.
      const inflationAdjustedExpense = getLifeStageExpense(year);
      
      // OTE two-segment inflation: supports recurring (endYear) and single-year entries.
      // Amounts are entered in today's terms — inflated from currentYear forward.
      // Sum all entries whose year <= calYear <= (endYear || year).
      const activeOTEs = oneTimeExpenses.filter(e => year >= e.year && year <= (e.endYear || e.year));
      const oneTimeExpense = activeOTEs.reduce((total, oneTime) => {
        const base = oneTime.amount || 0;
        const cat = oneTime.category && oneTime.category !== 'none' ? oneTime.category : null;
        const currentYear = new Date().getFullYear();
        const retCalYear = currentYear + (profile.retirementAge - profile.currentAge);
        const preRate = cat ? ((expenseGrowthRates[cat] || 0) / 100) : 0;
        const retRate = cat ? ((retExpenseGrowthRates[cat] || 0) / 100) : 0;
        let inflated;
        if (year < retCalYear) {
          // Pre-retirement: inflate from today at pre-ret category rate
          inflated = base * Math.pow(1 + preRate, year - currentYear);
        } else {
          // Post-retirement or straddles: two-segment from today
          const yearsToRet = retCalYear - currentYear;
          const yearsIntoRet = year - retCalYear;
          inflated = base * Math.pow(1 + preRate, yearsToRet) * Math.pow(1 + retRate, yearsIntoRet);
        }
        return total + inflated;
      }, 0);
      
      const yearSalary_calc = age < profile.retirementAge
        ? (() => {
            const items = income.salaryItems && income.salaryItems.length > 0 ? income.salaryItems : null;
            if (!items) return (income.salary || 0) * Math.pow(1 + assumptions.salaryGrowth / 100, i);
            return items.reduce((sum, item) => {
              if (item.endYear && year >= item.endYear) return sum; // income stream has ended
              return sum + (item.amount || 0) * Math.pow(1 + assumptions.salaryGrowth / 100, i);
            }, 0);
          })()
        : 0;
      // Passive and other income: respect per-item endYear if set
      const yearPassive_calc = (() => {
        const growthRate = (assumptions.passiveGrowth || 0) / 100;
        const items = income.passiveItems && income.passiveItems.length > 0 ? income.passiveItems : null;
        if (!items) return (income.passive || 0) * Math.pow(1 + growthRate, i);
        return items.reduce((sum, item) => {
          if (item.endYear && year >= item.endYear) return sum;
          return sum + (item.amount || 0) * Math.pow(1 + growthRate, i);
        }, 0);
      })();
      const yearOtherIncome_calc = (() => {
        const growthRate = (assumptions.otherIncomeGrowth || 0) / 100;
        const items = income.otherIncomeItems && income.otherIncomeItems.length > 0 ? income.otherIncomeItems : null;
        if (!items) return (income.other || 0) * Math.pow(1 + growthRate, i);
        return items.reduce((sum, item) => {
          if (item.endYear && year >= item.endYear) return sum;
          return sum + (item.amount || 0) * Math.pow(1 + growthRate, i);
        }, 0);
      })();
      const yearIncome = yearSalary_calc + yearPassive_calc + yearOtherIncome_calc;
      
      const yearExpenses = inflationAdjustedExpense + oneTimeExpense;
      // Savings (surplus for deployment) is a pre-retirement concept only
      const yearSavings = age < profile.retirementAge
        ? Math.max(0, yearIncome - yearExpenses)
        : 0;

      // Push CURRENT values first (i=0 = today's snapshot), then apply growth for next iteration
      const totalAssets = investmentBalance + realEstateValue + assets.cash + otherAssetValue;

      // Amortize each liability sub-item linearly toward its endYear.
      // Items without endYear use default terms: mortgage = 25yr, loans/other = 5yr.
      const amortizeLiability = (items, fallbackTotal, defaultTerm) => {
        if (!items || items.length === 0) {
          // No sub-items: amortize top-level total over default term
          return Math.max(0, fallbackTotal - (fallbackTotal / defaultTerm) * i);
        }
        return items.reduce((sum, item) => {
          const term = item.endYear ? (item.endYear - currentYear) : defaultTerm;
          if (term <= 0) return sum; // already paid off
          const endYr = item.endYear || (currentYear + defaultTerm);
          if (year >= endYr) return sum; // paid off
          return sum + Math.max(0, (item.amount || 0) * ((endYr - year) / term));
        }, 0);
      };
      const mortgageBalance = amortizeLiability(
        liabilities.mortgageItems && liabilities.mortgageItems.length > 0 ? liabilities.mortgageItems : null,
        liabilities.mortgage || 0, 25);
      const loansBalance = amortizeLiability(
        liabilities.loanItems && liabilities.loanItems.length > 0 ? liabilities.loanItems : null,
        liabilities.loans || 0, 5);
      const otherLiabBalance = amortizeLiability(
        liabilities.otherLiabilityItems && liabilities.otherLiabilityItems.length > 0 ? liabilities.otherLiabilityItems : null,
        liabilities.other || 0, 5);
      const totalLiabilities = Math.round(mortgageBalance + loansBalance + otherLiabBalance);
      const wealth = totalAssets - totalLiabilities;

      // Track first year investments hit zero under drawdown
      if (assumptions.enableDrawdown && age > profile.retirementAge && investmentBalance === 0 && exhaustionAge === null) {
        exhaustionAge = age;
      }

      const yearSalary = Math.round(yearSalary_calc);
      const yearPassive = Math.round(yearPassive_calc);
      const yearOtherIncome = Math.round(yearOtherIncome_calc);

      // Essential vs discretionary breakdown — uses expenseTags and getProjectedExpenses per-category
      let yearEssential = 0;
      let yearDiscretionary = 0;
      if (age < profile.retirementAge) {
        expenseCategories.forEach(cat => {
          const base = expenseCalculator[cat.key] || 0;
          const rate = expenseGrowthRates[cat.key] || 0;
          const phaseOut = expensePhaseOutYears[cat.key];
          if (phaseOut && year >= phaseOut) return;
          const projected = base * Math.pow(1 + rate / 100, year - currentYear);
          if ((expenseTags[cat.key] || cat.group) === 'essential') yearEssential += projected;
          else yearDiscretionary += projected;
        });
        yearEssential = Math.round(yearEssential);
        yearDiscretionary = Math.round(yearDiscretionary);
      }

      data.push({
        year,
        age,
        netWorth: Math.round(wealth),
        investments: Math.round(investmentBalance),
        realEstate: Math.round(realEstateValue),
        cash: assets.cash,
        other: Math.round(otherAssetValue),
        totalAssets: Math.round(totalAssets),
        totalLiabilities,
        mortgage: Math.round(mortgageBalance),
        loans: Math.round(loansBalance),
        otherLiabilities: Math.round(otherLiabBalance),
        income: Math.round(yearIncome),
        salary: yearSalary,
        passive: yearPassive,
        otherIncome: yearOtherIncome,
        expenses: Math.round(inflationAdjustedExpense + oneTimeExpense),
        essential: yearEssential,
        discretionary: yearDiscretionary,
        savings: Math.round(yearSavings),
        investmentsExhausted: assumptions.enableDrawdown && exhaustionAge !== null && age >= exhaustionAge,
      });

      // Apply growth AFTER push so next year's data reflects compounding from this year
      // Phase 4A — Drawdown Toggle: withdraw retirement expenses from investmentBalance
      // Rules: only when enabled, only AFTER the retirement entry year (age > retirementAge),
      // from Investments only (liquid/market assets). Capped at 0 — balance can't go negative.
      let drawdownAmount = 0;
      if (assumptions.enableDrawdown && age > profile.retirementAge) {
        // Net passive and other income against the withdrawal — only the shortfall comes from investments.
        // Salary is zeroed post-retirement. Passive/other income continues and reduces the draw needed.
        // This prevents double-counting: post-retirement passive income isn't accumulated elsewhere.
        const postRetIncome = yearPassive_calc + yearOtherIncome_calc;
        drawdownAmount = Math.max(0, inflationAdjustedExpense + oneTimeExpense - postRetIncome);
      }
      // Surplus (yearSavings) is NOT automatically reinvested — it is undeployed until the user acts.
      // To model surplus deployment, use the Surplus Deployment section in the Dashboard tab.
      investmentBalance = Math.max(0, investmentBalance * (1 + assumptions.investmentReturn / 100) - drawdownAmount);
      realEstateValue = realEstateValue * (1 + assumptions.realEstateAppreciation / 100);
      otherAssetValue = otherAssetValue * (1 + (assumptions.otherAssetGrowth || 0) / 100);

    }

    // Attach exhaustionAge to the array so charts can reference it directly
    data.exhaustionAge = exhaustionAge;
    return data;
  }, [profile, assets, liabilities, income, expenses, expenseCalculator, expenseGrowthRates, expenseTags, expensePhaseOutYears, retExpensePhaseOutYears, retirementBudget, retExpenseGrowthRates, assumptions, oneTimeExpenses]);
  
  const retirementMetrics = useMemo(() => {
    const retirementData = wealthProjection.find(d => d.age === profile.retirementAge);
    const yearsInRetirement = profile.lifeExpectancy - profile.retirementAge;
    
    if (!retirementData) return null;
    
    const portfolioAssets = {
      investments: retirementData.investments,
    };

    const currentYear = new Date().getFullYear();
    const retirementCalYear = currentYear + (profile.retirementAge - profile.currentAge);
    // Pre-inflate post-retirement OTEs using two-segment logic so Monte Carlo uses nominal amounts
    // Amounts are in today's terms — inflated from currentYear forward.
    // Expand recurring OTEs into per-year entries for Monte Carlo.
    // A recurring OTE (endYear set) is split into one entry per year it overlaps retirement.
    const postRetirementOneTimers = [];
    oneTimeExpenses.forEach(function(e) {
      const effectiveEnd = e.endYear || e.year;
      if (effectiveEnd < retirementCalYear) return; // fully pre-retirement, skip
      const cat = e.category && e.category !== 'none' ? e.category : null;
      const preRate = cat ? ((expenseGrowthRates[cat] || 0) / 100) : 0;
      const retRate = cat ? ((retExpenseGrowthRates[cat] || 0) / 100) : 0;
      const startYear = Math.max(e.year, retirementCalYear);
      const yearsToRet = retirementCalYear - currentYear;
      for (let yr = startYear; yr <= effectiveEnd; yr++) {
        const yearsIntoRet = yr - retirementCalYear;
        // Two-segment from today: inflate at preRate to retirement, then retRate into retirement
        const nominalAmount = e.amount * Math.pow(1 + preRate, yearsToRet) * Math.pow(1 + retRate, Math.max(0, yearsIntoRet));
        postRetirementOneTimers.push(Object.assign({}, e, { year: yr, amount: Math.round(nominalAmount) }));
      }
    });
    
    const successProbability = runMonteCarloSimulation(
      portfolioAssets,
      yearsInRetirement,
      0,
      assumptions,
      0, // annualWithdrawal fallback — not used when phaseOutSchedule is provided
      postRetirementOneTimers,
      retirementCalYear,
      {
        retExpensePhaseOutYears,
        retirementBudget,
        retExpenseGrowthRates,
        yearsToRetirement: profile.retirementAge - profile.currentAge,
        expenseCategories: expenseCategories,
        passiveIncomeSchedule: {
          passiveItems:  income.passiveItems && income.passiveItems.length > 0 ? income.passiveItems : null,
          otherItems:    income.otherIncomeItems && income.otherIncomeItems.length > 0 ? income.otherIncomeItems : null,
          passive:       income.passive || 0,
          other:         income.other   || 0,
          passiveGrowth: (assumptions.passiveGrowth      || 0) / 100,
          otherGrowth:   (assumptions.otherIncomeGrowth  || 0) / 100,
          retirementCalYear: retirementCalYear,
        },
      }
    );
    
    return {
      retirementWealth: retirementData.investments,
      successProbability,
      yearsToRetirement: profile.retirementAge - profile.currentAge,
    };
  }, [wealthProjection, profile, expenses, assumptions, oneTimeExpenses, retExpensePhaseOutYears, retirementBudget, retExpenseGrowthRates, expenseCategories]);
  
  // Wealth milestones - calculated in USD (global standard)
  const wealthMilestones = useMemo(() => {
    const usdRate = exchangeRates.USD;
    const milestones = [];
    const thresholds = WEALTH_MILESTONES_USD;
    
    thresholds.forEach(thresholdUSD => {
      const thresholdAED = thresholdUSD * usdRate;
      const data = wealthProjection.find(d => d.netWorth >= thresholdAED);
      if (data) {
        milestones.push({ 
          year: data.year, 
          age: data.age, 
          thresholdUSD,
          thresholdAED,
          label: `$${thresholdUSD >= 1000000 ? thresholdUSD/1000000 + 'M' : thresholdUSD/1000 + 'K'}`
        });
      }
    });
    
    return milestones;
  }, [wealthProjection, exchangeRates]);
  
  // Legacy support - first million in USD
  const millionaireYear = wealthMilestones.find(m => m.thresholdUSD === 1000000) || null;

  const fiAge = useMemo(function() {
    const swrDecimal = nestEggSwr / 100;
    if (swrDecimal <= 0 || effectiveRetirementExpense <= 0) return null;
    const currentYear = new Date().getFullYear();
    const retirementCalYear = currentYear + (profile.retirementAge - profile.currentAge);
    // Per-year threshold: each year uses its own nominal expense level, not a fixed
    // retirement-day target. getRetNominalForYear returns 0 pre-retirement, so
    // we use a pre-retirement expense proxy for those years.
    for (let i = 0; i < wealthProjection.length; i++) {
      const d = wealthProjection[i];
      const calYear = currentYear + (d.age - profile.currentAge);
      let nominalExpense;
      if (calYear < retirementCalYear) {
        const yearsAhead = d.age - profile.currentAge;
        nominalExpense = expenseCategories.reduce(function(s, cat) {
          const po = retExpensePhaseOutYears[cat.key];
          if (po && calYear >= po) return s;
          const base = retirementBudget[cat.key] || 0;
          const rate = (retExpenseGrowthRates[cat.key] || 0) / 100;
          return s + base * Math.pow(1 + rate, yearsAhead);
        }, 0);
      } else {
        nominalExpense = getRetNominalForYear(calYear);
      }
      if (nominalExpense <= 0) continue;
      const requiredPortfolio = nominalExpense / swrDecimal;
      if (d.investments >= requiredPortfolio) return d.age;
    }
    return null;
  }, [wealthProjection, nestEggSwr, retirementBudget, retExpenseGrowthRates, retExpensePhaseOutYears, expenseCategories, profile.retirementAge, profile.currentAge]);

  const debtFreeAge = useMemo(function() {
    const totalDebt = (liabilities.mortgage || 0) + (liabilities.loans || 0) + (liabilities.other || 0);
    if (totalDebt <= 0) return null; // already debt-free
    const hit = wealthProjection.find(function(d) { return d.totalLiabilities === 0; });
    return hit ? hit.age : null;
  }, [wealthProjection, liabilities]);

  const getMilestoneEvents = () => {
    const currentYear = new Date().getFullYear();
    const events = [
      { age: profile.retirementAge, label: 'Retirement', color: MILESTONE_COLORS.retirement.color, type: 'retirement' },
    ];
    
    // Add debt-free milestone if applicable
    if (debtFreeAge) {
      events.push({
        age: debtFreeAge,
        label: 'Debt Free',
        color: '#34d399',
        type: 'milestone',
        fullLabel: 'Debt Free'
      });
    }
    
    // Add all wealth milestones
    wealthMilestones.forEach(milestone => {
      events.push({ 
        age: milestone.age, 
        label: milestone.label, 
        color: MILESTONE_COLORS.milestone.color, 
        type: 'milestone',
        fullLabel: `Net Worth ${milestone.label} USD`
      });
    });
    
    // Derive age from year dynamically to stay in sync with profile.currentAge
    lifeEvents.forEach(event => {
      const derivedAge = profile.currentAge + (event.year - currentYear);
      if (derivedAge >= profile.currentAge && derivedAge <= profile.lifeExpectancy) {
        events.push({ 
          age: derivedAge, 
          label: event.description.length > 15 ? event.description.substring(0, 13) + '..' : event.description, 
          color: MILESTONE_COLORS.life.color, 
          type: 'life',
          fullEvent: event
        });
      }
    });
    
    // OTE expenses deliberately excluded from NW chart milestone events
    
    return events.sort((a, b) => a.age - b.age);
  };
  
  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const milestones = getMilestoneEvents();
    const allAtAge = milestones.filter(m => m.age === payload.age);
    
    // Prefer non-retirement events — retirement has its own vertical line
    const milestone = allAtAge.find(m => m.type !== 'retirement') || allAtAge[0];
    
    if (!milestone || milestone.type === 'retirement') return null;
    
    return (
      <circle 
        cx={cx} 
        cy={cy} 
        r={5} 
        fill={milestone.color}
        stroke="white"
        strokeWidth={2}
      />
    );
  };
  
  // Custom dot component for the cashflow chart showing milestones, life events, and single-year planned expenses
  const CustomDotExpenses = (props) => {
    const { cx, cy, payload } = props;
    const currentYear = new Date().getFullYear();
    const age = payload.age;
    const year = currentYear + (age - profile.currentAge);
    
    const wealthMilestone = wealthMilestones.find(m => m.age === age);
    const lifeEvent = lifeEvents.find(e => e.year === year);
    // Only single-year OTEs get dots; recurring OTEs (with endYear > year) are shown via band
    const singleYearOTE = oneTimeExpenses.find(e =>
      e.year === year && !(e.endYear && e.endYear > e.year)
    );
    
    // Composite dot: when milestone and life event coincide
    if (wealthMilestone && lifeEvent) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={7} fill="none" stroke="#34d399" strokeWidth={2.5} strokeOpacity={0.85} />
          <circle cx={cx} cy={cy} r={4} fill="#60a5fa" stroke="white" strokeWidth={1.5} />
        </g>
      );
    }
    // Composite: milestone + single-year OTE
    if (wealthMilestone && singleYearOTE) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={7} fill="none" stroke="#34d399" strokeWidth={2.5} strokeOpacity={0.85} />
          <circle cx={cx} cy={cy} r={4} fill="#f59e0b" stroke="white" strokeWidth={1.5} />
        </g>
      );
    }
    if (lifeEvent && singleYearOTE) {
      return (
        <g>
          <circle cx={cx} cy={cy} r={7} fill="none" stroke="#60a5fa" strokeWidth={2.5} strokeOpacity={0.85} />
          <circle cx={cx} cy={cy} r={4} fill="#f59e0b" stroke="white" strokeWidth={1.5} />
        </g>
      );
    }
    if (wealthMilestone) {
      return <circle cx={cx} cy={cy} r={5} fill="#34d399" stroke="white" strokeWidth={2} />;
    }
    if (lifeEvent) {
      return <circle cx={cx} cy={cy} r={5} fill="#60a5fa" stroke="white" strokeWidth={2} />;
    }
    if (singleYearOTE) {
      return <circle cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="white" strokeWidth={2} />;
    }
    return null;
  };
  
  const toggleLine = (dataKey) => {
    setHiddenLines(prev => ({ ...prev, [dataKey]: !prev[dataKey] }));
  };
  
  // Fixed CustomLegend - always visible, updates on click
  const CustomLegend = ({ payload }) => {
    if (!payload) return null;
    
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        {payload.map((entry, index) => {
          const isHidden = hiddenLines[entry.dataKey];
          return (
            <div
              key={`legend-${index}`}
              onClick={() => toggleLine(entry.dataKey)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '6px',
                background: isHidden ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
                opacity: isHidden ? 0.4 : 1,
                transition: 'all 0.2s',
                border: `2px solid ${isHidden ? 'rgba(255, 255, 255, 0.1)' : entry.color}`,
              }}
            >
              <div style={{
                width: '20px',
                height: '3px',
                background: entry.color,
                borderRadius: '2px',
              }} />
              <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: isHidden ? 400 : 600 }}>{entry.value}</span>
            </div>
          );
        })}
      </div>
    );
  };
  
  // Milestone legend
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: '#e8e9ed', minHeight: '100vh', background: 'linear-gradient(135deg, #0a1628 0%, #1a2840 50%, #0f1e36 100%)', padding: '2rem' }}>
      <TooltipLayer />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=JetBrains+Mono:wght@400;600&display=swap');
        
        input:focus {
          outline: none;
          border-color: #60a5fa !important;
          background: rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1) !important;
        }
        
        .recharts-text {
          fill: #9ca3af;
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.75rem;
        }
        
        .recharts-reference-line-label text {
          fill: inherit !important;
          font-weight: 600;
          font-size: 0.7rem;
        }

        .cat-label-hover:hover .cat-edit-icon,
        .cat-row-hover:hover .cat-edit-icon {
          opacity: 1 !important;
        }
        

      `}</style>
      
      <div style={{ maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              background: 'linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              marginBottom: '0.25rem',
            }}>
              NetWorth Navigator
            </h1>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Compact menu button */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setRibbonMenuOpen(prev => !prev)}
                style={{
                  padding: '0.5rem 0.9rem',
                  background: ribbonMenuOpen ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.06)',
                  border: `1px solid ${ribbonMenuOpen ? 'rgba(96,165,250,0.4)' : 'rgba(255,255,255,0.15)'}`,
                  color: '#9ca3af',
                  cursor: 'pointer',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  lineHeight: 1,
                }}
                title="Data & Settings"
              >
                ⋯
              </button>
              {ribbonMenuOpen && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setRibbonMenuOpen(false)} />
                  <div style={{
                    position: 'absolute', right: 0, top: '110%', zIndex: 9999,
                    background: '#0d1e35', border: '1px solid rgba(96,165,250,0.25)',
                    borderRadius: '12px', padding: '0.75rem', minWidth: '210px',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  }}>
                    <div style={{ fontSize: '0.65rem', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>Data</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.15rem' }}>
                      <button onClick={() => { exportData(); setRibbonMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, padding: '0.5rem 0.6rem', background: 'transparent', border: 'none', color: '#34d399', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', textAlign: 'left' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(52,211,153,0.1)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >📥 Export JSON</button>
                      <InfoTooltip text="Saves your entire plan — all inputs, categories, assumptions and projections — as a single JSON file. Use this to back up your data or transfer it to another device. Load it back with Import JSON." />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.15rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, padding: '0.5rem 0.6rem', background: 'transparent', color: '#60a5fa', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', boxSizing: 'border-box' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(96,165,250,0.1)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >📤 Import JSON
                        <input type="file" accept=".json" onChange={(e) => { importData(e); setRibbonMenuOpen(false); }} style={{ display: 'none' }} />
                      </label>
                      <InfoTooltip text="Restores a previously exported JSON file. This will overwrite all current data with the saved snapshot — income, expenses, assets, liabilities, assumptions and projections. Best used to reload a backup or continue a session started on another device." />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.15rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, padding: '0.5rem 0.6rem', background: 'transparent', color: '#fb923c', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', boxSizing: 'border-box' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(251,146,60,0.1)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >📊 Import Expenses CSV
                        <input type="file" accept=".csv" onChange={(e) => { importExpensesCSV(e); setRibbonMenuOpen(false); }} style={{ display: 'none' }} />
                      </label>
                      <InfoTooltip text={'Import pre-retirement expense categories from a CSV file.\n\nRequired columns:\n• Category — the expense label (e.g. "Groceries")\n• Monthly Planning Budget (AED) — monthly budget amount in AED\n\nOptional columns:\n• Description — plain-text description; shown as the ⓘ tooltip next to each category in the Pre-Retirement and Retirement tabs\n• Expense Type — "Essential" or "Discretionary"; sets the E/D pill shown on each category. Defaults to Essential if the column is absent or the value is unrecognised.\n\nAll other columns are ignored. The first row containing both required column names is treated as the header. Amounts are multiplied by 12 to produce annual figures.\n\nImporting replaces all existing expense categories. Retirement amounts are pre-filled with the same values as a placeholder — adjust them in the Retirement tab. Growth rates default to 3%/yr.'} />
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '0.4rem 0' }} />
                    <div style={{ fontSize: '0.65rem', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>Reports</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '0.15rem' }}>
                      <button onClick={() => { exportHTMLReport(); setRibbonMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, padding: '0.5rem 0.6rem', background: 'transparent', border: 'none', color: '#a78bfa', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', textAlign: 'left' }}
                        onMouseOver={e => e.currentTarget.style.background = 'rgba(167,139,250,0.1)'}
                        onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                      >📄 Export Full Report</button>
                      <InfoTooltip text="Generates a self-contained HTML report of your full financial plan — net worth, projections, income, expenses, retirement scenarios and charts. The file can be saved locally, printed, or shared. No internet connection required to view it." />
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '0.4rem 0' }} />
                    <div style={{ fontSize: '0.65rem', color: '#4b5563', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.5rem', paddingLeft: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      Exchange Rate
                      <InfoTooltip text="Live rates update once daily from open.er-api.com. Green dot = live rates. Grey = fallback rates." />
                    </div>
                    <div style={{ padding: '0 0.25rem 0.5rem' }}>
                      <ExchangeRateInput currency={currency} exchangeRates={exchangeRates} setExchangeRates={setExchangeRates} fxStatus={fxStatus} />
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', margin: '0.4rem 0' }} />
                    <button onClick={() => { resetToDefaults(); setRibbonMenuOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%', padding: '0.5rem 0.6rem', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '6px', fontSize: '0.85rem', fontWeight: '600', textAlign: 'left' }}
                      onMouseOver={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >🔄 Reset to Defaults</button>
                  </div>
                </>
              )}
            </div>
            
            <div style={{ 
              display: 'flex', 
              gap: '0.25rem', 
              background: 'rgba(255, 255, 255, 0.05)', 
              padding: '0.25rem', 
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              {Object.keys(CURRENCIES).map(curr => (
                <button 
                  key={curr}
                  onClick={() => setCurrency(curr)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: currency === curr ? 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)' : 'transparent',
                    border: 'none',
                    color: currency === curr ? 'white' : '#9ca3af',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    boxShadow: currency === curr ? '0 4px 12px rgba(96, 165, 250, 0.3)' : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid rgba(255, 255, 255, 0.1)', marginBottom: '2rem' }}>
          {(() => {
            const TAB_LABELS = { profile: '👤 Profile', finances: '💼 Finances', preretirement: '💰 Pre-Retirement', retirement: '🏖️ Retirement', overview: '📊 Dashboard' };
            return ['profile', 'finances', 'preretirement', 'retirement', 'overview'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '1rem 2.5rem',
                  background: 'transparent',
                  border: 'none',
                  color: activeTab === tab ? '#60a5fa' : '#9ca3af',
                  cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  position: 'relative',
                  borderBottom: activeTab === tab ? '2px solid #60a5fa' : 'none',
                  marginBottom: '-2px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.3s',
                }}
              >
                {TAB_LABELS[tab]}
              </button>
            ));
          })()}
        </div>
        
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            {/* Key Metrics — 5-column single row */}
            <div style={{ fontSize: '0.6rem', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.45rem' }}>Key Metrics</div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', 
              gap: '1rem',
              marginBottom: '1.25rem'
            }}>
              {/* Net Worth */}
              <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', borderTop: '2px solid rgba(96,165,250,0.5)' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  💰 Net Worth <InfoTooltip text={TOOLTIPS.netWorth} />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: '#e8e9ed', lineHeight: 1.1, marginBottom: '0.35rem' }}>
                  {formatCurrency(currentNetWorth, currency, exchangeRates)}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#4b5563' }}>Total assets minus liabilities</div>
              </div>
            
              {/* Debt Free — promoted from strip to top row */}
              {debtFreeAge ? (
                <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', borderTop: '2px solid rgba(52,211,153,0.5)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    🔓 Debt Free <InfoTooltip text="The projected age when all your liabilities reach zero, based on the end years set on each liability item. Set end years on your mortgage and loans in the Finances tab." />
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: '#34d399', lineHeight: 1.1, marginBottom: '0.35rem' }}>Age {debtFreeAge}</div>
                  <div style={{ fontSize: '0.72rem', color: '#4b5563' }}>{debtFreeAge - profile.currentAge}y away · {new Date().getFullYear() + (debtFreeAge - profile.currentAge)}</div>
                </div>
              ) : (
                <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', borderTop: '2px solid rgba(107,114,128,0.3)' }}>
                  <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                    🔓 Debt Free <InfoTooltip text="The projected age when all your liabilities reach zero. Set end years on your mortgage and loans in the Finances tab to activate this." />
                  </div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: '#4b5563', lineHeight: 1.1, marginBottom: '0.35rem' }}>—</div>
                  <div style={{ fontSize: '0.72rem', color: '#4b5563' }}>Set liability end years to calculate</div>
                </div>
              )}
            
              {/* First $1M */}
              <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', borderTop: '2px solid rgba(52,211,153,0.5)' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  💰 First $1M USD
                </div>
                {millionaireYear ? (
                  <>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: '#34d399', lineHeight: 1.1, marginBottom: '0.35rem' }}>
                      {millionaireYear.year}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#4b5563' }}>Age {millionaireYear.age} · {formatCurrency(millionaireYear.thresholdAED, currency, exchangeRates)}</div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: '#4b5563', lineHeight: 1.1, marginBottom: '0.35rem' }}>—</div>
                    <div style={{ fontSize: '0.72rem', color: '#4b5563' }}>Not yet projected</div>
                  </>
                )}
              </div>

            
              {/* Years to Retirement */}
              <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', borderTop: '2px solid rgba(167,139,250,0.5)' }}>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  🎯 Planned Retirement <InfoTooltip text={TOOLTIPS.yearsToRetirement} />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: '#e8e9ed', lineHeight: 1.1, marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '1rem', fontWeight: '400', color: '#4b5563', marginRight: '0.3rem' }}>in</span>{profile.retirementAge - profile.currentAge}<span style={{ fontSize: '0.9rem', color: '#6b7280', fontFamily: 'system-ui', marginLeft: '0.3rem' }}>yrs</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#4b5563' }}>Target age {profile.retirementAge}</div>
                <div style={{ fontSize: '0.68rem', color: '#4b5563', marginTop: '0.15rem' }}>See Retirement Health for FI details</div>
              </div>

            
              {/* Retirement Health — merged: FI Age + Required SWR + Survival Odds + Exhaustion */}
              {(() => {
                const sp = retirementMetrics?.successProbability || 0;
                const retNominal = getRetNominalForYear(new Date().getFullYear() + (profile.retirementAge - profile.currentAge));
                const reqNestEgg = nestEggSwr > 0 ? retNominal / (nestEggSwr / 100) : 0;
                const projW = retirementMetrics?.retirementWealth || 0;
                const onTrack = projW >= reqNestEgg;
                const isStrong  = sp >= MC_STRONG_THRESHOLD && onTrack;
                const isCaution = !isStrong && (sp >= MC_CAUTION_THRESHOLD || onTrack);
                const survivalColor = isStrong ? '#22c55e' : isCaution ? '#eab308' : '#ef4444';
                const reqSwr = assets.investments > 0 ? (retNominal / assets.investments) * 100 : null;
                const reqSwrColor = reqSwr === null ? '#6b7280' : reqSwr <= nestEggSwr ? '#22c55e' : reqSwr <= nestEggSwr + 2 ? '#eab308' : '#ef4444';
                const exhaustionAge = wealthProjection.exhaustionAge;
                const exhaustionColor = exhaustionAge ? '#ef4444' : '#6b7280';
                const swrTooltip = `The withdrawal rate your current investments (${formatCurrency(assets.investments, currency, exchangeRates)}) would need to fund your full retirement budget today. Target is ${nestEggSwr}% or below — based on your SWR setting in the Retirement tab, which you can adjust. A higher SWR target makes FI easier to reach; a lower one requires a larger portfolio.`;
                const exhaustionTooltip = `Age at which your liquid investment portfolio runs to zero in the base scenario — when withdrawals outpace growth. Earlier exhaustion = lower survival odds. Address via higher savings, lower retirement spend, later retirement, or higher return assumption.`;
                const rowStyle = { display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center', columnGap: '0.5rem', marginBottom: '0.28rem' };
                const labelStyle = { fontSize: '0.67rem', color: '#6b7280', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', minWidth: 0, lineHeight: 1.2 };
                const valueStyle = (color) => ({ fontSize: '0.8rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color, whiteSpace: 'nowrap', textAlign: 'right', minWidth: '68px' });
                return (
                  <div style={{ background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '1.25rem', borderTop: '2px solid rgba(251,191,36,0.5)' }}>
                    {/* Card label */}
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                      🎯 Retirement Health <InfoTooltip text="Three signals: FI Age (earliest age investments can sustain retirement, based on SWR) · SWR Needed Today (withdrawal rate your current portfolio requires — green when you hit your target) · Runway Survival Odds (% of 1,000 simulated scenarios where money lasts to life expectancy — unaffected by SWR). Use all three together: FI Age as the target, Survival Odds as the verification." />
                    </div>

                    {/* FI Age — headline */}
                    <div style={{ marginBottom: '0.55rem' }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: fiAge ? '#fbbf24' : '#6b7280', lineHeight: 1.1 }}>
                        {fiAge ? `Age ${fiAge}` : '—'}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '0.15rem' }}>
                        {fiAge
                          ? (fiAge < profile.currentAge ? 'Already FI · confirm with Survival Odds' : fiAge <= profile.retirementAge ? `FI Age · ${profile.retirementAge - fiAge}y before planned retirement` : `FI Age · ${fiAge - profile.retirementAge}y after planned retirement · check Survival Odds`)
                          : 'FI Age · not reached'}
                      </div>
                    </div>

                    {/* Divider */}
                    <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '0.45rem' }} />

                    {/* SWR needed today */}
                    <div style={rowStyle}>
                      <span style={labelStyle}>SWR needed today <InfoTooltip text={swrTooltip} /></span>
                      <span style={valueStyle(reqSwrColor)}>{reqSwr !== null ? `${reqSwr.toFixed(1)}%` : '—'}</span>
                    </div>

                    {/* Survival odds */}
                    <div style={rowStyle}>
                      <span style={labelStyle}>Runway survival odds <InfoTooltip text="% of 1,000 simulated market scenarios where your portfolio still has money at life expectancy. Each scenario applies a random return (your assumed return ± volatility) then withdraws inflation-adjusted expenses, respecting phase-outs. The most reliable retirement signal — NOT affected by SWR. Above 80% = strong · 60–80% = caution · below 60% = high risk." /></span>
                      <span style={valueStyle(survivalColor)}>{Math.round(sp)}%</span>
                    </div>

                    {/* Investments exhausted at */}
                    <div style={{ ...rowStyle, marginBottom: 0 }}>
                      <span style={labelStyle}>Investments exhausted at <InfoTooltip text={exhaustionTooltip} /></span>
                      <span style={valueStyle(exhaustionColor)}>{exhaustionAge ? `Age ${exhaustionAge}` : '—'}</span>
                    </div>
                  </div>
                );
              })()}

            </div>
            
            {/* ── Financial Health Benchmarking Strip ── */}
            {(() => {
              const _ta = (assets.cash || 0) + (assets.investments || 0) + (assets.realEstate || 0) + (assets.other || 0);
              const _tl = (liabilities.mortgage || 0) + (liabilities.loans || 0) + (liabilities.other || 0);

              // 1. Savings Rate
              const srVal  = savingsRate;
              const srColor = srVal >= 20 ? '#22c55e' : srVal >= 10 ? '#eab308' : '#ef4444';
              const srBg    = srVal >= 20 ? 'rgba(34,197,94,0.07)' : srVal >= 10 ? 'rgba(234,179,8,0.07)' : 'rgba(239,68,68,0.07)';
              const srBdr   = srVal >= 20 ? 'rgba(34,197,94,0.2)'  : srVal >= 10 ? 'rgba(234,179,8,0.2)'  : 'rgba(239,68,68,0.2)';

              // 2. NW Multiple (Fidelity benchmark vs salary)
              // Fidelity age brackets: 30→1×, 40→3×, 55→7×, retirementAge→10×
              // Interpolate linearly between brackets for target at current age.
              const sal = income.salary || 0;
              let nwMultiple = null;
              let nwTarget   = null;
              let nwColor    = '#6b7280';
              let nwBg       = 'rgba(107,114,128,0.07)';
              let nwBdr      = 'rgba(107,114,128,0.2)';
              if (sal > 0) {
                nwMultiple = currentNetWorth / sal;
                const brackets = [
                  { age: 30,                       target: 1  },
                  { age: 40,                       target: 3  },
                  { age: 55,                       target: 7  },
                  { age: profile.retirementAge,    target: 10 },
                ];
                // Find target for currentAge by linear interpolation
                const age = profile.currentAge;
                let target;
                if (age <= 30) {
                  target = 1 * (age / 30);  // linear from 0 at birth to 1× at 30
                } else if (age >= profile.retirementAge) {
                  target = 10;
                } else {
                  // Find surrounding brackets
                  let lo = brackets[0], hi = brackets[brackets.length - 1];
                  for (let b = 0; b < brackets.length - 1; b++) {
                    if (age >= brackets[b].age && age <= brackets[b + 1].age) {
                      lo = brackets[b]; hi = brackets[b + 1]; break;
                    }
                  }
                  const t = (age - lo.age) / (hi.age - lo.age);
                  target = lo.target + t * (hi.target - lo.target);
                }
                nwTarget = target;
                const ratio = nwMultiple / target;
                nwColor = ratio >= 1 ? '#22c55e' : ratio >= 0.75 ? '#eab308' : '#ef4444';
                nwBg    = ratio >= 1 ? 'rgba(34,197,94,0.07)' : ratio >= 0.75 ? 'rgba(234,179,8,0.07)' : 'rgba(239,68,68,0.07)';
                nwBdr   = ratio >= 1 ? 'rgba(34,197,94,0.2)'  : ratio >= 0.75 ? 'rgba(234,179,8,0.2)'  : 'rgba(239,68,68,0.2)';
              }

              // 3. Debt Ratio
              const drVal   = _ta > 0 ? (_tl / _ta) * 100 : null;
              const drColor = drVal === null ? '#6b7280' : drVal < 30 ? '#22c55e' : drVal < 50 ? '#eab308' : '#ef4444';
              const drBg    = drVal === null ? 'rgba(107,114,128,0.07)' : drVal < 30 ? 'rgba(34,197,94,0.07)' : drVal < 50 ? 'rgba(234,179,8,0.07)' : 'rgba(239,68,68,0.07)';
              const drBdr   = drVal === null ? 'rgba(107,114,128,0.2)'  : drVal < 30 ? 'rgba(34,197,94,0.2)'  : drVal < 50 ? 'rgba(234,179,8,0.2)'  : 'rgba(239,68,68,0.2)';

              // 4. Emergency Fund (months of current expenses covered by cash)
              const monthlyExp = (expenses.current || 0) / 12;
              const efMonths   = monthlyExp > 0 ? (assets.cash || 0) / monthlyExp : null;
              const efColor    = efMonths === null ? '#6b7280' : efMonths >= 6 ? '#22c55e' : efMonths >= 3 ? '#eab308' : '#ef4444';
              const efBg       = efMonths === null ? 'rgba(107,114,128,0.07)' : efMonths >= 6 ? 'rgba(34,197,94,0.07)' : efMonths >= 3 ? 'rgba(234,179,8,0.07)' : 'rgba(239,68,68,0.07)';
              const efBdr      = efMonths === null ? 'rgba(107,114,128,0.2)'  : efMonths >= 6 ? 'rgba(34,197,94,0.2)'  : efMonths >= 3 ? 'rgba(234,179,8,0.2)'  : 'rgba(239,68,68,0.2)';

              // 5. Investment Mix (investments as % of total assets)
              const imVal   = _ta > 0 ? (assets.investments / _ta) * 100 : null;
              const imColor = imVal === null ? '#6b7280' : imVal >= 40 ? '#22c55e' : imVal >= 20 ? '#eab308' : '#ef4444';
              const imBg    = imVal === null ? 'rgba(107,114,128,0.07)' : imVal >= 40 ? 'rgba(34,197,94,0.07)' : imVal >= 20 ? 'rgba(234,179,8,0.07)' : 'rgba(239,68,68,0.07)';
              const imBdr   = imVal === null ? 'rgba(107,114,128,0.2)'  : imVal >= 40 ? 'rgba(34,197,94,0.2)'  : imVal >= 20 ? 'rgba(234,179,8,0.2)'  : 'rgba(239,68,68,0.2)';

              // 6. Retirement Funding (projected investments at retirement vs required nest egg)
              const _retNominal   = getRetNominalForYear(new Date().getFullYear() + (profile.retirementAge - profile.currentAge));
              const _reqNestEgg   = nestEggSwr > 0 ? _retNominal / (nestEggSwr / 100) : 0;
              const _projW        = retirementMetrics?.retirementWealth || 0;
              const rfVal         = _reqNestEgg > 0 ? (_projW / _reqNestEgg) * 100 : null;
              const rfColor       = rfVal === null ? '#6b7280' : rfVal >= 100 ? '#22c55e' : rfVal >= 85 ? '#34d399' : rfVal >= 50 ? '#eab308' : '#ef4444';
              const rfBg          = rfVal === null ? 'rgba(107,114,128,0.07)' : rfVal >= 85 ? 'rgba(34,197,94,0.07)' : rfVal >= 50 ? 'rgba(234,179,8,0.07)' : 'rgba(239,68,68,0.07)';
              const rfBdr         = rfVal === null ? 'rgba(107,114,128,0.2)'  : rfVal >= 85 ? 'rgba(34,197,94,0.2)'  : rfVal >= 50 ? 'rgba(234,179,8,0.2)'  : 'rgba(239,68,68,0.2)';

              // 7. Income Replacement Ratio
              // Retirement spending power (what you plan to spend) / pre-retirement income
              // Both in today's terms to avoid apples-to-oranges comparison.
              // effectiveRetirementExpense = sum of retirement budget in today's dollars.
              // annualIncome = current annual income (salary + passive + other).
              const preRetIncome  = annualIncome;
              const irrVal   = preRetIncome > 0 && effectiveRetirementExpense > 0 ? (effectiveRetirementExpense / preRetIncome) * 100 : null;
              const irrColor = irrVal === null ? '#6b7280' : irrVal >= 80 && irrVal <= 120 ? '#22c55e' : irrVal > 120 ? '#eab308' : irrVal >= 70 ? '#eab308' : '#ef4444';
              const irrBg    = irrVal === null ? 'rgba(107,114,128,0.07)' : irrVal >= 80 && irrVal <= 120 ? 'rgba(34,197,94,0.07)' : irrVal > 120 ? 'rgba(234,179,8,0.07)' : irrVal >= 70 ? 'rgba(234,179,8,0.07)' : 'rgba(239,68,68,0.07)';
              const irrBdr   = irrVal === null ? 'rgba(107,114,128,0.2)'  : irrVal >= 80 && irrVal <= 120 ? 'rgba(34,197,94,0.2)'  : irrVal > 120 ? 'rgba(234,179,8,0.2)'  : irrVal >= 70 ? 'rgba(234,179,8,0.2)'  : 'rgba(239,68,68,0.2)';

              const tileStyle = (bg, bdr) => ({
                padding: '0.55rem 0.9rem',
                background: bg, border: `1px solid ${bdr}`, borderRadius: '10px',
                flex: '1 1 0', minWidth: '120px',
              });
              const labelStyle = { fontSize: '0.6rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.25rem' };
              const valueStyle = (color) => ({ fontSize: '1rem', fontWeight: '700', color, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 });

              return (
                <div style={{ marginBottom: '1.25rem' }}>
                  <div style={{ fontSize: '0.6rem', color: '#4b5563', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.45rem' }}>Financial Health</div>
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>

                  {/* 1. Savings Rate */}
                  <div style={tileStyle(srBg, srBdr)}>
                    <div>
                      <div style={labelStyle}>💰 Savings Rate <InfoTooltip text={`Annual savings ÷ gross income. Savings = income minus current expenses (${formatCurrency(annualSavings, currency, exchangeRates)}/yr undeployed surplus). Target: below 10% = at risk · 10–20% = adequate · 20%+ = wealth-building pace. Higher rates compress the time to retirement significantly. Use Surplus Deployment in the Dashboard tab to model putting this to work.`} /></div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                        <span style={valueStyle(srColor)}>{srVal.toFixed(1)}%</span>
                        <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>{formatCurrency(annualSavings, currency, exchangeRates)}/yr</span>
                      </div>
                    </div>
                  </div>

                  {/* 2. NW Multiple */}
                  <div style={tileStyle(nwBg, nwBdr)}>
                    <div>
                      <div style={labelStyle}>📈 NW Multiple <InfoTooltip text={`Net worth divided by annual salary — the Fidelity age-based benchmark. Targets: 1× by 30 · 3× by 40 · 7× by 55 · 10× by retirement. Your current target at age ${profile.currentAge} is ${nwTarget !== null ? nwTarget.toFixed(1) : '—'}×. Colour shows how close you are: green = at or above target · amber = 75–99% of target · red = below 75%. Excludes passive/other income — salary is the standard Fidelity denominator.`} /></div>
                      {nwMultiple !== null
                        ? <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                            <span style={valueStyle(nwColor)}>{nwMultiple.toFixed(1)}×</span>
                            <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>target {nwTarget !== null ? nwTarget.toFixed(1) : '—'}×</span>
                          </div>
                        : <span style={valueStyle('#6b7280')}>—</span>
                      }
                    </div>
                  </div>

                  {/* 3. Debt Ratio */}
                  <div style={tileStyle(drBg, drBdr)}>
                    <div>
                      <div style={labelStyle}>📉 Debt Ratio <InfoTooltip text={`Total liabilities ÷ total assets. Measures how leveraged your balance sheet is. Below 30% = healthy · 30–50% = moderate, watch trajectory · above 50% = high leverage, prioritise debt reduction. A high ratio limits financial flexibility and amplifies losses if asset values fall. Mortgage debt is common at earlier life stages — the trend matters as much as the level.`} /></div>
                      {drVal !== null
                        ? <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                            <span style={valueStyle(drColor)}>{drVal.toFixed(1)}%</span>
                            {debtFreeAge && <span style={{ fontSize: '0.6rem', color: '#6b7280', marginLeft: '0.2rem' }}>· free at {debtFreeAge}</span>}
                          </div>
                        : <span style={valueStyle('#6b7280')}>—</span>
                      }
                    </div>
                  </div>

                  {/* 4. Emergency Fund */}
                  <div style={tileStyle(efBg, efBdr)}>
                    <div>
                      <div style={labelStyle}>🛡️ Emergency Fund <InfoTooltip text={`Cash ÷ monthly expenses = months of runway if income stopped today. Standard guidance: 3 months minimum · 6 months recommended · more if you have variable income, dependants, or work in a cyclical industry. Cash above 6 months may be better deployed — excess idle cash loses real value to inflation.`} /></div>
                      {efMonths !== null
                        ? <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                            <span style={valueStyle(efColor)}>{efMonths.toFixed(1)}<span style={{ fontSize: '0.65rem', fontWeight: 500, marginLeft: '0.15rem' }}>mo</span></span>
                          </div>
                        : <span style={valueStyle('#6b7280')}>—</span>
                      }
                    </div>
                  </div>

                  {/* 5. Investment Mix */}
                  <div style={tileStyle(imBg, imBdr)}>
                    <div>
                      <div style={labelStyle}>📊 Investment Mix <InfoTooltip text={`Liquid investments (stocks, ETFs, bonds, funds) as % of total assets. Below 20% = low liquid exposure, compounding is limited · 20–40% = moderate · 40%+ = well-positioned for long-term growth. A high real estate or cash concentration limits compounding potential. Only investments count toward your SWR nest egg target — so this ratio directly affects retirement funding.`} /></div>
                      {imVal !== null
                        ? <span style={valueStyle(imColor)}>{imVal.toFixed(1)}%</span>
                        : <span style={valueStyle('#6b7280')}>—</span>
                      }
                    </div>
                  </div>

                  {/* 6. Retirement Funding */}
                  <div style={tileStyle(rfBg, rfBdr)}>
                    <div>
                      <div style={labelStyle}>🎯 Retirement Funding <InfoTooltip text={`Projected investments at retirement ÷ Required Nest Egg (same Q1 calc in the Retirement tab). Shows how far along you are toward the nest egg target. Below 50% = significant gap · 50–85% = on a reasonable path · 85%+ = approaching target · 100%+ = on track. Denominator uses retirement-day budget ÷ SWR — adjust both in the Retirement tab. Does not include surplus deployment; model that in the Dashboard tab.`} /></div>
                      {rfVal !== null
                        ? <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                            <span style={valueStyle(rfColor)}>{Math.min(rfVal, 999).toFixed(0)}%</span>
                            {rfVal >= 100 && <span style={{ fontSize: '0.6rem', color: '#22c55e' }}>✓ on track</span>}
                          </div>
                        : <span style={valueStyle('#6b7280')}>—</span>
                      }
                    </div>
                  </div>

                  {/* 7. Income Replacement Ratio */}
                  <div style={tileStyle(irrBg, irrBdr)}>
                    <div>
                      <div style={labelStyle}>🔄 Income Replacement <InfoTooltip text={`How much of your pre-retirement income your retirement plan replaces. Calculated as: retirement budget (today's terms) ÷ current annual income — both in today's dollars for a like-for-like comparison. Thresholds: 80–120% = strong fit · 70–79% = caution (lean replacement) · above 120% = retirement costs exceed current income · below 70% = lifestyle gap risk.`} /></div>
                      {irrVal !== null
                        ? <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem' }}>
                            <span style={valueStyle(irrColor)}>{Math.round(irrVal)}%</span>
                            <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>of pre-ret income</span>
                          </div>
                        : <span style={valueStyle('#6b7280')}>—</span>
                      }
                    </div>
                  </div>

                  </div>
                </div>
              );
            })()}

            {/* Net Worth Chart */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem',
              position: 'relative',
              zIndex: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '600', display: 'flex', alignItems: 'center', margin: 0 }}>
                  Net Worth Over Time
                  <InfoTooltip text={`${TOOLTIPS.netWorth}${assumptions.enableDrawdown ? ' · Drawdown mode is active: post-retirement, your investment balance is drawn down each year by your inflation-adjusted retirement expenses. Real estate and other assets continue to grow passively and are not drawn from.' : ''}`} />
                </h3>
                {assumptions.enableDrawdown && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '20px', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.4)', fontSize: '0.75rem', fontWeight: '600', color: '#a78bfa' }}>
                    📉 Drawdown Active
                  </div>
                )}
              </div>
              <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                Your wealth trajectory from age {profile.currentAge} to {profile.lifeExpectancy}
              </p>
              <p style={{ fontSize: '0.78rem', color: '#4b5563', marginBottom: '1.25rem' }}>
                ⚠ Pre-retirement savings are not auto-deployed — asset growth only. See Surplus Deployment below to model investing your surplus.
              </p>
              <ResponsiveContainer width="100%" height={450} style={{ overflow: 'visible' }}>
                <AreaChart data={wealthProjection} margin={{ top: 40, right: 20, bottom: 20, left: 20 }}>
                  <defs>
                    <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="age" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => formatCurrency(value, currency, exchangeRates)} />
                  <Tooltip
                    wrapperStyle={{ zIndex: 9999 }}
                    contentStyle={{ background: 'rgba(10,22,40,0.96)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '10px', backdropFilter: 'blur(8px)', color: '#e8e9ed', padding: '0.75rem 1rem' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const pt = wealthProjection.find(d => d.age === label);
                      const currentYear = new Date().getFullYear();
                      const year = pt?.year ?? (currentYear + (label - profile.currentAge));
                      const wealthMilestone = wealthMilestones.find(m => m.age === label);
                      const lifeEvent = lifeEvents.find(e => e.year === year);

                      const isDebtFree = debtFreeAge === label;
                      return (
                        <div style={{ minWidth: '210px' }}>
                          <div style={{ fontWeight: '700', color: '#e8e9ed', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.35rem' }}>
                            {year} (Age {label})
                            {wealthMilestone && <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'block', marginTop: '0.15rem' }}>💰 {wealthMilestone.label} USD</span>}
                            {isDebtFree && <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'block', marginTop: '0.15rem' }}>🔓 Debt Free</span>}
                            {lifeEvent && <span style={{ fontSize: '0.7rem', color: '#60a5fa', display: 'block', marginTop: '0.15rem' }}>🔵 {lifeEvent.description}</span>}
                            
                          </div>
                          {payload.map((p, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.35rem', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color || '#60a5fa', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.82rem', color: '#e8e9ed', fontWeight: '700' }}>Net Worth</span>
                              </div>
                              <span style={{ fontSize: '0.88rem', color: '#e8e9ed', fontFamily: 'monospace', fontWeight: '700' }}>{formatCurrencyDecimal(p.value, currency, exchangeRates)}</span>
                            </div>
                          ))}
                          {/* Assets — total + liquid/illiquid split */}
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '0.2rem', paddingTop: '0.4rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.62rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Assets</span>
                              <span style={{ fontSize: '0.75rem', color: '#34d399', fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrencyDecimal((pt && pt.totalAssets) || 0, currency, exchangeRates)}</span>
                            </div>
                            {(() => {
                              const liquid = ((pt && pt.investments) || 0) + ((pt && pt.cash) || 0);
                              const illiquid = ((pt && pt.realEstate) || 0) + ((pt && pt.other) || 0);
                              const total = (pt && pt.totalAssets) || 0;
                              if (total === 0) return null;
                              const liquidPct = Math.round((liquid / total) * 100);
                              const illiquidPct = 100 - liquidPct;
                              return (
                                <div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#6b7280', marginBottom: '0.05rem' }}>
                                    <span>↳ Liquid {liquidPct}%</span>
                                    <span style={{ fontFamily: 'monospace' }}>{formatCurrencyDecimal(liquid, currency, exchangeRates)}</span>
                                  </div>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#6b7280' }}>
                                    <span>↳ Illiquid {illiquidPct}%</span>
                                    <span style={{ fontFamily: 'monospace' }}>{formatCurrencyDecimal(illiquid, currency, exchangeRates)}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          {/* Liabilities — total only */}
                          {(pt && pt.totalLiabilities > 0) && (
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', marginTop: '0.35rem', paddingTop: '0.4rem' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                <span style={{ fontSize: '0.62rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Liabilities</span>
                                <span style={{ fontSize: '0.75rem', color: '#f87171', fontFamily: 'monospace', fontWeight: 600 }}>{formatCurrencyDecimal(pt.totalLiabilities, currency, exchangeRates)}</span>
                              </div>
                              <div style={{ fontSize: '0.6rem', color: '#4b5563' }}>Balances amortised linearly to end year</div>
                            </div>
                          )}
                          {/* Savings — pre-retirement only */}
                          {label < profile.retirementAge && pt && (() => {
                            const surplus = (pt.income || 0) - (pt.expenses || 0);
                            const savRate = pt.income > 0 ? ((surplus / pt.income) * 100).toFixed(1) : null;
                            const surplusColor = surplus >= 0 ? '#34d399' : '#f87171';
                            return (
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '0.35rem', paddingTop: '0.3rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.62rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Savings</span>
                                  <span style={{ fontSize: '0.72rem', color: surplusColor, fontFamily: 'monospace', fontWeight: 600 }}>
                                    {surplus >= 0 ? '+' : ''}{formatCurrencyDecimal(Math.round(surplus), currency, exchangeRates)}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#4b5563', marginTop: '0.15rem' }}>
                                  {surplus >= 0
                                    ? `Surplus · income exceeds expenses${savRate !== null ? ` · ${savRate}% of income saved` : ''}`
                                    : `Shortfall · expenses exceed income${savRate !== null ? ` · ${Math.abs(Number(savRate))}% overspend` : ''}`}
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    }}
                  />
                  
                  {/* Retirement marker */}
                  <ReferenceLine
                    x={profile.retirementAge}
                    stroke="#a78bfa" strokeDasharray="3 3" strokeWidth={2}
                    label={(props) => <RotatedRefLabel {...props} value="Retirement" fill="#a78bfa" />}
                  />
                  {/* Portfolio Exhaustion marker */}
                  {wealthProjection.exhaustionAge && (
                    <ReferenceLine
                      x={wealthProjection.exhaustionAge}
                      stroke="#f87171" strokeDasharray="4 3" strokeWidth={2}
                      label={(props) => <RotatedRefLabel {...props} value="Exhausted" fill="#f87171" />}
                    />
                  )}
                  {/* FI Age marker */}
                  {fiAge && (
                    <ReferenceLine
                      x={fiAge}
                      stroke="#fbbf24" strokeDasharray="5 3" strokeWidth={2}
                      label={(props) => <RotatedRefLabel {...props} value="FI Age" fill="#fbbf24" offsetX={fiAge === profile.retirementAge ? 18 : 0} />}
                    />
                  )}
                  
                  <Area 
                    type="monotone" 
                    dataKey="netWorth" 
                    stroke="#60a5fa" 
                    strokeWidth={2}
                    fill="url(#netWorthGradient)"
                    dot={<CustomDot />}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <MilestoneLegend />
            </div>

            {/* Asset Charts Grid - 2 Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '1.5rem', marginBottom: '2rem' }}>
              
              {/* Left: Asset Allocation Pie Chart */}
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '1.5rem', position: 'relative', zIndex: 10 }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>🏦 Current Asset Allocation</h3>
                  <p style={{ fontSize: '0.85rem', color: '#9ca3af', margin: 0 }}>
                    {formatCurrency((assets.cash || 0) + (assets.investments || 0) + (assets.realEstate || 0) + (assets.other || 0), currency, exchangeRates)} in assets
                  </p>
                </div>
                <div style={{ position: 'relative', width: '100%', height: 340 }}>
                <div style={{ position: 'absolute', top: '152px', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
                  <div style={{ fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, marginBottom: '3px' }}>Total Assets</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#e8e9ed', fontFamily: 'monospace', lineHeight: 1 }}>{formatCurrency((assets.cash||0)+(assets.investments||0)+(assets.realEstate||0)+(assets.other||0), currency, exchangeRates)}</div>
                </div>
                <ResponsiveContainer width="100%" height={340} style={{ overflow: 'visible' }}>
                <PieChart>
                  <Pie
                    data={ASSET_TYPES.map(t => ({ name: t.name, value: assets[t.key] || 0, color: t.color }))}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => {
                      const total = (assets.cash || 0) + (assets.investments || 0) + (assets.realEstate || 0) + (assets.other || 0);
                      const percent = ((entry.value / total) * 100).toFixed(1);
                      return `${entry.name}: ${percent}%`;
                    }}
                    outerRadius={110}
                    innerRadius={82}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {ASSET_TYPES.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperStyle={{ zIndex: 9999 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0];
                        const name = data.name;
                        const value = data.value;
                        const total = Object.values(assets).filter(v => typeof v === 'number').reduce((sum, val) => sum + val, 0);
                        const percent = ((value / total) * 100).toFixed(1);
                        let subItems = [];
                        if (name === 'Investments') subItems = assets.investmentItems || [];
                        if (name === 'Real Estate') subItems = assets.realEstateItems || [];
                        if (name === 'Cash') subItems = assets.cashItems || [];
                        if (name === 'Other') subItems = assets.otherItems || [];
                        return (
                          <div style={{ background: 'rgba(10,22,40,0.96)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '10px', padding: '0.75rem 1rem', minWidth: '210px', backdropFilter: 'blur(8px)' }}>
                            <div style={{ fontWeight: '700', color: '#e8e9ed', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.35rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: data.payload?.color || '#60a5fa', flexShrink: 0 }} />
                                <span>{name}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Value</span>
                              <span style={{ fontSize: '0.88rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'monospace' }}>{formatCurrencyDecimal(value, currency, exchangeRates)}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: subItems.length > 0 ? '0.4rem' : 0 }}>
                              <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Share</span>
                              <span style={{ fontSize: '0.8rem', color: '#9ca3af', fontFamily: 'monospace' }}>{percent}% of total</span>
                            </div>
                            {subItems.length > 0 && (
                              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.4rem' }}>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.3rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Breakdown</div>
                                {subItems.map((item, idx) => (
                                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                                    <span style={{ fontSize: '0.77rem', color: '#9ca3af' }}>• {item.name}</span>
                                    <span style={{ fontSize: '0.77rem', color: '#e8e9ed', fontWeight: '600', fontFamily: 'monospace', marginLeft: '1rem' }}>{formatCurrencyDecimal(item.amount, currency, exchangeRates)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
                </div>{/* /relative wrapper */}
              {/* Custom compact legend */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                {ASSET_TYPES.map(item => (
                  <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{item.name}</span>
                  </div>
                ))}
              </div>
              {/* Liquid vs illiquid summary bar */}
              {(() => {
                const liquid = (assets.cash || 0) + (assets.investments || 0);
                const illiquid = (assets.realEstate || 0) + (assets.other || 0);
                const total = liquid + illiquid;
                if (total === 0) return null;
                const liquidPct = Math.round((liquid / total) * 100);
                const illiquidPct = 100 - liquidPct;
                const highConc = illiquidPct > 60;
                return (
                  <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.85rem', background: highConc ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)', borderRadius: '8px', border: `1px solid ${highConc ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                      <span style={{ fontSize: '0.62rem', color: '#6b7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Liquid vs Illiquid <InfoTooltip text="Liquid assets (cash + investments) can be drawn on immediately — they fund your SWR nest egg and retirement drawdown. Illiquid assets (real estate + other) appreciate passively but cannot be readily sold to fund expenses. A high illiquid concentration limits your retirement funding flexibility even if total net worth looks healthy." /></span>
                      {highConc && <span style={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: 700 }}>⚠ High illiquid concentration</span>}
                    </div>
                    <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', marginBottom: '0.35rem' }}>
                      <div style={{ width: `${liquidPct}%`, background: '#818cf8' }} />
                      <div style={{ width: `${illiquidPct}%`, background: '#94a3b8' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.68rem', color: '#818cf8' }}>💧 Liquid {liquidPct}% · {formatCurrencyDecimal(liquid, currency, exchangeRates)}</span>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>🏠 Illiquid {illiquidPct}% · {formatCurrencyDecimal(illiquid, currency, exchangeRates)}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
            
            {/* Right: Assets Over Time - upgraded */}
            {(() => {
              const currentYear = new Date().getFullYear();
              const ASSET_LINES = [
                { key: 'investments', label: 'Investments', color: '#60a5fa', rate: assumptions.investmentReturn, items: assets.investmentItems || [], subColors: ['#93c5fd','#bfdbfe','#60a5fa','#3b82f6'] },
                { key: 'realEstate',  label: 'Real Estate',  color: '#34d399', rate: assumptions.realEstateAppreciation, items: assets.realEstateItems || [], subColors: ['#6ee7b7','#a7f3d0','#34d399','#10b981'] },
                { key: 'cash',        label: 'Cash',         color: '#f59e0b', rate: 0, items: assets.cashItems || [], subColors: ['#fcd34d','#fde68a','#f59e0b','#d97706'] },
                { key: 'other',       label: 'Other',        color: '#a78bfa', rate: assumptions.otherAssetGrowth || 0, items: assets.otherItems || [], subColors: ['#c4b5fd','#ddd6fe','#a78bfa','#7c3aed'] },
              ];
              const growthLabels = {
                investments: `${assumptions.investmentReturn}%/yr`,
                realEstate: `${assumptions.realEstateAppreciation}%/yr`,
                cash: 'No growth',
                other: `${assumptions.otherAssetGrowth || 0}%/yr`,
              };

              // Build sub-item keys for all sub-items across all categories
              const allSubItems = [];
              ASSET_LINES.forEach(cat => {
                cat.items.forEach((sub, si) => {
                  allSubItems.push({
                    key: `sub_${cat.key}_${si}`,
                    label: sub.name,
                    parentKey: cat.key,
                    parentLabel: cat.label,
                    startAmount: sub.amount,
                    rate: cat.rate,
                    color: cat.subColors[si % cat.subColors.length],
                  });
                });
              });

              // Build chart data by merging wealthProjection with sub-item projections
              // For investment sub-items: when drawdown is enabled, scale proportionally
              // to the total investments balance from wealthProjection (which already has drawdown applied)
              // so sub-items track the actual depleted balance rather than pure compound growth.
              const investmentsStartAmount = assets.investments || 1; // avoid divide-by-zero
              const assetChartData = wealthProjection.map((d, i) => {
                const row = { ...d };
                allSubItems.forEach(sub => {
                  if (sub.parentKey === 'investments' && assumptions.enableDrawdown) {
                    // Scale the sub-item proportionally to how total investments have moved
                    // (captures both growth AND drawdown withdrawals from wealthProjection)
                    const investmentScaleFactor = d.investments / Math.max(1, investmentsStartAmount);
                    const pureGrowthValue = sub.startAmount * Math.pow(1 + sub.rate / 100, i);
                    // Weight: proportional share of starting investments * actual total
                    const subShare = sub.startAmount / investmentsStartAmount;
                    row[sub.key] = Math.round(Math.max(0, subShare * d.investments));
                  } else {
                    row[sub.key] = Math.round(sub.startAmount * Math.pow(1 + sub.rate / 100, i));
                  }
                });
                return row;
              });


              // activeSubs computed inline in tooltip per category

              return (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  position: 'relative',
                  zIndex: 10
                }}>
                  {/* Header row with title + drill-down dropdown */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: 0 }}>
                      Assets Over Time
                    </h3>
                    <div style={{ position: 'relative' }}>
                      <button
                        onClick={() => setAssetDropdownOpen(prev => !prev)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '0.4rem',
                          padding: '0.35rem 0.75rem', borderRadius: '8px', cursor: 'pointer',
                          background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)',
                          color: '#60a5fa', fontSize: '0.8rem', fontWeight: '600'
                        }}
                      >
                        🔍 Drill down {assetDropdownOpen ? '▲' : '▼'}
                      </button>
                      {assetDropdownOpen && (
                        <>
                          <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setAssetDropdownOpen(false)} />
                          <div style={{
                            position: 'absolute', right: 0, top: '110%', zIndex: 9999,
                            background: '#0d1e35', border: '1px solid rgba(96,165,250,0.3)',
                            borderRadius: '10px', padding: '0.75rem', minWidth: '230px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                          }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select sub-items to overlay</span>
                            <span
                              onClick={() => {
                                const allOff = {};
                                allSubItems.forEach(s => { allOff[s.key] = true; });
                                setHiddenAssetLines(prev => ({ ...prev, ...allOff }));
                              }}
                              style={{ fontSize: '0.7rem', color: '#60a5fa', cursor: 'pointer' }}
                            >clear all</span>
                          </div>
                          {ASSET_LINES.map(cat => {
                            if (cat.items.length === 0) return null;
                            return (
                              <div key={cat.key} style={{ marginBottom: '0.6rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', paddingBottom: '0.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color }} />
                                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>{cat.label}</span>
                                  <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>({growthLabels[cat.key]})</span>
                                </div>
                                {cat.items.map((sub, si) => {
                                  const subKey = `sub_${cat.key}_${si}`;
                                  const isOn = hiddenAssetLines[subKey] === false;
                                  const subColor = cat.subColors[si % cat.subColors.length];
                                  return (
                                    <div key={si}
                                      onClick={() => setHiddenAssetLines(prev => ({ ...prev, [subKey]: isOn ? true : false }))}
                                      style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.3rem 0.4rem 0.3rem 1rem', borderRadius: '5px', cursor: 'pointer',
                                        background: isOn ? `${subColor}15` : 'transparent', marginBottom: '0.1rem'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <div style={{ width: '8px', height: '2px', background: subColor, borderRadius: '1px', opacity: isOn ? 1 : 0.3 }} />
                                        <span style={{ fontSize: '0.75rem', color: isOn ? '#d1d5db' : '#6b7280' }}>{sub.name}</span>
                                      </div>
                                      <span style={{ fontSize: '0.68rem', color: isOn ? '#9ca3af' : '#4b5563' }}>{isOn ? 'on' : 'off'}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })}
                        </div>
                        </>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '0.75rem' }}>
                    How your wealth grows across asset classes
                  </p>

                  {/* Toggle pills - main categories */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {[{ key: 'totalAssets', label: 'Total', color: '#22c55e' }, ...ASSET_LINES].map(item => {
                      const isHidden = hiddenAssetLines[item.key];
                      return (
                        <div key={item.key}
                          onClick={() => setHiddenAssetLines(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '3px 8px', borderRadius: '6px', cursor: 'pointer',
                            border: `1px solid ${isHidden ? 'rgba(255,255,255,0.1)' : item.color}`,
                            background: isHidden ? 'rgba(255,255,255,0.03)' : `${item.color}18`,
                            opacity: isHidden ? 0.4 : 1, transition: 'all 0.15s'
                          }}
                        >
                          <div style={{ width: '14px', height: '3px', background: item.color, borderRadius: '2px' }} />
                          <span style={{ fontSize: '0.72rem', color: isHidden ? '#6b7280' : '#d1d5db', fontWeight: 600 }}>{item.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  <ResponsiveContainer width="100%" height={320} style={{ overflow: 'visible' }}>
                    <LineChart data={assetChartData} margin={{ top: 15, right: 10, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="age" stroke="#9ca3af" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#9ca3af" tickFormatter={(v) => formatCurrency(v, currency, exchangeRates)} tick={{ fontSize: 10 }} />
                      <Tooltip
                        wrapperStyle={{ zIndex: 9999 }}
                        contentStyle={{ background: 'rgba(10,22,40,0.96)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '10px', backdropFilter: 'blur(8px)', color: '#e8e9ed' }}
                        content={({ active, payload, label }) => {
                          if (!active || !payload || !payload.length) return null;
                          const dataPoint = assetChartData.find(d => d.age === label);
                          const wealthMilestone = wealthMilestones.find(m => m.age === label);
                          const year = currentYear + (label - profile.currentAge);
                          const lifeEvent = lifeEvents.find(e => e.year === year);
                          return (
                            <div style={{ padding: '0.75rem', minWidth: '210px' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#60a5fa', marginBottom: '0.4rem' }}>
                                {dataPoint?.year} · Age {label}
                              </div>
                              {wealthMilestone && <div style={{ fontSize: '0.72rem', color: '#34d399', marginBottom: '0.3rem' }}>💰 {wealthMilestone.label} USD milestone</div>}
                              {lifeEvent && <div style={{ fontSize: '0.72rem', color: '#60a5fa', marginBottom: '0.3rem' }}>🔵 {lifeEvent.description}</div>}
                              {/* Total */}
                              {!hiddenAssetLines['totalAssets'] && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: '0.4rem', paddingBottom: '0.4rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e' }} />
                                    <span style={{ fontSize: '0.8rem', color: '#d1d5db', fontWeight: 700 }}>Total Assets</span>
                                  </div>
                                  <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#22c55e', fontFamily: 'monospace' }}>
                                    {formatCurrencyDecimal(dataPoint?.totalAssets || 0, currency, exchangeRates)}
                                  </span>
                                </div>
                              )}
                              {/* Liquid vs illiquid split — only meaningful when Total line is visible */}
                              {!hiddenAssetLines['totalAssets'] && (() => {
                                const liq = (dataPoint?.investments || 0) + (dataPoint?.cash || 0);
                                const iliq = (dataPoint?.realEstate || 0) + (dataPoint?.other || 0);
                                const tot = dataPoint?.totalAssets || 0;
                                if (tot === 0) return null;
                                const liqPct = Math.round((liq / tot) * 100);
                                const iliqPct = 100 - liqPct;
                                return (
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#6b7280', marginBottom: '0.2rem', paddingBottom: '0.2rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <span style={{ color: '#818cf8' }}>💧 Liquid {liqPct}%</span>
                                    <span style={{ color: iliqPct > 60 ? '#f59e0b' : '#94a3b8' }}>🏠 Illiquid {iliqPct}%{iliqPct > 60 ? ' ⚠' : ''}</span>
                                  </div>
                                );
                              })()}
                              {/* Category rows + active sub-items */}
                              {ASSET_LINES.map((info, i) => {
                                const activeSubs = allSubItems.filter(s => s.parentKey === info.key && hiddenAssetLines[s.key] === false);
                                const catVisible = !hiddenAssetLines[info.key];
                                if (!catVisible && activeSubs.length === 0) return null;
                                return (
                                  <div key={i} style={{ marginBottom: '0.3rem' }}>
                                    {catVisible && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: info.color }} />
                                          <span style={{ fontSize: '0.77rem', color: '#d1d5db' }}>{info.label}</span>
                                          <span style={{ fontSize: '0.65rem', color: '#6b7280' }}>({growthLabels[info.key]})</span>
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: '#e8e9ed', fontFamily: 'monospace' }}>
                                          {formatCurrencyDecimal(dataPoint?.[info.key] || 0, currency, exchangeRates)}
                                        </span>
                                      </div>
                                    )}
                                    {!catVisible && activeSubs.length > 0 && (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.1rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: info.color, opacity: 0.5 }} />
                                        <span style={{ fontSize: '0.73rem', color: '#6b7280' }}>{info.label}</span>
                                      </div>
                                    )}
                                    {activeSubs.map((sub, si) => (
                                      <div key={si} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '1rem', marginTop: '0.1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                          <div style={{ width: '6px', height: '2px', background: sub.color, borderRadius: '1px' }} />
                                          <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>↳ {sub.label}</span>
                                        </div>
                                        <span style={{ fontSize: '0.72rem', color: sub.color, fontFamily: 'monospace' }}>
                                          {formatCurrencyDecimal(dataPoint?.[sub.key] || 0, currency, exchangeRates)}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }}
                      />
                      <ReferenceLine
                        x={profile.retirementAge}
                        stroke="#a78bfa" strokeDasharray="3 3" strokeWidth={2}
                        label={(props) => <RotatedRefLabel {...props} value="Retirement" fill="#a78bfa" />}
                      />
                      {/* Portfolio Exhaustion marker */}
                      {wealthProjection.exhaustionAge && (
                        <ReferenceLine
                          x={wealthProjection.exhaustionAge}
                          stroke="#f87171" strokeDasharray="4 3" strokeWidth={2}
                          label={(props) => <RotatedRefLabel {...props} value="Exhausted" fill="#f87171" />}
                        />
                      )}
                      {/* Total line - bold, dots on milestones/life events */}
                      <Line type="monotone" dataKey="totalAssets" name="Total" stroke="#22c55e" strokeWidth={3}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          const wealthMilestone = wealthMilestones.find(m => m.age === payload.age);
                          if (wealthMilestone) return <circle key={payload.age} cx={cx} cy={cy} r={6} fill="#34d399" stroke="white" strokeWidth={2} />;
                          const yr = currentYear + (payload.age - profile.currentAge);
                          if (lifeEvents.find(e => e.year === yr)) return <circle key={payload.age} cx={cx} cy={cy} r={5} fill="#60a5fa" stroke="white" strokeWidth={2} />;
                          return null;
                        }}
                        activeDot={{ r: 5 }} hide={hiddenAssetLines['totalAssets']}
                      />
                      {/* Category lines - dashed, no dots */}
                      {ASSET_LINES.map(item => (
                        <Line key={item.key} type="monotone" dataKey={item.key} name={item.label}
                          stroke={item.color} strokeWidth={1.5} strokeDasharray="5 3"
                          dot={false} activeDot={{ r: 4 }} hide={hiddenAssetLines[item.key]}
                        />
                      ))}
                      {/* Sub-item lines - thinner, more dashed, shown only when toggled on */}
                      {allSubItems.map(sub => (
                        <Line key={sub.key} type="monotone" dataKey={sub.key} name={sub.label}
                          stroke={sub.color} strokeWidth={1} strokeDasharray="3 4"
                          dot={false} activeDot={{ r: 3 }} hide={hiddenAssetLines[sub.key] !== false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem', flexWrap: 'wrap', marginTop: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px' }}>
                    {Object.entries(MILESTONE_COLORS).filter(([key]) => key !== 'retirement' && key !== 'expense').map(([key, { color, label }]) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, border: '2px solid white' }} />
                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            
            </div>
            {/* End of Asset Charts Grid */}
            


            {/* Income vs Expenses — full lifecycle chart, lives in Overview */}
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', position: 'relative', zIndex: 10 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem', gap: '0.75rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  Cash Flow Over Time
                  <InfoTooltip text="Pre-retirement income includes salary (grows annually), passive income, and other income. At retirement, salary stops — but passive and other income (rental, dividends, etc.) continue for life. Pre-retirement expenses grow category-by-category; at retirement the model switches to your Retirement Budget, inflated each year at your assumed inflation rate." />
                </h3>

              </div>
              <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
                Annual cash flows throughout your life stages
              </p>
              <ResponsiveContainer width="100%" height={450} style={{ overflow: 'visible' }}>
                <LineChart data={wealthProjection} margin={{ top: 40, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                  <XAxis dataKey="age" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => formatCurrency(value, currency, exchangeRates)} />
                  <Tooltip
                    wrapperStyle={{ zIndex: 9999 }}
                    contentStyle={{ background: 'rgba(10,22,40,0.96)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '10px', backdropFilter: 'blur(8px)', color: '#e8e9ed' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload || !payload.length) return null;
                      const pt = wealthProjection.find(d => d.age === label);
                      const currentYear = new Date().getFullYear();
                      const year = pt?.year ?? (currentYear + (label - profile.currentAge));
                      const wealthMilestone = wealthMilestones.find(m => m.age === label);
                      const lifeEvent = lifeEvents.find(e => e.year === year);
                      const oneTimeHits = oneTimeExpenses.filter(e => year >= e.year && year <= (e.endYear || e.year));
                      const isPreRetirement = label < profile.retirementAge;
                      return (
                        <div style={{ minWidth: '230px' }}>
                          <div style={{ fontWeight: '700', color: '#e8e9ed', marginBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.35rem' }}>
                            {year} (Age {label})
                            {wealthMilestone && <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'block', marginTop: '0.15rem' }}>💰 {wealthMilestone.label}</span>}
                            {lifeEvent && <span style={{ fontSize: '0.7rem', color: '#60a5fa', display: 'block', marginTop: '0.15rem' }}>🔵 {lifeEvent.description}</span>}
                            {oneTimeHits.length > 0 && (
                              <div style={{ marginTop: '0.1rem' }}>
                                <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Planned</span>
                                 {oneTimeHits.map((ote, idx) => {
                                   const isRecurring = ote.endYear && ote.endYear > ote.year;
                                   const rangeLabel = isRecurring ? ' ' + ote.year + '–' + ote.endYear : ' ' + ote.year;
                                   const oteCat = ote.category && ote.category !== 'none' ? ote.category : null;
                                   const cfCurYear = new Date().getFullYear();
                                   const cfRetCalYear = cfCurYear + (profile.retirementAge - profile.currentAge);
                                   const yearsFromNow = year - cfCurYear;
                                   const preRate = oteCat ? (expenseGrowthRates[oteCat] || 0) : 0;
                                   const retRate = oteCat ? (retExpenseGrowthRates[oteCat] || 0) : 0;
                                   const oteRate = year < cfRetCalYear ? preRate : retRate;
                                   let inflatedAmt;
                                   if (year < cfRetCalYear) {
                                     inflatedAmt = (ote.amount || 0) * Math.pow(1 + preRate / 100, yearsFromNow);
                                   } else {
                                     const yToRet = cfRetCalYear - cfCurYear;
                                     const yIntoRet = year - cfRetCalYear;
                                     inflatedAmt = (ote.amount || 0) * Math.pow(1 + preRate / 100, yToRet) * Math.pow(1 + retRate / 100, yIntoRet);
                                   }
                                   const showInflation = oteRate > 0 && yearsFromNow > 0 && Math.abs(inflatedAmt - ote.amount) > 50;
                                   return (
                                     <div key={idx} style={{ marginTop: '0.05rem' }}>
                                       <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                         <span style={{ color: '#d97706' }}>↳ {ote.description}<span style={{ color: '#92400e', fontSize: '0.63rem' }}>{rangeLabel}</span></span>
                                         <span style={{ fontFamily: 'monospace', color: '#f59e0b' }}>
                                           {formatCurrencyDecimal(Math.round(ote.amount), currency, exchangeRates)}{isRecurring ? '/yr' : ''}
                                         </span>
                                       </div>
                                       {showInflation && (
                                         <div style={{ fontSize: '0.62rem', color: '#78350f', paddingLeft: '0.9rem' }}>
                                           {formatCurrencyDecimal(Math.round(inflatedAmt), currency, exchangeRates) + ' in ' + year + ' (' + oteRate + '%/yr)'}
                                         </div>
                                       )}
                                     </div>
                                   );
                                 })}
                              </div>
                            )}
                          </div>
                          {/* Income block — hidden when income line is toggled off */}
                          {!hiddenLines.income && (
                          <div style={{ marginBottom: '0.35rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8rem', color: '#d1d5db', fontWeight: 600 }}>Income</span>
                              </div>
                              <span style={{ fontSize: '0.82rem', color: '#34d399', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrencyDecimal(pt?.income || 0, currency, exchangeRates)}</span>
                            </div>
                            <div style={{ paddingLeft: '1rem' }}>
                              {pt?.salary > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.08rem' }}><span>↳ Salary <span style={{ color: '#4b5563' }}>(+{assumptions.salaryGrowth}%/yr)</span></span><span style={{ fontFamily: 'monospace', color: '#9ca3af' }}>{formatCurrencyDecimal(pt.salary, currency, exchangeRates)}</span></div>}
                              {pt?.passive > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.08rem' }}><span>↳ Passive <span style={{ color: '#4b5563' }}>(+{assumptions.passiveGrowth || 0}%/yr)</span></span><span style={{ fontFamily: 'monospace', color: '#9ca3af' }}>{formatCurrencyDecimal(pt.passive, currency, exchangeRates)}</span></div>}
                              {pt?.otherIncome > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.08rem' }}><span>↳ Other <span style={{ color: '#4b5563' }}>(+{assumptions.otherIncomeGrowth || 0}%/yr)</span></span><span style={{ fontFamily: 'monospace', color: '#9ca3af' }}>{formatCurrencyDecimal(pt.otherIncome, currency, exchangeRates)}</span></div>}
                              {!isPreRetirement && pt?.salary === 0 && pt?.passive === 0 && pt?.otherIncome === 0 && <div style={{ fontSize: '0.72rem', color: '#4b5563' }}>No income</div>}
                            </div>
                          </div>
                          )}
                          {/* Expenses block — hidden when expenses line is toggled off */}
                          {!hiddenLines.expenses && (
                          <div style={{ marginBottom: '0.35rem', borderTop: !hiddenLines.income ? '1px solid rgba(255,255,255,0.06)' : 'none', paddingTop: !hiddenLines.income ? '0.35rem' : 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.15rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8rem', color: '#d1d5db', fontWeight: 600 }}>Expenses</span>

                              </div>
                              <span style={{ fontSize: '0.82rem', color: '#f87171', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrencyDecimal(pt?.expenses || 0, currency, exchangeRates)}</span>
                            </div>
                            {isPreRetirement && (
                              <div style={{ paddingLeft: '1rem' }}>
                                {pt?.essential > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.08rem' }}><span>↳ Essential</span><span style={{ fontFamily: 'monospace', color: '#9ca3af' }}>{formatCurrencyDecimal(pt.essential, currency, exchangeRates)}</span></div>}
                                {pt?.discretionary > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.08rem' }}><span>↳ Discretionary</span><span style={{ fontFamily: 'monospace', color: '#9ca3af' }}>{formatCurrencyDecimal(pt.discretionary, currency, exchangeRates)}</span></div>}
                                {oneTimeHits.length > 0 && (() => {
                                  // Use inflated amount = pt.expenses − pt.essential − pt.discretionary
                                  // so the subtotals always add up to the total exactly
                                  const inflatedOte = (pt?.expenses || 0) - (pt?.essential || 0) - (pt?.discretionary || 0);
                                  return <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#f59e0b', marginBottom: '0.08rem' }}><span>↳ Planned ({oneTimeHits.length})</span><span style={{ fontFamily: 'monospace' }}>{formatCurrencyDecimal(Math.max(0, inflatedOte), currency, exchangeRates)}</span></div>;
                                })()}
                              </div>
                            )}
                            {!isPreRetirement && (() => {
                              // Per-category nominal E/D breakdown for hovered retirement year
                              const retEssential = expenseCategories.filter(c => {
                                const po = retExpensePhaseOutYears[c.key];
                                if (po && year >= po) return false;
                                return (expenseTags[c.key]||c.group)==='essential';
                              }).reduce((s,c) => {
                                const base = retirementBudget[c.key] || 0;
                                const rate = (retExpenseGrowthRates[c.key] || 0) / 100;
                                const yearsToRet = profile.retirementAge - profile.currentAge;
                                const yearsIntoRet = label - profile.retirementAge;
                                return s + base * Math.pow(1 + rate, yearsToRet + yearsIntoRet);
                              }, 0);
                              const retDiscretionary = expenseCategories.filter(c => {
                                const po = retExpensePhaseOutYears[c.key];
                                if (po && year >= po) return false;
                                return (expenseTags[c.key]||c.group)==='disc';
                              }).reduce((s,c) => {
                                const base = retirementBudget[c.key] || 0;
                                const rate = (retExpenseGrowthRates[c.key] || 0) / 100;
                                const yearsToRet = profile.retirementAge - profile.currentAge;
                                const yearsIntoRet = label - profile.retirementAge;
                                return s + base * Math.pow(1 + rate, yearsToRet + yearsIntoRet);
                              }, 0);
                              // OTE for this post-retirement year (already inflated via two-segment logic in wealthProjection)
                              const retOteNominal = (() => {
                                if (!oneTimeHits.length) return 0;
                                const yearsToRet = profile.retirementAge - profile.currentAge;
                                const yearsIntoRet = year - (new Date().getFullYear() + yearsToRet);
                                return oneTimeHits.reduce((sum, ote) => {
                                  const cat = ote.category && ote.category !== 'none' ? ote.category : null;
                                  const preRate = cat ? ((expenseGrowthRates[cat] || 0) / 100) : 0;
                                  const retRate = cat ? ((retExpenseGrowthRates[cat] || 0) / 100) : 0;
                                  return sum + Math.round(ote.amount * Math.pow(1 + preRate, yearsToRet) * Math.pow(1 + retRate, Math.max(0, yearsIntoRet)));
                                }, 0);
                              })();
                              return (
                                <div style={{ paddingLeft: '1rem' }}>
                                  {retEssential > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.08rem' }}><span>↳ Essential</span><span style={{ fontFamily: 'monospace', color: '#9ca3af' }}>{formatCurrencyDecimal(retEssential, currency, exchangeRates)}</span></div>}
                                  {retDiscretionary > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.08rem' }}><span>↳ Discretionary</span><span style={{ fontFamily: 'monospace', color: '#9ca3af' }}>{formatCurrencyDecimal(retDiscretionary, currency, exchangeRates)}</span></div>}
                                  {retOteNominal > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#f59e0b', marginBottom: '0.08rem' }}><span>↳ Planned ({oneTimeHits.length})</span><span style={{ fontFamily: 'monospace' }}>{formatCurrencyDecimal(retOteNominal, currency, exchangeRates)}</span></div>}
                                </div>
                              );
                            })()}
                          </div>
                          )}
                          {/* Savings — hidden when savings line is toggled off */}
                          {!hiddenLines.savings && (
                          <div style={{ borderTop: (!hiddenLines.income || !hiddenLines.expenses) ? '1px solid rgba(255,255,255,0.06)' : 'none', paddingTop: (!hiddenLines.income || !hiddenLines.expenses) ? '0.35rem' : 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#60a5fa', flexShrink: 0 }} />
                                <span style={{ fontSize: '0.8rem', color: '#d1d5db', fontWeight: 600 }}>Savings</span>
                                <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>(income − expenses)</span>
                              </div>
                              <span style={{ fontSize: '0.82rem', color: '#60a5fa', fontFamily: 'monospace', fontWeight: 700 }}>{formatCurrencyDecimal(pt?.savings || 0, currency, exchangeRates)}</span>
                            </div>
                          </div>
                          )}
                        </div>
                      );
                    }}
                  />
                  <Legend content={<CustomLegend />} />
                  
                  {/* Retirement marker */}
                  <ReferenceLine
                    x={profile.retirementAge}
                    stroke="#a78bfa" strokeDasharray="3 3" strokeWidth={2}
                    label={(props) => <RotatedRefLabel {...props} value="Retirement" fill="#a78bfa" />}
                  />
                  {/* Portfolio Exhaustion marker */}
                  {wealthProjection.exhaustionAge && (
                    <ReferenceLine
                      x={wealthProjection.exhaustionAge}
                      stroke="#f87171" strokeDasharray="4 3" strokeWidth={2}
                      label={(props) => <RotatedRefLabel {...props} value="Exhausted" fill="#f87171" />}
                    />
                  )}
                  
                  {/* OTE shaded bands — only when expenses line is visible; vertical labels; alternating opacity */}
                  {!hiddenLines.expenses && (() => {
                    let bandIndex = 0;
                    return oneTimeExpenses.map(e => {
                      const currentYear = new Date().getFullYear();
                      const x1 = profile.currentAge + (e.year - currentYear);
                      const x2 = profile.currentAge + ((e.endYear || e.year) - currentYear);
                      if (!(e.endYear && e.endYear > e.year)) return null;
                      const myIndex = bandIndex++;
                      const fillOpacity = myIndex % 2 === 0 ? 0.06 : 0.10;
                      return (
                        <ReferenceArea
                          key={e.id}
                          x1={x1} x2={x2}
                          fill={`rgba(245,158,11,${fillOpacity})`}
                          stroke="rgba(245,158,11,0.22)"
                          strokeWidth={1}
                          strokeDasharray="3 3"
                          label={makeBandLabel(e.description, 'rgba(245,158,11,0.9)', myIndex)}
                        />
                      );
                    });
                  })()}
                  <Line type="monotone" dataKey="income" stroke="#34d399" strokeWidth={2} name="Income" dot={false} hide={hiddenLines.income} />
                  <Line type="monotone" dataKey="expenses" stroke="#f87171" strokeWidth={2} name="Expenses" dot={<CustomDotExpenses />} hide={hiddenLines.expenses} />
                  <Line type="monotone" dataKey="savings" stroke="#60a5fa" strokeWidth={2} name="Savings" dot={false} hide={hiddenLines.savings} />
                </LineChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', border: '2px solid white' }} />
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>Financial Milestone</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', background: '#60a5fa', borderRadius: '50%', border: '2px solid white' }} />
                  <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>Life Event</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%', border: '2px solid white' }} />
                  <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>Planned Expense</span>
                </div>
              </div>

              {/* ── Surplus Deployment — collapsible subsection ── */}
              {(() => {
                const surplusOpen = expandedCategories.surplusDeployment === true;
                const annualSurplus = annualSavings;
                const monthlySurplus = Math.round(annualSurplus / 12);
                // Gate on projected savings: show panel if ANY pre-retirement year has positive savings
                const hasFutureSurplus = wealthProjection.some(d => d.age < profile.retirementAge && (d.savings || 0) > 0);
                const requiredNestEgg = nestEggSwr > 0 ? getRetNominalForYear(new Date().getFullYear() + (profile.retirementAge - profile.currentAge)) / (nestEggSwr / 100) : 0;
                const currentFiAge = fiAge;

                // Per-year FI threshold — mirrors the corrected fiAge logic so tile FI Ages
                // are consistent with the main Retirement Health card FI Age.
                const getFiThresholdForWpEntry = (wp) => {
                  if (nestEggSwr <= 0) return Infinity;
                  const currentYear = new Date().getFullYear();
                  const calYear = currentYear + (wp.age - profile.currentAge);
                  const retirementCalYear = currentYear + (profile.retirementAge - profile.currentAge);
                  let nominalExpense;
                  if (calYear < retirementCalYear) {
                    const yearsAhead = wp.age - profile.currentAge;
                    nominalExpense = expenseCategories.reduce(function(s, cat) {
                      const po = retExpensePhaseOutYears[cat.key];
                      if (po && calYear >= po) return s;
                      const base = retirementBudget[cat.key] || 0;
                      const rate = (retExpenseGrowthRates[cat.key] || 0) / 100;
                      return s + base * Math.pow(1 + rate, yearsAhead);
                    }, 0);
                  } else {
                    nominalExpense = getRetNominalForYear(calYear);
                  }
                  return nominalExpense > 0 ? nominalExpense / (nestEggSwr / 100) : Infinity;
                };

                // Tile 1 — Invest all surplus
                // Each year's actual surplus (from wealthProjection.savings) is invested and compounds.
                // This is dynamic: surplus varies year by year with salary growth, expenses, one-time costs.
                const t1Sim = (() => {
                  let bal = assets.investments || 0;
                  const r = assumptions.investmentReturn / 100;
                  let fiAgeResult = null;
                  let balAtRetirement = bal;
                  for (let i = 0; i < wealthProjection.length; i++) {
                    const wp = wealthProjection[i];
                    if (wp.age > profile.lifeExpectancy) break;
                    if (fiAgeResult === null && bal >= getFiThresholdForWpEntry(wp)) fiAgeResult = wp.age;
                    // Capture BEFORE growth — consistent with wealthProjection push-then-grow convention
                    if (wp.age === profile.retirementAge) balAtRetirement = bal;
                    const yearSurplus = wp.age < profile.retirementAge ? (wp.savings || 0) : 0;
                    bal = bal * (1 + r) + yearSurplus;
                  }
                  return { fiAgeResult, balAtRetirement };
                })();
                const t1FiAge = t1Sim.fiAgeResult;
                // Delta only meaningful when both a baseline FI Age and a new FI Age exist
                const t1Delta = (t1FiAge !== null && currentFiAge !== null) ? currentFiAge - t1FiAge : null;
                const t1HasBaseline = currentFiAge !== null;
                const baseInvestAtRetirement = (() => {
                  const d = wealthProjection.find(d => d.age === profile.retirementAge);
                  return d ? d.investments : 0;
                })();
                const t1NWDelta = t1Sim.balAtRetirement - baseInvestAtRetirement;

                // Tile 2 — Clear debt first, then invest
                // Each year: use that year's actual surplus (wealthProjection.savings) to pay down
                // remaining debt balance (tracked separately from linear amortization).
                // Any surplus left after debt payment gets invested and compounds.
                // Once debt is fully cleared, full surplus goes to investments.
                const totalDebtToday = (liabilities.mortgage || 0) + (liabilities.loans || 0) + (liabilities.other || 0);
                const t2Sim = (() => {
                  let bal = assets.investments || 0;
                  const r = assumptions.investmentReturn / 100;
                  let remainingDebt = totalDebtToday;
                  let debtFreeAge = null;
                  let fiAgeResult = null;
                  for (let i = 0; i < wealthProjection.length; i++) {
                    const wp = wealthProjection[i];
                    if (wp.age > profile.lifeExpectancy) break;
                    if (fiAgeResult === null && bal >= getFiThresholdForWpEntry(wp)) fiAgeResult = wp.age;
                    if (wp.age >= profile.retirementAge) { bal = bal * (1 + r); continue; }
                    const yearSurplus = wp.savings || 0;
                    bal = bal * (1 + r);
                    if (remainingDebt > 0) {
                      // debtPayment must be non-negative: if surplus is negative, it draws from investments (bal), not debt
                      const debtPayment = Math.max(0, Math.min(yearSurplus, remainingDebt));
                      remainingDebt -= debtPayment;
                      const leftover = yearSurplus - debtPayment;
                      bal += leftover;
                      if (remainingDebt <= 0 && debtFreeAge === null) debtFreeAge = wp.age + 1;
                    } else {
                      bal += yearSurplus;
                    }
                  }
                  return { debtFreeAge, fiAgeResult };
                })();
                const t2DebtDelta = (t2Sim.debtFreeAge !== null && debtFreeAge !== null) ? debtFreeAge - t2Sim.debtFreeAge : null;
                const t2FiDelta = (t2Sim.fiAgeResult !== null && currentFiAge !== null) ? currentFiAge - t2Sim.fiAgeResult : null;
                const t2HasBaseline = currentFiAge !== null;

                // Tile 3
                const splitInvest = typeof surplusSplitInvest !== 'undefined' ? surplusSplitInvest : 100;
                const splitDebt   = typeof surplusSplitDebt   !== 'undefined' ? surplusSplitDebt   : 0;
                const splitCash   = Math.max(0, 100 - splitInvest - splitDebt);
                // For simulation: if invest+debt > 100, cap debt so total ≤ 100 (invest takes priority)
                const effInvest = Math.min(splitInvest, 100);
                const effDebt   = Math.min(splitDebt, 100 - effInvest);
                // Tile 3 — Custom split: each year, invest splitInvest% and pay debt splitDebt% of that year's surplus
                const t3Sim = (() => {
                  let bal = assets.investments || 0;
                  const r = assumptions.investmentReturn / 100;
                  let remainingDebt = totalDebtToday;
                  let fiAgeResult = null;
                  for (let i = 0; i < wealthProjection.length; i++) {
                    const wp = wealthProjection[i];
                    if (wp.age > profile.lifeExpectancy) break;
                    if (fiAgeResult === null && bal >= getFiThresholdForWpEntry(wp)) fiAgeResult = wp.age;
                    if (wp.age >= profile.retirementAge) { bal = bal * (1 + r); continue; }
                    const yearSurplus = wp.savings || 0;
                    const toInvest = yearSurplus * effInvest / 100;
                    const toDebt   = yearSurplus * effDebt   / 100;
                    // splitCash portion is deliberately held idle — not invested, not used for debt
                    bal = bal * (1 + r) + toInvest;
                    if (remainingDebt > 0) {
                      const debtPayment = Math.max(0, Math.min(toDebt, remainingDebt));
                      remainingDebt -= debtPayment;
                      // Any overpayment (debt already cleared) goes to investment
                      bal += (toDebt - debtPayment);
                    } else {
                      // Debt already cleared — full toDebt portion redirects to investment
                      bal += toDebt;
                    }
                  }
                  return { fiAgeResult };
                })();
                const t3Delta = (t3Sim.fiAgeResult !== null && currentFiAge !== null) ? currentFiAge - t3Sim.fiAgeResult : null;
                const t3HasBaseline = currentFiAge !== null;

                const deltaChip = (delta) => {
                  if (delta === null) return <span style={{ fontSize: '0.72rem', color: '#4b5563', fontStyle: 'italic' }}>Not reached within outlook horizon</span>;
                  const same = delta === 0;
                  const better = delta > 0;
                  const col = same ? '#6b7280' : better ? '#34d399' : '#f87171';
                  const bg  = same ? 'rgba(107,114,128,0.1)' : better ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)';
                  const bdr = same ? 'rgba(107,114,128,0.2)' : better ? 'rgba(52,211,153,0.25)' : 'rgba(248,113,113,0.25)';
                  const lbl = same ? 'no change' : better ? `${Math.abs(delta)} yr${Math.abs(delta) !== 1 ? 's' : ''} earlier` : `${Math.abs(delta)} yr${Math.abs(delta) !== 1 ? 's' : ''} later`;
                  return (
                    <span style={{ display: 'inline-block', padding: '0.15rem 0.55rem', borderRadius: '5px', background: bg, border: `1px solid ${bdr}`, fontSize: '0.8rem', fontWeight: '700', color: col, fontFamily: 'JetBrains Mono, monospace' }}>
                      {same ? '—' : (better ? '▲ ' : '▼ ')}{lbl}
                    </span>
                  );
                };

                return (
                  <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: surplusOpen ? '0.85rem' : 0 }}>
                      <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        💸 Surplus Deployment
                        <InfoTooltip text={`Your annual pre-retirement surplus (total income minus expenses) sits undeployed by default. These three strategies show what happens to your FI Age and retirement wealth if you actively deploy it. Important: all strategies operate pre-retirement only — surplus deployment stops at your Planned Retirement Age. Post-retirement, passive and other non-salary income is automatically netted against investment drawdown, so there is no double-counting between pre- and post-retirement phases.`} />
                      </div>
                      {!hasFutureSurplus
                        ? <span style={{ fontSize: '0.72rem', color: '#4b5563', fontStyle: 'italic' }}>No surplus — expenses meet or exceed income throughout projection</span>
                        : <button onClick={() => setExpandedCategories(p => ({...p, surplusDeployment: !surplusOpen}))} style={{ fontSize: '0.72rem', color: '#9ca3af', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '0.2rem 0.55rem', cursor: 'pointer', flexShrink: 0 }}>
                            {surplusOpen ? '▲ Hide Details' : '▼ Show Details'}
                          </button>
                      }
                    </div>
                    {surplusOpen && hasFutureSurplus && <div style={{ fontSize: '0.72rem', color: '#6b7280', marginBottom: '0.85rem', lineHeight: 1.5 }}>Use your pre-retirement surplus to see if you can retire faster — or pay off debt sooner. Each strategy uses your year-by-year actual surplus, which grows dynamically with your salary and expenses.</div>}
                    {surplusOpen && hasFutureSurplus && (
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>

                          {/* Tile 1 — Invest all */}
                          <div style={{ padding: '1rem', background: 'rgba(52,211,153,0.07)', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.3)' }}>
                            <div style={{ fontSize: '0.85rem', color: '#34d399', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>💹 Invest all surplus <InfoTooltip text={`Each year's leftover Savings — after all expenses — is added to your Investments pot immediately and grows at your assumed return of ${assumptions.investmentReturn}%/yr until retirement. The annual savings fluctuate over time as your income and expenses change. The FI Age shown is how early you could retire if you consistently invest every extra bit of saving.`} /></div>
                            <div style={{ fontSize: '0.85rem', color: '#e8e9ed', marginBottom: '0.85rem', lineHeight: 1.5 }}>Each year's surplus invested at {assumptions.investmentReturn}%/yr & compounded until retirement.</div>
                            <div style={{ height: '1px', background: 'rgba(52,211,153,0.2)', marginBottom: '0.75rem' }} />
                            <div style={{ marginBottom: '0.65rem' }}>
                              <div style={{ fontSize: '0.62rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontWeight: '600' }}>
                                FI Age impact <span style={{ textTransform: 'none', color: '#4b5563', fontWeight: '400' }}>{t1HasBaseline ? `(default Age ${currentFiAge})` : '(no baseline — default never reached)'}</span>
                              </div>
                              {t1FiAge
                                ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>Age {t1FiAge}</span>
                                    {t1Delta !== null && deltaChip(t1Delta)}
                                  </div>
                                : <span style={{ fontSize: '0.72rem', color: '#4b5563', fontStyle: 'italic' }}>Not reached within dashboard horizon</span>
                              }
                            </div>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '0.65rem' }} />
                            <div>
                              <div style={{ fontSize: '0.62rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontWeight: '600' }}>
                                Extra investments at target retirement <span style={{ textTransform: 'none', color: '#4b5563', fontWeight: '400' }}>(Age {profile.retirementAge})</span>
                              </div>
                              <span style={{ fontSize: '1rem', fontWeight: '800', color: t1NWDelta >= 0 ? '#34d399' : '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>
                                {t1NWDelta >= 0 ? '+' : ''}{formatCurrencyDecimal(t1NWDelta, currency, exchangeRates)}
                              </span>
                            </div>
                          </div>

                          {/* Tile 2 — Clear debt first */}
                          <div style={{ padding: '1rem', background: totalDebtToday <= 0 ? 'rgba(255,255,255,0.02)' : 'rgba(248,113,113,0.07)', borderRadius: '10px', border: `1px solid ${totalDebtToday <= 0 ? 'rgba(255,255,255,0.06)' : 'rgba(248,113,113,0.3)'}` }}>
                            <div style={{ fontSize: '0.85rem', color: '#f87171', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              🏦 Clear debt first
                              <InfoTooltip text={`Each year's leftover Savings is directed to paying off your outstanding Liabilities (mortgages, loans, and any other debt) ahead of their default schedule. Your scheduled repayments already reduce the debt balance linearly in the background — the Savings here is extra, on top of that. Once all debt is cleared, the remaining Savings are redirected to investments at ${assumptions.investmentReturn}%/yr. Operates pre-retirement only — debt paydown stops at your Planned Retirement Age. If any loan or debt extends past your retirement date, remove that remaining balance from the Liabilities section and instead add the annual repayment as an expense category in your Retirement Budget with a phase-out year matching when the debt is fully repaid — this ensures the payments are correctly reflected in your retirement drawdown and nest egg sizing.`} />
                            </div>
                            {totalDebtToday <= 0
                              ? <div style={{ fontSize: '0.85rem', color: '#9ca3af', fontStyle: 'italic' }}>Already debt-free — same as investing all surplus.</div>
                              : <>
                                  <div style={{ fontSize: '0.85rem', color: '#e8e9ed', marginBottom: '0.85rem', lineHeight: 1.5 }}>Pay down {formatCurrencyDecimal(totalDebtToday, currency, exchangeRates)} debt first, then invest freed surplus.</div>
                                  <div style={{ height: '1px', background: 'rgba(248,113,113,0.2)', marginBottom: '0.75rem' }} />
                                  <div style={{ marginBottom: '0.65rem' }}>
                                    <div style={{ fontSize: '0.62rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontWeight: '600' }}>
                                      Debt-free age <span style={{ textTransform: 'none', color: '#4b5563', fontWeight: '400' }}>(default{debtFreeAge ? ` Age ${debtFreeAge}` : ': never in horizon'})</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                      {t2Sim.debtFreeAge
                                        ? <span style={{ fontSize: '1rem', fontWeight: '800', color: '#f87171', fontFamily: 'JetBrains Mono, monospace' }}>Age {t2Sim.debtFreeAge}</span>
                                        : <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontStyle: 'italic' }}>Beyond dashboard horizon</span>}
                                      {t2DebtDelta !== null && t2DebtDelta !== 0 && (
                                        <span style={{ fontSize: '0.72rem', color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>▲ {Math.abs(t2DebtDelta)} yrs earlier</span>
                                      )}
                                    </div>
                                  </div>
                                  <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '0.65rem' }} />
                                  <div>
                                    <div style={{ fontSize: '0.62rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontWeight: '600' }}>
                                      FI Age impact <span style={{ textTransform: 'none', color: '#4b5563', fontWeight: '400' }}>{t2HasBaseline ? `(default Age ${currentFiAge})` : '(no baseline — default never reached)'}</span>
                                    </div>
                                    {t2Sim.fiAgeResult
                                      ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                                          <span style={{ fontSize: '1rem', fontWeight: '800', color: '#34d399', fontFamily: 'JetBrains Mono, monospace' }}>Age {t2Sim.fiAgeResult}</span>
                                          {t2FiDelta !== null && deltaChip(t2FiDelta)}
                                        </div>
                                      : <span style={{ fontSize: '0.72rem', color: '#4b5563', fontStyle: 'italic' }}>Not reached within dashboard horizon</span>
                                    }
                                  </div>
                                </>
                            }
                          </div>

                          {/* Tile 3 — Custom split */}
                          <div style={{ padding: '1rem', background: 'rgba(167,139,250,0.07)', borderRadius: '10px', border: '1px solid rgba(167,139,250,0.3)' }}>
                            <div style={{ fontSize: '0.85rem', color: '#a78bfa', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>🎯 Custom split <InfoTooltip text={`Allocate each year's Savings however you like: a portion to investments, a portion to early debt repayment (mortgages, loans, and any other debt), and the rest held as idle cash (earning nothing). Debt mechanics and investment compounding work the same way as in the other tiles. Debt paydown stops at your Planned Retirement Age — if any loan or debt extends past your retirement date, remove that remaining balance from the Liabilities section and instead add the annual repayment as an expense category in your Retirement Budget with a phase-out year matching when the debt is fully repaid.`} /></div>
                            <div style={{ fontSize: '0.85rem', color: '#e8e9ed', marginBottom: '0.85rem', lineHeight: 1.5 }}>Split your surplus across invest, debt payoff, and cash.</div>
                            <div style={{ height: '1px', background: 'rgba(167,139,250,0.2)', marginBottom: '0.75rem' }} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '0.75rem' }}>
                              {[
                                { label: 'Invest', val: splitInvest, color: '#34d399', setter: setSurplusSplitInvest },
                                { label: 'Debt',   val: splitDebt,   color: '#f87171', setter: setSurplusSplitDebt   },
                              ].map(({ label, val, color, setter }) => (
                                <div key={label}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#e8e9ed', marginBottom: '0.2rem', fontWeight: '600' }}>
                                    <span>{label}</span>
                                    <span style={{ fontFamily: 'JetBrains Mono, monospace', color }}>{val}%</span>
                                  </div>
                                  <input type="range" min={0} max={100} value={val}
                                    onChange={(e) => {
                                      const raw = parseInt(e.target.value);
                                      const other = label === 'Invest' ? surplusSplitDebt : surplusSplitInvest;
                                      const v = Math.min(raw, 100 - other);
                                      setter(v);
                                    }}
                                    style={{ width: '100%', accentColor: color, cursor: 'pointer' }} />
                                </div>
                              ))}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#9ca3af', paddingTop: '0.1rem' }}>
                                <span>Cash (held idle)</span>
                                <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#60a5fa' }}>{splitCash}%</span>
                              </div>
                            </div>
                            <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '0.65rem' }} />
                            <div>
                              <div style={{ fontSize: '0.62rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem', fontWeight: '600' }}>
                                FI Age impact <span style={{ textTransform: 'none', color: '#4b5563', fontWeight: '400' }}>{t3HasBaseline ? `(default Age ${currentFiAge})` : '(no baseline — default never reached)'}</span>
                              </div>
                              {t3Sim.fiAgeResult
                                ? <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontSize: '1rem', fontWeight: '800', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>Age {t3Sim.fiAgeResult}</span>
                                    {t3Delta !== null && deltaChip(t3Delta)}
                                  </div>
                                : <span style={{ fontSize: '0.72rem', color: '#4b5563', fontStyle: 'italic' }}>Not reached within dashboard horizon</span>
                              }
                            </div>
                          </div>

                        </div>
                        <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.6rem' }}>Simplified model — investments only, no real estate or drawdown. To action a strategy, update your Finances tab and review the full Dashboard projection.</div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

          </div>
        )}


        {/* Retirement Tab — Budget → Health → Runway */}
        {activeTab === 'retirement' && (
          <div>

          {/* Retirement Budget (moved from Pre-Retirement tab) */}
            {/* Retirement Budget Calculator */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(167, 139, 250, 0.25)',
              borderRadius: '16px',
              padding: '2rem',
              marginTop: '2rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0, flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    🏖️ Retirement Budget
                    <InfoTooltip text="Plan what retirement will actually cost you, category by category — entered in today's terms, inflated forward by the model. This total drives all retirement projections: Nest Egg, Runway, and Monte Carlo. Set an end year on any category to phase it out during retirement (e.g. a mortgage ending, or school fees for a dependent). Phase-outs reduce Runway and Monte Carlo withdrawals from that year; the Required Nest Egg is always sized on your full Day 1 budget." />
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginTop: '0.25rem', marginBottom: '1rem' }}>
                    Enter amounts in <strong style={{ color: '#e8e9ed' }}>today's terms</strong> — projections grow them forward at each category's retirement growth rate.
                  </p>
                </div>
              </div>

              {/* Summary bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>Annual <InfoTooltip text="Total as entered today — not projected. Phase-out years are not reflected here." /></div>
                  <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{formatCurrencyDecimal(effectiveRetirementExpense, currency, exchangeRates)}</div>
                </div>
                <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.08)' }} />
                <div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>Monthly</div>
                  <div style={{ fontSize: '1rem', fontWeight: '600', color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{formatCurrencyDecimal(effectiveRetirementExpense / 12, currency, exchangeRates)}</div>
                </div>
                <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                  <div>
                    <div style={{ fontSize: '0.62rem', color: '#6b7280', marginBottom: '0.15rem' }}>Essential</div>
                    <div style={{ fontSize: '0.85rem', color: '#f87171', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}>{formatCurrencyDecimal(expenseCategories.filter(c=>(expenseTags[c.key]||c.group)==='essential').reduce((s,c)=>s+(retirementBudget[c.key]||0),0), currency, exchangeRates)}</div>
                    <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.1rem' }}>{effectiveRetirementExpense > 0 ? Math.round(expenseCategories.filter(c=>(expenseTags[c.key]||c.group)==='essential').reduce((s,c)=>s+(retirementBudget[c.key]||0),0) / effectiveRetirementExpense * 100) : 0}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.62rem', color: '#6b7280', marginBottom: '0.15rem' }}>Discretionary</div>
                    <div style={{ fontSize: '0.85rem', color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}>{formatCurrencyDecimal(expenseCategories.filter(c=>(expenseTags[c.key]||c.group)==='disc').reduce((s,c)=>s+(retirementBudget[c.key]||0),0), currency, exchangeRates)}</div>
                    <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.1rem' }}>{effectiveRetirementExpense > 0 ? Math.round(expenseCategories.filter(c=>(expenseTags[c.key]||c.group)==='disc').reduce((s,c)=>s+(retirementBudget[c.key]||0),0) / effectiveRetirementExpense * 100) : 0}%</div>
                  </div>
                </div>
                <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.08)', marginLeft: 'auto' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Planned Retirement</div>
                  <div style={{ fontSize: '1rem', fontWeight: '700', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>{retirementCalendarYear}</div>
                  <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.1rem' }}>Age {profile.retirementAge}</div>
                </div>
              </div>

              {/* Expense Categories */}
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: retCatCollapsed ? 0 : '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#e8e9ed' }}>Expense Categories</span>
                    <InfoTooltip text="Tag each row E (Essential) or D (Discretionary). The % box is the annual growth rate. The year box phases out that category from that calendar year onwards." />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: expenseViewMode === 'monthly' ? '#34d399' : '#4b5563' }}>Monthly</span>
                      <div onClick={() => setExpenseViewMode(v => v === 'annual' ? 'monthly' : 'annual')} style={{ width: '32px', height: '18px', borderRadius: '9px', background: expenseViewMode === 'monthly' ? '#34d399' : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: '2px', left: expenseViewMode === 'monthly' ? '16px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                      </div>
                    </div>
                    <button onClick={() => setRetCatCollapsed(v => !v)} style={{ fontSize: '0.72rem', color: '#9ca3af', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '0.2rem 0.55rem', cursor: 'pointer', flexShrink: 0 }}>
                      {retCatCollapsed ? '▼ Show' : '▲ Hide'}
                    </button>
                  </div>
                </div>
                {!retCatCollapsed && <div style={{ display: 'grid', gap: '0.75rem' }}>
                    {expenseCategories.map(cat => (
                      <CalcInput
                        key={cat.key}
                        icon={cat.icon || '📌'}
                        label={getCatLabel(cat.key)}
                        value={retirementBudget[cat.key] || 0}
                        field={cat.key}
                        tooltip={cat.tooltip || ''}
                        color={(expenseTags[cat.key] || cat.group) === 'essential' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(96, 165, 250, 0.15)'}
                        onChange={handleRetCalcChange}
                        currency={currency}
                        rate={exchangeRates[currency]}
                        tag={expenseTags[cat.key] || cat.group}
                        onTagToggle={() => setExpenseTags(prev => ({ ...prev, [cat.key]: (prev[cat.key] || cat.group) === 'essential' ? 'disc' : 'essential' }))}
                        growthRate={retExpenseGrowthRates[cat.key] !== undefined ? retExpenseGrowthRates[cat.key] : 3}
                        onGrowthChange={handleRetGrowthChange}
                        phaseOutYear={retExpensePhaseOutYears[cat.key]}
                        onPhaseOutChange={(e) => setRetExpensePhaseOutYears(prev => ({ ...prev, [cat.key]: e.target.value ? parseInt(e.target.value) : null }))}
                        onStartEdit={(key) => setEditingCatLabel(key)}
                        onRename={handleRenameCat}
                        isEditing={editingCatLabel === cat.key}
                        onRemove={handleRemoveCat}
                        canRemove={expenseCategories.filter(c => (expenseTags[c.key] || c.group) === (expenseTags[cat.key] || cat.group)).length > 1}
                        monthly={expenseViewMode === 'monthly'}
                      />
                    ))}
                    <button
                      onClick={() => handleAddCat('disc')}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '8px', color: '#6b7280', cursor: 'pointer', fontSize: '0.78rem', marginTop: '0.25rem', width: 'fit-content' }}
                    >
                      <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>+</span> Add category
                    </button>
                </div>}
              </div>

            </div>


            {/* ── Retirement Health Card ── 3-Question Report Card ── */}
            {(() => {
              const nominalRetirementExpense = getRetNominalForYear(new Date().getFullYear() + (profile.retirementAge - profile.currentAge));
              const monthly = Math.round(nominalRetirementExpense / 12);
              const swr = nestEggSwr;
              const annualNeed = monthly * 12;
              const requiredNestEgg = swr > 0 ? annualNeed / (swr / 100) : 0;
              const projectedWealth = retirementMetrics?.retirementWealth || 0;
              const successPct = retirementMetrics?.successProbability || 0;
              const gap = projectedWealth - requiredNestEgg;
              const onTrack = gap >= 0;
              const fundingPct = requiredNestEgg > 0 ? Math.min(150, (projectedWealth / requiredNestEgg) * 100) : 100;
              const absGap = Math.abs(gap);

              // Verdict
              // Six verdict states based on onTrack (Q1) and successPct (Q2)
              const isStrong       = onTrack && successPct >= MC_STRONG_THRESHOLD;
              const isOnTrackMod   = onTrack && successPct >= MC_CAUTION_THRESHOLD && !isStrong;
              const isOnTrackWeak  = onTrack && successPct < MC_CAUTION_THRESHOLD;
              const isGapStrong    = !onTrack && successPct >= MC_STRONG_THRESHOLD;
              const isGapMod       = !onTrack && successPct >= MC_CAUTION_THRESHOLD && !isGapStrong;
              // remaining: !onTrack && successPct < MC_CAUTION_THRESHOLD = worst case

              const isCaution = isOnTrackMod || isGapStrong || isGapMod;
              const isRed     = isOnTrackWeak || (!onTrack && successPct < MC_CAUTION_THRESHOLD);

              const verdictColor  = isStrong ? '#22c55e' : isCaution ? '#f59e0b' : '#f87171';
              const verdictBg     = isStrong ? 'rgba(34,197,94,0.08)' : isCaution ? 'rgba(245,158,11,0.08)' : 'rgba(248,113,113,0.08)';
              const verdictBorder = isStrong ? 'rgba(34,197,94,0.25)' : isCaution ? 'rgba(245,158,11,0.25)' : 'rgba(248,113,113,0.25)';
              const verdictIcon   = isStrong ? '✓' : isCaution ? '⚠' : '✗';
              const isCoasting = fiAge !== null && fiAge <= profile.retirementAge;
              const verdictShort = isStrong
                ? (isCoasting ? 'Strong retirement plan · Already coasting' : 'Strong retirement plan')
                : isOnTrackMod
                  ? 'Moderate risk — survival odds need attention'
                : isOnTrackWeak
                  ? 'High risk — survival odds are low despite meeting the nest egg target'
                : isGapStrong
                  ? 'Funding gap on retirement day, but survival odds are strong'
                : isGapMod
                  ? 'Funding gap detected'
                  : 'High risk — funding gap and low survival odds';
              const verdictDetail = isStrong
                ? (isCoasting
                    ? "You're on track and already coasting — your current investments will grow to your Required Nest Egg by retirement without any additional savings. Any surplus you deploy only accelerates your timeline further. Survival odds are high."
                    : "You're on track to meet your Required Nest Egg and survival odds are high. Your plan looks solid.")
                : isOnTrackMod
                  ? "Your projected Investments meet the Required Nest Egg target, but survival odds fall below 80% — consider revisiting your return assumptions or retirement spending."
                : isOnTrackWeak
                  ? "Your projected Investments meet the Required Nest Egg target, but survival odds are low. Consider reducing post-retirement expenses or seeking higher investment returns."
                : isGapStrong
                  ? "Your projected Investments fall short of the Required Nest Egg on retirement day. However, survival odds are strong — at your assumed return, your portfolio may continue growing and cover the gap over time."
                : isGapMod
                  ? "Your projected Investments fall short of the Required Nest Egg. To close the gap: invest more each month, seek higher returns on your portfolio, or delay retirement to allow more time for growth."
                  : "Your projected Investments fall well short of the Required Nest Egg, and survival odds are low. A significant course correction is needed — consider all three levers together.";

              // Gap-closing calcs — always computed, shown as N/A when not applicable
              const yearsToRetire = profile.retirementAge - profile.currentAge;
              const r = assumptions.investmentReturn / 100;
              let extraMonthly = null;
              let extraYears = null;
              let solvedReturn = null;
              let saveMoreNA = false;
              let retireLaterna = false;
              let returnNA = false;
              if (yearsToRetire > 0 && !onTrack) {
                // Save more
                const annuityFactor = r > 0 ? (Math.pow(1 + r, yearsToRetire) - 1) / r : yearsToRetire;
                const extraAnnual = annuityFactor > 0 ? Math.round(absGap / annuityFactor) : null;
                extraMonthly = extraAnnual ? Math.round(extraAnnual / 12) : null;
                if (extraMonthly === null) saveMoreNA = true;
                // Retire later — compounds existing investments AND adds net savings
                // (income minus expenses) during each additional working year.
                // Income grows at respective growth rates; expenses use pre-retirement budget.
                // If net savings is negative (deficit), only investment compounding applies.
                {
                  const retData = wealthProjection.find(function(d) { return d.age === profile.retirementAge; });
                  if (retData) {
                    let extInv = retData.investments;
                    const baseSalary = income.salaryItems && income.salaryItems.length > 0
                      ? income.salaryItems.reduce(function(s, i) { return s + (i.amount || 0); }, 0)
                      : (income.salary || 0);
                    const basePassive = income.passiveItems && income.passiveItems.length > 0
                      ? income.passiveItems.reduce(function(s, i) { return s + (i.amount || 0); }, 0)
                      : (income.passive || 0);
                    const baseOther = income.otherIncomeItems && income.otherIncomeItems.length > 0
                      ? income.otherIncomeItems.reduce(function(s, i) { return s + (i.amount || 0); }, 0)
                      : (income.other || 0);
                    const basePreRetExp = expenses.current || 0;
                    const salGr = (assumptions.salaryGrowth || 0) / 100;
                    const pasGr = (assumptions.passiveGrowth || 0) / 100;
                    const othGr = (assumptions.otherIncomeGrowth || 0) / 100;
                    const ytr = profile.retirementAge - profile.currentAge;
                    for (let yr = 1; yr <= 30; yr++) {
                      // Compound investments
                      extInv = extInv * (1 + r);
                      // Add net savings from continued work during this extra year
                      const extYearSalary = baseSalary * Math.pow(1 + salGr, ytr + yr);
                      const extYearPassive = basePassive * Math.pow(1 + pasGr, ytr + yr);
                      const extYearOther = baseOther * Math.pow(1 + othGr, ytr + yr);
                      const extYearIncome = extYearSalary + extYearPassive + extYearOther;
                      const netSavings = Math.max(0, extYearIncome - basePreRetExp);
                      extInv += netSavings;
                      const candidateAge = profile.retirementAge + yr;
                      const candidateCalYear = new Date().getFullYear() + (candidateAge - profile.currentAge);
                      const candidateNestEgg = nestEggSwr > 0 ? getRetNominalForYear(candidateCalYear) / (nestEggSwr / 100) : 0;
                      if (extInv >= candidateNestEgg) { extraYears = yr; break; }
                    }
                  }
                  if (extraYears === null) retireLaterna = true;
                }
                // Higher return — solve for the investment return needed so that investments
                // alone reach requiredNestEgg. SWR applies to liquid investments only;
                // real estate and other illiquid assets are excluded from both sides.
                // Surplus stays undeployed — consistent with base scenario.
                {
                  if (assets.investments > 0) {
                    const neededCagr = Math.pow(requiredNestEgg / assets.investments, 1 / yearsToRetire) - 1;
                    const neededReturnPct = Math.round(neededCagr * 1000) / 10;
                    if (neededReturnPct > 30) { returnNA = true; }
                    else { solvedReturn = neededReturnPct; returnNA = false; }
                  } else { returnNA = true; }
                }
              }

              // Survival odds
              const oddsLabel   = successPct >= MC_STRONG_THRESHOLD ? 'High confidence' : successPct >= MC_CAUTION_THRESHOLD ? 'Moderate confidence' : 'Low confidence';
              const oddsColor   = successPct >= MC_STRONG_THRESHOLD ? '#22c55e' : successPct >= MC_CAUTION_THRESHOLD ? '#f59e0b' : '#f87171';
              const oddsInWords = successPct >= MC_STRONG_THRESHOLD ? 'Very likely to last through retirement'
                : successPct >= MC_CAUTION_THRESHOLD ? 'May run short in some market scenarios'
                : 'Likely to run short — review spending or savings';

              return (
                <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', overflow: 'hidden' }}>
                  <div style={{ padding: '1.5rem 2rem 0 2rem' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                      🏁 Retirement Health
                      <InfoTooltip text="Two questions, one verdict: are you saving enough (Q1), and will it last (Q2)?" />
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: '0 0 1.25rem 0' }}>Are you saving enough, and will it last?</p>
                  </div>

                  <div style={{ padding: '0 2rem 1.75rem 2rem' }}>

                      {/* Verdict Banner */}
                      <div style={{ background: verdictBg, border: `1px solid ${verdictBorder}`, borderRadius: '10px', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: '800', color: verdictColor, lineHeight: 1 }}>{verdictIcon}</span>
                          <div style={{ fontSize: '0.88rem', color: '#e8e9ed', fontWeight: '600', lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>{verdictShort} <InfoTooltip text={verdictDetail} /></div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                          <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>SWR</span>
                          <input
                            type="text"
                            defaultValue={swr.toString()}
                            key={swr}
                            onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v > 0) { const clamped = clampSwr(v); setNestEggSwr(clamped); e.target.value = clamped.toString(); } else { e.target.value = swr.toString(); } }}
                            onChange={(e) => { const v = e.target.value; if (!/^\d*\.?\d*$/.test(v)) e.target.value = v.replace(/[^\d.]/g,''); }}
                            style={{ width: '48px', padding: '0.25rem 0.4rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '6px', color: '#e8e9ed', fontSize: '0.85rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}
                          />
                          <span style={{ fontSize: '0.72rem', color: '#6b7280' }}>%</span>
                          <InfoTooltip text={`Safe Withdrawal Rate — the % of your nest egg you withdraw in year one of retirement, then adjust for inflation annually. The 4% rule (Trinity Study, 1998) sustains a balanced portfolio across 95%+ of 30-year windows — drop to 3–3.5% for 35+ year retirements or early retirement. Above 4% failure risk rises sharply. SWR only shifts the Required Nest Egg target (spend ÷ SWR) and FI Age — it does NOT affect Runway Survival Odds, which are driven purely by your actual investment balance and real retirement spending across 1,000 simulated scenarios, making them the more honest measure of whether your plan holds up.`} />
                        </div>
                      </div>

                      {/* Q1 */}
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          Q1 — How much do you need, and are you on track?
                          <InfoTooltip text={`Will your investments be large enough to retire on the day you plan to? Required Nest Egg = retirement budget (inflated to retirement day) ÷ SWR — the lump sum needed for withdrawals to theoretically last indefinitely. Projected Investments = current portfolio compounded to retirement, without new savings (use Surplus Deployment in the Dashboard tab to model those). The funding bar shows % covered. Note: nest egg uses Day 1 budget conservatively — Survival Odds (Q2) accounts for phase-outs and is more precise.`} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', alignItems: 'stretch', marginBottom: '0.85rem' }}>
                          <div style={{ padding: '1rem', background: 'rgba(167,139,250,0.07)', borderRadius: '10px', border: '1px solid rgba(167,139,250,0.18)', textAlign: 'center', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Required Nest Egg
                              <InfoTooltip text={`Annual retirement spend (${formatCurrencyDecimal(annualNeed, currency, exchangeRates)}/yr nominal at age ${profile.retirementAge}) ÷ ${swr}% SWR. Sized using your full Day 1 retirement budget — a conservative starting point that ignores any phase-outs that happen during retirement. Phase-outs reduce your actual withdrawals over time, which is reflected in the Runway chart and Monte Carlo success probability.`} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{formatCurrencyDecimal(requiredNestEgg, currency, exchangeRates)}</div>
                              {(() => {
                                const activeCategories = expenseCategories.filter(c => (retirementBudget[c.key] || 0) > 0);
                                if (activeCategories.length === 0 || requiredNestEgg === 0) return null;
                                return (
                                  <button
                                    onClick={() => setNestEggBreakdownOpen(v => !v)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.58rem', color: '#a78bfa', padding: '0.15rem 0.45rem', fontWeight: 600, lineHeight: 1.2 }}
                                  >
                                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                                      <circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
                                      <line x1="7.2" y1="7.2" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                      <line x1="4.5" y1="3" x2="4.5" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                      <line x1="3" y1="4.5" x2="6" y2="4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                    </svg>
                                    breakdown
                                  </button>
                                );
                              })()}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.35rem' }}>{formatCurrencyDecimal(monthly, currency, exchangeRates)}/mo in retirement</div>
                          </div>
                          <div style={{ padding: '1rem', background: 'rgba(96,165,250,0.07)', borderRadius: '10px', border: '1px solid rgba(96,165,250,0.18)', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Projected Investments at {profile.retirementAge}
                              <InfoTooltip text={`Your projected Investment portfolio at retirement age ${profile.retirementAge}, based on your current investments compounding at your assumed return. Only liquid Investments count toward the SWR-based nest egg target — real estate and other illiquid assets are excluded. Surplus is not automatically reinvested; deploy it via Surplus Deployment in the Dashboard tab to improve this figure.`} />
                            </div>
                            <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{formatCurrencyDecimal(projectedWealth, currency, exchangeRates)}</div>
                            <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.35rem' }}>on current trajectory</div>
                          </div>
                          <div style={{ padding: '1rem', background: onTrack ? 'rgba(34,197,94,0.07)' : 'rgba(248,113,113,0.07)', borderRadius: '10px', border: `1px solid ${onTrack ? 'rgba(34,197,94,0.2)' : 'rgba(248,113,113,0.2)'}`, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '0.68rem', color: '#9ca3af', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{onTrack ? 'Surplus' : 'Retirement Gap'}</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: onTrack ? '#22c55e' : '#f87171', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>
                              {onTrack ? '+' : '−'}{formatCurrencyDecimal(Math.abs(gap), currency, exchangeRates)}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: onTrack ? '#22c55e' : '#f87171', marginTop: '0.35rem', fontWeight: '600' }}>{onTrack ? 'ahead of target' : 'below target'}</div>
                          </div>
                        </div>

                        {/* Nest Egg Breakdown popup — fixed overlay, outside grid so cards stay aligned */}
                        {nestEggBreakdownOpen && (() => {
                          const popupCats = expenseCategories
                            .filter(c => (retirementBudget[c.key] || 0) > 0)
                            .map(cat => {
                              const todayAmt = retirementBudget[cat.key] || 0;
                              const growthRate = (retExpenseGrowthRates[cat.key] !== undefined ? retExpenseGrowthRates[cat.key] : 3) / 100;
                              const yearsToRet = profile.retirementAge - profile.currentAge;
                              const retNominal = todayAmt * Math.pow(1 + growthRate, yearsToRet);
                              const nestEggCost = nestEggSwr > 0 ? retNominal / (nestEggSwr / 100) : 0;
                              const isEssential = (expenseTags[cat.key] || cat.group) === 'essential';
                              return { cat, todayAmt, retNominal, nestEggCost, isEssential };
                            })
                            .sort((a, b) => b.nestEggCost - a.nestEggCost);
                          return (
                            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => setNestEggBreakdownOpen(false)}>
                              <div style={{ background: 'rgba(10,22,40,0.98)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '14px', padding: '1.5rem', minWidth: '400px', maxWidth: '540px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
                                onClick={e => e.stopPropagation()}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                  <div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e8e9ed' }}>Nest Egg by Category</div>
                                    <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.2rem' }}>Sorted by required nest egg · {nestEggSwr}% SWR at age {profile.retirementAge}</div>
                                  </div>
                                  <button onClick={() => setNestEggBreakdownOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#9ca3af', cursor: 'pointer', padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}>✕</button>
                                </div>
                                {/* Header */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px', gap: '0.5rem', marginBottom: '0.4rem', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                                  <span style={{ fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Category</span>
                                  <span style={{ fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Ret. Exp/yr</span>
                                  <span style={{ fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Required Nest Egg</span>
                                </div>
                                {popupCats.map(({ cat, retNominal, nestEggCost, isEssential }) => (
                                  <div key={cat.key} style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px', gap: '0.5rem', alignItems: 'center', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <span style={{ fontSize: '0.6rem', color: isEssential ? '#f87171' : '#60a5fa', background: isEssential ? 'rgba(239,68,68,0.1)' : 'rgba(96,165,250,0.1)', padding: '0.04rem 0.25rem', borderRadius: '3px', fontWeight: 700 }}>{isEssential ? 'E' : 'D'}</span>
                                      <span style={{ fontSize: '0.78rem', color: '#d1d5db' }}>{getCatLabel(cat.key)}</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{formatCurrencyDecimal(retNominal, currency, exchangeRates)}</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{formatCurrencyDecimal(nestEggCost, currency, exchangeRates)}</span>
                                  </div>
                                ))}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 100px', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 0 0', marginTop: '0.3rem', borderTop: '1px solid rgba(167,139,250,0.3)' }}>
                                  <span style={{ fontSize: '0.78rem', color: '#e8e9ed', fontWeight: 700 }}>Total</span>
                                  <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{formatCurrencyDecimal(effectiveRetirementExpense, currency, exchangeRates)}</span>
                                  <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{formatCurrencyDecimal(requiredNestEgg, currency, exchangeRates)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Funding bar */}
                        <div style={{ marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.68rem', color: '#6b7280', marginBottom: '0.4rem' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              Nest egg funded
                              <InfoTooltip text={`How far along you are: ${Math.min(100, Math.round(fundingPct))}% of your nest egg target is covered by projected wealth.`} />
                            </span>
                            <span style={{ fontFamily: 'JetBrains Mono, monospace', color: onTrack ? '#22c55e' : '#f87171', fontWeight: '700' }}>{Math.min(100, Math.round(fundingPct))}%{fundingPct >= 100 ? ' ✓' : ''}</span>
                          </div>
                          <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.min(100, fundingPct)}%`, background: onTrack ? 'linear-gradient(90deg,#22c55e,#34d399)' : 'linear-gradient(90deg,#f87171,#fb923c)', borderRadius: '4px', transition: 'width 0.5s ease' }} />
                          </div>
                        </div>

                        {/* Ways to close gap — subsection panel, collapsed by default */}
                        {!onTrack && (() => {
                          const gapOpen = expandedCategories.gapClosing === true;
                          return (
                            <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: gapOpen ? '0.85rem' : 0 }}>
                                <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  🔧 Ways to close the {formatCurrencyDecimal(absGap, currency, exchangeRates)} gap
                                  <InfoTooltip text="Three independent levers — each shows what it would take to close the gap if that one factor changed while everything else stayed the same. Only liquid Investments are included in these calculations — illiquid assets like real estate are excluded. Converting illiquid wealth to Investments would improve your position further. Combining levers would close the gap faster." />
                                </div>
                                <button onClick={() => setExpandedCategories(p => ({...p, gapClosing: !gapOpen}))} style={{ fontSize: '0.72rem', color: '#9ca3af', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '0.2rem 0.55rem', cursor: 'pointer', flexShrink: 0 }}>
                                  {gapOpen ? '▲ Hide Details' : '▼ Show Details'}
                                </button>
                              </div>
                              {gapOpen && (
                                <div>
                                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                                    <div style={{ padding: '0.85rem', background: saveMoreNA ? 'rgba(255,255,255,0.02)' : 'rgba(96,165,250,0.07)', borderRadius: '8px', border: `1px solid ${saveMoreNA ? 'rgba(255,255,255,0.06)' : 'rgba(96,165,250,0.2)'}` }}>
                                      <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>💰 Save more <InfoTooltip text={`Extra amount to invest on top of your current base scenario — assumes a fixed monthly amount invested immediately each month at your preset Investment return of ${assumptions.investmentReturn}%/yr, compounded annually until retirement. In reality your savings fluctuate year-to-year, but this simplified figure gives you a constant target to aim for. All other factors remain unchanged from your base scenario. Note: this figure does not include your existing surplus — any surplus you already have (see Surplus Deployment in the Dashboard tab) can be applied toward this amount.`} /></div>
                                      {saveMoreNA ? <div style={{ fontSize: '0.8rem', color: '#4b5563', fontStyle: 'italic' }}>Not calculable</div>
                                        : <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace' }}>+{formatCurrencyDecimal(extraMonthly, currency, exchangeRates)}/mo</div>}
                                      <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.2rem' }}>constant monthly amount · invested at {assumptions.investmentReturn}%/yr · compounded until retirement</div>
                                      {!saveMoreNA && annualSavings > 0 && <div style={{ fontSize: '0.62rem', color: '#60a5fa', marginTop: '0.25rem', opacity: 0.8 }}>↳ Your current surplus of {formatCurrencyDecimal(annualSavings / 12, currency, exchangeRates)}/mo (today) can offset this</div>}
                                    </div>
                                    <div style={{ padding: '0.85rem', background: retireLaterna ? 'rgba(255,255,255,0.02)' : 'rgba(167,139,250,0.07)', borderRadius: '8px', border: `1px solid ${retireLaterna ? 'rgba(255,255,255,0.06)' : 'rgba(167,139,250,0.2)'}` }}>
                                      <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📅 Retire later <InfoTooltip text="How many extra working years close the gap. During each additional year, your portfolio compounds at your preset return AND your net savings (income minus expenses, if positive) are added — with income growing at your configured growth rates. To model the effect of actively deploying your surplus to retire faster, see Surplus Deployment in the Dashboard tab." /></div>
                                      {retireLaterna ? <div style={{ fontSize: '0.8rem', color: '#4b5563', fontStyle: 'italic' }}>Gap too large to close by working longer</div>
                                        : <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>+{extraYears} yr{extraYears !== 1 ? 's' : ''}</div>}
                                      <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.2rem' }}>{retireLaterna ? '' : `retire at age ${profile.retirementAge + extraYears} · no other changes`}</div>
                                    </div>
                                    {(() => {
                                      const returnDelta = solvedReturn !== null ? Math.round((solvedReturn - assumptions.investmentReturn) * 10) / 10 : null;
                                      return (
                                      <div style={{ padding: '0.85rem', background: returnNA ? 'rgba(255,255,255,0.02)' : 'rgba(245,158,11,0.07)', borderRadius: '8px', border: `1px solid ${returnNA ? 'rgba(255,255,255,0.06)' : 'rgba(245,158,11,0.2)'}` }}>
                                        <div style={{ fontSize: '0.65rem', color: '#9ca3af', marginBottom: '0.35rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>📈 Higher return <InfoTooltip text={`The return needed on your Investment portfolio to reach your Required Nest Egg, with everything else unchanged. Only liquid Investments are included — illiquid assets are excluded. Converting illiquid wealth to Investments would reduce the return required. Any savings you accumulate are assumed uninvested. To model the effect of deploying your surplus, see Surplus Deployment in the Dashboard tab.`} /></div>
                                        {returnNA ? <div style={{ fontSize: '0.8rem', color: '#4b5563', fontStyle: 'italic' }}>Would require unrealistic returns (&gt;30%/yr)</div>
                                          : <div style={{ fontSize: '1.05rem', fontWeight: '800', color: '#f59e0b', fontFamily: 'JetBrains Mono, monospace' }}>{solvedReturn}%/yr {returnDelta !== null && returnDelta > 0 && <span style={{ fontSize: '0.72rem', fontWeight: '600', color: '#f59e0b', opacity: 0.75 }}>(+{returnDelta}pp)</span>}</div>}
                                        <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.2rem' }}>{returnNA ? '' : `on Investments only · your current rate is ${assumptions.investmentReturn}%`}</div>
                                      </div>
                                      );
                                    })()}
                                  </div>
                                  <div style={{ fontSize: '0.62rem', color: '#4b5563', marginTop: '0.6rem' }}>Each lever shown independently — one variable changes, everything else stays as your base scenario. A combination of levers would close the gap faster.</div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Divider */}
                      <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '1.25rem' }} />

                      {/* Q2 */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: '700', marginBottom: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          Q2 — Will your money last through retirement?
                          <InfoTooltip text={`Will your money actually last through retirement? 1,000 market scenarios run against your Investment portfolio from retirement day. Returns are normally distributed — most scenarios cluster around your assumed return, with occasional large swings in either direction. The volatility % controls how wide those swings are. Each scenario withdraws inflation-adjusted expenses respecting your phase-out years. % shown = scenarios still solvent at age ${profile.lifeExpectancy}. Above 80% = strong · 60–80% = caution · below 60% = high risk. NOT affected by SWR — only by your real balance and real spending.`} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1.5rem', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: '0.95rem', fontWeight: '600', color: oddsColor, marginBottom: '0.75rem', lineHeight: 1.3 }}>{oddsInWords}</div>
                            <div style={{ position: 'relative', marginBottom: '0.5rem' }}>
                              <div style={{ display: 'flex', height: '14px', borderRadius: '7px', overflow: 'hidden' }}>
                                <div style={{ width: '60%', background: 'rgba(248,113,113,0.25)' }} />
                                <div style={{ width: '20%', background: 'rgba(245,158,11,0.25)' }} />
                                <div style={{ width: '20%', background: 'rgba(34,197,94,0.25)' }} />
                              </div>
                              <div style={{ position: 'absolute', top: '-3px', left: `${Math.min(98, Math.max(2, successPct))}%`, transform: 'translateX(-50%)', width: '4px', height: '20px', background: oddsColor, borderRadius: '2px', boxShadow: `0 0 6px ${oddsColor}` }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#4b5563', marginBottom: '0.6rem' }}>
                              <span>0%</span><span>60% moderate</span><span>80% strong</span><span>100%</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                              <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>1,000 market scenarios · volatility:</span>
                              <input
                                type="text"
                                defaultValue={assumptions.investmentStdDev.toString()}
                                key={assumptions.investmentStdDev}
                                onBlur={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 1 && v <= 40) { setAssumptions({...assumptions, investmentStdDev: v}); } else { e.target.value = assumptions.investmentStdDev.toString(); } }}
                                onChange={(e) => { const v = e.target.value; if (!/^\d*\.?\d*$/.test(v)) e.target.value = v.replace(/[^\d.]/g,''); }}
                                style={{ width: '44px', padding: '0.25rem 0.3rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '6px', color: '#e8e9ed', fontSize: '0.75rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}
                              />
                              <span style={{ fontSize: '0.65rem', color: '#4b5563' }}>%</span>
                              <InfoTooltip text="Annual volatility (standard deviation) of investment returns. 12% is typical for a diversified equity portfolio." />
                            </div>
                          </div>
                          <div style={{ textAlign: 'center', minWidth: '110px' }}>
                            <div style={{ fontSize: '3rem', fontWeight: '800', color: oddsColor, fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{Math.round(successPct)}%</div>
                            <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '0.3rem', lineHeight: 1.4 }}>survival<br/>odds</div>
                            <div style={{ marginTop: '0.5rem', padding: '0.2rem 0.6rem', background: `${oddsColor}18`, border: `1px solid ${oddsColor}40`, borderRadius: '20px', fontSize: '0.62rem', fontWeight: '700', color: oddsColor }}>{oddsLabel}</div>
                            {wealthProjection.exhaustionAge && (
                              <div style={{ marginTop: '0.6rem', padding: '0.35rem 0.5rem', background: 'rgba(248,113,113,0.1)', borderRadius: '8px', border: '1px solid rgba(248,113,113,0.3)' }}>
                                <div style={{ fontSize: '0.65rem', fontWeight: '700', color: '#f87171' }}>⚠ Runs out</div>
                                <div style={{ fontSize: '0.62rem', color: '#f87171' }}>at age {wealthProjection.exhaustionAge}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                  </div>
                </div>
              );
            })()}


            {/* ── Retirement Runway Chart ── Phase 4D ── */}
            {(() => {
              // simulateRunway: project investment balance from retirement to life expectancy
              // No default params — explicit fallbacks inside body
              const simulateRunway = (returnRate, spendMultiplier) => {
                const safeReturn = returnRate !== undefined ? returnRate : assumptions.investmentReturn;
                const safeMultiplier = spendMultiplier !== undefined ? spendMultiplier : 1;
                const retirementData = wealthProjection.find(function(d) { return d.age === profile.retirementAge; });
                const startBalance = retirementData ? retirementData.investments : 0;
                const retirementCalendarYear = new Date().getFullYear() + (profile.retirementAge - profile.currentAge);
                const yearsToRetirement = profile.retirementAge - profile.currentAge;
                const result = [];
                let balance = startBalance;
                for (let age = profile.retirementAge; age <= profile.lifeExpectancy; age++) {
                  const yearsIn = age - profile.retirementAge;
                  const calYear = retirementCalendarYear + yearsIn;
                  // Per-category nominal spend — consistent with getRetNominalForYear
                  const inflationAdjusted = expenseCategories.reduce((s, cat) => {
                    const po = retExpensePhaseOutYears[cat.key];
                    if (po && calYear >= po) return s;
                    const base = retirementBudget[cat.key] || 0;
                    const rate = (retExpenseGrowthRates[cat.key] || 0) / 100;
                    return s + base * Math.pow(1 + rate, yearsToRetirement + yearsIn);
                  }, 0) * safeMultiplier;
                  const oneTimeHit = oneTimeExpenses.find(function(e) { return e.year === calYear; });
                  const oneTimeAmount = (() => {
                    if (!oneTimeHit) return 0;
                    const cat = oneTimeHit.category && oneTimeHit.category !== 'none' ? oneTimeHit.category : null;
                    const preRate = cat ? ((expenseGrowthRates[cat] || 0) / 100) : 0;
                    const retRate = cat ? ((retExpenseGrowthRates[cat] || 0) / 100) : 0;
                    return oneTimeHit.amount * Math.pow(1 + preRate, yearsToRetirement) * Math.pow(1 + retRate, yearsIn);
                  })();
                  // Net passive + other income against withdrawal — resolve sub-items with endYear
                  const passiveGrowth = (assumptions.passiveGrowth || 0) / 100;
                  const otherGrowth   = (assumptions.otherIncomeGrowth || 0) / 100;
                  const yearsTotal    = yearsToRetirement + yearsIn;
                  const passiveInRet  = (() => {
                    const items = income.passiveItems && income.passiveItems.length > 0 ? income.passiveItems : null;
                    if (!items) return (income.passive || 0) * Math.pow(1 + passiveGrowth, yearsTotal);
                    return items.reduce((sum, item) => {
                      if (item.endYear && calYear >= item.endYear) return sum;
                      return sum + (item.amount || 0) * Math.pow(1 + passiveGrowth, yearsTotal);
                    }, 0);
                  })();
                  const otherInRet    = (() => {
                    const items = income.otherIncomeItems && income.otherIncomeItems.length > 0 ? income.otherIncomeItems : null;
                    if (!items) return (income.other || 0) * Math.pow(1 + otherGrowth, yearsTotal);
                    return items.reduce((sum, item) => {
                      if (item.endYear && calYear >= item.endYear) return sum;
                      return sum + (item.amount || 0) * Math.pow(1 + otherGrowth, yearsTotal);
                    }, 0);
                  })();
                  const netWithdrawal = Math.max(0, inflationAdjusted + oneTimeAmount - passiveInRet - otherInRet);
                  result.push({ age: age, balance: Math.round(Math.max(0, balance)) });
                  if (age > profile.retirementAge) {
                    balance = Math.max(0, balance * (1 + safeReturn / 100) - netWithdrawal);
                  } else {
                    balance = Math.max(0, balance * (1 + safeReturn / 100));
                  }
                }
                return result;
              };

              // Retirement-year nominal spend for stat card display (per-category rates, phase-outs respected)
              const retCalYearForDisplay = new Date().getFullYear() + (profile.retirementAge - profile.currentAge);
              const retYearNominalSpend = getRetNominalForYear(retCalYearForDisplay);

              const findExhaustion = function(runData) {
                const hit = runData.find(function(d) { return d.balance === 0; });
                return hit ? hit.age : null;
              };

              const pessimisticReturn = assumptions.investmentReturn + runwayConservativeOffset;
              const baseReturn = assumptions.investmentReturn;
              const optimisticReturn = assumptions.investmentReturn + runwayOptimisticOffset;
              const pessSpendMult = 1 + runwayPessSpend / 100;   // higher spend = worse
              const optSpendMult = 1 - runwayOptSpend / 100;     // lower spend = better

              const pessimisticData = simulateRunway(pessimisticReturn, pessSpendMult);
              const baseData = simulateRunway(baseReturn, 1);
              const optimisticData = simulateRunway(optimisticReturn, optSpendMult);

              // Merge into single array keyed by age for LineChart
              const runwayChartData = pessimisticData.map(function(d) {
                const b = baseData.find(function(x) { return x.age === d.age; });
                const o = optimisticData.find(function(x) { return x.age === d.age; });
                return {
                  age: d.age,
                  pessimistic: d.balance,
                  base: b ? b.balance : null,
                  optimistic: o ? o.balance : null,
                };
              });

              const exPessimistic = findExhaustion(pessimisticData);
              const exBase = findExhaustion(baseData);
              const exOptimistic = findExhaustion(optimisticData);

              const runwayYears = function(ex) {
                return ex !== null ? ex - profile.retirementAge : profile.lifeExpectancy - profile.retirementAge;
              };

              const RUNWAY_LINES = [
                { key: 'pessimistic', label: 'Pessimistic', color: '#f87171', strokeWidth: 1.5, dasharray: '5 3' },
                { key: 'base', label: 'Base', color: '#60a5fa', strokeWidth: 2.5, dasharray: '' },
                { key: 'optimistic', label: 'Optimistic', color: '#34d399', strokeWidth: 1.5, dasharray: '5 3' },
              ];

              const toggleRunwayLine = function(key) {
                setRunwayHiddenLines(function(prev) {
                  const next = {};
                  Object.keys(prev).forEach(function(k) { next[k] = prev[k]; });
                  next[key] = !prev[key];
                  return next;
                });
              };

              if (!assumptions.enableDrawdown) {
                return (
                  <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '2rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>🛬</div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '600', color: '#e8e9ed', marginBottom: '0.5rem' }}>Retirement Runway</h3>
                    <p style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '1rem' }}>Simulate how long your portfolio lasts under different market conditions.</p>
                    <button
                      onClick={() => setAssumptions({...assumptions, enableDrawdown: true})}
                      style={{ padding: '0.6rem 1.5rem', background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.4)', borderRadius: '8px', color: '#a78bfa', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}
                    >
                      Enable Drawdown Mode
                    </button>
                    <div style={{ fontSize: '0.72rem', color: '#4b5563', marginTop: '0.6rem' }}>You can also toggle this in the Assets card on the Finances tab</div>
                  </div>
                );
              }

              return (
                <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '2rem', position: 'relative', zIndex: 10 }}>
                  {/* Header */}
                  <div style={{ marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0 0.25rem 0' }}>
                      🛬 Retirement Runway
                      <InfoTooltip text={`Each year in retirement your investment balance compounds at the scenario return, then inflation-adjusted expenses are withdrawn (Investments only — real estate and other assets are treated as illiquid). Three lines show your portfolio through retirement — pessimistic (lower return + higher spend), base (your assumptions), and optimistic (higher return + lower spend). Adjust the sliders below to change each scenario's assumptions. When a line hits zero the portfolio is exhausted. The spending reduction slider models a more frugal retirement.`} />
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: 0 }}>How long your investment portfolio survives under three return scenarios</p>
                  </div>

                  {/* Stat cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginBottom: '1.5rem' }}>

                    {/* Pessimistic */}
                    {(() => {
                      const survives = exPessimistic === null;
                      const baseRate = assumptions.investmentReturn;
                      const baseSpend = retYearNominalSpend;
                      return (
                        <div style={{ padding: '0.85rem 1rem', background: 'rgba(248,113,113,0.05)', borderRadius: '10px', border: '1px solid rgba(248,113,113,0.3)' }}>
                          <div style={{ fontSize: '0.7rem', color: '#f87171', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Pessimistic</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: survives ? '#34d399' : '#e8e9ed', lineHeight: 1 }}>{runwayYears(exPessimistic)}<span style={{ fontSize: '0.8rem', color: '#6b7280', fontFamily: 'system-ui', marginLeft: '0.2rem' }}>yrs</span></div>
                          <div style={{ fontSize: '0.68rem', color: survives ? '#34d399' : '#9ca3af', marginTop: '0.2rem' }}>{survives ? '✓ Survives to ' + profile.lifeExpectancy : '⚠ Exhausted age ' + exPessimistic}</div>
                          <div style={{ fontSize: '0.68rem', color: '#f87171', marginTop: '0.15rem', fontFamily: 'JetBrains Mono, monospace' }}>{baseRate}% → {pessimisticReturn}%/yr</div>
                          <div style={{ fontSize: '0.68rem', color: '#f87171', marginTop: '0.05rem', fontFamily: 'JetBrains Mono, monospace' }}>{formatCurrency(baseSpend, currency, exchangeRates)}{runwayPessSpend > 0 ? ` → ${formatCurrency(baseSpend * pessSpendMult, currency, exchangeRates)}/yr` : '/yr spend'}</div>
                          {/* Return slider */}
                          <div style={{ marginTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.6rem' }}>
                            {(() => {
                              const pessMin = Math.max(-8, 1 - assumptions.investmentReturn);
                              const clampedOffset = Math.max(pessMin, runwayConservativeOffset);
                              if (clampedOffset !== runwayConservativeOffset) setRunwayConservativeOffset(clampedOffset);
                              return (
                                <>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>Return offset</span>
                                    <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: '#f87171', fontWeight: '700' }}>{runwayConservativeOffset}pp</span>
                                  </div>
                                  <input type="range" min={pessMin} max={-1} step={1} value={runwayConservativeOffset}
                                    onChange={function(e) { setRunwayConservativeOffset(parseInt(e.target.value, 10)); }}
                                    style={{ width: '100%', accentColor: '#f87171' }} />
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#4b5563' }}><span>{pessMin}pp</span><span>−1pp</span></div>
                                </>
                              );
                            })()}
                          </div>
                          {/* Spend slider */}
                          <div style={{ marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>Spend increase</span>
                              <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: runwayPessSpend > 0 ? '#f87171' : '#4b5563', fontWeight: '700' }}>{runwayPessSpend > 0 ? '+' + runwayPessSpend + '%' : 'Off'}</span>
                            </div>
                            <input type="range" min={0} max={50} step={5} value={runwayPessSpend}
                              onChange={function(e) { setRunwayPessSpend(parseInt(e.target.value, 10)); }}
                              style={{ width: '100%', accentColor: '#f87171' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#4b5563' }}><span>0%</span><span>+50%</span></div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Base — locked benchmark */}
                    {(() => {
                      const survives = exBase === null;
                      return (
                        <div style={{ padding: '0.85rem 1rem', background: 'rgba(96,165,250,0.04)', borderRadius: '10px', border: '1px solid rgba(96,165,250,0.2)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                            <div style={{ fontSize: '0.7rem', color: '#60a5fa', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base</div>
                            <div style={{ fontSize: '0.6rem', color: '#4b5563', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.1rem 0.35rem' }}>benchmark</div>
                          </div>
                          <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: survives ? '#34d399' : '#e8e9ed', lineHeight: 1 }}>{runwayYears(exBase)}<span style={{ fontSize: '0.8rem', color: '#6b7280', fontFamily: 'system-ui', marginLeft: '0.2rem' }}>yrs</span></div>
                          <div style={{ fontSize: '0.68rem', color: survives ? '#34d399' : '#9ca3af', marginTop: '0.2rem' }}>{survives ? '✓ Survives to ' + profile.lifeExpectancy : '⚠ Exhausted age ' + exBase}</div>
                          <div style={{ fontSize: '0.68rem', color: '#60a5fa', marginTop: '0.15rem', fontFamily: 'JetBrains Mono, monospace' }}>{baseReturn}%/yr</div>
                          <div style={{ fontSize: '0.68rem', color: '#60a5fa', marginTop: '0.05rem', fontFamily: 'JetBrains Mono, monospace' }}>{formatCurrency(retYearNominalSpend, currency, exchangeRates)}/yr spend</div>
                          <div style={{ marginTop: '0.75rem', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ fontSize: '0.65rem', color: '#4b5563', lineHeight: 1.5 }}>Uses your configured investment return and retirement spend — no adjustments. This is your plan as entered.</div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Optimistic */}
                    {(() => {
                      const survives = exOptimistic === null;
                      const baseRate = assumptions.investmentReturn;
                      const baseSpend = retYearNominalSpend;
                      return (
                        <div style={{ padding: '0.85rem 1rem', background: 'rgba(52,211,153,0.05)', borderRadius: '10px', border: '1px solid rgba(52,211,153,0.3)' }}>
                          <div style={{ fontSize: '0.7rem', color: '#34d399', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>Optimistic</div>
                          <div style={{ fontSize: '1.4rem', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace', color: survives ? '#34d399' : '#e8e9ed', lineHeight: 1 }}>{runwayYears(exOptimistic)}<span style={{ fontSize: '0.8rem', color: '#6b7280', fontFamily: 'system-ui', marginLeft: '0.2rem' }}>yrs</span></div>
                          <div style={{ fontSize: '0.68rem', color: survives ? '#34d399' : '#9ca3af', marginTop: '0.2rem' }}>{survives ? '✓ Survives to ' + profile.lifeExpectancy : '⚠ Exhausted age ' + exOptimistic}</div>
                          <div style={{ fontSize: '0.68rem', color: '#34d399', marginTop: '0.15rem', fontFamily: 'JetBrains Mono, monospace' }}>{baseRate}% → {optimisticReturn}%/yr</div>
                          <div style={{ fontSize: '0.68rem', color: '#34d399', marginTop: '0.05rem', fontFamily: 'JetBrains Mono, monospace' }}>{formatCurrency(baseSpend, currency, exchangeRates)}{runwayOptSpend > 0 ? ` → ${formatCurrency(baseSpend * optSpendMult, currency, exchangeRates)}/yr` : '/yr spend'}</div>
                          {/* Return slider */}
                          <div style={{ marginTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '0.6rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>Return offset</span>
                              <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: '#34d399', fontWeight: '700' }}>+{runwayOptimisticOffset}pp</span>
                            </div>
                            <input type="range" min={1} max={8} step={1} value={runwayOptimisticOffset}
                              onChange={function(e) { setRunwayOptimisticOffset(parseInt(e.target.value, 10)); }}
                              style={{ width: '100%', accentColor: '#34d399' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#4b5563' }}><span>+1pp</span><span>+8pp</span></div>
                          </div>
                          {/* Spend slider */}
                          <div style={{ marginTop: '0.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
                              <span style={{ fontSize: '0.62rem', color: '#6b7280' }}>Spend cut</span>
                              <span style={{ fontSize: '0.72rem', fontFamily: 'JetBrains Mono, monospace', color: runwayOptSpend > 0 ? '#34d399' : '#4b5563', fontWeight: '700' }}>{runwayOptSpend > 0 ? '−' + runwayOptSpend + '%' : 'Off'}</span>
                            </div>
                            <input type="range" min={0} max={50} step={5} value={runwayOptSpend}
                              onChange={function(e) { setRunwayOptSpend(parseInt(e.target.value, 10)); }}
                              style={{ width: '100%', accentColor: '#34d399' }} />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#4b5563' }}><span>0%</span><span>−50%</span></div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Chart */}
                  <ResponsiveContainer width="100%" height={380} style={{ overflow: 'visible' }}>
                    <LineChart data={runwayChartData} margin={{ top: 40, right: 20, bottom: 20, left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="age" stroke="#9ca3af" tick={{ fill: '#9ca3af', fontSize: 11 }} label={{ value: 'Age', position: 'insideBottomRight', offset: -5, fill: '#6b7280', fontSize: 11 }} />
                      <YAxis stroke="#9ca3af" tickFormatter={function(v) { return formatCurrencyDecimal(v, currency, exchangeRates); }} tick={{ fill: '#9ca3af', fontSize: 11 }} width={80} />
                      <Tooltip
                        wrapperStyle={{ zIndex: 9999 }}
                        contentStyle={{ background: 'rgba(10,22,40,0.96)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '10px', backdropFilter: 'blur(8px)', color: '#e8e9ed' }}
                        content={function(props) {
                          const active = props.active;
                          const payload = props.payload;
                          const label = props.label;
                          if (!active || !payload || !payload.length) return null;
                          const yearsIn = label - profile.retirementAge;
                          const retirementCalendarYear = new Date().getFullYear() + (profile.retirementAge - profile.currentAge);
                          const hoveredCalYear = retirementCalendarYear + yearsIn;
                          const runwayOTEHits = oneTimeExpenses.filter(function(e) { return hoveredCalYear >= e.year && hoveredCalYear <= (e.endYear || e.year); });
                          // Per-category nominal spend for hovered year — matches simulateRunway exactly
                          const baseNominalSpend = getRetNominalForYear(hoveredCalYear);
                          const scenarioMeta = {
                            pessimistic: { ret: pessimisticReturn, spendMult: pessSpendMult },
                            base:        { ret: baseReturn,        spendMult: 1 },
                            optimistic:  { ret: optimisticReturn,  spendMult: optSpendMult },
                          };
                          const visiblePayload = payload.filter(function(p) { return p.value !== null && p.value !== undefined; });
                          const isRetirementYear = yearsIn === 0;
                          return (
                            <div style={{ padding: '0.75rem 1rem', minWidth: '310px' }}>
                              <div style={{ fontWeight: '700', color: '#e8e9ed', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.35rem', fontSize: '0.88rem' }}>
                                Age {label} · {isRetirementYear ? 'Retirement year' : yearsIn + ' yr' + (yearsIn !== 1 ? 's' : '') + ' into retirement'}
                              </div>
                              {visiblePayload.map(function(p, i) {
                                const meta = scenarioMeta[p.dataKey] || { ret: baseReturn, spendMult: 1 };
                                const actualWithdrawal = baseNominalSpend * meta.spendMult;
                                const balanceAfterGrowth = p.value * (1 + meta.ret / 100);
                                const investmentGrowth = p.value * (meta.ret / 100);
                                const endBalance = isRetirementYear
                                  ? balanceAfterGrowth
                                  : Math.max(0, balanceAfterGrowth - actualWithdrawal);
                                const baseSpendFmt = formatCurrencyDecimal(baseNominalSpend, currency, exchangeRates);
                                const actualSpendFmt = formatCurrencyDecimal(actualWithdrawal, currency, exchangeRates);
                                const withdrawalDisplay = meta.spendMult !== 1
                                  ? `−${baseSpendFmt} → −${actualSpendFmt}/yr`
                                  : `−${baseSpendFmt}/yr`;
                                return (
                                  <div key={i} style={{ marginBottom: '0.55rem', paddingBottom: '0.45rem', borderBottom: i < visiblePayload.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                                    {/* Scenario name */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                                      <span style={{ fontSize: '0.82rem', color: '#e8e9ed', fontWeight: '600' }}>{p.name}</span>
                                    </div>
                                    {p.value === 0 ? (
                                      <div style={{ paddingLeft: '1.1rem', fontSize: '0.75rem', color: '#f87171', fontWeight: '600' }}>Exhausted</div>
                                    ) : (
                                      <div style={{ paddingLeft: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.13rem' }}>
                                        {/* Step 1: Opening */}
                                        <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                                          Year opening: <span style={{ color: '#e8e9ed', fontFamily: 'monospace' }}>{formatCurrencyDecimal(p.value, currency, exchangeRates)}</span>
                                        </div>
                                        {/* Step 2: Investment growth */}
                                        <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                                          Investment growth ({meta.ret}%): <span style={{ color: '#34d399', fontFamily: 'monospace' }}>{formatCurrencyDecimal(p.value, currency, exchangeRates)} → {formatCurrencyDecimal(balanceAfterGrowth, currency, exchangeRates)} (+{formatCurrencyDecimal(investmentGrowth, currency, exchangeRates)})</span>
                                        </div>
                                        {/* Step 3: Withdrawal */}
                                        {isRetirementYear ? (
                                          <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                                            Withdrawal: <span style={{ color: '#9ca3af', fontFamily: 'monospace' }}>none — first withdrawal at age {label + 1}</span>
                                          </div>
                                        ) : (
                                          <div style={{ fontSize: '0.68rem', color: '#6b7280' }}>
                                            Withdrawal: <span style={{ color: '#f87171', fontFamily: 'monospace' }}>{withdrawalDisplay}</span>
                                          </div>
                                        )}
                                        {/* Step 3b: One-time expenses */}
                                        {runwayOTEHits.length > 0 && runwayOTEHits.map(function(ote, oteIdx) {
                                          const isRecurring = ote.endYear && ote.endYear > ote.year;
                                          const rangeLabel = isRecurring ? ote.year + '–' + ote.endYear : String(ote.year);
                                          const oteCat = ote.category && ote.category !== 'none' ? ote.category : null;
                                          const preRate = oteCat ? ((expenseGrowthRates[oteCat] || 0) / 100) : 0;
                                          const retRate = oteCat ? ((retExpenseGrowthRates[oteCat] || 0) / 100) : 0;
                                          const yearsToRet = profile.retirementAge - profile.currentAge;
                                          const yearsIntoRetOte = hoveredCalYear - retirementCalendarYear;
                                          const inflatedOte = (ote.amount || 0) * Math.pow(1 + preRate, yearsToRet) * Math.pow(1 + retRate, Math.max(0, yearsIntoRetOte));
                                          const showInflation = (preRate > 0 || retRate > 0) && Math.abs(inflatedOte - ote.amount) > 50;
                                          return (
                                            <div key={oteIdx} style={{ fontSize: '0.68rem', color: '#6b7280', marginBottom: '0.06rem' }}>
                                              <span style={{ color: '#d97706' }}>↳ {ote.description}</span>
                                              <span style={{ color: '#92400e', fontSize: '0.62rem', marginLeft: '0.2rem' }}>({rangeLabel}{isRecurring ? '/yr' : ''})</span>
                                              <span style={{ fontFamily: 'monospace', color: '#f59e0b', marginLeft: '0.35rem' }}>
                                                {formatCurrencyDecimal(Math.round(ote.amount), currency, exchangeRates)}{isRecurring ? '/yr' : ''}
                                              </span>
                                              {showInflation && <span style={{ color: '#78350f', marginLeft: '0.2rem' }}>→ {formatCurrencyDecimal(Math.round(inflatedOte), currency, exchangeRates)}</span>}
                                            </div>
                                          );
                                        })}
                                        {/* Step 4: End of year */}
                                        <div style={{ fontSize: '0.68rem', color: '#6b7280', marginTop: '0.05rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.1rem' }}>
                                          Year closing: <span style={{ color: endBalance === 0 ? '#f87171' : '#a78bfa', fontFamily: 'monospace', fontWeight: '600' }}>{endBalance === 0 ? 'Exhausted' : formatCurrencyDecimal(endBalance, currency, exchangeRates)}</span>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }}
                      />

                      {/* Retirement start marker */}
                      <ReferenceLine
                        x={profile.retirementAge}
                        stroke="#a78bfa" strokeDasharray="3 3" strokeWidth={2}
                        label={function(props) { return <RotatedRefLabel {...props} value="Retirement" fill="#a78bfa" />; }}
                      />
                      {/* Life expectancy marker */}
                      <ReferenceLine
                        x={profile.lifeExpectancy}
                        stroke="#6b7280" strokeDasharray="4 3" strokeWidth={1.5}
                        label={function(props) { return <RotatedRefLabel {...props} value={"Age " + profile.lifeExpectancy} fill="#6b7280" />; }}
                      />



                      {RUNWAY_LINES.map(function(line) {
                        return (
                          <Line
                            key={line.key}
                            type="monotone"
                            dataKey={line.key}
                            name={line.label}
                            stroke={line.color}
                            strokeWidth={line.strokeWidth}
                            strokeDasharray={line.dasharray}
                            dot={false}
                            activeDot={{ r: 4 }}
                            connectNulls={false}
                            hide={runwayHiddenLines[line.key]}
                          />
                        );
                      })}
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Clickable legend — same style as CustomLegend */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                    {RUNWAY_LINES.map(function(line) {
                      const isHidden = runwayHiddenLines[line.key];
                      return (
                        <div
                          key={line.key}
                          onClick={function() { toggleRunwayLine(line.key); }}
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', background: isHidden ? 'rgba(255,255,255,0.05)' : 'transparent', opacity: isHidden ? 0.4 : 1, transition: 'all 0.2s', border: '2px solid ' + (isHidden ? 'rgba(255,255,255,0.1)' : line.color) }}
                        >
                          <div style={{ width: '20px', height: '3px', background: line.color, borderRadius: '2px' }} />
                          <span style={{ fontSize: '0.85rem', color: '#9ca3af', fontWeight: isHidden ? 400 : 600 }}>{line.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Runway footnote — always muted, text varies by scenario */}
                  {(() => {
                    const baseOk = exBase === null;
                    const pessOk = exPessimistic === null;
                    const lifeYrs = profile.lifeExpectancy - profile.retirementAge;
                    let footnoteText = '';
                    if (baseOk && pessOk) {
                      footnoteText = `Portfolio survives to age ${profile.lifeExpectancy} in all three scenarios, including the pessimistic case.`;
                    } else if (baseOk && !pessOk) {
                      const gap = lifeYrs - runwayYears(exPessimistic);
                      footnoteText = `Survives in the base scenario but runs ${gap} year${gap !== 1 ? 's' : ''} short in the pessimistic case. Consider a spending buffer or diversifying returns.`;
                    } else {
                      const baseShort = lifeYrs - runwayYears(exBase);
                      footnoteText = `Portfolio runs short even in the base scenario — exhausted ${baseShort} year${baseShort !== 1 ? 's' : ''} before age ${profile.lifeExpectancy}. Review spending or boost retirement savings.`;
                    }
                    return (
                      <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.06)', fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.55 }}>
                        {footnoteText}
                      </div>
                    );
                  })()}

                </div>
              );
            })()}
          </div>
        )}
        {/* Expense Calculator Tab */}
        {activeTab === 'preretirement' && (
          <div>
            {(() => {
              const handleCalcChange = (field, num) => {
                const newCalc = {...expenseCalculator, [field]: num};
                setExpenseCalculator(newCalc);
                const total = Object.values(newCalc).reduce((sum, v) => sum + v, 0);
                setExpenses({...expenses, current: total});
              };

              const handleGrowthChange = (field, rate) => {
                setExpenseGrowthRates({ ...expenseGrowthRates, [field]: rate });
              };

              const essential = expenseCategories.filter(c => (expenseTags[c.key] || c.group) === 'essential').reduce((s,c) => s + (expenseCalculator[c.key] || 0), 0);
              const discretionary = expenseCategories.filter(c => (expenseTags[c.key] || c.group) === 'disc').reduce((s,c) => s + (expenseCalculator[c.key] || 0), 0);
              const total = essential + discretionary;

              // Build multi-year projection data for the chart
              const currentYear = new Date().getFullYear();
              const retirementYear = currentYear + (profile.retirementAge - profile.currentAge);
              const projectionYears = Math.max(0, profile.retirementAge - profile.currentAge);
              const yearOptions = [];
              for (let i = 1; i <= projectionYears; i++) yearOptions.push(currentYear + i);

              // Scenario projections for selected target year
              // Low/High scenarios now use editable delta values from state
              const targetYearsAhead = Math.max(0, projectionTargetYear - currentYear);
              const clampedTargetYear = Math.min(projectionTargetYear, retirementYear);
              const clampedTargetYearsAhead = Math.max(0, clampedTargetYear - currentYear);
              const targetAge = profile.currentAge + clampedTargetYearsAhead; // single declaration
              const baseScenario = getProjectedExpenses(clampedTargetYear, { lifestyleInflation: 0 });
              const lowScenario = getProjectedExpenses(clampedTargetYear, {
                lifestyleInflation: 0,
                rateOverrideDelta: lowDelta,
              });
              const highScenario = getProjectedExpenses(clampedTargetYear, {
                lifestyleInflation: 0,
                rateOverrideDelta: highDelta,
              });

              // Build chart data: each year from now until lifeExpectancy (but show up to retirement for clarity)
              const CHART_CAT_LINES = expenseCategories;
              // OTEs that are relevant for the chart range (for dot/band rendering)
              const activeOTEsForChart = oneTimeExpenses.filter(e => e.year <= currentYear + (profile.retirementAge - profile.currentAge));

              const chartData = [];
              const chartYearsMax = profile.retirementAge - profile.currentAge; // pre-retirement only
              for (let y = currentYear; y <= currentYear + chartYearsMax; y++) {
                const years = y - currentYear;
                const row = { year: y, age: profile.currentAge + years };
                let totalVal = 0;
                let essentialTotal = 0;
                let discTotal = 0;
                CHART_CAT_LINES.forEach(cat => {
                  const base = expenseCalculator[cat.key] || 0;
                  let val = base * Math.pow(1 + (expenseGrowthRates[cat.key] || 0) / 100, years);
                  const phaseOutCat = expensePhaseOutYears[cat.key];
                  if (phaseOutCat && y >= phaseOutCat) val = 0;
                  row[cat.key] = Math.round(val);
                  totalVal += val;
                  if ((expenseTags[cat.key] || cat.group) === 'essential') essentialTotal += val;
                  else discTotal += val;
                });
                // Include all active one-time expenses in total line and route to assigned categories
                // OTE amounts are in today's terms — inflated from currentYear at category's growth rate
                const activeOTEsForYear = oneTimeExpenses.filter(e => y >= e.year && y <= (e.endYear || e.year));
                const getInflatedOTEAmount = (ote) => {
                  const cat = ote.category && ote.category !== 'none' ? ote.category : null;
                  const rate = cat ? ((expenseGrowthRates[cat] || 0) / 100) : 0;
                  return (ote.amount || 0) * Math.pow(1 + rate, y - currentYear);
                };
                row.oneTimeExpense = activeOTEsForYear.reduce((sum, e) => sum + getInflatedOTEAmount(e), 0);
                row.oneTimeLabel = activeOTEsForYear.length > 0
                  ? activeOTEsForYear.map(e => {
                      const rangeLabel = e.endYear && e.endYear > e.year ? ` (${e.year}–${e.endYear})` : '';
                      return e.description + rangeLabel;
                    }).join(', ')
                  : null;
                row.oneTimeCategory = activeOTEsForYear.length === 1 ? (activeOTEsForYear[0].category || 'none') : (activeOTEsForYear.length > 1 ? 'multiple' : null);
                row.activeOTEsList = activeOTEsForYear; // stored for tooltip detail
                activeOTEsForYear.forEach(function(ote) {
                  const inflated = getInflatedOTEAmount(ote);
                  if (ote.category && ote.category !== 'none') {
                    const cat = expenseCategories.find(function(c) { return c.key === ote.category; });
                    if (cat) {
                      row[cat.key] = (row[cat.key] || 0) + inflated;
                      if ((expenseTags[cat.key] || cat.group) === 'essential') essentialTotal += inflated;
                      else discTotal += inflated;
                    } else {
                      discTotal += inflated; // category key not found — treat as discretionary
                    }
                  } else {
                    discTotal += inflated; // no category assigned — treat as discretionary
                  }
                });
                const lifeEventHit = lifeEvents.find(e => e.year === y);
                row.lifeEventLabel = lifeEventHit ? lifeEventHit.description : null;
                row.total = Math.round(totalVal + row.oneTimeExpense);
                row.totalBase = Math.round(totalVal); // total without one-time
                row.essential = Math.round(essentialTotal);
                row.discretionary = Math.round(discTotal);
                chartData.push(row);
              }

              const REND = 'rgba(239, 68, 68, 0.15)';
              const BLUE = 'rgba(96, 165, 250, 0.15)';

              const renderPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                return (
                  <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700}>
                    {`${Math.round(percent * 100)}%`}
                  </text>
                );
              };

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '16px',
                  padding: '2rem'
                }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: '0 0 0.25rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📋 Pre-Retirement Budget
                    <InfoTooltip text="Build your current annual spending category by category. The total auto-updates Current Expenses used in all projections. Each category has its own growth rate and an optional end year — set an end year to phase out that expense from your projections (e.g. school fees ending when your child graduates). At retirement, the model switches entirely to your Retirement Budget." />
                  </h3>
                  <p style={{ fontSize: '0.9rem', color: '#9ca3af', marginBottom: '1rem' }}>
                    Enter amounts in <strong style={{ color: '#e8e9ed' }}>today's terms</strong> — projections grow them forward to retirement year at each category's growth rate.
                  </p>

                  {/* Always-visible summary bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', padding: '0.85rem 1.25rem', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>Annual <InfoTooltip text="Total as entered today — not projected. Phase-out years are not reflected here." /></div>
                      <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{formatCurrencyDecimal(total, currency, exchangeRates)}</div>
                    </div>
                    <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.08)' }} />
                    <div>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.1rem' }}>Monthly</div>
                      <div style={{ fontSize: '1rem', fontWeight: '600', color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace', lineHeight: 1 }}>{formatCurrencyDecimal(total / 12, currency, exchangeRates)}</div>
                    </div>
                    <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.08)' }} />
                    <div style={{ display: 'flex', gap: '1.25rem' }}>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: '#6b7280', marginBottom: '0.15rem' }}>Essential</div>
                        <div style={{ fontSize: '0.85rem', color: '#f87171', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}>{formatCurrencyDecimal(essential, currency, exchangeRates)}</div>
                        <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.1rem' }}>{total > 0 ? Math.round(essential / total * 100) : 0}%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: '#6b7280', marginBottom: '0.15rem' }}>Discretionary</div>
                        <div style={{ fontSize: '0.85rem', color: '#60a5fa', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}>{formatCurrencyDecimal(discretionary, currency, exchangeRates)}</div>
                        <div style={{ fontSize: '0.62rem', color: '#6b7280', marginTop: '0.1rem' }}>{total > 0 ? Math.round(discretionary / total * 100) : 0}%</div>
                      </div>
                    </div>
                    <div style={{ width: '1px', height: '32px', background: 'rgba(255,255,255,0.08)', marginLeft: 'auto' }} />
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.2rem' }}>Planned Retirement</div>
                      <div style={{ fontSize: '1rem', fontWeight: '700', color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace' }}>{retirementCalendarYear}</div>
                      <div style={{ fontSize: '0.65rem', color: '#6b7280', marginTop: '0.1rem' }}>Age {profile.retirementAge}</div>
                    </div>
                  </div>

                  {/* Expense Categories */}
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.6rem', borderBottom: '1px solid rgba(255,255,255,0.08)', marginBottom: preRetCatCollapsed ? 0 : '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: '700', color: '#e8e9ed' }}>Expense Categories</span>
                        <InfoTooltip text="Tag each row E (Essential) or D (Discretionary). The % box is the annual growth rate. The year box phases out that category from that year onwards — useful for mortgage end dates, school fees ending, etc. Leave blank for no phase-out." />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.7rem', color: expenseViewMode === 'monthly' ? '#34d399' : '#4b5563' }}>Monthly</span>
                      <div onClick={() => setExpenseViewMode(v => v === 'annual' ? 'monthly' : 'annual')} style={{ width: '32px', height: '18px', borderRadius: '9px', background: expenseViewMode === 'monthly' ? '#34d399' : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                        <div style={{ position: 'absolute', top: '2px', left: expenseViewMode === 'monthly' ? '16px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                      </div>
                    </div>
                        <button onClick={() => setPreRetCatCollapsed(v => !v)} style={{ fontSize: '0.72rem', color: '#9ca3af', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '0.2rem 0.55rem', cursor: 'pointer', flexShrink: 0 }}>
                          {preRetCatCollapsed ? '▼ Show' : '▲ Hide'}
                        </button>
                      </div>
                    </div>
                    {!preRetCatCollapsed && <div style={{ display: 'grid', gap: '0.75rem' }}>
                      {expenseCategories.map(cat => (
                        <CalcInput
                          key={cat.key}
                          icon={cat.icon || '📌'}
                          label={getCatLabel(cat.key)}
                          value={expenseCalculator[cat.key] || 0}
                          field={cat.key}
                          tooltip={cat.tooltip || ''}
                          color={(expenseTags[cat.key] || cat.group) === 'essential' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(96, 165, 250, 0.15)'}
                          onChange={handleCalcChange}
                          growthRate={expenseGrowthRates[cat.key] !== undefined ? expenseGrowthRates[cat.key] : 3}
                          onGrowthChange={handleGrowthChange}
                          currency={currency}
                          rate={exchangeRates[currency]}
                          tag={expenseTags[cat.key] || cat.group}
                          onTagToggle={() => setExpenseTags(prev => ({ ...prev, [cat.key]: (prev[cat.key] || cat.group) === 'essential' ? 'disc' : 'essential' }))}
                          phaseOutYear={expensePhaseOutYears[cat.key]}
                          onPhaseOutChange={(e) => setExpensePhaseOutYears(prev => ({ ...prev, [cat.key]: e.target.value ? parseInt(e.target.value) : null }))}
                          onStartEdit={(key) => setEditingCatLabel(key)}
                          onRename={handleRenameCat}
                          isEditing={editingCatLabel === cat.key}
                          onRemove={handleRemoveCat}
                          canRemove={expenseCategories.filter(c => (expenseTags[c.key] || c.group) === (expenseTags[cat.key] || cat.group)).length > 1}
                          monthly={expenseViewMode === 'monthly'}
                        />
                      ))}
                      <button
                        onClick={() => handleAddCat('disc')}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.75rem', background: 'transparent', border: '1px dashed rgba(255,255,255,0.15)', borderRadius: '8px', color: '#6b7280', cursor: 'pointer', fontSize: '0.78rem', marginTop: '0.25rem', width: 'fit-content' }}
                      >
                        <span style={{ fontSize: '0.9rem', lineHeight: 1 }}>+</span> Add category
                      </button>
                    </div>}
                  </div>
                </div>

                  <div style={{
                    background: 'rgba(255,255,255,0.03)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)',
                    padding: '1.75rem', position: 'relative', zIndex: 10
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.25rem' }}>📈 Pre-retirement Expenses Over Time <InfoTooltip text="Values compounded annually at each category's individual growth rate. Categories phase out from their set end year onwards." /></h3>
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Pre-retirement only · per-category growth rates · click legend to show/hide.</p>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <button
                          onClick={() => setChartCatDropdownOpen(o => !o)}
                          style={{
                            padding: '0.45rem 0.9rem',
                            background: selectedChartCats.length > 0 ? 'rgba(96,165,250,0.15)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${selectedChartCats.length > 0 ? 'rgba(96,165,250,0.5)' : 'rgba(255,255,255,0.15)'}`,
                            borderRadius: '8px',
                            color: selectedChartCats.length > 0 ? '#60a5fa' : '#9ca3af',
                            cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600',
                            display: 'flex', alignItems: 'center', gap: '0.4rem'
                          }}
                        >
                          🔍 Drill down {selectedChartCats.length > 0 ? `(${selectedChartCats.length})` : ''}
                          <span style={{ fontSize: '0.65rem' }}>{chartCatDropdownOpen ? '▲' : '▼'}</span>
                        </button>
                        {chartCatDropdownOpen && (
                          <>
                            <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setChartCatDropdownOpen(false)} />
                            <div style={{
                              position: 'absolute', right: 0, top: '110%', zIndex: 999,
                              background: '#0d1e35', border: '1px solid rgba(96,165,250,0.3)',
                              borderRadius: '10px', padding: '0.75rem', width: '230px',
                              boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                            }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <span style={{ fontSize: '0.72rem', color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Select categories to overlay</span>
                                <span style={{ color: '#60a5fa', cursor: 'pointer', fontSize: '0.7rem' }} onClick={() => setSelectedChartCats([])}>clear all</span>
                              </div>
                              {[
                                { groupLabel: 'Essential', groupColor: '#ef4444', cats: CHART_CAT_LINES.filter(c => (expenseTags[c.key] || c.group) === 'essential') },
                                { groupLabel: 'Discretionary', groupColor: '#60a5fa', cats: CHART_CAT_LINES.filter(c => (expenseTags[c.key] || c.group) === 'disc') },
                              ].map(({ groupLabel, groupColor, cats }) => (
                                <div key={groupLabel} style={{ marginBottom: '0.6rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', paddingBottom: '0.2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: groupColor }} />
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>{groupLabel}</span>
                                  </div>
                                  {cats.map(cat => {
                                    const sel = selectedChartCats.includes(cat.key);
                                    return (
                                      <div key={cat.key}
                                        onClick={() => setSelectedChartCats(prev => sel ? prev.filter(k => k !== cat.key) : [...prev, cat.key])}
                                        style={{
                                          display: 'flex', alignItems: 'center', gap: '0.5rem',
                                          padding: '0.3rem 0.4rem 0.3rem 1rem', borderRadius: '5px', cursor: 'pointer',
                                          background: sel ? `${cat.color}18` : 'transparent', marginBottom: '0.1rem'
                                        }}
                                      >
                                        <div style={{ width: '8px', height: '2px', background: cat.color, borderRadius: '1px', opacity: sel ? 1 : 0.3, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.77rem', color: sel ? '#d1d5db' : '#6b7280', flex: 1 }}>{cat.label}</span>
                                        <span style={{ fontSize: '0.68rem', color: sel ? '#9ca3af' : '#4b5563' }}>{sel ? 'on' : 'off'}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem', marginTop: '0.75rem' }}>
                      {[
                        { key: 'total', label: 'Total', color: '#22c55e' },
                        { key: 'essential', label: 'Essential', color: '#ef4444' },
                        { key: 'discretionary', label: 'Discretionary', color: '#60a5fa' },
                      ].map(item => {
                        const isHidden = hiddenCalcLines[item.key];
                        return (
                          <div key={item.key}
                            onClick={() => setHiddenCalcLines(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '0.4rem',
                              padding: '4px 10px', borderRadius: '6px', cursor: 'pointer',
                              border: `1px solid ${isHidden ? 'rgba(255,255,255,0.1)' : item.color}`,
                              background: isHidden ? 'rgba(255,255,255,0.03)' : `${item.color}18`,
                              opacity: isHidden ? 0.4 : 1, transition: 'all 0.15s'
                            }}
                          >
                            <div style={{ width: '18px', height: '3px', background: item.color, borderRadius: '2px' }} />
                            <span style={{ fontSize: '0.75rem', color: isHidden ? '#6b7280' : '#d1d5db', fontWeight: 600 }}>{item.label}</span>
                          </div>
                        );
                      })}
                    </div>
                    <ResponsiveContainer width="100%" height={360} style={{ overflow: 'visible' }}>
                      <LineChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="year" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                        <YAxis stroke="#9ca3af" tickFormatter={(v) => formatCurrency(v, currency, exchangeRates)} tick={{ fontSize: 11 }} />
                        <Tooltip
                          wrapperStyle={{ zIndex: 9999 }}
                          contentStyle={{ background: 'rgba(10,22,40,0.96)', border: '1px solid rgba(96,165,250,0.35)', borderRadius: '10px', backdropFilter: 'blur(8px)', color: '#e8e9ed' }}
                          content={({ active, payload, label }) => {
                            if (!active || !payload || !payload.length) return null;
                            const pt = chartData.find(d => d.year === label);
                            const yearsFrom = label - currentYear;
                            // Check for wealth milestone - get actual net worth from wealthProjection
                            const wealthMilestone = wealthMilestones.find(m => m.age === pt?.age);
                            const wealthData = wealthProjection.find(d => d.age === pt?.age);
                            return (
                              <div style={{ minWidth: '200px' }}>
                                <div style={{ fontWeight: '700', color: '#e8e9ed', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.35rem' }}>
                                  {label} (Age {pt?.age})
                                  {yearsFrom > 0 && pt?.total > 0 && chartData[0]?.total > 0 && (
                                    <span style={{ fontSize: '0.68rem', color: '#f59e0b', display: 'block', marginTop: '0.1rem' }}>
                                      +{(((pt.total / chartData[0].total) - 1) * 100).toFixed(1)}% vs today
                                    </span>
                                  )}
                                  {wealthMilestone && <span style={{ fontSize: '0.7rem', color: '#34d399', display: 'block', marginTop: '0.15rem' }}>💰 {wealthMilestone.label} USD</span>}
                                  {pt?.lifeEventLabel && <span style={{ fontSize: '0.7rem', color: '#60a5fa', display: 'block', marginTop: '0.15rem' }}>🔵 {pt.lifeEventLabel}</span>}
                                  {pt?.activeOTEsList?.length > 0 && (() => {
                                    // Filter OTEs to only those relevant to the currently visible lines
                                    // In drill-down mode: show only OTEs belonging to a visible subcategory line
                                    // In aggregate mode: show all active OTEs
                                    const visibleLineKeys = payload.map(p => p.dataKey);
                                    const isDrillDown = selectedChartCats.length > 0;
                                    const relevantOTEs = isDrillDown
                                      ? pt.activeOTEsList.filter(ote =>
                                          ote.category && visibleLineKeys.includes(ote.category) && !hiddenCalcLines[ote.category]
                                        )
                                      : pt.activeOTEsList;
                                    if (relevantOTEs.length === 0) return null;
                                    return (
                                      <div style={{ marginTop: '0.1rem' }}>
                                        <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Planned</span>
                                        {relevantOTEs.map((ote, idx) => {
                                          const isRecurring = ote.endYear && ote.endYear > ote.year;
                                          const rangeLabel = isRecurring ? ' ' + ote.year + '–' + ote.endYear : ' ' + ote.year;
                                          const cat = ote.category && ote.category !== 'none' ? ote.category : null;
                                          const rate = cat ? (expenseGrowthRates[cat] || 0) : 0;
                                          const inflatedAmt = (ote.amount || 0) * Math.pow(1 + rate / 100, yearsFrom);
                                          const showInflation = rate > 0 && yearsFrom > 0 && Math.abs(inflatedAmt - ote.amount) > 50;
                                          return (
                                            <div key={idx} style={{ marginTop: '0.05rem' }}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                                <span style={{ color: '#d97706' }}>↳ {ote.description}<span style={{ color: '#92400e', fontSize: '0.63rem' }}>{rangeLabel}</span></span>
                                                <span style={{ fontFamily: 'monospace', color: '#f59e0b' }}>
                                                  {formatCurrencyDecimal(Math.round(ote.amount), currency, exchangeRates)}{isRecurring ? '/yr' : ''}
                                                </span>
                                              </div>
                                              {showInflation && (
                                                <div style={{ fontSize: '0.62rem', color: '#78350f', paddingLeft: '0.9rem' }}>
                                                  {formatCurrencyDecimal(Math.round(inflatedAmt), currency, exchangeRates) + ' in ' + label + ' (' + rate + '%/yr)'}
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    );
                                  })()}
                                </div>
                                {payload.map((p, i) => {
                                  const catInfo = CHART_CAT_LINES.find(c => c.key === p.dataKey);
                                  const rate = catInfo ? expenseGrowthRates[catInfo.key] : null;
                                  const base = catInfo ? (expenseCalculator[catInfo.key] || 0) : null;
                                  const effPct = (rate !== null && base !== null && base > 0 && yearsFrom > 0)
                                    ? ((Math.pow(1 + rate / 100, yearsFrom) - 1) * 100).toFixed(1) : null;
                                  return (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', marginBottom: '0.2rem', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.8rem', color: '#d1d5db' }}>{p.name}</span>
                                        {rate !== null && <span style={{ fontSize: '0.68rem', color: '#6b7280' }}>({rate}%/yr)</span>}
                                      </div>
                                      <div style={{ textAlign: 'right' }}>
                                        <span style={{ fontSize: '0.82rem', color: '#e8e9ed', fontFamily: 'monospace' }}>{formatCurrencyDecimal(p.value, currency, exchangeRates)}</span>
                                        {effPct !== null && <span style={{ fontSize: '0.68rem', color: '#f59e0b', marginLeft: '0.35rem' }}>+{effPct}%</span>}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          }}
                        />
                        <Line type="monotone" dataKey="total" name="Total (incl. planned)" stroke="#22c55e" strokeWidth={3}
                          dot={(props) => {
                            const { cx, cy, payload } = props;
                            const hasMilestone = wealthMilestones.find(m => m.age === payload.age);
                            const hasLifeEvent = !!payload.lifeEventLabel;
                            const hasSingleOTE = activeOTEsForChart.some(e =>
                              e.year === payload.year && !(e.endYear && e.endYear > e.year)
                            );
                            if (hasMilestone && hasLifeEvent) {
                              return <g key={payload.year}><circle cx={cx} cy={cy} r={7} fill="none" stroke="#34d399" strokeWidth={2.5} strokeOpacity={0.85} /><circle cx={cx} cy={cy} r={4} fill="#60a5fa" stroke="white" strokeWidth={1.5} /></g>;
                            }
                            if (hasMilestone && hasSingleOTE) {
                              return <g key={payload.year}><circle cx={cx} cy={cy} r={7} fill="none" stroke="#34d399" strokeWidth={2.5} strokeOpacity={0.85} /><circle cx={cx} cy={cy} r={4} fill="#f59e0b" stroke="white" strokeWidth={1.5} /></g>;
                            }
                            if (hasLifeEvent && hasSingleOTE) {
                              return <g key={payload.year}><circle cx={cx} cy={cy} r={7} fill="none" stroke="#60a5fa" strokeWidth={2.5} strokeOpacity={0.85} /><circle cx={cx} cy={cy} r={4} fill="#f59e0b" stroke="white" strokeWidth={1.5} /></g>;
                            }
                            if (hasMilestone) return <circle cx={cx} cy={cy} r={6} fill="#34d399" stroke="white" strokeWidth={2} key={payload.year} />;
                            if (hasLifeEvent) return <circle cx={cx} cy={cy} r={5} fill="#60a5fa" stroke="white" strokeWidth={2} key={payload.year} />;
                            if (hasSingleOTE) return <circle cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="white" strokeWidth={2} key={payload.year} />;
                            return null;
                          }}
                          hide={hiddenCalcLines['total']}
                        />
                        <Line type="monotone" dataKey="essential" name="Essential" stroke="#ef4444" strokeWidth={2} strokeDasharray="6 3"
                          dot={(props) => {
                            const { cx, cy, payload } = props;
                            const hasSingleOTE = activeOTEsForChart.some(e => {
                              if (e.year !== payload.year || (e.endYear && e.endYear > e.year)) return false;
                              const cat = expenseCategories.find(c => c.key === e.category);
                              return cat && (expenseTags[cat.key] || cat.group) === 'essential';
                            });
                            if (hasSingleOTE) return <circle cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="white" strokeWidth={2} key={payload.year} />;
                            return null;
                          }}
                          hide={hiddenCalcLines['essential']} />
                        <Line type="monotone" dataKey="discretionary" name="Discretionary" stroke="#60a5fa" strokeWidth={2} strokeDasharray="6 3"
                          dot={(props) => {
                            const { cx, cy, payload } = props;
                            const hasSingleOTE = activeOTEsForChart.some(e => {
                              if (e.year !== payload.year || (e.endYear && e.endYear > e.year)) return false;
                              const cat = expenseCategories.find(c => c.key === e.category);
                              return cat && (expenseTags[cat.key] || cat.group) !== 'essential';
                            });
                            if (hasSingleOTE) return <circle cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="white" strokeWidth={2} key={payload.year} />;
                            return null;
                          }}
                          hide={hiddenCalcLines['discretionary']} />
                        {CHART_CAT_LINES.filter(c => selectedChartCats.includes(c.key)).map(cat => (
                          <Line key={cat.key} type="monotone" dataKey={cat.key} name={cat.label} stroke={cat.color} strokeWidth={1.5}
                            dot={(props) => {
                              const { cx, cy, payload } = props;
                              // Show OTE dot ONLY for single-year OTEs that belong to this category
                              const hasOTE = activeOTEsForChart.some(e =>
                                e.category === cat.key &&
                                payload.year === e.year &&
                                !(e.endYear && e.endYear > e.year)  // single-year only
                              );
                              if (hasOTE) return <circle cx={cx} cy={cy} r={5} fill="#f59e0b" stroke="white" strokeWidth={2} key={payload.year} />;
                              return null;
                            }}
                            hide={hiddenCalcLines[cat.key]} />
                        ))}
                        
                        {/* Retirement marker */}
                        <ReferenceLine
                          x={currentYear + (profile.retirementAge - profile.currentAge)}
                          stroke="#a78bfa" strokeDasharray="3 3" strokeWidth={2}
                          label={(props) => <RotatedRefLabel {...props} value="Retirement" fill="#a78bfa" />}
                        />

                        {/* OTE shaded bands — filtered by visible lines; vertical rotated labels to avoid overlap */}
                        {(() => {
                          // Determine which aggregate lines are visible
                          const totalVisible = !hiddenCalcLines['total'];
                          const essentialVisible = !hiddenCalcLines['essential'];
                          const discVisible = !hiddenCalcLines['discretionary'];
                          const anyAggregateVisible = totalVisible || essentialVisible || discVisible;
                          // Any subcategory lines visible?
                          const anySubcatVisible = selectedChartCats.some(k => !hiddenCalcLines[k]);

                          // Build visible bands
                          let bandIndex = 0;
                          return activeOTEsForChart.map(e => {
                            if (!(e.endYear && e.endYear > e.year)) return null;
                            const oteHasCat = e.category && e.category !== 'none';
                            const oteCatIsEssential = oteHasCat && (() => {
                              const catObj = expenseCategories.find(c => c.key === e.category);
                              return catObj ? (expenseTags[catObj.key] || catObj.group) === 'essential' : false;
                            })();

                            if (selectedChartCats.length > 0) {
                              // Drill-down mode: show band only if OTE category is in selected AND that line is visible
                              if (!oteHasCat || !selectedChartCats.includes(e.category)) return null;
                              if (hiddenCalcLines[e.category]) return null;
                              if (!anySubcatVisible && !anyAggregateVisible) return null;
                            } else {
                              // No drill-down: show band only if the matching aggregate line is visible
                              if (!anyAggregateVisible) return null;
                              if (oteHasCat) {
                                // Only show if matching E or D aggregate line is visible
                                if (oteCatIsEssential && !essentialVisible && !totalVisible) return null;
                                if (!oteCatIsEssential && !discVisible && !totalVisible) return null;
                              }
                            }

                            const myIndex = bandIndex++;
                            const fillOpacity = myIndex % 2 === 0 ? 0.06 : 0.10;
                            return (
                              <ReferenceArea
                                key={e.id}
                                x1={e.year} x2={e.endYear}
                                fill={`rgba(245,158,11,${fillOpacity})`}
                                stroke="rgba(245,158,11,0.22)"
                                strokeWidth={1}
                                strokeDasharray="3 3"
                                label={makeBandLabel(e.description, 'rgba(245,158,11,0.9)', myIndex)}
                              />
                            );
                          });
                        })()}
                      </LineChart>
                    </ResponsiveContainer>
                        {/* Milestone indicators - matching Overview style */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', background: '#34d399', borderRadius: '50%', border: '2px solid white' }} />
                            <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>Financial Milestone</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', background: '#60a5fa', borderRadius: '50%', border: '2px solid white' }} />
                            <span style={{ fontSize: '0.8rem', color: '#60a5fa', fontWeight: 600 }}>Life Event</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ width: '8px', height: '8px', background: '#f59e0b', borderRadius: '50%', border: '2px solid white' }} />
                            <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: 600 }}>Planned Expense</span>
                          </div>
                        </div>
                  </div>

                  {/* ─── Phase 3B: Future Year Projection Panel ─── */}
                  <div style={{ background: 'rgba(167,139,250,0.05)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(167,139,250,0.2)', padding: '1.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.25rem' }}>🔭 Project to a Future Year</h3>
                        <p style={{ fontSize: '0.85rem', color: '#9ca3af' }}>See your projected expenses at any point in time</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#9ca3af' }}>Target Year:</span>
                        <TargetYearInput
                          value={projectionTargetYear}
                          onChange={setProjectionTargetYear}
                          minYear={currentYear + 1}
                          maxYear={retirementYear}
                        />
                        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Age {targetAge}</span>
                      </div>
                    </div>
                    {/* Scenario cards */}
                    {(() => {
                      return (
                        <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                          {[
                            {
                              label: '↓ Low', value: lowScenario, color: '#34d399', border: 'rgba(52,211,153,0.3)', bg: 'rgba(52,211,153,0.07)',
                              rationale: 'Conservative scenario with compressed growth rates across all expense categories.',
                              assumptions: [`All rates ${lowDelta >= 0 ? '+' : ''}${lowDelta.toFixed(1)}pp`, 'Uniformly applied'],
                              editable: true, scenarioKey: 'low', deltaValue: lowDelta, setDelta: setLowDelta
                            },
                            {
                              label: '◎ Base', value: baseScenario, color: '#a78bfa', border: 'rgba(167,139,250,0.3)', bg: 'rgba(167,139,250,0.07)',
                              rationale: 'Your exact per-category growth rates as configured. Most likely scenario if current trends hold.',
                              assumptions: ['Your exact per-category rates', 'No overrides'],
                              editable: false
                            },
                            {
                              label: '↑ High', value: highScenario, color: '#f87171', border: 'rgba(248,113,113,0.3)', bg: 'rgba(248,113,113,0.07)',
                              rationale: 'Stress test with elevated growth rates across all expense categories.',
                              assumptions: [`All rates +${highDelta.toFixed(1)}pp`, 'Uniformly applied'],
                              editable: true, scenarioKey: 'high', deltaValue: highDelta, setDelta: setHighDelta
                            },
                          ].map((s, i) => (
                            <div key={i} style={{ padding: '1rem', background: s.bg, borderRadius: '10px', border: `1px solid ${s.border}` }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                                <div style={{ fontSize: '0.72rem', color: s.color, fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                                {s.editable && (
                                  <button 
                                    onClick={() => setEditingScenario(editingScenario === s.scenarioKey ? null : s.scenarioKey)}
                                    style={{ 
                                      background: 'none', 
                                      border: `1px solid ${s.border}`, 
                                      borderRadius: '6px', 
                                      color: s.color, 
                                      cursor: 'pointer', 
                                      padding: '0.25rem 0.5rem', 
                                      fontSize: '0.7rem',
                                      fontWeight: '600'
                                    }}
                                    title="Edit delta"
                                  >
                                    {editingScenario === s.scenarioKey ? '✓ Done' : '✎ Edit'}
                                  </button>
                                )}
                              </div>
                              
                              {/* Inline edit for delta */}
                              {s.editable && editingScenario === s.scenarioKey && (
                                <div style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: `1px solid ${s.border}` }}>
                                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                                    Rate Delta (percentage points)
                                  </label>
                                  <input 
                                    type="number" 
                                    value={s.deltaValue} 
                                    onChange={e => s.setDelta(parseFloat(e.target.value) || 0)}
                                    step={0.1}
                                    style={{ 
                                      width: '100%', 
                                      padding: '0.5rem', 
                                      background: 'rgba(255,255,255,0.05)', 
                                      border: '1px solid rgba(255,255,255,0.1)', 
                                      borderRadius: '6px', 
                                      color: '#e8e9ed', 
                                      fontSize: '0.9rem',
                                      fontFamily: 'monospace'
                                    }}
                                  />
                                  <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.4rem' }}>
                                    {s.scenarioKey === 'low' 
                                      ? 'Typically -2.0 to -3.0 for conservative scenarios' 
                                      : 'Typically +3.0 to +4.0 for stress test scenarios'}
                                  </div>
                                </div>
                              )}
                              
                              <div style={{ fontSize: '1.4rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace', marginBottom: '0.25rem' }}>
                                {formatCurrencyDecimal(s.value, currency, exchangeRates)}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <div style={{ fontSize: '0.78rem', color: s.color, fontWeight: '600' }}>
                                  {s.value >= total ? '+' : ''}{total > 0 ? (((s.value - total) / total) * 100).toFixed(1) : '0'}% vs today
                                </div>
                                {/* Breakdown pill — only on Base card */}
                                {!s.editable && (
                                  <button
                                    onClick={() => setBreakdownPopupOpen(v => !v)}
                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '10px', cursor: 'pointer', fontSize: '0.58rem', color: '#a78bfa', padding: '0.15rem 0.45rem', fontWeight: 600, lineHeight: 1.2 }}
                                  >
                                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                                      <circle cx="4.5" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="1.2"/>
                                      <line x1="7.2" y1="7.2" x2="9.5" y2="9.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                      <line x1="4.5" y1="3" x2="4.5" y2="6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                      <line x1="3" y1="4.5" x2="6" y2="4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                                    </svg>
                                    breakdown
                                  </button>
                                )}
                              </div>
                              <div style={{ borderTop: `1px solid ${s.border}`, paddingTop: '0.4rem', marginBottom: '0.4rem', marginTop: '0.5rem' }}>
                                {s.assumptions.map((a, j) => (
                                  <div key={j} style={{ fontSize: '0.68rem', color: '#6b7280', marginBottom: '0.15rem' }}>• {a}</div>
                                ))}
                              </div>
                              <div style={{ fontSize: '0.65rem', color: '#4b5563', lineHeight: '1.4', borderTop: `1px solid ${s.border}`, paddingTop: '0.35rem' }}>
                                {s.rationale}
                              </div>
                            </div>
                          ))}
                        </div>
                        </>
                      );
                    })()}
                    {/* Breakdown popup — fixed overlay triggered by pill in BASE card */}
                    {breakdownPopupOpen && (() => {
                      const allActiveOTEs = oneTimeExpenses.filter(e =>
                        clampedTargetYear >= e.year && clampedTargetYear <= (e.endYear || e.year)
                      );
                      return (
                        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9998, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '5vh' }}
                          onClick={() => setBreakdownPopupOpen(false)}>
                          <div style={{ background: 'rgba(10,22,40,0.98)', border: '1px solid rgba(167,139,250,0.3)', borderRadius: '14px', padding: '1.5rem', minWidth: '400px', maxWidth: '540px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}
                            onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                              <div>
                                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e8e9ed' }}>Breakdown at {clampedTargetYear} (Age {targetAge})</div>
                                <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.2rem' }}>Base scenario · per-category growth rates</div>
                              </div>
                              <button onClick={() => setBreakdownPopupOpen(false)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', padding: '0.2rem 0.5rem', cursor: 'pointer', color: '#9ca3af', fontSize: '0.75rem' }}>✕</button>
                            </div>
                            {/* Header row */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px', gap: '0.5rem', marginBottom: '0.5rem', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <span style={{ fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: '1.4rem' }}>Category</span>
                              <span style={{ fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Amount</span>
                              <span style={{ fontSize: '0.6rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>vs today</span>
                            </div>
                            {expenseCategories.map((row, idx) => {
                              const base = expenseCalculator[row.key] || 0;
                              const rate = expenseGrowthRates[row.key] || 0;
                              const phaseOut = expensePhaseOutYears[row.key];
                              const projected = (phaseOut && clampedTargetYear >= phaseOut) ? 0 : base * Math.pow(1 + rate / 100, clampedTargetYearsAhead);
                              const effectivePct = base > 0 && projected > 0 ? ((projected / base - 1) * 100).toFixed(1) : null;
                              const rowOTEs = allActiveOTEs.filter(e => e.category === row.key);
                              const isEssential = (expenseTags[row.key] || row.group) === 'essential';
                              return (
                                <div key={idx}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px', gap: '0.5rem', padding: '0.3rem 0', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                      <span style={{ fontSize: '0.6rem', color: isEssential ? '#f87171' : '#60a5fa', background: isEssential ? 'rgba(239,68,68,0.12)' : 'rgba(96,165,250,0.12)', border: isEssential ? '1px solid rgba(239,68,68,0.25)' : '1px solid rgba(96,165,250,0.25)', borderRadius: '3px', padding: '0 3px', fontWeight: 700, lineHeight: 1.6, flexShrink: 0 }}>{isEssential ? 'E' : 'D'}</span>
                                      <span style={{ fontSize: '0.78rem', color: '#d1d5db' }}>{row.label}</span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>
                                      {projected > 0 ? formatCurrencyDecimal(Math.round(projected), currency, exchangeRates) : <span style={{ color: '#4b5563' }}>—</span>}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', color: effectivePct != null ? '#f59e0b' : '#6b7280', textAlign: 'right' }}>
                                      {effectivePct != null ? '+' + effectivePct + '%' : ''}
                                    </span>
                                  </div>
                                  {rowOTEs.map((ote, oteIdx) => {
                                    const oteBase = ote.amount || 0;
                                    const oteRate = expenseGrowthRates[row.key] || 0;
                                    const inflatedAmt = oteBase * Math.pow(1 + oteRate / 100, clampedTargetYearsAhead);
                                    const isRecurring = ote.endYear && ote.endYear > ote.year;
                                    const rangeLabel = isRecurring ? `${ote.year}–${ote.endYear}` : `${ote.year}`;
                                    const amtLabel = isRecurring
                                      ? `${formatCurrencyDecimal(Math.round(inflatedAmt), currency, exchangeRates)}/yr`
                                      : formatCurrencyDecimal(Math.round(inflatedAmt), currency, exchangeRates);
                                    const oteEffPct = oteRate > 0 && clampedTargetYearsAhead > 0
                                      ? ((Math.pow(1 + oteRate / 100, clampedTargetYearsAhead) - 1) * 100).toFixed(1)
                                      : null;
                                    return (
                                      <div key={`ote-popup-${oteIdx}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', padding: '0.15rem 0 0.15rem 1.1rem', borderBottom: '1px solid rgba(255,255,255,0.03)', alignItems: 'center' }}>
                                        <span style={{ color: '#d97706', fontSize: '0.72rem' }}>↳ {ote.description}<span style={{ color: '#92400e', fontSize: '0.62rem', marginLeft: '0.25rem' }}>{rangeLabel}</span></span>
                                        <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#f59e0b', fontSize: '0.75rem', textAlign: 'right' }}>{amtLabel}</span>
                                        <span style={{ fontSize: '0.68rem', color: oteEffPct ? '#f59e0b' : '#6b7280', textAlign: 'right', minWidth: '56px' }}>
                                          {oteEffPct ? `+${oteEffPct}%` : ''}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              );
                            })}
                            {/* Uncategorized OTEs */}
                            {allActiveOTEs.filter(e => !e.category || e.category === 'none').map((ote, idx) => {
                              const isRecurring = ote.endYear && ote.endYear > ote.year;
                              const rangeLabel = isRecurring ? `${ote.year}–${ote.endYear}` : `${ote.year}`;
                              return (
                                <div key={`uncat-${idx}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '0.5rem', padding: '0.3rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.8rem', color: '#f59e0b' }}>↳ {ote.description}<span style={{ color: '#92400e', fontSize: '0.62rem', marginLeft: '0.25rem' }}>{rangeLabel}</span></span>
                                  <span style={{ fontFamily: 'JetBrains Mono, monospace', color: '#f59e0b', fontSize: '0.8rem', textAlign: 'right' }}>{isRecurring ? `${formatCurrencyDecimal(ote.amount, currency, exchangeRates)}/yr` : formatCurrencyDecimal(ote.amount, currency, exchangeRates)}</span>
                                  <span style={{ minWidth: '56px' }}></span>
                                </div>
                              );
                            })}
                            {/* Total */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 70px', gap: '0.5rem', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#e8e9ed' }}>Total</span>
                              <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#a78bfa', fontFamily: 'JetBrains Mono, monospace', textAlign: 'right' }}>{formatCurrencyDecimal(baseScenario, currency, exchangeRates)}</span>
                              <span></span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  {/* note: Sensitivity Analysis follows as a sub-panel of Future Year */}

                  {/* ─── Sensitivity Analysis ─── */}
                  {(() => {
                    const ALL_CAT_OPTIONS = CHART_CAT_LINES.map(c => ({ key: c.key, label: c.label, group: (expenseTags[c.key] || c.group), currentRate: expenseGrowthRates[c.key] || 0 }));
                    const sensitivityResult = getSensitivityExpenses(clampedTargetYear, sensitivityAdj);
                    const vsBase = sensitivityResult - baseScenario;
                    const vsLow = sensitivityResult - lowScenario;
                    const vsHigh = sensitivityResult - highScenario;
                    const pctVsBase = baseScenario > 0 ? ((vsBase / baseScenario) * 100) : 0;
                    const addAdj = () => {
                      if (sensitivityAdj.some(a => a.category === sensitivityCatPicker)) return;
                      setSensitivityAdj(prev => [...prev, { id: Date.now(), category: sensitivityCatPicker, delta: 1 }]);
                    };
                    return (
                      <div style={{ marginTop: '0.75rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: sensitivityCollapsed ? 0 : '0.75rem' }}>
                          <div style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            🎯 What-If Scenarios
                            <InfoTooltip text={`Tweak any category's growth rate and see the impact on your total expenses at age ${targetAge}. Each slider adds a delta on top of the base rate — if Housing grows at 3%/yr and you set +2%, the scenario uses 5%/yr for Housing only. Use this to find which categories move the needle most.`} />
                          </div>
                          <button
                            onClick={() => setSensitivityCollapsed(p => !p)}
                            style={{ fontSize: '0.72rem', color: '#9ca3af', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '5px', padding: '0.2rem 0.55rem', cursor: 'pointer', flexShrink: 0 }}
                          >
                            {sensitivityCollapsed ? '▼ Show Details' : '▲ Hide Details'}
                          </button>
                        </div>
                        {!sensitivityCollapsed && (
                        <div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.6rem' }}>Select a category and click add to explore what-if scenarios</div>
                        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                          <select
                            value={sensitivityCatPicker}
                            onChange={e => setSensitivityCatPicker(e.target.value)}
                            style={{ padding: '0.45rem 0.75rem', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '8px', color: '#e8e9ed', fontSize: '0.85rem', cursor: 'pointer', flex: '1', minWidth: '160px' }}
                          >
                            <optgroup label="Essential" style={{ background: '#0a1628' }}>
                              {ALL_CAT_OPTIONS.filter(c => c.group === 'essential').map(c => (
                                <option key={c.key} value={c.key} style={{ background: '#0a1628' }}>{c.label} ({c.currentRate}%/yr){sensitivityAdj.some(a => a.category === c.key) ? ' ✓' : ''}</option>
                              ))}
                            </optgroup>
                            <optgroup label="Discretionary" style={{ background: '#0a1628' }}>
                              {ALL_CAT_OPTIONS.filter(c => c.group === 'disc').map(c => (
                                <option key={c.key} value={c.key} style={{ background: '#0a1628' }}>{c.label} ({c.currentRate}%/yr){sensitivityAdj.some(a => a.category === c.key) ? ' ✓' : ''}</option>
                              ))}
                            </optgroup>
                          </select>
                          <button onClick={addAdj} disabled={sensitivityAdj.some(a => a.category === sensitivityCatPicker)}
                            style={{ padding: '0.45rem 1rem', background: sensitivityAdj.some(a => a.category === sensitivityCatPicker) ? 'rgba(255,255,255,0.05)' : 'rgba(96,165,250,0.15)', border: '1px solid rgba(96,165,250,0.3)', borderRadius: '8px', color: sensitivityAdj.some(a => a.category === sensitivityCatPicker) ? '#6b7280' : '#60a5fa', cursor: sensitivityAdj.some(a => a.category === sensitivityCatPicker) ? 'not-allowed' : 'pointer', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap' }}>
                            + Add adjustment
                          </button>
                          {sensitivityAdj.length > 0 && (
                            <button onClick={() => setSensitivityAdj([])} style={{ padding: '0.45rem 0.75rem', background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#6b7280', cursor: 'pointer', fontSize: '0.8rem' }}>Clear all</button>
                          )}
                        </div>
                        {sensitivityAdj.length > 0 && (
                          <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                            {sensitivityAdj.map(adj => {
                              const catInfo = ALL_CAT_OPTIONS.find(c => c.key === adj.category);
                              const effectiveRate = catInfo ? catInfo.currentRate + adj.delta : adj.delta;
                              const isEss = catInfo?.group === 'essential';
                              return (
                                <div key={adj.id} style={{ padding: '0.85rem 1rem', background: isEss ? 'rgba(239,68,68,0.05)' : 'rgba(96,165,250,0.05)', borderRadius: '10px', border: `1px solid ${isEss ? 'rgba(239,68,68,0.2)' : 'rgba(96,165,250,0.2)'}` }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <div>
                                      <span style={{ fontWeight: '600', color: '#e8e9ed', fontSize: '0.9rem' }}>{catInfo?.label}</span>
                                      <span style={{ fontSize: '0.72rem', color: '#9ca3af', marginLeft: '0.5rem' }}>base {catInfo?.currentRate}%/yr</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                      <span style={{ fontSize: '0.9rem', fontWeight: '700', fontFamily: 'monospace', color: adj.delta > 0 ? '#f87171' : adj.delta < 0 ? '#34d399' : '#9ca3af' }}>
                                        {adj.delta >= 0 ? '+' : ''}{adj.delta.toFixed(1)}% → {effectiveRate.toFixed(1)}%/yr
                                      </span>
                                      <button onClick={() => setSensitivityAdj(prev => prev.filter(a => a.id !== adj.id))} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '1rem', padding: '0 0.25rem' }}>✕</button>
                                    </div>
                                  </div>
                                  <input type="range" min={-10} max={15} step={0.5} value={adj.delta}
                                    onChange={e => setSensitivityAdj(prev => prev.map(a => a.id === adj.id ? {...a, delta: parseFloat(e.target.value)} : a))}
                                    style={{ width: '100%', accentColor: isEss ? '#ef4444' : '#60a5fa' }}
                                  />
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#6b7280', marginTop: '0.2rem' }}>
                                    <span>-10% (slower)</span><span>0% (no change)</span><span>+15% (faster)</span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div style={{ padding: '1.25rem 1.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ fontSize: '0.72rem', color: '#9ca3af', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                            Your scenario at age {targetAge} vs presets
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr 1fr 1fr', gap: '0.5rem 1rem', alignItems: 'center' }}>
                            {['', 'Low', 'Base', 'High', 'Your Scenario'].map((h, i) => (
                              <div key={i} style={{ fontSize: '0.72rem', color: i === 4 ? '#e8e9ed' : '#9ca3af', fontWeight: '600', textAlign: i > 0 ? 'right' : 'left' }}>{h}</div>
                            ))}
                            <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>Total</div>
                            <div style={{ fontFamily: 'monospace', color: '#34d399', fontSize: '0.9rem', textAlign: 'right' }}>{formatCurrencyDecimal(lowScenario, currency, exchangeRates)}</div>
                            <div style={{ fontFamily: 'monospace', color: '#a78bfa', fontSize: '0.9rem', textAlign: 'right' }}>{formatCurrencyDecimal(baseScenario, currency, exchangeRates)}</div>
                            <div style={{ fontFamily: 'monospace', color: '#f87171', fontSize: '0.9rem', textAlign: 'right' }}>{formatCurrencyDecimal(highScenario, currency, exchangeRates)}</div>
                            <div style={{ fontFamily: 'monospace', fontWeight: '700', color: '#e8e9ed', fontSize: '1rem', textAlign: 'right' }}>{formatCurrencyDecimal(sensitivityResult, currency, exchangeRates)}</div>
                            <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>vs Base</div>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontFamily: 'monospace', textAlign: 'right' }}>{vsLow >= 0 ? '+' : ''}{formatCurrencyDecimal(vsLow, currency, exchangeRates)}</div>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', textAlign: 'right' }}>—</div>
                            <div style={{ fontSize: '0.72rem', color: '#6b7280', fontFamily: 'monospace', textAlign: 'right' }}>{vsHigh >= 0 ? '+' : ''}{formatCurrencyDecimal(vsHigh, currency, exchangeRates)}</div>
                            <div style={{ fontSize: '0.82rem', fontFamily: 'monospace', color: vsBase >= 0 ? '#f87171' : '#34d399', textAlign: 'right' }}>
                              {vsBase >= 0 ? '+' : ''}{formatCurrencyDecimal(vsBase, currency, exchangeRates)} ({pctVsBase >= 0 ? '+' : ''}{pctVsBase.toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                        </div>
                        )}
                      </div>
                    );
                  })()}
                  </div> {/* end Future Year outer panel */}
                </div>
              );
            })()}



          </div>
        )}

        

        {/* Finances Tab */}
        {activeTab === 'finances' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
            {/* Assets */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  💎 Assets
                  <InfoTooltip text={`Everything you own that has financial value. Enter balances in ${currency}. Sub-items let you track individual accounts or properties.`} />
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.7rem', color: assumptions.enableDrawdown ? '#a78bfa' : '#4b5563' }}>Drawdown</span>
                  <InfoTooltip text={TOOLTIPS.drawdown} />
                  <div onClick={() => setAssumptions({...assumptions, enableDrawdown: !assumptions.enableDrawdown})} style={{ width: '32px', height: '18px', borderRadius: '9px', background: assumptions.enableDrawdown ? '#a78bfa' : 'rgba(255,255,255,0.15)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
                    <div style={{ position: 'absolute', top: '2px', left: assumptions.enableDrawdown ? '16px' : '2px', width: '14px', height: '14px', borderRadius: '50%', background: 'white', transition: 'left 0.2s' }} />
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem' }}>All values in {currency}</p>


              {/* Cash - Expandable */}
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Read-only total when sub-items exist */}
                {assets.cashItems && assets.cashItems.length > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#e8e9ed' }}>Cash & Savings</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace' }}>{formatDisplayNumber(assets.cash, exchangeRates[currency])}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#374151' }}>growth</span><input type="number" value={0} disabled style={{ width: '52px', padding: '0.1rem 0.2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px', color: '#374151', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center', cursor: 'not-allowed' }} /><span style={{ fontSize: '0.68rem', color: '#374151' }}>%/yr</span>
                      <span style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)', display: 'inline-block', margin: '0 0.1rem' }} />
                      <button onClick={() => setExpandedCategories({...expandedCategories, cashItems: !expandedCategories.cashItems})} style={{ fontSize: '0.68rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.15rem 0.45rem', cursor: 'pointer', minWidth: '70px', textAlign: 'center' }}>{expandedCategories.cashItems ? '▲ Hide' : '▼ ' + ((assets.cashItems?.length || 0) === 1 ? '1 item' : (assets.cashItems?.length || 0) + ' items')}</button>
                    </div>
                  </div>
                ) : (
                  <NumberInput
                    label="Cash & Savings"
                    value={assets.cash}
                    onChange={(val) => setAssets({...assets, cash: val})}
                    prefix={currency}
                    rate={exchangeRates[currency]}
                    tooltip={`Liquid cash in bank accounts and emergency funds. Held flat — no growth applied in projections.`}
                  />
                )}
                
                {expandedCategories.cashItems && (
                  <div style={{ marginTop: '0.75rem', marginLeft: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {(assets.cashItems || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <input type="text" value={item.name} onChange={(e) => { const newItems = assets.cashItems.map(i => i.id === item.id ? { ...i, name: e.target.value } : i); setAssets({ ...assets, cashItems: newItems }); }} placeholder="Account" style={{ flex: 1, padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#e8e9ed', fontSize: '0.85rem' }} />
                        <SubItemAmountInput value={item.amount} rate={exchangeRates[currency]} onChange={(aed) => { const newItems = assets.cashItems.map(i => i.id === item.id ? { ...i, amount: aed } : i); const total = newItems.reduce((sum, i) => sum + i.amount, 0); setAssets({ ...assets, cashItems: newItems, cash: total }); } } />
                        <button onClick={() => { let newItems = assets.cashItems.filter(i => i.id !== item.id); if (newItems.length === 0) newItems = [{ id: 1, name: 'Account', amount: 0 }]; const total = newItems.reduce((sum, i) => sum + i.amount, 0); setAssets({ ...assets, cashItems: newItems, cash: total }); }} style={{ padding: '0.4rem 0.55rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => { const newId = assets.cashItems.length > 0 ? Math.max(...assets.cashItems.map(i => i.id)) + 1 : 1; setAssets({ ...assets, cashItems: [...assets.cashItems, { id: newId, name: 'New Account', amount: 0 }] }); }} style={{ width: '100%', padding: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px dashed rgba(52, 211, 153, 0.3)', borderRadius: '6px', color: '#34d399', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>+ Add Account</button>
                  </div>
                )}
              </div>
              
              {/* Investments - Expandable */}
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Read-only total when sub-items exist */}
                {assets.investmentItems && assets.investmentItems.length > 0 ? (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <span style={{ fontSize: '1rem', fontWeight: '700', color: '#e8e9ed' }}>Investments</span>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace' }}>{formatDisplayNumber(assets.investments, exchangeRates[currency])}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>growth</span>
                        <input
                          type="number"
                          value={assumptions.investmentReturn}
                          onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0 && v <= 30) setAssumptions({...assumptions, investmentReturn: v}); }}
                          style={{ width: '52px', padding: '0.1rem 0.2rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#9ca3af', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }}
                        />
                        <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>%/yr</span>
                        <span style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)', display: 'inline-block', margin: '0 0.1rem' }} />
                        <button onClick={() => setExpandedCategories({...expandedCategories, investmentItems: !expandedCategories.investmentItems})} style={{ fontSize: '0.68rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.15rem 0.45rem', cursor: 'pointer', minWidth: '70px', textAlign: 'center' }}>{expandedCategories.investmentItems ? '▲ Hide' : '▼ ' + ((assets.investmentItems?.length || 0) === 1 ? '1 item' : (assets.investmentItems?.length || 0) + ' items')}</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <NumberInput
                    label="Investments (Stocks, Bonds, etc.)"
                    value={assets.investments}
                    onChange={(val) => setAssets({...assets, investments: val})}
                    prefix={currency}
                    rate={exchangeRates[currency]}
                    tooltip={`Stocks, bonds, mutual funds, ETFs. Growing at your Investment Return assumption of ${assumptions.investmentReturn}%/yr.`}
                  />
                )}
                
                {/* Expand/Collapse button */}
                
                
                {/* Sub-items list */}
                {expandedCategories.investmentItems && (
                  <div style={{ marginTop: '0.75rem', marginLeft: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {(assets.investmentItems || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = assets.investmentItems.map(i => 
                              i.id === item.id ? { ...i, name: e.target.value } : i
                            );
                            setAssets({ ...assets, investmentItems: newItems });
                          }}
                          placeholder="Item name"
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#e8e9ed',
                            fontSize: '0.85rem'
                          }}
                        />
                        <SubItemAmountInput value={item.amount} rate={exchangeRates[currency]} width="120px"
                          onChange={(aed) => {
                            const newItems = assets.investmentItems.map(i => i.id === item.id ? { ...i, amount: aed } : i);
                            const total = newItems.reduce((sum, i) => sum + i.amount, 0);
                            setAssets({ ...assets, investmentItems: newItems, investments: total });
                          }} />
                        <button
                          onClick={() => {
                            let newItems = assets.investmentItems.filter(i => i.id !== item.id); if (newItems.length === 0) newItems = [{ id: 1, name: 'Investment', amount: 0 }];
                            const total = newItems.reduce((sum, i) => sum + i.amount, 0);
                            setAssets({ ...assets, investmentItems: newItems, investments: total });
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newId = assets.investmentItems.length > 0 ? Math.max(...assets.investmentItems.map(i => i.id)) + 1 : 1;
                        setAssets({ 
                          ...assets, 
                          investmentItems: [...assets.investmentItems, { id: newId, name: 'New Investment', amount: 0 }]
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(52, 211, 153, 0.1)',
                        border: '1px dashed rgba(52, 211, 153, 0.3)',
                        borderRadius: '6px',
                        color: '#34d399',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      + Add Investment
                    </button>
                  </div>
                )}
              </div>
              
              {/* Real Estate - Expandable */}
              <div style={{ marginBottom: '1.5rem' }}>
                {assets.realEstateItems && assets.realEstateItems.length > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#e8e9ed' }}>Real Estate</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace' }}>{formatDisplayNumber(assets.realEstate, exchangeRates[currency])}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>growth</span><input type="number" value={assumptions.realEstateAppreciation} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0 && v <= 20) setAssumptions({...assumptions, realEstateAppreciation: v}); }} style={{ width: '52px', padding: '0.1rem 0.2rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#9ca3af', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} /><span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>%/yr</span>
                      <span style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)', display: 'inline-block', margin: '0 0.1rem' }} />
                      <button onClick={() => setExpandedCategories({...expandedCategories, realEstateItems: !expandedCategories.realEstateItems})} style={{ fontSize: '0.68rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.15rem 0.45rem', cursor: 'pointer', minWidth: '70px', textAlign: 'center' }}>{expandedCategories.realEstateItems ? '▲ Hide' : '▼ ' + ((assets.realEstateItems?.length || 0) === 1 ? '1 item' : (assets.realEstateItems?.length || 0) + ' items')}</button>
                    </div>
                  </div>
                ) : (
                  <NumberInput
                    label="Real Estate"
                    value={assets.realEstate}
                    onChange={(val) => setAssets({...assets, realEstate: val})}
                    prefix={currency}
                    rate={exchangeRates[currency]}
                    tooltip={`Property value (home + investment properties). Appreciates at your Real Estate rate of ${assumptions.realEstateAppreciation}%/yr.`}
                  />
                )}
                
                
                
                {expandedCategories.realEstateItems && (
                  <div style={{ marginTop: '0.75rem', marginLeft: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {(assets.realEstateItems || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = assets.realEstateItems.map(i => 
                              i.id === item.id ? { ...i, name: e.target.value } : i
                            );
                            setAssets({ ...assets, realEstateItems: newItems });
                          }}
                          placeholder="Property name"
                          style={{
                            flex: 1,
                            padding: '0.5rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#e8e9ed',
                            fontSize: '0.85rem'
                          }}
                        />
                        <SubItemAmountInput value={item.amount} rate={exchangeRates[currency]} width="120px"
                          onChange={(aed) => {
                            const newItems = assets.realEstateItems.map(i => i.id === item.id ? { ...i, amount: aed } : i);
                            const total = newItems.reduce((sum, i) => sum + i.amount, 0);
                            setAssets({ ...assets, realEstateItems: newItems, realEstate: total });
                          }} />
                        <button
                          onClick={() => {
                            let newItems = assets.realEstateItems.filter(i => i.id !== item.id); if (newItems.length === 0) newItems = [{ id: 1, name: 'Property', amount: 0 }];
                            const total = newItems.reduce((sum, i) => sum + i.amount, 0);
                            setAssets({ ...assets, realEstateItems: newItems, realEstate: total });
                          }}
                          style={{
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: '6px',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => {
                        const newId = assets.realEstateItems.length > 0 ? Math.max(...assets.realEstateItems.map(i => i.id)) + 1 : 1;
                        setAssets({ 
                          ...assets, 
                          realEstateItems: [...assets.realEstateItems, { id: newId, name: 'New Property', amount: 0 }]
                        });
                      }}
                      style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: 'rgba(52, 211, 153, 0.1)',
                        border: '1px dashed rgba(52, 211, 153, 0.3)',
                        borderRadius: '6px',
                        color: '#34d399',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      + Add Property
                    </button>
                  </div>
                )}
              </div>
              
              {/* Other Illiquid Assets - Expandable */}
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Read-only total when sub-items exist */}
                {assets.otherItems && assets.otherItems.length > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#e8e9ed' }}>Other Illiquid Assets</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace' }}>{formatDisplayNumber(assets.other, exchangeRates[currency])}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>growth</span><input type="number" value={assumptions.otherAssetGrowth} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0 && v <= 30) setAssumptions({...assumptions, otherAssetGrowth: v}); }} style={{ width: '52px', padding: '0.1rem 0.2rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#9ca3af', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} /><span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>%/yr</span>
                      <span style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)', display: 'inline-block', margin: '0 0.1rem' }} />
                      <button onClick={() => setExpandedCategories({...expandedCategories, otherItems: !expandedCategories.otherItems})} style={{ fontSize: '0.68rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.15rem 0.45rem', cursor: 'pointer', minWidth: '70px', textAlign: 'center' }}>{expandedCategories.otherItems ? '▲ Hide' : '▼ ' + ((assets.otherItems?.length || 0) === 1 ? '1 item' : (assets.otherItems?.length || 0) + ' items')}</button>
                    </div>
                  </div>
                ) : (
                  <NumberInput
                    label="Other Illiquid Assets"
                    value={assets.other}
                    onChange={(val) => setAssets({...assets, other: val})}
                    prefix={currency}
                    rate={exchangeRates[currency]}
                    tooltip={`Other valuable assets: business equity, collectibles, precious metals. Growing at ${assumptions.otherAssetsGrowth ?? 0}%/yr.`}
                  />
                )}
                
                {expandedCategories.otherItems && (
                  <div style={{ marginTop: '0.75rem', marginLeft: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {(assets.otherItems || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <input type="text" value={item.name} onChange={(e) => { const newItems = assets.otherItems.map(i => i.id === item.id ? { ...i, name: e.target.value } : i); setAssets({ ...assets, otherItems: newItems }); }} placeholder="Item" style={{ flex: 1, padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#e8e9ed', fontSize: '0.85rem' }} />
                        <SubItemAmountInput value={item.amount} rate={exchangeRates[currency]} onChange={(aed) => { const newItems = assets.otherItems.map(i => i.id === item.id ? { ...i, amount: aed } : i); const total = newItems.reduce((sum, i) => sum + i.amount, 0); setAssets({ ...assets, otherItems: newItems, other: total }); } } />
                        <button onClick={() => { let newItems = assets.otherItems.filter(i => i.id !== item.id); if (newItems.length === 0) newItems = [{ id: 1, name: 'Asset', amount: 0 }]; const total = newItems.reduce((sum, i) => sum + i.amount, 0); setAssets({ ...assets, otherItems: newItems, other: total }); }} style={{ padding: '0.4rem 0.55rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => { const newId = assets.otherItems.length > 0 ? Math.max(...assets.otherItems.map(i => i.id)) + 1 : 1; setAssets({ ...assets, otherItems: [...assets.otherItems, { id: newId, name: 'New Item', amount: 0 }] }); }} style={{ width: '100%', padding: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px dashed rgba(52, 211, 153, 0.3)', borderRadius: '6px', color: '#34d399', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>+ Add Item</button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Liabilities */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                💳 Liabilities
                <InfoTooltip text="Money you owe. Set the 'end year' field on each item — the balance amortizes linearly to zero by that year. Without an end year, a default term is used: 25 years for mortgages, 5 years for loans and other liabilities." />
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem' }}>All values in {currency}</p>
              
              {/* Mortgage - Expandable */}
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Read-only total when sub-items exist */}
                {liabilities.mortgageItems && liabilities.mortgageItems.length > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#e8e9ed' }}>Mortgage</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace' }}>{formatDisplayNumber(liabilities.mortgage, exchangeRates[currency])}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button onClick={() => setExpandedCategories({...expandedCategories, mortgageItems: !expandedCategories.mortgageItems})} style={{ fontSize: '0.68rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.15rem 0.45rem', cursor: 'pointer', minWidth: '70px', textAlign: 'center' }}>{expandedCategories.mortgageItems ? '▲ Hide' : '▼ ' + ((liabilities.mortgageItems?.length || 0) === 1 ? '1 item' : (liabilities.mortgageItems?.length || 0) + ' items')}</button>
                    </div>
                  </div>
                ) : (
                  <NumberInput label="Mortgage" value={liabilities.mortgage} onChange={(val) => setLiabilities({...liabilities, mortgage: val})} prefix={currency} rate={exchangeRates[currency]} tooltip={TOOLTIPS.mortgage} />
                )}
                
                {expandedCategories.mortgageItems && (
                  <div style={{ marginTop: '0.75rem', marginLeft: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {(liabilities.mortgageItems || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <input type="text" value={item.name} onChange={(e) => { const newItems = liabilities.mortgageItems.map(i => i.id === item.id ? { ...i, name: e.target.value } : i); setLiabilities({ ...liabilities, mortgageItems: newItems }); }} placeholder="Mortgage" style={{ flex: 1, minWidth: 0, padding: '0.45rem 0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#e8e9ed', fontSize: '0.82rem' }} />
                        <SubItemAmountInput value={item.amount} rate={exchangeRates[currency]} onChange={(aed) => { const newItems = liabilities.mortgageItems.map(i => i.id === item.id ? { ...i, amount: aed } : i); const total = newItems.reduce((sum, i) => sum + i.amount, 0); setLiabilities({ ...liabilities, mortgageItems: newItems, mortgage: total }); } } />
                          <input type="text" value={item.endYear ?? ''} onChange={(e) => { const val = e.target.value; if (val === '' || (!isNaN(val) && val.length <= 4)) { const newItems = liabilities.mortgageItems.map(i => i.id === item.id ? { ...i, endYear: val === '' ? null : parseInt(val) } : i); setLiabilities({ ...liabilities, mortgageItems: newItems }); }}} placeholder="year" title="Calendar year this income/liability ends (e.g. 2031)" style={{ width: '52px', padding: '0.4rem 0.3rem', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '6px', color: '#eab308', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} />
                        <button onClick={() => { let newItems = liabilities.mortgageItems.filter(i => i.id !== item.id); if (newItems.length === 0) newItems = [{ id: 1, name: 'Mortgage', amount: 0, endYear: null }]; const total = newItems.reduce((sum, i) => sum + i.amount, 0); setLiabilities({ ...liabilities, mortgageItems: newItems, mortgage: total }); }} style={{ padding: '0.4rem 0.55rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => { const newId = liabilities.mortgageItems.length > 0 ? Math.max(...liabilities.mortgageItems.map(i => i.id)) + 1 : 1; setLiabilities({ ...liabilities, mortgageItems: [...liabilities.mortgageItems, { id: newId, name: 'New Mortgage', amount: 0 }] }); }} style={{ width: '100%', padding: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px dashed rgba(52, 211, 153, 0.3)', borderRadius: '6px', color: '#34d399', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>+ Add Mortgage</button>
                  </div>
                )}
              </div>
              
              {/* Loans - Expandable */}
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Read-only total when sub-items exist */}
                {liabilities.loanItems && liabilities.loanItems.length > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#e8e9ed' }}>Loans</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace' }}>{formatDisplayNumber(liabilities.loans, exchangeRates[currency])}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button onClick={() => setExpandedCategories({...expandedCategories, loanItems: !expandedCategories.loanItems})} style={{ fontSize: '0.68rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.15rem 0.45rem', cursor: 'pointer', minWidth: '70px', textAlign: 'center' }}>{expandedCategories.loanItems ? '▲ Hide' : '▼ ' + ((liabilities.loanItems?.length || 0) === 1 ? '1 item' : (liabilities.loanItems?.length || 0) + ' items')}</button>
                    </div>
                  </div>
                ) : (
                  <NumberInput label="Loans" value={liabilities.loans} onChange={(val) => setLiabilities({...liabilities, loans: val})} prefix={currency} rate={exchangeRates[currency]} tooltip={TOOLTIPS.loans} />
                )}
                
                {expandedCategories.loanItems && (
                  <div style={{ marginTop: '0.75rem', marginLeft: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {(liabilities.loanItems || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <input type="text" value={item.name} onChange={(e) => { const newItems = liabilities.loanItems.map(i => i.id === item.id ? { ...i, name: e.target.value } : i); setLiabilities({ ...liabilities, loanItems: newItems }); }} placeholder="Loan" style={{ flex: 1, minWidth: 0, padding: '0.45rem 0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#e8e9ed', fontSize: '0.82rem' }} />
                        <SubItemAmountInput value={item.amount} rate={exchangeRates[currency]} onChange={(aed) => { const newItems = liabilities.loanItems.map(i => i.id === item.id ? { ...i, amount: aed } : i); const total = newItems.reduce((sum, i) => sum + i.amount, 0); setLiabilities({ ...liabilities, loanItems: newItems, loans: total }); } } />
                          <input type="text" value={item.endYear ?? ''} onChange={(e) => { const val = e.target.value; if (val === '' || (!isNaN(val) && val.length <= 4)) { const newItems = liabilities.loanItems.map(i => i.id === item.id ? { ...i, endYear: val === '' ? null : parseInt(val) } : i); setLiabilities({ ...liabilities, loanItems: newItems }); }}} placeholder="year" title="Calendar year this income/liability ends (e.g. 2031)" style={{ width: '52px', padding: '0.4rem 0.3rem', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '6px', color: '#eab308', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} />
                        <button onClick={() => { let newItems = liabilities.loanItems.filter(i => i.id !== item.id); if (newItems.length === 0) newItems = [{ id: 1, name: 'Loan', amount: 0, endYear: null }]; const total = newItems.reduce((sum, i) => sum + i.amount, 0); setLiabilities({ ...liabilities, loanItems: newItems, loans: total }); }} style={{ padding: '0.4rem 0.55rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => { const newId = liabilities.loanItems.length > 0 ? Math.max(...liabilities.loanItems.map(i => i.id)) + 1 : 1; setLiabilities({ ...liabilities, loanItems: [...liabilities.loanItems, { id: newId, name: 'New Loan', amount: 0 }] }); }} style={{ width: '100%', padding: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px dashed rgba(52, 211, 153, 0.3)', borderRadius: '6px', color: '#34d399', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>+ Add Loan</button>
                  </div>
                )}
              </div>
              
              {/* Other Liabilities - Expandable */}
              <div style={{ marginBottom: '1.5rem' }}>
                {liabilities.otherLiabilityItems && liabilities.otherLiabilityItems.length > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#e8e9ed' }}>Other Liabilities</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace' }}>{formatDisplayNumber(liabilities.other, exchangeRates[currency])}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <button onClick={() => setExpandedCategories({...expandedCategories, otherLiabilityItems: !expandedCategories.otherLiabilityItems})} style={{ fontSize: '0.68rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.15rem 0.45rem', cursor: 'pointer', minWidth: '70px', textAlign: 'center' }}>{expandedCategories.otherLiabilityItems ? '▲ Hide' : '▼ ' + ((liabilities.otherLiabilityItems?.length || 0) === 1 ? '1 item' : (liabilities.otherLiabilityItems?.length || 0) + ' items')}</button>
                    </div>
                  </div>
                ) : null}
                
                {expandedCategories.otherLiabilityItems && (
                  <div style={{ marginTop: '0.75rem', marginLeft: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {(liabilities.otherLiabilityItems || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <input type="text" value={item.name} onChange={(e) => { const newItems = liabilities.otherLiabilityItems.map(i => i.id === item.id ? { ...i, name: e.target.value } : i); setLiabilities({ ...liabilities, otherLiabilityItems: newItems }); }} placeholder="Liability" style={{ flex: 1, minWidth: 0, padding: '0.45rem 0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#e8e9ed', fontSize: '0.82rem' }} />
                        <SubItemAmountInput value={item.amount} rate={exchangeRates[currency]} onChange={(aed) => { const newItems = liabilities.otherLiabilityItems.map(i => i.id === item.id ? { ...i, amount: aed } : i); const total = newItems.reduce((sum, i) => sum + i.amount, 0); setLiabilities({ ...liabilities, otherLiabilityItems: newItems, other: total }); } } />
                        <input type="text" value={item.endYear ?? ''} onChange={(e) => { const val = e.target.value; if (val === '' || (!isNaN(val) && val.length <= 4)) { const newItems = liabilities.otherLiabilityItems.map(i => i.id === item.id ? { ...i, endYear: val === '' ? null : parseInt(val) } : i); setLiabilities({ ...liabilities, otherLiabilityItems: newItems }); }}} placeholder="year" title="Calendar year this income/liability ends (e.g. 2031)" style={{ width: '52px', padding: '0.4rem 0.3rem', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '6px', color: '#eab308', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} />
                        <button onClick={() => { let newItems = liabilities.otherLiabilityItems.filter(i => i.id !== item.id); if (newItems.length === 0) newItems = [{ id: 1, name: 'Other', amount: 0 }]; const total = newItems.reduce((sum, i) => sum + i.amount, 0); setLiabilities({ ...liabilities, otherLiabilityItems: newItems, other: total }); }} style={{ padding: '0.4rem 0.55rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => { const newId = liabilities.otherLiabilityItems.length > 0 ? Math.max(...liabilities.otherLiabilityItems.map(i => i.id)) + 1 : 1; setLiabilities({ ...liabilities, otherLiabilityItems: [...liabilities.otherLiabilityItems, { id: newId, name: 'New Liability', amount: 0 }] }); }} style={{ width: '100%', padding: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px dashed rgba(52, 211, 153, 0.3)', borderRadius: '6px', color: '#34d399', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>+ Add Liability</button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Income */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                📈 Annual Income
                <InfoTooltip text={`Pre-tax annual income in ${currency}. Salary grows at your Salary Growth rate until retirement age, then stops. Passive and Other Income grow at their own growth rates set in this section — use the 'end year' field on each sub-item to model income that stops at a specific year.`} />
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem' }}>All values in {currency}</p>
              
              {/* Salary - Expandable */}
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Read-only total when sub-items exist */}
                {income.salaryItems && income.salaryItems.length > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#e8e9ed' }}>Salary</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace' }}>{formatDisplayNumber(income.salary, exchangeRates[currency])}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>growth</span><input type="number" value={assumptions.salaryGrowth} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0 && v <= 30) setAssumptions({...assumptions, salaryGrowth: v}); }} style={{ width: '52px', padding: '0.1rem 0.2rem', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#9ca3af', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} /><span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>%/yr</span>
                      <span style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)', display: 'inline-block', margin: '0 0.1rem' }} />
                      <button onClick={() => setExpandedCategories({...expandedCategories, salaryItems: !expandedCategories.salaryItems})} style={{ fontSize: '0.68rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.15rem 0.45rem', cursor: 'pointer', minWidth: '70px', textAlign: 'center' }}>{expandedCategories.salaryItems ? '▲ Hide' : '▼ ' + ((income.salaryItems?.length || 0) === 1 ? '1 item' : (income.salaryItems?.length || 0) + ' items')}</button>
                    </div>
                  </div>
                ) : (
                  <NumberInput
                    label="Salary"
                    value={income.salary}
                    onChange={(val) => setIncome({...income, salary: val})}
                    prefix={currency}
                    rate={exchangeRates[currency]}
                    tooltip={TOOLTIPS.salary}
                  />
                )}
                
                {expandedCategories.salaryItems && (
                  <div style={{ marginTop: '0.75rem', marginLeft: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {(income.salaryItems || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <input type="text" value={item.name} onChange={(e) => {
                          const newItems = income.salaryItems.map(i => i.id === item.id ? { ...i, name: e.target.value } : i);
                          setIncome({ ...income, salaryItems: newItems });
                        }} placeholder="Source" style={{ flex: 1, padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#e8e9ed', fontSize: '0.85rem' }} />
                        <SubItemAmountInput value={item.amount} rate={exchangeRates[currency]}
                          onChange={(aed) => {
                            const newItems = income.salaryItems.map(i => i.id === item.id ? { ...i, amount: aed } : i);
                            const total = newItems.reduce((sum, i) => sum + i.amount, 0);
                            setIncome({ ...income, salaryItems: newItems, salary: total });
                          }} />
                        <input type="text" value={item.endYear ?? ''} onChange={(e) => { const val = e.target.value; if (val === '' || (!isNaN(val) && val.length <= 4)) { const newItems = income.salaryItems.map(i => i.id === item.id ? { ...i, endYear: val === '' ? null : parseInt(val) } : i); setIncome({ ...income, salaryItems: newItems }); }}} placeholder="year" title="Calendar year this income/liability ends (e.g. 2031)" style={{ width: '52px', padding: '0.4rem 0.3rem', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '6px', color: '#eab308', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} />
                        <button onClick={() => {
                          let newItems = income.salaryItems.filter(i => i.id !== item.id); if (newItems.length === 0) newItems = [{ id: 1, name: 'Salary', amount: 0, endYear: null }];
                          const total = newItems.reduce((sum, i) => sum + i.amount, 0);
                          setIncome({ ...income, salaryItems: newItems, salary: total });
                        }} style={{ padding: '0.4rem 0.55rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => {
                      const newId = income.salaryItems.length > 0 ? Math.max(...income.salaryItems.map(i => i.id)) + 1 : 1;
                      setIncome({ ...income, salaryItems: [...income.salaryItems, { id: newId, name: 'New Source', amount: 0, endYear: null }] });
                    }} style={{ width: '100%', padding: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px dashed rgba(52, 211, 153, 0.3)', borderRadius: '6px', color: '#34d399', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>+ Add Source</button>
                  </div>
                )}
              </div>
              
              {/* Passive Income - Expandable */}
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Read-only total when sub-items exist */}
                {income.passiveItems && income.passiveItems.length > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#e8e9ed' }}>Passive Income</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace' }}>{formatDisplayNumber(income.passive, exchangeRates[currency])}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>growth</span><input type="number" value={assumptions.passiveGrowth ?? 2} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0 && v <= 30) setAssumptions({...assumptions, passiveGrowth: v}); }} style={{ width: '52px', padding: '0.1rem 0.2rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#e8e9ed', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} /><span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>%/yr</span>
                      <span style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)', display: 'inline-block', margin: '0 0.1rem' }} />
                      <button onClick={() => setExpandedCategories({...expandedCategories, passiveItems: !expandedCategories.passiveItems})} style={{ fontSize: '0.68rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.15rem 0.45rem', cursor: 'pointer', minWidth: '70px', textAlign: 'center' }}>{expandedCategories.passiveItems ? '▲ Hide' : '▼ ' + ((income.passiveItems?.length || 0) === 1 ? '1 item' : (income.passiveItems?.length || 0) + ' items')}</button>
                    </div>
                  </div>
                ) : (
                  <NumberInput
                    label="Passive Income"
                    value={income.passive}
                    onChange={(val) => setIncome({...income, passive: val})}
                    prefix={currency}
                    rate={exchangeRates[currency]}
                    tooltip={TOOLTIPS.passiveIncome}
                  />
                )}
                
                {expandedCategories.passiveItems && (
                  <div style={{ marginTop: '0.75rem', marginLeft: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {(income.passiveItems || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <input type="text" value={item.name} onChange={(e) => { const newItems = income.passiveItems.map(i => i.id === item.id ? { ...i, name: e.target.value } : i); setIncome({ ...income, passiveItems: newItems }); }} placeholder="Source" style={{ flex: 1, padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#e8e9ed', fontSize: '0.85rem' }} />
                        <SubItemAmountInput value={item.amount} rate={exchangeRates[currency]} onChange={(aed) => { const newItems = income.passiveItems.map(i => i.id === item.id ? { ...i, amount: aed } : i); const total = newItems.reduce((sum, i) => sum + i.amount, 0); setIncome({ ...income, passiveItems: newItems, passive: total }); } } />
                        <input type="text" value={item.endYear ?? ''} onChange={(e) => { const val = e.target.value; if (val === '' || (!isNaN(val) && val.length <= 4)) { const newItems = income.passiveItems.map(i => i.id === item.id ? { ...i, endYear: val === '' ? null : parseInt(val) } : i); setIncome({ ...income, passiveItems: newItems }); }}} placeholder="year" title="Calendar year this income/liability ends (e.g. 2031)" style={{ width: '52px', padding: '0.4rem 0.3rem', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '6px', color: '#eab308', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} />
                        <button onClick={() => { let newItems = income.passiveItems.filter(i => i.id !== item.id); if (newItems.length === 0) newItems = [{ id: 1, name: 'Passive Income', amount: 0, endYear: null }]; const total = newItems.reduce((sum, i) => sum + i.amount, 0); setIncome({ ...income, passiveItems: newItems, passive: total }); }} style={{ padding: '0.4rem 0.55rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => { const newId = income.passiveItems.length > 0 ? Math.max(...income.passiveItems.map(i => i.id)) + 1 : 1; setIncome({ ...income, passiveItems: [...income.passiveItems, { id: newId, name: 'New Source', amount: 0, endYear: null }] }); }} style={{ width: '100%', padding: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px dashed rgba(52, 211, 153, 0.3)', borderRadius: '6px', color: '#34d399', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>+ Add Source</button>
                  </div>
                )}
              </div>
              
              {/* Other Income - Expandable (includes bonuses now) */}
              <div style={{ marginBottom: '1.5rem' }}>
                {/* Read-only total when sub-items exist */}
                {income.otherIncomeItems && income.otherIncomeItems.length > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                      <span style={{ fontSize: '1rem', fontWeight: '700', color: '#e8e9ed' }}>Other Income</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e8e9ed', fontFamily: 'JetBrains Mono, monospace' }}>{formatDisplayNumber(income.other, exchangeRates[currency])}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>growth</span><input type="number" value={assumptions.otherIncomeGrowth ?? 2} onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 0 && v <= 30) setAssumptions({...assumptions, otherIncomeGrowth: v}); }} style={{ width: '52px', padding: '0.1rem 0.2rem', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '4px', color: '#e8e9ed', fontSize: '0.7rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} /><span style={{ fontSize: '0.68rem', color: '#9ca3af' }}>%/yr</span>
                      <span style={{ width: '1px', height: '10px', background: 'rgba(255,255,255,0.1)', display: 'inline-block', margin: '0 0.1rem' }} />
                      <button onClick={() => setExpandedCategories({...expandedCategories, otherIncomeItems: !expandedCategories.otherIncomeItems})} style={{ fontSize: '0.68rem', color: '#9ca3af', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '4px', padding: '0.15rem 0.45rem', cursor: 'pointer', minWidth: '70px', textAlign: 'center' }}>{expandedCategories.otherIncomeItems ? '▲ Hide' : '▼ ' + ((income.otherIncomeItems?.length || 0) === 1 ? '1 item' : (income.otherIncomeItems?.length || 0) + ' items')}</button>
                    </div>
                  </div>
                ) : (
                  <NumberInput
                    label="Other Income"
                    value={income.other}
                    onChange={(val) => setIncome({...income, other: val})}
                    prefix={currency}
                    rate={exchangeRates[currency]}
                    tooltip={TOOLTIPS.otherIncome2}
                  />
                )}
                
                {expandedCategories.otherIncomeItems && (
                  <div style={{ marginTop: '0.75rem', marginLeft: '1rem', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                    {(income.otherIncomeItems || []).map((item) => (
                      <div key={item.id} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem', alignItems: 'center' }}>
                        <input type="text" value={item.name} onChange={(e) => { const newItems = income.otherIncomeItems.map(i => i.id === item.id ? { ...i, name: e.target.value } : i); setIncome({ ...income, otherIncomeItems: newItems }); }} placeholder="Source" style={{ flex: 1, padding: '0.5rem', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '6px', color: '#e8e9ed', fontSize: '0.85rem' }} />
                        <SubItemAmountInput value={item.amount} rate={exchangeRates[currency]} onChange={(aed) => { const newItems = income.otherIncomeItems.map(i => i.id === item.id ? { ...i, amount: aed } : i); const total = newItems.reduce((sum, i) => sum + i.amount, 0); setIncome({ ...income, otherIncomeItems: newItems, other: total }); } } />
                <input type="text" value={item.endYear ?? ''} onChange={(e) => { const val = e.target.value; if (val === '' || (!isNaN(val) && val.length <= 4)) { const newItems = income.otherIncomeItems.map(i => i.id === item.id ? { ...i, endYear: val === '' ? null : parseInt(val) } : i); setIncome({ ...income, otherIncomeItems: newItems }); }}} placeholder="year" title="Calendar year this income/liability ends (e.g. 2031)" style={{ width: '52px', padding: '0.4rem 0.3rem', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '6px', color: '#eab308', fontSize: '0.78rem', fontFamily: 'JetBrains Mono, monospace', textAlign: 'center' }} />
                        <button onClick={() => { let newItems = income.otherIncomeItems.filter(i => i.id !== item.id); if (newItems.length === 0) newItems = [{ id: 1, name: 'Other Income', amount: 0, endYear: null }]; const total = newItems.reduce((sum, i) => sum + i.amount, 0); setIncome({ ...income, otherIncomeItems: newItems, other: total }); }} style={{ padding: '0.4rem 0.55rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600', flexShrink: 0 }}>✕</button>
                      </div>
                    ))}
                    <button onClick={() => { const newId = income.otherIncomeItems.length > 0 ? Math.max(...income.otherIncomeItems.map(i => i.id)) + 1 : 1; setIncome({ ...income, otherIncomeItems: [...income.otherIncomeItems, { id: newId, name: 'New Source', amount: 0, endYear: null }] }); }} style={{ width: '100%', padding: '0.5rem', background: 'rgba(52, 211, 153, 0.1)', border: '1px dashed rgba(52, 211, 153, 0.3)', borderRadius: '6px', color: '#34d399', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600' }}>+ Add Source</button>
                  </div>
                )}
              </div>
            </div>


          {/* Planned Expenses */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '2rem'
          }}>
              {/* Planned Expenses Section */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: '600', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e8e9ed' }}>
                    📋 Planned Expenses
                    <InfoTooltip text="Major financial events entered in today's terms — the model inflates each amount to the target year using the category's growth rate. Set an End Year to make an expense repeat annually (e.g. school fees 2026–2035, inflating each year at the category rate from the start year). Amounts are included in all projections regardless of category tag." />
                  </h3>
                  <button
                    onClick={addOneTimeExpense}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      borderRadius: '6px',
                      color: '#f59e0b',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    + Add Expense
                  </button>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginBottom: '1.5rem' }}>
                  Enter amounts in <strong style={{ color: '#e8e9ed' }}>today's terms</strong> — inflated forward each year by the category growth rate.
                </p>
                
                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {oneTimeExpenses.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '80px 80px 1fr 110px 110px auto', gap: '1rem', padding: '0 1rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: '500' }}>Start</span>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>End <InfoTooltip text="Optional. Set an end year to make this a recurring annual expense — it will repeat every year from Start to End inclusive. Leave blank for a single-year expense. Amounts inflate each year at the category's growth rate from the start year." /></span>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: '500' }}>Description</span>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: '500' }}>Amount ({currency})</span>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>Category <InfoTooltip text="Tags this expense to a budget category for chart colour-coding. Optional — expenses without a category are still included in all projections. Double-count warning: if this expense is already included in your Pre-Retirement or Retirement Budget sections, assigning the same category here will count it twice. Only add expenses here that are not already captured in your regular budgets." /></span>
                    <span></span>
                  </div>
                  )}
                  {oneTimeExpenses.map((expense) => {
                    return (
                    <div key={expense.id} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '80px 80px 1fr 110px 110px auto', 
                      gap: '1rem', 
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: 'rgba(245, 158, 11, 0.05)',
                      borderRadius: '8px',
                      borderLeft: '3px solid #f59e0b',
                    }}>
                      <input
                        type="number"
                        value={expense.year}
                        onChange={(e) => updateOneTimeExpense(expense.id, 'year', parseInt(e.target.value) || new Date().getFullYear())}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.5rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#f59e0b',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                        }}
                      />
                      {/* End Year — optional, makes it recurring */}
                      <input
                        type="text"
                        value={expense.endYear ?? ''}
                        placeholder="—"
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === '' || val === '—') {
                            updateOneTimeExpense(expense.id, 'endYear', null);
                          } else if (/^\d{0,4}$/.test(val)) {
                            // Allow up to 4-digit partial typing; commit once valid year entered
                            const n = parseInt(val);
                            if (!isNaN(n)) updateOneTimeExpense(expense.id, 'endYear', n);
                          }
                        }}
                        onBlur={(e) => {
                          // On blur: clear if invalid (before start year or non-year)
                          const n = expense.endYear;
                          if (n !== null && n < expense.year) updateOneTimeExpense(expense.id, 'endYear', null);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.5rem',
                          background: expense.endYear ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
                          border: expense.endYear ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(255,255,255,0.08)',
                          borderRadius: '8px',
                          color: expense.endYear ? '#f59e0b' : '#4b5563',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: expense.endYear ? '600' : '400',
                          fontSize: '0.9rem',
                        }}
                      />
                      <input
                        type="text"
                        value={expense.description}
                        onChange={(e) => updateOneTimeExpense(expense.id, 'description', e.target.value)}
                        placeholder="Expense description"
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#e8e9ed',
                        }}
                      />
                      <SubItemAmountInput value={expense.amount} rate={exchangeRates[currency]}
                        onChange={(aed) => updateOneTimeExpense(expense.id, 'amount', aed)}
                        style={{ width: '100%', padding: '0.6rem 0.5rem', borderRadius: '8px', fontFamily: 'JetBrains Mono, monospace' }} />
                      <select
                        value={expense.category || 'none'}
                        onChange={(e) => updateOneTimeExpense(expense.id, 'category', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.5rem',
                          background: '#1e2a3a',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: expense.category && expense.category !== 'none' ? '#e8e9ed' : '#6b7280',
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                        }}
                      >
                        <optgroup label="Essential">
                          {expenseCategories.filter(function(c) { return (expenseTags[c.key] || c.group) === 'essential'; }).map(function(c) {
                            return <option key={c.key} value={c.key}>{c.label}</option>;
                          })}
                        </optgroup>
                        <optgroup label="Discretionary">
                          {expenseCategories.filter(function(c) { return (expenseTags[c.key] || c.group) === 'disc'; }).map(function(c) {
                            return <option key={c.key} value={c.key}>{c.label}</option>;
                          })}
                        </optgroup>
                      </select>
                      <button
                        onClick={() => removeOneTimeExpense(expense.id)}
                        style={{
                          padding: '0.6rem 0.75rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '8px',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          lineHeight: '1',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    );
                  })}
                </div>
              </div>
          </div>            
            
          </div>
        )}

        {/* Planning Tab */}
        {activeTab === 'profile' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
            {/* Profile */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2rem'
            }}>
              <h3 style={{ fontSize: '1.3rem', fontWeight: '600', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                🎯 Profile
              </h3>
              <NumberInput
                label="Current Age"
                value={profile.currentAge}
                onChange={(val) => {
                  const v = Math.max(1, Math.min(val, profile.retirementAge - 1));
                  setProfile({...profile, currentAge: v});
                }}
                step={1}
                tooltip={TOOLTIPS.currentAge}
              />
              <NumberInput
                label="Planned Retirement Age"
                value={profile.retirementAge}
                onChange={(val) => {
                  const v = Math.max(profile.currentAge + 1, Math.min(val, profile.lifeExpectancy - 1));
                  setProfile({...profile, retirementAge: v});
                }}
                step={1}
                tooltip={TOOLTIPS.retirementAge}
              />
              <NumberInput
                label="Life Expectancy"
                value={profile.lifeExpectancy}
                onChange={(val) => {
                  const v = Math.max(profile.retirementAge + 1, val);
                  setProfile({...profile, lifeExpectancy: v});
                }}
                step={1}
                tooltip={TOOLTIPS.lifeExpectancy}
              />
              
            </div>
            

            {/* Life Events */}
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.03)', 
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '2rem',
              gridColumn: 'span 2'
            }}>
              {/* Life Events Section */}
              <div style={{ marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    🎊 Life Events <InfoTooltip text="Personal milestones that appear as markers on your projection charts — job changes, inheritance, relocation, marriage, etc. They don't affect calculations directly but help you read your charts in context." />
                  </h4>
                  <button
                    onClick={() => {
                      const currentYear = new Date().getFullYear();
                      const newId = lifeEvents.length > 0 ? Math.max(...lifeEvents.map(e => e.id || 0)) + 1 : 1;
                      setLifeEvents([...lifeEvents, {
                        id: newId,
                        year: currentYear,
                        description: 'New Event',
                        age: profile.currentAge
                      }]);
                    }}
                    style={{
                      padding: '0.5rem 1rem',
                      background: 'rgba(96, 165, 250, 0.1)',
                      border: '1px solid rgba(96, 165, 250, 0.3)',
                      borderRadius: '6px',
                      color: '#60a5fa',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}
                  >
                    + Add Life Event
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginBottom: '1rem' }}>
                  Personal milestones: births, graduations, career changes, relocations, etc.
                </p>

                <div style={{ display: 'grid', gap: '0.5rem' }}>
                  {lifeEvents.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '120px 100px 2fr auto', gap: '1rem', padding: '0 1rem' }}>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: '500' }}>Year</span>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: '500' }}>Age (auto)</span>
                    <span style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: '500' }}>Description</span>
                    <span></span>
                  </div>
                  )}
                  {lifeEvents.map((event) => (
                    <div key={event.id} style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '120px 100px 2fr auto', 
                      gap: '1rem', 
                      alignItems: 'center',
                      padding: '0.75rem 1rem',
                      background: 'rgba(96, 165, 250, 0.05)',
                      borderRadius: '8px',
                      borderLeft: '3px solid #60a5fa'
                    }}>
                      <input
                        type="number"
                        value={event.year}
                        onChange={(e) => {
                          const currentYear = new Date().getFullYear();
                          const year = parseInt(e.target.value) || currentYear;
                          const calculatedAge = profile.currentAge + (year - currentYear);
                          const newEvents = lifeEvents.map(ev => 
                            ev.id === event.id ? { ...ev, year: year, age: calculatedAge } : ev
                          );
                          setLifeEvents(newEvents);
                        }}
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.5rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#60a5fa',
                          fontFamily: 'JetBrains Mono, monospace',
                          fontWeight: '600',
                          fontSize: '0.9rem',
                        }}
                      />
                      <div style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#9ca3af',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}>
                        {event.age}
                      </div>
                      <input
                        type="text"
                        value={event.description}
                        onChange={(e) => {
                          const newEvents = lifeEvents.map(ev => 
                            ev.id === event.id ? { ...ev, description: e.target.value } : ev
                          );
                          setLifeEvents(newEvents);
                        }}
                        placeholder="Event description"
                        style={{
                          width: '100%',
                          padding: '0.6rem 0.75rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          color: '#e8e9ed',
                        }}
                      />
                      <button
                        onClick={() => {
                          const newEvents = lifeEvents.filter(ev => ev.id !== event.id);
                          setLifeEvents(newEvents);
                        }}
                        style={{
                          padding: '0.6rem 0.75rem',
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.2)',
                          borderRadius: '8px',
                          color: '#ef4444',
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                          fontWeight: '600',
                          lineHeight: '1',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        )}
      </div>
      
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0a1628 0%, #1a2744 100%)',
            padding: '2rem',
            borderRadius: '16px',
            maxWidth: '450px',
            border: '1px solid rgba(96, 165, 250, 0.3)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ fontSize: '3rem', textAlign: 'center', marginBottom: '1rem' }}>⚠️</div>
            <h3 style={{ marginTop: 0, color: '#e8e9ed', fontSize: '1.5rem', textAlign: 'center', marginBottom: '1rem' }}>
              Reset All Data?
            </h3>
            <p style={{ color: '#9ca3af', marginBottom: '0.5rem', lineHeight: '1.6' }}>
              This will clear all your inputs and return to demo values.
            </p>
            <p style={{ color: '#f59e0b', fontWeight: '600', marginBottom: '1.5rem' }}>
              💾 Make sure to EXPORT your data first if you want to save it!
            </p>
            <p style={{ color: '#6b7280', fontSize: '0.85rem', fontStyle: 'italic' }}>
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={() => {
                  // Reset ALL state to defaults — must include every useState
                  setCurrency(DEFAULT_STATE.currency);
                  fetchFxRates();
                  setProfile(DEFAULT_STATE.profile);
                  setAssets(DEFAULT_STATE.assets);
                  setLiabilities(DEFAULT_STATE.liabilities);
                  setIncome(DEFAULT_STATE.income);
                  // Rebuild expense state from DEFAULT_EXPENSE_CATEGORIES so it always matches
                  const _d = buildDefaultExpenseState(DEFAULT_EXPENSE_CATEGORIES);
                  setExpenses({ current: _d.currentTotal, retirement: _d.retirementTotal });
                  setExpenseCalculator(_d.expenseCalculator);
                  setRetirementBudget(_d.retirementBudget);
                  setExpenseGrowthRates(_d.expenseGrowthRates);
                  setRetExpenseGrowthRates(_d.retExpenseGrowthRates);
                  setExpenseTags(_d.expenseTags);
                  setExpensePhaseOutYears(_d.expensePhaseOutYears);
                  setRetExpensePhaseOutYears(_d.retExpensePhaseOutYears);
                  setLifeEvents(DEFAULT_STATE.lifeEvents);
                  setAssumptions(DEFAULT_STATE.assumptions);
                  setOneTimeExpenses(DEFAULT_STATE.oneTimeExpenses);
                  setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
                  setNestEggSwr(4);
                  setHiddenLines({});
                  setHiddenCalcLines({});
                  setHiddenAssetLines({});
                  setSensitivityAdj([]);
                  setLowDelta(-2.5);
                  setHighDelta(3.5);
                  setRunwayConservativeOffset(-3);
                  setRunwayOptimisticOffset(3);
                  setRunwayPessSpend(0);
                  setRunwayOptSpend(25);
                  setProjectionTargetYear(new Date().getFullYear() + 5);
                  setSurplusSplitInvest(100);
                  setSurplusSplitDebt(0);
                  setExpenseViewMode('annual');
                  setActiveTab('profile');
                  setShowResetConfirm(false);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Reset
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#e8e9ed',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('AppErrorBoundary caught:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'Inter, sans-serif', color: '#e8e9ed', minHeight: '100vh', background: '#0a1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: '#9ca3af', marginBottom: '1.5rem', maxWidth: '500px' }}>
            An unexpected error occurred. Your data may still be saved in your browser. Try reloading the page.
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '1.5rem', maxWidth: '600px', wordBreak: 'break-word' }}>
            {this.state.error?.message ? 'Error details have been logged to the console.' : ''}
          </p>
          <button onClick={() => window.location.reload()} style={{ padding: '0.75rem 2rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer' }}>
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const App = () => (
  <AppErrorBoundary>
    <NetWorthNavigator />
  </AppErrorBoundary>
);

export default App;