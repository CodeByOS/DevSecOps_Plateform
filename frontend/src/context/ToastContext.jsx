import { createContext } from 'react';

const ToastContext = createContext({
  toast: () => {},
  success: () => {},
  error: () => {},
  warn: () => {},
});

export default ToastContext;
