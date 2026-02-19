import { ChoiceQuestionItem } from '@/components/QuestionManage/QuestionList/ChoiceQuestionItem';
import { FillingQuestionItem } from '@/components/QuestionManage/QuestionList/FillingQuestionItem';
import { UnknownQuestionItem } from '@/components/QuestionManage/QuestionList/UnknownQuestionItem';
import { Question } from '@/scripts/questions';
import { Material3Scheme } from '@pchmn/expo-material3-theme';
import React from 'react';
import { MD3Theme } from 'react-native-paper';


// 定义组件的属性类型
interface QuestionItemProps {
  question: Question;
  theme: MD3Theme & { colors: Material3Scheme };
  onEditPress: () => void;
  onDeletePress: () => void;
}

export const QuestionListItem: React.FC<QuestionItemProps> = ({
  question,
  theme,
  onEditPress,
  onDeletePress
}) => {
  // 根据题型分发到不同的子组件
  if (question.type === "choice") {
    return (
      <ChoiceQuestionItem
        question={question}
        theme={theme}
        onEditPress={onEditPress}
        onDeletePress={onDeletePress}
      />
    );
  }

  if (question.type === "filling") {
    return (
      <FillingQuestionItem
        question={question}
        theme={theme}
        onEditPress={onEditPress}
        onDeletePress={onDeletePress}
      />
    );
  }

  // 未知题型
  return (
    <UnknownQuestionItem
      question={question}
      theme={theme}
      onEditPress={onEditPress}
      onDeletePress={onDeletePress}
    />
  );
};