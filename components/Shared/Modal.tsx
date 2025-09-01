import React from 'react';
import ReactDOM from 'react-dom';
import { XIcon } from './Icon';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 backdrop-blur-sm"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div 
        className="fixed inset-0" 
        aria-hidden="true" 
        onClick={onClose}
      ></div>
      
      <div className="relative w-full max-w-lg p-6 mx-4 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-gray-700">
          <h3 id="modal-title" className="text-lg font-semibold text-white">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 rounded-full p-1 hover:bg-gray-700 hover:text-white transition-colors"
            aria-label="Cerrar modal"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="mt-6">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};
