export type ReadinessLevel = 'Siap Tantangan' | 'Cukup Siap' | 'Perlu Pendampingan';

export type PrerequisiteKey = 'mol' | 'molaritas' | 'grafik' | 'luas';

export interface Question {
  id: number;
  key: PrerequisiteKey | 'kesiapan';
  title: string;
  subtitle?: string;
  diagramType?: 'grafik_konsentrasi' | 'partikel_luas' | 'rumus_mol' | 'rumus_molaritas';
  options: string[];
  correctIndex?: number;
  isAffective?: boolean;
  explanation?: string;
  misconceptions?: { optionIndex: number; diagnosis: string }[];
}

export interface StudentSubmission {
  id: string;
  nama: string;
  kelas: string;
  nis?: string;
  ans: number[]; // index of choices [q0, q1, q2, q3, q4, q5, q6]
  kesiapan: string; // 'siap' | 'cukup siap' | 'perlu dibantu'
  skor: number;
  tot: number;
  level: ReadinessLevel;
  per: Record<string, { b: number; n: number }>;
  lemah: string[];
  submittedAt: string;
}

export interface ClassStats {
  total: number;
  avgScore: string | number;
  readinessCounts: {
    siapTantangan: number;
    cukupSiap: number;
    perluPendampingan: number;
  };
  prerequisiteStats: {
    mol: { correctRate: number; needsSupport: number };
    molaritas: { correctRate: number; needsSupport: number };
    grafik: { correctRate: number; needsSupport: number };
    luas: { correctRate: number; needsSupport: number };
  };
  selfReadiness: {
    siap: number;
    cukupSiap: number;
    perluDibantu: number;
  };
}

export interface PeerGroup {
  groupNumber: number;
  tutor: StudentSubmission | null;
  members: StudentSubmission[];
}
