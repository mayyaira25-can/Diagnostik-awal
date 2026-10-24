import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { QUESTIONS, DEFAULT_CLASSES, PREREQUISITE_INFO } from '../data/diagnosticData';
import { ChemistryDiagram } from './ChemistryDiagram';
import { submitDiagnostic } from '../services/api';
import { StudentSubmission, ReadinessLevel } from '../types/diagnostic';
import {
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  BookOpen,
  Send,
  GraduationCap,
  Layers,
  BarChart2
} from 'lucide-react';

interface StudentAssessmentProps {
  onOpenTeacherView: () => void;
  onNewSubmissionRecorded?: (submission: StudentSubmission) => void;
}

export const StudentAssessment: React.FC<StudentAssessmentProps> = ({
  onOpenTeacherView,
  onNewSubmissionRecorded
}) => {
  const [step, setStep] = useState<number>(-1); // -1 = registration, 0..6 = questions, 7 = result
  const [nama, setNama] = useState<string>('');
  const [kelas, setKelas] = useState<string>('');
  const [nis, setNis] = useState<string>('');
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean | null>(null);
  const [submissionResult, setSubmissionResult] = useState<StudentSubmission | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setValidationError('Silakan masukkan nama lengkapmu terlebih dahulu.');
      return;
    }
    if (!kelas) {
      setValidationError('Silakan pilih kelasmu.');
      return;
    }
    setValidationError('');
    setAnswers([]);
    setStep(0);
  };

  const handleSelectOption = (optionIndex: number) => {
    const updated = [...answers];
    updated[step] = optionIndex;
    setAnswers(updated);
  };

  const handleNext = async () => {
    if (answers[step] === undefined) {
      setValidationError('Pilihlah salah satu jawaban untuk melanjutkan.');
      return;
    }
    setValidationError('');

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      // Final step: submit to server
      await handleSubmitAssessment();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
      setValidationError('');
    }
  };

  const handleSubmitAssessment = async () => {
    setSubmitting(true);
    setSendSuccess(null);

    const res = await submitDiagnostic({
      nama: nama.trim(),
      kelas: kelas.trim(),
      nis: nis.trim() || undefined,
      ans: answers
    });

    setSubmitting(false);

    if (res.success && res.data) {
      setSendSuccess(true);
      setSubmissionResult(res.data);
      onNewSubmissionRecorded?.(res.data);

      // Trigger celebratory confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (err) {
        // ignore if not supported
      }
      setStep(7); // Show results
    } else {
      setSendSuccess(false);
      // Even if offline, calculate locally so student isn't stuck
      const localResult = calculateLocalResult(answers);
      setSubmissionResult(localResult);
      setStep(7);
    }
  };

  const calculateLocalResult = (ans: number[]): StudentSubmission => {
    const per: Record<string, { b: number; n: number }> = {
      mol: { b: 0, n: 1 },
      molaritas: { b: 0, n: 1 },
      grafik: { b: 0, n: 2 },
      luas: { b: 0, n: 2 }
    };
    let skor = 0;
    QUESTIONS.forEach((q, idx) => {
      if (q.isAffective) return;
      if (ans[idx] === q.correctIndex) {
        per[q.key].b++;
        skor++;
      }
    });

    let level: ReadinessLevel = 'Perlu Pendampingan';
    if (skor >= 5 && per.mol.b === 1 && per.molaritas.b === 1) {
      level = 'Siap Tantangan';
    } else if (skor >= 3) {
      level = 'Cukup Siap';
    }

    const lemah = Object.keys(per).filter((k) => per[k].b < per[k].n);
    const kesiapanOptions = ['siap', 'cukup siap', 'perlu dibantu'];

    return {
      id: `local_${Date.now()}`,
      nama: nama.trim(),
      kelas: kelas.trim(),
      ans,
      kesiapan: kesiapanOptions[ans[0]] || 'cukup siap',
      skor,
      tot: 6,
      level,
      per,
      lemah,
      submittedAt: new Date().toISOString()
    };
  };

  const handleRestart = () => {
    setStep(-1);
    setAnswers([]);
    setSubmissionResult(null);
    setSendSuccess(null);
  };

  // Helper color for readiness
  const getLevelBadge = (level: ReadinessLevel) => {
    switch (level) {
      case 'Siap Tantangan':
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          dot: 'bg-emerald-500',
          label: 'Siap Tantangan'
        };
      case 'Cukup Siap':
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-200',
          dot: 'bg-amber-500',
          label: 'Cukup Siap'
        };
      case 'Perlu Pendampingan':
      default:
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-200',
          dot: 'bg-rose-500',
          label: 'Perlu Pendampingan'
        };
    }
  };

  // VIEW 1: WELCOME & REGISTRATION
  if (step === -1) {
    return (
      <div className="max-w-xl mx-auto py-8 px-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-violet-800 text-white p-6 sm:p-8">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold tracking-wide uppercase mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Asesmen Diagnostik Awal Kimia</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
              Cek Bekal Detektif: Laju Reaksi
            </h1>
            <p className="text-indigo-100 text-sm leading-relaxed">
              Selamat datang di asesmen awal materi Laju Reaksi. Asesmen ini{' '}
              <strong className="text-white underline decoration-amber-400 decoration-2">tidak dinilai angka rapor</strong>
              . Tujuannya murni untuk memetakan pemahamanmu terhadap materi prasyarat agar guru dapat mendampingimu dengan tepat.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleStart} className="p-6 sm:p-8 space-y-5">
            <div>
              <label htmlFor="student-name" className="block text-sm font-semibold text-slate-800 mb-1.5">
                Nama Lengkap Siswa <span className="text-rose-500">*</span>
              </label>
              <input
                id="student-name"
                type="text"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Muhammad Rafif"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                autoComplete="name"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="student-class" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Kelas <span className="text-rose-500">*</span>
                </label>
                <select
                  id="student-class"
                  value={kelas}
                  onChange={(e) => setKelas(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="">-- Pilih Kelas --</option>
                  {DEFAULT_CLASSES.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="student-nis" className="block text-sm font-semibold text-slate-800 mb-1.5">
                  Nomor Absen / NIS <span className="text-slate-400 text-xs font-normal">(Opsional)</span>
                </label>
                <input
                  id="student-nis"
                  type="text"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="Contoh: 18 / 2024019"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                />
              </div>
            </div>

            {/* Information Notice */}
            <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-3 text-xs text-indigo-900">
              <BookOpen className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-indigo-950">Materi Prasyarat yang Dicek:</p>
                <p className="text-slate-600 mt-0.5">
                  1) Kesiapan diri, 2) Konsep Mol, 3) Molaritas larutan, 4) Perubahan konsentrasi, 5) Kemiringan grafik, 6) Luas permukaan & tumbukan.
                </p>
              </div>
            </div>

            {validationError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{validationError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              <span>Mulai Asesmen Detektif</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Teacher link switch */}
          <div className="bg-slate-50 px-6 py-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
            <span>Bapak/Ibu Guru ingin melihat rekapitulasi?</span>
            <button
              type="button"
              onClick={onOpenTeacherView}
              className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Buka Dashboard Guru</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 2: QUESTION STEP (0 to 6)
  if (step >= 0 && step < QUESTIONS.length) {
    const currentQ = QUESTIONS[step];
    const progressPercent = Math.round(((step + 1) / QUESTIONS.length) * 100);
    const selectedAnswer = answers[step];

    return (
      <div className="max-w-xl mx-auto py-6 px-4">
        {/* Progress header */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-semibold text-indigo-700">
              Soal {step + 1} dari {QUESTIONS.length}
            </span>
            <span className="font-mono tabular-nums">{progressPercent}% Selesai</span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
          {/* Prerequisite Indicator */}
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
              {currentQ.isAffective ? 'Afektif / Refleksi Diri' : currentQ.title}
            </span>
            <span className="text-xs text-slate-400">
              {nama} ({kelas})
            </span>
          </div>

          {/* Question Text */}
          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-snug mb-2">
            {currentQ.subtitle || currentQ.title}
          </h2>

          {/* Interactive diagram if question has one */}
          <ChemistryDiagram type={currentQ.diagramType} />

          {/* Options */}
          <div className="space-y-2.5 mt-5">
            {currentQ.options.map((optionText, idx) => {
              const isSelected = selectedAnswer === idx;
              const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectOption(idx)}
                  className={`w-full text-left p-3.5 rounded-xl border text-sm transition-all flex items-start gap-3 cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <span
                    className={`shrink-0 w-6 h-6 rounded-lg font-semibold text-xs flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {optionLetter}
                  </span>
                  <span className="leading-snug pt-0.5">{optionText}</span>
                </button>
              );
            })}
          </div>

          {validationError && (
            <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 0}
              className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="px-5 py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? (
                <span>Mengirim Jawaban…</span>
              ) : step === QUESTIONS.length - 1 ? (
                <>
                  <span>Kirim & Lihat Hasil</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>Lanjut</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW 3: STUDENT RESULT & DIFFERENTIATED RECOMMENDATION
  if (step === 7 && submissionResult) {
    const badge = getLevelBadge(submissionResult.level);

    return (
      <div className="max-w-xl mx-auto py-8 px-4 space-y-5">
        {/* Top Result Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border mb-3 ${badge.bg}">
            <span className={`w-2 h-2 rounded-full ${badge.dot}`}></span>
            <span>Kategori: {submissionResult.level}</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Hasil Pemetaan Bekal Kimia
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            {submissionResult.nama} · Kelas {submissionResult.kelas}
          </p>

          {/* Big Score Dial */}
          <div className="my-6 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 max-w-xs mx-auto">
            <div className="text-4xl font-extrabold text-indigo-700 tracking-tight font-mono">
              {submissionResult.skor} <span className="text-lg text-slate-400 font-normal">/ {submissionResult.tot}</span>
            </div>
            <p className="text-xs font-medium text-slate-600 mt-1">
              Soal Prasyarat Kimia Dijawab Tepat
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Refleksi kesiapanmu: <span className="font-semibold text-slate-700">"{submissionResult.kesiapan}"</span>
            </p>
          </div>

          {/* Sync Status Alert */}
          <div
            className={`p-3 rounded-xl border text-xs flex items-center justify-between text-left ${
              sendSuccess === true
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800'
                : 'bg-amber-50/80 border-amber-200 text-amber-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {sendSuccess === true
                  ? 'Data jawabanmu sudah otomatis terhubung ke Layar Guru secara real-time.'
                  : 'Jawaban tersimpan di perambanmu. Guru dapat melihatnya saat tersambung.'}
              </span>
            </div>
            {sendSuccess === false && (
              <button
                type="button"
                onClick={handleSubmitAssessment}
                className="text-xs font-bold underline hover:text-amber-950 shrink-0 ml-2"
              >
                Kirim Ulang
              </button>
            )}
          </div>
        </div>

        {/* Detailed Breakdown Per Prerequisite */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <span>Ketepatan Per Topik Prasyarat</span>
          </h2>

          <div className="space-y-3">
            {Object.keys(submissionResult.per).map((key) => {
              const item = submissionResult.per[key];
              const info = PREREQUISITE_INFO[key as keyof typeof PREREQUISITE_INFO];
              const isPerfect = item.b === item.n;

              return (
                <div
                  key={key}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-800">{info?.name || key}</p>
                    <p className="text-[11px] text-slate-500">{info?.formula}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs font-semibold text-slate-700">
                      {item.b}/{item.n}
                    </span>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                        isPerfect
                          ? 'bg-emerald-100 text-emerald-800'
                          : item.b > 0
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isPerfect ? 'Kuasai' : 'Perlu Penguatan'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Personal Learning Recommendations */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Rekomendasi Tindak Lanjut Belajarmu</span>
          </h2>

          {submissionResult.lemah.length === 0 ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs leading-relaxed">
              <p className="font-bold text-emerald-950 mb-1">🎉 Selamat! Semua prasyarat kamu jawab dengan tepat!</p>
              <p>
                Kamu siap melangkah ke materi inti laju reaksi dan dapat menjadi <strong>Tutor Sebaya</strong> bagi
                teman kelompokmu saat mengerjakan studi kasus <em>"Insinyur Kimia Cilik"</em>.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 text-xs">
              <p className="text-slate-600 mb-2">
                Jangan berkecil hati, guru akan memberikan penguatan pada topik berikut sebelum materi inti dimulai:
              </p>
              {submissionResult.lemah.map((weakKey) => {
                const info = PREREQUISITE_INFO[weakKey as keyof typeof PREREQUISITE_INFO];
                return (
                  <div key={weakKey} className="p-3 rounded-lg border border-indigo-100 bg-indigo-50/40">
                    <span className="font-bold text-indigo-900 block">{info?.name}:</span>
                    <span className="text-slate-700">{info?.remedialAction}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={handleRestart}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Ulangi Asesmen</span>
          </button>

          <button
            type="button"
            onClick={onOpenTeacherView}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
          >
            <BarChart2 className="w-4 h-4 text-indigo-400" />
            <span>Buka Dashboard Analitik Guru</span>
          </button>
        </div>
      </div>
    );
  }

  return null;
};
