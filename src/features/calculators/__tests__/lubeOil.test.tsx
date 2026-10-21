import { readFileSync } from 'node:fs';
import path from 'node:path';

import { fireEvent } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';
import { PermissionStatus } from 'expo-modules-core';

import { LubeOilScreen } from '@/src/features/calculators/LubeOilScreen';
import { renderApp } from '@/src/test/render';

jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchCameraAsync: jest.fn(async () => ({ canceled: false, assets: [{ uri: 'file:///shot.jpg' }] })),
}));

describe('lube oil screen', () => {
  it('shows the viscosity flag, the VG warning, and a NAS class from counts', async () => {
    const view = await renderApp(<LubeOilScreen />);
    expect(view.getByText(/10 percent/)).toBeTruthy();
    expect(view.getByText(/follow your lab/i)).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Flush targets' }));
    expect(view.getByText(/not a cleanliness code/i)).toBeTruthy();
    expect(view.getAllByText(/16\/14\/11/).length).toBeGreaterThan(0);
    expect(view.queryByRole('button', { name: 'Photograph the report' })).toBeNull();
    await fireEvent.press(view.getByRole('button', { name: 'NAS 1638' }));
    expect(view.getByText('91,200')).toBeTruthy();
    await fireEvent.changeText(view.getByLabelText('5–15 µm per 100 mL'), '8000');
    await fireEvent.changeText(view.getByLabelText('15–25 µm per 100 mL'), '1425');
    await fireEvent.changeText(view.getByLabelText('25–50 µm per 100 mL'), '253');
    await fireEvent.changeText(view.getByLabelText('50–100 µm per 100 mL'), '45');
    await fireEvent.changeText(view.getByLabelText('>100 µm per 100 mL'), '8');
    await fireEvent.changeText(view.getByLabelText('≥4 µm per mL'), '40000');
    await fireEvent.changeText(view.getByLabelText('≥6 µm per mL'), '2500');
    await fireEvent.changeText(view.getByLabelText('≥14 µm per mL'), '80');
    await fireEvent.press(view.getByRole('button', { name: 'Get the class' }));
    expect(view.getByText('NAS 5')).toBeTruthy();
    expect(view.getByText(/Approximate ISO 4406: 16\/14\/11/)).toBeTruthy();
    expect(view.getByText(/ISO 4406 from the cumulative counts: 22\/18\/13/)).toBeTruthy();
  });

  it('holds a camera shot beside the guide, then drops it on dismiss', async () => {
    const view = await renderApp(<LubeOilScreen />);
    await fireEvent.press(view.getByRole('button', { name: 'Photograph the report' }));
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(expect.objectContaining({ exif: false }));
    expect(view.getByLabelText('Oil report photo')).toBeTruthy();
    expect(view.getByText(/10 percent/)).toBeTruthy();
    expect(view.getByText(/Dismiss it and it is gone/)).toBeTruthy();
    expect(view.queryByLabelText('Equipment tag')).toBeNull();
    expect(view.queryByRole('button', { name: 'Save the photo' })).toBeNull();
    await fireEvent.press(view.getByRole('button', { name: 'Zoom 2 times' }));
    expect(view.getByRole('button', { name: 'Zoom 2 times' })).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Retake' }));
    expect(ImagePicker.launchCameraAsync).toHaveBeenCalledTimes(2);
    expect(view.getByLabelText('Oil report photo')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'NAS 1638' }));
    expect(view.getByLabelText('Oil report photo')).toBeTruthy();
    expect(view.getByText('91,200')).toBeTruthy();
    await fireEvent.press(view.getByRole('button', { name: 'Dismiss photo' }));
    expect(view.queryByLabelText('Oil report photo')).toBeNull();
    expect(view.getByText('91,200')).toBeTruthy();
    expect(view.getByRole('button', { name: 'Photograph the report' })).toBeTruthy();
  });

  it('stays put when the camera permission is off', async () => {
    jest.mocked(ImagePicker.requestCameraPermissionsAsync).mockResolvedValueOnce({ granted: false, canAskAgain: false, status: PermissionStatus.DENIED, expires: 'never' });
    const view = await renderApp(<LubeOilScreen />);
    await fireEvent.press(view.getByRole('button', { name: 'Photograph the report' }));
    expect(view.getByText(/Camera permission is off/)).toBeTruthy();
    expect(view.queryByLabelText('Oil report photo')).toBeNull();
  });

  it('does not store or upload the shot', () => {
    const screen = readFileSync(path.join(process.cwd(), 'src/features/calculators/LubeOilScreen.tsx'), 'utf8');
    expect(screen).not.toMatch(/persistPickedPhoto|setItem|supabase|equipmentTag|Save the photo/);
    expect(screen).not.toMatch(/Explain results/);
    const app = JSON.parse(readFileSync(path.join(process.cwd(), 'app.json'), 'utf8')) as {
      expo: { ios: { infoPlist: { NSCameraUsageDescription: string } } };
    };
    expect(app.expo.ios.infoPlist.NSCameraUsageDescription).toMatch(/not saved or uploaded/);
  });
});
