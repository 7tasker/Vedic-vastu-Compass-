export type VastuElement = 'Water' | 'Fire' | 'Earth' | 'Air' | 'Space';

export interface VastuZone {
  id: string;
  name: string;
  code: string;
  shortName: string;
  minDegree: number; // e.g. 33.75
  maxDegree: number; // e.g. 56.25
  centerDegree: number; // e.g. 45
  deity: string;
  rulingPlanet: string;
  element: VastuElement;
  color: string;
  colorHex: string;
  bgTailwind: string;
  textTailwind: string;
  bestSuitedFor: string[];
  strictlyAvoid: string[];
  description: string;
}

export type RoomType =
  | 'entrance'
  | 'pooja'
  | 'kitchen'
  | 'master_bedroom'
  | 'kids_bedroom'
  | 'guest_bedroom'
  | 'living_room'
  | 'dining_room'
  | 'toilet'
  | 'study_room'
  | 'cash_locker'
  | 'staircase'
  | 'water_tank_underground'
  | 'water_tank_overhead'
  | 'store_room'
  | 'balcony';

export interface RoomDefinition {
  id: RoomType;
  label: string;
  hindiName: string;
  iconName: string;
  description: string;
  idealZones: string[]; // e.g. ['NE', 'N', 'E']
  acceptableZones: string[];
  disallowedZones: string[]; // Severe dosh
}

export interface PlacedRoom {
  id: string;
  roomType: RoomType;
  customLabel?: string;
  degree: number; // 0 - 359
  zoneCode: string; // e.g. 'NE', 'SE'
  floorLevel?: string;
  notes?: string;
}

export interface RemedyItem {
  id: string;
  title: string;
  category: 'color' | 'yantra' | 'pyramid' | 'plant' | 'element' | 'lighting' | 'symbol';
  description: string;
  howToApply: string;
  materialsNeeded: string[];
  effectiveness: 'High' | 'Medium' | 'Very High';
  isApplied?: boolean;
}

export interface VastuDoshAnalysis {
  roomId: string;
  roomType: RoomType;
  roomLabel: string;
  zoneCode: string;
  zoneName: string;
  degree: number;
  status: 'Auspicious' | 'Passable' | 'Inauspicious';
  score: number; // 0 to 100
  conflictReason?: string;
  remedies: RemedyItem[];
}

export interface HouseVastuAuditReport {
  reportRefNumber?: string;
  overallScore: number;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  summaryText: string;
  elementalBalance: Record<VastuElement, number>;
  totalRooms: number;
  auspiciousCount: number;
  passableCount: number;
  doshCount: number;
  hasEntrance: boolean;
  isEntranceMissing: boolean;
  analyses: VastuDoshAnalysis[];
}

export interface PropertyRecord {
  id: string;
  name: string;
  address: string;
  addressType: 'manual' | 'gps';
  coordinates?: { lat: number; lng: number };
  propertyType: 'Flat/Apartment' | 'Independent House' | 'Villa' | 'Commercial Office' | 'Plot';
  facingDegree: number;
  placedRooms: PlacedRoom[];
  createdAt: string;
  isDemo?: boolean;
  floorplanUrl?: string;
  floorplanOpacity?: number;
  floorplanRotation?: number;
  floorplanScale?: number;
  floorplanFlipH?: boolean;
  floorplanFlipV?: boolean;
  // User Tied Information
  userId?: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  // Payment Details
  paymentReceiptNo?: string;
  paymentStatus?: 'paid' | 'unpaid' | 'pro_unlocked' | 'free_tier';
  paymentAmount?: number;
  paymentCurrency?: string;
  paymentGateway?: string;
  paymentDate?: string;
  // Vastu Report Details
  vastuReportNumber?: string;
  reportRefNumber?: string;
  overallScore?: number;
  grade?: string;
  doshCount?: number;
  reportDate?: string;
  // Consultation & Signing Details
  consultationId?: string;
  consultationTopic?: string;
  consultationStatus?: 'approved' | 'signed' | 'pending' | 'completed';
  isSigned?: boolean;
  signedByName?: string;
  signedAt?: string;
  signatureDataUrl?: string;
  consultationNotes?: string;
}

export type SubscriptionPlanId = 'single_property' | 'pass_2weeks' | 'pass_4weeks' | 'lifetime_pro';

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  priceInr: string;
  priceUsd: string;
  durationLabel: string;
  badge?: string;
  description: string;
  popular?: boolean;
}

export interface UserProfile {
  uid?: string;
  name: string;
  email: string;
  phone?: string;
  role?: 'admin' | 'user';
  isLoggedIn: boolean;
  isProMember: boolean;
  activePlan?: SubscriptionPlanId;
  unlockedPropertyIds?: string[];
  planExpiryDate?: string;
  savedPropertiesCount: number;
  savedProperties?: PropertyRecord[];
}

export interface GeminiVastuConsultRequest {
  houseScore?: number;
  placedRooms?: PlacedRoom[];
  userQuestion: string;
  houseFacingDirection?: string;
  propertyType?: 'Flat/Apartment' | 'Independent House' | 'Plot' | 'Commercial/Office';
}

export interface GeminiVastuConsultResponse {
  answer: string;
  remediesRecommended: string[];
  keyAdvice: string[];
}

export type CeremonyType =
  | 'griha_pravesh'
  | 'bhumi_pujan'
  | 'chaukhat_sthapana'
  | 'borewell'
  | 'pooja_room';

export interface MuhurtaDate {
  id: string;
  date: string; // YYYY-MM-DD
  formattedDate: string;
  month: string; // e.g. "August 2026"
  ceremonyType: CeremonyType;
  tithi: string;
  nakshatra: string;
  yoga: string;
  karana: string;
  timeWindow: string;
  secondaryTimeWindow?: string;
  fixedLagna: string;
  rahuKalam: string;
  yamaganda: string;
  rating: 5 | 4 | 3;
  suitabilityScore: number;
  summary: string;
  guidelines: string[];
  recommendedRashis?: string[];
  locationNote?: string;
}

export interface PushNotificationAlert {
  id: string;
  title: string;
  body: string;
  category: 'festival' | 'muhurta' | 'rahu_kalam' | 'daily_tip' | 'special_puja';
  targetTab?: string;
  targetFestivalId?: string;
  countdownText: string;
  dateLabel: string;
  iconName: string;
  isRead?: boolean;
  priority?: 'high' | 'normal';
  createdAt?: string;
}
