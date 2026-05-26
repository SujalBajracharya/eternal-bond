import { useRef, useState } from "react";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  userId: string;
  photos: string[];
  onChange: (photos: string[]) => void;
  max?: number;
}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const PhotoUploader = ({ userId, photos, onChange, max = 5 }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const slots = max - photos.length;
    if (slots <= 0) {
      toast.error(`You can upload up to ${max} photos`);
      return;
    }
    const list = Array.from(files).slice(0, slots);
    setUploading(true);
    const uploaded: string[] = [];
    for (const file of list) {
      if (!ALLOWED.includes(file.type)) {
        toast.error(`${file.name}: only JPG, PNG or WebP`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        toast.error(`${file.name}: must be under 5 MB`);
        continue;
      }
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage
        .from("profile-photos")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (error) {
        toast.error(`${file.name}: ${error.message}`);
        continue;
      }
      const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }
    setUploading(false);
    if (uploaded.length) {
      onChange([...photos, ...uploaded]);
      toast.success(`${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} added`);
    }
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = async (url: string) => {
    // Derive storage path after the bucket name segment
    const marker = "/profile-photos/";
    const idx = url.indexOf(marker);
    if (idx >= 0) {
      const path = url.slice(idx + marker.length);
      await supabase.storage.from("profile-photos").remove([path]);
    }
    onChange(photos.filter((p) => p !== url));
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {photos.map((url, i) => (
          <div
            key={url}
            className="relative aspect-square rounded-2xl overflow-hidden border border-border/60 group bg-secondary/40"
          >
            <img
              src={url}
              alt={`Profile ${i + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              className="absolute top-1.5 right-1.5 grid place-items-center w-6 h-6 rounded-full bg-background/90 text-foreground shadow-soft opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
              aria-label="Remove photo"
            >
              <X className="w-3 h-3" />
            </button>
            {i === 0 && (
              <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full bg-gradient-sunset text-primary-foreground text-[10px] font-semibold tracking-wide shadow-soft">
                MAIN
              </span>
            )}
          </div>
        ))}

        {photos.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className={cn(
              "aspect-square rounded-2xl border-2 border-dashed border-border/80 hover:border-primary/60 bg-secondary/30 hover:bg-secondary/60 transition-all grid place-items-center text-muted-foreground hover:text-primary",
              uploading && "opacity-60 cursor-wait",
            )}
          >
            <div className="flex flex-col items-center gap-1.5">
              {uploading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : photos.length === 0 ? (
                <ImagePlus className="w-6 h-6" />
              ) : (
                <Upload className="w-5 h-5" />
              )}
              <span className="text-[11px] font-medium">
                {uploading ? "Uploading…" : photos.length === 0 ? "Add photos" : "Add more"}
              </span>
            </div>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="text-xs text-muted-foreground mt-3">
        {photos.length}/{max} added · JPG, PNG or WebP, up to 5 MB each.
        {photos.length < 3 && " We recommend at least 3 photos."}
      </p>
    </div>
  );
};

export default PhotoUploader;
