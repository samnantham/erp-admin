import {
  AsyncCreatableProps,
  AsyncProps,
  AsyncCreatableSelect as ChakraAsyncCreatableSelect,
  AsyncSelect as ChakraAsyncReactSelect,
  CreatableSelect as ChakraCreatableReactSelect,
  Select as ChakraReactSelect,
  CreatableProps,
  GroupBase,
  Props,
} from 'chakra-react-select';

export type SelectProps<
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
> =
  | ({
    type?: 'select';
    isReadOnly?: boolean;
    maxLength?: number;
    isCaseSensitive?: boolean;
    onlyAlphabets?: boolean;
    onCreateOption?: (inputValue: string) => void;
    onInputChange?: (inputValue: string, meta: any) => void;
  } & Props<Option, IsMulti, Group>)
  | ({
    type: 'creatable';
    isReadOnly?: boolean;
    maxLength?: number;
    isCaseSensitive?: boolean;
    onlyAlphabets?: boolean;
    onCreateOption?: (inputValue: string) => void;
    onInputChange?: (inputValue: string, meta: any) => void;
  } & CreatableProps<Option, IsMulti, Group>)
  | ({
    type: 'async';
    isReadOnly?: boolean;
    maxLength?: number;
    isCaseSensitive?: boolean;
    onlyAlphabets?: boolean;
    onCreateOption?: (inputValue: string) => void;
    onInputChange?: (inputValue: string, meta: any) => void;
  } & AsyncProps<Option, IsMulti, Group>)
  | ({
    type: 'async-creatable';
    isReadOnly?: boolean;
    maxLength?: number;
    isCaseSensitive?: boolean;
    onlyAlphabets?: boolean;
    onCreateOption?: (inputValue: string) => void;
    onInputChange?: (inputValue: string, meta: any) => void;
  } & AsyncCreatableProps<Option, IsMulti, Group>);

export const Select = <
  Option = unknown,
  IsMulti extends boolean = false,
  Group extends GroupBase<Option> = GroupBase<Option>,
>({
  type = 'select',
  maxLength,
  isCaseSensitive,
  onlyAlphabets,
  onCreateOption,
  onInputChange,
  isReadOnly,
  ...props
}: SelectProps<Option, IsMulti, Group>) => {
  const handleInputChange = (inputValue: string, actionMeta: any) => {
    let value = maxLength ? inputValue.substring(0, maxLength) : inputValue;

    if (onlyAlphabets) {
      value = value.replace(/[^A-Za-z]/g, '');
    }

    if (isCaseSensitive) {
      value = value.toUpperCase();
    }

    if (onInputChange) {
      onInputChange(value, actionMeta);
    }

    return value;
  };

  const Element = (() => {
    if (type === 'async-creatable') return ChakraAsyncCreatableSelect;
    if (type === 'async') return ChakraAsyncReactSelect;
    if (type === 'creatable') return ChakraCreatableReactSelect;
    return ChakraReactSelect;
  })();

  const isInteractionDisabled = Boolean(props.isDisabled || isReadOnly);

  return (
    <Element
      {...props}
      colorScheme="brand"
      selectedOptionColorScheme="brand"
      useBasicStyles

      /* 🔒 Disable interaction */
      isDisabled={props.isDisabled}
      menuIsOpen={isInteractionDisabled ? false : undefined}
      isSearchable={!isInteractionDisabled}
      isClearable={!isInteractionDisabled}
      onCreateOption={isInteractionDisabled ? undefined : onCreateOption}
      onInputChange={handleInputChange}

      chakraStyles={{
        control: (provided) => ({
          ...provided,
          bg: isInteractionDisabled ? 'gray.100' : provided.bg,
          opacity: isInteractionDisabled ? 0.65 : 1,
          cursor: isInteractionDisabled ? 'not-allowed' : 'pointer',
          pointerEvents: isReadOnly ? 'none' : 'auto',
          paddingLeft: 2,
          paddingRight: 2,
        }),

        singleValue: (provided) => ({
          ...provided,
          color: isInteractionDisabled ? 'gray.600' : provided.color,
          whiteSpace: 'normal',
          overflow: 'visible',
          textOverflow: 'unset',
        }),

        placeholder: (provided) => ({
          ...provided,
          color: isInteractionDisabled ? 'gray.400' : provided.color,
        }),

        dropdownIndicator: (provided) => ({
          ...provided,
          opacity: isInteractionDisabled ? 0.4 : 1,
          padding: 0,
          marginLeft: 0,
          marginRight: 0,
          pointerEvents: 'none',
        }),

        clearIndicator: (provided) => {
          if (!props.isClearable || isInteractionDisabled) {
            return {
              ...provided,
              display: 'none',
            };
          }

          return {
            ...provided,
            opacity: 1,
            padding: 0,
            marginLeft: 0,
            marginRight: 0,
          };
        },

        valueContainer: (provided) => ({
          ...provided,
          padding: 0,
        }),

        multiValue: (provided) => ({
          ...provided,
          _first: {
            ml: -1,
          },
        }),

        ...props.chakraStyles,
      }}
    />
  );
};
