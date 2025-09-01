import React, { useState } from 'react';

interface PlanConfigFormProps {
    onBack?: () => void;
    onSubmit: (config: any) => void;
    isSavings: boolean;
}

export const PlanConfigForm: React.FC<PlanConfigFormProps> = ({ onBack, onSubmit, isSavings }) => {
    const [methods, setMethods] = useState({ collection: false, voluntary: true });
    const [goal, setGoal] = useState('');
    const [plates, setPlates] = useState('');
    const [overprice, setOverprice] = useState('');
    
    const title = isSavings ? 'Meta de Ahorro (MXN)' : 'Meta de Pago Mensual (MXN)';
    const placeholder = isSavings ? '50,000.00' : '15,000.00';
    const buttonText = isSavings ? 'Crear Plan de Ahorro' : 'Configurar Plan de Pagos';

    const handleSubmit = () => {
        const config = {
            goal: parseFloat(goal) || (isSavings ? 50000 : 15000),
            methods,
            plates: methods.collection ? plates : undefined,
            overprice: methods.collection ? parseFloat(overprice) : undefined,
        };
        onSubmit(config);
    };

    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-300">{title}</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                        <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input type="number" name="goal" id="goal" value={goal} onChange={e => setGoal(e.target.value)} className="w-full pl-7 pr-12 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:ring-primary-cyan-500 focus:border-primary-cyan-500" placeholder={placeholder}/>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-300">Métodos de {isSavings ? 'Ahorro' : 'Pago'}</label>
                <div className="mt-2 space-y-2">
                    <label className="flex items-center p-3 bg-gray-700 rounded-lg">
                        <input type="checkbox" checked={methods.voluntary} onChange={() => setMethods(m => ({...m, voluntary: !m.voluntary}))} className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-primary-cyan-600 focus:ring-primary-cyan-500" />
                        <span className="ml-3 text-sm text-white">Permitir Aportaciones Voluntarias</span>
                    </label>
                     <label className="flex items-center p-3 bg-gray-700 rounded-lg">
                        <input type="checkbox" checked={methods.collection} onChange={() => setMethods(m => ({...m, collection: !m.collection}))} className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-primary-cyan-600 focus:ring-primary-cyan-500" />
                        <span className="ml-3 text-sm text-white">Activar {isSavings ? 'Ahorro' : 'Pago'} por Recaudación</span>
                    </label>
                </div>
            </div>
            
            {methods.collection && (
                <div className="p-4 border border-gray-600 rounded-lg space-y-3 bg-gray-900/50">
                     <div>
                        <label htmlFor="plates" className="block text-sm font-medium text-gray-300">Placas de las Unidades (separadas por coma)</label>
                        <input type="text" name="plates" id="plates" value={plates} onChange={e => setPlates(e.target.value)} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:ring-primary-cyan-500 focus:border-primary-cyan-500" placeholder="XYZ-123, ABC-456"/>
                    </div>
                     <div>
                        <label htmlFor="overprice" className="block text-sm font-medium text-gray-300">Sobreprecio por Litro (MXN)</label>
                        <input type="number" name="overprice" id="overprice" value={overprice} onChange={e => setOverprice(e.target.value)} className="mt-1 w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:ring-primary-cyan-500 focus:border-primary-cyan-500" placeholder="5.00"/>
                    </div>
                </div>
            )}

            <div className="flex gap-4 pt-4">
                {onBack && <button type="button" onClick={onBack} className="w-full px-4 py-2 text-sm font-medium text-gray-300 bg-gray-600 rounded-lg hover:bg-gray-500">Volver</button>}
                <button type="button" onClick={handleSubmit} className="w-full flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-primary-cyan-600 rounded-lg hover:bg-primary-cyan-700 transition-colors">{buttonText}</button>
            </div>
        </div>
    )
};
