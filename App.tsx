
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Header } from './components/Header';
import { UploadSection } from './components/UploadSection';
import { PreviewSection } from './components/PreviewSection';
import { LoadingOverlay } from './components/LoadingOverlay';
import { Footer } from './components/Footer';

export type SuitStyle = 'modern-black' | 'navy-blue' | 'formal-gray' | 'casual-white';
export type BackgroundStyle = 'light-gray' | 'soft-blue' | 'classic-white' | 'office-blur';

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Customization states
  const [suitStyle, setSuitStyle] = useState<SuitStyle>('modern-black');
  const [bgStyle, setBgStyle] = useState<BackgroundStyle>('light-gray');

  const handleImageUpload = (base64: string) => {
    setOriginalImage(base64);
    setResultImage(null);
    setError(null);
  };

  const transformToProfessional = async () => {
    if (!originalImage) return;

    setIsProcessing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const suitDescriptions = {
        'modern-black': "a modern black formal suit with a crisp white shirt",
        'navy-blue': "a professional navy blue tailored suit with a light blue shirt",
        'formal-gray': "a sophisticated charcoal gray suit with a white shirt",
        'casual-white': "a neat white professional blazer or shirt for a clean look"
      };

      const bgDescriptions = {
        'light-gray': "a clean, minimal light gray professional studio background",
        'soft-blue': "a soft corporate blue studio background with gentle lighting",
        'classic-white': "a bright and clean classic white studio background",
        'office-blur': "a modern office interior background with professional depth-of-field blur"
      };

      const prompt = `Transform this person's photo into a professional studio headshot for a resume. 
      The person should be wearing ${suitDescriptions[suitStyle]}. 
      The background should be ${bgDescriptions[bgStyle]}.
      CRITICAL: Keep the person's exact facial features, hair structure, and identity identical to the original. 
      Improve the grooming, align the posture to be professional, and ensure the lighting is high-end studio quality. 
      The output must look like a high-resolution professional photography session.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: originalImage.split(',')[1],
                mimeType: 'image/png',
              },
            },
            {
              text: prompt,
            },
          ],
        },
      });

      let generatedImg: string | null = null;
      if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            generatedImg = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (generatedImg) {
        setResultImage(generatedImg);
      } else {
        throw new Error("이미지 변환에 실패했습니다. 다른 사진으로 시도해 주세요.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setOriginalImage(null);
    setResultImage(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        {!originalImage ? (
          <UploadSection onUpload={handleImageUpload} />
        ) : (
          <PreviewSection 
            original={originalImage} 
            result={resultImage} 
            onTransform={transformToProfessional} 
            onReset={reset}
            isProcessing={isProcessing}
            error={error}
            suitStyle={suitStyle}
            setSuitStyle={setSuitStyle}
            bgStyle={bgStyle}
            setBgStyle={setBgStyle}
          />
        )}
      </main>

      <Footer />
      {isProcessing && <LoadingOverlay />}
    </div>
  );
};

export default App;
