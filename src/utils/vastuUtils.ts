import { VASTU_ZONES, ROOM_DEFINITIONS, GENERAL_REMEDIES } from '../data/vastuData';
import { getSystemSettings } from './systemSettings';
import {
  VastuZone,
  PlacedRoom,
  VastuDoshAnalysis,
  HouseVastuAuditReport,
  RemedyItem,
  VastuElement,
  RoomType,
} from '../types';

/**
 * Get exact Vastu Zone from degrees (0 to 359)
 */
export function getZoneFromDegree(degree: number): VastuZone {
  const normDeg = ((degree % 360) + 360) % 360;

  for (const zone of VASTU_ZONES) {
    if (zone.minDegree > zone.maxDegree) {
      // Crosses North 0deg (348.75 to 11.25)
      if (normDeg >= zone.minDegree || normDeg < zone.maxDegree) {
        return zone;
      }
    } else {
      if (normDeg >= zone.minDegree && normDeg < zone.maxDegree) {
        return zone;
      }
    }
  }

  // Fallback to North
  return VASTU_ZONES[0];
}

/**
 * Evaluate compatibility of a room in a specific zone
 */
export function analyzeRoomPlacement(room: PlacedRoom): VastuDoshAnalysis {
  const roomDef = ROOM_DEFINITIONS.find((r) => r.id === room.roomType) || ROOM_DEFINITIONS[0];
  const zone = getZoneFromDegree(room.degree);
  const zoneCode = zone.code;

  let status: 'Auspicious' | 'Passable' | 'Inauspicious' = 'Passable';
  let score = 60;
  let conflictReason: string | undefined;
  const remedies: RemedyItem[] = [];

  const isIdeal = roomDef.idealZones.includes(zoneCode);
  const isAcceptable = roomDef.acceptableZones.includes(zoneCode);
  const isDisallowed = roomDef.disallowedZones.includes(zoneCode);

  if (isIdeal) {
    status = 'Auspicious';
    score = 95;
  } else if (isDisallowed) {
    status = 'Inauspicious';
    score = 20;
    conflictReason = `${roomDef.label} in ${zone.name} (${zoneCode}) creates a severe Vastu Dosh due to elemental conflict with ${zone.deity} and ${zone.element} element.`;
  } else if (isAcceptable) {
    status = 'Passable';
    score = 75;
  } else {
    status = 'Passable';
    score = 55;
    conflictReason = `${roomDef.label} in ${zone.name} is sub-optimal. Minor energy balancing remedies recommended.`;
  }

  // Generate specific remedies
  if (status === 'Inauspicious' || status === 'Passable') {
    if (room.roomType === 'toilet' && (zoneCode === 'NE' || zoneCode === 'NNE' || zoneCode === 'N')) {
      remedies.push(GENERAL_REMEDIES.toilet_ne);
    } else if (room.roomType === 'kitchen' && (zoneCode === 'NE' || zoneCode === 'NNE' || zoneCode === 'N')) {
      remedies.push(GENERAL_REMEDIES.kitchen_ne);
    } else if (room.roomType === 'entrance' && zoneCode === 'SW') {
      remedies.push(GENERAL_REMEDIES.entrance_sw);
    } else if (room.roomType === 'kitchen' && zoneCode === 'SW') {
      remedies.push(GENERAL_REMEDIES.kitchen_sw);
    } else if (room.roomType === 'toilet' && zoneCode === 'SW') {
      remedies.push(GENERAL_REMEDIES.toilet_sw);
    } else if (room.roomType === 'pooja' && (zoneCode === 'SE' || zoneCode === 'SSE')) {
      remedies.push(GENERAL_REMEDIES.pooja_se);
    } else if (room.roomType === 'master_bedroom' && zoneCode === 'NE') {
      remedies.push(GENERAL_REMEDIES.master_bed_ne);
    } else {
      // Custom generated remedy based on elemental mismatch
      remedies.push({
        id: `custom_${room.id}`,
        title: `${roomDef.label} in ${zone.shortName} Balancing Remedy`,
        category: 'element',
        description: `Balance ${zone.element} element energy of ${zone.deity} zone to prevent energy drain.`,
        howToApply: `Use ${zone.color} color tones in curtains/decor. Place 3 Vastu Pyramids near the room threshold and keep a bowl of sea salt to absorb negative vibrations.`,
        materialsNeeded: [`3 Vastu Pyramids`, `Sea Salt bowl`, `${zone.color} Decor accents`],
        effectiveness: 'High',
      });
    }
  }

  return {
    roomId: room.id,
    roomType: room.roomType,
    roomLabel: room.customLabel || roomDef.label,
    zoneCode: zone.code,
    zoneName: zone.name,
    degree: Math.round(room.degree),
    status,
    score,
    conflictReason,
    remedies,
  };
}

/**
 * Calculate full house Vastu audit score and elemental distribution
 */
/**
 * Generate a clean, unique reference number for reports
 */
export function generateUniqueReportRef(prefix: 'RPT' | 'MUH' | 'PJA' | 'VST' = 'RPT'): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000).toString();
  return `${prefix}-${year}-${rand}`;
}

export function calculateHouseAudit(rooms: PlacedRoom[], overrideRefNumber?: string): HouseVastuAuditReport {
  const reportRefNumber = overrideRefNumber || generateUniqueReportRef('RPT');
  const hasEntrance = rooms.some((r) => r.roomType === 'entrance');

  if (rooms.length === 0) {
    return {
      reportRefNumber,
      overallScore: 0,
      grade: 'F',
      summaryText: '⚠️ Main Entrance Mandatory: Place your house Main Entrance and rooms to calculate your authentic House Audit Score.',
      elementalBalance: { Water: 20, Fire: 20, Earth: 20, Air: 20, Space: 20 },
      totalRooms: 0,
      auspiciousCount: 0,
      passableCount: 0,
      doshCount: 0,
      hasEntrance: false,
      isEntranceMissing: true,
      analyses: [],
    };
  }

  const analyses = rooms.map(analyzeRoomPlacement);

  let totalScore = 0;
  let auspiciousCount = 0;
  let passableCount = 0;
  let doshCount = 0;

  const elementalCounts: Record<VastuElement, number> = {
    Water: 0,
    Fire: 0,
    Earth: 0,
    Air: 0,
    Space: 0,
  };

  for (const analysis of analyses) {
    totalScore += analysis.score;
    if (analysis.status === 'Auspicious') auspiciousCount++;
    else if (analysis.status === 'Passable') passableCount++;
    else doshCount++;

    const zone = VASTU_ZONES.find((z) => z.code === analysis.zoneCode);
    if (zone) {
      elementalCounts[zone.element] = (elementalCounts[zone.element] || 0) + 1;
    }
  }

  const avgScore = Math.round(totalScore / rooms.length);

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
  if (avgScore >= 90) grade = 'A+';
  else if (avgScore >= 80) grade = 'A';
  else if (avgScore >= 70) grade = 'B';
  else if (avgScore >= 60) grade = 'C';
  else if (avgScore >= 45) grade = 'D';
  else grade = 'F';

  let summaryText = '';
  if (!hasEntrance) {
    summaryText = `⚠️ Main Entrance Missing: Main Entrance placement is mandatory to calculate an authentic House Audit Score. Please add your Main Entrance.`;
  } else if (doshCount === 0) {
    summaryText = `Excellent Vastu alignment! Your house layout adheres closely to traditional Hindu Vastu Shastra principles.`;
  } else if (doshCount <= 2) {
    summaryText = `Good overall house compatibility (${avgScore}%). ${doshCount} room(s) contain Vastu Dosh which can be easily resolved using non-destructive remedies.`;
  } else {
    summaryText = `Your house layout has ${doshCount} critical Vastu Dosh conflicts. Follow the remedial suggestions to restore positive Prana energy flow.`;
  }

  // Normalize elemental balance percentages
  const totalElements = Object.values(elementalCounts).reduce((a, b) => a + b, 0) || 1;
  const elementalBalance: Record<VastuElement, number> = {
    Water: Math.round((elementalCounts.Water / totalElements) * 100),
    Fire: Math.round((elementalCounts.Fire / totalElements) * 100),
    Earth: Math.round((elementalCounts.Earth / totalElements) * 100),
    Air: Math.round((elementalCounts.Air / totalElements) * 100),
    Space: Math.round((elementalCounts.Space / totalElements) * 100),
  };

  return {
    reportRefNumber,
    overallScore: hasEntrance ? avgScore : 0,
    grade: hasEntrance ? grade : 'F',
    summaryText,
    elementalBalance,
    totalRooms: rooms.length,
    auspiciousCount,
    passableCount,
    doshCount,
    hasEntrance,
    isEntranceMissing: !hasEntrance,
    analyses,
  };
}

/**
 * Play a customizable audio chime/ring sound using Web Audio API
 */
export function playTempleBellChime(overrideSoundType?: string) {
  try {
    // Check user-level saved sound preference first
    const userSoundPref = localStorage.getItem('vastu_sound_enabled');
    if (userSoundPref === 'false' && !overrideSoundType) {
      return;
    }

    const settings = getSystemSettings();
    if (!settings.systemSoundEnabled && !overrideSoundType && userSoundPref !== 'true') return;

    const soundType = overrideSoundType || settings.soundType || 'soft_chime';

    const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (soundType === 'zen_bowl') {
      // Warm, deep Tibetan singing bowl (432Hz) with gentle binaural beat
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(432, ctx.currentTime);
      osc2.frequency.setValueAtTime(436, ctx.currentTime);

      gain.gain.setValueAtTime(0.10, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 2.5);
      osc2.stop(ctx.currentTime + 2.5);
    } else if (soundType === 'soft_chime') {
      // Soft gentle dual-harmonic chime (659Hz E5 + 880Hz A5) - very soothing & non-irritating
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime);
      osc2.frequency.setValueAtTime(880.0, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start(ctx.currentTime + 0.08);
      osc1.stop(ctx.currentTime + 1.2);
      osc2.stop(ctx.currentTime + 1.2);
    } else if (soundType === 'crystal_drop') {
      // Crystal clear subtle drop (1046.5Hz C6) - super short & gentle
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime);

      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } else if (soundType === 'gentle_beep') {
      // Soft warm triangle wave pulse
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);

      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      // Classic Solfeggio 528Hz Temple Bell
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'sine';

      osc1.frequency.setValueAtTime(528, ctx.currentTime);
      osc2.frequency.setValueAtTime(1056, ctx.currentTime);

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.0);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 2.0);
      osc2.stop(ctx.currentTime + 2.0);
    }
  } catch {
    // Ignore audio autoplay restrictions
  }
}
