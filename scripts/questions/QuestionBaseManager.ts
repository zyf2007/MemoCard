import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import { Func } from "../utils/FuncSystem";
import { LazySingletonBase } from "../utils/LazySingletonBase";
import { QuestionBase } from "./QuestionBase";

export class QuestionBaseManager extends LazySingletonBase<QuestionBaseManager> {
    private readonly STORAGE_KEY = "QuestionBase";
    // 题库列表：外部只读，内部可写
    private _questionBases: QuestionBase[] = [];
    public get questionBases(): QuestionBase[] {
        return [...this._questionBases];
    }

    public onQuestionBaseListUpdated : Func<()=>void> = new Func<()=>void>();
    constructor() {
        super();
        this.init();
    }

    // 初始化：读取本地存储的题库数据
    private async init() {
        await this.readData();
    }

    // 读取本地数据（原有逻辑）
    private async readData() {
        try {
            const value = await AsyncStorage.getItem(this.STORAGE_KEY);
            const rawJson = value ? JSON.parse(value) : [];
            
            // 重构：读取数据时为每个题库绑定onUpdate回调
            this._questionBases = rawJson.map((item: any) => {
                return new QuestionBase(
                    item.baseName,
                    item.questions,
                    this.persistData
                );
            });
        } catch (error) {
            Alert.alert("错误", `读取题库数据失败：${(error as Error).message}`);
            this._questionBases = [];
        }
    }

    // 核心：持久化所有题库数据（private，仅内部/回调调用）
    public persistData = (async ():Promise<boolean> => {
        try {
            const serializableData = this._questionBases.map(base => ({
                baseName: base.baseName,
                questions: base.getRawQuestions().map(q => q.toJSON())
            }));
            await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(serializableData));
            return true;
        } catch (error) {
            Alert.alert("错误", `写入题库数据失败：${(error as Error).message}`);
            return false;
        }
    });

    /** 获取所有题库名称 */
    public getQuestionBaseNames(): string[] {
        return this._questionBases.map(item => item.baseName);
    }

    /** 根据名称获取题库实例（核心：支持链式调用） */
    public getQuestionBaseByName(baseName: string): QuestionBase | undefined {
        return this._questionBases.find(base => base.baseName === baseName);
    }

    /** 创建新题库（自动绑定持久化回调） */
    public async createQuestionBase(baseName: string): Promise<boolean> {
        if (this.getQuestionBaseByName(baseName)) {
            Alert.alert("警告", `名称「${baseName}」的题库已存在`);
            return false;
        }

        // 给新题库绑定onUpdate回调（指向Manager的persistData）
        const newQuestionBase = new QuestionBase(
            baseName,
            [],
            this.persistData
        );
        this._questionBases.push(newQuestionBase);
        // 触发列表更新回调
        this.onQuestionBaseListUpdated.invoke();
        
        // 创建后立即持久化
        return await this.persistData();
    }

    /** 删除整个题库 */
    public async deleteQuestionBase(baseName: string): Promise<boolean> {
        const initialLength = this._questionBases.length;
        this._questionBases = this._questionBases.filter(base => base.baseName !== baseName);
        
        const isDeleted = this._questionBases.length < initialLength;
        if (isDeleted) {
            // 删除成功则触发列表更新回调
            this.onQuestionBaseListUpdated.invoke();
            return await this.persistData(); // 删除成功则持久化
        }
        Alert.alert("警告", `未找到名称为「${baseName}」的题库`);
        return false;
    }

    /** 修改题库名称（代理调用QuestionBase的rename方法） */
    public async renameQuestionBase(oldName: string, newName: string): Promise<boolean> {
        const targetBase = this.getQuestionBaseByName(oldName);
        if (!targetBase) {
            Alert.alert("警告", `未找到名称为「${oldName}」的题库`);
            return false;
        }
        if (this.getQuestionBaseByName(newName)) {
            Alert.alert("警告", `名称「${newName}」已存在`);
            return false;
        }
        // 直接调用QuestionBase的rename方法（自动触发持久化）
        await targetBase.rename(newName);
        // 触发列表更新回调
        this.onQuestionBaseListUpdated.invoke();
        return true;
    }
}