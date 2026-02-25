import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = '';

const parseResponse = async (response: Response) => {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { ok: false, message: text || 'Invalid response' };
  }
};

const AnimatedBackground = () => (
  <div className="fixed inset-0 z-0 bg-black overflow-hidden pointer-events-none">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_100%)]" />
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 150, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full"
    />
    <motion.div
      animate={{ rotate: -360 }}
      transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full"
    />
  </div>
);

const formatError = (message: string) => `Ошибка: ${message}`;

export function App() {
  const [step, setStep] = useState<'idle' | 'loading' | 'payment' | 'checking' | 'success'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [invoice, setInvoice] = useState<{ invoice_id: number; pay_url: string } | null>(null);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  const createInvoice = async () => {
    setError(null);
    setStep('loading');
    try {
      const response = await fetch(`${API_BASE}/api/invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || 'Не удалось создать счет');
      }
      setInvoice({ invoice_id: data.invoice_id, pay_url: data.pay_url });
      setStep('payment');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка сети';
      setError(formatError(message));
      setStep('idle');
    }
  };

  const checkPayment = async () => {
    if (!invoice?.invoice_id) {
      setError('Счет не найден. Создайте новый.');
      setStep('idle');
      return;
    }

    setError(null);
    setStep('checking');
    try {
      const response = await fetch(`${API_BASE}/api/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_id: invoice.invoice_id })
      });
      const data = await parseResponse(response);
      if (!response.ok || !data?.ok) {
        throw new Error(data?.message || 'Не удалось проверить оплату');
      }

      if (!data.paid) {
        setError('Счет еще не оплачен. Пожалуйста, завершите оплату в боте.');
        setStep('payment');
        return;
      }

      setInviteLink(data.invite_link);
      setStep('success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ошибка сети';
      setError(formatError(message));
      setStep('payment');
    }
  };

  const copyToClipboard = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4 font-sans selection:bg-white/20">
      <AnimatedBackground />

      <main className="relative z-10 w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === 'idle' && (
            <motion.div
              key="main-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl backdrop-blur-md shadow-2xl"
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-light tracking-widest mb-2 uppercase text-white">Komaru Promts</h1>
                <div className="h-[1px] w-12 bg-white/20 mx-auto my-4"></div>
                <p className="text-neutral-400 text-sm tracking-wide uppercase">Закрытый клуб</p>
              </div>

              <div className="space-y-6 mb-8">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-neutral-400">Тариф</span>
                  <span className="font-medium tracking-wide text-white">Вход навсегда</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-neutral-400">Доступ</span>
                  <span className="font-medium text-white">Приватный Telegram</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-neutral-400">Цена</span>
                  <span className="text-xl font-medium tracking-wide text-white">100 RUB</span>
                </div>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                onClick={createInvoice}
                className="w-full bg-white text-black py-4 rounded-xl font-medium tracking-widest uppercase hover:bg-neutral-200 transition-colors duration-300"
              >
                Оплатить доступ
              </button>
            </motion.div>
          )}

          {step === 'loading' && (
            <motion.div
              key="loading-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center min-h-[400px]"
            >
              <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
              <p className="text-neutral-400 tracking-widest uppercase text-sm">Создание счета...</p>
            </motion.div>
          )}

          {step === 'payment' && invoice && (
            <motion.div
              key="payment-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0a0a0a] border border-blue-500/20 p-8 rounded-2xl shadow-[0_0_40px_rgba(59,130,246,0.1)] relative overflow-hidden"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                  <span className="text-2xl text-blue-400">₽</span>
                </div>
                <h2 className="text-2xl font-light tracking-wider mb-2 text-white">Оплата счета</h2>
                <p className="text-neutral-400 text-sm">Telegram CryptoBot</p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="bg-black border border-white/10 p-4 rounded-xl text-center mb-6">
                <p className="text-neutral-500 text-xs uppercase tracking-wider mb-1">Сумма к оплате</p>
                <p className="text-2xl font-medium text-white">100 RUB</p>
                <p className="text-xs text-neutral-500 mt-2">ID: {invoice.invoice_id}</p>
              </div>

              <a
                href={invoice.pay_url}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center bg-[#2AABEE] text-white py-4 rounded-xl font-medium tracking-wide hover:bg-[#2298D6] transition-colors duration-300 mb-4"
              >
                Открыть счет в боте
              </a>

              <button
                onClick={checkPayment}
                className="w-full bg-white/5 text-white py-4 rounded-xl font-medium tracking-wide hover:bg-white/10 transition-colors duration-300 border border-white/10"
              >
                Я оплатил
              </button>
            </motion.div>
          )}

          {step === 'checking' && (
            <motion.div
              key="checking-card"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl flex flex-col items-center justify-center min-h-[400px]"
            >
              <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
              <p className="text-neutral-400 tracking-widest uppercase text-sm">Проверка оплаты...</p>
            </motion.div>
          )}

          {step === 'success' && inviteLink && (
            <motion.div
              key="success-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0a0a0a] border border-white/10 p-8 rounded-2xl text-center relative overflow-hidden"
            >
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-2xl font-light tracking-wider mb-2">Доступ открыт</h2>
              <p className="text-neutral-400 text-sm mb-8">Ваша персональная ссылка сгенерирована.</p>

              <div className="bg-black border border-white/10 p-4 rounded-xl mb-6">
                <p className="text-xs text-neutral-500 uppercase tracking-widest mb-2">Ваша ссылка</p>
                <p className="text-white font-mono text-sm break-all select-all">{inviteLink}</p>
              </div>

              <div className="flex items-center justify-center space-x-2 text-sm text-neutral-400 mb-8">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Внимание: Ссылка работает 1 час (1 активация)</span>
              </div>

              <button
                onClick={copyToClipboard}
                className="w-full bg-white text-black py-4 rounded-xl font-medium tracking-widest uppercase hover:bg-neutral-200 transition-colors duration-300"
              >
                {copied ? 'Скопировано!' : 'Копировать'}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
