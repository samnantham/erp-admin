import React from 'react';

// Library to convert numbers to words
import { Box, Text } from '@chakra-ui/react';
import { toWords } from 'number-to-words';

// Define types for currency mapping
type CurrencyUnit = {
  main: string;
  fractional: string;
};

type CurrencyMap = {
  [key: string]: CurrencyUnit;
};

// Currency mapping for main and fractional units
const CURRENCY_MAP: CurrencyMap = {
    USD: { main: 'dollar', fractional: 'cent' },
    CAD: { main: 'dollar', fractional: 'cent' },
    EUR: { main: 'euro', fractional: 'cent' },
    AED: { main: 'dirham', fractional: 'fils' },
    AFN: { main: 'afghani', fractional: 'pul' },
    ALL: { main: 'lek', fractional: 'qindarkë' },
    AMD: { main: 'dram', fractional: 'luma' },
    ARS: { main: 'peso', fractional: 'centavo' },
    AUD: { main: 'dollar', fractional: 'cent' },
    AZN: { main: 'manat', fractional: 'qəpik' },
    BAM: { main: 'convertible mark', fractional: 'fening' },
    BDT: { main: 'taka', fractional: 'poisha' },
    BGN: { main: 'lev', fractional: 'stotinka' },
    BHD: { main: 'dinar', fractional: 'fils' },
    BIF: { main: 'franc', fractional: 'centime' },
    BND: { main: 'dollar', fractional: 'cent' },
    BOB: { main: 'boliviano', fractional: 'centavo' },
    BRL: { main: 'real', fractional: 'centavo' },
    BWP: { main: 'pula', fractional: 'thebe' },
    BYN: { main: 'ruble', fractional: 'kopeck' },
    BZD: { main: 'dollar', fractional: 'cent' },
    CDF: { main: 'franc', fractional: 'centime' },
    CHF: { main: 'franc', fractional: 'rappen' },
    CLP: { main: 'peso', fractional: 'centavo' },
    CNY: { main: 'yuan', fractional: 'fen' },
    COP: { main: 'peso', fractional: 'centavo' },
    CRC: { main: 'colón', fractional: 'céntimo' },
    CVE: { main: 'escudo', fractional: 'centavo' },
    CZK: { main: 'koruna', fractional: 'haléř' },
    DJF: { main: 'franc', fractional: 'centime' },
    DKK: { main: 'krone', fractional: 'øre' },
    DOP: { main: 'peso', fractional: 'centavo' },
    DZD: { main: 'dinar', fractional: 'santeem' },
    EGP: { main: 'pound', fractional: 'piastre' },
    ERN: { main: 'nakfa', fractional: 'cent' },
    ETB: { main: 'birr', fractional: 'santim' },
    GBP: { main: 'pound', fractional: 'penny' },
    GEL: { main: 'lari', fractional: 'tetri' },
    GHS: { main: 'cedi', fractional: 'pesewa' },
    GNF: { main: 'franc', fractional: 'centime' },
    GTQ: { main: 'quetzal', fractional: 'centavo' },
    HKD: { main: 'dollar', fractional: 'cent' },
    HNL: { main: 'lempira', fractional: 'centavo' },
    HRK: { main: 'kuna', fractional: 'lipa' },
    HUF: { main: 'forint', fractional: 'fillér' },
    IDR: { main: 'rupiah', fractional: 'sen' },
    ILS: { main: 'shekel', fractional: 'agora' },
    INR: { main: 'rupee', fractional: 'paise' },
    IQD: { main: 'dinar', fractional: 'fils' },
    IRR: { main: 'rial', fractional: 'dinar' },
    ISK: { main: 'króna', fractional: 'eyrir' },
    JMD: { main: 'dollar', fractional: 'cent' },
    JOD: { main: 'dinar', fractional: 'piastre' },
    JPY: { main: 'yen', fractional: 'sen' },
    KES: { main: 'shilling', fractional: 'cent' },
    KHR: { main: 'riel', fractional: 'sen' },
    KMF: { main: 'franc', fractional: 'centime' },
    KRW: { main: 'won', fractional: 'jeon' },
    KWD: { main: 'dinar', fractional: 'fils' },
    KZT: { main: 'tenge', fractional: 'tïın' },
    LAK: { main: 'kip', fractional: 'att' },
    LBP: { main: 'pound', fractional: 'piastre' },
    LKR: { main: 'rupee', fractional: 'cent' },
    LRD: { main: 'dollar', fractional: 'cent' },
    LSL: { main: 'loti', fractional: 'sente' },
    LYD: { main: 'dinar', fractional: 'dirham' },
    MAD: { main: 'dirham', fractional: 'centime' },
    MDL: { main: 'leu', fractional: 'ban' },
    MGA: { main: 'ariary', fractional: 'iraimbilanja' },
    MKD: { main: 'denar', fractional: 'deni' },
    MMK: { main: 'kyat', fractional: 'pya' },
    MNT: { main: 'tugrik', fractional: 'möngö' },
    MOP: { main: 'pataca', fractional: 'avo' },
    MRU: { main: 'ouguiya', fractional: 'khoums' },
    MUR: { main: 'rupee', fractional: 'cent' },
    MVR: { main: 'rufiyaa', fractional: 'laari' },
    MWK: { main: 'kwacha', fractional: 'tambala' },
    MXN: { main: 'peso', fractional: 'centavo' },
    MYR: { main: 'ringgit', fractional: 'sen' },
    MZN: { main: 'metical', fractional: 'centavo' },
    NAD: { main: 'dollar', fractional: 'cent' },
    NGN: { main: 'naira', fractional: 'kobo' },
    NIO: { main: 'córdoba', fractional: 'centavo' },
    NOK: { main: 'krone', fractional: 'øre' },
    NPR: { main: 'rupee', fractional: 'paisa' },
    NZD: { main: 'dollar', fractional: 'cent' },
    OMR: { main: 'rial', fractional: 'baisa' },
    PAB: { main: 'balboa', fractional: 'centésimo' },
    PEN: { main: 'sol', fractional: 'céntimo' },
    PGK: { main: 'kina', fractional: 'toea' },
    PHP: { main: 'peso', fractional: 'centavo' },
    PKR: { main: 'rupee', fractional: 'paisa' },
    PLN: { main: 'złoty', fractional: 'grosz' },
    PYG: { main: 'guaraní', fractional: 'céntimo' },
    QAR: { main: 'riyal', fractional: 'dirham' },
    RON: { main: 'leu', fractional: 'ban' },
    RSD: { main: 'dinar', fractional: 'para' },
    RUB: { main: 'ruble', fractional: 'kopeck' },
    RWF: { main: 'franc', fractional: 'centime' },
    SAR: { main: 'riyal', fractional: 'halala' },
    SBD: { main: 'dollar', fractional: 'cent' },
    SCR: { main: 'rupee', fractional: 'cent' },
    SDG: { main: 'pound', fractional: 'piastre' },
    SEK: { main: 'krona', fractional: 'öre' },
    SGD: { main: 'dollar', fractional: 'cent' },
    SHP: { main: 'pound', fractional: 'penny' },
    SLL: { main: 'leone', fractional: 'cent' },
    SOS: { main: 'shilling', fractional: 'cent' },
    SRD: { main: 'dollar', fractional: 'cent' },
    SSP: { main: 'pound', fractional: 'piastre' },
    STD: { main: 'dobra', fractional: 'cêntimo' },
    SYP: { main: 'pound', fractional: 'piastre' },
    SZL: { main: 'lilangeni', fractional: 'cent' },
    THB: { main: 'baht', fractional: 'satang' },
    TJS: { main: 'somoni', fractional: 'diram' },
    TMT: { main: 'manat', fractional: 'tenge' },
    TND: { main: 'dinar', fractional: 'millime' },
    TOP: { main: 'paʻanga', fractional: 'seniti' },
    TRY: { main: 'lira', fractional: 'kuruş' },
    TTD: { main: 'dollar', fractional: 'cent' },
    TWD: { main: 'dollar', fractional: 'cent' },
    TZS: { main: 'shilling', fractional: 'cent' },
    UAH: { main: 'hryvnia', fractional: 'kopiyka' },
    UGX: { main: 'shilling', fractional: 'cent' },
    UYU: { main: 'peso', fractional: 'centésimo' },
    UZS: { main: 'som', fractional: 'tiyin' },
    VES: { main: 'bolívar', fractional: 'céntimo' },
    VND: { main: 'dong', fractional: 'hào' },
    VUV: { main: 'vatu', fractional: 'cent' },
    WST: { main: 'tala', fractional: 'sene' },
    XAF: { main: 'franc', fractional: 'centime' },
    XCD: { main: 'dollar', fractional: 'cent' },
    XOF: { main: 'franc', fractional: 'centime' },
    XPF: { main: 'franc', fractional: 'centime' },
    YER: { main: 'rial', fractional: 'fils' },
    ZAR: { main: 'rand', fractional: 'cent' },
    ZMW: { main: 'kwacha', fractional: 'ngwee' },
    ZWL: { main: 'dollar', fractional: 'cent' },
  };

// Props for the CurrencyToWords component
interface CurrencyToWordsProps {
  amount: number | string;
  currency?: string;
}

export const CurrencyToWords: React.FC<CurrencyToWordsProps> = ({
  amount,
  currency = 'USD',
}) => {

  const numericAmount =
    typeof amount === 'string' ? parseFloat(amount) : amount;

  const { main, fractional } = CURRENCY_MAP[currency] || {
    main: 'unit',
    fractional: 'subunit',
  };

  const [mainUnit, fractionalUnit] = String(numericAmount.toFixed(2)).split(
    '.'
  );

  const mainUnitWords = toWords(Number(mainUnit));
  const fractionalUnitWords = toWords(Number(fractionalUnit));
  const mainText = Number(mainUnit) === 1 ? main : `${main}s`;
  const fractionalText =
    Number(fractionalUnit) === 1 ? fractional : `${fractional}s`;

  // Combine the results
  const currencyInWords =
    fractionalUnit === '00'
      ? `${mainUnitWords} ${mainText}`
      : `${mainUnitWords} ${mainText} and ${fractionalUnitWords} ${fractionalText}`;

  return (
    <Box>
      <Text fontSize="10px"  fontWeight="bold">Amount in words:</Text>
      <Text fontSize="10px">
      {`${currency} `}
        <Text fontSize="10px" textTransform="capitalize" as="span">
          {currencyInWords}
        </Text>
      </Text>
    </Box>
  );
};

export default CurrencyToWords;
