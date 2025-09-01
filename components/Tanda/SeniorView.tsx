import React, { useMemo, useCallback } from 'react';
import { TandaSimDraft, TandaSimulationResult } from '../../types/index';
import { SparklesIcon, WhatsAppIcon, SpeakerWaveIcon } from '../Shared/Icon';
import { toast } from '../Shared/Toast';

// jsPDF is loaded from a script tag in index.html
declare global {
    interface Window {
        jspdf: any;
    }
}

interface SeniorViewProps {
    result: TandaSimulationResult;
    deltaResult: TandaSimulationResult | null;
    draft: TandaSimDraft;
    isLoadingDelta: boolean;
    onSimulateDelta: (delta: number) => void;
}

const SeniorSummary: React.FC<{ result: TandaSimulationResult, deltaResult: TandaSimulationResult | null, isLoadingDelta: boolean, onSimulateDelta: () => void }> = ({ result, deltaResult, isLoadingDelta, onSimulateDelta }) => {
    const ahorroHoy = result.months.length > 0 ? result.months[result.months.length - 1].savings : 0;
    const siguienteMes = result.firstAwardT || 'N/A';
    const extraSugerido = 500;
    
    let avanceMeses = 0;
    if (result.firstAwardT && deltaResult?.firstAwardT) {
        avanceMeses = result.firstAwardT - deltaResult.firstAwardT;
    }

    return (
        <div className="text-2xl leading-relaxed text-gray-200 space-y-2">
            <div>Hoy tienen <b className="text-white font-bold">{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(ahorroHoy)}</b> ahorrado.</div>
            <div>Siguiente <b>entrega</b>: mes <b className="text-white font-bold">{siguienteMes}</b>.</div>
            <div className="flex items-center gap-4">
                {!deltaResult && (
                    <button onClick={onSimulateDelta} disabled={isLoadingDelta} className="text-lg bg-blue-600/50 text-blue-200 px-3 py-1 rounded-lg hover:bg-blue-600/70">
                         {isLoadingDelta ? 'Calculando...' : `¿Qué pasa si ponen $${extraSugerido} más?`}
                    </button>
                )}
                {deltaResult && (
                    <div className="text-emerald-300">Si ponen <b>${extraSugerido}</b> más, <b className="text-white">adelantan {avanceMeses.toFixed(1)} mes(es)</b>.</div>
                )}
            </div>
        </div>
    );
};

const SimpleTimeline: React.FC<{ awards: any[], horizon: number }> = ({ awards, horizon }) => {
    return (
        <div className="mt-8">
            <div className="h-3 bg-gray-700 rounded-full relative">
                {awards.map((award, i) => (
                    <div key={i} title={`Entrega #${i + 1} · Mes ${award.month}`} className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2" style={{ left: `${(award.month / horizon) * 100}%` }}>
                        <span className="text-4xl text-emerald-400">✔</span>
                        <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs font-bold text-white bg-gray-900 px-1 rounded">{award.month}</span>
                    </div>
                ))}
            </div>
            <div className="flex justify-between text-gray-500 text-xs mt-2 px-1">
                <span>Mes 1</span>
                <span>Mes {Math.floor(horizon / 2)}</span>
                <span>Mes {horizon}</span>
            </div>
        </div>
    );
};

const WhatsList: React.FC<{ items: any[] }> = ({ items }) => (
    <ul className="list-none p-0 mt-6 space-y-2">
        {items.map((it, idx) => (
            <li key={idx} className="flex items-start gap-4 p-3 bg-gray-800/50 rounded-lg">
                <div className="text-3xl mt-1">{it.tipo === 'entrega' ? '✅' : '💰'}</div>
                <div>
                    <div className="text-lg font-semibold text-white">
                        {it.tipo === 'entrega' ? `Entrega Unidad #${it.n}` : `Ahorro para Enganche #${it.n}`}
                    </div>
                    <div className="text-sm text-gray-400">
                        {it.tipo === 'entrega'
                            ? `Mes ${it.mes} · ${it.persona} recibe su unidad`
                            : `Acumulan ${it.acum} · Faltan ${it.faltan}`}
                    </div>
                </div>
            </li>
        ))}
    </ul>
);

export const SeniorView: React.FC<SeniorViewProps> = ({ result, deltaResult, draft, isLoadingDelta, onSimulateDelta }) => {
    
    const whatsListItems = useMemo(() => {
        const items = [];
        const awards = Object.values(result.awardsByMember).filter(Boolean).sort((a,b) => a!.month - b!.month);
        let lastAwardMonth = 0;
        let savingsTowardsNext = 0;

        for(let i = 0; i < awards.length; i++) {
            const award = awards[i]!;
            const downPayment = draft.group.product.price * draft.group.product.dpPct;

            // Calculate savings phase before this award
            const savingsMonths = result.months.slice(lastAwardMonth, award.month);
            savingsTowardsNext = savingsMonths.reduce((sum, m) => sum + (m.inflow - m.debtDue), 0);

            items.push({
                tipo: 'ahorro',
                n: i + 1,
                acum: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(savingsTowardsNext),
                faltan: new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Math.max(0, downPayment - savingsTowardsNext))
            });

            // Add the award
            items.push({
                tipo: 'entrega',
                n: i + 1,
                mes: award.month,
                persona: award.name
            });

            lastAwardMonth = award.month;
        }
        return items;

    }, [result, draft]);

    const handleListen = useCallback(() => {
        const ahorroHoy = result.months.length > 0 ? result.months[result.months.length - 1].savings : 0;
        const siguienteMes = result.firstAwardT || 'No disponible';
        
        const textToSpeak = `
            Resumen del grupo.
            Hoy tienen ${ahorroHoy.toLocaleString('es-ES')} pesos ahorrados.
            La siguiente entrega está programada para el mes ${siguienteMes}.
        `;

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(textToSpeak);
            utterance.lang = 'es-MX';
            window.speechSynthesis.speak(utterance);
        } else {
            toast.error("Tu navegador no soporta la lectura en voz alta.");
        }
    }, [result]);

    const handleSharePdf = useCallback(() => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const ahorroHoy = result.months.length > 0 ? result.months[result.months.length - 1].savings : 0;
        const siguienteMes = result.firstAwardT || 'N/A';

        doc.setFontSize(18);
        doc.text(`Resumen de Tanda: ${draft.group.name}`, 105, 20, { align: 'center' });
        
        doc.setFontSize(14);
        doc.text(`- Hoy tienen ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(ahorroHoy)} ahorrado.`, 20, 40);
        doc.text(`- Siguiente entrega: mes ${siguienteMes}.`, 20, 50);

        doc.setFontSize(16);
        doc.text("Línea de Tiempo de Entregas", 20, 70);
        
        const head = [['#', 'Tipo', 'Detalle']];
        const body = whatsListItems.map(it => {
             const detail = it.tipo === 'entrega'
                ? `Mes ${it.mes} - Recibe: ${it.persona}`
                : `Acumulado: ${it.acum}`;
             return [it.n, it.tipo === 'entrega' ? '✅ Entrega' : '💰 Ahorro', detail];
        });

        (doc as any).autoTable({
            startY: 80,
            head: head,
            body: body,
            theme: 'grid',
            headStyles: { fillColor: [8, 145, 178] },
        });

        doc.save(`Resumen_Tanda_${draft.group.name}.pdf`);
        toast.success("PDF generado y descargado.");

    }, [result, draft, whatsListItems]);

    return (
        <div className="space-y-6">
            <SeniorSummary result={result} deltaResult={deltaResult} isLoadingDelta={isLoadingDelta} onSimulateDelta={() => onSimulateDelta(500)} />
            <SimpleTimeline awards={Object.values(result.awardsByMember).filter(Boolean)} horizon={draft.config.horizonMonths} />
            
            <div className="flex items-center gap-4 pt-4 border-t border-gray-700/50">
                <button onClick={handleListen} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gray-600 rounded-lg hover:bg-gray-500">
                    <SpeakerWaveIcon className="w-5 h-5"/> Escuchar Resumen
                </button>
                 <button onClick={handleSharePdf} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500">
                    <WhatsAppIcon className="w-5 h-5"/> Compartir por WhatsApp
                </button>
            </div>

            <WhatsList items={whatsListItems} />
        </div>
    );
};