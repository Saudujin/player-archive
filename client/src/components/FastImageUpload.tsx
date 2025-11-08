import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Check } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";

interface FastImageUploadProps {
  playerId: number;
  onSuccess?: () => void;
  multiple?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
  uploadUrl?: string;
  publicUrl?: string;
  key?: string;
}

export function FastImageUpload({ playerId, onSuccess, multiple = true }: FastImageUploadProps) {
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const getUploadUrlMutation = trpc.playerImage.getUploadUrl.useMutation();
  const confirmUploadMutation = trpc.playerImage.confirmUpload.useMutation();
  const batchConfirmMutation = trpc.playerImage.batchConfirmUpload.useMutation();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: UploadingFile[] = selectedFiles.map((file) => ({
      file,
      progress: 0,
      status: "pending",
    }));
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadToS3 = async (file: File, uploadUrl: string): Promise<void> => {
    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
      onUploadProgress: (progressEvent) => {
        const progress = progressEvent.total
          ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
          : 0;
        setFiles((prev) =>
          prev.map((f) =>
            f.file === file ? { ...f, progress, status: "uploading" } : f
          )
        );
      },
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    try {
      const uploadResults: Array<{ imageUrl: string; imageKey: string }> = [];

      // Upload each file
      for (const fileItem of files) {
        if (fileItem.status !== "pending") continue;

        try {
          // Get presigned URL
          const { uploadUrl, publicUrl, key } = await getUploadUrlMutation.mutateAsync({
            fileName: fileItem.file.name,
            contentType: fileItem.file.type,
          });

          // Upload directly to S3
          await uploadToS3(fileItem.file, uploadUrl);

          // Mark as success
          setFiles((prev) =>
            prev.map((f) =>
              f.file === fileItem.file
                ? { ...f, status: "success", publicUrl, key, progress: 100 }
                : f
            )
          );

          uploadResults.push({ imageUrl: publicUrl, imageKey: key });
        } catch (error: any) {
          setFiles((prev) =>
            prev.map((f) =>
              f.file === fileItem.file
                ? { ...f, status: "error", error: error.message }
                : f
            )
          );
        }
      }

      // Confirm uploads in database (one by one)
      if (uploadResults.length > 0) {
        let confirmedCount = 0;
        for (const result of uploadResults) {
          try {
            await new Promise<void>((resolve, reject) => {
              confirmUploadMutation.mutate(
                {
                  playerId,
                  imageUrl: result.imageUrl,
                  imageKey: result.imageKey,
                },
                {
                  onSuccess: () => {
                    confirmedCount++;
                    resolve();
                  },
                  onError: (error: any) => {
                    console.error('Confirm error:', error);
                    reject(error);
                  },
                }
              );
            });
          } catch (confirmError: any) {
            console.error('Failed to confirm image:', confirmError);
            toast.error(`فشل تأكيد صورة: ${confirmError.message || 'خطأ غير معروف'}`);
          }
        }
        
        if (confirmedCount > 0) {
          toast.success(`تم رفع ${confirmedCount} صورة بنجاح!`);
          setFiles([]);
          if (onSuccess) {
            onSuccess();
          }
        }
      }
    } catch (error: any) {
      toast.error(`فشل الرفع: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[60vh]">
      <div className="mb-4">
        <label className="block mb-2 text-sm font-medium">
          {multiple ? "اختر صور متعددة" : "اختر صورة"}
        </label>
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFileSelect}
          className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 dark:text-gray-400 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400"
          disabled={isUploading}
        />
      </div>

      {files.length > 0 && (
        <>
          {/* Scrollable file list */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
            <div className="text-sm font-medium sticky top-0 bg-background pb-2">
              الصور المحددة ({files.length})
            </div>
            {files.map((fileItem, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 border rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {fileItem.file.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {(fileItem.file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                  {fileItem.status === "uploading" && (
                    <Progress value={fileItem.progress} className="mt-1" />
                  )}
                  {fileItem.status === "error" && (
                    <div className="text-xs text-red-500 mt-1">
                      {fileItem.error}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  {fileItem.status === "success" && (
                    <Check className="w-5 h-5 text-green-500" />
                  )}
                  {fileItem.status === "pending" && !isUploading && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Sticky upload button */}
          <div className="border-t pt-4">
            <Button
              onClick={handleUpload}
              disabled={isUploading || files.every((f) => f.status !== "pending")}
              className="w-full"
            >
              <Upload className="w-4 h-4 ml-2" />
              {isUploading ? "جاري الرفع..." : `رفع ${files.filter((f) => f.status === "pending").length} صورة`}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
