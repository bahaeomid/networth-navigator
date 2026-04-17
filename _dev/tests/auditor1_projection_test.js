// Phase 2.1 Test - Hand computation verification
// Test inputs from audit plan:
const currentYear = new Date().getFullYear();

// Base inputs
const inputs = {
  currentAge: 35,
  retirementAge: 55,
  lifeExpectancy: 85,
  
  // Assets
  assets: {
    cash: 50000,
    investments: 300000,
    realEstate: 800000,
    other: 50000
  },
  
  // Liabilities
  liabilities: {
    mortgage: 600000,
    mortgageEndYear: currentYear + 25,
    loans: 20000,
    loansEndYear: currentYear + 6,
    other: 0
  },
  
  // Income
  income: {
    salary: 300000,
    passive: 40000,
    other: 60000
  },
  
  // Expenses
  expenses: {
    current: 728000 // Default categories total
  },
  
  // Assumptions
  assumptions: {
    investmentReturn: 7,
    realEstateAppreciation: 3.5,
    otherAssetGrowth: 2,
    salaryGrowth: 4,
    passiveGrowth: 2,
    otherIncomeGrowth: 2,
    enableDrawdown: false // Pre-retirement only
  }
};

console.log("Phase 2.1 Test Inputs:");
console.log(JSON.stringify(inputs, null, 2));

// Hand calculations for Year 0 (current year)
console.log("\n=== Year 0 (Current Year) ===");
console.log(`Age: ${inputs.currentAge}`);
console.log(`Investments: ${inputs.assets.investments}`);
console.log(`Real Estate: ${inputs.assets.realEstate}`);
console.log(`Cash: ${inputs.assets.cash}`);
console.log(`Other Assets: ${inputs.assets.other}`);
console.log(`Total Assets: ${inputs.assets.cash + inputs.assets.investments + inputs.assets.realEstate + inputs.assets.other}`);

// Liability amortization
const mortgageAmort = (amt, term, year) => {
  return Math.max(0, amt * ((term - year) / term));
};

const loanAmort = (amt, term, year) => {
  return Math.max(0, amt * ((term - year) / term));
};

console.log(`\nMortgage Balance Year 0: ${mortgageAmort(inputs.liabilities.mortgage, 25, 0)}`);
console.log(`Loans Balance Year 0: ${loanAmort(inputs.liabilities.loans, 6, 0)}`);
console.log(`Total Liabilities Year 0: ${mortgageAmort(inputs.liabilities.mortgage, 25, 0) + loanAmort(inputs.liabilities.loans, 6, 0)}`);

// Year 1 calculations
console.log("\n=== Year 1 Projections ===");
// Investment growth
const inv1 = inputs.assets.investments * (1 + inputs.assumptions.investmentReturn/100);
console.log(`Investments after 1 year (7%): ${inv1.toFixed(2)}`);

// Real estate growth
const re1 = inputs.assets.realEstate * (1 + inputs.assumptions.realEstateAppreciation/100);
console.log(`Real Estate after 1 year (3.5%): ${re1.toFixed(2)}`);

// Other assets growth
const other1 = inputs.assets.other * (1 + inputs.assumptions.otherAssetGrowth/100);
console.log(`Other Assets after 1 year (2%): ${other1.toFixed(2)}`);

// Income growth
const salary1 = inputs.income.salary * (1 + inputs.assumptions.salaryGrowth/100);
const passive1 = inputs.income.passive * (1 + inputs.assumptions.passiveGrowth/100);
const otherIncome1 = inputs.income.other * (1 + inputs.assumptions.otherIncomeGrowth/100);
console.log(`Salary after 1 year (4%): ${salary1.toFixed(2)}`);
console.log(`Passive Income after 1 year (2%): ${passive1.toFixed(2)}`);
console.log(`Other Income after 1 year (2%): ${otherIncome1.toFixed(2)}`);
console.log(`Total Income Year 1: ${(salary1 + passive1 + otherIncome1).toFixed(2)}`);

// Expense growth (simplified - assume 3% overall)
const expenseGrowth = 3;
const expenses1 = inputs.expenses.current * (1 + expenseGrowth/100);
console.log(`Expenses after 1 year (3%): ${expenses1.toFixed(2)}`);

// Savings
const savings1 = Math.max(0, (salary1 + passive1 + otherIncome1) - expenses1);
console.log(`Savings Year 1: ${savings1.toFixed(2)}`);

// Liability amortization Year 1
console.log(`\nMortgage Balance Year 1: ${mortgageAmort(inputs.liabilities.mortgage, 25, 1)}`);
console.log(`Loans Balance Year 1: ${loanAmort(inputs.liabilities.loans, 6, 1)}`);

console.log("\n=== Summary of Critical Issues Found ===");
console.log("1. Sub-item sync: currentNetWorth uses top-level rollups, annualIncome sums sub-items");
console.log("2. NW Multiple denominator inconsistency: uses income.salary (top-level) while annualIncome uses sub-item sum");
console.log("3. Negative savings masked by Math.max(0, ...) in savings calculation");
console.log("4. Drawdown timing: age > retirementAge excludes retirement year from drawdown");
console.log("5. Linear amortization doesn't model real mortgage interest payments (documented limitation)");