import { Material3ThemeProvider, useAppTheme } from '@/components/Material3ThemeProvider';
import { ChoiceQuestionItem } from '@/components/QuestionManage/ChoiceQuestionItem';
import { ChoiceQuestion, Question, QuestionBaseManager } from '@/scripts/questions';
import { QuestionBase } from '@/scripts/questions/QuestionBase';
import { useLocalSearchParams } from 'expo-router';
import * as React from 'react';
import uuid from 'react-native-uuid';
// 导入 TypeScript 类型
import { NativeScrollEvent, NativeSyntheticEvent, ScrollView, ScrollViewProps, View } from 'react-native';
import { AnimatedFAB, Button, Dialog, Portal, RadioButton, TextInput } from 'react-native-paper';

// 独立的创建题目弹窗组件
const CreateQuestionDialog = ({
    visible,
    onDismiss,
    onConfirm,
}: {
    visible: boolean;
    onDismiss: () => void;
    onConfirm: (questionText: string, choices: string[], answer: string) => void;
}) => {
    const [newQuestionText, setNewQuestionText] = React.useState('');
    const [newChoices, setNewChoices] = React.useState(['', '', '', '']);
    const [newAnswer, setNewAnswer] = React.useState<string>('1');

    // 重置表单
    const resetForm = () => {
        setNewQuestionText('');
        setNewChoices(['', '', '', '']);
        setNewAnswer('1');
    };

    // 确认创建
    const handleConfirm = () => {
        if (!newQuestionText || newChoices.some(c => !c) || !newAnswer) {
            onConfirm("测试题"+uuid.v4(), ["a", "b", "c", "d"], "1"); // debug
            alert('请填写完整的题目信息');
            return;
        }
        onConfirm(newQuestionText, newChoices, newAnswer);
        resetForm();
        onDismiss();
    };

    // 弹窗关闭时重置
    React.useEffect(() => {
        if (!visible) {
            resetForm();
        }
    }, [visible]);

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
                        defaultValue="test"
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

// 定义具名的 ChoiceItem 组件
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
// 用 memo 包裹
const MemoizedChoiceItem = React.memo(ChoiceItem);

// 定义具名的 QuestionItem 组件
function QuestionItem({ question, theme, onDeletePress, }:
    Readonly<{ question: Question; theme: any; onDeletePress: () => void; }>) {
    console.log('渲染题目:', question.id);
    return (
        <ChoiceQuestionItem
            key={question.id}
            name={question.text}
            theme={theme}
            onDeletePress={onDeletePress}
        />
    );
}
// 用 memo 包裹
const MemoizedChoiceQuestionItem = React.memo(QuestionItem);
function QuestionListContainer({ questions, theme, onScroll, questionBase }:
    Readonly<{ questions: Question[]; theme: any; onScroll: ScrollViewProps['onScroll']; questionBase: QuestionBase }>) {
    console.log('列表容器渲染'); // 只有 props 变化时才打印
    return (
        <ScrollView onScroll={onScroll}>
            {questions.map((question) => (
                <MemoizedChoiceQuestionItem
                    key={question.id}
                    question={question}
                    theme={theme}
                    onDeletePress={() => {
                        console.log(question.id + "deleted");
                        questionBase?.removeQuestionById(question.id);
                    }}
                />
            ))}
        </ScrollView>
    );
}
const MemorizedQuestionListContainer = React.memo(QuestionListContainer);
// 主组件
export default function ImportQuestionBase() {
    const theme = useAppTheme();
    const [dialogVisible, setDialogVisible] = React.useState(false);
    const [isExtended, setIsExtended] = React.useState(true);
    const params = useLocalSearchParams();
    const { baseName } = params;
    const [questions, setQuestions] = React.useState<Question[]>([]);

    // 获取题库实例
    const getQuestionBase = React.useCallback(() => {
        const name = Array.isArray(baseName) ? baseName[0] : baseName;
        return QuestionBaseManager.getInstance<QuestionBaseManager>().getQuestionBaseByName(name);
    }, [baseName]);

    // 刷新题目列表
    const refreshQuestionList = React.useCallback(() => {
        const questionBase = getQuestionBase();
        if (questionBase) {
            setQuestions([...questionBase.questions]);
        }
    }, [getQuestionBase]);

    // 初始化和订阅事件
    React.useEffect(() => {
        const questionBase = getQuestionBase();
        refreshQuestionList();
        const unsubscribe = questionBase?.onQuestionListUpdated.subscribe(refreshQuestionList);
        return () => {
            console.log("unsubscribe");
            unsubscribe?.();
        };
    }, [getQuestionBase, refreshQuestionList]);

    // 关键修复：给 onScroll 参数指定明确的 TypeScript 类型
    const onScroll: ScrollViewProps['onScroll'] = React.useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { nativeEvent } = event;
        const currentScrollY = nativeEvent.contentOffset.y;
        const isScrollingUp = (nativeEvent.velocity?.y ?? 0) <= 0;
        const isTop = currentScrollY <= 0;
        const isBottom = currentScrollY >= (nativeEvent.contentSize?.height ?? 0) - (nativeEvent.layoutMeasurement?.height ?? 0);
        setIsExtended(isScrollingUp || isTop || isBottom);
    }, []);

    // 处理创建题目
    const handleCreateQuestion = React.useCallback((questionText: string, choices: string[], answer: string) => {
        const questionBase = getQuestionBase();
        if (!questionBase) return;
        questionBase.addQuestion(
            new ChoiceQuestion(questionText, choices, Number.parseInt(answer))
        );
    }, [getQuestionBase]);

    return (
        <Material3ThemeProvider>
            <View style={{ backgroundColor: theme.colors.surfaceContainer, flex: 1 }}>
                <ScrollView onScroll={onScroll}>
                    <MemorizedQuestionListContainer
                        questions={questions}
                        theme={theme}
                        onScroll={onScroll}
                        questionBase={getQuestionBase() as QuestionBase}
                    />

                </ScrollView>

                <AnimatedFAB
                    icon={'plus'}
                    label={'Label      '}
                    extended={isExtended}
                    onPress={() => setDialogVisible(true)}
                    animateFrom={'right'}
                    iconMode={"dynamic"}
                    style={{
                        bottom: 20,
                        right: 20,
                        position: 'absolute',
                    }}
                />
            </View>

            {/* 独立的弹窗组件 */}
            <CreateQuestionDialog
                visible={dialogVisible}
                onDismiss={() => setDialogVisible(false)}
                onConfirm={handleCreateQuestion}
            />
        </Material3ThemeProvider>
    );
}