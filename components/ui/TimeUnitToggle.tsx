'use client';

import { TIME_UNITS } from '@/lib/format';
import { useTimeUnit } from '@/components/providers/TimeUnitProvider';
import { ChipGroup } from './ChipGroup';

/** Minutes / hours / days switch for every duration on the page. */
export function TimeUnitToggle() {
  const { unit, setUnit } = useTimeUnit();
  return <ChipGroup ariaLabel="Time unit" options={TIME_UNITS} value={unit} onChange={setUnit} />;
}
