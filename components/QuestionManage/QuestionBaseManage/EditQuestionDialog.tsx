// EditChoiceDialog.tsx
import DismissKeyboardView from '@/components/ui/DismissKeyboardView';
import { QuestionFactory } from '@/scripts/QuestionFactory/questionFactory';
import { ChoiceQuestion, FillingQuestion, Question } from '@/scripts/questions';
import * as React from 'react';
import { View } from 'react-native';
import { Button, Dialog, Divider, Menu, Portal, RadioButton, TextInput } from 'react-native-paper';

type QuestionType = 'choice' | 'filling';

interface QuestionWithStatus {
  question: Question | null;
  isValid: boolean;
}

interface EditQuestionDialogProps {
  visible: boolean;
  onDismiss: () => void;
  onConfirm: (question: Question) => void;
  question: Question | null;
  baseName: string;
  baseId: string;
}

// 主弹窗组件
export const EditQuestionDialog = ({ visible, onDismiss, onConfirm, question, baseName, baseId }: EditQuestionDialogProps) => {
  const [questionType, setQuestionType] = React.useState<QuestionType>('choice');
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [currentQuestionWithStatus, setCurrentQuestionWithStatus] = React.useState<QuestionWithStatus>({
    question: null,
    isValid: false
  });

  React.useEffect(() => {
    if (visible && question) {
      // 编辑模式 - 给子组件提供初始题目数据
      setQuestionType(question instanceof ChoiceQuestion ? 'choice' : 'filling');
      // 编辑模式下初始就是有效的
      setCurrentQuestionWithStatus({
        question,
        isValid: true
      });
    } else if (visible && !question) {
      // 新建模式 - 初始化空的状态（保留空输入，标记为无效）
      setQuestionType('choice');
      setCurrentQuestionWithStatus({
        question: null,
        isValid: false
      });
    } else if (!visible) {
      // 弹窗关闭 - 重置状态
      setMenuVisible(false);
      setCurrentQuestionWithStatus({
        question: null,
        isValid: false
      });
    }
  }, [visible, question]);

  // 菜单开关方法
  const openMenu = () => setMenuVisible(true);
  const closeMenu = () => setMenuVisible(false);

  // 统一的确认处理逻辑（根据 isValid 判断）
  const handleConfirm = () => {
    if (!currentQuestionWithStatus.isValid || !currentQuestionWithStatus.question) {
      alert('请完善题目信息');
      return;
    }

    // 为新建题目补充ID（编辑模式已有ID）
    const finalQuestion = currentQuestionWithStatus.question.id ? currentQuestionWithStatus.question : (() => {
      if (currentQuestionWithStatus.question instanceof ChoiceQuestion) {
        return QuestionFactory.createChoiceQuestion({
          baseId,
          baseName,
          text: currentQuestionWithStatus.question.text,
          choices: currentQuestionWithStatus.question.choices,
          correctChoiceIndex: currentQuestionWithStatus.question.correctChoiceIndex,
        });
      } else if (currentQuestionWithStatus.question instanceof FillingQuestion) {
        return QuestionFactory.createFillingQuestion({
          baseId,
          baseName,
          text: currentQuestionWithStatus.question.text,
          correctAnswer: currentQuestionWithStatus.question.correctAnswer,
        });
      }
      // 兜底（理论上不会走到）
      return currentQuestionWithStatus.question;
    })();

    onConfirm(finalQuestion as Question);
    onDismiss();
  };

  const handleSwitchQuestionType = (questionType: QuestionType) => {
    setQuestionType(questionType);
    // 切换题型时重置状态（保留空输入，标记为无效）
    setCurrentQuestionWithStatus({
      question: null,
      isValid: false
    });
    closeMenu();
  };

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
          <DismissKeyboardView>
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
              initialQuestion={currentQuestionWithStatus.question as ChoiceQuestion | null}
              onUpdateQuestion={(status) => setCurrentQuestionWithStatus(status)}
              baseName={baseName}
              baseId={baseId}
            />
          )}

          {questionType === 'filling' && (
            <FillingQuestionEditor
              initialQuestion={currentQuestionWithStatus.question as FillingQuestion | null}
              onUpdateQuestion={(status) => setCurrentQuestionWithStatus(status)}
              baseName={baseName}
              baseId={baseId}
            />
          )}
          </DismissKeyboardView>
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
  onUpdateQuestion: (status: QuestionWithStatus) => void;
  baseName: string;
  baseId: string;
}

const ChoiceQuestionEditor: React.FC<ChoiceQuestionEditorProps> = ({ initialQuestion, onUpdateQuestion, baseName, baseId }) => {
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
    // 验证基础数据，标记是否有效
    const isValid = !!newQuestionText.trim() && 
                    newChoices.every(c => !!c.trim()) && 
                    !!newAnswer;

    // 创建/更新题目对象
    const choiceQuestion = QuestionFactory.createChoiceQuestion({
      baseId,
      baseName,
      text: newQuestionText.trim(),
      choices: newChoices.map(c => c.trim()),
      correctChoiceIndex: Number.parseInt(newAnswer) || 0,
      id: initialQuestion?.id,
    });

    // 传递题目对象
    onUpdateQuestion({
      question: choiceQuestion,
      isValid
    });
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
  onUpdateQuestion: (status: QuestionWithStatus) => void;
  baseName: string;
  baseId: string;
}

const FillingQuestionEditor: React.FC<FillingQuestionEditorProps> = ({ initialQuestion, onUpdateQuestion, baseName, baseId }) => {
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
    // 验证基础数据，标记是否有效
    const isValid = !!newQuestionText.trim() && !!newAnswer.trim();

    // 创建/更新题目对象，保留用户输入
    const fillingQuestion = QuestionFactory.createFillingQuestion({
      baseId,
      baseName,
      text: newQuestionText.trim(),
      correctAnswer: newAnswer.trim(),
      id: initialQuestion?.id,
    });

    // 传递题目对象
    onUpdateQuestion({
      question: fillingQuestion,
      isValid
    });
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
