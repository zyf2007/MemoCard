import { type ReactNode } from 'react';
import { Keyboard, StyleProp, TouchableWithoutFeedback, View, ViewStyle } from 'react-native';

interface DismissKeyboardViewProps {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onDismiss?: () => void;
}

export default function DismissKeyboardView({ children, style, onDismiss }: Readonly<DismissKeyboardViewProps>) {
  const handlePress = () => {
    Keyboard.dismiss();
    onDismiss?.();
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress} accessible={false}>
      <View style={style}>{children}</View>
    </TouchableWithoutFeedback>
  );
}

