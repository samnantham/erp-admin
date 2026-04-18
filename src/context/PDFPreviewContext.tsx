import { createContext, useContext, useState } from "react";
import { PDFPreviewModal } from "@/components/PDFPreview";

type PreviewState = {
  isOpen: boolean;
  pdfUrl: string | null;
  title: string;
  isEndpoint: boolean;
  loading: boolean;
};

const PDFPreviewContext = createContext<any>(null);

export const PDFPreviewProvider = ({ children }: any) => {
  const [state, setState] = useState<PreviewState>({
    isOpen: false,
    pdfUrl: null,
    title: "Preview",
    isEndpoint: false,
    loading: false,
  });

  // Open modal — pass null as pdfUrl when you want to show spinner first
  const openPreview = (pdfUrl: string | null, title = "Preview", isEndpoint = false) => {
    setState({
      isOpen: true,
      pdfUrl,
      title,
      isEndpoint,
      loading: !pdfUrl, // if no URL yet, start loading
    });
  };

  // Inject PDF URL after POST fetch completes
  const setPdfUrl = (url: string | null) => {
    setState((prev) => ({ ...prev, pdfUrl: url }));
  };

  // Control spinner manually
  const setLoading = (loading: boolean) => {
    setState((prev) => ({ ...prev, loading }));
  };

  const closePreview = () => {
    // Revoke blob URLs to free memory
    if (state.pdfUrl?.startsWith("blob:")) {
      URL.revokeObjectURL(state.pdfUrl);
    }
    setState({
      isOpen: false,
      pdfUrl: null,
      title: "Preview",
      isEndpoint: false,
      loading: false,
    });
  };

  return (
    <PDFPreviewContext.Provider value={{ openPreview, closePreview, setPdfUrl, setLoading }}>
      {children}
      <PDFPreviewModal
        isOpen={state.isOpen}
        onClose={closePreview}
        pdfUrlOrEndpoint={state.pdfUrl ?? ""}
        isEndpoint={state.isEndpoint}
        title={state.title}
        isLoading={state.loading}
      />
    </PDFPreviewContext.Provider>
  );
};

export const usePDFPreview = () => useContext(PDFPreviewContext);