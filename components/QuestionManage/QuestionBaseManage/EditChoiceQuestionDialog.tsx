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

// 主弹窗组件
export const EditQuestionDialog = ({ visible, onDismiss, onConfirm, question }: EditQuestionDialogProps) => {
    const [questionType, setQuestionType] = React.useState<QuestionType>('choice');
    const [menuVisible, setMenuVisible] = React.useState(false);
    const [currentQuestion, setCurrentQuestion] = React.useState<Question | null>(null);

    React.useEffect(() => {
        if (visible && question) {
            // 编辑模式 - 给子组件提供初始题目数据
            setQuestionType(question instanceof ChoiceQuestion ? 'choice' : 'filling');
            setCurrentQuestion(question);
        } else if (visible && !question) {
            // 新建模式 - 初始化空的选择题
            setQuestionType('choice');
            setCurrentQuestion(null);
        } else if (!visible) {
            // 弹窗关闭 - 重置状态
            setMenuVisible(false);
            setCurrentQuestion(null);
        }
    }, [visible, question]);

    // 菜单开关方法
    const openMenu = () => setMenuVisible(true);
    const closeMenu = () => setMenuVisible(false);

    // 统一的确认处理逻辑
    const handleConfirm = () => {
        if (!currentQuestion) {
            alert('请完善题目信息');
            return;
        }

        // 为新建题目补充ID（编辑模式已有ID）
        const finalQuestion = currentQuestion.id ? currentQuestion : (() => {
            const id: string = uuid.v4();
            if (currentQuestion instanceof ChoiceQuestion) {
                return new ChoiceQuestion(
                    currentQuestion.text,
                    currentQuestion.choices,
                    currentQuestion.correctChoiceIndex,
                    id
                );
            } else if (currentQuestion instanceof FillingQuestion) {
                return new FillingQuestion(
                    id,
                    currentQuestion.text,
                    currentQuestion.correctAnswer
                );
            }
        })();

        onConfirm(finalQuestion as Question);
        onDismiss();
    };


    const handleSwitchQuestionType = (questionType: QuestionType) => {
        setQuestionType(questionType);
        // 切换题型时重置当前题目状态
        setCurrentQuestion(null);
        closeMenu();
    }

    return (
        <Portal>
            <Dialog
                visible={visible}
                onDismiss={() => {
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
                                    onPress={() => handleSwitchQuestionType('choice')}
                                    title="选择题"
                                    leadingIcon="checkbox-marked"
                                />
                                <Divider />
                                <Menu.Item
                                    onPress={() => handleSwitchQuestionType('filling')}
                                    title="填空题"
                                    leadingIcon="text-box"
                                />
                            </Menu>
                        </View>
                    )}

                    {/* 根据题型渲染对应的编辑组件，传递状态更新方法 */}
                    {questionType === 'choice' && (
                        <ChoiceQuestionEditor
                            initialQuestion={currentQuestion as ChoiceQuestion | null}
                            onUpdateQuestion={(q) => setCurrentQuestion(q)}
                        />
                    )}

                    {questionType === 'filling' && (
                        <FillingQuestionEditor
                            initialQuestion={currentQuestion as FillingQuestion | null}
                            onUpdateQuestion={(q) => setCurrentQuestion(q)}
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

// -------------------------- 选择题编辑组件 --------------------------
interface ChoiceQuestionEditorProps {
    initialQuestion: ChoiceQuestion | null;
    onUpdateQuestion: (question: ChoiceQuestion | null) => void;
}

const ChoiceQuestionEditor: React.FC<ChoiceQuestionEditorProps> = ({ initialQuestion, onUpdateQuestion }) => {
    const [questionText, setQuestionText] = React.useState('');
    const [choices, setChoices] = React.useState(['', '', '', '']);
    const [selectedAnswer, setSelectedAnswer] = React.useState<string>('1');

    // 初始化表单数据
    React.useEffect(() => {
        if (initialQuestion) {
            // 编辑模式
            setQuestionText(initialQuestion.text);
            setChoices(initialQuestion.choices);
            setSelectedAnswer(initialQuestion.correctChoiceIndex.toString());
        } else {
            // 新建模式
            setQuestionText('');
            setChoices(['', '', '', '']);
            setSelectedAnswer('1');
        }
    }, [initialQuestion]);

    // 修改单个选项
    const updateChoice = (index: number, text: string) => {
        const newChoices = choices.map((choice, i) => i === index ? text : choice);
        setChoices(newChoices);
        updateParentQuestion(newChoices);
    };

    // 更新题干
    const handleQuestionTextChange = (text: string) => {
        setQuestionText(text);
        updateParentQuestion(choices, text);
    };

    // 更新选中的答案
    const handleAnswerChange = (value: string) => {
        setSelectedAnswer(value);
        updateParentQuestion(choices, questionText, value);
    };

    // 组装选择题对象并通知父组件更新
    const updateParentQuestion = (
        newChoices = choices,
        newQuestionText = questionText,
        newAnswer = selectedAnswer
    ) => {
        // 验证基础数据，不完整则传递null
        if (!newQuestionText.trim() || newChoices.some(c => !c.trim()) || !newAnswer) {
            onUpdateQuestion(null);
            return;
        }

        // 组装完整的选择题对象（ID暂时用初始值，最终由主组件统一处理）
        const choiceQuestion = new ChoiceQuestion(
            newQuestionText.trim(),
            newChoices.map(c => c.trim()),
            Number.parseInt(newAnswer),
            initialQuestion?.id || '' // 编辑模式带ID，新建模式为空（主组件后续补充）
        );

        onUpdateQuestion(choiceQuestion);
    };

    // 选项标签映射
    const optionLabels = ['A', 'B', 'C', 'D'];

    return (
        <View style={{ width: '100%' }}>
            {/* 题干输入 */}
            <TextInput
                label="输入题干"
                value={questionText}
                onChangeText={handleQuestionTextChange}
                mode='outlined'
                multiline
                numberOfLines={3}
                style={{ marginBottom: 16 }}
            />

            {/* 选项 */}
            <RadioButton.Group
                onValueChange={handleAnswerChange}
                value={selectedAnswer}
            >
                {optionLabels.map((label, index) => (
                    <MemoizedChoiceItem
                        key={`choice-item-${label}`}
                        label={label}
                        value={(index + 1).toString()}
                        choiceValue={choices[index]}
                        onChanged={(text) => updateChoice(index, text)}
                    />
                ))}
            </RadioButton.Group>
        </View>
    );
};

// 选项文本输入 + 单选按钮组件
interface ChoiceItemProps {
    label: string;
    value: string;
    choiceValue: string;
    onChanged: (value: string) => void;
}

function ChoiceItem({ label, value, choiceValue, onChanged }: Readonly<ChoiceItemProps>) {
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

// -------------------------- 填空题编辑组件 --------------------------
interface FillingQuestionEditorProps {
    initialQuestion: FillingQuestion | null;
    onUpdateQuestion: (question: FillingQuestion | null) => void;
}

const FillingQuestionEditor: React.FC<FillingQuestionEditorProps> = ({ initialQuestion, onUpdateQuestion }) => {
    const [questionText, setQuestionText] = React.useState('');
    const [answer, setAnswer] = React.useState('');

    // 初始化表单数据
    React.useEffect(() => {
        if (initialQuestion) {
            // 编辑模式
            setQuestionText(initialQuestion.text);
            setAnswer(initialQuestion.correctAnswer);
        } else {
            // 新建模式
            setQuestionText('');
            setAnswer('');
        }
    }, [initialQuestion]);

    // 更新题干
    const handleQuestionTextChange = (text: string) => {
        setQuestionText(text);
        updateParentQuestion(text, answer);
    };

    // 更新答案
    const handleAnswerChange = (text: string) => {
        setAnswer(text);
        updateParentQuestion(questionText, text);
    };

    // 组装填空题对象并通知父组件更新
    const updateParentQuestion = (newQuestionText = questionText, newAnswer = answer) => {
        // 验证基础数据，不完整则传递null
        if (!newQuestionText.trim() || !newAnswer.trim()) {
            onUpdateQuestion(null);
            return;
        }

        // 组装完整的填空题对象（ID暂时用初始值，最终由主组件统一处理）
        const fillingQuestion = new FillingQuestion(
            initialQuestion?.id || '', // 编辑模式带ID，新建模式为空
            newQuestionText.trim(),
            newAnswer.trim()
        );

        onUpdateQuestion(fillingQuestion);
    };

    return (
        <View style={{ width: '100%' }}>
            {/* 题干输入 */}
            <TextInput
                label="输入题干"
                value={questionText}
                onChangeText={handleQuestionTextChange}
                mode='outlined'
                multiline
                numberOfLines={3}
                style={{ marginBottom: 16 }}
            />

            {/* 答案输入 */}
            <TextInput
                label="正确答案"
                value={answer}
                onChangeText={handleAnswerChange}
                mode='outlined'
                placeholder="请输入填空题的正确答案"
            />
        </View>
    );
};

