import { CalculationInputs, CalculationResults, ProjectionYear, SurplusMonth } from '../types';

export const calculateDeal = (inputs: CalculationInputs): CalculationResults => {
  const {
    revenue, sde, askingPrice,
    rbfMultiple, rbfFactor, rbfTerm, rbfMode, rbfRepaymentMode, rbfRevenuePct,
    arAmount, arAdvanceRate, arFee,
    equipValue, equipAdvanceRate, equipRate, equipTerm,
    downPaymentPct, sellerNotePct, sellerNoteRate, sellerNoteTerm,
    balloonAfterMonths, sellerNoteType, sellerEquityPct, earnoutPct,
    targetDscr, desiredMonthlyProfit,
    growthPct, projectionYears,
    surplusOwnerPayPct, subsidizedProfitTarget
  } = inputs;

  const monthlyRevenue = revenue / 12;
  const monthlySDE = sde / 12;

  // 1. Max RBF available
  const maxRbfFunding = monthlyRevenue * rbfMultiple;

  // 2. Non-RBF Funding sources
  const netArFunding = arAmount * (arAdvanceRate / 100) - (arAmount * (arFee / 100));
  const equipAdvance = equipValue * (equipAdvanceRate / 100);
  const totalNonRbf = netArFunding + equipAdvance;

  // 3. RBF Required
  const targetDown = askingPrice * (downPaymentPct / 100);
  const rbfNeeded = Math.max(0, targetDown - totalNonRbf);

  let rbfUsed = 0;
  if (rbfMode === 'max') {
    rbfUsed = maxRbfFunding;
  } else {
    rbfUsed = Math.min(maxRbfFunding, rbfNeeded);
  }

  const rbfRepaymentUsed = rbfUsed * rbfFactor;
  
  let rbfMonthly = 0;
  let rbfEstimatedMonths = 0;

  if (rbfRepaymentMode === 'term') {
    rbfMonthly = rbfTerm > 0 ? rbfRepaymentUsed / rbfTerm : 0;
    rbfEstimatedMonths = rbfTerm;
  } else {
    rbfMonthly = monthlyRevenue * (rbfRevenuePct / 100);
    rbfEstimatedMonths = rbfMonthly > 0 ? rbfRepaymentUsed / rbfMonthly : 0;
  }

  const rbfWeekly = rbfMonthly / 4.33;

  // Surplus calculation
  const surplusFunding = Math.max(0, rbfUsed - rbfNeeded);
  
  // SPLIT SURPLUS
  const surplusSelfPayPool = surplusFunding * (surplusOwnerPayPct / 100);
  const surplusRbfPaydownPool = surplusFunding - surplusSelfPayPool;

  // 4. Monthly debt from other sources
  const equipMonthlyRate = equipRate / 100 / 12;
  let equipMonthly = 0;
  if (equipMonthlyRate > 0 && equipAdvance > 0) {
    equipMonthly = equipAdvance * (equipMonthlyRate * Math.pow(1 + equipMonthlyRate, equipTerm)) / (Math.pow(1 + equipMonthlyRate, equipTerm) - 1);
  } else if (equipTerm > 0) {
    equipMonthly = equipAdvance / equipTerm;
  }

  const sellerNote = askingPrice * (sellerNotePct / 100);
  const noteMonthlyRate = sellerNoteRate / 100 / 12;
  let noteMonthly = 0;

  if (sellerNote > 0) {
    if (sellerNoteType === 'amortized' || balloonAfterMonths === 0) {
      noteMonthly = sellerNote * (noteMonthlyRate * Math.pow(1 + noteMonthlyRate, sellerNoteTerm)) / (Math.pow(1 + noteMonthlyRate, sellerNoteTerm) - 1);
    } else {
      noteMonthly = sellerNote * noteMonthlyRate;
    }
  }

  const totalMonthlyDebt = rbfMonthly + noteMonthly + equipMonthly;
  const ownershipPct = 100 - sellerEquityPct;
  const monthlyOwnerProfit = (monthlySDE - totalMonthlyDebt) * (ownershipPct / 100);

  const actualDscr = totalMonthlyDebt > 0 ? monthlySDE / totalMonthlyDebt : Infinity;

  const totalEarnout = askingPrice * (earnoutPct / 100);
  const totalPrice = askingPrice + totalEarnout;

  // Surplus Drip Strategy Schedule
  const surplusSchedule: SurplusMonth[] = [];
  let currentRbfPaydownPool = surplusRbfPaydownPool;
  let month = 1;
  let surplusRunwayMonths = 0;

  while (month <= 120 && currentRbfPaydownPool > 0) {
    const startOfmonthBalance = currentRbfPaydownPool;
    const monthlyCost = rbfMonthly + noteMonthly + subsidizedProfitTarget;
    const subsidyApplied = Math.min(currentRbfPaydownPool, monthlyCost);
    
    if (subsidyApplied >= monthlyCost) {
      surplusRunwayMonths++;
    }

    surplusSchedule.push({
      month,
      balance: startOfmonthBalance,
      rbfPayment: rbfMonthly,
      notePayment: noteMonthly,
      totalMonthlyDebt: rbfMonthly + noteMonthly + equipMonthly,
      monthlyProfit: subsidizedProfitTarget,
      dscr: Infinity 
    });

    currentRbfPaydownPool -= subsidyApplied;
    month++;
    if (month > 120) break;
  }

  // Projections
  const calculateProjections = (initialRbfMonthly: number): ProjectionYear[] => {
    const projections: ProjectionYear[] = [];
    let currentAnnualRevenue = revenue;
    let currentAnnualSDE = sde;

    for (let year = 1; year <= projectionYears; year++) {
      currentAnnualRevenue *= (1 + growthPct / 100);
      currentAnnualSDE *= (1 + growthPct / 100);

      let annualDebtPayment = 0;
      for (let m = 1; m <= 12; m++) {
        const totalMonthsElapsed = (year - 1) * 12 + m;
        
        // RBF check
        if (rbfRepaymentMode === 'term') {
          if (totalMonthsElapsed <= rbfTerm) annualDebtPayment += initialRbfMonthly;
        } else {
          // In revenue mode, we use the estimated months as a cutoff for the projection
          if (totalMonthsElapsed <= Math.ceil(rbfEstimatedMonths)) annualDebtPayment += initialRbfMonthly;
        }

        if (totalMonthsElapsed <= sellerNoteTerm) annualDebtPayment += noteMonthly;
        if (totalMonthsElapsed <= equipTerm) annualDebtPayment += equipMonthly;
      }

      const netProfit = currentAnnualSDE - annualDebtPayment;
      const ownerCashflow = netProfit * (ownershipPct / 100);
      const yearDscr = annualDebtPayment > 0 ? currentAnnualSDE / annualDebtPayment : Infinity;

      projections.push({
        year,
        growthPct: growthPct,
        revenue: currentAnnualRevenue,
        cashflowBeforeDebt: currentAnnualSDE,
        debtPayment: annualDebtPayment,
        cashflow: ownerCashflow,
        dscr: yearDscr
      });
    }
    return projections;
  };

  const standardProjections = calculateProjections(rbfMonthly);

  // Validation
  const reasonsForFailure: string[] = [];
  if (revenue < 1000000) reasonsForFailure.push("Revenue below $1M benchmark.");
  if (sde < 240000) reasonsForFailure.push("SDE below $240k threshold.");
  if (totalNonRbf + maxRbfFunding < targetDown) reasonsForFailure.push("Insufficient funding for down payment.");
  if (monthlyOwnerProfit < desiredMonthlyProfit) reasonsForFailure.push("Profit target not met.");
  if (actualDscr < targetDscr) reasonsForFailure.push(`DSCR ${actualDscr.toFixed(2)} is below target ${targetDscr}.`);
  
  const structureTotal = downPaymentPct + sellerNotePct + sellerEquityPct + earnoutPct;
  if (Math.abs(structureTotal - 100) > 0.01) {
    reasonsForFailure.push(`Deal structure totals ${structureTotal.toFixed(1)}% (must be 100%).`);
  }

  const isViable = reasonsForFailure.length === 0;

  return {
    monthlyRevenue,
    monthlySDE,
    maxRbfFunding,
    rbfUsed,
    rbfRepaymentUsed,
    rbfMonthly,
    rbfWeekly,
    rbfEstimatedMonths,
    netArFunding,
    equipAdvance,
    totalNonRbf,
    targetDown,
    equipMonthly,
    noteMonthly,
    totalMonthlyDebt,
    monthlyOwnerProfit,
    actualDscr,
    isViable,
    totalPrice,
    ownershipPct,
    reasonsForFailure,
    surplusFunding,
    surplusSelfPayPool,
    surplusRbfPaydownPool,
    rbfRepaymentSavings: 0,
    newRbfMonthly: rbfMonthly,
    newMonthlyOwnerProfit: monthlyOwnerProfit,
    newActualDscr: actualDscr,
    standardProjections,
    optimizedProjections: standardProjections,
    surplusSchedule,
    surplusRunwayMonths
  };
};