import React from 'react';

interface ChemistryDiagramProps {
  type?: 'grafik_konsentrasi' | 'partikel_luas' | 'rumus_mol' | 'rumus_molaritas';
}

export const ChemistryDiagram: React.FC<ChemistryDiagramProps> = ({ type }) => {
  if (!type) return null;

  if (type === 'grafik_konsentrasi') {
    return (
      <div className="my-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
          <span className="font-medium text-slate-700">Grafik Konsentrasi Pereaksi vs Waktu</span>
          <span>[A] vs t (detik)</span>
        </div>
        <div className="relative w-full h-48 bg-white rounded-lg border border-slate-200/80 p-3 shadow-xs">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 320 160">
            {/* Grid lines */}
            <line x1="40" y1="20" x2="300" y2="20" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="40" y1="60" x2="300" y2="60" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="40" y1="100" x2="300" y2="100" stroke="#f1f5f9" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="40" y1="140" x2="300" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />
            <line x1="40" y1="10" x2="40" y2="140" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Axis labels */}
            <text x="35" y="24" textAnchor="end" fontSize="10" fill="#64748b" className="font-mono">0,8 M</text>
            <text x="35" y="64" textAnchor="end" fontSize="10" fill="#64748b" className="font-mono">0,5 M</text>
            <text x="35" y="104" textAnchor="end" fontSize="10" fill="#64748b" className="font-mono">0,2 M</text>
            <text x="35" y="144" textAnchor="end" fontSize="10" fill="#64748b" className="font-mono">0</text>

            <text x="40" y="154" textAnchor="middle" fontSize="10" fill="#64748b" className="font-mono">0s</text>
            <text x="170" y="154" textAnchor="middle" fontSize="10" fill="#64748b" className="font-mono">10s</text>
            <text x="290" y="154" textAnchor="middle" fontSize="10" fill="#64748b" className="font-mono">20s</text>

            {/* Projection dashed lines for t=0 and t=10 */}
            <line x1="40" y1="20" x2="170" y2="20" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="170" y1="20" x2="170" y2="140" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="40" y1="60" x2="170" y2="60" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 2" />

            {/* Delta bracket */}
            <line x1="180" y1="20" x2="180" y2="60" stroke="#6366f1" strokeWidth="1.5" />
            <line x1="176" y1="20" x2="184" y2="20" stroke="#6366f1" strokeWidth="1.5" />
            <line x1="176" y1="60" x2="184" y2="60" stroke="#6366f1" strokeWidth="1.5" />
            <text x="190" y="44" fontSize="11" fill="#4f46e5" fontWeight="600" className="font-mono">
              Δ[A] = ?
            </text>

            {/* Curve path for reactant dropping */}
            <path
              d="M 40 20 Q 130 55 170 60 T 290 85"
              fill="none"
              stroke="#4f46e5"
              strokeWidth="2.5"
            />

            {/* Points */}
            <circle cx="40" cy="20" r="4.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />
            <circle cx="170" cy="60" r="4.5" fill="#4f46e5" stroke="#ffffff" strokeWidth="2" />

            <text x="50" y="16" fontSize="10" fill="#1e293b" fontWeight="600">Titik Awal (0,8 M)</text>
            <text x="175" y="75" fontSize="10" fill="#1e293b" fontWeight="600">Detik ke-10 (0,5 M)</text>
          </svg>
        </div>
        <p className="text-xs text-slate-500 mt-2 text-center">
          Konsentrasi pereaksi berkurang seiring berjalannya reaksi kimia.
        </p>
      </div>
    );
  }

  if (type === 'partikel_luas') {
    return (
      <div className="my-4 p-4 rounded-xl border border-slate-200 bg-slate-50/70">
        <div className="text-xs font-medium text-slate-700 mb-2">Ilustrasi Ukuran Butiran vs Bidang Sentuh</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
            <span className="text-xs font-semibold text-slate-700 block mb-2">1. Gula Pasir (Kasar)</span>
            <div className="h-20 flex items-center justify-center">
              <div className="w-14 h-14 bg-amber-100 border-2 border-amber-400 rounded-md shadow-xs flex items-center justify-center text-xs font-bold text-amber-800">
                1 Bongkah
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Hanya bagian luar yang bersentuhan dengan molekul air</p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-slate-200 text-center">
            <span className="text-xs font-semibold text-slate-700 block mb-2">2. Gula Halus (Serbuk)</span>
            <div className="h-20 flex items-center justify-center">
              <div className="grid grid-cols-4 gap-1 p-1">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div key={i} className="w-2.5 h-2.5 bg-amber-400 rounded-xs"></div>
                ))}
              </div>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Partikel terpecah: luas kontak dengan air bertambah berkali lipat</p>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'rumus_mol') {
    return (
      <div className="my-3 p-3 rounded-lg border border-indigo-100 bg-indigo-50/50 flex items-center justify-between text-xs">
        <div className="text-indigo-950 font-medium">Pengingat Hubungan Massa dan Mol:</div>
        <div className="font-mono bg-white px-2.5 py-1 rounded border border-indigo-200 text-indigo-700 font-semibold text-sm">
          n = massa (g) ÷ Ar
        </div>
      </div>
    );
  }

  if (type === 'rumus_molaritas') {
    return (
      <div className="my-3 p-3 rounded-lg border border-indigo-100 bg-indigo-50/50 flex items-center justify-between text-xs">
        <div className="text-indigo-950 font-medium">Pengingat Definisi Molaritas:</div>
        <div className="font-mono bg-white px-2.5 py-1 rounded border border-indigo-200 text-indigo-700 font-semibold text-sm">
          M = n (mol) ÷ V (Liter)
        </div>
      </div>
    );
  }

  return null;
};
