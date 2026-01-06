import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'default' | 'fullscreen';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'default' }) => {
  const isFullscreen = size === 'fullscreen';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ opacity: 0, scale: isFullscreen ? 1.05 : 0.95, y: isFullscreen ? 0 : 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: isFullscreen ? 1.05 : 0.95, y: isFullscreen ? 0 : 20 }}
            transition={{ duration: 0.2 }}
            className={`
              flex flex-col
              ${isFullscreen 
                ? 'w-full h-full bg-slate-900 text-white' 
                : 'relative w-full max-w-md bg-white rounded-3xl shadow-2xl max-h-[90vh] m-4'
              }
            `}
          >
            <div className={`
              flex-shrink-0 flex items-center justify-between p-5 
              ${isFullscreen ? 'absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent' : 'border-b border-slate-50'}
            `}>
              <h3 className={`text-lg font-bold ${isFullscreen ? 'text-white' : 'text-slate-800'}`}>{title}</h3>
              <button onClick={onClose} className={`p-2 rounded-full transition-colors ${isFullscreen ? 'bg-black/30 hover:bg-black/50' : 'hover:bg-slate-100'}`}>
                <X size={20} className={`${isFullscreen ? 'text-white' : 'text-slate-500'}`} />
              </button>
            </div>
            <div className={`overflow-y-auto ${isFullscreen ? 'flex-1' : 'p-6'}`}>
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};