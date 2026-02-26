import { ChoiceQuestion, Question } from "@/scripts/questions";
import { Material3Scheme } from "@pchmn/expo-material3-theme";
import { ScrollView } from "react-native";
import { MathText } from "react-native-latex-text";
import { Button, Dialog, MD3Theme, Portal } from "react-native-paper";

export interface FullQuestionDialogProps {
    question: Question;
    theme: MD3Theme & { colors: Material3Scheme };
    visible: boolean;
    onDismiss: () => void;
}


const FullQuestionDialog: React.FC<FullQuestionDialogProps> = ({
    question,
    theme,
    visible,
    onDismiss,
}) => {
    // 生成选项文本
    const isQuestionChoices = question.type === "choice"?
    String.raw`\n \n选项：\n` + (question as ChoiceQuestion).choices.map((option,index) => {
    return `${String.fromCodePoint(65 + index)}. ${option}`;
    }).join(String.raw`\n`) : "";
    
    return (
        
        <Portal>
            <Dialog
                visible={visible}
                onDismiss={onDismiss}
                style={{ backgroundColor: theme.colors.surfaceContainer }}
            >
                <Dialog.Title style={{ color: theme.colors.primary }}>完整题目</Dialog.Title>
                <Dialog.Content>
                    <ScrollView style={{ maxHeight: 400 }}>
                        <MathText
                            content={question.text+isQuestionChoices}
                            textColor={theme.colors.onSurface}
                            baseMathSize={9}
                        />
                    </ScrollView>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button mode='text' onPress={onDismiss}>
                        关闭
                    </Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

export default FullQuestionDialog;