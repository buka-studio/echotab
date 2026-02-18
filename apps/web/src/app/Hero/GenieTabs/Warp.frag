precision highp float;

varying vec2 vQuadUV;

uniform sampler2D uTexture;
uniform float uRangeLeft;
uniform float uRangeRight;
uniform float uMotionBlur;
uniform int uEasingFunction;
uniform bool uIsReversed;
uniform float uProgress;
uniform int uSide;
uniform vec2 uImagePos;
uniform vec2 uImageSize;
uniform float uOpacity;

const int BLUR_SAMPLES=3;
const float PI=3.1415926535;

float yPoint(float y0,float y1,float x){
    float theta=x*PI;
    float t=(1.-cos(theta))*.5;
    return mix(y0,y1,t);
}

float remap(float val,float inLow,float inHigh,float outLow,float outHigh){
    float t=(val-inLow)/(inHigh-inLow);
    return mix(outLow,outHigh,t);
}

float easeOutCubic(float x){return 1.-pow(1.-x,3.);}
float easeInCubic(float x){return x*x*x;}
float easeInOutCubic(float x){
    return x<.5?4.*x*x*x:1.-pow(-2.*x+2.,3.)/2.;
}
float easeSpring(float x){
    x=clamp(x,0.,1.);
    float damping=6.;
    float freq=12.;
    float decay=exp(-damping*x);
    return 1.-decay*cos(freq*x);
}

float hardBounds(vec2 uv){
    return step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);
}

float aaBounds(vec2 uv){
    float aaX=fwidth(uv.x);
    float aaY=fwidth(uv.y);
    float mx=smoothstep(-aaX,aaX,uv.x)*(1.-smoothstep(1.-aaX,1.+aaX,uv.x));
    float my=smoothstep(-aaY,aaY,uv.y)*(1.-smoothstep(1.-aaY,1.+aaY,uv.y));
    return mx*my;
}

void main(){
    vec2 uv=vQuadUV;
    
    bool isTop=(uSide==1);
    float direction=isTop?-1.:1.;
    
    float p=clamp(uProgress,0.,1.);
    float x=(uIsReversed)?(1.-p):p;
    float t;
    
    if(uEasingFunction==0)t=easeOutCubic(x);
    else if(uEasingFunction==1)t=easeInCubic(x);
    else if(uEasingFunction==2)t=easeInOutCubic(x);
    else if(uEasingFunction==3)t=easeSpring(x);
    else t=x;
    
    float hProgress=clamp(t/.4,0.,1.);
    float curveY=isTop?(1.-uv.y):uv.y;
    
    float right=mix(1.,uRangeRight,hProgress);
    float left=mix(0.,uRangeLeft,hProgress);
    
    float xRight=yPoint(right,1.,curveY);
    float xLeft=yPoint(left,0.,curveY);
    
    float newUvX=remap(uv.x,xLeft,xRight,0.,1.);
    
    float vProgress=clamp((t-.3)/.7,0.,1.);
    float yStart=mix(0.,1.,vProgress);
    
    float newUvY=uv.y+(yStart*direction);
    
    vec2 localUV=(vec2(newUvX,newUvY)-uImagePos)/uImageSize;
    
    vec4 texColor=vec4(0.);
    
    if(uMotionBlur>0.&&vProgress>0.){
        float blurStrength=uMotionBlur*.05*vProgress;
        for(int i=-BLUR_SAMPLES;i<=BLUR_SAMPLES;i++){
            float offset=float(i)/float(BLUR_SAMPLES)*blurStrength;
            vec2 sampleUV=localUV+vec2(0.,offset/uImageSize.y);
            texColor+=texture(uTexture,sampleUV)*hardBounds(sampleUV);
        }
        texColor/=float(BLUR_SAMPLES*2+1);
    }else{
        texColor=texture(uTexture,localUV);
    }
    
    float mask=aaBounds(localUV);
    
    vec4 result=texColor*mask;
    result.a*=uOpacity;
    gl_FragColor=result;
}
