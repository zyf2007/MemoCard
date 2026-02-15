import { ChoiceQuestion, Question } from '@/scripts/questions';
import * as React from 'react';
import { View } from 'react-native';
import { Button, Dialog, Portal, RadioButton, TextInput } from 'react-native-paper';
import uuid from 'react-native-uuid';

interface EditQuestionDialogProps {
    visible: boolean;
    onDismiss: () => void;
    onConfirm: (questionText: string, choices: string[], answer: string, id: string) => void;
    question: Question | null;
}


// 选择题创建弹窗组件
export const EditQuestionDialog = ({ visible, onDismiss, onConfirm, question }: EditQuestionDialogProps) => {
    const [newQuestionText, setNewQuestionText] = React.useState('');
    const [newChoices, setNewChoices] = React.useState(['', '', '', '']);
    const [newAnswer, setNewAnswer] = React.useState<string>('1');

    // 重置表单
    const resetForm = React.useCallback(() => {
        if (question) {
            console.log(question);
            setNewQuestionText(question.text);
            setNewChoices((question as ChoiceQuestion).choices);
            setNewAnswer((question as ChoiceQuestion).correctChoiceIndex.toString());
        } else {
            setNewQuestionText('');
            setNewChoices(['', '', '', '']);
            setNewAnswer('1');
        }
    }, [question]);

    // 确认创建
    const handleConfirm = () => {
        if (!newQuestionText || newChoices.some(c => !c) || !newAnswer) {
            const id = uuid.v4();
            onConfirm(id, ["a", "b", "c", "d"], "1", id); // debug
            // alert('请填写完整的题目信息');
            return;
        }
        onConfirm(newQuestionText, newChoices, newAnswer, question?.id || uuid.v4());
        resetForm();
        onDismiss();
    };

    React.useEffect(() => {
        resetForm();
    }, [visible, question, resetForm]);

    return (
        <Portal>
            <Dialog
                visible={visible}
                onDismiss={() => {
                    onDismiss();
                    resetForm();
                }}
                style={{ marginTop: -60 }}
            >
                <Dialog.Icon icon="file-document-edit" />
                <Dialog.Title>创建题目</Dialog.Title>
                <Dialog.Content>
                    <TextInput
                        label="输入题干"
                        value={newQuestionText}
                        onChangeText={setNewQuestionText}
                        mode='outlined'
                    />
                    <View style={{ height: 16 }}></View>
                    <RadioButton.Group
                        onValueChange={setNewAnswer}
                        value={newAnswer}
                    >
                        <MemoizedChoiceItem
                            label="A"
                            value="1"
                            choiceValue={newChoices[0]}
                            onChanged={(text) => setNewChoices(prev => [text, prev[1], prev[2], prev[3]])}
                        />
                        <MemoizedChoiceItem
                            label="B"
                            value="2"
                            choiceValue={newChoices[1]}
                            onChanged={(text) => setNewChoices(prev => [prev[0], text, prev[2], prev[3]])}
                        />
                        <MemoizedChoiceItem
                            label="C"
                            value="3"
                            choiceValue={newChoices[2]}
                            onChanged={(text) => setNewChoices(prev => [prev[0], prev[1], text, prev[3]])}
                        />
                        <MemoizedChoiceItem
                            label="D"
                            value="4"
                            choiceValue={newChoices[3]}
                            onChanged={(text) => setNewChoices(prev => [prev[0], prev[1], prev[2], text])}
                        />
                    </RadioButton.Group>
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={onDismiss}>Cancel</Button>
                    <Button onPress={handleConfirm}>Ok</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

// 选项文本输入+单选按钮
function ChoiceItem({ label, value, choiceValue, onChanged }:
    Readonly<{ label: string; value: string; choiceValue: string; onChanged: (value: string) => void; }>) {
    return (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
            <TextInput
                label={label}
                value={choiceValue}
                onChangeText={onChanged}
                style={{ flex: 1 }}
                mode="outlined"
            />
            <RadioButton.Item label="" value={value} />
        </View>
    );
}

const MemoizedChoiceItem = React.memo(ChoiceItem);