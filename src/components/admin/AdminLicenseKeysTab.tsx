import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  Ban,
  Search,
  Sparkles,
  ShieldCheck,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import {
  LicenseKeyRecord,
  getLicenseKeys,
  generateLicenseKey,
  revokeLicenseKey,
  deleteLicenseKey,
  subscribeToLicenseKeys,
} from '../../utils/licenseKeyManager';

export const AdminLicenseKeysTab: React.FC = () => {
  const [keys, setKeys] = useState<LicenseKeyRecord[]>(getLicenseKeys());
  const [selectedPlan, setSelectedPlan] = useState<
    'lifetime_pro' | 'pass_2weeks' | 'pass_4weeks' | 'single_property'
  >('lifetime_pro');
  const [customCode, setCustomCode] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'redeemed' | 'revoked'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMsg, setActionMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    // Realtime subscription from Firestore / local storage
    const unsub = subscribeToLicenseKeys((updatedKeys) => {
      setKeys(updatedKeys);
    });
    return () => unsub();
  }, []);

  const handleGenerateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionMsg(null);

    const res = await generateLicenseKey(selectedPlan, customCode, 'Admin Dashboard');
    if (res.success && res.key) {
      setKeys(getLicenseKeys());
      setCustomCode('');
      setActionMsg({ text: `✓ Generated License Key: ${res.key.code}` });
    } else {
      setActionMsg({ text: `❌ ${res.message}`, isError: true });
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRevokeKey = async (id: string, code: string) => {
    if (window.confirm(`Are you sure you want to revoke key "${code}"? Users will no longer be able to redeem it.`)) {
      await revokeLicenseKey(id);
      setKeys(getLicenseKeys());
      setActionMsg({ text: `Revoked key: ${code}` });
    }
  };

  const handleDeleteKey = async (id: string, code: string) => {
    if (window.confirm(`Permanently delete key record "${code}"?`)) {
      await deleteLicenseKey(id);
      setKeys(getLicenseKeys());
      setActionMsg({ text: `Deleted key record: ${code}` });
    }
  };

  // Filter keys
  const filteredKeys = keys.filter((k) => {
    const matchesStatus = filterStatus === 'all' || k.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      k.code.toLowerCase().includes(q) ||
      k.planName.toLowerCase().includes(q) ||
      (k.redeemedByEmail || '').toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const activeCount = keys.filter((k) => k.status === 'active').length;
  const redeemedCount = keys.filter((k) => k.status === 'redeemed' || k.isRedeemed).length;
  const revokedCount = keys.filter((k) => k.status === 'revoked').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#78350F] via-[#B45309] to-[#D97706] text-white p-6 rounded-3xl shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#FEF3C7] text-xs font-bold uppercase tracking-wider mb-1">
            <Key className="w-4 h-4 text-[#F59E0B]" /> License & Access Key Engine
          </div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold">Pro License Keys & Redeem Codes</h2>
          <p className="text-xs text-[#E8DCC4] max-w-xl leading-relaxed mt-1">
            Generate and manage single-use access keys for users. Users must enter a valid generated code in their account panel to redeem Pro access.
          </p>
        </div>

        <button
          onClick={() => setKeys(getLicenseKeys())}
          className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-xs font-bold rounded-xl flex items-center gap-2 border border-white/20 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Sync Keys
        </button>
      </div>

      {/* Action Notification Message */}
      {actionMsg && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in duration-200 ${
            actionMsg.isError
              ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]'
              : 'bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]'
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-xs underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] shadow-2xs space-y-1">
          <div className="text-[10px] text-[#8B735B] uppercase font-bold tracking-wider">Total Keys</div>
          <div className="text-2xl font-serif font-bold text-[#3D342D]">{keys.length}</div>
          <div className="text-[11px] text-[#8B735B]">Generated across system</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#D1FAE5] shadow-2xs space-y-1">
          <div className="text-[10px] text-[#059669] uppercase font-bold tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Active Unredeemed
          </div>
          <div className="text-2xl font-serif font-bold text-[#065F46]">{activeCount}</div>
          <div className="text-[11px] text-[#059669]">Ready to be redeemed</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#DBEAFE] shadow-2xs space-y-1">
          <div className="text-[10px] text-[#2563EB] uppercase font-bold tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#2563EB]" /> Redeemed Keys
          </div>
          <div className="text-2xl font-serif font-bold text-[#1E40AF]">{redeemedCount}</div>
          <div className="text-[11px] text-[#2563EB]">Activated by app users</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#FEE2E2] shadow-2xs space-y-1">
          <div className="text-[10px] text-[#DC2626] uppercase font-bold tracking-wider flex items-center gap-1">
            <XCircle className="w-3 h-3 text-[#DC2626]" /> Revoked Keys
          </div>
          <div className="text-2xl font-serif font-bold text-[#991B1B]">{revokedCount}</div>
          <div className="text-[11px] text-[#DC2626]">Disabled by admin</div>
        </div>
      </div>

      {/* Key Generator Form Card */}
      <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-[#E8DCC4] pb-3">
          <Plus className="w-5 h-5 text-[#D97706]" />
          <h3 className="text-base font-serif font-bold text-[#78350F]">Generate New Pro License Key</h3>
        </div>

        <form onSubmit={handleGenerateKey} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-[#78350F] mb-1.5">Target Membership Plan</label>
            <select
              value={selectedPlan}
              onChange={(e) =>
                setSelectedPlan(
                  e.target.value as 'lifetime_pro' | 'pass_2weeks' | 'pass_4weeks' | 'single_property'
                )
              }
              className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-xs font-medium text-[#3D342D] outline-none focus:ring-2 focus:ring-[#D97706]"
            >
              <option value="lifetime_pro">🌟 Lifetime Pro Unlimited Pass</option>
              <option value="pass_2weeks">🏠 14-Day House Hunter Pass</option>
              <option value="pass_4weeks">📆 28-Day Extended Hunter Pass</option>
              <option value="single_property">📄 Single Audit Report Pass</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#78350F] mb-1.5">
              Custom Key Code <span className="font-normal text-[#8B735B]">(Optional - Auto Generated if blank)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. VASTU-GIFT-2026"
              value={customCode}
              onChange={(e) => setCustomCode(e.target.value)}
              className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-xs font-mono font-bold text-[#78350F] outline-none focus:ring-2 focus:ring-[#D97706] uppercase"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Key className="w-4 h-4 text-[#F59E0B]" /> Generate License Key
            </button>
          </div>
        </form>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-[#8B735B]" />
          <input
            type="text"
            placeholder="Search code, plan, or user..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#D97706]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {(['all', 'active', 'redeemed', 'revoked'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all whitespace-nowrap cursor-pointer ${
                filterStatus === status
                  ? 'bg-[#78350F] text-white shadow-2xs'
                  : 'bg-[#FAF7F2] text-[#8B735B] hover:bg-[#F3EFE0]'
              }`}
            >
              {status} {status === 'active' ? `(${activeCount})` : status === 'redeemed' ? `(${redeemedCount})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* License Keys Table */}
      <div className="bg-white rounded-3xl border border-[#E8DCC4] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FAF7F2] border-b border-[#E8DCC4] text-[10px] font-bold text-[#8B735B] uppercase tracking-wider">
                <th className="p-4">License Key Code</th>
                <th className="p-4">Membership Plan</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created Date</th>
                <th className="p-4">Redeemed By</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC4]/60 text-xs">
              {filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#8B735B] font-serif">
                    No license keys found matching search/filter.
                  </td>
                </tr>
              ) : (
                filteredKeys.map((k) => {
                  const isCopied = copiedId === k.id;
                  return (
                    <tr key={k.id} className="hover:bg-[#FFFBEB]/40 transition-all">
                      {/* Code */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#78350F] bg-[#FEF3C7] px-2.5 py-1 rounded-lg border border-[#FDE68A]">
                            {k.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(k.code, k.id)}
                            className="p-1.5 rounded-lg hover:bg-[#FAF7F2] text-[#8B735B] hover:text-[#78350F] transition-all cursor-pointer"
                            title="Copy License Code"
                          >
                            {isCopied ? (
                              <Check className="w-4 h-4 text-[#059669]" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="p-4">
                        <div className="font-bold text-[#3D342D]">{k.planName}</div>
                        <div className="text-[10px] text-[#8B735B] font-mono">{k.planId}</div>
                      </td>

                      {/* Status */}
                      <td className="p-4">
                        {k.status === 'active' && !k.isRedeemed && (
                          <span className="px-2.5 py-1 bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0] rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#059669]" /> Active
                          </span>
                        )}
                        {(k.status === 'redeemed' || k.isRedeemed) && (
                          <span className="px-2.5 py-1 bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE] rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#2563EB]" /> Redeemed
                          </span>
                        )}
                        {k.status === 'revoked' && (
                          <span className="px-2.5 py-1 bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5] rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3 text-[#DC2626]" /> Revoked
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="p-4 text-[11px] text-[#8B735B]">
                        <div>{new Date(k.createdAt).toLocaleDateString()}</div>
                        <div className="text-[10px] text-[#B45309]">By {k.createdBy || 'Admin'}</div>
                      </td>

                      {/* Redeemed By */}
                      <td className="p-4">
                        {k.redeemedByEmail ? (
                          <div className="space-y-0.5">
                            <div className="font-bold text-[#1E40AF] flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-[#2563EB]" /> {k.redeemedByEmail}
                            </div>
                            <div className="text-[10px] text-[#8B735B]">
                              {k.redeemedAt ? new Date(k.redeemedAt).toLocaleString() : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#A89F91] italic">— Not Redeemed Yet —</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {k.status === 'active' && !k.isRedeemed && (
                            <button
                              onClick={() => handleRevokeKey(k.id, k.code)}
                              className="p-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#DC2626] transition-all cursor-pointer"
                              title="Revoke Key"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteKey(k.id, k.code)}
                            className="p-1.5 rounded-lg hover:bg-[#FEF2F2] text-[#8B735B] hover:text-[#DC2626] transition-all cursor-pointer"
                            title="Delete Key Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
