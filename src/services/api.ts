import { StudentSubmission, ClassStats } from '../types/diagnostic';

export async function fetchSubmissions(kelas?: string): Promise<StudentSubmission[]> {
  try {
    const url = kelas && kelas !== 'Semua' ? `/api/submissions?kelas=${encodeURIComponent(kelas)}` : '/api/submissions';
    const res = await fetch(url);
    if (!res.ok) throw new Error('Gagal mengambil data siswa');
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Fetch submissions error:', err);
    return [];
  }
}

export async function submitDiagnostic(payload: {
  nama: string;
  kelas: string;
  nis?: string;
  ans: number[];
}): Promise<{ success: boolean; data?: StudentSubmission; error?: string }> {
  try {
    const res = await fetch('/api/submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.error || 'Gagal mengirim hasil tes' };
    }
    return { success: true, data: json.data };
  } catch (err: any) {
    return { success: false, error: err.message || 'Koneksi ke server guru terganggu' };
  }
}

export async function deleteSubmission(id: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/submissions/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.error('Delete submission error:', err);
    return false;
  }
}

export async function resetSubmissions(kelas?: string): Promise<boolean> {
  try {
    const res = await fetch('/api/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kelas })
    });
    return res.ok;
  } catch (err) {
    console.error('Reset submissions error:', err);
    return false;
  }
}

export async function seedDemoSubmissions(): Promise<StudentSubmission[]> {
  try {
    const res = await fetch('/api/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const json = await res.json();
    return json.data || [];
  } catch (err) {
    console.error('Seed submissions error:', err);
    return [];
  }
}

export async function fetchStats(kelas?: string): Promise<ClassStats | null> {
  try {
    const url = kelas && kelas !== 'Semua' ? `/api/stats?kelas=${encodeURIComponent(kelas)}` : '/api/stats';
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Fetch stats error:', err);
    return null;
  }
}

/**
 * Connect to SSE stream for live updates with auto-reconnect
 */
export function subscribeToLiveStream(
  onUpdate: (data: StudentSubmission[]) => void,
  onStatusChange?: (status: 'connecting' | 'connected' | 'disconnected') => void
): () => void {
  let eventSource: EventSource | null = null;
  let pollingInterval: any = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;
    onStatusChange?.('connecting');

    try {
      eventSource = new EventSource('/api/stream');

      eventSource.addEventListener('init', (e: MessageEvent) => {
        try {
          const list = JSON.parse(e.data);
          onUpdate(list);
          onStatusChange?.('connected');
        } catch (err) {
          console.error('SSE init parse error:', err);
        }
      });

      eventSource.addEventListener('update_all', (e: MessageEvent) => {
        try {
          const list = JSON.parse(e.data);
          onUpdate(list);
        } catch (err) {
          console.error('SSE update_all parse error:', err);
        }
      });

      eventSource.addEventListener('new_submission', () => {
        // also covered by update_all or fallback fetch
      });

      eventSource.onopen = () => {
        onStatusChange?.('connected');
      };

      eventSource.onerror = () => {
        onStatusChange?.('disconnected');
        eventSource?.close();
        // Fallback polling if SSE disconnects
        if (!pollingInterval && !isClosed) {
          pollingInterval = setInterval(async () => {
            const latest = await fetchSubmissions();
            if (latest.length > 0) onUpdate(latest);
          }, 4000);
        }
        // Try reconnecting SSE after 5 seconds
        setTimeout(() => {
          if (!isClosed) connect();
        }, 5000);
      };
    } catch (err) {
      console.warn('SSE not supported or blocked, switching to polling:', err);
      onStatusChange?.('connected');
      pollingInterval = setInterval(async () => {
        const latest = await fetchSubmissions();
        onUpdate(latest);
      }, 4000);
    }
  };

  connect();

  return () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };
}
