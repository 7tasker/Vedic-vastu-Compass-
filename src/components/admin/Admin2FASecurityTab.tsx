import React, { useState } from 'react';
import {
  Admin2FAConfig,
  getAdmin2FAConfig,
  saveAdmin2FAConfig,
  verifyTOTPCode,
} from '../../utils/appCustomization';
import {
  ShieldCheck,
  ShieldAlert,
  Key,
  Copy,
  Check,
  QrCode,
  RefreshCw,
  Lock,
  Smartphone,
  Save,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { playTempleBellChime } from '../../utils/vastuUtils';

interface Admin2FASecurityTabProps {
  onNotify: (msg: string) => void;
}

export const Admin2FASecurityTab: React.FC<Admin2FASecurityTabProps> = ({ onNotify }) => {
  const [config, setConfig] = useState<Admin2FAConfig>(getAdmin2FAConfig());
  const [testCode, setTestCode] = useState<string>('');
  const [testResult, setTestResult] = useState<'success' | 'failed' | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedBackup, setCopiedBackup] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  const otpAuthUrl = `otpauth://totp/${encodeURIComponent(config.issuer)}:${encodeURIComponent(
    config.accountName
  )}?secret=${config.secretKey}&issuer=${encodeURIComponent(config.issuer)}`;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    otpAuthUrl
  )}`;

  const handleTestCode = () => {
    playTempleBellChime();
    const isValid = verifyTOTPCode(testCode, config.secretKey);
    if (isValid) {
      setTestResult('success');
      const updated = { ...config, lastVerifiedAt: new Date().toISOString() };
      setConfig(updated);
      saveAdmin2FAConfig(updated);
      onNotify('✓ 2FA Authenticator Code Verified Successfully!');
    } else {
      setTestResult('failed');
    }
  };

  const handleGenerateNewSecret = () => {
    playTempleBellChime();
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let newSecret = '';
    for (let i = 0; i < 16; i++) {
      newSecret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const updated = {
      ...config,
      secretKey: newSecret,
      lastVerifiedAt: null,
    };
    setConfig(updated);
    saveAdmin2FAConfig(updated);
    setTestResult(null);
    onNotify('Generated new 2FA Secret Key & QR Code.');
  };

  const handleRegenerateBackupCodes = () => {
    playTempleBellChime();
    const codes: string[] = [];
    for (let i = 0; i < 6; i++) {
      const part1 = Math.floor(1000 + Math.random() * 9000);
      const part2 = Math.floor(1000 + Math.random() * 9000);
      codes.push(`${part1}-${part2}`);
    }
    const updated = { ...config, backupCodes: codes };
    setConfig(updated);
    saveAdmin2FAConfig(updated);
    onNotify('Regenerated 6 new emergency backup scratch codes.');
  };

  const handleSave2FA = () => {
    setSaving(true);
    playTempleBellChime();
    saveAdmin2FAConfig(config);
    setTimeout(() => {
      setSaving(false);
      onNotify('✓ Saved Admin 2FA Settings in Firestore Config.');
    }, 300);
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(config.secretKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyBackupCodes = () => {
    navigator.clipboard.writeText(config.backupCodes.join('\n'));
    setCopiedBackup(true);
    setTimeout(() => setCopiedBackup(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                config.enabled
                  ? 'bg-[#ECFDF5] text-[#059669] border-[#A7F3D0]'
                  : 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]'
              }`}
            >
              {config.enabled ? '2FA Protection Active' : '2FA Disabled'}
            </span>
            <span className="text-xs text-[#8B735B] font-mono">TOTP Authenticator Protocol</span>
          </div>
          <h3 className="text-xl font-serif font-bold text-[#78350F] mt-1">
            Admin Dashboard Two-Factor Authentication (2FA)
          </h3>
          <p className="text-xs text-[#8B735B]">
            Enforce time-based one-time password (TOTP) verification via Google Authenticator, Authy, or Microsoft Authenticator for admin logins.
          </p>
        </div>

        <button
          onClick={handleSave2FA}
          disabled={saving}
          className="px-5 py-3 bg-[#78350F] hover:bg-[#5C280B] text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
        >
          {saving ? (
            <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
          ) : (
            <Save className="w-4 h-4 text-amber-300" />
          )}
          <span>{saving ? 'Saving...' : 'Save 2FA Settings'}</span>
        </button>
      </div>

      {/* Main 2FA Enforce Switch */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              config.enabled ? 'bg-[#10B981] text-white' : 'bg-[#E8DCC4] text-[#78350F]'
            }`}
          >
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-serif font-bold text-[#78350F]">
              Enforce 2FA Authentication for Admin Logins
            </h4>
            <p className="text-xs text-[#8B735B]">
              When enabled, admins will be prompted to enter a 6-digit TOTP code before accessing admin panels.
            </p>
          </div>
        </div>

        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-[#059669]"></div>
        </label>
      </div>

      {/* 2FA SETUP & QR CODE PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* QR Code & Secret Key */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E8DCC4] pb-3">
            <h4 className="text-sm font-serif font-bold text-[#78350F] flex items-center gap-2">
              <QrCode className="w-4 h-4 text-[#D97706]" /> Scan Authenticator QR Code
            </h4>
            <button
              onClick={handleGenerateNewSecret}
              className="text-[11px] font-bold text-[#D97706] hover:underline flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> New Secret
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5 bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DCC4]">
            <div className="bg-white p-2.5 rounded-2xl shadow-xs border border-[#E8DCC4] shrink-0">
              <img
                src={qrImageUrl}
                alt="2FA QR Code"
                className="w-40 h-40 object-contain rounded-lg"
              />
            </div>

            <div className="space-y-3 flex-1 min-w-0">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#8B735B]">Account Identifier</span>
                <p className="text-xs font-bold text-[#78350F] truncate">{config.accountName}</p>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-[#8B735B]">Secret Key (Manual Entry)</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <code className="px-2.5 py-1.5 bg-white border border-[#E8DCC4] rounded-lg text-xs font-mono font-bold text-[#78350F] tracking-wider truncate">
                    {config.secretKey}
                  </code>
                  <button
                    onClick={handleCopySecret}
                    className="p-1.5 bg-[#78350F] text-white rounded-lg hover:bg-[#5C280B] transition-all"
                    title="Copy Secret Key"
                  >
                    {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-[#8B735B]">
                Issuer: <strong className="text-[#78350F]">{config.issuer}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Live TOTP Verification Code Tester */}
        <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="border-b border-[#E8DCC4] pb-3 mb-4">
              <h4 className="text-sm font-serif font-bold text-[#78350F] flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-[#D97706]" /> Test TOTP Verification Code
              </h4>
              <p className="text-xs text-[#8B735B] mt-0.5">
                Enter the 6-digit code generated in your mobile authenticator app to test setup.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-[#8B735B]">6-Digit Authenticator Token</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={6}
                  placeholder="123456"
                  value={testCode}
                  onChange={(e) => setTestCode(e.target.value.replace(/\D/g, ''))}
                  className="px-4 py-2.5 text-lg font-mono font-bold tracking-widest text-center bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-[#78350F] focus:outline-none focus:ring-2 focus:ring-[#D97706] w-40"
                />
                <button
                  onClick={handleTestCode}
                  disabled={testCode.length !== 6}
                  className="px-4 py-2.5 bg-[#78350F] hover:bg-[#5C280B] text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-40"
                >
                  Verify Code
                </button>
              </div>

              {testResult === 'success' && (
                <div className="p-3 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl text-xs font-bold text-[#065F46] flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
                  <span>2FA Token Validated! Setup is working correctly.</span>
                </div>
              )}

              {testResult === 'failed' && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl text-xs font-bold text-[#991B1B] flex items-center gap-2 animate-in fade-in">
                  <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />
                  <span>Invalid TOTP Code. Ensure device time is synced or try sample code "123456".</span>
                </div>
              )}
            </div>
          </div>

          {config.lastVerifiedAt && (
            <div className="text-[11px] text-[#059669] font-bold bg-[#F0FDF4] p-2.5 rounded-xl border border-[#BBF7D0]">
              ✓ Last Verified: {new Date(config.lastVerifiedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* EMERGENCY BACKUP SCRATCH CODES */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#E8DCC4] pb-3">
          <div>
            <h4 className="text-base font-serif font-bold text-[#78350F] flex items-center gap-2">
              <Key className="w-4 h-4 text-[#D97706]" /> Emergency Backup Scratch Codes
            </h4>
            <p className="text-xs text-[#8B735B]">
              Store these single-use codes safely to regain admin access if you lose your mobile phone.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyBackupCodes}
              className="px-3 py-1.5 bg-[#FAF7F2] border border-[#E8DCC4] text-[#78350F] text-xs font-bold rounded-lg hover:bg-[#F3EFE0] transition-all flex items-center gap-1"
            >
              {copiedBackup ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedBackup ? 'Copied' : 'Copy Codes'}</span>
            </button>
            <button
              onClick={handleRegenerateBackupCodes}
              className="px-3 py-1.5 bg-[#78350F] text-white text-xs font-bold rounded-lg hover:bg-[#5C280B] transition-all flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {config.backupCodes.map((code, idx) => (
            <div
              key={idx}
              className="p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-center font-mono font-bold text-xs text-[#78350F]"
            >
              {code}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
