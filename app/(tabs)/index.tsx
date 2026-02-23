import { Text, View } from 'react-native';

import PiledCard from '@/components/piledCard/piledCard';
import FadeInTab from '@/components/ui/FadeInTab';
import { useState } from 'react';
export default function HomeScreen() {
  const [visible, setVisible] = useState(false);
  
  setTimeout(() => {
    setVisible(true);
  }, 1000);
  // console.log(QuestionBaseManager.getInstance().getQuestionBaseByName('选择题2')?.questions)
  return (
    <FadeInTab>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Hello World!</Text>
        {visible && (
          <PiledCard />
        )}  
        {/* <AsyncStorageTestComponent /> */}

      </View>
    </FadeInTab>
  );
}

