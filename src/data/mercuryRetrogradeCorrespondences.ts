import type { SignName } from '@/lib/names';

export interface MercuryRetrogradeCorrespondence {
  flavour: string;
}

// Keyed by the sign Mercury stations retrograde in. When a retrograde backs
// into the previous sign, the period is still read through its station sign.
export const MERCURY_RETROGRADE_CORRESPONDENCES: Record<SignName, MercuryRetrogradeCorrespondence> = {
  Aries: {
    flavour:
      'Communications and new ventures are prone to false starts. Revisit projects that began in a rush and check the groundwork before pressing on. Impatience costs more than usual now.',
  },
  Taurus: {
    flavour:
      'Money, possessions, and practical agreements come up for review. Decisions about spending or property benefit from a second look. Slow, steady reconsideration serves better than digging in.',
  },
  Gemini: {
    flavour:
      'Messages cross, plans double-book, and details slip. Mercury is at home here, so the usual muddle is sharper than normal. Reread before sending, and return to conversations that ended unfinished.',
  },
  Cancer: {
    flavour:
      'Domestic matters and family communication become tangled, and old feelings around home and belonging resurface. Seek to understand rather than to be understood. Old correspondence may return.',
  },
  Leo: {
    flavour:
      'Creative self-expression may feel blocked or misunderstood. Review artistic projects, double-check your work, and avoid grand declarations. Beliefs about your own talents may need revisiting.',
  },
  Virgo: {
    flavour:
      'Routines, health habits, and the small print of daily work come up for review. Errors hide in details you thought were settled. A good time to mend and reorganise rather than build new systems.',
  },
  Libra: {
    flavour:
      'Agreements and partnerships are prone to second thoughts. Old relationship questions resurface, and negotiations tend to stall or reverse. Revisit commitments rather than making new ones.',
  },
  Scorpio: {
    flavour:
      'Deep psychological patterns and hidden truths come to the surface. Power dynamics in close relationships need careful handling. Avoid irreversible decisions: what is hidden is not yet fully visible.',
  },
  Sagittarius: {
    flavour:
      'Philosophy and long-held beliefs come under scrutiny. Travel plans go awry and grand visions lose their clarity. Revisit where your faith is placed; not every map leads where you think.',
  },
  Capricorn: {
    flavour:
      'Plans, contracts, and professional commitments come up for review. Expect delays with institutions and people in authority. Rework the structure of long-term goals before building further on them.',
  },
  Aquarius: {
    flavour:
      'Technology and group communication are especially unreliable. Ideas that seemed brilliant may need rethinking. Return to older, simpler ways of staying in touch, and look up friends who drifted.',
  },
  Pisces: {
    flavour:
      'Communication becomes foggy and boundaries dissolve. Intuition speaks louder than logic: listen to it, but verify what you hear. Past confusions and unresolved emotional matters resurface.',
  },
};
