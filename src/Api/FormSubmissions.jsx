import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from './axiosClient';
import { FiDownload, FiArrowLeft, FiExternalLink } from 'react-icons/fi';
import { getApiErrorMessage } from '../lib/apiError';

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });
};

// إجابات checkbox تُخزّن كنص JSON في الـ backend (json_encode)
const parseCheckboxAnswer = (answer) => {
  if (Array.isArray(answer)) return answer;
  try {
    const parsed = JSON.parse(answer);
    return Array.isArray(parsed) ? parsed : [String(answer)];
  } catch {
    return [String(answer)];
  }
};

const AnswerValue = ({ answer }) => {
  const value = answer.answer;
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-500">—</span>;
  }

  // ملفات المتقدمين: الـ backend يعيد رابطاً موقّعاً صالحاً لساعة واحدة
  if (answer.field_type === 'file') {
    return (
      <a href={value} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-400 hover:underline">
        <FiExternalLink size={12} /> Open file
      </a>
    );
  }

  if (answer.field_type === 'checkbox') {
    return <span className="text-gray-200" dir="auto">{parseCheckboxAnswer(value).join(', ')}</span>;
  }

  return <span className="text-gray-200 whitespace-pre-line break-words" dir="auto">{String(value)}</span>;
};

const filenameFromHeaders = (headers, fallback) => {
  const disposition = headers?.['content-disposition'] || '';
  const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  return match ? decodeURIComponent(match[1]) : fallback;
};

const FormSubmissions = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState('');

  // GET /admin/forms/{slug}/submissions
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');

    axiosClient.get(`/admin/forms/${slug}/submissions`)
      .then((response) => {
        if (!cancelled) setSubmissions(response.data.submissions || []);
      })
      .catch((error) => {
        if (!cancelled) setLoadError(getApiErrorMessage(error, 'Failed to load submissions.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [slug]);

  // GET /admin/forms/{slug}/submissions/export — يحتاج التوكن، لذا نحمّله كـ blob بدل فتح الرابط مباشرة
  const handleExportCSV = async () => {
    setExporting(true);
    setExportError('');
    try {
      const response = await axiosClient.get(`/admin/forms/${slug}/submissions/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = filenameFromHeaders(response.headers, `${slug}-submissions.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(getApiErrorMessage(error, 'Failed to export CSV.'));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-[#0d1117] text-gray-100" dir="ltr">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
            <span>Admin</span>
            <span>/</span>
            <span>Forms</span>
            <span>/</span>
            <span className="text-[#ff7a00] font-semibold truncate">{slug}</span>
          </div>
          <h1 className="text-2xl font-bold text-white">Form Submissions</h1>
          <p className="text-sm text-gray-400 mt-1">
            {loading ? 'Review all submissions received for this form.' : `${submissions.length} submission${submissions.length === 1 ? '' : 's'} received.`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/admin/forms')}
            className="px-4 py-2.5 bg-[#161b22] border border-gray-800 text-gray-300 rounded-xl text-sm font-semibold hover:bg-gray-800 hover:text-white transition flex items-center gap-2 shadow-xs cursor-pointer"
          >
            <FiArrowLeft size={16} />
            <span>Back to Forms</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={exporting || submissions.length === 0}
            className="px-4 py-2.5 bg-[#ff7a00] text-white rounded-xl text-sm font-semibold hover:bg-[#e06c00] transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <FiDownload size={16} />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div role="alert" className="p-4 mb-6 rounded-xl text-sm border bg-red-500/10 text-red-400 border-red-500/25">{exportError}</div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-500 text-sm">Loading submissions...</div>
      ) : loadError ? (
        <div role="alert" className="bg-[#161b22] rounded-2xl p-12 text-center border border-red-500/25">
          <p className="text-red-400 text-sm">{loadError}</p>
        </div>
      ) : submissions.length === 0 ? (
        <div className="bg-[#161b22] rounded-2xl p-12 text-center border border-gray-800 shadow-xs">
          <p className="text-gray-400 text-sm">No submissions found for this form yet.</p>
        </div>
      ) : (
        <div className="bg-[#161b22] rounded-2xl shadow-xs border border-gray-800 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left border-collapse">
            <thead className="bg-[#0d1117]/70 border-b border-gray-800 text-xs text-gray-400 uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold"># ID</th>
                <th className="p-4 font-semibold">Submitted Answers</th>
                <th className="p-4 font-semibold">Submitted At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-sm text-gray-300">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-800/30 transition align-top">
                  <td className="p-4 font-medium text-white">#{sub.id}</td>
                  <td className="p-4">
                    <div className="space-y-2">
                      {sub.answers?.length > 0 ? (
                        sub.answers.map((ans) => (
                          <div key={ans.id} className="bg-[#0d1117] border border-gray-800 p-2.5 rounded-xl text-xs flex flex-col gap-0.5">
                            {/* الـ backend يعيد اسم الحقل بالمفتاح field-name */}
                            <span className="text-[#ff7a00] font-semibold" dir="auto">
                              {ans['field-name'] ?? ans.field_name ?? `Field #${ans.field_id}`}
                            </span>
                            <AnswerValue answer={ans} />
                          </div>
                        ))
                      ) : (
                        <span className="text-gray-500 text-xs">No answers available</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 text-xs whitespace-nowrap">{formatDate(sub.submitted_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FormSubmissions;
