
import FadeInTab from '@/components/ui/FadeInTab';
import TextWithLatex from '@/components/ui/TextWithLatex';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function TabTwoScreen() {
  return (
    <SafeAreaView style={{ flex: 1}}>
    <FadeInTab>
      <View style={{flex: 1}}>
      {/* 基础使用 */}
      <TextWithLatex 
        content="行内公式：$E=mc^2$，块级公式：$$\int_{a}^{b} f(x) dx$$"
        fontSize={18}
        textColor="#333333"
      />
    </View>
        
      </FadeInTab>
      </SafeAreaView>
  );
}


