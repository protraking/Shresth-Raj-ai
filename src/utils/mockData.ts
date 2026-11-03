import { Subject, Assessment, NotificationSettings } from '../types';
import { calculateDateFromDaysLeft } from './dateUtils';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  soundEnabled: true,
  notify7Days: true,
  notify3Days: true,
  notify1Day: true,
  notifyDueDay: true,
  morningAlertTime: '08:00',
};

export function getInitialDemoData(): { subjects: Subject[]; assessments: Assessment[] } {
  const subjects: Subject[] = [
    {
      id: 'sub_math204',
      name: 'Linear Algebra & Differential Equations',
      code: 'MATH 204',
      color: 'indigo',
      targetExamDate: calculateDateFromDaysLeft(8, '10:00'),
      credits: 4,
      notes: 'Final exam covers all 4 modules. Formula sheet allowed for Eigenvalues.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      materials: [
        { id: 'mat_m1', subjectId: 'sub_math204', title: "Strang's Linear Algebra 5th Ed.", type: 'textbook', scopeOrPages: 'Chapters 4-6 (p. 180-265)', estimatedHours: 6.0 },
        { id: 'mat_m2', subjectId: 'sub_math204', title: 'MIT 18.06 Eigenvalues & ODE Lectures', type: 'video', scopeOrPages: 'Lectures 18 to 24', estimatedHours: 4.5 },
        { id: 'mat_m3', subjectId: 'sub_math204', title: 'Final Exam Practice Question Bank', type: 'practice_problems', scopeOrPages: '40 Solved Problems', estimatedHours: 5.0 },
      ],
      units: [
        {
          id: 'u_math_1',
          title: 'Unit 1: Vector Spaces & Subspaces',
          topics: [
            { id: 't_m_1', title: 'Linear combinations & Span', status: 'completed', estimatedHours: 2.0, difficulty: 'easy', completedAt: new Date().toISOString() },
            { id: 't_m_2', title: 'Basis and Dimension', status: 'completed', estimatedHours: 2.5, difficulty: 'medium', completedAt: new Date().toISOString() },
            { id: 't_m_3', title: 'Four Fundamental Subspaces', status: 'completed', estimatedHours: 3.0, difficulty: 'medium', completedAt: new Date().toISOString() },
          ],
        },
        {
          id: 'u_math_2',
          title: 'Unit 2: Linear Transformations & Orthogonality',
          topics: [
            { id: 't_m_4', title: 'Gram-Schmidt Process & QR Factorization', status: 'completed', estimatedHours: 2.5, difficulty: 'medium', completedAt: new Date().toISOString() },
            { id: 't_m_5', title: 'Projections and Least Squares Approximation', status: 'in_progress', estimatedHours: 3.0, difficulty: 'hard' },
            { id: 't_m_6', title: 'Orthogonal Matrices and Isometries', status: 'not_started', estimatedHours: 2.0, difficulty: 'medium' },
          ],
        },
        {
          id: 'u_math_3',
          title: 'Unit 3: Eigenvalues & Diagonalization',
          topics: [
            { id: 't_m_7', title: 'Characteristic Polynomials & Determinants', status: 'not_started', estimatedHours: 2.5, difficulty: 'medium' },
            { id: 't_m_8', title: 'Diagonalization of Symmetric Matrices', status: 'not_started', estimatedHours: 3.5, difficulty: 'hard' },
            { id: 't_m_9', title: 'Singular Value Decomposition (SVD)', status: 'not_started', estimatedHours: 4.0, difficulty: 'hard' },
          ],
        },
        {
          id: 'u_math_4',
          title: 'Unit 4: First & Second Order Differential Equations',
          topics: [
            { id: 't_m_10', title: 'Linear Systems of ODEs via Matrix Exponentials', status: 'not_started', estimatedHours: 3.0, difficulty: 'hard' },
            { id: 't_m_11', title: 'Phase Plane Portraits and Stability', status: 'not_started', estimatedHours: 2.5, difficulty: 'medium' },
          ],
        },
      ],
    },
    {
      id: 'sub_cs310',
      name: 'Operating Systems & Concurrency',
      code: 'CS 310',
      color: 'emerald',
      targetExamDate: calculateDateFromDaysLeft(14, '14:00'),
      credits: 4,
      notes: 'Lab assignments in C. Focus heavily on virtual memory page tables and semaphore synchronization.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      materials: [
        { id: 'mat_cs1', subjectId: 'sub_cs310', title: 'OSTEP: Three Easy Pieces', type: 'textbook', scopeOrPages: 'Concurrency & Paging (Ch. 26-32)', estimatedHours: 6.0 },
        { id: 'mat_cs2', subjectId: 'sub_cs310', title: 'Concurrency Synchronization Lecture Slides', type: 'slides', scopeOrPages: 'Decks 6-9', estimatedHours: 3.0 },
        { id: 'mat_cs3', subjectId: 'sub_cs310', title: 'Virtual Memory Paging Exercises', type: 'practice_problems', scopeOrPages: 'Problem Set 4', estimatedHours: 3.5 },
      ],
      units: [
        {
          id: 'u_cs_1',
          title: 'Unit 1: Kernel Architecture & Processes',
          topics: [
            { id: 't_cs_1', title: 'System calls, trap handlers, and context switches', status: 'completed', estimatedHours: 2.0, difficulty: 'easy', completedAt: new Date().toISOString() },
            { id: 't_cs_2', title: 'Process state transitions & fork/exec', status: 'completed', estimatedHours: 2.0, difficulty: 'easy', completedAt: new Date().toISOString() },
            { id: 't_cs_3', title: 'CPU Scheduling Algorithms (CFS, Multi-level feedback)', status: 'completed', estimatedHours: 3.0, difficulty: 'medium', completedAt: new Date().toISOString() },
          ],
        },
        {
          id: 'u_cs_2',
          title: 'Unit 2: Threads & Concurrency Synchronization',
          topics: [
            { id: 't_cs_4', title: 'Race conditions, Mutexes, and Spinlocks', status: 'completed', estimatedHours: 2.5, difficulty: 'medium', completedAt: new Date().toISOString() },
            { id: 't_cs_5', title: 'Counting Semaphores & Condition Variables', status: 'completed', estimatedHours: 3.0, difficulty: 'hard', completedAt: new Date().toISOString() },
            { id: 't_cs_6', title: 'Deadlock avoidance & Banker’s Algorithm', status: 'in_progress', estimatedHours: 2.5, difficulty: 'hard' },
          ],
        },
        {
          id: 'u_cs_3',
          title: 'Unit 3: Virtual Memory & Address Translation',
          topics: [
            { id: 't_cs_7', title: 'Multi-level Paging and TLB Caches', status: 'not_started', estimatedHours: 3.5, difficulty: 'hard' },
            { id: 't_cs_8', title: 'Page Replacement Algorithms (LRU, Clock)', status: 'not_started', estimatedHours: 2.0, difficulty: 'medium' },
            { id: 't_cs_9', title: 'Segmentation and Memory mapped files (mmap)', status: 'not_started', estimatedHours: 2.5, difficulty: 'medium' },
          ],
        },
        {
          id: 'u_cs_4',
          title: 'Unit 4: File Systems & Persistent Storage',
          topics: [
            { id: 't_cs_10', title: 'Inodes, directory structures, and block allocation', status: 'not_started', estimatedHours: 2.5, difficulty: 'medium' },
            { id: 't_cs_11', title: 'Journaling, Crash consistency & Log-structured FS', status: 'not_started', estimatedHours: 3.0, difficulty: 'hard' },
          ],
        },
      ],
    },
    {
      id: 'sub_chem120',
      name: 'Organic Chemistry & Mechanisms',
      code: 'CHEM 120',
      color: 'rose',
      targetExamDate: calculateDateFromDaysLeft(3, '09:00'),
      credits: 3,
      notes: 'Midterm 2 in 3 days! Need high-repetition practice on SN1 vs SN2 arrow pushing.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      materials: [
        { id: 'mat_ch1', subjectId: 'sub_chem120', title: 'Clayden Organic Chemistry 2nd Ed.', type: 'textbook', scopeOrPages: 'Ch 10 Nucleophilic Substitution', estimatedHours: 4.0 },
        { id: 'mat_ch2', subjectId: 'sub_chem120', title: 'Reaction Mechanisms Practice Sheets', type: 'practice_problems', scopeOrPages: '30 Mechanism Drills', estimatedHours: 3.0 },
      ],
      units: [
        {
          id: 'u_chem_1',
          title: 'Unit 1: Stereochemistry & Conformations',
          topics: [
            { id: 't_ch_1', title: 'Chirality, R/S configurations, & Enantiomers', status: 'completed', estimatedHours: 2.5, difficulty: 'medium', completedAt: new Date().toISOString() },
            { id: 't_ch_2', title: 'Cyclohexane chair flips & diaxial strains', status: 'completed', estimatedHours: 2.0, difficulty: 'medium', completedAt: new Date().toISOString() },
          ],
        },
        {
          id: 'u_chem_2',
          title: 'Unit 2: Substitution & Elimination Reactions',
          topics: [
            { id: 't_ch_3', title: 'SN1 vs SN2 kinetics and solvent effects', status: 'completed', estimatedHours: 3.0, difficulty: 'hard', completedAt: new Date().toISOString() },
            { id: 't_ch_4', title: 'E1 vs E2 stereoelectronic requirements (anti-periplanar)', status: 'in_progress', estimatedHours: 3.5, difficulty: 'hard' },
          ],
        },
        {
          id: 'u_chem_3',
          title: 'Unit 3: Carbonyl Additions & Enolates',
          topics: [
            { id: 't_ch_5', title: 'Nucleophilic addition to Aldehydes and Ketones', status: 'not_started', estimatedHours: 3.0, difficulty: 'medium' },
            { id: 't_ch_6', title: 'Aldol condensation & Michael addition reactions', status: 'not_started', estimatedHours: 4.0, difficulty: 'hard' },
          ],
        },
      ],
    },
    {
      id: 'sub_econ210',
      name: 'Intermediate Macroeconomic Theory',
      code: 'ECON 210',
      color: 'amber',
      targetExamDate: calculateDateFromDaysLeft(21, '13:00'),
      credits: 3,
      notes: 'IS-LM models, Solow growth model, and monetary policy transmission.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      materials: [
        { id: 'mat_ec1', subjectId: 'sub_econ210', title: 'Blanchard Macroeconomics 8th Ed.', type: 'textbook', scopeOrPages: 'Ch 5-9 Financial Markets & IS-LM', estimatedHours: 5.0 },
        { id: 'mat_ec2', subjectId: 'sub_econ210', title: 'Macro Policy Problem Sets & Empirical Data', type: 'practice_problems', scopeOrPages: 'Problem Sets 3 & 4', estimatedHours: 3.0 },
      ],
      units: [
        {
          id: 'u_econ_1',
          title: 'Unit 1: Long-Run Economic Growth',
          topics: [
            { id: 't_ec_1', title: 'Production functions and capital accumulation', status: 'completed', estimatedHours: 1.5, difficulty: 'easy', completedAt: new Date().toISOString() },
            { id: 't_ec_2', title: 'Solow Growth Model steady states & Golden Rule', status: 'completed', estimatedHours: 3.0, difficulty: 'medium', completedAt: new Date().toISOString() },
            { id: 't_ec_3', title: 'Endogenous growth theory & R&D spillovers', status: 'completed', estimatedHours: 2.0, difficulty: 'medium', completedAt: new Date().toISOString() },
          ],
        },
        {
          id: 'u_econ_2',
          title: 'Unit 2: Short-Run Fluctuations & IS-LM Framework',
          topics: [
            { id: 't_ec_4', title: 'Goods market equilibrium and the Keynesian Cross', status: 'in_progress', estimatedHours: 2.0, difficulty: 'medium' },
            { id: 't_ec_5', title: 'Money market equilibrium and LM curve derivation', status: 'not_started', estimatedHours: 2.5, difficulty: 'medium' },
            { id: 't_ec_6', title: 'Fiscal vs Monetary Policy interaction in IS-LM', status: 'not_started', estimatedHours: 3.0, difficulty: 'hard' },
          ],
        },
      ],
    },
  ];

  const assessments: Assessment[] = [
    {
      id: 'ass_chem_midterm2',
      subjectId: 'sub_chem120',
      title: 'Organic Chemistry Midterm 2',
      type: 'exam',
      dueDate: calculateDateFromDaysLeft(3, '09:30'),
      weightPercentage: 25,
      isCompleted: false,
      syllabusScope: 'Stereochemistry, SN1/SN2/E1/E2 reaction mechanisms',
      notes: 'Bring model kit and non-programmable calculator.',
    },
    {
      id: 'ass_cs_lab4',
      subjectId: 'sub_cs310',
      title: 'Lab 4: Multithreaded Semaphore Barrier',
      type: 'assignment',
      dueDate: calculateDateFromDaysLeft(5, '23:59'),
      weightPercentage: 10,
      isCompleted: false,
      syllabusScope: 'Unit 2: Concurrency & Synchronization',
      notes: 'Must pass all valgrind tests with 0 memory leaks.',
    },
    {
      id: 'ass_math_final',
      subjectId: 'sub_math204',
      title: 'Linear Algebra Comprehensive Final',
      type: 'exam',
      dueDate: calculateDateFromDaysLeft(8, '10:00'),
      weightPercentage: 40,
      isCompleted: false,
      syllabusScope: 'Units 1 through 4 (Heavy focus on SVD & ODE systems)',
      notes: '2.5 hour duration in Examination Hall 4B.',
    },
    {
      id: 'ass_cs_midterm',
      subjectId: 'sub_cs310',
      title: 'OS Midterm Examination',
      type: 'exam',
      dueDate: calculateDateFromDaysLeft(14, '14:00'),
      weightPercentage: 30,
      isCompleted: false,
      syllabusScope: 'Units 1, 2, and 3 (Processes, Threads, Virtual Memory)',
      notes: 'Closed book. Formulas provided on cover sheet.',
    },
    {
      id: 'ass_econ_paper',
      subjectId: 'sub_econ210',
      title: 'Policy Term Paper: Central Bank Rate Response',
      type: 'project',
      dueDate: calculateDateFromDaysLeft(18, '17:00'),
      weightPercentage: 20,
      isCompleted: false,
      syllabusScope: 'IS-LM analysis of inflationary shocks',
      notes: 'Max 8 pages. APA format with peer-reviewed empirical citations.',
    },
    {
      id: 'ass_econ_final',
      subjectId: 'sub_econ210',
      title: 'Macroeconomics Final Exam',
      type: 'exam',
      dueDate: calculateDateFromDaysLeft(21, '13:00'),
      weightPercentage: 35,
      isCompleted: false,
      syllabusScope: 'Full Semester Syllabus',
      notes: 'Multiple choice + 3 analytical essay problems.',
    },
  ];

  return { subjects, assessments };
}
