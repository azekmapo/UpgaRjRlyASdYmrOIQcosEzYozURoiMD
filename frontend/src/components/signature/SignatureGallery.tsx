import { getSignatureImage } from "@/services/signature-service";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { Signature } from "@/types/signature";
import { Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface SignatureGalleryProps {
  signatures: Signature[];
  onActivate: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}

export default function SignatureGallery({
  signatures,
  onActivate,
  onDelete,
}: SignatureGalleryProps) {
  const [signatureImages, setSignatureImages] = useState<
    Record<string, string>
  >({});
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>(
    {}
  );
  const imageCache = useRef<Record<string, string>>({});

  // Cleanup blob URLs only when component unmounts
  useEffect(() => {
    const currentImageCache = imageCache.current;
    return () => {
      // Revoke all object URLs to prevent memory leaks on unmount
      Object.values(currentImageCache).forEach(url => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  useEffect(() => {
    const fetchImages = async () => {
      setLoadingStates(() =>
        signatures.reduce((acc, signature) => {
          if (!imageCache.current[signature.signature_data]) {
            acc[signature.id] = true;
          }
          return acc;
        }, {} as Record<string, boolean>)
      );

      for (const signature of signatures) {
        if (imageCache.current[signature.signature_data]) {
          setSignatureImages((prev) => ({
            ...prev,
            [signature.id]: imageCache.current[signature.signature_data],
          }));
          setLoadingStates((prev) => ({
            ...prev,
            [signature.id]: false,
          }));
        } else {
          try {
            const imageUrl = await getSignatureImage(signature.signature_data);
            imageCache.current[signature.signature_data] = imageUrl;
            setSignatureImages((prev) => ({
              ...prev,
              [signature.id]: imageUrl,
            }));
          } catch (error) {
            console.error(
              `Error fetching image for signature ${signature.id}:`,
              error
            );
          } finally {
            setLoadingStates((prev) => ({
              ...prev,
              [signature.id]: false,
            }));
          }
        }
      }
    };

    fetchImages();
  }, [signatures]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {signatures.map((signature) => (
        <Card key={signature.id} className="overflow-hidden">
          <CardContent className="p-4">
            {loadingStates[signature.id] ? (
              <div className="w-full h-32 flex items-center justify-center bg-muted">
                Loading...
              </div>
            ) : signatureImages[signature.id] ? (
              <img
                src={signatureImages[signature.id]}
                alt={`Signature ${signature.id}`}
                className="w-full h-32 object-contain bg-white border rounded"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.alt = "Failed to load signature";
                }}
              />
            ) : (
              <div className="w-full h-32 flex items-center justify-center bg-muted text-muted-foreground">
                Failed to load image
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between items-center bg-muted p-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={signature.is_active}
                onCheckedChange={(isActive) =>
                  onActivate(signature.id, isActive)
                }
                aria-label={
                  signature.is_active
                    ? "Deactivate signature"
                    : "Activate signature"
                }
              />
              <span className="text-sm font-medium">
                {signature.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <Button
              onClick={() => onDelete(signature.id)}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}