import { fireEvent } from '@testing-library/react-native';

import { CALCULATORS, CATEGORIES, searchCalculators } from '@/src/domain/calculators/catalog';
import { HomeScreen } from '@/src/features/home/HomeScreen';
import { renderApp } from '@/src/test/render';

describe('home screen', () => {
  it('lists 27 calculators in six categories', async () => {
    expect(CALCULATORS).toHaveLength(27);
    expect(new Set(CALCULATORS.map((item) => item.kind)).size).toBe(27);
    const view = await renderApp(<HomeScreen />);
    for (const category of CATEGORIES) expect(view.getByText(category.title)).toBeTruthy();
    expect(view.getByText('ISO fits')).toBeTruthy();
    expect(view.getByText('Rigging WLL')).toBeTruthy();
    expect(view.getByText('Grout job estimator')).toBeTruthy();
  });

  it('filters by search text and keywords', async () => {
    expect(searchCalculators('torque').map((item) => item.kind)).toEqual(['flange', 'anchor', 'hold-down', 'units']);
    const view = await renderApp(<HomeScreen />);
    await fireEvent.changeText(view.getByLabelText('Search calculators'), 'belt');
    expect(view.getByText('Belt sizing')).toBeTruthy();
    expect(view.queryByText('NPSH margin')).toBeNull();
  });
});
