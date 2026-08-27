import React, { useState, useEffect } from 'react';
import {
  TaxReceiptTemplateConfig,
  DEFAULT_TAX_RECEIPT_CONFIG,
  getTaxReceiptConfig,
  saveTaxReceiptConfig,
  calculateTaxBreakdown,
} from '../../utils/taxReceiptConfig';
import {
  Receipt,
  Save,
  RotateCcw,
  Printer,
  Sparkles,
  Building,
  FileText,
  ShieldCheck,
  Percent,
  Mail,
  Phone,
  Globe,
  CheckCircle2,
  Eye,
  Edit3,
  Sliders,
  QrCode,
  Stamp,
  Award,
} from 'lucide-react';
import { playTempleBellChime } from '../../utils/vastuUtils';

interface AdminTaxReceiptTemplateTabProps {
  onNotify: (msg: string) => void;
}

export const AdminTaxReceiptTemplateTab: React.FC<AdminTaxReceiptTemplateTabProps> = ({ onNotify }) => {
  const [config, setConfig] = useState<TaxReceiptTemplateConfig>(getTaxReceiptConfig());
  const [saving, setSaving] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'editor' | 'preview' | 'both'>('both');

  // Sample Test Preview State
  const [samplePlan, setSamplePlan] = useState<{ name: string; amount: number; currency: string }>({
    name: 'Lifetime Pro Vedic Audit License',
    amount: 1499,
    currency: 'INR',
  });
  const [sampleUser, setSampleUser] = useState({
    name: 'Satish Pasala',
    email: 'admin@vastucompass.app',
    paymentId: 'pay_RAZORPAY_89127391',
    orderId: 'order_ORD_991823719',
    date: new Date().toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
  });

  const taxCalculations = calculateTaxBreakdown(samplePlan.amount, config);

  const handleFieldChange = (field: keyof TaxReceiptTemplateConfig, value: any) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    playTempleBellChime();
    await saveTaxReceiptConfig(config);
    setTimeout(() => {
      setSaving(false);
      onNotify('✓ Saved Tax Invoice & Receipt Template to Firestore System Config!');
    }, 400);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all Tax Receipt Template fields to standard Vedic defaults?')) {
      setConfig(DEFAULT_TAX_RECEIPT_CONFIG);
      saveTaxReceiptConfig(DEFAULT_TAX_RECEIPT_CONFIG);
      onNotify('ℹ️ Reset Tax Receipt Template to default settings.');
    }
  };

  // Color theme mapper
  const getThemeClasses = () => {
    switch (config.themeColor) {
      case 'emerald':
        return {
          primaryBg: 'bg-[#065F46]',
          border: 'border-[#065F46]',
          text: 'text-[#065F46]',
          badge: 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]',
          accent: 'text-[#10B981]',
          bgLight: 'bg-[#F0FDF4]',
        };
      case 'ruby':
        return {
          primaryBg: 'bg-[#991B1B]',
          border: 'border-[#991B1B]',
          text: 'text-[#991B1B]',
          badge: 'bg-[#FEF2F2] text-[#991B1B] border-[#FECACA]',
          accent: 'text-[#EF4444]',
          bgLight: 'bg-[#FEF2F2]',
        };
      case 'sapphire':
        return {
          primaryBg: 'bg-[#1E40AF]',
          border: 'border-[#1E40AF]',
          text: 'text-[#1E40AF]',
          badge: 'bg-[#EFF6FF] text-[#1E40AF] border-[#BFDBFE]',
          accent: 'text-[#3B82F6]',
          bgLight: 'bg-[#F0F9FF]',
        };
      case 'slate':
        return {
          primaryBg: 'bg-[#334155]',
          border: 'border-[#334155]',
          text: 'text-[#334155]',
          badge: 'bg-[#F1F5F9] text-[#334155] border-[#CBD5E1]',
          accent: 'text-[#64748B]',
          bgLight: 'bg-[#F8FAFC]',
        };
      case 'vedic_gold':
      default:
        return {
          primaryBg: 'bg-[#78350F]',
          border: 'border-[#78350F]',
          text: 'text-[#78350F]',
          badge: 'bg-[#FFFBEB] text-[#78350F] border-[#FDE68A]',
          accent: 'text-[#D97706]',
          bgLight: 'bg-[#FAF7F2]',
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="bg-white p-5 rounded-3xl border border-[#E8DCC4] shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#78350F] flex items-center justify-center border border-[#FDE68A] shadow-2xs">
            <Receipt className="w-5 h-5 text-[#D97706]" />
          </div>
          <div>
            <h3 className="text-base font-serif font-bold text-[#78350F] flex items-center gap-2">
              Tax Invoice & Receipt Template Engine
              <span className="text-[10px] font-sans px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] rounded-full border border-[#A7F3D0] uppercase font-bold">
                Backend Live
              </span>
            </h3>
            <p className="text-xs text-[#8B735B]">
              Configure GSTIN, HSN codes, tax rates, entity branding, and legal terms for all user purchase receipts and downloads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 bg-[#FAF7F2] hover:bg-[#F3EFE0] text-[#78350F] rounded-xl text-xs font-bold border border-[#E8DCC4] transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 md:flex-none px-4 py-2 bg-[#78350F] hover:bg-[#5C280B] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
            {saving ? 'Saving...' : 'Save Template Config'}
          </button>
        </div>
      </div>

      {/* Main Grid: Form Controls (Left) + Real-Time Live Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls (7 cols) */}
        <div className="lg:col-span-6 space-y-5">
          {/* Card 1: Business Identity & Registration */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8DCC4] shadow-2xs space-y-4">
            <h4 className="text-xs font-serif font-bold text-[#78350F] flex items-center gap-2 pb-2 border-b border-[#E8DCC4]">
              <Building className="w-4 h-4 text-[#D97706]" /> Business Entity & Tax Registration
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                  Entity / Business Name *
                </label>
                <input
                  type="text"
                  value={config.businessName}
                  onChange={(e) => handleFieldChange('businessName', e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl font-medium text-[#3D342D] focus:ring-1 focus:ring-[#D97706] outline-none"
                  placeholder="e.g. VastuDrishti Shastra Technologies Pvt Ltd"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                  Tagline / Business Subtitle
                </label>
                <input
                  type="text"
                  value={config.subtitle}
                  onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl font-medium text-[#3D342D] focus:ring-1 focus:ring-[#D97706] outline-none"
                  placeholder="e.g. Sacred Vedic Geometry & Architectural Audit Services"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                    GSTIN / Tax ID Registration *
                  </label>
                  <input
                    type="text"
                    value={config.taxId}
                    onChange={(e) => handleFieldChange('taxId', e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl font-mono uppercase text-[#3D342D] focus:ring-1 focus:ring-[#D97706] outline-none"
                    placeholder="07AAACV7719K1Z4"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                    PAN / CIN Identifier
                  </label>
                  <input
                    type="text"
                    value={config.panOrCin}
                    onChange={(e) => handleFieldChange('panOrCin', e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl font-mono uppercase text-[#3D342D] focus:ring-1 focus:ring-[#D97706] outline-none"
                    placeholder="AACPV7719K"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                  Official Registered Office Address
                </label>
                <textarea
                  rows={2}
                  value={config.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-xs font-medium text-[#3D342D] focus:ring-1 focus:ring-[#D97706] outline-none"
                  placeholder="Complete office address for invoice dispatch..."
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#78350F] mb-1">Support Email</label>
                  <input
                    type="email"
                    value={config.supportEmail}
                    onChange={(e) => handleFieldChange('supportEmail', e.target.value)}
                    className="w-full p-2 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-[11px] text-[#3D342D]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#78350F] mb-1">Support Phone</label>
                  <input
                    type="text"
                    value={config.supportPhone}
                    onChange={(e) => handleFieldChange('supportPhone', e.target.value)}
                    className="w-full p-2 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-[11px] text-[#3D342D]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#78350F] mb-1">Website URL</label>
                  <input
                    type="text"
                    value={config.websiteUrl}
                    onChange={(e) => handleFieldChange('websiteUrl', e.target.value)}
                    className="w-full p-2 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-[11px] text-[#3D342D]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: HSN / SAC Code & Tax Rate Model */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8DCC4] shadow-2xs space-y-4">
            <h4 className="text-xs font-serif font-bold text-[#78350F] flex items-center gap-2 pb-2 border-b border-[#E8DCC4]">
              <Percent className="w-4 h-4 text-[#D97706]" /> HSN / SAC & Tax Calculation Rules
            </h4>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                    HSN / SAC Code *
                  </label>
                  <input
                    type="text"
                    value={config.hsnCode}
                    onChange={(e) => handleFieldChange('hsnCode', e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl font-mono text-[#3D342D]"
                    placeholder="998314 (Architectural & Technical Services)"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                    Invoice Prefix Numbering
                  </label>
                  <input
                    type="text"
                    value={config.invoicePrefix}
                    onChange={(e) => handleFieldChange('invoicePrefix', e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl font-mono text-[#3D342D]"
                    placeholder="VD-INV-2026-"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                  Default Line Item Service Description
                </label>
                <input
                  type="text"
                  value={config.serviceDescription}
                  onChange={(e) => handleFieldChange('serviceDescription', e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-[#3D342D]"
                  placeholder="e.g. 16-Zone Directional Shastra Audit & Non-Destructive Remedial License"
                />
              </div>

              <div className="grid grid-cols-3 gap-3 p-3 bg-[#FAF7F2] rounded-2xl border border-[#E8DCC4]">
                <div>
                  <label className="block text-[10px] font-bold text-[#78350F] mb-1">Total GST %</label>
                  <select
                    value={config.taxRatePercent}
                    onChange={(e) => handleFieldChange('taxRatePercent', Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#E8DCC4] rounded-xl font-bold text-[#78350F]"
                  >
                    <option value={18}>18% (Standard SAC)</option>
                    <option value={12}>12% (Reduced)</option>
                    <option value={5}>5% (Special)</option>
                    <option value={0}>0% (Exempt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#78350F] mb-1">CGST %</label>
                  <input
                    type="number"
                    value={config.cgstPercent}
                    onChange={(e) => handleFieldChange('cgstPercent', Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#E8DCC4] rounded-xl font-bold text-[#3D342D]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#78350F] mb-1">SGST %</label>
                  <input
                    type="number"
                    value={config.sgstPercent}
                    onChange={(e) => handleFieldChange('sgstPercent', Number(e.target.value))}
                    className="w-full p-2 bg-white border border-[#E8DCC4] rounded-xl font-bold text-[#3D342D]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-[#FFFBEB] rounded-xl border border-[#FEF3C7]">
                <div>
                  <div className="text-xs font-bold text-[#78350F]">Prices are GST-Inclusive</div>
                  <div className="text-[10px] text-[#8B735B]">
                    Automatically back-calculate taxable value and CGST/SGST amounts from plan fee.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={config.isGstIncluded}
                  onChange={(e) => handleFieldChange('isGstIncluded', e.target.checked)}
                  className="w-4 h-4 accent-[#D97706] rounded cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Theme, Signatory & Sacred Stamp Styling */}
          <div className="bg-white p-5 rounded-3xl border border-[#E8DCC4] shadow-2xs space-y-4">
            <h4 className="text-xs font-serif font-bold text-[#78350F] flex items-center gap-2 pb-2 border-b border-[#E8DCC4]">
              <Sliders className="w-4 h-4 text-[#D97706]" /> Signatory, Disclaimer & Aesthetics
            </h4>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                    Authorized Signatory Title
                  </label>
                  <input
                    type="text"
                    value={config.authorizedSignatory}
                    onChange={(e) => handleFieldChange('authorizedSignatory', e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-[#3D342D]"
                    placeholder="Chief Vedic Acharya"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                    Signatory Name / Authority
                  </label>
                  <input
                    type="text"
                    value={config.signatoryName}
                    onChange={(e) => handleFieldChange('signatoryName', e.target.value)}
                    className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-[#3D342D]"
                    placeholder="Pt. V. S. Pasala"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                  Tax Invoice Theme Palette
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'vedic_gold', label: 'Vedic Gold', bg: 'bg-[#78350F]' },
                    { id: 'emerald', label: 'Emerald', bg: 'bg-[#065F46]' },
                    { id: 'ruby', label: 'Ruby', bg: 'bg-[#991B1B]' },
                    { id: 'sapphire', label: 'Sapphire', bg: 'bg-[#1E40AF]' },
                    { id: 'slate', label: 'Slate', bg: 'bg-[#334155]' },
                  ].map((themeOpt) => (
                    <button
                      key={themeOpt.id}
                      type="button"
                      onClick={() => handleFieldChange('themeColor', themeOpt.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        config.themeColor === themeOpt.id
                          ? 'border-[#D97706] bg-[#FEF3C7] ring-1 ring-[#D97706]'
                          : 'border-[#E8DCC4] bg-[#FAF7F2]'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full ${themeOpt.bg} shadow-2xs`} />
                      <span className="text-[9px] font-bold text-[#78350F]">{themeOpt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                  Sacred Sadhana Guarantee / Disclaimer Note
                </label>
                <textarea
                  rows={2}
                  value={config.disclaimerText}
                  onChange={(e) => handleFieldChange('disclaimerText', e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-xs text-[#3D342D]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#78350F] mb-1">
                  Invoice Footer Legal Jurisdictions
                </label>
                <input
                  type="text"
                  value={config.footerNotes}
                  onChange={(e) => handleFieldChange('footerNotes', e.target.value)}
                  className="w-full p-2.5 bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl text-xs text-[#3D342D]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DCC4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.sacredStampEnabled}
                    onChange={(e) => handleFieldChange('sacredStampEnabled', e.target.checked)}
                    className="w-4 h-4 accent-[#D97706] rounded"
                  />
                  <span className="text-[11px] font-bold text-[#78350F]">Vedic Seal of Authenticity</span>
                </label>

                <label className="flex items-center gap-2 p-2.5 bg-[#FAF7F2] rounded-xl border border-[#E8DCC4] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.showQrCode}
                    onChange={(e) => handleFieldChange('showQrCode', e.target.checked)}
                    className="w-4 h-4 accent-[#D97706] rounded"
                  />
                  <span className="text-[11px] font-bold text-[#78350F]">QR Verification Badge</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive WYSIWYG Receipt Preview (5 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Preview Controls Bar */}
          <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#E8DCC4] flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-[#D97706]" />
              <span className="font-serif font-bold text-[#78350F]">Real-Time Render Preview</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={samplePlan.amount}
                onChange={(e) => {
                  const amt = Number(e.target.value);
                  if (amt === 1499) {
                    setSamplePlan({ name: 'Lifetime Pro Vedic Audit License', amount: 1499, currency: 'INR' });
                  } else if (amt === 899) {
                    setSamplePlan({ name: '1-Year Unlimited Property Pass', amount: 899, currency: 'INR' });
                  } else {
                    setSamplePlan({ name: 'Single House Vastu Audit Pass', amount: 299, currency: 'INR' });
                  }
                }}
                className="p-1.5 bg-white border border-[#E8DCC4] rounded-lg font-bold text-[#78350F] text-[11px]"
              >
                <option value={1499}>Lifetime Pro (₹1,499)</option>
                <option value={899}>1-Year Pass (₹899)</option>
                <option value={299}>Single Audit (₹299)</option>
              </select>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-2.5 py-1.5 bg-[#78350F] hover:bg-[#5C280B] text-white rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shadow-2xs"
              >
                <Printer className="w-3 h-3 text-[#F59E0B]" /> Print
              </button>
            </div>
          </div>

          {/* Rendered Invoice Paper Card */}
          <div className="bg-white rounded-3xl border-2 border-[#E8DCC4] shadow-lg overflow-hidden text-[#3D342D] font-sans relative">
            {/* Top Accent Header */}
            <div className={`${theme.primaryBg} text-white p-5 flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20">
                  <Receipt className="w-5 h-5 text-[#FDE68A]" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm tracking-wide">TAX INVOICE / CASH RECEIPT</h4>
                  <p className="text-[10px] text-white/80 font-mono">
                    {config.invoicePrefix}
                    {sampleUser.paymentId.replace('pay_', '')}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="px-2.5 py-0.5 bg-white/20 backdrop-blur-xs text-white text-[10px] font-bold uppercase rounded border border-white/30 tracking-wider">
                  ORIGINAL FOR RECIPIENT
                </span>
                <p className="text-[10px] text-white/80 mt-1">Dated: {sampleUser.date}</p>
              </div>
            </div>

            {/* Invoice Body Content */}
            <div className="p-5 space-y-4 text-xs">
              {/* Business Header Info */}
              <div className="flex justify-between items-start border-b border-[#E8DCC4] pb-4">
                <div className="max-w-[65%]">
                  <h3 className={`font-serif font-bold text-base ${theme.text}`}>
                    {config.businessName}
                  </h3>
                  <p className="text-[10px] text-[#8B735B] font-medium leading-tight">
                    {config.subtitle}
                  </p>
                  <p className="text-[10px] text-[#8B735B] mt-1">{config.address}</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px] text-[#8B735B]">
                    <span>Email: {config.supportEmail}</span>
                    <span>Phone: {config.supportPhone}</span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="inline-block px-2.5 py-1 bg-[#FAF7F2] rounded-lg border border-[#E8DCC4] text-left">
                    <span className="text-[9px] text-[#8B735B] font-bold block uppercase">GSTIN / TAX ID</span>
                    <span className="font-mono font-bold text-[11px] text-[#78350F]">{config.taxId}</span>
                  </div>
                  {config.panOrCin && (
                    <div className="text-[9px] text-[#8B735B] font-mono">PAN: {config.panOrCin}</div>
                  )}
                </div>
              </div>

              {/* Billed To / Transaction Meta */}
              <div className="grid grid-cols-2 gap-3 bg-[#FAF7F2] p-3 rounded-2xl border border-[#E8DCC4] text-[11px]">
                <div>
                  <span className="text-[9px] text-[#8B735B] uppercase font-bold block">Billed To Customer</span>
                  <div className="font-bold text-[#78350F] text-xs">{sampleUser.name}</div>
                  <div className="text-[#8B735B] font-mono text-[10px] truncate">{sampleUser.email}</div>
                  <span className="inline-block mt-1 px-1.5 py-0.2 bg-[#ECFDF5] text-[#065F46] text-[8px] font-bold uppercase rounded border border-[#A7F3D0]">
                    ✓ Authenticated Device
                  </span>
                </div>

                <div>
                  <span className="text-[9px] text-[#8B735B] uppercase font-bold block">Transaction Details</span>
                  <div className="font-mono text-[10px] text-[#3D342D] truncate">
                    <strong>Payment ID:</strong> {sampleUser.paymentId}
                  </div>
                  <div className="font-mono text-[10px] text-[#8B735B] truncate">
                    <strong>Order Ref:</strong> {sampleUser.orderId}
                  </div>
                  <div className="text-[10px] text-[#059669] font-bold">
                    Gateway: Razorpay / GPay Verified
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-[#E8DCC4] rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-[#FAF7F2] border-b border-[#E8DCC4] text-[#8B735B] font-bold uppercase text-[9px]">
                    <tr>
                      <th className="p-2.5">Item & Description</th>
                      <th className="p-2.5 text-center">HSN / SAC</th>
                      <th className="p-2.5 text-right">Taxable</th>
                      <th className="p-2.5 text-right">Tax</th>
                      <th className="p-2.5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8DCC4]/60">
                    <tr>
                      <td className="p-2.5">
                        <div className="font-bold text-[#78350F]">{samplePlan.name}</div>
                        <div className="text-[9px] text-[#8B735B] leading-tight">
                          {config.serviceDescription}
                        </div>
                      </td>
                      <td className="p-2.5 text-center font-mono text-[10px] text-[#8B735B]">
                        {config.hsnCode}
                      </td>
                      <td className="p-2.5 text-right font-mono text-[#3D342D]">
                        ₹{taxCalculations.taxableAmount}
                      </td>
                      <td className="p-2.5 text-right font-mono text-[#8B735B]">
                        ₹{taxCalculations.totalTax}
                      </td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#78350F]">
                        ₹{samplePlan.amount}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-[#FAF7F2] text-xs border-t border-[#E8DCC4]">
                    <tr>
                      <td colSpan={3} className="p-2 text-right text-[10px] text-[#8B735B]">
                        Taxable Value:
                      </td>
                      <td colSpan={2} className="p-2 text-right font-mono text-[11px] text-[#3D342D]">
                        ₹{taxCalculations.taxableAmount}
                      </td>
                    </tr>
                    {config.taxRatePercent > 0 && (
                      <>
                        <tr>
                          <td colSpan={3} className="px-2 py-0.5 text-right text-[10px] text-[#8B735B]">
                            CGST ({taxCalculations.cgstPercent}%):
                          </td>
                          <td colSpan={2} className="px-2 py-0.5 text-right font-mono text-[11px] text-[#3D342D]">
                            ₹{taxCalculations.cgstAmount}
                          </td>
                        </tr>
                        <tr>
                          <td colSpan={3} className="px-2 py-0.5 text-right text-[10px] text-[#8B735B]">
                            SGST ({taxCalculations.sgstPercent}%):
                          </td>
                          <td colSpan={2} className="px-2 py-0.5 text-right font-mono text-[11px] text-[#3D342D]">
                            ₹{taxCalculations.sgstAmount}
                          </td>
                        </tr>
                      </>
                    )}
                    <tr className="border-t border-[#E8DCC4] font-bold">
                      <td colSpan={3} className="p-2.5 text-right text-[#78350F]">
                        Grand Total (Paid):
                      </td>
                      <td colSpan={2} className="p-2.5 text-right font-mono text-sm font-bold text-[#059669]">
                        ₹{taxCalculations.grandTotal}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Sacred Guarantee Stamp & QR Code */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center p-3 bg-[#FFFBEB] rounded-2xl border border-[#FEF3C7]">
                {config.showQrCode && (
                  <div className="sm:col-span-3 flex flex-col items-center justify-center p-2 bg-white rounded-xl border border-[#E8DCC4] shadow-2xs">
                    <QrCode className="w-10 h-10 text-[#78350F]" />
                    <span className="text-[8px] font-bold text-[#8B735B] mt-0.5">SCAN TO VERIFY</span>
                  </div>
                )}

                <div className={config.showQrCode ? 'sm:col-span-9' : 'sm:col-span-12'}>
                  <div className="flex items-center gap-1.5 font-serif font-bold text-xs text-[#78350F] mb-1">
                    <ShieldCheck className="w-4 h-4 text-[#D97706]" />
                    <span>Sacred Authenticity & Legal Guarantee</span>
                  </div>
                  <p className="text-[10px] text-[#78350F] leading-tight">
                    {config.disclaimerText}
                  </p>
                </div>
              </div>

              {/* Signatory Seal Footer */}
              <div className="flex justify-between items-end pt-3 border-t border-[#E8DCC4]">
                <div className="text-[9px] text-[#8B735B] max-w-[220px]">
                  {config.footerNotes}
                </div>

                <div className="text-right">
                  <div className="inline-block border-b border-[#78350F] pb-1 px-4 mb-1">
                    <span className="font-serif italic font-bold text-xs text-[#78350F]">
                      {config.signatoryName}
                    </span>
                  </div>
                  <div className="text-[9px] font-bold text-[#8B735B] uppercase">
                    {config.authorizedSignatory}
                  </div>
                  <div className="text-[8px] text-[#A89078] font-mono">For {config.businessName}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
