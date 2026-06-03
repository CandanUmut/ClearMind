import type { ReflectionPrompt } from '../types';

// Short reflection prompts across four styles. The daily seed picks one, avoiding
// any used in the last 30 days. Optional free text is saved locally only.

export const reflectionPrompts: ReflectionPrompt[] = [
  // ── Stoic ──────────────────────────────────────────────────────────────
  { id: 'sto-01', style: 'stoic', prompt: 'What is within your control today, and what is not? Name one of each.' },
  { id: 'sto-02', style: 'stoic', prompt: 'If today were repeated a hundred times, what habit would you want it built on?' },
  { id: 'sto-03', style: 'stoic', prompt: 'What discomfort did you avoid recently that might have been worth facing?' },
  { id: 'sto-04', style: 'stoic', prompt: 'Picture losing something you take for granted. How would you treat it tomorrow?' },
  { id: 'sto-05', style: 'stoic', prompt: 'Where did you let an external event dictate your mood? What was the story you told yourself?' },
  { id: 'sto-06', style: 'stoic', prompt: 'What would the calmest, wisest version of you do about the thing weighing on you?' },
  { id: 'sto-07', style: 'stoic', prompt: 'Name one thing you can do less of that would make room for what matters.' },
  { id: 'sto-08', style: 'stoic', prompt: 'What obstacle today could actually be the way forward if you reframed it?' },
  { id: 'sto-09', style: 'stoic', prompt: 'Whose opinion are you over-weighting? Whose are you ignoring?' },
  { id: 'sto-10', style: 'stoic', prompt: 'If you had to give up complaining for a day, what would you do with that energy?' },
  { id: 'sto-11', style: 'stoic', prompt: 'What are you clinging to that you could hold more lightly?' },
  { id: 'sto-12', style: 'stoic', prompt: 'Where did you act from impulse rather than principle today?' },
  { id: 'sto-13', style: 'stoic', prompt: 'What would you do today if you knew you would not be judged for it?' },
  { id: 'sto-14', style: 'stoic', prompt: 'Name a fear that has been larger in your imagination than in reality.' },
  { id: 'sto-15', style: 'stoic', prompt: 'What is enough, for you, today? Describe it concretely.' },

  // ── Socratic ───────────────────────────────────────────────────────────
  { id: 'soc-01', style: 'socratic', prompt: 'What do you believe strongly that you have never actually tested?' },
  { id: 'soc-02', style: 'socratic', prompt: 'What would have to be true for you to change your mind about something important?' },
  { id: 'soc-03', style: 'socratic', prompt: 'Pick a recent opinion. What is the strongest argument against it?' },
  { id: 'soc-04', style: 'socratic', prompt: 'What question, if you answered it honestly, would change how you spend tomorrow?' },
  { id: 'soc-05', style: 'socratic', prompt: 'Where might you be confusing being confident with being correct?' },
  { id: 'soc-06', style: 'socratic', prompt: 'What evidence would you accept that you are wrong about a current plan?' },
  { id: 'soc-07', style: 'socratic', prompt: 'What assumption are you treating as a fact?' },
  { id: 'soc-08', style: 'socratic', prompt: 'If a thoughtful friend disagreed with you, what would they likely say?' },
  { id: 'soc-09', style: 'socratic', prompt: 'What is a question you have been avoiding asking yourself?' },
  { id: 'soc-10', style: 'socratic', prompt: 'How would you explain a current decision to someone ten years from now?' },
  { id: 'soc-11', style: 'socratic', prompt: 'What do you know now that you wish you had known a year ago?' },
  { id: 'soc-12', style: 'socratic', prompt: 'Where are you generalizing from a single example?' },
  { id: 'soc-13', style: 'socratic', prompt: 'What would change if you assumed good intent from the person who frustrated you?' },
  { id: 'soc-14', style: 'socratic', prompt: 'What is the smallest experiment that could resolve a current uncertainty?' },
  { id: 'soc-15', style: 'socratic', prompt: 'Which of your goals is actually someone else’s goal for you?' },

  // ── Gratitude ──────────────────────────────────────────────────────────
  { id: 'gra-01', style: 'gratitude', prompt: 'Name one small thing today that went better than expected.' },
  { id: 'gra-02', style: 'gratitude', prompt: 'Who made your day a little easier, and how?' },
  { id: 'gra-03', style: 'gratitude', prompt: 'What is something ordinary you would miss if it were gone?' },
  { id: 'gra-04', style: 'gratitude', prompt: 'Recall a moment today when you felt genuinely at ease.' },
  { id: 'gra-05', style: 'gratitude', prompt: 'What skill or ability did you use today that you are glad to have?' },
  { id: 'gra-06', style: 'gratitude', prompt: 'Name a past difficulty you are now grateful you went through.' },
  { id: 'gra-07', style: 'gratitude', prompt: 'What part of your body or health are you thankful for right now?' },
  { id: 'gra-08', style: 'gratitude', prompt: 'Who taught you something useful, even unintentionally?' },
  { id: 'gra-09', style: 'gratitude', prompt: 'What is a comfort you enjoyed today that earlier generations could not?' },
  { id: 'gra-10', style: 'gratitude', prompt: 'Name something in nature you noticed and appreciated recently.' },
  { id: 'gra-11', style: 'gratitude', prompt: 'What is one thing you have that you once hoped for?' },
  { id: 'gra-12', style: 'gratitude', prompt: 'Recall a kindness from a stranger, near or far in the past.' },
  { id: 'gra-13', style: 'gratitude', prompt: 'What made you laugh recently?' },
  { id: 'gra-14', style: 'gratitude', prompt: 'Name a tool or object you rely on and rarely thank.' },
  { id: 'gra-15', style: 'gratitude', prompt: 'What progress, however small, can you acknowledge in yourself this week?' },

  // ── Decision review ───────────────────────────────────────────────────
  { id: 'dec-01', style: 'decision-review', prompt: 'What is a recent decision you are happy with? What made it a good one?' },
  { id: 'dec-02', style: 'decision-review', prompt: 'Think of a decision that disappointed you. Was the process bad, or just the luck?' },
  { id: 'dec-03', style: 'decision-review', prompt: 'What is a choice you are postponing? What is the cost of waiting?' },
  { id: 'dec-04', style: 'decision-review', prompt: 'For a current decision, what would the best-case and worst-case outcomes be?' },
  { id: 'dec-05', style: 'decision-review', prompt: 'Where did you recently follow the crowd rather than your own judgment?' },
  { id: 'dec-06', style: 'decision-review', prompt: 'What information would most reduce your uncertainty about a current choice?' },
  { id: 'dec-07', style: 'decision-review', prompt: 'Recall a prediction you made recently. How did it turn out?' },
  { id: 'dec-08', style: 'decision-review', prompt: 'What is a decision you could make once to avoid making it daily?' },
  { id: 'dec-09', style: 'decision-review', prompt: 'Where are you over-investing because you have already invested so much?' },
  { id: 'dec-10', style: 'decision-review', prompt: 'If you could only measure one thing this week, what should it be?' },
  { id: 'dec-11', style: 'decision-review', prompt: 'What would you advise a friend to do in your exact situation?' },
  { id: 'dec-12', style: 'decision-review', prompt: 'What is a reversible decision you are treating as if it were permanent?' },
  { id: 'dec-13', style: 'decision-review', prompt: 'What recent success owed more to luck than you would like to admit?' },
  { id: 'dec-14', style: 'decision-review', prompt: 'Where could you set a clear rule now to make future choices easier?' },
  { id: 'dec-15', style: 'decision-review', prompt: 'What is one thing you would do differently if you replayed yesterday?' },
];
