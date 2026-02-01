import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';

// 定义存储数据的键名（方便统一管理）
const STORAGE_KEY = 'TEST_PERSIST_DATA';

const AsyncStorageTestComponent = () => {
  // 输入框内容状态
  const [inputValue, setInputValue] = useState('');
  // 读取到的存储数据状态
  const [storedData, setStoredData] = useState('');

  // 存储数据到 AsyncStorage
  const saveData = async () => {
    try {
      // 校验输入内容
      if (!inputValue.trim()) {
        Alert.alert('提示', '请输入要存储的内容');
        return;
      }
      // 存储数据（AsyncStorage 只支持字符串，复杂数据需用 JSON.stringify）
      await AsyncStorage.setItem(STORAGE_KEY, inputValue);
      Alert.alert('成功', '数据已成功存储！');
      // 清空输入框
      setInputValue('');
    } catch (error) {
      Alert.alert('错误', `存储失败：${error}`);
      console.error('存储数据失败：', error);
    }
  };

  // 从 AsyncStorage 读取数据
  const readData = async () => {
    try {
      // 读取数据
      const value = await AsyncStorage.getItem(STORAGE_KEY);
      if (value !== null) {
        // 读取到数据，更新状态
        setStoredData(`读取到的数据：${value}`);
      } else {
        // 未读取到数据
        setStoredData('暂无存储的数据');
        Alert.alert('提示', '未找到存储的数据');
      }
    } catch (error) {
      Alert.alert('错误', `读取失败：${error}`);
      console.error('读取数据失败：', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* 输入框 */}
      <TextInput
        style={styles.input}
        placeholder="请输入要存储的内容"
        value={inputValue}
        onChangeText={setInputValue}
        // 可选：支持多行输入
        multiline={true}
        numberOfLines={4}
      />

      {/* 存储按钮 */}
      <Button title="存储数据" onPress={saveData} />

      {/* 读取按钮 */}
      <Button title="读取数据" onPress={readData} color="#2196F3" />

      {/* 显示读取到的数据 */}
      <View style={styles.resultContainer}>
        <Text style={styles.resultText}>{storedData}</Text>
      </View>
    </View>
  );
};

// 样式定义
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
    justifyContent: 'flex-start',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
    textAlignVertical: 'top', // 多行输入时文字置顶
  },
  button: {
    marginBottom: 10,
  },
  resultContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
  },
});

export default AsyncStorageTestComponent;