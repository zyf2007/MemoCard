import { Text, View } from 'react-native';

import PiledCard from '@/components/piledCard/piledCard';
import FadeInTab from '@/components/ui/animated-tab';

export default function HomeScreen() {
  return (
    <FadeInTab>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Hello World!</Text>

        <PiledCard
          getData={(index) => index.toString()}
        />
        {/* <AsyncStorageTestComponent /> */}
      </View>
    </FadeInTab>
  );
}

