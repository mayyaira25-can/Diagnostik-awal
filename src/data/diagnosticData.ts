import { Question, PrerequisiteKey } from '../types/diagnostic';

export const DEFAULT_CLASSES = [
  'XI MIPA 1',
  'XI MIPA 2',
  'XI MIPA 3',
  'XI MIPA 4',
  'XI MIPA 5',
  'XI MIPA 6'
];

export const PREREQUISITE_INFO: Record<
  PrerequisiteKey,
  {
    name: string;
    topic: string;
    formula: string;
    importance: string;
    remedialAction: string;
    enrichmentAction: string;
  }
> = {
  mol: {
    name: 'Konsep Mol & Stoikiometri',
    topic: 'Perhitungan Dasar Jumlah Partikel',
    formula: 'n = massa / Ar  atau  n = m / Mr',
    importance: 'Menentukan rasio mol zat reaktan dan produk dalam persamaan reaksi laju.',
    remedialAction: 'Berikan kartu pengingat "Segitiga Rumus Mol" dan dampingan tutor sebaya dalam menghitung mol dari gram.',
    enrichmentAction: 'Tantang menghitung jumlah partikel dengan tetapan Avogadro (L = 6,02 × 10²³) dan hukum kekekalan massa.'
  },
  molaritas: {
    name: 'Molaritas (Konsentrasi Larutan)',
    topic: 'Konsentrasi Molar dalam Satuan Liter',
    formula: 'M = n / V(Liter)  atau  M = (gram / Mr) × (1000 / mL)',
    importance: 'Laju reaksi dinyatakan sebagai perubahan konsentrasi molar reaktan/produk per satuan waktu (M/s).',
    remedialAction: 'Latih konversi volume mL ke Liter (dibagi 1000) dan latih pembagian desimal sederhana.',
    enrichmentAction: 'Latih perhitungan pengenceran larutan M₁V₁ = M₂V₂ dan pengaruhnya terhadap kerapatan partikel.'
  },
  grafik: {
    name: 'Grafik & Laju Reaksi',
    topic: 'Interpretasi Gradien & Perubahan Konsentrasi',
    formula: 'v = -Δ[Reaktan] / Δt  atau  v = +Δ[Produk] / Δt',
    importance: 'Memahami bahwa laju reaksi adalah kemiringan grafik: makin curam kemiringan, makin cepat laju reaksi.',
    remedialAction: 'Visualisasikan grafik dengan analogi lereng bukit curam vs landai, dan jelaskan arti tanda minus (pengurangan zat).',
    enrichmentAction: 'Bimbing menganalisis laju sesaat (garis singgung kurva) dan laju rata-rata pada grafik orde reaksi.'
  },
  luas: {
    name: 'Luas Permukaan & Teori Tumbukan',
    topic: 'Faktor Luas Permukaan Sentuh Partikel',
    formula: 'Semakin halus ukuran partikel → Luas bidang sentuh ↑ → Frekuensi tumbukan efektif ↑',
    importance: 'Konsep dasar mikroskopis mengapa ukuran partikel memengaruhi frekuensi tumbukan efektif partikel zat reaktan.',
    remedialAction: 'Gunakan demonstrasi kubus terbelah untuk memperlihatkan bagaimana luas permukaan bertambah saat dipotong halus.',
    enrichmentAction: 'Hubungkan dengan aplikasi industri kimia (katalis serbuk nano dan pulverised coal pada pembangkit listrik).'
  }
};

export const QUESTIONS: Question[] = [
  {
    id: 1,
    key: 'kesiapan',
    title: 'Pertanyaan Kesiapan Diri',
    subtitle: 'Saya merasa … untuk mempelajari materi Laju Reaksi kimia hari ini.',
    isAffective: true,
    options: [
      'Siap dan optimis paham',
      'Cukup siap, butuh pengingat konsep awal',
      'Perlu dibantu dan dibimbing dari awal'
    ],
    explanation: 'Pertanyaan ini digunakan guru untuk mengetahui kesiapan mental dan rasa percaya dirimu hari ini, sehingga guru dapat memandu dengan pendekatan yang nyaman.'
  },
  {
    id: 2,
    key: 'mol',
    title: 'Prasyarat 1: Konsep Mol (Stoikiometri)',
    subtitle: 'Berapakah mol yang terkandung dalam 2,4 gram logam magnesium (Mg)? Diketahui Ar Mg = 24.',
    diagramType: 'rumus_mol',
    options: ['0,01 mol', '0,1 mol', '1 mol', '57,6 mol'],
    correctIndex: 1,
    explanation: 'Rumus mol adalah n = massa (g) / Ar. Maka n = 2,4 g / 24 g/mol = 0,1 mol.',
    misconceptions: [
      { optionIndex: 0, diagnosis: 'Miskonsepsi desimal: siswa membagi 2,4 / 240 atau salah menaruh nol di depan koma.' },
      { optionIndex: 2, diagnosis: 'Estimasi kasar: siswa mengabaikan koma dan menganggap 2,4 mendekati 24.' },
      { optionIndex: 3, diagnosis: 'Operasi terbalik: siswa mengalikan massa dengan Ar (2,4 × 24 = 57,6) alih-alih membaginya.' }
    ]
  },
  {
    id: 3,
    key: 'molaritas',
    title: 'Prasyarat 2: Molaritas (Konsentrasi Larutan)',
    subtitle: 'Berapakah molaritas (M) larutan yang mengandung 0,2 mol HCl dilarutkan dalam 500 mL air?',
    diagramType: 'rumus_molaritas',
    options: ['0,1 M', '0,4 M', '4 M', '100 M'],
    correctIndex: 1,
    explanation: 'Molaritas M = n / V(Liter). Konversi volume: 500 mL = 0,5 Liter. Maka M = 0,2 mol / 0,5 L = 0,4 M.',
    misconceptions: [
      { optionIndex: 0, diagnosis: 'Operasi perkalian: siswa mengalikan 0,2 × 0,5 = 0,1 alih-alih membaginya.' },
      { optionIndex: 2, diagnosis: 'Lupa konversi satuan: siswa salah menghitung desimal persepuluhan (0,2 / 0,05) atau kekeliruan perhitungan.' },
      { optionIndex: 3, diagnosis: 'Tidak mengubah mL ke Liter: 500 / 0,2 = 2500 atau perkalian langsung 0,2 × 500 = 100.' }
    ]
  },
  {
    id: 4,
    key: 'grafik',
    title: 'Prasyarat 3: Perubahan Konsentrasi (ΔC)',
    subtitle: 'Konsentrasi zat pereaksi A turun dari 0,8 M (pada detik ke-0) menjadi 0,5 M (pada detik ke-10). Berapakah besar penurunan konsentrasinya (Δ[A])?',
    diagramType: 'grafik_konsentrasi',
    options: ['0,3 M', '1,3 M', '0,03 M', '0,5 M'],
    correctIndex: 0,
    explanation: 'Besar penurunan konsentrasi pereaksi adalah selisih awal dengan akhir: Δ[A] = [A]awal - [A]akhir = 0,8 M - 0,5 M = 0,3 M.',
    misconceptions: [
      { optionIndex: 1, diagnosis: 'Penjumlahan bukan selisih: siswa menjumlahkan 0,8 + 0,5 = 1,3 M.' },
      { optionIndex: 2, diagnosis: 'Membagi dengan waktu: siswa langsung membagi penurunan 0,3 dengan 10 detik (menghitung laju sebelum ditanya).' },
      { optionIndex: 3, diagnosis: 'Mengambil konsentrasi akhir: siswa hanya menyebut angka konsentrasi akhir 0,5 M.' }
    ]
  },
  {
    id: 5,
    key: 'grafik',
    title: 'Prasyarat 4: Kemiringan Grafik Konsentrasi vs Waktu',
    subtitle: 'Pada grafik konsentrasi pereaksi terhadap waktu, garis kurva yang LEBIH CURAM menunjukkan reaksi yang berlangsung …',
    options: ['Lebih cepat', 'Lebih lambat', 'Sama saja kecepatannya', 'Tidak dapat ditentukan'],
    correctIndex: 0,
    explanation: 'Kemiringan (gradien) yang curam berarti terjadi penurunan konsentrasi yang besar dalam waktu yang singkat, menandakan laju reaksi lebih cepat.',
    misconceptions: [
      { optionIndex: 1, diagnosis: 'Terbalik gradien: mengira curam berarti hambatan lebih besar sehingga mengira reaksi lebih lambat.' },
      { optionIndex: 2, diagnosis: 'Mengabaikan gradien: mengira selama kurvanya sama-sama turun, kecepatannya sama.' }
    ]
  },
  {
    id: 6,
    key: 'luas',
    title: 'Prasyarat 5: Luas Permukaan Bidang Sentuh',
    subtitle: 'Gula pasir butiran kasar dan gula halus (serbuk) dengan massa yang sama dilarutkan dalam volume air dan suhu yang sama. Manakah yang larut LEBIH CEPAT?',
    diagramType: 'partikel_luas',
    options: ['Gula pasir butiran kasar', 'Gula halus berbentuk serbuk', 'Keduanya larut sama cepat', 'Bergantung pada wadah pelarut'],
    correctIndex: 1,
    explanation: 'Gula halus (serbuk) memiliki luas permukaan bidang sentuh yang jauh lebih besar dibandingkan butiran kasar, sehingga lebih cepat larut.',
    misconceptions: [
      { optionIndex: 0, diagnosis: 'Mengira butiran kasar lebih berat sehingga lebih kuat menembus air.' },
      { optionIndex: 2, diagnosis: 'Mengira karena massa gramnya sama, kecepatan larutnya pasti sama persis.' }
    ]
  },
  {
    id: 7,
    key: 'luas',
    title: 'Prasyarat 6: Teori Tumbukan Partikel',
    subtitle: 'Alasan ilmiah yang paling tepat untuk jawabanmu pada soal nomor 6 di atas adalah …',
    options: [
      'Gula halus terasa lebih manis di lidah',
      'Luas permukaan bidang sentuh gula halus lebih besar, sehingga partikel air lebih banyak bertumbukan efektif dengan partikel gula',
      'Gula halus memiliki massa yang lebih ringan daripada gula pasir',
      'Gula halus memiliki ikatan kimia kovalen yang lebih rapuh'
    ],
    correctIndex: 1,
    explanation: 'Makin kecil ukuran partikel (makin halus), makin luas permukaan bidang sentuhnya. Bidang sentuh yang luas memberi peluang tumbukan antarpartikel yang jauh lebih banyak dan efektif.',
    misconceptions: [
      { optionIndex: 0, diagnosis: 'Menilai berdasarkan persepsi indera rasa, bukan konsep kimia mikroskopis.' },
      { optionIndex: 2, diagnosis: 'Miskonsepsi massa: menganggap serbuk lebih ringan padahal massanya sudah disamakan.' },
      { optionIndex: 3, diagnosis: 'Miskonsepsi ikatan: mengira penggilingan mengubah struktur ikatan kimia molekul gula.' }
    ]
  }
];

export const TEACHER_DIFFERENTIATION_GUIDE = {
  'Siap Tantangan': {
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    title: 'Kelompok 1: Siap Tantangan (Tinggi)',
    criteria: 'Skor 5–6 dan konsep mol & molaritas benar 100%',
    characteristic: 'Siswa telah menguasai fondasi perhitungan stoikiometri dan interpretasi visual laju reaksi.',
    actionPlan: [
      'Berikan tantangan studi kasus kontekstual "Insinyur Kimia Cilik" (menganalisis 2-3 faktor laju sekaligus pada katalis industri).',
      'Berdayakan sebagai Tutor Sebaya (Peer Tutor) untuk membantu teman kelompok yang memerlukan penguatan perhitungan.',
      'Langsung masuk ke materi penentuan persamaan laju reaksi v = k[A]^m[B]^n dan hukum orde reaksi.'
    ]
  },
  'Cukup Siap': {
    badgeClass: 'text-amber-700 bg-amber-50 border-amber-200',
    title: 'Kelompok 2: Cukup Siap (Menengah)',
    criteria: 'Skor 3–4',
    characteristic: 'Memahami prinsip kualitatif laju reaksi namun memerlukan sedikit pengingat pada konversi satuan atau pembagian desimal.',
    actionPlan: [
      'Review singkat 5 menit di awal jam pelajaran mengenai cara membaca gradien grafik konsentrasi vs waktu.',
      'Beri lembar kerja terbimbing (guided worksheet) dengan tahapan perhitungan yang berurutan.',
      'Gabungkan dalam kelompok belajar kooperatif bersama 1 siswa Siap Tantangan.'
    ]
  },
  'Perlu Pendampingan': {
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-200',
    title: 'Kelompok 3: Perlu Pendampingan (Awal)',
    criteria: 'Skor < 3 atau salah pada fondasi mol & molaritas',
    characteristic: 'Mengalami kendala pada prasyarat matematika kimia (konsep mol, konversi mL ke Liter, atau operasi desimal) serta rasa percaya diri yang masih ragu.',
    actionPlan: [
      'Berikan intervensi "Apersepsi Terfokus": sediakan kartu rumus segitiga n = m/Mr dan M = n/V.',
      'Guru memberikan bimbingan langsung (scaffolding) pada kelompok kecil saat sesi latihan mandiri.',
      'Gunakan analogi visual konkret (animasi partikel atau peragaan langsung) sebelum masuk rumus simbolik laju reaksi.'
    ]
  }
};
