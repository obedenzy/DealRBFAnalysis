export interface ProjectionYear {
  year: number;
  revenue: number;
  debtPayment: number;
  cashflow: number;
  cashflowBeforeDebt: number;
  dscr: number;
  growthPct: number;
}

export interface SurplusMonth {
  month: number;
  balance: number; // Remaining RBF Pay-down pool
  rbfPayment: number; // Subsidized RBF payment
  notePayment: number; // Subsidized Seller Note payment
  totalMonthlyDebt: number; // Combined subsidized debt
  monthlyProfit: number; // SDE - subsidized debt
  dscr: number;
}

export interface CalculationInputs {
  // Fundamentals
  revenue: number;
  sde: number;
  askingPrice: number;

  // RBF
  rbfMultiple: number;
  rbfFactor: number;
  rbfTerm: number;
  rbfMode: 'needed' | 'max';
  rbfRepaymentMode: 'term' | 'revenuePct'; // New
  rbfRevenuePct: number; // New

  // AR Factoring
  arAmount: number;
  arAdvanceRate: number;
  arFee: number;

  // Equipment
  equipValue: number;
  equipAdvanceRate: number;
  equipRate: number;
  equipTerm: number;

  // Deal Structure
  downPaymentPct: number;
  sellerNotePct: number;
  sellerNoteRate: number;
  sellerNoteTerm: number;
  balloonAfterMonths: number;
  sellerNoteType: 'amortized' | 'interestOnly';
  sellerEquityPct: number;
  earnoutPct: number;

  // Targets
  targetDscr: number;
  desiredMonthlyProfit: number;

  // Projections
  growthPct: number;
  projectionYears: number;
  
  // Surplus Strategy
  monthlySurplusWithdrawal: number;
  surplusOwnerPayPct: number; // % of surplus to keep for self-pay drip
  subsidizedProfitTarget: number; // Target profit to maintain during surplus drip
}

export interface CalculationResults {
  monthlyRevenue: number;
  monthlySDE: number;
  maxRbfFunding: number;
  rbfUsed: number;
  rbfRepaymentUsed: number;
  rbfMonthly: number;
  rbfWeekly: number; // New
  rbfEstimatedMonths: number; // New
  netArFunding: number;
  equipAdvance: number;
  totalNonRbf: number;
  targetDown: number;
  equipMonthly: number;
  noteMonthly: number;
  totalMonthlyDebt: number;
  monthlyOwnerProfit: number;
  actualDscr: number;
  isViable: boolean;
  totalPrice: number;
  ownershipPct: number;
  reasonsForFailure: string[];
  surplusFunding: number;
  surplusSelfPayPool: number;
  surplusRbfPaydownPool: number;
  rbfRepaymentSavings: number;
  newRbfMonthly: number;
  newMonthlyOwnerProfit: number;
  newActualDscr: number;
  standardProjections: ProjectionYear[];
  optimizedProjections: ProjectionYear[];
  surplusSchedule: SurplusMonth[];
  surplusRunwayMonths: number;
}