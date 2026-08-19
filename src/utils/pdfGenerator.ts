import { jsPDF } from 'jspdf';
import { HouseVastuAuditReport, PlacedRoom, PropertyRecord, UserProfile } from '../types';
import { ROOM_DEFINITIONS, VASTU_ZONES, SUBSCRIPTION_PLANS } from '../data/vastuData';
import { getZoneFromDegree } from '../utils/vastuUtils';

export function generateVastuPDFReport(
  property: PropertyRecord | undefined,
  auditReport: HouseVastuAuditReport,
  placedRooms: PlacedRoom[],
  user?: UserProfile
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const reportId = auditReport.reportRefNumber || `RPT-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const auditDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Helper for adding new page if needed
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - margin) {
      doc.addPage();
      y = margin;
      drawHeaderFooter(false);
    }
  };

  // Draw Header & Footer
  const drawHeaderFooter = (isFirstPage: boolean) => {
    if (isFirstPage) {
      // Top Primary Deep Amber Header
      doc.setFillColor(120, 53, 15); // #78350F
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text('VASTU DRISHTI • VEDIC ARCHITECTURAL AUDIT', margin, 13);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(232, 220, 196);
      doc.text('16-ZONE PRECISION VASTU SHASTRA ANALYSIS & NON-DESTRUCTIVE REMEDIES', margin, 20);

      // Accent Gold Ribbon
      doc.setFillColor(217, 119, 6); // #D97706
      doc.rect(0, 28, pageWidth, 1.5, 'F');

      y = 35;
    } else {
      // Secondary Running Header
      doc.setFillColor(250, 246, 238);
      doc.rect(0, 0, pageWidth, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(120, 53, 15);
      doc.text(`VASTU DRISHTI AUDIT REPORT • REF: ${reportId}`, margin, 8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(139, 115, 91);
      doc.text(`Property: ${property?.name || 'Property Audit'}`, pageWidth - margin, 8, { align: 'right' });

      doc.setDrawColor(217, 119, 6);
      doc.setLineWidth(0.3);
      doc.line(margin, 12, pageWidth - margin, 12);
      y = 17;
    }

    // Page Footer
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.5);
    doc.setTextColor(139, 115, 91);
    doc.text(
      `Vastu Compass Vedic App • Report ID: ${reportId} • Generated on ${auditDate}`,
      margin,
      pageHeight - 6
    );
    doc.text(`Confidential Vastu Assessment`, pageWidth - margin, pageHeight - 6, { align: 'right' });
  };

  drawHeaderFooter(true);

  // 1. CLIENT USER DETAILS & PROPERTY INFORMATION CARD (2 COLUMNS)
  checkPageBreak(42);
  const cardH = 36;
  const colW = (contentWidth - 4) / 2;

  // Left Column - Client / User Profile
  doc.setFillColor(252, 250, 247);
  doc.setDrawColor(232, 220, 196);
  doc.roundedRect(margin, y, colW, cardH, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(120, 53, 15);
  doc.text('CLIENT / USER DETAILS', margin + 4, y + 6);
  doc.setDrawColor(217, 119, 6);
  doc.line(margin + 4, y + 8, margin + colW - 4, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60, 50, 40);
  doc.text('Client Name:', margin + 4, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(user?.name || 'Valued Homeowner', margin + 28, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Email:', margin + 4, y + 19);
  doc.setFont('helvetica', 'normal');
  doc.text(user?.email || 'Registered User', margin + 28, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.text('Account Status:', margin + 4, y + 24);
  doc.setFont('helvetica', 'normal');
  const planInfo = SUBSCRIPTION_PLANS.find((p) => p.id === user?.activePlan);
  const planLabel = planInfo ? planInfo.name : user?.isProMember ? 'Pro Member' : 'Standard Audit';
  doc.text(`${planLabel}`, margin + 28, y + 24);

  doc.setFont('helvetica', 'bold');
  doc.text('Report ID:', margin + 4, y + 29);
  doc.setFont('helvetica', 'normal');
  doc.text(`${reportId}`, margin + 28, y + 29);

  // Right Column - Audited Property Information
  const rightX = margin + colW + 4;
  doc.setFillColor(252, 250, 247);
  doc.setDrawColor(232, 220, 196);
  doc.roundedRect(rightX, y, colW, cardH, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(120, 53, 15);
  doc.text('AUDITED PROPERTY DETAILS', rightX + 4, y + 6);
  doc.setDrawColor(217, 119, 6);
  doc.line(rightX + 4, y + 8, rightX + colW - 4, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(60, 50, 40);
  doc.text('Property Name:', rightX + 4, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.text(property?.name || 'Primary Residence Audit', rightX + 28, y + 14);

  doc.setFont('helvetica', 'bold');
  doc.text('Address:', rightX + 4, y + 19);
  doc.setFont('helvetica', 'normal');
  const addrText = property?.address || 'Seawoods, Navi Mumbai, Maharashtra';
  const truncatedAddr = doc.splitTextToSize(addrText, colW - 30)[0] || addrText;
  doc.text(truncatedAddr, rightX + 28, y + 19);

  doc.setFont('helvetica', 'bold');
  doc.text('Property Type:', rightX + 4, y + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(`${property?.propertyType || 'Residential Flat/House'}`, rightX + 28, y + 24);

  doc.setFont('helvetica', 'bold');
  doc.text('Main Facing:', rightX + 4, y + 29);
  doc.setFont('helvetica', 'normal');
  const facingDegree = property?.facingDegree ?? 45;
  const facingZone = getZoneFromDegree(facingDegree);
  doc.text(`${facingDegree}° (${facingZone.name} / ${facingZone.code})`, rightX + 28, y + 29);

  y += cardH + 5;

  // 2. OVERALL VASTU AUDIT SCORE & GRADE EXECUTIVE SUMMARY
  checkPageBreak(38);

  // Score Color Determination
  const scoreColor =
    auditReport.overallScore >= 75
      ? { bg: [16, 185, 129], text: [255, 255, 255], border: [5, 150, 105] }
      : auditReport.overallScore >= 50
      ? { bg: [217, 119, 6], text: [255, 255, 255], border: [180, 83, 9] }
      : { bg: [239, 68, 68], text: [255, 255, 255], border: [220, 38, 38] };

  // Left Circle/Badge Box
  doc.setFillColor(scoreColor.bg[0], scoreColor.bg[1], scoreColor.bg[2]);
  doc.roundedRect(margin, y, 35, 30, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text(`${auditReport.overallScore}%`, margin + 17.5, y + 14, { align: 'center' });
  doc.setFontSize(8.5);
  doc.text(`GRADE ${auditReport.grade}`, margin + 17.5, y + 22, { align: 'center' });

  // Right Summary Content Card
  doc.setFillColor(253, 248, 240);
  doc.setDrawColor(232, 220, 196);
  doc.roundedRect(margin + 38, y, contentWidth - 38, 30, 3, 3, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(120, 53, 15);
  doc.text('EXECUTIVE VASTU ALIGNMENT ANALYSIS', margin + 42, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(60, 50, 40);
  const summaryParagraphs = doc.splitTextToSize(auditReport.summaryText, contentWidth - 46);
  doc.text(summaryParagraphs, margin + 42, y + 13);

  y += 35;

  // 3. KEY METRICS ROW (Auspicious / Passable / Vastu Dosh)
  checkPageBreak(14);
  const statBoxW = (contentWidth - 6) / 3;

  // Auspicious Box
  doc.setFillColor(240, 253, 244);
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, y, statBoxW, 12, 2, 2, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52);
  doc.text(`✓ Auspicious Rooms: ${auditReport.auspiciousCount}`, margin + 5, y + 7.5);

  // Passable Box
  doc.setFillColor(254, 252, 232);
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(margin + statBoxW + 3, y, statBoxW, 12, 2, 2, 'FD');
  doc.setTextColor(133, 77, 14);
  doc.text(`! Passable Layouts: ${auditReport.passableCount}`, margin + statBoxW + 8, y + 7.5);

  // Vastu Dosh Box
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin + (statBoxW + 3) * 2, y, statBoxW, 12, 2, 2, 'FD');
  doc.setTextColor(153, 27, 27);
  doc.text(`⚠️ Vastu Dosh (Defects): ${auditReport.doshCount}`, margin + (statBoxW + 3) * 2 + 5, y + 7.5);

  y += 17;

  // 4. PANCHA MAHABHUTA (5 ELEMENTS) ENERGY EQUILIBRIUM
  checkPageBreak(30);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(120, 53, 15);
  doc.text('PANCHA MAHABHUTA (5 ELEMENTS) ENERGETIC BALANCE', margin, y);
  doc.setDrawColor(217, 119, 6);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 6;

  const elements = [
    { name: 'Water (Jala)', val: auditReport.elementalBalance.Water, zone: 'North-East (NE)', color: [37, 99, 235] },
    { name: 'Fire (Agni)', val: auditReport.elementalBalance.Fire, zone: 'South-East (SE)', color: [220, 38, 38] },
    { name: 'Earth (Prithvi)', val: auditReport.elementalBalance.Earth, zone: 'South-West (SW)', color: [217, 119, 6] },
    { name: 'Air (Vayu)', val: auditReport.elementalBalance.Air, zone: 'North-West (NW)', color: [16, 185, 129] },
    { name: 'Space (Akasha)', val: auditReport.elementalBalance.Space, zone: 'Centre (Brahma)', color: [147, 51, 234] },
  ];

  const elemW = (contentWidth - 8) / 5;
  elements.forEach((elem, idx) => {
    const ex = margin + idx * (elemW + 2);
    doc.setFillColor(252, 250, 247);
    doc.setDrawColor(232, 220, 196);
    doc.roundedRect(ex, y, elemW, 18, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(elem.color[0], elem.color[1], elem.color[2]);
    doc.text(elem.name, ex + elemW / 2, y + 5, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    doc.text(`${elem.val}%`, ex + elemW / 2, y + 11, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 110, 100);
    doc.text(elem.zone, ex + elemW / 2, y + 15, { align: 'center' });
  });

  y += 24;

  // 5. 16-ZONE VASTU SHASTRA DIRECTIONAL REFERENCE MATRIX
  checkPageBreak(38);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(120, 53, 15);
  doc.text('KEY DIRECTIONAL ZONES & ARCHITECTURAL GUIDANCE', margin, y);
  doc.setDrawColor(217, 119, 6);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 6;

  const keyZonesOverview = [
    { code: 'NE (Ishanya)', deity: 'Lord Shiva / Water', best: 'Pooja Room, Main Entrance, Living', avoid: 'Toilet, Kitchen, Staircase' },
    { code: 'SE (Agneya)', deity: 'Lord Agni / Fire', best: 'Kitchen, Electricals, Cash', avoid: 'Water tank, Master Bedroom' },
    { code: 'SW (Nairrutya)', deity: 'Pitru / Earth', best: 'Master Bedroom, Heavy Storage', avoid: 'Entrance, Toilet, Water bodies' },
    { code: 'NW (Vayavya)', deity: 'Lord Vayu / Air', best: 'Guest Room, Finished Goods', avoid: 'Heavy Storage, Master Bedroom' },
    { code: 'Brahmasthan', deity: 'Lord Brahma / Space', best: 'Open Courtyard, Light Passages', avoid: 'Columns, Heavy furniture, Toilets' },
  ];

  // Table Headers
  doc.setFillColor(243, 239, 224);
  doc.rect(margin, y, contentWidth, 6, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);
  doc.text('Zone / Direction', margin + 3, y + 4.2);
  doc.text('Governing Element / Deity', margin + 40, y + 4.2);
  doc.text('Auspicious Usage', margin + 90, y + 4.2);
  doc.text('Strictly Avoid', margin + 140, y + 4.2);
  y += 6;

  keyZonesOverview.forEach((item, idx) => {
    const rowY = y;
    doc.setFillColor(idx % 2 === 0 ? 255 : 252, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 247);
    doc.rect(margin, rowY, contentWidth, 5.5, 'F');
    doc.setDrawColor(232, 220, 196);
    doc.line(margin, rowY + 5.5, pageWidth - margin, rowY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(120, 53, 15);
    doc.text(item.code, margin + 3, rowY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 50, 40);
    doc.text(item.deity, margin + 40, rowY + 3.8);
    doc.text(item.best, margin + 90, rowY + 3.8);

    doc.setTextColor(180, 40, 40);
    doc.text(item.avoid, margin + 140, rowY + 3.8);

    y += 5.5;
  });

  y += 8;

  // 6. ROOM-BY-ROOM AUDIT & STEP-BY-STEP REMEDIES
  checkPageBreak(25);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(120, 53, 15);
  doc.text('DETAILED ROOM-BY-ROOM AUDIT & NON-DESTRUCTIVE REMEDIES', margin, y);
  doc.setDrawColor(217, 119, 6);
  doc.line(margin, y + 2, pageWidth - margin, y + 2);
  y += 8;

  if (auditReport.analyses.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text('No rooms placed yet in the House Auditor.', margin, y);
    y += 10;
  } else {
    auditReport.analyses.forEach((item, index) => {
      const roomDef = ROOM_DEFINITIONS[item.roomType];
      const zoneDef = VASTU_ZONES.find((z) => z.code === item.zoneCode);

      // Estimate required box height based on remedies & content
      const hasConflict = !!item.conflictReason;
      const remediesCount = item.remedies.length;
      let cardHeight = 24 + (hasConflict ? 16 : 0);
      item.remedies.forEach((r) => {
        const textLines = doc.splitTextToSize(`• ${r.title}: ${r.howToApply}`, contentWidth - 16);
        cardHeight += 10 + textLines.length * 3.5;
      });

      checkPageBreak(Math.min(cardHeight + 4, 65));

      // Status Badge Configuration
      const statusPill =
        item.status === 'Auspicious'
          ? { label: 'Auspicious Alignment', fill: [240, 253, 244], stroke: [187, 247, 208], text: [22, 101, 52] }
          : item.status === 'Passable'
          ? { label: 'Passable (Neutral)', fill: [254, 252, 232], stroke: [254, 240, 138], text: [133, 77, 14] }
          : { label: 'Vastu Dosh (Defect)', fill: [254, 242, 242], stroke: [254, 202, 202], text: [153, 27, 27] };

      // Card Outline Box
      doc.setFillColor(254, 252, 249);
      doc.setDrawColor(232, 220, 196);
      doc.roundedRect(margin, y, contentWidth, cardHeight, 2.5, 2.5, 'FD');

      // Top Title Bar inside Card
      doc.setFillColor(243, 239, 224);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setDrawColor(232, 220, 196);
      doc.line(margin, y + 8, pageWidth - margin, y + 8);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(120, 53, 15);
      const roomLabelStr = item.roomLabel ? `(${item.roomLabel})` : '';
      const displayTitle = `${index + 1}. ${roomDef?.label || item.roomType} ${roomLabelStr}`;
      doc.text(displayTitle, margin + 4, y + 5.5);

      // Status Pill
      doc.setFillColor(statusPill.fill[0], statusPill.fill[1], statusPill.fill[2]);
      doc.setDrawColor(statusPill.stroke[0], statusPill.stroke[1], statusPill.stroke[2]);
      const pillW = 36;
      doc.roundedRect(pageWidth - margin - pillW - 3, y + 1.2, pillW, 5.5, 1.5, 1.5, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(statusPill.text[0], statusPill.text[1], statusPill.text[2]);
      doc.text(statusPill.label, pageWidth - margin - pillW / 2 - 3, y + 5, { align: 'center' });

      let cardY = y + 12;

      // Location & Direction Meta
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(80, 70, 60);
      doc.text(
        `Placement Degree: ${item.degree}°  |  Zone: ${item.zoneCode} (${zoneDef?.name || item.zoneName || ''})  |  Element: ${zoneDef?.element || 'Vedic Element'}`,
        margin + 4,
        cardY
      );
      cardY += 6;

      // Vastu Dosh Conflict Box
      if (item.conflictReason) {
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(254, 202, 202);
        doc.roundedRect(margin + 4, cardY, contentWidth - 8, 11, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(153, 27, 27);
        doc.text('⚠️ Vastu Dosh Diagnosis:', margin + 7, cardY + 4);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(120, 20, 20);
        const conflictLines = doc.splitTextToSize(item.conflictReason, contentWidth - 18);
        doc.text(conflictLines, margin + 7, cardY + 7.5);

        cardY += 13;
      }

      // Prescribed Non-Destructive Remedies
      if (item.remedies.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(120, 53, 15);
        doc.text('PRESCRIBED NON-DESTRUCTIVE VEDIC REMEDIES:', margin + 4, cardY);
        cardY += 4;

        item.remedies.forEach((rem) => {
          doc.setFillColor(255, 255, 255);
          doc.setDrawColor(232, 220, 196);

          const remDetailStr = `• ${rem.title}: ${rem.howToApply}`;
          const remLines = doc.splitTextToSize(remDetailStr, contentWidth - 14);
          const remBoxH = 6 + remLines.length * 3.5;

          doc.roundedRect(margin + 4, cardY, contentWidth - 8, remBoxH, 1.5, 1.5, 'FD');

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(180, 83, 9);
          doc.text(`[${rem.category.toUpperCase()} REMEDY]`, margin + 6, cardY + 4);

          if (rem.effectiveness) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6.5);
            doc.setTextColor(22, 101, 52);
            doc.text(`Effectiveness: ${rem.effectiveness}`, pageWidth - margin - 35, cardY + 4);
          }

          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(60, 50, 40);
          doc.text(remLines, margin + 6, cardY + 8);

          cardY += remBoxH + 2;
        });
      }

      y += cardHeight + 5;
    });
  }

  // 7. GENERAL NON-DESTRUCTIVE VASTU PRINCIPLES & REMEDIAL ADVICE
  checkPageBreak(35);
  doc.setFillColor(253, 248, 240);
  doc.setDrawColor(217, 119, 6);
  doc.roundedRect(margin, y, contentWidth, 30, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(120, 53, 15);
  doc.text('CORE VEDIC REMEDIAL PRINCIPLES FOR HOME HARMONY', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 50, 40);
  const generalAdvice = [
    '1. Brahmasthan (Centre): Keep the central area of your floor plan clutter-free, open, and well-lit to allow prana energy circulation.',
    '2. North-East (Ishanya): Maintain extreme cleanliness; place sea salt in a glass bowl or brass water pot to clear negative subtle vibrations.',
    '3. South-East (Agneya): Balance fire element with red/orange tape or copper helix strips near electrical appliances or water fixtures.',
    '4. South-West (Nairrutya): Keep the SW zone heavy with solid furniture, earth-tone decor (yellow/brown yantras) to secure stability & prosperity.',
  ];

  generalAdvice.forEach((advice, idx) => {
    doc.text(advice, margin + 4, y + 11 + idx * 4.5);
  });

  y += 35;

  // 8. DISCLAIMER & VASTU DRISHTI CERTIFICATION SEAL
  checkPageBreak(18);
  doc.setDrawColor(217, 119, 6);
  doc.line(margin, y, pageWidth - margin, y);
  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(120, 53, 15);
  doc.text('VASTU COMPASS VEDIC AUDIT CERTIFICATION & DISCLAIMER', margin, y);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6.5);
  doc.setTextColor(120, 110, 100);
  const disclaimerText =
    'This Vastu Compass Audit Report is generated using Vedic 16-Zone precision compass formulas and Pancha Mahabhuta energy balancing principles. All prescribed remedies are strictly non-destructive, avoiding structural demolition. For specific personalized astrological alignment, consult a certified Vastu Shastra Shastri.';
  const disclaimerLines = doc.splitTextToSize(disclaimerText, contentWidth);
  doc.text(disclaimerLines, margin, y + 4);

  // Save the PDF
  const safePropName = (property?.name || 'Vastu_House_Audit_Report')
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
  doc.save(`${safePropName}_${reportId}.pdf`);
}
