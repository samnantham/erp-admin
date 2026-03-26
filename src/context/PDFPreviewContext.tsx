import { createContext, useContext, useState } from "react";
import { PDFPreviewModal } from "@/components/PDFPreview";

type PreviewState = {
  isOpen: boolean;
  pdfUrl: string;
  title: string;
  isEndpoint: boolean;
};

const PDFPreviewContext = createContext<any>(null);

export const PDFPreviewProvider = ({ children }: any) => {
  const [state, setState] = useState<PreviewState>({
    isOpen: false,
    pdfUrl: "",
    title: "Preview",
    isEndpoint: false
  });

  const openPreview = (pdfUrl: string, title = "Preview") => {
    setState({
      isOpen: true,
      pdfUrl,
      title,
      isEndpoint: false
    });
  };

  const closePreview = () => {
    if (state.pdfUrl) URL.revokeObjectURL(state.pdfUrl);

    setState({
      isOpen: false,
      pdfUrl: "",
      title: "Preview",
      isEndpoint: false
    });
  };

  return (
    <PDFPreviewContext.Provider value={{ openPreview, closePreview }}>
      {children}

      {/* ✅ Global modal here */}
      <PDFPreviewModal
        isOpen={state.isOpen}
        onClose={closePreview}
        pdfUrlOrEndpoint={state.pdfUrl}
        isEndpoint={state.isEndpoint}
        title={state.title}
      />
    </PDFPreviewContext.Provider>
  );
};

export const usePDFPreview = () => useContext(PDFPreviewContext);