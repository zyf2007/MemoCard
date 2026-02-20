import { MathJaxRendererRef, RenderResult } from "./useMathJax";

export class MathRenderer{
    private static mathJaxRef:React.RefObject<MathJaxRendererRef|null> | null = null;
    public static Init(ref:React.RefObject<MathJaxRendererRef|null>) {
        this.mathJaxRef = ref;
    }   
    public static Render(latex:string, onComplete:(result:RenderResult)=>void){
        if(this.mathJaxRef?.current){
            this.mathJaxRef.current.render(latex, onComplete);
        }
    }
    public static ClearCache() {
        if(this.mathJaxRef?.current){
            this.mathJaxRef.current.clearCache();
            console.log('Cache cleared, size:', this.mathJaxRef.current.getCacheSize());
        }
    }
}