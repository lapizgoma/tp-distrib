import { useCallback, useState } from 'react';
import type { ReportFilters } from '../types/reports.types';
import { downloadAttendanceReport } from '../api/reportsRestApi';

interface UseReportDownloadReturn {
  downloading: boolean;
  error: string | null;
  download: (filters: ReportFilters) => Promise<boolean>;
}

export function useReportDownload(): UseReportDownloadReturn {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const download = useCallback(async (filters: ReportFilters): Promise<boolean> => {
    setDownloading(true);
    setError(null);
    try {
      await downloadAttendanceReport(filters);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
      return false;
    } finally {
      setDownloading(false);
    }
  }, []);

  return { downloading, error, download };
}
