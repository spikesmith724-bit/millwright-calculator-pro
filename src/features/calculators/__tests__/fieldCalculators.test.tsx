import { fireEvent } from '@testing-library/react-native';

import { UnitsCalculatorScreen } from '@/src/features/calculators/CalculatorScreens';
import { ConversionChartScreen } from '@/src/features/calculators/ConversionChartScreen';
import { BearingLifeCalculatorScreen, NpshCalculatorScreen } from '@/src/features/calculators/FieldCalculatorScreens';
import { FractionChartScreen } from '@/src/features/calculators/FractionChartScreen';
import { DrillChartScreen } from '@/src/features/calculators/DrillChartScreen';
import { BeltSizeChartScreen } from '@/src/features/calculators/BeltSizeChartScreen';
import { SocketChartScreen } from '@/src/features/calculators/SocketChartScreen';
import { renderApp } from '@/src/test/render';
import { HomeScreen } from '@/src/features/home/HomeScreen';

describe('field calculator screens', () => {
  it('lists the rotating-equipment calculators', async () => {
    const view = await renderApp(<HomeScreen />);
    expect(view.getByText('Pump affinity laws')).toBeTruthy();
    expect(view.getByText('NPSH margin')).toBeTruthy();
    expect(view.getByText('Polytropic head')).toBeTruthy();
    expect(view.getByText('Gear mesh and bearings')).toBeTruthy();
    expect(view.getByText('Coupling alignment')).toBeTruthy();
    expect(view.getByText('Belt and chain')).toBeTruthy();
    expect(view.getByText('Field units')).toBeTruthy();
    expect(view.getByText('Bearing L10')).toBeTruthy();
    expect(view.getByText('Fraction chart')).toBeTruthy();
    expect(view.getByText('Conversion chart')).toBeTruthy();
    expect(view.getByText('Socket cross-reference')).toBeTruthy();
    expect(view.getByText('Drill index')).toBeTruthy();
    expect(view.getByText('Belt sizing')).toBeTruthy();
  });

  it('shows the API 610 line on an NPSH result and the API 610 and 613 line on bearing life', async () => {
    const npsh = await renderApp(<NpshCalculatorScreen />);
    await fireEvent.press(npsh.getByRole('button', { name: 'Check margin' }));
    expect(npsh.getByText('Based on API 610, centrifugal pumps')).toBeTruthy();
    expect(npsh.getByText(/Margin:\s*8 ft/)).toBeTruthy();
    expect(npsh.queryByText(/section\s+\d/i)).toBeNull();

    const life = await renderApp(<BearingLifeCalculatorScreen />);
    await fireEvent.press(life.getByRole('button', { name: 'Calculate L10' }));
    expect(life.getByText('Based on API 610, centrifugal pumps; API 613, gears')).toBeTruthy();
    expect(life.getByText(/L10 life:/)).toBeTruthy();
  });

  it('filters the fraction chart and snaps a decimal to the nearest 64th', async () => {
    const view = await renderApp(<FractionChartScreen />);
    expect(view.getByText('1/64')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Print chart' })).toBeTruthy();
    await fireEvent.changeText(view.getByLabelText('Search'), '1/2');
    expect(view.getByText('12.700')).toBeTruthy();
    expect(view.queryByText('1/64')).toBeNull();
    await fireEvent.changeText(view.getByLabelText('Fraction or decimal'), '0.376');
    await fireEvent.press(view.getByRole('button', { name: 'Find nearest' }));
    expect(view.getByText(/3\/8/)).toBeTruthy();
    expect(view.getByText(/9\.525/)).toBeTruthy();
  });

  it('converts either direction and shows the pocket chart beside the fraction chart', async () => {
    const units = await renderApp(<UnitsCalculatorScreen />);
    await fireEvent.press(units.getByRole('button', { name: 'Convert' }));
    expect(units.getByText(/Result:\s*25\.4 mm/)).toBeTruthy();
    await fireEvent.press(units.getByRole('button', { name: 'Swap direction' }));
    await fireEvent.press(units.getByRole('button', { name: 'Convert' }));
    expect(units.getByText(/Result:\s*0\.0393701 in/)).toBeTruthy();
    await fireEvent.press(units.getByRole('button', { name: 'Weight' }));
    await fireEvent.press(units.getByRole('button', { name: 'Convert' }));
    expect(units.getByText(/Result:\s*0\.453592 kg/)).toBeTruthy();

    const chart = await renderApp(<ConversionChartScreen />);
    expect(chart.getByRole('button', { name: 'Print chart' })).toBeTruthy();
    expect(chart.getByText('25.4 mm')).toBeTruthy();
    expect(chart.getAllByText('1 ton (2000 lb)').length).toBeGreaterThan(0);
    expect(chart.getByText(/US short ton/)).toBeTruthy();
  });

  it('searches the socket chart and switches to the metric view', async () => {
    const view = await renderApp(<SocketChartScreen />);
    expect(view.getByText('1/4')).toBeTruthy();
    expect(view.getByText('6.35')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Print chart' })).toBeTruthy();
    await fireEvent.changeText(view.getByLabelText('Search'), '1/2');
    expect(view.getByText('12.70')).toBeTruthy();
    expect(view.queryByText('6.35')).toBeNull();
    await fireEvent.press(view.getByRole('button', { name: 'Metric to inch' }));
    await fireEvent.changeText(view.getByLabelText('Search'), '19');
    expect(view.getByText('0.7480')).toBeTruthy();
    expect(view.getByText('3/4')).toBeTruthy();
    expect(view.getByText('interchangeable')).toBeTruthy();
  });

  it('filters the drill index and finds a number drill', async () => {
    const view = await renderApp(<DrillChartScreen />);
    expect(view.getByText('#1')).toBeTruthy();
    expect(view.getByText('0.2280')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Print chart' })).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Number' }));
    expect(view.queryByText('1/64')).toBeNull();
    await fireEvent.changeText(view.getByLabelText('Search'), '#7');
    expect(view.getByText('0.2010')).toBeTruthy();
    expect(view.getByText('5.105')).toBeTruthy();
    expect(view.queryByText('#1')).toBeNull();
    await fireEvent.changeText(view.getByLabelText('Search'), '');
    await fireEvent.press(view.getByRole('button', { name: 'By size' }));
    expect(view.getByText('#80')).toBeTruthy();
    expect(view.getByText('Z')).toBeTruthy();
  });

  it('shows V-belt section A and finds a length code or a timing pitch', async () => {
    const view = await renderApp(<BeltSizeChartScreen />);
    expect(view.getByText('A · Classical')).toBeTruthy();
    expect(view.getByText(/Top 1\/2 in/)).toBeTruthy();
    expect(view.getByRole('button', { name: 'Print chart' })).toBeTruthy();
    await fireEvent.changeText(view.getByLabelText('Search'), 'A42');
    expect(view.getByText(/42 in inside, about 44 in outside/)).toBeTruthy();
    expect(view.queryByText(/Top 1\/2 in/)).toBeNull();
    await fireEvent.changeText(view.getByLabelText('Search'), 'MXL');
    expect(view.getByText('0.080 in')).toBeTruthy();
    expect(view.getByText('2.032 mm')).toBeTruthy();
    await fireEvent.changeText(view.getByLabelText('Search'), '');
    await fireEvent.press(view.getByRole('button', { name: 'Drive' }));
    expect(view.getByText('HP = T×RPM/5252')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Solve ratio' }));
    expect(view.getByText('Driven speed 875 rpm')).toBeTruthy();
    await fireEvent.changeText(view.getByLabelText('Horsepower'), '10');
    await fireEvent.press(view.getByRole('button', { name: 'Solve horsepower' }));
    expect(view.getByText(/10 hp at 30\.0114 lb-ft/)).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Tension' }));
    expect(view.getByText('Wrapped 3.1–4.5 lb')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'I have the belt number' }));
    await fireEvent.changeText(view.getByLabelText('Belt number'), '3/5V');
    await fireEvent.press(view.getByRole('button', { name: '3/5V1000' }));
    expect(view.getByText(/Push 33\.6–70\.2 lb at mid-span/)).toBeTruthy();
    expect(view.getByText(/The belt should deflect 1\/2 in/)).toBeTruthy();
    expect(view.getByText(/Top 5\/8 in/)).toBeTruthy();
    expect(view.getByText(/100\.0 in effective/)).toBeTruthy();
    expect(view.getByText('Used 38.1 lb · New 56.7 lb')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Start over' }));
    await fireEvent.press(view.getByRole('button', { name: 'No number, just the belt' }));
    await fireEvent.press(view.getByRole('button', { name: 'Section 3L, top 3/8 in' }));
    expect(view.getByText(/Top 3\/8 in\. Thickness 7\/32 in/)).toBeTruthy();
    expect(view.getByText(/Light-duty FHP/)).toBeTruthy();
    await fireEvent.changeText(view.getByLabelText('Tape around the belt'), '35');
    expect(view.getAllByText(/35\.0 in outside/).length).toBeGreaterThan(0);
  });
});
