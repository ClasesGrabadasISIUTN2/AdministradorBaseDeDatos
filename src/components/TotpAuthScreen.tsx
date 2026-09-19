import React, { useState, useRef, useEffect } from 'react';
import { ShieldCheck, Lock, AlertCircle, Loader2, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

interface TotpAuthScreenProps {
  onAuthenticated: () => void;
}

export const TotpAuthScreen: React.FC<TotpAuthScreenProps> = ({ onAuthenticated }) => {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [recordarSesion, setRecordarSesion] = useState(true);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Foco inicial en el primer dígito
    inputRefs.current[0]?.focus();
  }, []);

  const fullCode = code.join('');

  const handleVerify = async (codeToVerify?: string) => {
    const codeStr = (codeToVerify || fullCode).trim();
    if (codeStr.length < 6) {
      setErrorMessage('Por favor, ingresa los 6 dígitos del código TOTP.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await api.verificarTotp(codeStr);
      if (res.ok) {
        setSuccess(true);
        if (recordarSesion) {
          localStorage.setItem('utn_totp_authenticated', 'true');
          localStorage.setItem('utn_totp_auth_time', Date.now().toString());
        } else {
          sessionStorage.setItem('utn_totp_authenticated', 'true');
        }

        setTimeout(() => {
          onAuthenticated();
        }, 600);
      } else {
        setErrorMessage(res.error || 'Código TOTP incorrecto o expirado.');
        setLoading(false);
        // Seleccionar inputs para reescribir
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error de conexión con el servidor de autenticación.');
      setLoading(false);
    }
  };

  const handleInputChange = (index: number, value: string) => {
    setErrorMessage(null);

    // Si pegan múltiples caracteres
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newCode = ['', '', '', '', '', ''];
      digits.forEach((d, i) => {
        if (i < 6) newCode[i] = d;
      });
      setCode(newCode);

      if (digits.length === 6) {
        inputRefs.current[5]?.focus();
        handleVerify(digits.join(''));
      } else {
        inputRefs.current[Math.min(digits.length, 5)]?.focus();
      }
      return;
    }

    // Solo números
    const cleanDigit = value.replace(/\D/g, '');
    const newCode = [...code];
    newCode[index] = cleanDigit;
    setCode(newCode);

    if (cleanDigit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verificar al completar el 6to dígito
    if (cleanDigit && index === 5) {
      const completed = newCode.join('');
      if (completed.length === 6) {
        handleVerify(completed);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerify();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length === 0) return;

    const newCode = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      if (i < 6) newCode[i] = d;
    });
    setCode(newCode);

    if (digits.length === 6) {
      inputRefs.current[5]?.focus();
      handleVerify(digits.join(''));
    } else {
      inputRefs.current[Math.min(digits.length, 5)]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background glowing accents */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 relative z-10">
        {/* Header UTN Brand */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 mb-3 shadow-inner">
            {success ? (
              <CheckCircle2 className="w-7 h-7 text-emerald-400 animate-pulse" />
            ) : (
              <Lock className="w-7 h-7 text-blue-400" />
            )}
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-blue-950/80 text-blue-400 border border-blue-800/60 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            Panel Administrativo UTN FRSF
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            Verificación de Seguridad TOTP
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-xs">
            Ingresa el código temporal de 6 dígitos para acceder al sistema.
          </p>
        </div>

        {/* 6 Digit Inputs */}
        <div className="my-6">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider text-center mb-3">
            Código de 6 dígitos (Google Auth / 2FA)
          </label>
          <div className="flex justify-center items-center gap-2 sm:gap-2.5">
            {code.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                disabled={loading || success}
                onChange={(e) => handleInputChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                autoComplete="one-time-code"
                className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono font-bold rounded-xl border bg-slate-800/80 transition-all outline-none ${
                  success
                    ? 'border-emerald-500 text-emerald-400 bg-emerald-950/30'
                    : digit
                    ? 'border-blue-500 text-blue-300 ring-2 ring-blue-500/20'
                    : 'border-slate-700 text-slate-100 hover:border-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="mb-5 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block">Error de autenticación</span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold">¡Código validado exitosamente! Ingresando...</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={() => handleVerify()}
          disabled={loading || success || fullCode.length < 6}
          className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
            success
              ? 'bg-emerald-600 text-white'
              : fullCode.length === 6 && !loading
              ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20 cursor-pointer active:scale-[0.99]'
              : 'bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-blue-300" />
              <span>Validando con servidor externo...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Acceso Autorizado</span>
            </>
          ) : (
            <>
              <KeyRound className="w-4 h-4" />
              <span>Verificar y Acceder</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </>
          )}
        </button>

        {/* Checkbox recordar */}
        <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
          <label className="flex items-center gap-2 cursor-pointer select-none hover:text-slate-300">
            <input
              type="checkbox"
              checked={recordarSesion}
              onChange={(e) => setRecordarSesion(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
            />
            <span>Recordar en este navegador</span>
          </label>
          <button
            type="button"
            onClick={() => {
              setCode(['', '', '', '', '', '']);
              setErrorMessage(null);
              inputRefs.current[0]?.focus();
            }}
            className="text-slate-500 hover:text-slate-300 transition"
          >
            Limpiar
          </button>
        </div>

        {/* External Validation Server Info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-center gap-1.5 text-center">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Validación remota:</span>
          <span className="font-mono text-slate-300 text-[10px] truncate max-w-[220px]">
            servidormultiusuariobackup2.onrender.com
          </span>
        </div>
      </div>
    </div>
  );
};
