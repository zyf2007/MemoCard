import { Text, View } from 'react-native';

import PiledCard from '@/components/piledCard/piledCard';
import FadeInTab from '@/components/ui/FadeInTab';
import { QuestionGenerator } from '@/scripts/questionGenerator/questionGenerator';
import { useState } from 'react';
import { Button } from 'react-native-paper';
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
        <Button onPress={() => QuestionGenerator.getInstance().resetAllQuestions()}
        style={{
          margin: 30,
        }}
        >Reset All Questions</Button>

        {visible && (
          <PiledCard />
        )}  
        {/* <AsyncStorageTestComponent /> */}

      </View>
    </FadeInTab>
  );
}

