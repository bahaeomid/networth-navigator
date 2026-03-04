# NetWorth Navigator

A comprehensive personal financial planning and retirement projection application built with React. NetWorth Navigator helps you track your current net worth, project your wealth over time, simulate retirement scenarios using Monte Carlo analysis, and identify actionable steps to close any retirement gaps.

## What It Does

**Track Your Finances** - Enter your assets (cash, investments, real estate, other), liabilities (mortgage, loans, other), and income streams (salary, passive, other). The app calculates your net worth and displays it with an interactive donut chart showing your asset allocation.

**Plan Your Retirement** - Set your current age, retirement age, and life expectancy. Define your pre-retirement and retirement expense budgets across 15 categories (housing, groceries, travel, etc.), each with customizable inflation rates. The app projects your wealth trajectory year-by-year until life expectancy.

**Run Monte Carlo Simulations** - The app runs 1,000 market scenarios using normally distributed returns (Box-Muller transform) with your specified expected return and volatility. This gives you a probability estimate of your retirement success — the percentage of scenarios where your portfolio survives until life expectancy.

**Find Your FI Age** - Calculate the earliest age at which your investments could sustain your retirement spending (based on the Safe Withdrawal Rate). Compare this to your planned retirement age to see if you're on track.

**Gap-Closing Levers** - When a retirement gap exists, see three independent recommendations: how much more to save monthly, how many years to delay retirement, or what return you'd need to close the gap.

**Analyze Financial Health** - Seven scorecard tiles benchmark your finances against standard personal finance thresholds: savings rate, net worth multiple (vs. Fidelity age targets), debt ratio, emergency fund months, investment mix, retirement funding, and income replacement ratio.

![NetWorth Navigator Dashboard](https://via.placeholder.com/800x400?text=NetWorth+Navigator+Dashboard)

## Features

### Core Functionality
- **Net Worth Tracking** - Monitor your total assets (cash, investments, real estate, other) against liabilities (mortgage, loans, other)
- **Retirement Projections** - Calculate when you can achieve Financial Independence (FI) based on your savings and expenses
- **Monte Carlo Simulation** - Run 1,000 simulations to estimate retirement success probability based on market volatility
- **Wealth Milestones** - Track progress toward $1M, $5M, $10M, and $25M USD thresholds

### Financial Planning Tools
- **Multi-Currency Support** - View all figures in AED, USD, CAD, or EUR with real-time conversion
- **Detailed Expense Tracking** - 15 pre-configured expense categories (essential and discretionary) with customizable growth rates
- **Income Projection** - Track salary, passive income, and other income streams with individual growth rates
- **Asset/Liability Management** - Add sub-items for detailed tracking of each asset and liability category
- **One-Time Expenses** - Plan for major purchases (cars, home renovations) with recurring expense support
- **Life Events** - Mark significant financial events on your timeline

### Analysis & Insights
- **Financial Health Scorecards** - 7 key metrics benchmarked against personal finance standards:
  - Savings Rate (target: 20%+)
  - Net Worth Multiple (Fidelity benchmarks by age)
  - Debt Ratio (target: <30%)
  - Emergency Fund (target: 6+ months)
  - Investment Mix (target: 40%+)
  - Retirement Funding (% of required nest egg)
  - Income Replacement Ratio (target: 70-120%)

- **Gap-Closing Levers** - When retirement gaps exist, see actionable recommendations:
  - Save More: Additional monthly savings needed
  - Retire Later: Years to delay for gap closure
  - Higher Return: Required CAGR to close gap

- **Retirement Runway** - Compare base, pessimistic, and optimistic scenarios

### Data Management
- **Export/Import** - Save your financial data as JSON for backup or sharing
- **Full Report Export** - Generate comprehensive HTML reports with charts and detailed breakdowns
- **Default Values** - Pre-populated with realistic UAE-based financial assumptions

## Tech Stack

- **React 18** - UI framework with hooks for state management
- **Recharts** - Interactive charts (Line, Area, Pie charts)
- **Vite** - Fast build tool and dev server
- **JetBrains Mono** - Monospace font for financial figures

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd networth-navigator

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:3000`.

### Build for Production

```bash
npm run build
```

Production files will be in the `dist` folder.

## Project Structure

```
networth-navigator/
├── index.html          # Entry HTML file
├── package.json        # Dependencies and scripts
├── vite.config.js      # Vite configuration
├── src/
│   ├── main.jsx        # React entry point
│   ├── App.jsx         # Main application component
│   └── index.css      # Global styles
└── README.md          # This file
```

## Key Assumptions & Methodology

The app uses the following deterministic assumptions for projections:

### Default Parameters
| Parameter | Default Value | Description |
|-----------|---------------|-------------|
| Investment Return | 7% p.a. | Nominal pre-tax return on investments |
| Investment Volatility | 12% p.a. | Standard deviation for Monte Carlo |
| Real Estate Appreciation | 3.5% p.a. | Property value growth rate |
| Salary Growth | 4% p.a. | Annual income increase |
| Passive Income Growth | 2% p.a. | Rental/dividend income growth |
| Safe Withdrawal Rate | 4% | Standard retirement withdrawal rate |
| Life Expectancy | 85 years | Planning horizon end point |

### Calculations

**Net Worth**: Total Assets - Total Liabilities (current snapshot)

**FI Age**: Earliest age when investment portfolio ≥ Required Nest Egg
- Required Nest Egg = Annual Retirement Expenses ÷ SWR

**Monte Carlo Simulation**: 
- 1,000 simulations with normally distributed returns (Box-Muller transform)
- Success = portfolio balance > 0 at life expectancy
- ≥80% = strong plan, 60-79% = caution, <60% = review recommended

**Expense Inflation**: Each category grows at its own rate, entered in today's terms and inflated forward.

### Limitations (Important)

This tool is for **informational purposes only** and does NOT provide:
- Tax modelling (income, capital gains, inheritance taxes)
- Currency risk modeling (exchange rates held static)
- Sequence-of-returns risk beyond Monte Carlo
- Tax-advantaged account optimization
- Social Security/pension integration

**Always consult a qualified financial advisor before making investment decisions.**

## Usage Guide

### Dashboard Tab
View your net worth at a glance with key metrics and interactive projection charts.

### Profile Tab
Set your current age, planned retirement age, and life expectancy. Configure economic assumptions like investment returns and growth rates.

### Finances Tab
Enter your current assets, liabilities, and income streams. Use sub-items for detailed tracking.

### Pre-Retirement Tab
Configure your current annual expenses by category. Set individual growth rates for each expense type.

### Retirement Tab
Define your expected retirement spending. Set the Safe Withdrawal Rate and enable/disable drawdown simulation.

## Financial Health Metrics Explained

### Savings Rate
- ≥20%: Green (wealth-building pace)
- 10-19%: Amber (adequate)
- <10%: Red (at risk)

### Debt Ratio
- <30%: Green (healthy leverage)
- 30-49%: Amber (moderate)
- ≥50%: Red (high leverage)

### Emergency Fund (months of expenses)
- ≥6 months: Green
- 3-5 months: Amber
- <3 months: Red

### Investment Mix (% of total assets)
- ≥40%: Green
- 20-39%: Amber
- <20%: Red

### Retirement Funding
- ≥100%: Green (fully funded)
- 85-99%: Light green (approaching)
- 50-84%: Amber
- <50%: Red

### Income Replacement Ratio
- 70-120%: Green (adequate replacement)
- >120%: Amber (lifestyle upgrade)
- <70%: Red (significant lifestyle reduction)

## License

MIT License - Feel free to use this for personal or commercial projects.

## Acknowledgments

- Financial planning methodologies inspired by standard personal finance frameworks
- UI design influenced by modern dashboard aesthetics
- Built with React and Recharts

---

**Disclaimer**: This application provides illustrative projections based on user-defined assumptions. It does not constitute financial, legal, tax, or investment advice. Past performance does not guarantee future results. Consult qualified professionals for financial decisions.
