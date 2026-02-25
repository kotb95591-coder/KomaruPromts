import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCode from 'react-qr-code';

// --- API LOGIC ---
const CRYPTO_BOT_TOKEN = '538879:AAmpnB3NCWsxgaFTU0uFEy6LNJwOfeR665G';
const TG_BOT_TOKEN = '8293377070:AAGBJBMXjQxadiw8qIKRdA1W0DEg-ZlXtoo';
const CHANNEL_ID = '-1003877323833'; 

const CORS_PROXY = 'https://corsproxy.io/?';

async function createInvoice() {
  const url = `${CORS_PROXY}https://pay.crypt.bot/api/createInvoice`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Crypto-Pay-API-Token': CRYPTO_BOT_TOKEN,
    },
    body: JSON.stringify({
      currency_type: 'fiat',
      fiat: 'RUB',
      amount: '100.00',
      description: 'Доступ навсегда в приватный канал KomaruPromts'
    })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP Error: ${response.status}`);
  }
  
  const data = await response.json();
  if (!data.ok) throw new Error(data.error?.name || 'API Error');
  return data.result; 
}

async function checkInvoice(invoiceId: number) {
  const url = `${CORS_PROXY}https://pay.crypt.bot/api/getInvoices?invoice_ids=${invoiceId}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Crypto-Pay-API-Token': CRYPTO_BOT_TOKEN,
    }
  });
  
  if (!response.ok) return false;
  
  const data = await response.json();
  if (!data.ok) return false;
  
  const invoice = data.result.items[0];
  return invoice?.status === 'paid';
}

async function createTgLink() {
  const expireDate = Math.floor(Date.now() / 1000) + 3600; // 1 hour expiration
  const url = `https://api.telegram.org/bot${TG_BOT_TOKEN}/createChatInviteLink`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,
      expire_date: expireDate,
      member_limit: 1,
      name: 'Komaru VIP'
    })
  });
  
  const data = await response.json();
  if (!data.ok) {
    console.error("TG API Error:", data);
    throw new Error(`TG API Error: ${data.description}`);
  }
  
  return data.result.invite_link;
}

// --- COMPONENTS ---
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 bg-black" style={{ contain: 'strict' }}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#000000_100%)] z-10 will-change-transform" />

      <svg
        className="absolute w-full h-full opacity-[0.15]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="xMidYMid slice"
        style={{ willChange: "transform" }}
      >
        <defs>
          <linearGradient id="luxury-silver" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="luxury-gray" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#888888" stopOpacity="0" />
            <stop offset="50%" stopColor="#888888" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#888888" stopOpacity="0" />
          </linearGradient>
        </defs>

        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          style={{ transformOrigin: "50% 50%", willChange: "transform" }}
        >
          <circle cx="500" cy="500" r="300" fill="none" stroke="url(#luxury-silver)" strokeWidth="1" strokeDasharray="4 8" />
          <circle cx="500" cy="500" r="450" fill="none" stroke="url(#luxury-gray)" strokeWidth="1.5" />
          <circle cx="500" cy="500" r="600" fill="none" stroke="url(#luxury-silver)" strokeWidth="1" strokeDasharray="10 20" />
        </motion.g>

        <motion.path
          d="M -200 800 Q 500 200 1200 800"
          fill="none"
          stroke="url(#luxury-silver)"
          strokeWidth="2"
          animate={{ opacity: [0.1, 0.4, 0.1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          style={{ willChange: "opacity" }}
        />

        <motion.path
          d="M -200 200 Q 500 800 1200 200"
          fill="none"
          stroke="url(#luxury-gray)"
          strokeWidth="1.5"
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          style={{ willChange: "opacity" }}
        />
        
        <motion.line 
          x1="0" y1="200" x2="1000" y2="800"
          stroke="url(#luxury-silver)" strokeWidth="1"
          animate={{ opacity: [0.05, 0.2, 0.05] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          style={{ willChange: "opacity" }}
        />
        <motion.line 
          x1="1000" y1="200" x2="0" y2="800"
          stroke="url(#luxury-gray)" strokeWidth="1.5"
          animate={{ opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          style={{ willChange: "opacity" }}
        />
      </svg>
    </div>
  );
}

export function App() {
  const [step, setStep] = useState<'idle' | 'creating' | 'modal' | 'checking' | 'success'>('idle');
  const [inviteLink, setInviteLink] = useState('');
  const [invoice, setInvoice] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleBuy = async () => {
    setStep('creating');
    setErrorMsg('');
    try {
      const inv = await createInvoice();
      setInvoice(inv);
      setStep('modal');
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Ошибка создания счета. Попробуйте позже.');
      setStep('idle');
    }
  };

  const handleCheckPay = async () => {
    if (!invoice) return;
    setStep('checking');
    setErrorMsg('');
    try {
      const isPaid = await checkInvoice(invoice.invoice_id);
      if (isPaid) {
        const link = await createTgLink();
        setInviteLink(link);
        setStep('success');
      } else {
        setErrorMsg('Счет еще не оплачен');
        setTimeout(() => setErrorMsg(''), 3000);
        setStep('modal');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg('Ошибка проверки. Попробуйте снова.');
      setTimeout(() => setErrorMsg(''), 3000);
      setStep('modal');
    }
  };

  const openCryptoBot = () => {
    if (invoice && invoice.pay_url) {
      window.open(invoice.pay_url, '_blank');
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    const btn = document.getElementById('copy-btn');
    if (btn) {
      const originalText = btn.innerHTML;
      btn.innerHTML = 'Скопировано!';
      setTimeout(() => { btn.innerHTML = originalText; }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white font-sans overflow-hidden flex items-center justify-center relative select-none">
      <AnimatedBackground />

      <div className="relative z-10 w-full max-w-md px-4 py-8">
        
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-black tracking-[0.2em] text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
            KOMARU
            <span className="block text-xl tracking-[0.4em] text-white/40 mt-1 font-light drop-shadow-none">PROMTS</span>
          </h1>
        </motion.div>

        <AnimatePresence mode="wait">
          
          {(step === 'idle' || step === 'creating') && (
            <motion.div
              key="card"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-[#080808]/90 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden"
            >
              <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

              <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                  <h2 className="text-white/40 text-sm tracking-widest uppercase mb-1 font-medium">Тариф</h2>
                  <p className="text-2xl font-semibold tracking-wide text-white">Вход навсегда</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-light tracking-tighter text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">100<span className="text-lg text-white/50 ml-1">RUB</span></p>
                </div>
              </div>

              <div className="space-y-4 mb-8 text-white/70 font-light text-sm relative z-10">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                  <span>Доступ в приватный Telegram канал</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
                  <span>Оплачиваете один раз, пользуетесь всегда</span>
                </div>
              </div>

              {errorMsg && (
                <div className="mb-4 text-center text-sm text-white/60 bg-white/5 py-2 rounded-lg border border-white/10">
                  {errorMsg}
                </div>
              )}

              <button
                onClick={handleBuy}
                disabled={step === 'creating'}
                className="w-full relative z-10 bg-white text-black py-4 rounded-xl font-bold tracking-widest uppercase text-sm hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] disabled:opacity-50 mb-4"
              >
                {step === 'creating' ? 'Создание счета...' : 'Оплатить доступ'}
              </button>

            </motion.div>
          )}

          {(step === 'modal' || step === 'checking') && (
            <motion.div
              key="modal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0A0A0A] border border-[#2AABEE]/20 p-8 rounded-3xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[#2AABEE]/10 blur-3xl pointer-events-none" />

              <div className="text-center relative z-10 mb-6">
                <div className="w-14 h-14 bg-[#2AABEE]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#2AABEE]/30 shadow-[0_0_15px_rgba(42,171,238,0.15)]">
                  <svg className="w-8 h-8 text-[#2AABEE]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.94z"/></svg>
                </div>
                <h2 className="text-xl font-semibold text-white">Оплата через CryptoBot</h2>
                <p className="text-white/50 text-sm mt-1">Отправьте точную сумму или откройте приложение</p>
              </div>

              {step === 'modal' ? (
                <>
                  <div className="bg-white p-3 rounded-2xl mx-auto w-fit mb-6 shadow-[0_0_20px_rgba(255,255,255,0.1)] cursor-pointer" onClick={openCryptoBot} title="Нажмите, чтобы открыть в Telegram">
                    <QRCode value={invoice?.pay_url || ''} size={160} level="L" />
                  </div>

                  <div className="bg-[#111] border border-white/5 rounded-xl p-4 mb-6 text-sm">
                    <div className="flex justify-between mb-2">
                      <span className="text-white/40 font-light">Платформа</span>
                      <span className="text-white font-medium">Telegram CryptoBot</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/40 font-light">Счет #</span>
                      <span className="text-white font-medium">{invoice?.invoice_id}</span>
                    </div>
                    <div className="flex justify-between mt-2 pt-2 border-t border-white/5">
                      <span className="text-white/40 font-light">К оплате</span>
                      <span className="text-white font-bold">{invoice?.amount || '100'} {invoice?.asset || 'RUB'}</span>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="mb-4 text-center text-sm font-medium text-white/80 bg-white/10 py-2 rounded-lg border border-white/20">
                      {errorMsg}
                    </div>
                  )}

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={openCryptoBot}
                      className="w-full py-3.5 rounded-xl font-medium tracking-wide border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors text-sm uppercase"
                    >
                      Оплатить в приложении
                    </button>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setStep('idle')}
                        className="flex-1 py-4 rounded-xl font-medium tracking-wide border border-white/10 text-white/70 hover:bg-white/5 transition-colors text-sm uppercase"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={handleCheckPay}
                        className="flex-1 py-4 rounded-xl font-medium tracking-wide bg-[#2AABEE] text-white hover:bg-[#2AABEE]/90 transition-colors shadow-[0_0_15px_rgba(42,171,238,0.3)] text-sm uppercase"
                      >
                        Я оплатил
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-12 text-center relative z-10">
                  <div className="w-16 h-16 border-[3px] border-[#2AABEE]/20 border-t-[#2AABEE] rounded-full animate-spin mx-auto mb-6 shadow-[0_0_15px_rgba(42,171,238,0.2)]" />
                  <h3 className="text-lg font-medium text-white mb-2">Проверка оплаты...</h3>
                  <p className="text-white/40 text-sm font-light">Пожалуйста, подождите.</p>
                </div>
              )}
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#080808]/90 backdrop-blur-md border border-white/10 p-8 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.8)] text-center relative overflow-hidden"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-white/5 rounded-full blur-3xl pointer-events-none" />

              <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10 border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg>
              </div>
              
              <h2 className="text-2xl font-semibold mb-2 text-white relative z-10 tracking-wide">Оплата успешна</h2>
              <p className="text-white/50 text-sm mb-8 font-light relative z-10">
                Ваша персональная ссылка сгенерирована. Добро пожаловать.
              </p>

              <div className="relative z-10 group">
                <div className="absolute -inset-0.5 bg-white/10 rounded-xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
                <div className="bg-[#111] border border-white/10 rounded-xl p-4 mb-6 relative flex items-center justify-between">
                  <span className="text-white font-mono text-sm truncate mr-4 tracking-wider">{inviteLink}</span>
                  <button 
                    id="copy-btn"
                    onClick={copyToClipboard}
                    className="px-4 py-2 bg-white text-black text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                  >
                    Копировать
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 text-white/40 text-xs font-medium relative z-10">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <span>Внимание: Ссылка работает 1 час (1 активация)</span>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
