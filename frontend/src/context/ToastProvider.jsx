import { useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import ToastContext from './ToastContext';

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration !== Infinity) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = (msg, dur) => addToast(msg, 'success', dur);
  const error = (msg, dur) => addToast(msg, 'error', dur);
  const warn = (msg, dur) => addToast(msg, 'warn', dur);
  const info = (msg, dur) => addToast(msg, 'info', dur);

  return (
    <ToastContext.Provider value={{ toast: addToast, success, error, warn, info }}>
      {children}
      
      {/* Toast Portal/Overlay */}
      <div style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        pointerEvents: 'none'
      }}>
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              minWidth: 300,
              maxWidth: 450,
              background: 'var(--bg-card)',
              border: `1px solid ${
                t.type === 'success' ? 'var(--green)' : 
                t.type === 'error' ? 'var(--red)' : 
                t.type === 'warn' ? 'var(--orange)' : 'var(--blue)'
              }`,
              borderRadius: 12,
              padding: '12px 16px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              pointerEvents: 'auto',
              animation: 'toast-in 0.3s ease-out forwards',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div style={{ marginTop: 2, color: 
              t.type === 'success' ? 'var(--green)' : 
              t.type === 'error' ? 'var(--red)' : 
              t.type === 'warn' ? 'var(--orange)' : 'var(--blue)'
            }}>
              {t.type === 'success' && <CheckCircle size={18} />}
              {t.type === 'error' && <AlertCircle size={18} />}
              {t.type === 'warn' && <AlertTriangle size={18} />}
              {t.type === 'info' && <Info size={18} />}
            </div>
            
            <div style={{ flex: 1, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.4, marginRight: 20 }}>
              {t.message}
            </div>
            
            <button
              onClick={() => removeToast(t.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 4,
                position: 'absolute',
                top: 8,
                right: 8
              }}
            >
              <X size={14} />
            </button>
            
            {/* Progress bar */}
            {t.duration !== Infinity && (
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: 3,
                background: t.type === 'success' ? 'var(--green)' : t.type === 'error' ? 'var(--red)' : t.type === 'warn' ? 'var(--orange)' : 'var(--blue)',
                opacity: 0.3,
                animation: `toast-progress ${t.duration}ms linear forwards`
              }} />
            )}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes toast-in {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
