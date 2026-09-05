import React, { useState } from 'react';
import {
  Star,
  Sparkles,
  X,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Smartphone,
  Heart,
  Send,
} from 'lucide-react';
import { requestGooglePlayReview } from '../lib/inAppReview';
import { playTempleBellChime } from '../utils/vastuUtils';
import { submitCustomerFeedback } from '../lib/firebase';

interface PlayStoreReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  sourceTrigger?: string;
}

export const PlayStoreReviewModal: React.FC<PlayStoreReviewModalProps> = ({
  isOpen,
  onClose,
  userEmail = '',
  userName = 'Vedic Explorer',
  sourceTrigger = 'manual',
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [feedbackType, setFeedbackType] = useState<'playstore' | 'internal'>('playstore');
  const [statusNotice, setStatusNotice] = useState<string>('');

  if (!isOpen) return null;

  const handleLaunchGooglePlayReview = async () => {
    setIsSubmitting(true);
    setStatusNotice('');

    try {
      // 1. Record review intent & rating in Firestore
      await submitCustomerFeedback({
        userEmail: userEmail || 'user@vastucompass.app',
        userName: userName || 'Vedic Architect',
        feedbackType: 'general',
        category: 'rating',
        subject: `Google Play Store Rating (${rating} Stars) - ${sourceTrigger}`,
        message: reviewComment || `User provided a ${rating}-star review via Google Play Review API prompt.`,
      });

      // 2. Play sacred bell chime
      playTempleBellChime();

      // 3. Trigger Native Google Play Store In-App Review API
      const result = await requestGooglePlayReview('com.tasker7.vastucompass');

      setIsSuccess(true);
      if (result.mode === 'native') {
        setStatusNotice('Google Play Store In-App Review dialog launched.');
      } else {
        setStatusNotice('Opening Google Play Store review page.');
      }

      // Mark locally that user was prompted
      try {
        localStorage.setItem('vastu_play_review_completed', 'true');
        localStorage.setItem('vastu_play_review_date', new Date().toISOString());
      } catch {}

      setTimeout(() => {
        setIsSubmitting(false);
      }, 1500);
    } catch (err: any) {
      console.warn('Review API error:', err);
      // Fallback
      window.open('https://play.google.com/store/apps/details?id=com.tasker7.vastucompass', '_blank', 'noopener,noreferrer');
      setIsSuccess(true);
      setIsSubmitting(false);
    }
  };

  const handleInternalFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    setIsSubmitting(true);
    try {
      await submitCustomerFeedback({
        userEmail: userEmail || 'user@vastucompass.app',
        userName: userName || 'Vedic Architect',
        feedbackType: 'improvement',
        category: 'feedback',
        subject: `App Feedback & Feature Suggestion (${rating} Stars)`,
        message: reviewComment,
      });

      playTempleBellChime();
      setIsSuccess(true);
      setStatusNotice('Thank you! Your feedback has been submitted to the Vedic development team.');
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-[#FAF7F2] border-2 border-[#E8DCC4] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
        
        {/* Decorative Top Vedic Header */}
        <div className="bg-gradient-to-r from-[#78350F] via-[#9A3412] to-[#78350F] text-[#F3EFE0] p-4 sm:p-5 flex items-center justify-between border-b border-[#D97706]/40 relative">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D97706] text-white flex items-center justify-center shadow-md border border-[#FDE68A]/40 shrink-0">
              <Star className="w-5 h-5 fill-[#FEF08A] text-[#FEF08A]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-serif font-bold text-base sm:text-lg text-white leading-tight">
                  Rate Vastu Compass
                </h3>
                <span className="text-[9px] bg-[#FEF3C7] text-[#78350F] font-black px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  Play Store
                </span>
              </div>
              <p className="text-[11px] text-[#E8DCC4] opacity-90">
                Official Google Play Store Review
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-full text-[#E8DCC4] transition-all cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {isSuccess ? (
            <div className="py-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-[#ECFDF5] border-2 border-[#10B981] text-[#059669] flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-serif font-bold text-lg text-[#78350F]">
                Thank You For Supporting Us!
              </h4>
              <p className="text-xs text-[#5C4D3C] max-w-xs mx-auto leading-relaxed">
                Your ratings and reviews help fellow homeowners and Vedic architecture enthusiasts discover authentic 16-zone harmony.
              </p>
              {statusNotice && (
                <div className="text-[11px] font-bold text-[#059669] bg-[#ECFDF5] px-3 py-1.5 rounded-xl border border-[#A7F3D0] inline-block">
                  {statusNotice}
                </div>
              )}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Continue Harmony
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Star Rating Interactive Bar */}
              <div className="bg-white p-4 rounded-2xl border border-[#E8DCC4] text-center shadow-2xs space-y-2">
                <span className="text-[11px] font-bold text-[#8B735B] uppercase tracking-wider block">
                  How is your experience with 16-zone Vastu?
                </span>
                
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoverRating || rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          setRating(star);
                          if (star <= 3) {
                            setFeedbackType('internal');
                          } else {
                            setFeedbackType('playstore');
                          }
                        }}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                        title={`${star} Stars`}
                      >
                        <Star
                          className={`w-7 h-7 sm:w-8 sm:h-8 transition-colors ${
                            isFilled
                              ? 'text-[#F59E0B] fill-[#F59E0B] drop-shadow-xs'
                              : 'text-[#D1D5DB]'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="text-xs font-serif font-bold text-[#78350F]">
                  {rating === 5 && '🌟 Masterpiece! 16-Zone Precision'}
                  {rating === 4 && '✨ Very Good & Accurate'}
                  {rating === 3 && '👍 Good, but have suggestions'}
                  {rating === 2 && '⚠️ Needs improvements'}
                  {rating === 1 && '👎 Not satisfied'}
                </div>
              </div>

              {/* Review Type Selection (Google Play Review vs Direct Developer Feedback) */}
              {rating >= 4 ? (
                <div className="space-y-3">
                  <div className="bg-[#FFFBEB] p-3.5 rounded-2xl border border-[#FDE68A] text-xs text-[#78350F] flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-bold block">
                        Google Play Store In-App Review
                      </span>
                      <p className="text-[11px] text-[#8B735B] leading-relaxed">
                        Clicking below opens the official Google Play In-App Review prompt. Your review will be published directly to the Google Play Store listing.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-[#78350F] uppercase tracking-wider">
                      Optional Note (for our developers):
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="What did you like most? (e.g. Inclinometer, 16-Zone Compass, Pooja Guide...)"
                      rows={2}
                      className="w-full p-2.5 text-xs bg-white rounded-xl border border-[#E8DCC4] focus:outline-none focus:ring-2 focus:ring-[#D97706] text-[#3D342D] placeholder-[#A8A29E]"
                    />
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={handleLaunchGooglePlayReview}
                    className="w-full py-3.5 bg-gradient-to-r from-[#D97706] to-[#78350F] hover:from-[#B45309] hover:to-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Star className="w-4 h-4 fill-white" />
                        <span>Submit Review on Google Play</span>
                        <ExternalLink className="w-3.5 h-3.5 ml-1" />
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInternalFeedbackSubmit} className="space-y-3">
                  <div className="bg-[#FEF2F2] p-3 rounded-2xl border border-[#FCA5A5]/60 text-xs text-[#991B1B] flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-[#DC2626] shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <span className="font-bold block">We'd love to improve!</span>
                      <p className="text-[11px] text-[#7F1D1D] leading-relaxed">
                        Please tell us what went wrong or how we can make our 16-zone calculations and features better for you.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-[#78350F] uppercase tracking-wider">
                      Your Feedback / Suggestions:
                    </label>
                    <textarea
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Please describe any issues with direction, room placement, or features..."
                      rows={3}
                      className="w-full p-2.5 text-xs bg-white rounded-xl border border-[#E8DCC4] focus:outline-none focus:ring-2 focus:ring-[#D97706] text-[#3D342D]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !reviewComment.trim()}
                    className="w-full py-3 bg-[#78350F] hover:bg-[#5C280B] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Feedback to Team</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Direct Play Store Link Fallback */}
              <div className="text-center pt-2 border-t border-[#E8DCC4]">
                <a
                  href="https://play.google.com/store/apps/details?id=com.tasker7.vastucompass"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-[#8B735B] hover:text-[#78350F] font-bold inline-flex items-center gap-1 underline"
                >
                  <Smartphone className="w-3 h-3 text-[#D97706]" />
                  Open App Listing directly in Google Play Store
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
