import React, { useState } from 'react';
import { Document, DocumentStatus } from '../types';
import { CheckCircleIcon, ClockIcon, XCircleIcon, UploadIcon } from './icons';

interface GuaranteePanelProps {
    documents: Document[];
    onUpload: (docId: string) => void;
}

const GuaranteeDocumentItem: React.FC<{ doc: Document; onUpload: (docId: string) => void }> = ({ doc, onUpload }) => {
    const statusMap = {
        [DocumentStatus.Aprobado]: { icon: <CheckCircleIcon className="w-5 h-5 text-emerald-400" />, text: 'text-emerald-400' },
        [DocumentStatus.EnRevision]: { icon: <ClockIcon className="w-5 h-5 text-amber-400" />, text: 'text-amber-400 animate-pulse' },
        [DocumentStatus.Pendiente]: { icon: <XCircleIcon className="w-5 h-5 text-gray-500" />, text: 'text-gray-500' },
        [DocumentStatus.Rechazado]: { icon: <XCircleIcon className="w-5 h-5 text-red-500" />, text: 'text-red-500' },
    };

    return (
        <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
                <span className={statusMap[doc.status].text}>{statusMap[doc.status].icon}</span>
                <span className={`ml-3 text-sm font-medium ${doc.status === DocumentStatus.Aprobado ? 'text-gray-300' : statusMap[doc.status].text}`}>{doc.name}</span>
            </div>
            {doc.status === DocumentStatus.Pendiente && (
                <button onClick={() => onUpload(doc.id)} className="flex items-center px-3 py-1 text-xs font-medium text-white bg-gray-600 rounded-md hover:bg-gray-500">
                    <UploadIcon className="w-4 h-4 mr-1"/>
                    Subir Evidencia
                </button>
            )}
        </div>
    );
};

export const GuaranteePanel: React.FC<GuaranteePanelProps> = ({ documents, onUpload }) => {
    const [validations, setValidations] = useState({
        cartaAval: false,
        dacionPago: false,
    });

    const handleValidationChange = (key: keyof typeof validations) => {
        setValidations(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const cartaAvalDoc = documents.find(d => d.name === 'Carta Aval de Ruta');
    const dacionPagoDoc = documents.find(d => d.name === 'Convenio de Dación en Pago');

    return (
        <div className="bg-gray-900 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-white mb-3">Formalización de Garantías (Colateral Social)</h4>
            
            <div className="space-y-4">
                <div>
                    <h5 className="text-md font-semibold text-gray-300 mb-2">Checklist de Acompañamiento</h5>
                    <div className="space-y-3 p-3 bg-gray-800 rounded-lg">
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={validations.cartaAval} 
                                onChange={() => handleValidationChange('cartaAval')} 
                                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-primary-cyan-600 focus:ring-primary-cyan-500"
                            />
                            <span className="ml-3 text-sm text-gray-300">Se validó la Carta Aval con el representante de la ruta.</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={validations.dacionPago} 
                                onChange={() => handleValidationChange('dacionPago')} 
                                className="h-4 w-4 rounded border-gray-500 bg-gray-700 text-primary-cyan-600 focus:ring-primary-cyan-500"
                            />
                            <span className="ml-3 text-sm text-gray-300">Se explicó al cliente el alcance del Convenio de Dación en Pago.</span>
                        </label>
                    </div>
                </div>

                <div>
                     <h5 className="text-md font-semibold text-gray-300 mb-2">Evidencia Documental</h5>
                     <div className="divide-y divide-gray-700 p-3 bg-gray-800 rounded-lg">
                        {cartaAvalDoc && <GuaranteeDocumentItem doc={cartaAvalDoc} onUpload={onUpload} />}
                        {dacionPagoDoc && <GuaranteeDocumentItem doc={dacionPagoDoc} onUpload={onUpload} />}
                     </div>
                </div>
            </div>
        </div>
    );
};