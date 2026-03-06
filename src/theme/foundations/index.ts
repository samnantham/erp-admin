import { colors } from './colors';
import { shadows } from './shadows';
import { spacing } from './spacing';
import { typography } from './typography';

const foundations = {
  colors,
  ...typography,
  shadows,
  space: spacing,
};

export default foundations;
