import { FC, useEffect, useState } from 'react';

import { FormControl, FormLabel } from '@chakra-ui/react';
import ReactCountryFlag from 'react-country-flag';
import Select from 'react-select';

// Define the country structure
interface Country {
  country_code: string;
  name: string;
  code: string;
}

// Country list
const countryOptions: Country[] = [
  { country_code: 'af', name: 'Afghanistan', code: '+93' },
  { country_code: 'al', name: 'Albania', code: '+355' },
  { country_code: 'dz', name: 'Algeria', code: '+213' },
  { country_code: 'ad', name: 'Andorra', code: '+376' },
  { country_code: 'ao', name: 'Angola', code: '+244' },
  { country_code: 'ar', name: 'Argentina', code: '+54' },
  { country_code: 'am', name: 'Armenia', code: '+374' },
  { country_code: 'au', name: 'Australia', code: '+61' },
  { country_code: 'at', name: 'Austria', code: '+43' },
  { country_code: 'az', name: 'Azerbaijan', code: '+994' },
  { country_code: 'bh', name: 'Bahrain', code: '+973' },
  { country_code: 'bd', name: 'Bangladesh', code: '+880' },
  { country_code: 'by', name: 'Belarus', code: '+375' },
  { country_code: 'be', name: 'Belgium', code: '+32' },
  { country_code: 'bj', name: 'Benin', code: '+229' },
  { country_code: 'bt', name: 'Bhutan', code: '+975' },
  { country_code: 'bo', name: 'Bolivia', code: '+591' },
  { country_code: 'br', name: 'Brazil', code: '+55' },
  { country_code: 'bg', name: 'Bulgaria', code: '+359' },
  { country_code: 'ca', name: 'Canada', code: '+1' },
  { country_code: 'cl', name: 'Chile', code: '+56' },
  { country_code: 'cn', name: 'China', code: '+86' },
  { country_code: 'co', name: 'Colombia', code: '+57' },
  { country_code: 'hr', name: 'Croatia', code: '+385' },
  { country_code: 'cu', name: 'Cuba', code: '+53' },
  { country_code: 'cz', name: 'Czech Republic', code: '+420' },
  { country_code: 'dk', name: 'Denmark', code: '+45' },
  { country_code: 'eg', name: 'Egypt', code: '+20' },
  { country_code: 'ee', name: 'Estonia', code: '+372' },
  { country_code: 'fi', name: 'Finland', code: '+358' },
  { country_code: 'fr', name: 'France', code: '+33' },
  { country_code: 'de', name: 'Germany', code: '+49' },
  { country_code: 'gh', name: 'Ghana', code: '+233' },
  { country_code: 'gr', name: 'Greece', code: '+30' },
  { country_code: 'hk', name: 'Hong Kong', code: '+852' },
  { country_code: 'hu', name: 'Hungary', code: '+36' },
  { country_code: 'is', name: 'Iceland', code: '+354' },
  { country_code: 'in', name: 'India', code: '+91' },
  { country_code: 'id', name: 'Indonesia', code: '+62' },
  { country_code: 'ir', name: 'Iran', code: '+98' },
  { country_code: 'iq', name: 'Iraq', code: '+964' },
  { country_code: 'ie', name: 'Ireland', code: '+353' },
  { country_code: 'il', name: 'Israel', code: '+972' },
  { country_code: 'it', name: 'Italy', code: '+39' },
  { country_code: 'jp', name: 'Japan', code: '+81' },
  { country_code: 'jo', name: 'Jordan', code: '+962' },
  { country_code: 'kz', name: 'Kazakhstan', code: '+7' },
  { country_code: 'ke', name: 'Kenya', code: '+254' },
  { country_code: 'kr', name: 'South Korea', code: '+82' },
  { country_code: 'kw', name: 'Kuwait', code: '+965' },
  { country_code: 'lv', name: 'Latvia', code: '+371' },
  { country_code: 'lb', name: 'Lebanon', code: '+961' },
  { country_code: 'ly', name: 'Libya', code: '+218' },
  { country_code: 'lt', name: 'Lithuania', code: '+370' },
  { country_code: 'lu', name: 'Luxembourg', code: '+352' },
  { country_code: 'my', name: 'Malaysia', code: '+60' },
  { country_code: 'mx', name: 'Mexico', code: '+52' },
  { country_code: 'ma', name: 'Morocco', code: '+212' },
  { country_code: 'np', name: 'Nepal', code: '+977' },
  { country_code: 'nl', name: 'Netherlands', code: '+31' },
  { country_code: 'nz', name: 'New Zealand', code: '+64' },
  { country_code: 'ng', name: 'Nigeria', code: '+234' },
  { country_code: 'no', name: 'Norway', code: '+47' },
  { country_code: 'om', name: 'Oman', code: '+968' },
  { country_code: 'pk', name: 'Pakistan', code: '+92' },
  { country_code: 'pa', name: 'Panama', code: '+507' },
  { country_code: 'pe', name: 'Peru', code: '+51' },
  { country_code: 'ph', name: 'Philippines', code: '+63' },
  { country_code: 'pl', name: 'Poland', code: '+48' },
  { country_code: 'pt', name: 'Portugal', code: '+351' },
  { country_code: 'qa', name: 'Qatar', code: '+974' },
  { country_code: 'ro', name: 'Romania', code: '+40' },
  { country_code: 'ru', name: 'Russia', code: '+7' },
  { country_code: 'sa', name: 'Saudi Arabia', code: '+966' },
  { country_code: 'sg', name: 'Singapore', code: '+65' },
  { country_code: 'za', name: 'South Africa', code: '+27' },
  { country_code: 'es', name: 'Spain', code: '+34' },
  { country_code: 'se', name: 'Sweden', code: '+46' },
  { country_code: 'ch', name: 'Switzerland', code: '+41' },
  { country_code: 'tw', name: 'Taiwan', code: '+886' },
  { country_code: 'th', name: 'Thailand', code: '+66' },
  { country_code: 'tr', name: 'Turkey', code: '+90' },
  { country_code: 'ua', name: 'Ukraine', code: '+380' },
  { country_code: 'ae', name: 'United Arab Emirates', code: '+971' },
  { country_code: 'gb', name: 'United Kingdom', code: '+44' },
  { country_code: 'us', name: 'United States', code: '+1' },
  { country_code: 'vn', name: 'Vietnam', code: '+84' },
];

// Convert countries to react-select options
const formattedOptions = countryOptions.map((country) => ({
  value: country.code,
  label: (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <ReactCountryFlag
        countryCode={country.country_code.toUpperCase()}
        svg
        style={{ width: '1.5em', height: '1.5em' }}
      />
      {country.name} ({country.code.toUpperCase()})
    </div>
  ),
}));

const CountryCodeDropdown: FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const handleChange = (selectedOption: any) => {
    setSelectedCountry(selectedOption?.value || '');
  };

  useEffect(() => {
    console.log(selectedCountry);
  }, [selectedCountry]);

  return (
    <FormControl>
      <FormLabel>Country Code</FormLabel>
      <Select
        options={formattedOptions}
        onChange={handleChange}
        placeholder="Select country"
      />
    </FormControl>
  );
};

export default CountryCodeDropdown;
