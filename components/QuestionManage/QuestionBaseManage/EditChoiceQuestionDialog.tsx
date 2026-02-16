// EditChoiceDialog.tsx
import { ChoiceQuestion, FillingQuestion, Question } from '@/scripts/questions';
import * as React from 'react';
import { View } from 'react-native';
import { Button, Dialog, Divider, Menu, Portal, RadioButton, TextInput } from 'react-native-paper';
import uuid from 'react-native-uuid';

type QuestionType = 'choice' | 'filling';

interface EditQuestionDialogProps {
    visible: boolean;
    onDismiss: () => void;
    onConfirm: (question: Question) => void;
    question: Question | null;
}

// 选择题创建/编辑弹窗组件
export const EditQuestionDialog = ({ visible, onDismiss, onConfirm, question }: EditQuestionDialogProps) => {
    const [questionType, setQuestionType] = React.useState<QuestionType>('choice');
    const [newQuestionText, setNewQuestionText] = React.useState('');
    const [newChoices, setNewChoices] = React.useState(['', '', '', '']);
    const [newAnswer, setNewAnswer] = React.useState<string>('1');
    const [newFillingAnswer, setNewFillingAnswer] = React.useState('');
    const [menuVisible, setMenuVisible] = React.useState(false);
    const menuVisibleRef = React.useRef(menuVisible);
    
    React.useEffect(() => {
        menuVisibleRef.current = menuVisible;
    }, [menuVisible]);

    // 重置表单
    const resetForm = React.useCallback(() => {
        if (question) {
            console.log('编辑题目:', question);
            setNewQuestionText(question.text);
            
            if (question instanceof ChoiceQuestion) {
                setQuestionType('choice');
                setNewChoices(question.choices);
                setNewAnswer(question.correctChoiceIndex.toString());
                setNewFillingAnswer('');
            } else if (question instanceof FillingQuestion) {
                setQuestionType('filling');
                setNewChoices(['', '', '', '']);
                setNewAnswer('1');
                setNewFillingAnswer(question.correctAnswer);
            }
        } else {
            // 新建模式
            setNewQuestionText('');
            setNewChoices(['', '', '', '']);
            setNewAnswer('1');
            setNewFillingAnswer('');
            setQuestionType('choice');
        }
        // 重置菜单状态
        setMenuVisible(false);
        menuVisibleRef.current = false;
    }, [question]);

    // 确认创建/编辑
    const handleConfirm = () => {
        if (!newQuestionText.trim()) {
            alert('请填写题目内容');
            return;
        }

        const id = question?.id || (uuid.v4() as string);

        if (questionType === 'choice') {
            if (newChoices.some(c => !c.trim())) {
                alert('请填写所有选项内容');
                return;
            }
            if (!newAnswer) {
                alert('请选择正确答案');
                return;
            }
            const newQuestion = new ChoiceQuestion(
                newQuestionText.trim(),
                newChoices.map(c => c.trim()),
                Number.parseInt(newAnswer),
                id
            );
            onConfirm(newQuestion);
        } else {
            if (!newFillingAnswer.trim()) {
                alert('请填写正确答案');
                return;
            }
            const newQuestion = new FillingQuestion(
                id,
                newQuestionText.trim(),
                newFillingAnswer.trim()
            );
            onConfirm(newQuestion);
        }
        
        onDismiss();
    };

    React.useEffect(() => {
        if (visible) {
            resetForm();
        }
    }, [visible, question, resetForm]);

    const openMenu = () => {
        if (!menuVisibleRef.current) {
            setMenuVisible(true);
        }
    };
    
    const closeMenu = () => {
        setMenuVisible(false);
    };

    return (
        <Portal>
            <Dialog
                visible={visible}
                onDismiss={() => {
                    // 关闭弹窗时重置菜单状态
                    setMenuVisible(false);
                    onDismiss();
                }}
                style={{ marginTop: -50 }}
            >
                <Dialog.Icon icon="file-document-edit" />
                <Dialog.Title>{question ? '编辑题目' : '创建题目'}</Dialog.Title>
                <Dialog.Content>
                    {/* 题型选择 Menu */}
                    {!question && (
                        <View style={{ marginBottom: 16 }}>
                            <Menu
                                visible={menuVisible}
                                onDismiss={closeMenu}
                                key={`menu-${menuVisible}`}
                                anchor={
                                    <Button 
                                        mode="outlined" 
                                        onPress={openMenu}
                                        icon="chevron-down"
                                        style={{ width: '100%' }}
                                    >
                                        题型：{questionType === 'choice' ? '选择题' : '填空题'}
                                    </Button>
                                }
                            >
                                <Menu.Item 
                                    onPress={() => {
                                        setQuestionType('choice');
                                        closeMenu();
                                    }} 
                                    title="选择题" 
                                    leadingIcon="checkbox-marked"
                                />
                                <Divider />
                                <Menu.Item 
                                    onPress={() => {
                                        setQuestionType('filling');
                                        closeMenu();
                                    }} 
                                    title="填空题" 
                                    leadingIcon="text-box"
                                />
                            </Menu>
                        </View>
                    )}

                    {/* 题目内容输入 */}
                    <TextInput
                        label="输入题干"
                        value={newQuestionText}
                        onChangeText={setNewQuestionText}
                        mode='outlined'
                        multiline
                        numberOfLines={3}
                    />
                    
                    <View style={{ height: 16 }}></View>

                    {/* 选择题选项 */}
                    {questionType === 'choice' && (
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
                    )}

                    {/* 填空题答案 */}
                    {questionType === 'filling' && (
                        <TextInput
                            label="正确答案"
                            value={newFillingAnswer}
                            onChangeText={setNewFillingAnswer}
                            mode='outlined'
                            placeholder="请输入填空题的正确答案"
                        />
                    )}
                </Dialog.Content>
                <Dialog.Actions>
                    <Button onPress={onDismiss}>取消</Button>
                    <Button onPress={handleConfirm}>确定</Button>
                </Dialog.Actions>
            </Dialog>
        </Portal>
    );
};

// 选项文本输入 + 单选按钮
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