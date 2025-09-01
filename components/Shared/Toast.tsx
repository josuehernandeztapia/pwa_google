

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ToastMessage as ToastType } from '../../types/index';
import { CheckCircleSolidIcon, InformationCircleIcon, ExclamationCircleIcon, XIcon } from './Icon';

// Simple event emitter
class EventEmitter {
  private listeners: { [event: string]: Function[] } = {};

  on(event: string, listener: Function) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  off(event: string, listener: Function) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(l => l !== listener);
    }
  }

  emit(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(listener => listener(...args));
    }
  }
}

const toastEmitter = new EventEmitter();

let toastId = 0;

export const toast = {
  success: (message: string) => {
    toastEmitter.emit('add', { id: toastId++, message, type: 'success' });
  },
  info: (message: string) => {
    toastEmitter.emit('add', { id: toastId++, message, type: 'info' });
  },
  error: (message: string) => {
    toastEmitter.emit('add', { id: toastId++, message, type: 'error' });
  },
};


const ToastMessage: React.FC<{ toast: ToastType; onRemove: (id: number) => void }> = ({ toast, onRemove }) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onRemove(toast.id), 300);
        }, 4000);

        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const handleRemove = () => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 300);
    };

    const typeClasses = {
        success: 'bg-emerald-500 border-emerald-600',
        info: 'bg-primary-cyan-600 border-primary-cyan-700',
        error: 'bg-red-600 border-red-700',
    };

    const icons = {
        success: <CheckCircleSolidIcon className="w-6 h-6 text-white" />,
        info: <InformationCircleIcon className="w-6 h-6 text-white" />,
        error: <ExclamationCircleIcon className="w-6 h-6 text-white" />,
    };

    const animationClass = isExiting
        ? 'animate-fadeOut'
        : 'animate-fadeInRight';

    return (
        <div 
             className={`w-full max-w-sm flex items-start p-4 rounded-lg shadow-lg text-white border-l-4 ${typeClasses[toast.type]} ${animationClass}`}
             role="alert"
             style={{
                animationFillMode: 'forwards',
                animationDuration: '300ms'
             }}
        >
            <div className="flex-shrink-0">{icons[toast.type]}</div>
            <div className="ml-3 flex-1 pt-0.5">
                <p className="text-sm font-medium">{toast.message}</p>
            </div>
            <div className="ml-4 flex-shrink-0 flex">
                <button
                    onClick={handleRemove}
                    className="-mx-1.5 -my-1.5 bg-white/10 rounded-lg inline-flex h-8 w-8 items-center justify-center text-white/70 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                >
                    <span className="sr-only">Dismiss</span>
                    <XIcon className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
};


export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  useEffect(() => {
    const addToast = (toast: ToastType) => {
      setToasts(currentToasts => [toast, ...currentToasts]);
    };

    toastEmitter.on('add', addToast);
    return () => toastEmitter.off('add', addToast);
  }, []);

  const removeToast = (id: number) => {
    setToasts(currentToasts => currentToasts.filter(t => t.id !== id));
  };
  
  return ReactDOM.createPortal(
    <div className="fixed top-5 right-5 z-[100] space-y-3">
        <style>{`
            @keyframes fadeInRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }
            @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; transform: scale(0.9); } }
            .animate-fadeInRight { animation-name: fadeInRight; }
            .animate-fadeOut { animation-name: fadeOut; }
        `}</style>
      {toasts.map(toast => (
        <ToastMessage key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>,
    document.body
  );
};
