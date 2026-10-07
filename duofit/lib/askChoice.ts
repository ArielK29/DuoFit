import { Alert, Platform } from 'react-native';

export interface Choice {
  label: string;
  destructive?: boolean;
  onPress: () => void;
}

// A small menu: title, message and up to two actions plus "cancel". The phone shows a native alert;
// the browser has no such dialog in React Native, so it asks for the number of the action.
export function askChoice(title: string, message: string, choices: Choice[], cancelLabel = 'ביטול'): void {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined') return;
    if (choices.length === 1) {
      if (window.confirm(`${title}\n\n${message}\n\n${choices[0].label}?`)) choices[0].onPress();
      return;
    }
    // Several actions: ask for a number, an empty answer or Cancel does nothing.
    const lines = choices.map((choice, index) => `${index + 1} = ${choice.label}`).join('\n');
    const answer = window.prompt(`${title}\n\n${message}\n\n${lines}\n\n(${cancelLabel}: השאר ריק)`);
    const chosen = choices[Number(answer) - 1];
    if (chosen) chosen.onPress();
    return;
  }
  Alert.alert(title, message, [
    ...choices.map((choice) => ({
      text: choice.label,
      style: choice.destructive ? ('destructive' as const) : ('default' as const),
      onPress: choice.onPress,
    })),
    { text: cancelLabel, style: 'cancel' as const },
  ]);
}
