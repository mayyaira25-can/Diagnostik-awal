import React, { useState, useEffect } from 'react';
import { StudentAssessment } from './components/StudentAssessment';
import { TeacherDashboard } from './components/TeacherDashboard';
import { subscribeToLiveStream, fetchSubmissions } from './services/api';
import { StudentSubmission } from './types/diagnostic';
import { GraduationCap, FlaskConical, Lock, X, HelpCircle, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'student' | 'teacher'>('student');
  const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [isTeacherAuthenticated, setIsTeacherAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('cekbekal_teacher_auth') === 'true';
  });
  const [newSubmissionToast, setNewSubmissionToast] = useState<StudentSubmission | null>(null);

  // Subscribe to real-time updates
  useEffect(() => {
    // Initial fetch
    fetchSubmissions().then((data) => {
      setSubmissions(data);
    });

    const unsubscribe = subscribeToLiveStream(
      (updatedList) => {
        setSubmissions(updatedList);
      },
      (status) => {
        setConnectionStatus(status);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const handleOpenTeacherView = () => {
    if (isTeacherAuthenticated) {
      setCurrentView('teacher');
    } else {
      setPinInput('');
      setPinError('');
      setShowPinModal(true);
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default PIN: 1234 or guru
    const normalized = pinInput.trim().toLowerCase();
    if (normalized === '1234' || normalized === 'guru' || normalized === 'kimia') {
      setIsTeacherAuthenticated(true);
      localStorage.setItem('cekbekal_teacher_auth', 'true');
      setShowPinModal(false);
      setCurrentView('teacher');
    } else {
      setPinError('PIN salah. Gunakan PIN default guru: 1234');
    }
  };

  const handleNewSubmissionRecorded = (newSub: StudentSubmission) => {
    // Show quick toast
    setNewSubmissionToast(newSub);
    setTimeout(() => {
      setNewSubmissionToast(null);
    }, 4000);
  };

  const handleManualRefresh = async () => {
    const data = await fetchSubmissions();
    setSubmissions(data);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Top Navigation Bar: Universal 3-Zone Contract */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single Brand wordmark */}
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setCurrentView('student');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <FlaskConical className="w-4 h-4" />
            </div>
            <span>Cek Bekal Kimia</span>
          </a>

          {/* Zone 2: Navigation Links */}
          <nav className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setCurrentView('student')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                currentView === 'student'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Asesmen Siswa
            </button>
            <button
              type="button"
              onClick={handleOpenTeacherView}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentView === 'teacher'
                  ? 'bg-indigo-50 text-indigo-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Dashboard Guru</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-3 shrink-0">
            {currentView === 'student' ? (
              <button
                type="button"
                onClick={handleOpenTeacherView}
                className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
              >
                Masuk Guru
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentView('student')}
                className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Buka Form Siswa
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1">
        {currentView === 'student' ? (
          <StudentAssessment
            onOpenTeacherView={handleOpenTeacherView}
            onNewSubmissionRecorded={handleNewSubmissionRecorded}
          />
        ) : (
          <TeacherDashboard
            submissions={submissions}
            connectionStatus={connectionStatus}
            onRefresh={handleManualRefresh}
            onOpenStudentView={() => setCurrentView('student')}
          />
        )}
      </div>

      {/* Live Toast Notification */}
      {newSubmissionToast && (
        <div className="fixed bottom-5 right-5 z-50 p-4 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 flex items-center gap-3 max-w-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="text-xs">
            <p className="font-bold">{newSubmissionToast.nama} baru saja mengirim!</p>
            <p className="text-slate-300">
              Kelas {newSubmissionToast.kelas} · Skor {newSubmissionToast.skor}/6 ({newSubmissionToast.level})
            </p>
          </div>
        </div>
      )}

      {/* Teacher Authentication PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">Verifikasi Guru</h3>
              <p className="text-xs text-slate-500 mt-1">
                Masukkan PIN Guru untuk mengakses pemetaan real-time dan analisis diferensiasi kelas.
              </p>
            </div>

            <form onSubmit={handleVerifyPin} className="space-y-3">
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Masukkan PIN (Default: 1234)"
                autoFocus
                className="w-full text-center tracking-widest text-lg font-mono py-2.5 px-4 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {pinError && <p className="text-xs text-rose-600 font-semibold">{pinError}</p>}

              <p className="text-[11px] text-slate-400">
                Petunjuk: PIN default adalah <strong className="text-slate-600">1234</strong>
              </p>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="py-2 px-3 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Buka Dashboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
        <span>Cek Bekal Detektif Kimia · Asesmen Diagnostik Awal Laju Reaksi & Diferensiasi Pembelajaran</span>
      </footer>
    </div>
  );
}
