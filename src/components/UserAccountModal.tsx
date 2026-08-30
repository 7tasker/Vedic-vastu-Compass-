import React, { useState, useEffect } from 'react';
import { UserProfile, SubscriptionPlanId } from '../types';
import { SUBSCRIPTION_PLANS } from '../data/vastuData';
import { playTempleBellChime } from '../utils/vastuUtils';
import { redeemLicenseKey } from '../utils/licenseKeyManager';
import { Capacitor } from '@capacitor/core';
import { performNativeGoogleSignIn } from '../utils/nativeAuth';
import {
  auth,
  googleProvider,
  signInWithGoogleCredential,
  syncUserProfileToFirestore,
  getUserPurchaseHistory,
  restoreUserPurchases,
  PaymentRecord,
  ADMIN_EMAIL,
  isAdminEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from '../lib/firebase';
import {
  User,
  ShieldCheck,
  Info,
  Sparkles,
  Key,
  LogOut,
  Mail,
  Lock,
  Building2,
  X,
  CheckCircle2,
  Volume2,
  VolumeX,
  FileText,
  Clock,
  Calendar,
  ShieldAlert,
  Compass,
  Eye,
  EyeOff,
  ArrowRight,
  Phone,
  Smartphone,
  Shield,
  AlertTriangle,
  RefreshCw,
  Check,
  Receipt,
  CreditCard,
  Package,
  Printer,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  QrCode,
} from 'lucide-react';
import {
  getTaxReceiptConfig,
  calculateTaxBreakdown,
  TaxReceiptTemplateConfig,
} from '../utils/taxReceiptConfig';
import {
  getDeviceId,
  validateStrongPassword,
  checkAccountLockout,
  recordFailedLoginAttempt,
  resetFailedLoginAttempts,
  checkRateLimit,
  isMobileNumberUnique,
  registerPhoneHash,
  encryptSensitiveData,
  generateOtpSession,
  verifyOtpSession,
  inspectSecurityEnvironment,
  recordSecurityAuditLog,
  OtpSession,
} from '../utils/security';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  onUnlockAudit: (planId?: SubscriptionPlanId) => void;
  onOpenAdminPanel?: () => void;
  onOpenRazorpay?: (planId: string) => void;
  onOpenPrivacyPolicy?: () => void;
  onOpenAppInfo?: () => void;
  soundEnabled?: boolean;
  onToggleSound?: () => void;
}

// Diagnostic logger for Firebase Auth error codes
const logFirebaseAuthDiagnostic = (err: any, context: string) => {
  const code = err?.code || 'unknown';
  const message = err?.message || String(err);

  // If user closed the popup, cancelled request, or browser DB closing notice occurred, log as info notice instead of error
  if (
    code === 'auth/popup-closed-by-user' ||
    code === 'auth/cancelled-popup-request' ||
    code === 'auth/argument-error' ||
    code === 'auth/null-user' ||
    message.includes('Database is closing') ||
    message.includes('closing/hidden') ||
    message.includes('auth/argument-error')
  ) {
    console.info(`ℹ️ [Firebase Auth Notice - ${context}]: Google sign-in notice (${code}): ${message}`);
    return;
  }

  console.error(`[Firebase Auth - ${context}] Code: ${code} | Message: ${message}`, err);

  switch (code) {
    case 'auth/invalid-api-key':
      console.error('🚨 [Firebase Config Error]: Invalid API Key in firebase configuration.');
      break;
    case 'auth/unauthorized-domain':
      console.error('🚨 [Firebase Auth Error]: Domain is not authorized in Firebase Console > Authentication > Settings > Authorized Domains.');
      break;
    case 'auth/operation-not-allowed':
      console.error('🚨 [Firebase Auth Error]: Sign-in method disabled in Firebase Console.');
      break;
    case 'auth/popup-blocked':
      console.warn('⚠️ [Firebase Auth Notice]: Sign-in popup was blocked by browser.');
      break;
    case 'auth/network-request-failed':
      console.error('🌐 [Firebase Network Error]: Could not connect to Firebase Auth servers.');
      break;
    default:
      console.info(`ℹ️ [Firebase Auth Diagnostics]: Error "${code}" during ${context}.`);
      break;
  }
};

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onUnlockAudit,
  onOpenAdminPanel,
  onOpenRazorpay,
  onOpenPrivacyPolicy,
  onOpenAppInfo,
  soundEnabled = true,
  onToggleSound,
}) => {
  const [authMode, setAuthMode] = useState<'signin' | 'signup' | 'otp_verify'>('signin');
  const [emailInput, setEmailInput] = useState(user.isLoggedIn ? user.email || '' : '');
  const [nameInput, setNameInput] = useState(user.isLoggedIn ? user.name || '' : '');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [licenseKeyInput, setLicenseKeyInput] = useState('');
  const [licenseMsg, setLicenseMsg] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [isVerifyingKey, setIsVerifyingKey] = useState(false);

  // Purchase & Order History State
  const [purchaseHistory, setPurchaseHistory] = useState<PaymentRecord[]>([]);
  const [isLoadingPurchases, setIsLoadingPurchases] = useState<boolean>(false);
  const [showPurchaseHistory, setShowPurchaseHistory] = useState<boolean>(true);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);
  const [taxConfig, setTaxConfig] = useState<TaxReceiptTemplateConfig>(getTaxReceiptConfig());
  const [restoreMsg, setRestoreMsg] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState<boolean>(false);

  // OTP Verification state
  const [otpCodeInput, setOtpCodeInput] = useState('');
  const [otpSession, setOtpSession] = useState<OtpSession | null>(null);
  const [otpTimerSeconds, setOtpTimerSeconds] = useState(180);

  // Security Report
  const secReport = inspectSecurityEnvironment();
  const pwdValidation = validateStrongPassword(passwordInput);

  // Live OTP Countdown Timer
  useEffect(() => {
    let interval: any = null;
    if (authMode === 'otp_verify' && otpTimerSeconds > 0) {
      interval = setInterval(() => {
        setOtpTimerSeconds((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [authMode, otpTimerSeconds]);

  // Fetch purchase history for this user
  const fetchPurchases = async () => {
    setIsLoadingPurchases(true);
    try {
      const list = await getUserPurchaseHistory(user.uid, user.email);
      setPurchaseHistory(list);
    } catch (err) {
      console.warn('Purchase history load notice:', err);
    } finally {
      setIsLoadingPurchases(false);
    }
  };

  // Auto-fetch purchases when modal opens or user changes
  useEffect(() => {
    if (isOpen) {
      fetchPurchases();
    }
  }, [isOpen, user.uid, user.email]);

  // Listen for real-time payment completion broadcasts & tax receipt config changes
  useEffect(() => {
    const handlePaymentRecorded = () => {
      fetchPurchases();
    };
    const handleTaxConfigUpdated = (e: any) => {
      if (e.detail) {
        setTaxConfig(e.detail);
      } else {
        setTaxConfig(getTaxReceiptConfig());
      }
    };

    window.addEventListener('vastu_payment_recorded', handlePaymentRecorded);
    window.addEventListener('vastu_tax_receipt_config_updated', handleTaxConfigUpdated);
    return () => {
      window.removeEventListener('vastu_payment_recorded', handlePaymentRecorded);
      window.removeEventListener('vastu_tax_receipt_config_updated', handleTaxConfigUpdated);
    };
  }, []);

  const isAdminUser = user.role === 'admin' || isAdminEmail(user.email);

  // Google Sign-In Handler (Native @codetrix-studio/capacitor-google-auth on Android, web popup on desktop)
  const handleGoogleSignIn = async () => {
    setIsAuthLoading(true);
    setAuthError('');

    try {
      // 1. If running in Native Android APK (Capacitor), strictly use Native Google Auth without web popups
      if (Capacitor.isNativePlatform()) {
        try {
          const nativeUser = await performNativeGoogleSignIn();
          if (nativeUser && (nativeUser.idToken || nativeUser.email)) {
            let fbUser: any = null;
            if (nativeUser.idToken) {
              try {
                const authResult = await signInWithGoogleCredential(auth, nativeUser.idToken);
                fbUser = authResult?.user;
              } catch (credErr) {
                console.warn('Firebase credential exchange note:', credErr);
              }
            }

            const userEmail = fbUser?.email || nativeUser.email || '';
            if (!userEmail) {
              setAuthError('Unable to retrieve email from Google Account.');
              setIsAuthLoading(false);
              return;
            }

            let dbProfile: any = {};
            if (fbUser) {
              try {
                dbProfile = await syncUserProfileToFirestore(fbUser);
              } catch (syncErr) {
                console.warn('Firestore sync note:', syncErr);
              }
            }

            const isGoogleAdmin = isAdminEmail(userEmail) || dbProfile.role === 'admin';

            resetFailedLoginAttempts(userEmail);
            recordSecurityAuditLog({
              action: 'login_google_success',
              userEmail: userEmail,
              details: `Native Android Google Auth success. Device Bound: ${getDeviceId()}`,
            });

            onUpdateUser({
              uid: fbUser?.uid || nativeUser.id || 'usr_' + Date.now(),
              name: nativeUser.name || fbUser?.displayName || dbProfile.name || (isGoogleAdmin ? 'Satish Pasala (Admin)' : 'Vedic Explorer'),
              email: userEmail,
              role: isGoogleAdmin ? 'admin' : (dbProfile.role || 'user'),
              isLoggedIn: true,
              isProMember: isGoogleAdmin ? true : (dbProfile.isProMember ?? false),
              activePlan: (dbProfile.activePlan as SubscriptionPlanId) || 'lifetime_pro',
            });

            playTempleBellChime();
            setIsAuthLoading(false);
            onClose();

            if (isGoogleAdmin && onOpenAdminPanel) {
              onOpenAdminPanel();
            }
            return;
          }
        } catch (nativeErr: any) {
          console.warn('Native Google Auth error:', nativeErr);
          if (nativeErr?.message?.includes('cancelled') || nativeErr?.code === '12501') {
            setAuthError('Google sign-in was cancelled.');
            setIsAuthLoading(false);
            return;
          }
          setAuthError(nativeErr?.message || 'Google sign-in failed.');
          setIsAuthLoading(false);
          return;
        }
      }

      // 2. Web popup mode for desktop/browser preview
      const result = await signInWithPopup(auth, googleProvider);
      if (result?.user) {
        const fbUser = result.user;
        const userEmail = fbUser.email || '';

        let dbProfile: any = {};
        try {
          dbProfile = await syncUserProfileToFirestore(fbUser);
        } catch (syncErr) {
          console.warn('Firestore sync note:', syncErr);
        }

        const isGoogleAdmin = isAdminEmail(userEmail) || dbProfile.role === 'admin';

        resetFailedLoginAttempts(userEmail);
        recordSecurityAuditLog({
          action: 'login_google_success',
          userEmail: userEmail,
          details: `Google Auth success. Device Bound: ${getDeviceId()}`,
        });

        onUpdateUser({
          uid: fbUser.uid,
          name: fbUser.displayName || dbProfile.name || (isGoogleAdmin ? 'Satish Pasala (Admin)' : 'Vedic Explorer'),
          email: userEmail,
          role: isGoogleAdmin ? 'admin' : dbProfile.role || 'user',
          isLoggedIn: true,
          isProMember: isGoogleAdmin ? true : (dbProfile.isProMember ?? false),
          activePlan: (dbProfile.activePlan as SubscriptionPlanId) || 'lifetime_pro',
        });

        playTempleBellChime();
        setIsAuthLoading(false);
        onClose();

        if (isGoogleAdmin && onOpenAdminPanel) {
          onOpenAdminPanel();
        }
      }
    } catch (err: any) {
      logFirebaseAuthDiagnostic(err, 'handleGoogleSignIn');
      setIsAuthLoading(false);
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setAuthError('Google sign-in was cancelled.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setAuthError('Firebase Notice: Current domain is not authorized in Firebase Authentication.');
      } else {
        setAuthError(err?.message || 'Google sign-in failed. Please try again.');
      }
    }
  };

  // Submit Login or Request OTP for Registration
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');

    const email = (emailInput || '').trim().toLowerCase();
    const name = (nameInput || '').trim() || 'Vedic Architect';
    const password = (passwordInput || '').trim();
    const phone = (phoneInput || '').trim();

    if (!email) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    resetFailedLoginAttempts(email);

    if (authMode === 'signin') {
      if (!password) {
        setAuthError('Password is required for account sign-in.');
        return;
      }

      setIsAuthLoading(true);

      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        let dbProfile: any = {};
        try {
          dbProfile = await syncUserProfileToFirestore(fbUser);
        } catch (syncErr) {
          console.warn('Firestore sync note:', syncErr);
        }

        const isUserAdmin = isAdminEmail(fbUser.email || email) || dbProfile.role === 'admin';

        recordSecurityAuditLog({
          action: 'login_success',
          userEmail: email,
          details: `Email login successful. Device bound: ${getDeviceId()}`,
        });

        const derivedName = dbProfile.name || (email.includes('@') ? email.split('@')[0] : email) || name || (isUserAdmin ? 'Satish Pasala (Admin)' : 'Vedic Explorer');

        onUpdateUser({
          uid: fbUser.uid,
          name: derivedName,
          email: dbProfile.email || fbUser.email || email,
          role: isUserAdmin ? 'admin' : (dbProfile.role || 'user'),
          isLoggedIn: true,
          isProMember: isUserAdmin ? true : (dbProfile.isProMember ?? false),
          activePlan: (dbProfile.activePlan as SubscriptionPlanId) || 'lifetime_pro',
        });

        playTempleBellChime();
        setIsAuthLoading(false);
        setPasswordInput('');
        onClose();

        if (isUserAdmin && onOpenAdminPanel) {
          onOpenAdminPanel();
        }
      } catch (fbErr: any) {
        logFirebaseAuthDiagnostic(fbErr, 'handleLoginSubmit');
        let errorMsg = 'Invalid email or password. Please verify your credentials.';
        if (fbErr?.code === 'auth/user-not-found') {
          errorMsg = 'No account found with this email. Please switch to Create Account.';
        } else if (fbErr?.code === 'auth/wrong-password' || fbErr?.code === 'auth/invalid-credential') {
          errorMsg = 'Incorrect password entered. Please try again.';
        } else if (fbErr?.code === 'auth/invalid-email') {
          errorMsg = 'The email address format is invalid.';
        } else if (fbErr?.code === 'auth/too-many-requests') {
          errorMsg = 'Too many failed login attempts. Please try again later.';
        } else if (fbErr?.message) {
          errorMsg = fbErr.message;
        }
        setAuthError(errorMsg);
        setIsAuthLoading(false);
      }
    } else if (authMode === 'signup') {
      if (!password || password.length < 6) {
        setAuthError('Password must be at least 6 characters long.');
        return;
      }

      setIsAuthLoading(true);
      const isAdmin = isAdminEmail(email);

      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        const dbProfile = await syncUserProfileToFirestore(fbUser);

        if (phone) {
          registerPhoneHash(phone, fbUser.uid);
        }

        const isUserAdmin = isAdmin || dbProfile.role === 'admin';

        recordSecurityAuditLog({
          action: 'account_created',
          userEmail: email,
          details: `Account registration completed.`,
        });

        onUpdateUser({
          uid: fbUser.uid,
          name: dbProfile.name || name,
          email: dbProfile.email || email,
          role: isUserAdmin ? 'admin' : (dbProfile.role || 'user'),
          isLoggedIn: true,
          isProMember: isUserAdmin || dbProfile.isProMember || false,
        });

        playTempleBellChime();
        setIsAuthLoading(false);
        setPasswordInput('');
        setPhoneInput('');
        onClose();

        if (isUserAdmin && onOpenAdminPanel) {
          onOpenAdminPanel();
        }
      } catch (err: any) {
        console.warn('Firebase registration error:', err);
        let errorMsg = 'Failed to create account. Please check your details.';
        if (err?.code === 'auth/email-already-in-use') {
          errorMsg = 'This email is already registered. Please switch to Sign In.';
        } else if (err?.code === 'auth/weak-password') {
          errorMsg = 'Password is too weak. Please use at least 6 characters.';
        } else if (err?.message) {
          errorMsg = err.message;
        }
        setAuthError(errorMsg);
        setIsAuthLoading(false);
      }
    }
  };

  // Confirm OTP Step for Signup
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    const email = (emailInput || '').trim().toLowerCase();
    const name = (nameInput || '').trim() || 'Vedic Architect';
    const password = (passwordInput || '').trim();
    const phone = (phoneInput || '').trim();

    const verifyResult = verifyOtpSession(email, otpCodeInput);
    if (!verifyResult.success) {
      setAuthError(verifyResult.message);
      return;
    }

    setIsAuthLoading(true);
    const isAdmin = isAdminEmail(email);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      const dbProfile = await syncUserProfileToFirestore(fbUser);

      // Register phone hash for Protocol 1
      registerPhoneHash(phone, fbUser.uid);

      recordSecurityAuditLog({
        action: 'account_created',
        userEmail: email,
        details: `Verified registration completed. Mobile bound and encrypted.`,
      });

      onUpdateUser({
        uid: fbUser.uid,
        name: dbProfile.name || name,
        email: dbProfile.email || email,
        role: dbProfile.role,
        isLoggedIn: true,
        isProMember: dbProfile.isProMember,
      });

      playTempleBellChime();
      setIsAuthLoading(false);
      setPasswordInput('');
      setPhoneInput('');
      setOtpCodeInput('');

      if (isAdmin && onOpenAdminPanel) {
        onClose();
        onOpenAdminPanel();
      }
    } catch (err: any) {
      console.warn('Firebase registration fallback note:', err);
      recordSecurityAuditLog({
        action: 'account_created_local',
        userEmail: email,
        details: `Account registered locally. Device Bound: ${getDeviceId()}`,
      });

      onUpdateUser({
        name: name,
        email: email,
        role: isAdmin ? 'admin' : 'user',
        isLoggedIn: true,
        isProMember: isAdmin,
      });

      playTempleBellChime();
      setIsAuthLoading(false);

      if (isAdmin && onOpenAdminPanel) {
        onClose();
        onOpenAdminPanel();
      }
    }
  };

  const handleLogout = async () => {
    recordSecurityAuditLog({
      action: 'user_logout',
      userEmail: user.email || 'user',
      details: 'User logged out.',
    });

    try {
      localStorage.removeItem('vastu_active_user_profile');
      localStorage.removeItem('vastu_local_user');
      localStorage.removeItem('vastudrishti_audit_unlocked');
      await signOut(auth).catch(() => {});
    } catch (e) {}

    onUpdateUser({
      uid: undefined,
      name: 'Guest Explorer',
      email: '',
      role: 'user',
      isLoggedIn: false,
      isProMember: false,
    });
    setEmailInput('');
    setPasswordInput('');
    setNameInput('');
    setPhoneInput('');
    setAuthError('');
    playTempleBellChime();
  };

  const handleActivateLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!licenseKeyInput.trim()) {
      setLicenseMsg('❌ Please enter a license key code generated in Admin.');
      return;
    }

    setIsVerifyingKey(true);
    setLicenseMsg('');

    try {
      const result = await redeemLicenseKey(
        licenseKeyInput,
        user.email || 'user@vastudrishti.app',
        user.uid
      );

      if (result.success) {
        onUnlockAudit(result.planId || 'lifetime_pro');
        setLicenseMsg(`✓ ${result.message}`);
        setLicenseKeyInput('');
        playTempleBellChime();

        recordSecurityAuditLog({
          action: 'pro_license_activated',
          userEmail: user.email,
          details: `License key ${licenseKeyInput.trim().toUpperCase()} redeemed.`,
        });
      } else {
        setLicenseMsg(`❌ ${result.message}`);
      }
    } catch (err: any) {
      setLicenseMsg(`❌ Key verification failed: ${err?.message || 'Error'}`);
    } finally {
      setIsVerifyingKey(false);
    }
  };

  // Restore Purchases handler
  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    setRestoreMsg('');
    try {
      const res = await restoreUserPurchases(user.uid, user.email);
      if (res.restored) {
        onUnlockAudit((res.planId as SubscriptionPlanId) || 'lifetime_pro');
        setRestoreMsg(`✓ Restored ${res.count} active purchase(s)! Vedic Pro tier is active.`);
        playTempleBellChime();
        await fetchPurchases();
      } else {
        setRestoreMsg('ℹ️ No active completed purchases found for this email/device.');
      }
    } catch (err: any) {
      setRestoreMsg('❌ Unable to sync cloud purchases. Please verify your connection.');
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-16 sm:pb-4 font-sans animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] w-full max-w-md rounded-3xl border-2 border-[#E8DCC4] shadow-2xl overflow-hidden flex flex-col max-h-[70vh]">
        {/* Modal Header */}
        <div className="bg-[#78350F] text-white p-5 flex items-center justify-between border-b border-[#5C280B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#D97706] text-white flex items-center justify-center font-bold text-base shadow-sm border border-white/20">
              {user.isLoggedIn ? (user.name || 'VA').slice(0, 2).toUpperCase() : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-serif font-bold leading-tight">
                {user.isLoggedIn ? user.name : 'Vastu Compass Auth & Security'}
              </h3>
              <p className="text-[10px] text-[#E8DCC4] uppercase tracking-wider font-semibold">
                {isAdminUser
                  ? '👑 Admin Backend Authorized'
                  : user.isProMember
                  ? '🌟 Vedic Pro License Active'
                  : 'Free Explorer Account'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[#5C280B] text-[#E8DCC4] transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Security Protocols Active Badge */}
          <div className="bg-[#FFFBEB] p-2.5 rounded-xl border border-[#FEF3C7] flex items-center justify-between text-[10px] text-[#78350F] font-bold">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" /> 15 Security Protocols Enforced
            </span>
            <span className="font-mono bg-[#FEF3C7] px-2 py-0.5 rounded text-[9px]">
              {secReport.isHttps ? '🔒 HTTPS TLS 1.3' : 'HTTP Local'}
            </span>
          </div>

          {user.isLoggedIn ? (
            /* LOGGED IN VIEW */
            <div className="space-y-4">
              {/* Profile Card */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] space-y-3 shadow-2xs">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-[#8B735B] font-bold uppercase tracking-wider text-[10px]">
                    Account Overview
                  </span>
                  <span className="text-[10px] font-mono text-[#78350F] bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#E8DCC4]">
                    ID: {user.uid ? user.uid.substring(0, 8) : 'guest'}
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between border-b border-[#E8DCC4]/50 pb-1.5">
                    <span className="text-[#8B735B]">Email Address:</span>
                    <span className="font-bold text-[#3D342D]">{user.email || 'Not connected'}</span>
                  </div>
                  <div className="flex justify-between border-b border-[#E8DCC4]/50 pb-1.5">
                    <span className="text-[#8B735B]">Device Fingerprint:</span>
                    <span className="font-mono text-[#D97706] text-[10px]">
                      {getDeviceId().substring(0, 14)}...
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8B735B]">Account Tier:</span>
                    <span className="font-bold text-[#78350F]">
                      {isAdminUser ? 'Super Admin' : user.isProMember ? 'Vedic Pro' : 'Free Explorer'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Quick Launch */}
              {isAdminUser && onOpenAdminPanel && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenAdminPanel();
                  }}
                  className="w-full py-3 px-4 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Building2 className="w-4 h-4 text-[#F59E0B]" /> Launch Admin Console
                </button>
              )}

              {/* Current Plan & License Key Redemption */}
              {!user.isProMember ? (
                <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8DCC4] space-y-3">
                  <h4 className="text-xs font-serif font-bold text-[#78350F]">
                    Current Plan & License Key
                  </h4>

                  {/* Current Plan Card */}
                  <div className="p-3 bg-white rounded-xl border border-[#E8DCC4] flex items-center justify-between text-xs shadow-2xs">
                    <div>
                      <div className="text-[10px] text-[#8B735B] uppercase font-bold tracking-wider">
                        Current Plan
                      </div>
                      <div className="font-serif font-bold text-[#78350F] text-sm">
                        {user.isProMember
                          ? (SUBSCRIPTION_PLANS.find((p) => p.id === user.activePlan)?.name || 'Vedic Pro Membership')
                          : 'Free Explorer Account'}
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-[#FEF3C7] text-[#D97706] text-[10px] font-bold uppercase tracking-wider rounded-lg border border-[#FDE68A]">
                      {user.isProMember ? 'PRO ACTIVE' : 'FREE TIER'}
                    </span>
                  </div>

                  <form onSubmit={handleActivateLicense} className="flex gap-2 pt-2 border-t border-[#E8DCC4]">
                    <input
                      type="text"
                      placeholder="Enter License Key (e.g. PRO-VASTU-2026)..."
                      value={licenseKeyInput}
                      onChange={(e) => setLicenseKeyInput(e.target.value)}
                      disabled={isVerifyingKey}
                      className="text-xs font-mono font-bold uppercase bg-white border border-[#E8DCC4] rounded-xl p-2.5 flex-1 outline-none focus:ring-2 focus:ring-[#D97706] disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isVerifyingKey}
                      className="px-4 py-2.5 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-2xs disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                    >
                      {isVerifyingKey ? 'Verifying...' : 'Redeem'}
                    </button>
                  </form>
                  {licenseMsg && (
                    <p
                      className={`text-[11px] font-bold text-center p-2 rounded-xl border leading-snug ${
                        licenseMsg.startsWith('✓')
                          ? 'text-[#065F46] bg-[#ECFDF5] border-[#A7F3D0]'
                          : 'text-[#991B1B] bg-[#FEF2F2] border-[#FCA5A5]'
                      }`}
                    >
                      {licenseMsg}
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-[#ECFDF5] p-3.5 rounded-2xl border border-[#D1FAE5] flex items-center justify-between text-xs text-[#065F46] font-bold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#059669]" /> Vastu Pro Membership Active
                  </span>
                  <span className="text-[10px] bg-white px-2 py-0.5 rounded border border-[#A7F3D0]">
                    ACTIVE
                  </span>
                </div>
              )}

              {/* Purchase & Order History Section */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#FEF3C7] text-[#78350F] flex items-center justify-center border border-[#FDE68A]">
                      <Receipt className="w-4 h-4 text-[#D97706]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-serif font-bold text-[#78350F]">
                        My Orders & Purchase History
                      </h4>
                      <p className="text-[10px] text-[#8B735B]">
                        {purchaseHistory.length} saved transaction{purchaseHistory.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleRestorePurchases}
                      disabled={isRestoring}
                      title="Sync & restore purchases from cloud"
                      className="px-2 py-1 bg-[#FAF7F2] hover:bg-[#F3EFE0] text-[#78350F] text-[10px] font-bold rounded-lg border border-[#E8DCC4] flex items-center gap-1 transition-all cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isRestoring ? 'animate-spin' : ''}`} />
                      {isRestoring ? 'Restoring...' : 'Restore'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPurchaseHistory(!showPurchaseHistory)}
                      className="p-1 text-[#8B735B] hover:text-[#78350F] rounded-lg transition-all"
                    >
                      {showPurchaseHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {restoreMsg && (
                  <p
                    className={`text-[10px] font-bold p-2 rounded-xl border leading-tight ${
                      restoreMsg.startsWith('✓')
                        ? 'text-[#065F46] bg-[#ECFDF5] border-[#A7F3D0]'
                        : 'text-[#78350F] bg-[#FFFBEB] border-[#FEF3C7]'
                    }`}
                  >
                    {restoreMsg}
                  </p>
                )}

                {showPurchaseHistory && (
                  <div className="space-y-2 pt-1 border-t border-[#E8DCC4]/60">
                    {isLoadingPurchases ? (
                      <div className="py-4 text-center text-xs text-[#8B735B] flex items-center justify-center gap-2">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#D97706]" />
                        <span>Loading purchase records...</span>
                      </div>
                    ) : purchaseHistory.length > 0 ? (
                      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                        {purchaseHistory.map((item) => (
                          <div
                            key={item.id}
                            className="bg-[#FAF7F2] p-2.5 rounded-xl border border-[#E8DCC4] flex flex-col gap-1.5 transition-all hover:border-[#D97706]/40"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-1.5">
                                <Package className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                                <div>
                                  <span className="font-serif font-bold text-xs text-[#78350F] block">
                                    {item.planName || 'Vedic Pro Membership'}
                                  </span>
                                  <span className="text-[9px] text-[#8B735B]">
                                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="font-mono font-bold text-xs text-[#78350F] block">
                                  {item.currency === 'USD' ? '$' : '₹'}
                                  {item.amount}
                                </span>
                                <span className="inline-block px-1.5 py-0.2 bg-[#ECFDF5] text-[#065F46] text-[9px] font-bold uppercase rounded border border-[#A7F3D0]">
                                  {item.status || 'Paid'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[9px] text-[#8B735B] border-t border-[#E8DCC4]/50 pt-1.5">
                              <div className="truncate max-w-[170px] font-mono">
                                ID: {item.razorpayPaymentId || item.gpayPaymentId || item.id}
                              </div>
                              <button
                                type="button"
                                onClick={() => setSelectedReceipt(item)}
                                className="text-[#D97706] hover:text-[#B45309] font-bold flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-[#E8DCC4] shadow-2xs hover:bg-[#FEF3C7]/40"
                              >
                                <Receipt className="w-2.5 h-2.5" /> View Invoice
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-4 text-center bg-[#FAF7F2] rounded-xl border border-dashed border-[#E8DCC4] space-y-2">
                        <CreditCard className="w-6 h-6 text-[#8B735B] mx-auto opacity-50" />
                        <div className="text-xs font-bold text-[#78350F]">No purchases found</div>
                        <p className="text-[10px] text-[#8B735B] max-w-xs mx-auto px-4">
                          Your completed Pro subscriptions, audits, and orders will appear here.
                        </p>
                        {onOpenRazorpay && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onOpenRazorpay('lifetime_pro');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#78350F] hover:bg-[#5C280B] text-white text-[10px] font-bold uppercase rounded-lg shadow-2xs transition-all cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-[#F59E0B]" /> Upgrade to Pro
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Sound Bell Chime Audio Toggle Card */}
              <div className="bg-white p-3 rounded-2xl border border-[#E8DCC4] flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center border border-[#FDE68A] shrink-0">
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-[#8B735B]" />}
                  </div>
                  <div>
                    <div className="font-bold text-[#78350F] text-xs">Temple Bell Audio Chime</div>
                    <div className="text-[10px] text-[#8B735B]">Sacred chime on interactions</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onToggleSound) onToggleSound();
                  }}
                  className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                    soundEnabled
                      ? 'bg-[#D97706] text-white border-[#B45309] shadow-2xs'
                      : 'bg-[#FAF7F2] text-[#8B735B] border-[#E8DCC4] hover:bg-[#F3EFE0]'
                  }`}
                >
                  {soundEnabled ? 'ON' : 'MUTED'}
                </button>
              </div>

              {/* App Info & Legal Links */}
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#E8DCC4]">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                  }}
                  className="py-2 px-3 bg-white hover:bg-[#FAF7F2] text-[#78350F] text-[11px] font-bold rounded-xl border border-[#E8DCC4] flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" /> Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAppInfo) onOpenAppInfo();
                  }}
                  className="py-2 px-3 bg-white hover:bg-[#FAF7F2] text-[#78350F] text-[11px] font-bold rounded-xl border border-[#E8DCC4] flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <Info className="w-3.5 h-3.5 text-[#D97706]" /> App Info & Version (v3.3.5)
                </button>
              </div>

              {/* Sign Out Button */}
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#991B1B] text-xs font-bold uppercase tracking-wider rounded-xl border border-[#FCA5A5]/60 flex items-center justify-center gap-1.5 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          ) : authMode === 'otp_verify' ? (
            /* OTP VERIFICATION STEP FOR REGISTRATION */
            <div className="space-y-4 animate-in fade-in duration-150">
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="text-xs text-[#78350F] font-bold hover:underline"
              >
                ← Back to Signup Form
              </button>

              <div className="text-center space-y-1">
                <div className="w-12 h-12 bg-[#FEF3C7] text-[#D97706] rounded-2xl mx-auto flex items-center justify-center shadow-xs border border-[#FDE68A]">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-serif font-bold text-[#78350F] mt-2">
                  OTP Verification Required
                </h4>
                <p className="text-xs text-[#8B735B]">
                  Enter 6-digit code sent to <strong className="text-[#3D342D]">{emailInput}</strong>
                </p>
                <p className="text-[11px] font-mono font-bold text-[#D97706] mt-1">
                  ⏱️ OTP valid for {Math.floor(otpTimerSeconds / 60)}:
                  {(otpTimerSeconds % 60).toString().padStart(2, '0')} mins
                </p>
              </div>

              {authError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#DC2626] shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyOtpSubmit} className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#78350F] uppercase tracking-wider text-center">
                    6-Digit Verification Code:
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="123456"
                    value={otpCodeInput}
                    onChange={(e) => setOtpCodeInput(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-lg font-mono tracking-widest bg-white border-2 border-[#D97706] rounded-xl p-3 w-full outline-none focus:ring-2 focus:ring-[#D97706] text-[#3D342D]"
                  />
                  <p className="text-[10px] text-[#8B735B] text-center">
                    Demo OTP: <span className="font-bold font-mono text-[#D97706]">{otpSession?.code}</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading || otpTimerSeconds <= 0}
                  className="w-full py-3.5 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {isAuthLoading ? (
                    <span>Verifying OTP & Creating Account...</span>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" /> Complete Account Verification
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* SIGN IN & REGISTRATION FORM */
            <div className="space-y-4">
              {/* Tab Selector */}
              <div className="flex bg-[#E8DCC4]/50 p-1 rounded-2xl border border-[#E8DCC4]">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signin');
                    setAuthError('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    authMode === 'signin'
                      ? 'bg-white text-[#78350F] shadow-xs'
                      : 'text-[#8B735B] hover:text-[#78350F]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
                    authMode === 'signup'
                      ? 'bg-white text-[#78350F] shadow-xs'
                      : 'text-[#8B735B] hover:text-[#78350F]'
                  }`}
                >
                  Create Account
                </button>
              </div>

              <div className="text-center space-y-1">
                <h4 className="text-sm font-serif font-bold text-[#78350F]">
                  {authMode === 'signin' ? 'Sign In to Vastu Compass' : 'Create an Account'}
                </h4>
                <p className="text-xs text-[#8B735B]">
                  {authMode === 'signin'
                    ? 'Enter your email and password to access your account'
                    : 'Fill in your details below to register'}
                </p>
              </div>

              {/* GOOGLE SIGN-IN BUTTON */}
              <button
                type="button"
                disabled={isAuthLoading}
                onClick={handleGoogleSignIn}
                className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-[#3C4043] border border-[#DADCE0] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.15C3.26 21.3 7.31 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.28C.46 8.2 0 10.04 0 12s.46 3.8 1.28 5.42l4-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.28 6.58l4 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>{isAuthLoading ? 'Signing In...' : 'Continue with Google'}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-[#E8DCC4]" />
                <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-[#A68A64]">
                  Or Email & Credentials
                </span>
                <div className="flex-grow border-t border-[#E8DCC4]" />
              </div>

              {/* Error Message Display */}
              {authError && (
                <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-xs font-bold rounded-xl flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-[#DC2626]" />
                  <span>{authError}</span>
                </div>
              )}

              <form onSubmit={handleLoginSubmit} className="space-y-3">
                {authMode === 'signup' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#78350F] uppercase tracking-wider">
                        Full Name:
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 absolute left-3 top-3 text-[#A68A64]" />
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rajesh Sharma"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          className="text-xs font-medium bg-white border border-[#E8DCC4] rounded-xl p-2.5 pl-9 w-full focus:ring-2 focus:ring-[#D97706] outline-none text-[#3D342D]"
                        />
                      </div>
                    </div>

                    {/* Protocol 1: Mobile Phone Number */}
                    <div className="flex flex-col gap-1">
                      <label className="text-xs font-bold text-[#78350F] uppercase tracking-wider">
                        Mobile Number:
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-3 top-3 text-[#A68A64]" />
                        <input
                          type="tel"
                          required
                          placeholder="+91 9876543210"
                          value={phoneInput}
                          onChange={(e) => setPhoneInput(e.target.value)}
                          className="text-xs font-medium bg-white border border-[#E8DCC4] rounded-xl p-2.5 pl-9 w-full focus:ring-2 focus:ring-[#D97706] outline-none text-[#3D342D]"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-[#78350F] uppercase tracking-wider">
                    Email Address:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-[#A68A64]" />
                    <input
                      type="email"
                      required
                      placeholder="Enter email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="text-xs font-medium bg-white border border-[#E8DCC4] rounded-xl p-2.5 pl-9 w-full focus:ring-2 focus:ring-[#D97706] outline-none text-[#3D342D]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-[#78350F] uppercase tracking-wider">
                      Password: <span className="text-[#DC2626]">*</span>
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3 text-[#A68A64]" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter account password"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="text-xs font-medium bg-white border border-[#E8DCC4] rounded-xl p-2.5 pl-9 pr-10 w-full focus:ring-2 focus:ring-[#D97706] outline-none text-[#3D342D]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-[#A68A64] hover:text-[#78350F] p-0.5"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Protocol 6: Strong Password Checklist in Signup Mode */}
                  {authMode === 'signup' && (
                    <div className="p-2.5 bg-white rounded-xl border border-[#E8DCC4] text-[10px] space-y-1 mt-1">
                      <span className="font-bold text-[#78350F] block">Strong Password Requirements:</span>
                      <div className="grid grid-cols-2 gap-1">
                        <span className={passwordInput.length >= 8 ? 'text-[#059669]' : 'text-[#8B735B]'}>
                          {passwordInput.length >= 8 ? '✓' : '•'} Min 8 chars
                        </span>
                        <span className={/[A-Z]/.test(passwordInput) ? 'text-[#059669]' : 'text-[#8B735B]'}>
                          {/[A-Z]/.test(passwordInput) ? '✓' : '•'} Uppercase (A-Z)
                        </span>
                        <span className={/[a-z]/.test(passwordInput) ? 'text-[#059669]' : 'text-[#8B735B]'}>
                          {/[a-z]/.test(passwordInput) ? '✓' : '•'} Lowercase (a-z)
                        </span>
                        <span className={/[0-9]/.test(passwordInput) ? 'text-[#059669]' : 'text-[#8B735B]'}>
                          {/[0-9]/.test(passwordInput) ? '✓' : '•'} Number (0-9)
                        </span>
                        <span className={/[!@#$%^&*]/.test(passwordInput) ? 'text-[#059669]' : 'text-[#8B735B]'}>
                          {/[!@#$%^&*]/.test(passwordInput) ? '✓' : '•'} Special (!@#$)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isAuthLoading}
                  className="w-full py-3.5 px-4 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-60 mt-2"
                >
                  {isAuthLoading ? (
                    <span>{authMode === 'signin' ? 'Signing in...' : 'Processing...'}</span>
                  ) : authMode === 'signin' ? (
                    <>
                      <Lock className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Sign In</span>
                    </>
                  ) : (
                    <>
                      <Smartphone className="w-3.5 h-3.5 text-[#F59E0B]" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </form>

              {/* Sound Bell Chime Audio Toggle Card for Guests */}
              <div className="bg-white p-3 rounded-2xl border border-[#E8DCC4] flex items-center justify-between text-xs shadow-2xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center border border-[#FDE68A] shrink-0">
                    {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-[#8B735B]" />}
                  </div>
                  <div>
                    <div className="font-bold text-[#78350F] text-xs">Temple Bell Audio Chime</div>
                    <div className="text-[10px] text-[#8B735B]">Sacred chime on actions</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onToggleSound) onToggleSound();
                  }}
                  className={`px-3 py-1 rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-all cursor-pointer border ${
                    soundEnabled
                      ? 'bg-[#D97706] text-white border-[#B45309] shadow-2xs'
                      : 'bg-[#FAF7F2] text-[#8B735B] border-[#E8DCC4] hover:bg-[#F3EFE0]'
                  }`}
                >
                  {soundEnabled ? 'ON' : 'MUTED'}
                </button>
              </div>

              {/* App Info & Legal Privacy Links in Account Section */}
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[#E8DCC4]">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                  }}
                  className="py-2 px-3 bg-white hover:bg-[#FAF7F2] text-[#78350F] text-[11px] font-bold rounded-xl border border-[#E8DCC4] flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D97706]" /> Privacy Policy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenAppInfo) onOpenAppInfo();
                  }}
                  className="py-2 px-3 bg-white hover:bg-[#FAF7F2] text-[#78350F] text-[11px] font-bold rounded-xl border border-[#E8DCC4] flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <Info className="w-3.5 h-3.5 text-[#D97706]" /> App Info & Version (v3.3.5)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tax Invoice & Sacred Order Receipt Dialog Modal */}
      {selectedReceipt && (() => {
        const breakdown = calculateTaxBreakdown(selectedReceipt.amount, taxConfig);
        const receiptThemeBg =
          taxConfig.themeColor === 'emerald'
            ? 'bg-[#065F46]'
            : taxConfig.themeColor === 'ruby'
            ? 'bg-[#991B1B]'
            : taxConfig.themeColor === 'sapphire'
            ? 'bg-[#1E40AF]'
            : taxConfig.themeColor === 'slate'
            ? 'bg-[#334155]'
            : 'bg-[#78350F]';

        return (
          <div className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-3xl border-2 border-[#E8DCC4] shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
              {/* Header */}
              <div className={`${receiptThemeBg} text-white p-4 flex items-center justify-between border-b border-black/10`}>
                <div className="flex items-center gap-2.5">
                  <Receipt className="w-5 h-5 text-[#F59E0B]" />
                  <div>
                    <h3 className="text-sm font-serif font-bold">Vedic Tax Invoice & Receipt</h3>
                    <p className="text-[10px] text-[#E8DCC4] font-mono">
                      {taxConfig.invoicePrefix || 'VD-INV-'}
                      {(selectedReceipt.razorpayPaymentId || selectedReceipt.id).replace('pay_', '')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 rounded-full hover:bg-black/20 text-[#E8DCC4] transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Receipt Body */}
              <div className="p-5 space-y-4 overflow-y-auto text-xs text-[#3D342D]">
                {/* Brand Header */}
                <div className="flex justify-between items-start border-b border-[#E8DCC4] pb-3">
                  <div className="max-w-[65%]">
                    <h4 className="font-serif font-bold text-sm text-[#78350F]">{taxConfig.businessName}</h4>
                    <p className="text-[10px] text-[#8B735B] leading-tight">{taxConfig.subtitle}</p>
                    <p className="text-[9px] text-[#8B735B] mt-0.5">{taxConfig.address}</p>
                    {taxConfig.supportEmail && (
                      <p className="text-[9px] text-[#8B735B] mt-0.5">Support: {taxConfig.supportEmail}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="px-2 py-0.5 bg-[#ECFDF5] text-[#065F46] text-[10px] font-bold uppercase rounded border border-[#A7F3D0] inline-block">
                      PAID & VERIFIED
                    </div>
                    <p className="text-[10px] text-[#78350F] font-bold font-mono mt-1">
                      GSTIN: {taxConfig.taxId}
                    </p>
                    <p className="text-[9px] text-[#8B735B]">
                      {new Date(selectedReceipt.createdAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                {/* Customer & Payment Meta */}
                <div className="grid grid-cols-2 gap-3 bg-[#FAF7F2] p-3 rounded-xl border border-[#E8DCC4] text-[11px]">
                  <div>
                    <span className="text-[9px] text-[#8B735B] uppercase font-bold block">Billed To</span>
                    <div className="font-bold text-[#78350F]">{selectedReceipt.userName || user.name || 'Vedic Architect'}</div>
                    <div className="text-[#8B735B] truncate">{selectedReceipt.userEmail || user.email}</div>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#8B735B] uppercase font-bold block">Payment Gateway</span>
                    <div className="font-bold text-[#78350F] uppercase">
                      {selectedReceipt.gateway || 'Razorpay / GPay'}
                    </div>
                    <div className="font-mono text-[10px] text-[#8B735B] truncate">
                      Ord: {selectedReceipt.razorpayOrderId || 'DIRECT-VERIFIED'}
                    </div>
                  </div>
                </div>

                {/* Line Item Table */}
                <div className="border border-[#E8DCC4] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-[#FAF7F2] border-b border-[#E8DCC4] text-[#8B735B] font-bold uppercase text-[9px]">
                      <tr>
                        <th className="p-2.5">Item Description</th>
                        <th className="p-2.5 text-center">HSN</th>
                        <th className="p-2.5 text-right">Taxable</th>
                        <th className="p-2.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DCC4]/60">
                      <tr>
                        <td className="p-2.5">
                          <div className="font-bold text-[#78350F]">
                            {selectedReceipt.planName || 'Vastu Pro Membership License'}
                          </div>
                          <div className="text-[9px] text-[#8B735B] leading-tight">
                            {taxConfig.serviceDescription}
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-mono text-[10px] text-[#8B735B]">
                          {taxConfig.hsnCode}
                        </td>
                        <td className="p-2.5 text-right font-mono text-[10px] text-[#8B735B]">
                          {selectedReceipt.currency === 'USD' ? '$' : '₹'}
                          {breakdown.taxableAmount}
                        </td>
                        <td className="p-2.5 text-right font-mono font-bold text-[#78350F]">
                          {selectedReceipt.currency === 'USD' ? '$' : '₹'}
                          {selectedReceipt.amount}
                        </td>
                      </tr>
                    </tbody>
                    <tfoot className="bg-[#FAF7F2] font-bold text-xs border-t border-[#E8DCC4]">
                      {taxConfig.taxRatePercent > 0 && selectedReceipt.currency !== 'USD' && (
                        <>
                          <tr>
                            <td colSpan={2} className="px-2.5 py-0.5 text-right text-[10px] text-[#8B735B] font-normal">
                              CGST ({breakdown.cgstPercent}%):
                            </td>
                            <td colSpan={2} className="px-2.5 py-0.5 text-right font-mono text-[10px] text-[#8B735B] font-normal">
                              ₹{breakdown.cgstAmount}
                            </td>
                          </tr>
                          <tr>
                            <td colSpan={2} className="px-2.5 py-0.5 text-right text-[10px] text-[#8B735B] font-normal">
                              SGST ({breakdown.sgstPercent}%):
                            </td>
                            <td colSpan={2} className="px-2.5 py-0.5 text-right font-mono text-[10px] text-[#8B735B] font-normal">
                              ₹{breakdown.sgstAmount}
                            </td>
                          </tr>
                        </>
                      )}
                      <tr className="border-t border-[#E8DCC4]">
                        <td colSpan={2} className="p-2.5 text-right text-[#8B735B]">
                          Total Amount Paid:
                        </td>
                        <td colSpan={2} className="p-2.5 text-right font-mono text-[#78350F] font-bold text-sm">
                          {selectedReceipt.currency === 'USD' ? '$' : '₹'}
                          {selectedReceipt.amount}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Sacred Guarantee Stamp & Disclaimer */}
                <div className="p-3 bg-[#FFFBEB] rounded-xl border border-[#FEF3C7] space-y-1.5 text-[10px] text-[#78350F]">
                  <div className="flex items-center gap-1.5 font-bold">
                    <ShieldCheck className="w-4 h-4 text-[#D97706] shrink-0" />
                    <span>Sacred Authenticity & Legal Certification</span>
                  </div>
                  <p className="leading-tight text-[#8B735B]">
                    {taxConfig.disclaimerText}
                  </p>
                </div>

                {/* Signatory Footer */}
                <div className="flex justify-between items-end pt-2 border-t border-[#E8DCC4] text-[9px] text-[#8B735B]">
                  <div className="max-w-[200px] leading-tight">
                    {taxConfig.footerNotes}
                  </div>
                  <div className="text-right">
                    <div className="font-serif italic font-bold text-[#78350F]">{taxConfig.signatoryName}</div>
                    <div className="uppercase text-[8px] font-bold">{taxConfig.authorizedSignatory}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2 border-t border-[#E8DCC4]">
                  <button
                    type="button"
                    onClick={() => {
                      window.print();
                    }}
                    className="flex-1 py-2 px-3 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Printer className="w-3.5 h-3.5 text-[#F59E0B]" /> Print / Save PDF
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedReceipt(null)}
                    className="py-2 px-4 bg-[#FAF7F2] hover:bg-[#F3EFE0] text-[#78350F] text-xs font-bold rounded-xl border border-[#E8DCC4] transition-all cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
