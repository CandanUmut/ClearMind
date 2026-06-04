// Importing this module registers every exercise into the registry. Any
// consumer (session builder, Explore, Seed Inspector) imports this once; adding
// a new module means adding one line here and nothing else in the core.

import './mentalMath';
import './nback';
import './calibration';
import './estimation';
import './intention';
import './reflection';
// Phase 9 — visual pack
import './patternMatrix';
import './oddOneOut';
import './gridRecall';
// Phase 10 — logic pack
import './numberSequence';
import './nonogram';
// Phase 11 — problem pack
import './wordProblem';

export {};
