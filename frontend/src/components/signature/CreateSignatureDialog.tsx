"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pen, Save, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

interface CreateSignatureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (signatureData: File) => void;
}

export default function CreateSignatureDialog({
  isOpen,
  onClose,
  onSave,
}: CreateSignatureDialogProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.beginPath();
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#000";
      ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    }
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const signatureDataUrl = canvas.toDataURL();
      const signatureData = dataURLtoFile(signatureDataUrl, "signature.png");
      onSave(signatureData);
    }
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center text-black dark:text-white">
            <Pen className="mr-2 h-6 w-6 text-primary" />
            Create Your Digital Signature
          </DialogTitle>
        </DialogHeader>

        <Card className="w-full">
          <CardContent className="p-4 space-y-4">
            <Alert variant="default" className="bg-blue-200">
              <Pen className="h-4 w-4 " color="black" />
              <AlertTitle className="text-blue-800">Signature Tips</AlertTitle>
              <AlertDescription className="text-blue-700">
                Create a consistent signature that represents your unique style
              </AlertDescription>
            </Alert>

            <div className="border-2 border-gray-200 rounded-lg p-2">
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                onMouseDown={startDrawing}
                onMouseUp={stopDrawing}
                onMouseMove={draw}
                className="w-full h-auto rounded-md bg-white"
              />
            </div>

            <div className="flex space-x-4">
              <Button
                onClick={clearCanvas}
                variant="outline"
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear
              </Button>
              <Button onClick={handleSave} className="flex-1">
                <Save className="mr-2 h-4 w-4" />
                Save Signature
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}