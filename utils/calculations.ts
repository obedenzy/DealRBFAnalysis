import { CalculationInputs, CalculationResults, ProjectionYear, SurplusMonth } from '../types';

export const calculateDeal = (inputs: CalculationInputs): CalculationResults => {
  const {
    revenue, sde, askingPrice,
    rbfMultiple, rbfFactor, rbfTerm, rbfMode,
    arAmount, arAdvanceRate, arFee,
    equipValue, equipAdvanceRate, equipRate, equipTerm,
    downPaymentPct, sellerNotePct, sellerNoteRate, sellerNoteTerm,
    balloonAfterMonths, sellerNoteType, sellerEquityPct, earnoutPct,
    targetDscr, desiredMonthlyProfit,
    growthPct, projectionYears,
    surplusOwnerPayPct
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
  const rbfMonthly = rbfTerm > 0 ? rbfRepaymentUsed / rbfTerm : 0;

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

  const monthlyDebtToSubsidize = rbfMonthly + noteMonthly;

  while (month <= 120) {
    // Apply pool to cover as much of the RBF and Note as possible
    const subsidyTaken = Math.min(currentRbfPaydownPool, monthlyDebtToSubsidize);
    
    // Pro-rata reduction for reporting
    const rbfReduction = monthlyDebtToSubsidize > 0 ? (rbfMonthly / monthlyDebtToSubsidize) * subsidyTaken : 0;
    const noteReduction = monthlyDebtToSubsidize > 0 ? (noteMonthly / monthlyDebtToSubsidize) * subsidyTaken : 0;

    const subsidizedRbf = rbfMonthly - rbfReduction;
    const subsidizedNote = noteMonthly - noteReduction;
    const subsidizedTotalDebt = subsidizedRbf + subsidizedNote + equipMonthly;
    
    const currentMonthlyProfit = (monthlySDE - subsidizedTotalDebt) * (ownershipPct / 100);
    const currentDscr = subsidizedTotalDebt > 0 ? monthlySDE / subsidizedTotalDebt : Infinity;

    // We deduct from the pool
    currentRbfPaydownPool -= subsidyTaken;

    // Only add to schedule if there was a pool or it's month 1
    if (subsidyTaken > 0 || month === 1) {
       surplusSchedule.push({
        month,
        balance: Math.max(0, currentRbfPaydownPool), // Show balance AFTER deduction
        rbfPayment: subsidizedRbf,
        notePayment: subsidizedNote,
        totalMonthlyDebt: subsidizedTotalDebt,
        monthlyProfit: currentMonthlyProfit,
        dscr: currentDscr
      });
    }

    // Runway condition: We successfully subsidized to maintain profit above 10k
    if (subsidyTaken > 0 && currentMonthlyProfit >= 10000) {
      surplusRunwayMonths++;
    }

    month++;
    
    // Stop if pool is empty and we've already handled the first few months or terms
    if (currentRbfPaydownPool <= 0) break;
    if (month > 120) break;
  }

  // Projections Logic
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
        if (totalMonthsElapsed <= rbfTerm) annualDebtPayment += initialRbfMonthly;
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