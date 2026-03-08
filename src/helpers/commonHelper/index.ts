import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { keyframes } from '@emotion/react';
import pluralize from "pluralize";

type QueryData = {
  status: boolean;
  items?: Record<string, string | number>;
};

type SelectOption = {
  value: string | number;
  label: string | number;
};

interface HistoryOption {
  id: number;
  value: string;
  label: string;
}

type FilteredObject = {
  [key: string]: string;
};

interface Contact {
  address: string;
  address_line2: string;
  attention: string;
  city: string;
  country: string;
  created_at: string;
  customer_id: number;
  customer: {
    business_name: string;
    business_type: {
      created_at: string;
      id: number;
      modified_at: string;
      name: string;
    };
    business_type_id: number;
    code: string;
    contact_type: {
      created_at: string;
      id: number;
      modified_at: string;
      name: string;
    };
    contact_type_id: number;
    created_at: string;
    currency: {
      code: string;
      created_at: string;
      id: number;
      modified_at: string;
      name: string;
    };
    currency_id: number;
    email: string | null;
    id: number;
    is_foreign_entity: boolean;
    license_trade_exp_date: string | null;
    license_trade_no: string | null;
    license_trade_url: string | null;
    modified_at: string;
    nature_of_business: string;
    remarks: string | null;
    vat_tax_id: string | null;
    vat_tax_url: string | null;
    year_of_business: number | null;
  };
  email: string | null;
  fax: string | null;
  id: number;
  modified_at: string;
  phone: string;
  remarks: string | null;
  state: string;
  zip_code: string;
}

export const filterUOMoptions = (options: any, group_id: number) => {
  let filteredItems = [];
  if (options.length > 0) {
    filteredItems = options.filter((item: any) => item.group_id === group_id);
  }
  return convertToOptions(filteredItems);
};

export const filterObject = (
  obj: FilteredObject,
  keys: string[]
): FilteredObject => {
  const filteredObj: FilteredObject = {};
  keys.forEach((key) => {
    if (obj[key]) {
      filteredObj[key] = obj[key];
    }
  });
  return filteredObj;
};

export const calculateVolumetricWeight = (
  length: number,
  width: number,
  height: number,
  uomId: string | undefined,
  uomItems: any
) => {
  if (uomId) {
    const uomItem: any = uomItems.find(
      (item: any) => item.id.toString() === uomId.toString()
    );
    const uomLabel = uomItem ? uomItem.name : '';
    switch (uomLabel) {
      case 'CM':
        const weight_cm = (length * width * height) / 6000;
        return Number(weight_cm.toFixed(2));
      case 'Meter':
        const weight_m = (length * width * height) / 0.006;
        return Number(weight_m.toFixed(2));
      case 'INCH':
        const weight_inch = (length * width * height) / 366;
        return Number(weight_inch.toFixed(2));
      default:
        return 0;
    }
  }
};

export const getPRTypeLabel = (prType: string) => {
  switch (prType) {
    case 'sel':
      return 'SEL';
    case 'wo':
      return 'WO';
    case 'stock':
      return 'Stock';
    case 'oe':
      return 'Open Enquiry';
    case 'project':
      return 'Project';
    default:
      return '';
  }
};

export const formatDate = (date: string | number | Date) =>
  date ? format(new Date(date), 'yyyy-MM-dd') : undefined;

export const removeHtmlTags = (html: string): string => {
  if (!html) return '';
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  return tempDiv.textContent || tempDiv.innerText || '';
};

export const convertToOptions = (options: any) => {
  let convertedOptions: any = [];
  options.forEach((item: any) => {
    let object: any = {};
    object.value = item.id.toString();
    object.label = item.name;
    convertedOptions.push(object);
  });
  return convertedOptions;
};

export const convertArrayToOptions = (options: any, prefix: string = '') => {
  let convertedOptions: any = [];
  options.forEach((item: number) => {
    let object: any = {};
    object.value = item.toString();
    object.label = prefix + item.toString();
    convertedOptions.push(object);
  });
  return convertedOptions;
};

export function filterDuplicates<T>(arr: T[], uniqueKey: keyof T): T[] {
  const seen = new Set(); // Track seen values
  return arr.filter((item) => {
    const keyValue = item[uniqueKey]; // Get the value of the unique key
    if (seen.has(keyValue)) {
      return false; // Skip if already seen
    }
    seen.add(keyValue); // Mark as seen
    return true; // Keep if unique
  });
}

export const convertHistoriesToOptions = (options: any) => {
  let convertedOptions: HistoryOption[] = [];
  options.forEach((item: any) => {
    let object: any = {};
    object.id = item.id;
    object.value = item.id.toString();
    object.label = `${item.user.username} ${format(new Date(item.date), 'dd-MM-yyyy HH:mm')}`;
    convertedOptions.push(object);
  });
  return convertedOptions;
};

export const reArrangeColumns = (
  tableColumns: any,
  id: string,
  position: number
) => {
  const updatedColumns = [...tableColumns];
  const typeColumnIndex = updatedColumns.findIndex((col: any) => col.id === id);
  if (typeColumnIndex !== -1) {
    const typeColumn = updatedColumns.splice(typeColumnIndex, 1)[0];
    updatedColumns.splice(position, 0, typeColumn); // Move to the front
  }
  return updatedColumns;
};

export const checkValuesUnMatched = (value1: any, value2: any): boolean => {
  let status: boolean = false;
  if (
    value1 !== null ||
    (value1 !== undefined && value2 !== null) ||
    value2 !== undefined
  ) {
    if (
      (value1 ? value1.toString() : '') === (value2 ? value2.toString() : '')
    ) {
      status = true;
    }
  }
  return status;
};

export const getDisplayLabel = (
  options: any,
  optionValue: any,
  label: string
) => {
  if (options && optionValue !== null) {
    let optiontoFind = options.find(
      (option: any) => option.value.toString() === optionValue.toString()
    );
    return optiontoFind?.label ?? 'Unknown ' + label;
  }
};

export const extractAfterHyphen = (input: any) => {
  if (input) {
    const parts = input.split('-');
    if (parts.length > 1) {
      return parts[1].trim();
    } else {
      return ' - ';
    }
  }
};

export const countByProperty = (
  array: TODO,
  property: keyof TODO,
  value: string
): number => {
  return array.reduce((count: TODO, item: TODO) => {
    return item[property] === value ? count + 1 : count;
  }, 0);
};

export const formatFullAddress = (contact: Contact) => {
  const parts = [
    `${contact.address ? convertToSentenceCase(contact.address) + '</br>' : ''}`,
    `${contact.address_line2 ? convertToSentenceCase(contact.address_line2) + '</br>' : ''}`,
    `${contact.city ? convertToSentenceCase(contact.city) + ', ' : ''}`,
    `${contact.state ? convertToSentenceCase(contact.state) + '</br>' : ''}`,
    `${contact.country ? contact.country + (contact?.zip_code ? ' - ' : '</br>') : ''}`,
    `${contact.zip_code ? contact.zip_code + '</br>' : ''}`,
  ].filter(Boolean);

  return parts.join(' ');
};

export const formatContactAddress = (contact: any) => {
  const parts = [
    contact.address
      ? contact.address
          .split('\n')
          .filter((line: string) => line.trim())
          .join('<br />') + '<br />'
      : '',
    contact.address_line2
      ? `${convertToSentenceCase(contact.address_line2)}<br />`
      : '',
    contact.city ? `${contact.city}, ` : '',
    contact.state ? `${contact.state}<br />` : '',
    contact.country
      ? `${contact.country}${contact.zip_code ? ' - ' : '<br />'}`
      : '',
    contact.zip_code ? `${contact.zip_code}<br />` : '',
    contact.phone ? `${contact.phone}<br />` : '',
    contact.email ? `${contact.email}<br />` : '',
    contact.attention ? `<strong>Attn:</strong> ${contact.attention}` : '',
  ].filter(Boolean);

  return parts.join('');
};

export const formatShippingAddress = (shippingAddress: any) => {
  const parts = [
    shippingAddress?.consignee_name
      ? `<strong>${shippingAddress.consignee_name}</strong><br />`
      : '',
    shippingAddress?.address
      ? shippingAddress.address
          .split('\n')
          .filter((line: string) => line.trim())
          .join('<br />') + '<br />'
      : '',
    shippingAddress?.city ? `${shippingAddress.city}, ` : '',
    shippingAddress?.state ? `${shippingAddress.state}<br />` : '',
    shippingAddress?.country
      ? `${shippingAddress.country}${shippingAddress.zip_code ? ' - ' : '<br />'}`
      : '',
    shippingAddress?.zip_code ? `${shippingAddress.zip_code}<br />` : '',
    shippingAddress?.phone ? `${shippingAddress.phone}<br />` : '',
    shippingAddress?.email ? `${shippingAddress.email}<br />` : '',
    shippingAddress?.attention
      ? `<strong>Attn:</strong> ${shippingAddress.attention}<br />`
      : '',
  ].filter(Boolean);

  return parts.join('');
};

export const cutString = (str: string, maxLength: number = 15): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength);
};

export const parseCSV = (uploadedFile: any) => {
  return new Promise((resolve, reject) => {
    Papa.parse(uploadedFile, {
      complete: (result) => {
        let rows: any = removeObjectsWithDifferentProperties(result.data);
        let respData: any = transformPropertiesToLowercase(rows);
        resolve(respData);
      },
      error: (error) => reject(error),
      header: true,
    });
  });
};

export const parseCSVHeaders = (uploadedFile: any) => {
  return new Promise((resolve, reject) => {
    Papa.parse(uploadedFile, {
      complete: (result) => {
        // Get headers from meta.fields and convert to lowercase
        const headers = result.meta.fields?.map(header => 
          header.toLowerCase().trim()
        ) || [];
        resolve(headers);
      },
      error: (error) => reject(error),
      header: true, // This enables header parsing and populates meta.fields
    });
  });
};

export const triggerPrint = async (input: HTMLElement) => {
  const pageWidth = 210;
  const pageHeight = 297;
  const pixelRatio = 2;

  const canvas = await html2canvas(input, {
    scale: pixelRatio,
    logging: false,
    useCORS: true,
    backgroundColor: '#FFFFFF',
    windowWidth: input.scrollWidth,
    windowHeight: input.scrollHeight,
  });

  const imgHeight = (canvas.height * pageWidth) / canvas.width;
  const totalPages = Math.ceil(imgHeight / pageHeight);

  const pdf = new (await import('jspdf')).jsPDF({
    unit: 'mm',
    format: 'a4',
  });

  for (let i = 0; i < totalPages; i++) {
    if (i > 0) pdf.addPage();

    const pageCanvas = document.createElement('canvas');
    const ctx = pageCanvas.getContext('2d')!;
    pageCanvas.width = canvas.width;
    pageCanvas.height = Math.min(
      (pageHeight * canvas.width) / pageWidth,
      canvas.height - (i * (pageHeight * canvas.width)) / pageWidth
    );

    ctx.drawImage(
      canvas,
      0,
      (i * (pageHeight * canvas.width)) / pageWidth,
      canvas.width,
      pageCanvas.height,
      0,
      0,
      canvas.width,
      pageCanvas.height
    );

    pdf.addImage(
      pageCanvas.toDataURL('image/png'),
      'PNG',
      0,
      0,
      pageWidth,
      Math.min(pageHeight, (pageCanvas.height * pageWidth) / canvas.width)
    );
  }

  const pdfBlob = pdf.output('blob');
  const pdfUrl = URL.createObjectURL(pdfBlob);

  let iframe = document.getElementById('printFrame') as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.id = 'printFrame';
    document.body.appendChild(iframe);
  }

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    }, 500);
  };

  iframe.src = pdfUrl;
};

export const downloadPDF = async (input: HTMLElement, fileName: string) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    orientation: 'p',
    unit: 'mm',
    format: 'a4',
  });

  // Clone input and inject current styles
  const clone = input.cloneNode(true) as HTMLElement;
  const styleTags = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  );
  const styleHTML = styleTags.map((tag) => tag.outerHTML).join('');
  clone.insertAdjacentHTML('afterbegin', styleHTML);

  await doc.html(clone, {
    callback: (pdf) => {
      pdf.save(
        fileName + '-' + format(new Date(), 'dd-MM-yyyy@HH-mm') + '.pdf'
      );
    },
    margin: [10, 10, 0, 10],
    autoPaging: 'text',
    width: 190,
    windowWidth: 800,
  });
};

const convertToSentenceCase = (text: string) => {
  if (!text) return '';

  return text
    .replace(/[-_]/g, ' ')
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const exportTableAs = (
  columns: any,
  data: any,
  fileName: string,
  fileType: 'csv' | 'pdf' = 'csv'
) => {
  const filteredHeaders = columns.slice(0, -1);

  const headers = filteredHeaders.map((column: any) => ({
    label: column.header,
    key: column.accessorKey || column.id,
    accessorFn: column.cell,
  }));

  const getNestedValue = (obj: any, path: string): any => {
    if (!path) return '';
    return path.split('.').reduce((o, p) => (o || {})[p], obj);
  };

  const processRow = (item: any, index: number) => {
    const row: Record<string, any> = {};
    headers.forEach((header: any) => {
      if (header.accessorFn) {
        if (header.key !== 'sNo') {
          const info = {
            getValue: () => getNestedValue(item, header.key),
            row: {
              original: item,
              getValue: (key: string) => getNestedValue(item, key),
            },
            column: {
              id: header.key,
            },
          };

          try {
            row[header.label] = header.accessorFn(info);
          } catch (error) {
            console.error(`Error processing column ${header.key}:`, error);
            row[header.label] = '';
          }
        } else {
          row[header.label] = index + 1;
        }
      } else {
        row[header.label] = getNestedValue(item, header.key);
      }
    });
    return row;
  };

  const processedData = data.map(processRow);
  if (fileType === 'csv') {
    downloadCSV(processedData, fileName);
  } else if (fileType === 'pdf') {
    generatePDF(headers, processedData, fileName);
  }
};

const generatePDF = (headers: any[], data: any[], fileName: string) => {
  const doc = new jsPDF({
    orientation: 'landscape',
  });

  // Add title
  doc.setFontSize(18);
  doc.text(convertToSentenceCase(fileName + '-report'), 14, 20);

  // Prepare data for jsPDF-autotable
  const pdfHeaders = headers.map((h) => h.label);
  const pdfRows = data.map((row) => {
    return headers.map((header) => {
      const value = row[header.label];
      return value === null || value === undefined ? '' : String(value);
    });
  });

  // Generate table
  (doc as any).autoTable({
    startY: 25,
    head: [pdfHeaders],
    body: pdfRows,
    styles: {
      cellPadding: 3,
      fontSize: 8,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [12, 37, 86],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Save the PDF
  doc.save(
    fileName + '-report-' + format(new Date(), 'dd-MM-yyyy@HH-mm') + '.pdf'
  );
};

export const downloadCSV = (data: any, fileName: string) => {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute(
    'download',
    fileName + '-report-' + format(new Date(), 'dd-MM-yyyy@HH-mm') + '.csv'
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const getTableItems = (items: any, value: string, parameter: string) => {
  if (items) {
    let itemtoFind = items.find((option: any) => option[parameter] === value);
    return itemtoFind?.items ?? [];
  }
};

export const getPackageNumber = (
  packageTypeList: any,
  rowId: number,
  value: number
) => {
  console.log(packageTypeList, rowId, value);
  const packageTypeId = value;
  return generatePackageNumber(packageTypeList, packageTypeId, rowId);
};

export const generatePackageNumber = (
  packageTypeList: any,
  packageTypeId: number | string,
  rowId: number
) => {
  const packageTypeLabel = packageTypeList.data?.items[Number(packageTypeId)];
  if (!packageTypeLabel) return `PKG${rowId}`;
  const prefix =
    packageTypeLabel
      .match(/\b(\w)/g)
      ?.join('')
      .toUpperCase() || 'PKG';
  return `${prefix}${rowId}`;
};

export const transformToSelectOptions = (data?: QueryData): SelectOption[] => {
  if (!data || !data.items) {
    return [];
  }

  return Object.entries(data.items).map(([key, value]) => ({
    value: key,
    label: value,
  }));
};

export const transformPartsToSelectOptions = (data?: any) => {
  let options: any = [];
  Object.entries(data).forEach(([key]) => {
    let obj: any = {
      value: key, // `value` should be assigned to `key` in this case
      label: `${data[key].part_number?.part_number} - ${data[key]?.part_number?.description}`, // `label` should be assigned to `value`
    };
    options.push(obj);
  });

  return options;
};

export const replaceNumbersWithID = (
  input: string,
  replacementWord: string
): string => {
  const regex = /\d+/g; // Matches one or more digits
  return input.replace(regex, replacementWord);
};

export const getPropertyList = (array: any, property: string): string => {
  if (array.length > 0) {
    return array.map((item: any) => item[property]).join(', ');
  } else {
    return 'N/A';
  }
};

export const handleDownload = (fileUrl: any) => {
  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = fileUrl.split('/').pop();
  link.click();
};

export const removeObjectsWithDifferentProperties = (arr: TODO) => {
  if (arr.length === 0) return [];
  const numProperties = Object.keys(arr[0]).length;
  return arr.filter((obj: any) => Object.keys(obj).length === numProperties);
};

export const transformPropertiesToLowercase = (arr: TODO) => {
  return arr.map((obj: any) => {
    const transformedObj: TODO = {};

    // Loop over each property of the object
    Object.keys(obj).forEach((key) => {
      // Convert the key to lowercase and replace spaces with underscores
      const newKey = key.toLowerCase().replace(/ /g, '_');
      transformedObj[newKey] = obj[key];
    });

    return transformedObj;
  });
};

export const getValueByLabel = (
  label: string,
  options: any
): string | undefined => {
  const foundItem = options.find(
    (item: any) => item.label.toLowerCase() === label.toLowerCase()
  );
  return foundItem ? foundItem.value : undefined;
};

export const getValueByValue = (
  value: string,
  options: any
): string | undefined => {
  const foundItem = options.find(
    (item: any) => item.value.toLowerCase() === value.toLowerCase()
  );
  return foundItem ? foundItem.value : undefined;
};

export const isArray = (value: TODO) => Array.isArray(value);
export const isObject = (value: TODO) =>
  typeof value === 'object' && !isArray(value);

export const checkArraysHasSameValues = (array1: any[], array2: any[]): boolean => {
  if (array1.length !== array2.length) {
    return false;
  }
  
  // Create sorted copies to compare values regardless of order
  const sortedArray1 = [...array1].sort();
  const sortedArray2 = [...array2].sort();
  
  return sortedArray1.every((value, index) => value === sortedArray2[index]);
};

export const blinkRowBg = keyframes`
  0%, 100% { background-color: var(--chakra-colors-red-50); }
  50%      { background-color: var(--chakra-colors-red-300); }
`;

export const formatModelTitle = (model?: string) => {
  if (!model) return "";

  return model
    .split("-")
    .map(word => {
      const singular = pluralize.singular(word);
      return singular.charAt(0).toUpperCase() + singular.slice(1);
    })
    .join(" ");
};
 