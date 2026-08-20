import { PropertyRecord } from '../types';
import { UserDbProfile } from '../lib/firebase';

export type { UserDbProfile };

export interface ConsultationExportItem {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  phone?: string;
  topic: string;
  propertyType: string;
  facingDirection: string;
  reportRefNumber?: string;
  question: string;
  status: 'pending' | 'replied' | string;
  adminReply?: string;
  createdAt: string;
  repliedAt?: string;
  assignedTo?: string;
}

/**
 * Escapes a cell value for standard RFC 4180 CSV
 */
function escapeCsvCell(value: any): string {
  if (value === undefined || value === null) return '""';
  const str = String(value).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Trigger browser download for a Blob
 */
export function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate Master Relational CSV combining User Profiles, Tied Properties,
 * Payment Receipts, Vastu Reports, and Consultation Signatures.
 */
export function generateMasterRelationalCsv(users: UserDbProfile[]): string {
  const headers = [
    'User UID',
    'User Name',
    'User Email',
    'User Phone',
    'Role',
    'Membership Status',
    'Active Plan',
    'User Registered Date',
    'Property ID',
    'Property Name',
    'Actual Street Address',
    'Address Type',
    'GPS Latitude',
    'GPS Longitude',
    'Property Type',
    'Facing Degree',
    'Facing Direction',
    'Placed Rooms Count',
    'Placed Rooms Detail',
    'Payment Receipt No',
    'Payment Status',
    'Payment Amount (INR)',
    'Payment Currency',
    'Payment Gateway / Method',
    'Payment Date',
    'Vastu Report Ref Number',
    'Overall Vastu Score',
    'Vastu Grade',
    'Dosh Count',
    'Report Date',
    'Consultation ID',
    'Consultation Topic',
    'Consultation Details / Question',
    'Consultation Status',
    'Digital Signing Certified',
    'Signed By (Consultant)',
    'Signed Timestamp',
    'Consultation Remedies / Notes',
  ];

  const rows: string[] = [headers.map(escapeCsvCell).join(',')];

  users.forEach((user) => {
    const props = user.savedProperties || [];
    if (props.length === 0) {
      // User with 0 saved properties row
      const row = [
        user.uid || '',
        user.name || '',
        user.email || '',
        user.phone || '',
        user.role || 'user',
        user.isProMember ? 'PRO ACTIVE' : 'FREE USER',
        user.activePlan || 'none',
        user.createdAt || '',
        'NO_PROPERTIES',
        'None',
        'No address registered',
        'N/A',
        '',
        '',
        'N/A',
        '',
        '',
        0,
        '',
        'N/A',
        'unpaid',
        0,
        'INR',
        'N/A',
        '',
        'N/A',
        '',
        '',
        '',
        '',
        'N/A',
        '',
        '',
        '',
        'No',
        '',
        '',
        '',
      ];
      rows.push(row.map(escapeCsvCell).join(','));
    } else {
      props.forEach((prop) => {
        const roomsDetail = (prop.placedRooms || [])
          .map((r) => `${r.customLabel || r.roomType} (${r.zoneCode} ${r.degree}°)` )
          .join('; ');

        let facingDir = '';
        const deg = prop.facingDegree || 0;
        if (deg >= 337.5 || deg < 22.5) facingDir = 'North (0°)';
        else if (deg >= 22.5 && deg < 67.5) facingDir = 'North-East (45°)';
        else if (deg >= 67.5 && deg < 112.5) facingDir = 'East (90°)';
        else if (deg >= 112.5 && deg < 157.5) facingDir = 'South-East (135°)';
        else if (deg >= 157.5 && deg < 202.5) facingDir = 'South (180°)';
        else if (deg >= 202.5 && deg < 247.5) facingDir = 'South-West (225°)';
        else if (deg >= 247.5 && deg < 292.5) facingDir = 'West (270°)';
        else facingDir = 'North-West (315°)';

        const row = [
          user.uid || '',
          prop.userName || user.name || '',
          prop.userEmail || user.email || '',
          prop.userPhone || user.phone || '',
          user.role || 'user',
          user.isProMember ? 'PRO ACTIVE' : 'FREE USER',
          user.activePlan || 'pro',
          user.createdAt || '',
          prop.id || '',
          prop.name || '',
          prop.address || '',
          prop.addressType || 'manual',
          prop.coordinates?.lat ?? '',
          prop.coordinates?.lng ?? '',
          prop.propertyType || 'Flat/Apartment',
          prop.facingDegree ?? 0,
          facingDir,
          prop.placedRooms?.length || 0,
          roomsDetail,
          prop.paymentReceiptNo || 'N/A',
          prop.paymentStatus || (user.isProMember ? 'paid' : 'free_tier'),
          prop.paymentAmount ?? (user.isProMember ? 499 : 0),
          prop.paymentCurrency || 'INR',
          prop.paymentGateway || 'Google Pay / Razorpay',
          prop.paymentDate || '',
          prop.vastuReportNumber || prop.reportRefNumber || 'N/A',
          prop.overallScore ?? 80,
          prop.grade || 'A',
          prop.doshCount ?? 0,
          prop.reportDate || '',
          prop.consultationId || 'N/A',
          prop.consultationTopic || '',
          (prop as any).consultationQuestion || (prop as any).question || prop.consultationNotes || '',
          prop.consultationStatus || (prop.isSigned ? 'signed' : 'pending'),
          prop.isSigned ? 'Yes (Certified)' : 'Pending',
          prop.signedByName || 'Pasala P.',
          prop.signedAt || '',
          prop.consultationNotes || '',
        ];
        rows.push(row.map(escapeCsvCell).join(','));
      });
    }
  });

  return rows.join('\r\n');
}

/**
 * Generate Master JSON Database export
 */
export function generateMasterRelationalJson(users: UserDbProfile[]): string {
  const payload = {
    exportMetadata: {
      app: 'Vastu Shastra Compass & House Auditor',
      exportType: 'Full Relational User Profiles & Tied Property Addresses Database',
      version: '3.0.0',
      exportedAt: new Date().toISOString(),
      totalUsers: users.length,
      totalProperties: users.reduce((sum, u) => sum + (u.savedProperties?.length || 0), 0),
    },
    users: users.map((u) => ({
      uid: u.uid,
      name: u.name,
      email: u.email,
      phone: u.phone,
      role: u.role || 'user',
      isProMember: u.isProMember,
      activePlan: u.activePlan,
      createdAt: u.createdAt,
      lastLoginAt: u.lastLoginAt,
      savedPropertiesCount: u.savedProperties?.length || 0,
      savedProperties: (u.savedProperties || []).map((p) => ({
        id: p.id,
        name: p.name,
        address: p.address,
        addressType: p.addressType,
        coordinates: p.coordinates,
        propertyType: p.propertyType,
        facingDegree: p.facingDegree,
        placedRooms: p.placedRooms,
        createdAt: p.createdAt,
        userId: p.userId || u.uid,
        userName: p.userName || u.name,
        userEmail: p.userEmail || u.email,
        userPhone: p.userPhone || u.phone,
        // Tied Payment
        paymentReceiptNo: p.paymentReceiptNo,
        paymentStatus: p.paymentStatus,
        paymentAmount: p.paymentAmount,
        paymentCurrency: p.paymentCurrency,
        paymentGateway: p.paymentGateway,
        paymentDate: p.paymentDate,
        // Tied Vastu Audit Report
        vastuReportNumber: p.vastuReportNumber || p.reportRefNumber,
        reportRefNumber: p.reportRefNumber || p.vastuReportNumber,
        overallScore: p.overallScore,
        grade: p.grade,
        doshCount: p.doshCount,
        reportDate: p.reportDate,
        // Tied Consultation & Digital Signing
        consultationId: p.consultationId,
        consultationTopic: p.consultationTopic,
        consultationQuestion: (p as any).consultationQuestion,
        consultationStatus: p.consultationStatus,
        isSigned: p.isSigned,
        signedByName: p.signedByName,
        signedAt: p.signedAt,
        signatureDataUrl: p.signatureDataUrl,
        consultationNotes: p.consultationNotes,
      })),
    })),
  };

  return JSON.stringify(payload, null, 2);
}

/**
 * Generate CSV for Consultations Forum Inquiries
 */
export function generateConsultationsCsv(consultations: ConsultationExportItem[]): string {
  const headers = [
    'Consultation ID',
    'Client Name',
    'Client Email',
    'Client Phone',
    'Consultation Topic',
    'Property Type',
    'Facing Direction',
    'Report Ref Number',
    'User Inquiry / Question',
    'Status',
    'Admin Expert Reply',
    'Submitted Timestamp',
    'Replied Timestamp',
  ];

  const rows: string[] = [headers.map(escapeCsvCell).join(',')];

  consultations.forEach((item) => {
    const row = [
      item.id,
      item.userName,
      item.userEmail,
      item.phone || '',
      item.topic,
      item.propertyType,
      item.facingDirection,
      item.reportRefNumber || '',
      item.question,
      item.status,
      item.adminReply || '',
      item.createdAt,
      item.repliedAt || '',
    ];
    rows.push(row.map(escapeCsvCell).join(','));
  });

  return rows.join('\r\n');
}

/**
 * Export single Property Record Dossier as formatted text / JSON
 */
export function exportSinglePropertyDossier(prop: PropertyRecord, user?: UserDbProfile) {
  const payload = {
    propertyRecord: prop,
    ownerProfile: user
      ? {
          uid: user.uid,
          name: user.name,
          email: user.email,
          phone: user.phone,
          isProMember: user.isProMember,
        }
      : undefined,
    generatedAt: new Date().toISOString(),
    digitalVerification: {
      status: prop.isSigned ? 'VALIDATED_BY_VEDIC_SEAL' : 'UNVERIFIED',
      signedBy: prop.signedByName || 'Pasala P. (Vedic Architect & Vastu Shastra Consultant)',
      signedAt: prop.signedAt,
    },
  };

  const filename = `Vastu_Dossier_${(prop.name || 'Property').replace(/\s+/g, '_')}_${prop.id}.json`;
  triggerFileDownload(JSON.stringify(payload, null, 2), filename, 'application/json');
}

/**
 * Export single Consultation Thread as formatted Text or JSON
 */
export function exportSingleConsultationThread(item: ConsultationExportItem) {
  const content = `=====================================================
VASTU SHASTRA EXPERT CONSULTATION DOSSIER
Reference Number: ${item.reportRefNumber || 'N/A'}
Consultation ID: ${item.id}
Generated: ${new Date().toLocaleString()}
=====================================================

1. CLIENT & PROPERTY DETAILS:
-----------------------------------------------------
Client Name:        ${item.userName}
Email Address:      ${item.userEmail}
Contact Phone:      ${item.phone || 'Not provided'}
Property Type:      ${item.propertyType}
Facing Direction:   ${item.facingDirection}
Vastu Report Ref:   ${item.reportRefNumber || 'N/A'}
Submitted Date:     ${new Date(item.createdAt).toLocaleString()}
Status:             ${item.status.toUpperCase()}

2. CONSULTATION TOPIC & INQUIRY:
-----------------------------------------------------
Topic:              ${item.topic}

User Problem Description:
${item.question}

3. EXPERT VASTU SHASTRA ADMIN GUIDANCE & REMEDIES:
-----------------------------------------------------
${item.adminReply ? item.adminReply : '[Pending review by Vedic Architect / Admin Expert]'}
${item.repliedAt ? `\nReplied At: ${new Date(item.repliedAt).toLocaleString()}` : ''}

=====================================================
Digital Authenticity Seal: VASTU_COMPASS_AUDIT_2026
Consultant: Pasala P. (Vedic Architect & Vastu Shastra Guru)
=====================================================`;

  const filename = `Vastu_Consultation_${(item.userName || 'Client').replace(/\s+/g, '_')}_${item.id}.txt`;
  triggerFileDownload(content, filename, 'text/plain');
}
