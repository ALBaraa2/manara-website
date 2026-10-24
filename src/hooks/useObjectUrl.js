import { useEffect, useState } from 'react';

// رابط معاينة مؤقت لملف مختار، يُحرَّر تلقائياً عند تغيير الملف أو إغلاق الصفحة
const useObjectUrl = (file) => {
  const [url, setUrl] = useState(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
};

export default useObjectUrl;
