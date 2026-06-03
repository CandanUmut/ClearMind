import type { ModuleId } from '../types';

export interface EvidenceNote {
  /** One-line honest promise of what the module trains. */
  trains: string;
  /** What it explicitly does NOT claim. */
  doesNotClaim: string;
  /** Plain-language citation line. */
  citation: string;
}

// Honesty is a product value, not a footnote. These notes appear in-product on
// each module. We never claim general-intelligence gains, IQ increases, or
// dementia prevention. Calibration and implementation intentions are the two
// components with genuine evidence of transfer — they get the candid spotlight.

export const evidenceNotes: Record<ModuleId, EvidenceNote> = {
  mentalMath: {
    trains:
      'Builds speed and fluency at arithmetic itself — a genuinely useful everyday skill.',
    doesNotClaim:
      'It does not make you generally smarter or raise IQ. Treat it as an enjoyable warmup.',
    citation:
      'Practice produces "near transfer" (you improve at the trained task) but not broad cognitive gains. (Sala & Gobet, 2017, meta-analysis of cognitive training.)',
  },
  nback: {
    trains:
      'A classic working-memory task. Expect to get noticeably better at this specific task.',
    doesNotClaim:
      'N-back training does not reliably raise general intelligence — a much-studied and largely negative result. Enjoy it as a warmup.',
    citation:
      'Working-memory training shows little to no far transfer to fluid intelligence. (Melby-Lervåg et al., 2016.)',
  },
  calibration: {
    trains:
      'Calibration training measurably improves judgment — matching your confidence to how often you are actually right.',
    doesNotClaim:
      'It is not a general brain booster; it is a specific, trainable judgment skill that does transfer to real decisions.',
    citation:
      'Calibration is trainable and transfers to real-world forecasting. (Mellers et al., 2014, Good Judgment Project; FTC v. Lumosity, 2016, on overblown claims.)',
  },
  estimation: {
    trains:
      'Trains honest uncertainty: giving ranges wide enough to be right ~90% of the time, which curbs overconfidence.',
    doesNotClaim:
      'It will not raise your intelligence. It does sharpen a directly useful real-world judgment skill.',
    citation:
      'Most people’s 90% intervals capture the truth far less than 90% of the time; feedback improves this. (Alpert & Raiffa, 1982; Moore & Healy, 2008.)',
  },
  intention: {
    trains:
      'Implementation intentions — "I will do X at time/place Y" — are among the best-evidenced tools for actually following through on plans.',
    doesNotClaim:
      'It is not magic and not a cognitive enhancer; it is a simple, reliable behavior-change technique.',
    citation:
      'Implementation intentions have a robust medium-to-large effect on goal attainment. (Gollwitzer & Sheeran, 2006, meta-analysis of 94 studies.)',
  },
  reflection: {
    trains:
      'Brief structured reflection supports metacognition — noticing your own thinking — and follow-through.',
    doesNotClaim:
      'It does not boost IQ or prevent cognitive decline. It is a small habit that supports clearer thinking.',
    citation:
      'Structured reflection improves learning and performance. (Di Stefano et al., 2016, "Learning by Thinking".)',
  },
};

// Top-level honest premise reused on the About / onboarding screens.
export const HONEST_PREMISE = {
  promise:
    'ClearMind is a short daily habit of clear thinking and good judgment — instead of scrolling.',
  caveat:
    'Brain games produce "near transfer" (you get better at the game) but no reliable "far transfer" — they do not raise general intelligence, IQ, or prevent dementia. We will never claim otherwise.',
  spotlight:
    'The two parts with real evidence of transferring to everyday life are calibration (matching confidence to accuracy) and implementation intentions (planning when and where you will act). Those get the spotlight; the games are honest warmups.',
};
