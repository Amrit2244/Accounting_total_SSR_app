export const DEFAULT_GROUPS = [
  //Nature :Assest
  { name: "Fixed Assets", nature: "ASSET" },
  { name: "Current Assets", nature: "ASSET" },
  { name: "Investments", nature: "ASSET" },
  { name: "Misc. Expenses (ASSET)", nature: "ASSET" },

  // NATURE: LIABILITIES
  { name: "Capital Account", nature: "LIABILITY" },
  { name: "Current Liabilities", nature: "LIABILITY" },
  { name: "Loans (Liability)", nature: "LIABILITY" },
  { name: "Suspense A/c", nature: "LIABILITY" },
  { name: "Branch / Divisions", nature: "LIABILITY" },

  // NATURE: INCOME
  { name: "Sales Accounts", nature: "INCOME" },
  { name: "Direct Incomes", nature: "INCOME" },
  { name: "Indirect Incomes", nature: "INCOME" },

  // NATURE: EXPENSE
  { name: "Purchase Accounts", nature: "EXPENSE" },
  { name: "Direct Expenses", nature: "EXPENSE" },
  { name: "Indirect Expenses", nature: "EXPENSE" },
];

export const SUB_GROUPS = [
  { name: "Bank Accounts", parent: "Current Assets" },
  { name: "Cash-in-hand", parent: "Current Assets" },
  { name: "Stock-in-hand", parent: "Current Assets" },
  { name: "Sundry Debtors", parent: "Current Assets" },
  { name: "Sundry Creditors", parent: "Current Liabilities" },
  { name: "Duties & Taxes", parent: "Current Liabilities" },
  { name: "Provisions", parent: "Current Liabilities" },
  { name: "Reserves & Surplus", parent: "Capital Account" },
  { name: "Bank OD A/c", parent: "Loans (Liability)" },
  { name: "Secured Loans", parent: "Loans (Liability)" },
  { name: "Unsecured Loans", parent: "Loans (Liability)" },
];
