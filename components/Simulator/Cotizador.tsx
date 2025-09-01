import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { simulationService } from '../../services/simulationService';
import { toast } from '../Shared/Toast';
import { CalculatorIcon, CheckCircleIcon, LightBulbIcon, ClockIcon, UserGroupIcon, ShieldCheckIcon } from '../Shared/Icon';
import { Client, Quote, BusinessFlow, TandaMilestone, ViewMode } from '../../types/index';
import { Modal } from '../Shared/Modal';
import { ProtectionDemoSimulator } from './ProtectionDemoSimulator';

type SimulatorMode = 'acquisition' | 'savings';
type Market = 'aguascalientes' | 'edomex' | '';
type ClientType = 'individual' | 'colectivo' | '';

interface Component {
    id: string;
    name: string;
    price: number;
    isOptional: boolean;
    isMultipliedByTerm?: boolean;
}

interface Package {
    name: string;
    rate: number;
    terms: number[];
    components: Component[];
    minDownPaymentPercentage: number;
    defaultMembers?: number;
}

interface CotizadorProps {
    client?: Client;
    onFormalize: (quoteOrEvent: Quote | React.MouseEvent) => void;
    initialMode: SimulatorMode;
    viewMode: ViewMode;
}

interface CollectionUnit {
    id: number;
    consumption: string;
    overprice: string;
}

// --- SUB-COMPONENTS "WOW" ---

const RemainderBar: React.FC<{total: number, saved: number, down: number}> = ({total, saved, down}) => {
    const downP = total > 0 ? (down / total) * 100 : 0;
    const savedP = total > 0 ? (saved / total) * 100 : 0;

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center text-lg">
                <span className="font-semibold text-white">Total del Paquete:</span>
                <span className="font-bold font-mono text-primary-cyan-300">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}</span>
            </div>
            <div className="w-full h-8 bg-gray-700 rounded-lg flex overflow-hidden">
                <div style={{width: `${downP}%`}} className="bg-emerald-500 flex items-center justify-center text-xs font-bold text-white" title={`Enganche: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(down)}`}></div>
                <div style={{width: `${savedP}%`}} className="bg-sky-500 flex items-center justify-center text-xs font-bold text-white" title={`Ahorro: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(saved)}`}></div>
            </div>
             <div className="flex justify-between items-center text-xl pt-2 border-t border-gray-600">
                <span className="font-bold text-white">Remanente a Liquidar:</span>
                <span className="font-extrabold font-mono text-amber-300">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total - down - saved)}</span>
            </div>
        </div>
    );
};

const SavingsProjectionChart: React.FC<{goal: number, monthlySavings: number}> = ({goal, monthlySavings}) => {
    const months = useMemo(() => {
        if (goal <= 0 || monthlySavings <= 0) return [];
        const timeToGoal = goal / monthlySavings;
        const totalMonths = Math.ceil(timeToGoal) + 2;
        const data = [];
        for (let i = 1; i <= totalMonths; i++) {
            const saved = Math.min(monthlySavings * i, goal);
            data.push({ name: `Mes ${i}`, saved });
        }
        return data;
    }, [goal, monthlySavings]);

    const maxValue = goal;

    return (
        <div className="w-full h-64 bg-gray-800/50 rounded-lg flex items-end p-4 space-x-2">
            {months.map((month, i) => (
                 <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                     <div className="absolute -top-8 bg-gray-900 p-1 text-xs rounded-md hidden group-hover:block">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(month.saved)}</div>
                    <div 
                        className={`w-full rounded-t-md ${month.saved >= goal ? 'bg-emerald-500' : 'bg-primary-cyan-600'} hover:bg-primary-cyan-400 transition-all`}
                        style={{ height: `${(month.saved / maxValue) * 100}%`}}
                    ></div>
                    <div className="text-xs text-gray-500 mt-1">{month.name.split(' ')[1]}</div>
                </div>
            ))}
        </div>
    );
}

const TandaTimeline: React.FC<{ milestones: TandaMilestone[] }> = ({ milestones }) => (
    <div className="space-y-4">
        {milestones.map((milestone, index) => (
            <div key={index} className="flex items-center gap-4">
                <div className="flex-shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-full bg-gray-700 border-2 border-gray-600">
                    {milestone.type === 'entrega' ? <CheckCircleIcon className="w-6 h-6 text-emerald-300" /> : <ClockIcon className="w-6 h-6 text-amber-300" />}
                    <span className="text-xs font-bold text-white mt-1">{milestone.duration.toFixed(1)}m</span>
                </div>
                <div>
                    <h5 className="font-semibold text-white">{milestone.label}</h5>
                    {milestone.type === 'entrega' && <p className="text-sm text-emerald-400">Unidad #{milestone.unitNumber} Entregada</p>}
                </div>
            </div>
        ))}
    </div>
);


const AmortizationTable: React.FC<{ table: any[] }> = ({ table }) => ( <div className="overflow-x-auto max-h-[50vh]"><table className="w-full text-sm text-left text-gray-300"><thead className="text-xs text-gray-400 uppercase bg-gray-800 sticky top-0"><tr><th scope="col" className="px-4 py-3"># Pago</th><th scope="col" className="px-4 py-3">Pago Mensual</th><th scope="col" className="px-4 py-3">Capital</th><th scope="col" className="px-4 py-3">Interés</th><th scope="col" className="px-4 py-3">Saldo Insoluto</th></tr></thead><tbody>{table.map(row => (<tr key={row.paymentNumber} className="border-b border-gray-700 hover:bg-gray-800/50"><td className="px-4 py-3 font-medium">{row.paymentNumber}</td><td className="px-4 py-3 font-mono">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.monthlyPayment)}</td><td className="px-4 py-3 font-mono text-emerald-400">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.principal)}</td><td className="px-4 py-3 font-mono text-amber-400">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.interest)}</td><td className="px-4 py-3 font-mono font-semibold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(row.balance)}</td></tr>))}</tbody></table></div>);


// --- MAIN COMPONENT ---
export const Cotizador: React.FC<CotizadorProps> = ({ client, onFormalize, initialMode, viewMode }) => {
    const [market, setMarket] = useState<Market>('');
    const [clientType, setClientType] = useState<ClientType>('');
    const [pkg, setPackage] = useState<Package | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // State for Acquisition Mode
    const [selectedOptions, setSelectedOptions] = useState<Record<string, boolean>>({});
    const [downPaymentPercentage, setDownPaymentPercentage] = useState(20);
    const [term, setTerm] = useState<number>(0);
    const [amortizationTable, setAmortizationTable] = useState<any[]>([]);
    const [downPaymentAmountDirect, setDownPaymentAmountDirect] = useState('');
    
    // State for Savings Mode
    const [initialDownPayment, setInitialDownPayment] = useState('0');
    const [deliveryTerm, setDeliveryTerm] = useState(3);
    const [voluntaryContribution, setVoluntaryContribution] = useState('0');
    const [collectionUnits, setCollectionUnits] = useState<CollectionUnit[]>([]);
    const [tandaMembers, setTandaMembers] = useState(5);
    const [isProtectionDemoOpen, setIsProtectionDemoOpen] = useState(false);
    const [isDetailsVisible, setIsDetailsVisible] = useState(false);


    const handleCollectionUnitChange = (id: number, field: 'consumption' | 'overprice', value: string) => {
        setCollectionUnits(prevUnits =>
            prevUnits.map(unit =>
                unit.id === id ? { ...unit, [field]: value } : unit
            )
        );
    };

    const isVentaDirecta = useMemo(() => client?.flow === BusinessFlow.VentaDirecta, [client]);

    useEffect(() => {
        if (client) {
            const clientMarket = client.ecosystemId ? 'edomex' : 'aguascalientes';
            const clientCtype = client.flow === BusinessFlow.CreditoColectivo ? 'colectivo' : 'individual';
            setMarket(clientMarket);
            setClientType(clientCtype);
        } else {
            // Reset state when there's no client
            setMarket('');
            setClientType('');
            setPackage(null);
        }
    }, [client]);

    const fetchPackage = useCallback(async () => {
        if (!market || !clientType) {
            setPackage(null); return;
        }
        
        let packageKey: string;

        const isTandaScenario = initialMode === 'savings' && market === 'edomex' && clientType === 'colectivo';

        if (isTandaScenario) {
            packageKey = 'edomex-colectivo';
        } else if (client?.flow === BusinessFlow.VentaDirecta) {
            packageKey = `${market}-directa`;
        } else {
            packageKey = `${market}-plazo`;
        }

        setIsLoading(true);
        try {
            const data = await simulationService.getProductPackage(packageKey);
            setPackage(data);
            const initialOptions: Record<string, boolean> = {};
            data.components.forEach((c: Component) => { initialOptions[c.id] = !c.isOptional; });
            setSelectedOptions(initialOptions);
            setTerm(data.terms[0] || 0);
            setDownPaymentPercentage(data.minDownPaymentPercentage * 100);
            setTandaMembers(data.defaultMembers || 5);
            setAmortizationTable([]);
            setCollectionUnits([]);
            setVoluntaryContribution('0');
            setDownPaymentAmountDirect('');
        } catch (error) {
            toast.error(`Error al cargar el paquete para ${market}`); setPackage(null);
        } finally {
            setIsLoading(false);
        }
    }, [initialMode, market, clientType, client]);

    useEffect(() => {
        if(market && clientType) fetchPackage();
    }, [market, clientType, fetchPackage]);
    
    const { totalPrice, downPayment, amountToFinance, monthlyPayment, minDownPaymentRequired } = useMemo(() => {
        if (!pkg) return { totalPrice: 0, downPayment: 0, amountToFinance: 0, monthlyPayment: 0, minDownPaymentRequired: 0 };
        const years = term / 12;
        const total = pkg.components.reduce((sum, comp) => {
            if (selectedOptions[comp.id]) {
                return sum + (comp.isMultipliedByTerm ? comp.price * Math.ceil(years) : comp.price);
            }
            return sum;
        }, 0);
        
        const minDPRequired = total * pkg.minDownPaymentPercentage;

        if (isVentaDirecta) {
            const dp = parseFloat(downPaymentAmountDirect) || 0;
            const remainder = total - dp;
            return { totalPrice: total, downPayment: dp, amountToFinance: remainder, monthlyPayment: 0, minDownPaymentRequired: minDPRequired };
        }

        const currentDP = total * (downPaymentPercentage / 100);
        const financeAmount = total - currentDP;

        if (financeAmount <= 0 || !term || !pkg.rate) {
            return { totalPrice: total, downPayment: currentDP, amountToFinance: financeAmount, monthlyPayment: 0, minDownPaymentRequired: minDPRequired };
        }
        const monthlyRate = pkg.rate / 12;
        const payment = (financeAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term));
        return { totalPrice: total, downPayment: currentDP, amountToFinance: financeAmount, monthlyPayment: payment, minDownPaymentRequired: minDPRequired };
    }, [pkg, selectedOptions, term, downPaymentPercentage, isVentaDirecta, downPaymentAmountDirect]);

    const { monthlySavings, timeToGoal, projectedCollectionSavings, tandaTimeline } = useMemo(() => {
        const voluntary = parseFloat(voluntaryContribution) || 0;
        const collection = collectionUnits.reduce((sum, unit) => (sum + ((parseFloat(unit.consumption) || 0) * (parseFloat(unit.overprice) || 0))), 0);
        const totalMonthly = voluntary + collection;
        const goal = downPayment; // The down payment for the selected package
        const time = goal > 0 && totalMonthly > 0 ? goal / totalMonthly : 0;
        const projectedCollection = collection * deliveryTerm;
        
        // Tanda Timeline Simulation - Corrected based on "Snowball of Debt" model
        let timeline: TandaMilestone[] = [];
        if (pkg && clientType === 'colectivo' && initialMode === 'savings' && totalPrice > 0 && tandaMembers > 0) {
            const downPaymentGoal = pkg.minDownPaymentPercentage * totalPrice;
            const singleMemberMonthlySaving = totalMonthly; 

            const individualAmountToFinance = totalPrice - downPaymentGoal;
            let individualMonthlyPayment = 0;
            if (individualAmountToFinance > 0 && pkg.rate > 0 && pkg.terms.length > 0) {
                const individualTerm = pkg.terms[0];
                const monthlyRate = pkg.rate / 12;
                individualMonthlyPayment = (individualAmountToFinance * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -individualTerm));
            }

            const totalGroupMonthlyIncome = tandaMembers * singleMemberMonthlySaving;
            
            let accumulatedSavingsSurplus = 0;
            let membersPaying = 0;
            
            for (let i = 1; i <= tandaMembers; i++) {
                const currentMonthlyDebtPayment = membersPaying * individualMonthlyPayment;
                const netSavingsPerMonth = totalGroupMonthlyIncome - currentMonthlyDebtPayment;
                
                if (netSavingsPerMonth <= 0) break;

                const savingsNeeded = downPaymentGoal - accumulatedSavingsSurplus;
                const monthsToSave = savingsNeeded > 0 ? savingsNeeded / netSavingsPerMonth : 0;
                
                timeline.push({ type: 'ahorro', duration: monthsToSave, label: `Ahorro para Enganche ${i}` });
                timeline.push({ type: 'entrega', unitNumber: i, duration: 0.1, label: `Entrega Unidad ${i}` });

                const totalSavingsGeneratedThisCycle = accumulatedSavingsSurplus + (monthsToSave * netSavingsPerMonth);
                accumulatedSavingsSurplus = totalSavingsGeneratedThisCycle - downPaymentGoal;
                
                membersPaying++;
            }
        }

        return { monthlySavings: totalMonthly, timeToGoal: time, projectedCollectionSavings: projectedCollection, tandaTimeline: timeline };
    }, [voluntaryContribution, collectionUnits, downPayment, deliveryTerm, clientType, initialMode, pkg, totalPrice, tandaMembers]);

    const handleFormalizeClick = (e: React.MouseEvent) => {
        if (typeof onFormalize !== 'function') return;

        if (!client) {
            onFormalize(e);
            return;
        }

        if (!pkg || !market || !clientType) {
            toast.error("Completa la configuración antes de formalizar.");
            return;
        }

        const quoteFlow = initialMode === 'savings' 
            ? BusinessFlow.AhorroProgramado 
            : client.flow;
        
        const finalFlow = client.flow === BusinessFlow.CreditoColectivo ? BusinessFlow.CreditoColectivo : quoteFlow;


        const quote: Quote = {
            totalPrice,
            downPayment,
            amountToFinance,
            term,
            monthlyPayment,
            market,
            clientType,
            flow: finalFlow,
        };
        onFormalize(quote);
    };


    const calculateAmortization = () => {
        if (amountToFinance <= 0) { toast.error("El monto a financiar debe ser mayor a cero."); return; }
        const table = [];
        let balance = amountToFinance;
        const monthlyRate = pkg!.rate / 12;
        for (let i = 1; i <= term; i++) {
            const interest = balance * monthlyRate;
            const principal = monthlyPayment - interest;
            balance -= principal;
            table.push({ paymentNumber: i, monthlyPayment, principal, interest, balance: balance > 0 ? balance : 0 });
        }
        setAmortizationTable(table);
        toast.success("Tabla de amortización calculada.");
    };
    
    const renderContextSelectors = () => (
        <div>
            <h4 className="text-lg font-semibold text-white mb-3 text-primary-cyan-400">1. Contexto</h4>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="market" className="block text-sm font-medium text-gray-300">Mercado</label>
                    <select id="market" value={market} onChange={(e) => setMarket(e.target.value as Market)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-800 border-gray-600 focus:outline-none focus:ring-primary-cyan-500 focus:border-primary-cyan-500 sm:text-sm rounded-md">
                        <option value="">-- Elige --</option>
                        <option value="aguascalientes">Aguascalientes</option>
                        <option value="edomex">Estado de México</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="clientType" className="block text-sm font-medium text-gray-300">Tipo de Cliente</label>
                    <select id="clientType" value={clientType} onChange={(e) => setClientType(e.target.value as ClientType)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-800 border-gray-600 focus:outline-none focus:ring-primary-cyan-500 focus:border-primary-cyan-500 sm:text-sm rounded-md" disabled={!market}>
                        <option value="">-- Elige --</option>
                        <option value="individual">Individual</option>
                        {market === 'edomex' && <option value="colectivo">Crédito Colectivo</option>}
                    </select>
                </div>
            </div>
        </div>
    );
    
    const renderAcquisitionConfig = () => (
        <>
        <div className="pt-6 border-t border-gray-700/50">
            <h4 className="text-lg font-semibold text-white mb-3 text-primary-cyan-400">2. Paquete de Producto</h4>
            <div className="space-y-2">
                {pkg!.components.map(comp => (
                    <div key={comp.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-md">
                        <div className="flex items-center">
                            {comp.isOptional ? 
                                <input type="checkbox" id={comp.id} checked={selectedOptions[comp.id]} onChange={() => setSelectedOptions(p => ({...p, [comp.id]: !p[comp.id]}))} className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-primary-cyan-600"/> : 
                                <div className="w-4 h-4 flex items-center justify-center"><div className="w-2 h-2 bg-primary-cyan-500 rounded-full"></div></div>
                            }
                            <label htmlFor={comp.id} className="ml-3 text-sm text-white">{comp.name}</label>
                        </div>
                        <span className="text-sm font-mono text-gray-300">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(comp.price)}</span>
                    </div>
                ))}
            </div>
        </div>
        <div className="pt-6 border-t border-gray-700/50">
            {isVentaDirecta ? (
                <div>
                    <h4 className="text-lg font-semibold text-white mb-3 text-primary-cyan-400">3. Estructura de Pago</h4>
                    <div>
                        <label htmlFor="downPaymentAmount" className="block text-sm font-medium text-gray-300">Pago Inicial</label>
                        <input type="number" id="downPaymentAmount" value={downPaymentAmountDirect} onChange={e => setDownPaymentAmountDirect(e.target.value)} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white" placeholder="Ej: 400000"/>
                    </div>
                </div>
            ) : (
                <div>
                    <h4 className="text-lg font-semibold text-white mb-3 text-primary-cyan-400">3. Estructura Financiera</h4>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="downPayment" className="block text-sm font-medium text-gray-300">Enganche ({downPaymentPercentage}%)</label>
                            <input type="range" id="downPayment" min={pkg!.minDownPaymentPercentage * 100} max="90" value={downPaymentPercentage} onChange={e => setDownPaymentPercentage(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"/>
                            <div className="text-xs text-gray-400 mt-1">Mínimo: {pkg!.minDownPaymentPercentage * 100}% ({new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(minDownPaymentRequired)})</div>
                        </div>
                        <div>
                            <label htmlFor="term" className="block text-sm font-medium text-gray-300">Plazo (meses)</label>
                            <select id="term" value={term} onChange={(e) => setTerm(Number(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base bg-gray-800 border-gray-600 focus:outline-none focus:ring-primary-cyan-500 focus:border-primary-cyan-500 sm:text-sm rounded-md">
                                {pkg!.terms.map(t => <option key={t} value={t}>{t} meses</option>)}
                            </select>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );

    const renderAcquisitionMode = () => (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 bg-gray-900 p-6 rounded-xl border border-gray-800 self-start space-y-6">
                {!client && renderContextSelectors()}
                {isLoading && <div className="text-center p-4">Cargando paquete...</div>}
                {pkg && renderAcquisitionConfig()}
            </div>
            <div className="lg:col-span-3 bg-gray-900 p-6 rounded-xl border border-gray-800">
                {pkg ? (
                    <>
                        <h3 className="text-xl font-semibold text-white">Resultados y Amortización</h3>
                        <div className="my-4 space-y-2 p-4 bg-gray-800 rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Precio Total:</span>
                                <span className="font-semibold font-mono text-white">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalPrice)}</span>
                            </div>
                            {isVentaDirecta ? (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Pago Inicial:</span>
                                        <span className="font-semibold font-mono text-white">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(downPayment)}</span>
                                    </div>
                                    <hr className="border-gray-600 my-1"/>
                                    <div className="flex justify-between text-lg">
                                        <span className="text-white font-semibold">Remanente a Liquidar:</span>
                                        <span className="font-bold font-mono text-primary-cyan-400">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amountToFinance)}</span>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Enganche:</span>
                                        <span className="font-semibold font-mono text-white">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(downPayment)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Monto a Financiar:</span>
                                        <span className="font-semibold font-mono text-white">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amountToFinance)}</span>
                                    </div>
                                    <hr className="border-gray-600 my-1"/>
                                    <div className="flex justify-between text-lg">
                                        <span className="text-white font-semibold">Pago Mensual (Est.):</span>
                                        <span className="font-bold font-mono text-primary-cyan-400">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monthlyPayment)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                        {!isVentaDirecta && <button onClick={calculateAmortization} className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-cyan-600 rounded-lg hover:bg-primary-cyan-700">Calcular y Ver Amortización</button>}
                        {amortizationTable.length > 0 && !isVentaDirecta && <div className="mt-4"><AmortizationTable table={amortizationTable}/></div>}

                        {monthlyPayment > 0 && !isVentaDirecta && (
                            <div className="mt-6 pt-6 border-t border-dashed border-gray-700">
                            <div className="flex items-start gap-4">
                                <ShieldCheckIcon className="w-8 h-8 text-primary-cyan-400 flex-shrink-0 mt-1" />
                                <div>
                                <h4 className="text-md font-semibold text-white">Demostración de Protección Conductores</h4>
                                <p className="text-sm text-gray-400 mt-1">Muestra al cliente cómo puede proteger sus pagos en caso de imprevistos. Un diferenciador clave de nuestra oferta.</p>
                                <button 
                                    onClick={() => setIsProtectionDemoOpen(true)}
                                    className="mt-3 px-4 py-2 text-xs font-medium text-white bg-gray-600 rounded-lg hover:bg-gray-500"
                                >
                                    Ver cómo funciona
                                </button>
                                </div>
                            </div>
                            </div>
                        )}
                    </>
                ) : ( 
                    <div className="flex items-center justify-center h-full text-center text-gray-500"><p>Selecciona el contexto para continuar.</p></div> 
                )}
            </div>
        </div>
    );
    
    const renderSavingsMode = () => (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2 bg-gray-900 p-6 rounded-xl border border-gray-800 self-start space-y-6">
                {!client && renderContextSelectors()}
                {isLoading && <div className="text-center p-4">Cargando paquete...</div>}
                {pkg && (
                    <div className="pt-6 border-t border-gray-700/50">
                        <h4 className="text-lg font-semibold text-white mb-3 text-amber-400">2. Simulación de Ahorro</h4>
                        {market === 'aguascalientes' && clientType === 'individual' ? (
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="initialDown" className="block text-sm font-medium text-gray-300">Enganche Inicial (Aportación Fuerte)</label>
                                    <input type="number" id="initialDown" value={initialDownPayment} onChange={e => setInitialDownPayment(e.target.value)} className="mt-1 w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white" placeholder="Ej: 400000"/>
                                </div>
                                <div>
                                    <label htmlFor="deliveryTerm" className="block text-sm font-medium text-gray-300">Fecha de Entrega Estimada ({deliveryTerm} meses)</label>
                                    <input type="range" id="deliveryTerm" min="3" max="6" value={deliveryTerm} onChange={e => setDeliveryTerm(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1"/>
                                </div>
                            </div>
                        ) : market === 'edomex' && clientType === 'colectivo' ? (
                             <div>
                                <label htmlFor="tandaMembers" className="block text-sm font-medium text-gray-300">Número de Integrantes ({tandaMembers})</label>
                                <input type="range" id="tandaMembers" min="2" max="20" value={tandaMembers} onChange={e => setTandaMembers(Number(e.target.value))} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1"/>
                             </div>
                        ) : (
                             <div>
                               <label htmlFor="voluntary" className="block text-sm font-medium text-gray-300">Aportación Voluntaria Mensual ({new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(voluntaryContribution))})</label>
                               <input type="range" min="0" max="10000" step="500" value={voluntaryContribution} onChange={e => setVoluntaryContribution(e.target.value)} className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1"/>
                               <input type="number" id="voluntary" value={voluntaryContribution} onChange={e => setVoluntaryContribution(e.target.value)} className="mt-2 w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white" />
                            </div>
                        )}
                        <div className="pt-4 mt-4 border-t border-gray-700/50">
                            <h5 className="text-sm font-medium text-gray-300 mb-2">Configurador de Recaudación</h5>
                            {collectionUnits.map((unit, index) => (
                                <div key={unit.id} className="grid grid-cols-2 gap-2 mb-2 p-2 bg-gray-800 rounded-md">
                                    <input type="number" placeholder={`Consumo (L) - Unidad ${index+1}`} value={unit.consumption} onChange={e => handleCollectionUnitChange(unit.id, 'consumption', e.target.value)} className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded-md text-white text-sm" />
                                    <input type="number" placeholder={`Sobreprecio ($) - Unidad ${index+1}`} value={unit.overprice} onChange={e => handleCollectionUnitChange(unit.id, 'overprice', e.target.value)} className="w-full px-2 py-1 bg-gray-900 border border-gray-600 rounded-md text-white text-sm" />
                                </div>
                            ))}
                            <button onClick={() => setCollectionUnits(p => [...p, {id: Date.now(), consumption: '', overprice: ''}])} className="w-full text-xs text-primary-cyan-400 hover:text-primary-cyan-300 p-2 border-2 border-dashed border-gray-600 rounded-md mt-2">
                                [+] Agregar Unidad a Recaudar
                            </button>
                        </div>
                    </div>
                )}
            </div>
            <div className="lg:col-span-3 bg-gray-900 p-6 rounded-xl border border-gray-800 flex flex-col justify-between">
                 {pkg ? (
                    <div>
                        <h3 className="text-xl font-semibold text-white">Proyección de Ahorro</h3>
                        <div className="my-4 space-y-3 p-4 bg-gray-800 rounded-lg">
                           {market === 'aguascalientes' && clientType === 'individual' ? (
                               <RemainderBar total={totalPrice} saved={projectedCollectionSavings} down={parseFloat(initialDownPayment) || 0} />
                           ) : market === 'edomex' && clientType === 'individual' ? (
                               <>
                                <div className="flex justify-between text-lg"><span className="text-white font-semibold">Meta de Enganche:</span><span className="font-bold font-mono text-amber-300">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(downPayment)}</span></div>
                                <div className="flex justify-between text-sm"><span className="text-gray-400">Ahorro Mensual Proyectado:</span><span className="font-semibold font-mono text-white">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monthlySavings)}</span></div>
                                <hr className="border-gray-600 my-1"/>
                                <div className="text-center pt-2">
                                    <p className="text-gray-400 text-sm">Tiempo Estimado para Alcanzar el Enganche</p>
                                    <p className="text-3xl font-bold text-white font-mono mt-1">{timeToGoal > 0 ? `${timeToGoal.toFixed(1)} meses` : 'N/A'}</p>
                                </div>
                                <SavingsProjectionChart goal={downPayment} monthlySavings={monthlySavings} />
                               </>
                           ) : market === 'edomex' && clientType === 'colectivo' ? (
                                <>
                                <div className="flex justify-between items-center"><UserGroupIcon className="w-6 h-6 text-primary-cyan-300"/> <h4 className="text-lg font-bold text-white">Línea de Tiempo de Tanda ({tandaMembers} Miembros)</h4></div>
                                <p className="text-xs text-gray-400 text-center mb-4">Proyección del "efecto bola de nieve" para la entrega de unidades.</p>
                                <TandaTimeline milestones={tandaTimeline} />
                                </>
                           ) : null }
                        </div>
                    </div>
                 ) : ( <div className="flex items-center justify-center h-full text-center text-gray-500"><p>Selecciona el contexto para continuar.</p></div> )}
                 {pkg && (
                    <div className="mt-6 pt-6 border-t border-gray-700 flex justify-end gap-4">
                        <button className="px-6 py-3 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600">Generar Propuesta en PDF</button>
                        <button onClick={handleFormalizeClick} className="px-6 py-3 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700">Formalizar y Continuar Proceso</button>
                    </div>
                )}
            </div>
        </div>
    );

    if (viewMode === 'client' && pkg) {
        return (
            <div>
                <div className="max-w-3xl mx-auto text-center">
                     <div className="bg-gray-900 p-8 rounded-xl border border-gray-800">
                        <p className="text-xl text-gray-400">{isVentaDirecta ? 'Remanente a Liquidar' : 'Tu pago mensual sería de'}</p>
                        <p className="text-6xl font-bold text-primary-cyan-400 my-4 font-mono">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(isVentaDirecta ? amountToFinance : monthlyPayment)}
                        </p>
                        <button onClick={() => setIsDetailsVisible(!isDetailsVisible)} className="text-primary-cyan-400 hover:text-primary-cyan-300 text-lg">
                            {isDetailsVisible ? 'Ocultar Detalles' : 'Ajustar Detalles'}
                        </button>
                    </div>
                    {isDetailsVisible && (
                        <div className="mt-8 bg-gray-900 p-6 rounded-xl border border-gray-800 text-left space-y-6">
                            {renderAcquisitionConfig()}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <>
            <div>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white flex items-center">
                        <CalculatorIcon className="w-8 h-8 mr-3"/>
                        {client ? `Simulador para ${client.name}` : 'Simulador de Soluciones'}
                    </h2>
                </div>

                {initialMode === 'acquisition' ? renderAcquisitionMode() : renderSavingsMode()}
            </div>
             <Modal isOpen={isProtectionDemoOpen} onClose={() => setIsProtectionDemoOpen(false)} title="Demostración del Simulador de Protección">
                {pkg && term > 0 && (
                <ProtectionDemoSimulator 
                    baseQuote={{ amountToFinance, monthlyPayment, term }}
                    onClose={() => setIsProtectionDemoOpen(false)}
                />
                )}
            </Modal>
        </>
    );
};
