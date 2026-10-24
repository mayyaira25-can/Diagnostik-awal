import React, { useState, useMemo } from 'react';
import {
  StudentSubmission,
  ReadinessLevel,
  PeerGroup,
  PrerequisiteKey
} from '../types/diagnostic';
import {
  QUESTIONS,
  DEFAULT_CLASSES,
  PREREQUISITE_INFO,
  TEACHER_DIFFERENTIATION_GUIDE
} from '../data/diagnosticData';
import { deleteSubmission, resetSubmissions, seedDemoSubmissions } from '../services/api';
import {
  Users,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Search,
  Download,
  Printer,
  Trash2,
  RefreshCw,
  Projector,
  Share2,
  UserPlus,
  Sparkles,
  Layers,
  BrainCircuit,
  X,
  FileSpreadsheet,
  Copy,
  Check
} from 'lucide-react';

interface TeacherDashboardProps {
  submissions: StudentSubmission[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  onRefresh: () => void;
  onOpenStudentView: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  submissions,
  connectionStatus,
  onRefresh,
  onOpenStudentView
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<StudentSubmission | null>(null);
  const [projectorMode, setProjectorMode] = useState<boolean>(false);
  const [showGroupingModal, setShowGroupingModal] = useState<boolean>(false);
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [copiedGroupText, setCopiedGroupText] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Filtered submissions
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchClass = selectedClass === 'Semua' || s.kelas === selectedClass;
      const matchQuery =
        !searchQuery.trim() ||
        s.nama.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (s.nis && s.nis.toLowerCase().includes(searchQuery.toLowerCase().trim()));
      return matchClass && matchQuery;
    });
  }, [submissions, selectedClass, searchQuery]);

  // Aggregate stats
  const stats = useMemo(() => {
    const total = filteredSubmissions.length;
    const totalScore = filteredSubmissions.reduce((acc, curr) => acc + curr.skor, 0);
    const avgScore = total > 0 ? (totalScore / total).toFixed(1) : '0';
    const avgPercentage = total > 0 ? Math.round((totalScore / (total * 6)) * 100) : 0;

    const readyChallenge = filteredSubmissions.filter((s) => s.level === 'Siap Tantangan');
    const moderatelyReady = filteredSubmissions.filter((s) => s.level === 'Cukup Siap');
    const needsSupport = filteredSubmissions.filter((s) => s.level === 'Perlu Pendampingan');

    // Prerequisite breakdown
    const prereq = {
      mol: { b: 0, n: 0, weakCount: 0 },
      molaritas: { b: 0, n: 0, weakCount: 0 },
      grafik: { b: 0, n: 0, weakCount: 0 },
      luas: { b: 0, n: 0, weakCount: 0 }
    };

    filteredSubmissions.forEach((s) => {
      (['mol', 'molaritas', 'grafik', 'luas'] as const).forEach((key) => {
        if (s.per && s.per[key]) {
          prereq[key].b += s.per[key].b;
          prereq[key].n += s.per[key].n;
        }
        if (s.lemah && s.lemah.includes(key)) {
          prereq[key].weakCount++;
        }
      });
    });

    const prereqAccuracy = {
      mol: prereq.mol.n > 0 ? Math.round((prereq.mol.b / prereq.mol.n) * 100) : 0,
      molaritas: prereq.molaritas.n > 0 ? Math.round((prereq.molaritas.b / prereq.molaritas.n) * 100) : 0,
      grafik: prereq.grafik.n > 0 ? Math.round((prereq.grafik.b / prereq.grafik.n) * 100) : 0,
      luas: prereq.luas.n > 0 ? Math.round((prereq.luas.b / prereq.luas.n) * 100) : 0
    };

    // Find weakest topic
    const topicKeys: readonly PrerequisiteKey[] = ['mol', 'molaritas', 'grafik', 'luas'];
    let weakestTopic: PrerequisiteKey = 'mol';
    let minRate = 101;
    topicKeys.forEach((k) => {
      if (prereqAccuracy[k] < minRate) {
        minRate = prereqAccuracy[k];
        weakestTopic = k;
      }
    });

    // Affective reflection distribution
    const affectiveCounts = {
      siap: filteredSubmissions.filter((s) => s.kesiapan?.toLowerCase().includes('siap dan') || s.kesiapan === 'siap').length,
      cukupSiap: filteredSubmissions.filter((s) => s.kesiapan?.toLowerCase().includes('cukup')).length,
      perluDibantu: filteredSubmissions.filter((s) => s.kesiapan?.toLowerCase().includes('perlu')).length
    };

    return {
      total,
      avgScore,
      avgPercentage,
      readyChallenge,
      moderatelyReady,
      needsSupport,
      prereqAccuracy,
      prereqCounts: prereq,
      weakestTopic,
      affectiveCounts
    };
  }, [filteredSubmissions]);

  // Smart Heterogeneous Peer-Tutor Grouping Algorithm
  const peerGroups = useMemo<PeerGroup[]>(() => {
    if (filteredSubmissions.length === 0) return [];

    const tutors = [...stats.readyChallenge];
    const needsHelp = [...stats.needsSupport];
    const moderate = [...stats.moderatelyReady];

    // Determine target group size ~4 students
    const targetGroupCount = Math.max(1, Math.ceil(filteredSubmissions.length / 4));
    const groups: PeerGroup[] = Array.from({ length: targetGroupCount }, (_, i) => ({
      groupNumber: i + 1,
      tutor: tutors.pop() || null,
      members: []
    }));

    // Distribute needs help first across groups
    let gIdx = 0;
    while (needsHelp.length > 0) {
      const student = needsHelp.pop()!;
      groups[gIdx % groups.length].members.push(student);
      gIdx++;
    }

    // Distribute remaining tutors if any
    while (tutors.length > 0) {
      const student = tutors.pop()!;
      groups[gIdx % groups.length].members.push(student);
      gIdx++;
    }

    // Distribute moderate students
    while (moderate.length > 0) {
      const student = moderate.pop()!;
      groups[gIdx % groups.length].members.push(student);
      gIdx++;
    }

    return groups;
  }, [filteredSubmissions, stats]);

  // Handlers
  const handleDeleteStudent = async (id: string, name: string) => {
    if (!confirm(`Hapus data asesmen siswa ${name}?`)) return;
    setActionLoading(true);
    await deleteSubmission(id);
    onRefresh();
    setActionLoading(false);
  };

  const handleResetData = async () => {
    const scopeText = selectedClass === 'Semua' ? 'SEMUA data siswa di semua kelas' : `data siswa di kelas ${selectedClass}`;
    if (!confirm(`Apakah Anda yakin ingin MENGOSONGKAN ${scopeText}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setActionLoading(true);
    await resetSubmissions(selectedClass === 'Semua' ? undefined : selectedClass);
    onRefresh();
    setActionLoading(false);
  };

  const handleSeedDemoData = async () => {
    setActionLoading(true);
    await seedDemoSubmissions();
    onRefresh();
    setActionLoading(false);
  };

  const handleExportCSV = () => {
    if (filteredSubmissions.length === 0) {
      alert('Belum ada data siswa untuk diekspor.');
      return;
    }

    const headers = [
      'ID',
      'Nama Siswa',
      'Kelas',
      'NIS/Absen',
      'Kesiapan Diri',
      'Skor Total (dari 6)',
      'Persentase Ketepatan',
      'Kategori Kesiapan',
      'Konsep Mol',
      'Molaritas',
      'Grafik Laju',
      'Luas Permukaan',
      'Materi Lemah',
      'Waktu Mengisi'
    ];

    const rows = filteredSubmissions.map((s) => [
      `"${s.id}"`,
      `"${s.nama.replace(/"/g, '""')}"`,
      `"${s.kelas}"`,
      `"${s.nis || '-'}"`,
      `"${s.kesiapan}"`,
      s.skor,
      `"${Math.round((s.skor / 6) * 100)}%"`,
      `"${s.level}"`,
      `"${s.per?.mol?.b || 0}/${s.per?.mol?.n || 1}"`,
      `"${s.per?.molaritas?.b || 0}/${s.per?.molaritas?.n || 1}"`,
      `"${s.per?.grafik?.b || 0}/${s.per?.grafik?.n || 2}"`,
      `"${s.per?.luas?.b || 0}/${s.per?.luas?.n || 2}"`,
      `"${(s.lemah || []).map((k) => PREREQUISITE_INFO[k as keyof typeof PREREQUISITE_INFO]?.name || k).join(', ')}"`,
      `"${new Date(s.submittedAt).toLocaleString('id-ID')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Diagnostik_Laju_Reaksi_${selectedClass.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    const studentUrl = window.location.origin;
    navigator.clipboard.writeText(studentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyGroupText = () => {
    let text = `📋 PEMBAGIAN KELOMPOK TUTOR SEBAYA - KIMIA LAJU REAKSI (${selectedClass})\n\n`;
    peerGroups.forEach((g) => {
      text += `📌 KELOMPOK ${g.groupNumber}\n`;
      if (g.tutor) {
        text += `  ⭐ Tutor Sebaya: ${g.tutor.nama} (${g.tutor.level})\n`;
      }
      text += `  👥 Anggota:\n`;
      g.members.forEach((m) => {
        text += `     - ${m.nama} (${m.level})\n`;
      });
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopiedGroupText(true);
    setTimeout(() => setCopiedGroupText(false), 2000);
  };

  return (
    <div className={`min-h-screen ${projectorMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Top Navigation & Status Bar */}
      <header
        className={`sticky top-0 z-30 border-b px-4 sm:px-8 py-3.5 flex items-center justify-between gap-4 backdrop-blur-md transition-colors ${
          projectorMode
            ? 'bg-slate-900/90 border-slate-800 text-white'
            : 'bg-white/90 border-slate-200 text-slate-900'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
            🧪
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold tracking-tight">
                Layar Guru: Diagnostik Laju Reaksi
              </h1>
              <div
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                  connectionStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
                <span>{connectionStatus === 'connected' ? 'Live Real-Time' : 'Menyambungkan…'}</span>
              </div>
            </div>
            <p className={`text-xs ${projectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Pemetaan bekal kimia, analisis miskonsepsi prasyarat & diferensiasi belajar
            </p>
          </div>
        </div>

        {/* Action Controls in Header */}
        <div className="flex items-center gap-2">
          {/* Projector Mode Toggle */}
          <button
            type="button"
            onClick={() => setProjectorMode(!projectorMode)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              projectorMode
                ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Ubah kontras tinggi untuk tayang di proyektor kelas"
          >
            <Projector className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{projectorMode ? 'Keluar Proyektor' : 'Mode Proyektor'}</span>
          </button>

          {/* Share Link for Students */}
          <button
            type="button"
            onClick={() => setShowShareModal(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors flex items-center gap-1.5 cursor-pointer ${
              projectorMode
                ? 'bg-slate-800 text-white border-slate-700 hover:bg-slate-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Share2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Bagikan ke Siswa</span>
          </button>

          {/* Switch to Student Assessment Mode */}
          <button
            type="button"
            onClick={onOpenStudentView}
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <span>Tampilan Siswa</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-6 space-y-6">
        {/* Class Filter Bar & Tools Strip */}
        <div
          className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
            projectorMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'
          }`}
        >
          {/* Class Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`text-xs font-semibold mr-1 ${projectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Kelas:
            </span>
            {['Semua', ...DEFAULT_CLASSES].map((cls) => {
              const count = cls === 'Semua' ? submissions.length : submissions.filter((s) => s.kelas === cls).length;
              const isSelected = selectedClass === cls;

              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : projectorMode
                      ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200/60'
                  }`}
                >
                  <span>{cls === 'Semua' ? 'Semua Kelas' : cls.replace('XI ', '')}</span>
                  <span className={`ml-1.5 text-[11px] tabular-nums ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search and Secondary Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa…"
                className={`pl-8 pr-3 py-1.5 text-xs rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                  projectorMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder:text-slate-400'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                projectorMode
                  ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Unduh file CSV untuk Microsoft Excel / Google Sheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden lg:inline">Ekspor CSV</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className={`p-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                projectorMode
                  ? 'bg-slate-700 border-slate-600 text-slate-200 hover:bg-slate-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
              title="Cetak atau Simpan PDF Laporan"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden lg:inline">Cetak PDF</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGroupingModal(true)}
              className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Kelompok Tutor Sebaya</span>
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            className={`p-4 rounded-2xl border transition-colors ${
              projectorMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Siswa Terdata</span>
              <Users className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums">
              {stats.total}
            </div>
            <p className={`text-xs mt-1 ${projectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {selectedClass === 'Semua' ? 'Di seluruh kelas' : `Khusus ${selectedClass}`}
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-colors ${
              projectorMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Rata-Rata Kelas</span>
              <BarChart3 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums text-indigo-500">
              {stats.avgScore} <span className="text-sm font-normal text-slate-400">/ 6</span>
            </div>
            <p className={`text-xs mt-1 ${projectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Ketepatan Prasyarat: <strong className="text-emerald-500">{stats.avgPercentage}%</strong>
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-colors ${
              projectorMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Perlu Pendampingan</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono tabular-nums text-rose-500">
              {stats.needsSupport.length} <span className="text-sm font-normal text-slate-400">siswa</span>
            </div>
            <p className={`text-xs mt-1 ${projectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Belum siap konsep mol/molaritas
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border transition-colors ${
              projectorMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
              <span>Topik Bottleneck</span>
              <BrainCircuit className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-base sm:text-lg font-bold text-amber-500 truncate mt-1">
              {PREREQUISITE_INFO[stats.weakestTopic]?.name || '-'}
            </div>
            <p className={`text-xs mt-1 ${projectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Ketepatan kelas: <strong>{stats.prereqAccuracy[stats.weakestTopic]}%</strong>
            </p>
          </div>
        </div>

        {/* 3-Column Differentiation Cards (Kesiapan Belajar) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              <span>Pemetaan Kesiapan & Strategi Diferensiasi Pembelajaran</span>
            </h2>
            <span className={`text-xs ${projectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Berdasarkan hasil asesmen formatif awal
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Perlu Pendampingan */}
            <div
              className={`rounded-2xl border p-5 flex flex-col justify-between ${
                projectorMode ? 'bg-slate-800 border-rose-900/60' : 'bg-white border-rose-200 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">
                    Kelompok 1 (Fondasi Awal)
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                    {stats.needsSupport.length} Siswa
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Perlu Pendampingan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  {TEACHER_DIFFERENTIATION_GUIDE['Perlu Pendampingan'].characteristic}
                </p>

                {/* Student badges */}
                <div className="flex flex-wrap gap-1.5 mb-4 max-h-36 overflow-y-auto">
                  {stats.needsSupport.length > 0 ? (
                    stats.needsSupport.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStudentForModal(s)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 transition-colors text-left cursor-pointer"
                        title="Klik untuk melihat detail lembar jawaban"
                      >
                        {s.nama} ({s.skor}/6)
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada siswa di kategori ini.</p>
                  )}
                </div>
              </div>

              {/* Action Plan */}
              <div className="pt-3 border-t border-rose-100 dark:border-rose-900/40 text-xs">
                <span className="font-semibold text-rose-700 dark:text-rose-400 block mb-1">
                  Rencana Tindak Lanjut Guru:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Beri kartu pengingat rumus segitiga n = m/Mr dan M = n/V</li>
                  <li>Dampingi khusus saat pengerjaan soal hitungan laju reaksi</li>
                </ul>
              </div>
            </div>

            {/* 2. Cukup Siap */}
            <div
              className={`rounded-2xl border p-5 flex flex-col justify-between ${
                projectorMode ? 'bg-slate-800 border-amber-900/60' : 'bg-white border-amber-200 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wide">
                    Kelompok 2 (Menengah)
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    {stats.moderatelyReady.length} Siswa
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Cukup Siap
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  {TEACHER_DIFFERENTIATION_GUIDE['Cukup Siap'].characteristic}
                </p>

                {/* Student badges */}
                <div className="flex flex-wrap gap-1.5 mb-4 max-h-36 overflow-y-auto">
                  {stats.moderatelyReady.length > 0 ? (
                    stats.moderatelyReady.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStudentForModal(s)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors text-left cursor-pointer"
                        title="Klik untuk melihat detail lembar jawaban"
                      >
                        {s.nama} ({s.skor}/6)
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada siswa di kategori ini.</p>
                  )}
                </div>
              </div>

              {/* Action Plan */}
              <div className="pt-3 border-t border-amber-100 dark:border-amber-900/40 text-xs">
                <span className="font-semibold text-amber-700 dark:text-amber-400 block mb-1">
                  Rencana Tindak Lanjut Guru:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Review 5 menit apersepsi membaca kurva penurunan konsentrasi</li>
                  <li>Beri lembar kerja terbimbing (guided scaffold)</li>
                </ul>
              </div>
            </div>

            {/* 3. Siap Tantangan */}
            <div
              className={`rounded-2xl border p-5 flex flex-col justify-between ${
                projectorMode ? 'bg-slate-800 border-emerald-900/60' : 'bg-white border-emerald-200 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">
                    Kelompok 3 (Pengayaan)
                  </span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {stats.readyChallenge.length} Siswa
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  Siap Tantangan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
                  {TEACHER_DIFFERENTIATION_GUIDE['Siap Tantangan'].characteristic}
                </p>

                {/* Student badges */}
                <div className="flex flex-wrap gap-1.5 mb-4 max-h-36 overflow-y-auto">
                  {stats.readyChallenge.length > 0 ? (
                    stats.readyChallenge.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedStudentForModal(s)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors text-left cursor-pointer"
                        title="Klik untuk melihat detail lembar jawaban"
                      >
                        {s.nama} ({s.skor}/6)
                      </button>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">Tidak ada siswa di kategori ini.</p>
                  )}
                </div>
              </div>

              {/* Action Plan */}
              <div className="pt-3 border-t border-emerald-100 dark:border-emerald-900/40 text-xs">
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
                  Rencana Tindak Lanjut Guru:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-300">
                  <li>Berikan studi kasus "Insinyur Kimia Cilik" (faktor ganda)</li>
                  <li>Jadikan Tutor Sebaya dalam kelompok kooperatif heterogen</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Prerequisite & Misconception Detailed Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Prerequisite Accuracy Bars */}
          <div
            className={`p-6 rounded-2xl border ${
              projectorMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center justify-between">
              <span>Tingkat Ketepatan Per Materi Prasyarat</span>
              <span className={`text-xs font-normal ${projectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Rata-rata benar di kelas
              </span>
            </h3>

            <div className="space-y-4">
              {(['mol', 'molaritas', 'grafik', 'luas'] as const).map((key) => {
                const info = PREREQUISITE_INFO[key];
                const acc = stats.prereqAccuracy[key];
                const count = stats.prereqCounts[key];

                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold">{info.name}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] ${projectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {count.weakCount} siswa perlu penguatan
                        </span>
                        <span className="font-mono font-bold">{acc}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          acc >= 75
                            ? 'bg-emerald-500'
                            : acc >= 50
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}
                        style={{ width: `${acc}%` }}
                      ></div>
                    </div>
                    <p className={`text-[11px] mt-1 ${projectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {info.formula}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Affective Self-Readiness & Classroom Insights */}
          <div
            className={`p-6 rounded-2xl border flex flex-col justify-between ${
              projectorMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div>
              <h3 className="text-sm font-bold tracking-tight mb-4 flex items-center justify-between">
                <span>Refleksi Kesiapan Diri (Afektif)</span>
                <span className={`text-xs font-normal ${projectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Perasaan siswa sebelum belajar
                </span>
              </h3>

              <div className="grid grid-cols-3 gap-3 text-center mb-5">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">
                    Siap & Optimis
                  </span>
                  <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono">
                    {stats.affectiveCounts.siap}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40">
                  <span className="text-xs text-amber-800 dark:text-amber-300 font-semibold block">
                    Cukup Siap
                  </span>
                  <span className="text-2xl font-extrabold text-amber-700 dark:text-amber-400 font-mono">
                    {stats.affectiveCounts.cukupSiap}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40">
                  <span className="text-xs text-rose-800 dark:text-rose-300 font-semibold block">
                    Perlu Dibantu
                  </span>
                  <span className="text-2xl font-extrabold text-rose-700 dark:text-rose-400 font-mono">
                    {stats.affectiveCounts.perluDibantu}
                  </span>
                </div>
              </div>

              {/* Teaching Note */}
              <div className="p-3.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs">
                <p className="font-bold text-indigo-950 dark:text-indigo-200 mb-1">
                  💡 Rekomendasi Pedagogis Guru:
                </p>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Siswa yang merasa <em>"Perlu dibantu"</em> seringkali merasa cemas dengan hitungan kimia. Berikan apresiasi terhadap kejujuran mereka, gunakan analogi sehari-hari (seperti melarutkan gula atau mengendarai motor dengan speedometer), dan tempatkan di kelompok yang ramah.
                </p>
              </div>
            </div>

            {/* Quick Demo & Clear tools */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-3 text-xs">
              <button
                type="button"
                onClick={handleSeedDemoData}
                disabled={actionLoading}
                className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Muat Data Simulasi Cepat</span>
              </button>

              <button
                type="button"
                onClick={handleResetData}
                disabled={actionLoading}
                className="text-rose-600 dark:text-rose-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Kosongkan Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Student Records Table */}
        <section
          className={`rounded-2xl border overflow-hidden ${
            projectorMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold">Rincian Hasil Lembar Jawaban Siswa</h3>
              <p className={`text-xs ${projectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Menampilkan {filteredSubmissions.length} siswa · Klik baris siswa untuk memeriksa lembar jawab
              </p>
            </div>
            <button
              type="button"
              onClick={onRefresh}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                projectorMode
                  ? 'bg-slate-700 border-slate-600 text-white hover:bg-slate-600'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Segarkan</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-4">Nama Siswa</th>
                  <th className="py-3 px-3">Kelas</th>
                  <th className="py-3 px-3">Kesiapan Diri</th>
                  <th className="py-3 px-3 text-center">Skor</th>
                  <th className="py-3 px-3">Kategori</th>
                  <th className="py-3 px-3">Perlu Penguatan Pada</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {filteredSubmissions.length > 0 ? (
                  filteredSubmissions.map((s) => {
                    const badge = TEACHER_DIFFERENTIATION_GUIDE[s.level] || TEACHER_DIFFERENTIATION_GUIDE['Perlu Pendampingan'];

                    return (
                      <tr
                        key={s.id}
                        onClick={() => setSelectedStudentForModal(s)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors cursor-pointer"
                      >
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white block">
                            {s.nama}
                          </span>
                          {s.nis && (
                            <span className="text-[11px] text-slate-400">Absen/NIS: {s.nis}</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                          {s.kelas}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                          <span className="capitalize">{s.kesiapan}</span>
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-bold tabular-nums">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white">
                            {s.skor} / {s.tot}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${badge.badgeClass}`}
                          >
                            {s.level}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          {s.lemah.length === 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              Semua tepat ✓
                            </span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {s.lemah.map((w) => (
                                <span
                                  key={w}
                                  className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                >
                                  {PREREQUISITE_INFO[w as keyof typeof PREREQUISITE_INFO]?.name || w}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => setSelectedStudentForModal(s)}
                              className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                            >
                              Detail
                            </button>
                            <span className="text-slate-300">·</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(s.id, s.nama)}
                              className="text-rose-500 hover:text-rose-700 cursor-pointer"
                              title="Hapus data siswa ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                      Belum ada siswa yang masuk di kelas ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* MODAL 1: STUDENT DIAGNOSTIC SHEET DETAILS */}
      {selectedStudentForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Lembar Jawaban: {selectedStudentForModal.nama}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Kelas {selectedStudentForModal.kelas} · Skor: {selectedStudentForModal.skor}/6 ({selectedStudentForModal.level})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Question by Question Analysis */}
            <div className="p-5 overflow-y-auto space-y-4">
              {QUESTIONS.map((q, idx) => {
                const studentAnsIdx = selectedStudentForModal.ans[idx];
                const isCorrect = q.isAffective ? true : studentAnsIdx === q.correctIndex;
                const studentAnsText = studentAnsIdx !== undefined ? q.options[studentAnsIdx] : 'Tidak dijawab';
                const correctAnsText = q.correctIndex !== undefined ? q.options[q.correctIndex] : null;

                // Check for diagnosed misconception
                const misconception = q.misconceptions?.find((m) => m.optionIndex === studentAnsIdx);

                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border text-xs ${
                      q.isAffective
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                        : isCorrect
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40'
                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Soal #{idx + 1}: {q.title}
                      </span>
                      {q.isAffective ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 text-slate-700">
                          Refleksi Afektif
                        </span>
                      ) : isCorrect ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Tepat
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Kurang Tepat
                        </span>
                      )}
                    </div>

                    <p className="text-slate-900 dark:text-slate-100 font-medium mb-2">
                      {q.subtitle || q.title}
                    </p>

                    <div className="space-y-1 bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700">
                      <div>
                        <span className="text-slate-500">Jawaban Siswa: </span>
                        <strong className={isCorrect ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}>
                          {studentAnsText}
                        </strong>
                      </div>
                      {!q.isAffective && !isCorrect && correctAnsText && (
                        <div>
                          <span className="text-slate-500">Kunci Jawaban: </span>
                          <strong className="text-slate-800 dark:text-slate-200">{correctAnsText}</strong>
                        </div>
                      )}
                      {misconception && (
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 dark:border-slate-700 text-rose-700 dark:text-rose-400">
                          <strong>Analisis Miskonsepsi: </strong>
                          <span>{misconception.diagnosis}</span>
                        </div>
                      )}
                    </div>

                    {q.explanation && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 italic">
                        💡 Penjelasan: {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedStudentForModal(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PEER-TUTOR SMART GROUPING */}
      {showGroupingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600" />
                  <span>Rekomendasi Kelompok Belajar Tutor Sebaya ({selectedClass})</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Otomatis mendistribusikan siswa "Siap Tantangan" sebagai pemandu kelompok heterogen
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupingModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {peerGroups.map((g) => (
                  <div
                    key={g.groupNumber}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-indigo-900 dark:text-indigo-300">
                        Kelompok {g.groupNumber}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {g.members.length + (g.tutor ? 1 : 0)} Anggota
                      </span>
                    </div>

                    {g.tutor ? (
                      <div className="mb-2.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-xs">
                        <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300 block">
                          ⭐ Pemandu / Tutor Sebaya:
                        </span>
                        <span className="font-semibold text-emerald-950 dark:text-white">
                          {g.tutor.nama}
                        </span>
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-300 ml-1">
                          ({g.tutor.kelas} · Skor {g.tutor.skor}/6)
                        </span>
                      </div>
                    ) : (
                      <div className="mb-2.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 text-xs text-amber-800 dark:text-amber-300 italic">
                        Perlu bimbingan guru langsung (belum ada tutor sebaya)
                      </div>
                    )}

                    <div className="text-xs space-y-1">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] block">
                        Anggota Belajar:
                      </span>
                      {g.members.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between py-0.5 border-b border-slate-100 dark:border-slate-700/60 last:border-0"
                        >
                          <span className="text-slate-800 dark:text-slate-200">{m.nama}</span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                              m.level === 'Perlu Pendampingan'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-200 text-slate-700'
                            }`}
                          >
                            {m.level === 'Perlu Pendampingan' ? 'Butuh Pendampingan' : 'Cukup Siap'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleCopyGroupText}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {copiedGroupText ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{copiedGroupText ? 'Tersalin!' : 'Salin Teks Pembagian Kelompok'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGroupingModal(false)}
                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: SHARE LINK TO STUDENTS */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl">
              📲
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Bagikan Tautan Asesmen ke Siswa
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kirimkan tautan ini ke grup WhatsApp kelas atau tayangkan agar siswa langsung membuka dari ponsel masing-masing.
              </p>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-slate-700 dark:text-slate-300 truncate text-left">
                {window.location.origin}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shrink-0 flex items-center gap-1 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-400">
              Setiap kali siswa menekan <em>"Kirim & Lihat Hasil"</em> di ponsel mereka, lembar kerja dan grafik di layar proyektor ini akan otomatis ter-update dalam 1 detik.
            </p>

            <button
              type="button"
              onClick={() => setShowShareModal(false)}
              className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Kembali ke Layar Guru
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
