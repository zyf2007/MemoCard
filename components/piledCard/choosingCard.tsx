import { StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { useAppTheme } from '../Material3ThemeProvider';

interface ChoosingCardProps {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
};

export default function ChoosingCard(props: Readonly<ChoosingCardProps>) {
  const theme = useAppTheme();
  const styleSheet = StyleSheet.create(
    {
      option: { flex: 1, margin: 4, justifyContent: 'center',borderRadius:14 },
      optionContent: { fontSize: 20 }
    }
  )

  return (
    <View style={{ flex: 1 }}>
      <View style={{ margin: 20, marginBottom: 0, justifyContent: "space-between", flexDirection: "row" }} >
        <Text variant='titleMedium' style={{ color: theme.colors.primary }} >单选题</Text>
      </View>
      
      <View style={{flex:1, margin: 20, justifyContent: "space-between"}} >
        <Text variant="labelLarge"  >{props.question}</Text>

      </View>
      <View style={{  margin: 16, justifyContent: "space-between", flexDirection: "column" }} >
        <View style={{  justifyContent: "space-between", flexDirection: "row" }} >
          <Button
            mode="contained"
            style={[styleSheet.option]}
            labelStyle={{ fontSize: 23 }}
            onPress={() => console.log("1")}
          >
            {props.optionA}
          </Button>
          <Button
            mode="contained"
            style={[styleSheet.option]}
            labelStyle={{ fontSize: 23 }}
            onPress={() => console.log("1")}
          >
            {props.optionB}
          </Button>


        </View>
        <View style={{  justifyContent: "space-between", flexDirection: "row" }} >
          <Button
            mode="contained"
            style={[styleSheet.option]}
            labelStyle={{ fontSize: 23}}
            onPress={() => console.log("1")}
            aria-label='aaa'
          >
            {props.optionC}
          </Button>
          <Button
            mode="contained"
            style={[styleSheet.option]}
            labelStyle={{ fontSize: 23 }}
            onPress={() => console.log("1")}
          >
            {props.optionD}
          </Button>
        </View>
      </View>
    </View>
  )
}
