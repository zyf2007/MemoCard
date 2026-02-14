import { ChoiceQuestionItem } from '@/components/QuestionManage/ChoiceQuestionListItem';
import { Question } from '@/scripts/questions';
import * as React from 'react';


import { useEffect } from 'react';

export const ChoiceQuestionListItem = ({ question, theme, onDeletePress, }:
    Readonly<{ question: Question; theme: any; onDeletePress: () => void; }>) => {
    
    console.log('渲染题目:', question.id); // debug

    useEffect(() => {
        return () => {
            console.log('销毁题目:', question.id); // debug
        };
    }, [question.id]);

    return (
        <ChoiceQuestionItem
            key={question.id}
            name={question.text}
            theme={theme}
            onDeletePress={onDeletePress}
        />
    );
};
