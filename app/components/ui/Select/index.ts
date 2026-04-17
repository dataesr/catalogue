import '../shared/popover.css';
import { Checkbox, type SelectCheckboxProps } from './Checkbox';
import { Content, type SelectContentProps } from './Content';
import { Empty, type SelectEmptyProps } from './Empty';
import { Footer, type SelectFooterProps } from './Footer';
import { Group, type SelectGroupProps } from './Group';
import { Header, type SelectHeaderProps } from './Header';
import { Loading, type SelectLoadingProps } from './Loading';
import { Option, type SelectOptionProps } from './Option';
import { Radio, type SelectRadioProps } from './Radio';
import { Search, type SelectSearchProps } from './Search';
import { type SelectProps, Select as SelectRoot } from './Select';
import { type SelectSeparatorProps, Separator } from './Separator';

export type { SelectSize } from './context';
export { useSelectContext } from './context';

export type {
  SelectCheckboxProps,
  SelectEmptyProps,
  SelectFooterProps,
  SelectGroupProps,
  SelectHeaderProps,
  SelectLoadingProps,
  SelectOptionProps,
  SelectContentProps,
  SelectProps,
  SelectRadioProps,
  SelectSearchProps,
  SelectSeparatorProps,
};

export { Checkbox as SelectCheckbox };
export { Empty as SelectEmpty };
export { Footer as SelectFooter };
export { Group as SelectGroup };
export { Header as SelectHeader };
export { Loading as SelectLoading };
export { Option as SelectOption };
export { Content as SelectContent };
export { Radio as SelectRadio };
export { Search as SelectSearch };
export { Separator as SelectSeparator };

type SelectCompound = typeof SelectRoot & {
  Option: typeof Option;
  Content: typeof Content;
  Checkbox: typeof Checkbox;
  Radio: typeof Radio;
  Group: typeof Group;
  Header: typeof Header;
  Search: typeof Search;
  Footer: typeof Footer;
  Empty: typeof Empty;
  Loading: typeof Loading;
  Separator: typeof Separator;
};

const Select = SelectRoot as SelectCompound;

Select.Option = Option;
Select.Content = Content;
Select.Checkbox = Checkbox;
Select.Radio = Radio;
Select.Group = Group;
Select.Header = Header;
Select.Search = Search;
Select.Footer = Footer;
Select.Empty = Empty;
Select.Loading = Loading;
Select.Separator = Separator;

export { Select };
export default Select;
