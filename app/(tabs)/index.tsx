import { Text, View } from 'react-native';

import PiledCard from '@/components/piledCard/piledCard';
import FadeInTab from '@/components/ui/animated-tab';
import { ChoiceQuestion, QuestionBaseManager } from '@/scripts/questions';
import { useState } from 'react';

export default function HomeScreen() {
  const [visible, setVisible] = useState(false);

  setTimeout(() => {
    setVisible(true);
  }, 1000);

  return (
    <FadeInTab>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Hello World!</Text>
        {visible && (
          <PiledCard
            question={QuestionBaseManager.getInstance().getQuestionBaseByName('物理公式专项练习')?.questions[2] as ChoiceQuestion}
          />
        )}  
        {/* <AsyncStorageTestComponent /> */}
      </View>
    </FadeInTab>
  );
}

