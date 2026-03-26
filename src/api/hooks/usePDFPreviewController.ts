import { useRef } from "react";
import { usePreviewPDF } from "@/api/usePDFPreview";
import { usePDFPreview } from "@/context/PDFPreviewContext";

export const usePDFPreviewController = (config: {
  url: string;
  title?: string;
}) => {
  const context = usePDFPreview();

  // ✅ safe destructuring
  const openPreview = context?.openPreview;
  const setLoading = context?.setLoading;
  const setPdfUrl = context?.setPdfUrl;

  const previewPDF = usePreviewPDF({ url: config.url });

  // ✅ prevent double API call
  const isCallingRef = useRef(false);

  const open = async (payload?: any, customTitle?: string) => {
    // 🚫 block duplicate calls
    if (isCallingRef.current) return;
    isCallingRef.current = true;

    const title = customTitle || config.title || "Preview";

    try {
      // ❗ Guard: prevent invalid call
      if (!payload) {
        console.warn("Preview payload missing");
        return;
      }

      // ✅ Step 1: open modal immediately
      openPreview?.(null, title);

      // ✅ Step 2: reset + start loader
      setPdfUrl?.(null);
      setLoading?.(true);

      // ✅ Step 3: API call
      const url = await previewPDF.mutateAsync(payload);

      // ✅ ensure loader is visible (smooth UX)
      await new Promise((r) => setTimeout(r, 200));

      // ✅ Step 4: inject PDF
      if (setPdfUrl) {
        setPdfUrl(url);
      } else {
        // fallback for old context
        openPreview?.(url, title);
      }
    } catch (err) {
      console.error("PDF preview failed:", err);

      if (setPdfUrl) setPdfUrl(null);
    } finally {
      setLoading?.(false);
      isCallingRef.current = false; // ✅ release lock
    }
  };

  return {
    open,
    isLoading: previewPDF.isLoading,
  };
};