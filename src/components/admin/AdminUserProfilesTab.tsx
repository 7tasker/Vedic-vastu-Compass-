import React, { useState, useEffect } from 'react';
import { PropertyRecord } from '../../types';
import {
  UserDbProfile,
  savePropertyAddressToFirestore,
  deletePropertyAddressFromFirestore,
  db,
  ADMIN_EMAIL,
} from '../../lib/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { playTempleBellChime } from '../../utils/vastuUtils';
import {
  generateMasterRelationalCsv,
  generateMasterRelationalJson,
  exportSinglePropertyDossier,
  triggerFileDownload,
} from '../../utils/exportRelationalData';
import {
  Search,
  Building2,
  MapPin,
  Receipt,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  User,
  Plus,
  Edit3,
  Trash2,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Compass,
  FileCheck,
  PenTool,
  Save,
  X,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Tag,
  Phone,
  Mail,
  Download,
  FileSpreadsheet,
  CheckSquare,
  Square,
  Printer,
  Share2,
  FileCode,
  SlidersHorizontal,
} from 'lucide-react';

interface AdminUserProfilesTabProps {
  userList: UserDbProfile[];
  onUpdateUserList: (users: UserDbProfile[]) => void;
  onNotify: (message: string) => void;
}

// Default initial mock dataset with rich tied address records for immediate realistic display
export const DEFAULT_USER_PROFILES_WITH_ADDRESSES: UserDbProfile[] = [
  {
    uid: 'usr_vastu_admin_01',
    email: 'admin@vastucompass.app',
    name: 'Satish Pasala (Admin)',
    phone: '+91 9876543210',
    role: 'admin',
    isProMember: true,
    activePlan: 'lifetime_pro',
    savedPropertiesCount: 1,
    createdAt: '2026-08-15T10:00:00.000Z',
    lastLoginAt: '2026-08-20T10:30:00.000Z',
    savedProperties: [
      {
        id: 'prop_vastu_01',
        name: 'Lotus Grandeur Suite 502',
        address: 'Flat 502, 5th Floor, Royal Palms, Outer Ring Rd, Marathahalli, Bengaluru, Karnataka 560037',
        addressType: 'manual',
        propertyType: 'Flat/Apartment',
        facingDegree: 90,
        placedRooms: [
          { id: 'r71', roomType: 'entrance', degree: 90, zoneCode: 'E', customLabel: 'Main Entrance Door (East)' },
          { id: 'r72', roomType: 'pooja', degree: 45, zoneCode: 'NE', customLabel: 'Ishan Mandir' },
          { id: 'r73', roomType: 'kitchen', degree: 135, zoneCode: 'SE', customLabel: 'Agni Kitchen' },
          { id: 'r74', roomType: 'master_bedroom', degree: 225, zoneCode: 'SW', customLabel: 'Nairutya Master Bedroom' },
        ],
        createdAt: '2026-08-15T10:00:00.000Z',
        userId: 'usr_vastu_admin_01',
        userName: 'Satish Pasala (Admin)',
        userEmail: 'admin@vastucompass.app',
        userPhone: '+91 9876543210',
        paymentReceiptNo: 'REC-2026-78210',
        paymentStatus: 'paid',
        paymentAmount: 1499,
        paymentCurrency: 'INR',
        paymentGateway: 'Razorpay (pay_vastu_99182)',
        paymentDate: '2026-08-15 10:15 AM',
        vastuReportNumber: 'RPT-2026-286153',
        reportRefNumber: 'RPT-2026-286153',
        overallScore: 91,
        grade: 'A+',
        doshCount: 0,
        reportDate: '2026-08-15',
        consultationId: 'CNS-2026-286153',
        consultationTopic: 'Main Door Vastu Remedy',
        consultationStatus: 'signed',
        isSigned: true,
        signedByName: 'Pasala P. (Vedic Architect & Vastu Shastra Consultant)',
        signedAt: '2026-08-15 11:30 AM',
        signatureDataUrl: 'DIGITAL_SEAL_VERIFIED_PASALA_VEDIC_2026',
        consultationNotes: 'East (Purva) main entrance is highly auspicious and brings Surya Dev positive vibrations. Sacred Ishan water element verified.',
      },
    ],
  },
  {
    uid: 'admin_pasala_01',
    email: 'pasalavenkatasatish@gmail.com',
    name: 'Pasala P. (Vedic Architect)',
    phone: '+91 98480 12345',
    role: 'admin',
    isProMember: true,
    activePlan: 'lifetime_pro',
    savedPropertiesCount: 2,
    createdAt: '2026-08-01T08:00:00.000Z',
    lastLoginAt: '2026-08-20T10:00:00.000Z',
    savedProperties: [
      {
        id: 'prop_pasala_01',
        name: 'Sri Venkateswara Nilayam',
        address: 'Plot No. 48, Road No. 12, Banjara Hills, Hyderabad, Telangana 500034',
        addressType: 'manual',
        propertyType: 'Villa',
        facingDegree: 90,
        placedRooms: [
          { id: 'r1', roomType: 'entrance', degree: 90, zoneCode: 'E', customLabel: 'East Main Entrance' },
          { id: 'r2', roomType: 'pooja', degree: 45, zoneCode: 'NE', customLabel: 'Ishan Mandir' },
          { id: 'r3', roomType: 'kitchen', degree: 135, zoneCode: 'SE', customLabel: 'Agni Rasoi' },
          { id: 'r4', roomType: 'master_bedroom', degree: 225, zoneCode: 'SW', customLabel: 'Nairutya Master Suite' },
        ],
        createdAt: '2026-08-05T09:30:00.000Z',
        userId: 'admin_pasala_01',
        userName: 'Pasala P.',
        userEmail: 'pasalavenkatasatish@gmail.com',
        userPhone: '+91 98480 12345',
        paymentReceiptNo: 'REC-2026-99214',
        paymentStatus: 'paid',
        paymentAmount: 999,
        paymentCurrency: 'INR',
        paymentGateway: 'Google Pay (UPI / Web)',
        paymentDate: '2026-08-05 09:32 AM',
        vastuReportNumber: 'RPT-2026-881902',
        reportRefNumber: 'RPT-2026-881902',
        overallScore: 94,
        grade: 'A+',
        doshCount: 0,
        reportDate: '2026-08-05',
        consultationId: 'CNS-2026-8812',
        consultationTopic: 'Master Bedroom & Pooja Sthana Vastu Verification',
        consultationStatus: 'signed',
        isSigned: true,
        signedByName: 'Pasala P. (Vedic Architect & Vastu Shastra Consultant)',
        signedAt: '2026-08-05 10:45 AM',
        signatureDataUrl: 'DIGITAL_SEAL_VERIFIED_PASALA_VEDIC_2026',
        consultationNotes: 'ईशान (North-East) sacred water element and अग्नेय (South-East) kitchen layout fully compliant with Vedic Mayamatam guidelines.',
      },
      {
        id: 'prop_pasala_02',
        name: 'Lotus Heights Apt 402',
        address: 'Tower B, Flat 402, Green Glen Layout, Bellandur, Bengaluru, Karnataka 560103',
        addressType: 'manual',
        propertyType: 'Flat/Apartment',
        facingDegree: 0,
        placedRooms: [
          { id: 'r10', roomType: 'entrance', degree: 0, zoneCode: 'N', customLabel: 'Kubera North Entrance' },
          { id: 'r11', roomType: 'living_room', degree: 45, zoneCode: 'NE', customLabel: 'Living Hall' },
          { id: 'r12', roomType: 'kitchen', degree: 135, zoneCode: 'SE', customLabel: 'Kitchen' },
        ],
        createdAt: '2026-08-10T14:15:00.000Z',
        userId: 'admin_pasala_01',
        userName: 'Pasala P.',
        userEmail: 'pasalavenkatasatish@gmail.com',
        paymentReceiptNo: 'REC-2026-44120',
        paymentStatus: 'paid',
        paymentAmount: 499,
        paymentCurrency: 'INR',
        paymentGateway: 'Razorpay UPI',
        paymentDate: '2026-08-10 02:18 PM',
        vastuReportNumber: 'RPT-2026-773190',
        reportRefNumber: 'RPT-2026-773190',
        overallScore: 86,
        grade: 'A',
        doshCount: 1,
        reportDate: '2026-08-10',
        consultationId: 'CNS-2026-9041',
        consultationTopic: 'Main Entrance & Balcony Energy Flow Analysis',
        consultationStatus: 'signed',
        isSigned: true,
        signedByName: 'Pasala P.',
        signedAt: '2026-08-10 03:20 PM',
        signatureDataUrl: 'DIGITAL_SEAL_VERIFIED_PASALA_VEDIC_2026',
        consultationNotes: 'North entrance attracts Kubera prosperity energy. Applied brass pyramid strip remedy in balcony.',
      },
    ],
  },
  {
    uid: 'usr_adhvik_772',
    email: 'adhvik.vastu@gmail.com',
    name: 'Vedic Client #772 (Adhvik Kumar)',
    phone: '+91 99160 88231',
    role: 'user',
    isProMember: true,
    activePlan: 'monthly_pro',
    savedPropertiesCount: 1,
    createdAt: '2026-08-08T11:20:00.000Z',
    lastLoginAt: '2026-08-19T16:45:00.000Z',
    savedProperties: [
      {
        id: 'prop_adhvik_01',
        name: 'Adhvik Residency',
        address: 'Flat 12B, Palm Meadows, Whitefield Main Rd, Bengaluru, Karnataka 560066',
        addressType: 'gps',
        coordinates: { lat: 12.9698, lng: 77.75 },
        propertyType: 'Flat/Apartment',
        facingDegree: 45,
        placedRooms: [
          { id: 'r21', roomType: 'entrance', degree: 45, zoneCode: 'NE', customLabel: 'Main Door' },
          { id: 'r22', roomType: 'kitchen', degree: 135, zoneCode: 'SE', customLabel: 'Kitchen' },
          { id: 'r23', roomType: 'master_bedroom', degree: 225, zoneCode: 'SW', customLabel: 'Master Bedroom' },
        ],
        createdAt: '2026-08-08T11:25:00.000Z',
        userId: 'usr_adhvik_772',
        userName: 'Adhvik Kumar',
        userEmail: 'adhvik.vastu@gmail.com',
        userPhone: '+91 99160 88231',
        paymentReceiptNo: 'REC-2026-33910',
        paymentStatus: 'paid',
        paymentAmount: 499,
        paymentCurrency: 'INR',
        paymentGateway: 'Razorpay NetBanking',
        paymentDate: '2026-08-08 11:28 AM',
        vastuReportNumber: 'RPT-2026-118204',
        reportRefNumber: 'RPT-2026-118204',
        overallScore: 82,
        grade: 'A',
        doshCount: 1,
        reportDate: '2026-08-08',
        consultationId: 'CNS-2026-4421',
        consultationTopic: 'Kitchen & Brahmasthan Flow Optimization',
        consultationStatus: 'signed',
        isSigned: true,
        signedByName: 'Pasala P. (Vedic Architect)',
        signedAt: '2026-08-08 12:30 PM',
        signatureDataUrl: 'DIGITAL_SEAL_VERIFIED_PASALA_VEDIC_2026',
        consultationNotes: 'Brahmasthan kept free of heavy columns. Kitchen positioned in auspicious Agneya zone.',
      },
    ],
  },
  {
    uid: 'usr_102',
    email: 'rajesh.sharma@gmail.com',
    name: 'Rajesh Sharma',
    phone: '+91 98111 55432',
    role: 'user',
    isProMember: true,
    activePlan: 'monthly_pro',
    savedPropertiesCount: 1,
    createdAt: '2026-08-01T10:30:00.000Z',
    lastLoginAt: '2026-08-18T12:00:00.000Z',
    savedProperties: [
      {
        id: 'prop_rajesh_01',
        name: 'Sharma Villa',
        address: 'House No. 142, Sector 15, Gurugram, Haryana 122001',
        addressType: 'manual',
        propertyType: 'Independent House',
        facingDegree: 0,
        placedRooms: [
          { id: 'r31', roomType: 'entrance', degree: 0, zoneCode: 'N', customLabel: 'North Gate' },
          { id: 'r32', roomType: 'kitchen', degree: 135, zoneCode: 'SE', customLabel: 'Kitchen' },
          { id: 'r33', roomType: 'master_bedroom', degree: 225, zoneCode: 'SW', customLabel: 'Master Bed' },
        ],
        createdAt: '2026-08-01T10:45:00.000Z',
        userId: 'usr_102',
        userName: 'Rajesh Sharma',
        userEmail: 'rajesh.sharma@gmail.com',
        userPhone: '+91 98111 55432',
        paymentReceiptNo: 'REC-2026-991',
        paymentStatus: 'paid',
        paymentAmount: 499,
        paymentCurrency: 'INR',
        paymentGateway: 'Razorpay (pay_Pzq9921019X)',
        paymentDate: '2026-08-01 11:00 AM',
        vastuReportNumber: 'RPT-2026-55912',
        reportRefNumber: 'RPT-2026-55912',
        overallScore: 88,
        grade: 'A',
        doshCount: 0,
        reportDate: '2026-08-01',
        consultationId: 'CNS-2026-1022',
        consultationTopic: 'Staircase & South-West Stability Audit',
        consultationStatus: 'signed',
        isSigned: true,
        signedByName: 'Pasala P.',
        signedAt: '2026-08-01 11:30 AM',
        signatureDataUrl: 'DIGITAL_SEAL_VERIFIED_PASALA_VEDIC_2026',
        consultationNotes: 'Staircase correctly situated clockwise in South zone. Heavy master bed in Nairutya provides stability.',
      },
    ],
  },
  {
    uid: 'usr_103',
    email: 'priya.architect@mumbai.in',
    name: 'Priya Mehta',
    phone: '+91 98201 99201',
    role: 'user',
    isProMember: false,
    savedPropertiesCount: 1,
    createdAt: '2026-08-01T14:20:00.000Z',
    lastLoginAt: '2026-08-15T09:10:00.000Z',
    savedProperties: [
      {
        id: 'prop_priya_01',
        name: 'SeaBreeze Apartment 801',
        address: '801 Sea View Apartments, Worli Sea Face, Mumbai, Maharashtra 400030',
        addressType: 'manual',
        propertyType: 'Flat/Apartment',
        facingDegree: 270,
        placedRooms: [
          { id: 'r41', roomType: 'entrance', degree: 270, zoneCode: 'W', customLabel: 'West Door' },
          { id: 'r42', roomType: 'kitchen', degree: 315, zoneCode: 'NW', customLabel: 'Kitchen in Vayu' },
        ],
        createdAt: '2026-08-01T14:25:00.000Z',
        userId: 'usr_103',
        userName: 'Priya Mehta',
        userEmail: 'priya.architect@mumbai.in',
        userPhone: '+91 98201 99201',
        paymentReceiptNo: 'REC-2026-FREE-01',
        paymentStatus: 'free_tier',
        paymentAmount: 0,
        paymentCurrency: 'INR',
        paymentGateway: 'Free Vastu Explorer Tier',
        paymentDate: '2026-08-01 02:20 PM',
        vastuReportNumber: 'RPT-2026-22481',
        reportRefNumber: 'RPT-2026-22481',
        overallScore: 68,
        grade: 'B',
        doshCount: 2,
        reportDate: '2026-08-01',
        consultationId: 'CNS-2026-7890',
        consultationTopic: 'Kitchen Position & Gas Stove Placement according to Vastu',
        consultationStatus: 'pending',
        isSigned: false,
        signedByName: 'Unsigned (Pending Review)',
        signedAt: 'Pending Verification',
        consultationNotes: 'Recommended installing a green aventurine stone remedy near gas stove.',
      },
    ],
  },
  {
    uid: 'usr_104',
    email: 'vikram.builders@delhi.co.in',
    name: 'Vikram Singh',
    phone: '+91 98100 44556',
    role: 'user',
    isProMember: true,
    activePlan: 'lifetime_pro',
    savedPropertiesCount: 1,
    createdAt: '2026-08-01T15:45:00.000Z',
    lastLoginAt: '2026-08-16T18:30:00.000Z',
    savedProperties: [
      {
        id: 'prop_vikram_01',
        name: 'Singh Commercial Hub',
        address: 'Plot 88, Okhla Industrial Area Phase III, New Delhi 110020',
        addressType: 'manual',
        propertyType: 'Commercial Office',
        facingDegree: 90,
        placedRooms: [
          { id: 'r51', roomType: 'entrance', degree: 90, zoneCode: 'E', customLabel: 'Reception' },
          { id: 'r52', roomType: 'master_bedroom', degree: 225, zoneCode: 'SW', customLabel: 'MD Cabin' },
          { id: 'r53', roomType: 'living_room', degree: 0, zoneCode: 'N', customLabel: 'Accounts & Cash Vault' },
        ],
        createdAt: '2026-08-01T15:50:00.000Z',
        userId: 'usr_104',
        userName: 'Vikram Singh',
        userEmail: 'vikram.builders@delhi.co.in',
        userPhone: '+91 98100 44556',
        paymentReceiptNo: 'REC-2026-992',
        paymentStatus: 'paid',
        paymentAmount: 999,
        paymentCurrency: 'INR',
        paymentGateway: 'Razorpay (pay_Rkk882109Z)',
        paymentDate: '2026-08-01 03:45 PM',
        vastuReportNumber: 'RPT-2026-66401',
        reportRefNumber: 'RPT-2026-66401',
        overallScore: 92,
        grade: 'A+',
        doshCount: 0,
        reportDate: '2026-08-01',
        consultationId: 'CNS-2026-3391',
        consultationTopic: 'Managing Director Cabin & Cash Vault Vastu Alignment',
        consultationStatus: 'signed',
        isSigned: true,
        signedByName: 'Pasala P. (Vedic Architect)',
        signedAt: '2026-08-02 04:00 PM',
        signatureDataUrl: 'DIGITAL_SEAL_VERIFIED_PASALA_VEDIC_2026',
        consultationNotes: 'North cash vault opens towards Kuber direction. MD desk faces East with solid South-West back wall.',
      },
    ],
  },
];

export const AdminUserProfilesTab: React.FC<AdminUserProfilesTabProps> = ({
  userList,
  onUpdateUserList,
  onNotify,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedUserUids, setExpandedUserUids] = useState<Set<string>>(
    new Set(['admin_pasala_01', 'usr_adhvik_772'])
  );

  // Selection state for selective bulk export
  const [selectedUserUids, setSelectedUserUids] = useState<Set<string>>(new Set());

  // Modal State for Adding/Editing an Address Record tied to a user
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [selectedUserForAddress, setSelectedUserForAddress] = useState<UserDbProfile | null>(null);
  const [editingProperty, setEditingProperty] = useState<Partial<PropertyRecord> | null>(null);
  const [savingProperty, setSavingProperty] = useState<boolean>(false);

  // Toggle user selection
  const handleToggleSelectUser = (uid: string) => {
    setSelectedUserUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  // Select all or clear selection
  const handleToggleSelectAll = () => {
    if (selectedUserUids.size === filteredUsers.length && filteredUsers.length > 0) {
      setSelectedUserUids(new Set());
    } else {
      setSelectedUserUids(new Set(filteredUsers.map((u) => u.uid)));
    }
  };

  // Bulk Export All Database as CSV
  const handleExportAllCsv = () => {
    playTempleBellChime();
    const csvContent = generateMasterRelationalCsv(userList);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Vastu_Master_Relational_Database_${dateStr}.csv`;
    triggerFileDownload(csvContent, filename, 'text/csv');
    onNotify(`✓ Exported all ${userList.length} user profiles & tied addresses as CSV successfully!`);
  };

  // Bulk Export All Database as JSON
  const handleExportAllJson = () => {
    playTempleBellChime();
    const jsonContent = generateMasterRelationalJson(userList);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Vastu_Master_Relational_Database_${dateStr}.json`;
    triggerFileDownload(jsonContent, filename, 'application/json');
    onNotify(`✓ Exported all ${userList.length} user profiles & tied addresses as complete JSON database!`);
  };

  // Bulk Export Selected Users as CSV
  const handleExportSelectedCsv = () => {
    const selectedList = userList.filter((u) => selectedUserUids.has(u.uid));
    if (selectedList.length === 0) {
      alert('Please select at least one user profile to export.');
      return;
    }
    playTempleBellChime();
    const csvContent = generateMasterRelationalCsv(selectedList);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Vastu_Selected_${selectedList.length}_Users_Database_${dateStr}.csv`;
    triggerFileDownload(csvContent, filename, 'text/csv');
    onNotify(`✓ Exported ${selectedList.length} selected user profiles with tied properties as CSV!`);
  };

  // Bulk Export Selected Users as JSON
  const handleExportSelectedJson = () => {
    const selectedList = userList.filter((u) => selectedUserUids.has(u.uid));
    if (selectedList.length === 0) {
      alert('Please select at least one user profile to export.');
      return;
    }
    playTempleBellChime();
    const jsonContent = generateMasterRelationalJson(selectedList);
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Vastu_Selected_${selectedList.length}_Users_Database_${dateStr}.json`;
    triggerFileDownload(jsonContent, filename, 'application/json');
    onNotify(`✓ Exported ${selectedList.length} selected user profiles as JSON!`);
  };

  // Export Single User Dossier
  const handleExportSingleUser = (user: UserDbProfile) => {
    playTempleBellChime();
    const jsonContent = generateMasterRelationalJson([user]);
    const safeName = (user.name || 'User').replace(/\s+/g, '_');
    const filename = `Vastu_User_Dossier_${safeName}_${user.uid}.json`;
    triggerFileDownload(jsonContent, filename, 'application/json');
    onNotify(`✓ Exported complete profile and address records for ${user.name}!`);
  };

  // Export Single Property Dossier
  const handleExportSinglePropertyCard = (prop: PropertyRecord, user: UserDbProfile) => {
    playTempleBellChime();
    exportSinglePropertyDossier(prop, user);
    onNotify(`✓ Exported property record dossier for "${prop.name}"!`);
  };

  // Toggle user row expansion
  const toggleUserExpansion = (uid: string) => {
    setExpandedUserUids((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) {
        next.delete(uid);
      } else {
        next.add(uid);
      }
      return next;
    });
  };

  // Toggle Pro status for a user
  const handleToggleProStatus = async (uid: string, currentStatus: boolean) => {
    playTempleBellChime();
    const updatedUsers = userList.map((u) =>
      u.uid === uid ? { ...u, isProMember: !currentStatus } : u
    );
    onUpdateUserList(updatedUsers);

    try {
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, { isProMember: !currentStatus }, { merge: true });
      onNotify(`✓ User Pro Pass status ${!currentStatus ? 'GRANTED' : 'REVOKED'} successfully in backend!`);
    } catch {
      onNotify(`✓ User Pro Pass updated locally!`);
    }
  };

  // Open modal to add a new address to a user
  const handleOpenAddAddressModal = (user: UserDbProfile) => {
    setSelectedUserForAddress(user);
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const dateStr = new Date().toISOString().split('T')[0];

    setEditingProperty({
      id: `prop_${Date.now()}`,
      name: `${user.name.split(' ')[0]}'s Vastu Property`,
      address: '',
      addressType: 'manual',
      propertyType: 'Flat/Apartment',
      facingDegree: 90,
      placedRooms: [],
      createdAt: new Date().toISOString(),
      userId: user.uid,
      userName: user.name,
      userEmail: user.email,
      userPhone: user.phone || '+91 ',
      paymentReceiptNo: `REC-2026-${randNum}`,
      paymentStatus: user.isProMember ? 'paid' : 'free_tier',
      paymentAmount: user.isProMember ? 499 : 0,
      paymentCurrency: 'INR',
      paymentGateway: user.isProMember ? 'Google Pay (UPI)' : 'Free Explorer Tier',
      paymentDate: `${dateStr} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      vastuReportNumber: `RPT-2026-${randNum}9`,
      reportRefNumber: `RPT-2026-${randNum}9`,
      overallScore: 85,
      grade: 'A',
      doshCount: 0,
      reportDate: dateStr,
      consultationId: `CNS-2026-${randNum}`,
      consultationTopic: 'Vedic Room Layout & Energy Flow Audit',
      consultationStatus: 'signed',
      isSigned: true,
      signedByName: 'Pasala P. (Vedic Architect & Vastu Shastra Consultant)',
      signedAt: `${dateStr} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      signatureDataUrl: 'DIGITAL_SEAL_VERIFIED_PASALA_VEDIC_2026',
      consultationNotes: 'All primary cardinal orientations aligned with Vedic Vastu principles.',
    });
    setIsEditModalOpen(true);
  };

  // Open modal to edit existing address record
  const handleOpenEditAddressModal = (user: UserDbProfile, prop: PropertyRecord) => {
    setSelectedUserForAddress(user);
    setEditingProperty({ ...prop });
    setIsEditModalOpen(true);
  };

  // Save property address with all tied records to Firestore and local state
  const handleSavePropertyAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProperty || !selectedUserForAddress) return;

    if (!editingProperty.name?.trim() || !editingProperty.address?.trim()) {
      alert('Please enter a Property Name and Actual Street Address.');
      return;
    }

    setSavingProperty(true);
    playTempleBellChime();

    const fullRecord: PropertyRecord = {
      id: editingProperty.id || `prop_${Date.now()}`,
      name: editingProperty.name.trim(),
      address: editingProperty.address.trim(),
      addressType: editingProperty.addressType || 'manual',
      propertyType: editingProperty.propertyType || 'Flat/Apartment',
      facingDegree: Number(editingProperty.facingDegree || 0),
      placedRooms: editingProperty.placedRooms || [],
      createdAt: editingProperty.createdAt || new Date().toISOString(),
      userId: selectedUserForAddress.uid,
      userName: selectedUserForAddress.name,
      userEmail: selectedUserForAddress.email,
      userPhone: editingProperty.userPhone || selectedUserForAddress.phone,
      paymentReceiptNo: editingProperty.paymentReceiptNo?.trim(),
      paymentStatus: editingProperty.paymentStatus || 'paid',
      paymentAmount: Number(editingProperty.paymentAmount || 0),
      paymentCurrency: editingProperty.paymentCurrency || 'INR',
      paymentGateway: editingProperty.paymentGateway || 'Google Pay / Razorpay',
      paymentDate: editingProperty.paymentDate || new Date().toLocaleString(),
      vastuReportNumber: editingProperty.vastuReportNumber?.trim(),
      reportRefNumber: editingProperty.vastuReportNumber?.trim(),
      overallScore: Number(editingProperty.overallScore || 80),
      grade: editingProperty.grade || 'A',
      doshCount: Number(editingProperty.doshCount || 0),
      reportDate: editingProperty.reportDate || new Date().toISOString().split('T')[0],
      consultationId: editingProperty.consultationId?.trim(),
      consultationTopic: editingProperty.consultationTopic?.trim(),
      consultationStatus: editingProperty.consultationStatus || 'signed',
      isSigned: !!editingProperty.isSigned,
      signedByName: editingProperty.signedByName?.trim() || 'Pasala P.',
      signedAt: editingProperty.signedAt?.trim() || new Date().toLocaleString(),
      signatureDataUrl: editingProperty.signatureDataUrl || 'DIGITAL_SEAL_VERIFIED_PASALA_VEDIC_2026',
      consultationNotes: editingProperty.consultationNotes?.trim(),
    };

    // 1. Update in local users state
    const updatedUsers = userList.map((u) => {
      if (u.uid === selectedUserForAddress.uid) {
        const existingProps = u.savedProperties || [];
        const pIdx = existingProps.findIndex((p) => p.id === fullRecord.id);
        let newProps: PropertyRecord[];
        if (pIdx >= 0) {
          newProps = [...existingProps];
          newProps[pIdx] = fullRecord;
        } else {
          newProps = [fullRecord, ...existingProps];
        }
        return {
          ...u,
          savedProperties: newProps,
          savedPropertiesCount: newProps.length,
        };
      }
      return u;
    });

    onUpdateUserList(updatedUsers);

    // 2. Persist to Firestore /properties & /users
    await savePropertyAddressToFirestore(fullRecord);

    setSavingProperty(false);
    setIsEditModalOpen(false);
    setEditingProperty(null);
    onNotify(`✓ Property "${fullRecord.name}" and tied records saved to backend successfully!`);
  };

  // Delete address
  const handleDeleteAddress = async (user: UserDbProfile, propId: string) => {
    if (!confirm('Are you sure you want to delete this property address and all its tied records from the backend?')) {
      return;
    }
    playTempleBellChime();

    const updatedUsers = userList.map((u) => {
      if (u.uid === user.uid) {
        const remaining = (u.savedProperties || []).filter((p) => p.id !== propId);
        return {
          ...u,
          savedProperties: remaining,
          savedPropertiesCount: remaining.length,
        };
      }
      return u;
    });

    onUpdateUserList(updatedUsers);
    await deletePropertyAddressFromFirestore(propId, user.uid);
    onNotify(`✓ Property address deleted from database.`);
  };

  // Filter users based on query matching name, email, address, receipt, report, or consultation topic
  const filteredUsers = userList.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = (u.name || '').toLowerCase().includes(q);
    const emailMatch = (u.email || '').toLowerCase().includes(q);
    const phoneMatch = (u.phone || '').toLowerCase().includes(q);

    const addressMatch = (u.savedProperties || []).some(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.address || '').toLowerCase().includes(q) ||
        (p.paymentReceiptNo || '').toLowerCase().includes(q) ||
        (p.vastuReportNumber || '').toLowerCase().includes(q) ||
        (p.consultationTopic || '').toLowerCase().includes(q) ||
        (p.signedByName || '').toLowerCase().includes(q)
    );

    return nameMatch || emailMatch || phoneMatch || addressMatch;
  });

  return (
    <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-xs space-y-5">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8DCC4] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]">
              Relational Backend Database
            </span>
            <span className="text-xs text-[#8B735B] font-mono">
              {userList.length} User Profiles •{' '}
              {userList.reduce((acc, u) => acc + (u.savedProperties?.length || u.savedPropertiesCount || 0), 0)} Tied Addresses
            </span>
          </div>
          <h3 className="text-xl font-serif font-bold text-[#78350F] mt-1 flex items-center gap-2">
            <User className="w-5 h-5 text-[#D97706]" /> User Profiles & Tied Property Address Database
          </h3>
          <p className="text-xs text-[#8B735B]">
            Every property address is stored in the database backend tied with user contact details, payment receipts, Vastu report numbers, and digital consultation signing certificates.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#A68A64]" />
          <input
            type="text"
            placeholder="Search by User, Address, Receipt #, Report #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-medium bg-[#FAF7F2] border border-[#E8DCC4] rounded-xl p-2.5 pl-9 outline-none focus:ring-2 focus:ring-[#D97706]"
          />
        </div>
      </div>

      {/* EXPORT OPTIONS & BULK EXPORT TOOLBAR */}
      <div className="bg-gradient-to-r from-[#FAF7F2] via-[#FFFBEB] to-[#FAF7F2] p-4 rounded-2xl border border-[#E8DCC4] flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#78350F] text-white rounded-xl shadow-2xs">
            <Download className="w-4 h-4 text-[#FDE68A]" />
          </div>
          <div>
            <div className="text-xs font-serif font-bold text-[#78350F] flex items-center gap-2">
              <span>Database Export & Bulk Extraction</span>
              {selectedUserUids.size > 0 && (
                <span className="px-2 py-0.2 bg-[#D97706] text-white rounded-full text-[10px] font-mono font-bold animate-pulse">
                  {selectedUserUids.size} Selected
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#8B735B]">
              Extract full relational tables with User details, tied Street Addresses, Receipts, Vastu Reports & Consultations.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedUserUids.size > 0 ? (
            <>
              <button
                onClick={handleExportSelectedCsv}
                title="Export selected users & tied properties as CSV"
                className="px-3.5 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Selected ({selectedUserUids.size}) CSV</span>
              </button>
              <button
                onClick={handleExportSelectedJson}
                title="Export selected users as JSON"
                className="px-3 py-2 bg-[#78350F] hover:bg-[#5C280B] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5 text-[#FDE68A]" />
                <span>Selected JSON</span>
              </button>
              <button
                onClick={() => setSelectedUserUids(new Set())}
                className="px-2.5 py-2 bg-white hover:bg-gray-100 border border-[#E8DCC4] text-[#8B735B] rounded-xl text-xs font-bold transition-all"
              >
                Clear
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleExportAllCsv}
                title="Bulk Export Entire Relational Database to CSV (Excel format)"
                className="px-4 py-2 bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065F46] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Bulk Export CSV (Excel)</span>
              </button>
              <button
                onClick={handleExportAllJson}
                title="Bulk Export Entire Relational Database to structured JSON format"
                className="px-4 py-2 bg-[#78350F] hover:bg-[#5C280B] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2"
              >
                <Download className="w-4 h-4 text-[#FDE68A]" />
                <span>Bulk Export JSON</span>
              </button>
              <button
                onClick={handleToggleSelectAll}
                title="Toggle Select All Users for Custom Export"
                className="px-3 py-2 bg-white hover:bg-[#FFFBEB] border border-[#E8DCC4] text-[#78350F] rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <CheckSquare className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Select All ({filteredUsers.length})</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Users & Addresses Master Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E8DCC4] text-[#8B735B] uppercase text-[10px] font-bold">
              <th className="p-3.5 w-10 text-center">
                <button
                  onClick={handleToggleSelectAll}
                  title={selectedUserUids.size === filteredUsers.length ? 'Deselect All' : 'Select All'}
                  className="text-[#78350F] hover:text-[#D97706] transition-colors"
                >
                  {selectedUserUids.size === filteredUsers.length && filteredUsers.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-[#D97706]" />
                  ) : (
                    <Square className="w-4 h-4 text-[#A68A64]" />
                  )}
                </button>
              </th>
              <th className="p-3.5">User / Contact Details</th>
              <th className="p-3.5">Account Role</th>
              <th className="p-3.5">Vastu Pro Pass</th>
              <th className="p-3.5">Saved Property Addresses</th>
              <th className="p-3.5">Registered Date</th>
              <th className="p-3.5 text-right">Actions & Export</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8DCC4]">
            {filteredUsers.map((user, idx) => {
              const isExpanded = expandedUserUids.has(user.uid);
              const isSelected = selectedUserUids.has(user.uid);
              const propertiesCount = user.savedProperties?.length ?? (user.savedPropertiesCount || 0);
              const propsList = user.savedProperties || [];

              return (
                <React.Fragment key={user.uid || user.email || `usr_${idx}`}>
                  <tr className={`hover:bg-[#FFFBEB]/60 transition-colors ${isExpanded ? 'bg-[#FFFBEB]/30' : ''} ${isSelected ? 'bg-amber-50/70' : ''}`}>
                    {/* Checkbox for selective bulk export */}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => handleToggleSelectUser(user.uid)}
                        className="text-[#78350F] hover:text-[#D97706] transition-colors"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[#D97706]" />
                        ) : (
                          <Square className="w-4 h-4 text-[#A68A64]" />
                        )}
                      </button>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#D97706] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                          {(user.name || 'U').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[#78350F] font-bold text-sm flex items-center gap-1.5">
                            <span>{user.name}</span>
                            {user.role === 'admin' && (
                              <span className="px-1.5 py-0.2 bg-[#78350F] text-white text-[9px] font-extrabold rounded">
                                ADMIN
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-[#8B735B] font-mono flex items-center gap-1">
                            <Mail className="w-3 h-3 text-[#A68A64]" />
                            {user.email}
                          </div>
                          {user.phone && (
                            <div className="text-[10px] text-[#A68A64] font-mono flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" />
                              {user.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin'
                            ? 'bg-[#78350F] text-white'
                            : 'bg-[#F3EFE0] text-[#78350F] border border-[#E8DCC4]'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 ${
                          user.isProMember
                            ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}
                      >
                        {user.isProMember ? <CheckCircle2 className="w-3 h-3" /> : null}
                        {user.isProMember ? 'PRO ACTIVE' : 'FREE USER'}
                      </span>
                    </td>

                    {/* Saved Property Addresses Column with Interactive Toggle */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleUserExpansion(user.uid)}
                          className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F3EFE0] border border-[#E8DCC4] rounded-xl text-xs font-bold text-[#78350F] flex items-center gap-1.5 transition-all shadow-2xs group"
                        >
                          <Building2 className="w-3.5 h-3.5 text-[#D97706]" />
                          <span>{propertiesCount} {propertiesCount === 1 ? 'Address' : 'Addresses'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#8B735B]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-[#8B735B]" />
                          )}
                        </button>
                        <button
                          onClick={() => handleOpenAddAddressModal(user)}
                          title="Add New Address to this User"
                          className="p-1.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] border border-[#FDE68A] text-[#D97706] rounded-lg transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    <td className="p-3.5 text-[11px] text-[#8B735B]">
                      {user.createdAt ? user.createdAt.split('T')[0] : '01/08/2026'}
                    </td>

                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => handleExportSingleUser(user)}
                        title="Export this user's profile and tied address records (JSON)"
                        className="px-2.5 py-1.5 bg-[#FAF7F2] hover:bg-[#F3EFE0] border border-[#E8DCC4] text-[#78350F] rounded-xl text-[10px] font-bold inline-flex items-center gap-1 transition-all shadow-2xs"
                      >
                        <Download className="w-3 h-3 text-[#D97706]" />
                        <span>Export</span>
                      </button>
                      <button
                        onClick={() => handleToggleProStatus(user.uid, user.isProMember)}
                        className={`px-2.5 py-1.5 text-[10px] font-bold uppercase rounded-xl transition-all shadow-2xs ${
                          user.isProMember
                            ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-[#78350F] hover:bg-[#5C280B] text-white'
                        }`}
                      >
                        {user.isProMember ? 'Revoke Pro' : 'Grant Pro'}
                      </button>
                    </td>
                  </tr>

                  {/* EXPANDED TIED PROPERTY ADDRESSES & VASTU DOSSIER PANEL */}
                  {isExpanded && (
                    <tr className="bg-[#FAF7F2]/80 border-b border-[#E8DCC4]">
                      <td colSpan={7} className="p-4 sm:p-5">
                        <div className="bg-white p-5 rounded-2xl border border-[#E8DCC4] shadow-sm space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8DCC4] pb-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-[#D97706]" />
                              <h4 className="text-sm font-serif font-bold text-[#78350F]">
                                Property Addresses & Tied Records for {user.name}
                              </h4>
                              <span className="text-[10px] font-mono bg-[#FFFBEB] text-[#D97706] px-2 py-0.5 rounded-full border border-[#FEF3C7]">
                                {propsList.length} Registered in Database
                              </span>
                            </div>
                            <button
                              onClick={() => handleOpenAddAddressModal(user)}
                              className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
                            >
                              <Plus className="w-3.5 h-3.5" /> Link New Property Address
                            </button>
                          </div>

                          {propsList.length === 0 ? (
                            <div className="text-center py-6 text-xs text-[#8B735B] bg-[#FAF7F2] rounded-xl border border-dashed border-[#E8DCC4]">
                              No property addresses saved yet for this user. Click &quot;Link New Property Address&quot; above to add one.
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {propsList.map((prop, pIdx) => (
                                <div
                                  key={prop.id || `prop_${pIdx}`}
                                  className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DCC4] space-y-3.5 relative hover:border-[#D97706] transition-all shadow-2xs"
                                >
                                  {/* Property Header */}
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-[#78350F] text-white">
                                          {prop.propertyType || 'Residential'}
                                        </span>
                                        <span className="text-[10px] font-bold text-[#D97706] flex items-center gap-1">
                                          <Compass className="w-3 h-3" />
                                          Facing: {prop.facingDegree || 0}°
                                        </span>
                                      </div>
                                      <h5 className="font-serif font-bold text-sm text-[#78350F] mt-1">
                                        {prop.name}
                                      </h5>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <button
                                        onClick={() => handleExportSinglePropertyCard(prop, user)}
                                        title="Export this property record dossier (JSON)"
                                        className="p-1.5 bg-white hover:bg-[#FFFBEB] border border-[#E8DCC4] text-[#D97706] rounded-lg transition-all"
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleOpenEditAddressModal(user, prop)}
                                        title="Edit Address & Tied Records"
                                        className="p-1.5 bg-white hover:bg-[#FFFBEB] border border-[#E8DCC4] text-[#78350F] rounded-lg transition-all"
                                      >
                                        <Edit3 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteAddress(user, prop.id)}
                                        title="Delete Property Address"
                                        className="p-1.5 bg-white hover:bg-rose-50 border border-[#E8DCC4] text-rose-600 rounded-lg transition-all"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Actual Property Address */}
                                  <div className="p-2.5 bg-white rounded-xl border border-[#E8DCC4] text-xs space-y-1">
                                    <div className="text-[10px] font-bold uppercase text-[#8B735B] flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-[#D97706]" /> Actual Property Address:
                                    </div>
                                    <div className="font-medium text-[#3D342D] leading-snug">
                                      {prop.address || 'Address not specified'}
                                    </div>
                                    {prop.coordinates && (
                                      <div className="text-[10px] font-mono text-[#8B735B]">
                                        GPS: {prop.coordinates.lat.toFixed(4)}° N, {prop.coordinates.lng.toFixed(4)}° E
                                      </div>
                                    )}
                                  </div>

                                  {/* TIED RECORDS: Payment Receipt, Vastu Report, Consultation Signing */}
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                                    {/* 1. Payment Receipt */}
                                    <div className="p-2.5 bg-white rounded-xl border border-[#E8DCC4] space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase text-[#8B735B] flex items-center gap-1">
                                          <Receipt className="w-3 h-3 text-[#059669]" /> Payment Receipt:
                                        </span>
                                        <span
                                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                            prop.paymentStatus === 'paid'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-gray-100 text-gray-600'
                                          }`}
                                        >
                                          {prop.paymentStatus === 'paid' ? 'PAID' : 'FREE TIER'}
                                        </span>
                                      </div>
                                      <div className="font-mono font-bold text-[#065F46] text-[11px]">
                                        {prop.paymentReceiptNo || 'N/A'}
                                      </div>
                                      <div className="text-[10px] text-[#8B735B] truncate">
                                        ₹{prop.paymentAmount || 0} • {prop.paymentGateway || 'Standard'}
                                      </div>
                                      {prop.paymentDate && (
                                        <div className="text-[9px] text-[#A68A64]">{prop.paymentDate}</div>
                                      )}
                                    </div>

                                    {/* 2. Vastu Report Number */}
                                    <div className="p-2.5 bg-white rounded-xl border border-[#E8DCC4] space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold uppercase text-[#8B735B] flex items-center gap-1">
                                          <FileText className="w-3 h-3 text-[#2563EB]" /> Vastu Report Ref:
                                        </span>
                                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-blue-100 text-blue-800">
                                          Score: {prop.overallScore || 80}% ({prop.grade || 'A'})
                                        </span>
                                      </div>
                                      <div className="font-mono font-bold text-[#1E40AF] text-[11px]">
                                        {prop.vastuReportNumber || prop.reportRefNumber || 'N/A'}
                                      </div>
                                      <div className="text-[10px] text-[#8B735B]">
                                        {prop.placedRooms?.length || 0} Placed Rooms • {prop.doshCount || 0} Dosh
                                      </div>
                                      {prop.reportDate && (
                                        <div className="text-[9px] text-[#A68A64]">Issued: {prop.reportDate}</div>
                                      )}
                                    </div>
                                  </div>

                                  {/* 3. Consultation Details & Digital Signing Certificate */}
                                  <div className="p-2.5 bg-gradient-to-r from-[#FFFBEB] to-[#FAF7F2] rounded-xl border border-[#FEF3C7] text-xs space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] font-bold uppercase text-[#78350F] flex items-center gap-1">
                                        <PenTool className="w-3 h-3 text-[#D97706]" /> Consultation & Digital Signing:
                                      </span>
                                      <span
                                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase flex items-center gap-1 ${
                                          prop.isSigned
                                            ? 'bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]'
                                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                                        }`}
                                      >
                                        <ShieldCheck className="w-3 h-3" />
                                        {prop.isSigned ? 'SIGNED & CERTIFIED' : 'PENDING SIGNATURE'}
                                      </span>
                                    </div>

                                    {prop.consultationTopic && (
                                      <div className="font-bold text-[#78350F] text-[11px]">
                                        Topic: {prop.consultationTopic}
                                      </div>
                                    )}

                                    <div className="flex items-center justify-between text-[10px] text-[#8B735B] pt-0.5 border-t border-[#FEF3C7]">
                                      <span>
                                        Signed By: <strong className="text-[#3D342D]">{prop.signedByName || 'Pasala P.'}</strong>
                                      </span>
                                      <span className="font-mono text-[9px]">{prop.signedAt || '2026-08-15'}</span>
                                    </div>

                                    {prop.consultationNotes && (
                                      <p className="text-[10px] text-[#8B735B] italic leading-tight bg-white/80 p-1.5 rounded-lg border border-[#E8DCC4]">
                                        &ldquo;{prop.consultationNotes}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* MODAL: ADD / EDIT PROPERTY ADDRESS WITH TIED BACKEND RECORDS */}
      {isEditModalOpen && editingProperty && selectedUserForAddress && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in">
          <div className="bg-[#FAF7F2] w-full max-w-2xl rounded-3xl border-2 border-[#E8DCC4] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            {/* Modal Header */}
            <div className="bg-[#78350F] text-white p-4 sm:p-5 flex items-center justify-between border-b border-[#5C280B]">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-5 h-5 text-[#D97706]" />
                <div>
                  <h3 className="text-base font-serif font-bold leading-tight">
                    Link Property Address & Tied Records
                  </h3>
                  <p className="text-[10px] text-[#E8DCC4] uppercase tracking-wider">
                    User: {selectedUserForAddress.name} ({selectedUserForAddress.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#5C280B] text-[#E8DCC4] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePropertyAddress} className="p-5 space-y-4 overflow-y-auto text-xs">
              {/* 1. Property Name & Actual Address */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] space-y-3 shadow-2xs">
                <h4 className="font-serif font-bold text-[#78350F] flex items-center gap-1.5 text-sm">
                  <MapPin className="w-4 h-4 text-[#D97706]" /> Property Details & Actual Address
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Property Name / Label</label>
                    <input
                      type="text"
                      required
                      value={editingProperty.name || ''}
                      onChange={(e) => setEditingProperty({ ...editingProperty, name: e.target.value })}
                      placeholder="e.g. Sri Venkateswara Nilayam"
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] font-semibold outline-none focus:ring-2 focus:ring-[#D97706]"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Property Type</label>
                    <select
                      value={editingProperty.propertyType || 'Flat/Apartment'}
                      onChange={(e) =>
                        setEditingProperty({
                          ...editingProperty,
                          propertyType: e.target.value as PropertyRecord['propertyType'],
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] font-semibold outline-none focus:ring-2 focus:ring-[#D97706]"
                    >
                      <option value="Flat/Apartment">Flat / Apartment</option>
                      <option value="Independent House">Independent House</option>
                      <option value="Villa">Villa / Bungalow</option>
                      <option value="Commercial Office">Commercial Office</option>
                      <option value="Plot">Plot / Land</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[#8B735B] font-bold mb-1">
                    Actual Property Street Address, City, State & Pincode
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={editingProperty.address || ''}
                    onChange={(e) => setEditingProperty({ ...editingProperty, address: e.target.value })}
                    placeholder="e.g. Plot No. 48, Road No. 12, Banjara Hills, Hyderabad, Telangana 500034"
                    className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] outline-none focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Facing Direction / Degrees</label>
                    <input
                      type="number"
                      min={0}
                      max={359}
                      value={editingProperty.facingDegree || 0}
                      onChange={(e) =>
                        setEditingProperty({ ...editingProperty, facingDegree: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">User Contact Phone</label>
                    <input
                      type="text"
                      value={editingProperty.userPhone || ''}
                      onChange={(e) => setEditingProperty({ ...editingProperty, userPhone: e.target.value })}
                      placeholder="+91 98480 12345"
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] font-mono outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Tied Payment Receipt Details */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] space-y-3 shadow-2xs">
                <h4 className="font-serif font-bold text-[#78350F] flex items-center gap-1.5 text-sm">
                  <Receipt className="w-4 h-4 text-[#059669]" /> Tied Payment Receipt
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Payment Receipt Number</label>
                    <input
                      type="text"
                      value={editingProperty.paymentReceiptNo || ''}
                      onChange={(e) =>
                        setEditingProperty({ ...editingProperty, paymentReceiptNo: e.target.value })
                      }
                      placeholder="e.g. REC-2026-99214"
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] font-mono font-bold text-[#065F46] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Payment Status</label>
                    <select
                      value={editingProperty.paymentStatus || 'paid'}
                      onChange={(e) =>
                        setEditingProperty({
                          ...editingProperty,
                          paymentStatus: e.target.value as any,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] font-semibold outline-none"
                    >
                      <option value="paid">PAID (Completed)</option>
                      <option value="free_tier">Free Tier Audit</option>
                      <option value="pro_unlocked">Pro Unlocked</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Payment Gateway / Method</label>
                    <input
                      type="text"
                      value={editingProperty.paymentGateway || ''}
                      onChange={(e) =>
                        setEditingProperty({ ...editingProperty, paymentGateway: e.target.value })
                      }
                      placeholder="e.g. Google Pay / Razorpay"
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Tied Vastu Audit Report Number */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] space-y-3 shadow-2xs">
                <h4 className="font-serif font-bold text-[#78350F] flex items-center gap-1.5 text-sm">
                  <FileText className="w-4 h-4 text-[#2563EB]" /> Tied Vastu Report Number
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Vastu Report Reference #</label>
                    <input
                      type="text"
                      value={editingProperty.vastuReportNumber || ''}
                      onChange={(e) =>
                        setEditingProperty({ ...editingProperty, vastuReportNumber: e.target.value })
                      }
                      placeholder="e.g. RPT-2026-881902"
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] font-mono font-bold text-[#1E40AF] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Audit Score (0 - 100)</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={editingProperty.overallScore || 85}
                      onChange={(e) =>
                        setEditingProperty({ ...editingProperty, overallScore: Number(e.target.value) })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Audit Grade</label>
                    <select
                      value={editingProperty.grade || 'A'}
                      onChange={(e) => setEditingProperty({ ...editingProperty, grade: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] font-bold outline-none"
                    >
                      <option value="A+">A+ (Supreme Auspicious)</option>
                      <option value="A">A (Highly Auspicious)</option>
                      <option value="B+">B+ (Moderate Balance)</option>
                      <option value="B">B (Remedies Required)</option>
                      <option value="C">C (Major Doshas)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 4. Tied Consultation & Digital Signing Details */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] space-y-3 shadow-2xs">
                <h4 className="font-serif font-bold text-[#78350F] flex items-center gap-1.5 text-sm">
                  <PenTool className="w-4 h-4 text-[#D97706]" /> Tied Consultation & Digital Signing Certificate
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Consultation Topic / Scope</label>
                    <input
                      type="text"
                      value={editingProperty.consultationTopic || ''}
                      onChange={(e) =>
                        setEditingProperty({ ...editingProperty, consultationTopic: e.target.value })
                      }
                      placeholder="e.g. Master Bedroom & Pooja Room Vastu Verification"
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] font-semibold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Digital Signing Status</label>
                    <select
                      value={editingProperty.isSigned ? 'signed' : 'pending'}
                      onChange={(e) =>
                        setEditingProperty({
                          ...editingProperty,
                          isSigned: e.target.value === 'signed',
                          consultationStatus: e.target.value as any,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] font-bold outline-none"
                    >
                      <option value="signed">✓ SIGNED & CERTIFIED (Digital Seal Validated)</option>
                      <option value="pending">⏳ PENDING SIGNATURE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Signed By (Vedic Consultant / Admin)</label>
                    <input
                      type="text"
                      value={editingProperty.signedByName || ''}
                      onChange={(e) =>
                        setEditingProperty({ ...editingProperty, signedByName: e.target.value })
                      }
                      placeholder="Pasala P. (Vedic Architect & Vastu Shastra Consultant)"
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[#8B735B] font-bold mb-1">Signed Timestamp</label>
                    <input
                      type="text"
                      value={editingProperty.signedAt || ''}
                      onChange={(e) =>
                        setEditingProperty({ ...editingProperty, signedAt: e.target.value })
                      }
                      placeholder="2026-08-15 10:45 AM"
                      className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[#8B735B] font-bold mb-1">Consultation Inquiry / User Problem Details</label>
                  <textarea
                    rows={2}
                    value={(editingProperty as any).consultationQuestion || ''}
                    onChange={(e) =>
                      setEditingProperty({ ...editingProperty, consultationQuestion: e.target.value } as any)
                    }
                    placeholder="e.g. Main entrance door is East facing. Need remedy for energy flow."
                    className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[#8B735B] font-bold mb-1">Consultation Advice / Vastu Notes</label>
                  <textarea
                    rows={2}
                    value={editingProperty.consultationNotes || ''}
                    onChange={(e) =>
                      setEditingProperty({ ...editingProperty, consultationNotes: e.target.value })
                    }
                    placeholder="e.g. ईशान (North-East) sacred water element and अग्नेय (South-East) kitchen layout fully compliant."
                    className="w-full p-2.5 rounded-xl border border-[#E8DCC4] bg-[#FAF7F2] outline-none"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-[#52463C] rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingProperty}
                  className="px-6 py-2.5 bg-gradient-to-r from-[#D97706] to-[#B45309] hover:from-[#B45309] hover:to-[#78350F] text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-2"
                >
                  <Save className={`w-4 h-4 ${savingProperty ? 'animate-spin' : ''}`} />
                  {savingProperty ? 'Saving to Database...' : 'Save & Link to Address Backend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
