# NetWorth Navigator

A comprehensive personal financial planning and retirement projection application built with React. NetWorth Navigator helps you track your current net worth, project your wealth over time, simulate retirement scenarios using Monte Carlo analysis, and identify actionable steps to close any retirement gaps.

## What It Does

**Track Your Finances** - Enter your assets (cash, investments, real estate, other), liabilities (mortgage, loans, other), and income streams (salary, passive, other). The app calculates your net worth and displays it with an interactive donut chart showing your asset allocation.

**Plan Your Retirement** - Set your current age, retirement age, and life expectancy. Define your pre-retirement and retirement expense budgets across 15 categories (housing, groceries, travel, etc.), each with customizable inflation rates. The app projects your wealth trajectory year-by-year until life expectancy.

**Run Monte Carlo Simulations** - The app runs 1,000 market scenarios using normally distributed returns (Box-Muller transform) with your specified expected return and volatility. This gives you a probability estimate of your retirement success — the percentage of scenarios where your portfolio survives until life expectancy.

**Find Your FI Age** - Calculate the earliest age at which your investments could sustain your retirement spending (based on the Safe Withdrawal Rate). Compare this to your planned retirement age to see if you're on track.

**Gap-Closing Levers** - When a retirement gap exists, see three independent recommendations: how much more to save monthly, how many years to delay retirement, or what return you'd need to close the gap.

**Analyze Financial Health** - Seven scorecard tiles benchmark your finances against standard personal finance thresholds: savings rate, net worth multiple (vs. Fidelity age targets), debt ratio, emergency fund months, investment mix, retirement funding, and income replacement ratio.

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

## License

MIT License - Feel free to use this for personal or commercial projects.

---

**Disclaimer**: This application provides illustrative projections based on user-defined assumptions. It does not constitute financial, legal, tax, or investment advice. Past performance does not guarantee future results. Consult qualified professionals for financial decisions.

---

## Data Import & Export

Access all import/export options from the **`···` menu** in the top-right corner of the app. Each option has an inline tooltip (ⓘ) explaining its behaviour.

### 📥 Export JSON

Saves your entire financial plan as a single `.json` file — all inputs, categories, assumptions, and projections are included. Use this to:

- **Back up your data** before making major changes
- **Transfer your plan** to another browser or device
- **Archive a point-in-time snapshot** of your finances

The exported file is named `net-worth-navigator-YYYY-MM-DD.json`. All monetary values are stored in AED regardless of the display currency you have selected.

### 📤 Import JSON

Loads a previously exported JSON file and **fully restores** your plan — income, expenses, assets, liabilities, categories, assumptions, and projections. Use this to:

- Reload a saved backup
- Continue a session started on another device
- Restore data after a browser reset

> ⚠️ Importing **replaces all current data** with the contents of the file. Export first if you want to keep your current state.

### 📊 Import Expenses CSV

Replaces the pre-retirement expense categories and monthly amounts with data from a CSV file — useful when you already track spending in a spreadsheet or budgeting tool and want to seed the app quickly.

#### Required CSV format

The file must be comma-separated (`.csv`) and contain **at least these two column headers** (exact names, case-insensitive):

| Column | Description |
|--------|-------------|
| `Category` | Name of the expense category (e.g. `Groceries`) |
| `Monthly Estimate (CURRENCY)` | Monthly amount in the stated currency (e.g. `Monthly Estimate (EUR)`) |

The currency code in the `Monthly Estimate` header is detected automatically. For example:

- `Monthly Estimate (AED)` → amounts treated as AED (no conversion)
- `Monthly Estimate (EUR)` → amounts converted from EUR to AED using the current exchange rate, and the app display switches to EUR
- `Monthly Estimate (USD)` → same, converted from USD
- `Monthly Estimate (CAD)` → same, converted from CAD

If the header contains no currency code, or the code is not one of the app's supported currencies (AED, USD, EUR, CAD), the amounts are assumed to be **AED** with no conversion applied.

All other columns are ignored. The header row can appear anywhere within the first five lines. A sample from a valid file:

```
Category,Monthly Estimate (EUR),Description
Housing,5815,Monthly rent
Groceries,997,Supermarkets and food delivery
School & Education,64,School fees and supplies
```

A ready-made example file is included in this repository as `sample_csv_import.csv` — use it to test the import flow or as a template to format your own CSV. The sample demonstrates additional monthly columns and descriptions that the importer will ignore (only the required headers are used).

#### What happens on import

1. All existing expense categories are **replaced** with the CSV rows.
2. The **base currency is detected** from the `Monthly Estimate (CURRENCY)` column header. Amounts are converted to AED internally at the current exchange rate, and the app's display currency is switched to match.
3. Monthly amounts are multiplied by 12 to produce annual figures used by the app.
4. **Retirement amounts** are pre-filled with the same annual figures as a placeholder — review and adjust them in the **Retirement** tab.
5. Growth rates default to **3% per year** per category — update them individually in the Pre-Retirement tab as needed.
6. A confirmation message is shown listing how many categories were loaded and which base currency was detected.

> ⚠️ Importing a CSV replaces all expense categories. Export a JSON backup first if you want to preserve your current setup.

### 📄 Export Full Report

Generates a self-contained **HTML report** of your complete financial plan. The report includes:

- Net worth snapshot and key health metrics
- Income, expense, and savings breakdown
- Wealth projection charts (pre- and post-retirement)
- Retirement scenario analysis and Monte Carlo survival odds

The file requires no internet connection to view — open it in any browser and it renders fully offline. Use it to share your plan with a financial advisor, save a printable record, or embed in a document.
