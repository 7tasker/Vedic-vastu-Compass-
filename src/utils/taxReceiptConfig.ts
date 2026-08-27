import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, isConfigValid } from '../lib/firebase';

export interface TaxReceiptTemplateConfig {
  businessName: string;
  subtitle: string;
  taxId: string; // GSTIN / Tax Registration No
  panOrCin: string;
  address: string;
  supportEmail: string;
  supportPhone: string;
  websiteUrl: string;
  hsnCode: string;
  serviceDescription: string;
  taxRatePercent: number; // e.g. 18 for 18% GST (9% CGST + 9% SGST)
  isGstIncluded: boolean;
  cgstPercent: number;
  sgstPercent: number;
  invoicePrefix: string;
  authorizedSignatory: string;
  signatoryName: string;
  disclaimerText: string;
  watermarkText: string;
  themeColor: 'vedic_gold' | 'emerald' | 'ruby' | 'sapphire' | 'slate';
  sacredStampEnabled: boolean;
  showQrCode: boolean;
  footerNotes: string;
  lastUpdated?: string;
}

export const DEFAULT_TAX_RECEIPT_CONFIG: TaxReceiptTemplateConfig = {
  businessName: 'VastuDrishti Shastra Technologies',
  subtitle: 'Sacred Vedic Geometry, Energy Balancing & Architectural Audit Services',
  taxId: '07AAACV7719K1Z4',
  panOrCin: 'AACPV7719K',
  address: 'Shree Vastu Niketan, Cyber City Tech Hub, Bangalore, Karnataka - 560103, India',
  supportEmail: 'admin@vastucompass.app',
  supportPhone: '+91 98765 43210',
  websiteUrl: 'https://vastucompass.app',
  hsnCode: '998314',
  serviceDescription: '16-Zone Shastra Directional Audit, Pancha Mahabhuta Balancing & Remedial Consulting License',
  taxRatePercent: 18,
  isGstIncluded: true,
  cgstPercent: 9,
  sgstPercent: 9,
  invoicePrefix: 'VD-INV-2026-',
  authorizedSignatory: 'Chief Vedic Acharya & Shastra Architect',
  signatoryName: 'Pt. V. S. Pasala (Vastu Shastra Vidwan)',
  disclaimerText:
    'This tax invoice & digital license is cryptographically generated and certified under Vedic Architecture & Shastra guidelines. Spiritual energy remedies are practiced without structural demolition.',
  watermarkText: 'AUTHENTIC VEDIC AUDIT • GST PAID',
  themeColor: 'vedic_gold',
  sacredStampEnabled: true,
  showQrCode: true,
  footerNotes:
    'Subject to Bangalore Jurisdiction. This is a computer-generated tax invoice and authenticated digital license. No physical signature is required.',
  lastUpdated: new Date().toISOString(),
};

const STORAGE_KEY = 'vastu_tax_receipt_template_config';

// Load Tax Receipt Template Config from LocalStorage with Firestore cloud sync
export const getTaxReceiptConfig = (): TaxReceiptTemplateConfig => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_TAX_RECEIPT_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to parse tax receipt config from localStorage:', e);
  }
  return DEFAULT_TAX_RECEIPT_CONFIG;
};

// Save Tax Receipt Template Config to LocalStorage & Firestore
export const saveTaxReceiptConfig = async (
  config: TaxReceiptTemplateConfig
): Promise<void> => {
  const updated: TaxReceiptTemplateConfig = {
    ...config,
    lastUpdated: new Date().toISOString(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not save tax receipt config to local storage:', e);
  }

  if (isConfigValid) {
    try {
      const docRef = doc(db, 'system_config', 'tax_receipt_template');
      await setDoc(docRef, updated, { merge: true });
    } catch (err) {
      console.warn('Firestore tax receipt config sync note:', err);
    }
  }

  // Broadcast update event
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('vastu_tax_receipt_config_updated', { detail: updated }));
    } catch {}
  }
};

// Calculate tax breakdown from total amount
export const calculateTaxBreakdown = (
  totalAmount: number,
  config: TaxReceiptTemplateConfig
) => {
  const amount = Number(totalAmount) || 0;
  if (config.isGstIncluded && config.taxRatePercent > 0) {
    // Total = Taxable + (Taxable * rate / 100) => Taxable = Total / (1 + rate/100)
    const taxableAmount = Math.round((amount / (1 + config.taxRatePercent / 100)) * 100) / 100;
    const totalTax = Math.round((amount - taxableAmount) * 100) / 100;
    const cgstAmount = Math.round((totalTax / 2) * 100) / 100;
    const sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100;

    return {
      taxableAmount,
      totalTax,
      cgstAmount,
      sgstAmount,
      cgstPercent: config.cgstPercent || config.taxRatePercent / 2,
      sgstPercent: config.sgstPercent || config.taxRatePercent / 2,
      grandTotal: amount,
    };
  } else if (!config.isGstIncluded && config.taxRatePercent > 0) {
    const taxableAmount = amount;
    const totalTax = Math.round((taxableAmount * (config.taxRatePercent / 100)) * 100) / 100;
    const cgstAmount = Math.round((totalTax / 2) * 100) / 100;
    const sgstAmount = Math.round((totalTax - cgstAmount) * 100) / 100;

    return {
      taxableAmount,
      totalTax,
      cgstAmount,
      sgstAmount,
      cgstPercent: config.cgstPercent || config.taxRatePercent / 2,
      sgstPercent: config.sgstPercent || config.taxRatePercent / 2,
      grandTotal: Math.round((taxableAmount + totalTax) * 100) / 100,
    };
  }

  return {
    taxableAmount: amount,
    totalTax: 0,
    cgstAmount: 0,
    sgstAmount: 0,
    cgstPercent: 0,
    sgstPercent: 0,
    grandTotal: amount,
  };
};
