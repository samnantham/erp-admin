import { Styles } from '@chakra-ui/theme-tools';

export const styles: Styles = {
  global: () => ({
    html: {
      bg: 'gray.50',
    },
    body: {
      overflowY: 'scroll',
      WebkitTapHighlightColor: 'transparent',
      bg: 'white',
    },
    '#chakra-toast-portal > *': {
      pt: 'safe-top',
      pl: 'safe-left',
      pr: 'safe-right',
      pb: 'safe-bottom',
    },
    form: {
      display: 'flex',
      flexDir: 'column',
      flex: 1,
    },
    '.disabled-input input, label[data-disabled]': {
      opacity: '1!important',
      pointerEvents: 'none!important',
    },
    '.disabled-input .input-disabled': {
      opacity: '1!important',
      background: 'white!important',
      pointerEvents: 'auto!important',
    },

    '.chakra-input__group input[disabled], input[readonly], input[disabled], textarea[disabled]':
      {
        opacity: '1!important',
        backgroundColor: 'rgb(245 245 235 / 87%)',
        cursor: 'not-allowed!important',
      },
    '.disabled-input [data-disabled]': {
      opacity: '1!important',
      backgroundColor: 'rgb(245 245 235 / 87%)',
      cursor: 'not-allowed!important',
    },
    '.uploader input' : {
      cursor: 'all-scroll!important'
    },
    '.disabled-input label': {
      backgroundColor: 'transparent!important',
    },
    'table .disabled-input [data-readonly]': {
      backgroundColor: '#f4f6ed!important',
    },
     '.year-picker input[readonly]': {
      backgroundColor: '#fff!important',
      cursor: 'pointer!important'
    },
    'table .disabled-input input[disabled], table .disabled-input input[readonly]':
      {
        backgroundColor: 'transparent!important',
      },
    'textarea[disabled]': {
      resize: 'none',
    },
    '.box-inputs input': {
      fontSize: '0.65rem!important',
      padding: '0.25rem!important',
    },
    '.box-inputs .chakra-form-control div': {
      fontSize: '0.65rem!important',
    },
    '.quill': {
      borderColor: '#e2e8f0',
      fontFamily: 'system-ui,sans-serif',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    '.quill .ql-container': {
      minHeight: '150px',
      fontFamily: 'system-ui,sans-serif',
      fontSize: '16px',
      borderBottomStartRadius: '8px',
      borderBottomEndRadius: '8px',
    },
    '.quill .ql-toolbar': {
      borderTopStartRadius: '8px',
      borderTopEndRadius: '8px',
    },
    '.tox-edit-area': {
      borderColor: '#e2e8f0',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    },
    '.tox-statusbar__branding, .tox-statusbar__path-item': {
      display: 'none!important',
    },
    '.tableRadius-0 .chakra-table__container': {
      borderRadius: '0!important',
    },
    '.tox .tox-editor-header': {
      borderBottom: 'solid #e2e8f0!important',
      zIndex: '0!important',
      padding: '0!important',
    },
    '.reMarksCommanDisplays:hover .reMarkstextHideShow': {
      display: 'none',
    },
    '#fr-logo': {
      display: 'none',
    },
    '#table-to-export, #pdfFooter, #pdfHeader': {
      fontFamily: 'Arial, Helvetica, sans-serif !important',
    },
    '.reMarksCommanDisplays:hover .reMarksButtonHideShow': {
      display: 'block',
    },
    '.reMarksCommanDisplays .reMarksButtonHideShow': {
      display: 'none',
    },
    '.popupForm label': {
      fontWeight: 'semibold!important',
    },
    '.daypicker': {
      zIndex: '99999!important',
    },
    '.modal-container': {
      overflow: 'visible!important',
    },
    '.comparison-table td, .comparison-table th, .comparison-table tr': {
      fontSize: '12px!important',
    },
    '.previewTableBody td': {
      borderBottom: '1px #ccc black',
      borderTop: '0px solid black',
      borderLeft: '0px solid black',
      borderRight: '0px solid black',
    },
    '@media print': {
      body: {
        margin: 0,
        padding: 0,
      },
      '.page-break': {
        pageBreakBefore: 'always',
      },
      '.no-print': {
        display: 'none',
      },
    },
  }),
};
