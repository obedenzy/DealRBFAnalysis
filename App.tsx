import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Wallet, 
  Truck, 
  Target, 
  Calculator, 
  CheckCircle2, 
  XCircle,
  TrendingUp,
  PieChart as PieChartIcon,
  Info,
  Zap,
  Coins,
  ArrowDownToLine,
  ShieldCheck,
  Activity,
  CalendarDays,
  Table as TableIcon,
  Tag,
  CreditCard,
  UserCheck,
  Banknote,
  History,
  Clock,
  ArrowRightLeft
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { CalculationInputs, ProjectionYear, SurplusMonth } from './types';
import { calculateDeal } from './utils/calculations';

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 0 
  }).format(val);

const App: React.FC = () => {
  const [inputs, setInputs] = useState<CalculationInputs>({
    revenue: 2880000,
    sde: 600000,
    askingPrice: 800000,
    rbfMultiple: 1.2,
    rbfFactor: 1.2,
    rbfTerm: 15,
    rbfMode: 'needed',
    arAmount: 0,
    arAdvanceRate: 90,
    arFee: 2.5,
    equipValue: 0,
    equipAdvanceRate: 100,
    equipRate: 7.5,
    equipTerm: 48,
    downPaymentPct: 40,
    sellerNotePct: 60,
    sellerNoteRate: 6,
    sellerNoteTerm: 60,
    balloonAfterMonths: 36,
    sellerNoteType: 'amortized',
    sellerEquityPct: 0,
    earnoutPct: 0,
    targetDscr: 1.5,
    desiredMonthlyProfit: 15000,
    growthPct: 5,
    projectionYears: 5,
    monthlySurplusWithdrawal: 20000,
    surplusOwnerPayPct: 50
  });

  const results = useMemo(() => calculateDeal(inputs), [inputs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setInputs(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const chartData = [
    { name: 'Down Payment', value: inputs.downPaymentPct },
    { name: 'Seller Note', value: inputs.sellerNotePct },
    { name: 'Equity Retained', value: inputs.sellerEquityPct },
    { name: 'Earnout', value: inputs.earnoutPct }
  ].filter(d => d.value > 0);

  const downPaymentVal = inputs.askingPrice * (inputs.downPaymentPct / 100);
  const sellerNoteVal = inputs.askingPrice * (inputs.sellerNotePct / 100);
  const sellerEquityVal = inputs.askingPrice * (inputs.sellerEquityPct / 100);
  const earnoutVal = inputs.askingPrice * (inputs.earnoutPct / 100);
  const arAdvanceVal = inputs.arAmount * (inputs.arAdvanceRate / 100);
  const arFeeVal = inputs.arAmount * (inputs.arFee / 100);
  const equipAdvanceVal = inputs.equipValue * (inputs.equipAdvanceRate / 100);

  const structureTotal = inputs.downPaymentPct + inputs.sellerNotePct + inputs.sellerEquityPct + inputs.earnoutPct;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">
              Acquisition Funding <span className="text-indigo-600">Architect</span>
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium">
            <span className="text-slate-500 font-semibold">Status:</span>
            {results.isViable ? (
              <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                <CheckCircle2 className="w-4 h-4" /> Viable
              </span>
            ) : (
              <span className="flex items-center gap-1 text-rose-600 bg-rose-50 px-3 py-1 rounded-full border border-rose-200 shadow-sm">
                <XCircle className="w-4 h-4" /> Adjustment Needed
              </span>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
        
        <section className="lg:col-span-5 space-y-6 lg:h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2">
          
          <InputGroup title="Business Fundamentals" icon={<Building2 className="w-5 h-5" />}>
            <div className="grid grid-cols-1 gap-4">
              <InputField label="Annual Revenue" name="revenue" value={inputs.revenue} onChange={handleInputChange} prefix="$" />
              <InputField label="Annual SDE" name="sde" value={inputs.sde} onChange={handleInputChange} prefix="$" />
              <InputField label="Asking Price" name="askingPrice" value={inputs.askingPrice} onChange={handleInputChange} prefix="$" />
            </div>
          </InputGroup>

          <InputGroup title="RBF Funding" icon={<TrendingUp className="w-5 h-5" />}>
            <div className="grid grid-cols-2 gap-4">
              <InputField label={`Max Multiple (${formatCurrency(results.maxRbfFunding)})`} name="rbfMultiple" value={inputs.rbfMultiple} onChange={handleInputChange} step={0.1} />
              <InputField label={`Repayment Multiple (${formatCurrency(results.rbfRepaymentUsed)})`} name="rbfFactor" value={inputs.rbfFactor} onChange={handleInputChange} step={0.05} />
              <InputField label="Term (Months)" name="rbfTerm" value={inputs.rbfTerm} onChange={handleInputChange} />
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold uppercase text-slate-500 leading-none">Usage Mode</label>
                <select 
                  name="rbfMode" 
                  value={inputs.rbfMode} 
                  onChange={handleInputChange}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                >
                  <option value="needed">Use Needed</option>
                  <option value="max">Use Max</option>
                </select>
              </div>
            </div>
          </InputGroup>

          <InputGroup title={`Deal Structure (${structureTotal.toFixed(0)}%)`} icon={<PieChartIcon className="w-5 h-5" />}>
            <div className="grid grid-cols-2 gap-4">
              <InputField label={`Down Payment % (${formatCurrency(downPaymentVal)})`} name="downPaymentPct" value={inputs.downPaymentPct} onChange={handleInputChange} suffix="%" />
              <InputField label={`Seller Note % (${formatCurrency(sellerNoteVal)})`} name="sellerNotePct" value={inputs.sellerNotePct} onChange={handleInputChange} suffix="%" />
              <InputField label={`Seller Equity % (${formatCurrency(sellerEquityVal)})`} name="sellerEquityPct" value={inputs.sellerEquityPct} onChange={handleInputChange} suffix="%" />
              <InputField label={`Earnout % (${formatCurrency(earnoutVal)})`} name="earnoutPct" value={inputs.earnoutPct} onChange={handleInputChange} suffix="%" />
            </div>
            <div className="mt-6 pt-4 border-t border-slate-200">
              <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Note Details</p>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Note Rate %" name="sellerNoteRate" value={inputs.sellerNoteRate} onChange={handleInputChange} suffix="%" />
                <InputField label="Note Term (Mo)" name="sellerNoteTerm" value={inputs.sellerNoteTerm} onChange={handleInputChange} />
                <InputField label="Balloon At (Mo)" name="balloonAfterMonths" value={inputs.balloonAfterMonths} onChange={handleInputChange} />
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase text-slate-500 leading-none">Note Type</label>
                  <select name="sellerNoteType" value={inputs.sellerNoteType} onChange={handleInputChange} className="bg-white border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 transition-all outline-none">
                    <option value="amortized">Amortized</option>
                    <option value="interestOnly">Interest Only</option>
                  </select>
                </div>
              </div>
            </div>
          </InputGroup>

          <InputGroup title="Asset-Based Financing" icon={<Truck className="w-5 h-5" />}>
            <div className="space-y-4">
              <div className="border-b border-slate-200 pb-4">
                <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">AR Factoring</p>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Balance" name="arAmount" value={inputs.arAmount} onChange={handleInputChange} prefix="$" />
                    <InputField label={`Advance % (${formatCurrency(arAdvanceVal)})`} name="arAdvanceRate" value={inputs.arAdvanceRate} onChange={handleInputChange} suffix="%" />
                  </div>
                  <InputField label={`Fee % (${formatCurrency(arFeeVal)})`} name="arFee" value={inputs.arFee} onChange={handleInputChange} suffix="%" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Equipment Loans</p>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Value" name="equipValue" value={inputs.equipValue} onChange={handleInputChange} prefix="$" />
                  <InputField label={`Advance % (${formatCurrency(equipAdvanceVal)})`} name="equipAdvanceRate" value={inputs.equipAdvanceRate} onChange={handleInputChange} suffix="%" />
                  <InputField label="Rate %" name="equipRate" value={inputs.equipRate} onChange={handleInputChange} suffix="%" />
                  <InputField label="Term (Mo)" name="equipTerm" value={inputs.equipTerm} onChange={handleInputChange} />
                </div>
              </div>
            </div>
          </InputGroup>

          <InputGroup title="Growth & Surplus Targets" icon={<Target className="w-5 h-5" />}>
            <div className="grid grid-cols-2 gap-4">
              <InputField label="DSCR Target" name="targetDscr" value={inputs.targetDscr} onChange={handleInputChange} step={0.1} />
              <InputField label="Target Monthly Profit" name="desiredMonthlyProfit" value={inputs.desiredMonthlyProfit} onChange={handleInputChange} prefix="$" />
              <InputField label="Future Growth %" name="growthPct" value={inputs.growthPct} onChange={handleInputChange} suffix="%" />
              <InputField label="Projection Years" name="projectionYears" value={inputs.projectionYears} onChange={handleInputChange} />
              <div className="col-span-2 border-t border-slate-100 mt-2 pt-4 space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Surplus Allocation Strategy</p>
                <InputField label="Self-Pay % of Surplus" name="surplusOwnerPayPct" value={inputs.surplusOwnerPayPct} onChange={handleInputChange} suffix="%" />
                <InputField label="Monthly Surplus Drip" name="monthlySurplusWithdrawal" value={inputs.monthlySurplusWithdrawal} onChange={handleInputChange} prefix="$" />
              </div>
            </div>
          </InputGroup>
        </section>

        <section className="lg:col-span-7 space-y-6 lg:h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar pr-2">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-6 rounded-2xl border-2 transition-all duration-500 bg-white ${results.isViable ? 'border-emerald-200 shadow-[0_4px_20px_rgba(16,185,129,0.05)]' : 'border-rose-200 shadow-[0_4px_20px_rgba(244,63,94,0.05)]'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold mb-1 text-slate-800">Deal Viability</h2>
                  <p className="text-sm text-slate-400 font-medium">Benchmarks & Validation</p>
                </div>
                {results.isViable ? <CheckCircle2 className="w-8 h-8 text-emerald-500" /> : <XCircle className="w-8 h-8 text-rose-500" />}
              </div>
              <div className="space-y-3">
                {results.isViable ? (
                  <p className="text-emerald-700 font-medium">This deal meets all financial thresholds and structure requirements.</p>
                ) : (
                  <div className="space-y-1">
                    {results.reasonsForFailure.map((r, i) => (
                      <div key={i} className="flex items-center gap-2 text-rose-600 text-sm font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        {r}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                <Wallet className="w-5 h-5 text-indigo-500" /> Total Deal Size
              </h2>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-black mb-1 tracking-widest">Total Acquisition Cost</p>
                  <p className="text-4xl font-black text-slate-900">{formatCurrency(results.totalPrice)}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-3 py-4 border-y border-slate-100">
                  <div className="flex justify-between items-center group">
                    <span className="text-xs text-slate-500 font-bold uppercase flex items-center gap-2">
                      <Tag className="w-3 h-3 text-slate-400" /> Asking Price
                    </span>
                    <span className="text-sm font-black text-slate-800">{formatCurrency(inputs.askingPrice)}</span>
                  </div>
                  <div className="flex justify-between items-center group">
                    <span className="text-xs text-slate-500 font-bold uppercase flex items-center gap-2">
                      <TrendingUp className="w-3 h-3 text-emerald-400" /> Earnout (Contingent)
                    </span>
                    <span className="text-sm font-black text-emerald-600">{formatCurrency(earnoutVal)}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Payment Structure</p>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-2"><CreditCard className="w-3 h-3" /> Down Payment (Cash)</span>
                      <span className="font-bold text-slate-900">{formatCurrency(downPaymentVal)} <span className="text-slate-400 font-normal ml-1">({inputs.downPaymentPct}%)</span></span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-2"><CalendarDays className="w-3 h-3" /> Seller Note (Debt)</span>
                      <span className="font-bold text-slate-900">{formatCurrency(sellerNoteVal)} <span className="text-slate-400 font-normal ml-1">({inputs.sellerNotePct}%)</span></span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 flex items-center gap-2"><UserCheck className="w-3 h-3" /> Seller Equity (Roll)</span>
                      <span className="font-bold text-slate-900">{formatCurrency(sellerEquityVal)} <span className="text-slate-400 font-normal ml-1">({inputs.sellerEquityPct}%)</span></span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-xs text-slate-500 font-bold uppercase">Buyer Ownership</span>
                  <span className="text-sm font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">{results.ownershipPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Surplus Section */}
          <div className={`bg-white border p-6 rounded-2xl shadow-md border-l-8 transition-all duration-500 ${results.surplusFunding > 0 ? 'border-violet-200 border-l-violet-500' : 'border-slate-200 border-l-slate-300 opacity-60'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Coins className="w-6 h-6 text-violet-600" />
                <h2 className="text-xl font-black text-slate-800 tracking-tight">Surplus Capital Analysis</h2>
              </div>
              {results.surplusFunding > 0 && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-lg">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span className="text-[11px] font-black text-emerald-700 uppercase tracking-widest">{results.surplusRunwayMonths} Month Runway</span>
                </div>
              )}
            </div>

            {results.surplusFunding > 0 ? (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Surplus</p>
                    <p className="text-xl font-black text-slate-900">{formatCurrency(results.surplusFunding)}</p>
                  </div>
                  <div className="bg-violet-50 p-4 rounded-xl border border-violet-100">
                    <p className="text-[10px] font-black text-violet-500 uppercase tracking-widest mb-1">Self-Pay Pool ({inputs.surplusOwnerPayPct}%)</p>
                    <p className="text-xl font-black text-violet-700">{formatCurrency(results.surplusSelfPayPool)}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">RBF Pay-down ({100 - inputs.surplusOwnerPayPct}%)</p>
                    <p className="text-xl font-black text-indigo-700">{formatCurrency(results.surplusRbfPaydownPool)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="flex items-start gap-3 text-sm text-slate-600 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <ShieldCheck className="w-6 h-6 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-black text-slate-800 mb-1 uppercase text-[10px] tracking-widest">Surplus Optimization Logic</p>
                      <p className="text-xs leading-relaxed">
                        Allocation: <strong>{formatCurrency(results.surplusRbfPaydownPool)}</strong> reduces your RBF debt obligation immediately. 
                        Remainder <strong>{formatCurrency(results.surplusSelfPayPool)}</strong> is held in reserve to drip <strong>{formatCurrency(inputs.monthlySurplusWithdrawal)}</strong>/mo to you.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Operational Impacts</h4>
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500 uppercase">New RBF Payment</span>
                        <span className="font-black text-indigo-600">{formatCurrency(results.newRbfMonthly)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-500 uppercase">Total Debt Service</span>
                        <span className="font-black text-rose-500">{formatCurrency(results.surplusSchedule[0]?.totalMonthlyDebt || 0)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-violet-500" />
                      <h3 className="text-[10px] font-black uppercase text-slate-700 tracking-widest">Full Repayment & Distribution Runway</h3>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 italic">Target: Positive Profit &gt; $10,000</span>
                  </div>
                  
                  <div className="overflow-x-auto border border-slate-100 rounded-xl bg-white shadow-inner max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-[11px] border-collapse min-w-[700px]">
                      <thead className="sticky top-0 z-10">
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 font-black text-slate-500 uppercase">Mo</th>
                          <th className="px-4 py-3 font-black text-slate-500 uppercase">Rem. Pool</th>
                          <th className="px-4 py-3 font-black text-slate-500 uppercase">Drip Taken</th>
                          <th className="px-4 py-3 font-black text-slate-500 uppercase">Operating Profit</th>
                          <th className="px-4 py-3 font-black text-slate-500 uppercase">Total Cashflow</th>
                          <th className="px-4 py-3 font-black text-slate-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {results.surplusSchedule.map((s, i) => (
                          <tr key={i} className={`transition-colors ${s.totalOwnerCashflow >= 10000 ? 'hover:bg-emerald-50/30' : 'bg-rose-50/10 grayscale opacity-60'}`}>
                            <td className="px-4 py-3 font-black text-slate-900">{s.month}</td>
                            <td className="px-4 py-3 font-medium text-slate-400">{formatCurrency(s.balance)}</td>
                            <td className="px-4 py-3 font-black text-violet-600">+{formatCurrency(s.withdrawal)}</td>
                            <td className="px-4 py-3 font-bold text-slate-600">{formatCurrency(s.operatingProfit)}</td>
                            <td className={`px-4 py-3 font-black ${s.totalOwnerCashflow >= 10000 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatCurrency(s.totalOwnerCashflow)}
                            </td>
                            <td className="px-4 py-3">
                              {s.totalOwnerCashflow >= 10000 ? (
                                <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-black uppercase">On Target</span>
                              ) : (
                                <span className="text-[9px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded font-black uppercase">Low Profit</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
                <Coins className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">No Surplus Funding Available</p>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">Increase Max RBF usage or leverage Asset-Based Financing to generate excess capital at close.</p>
              </div>
            )}
          </div>

          {/* Existing Metrics Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between overflow-hidden relative shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Coverage Ratio</h3>
                <Zap className={`w-4 h-4 ${results.actualDscr >= 1.5 ? 'text-emerald-500 animate-pulse' : 'text-slate-300'}`} />
              </div>
              <DscrMeter value={results.actualDscr} target={inputs.targetDscr} />
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <p className="text-2xl font-black text-slate-900">{results.actualDscr === Infinity ? '∞' : results.actualDscr.toFixed(2)}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Actual DSCR</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">Target {inputs.targetDscr}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Cash Flow Projection</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500 text-sm font-medium">Monthly Revenue</span>
                  <span className="font-bold text-slate-800">{formatCurrency(results.monthlyRevenue)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="text-slate-500 text-sm font-medium">Monthly SDE</span>
                  <span className="font-bold text-slate-800">{formatCurrency(results.monthlySDE)}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 text-rose-500">
                  <span className="text-sm font-medium">Total Debt Pymt</span>
                  <span className="font-bold">- {formatCurrency(results.totalMonthlyDebt)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-indigo-600 font-bold uppercase text-xs">Net Owner Profit</span>
                  <span className={`text-2xl font-black ${results.monthlyOwnerProfit >= inputs.desiredMonthlyProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {formatCurrency(results.monthlyOwnerProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-2 px-2">
              <TableIcon className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-black text-slate-800">Growth Projections ({inputs.projectionYears} Years)</h3>
            </div>
            <ProjectionTable title="Scenario A: Standard Deal" data={results.standardProjections} theme="indigo" />
            <ProjectionTable title="Scenario B: Surplus Optimization" data={results.optimizedProjections} theme="violet" isOptimized />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Structure Allocation</h3>
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={5} dataKey="value">
                      {chartData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-semibold">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                    <span className="text-slate-500 truncate">{d.name}: {d.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-600">Funding Utilization</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <StatBox label="Max RBF Cap" value={results.maxRbfFunding} subLabel={`${inputs.rbfMultiple}x Rev`} color="indigo" />
                  <StatBox label="RBF Utilized" value={results.rbfUsed} subLabel={`${((results.rbfUsed / results.maxRbfFunding) * 100 || 0).toFixed(0)}%`} color="violet" />
                  <StatBox label="AR Leverage" value={results.netArFunding} subLabel="Factored" color="emerald" />
                  <StatBox label="Equip Advance" value={results.equipAdvance} subLabel="Collateral" color="indigo" />
                </div>
                <div className="space-y-3 pt-4 border-t border-slate-100">
                  <ProgressBar label="RBF Pymt" amount={results.rbfMonthly} total={results.totalMonthlyDebt} color="#8b5cf6" />
                  <ProgressBar label="Seller Note" amount={results.noteMonthly} total={results.totalMonthlyDebt} color="#6366f1" />
                  <ProgressBar label="Equip Loan" amount={results.equipMonthly} total={results.totalMonthlyDebt} color="#10b981" />
                </div>
              </div>
            </div>
          </div>
          <div className="py-8 text-center opacity-40"><p className="text-[10px] uppercase font-bold tracking-widest">Architect End Report</p></div>
        </section>
      </main>
    </div>
  );
};

// --- Helper Components ---

const ProjectionTable: React.FC<{ title: string; data: ProjectionYear[]; theme: string; isOptimized?: boolean }> = ({ title, data, theme, isOptimized }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className={`px-6 py-3 border-b border-slate-200 flex justify-between items-center ${isOptimized ? 'bg-violet-50' : 'bg-slate-50'}`}>
        <h4 className={`text-xs font-black uppercase tracking-widest ${isOptimized ? 'text-violet-700' : 'text-slate-600'}`}>{title}</h4>
        {isOptimized && <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">PROJECTION OPTIMIZED</span>}
      </div>
      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-left text-[11px] md:text-xs border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Year</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Growth</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Revenue</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase whitespace-nowrap">SDE (Before Debt)</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">Debt Svc</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase whitespace-nowrap">Net Cashflow</th>
              <th className="px-4 py-3 font-bold text-slate-500 uppercase">DSCR</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? '' : 'bg-slate-50/50 hover:bg-slate-100 transition-colors'}>
                <td className="px-4 py-3 font-black text-slate-900">{row.year}</td>
                <td className="px-4 py-3 font-semibold text-slate-500">{row.growthPct}%</td>
                <td className="px-4 py-3 font-medium text-slate-600">{formatCurrency(row.revenue)}</td>
                <td className="px-4 py-3 font-semibold text-indigo-600">{formatCurrency(row.cashflowBeforeDebt)}</td>
                <td className="px-4 py-3 font-bold text-rose-500">{row.debtPayment > 0 ? `-${formatCurrency(row.debtPayment)}` : '$0'}</td>
                <td className="px-4 py-3 font-black text-emerald-600">{formatCurrency(row.cashflow)}</td>
                <td className={`px-4 py-3 font-black ${row.dscr >= 1.5 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {row.dscr === Infinity ? '∞' : row.dscr.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DscrMeter: React.FC<{ value: number; target: number }> = ({ value, target }) => {
  const maxValue = 3.0;
  const actualValue = Math.min(value, maxValue);
  const percentage = (actualValue / maxValue) * 100;
  let color = 'bg-rose-500';
  if (value >= target) color = 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]';
  else if (value >= 1.2) color = 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
  return (
    <div className="relative pt-6 pb-2">
      <div className="h-3 w-full bg-slate-100 rounded-full relative overflow-hidden border border-slate-200">
        <div className={`h-full transition-all duration-1000 ease-out rounded-full ${color}`} style={{ width: `${percentage}%` }} />
      </div>
      <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400 uppercase"><span>0.0</span><span>3.0+</span></div>
      <div className="absolute top-4 transition-all duration-1000 ease-out" style={{ left: `${(target / maxValue) * 100}%` }}>
        <div className="w-px h-6 bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.5)]" />
      </div>
    </div>
  );
};

const InputGroup: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-6">
      <div className="text-indigo-500 bg-indigo-50 p-1.5 rounded-lg">{icon}</div>
      <h2 className="text-sm font-bold uppercase tracking-widest text-slate-800">{title}</h2>
    </div>
    {children}
  </div>
);

const InputField: React.FC<{ label: string; name: string; value: number; onChange: any; prefix?: string; suffix?: string; step?: number }> = ({ label, name, value, onChange, prefix, suffix, step = 1 }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold uppercase text-slate-500 leading-none truncate">{label}</label>
    <div className="relative">
      {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">{prefix}</span>}
      <input type="number" name={name} value={value} onChange={onChange} step={step} className={`w-full bg-slate-50 border border-slate-200 rounded-lg py-3 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-400 outline-none ${prefix ? 'pl-7' : 'px-3'} ${suffix ? 'pr-8' : ''}`} />
      {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">{suffix}</span>}
    </div>
  </div>
);

const StatBox: React.FC<{ label: string; value: number; subLabel: string; color: string }> = ({ label, value, subLabel, color }) => (
  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-xl font-black text-${color}-600`}>{formatCurrency(value)}</p>
    <p className="text-[10px] text-slate-500 font-semibold mt-1">{subLabel}</p>
  </div>
);

const ProgressBar: React.FC<{ label: string; amount: number; total: number; color: string }> = ({ label, amount, total, color }) => {
  const percentage = (amount / total) * 100 || 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-800">{formatCurrency(amount)} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div className="h-full transition-all duration-700 ease-out" style={{ width: `${percentage}%`, backgroundColor: color }} />
      </div>
    </div>
  );
};

export default App;