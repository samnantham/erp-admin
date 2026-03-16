import { useState } from 'react';

export const usePdfPreview = () => {
    const [pdfUrl, setPdfUrl] = useState('');
    const [pdfTitle, setPdfTitle] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const openPreview = (url: string, title?: string) => {
        setPdfUrl(url);
        setPdfTitle(title ?? 'PDF Preview');
        setIsOpen(true);
    };

    const closePreview = () => {
        setIsOpen(false);
        setPdfUrl('');
        setPdfTitle('');
    };

    return { pdfUrl, pdfTitle, isOpen, openPreview, closePreview };
};