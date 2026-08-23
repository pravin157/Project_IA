import React, { useState } from 'react';
import { X, Settings, Key, Server, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { customerService } from '@/services/customerService';

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
      const data = await customerService.getPortfolioAnalytics(14, true, true, keyInput.trim() || undefined);
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
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-lg rounded-2xl border p-6 bg-white border-[#E5E7EB] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#1D6FD8]/10">
              <Settings className="w-5 h-5 text-[#1D6FD8]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#000000]">Connection settings</h3>
              <p className="text-xs text-[#000000]/60">Usually leave this alone — defaults work for CS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-all hover:scale-110 bg-[#F8FAFC] text-[#000000]/70 border border-[#E5E7EB]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="py-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#000000]/60 mb-2 uppercase tracking-wider">
              Override API key <span className="text-[#000000]/40 font-normal normal-case">(optional)</span>
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#000000]/40" />
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="Leave blank to use the server default"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-xs font-mono text-[#000000] placeholder-slate-400 bg-white border border-[#E5E7EB] focus:outline-none transition-all"
                onFocus={(e) => { e.currentTarget.style.borderColor = '#1D6FD8'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#E5E7EB'; }}
              />
            </div>
            <p className="text-[11px] text-[#000000]/60 mt-1.5">
              Only needed if your admin gave you a different key. Most CS teammates can ignore this.
            </p>
          </div>

          {testStatus !== 'idle' && (
            <div className="p-3 rounded-xl border text-xs flex items-start gap-2"
              style={testStatus === 'testing'
                ? { background: 'rgba(29,111,216,0.05)', borderColor: 'rgba(29,111,216,0.2)', color: '#1D6FD8' }
                : testStatus === 'success'
                ? { background: 'rgba(5,150,105,0.05)', borderColor: 'rgba(5,150,105,0.2)', color: '#059669' }
                : { background: 'rgba(225,29,72,0.05)', borderColor: 'rgba(225,29,72,0.2)', color: '#e11d48' }}>
              {testStatus === 'testing' ? (
                <RefreshCw className="w-4 h-4 animate-spin shrink-0 mt-0.5 text-[#1D6FD8]" />
              ) : testStatus === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[#e11d48] shrink-0 mt-0.5" />
              )}
              <span>{testMessage}</span>
            </div>
          )}

          <div className="p-3.5 rounded-xl border space-y-2 bg-slate-50 border-[#E5E7EB]">
            <div className="flex items-center gap-2 text-xs font-bold text-[#000000]">
              <Server className="w-4 h-4 text-[#1D6FD8]" />
              <span>Services this hub uses</span>
            </div>
            <ul className="pl-6 list-disc space-y-1 text-[11px] text-[#000000]/60">
              <li>Autopilot — account health, adoption, alerts</li>
              <li>Paymaster — which orgs are on All-in-One</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#E5E7EB] flex items-center justify-between">
          <button
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all disabled:opacity-50 bg-white text-[#000000] border border-[#E5E7EB]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testStatus === 'testing' ? 'animate-spin text-[#1D6FD8]' : ''}`} />
            Test connection
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold text-white transition-all active:scale-95 bg-[#1D6FD8] hover:bg-[#1565C0] border border-[#1D6FD8]"
          >
            Save & close
          </button>
        </div>
      </div>
    </div>
  );
};
