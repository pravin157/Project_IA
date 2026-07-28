import React, { useState } from 'react';
import { X, Settings, Key, Server, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { fetchPortfolioAnalytics } from '../services/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customApiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  customApiKey,
  onSaveApiKey,
}) => {
  const [keyInput, setKeyInput] = useState(customApiKey);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState('');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Checking connection to IntoAEC Autopilot…');
    try {
      const data = await fetchPortfolioAnalytics(14, true, true, keyInput.trim() || undefined);
      if (data?.summary) {
        setTestStatus('success');
        setTestMessage(`Connected! Found health data for ${data.summary.totalAccounts} account(s).`);
      } else {
        setTestStatus('failed');
        setTestMessage('Connected, but no portfolio data came back yet.');
      }
    } catch (err) {
      setTestStatus('failed');
      setTestMessage(`Connection failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
      style={{ background: 'rgba(8,13,21,0.85)', backdropFilter: 'blur(12px)' }}>
      <div className="w-full max-w-lg rounded-2xl border p-6"
        style={{
          background: 'linear-gradient(135deg, #111827 0%, #0f172a 100%)',
          borderColor: 'rgba(51,65,85,0.6)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        }}>
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl" style={{ background: 'rgba(14,165,233,0.1)' }}>
              <Settings className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Connection settings</h3>
              <p className="text-xs text-slate-500">Usually leave this alone — defaults work for CS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all hover:scale-110"
            style={{ background: 'rgba(30,41,59,0.8)', color: '#64748b', border: '1px solid rgba(51,65,85,0.6)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              Override API key <span className="text-slate-600 font-normal normal-case">(optional)</span>
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Leave blank to use the server default"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                style={{
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(51,65,85,0.6)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(14,165,233,0.4)'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(51,65,85,0.6)'; }}
              />
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5">
              Only needed if your admin gave you a different key. Most CS teammates can ignore this.
            </p>
          </div>

          {testStatus !== 'idle' && (
            <div className="p-3 rounded-xl border text-xs flex items-start gap-2"
              style={testStatus === 'testing'
                ? { background: 'rgba(14,165,233,0.08)', borderColor: 'rgba(14,165,233,0.25)', color: '#7dd3fc' }
                : testStatus === 'success'
                ? { background: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.25)', color: '#6ee7b7' }
                : { background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.25)', color: '#fca5a5' }}>
              {testStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5 text-sky-400" />
              ) : testStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <span>{testMessage}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl border space-y-2"
            style={{ background: 'rgba(15,23,42,0.6)', borderColor: 'rgba(51,65,85,0.4)' }}>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <Server className="w-4 h-4 text-sky-400" />
              <span>Services this hub uses</span>
            </div>
            <ul className="pl-6 list-disc space-y-1 text-[11px] text-slate-500">
              <li>Autopilot — account health, adoption, alerts</li>
              <li>Paymaster — which orgs are on All-in-One</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
            style={{ background: 'rgba(30,41,59,0.8)', color: '#94a3b8', border: '1px solid rgba(51,65,85,0.6)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin text-sky-400' : ''}`} />
            Test connection
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95"
            style={{ background: 'linear-gradient(135deg, #0ea5e9, #0d9488)', boxShadow: '0 0 12px rgba(14,165,233,0.25)' }}
          >
            Save & close
          </button>
        </div>
      </div>
    </div>
  );
};
