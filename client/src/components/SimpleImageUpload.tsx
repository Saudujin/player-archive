import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface SimpleImageUploadProps {
  onUploadComplete: (base64: string) => void;
  buttonText?: string;
  currentImage?: string | null;
}

/**
 * Simple image upload component that converts to base64
 * Used for cover images where we don't have a playerId yet
 */
export function SimpleImageUpload({ 
  onUploadComplete, 
  buttonText = "رفع صورة",
  currentImage 
}: SimpleImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("الرجاء اختيار صورة فقط");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 5 ميجابايت");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPreview(base64);
      onUploadComplete(base64);
    };
    reader.onerror = () => {
      toast.error("فشل قراءة الصورة");
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPreview(null);
    onUploadComplete("");
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById("cover-image-input")?.click()}
          className="flex-1"
        >
          <Upload className="w-4 h-4 ml-2" />
          {buttonText}
        </Button>
        {preview && (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={clearImage}
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      <input
        id="cover-image-input"
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      {preview && (
        <div className="relative">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-32 object-cover rounded border"
          />
        </div>
      )}
    </div>
  );
}
