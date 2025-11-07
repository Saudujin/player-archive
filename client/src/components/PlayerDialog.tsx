import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Player } from "@/lib/playerData";

interface PlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  player?: Player | null;
  onSave: (player: Player) => void;
}

export default function PlayerDialog({
  open,
  onOpenChange,
  player,
  onSave,
}: PlayerDialogProps) {
  const [formData, setFormData] = useState<Partial<Player>>({
    name: "",
    aliases: [],
    albumUrl: "",
    cover: "",
    keywords: [],
  });

  useEffect(() => {
    if (player) {
      setFormData(player);
    } else {
      setFormData({
        name: "",
        aliases: [],
        albumUrl: "",
        cover: "",
        keywords: [],
      });
    }
  }, [player, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name?.trim()) {
      alert("الرجاء إدخال اسم اللاعب");
      return;
    }

    const playerData: Player = {
      id: player?.id || `p${Date.now()}`,
      name: formData.name,
      aliases: formData.aliases || [],
      albumUrl: formData.albumUrl || "",
      cover: formData.cover || "https://picsum.photos/800/500",
      keywords: formData.keywords || [],
      dateAdded: player?.dateAdded || new Date().toISOString(),
    };

    onSave(playerData);
    onOpenChange(false);
  };

  const handleArrayInput = (field: 'aliases' | 'keywords', value: string) => {
    const array = value.split(',').map(s => s.trim()).filter(s => s);
    setFormData({ ...formData, [field]: array });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {player ? "تعديل اللاعب" : "إضافة لاعب جديد"}
            </DialogTitle>
            <DialogDescription>
              أدخل بيانات اللاعب. جميع الحقول مطلوبة ما عدا الصورة والكلمات المفتاحية.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">اسم اللاعب *</Label>
              <Input
                id="name"
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="مثال: مهند"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="aliases">الأسماء البديلة * (مفصولة بفواصل)</Label>
              <Input
                id="aliases"
                value={formData.aliases?.join(", ") || ""}
                onChange={(e) => handleArrayInput('aliases', e.target.value)}
                placeholder="مثال: مهند, mohannad, muhanad"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="albumUrl">رابط الألبوم *</Label>
              <Input
                id="albumUrl"
                type="url"
                value={formData.albumUrl || ""}
                onChange={(e) =>
                  setFormData({ ...formData, albumUrl: e.target.value })
                }
                placeholder="https://example.com/albums/player"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cover">رابط صورة الغلاف</Label>
              <Input
                id="cover"
                type="url"
                value={formData.cover || ""}
                onChange={(e) =>
                  setFormData({ ...formData, cover: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="keywords">الكلمات المفتاحية (مفصولة بفواصل)</Label>
              <Textarea
                id="keywords"
                value={formData.keywords?.join(", ") || ""}
                onChange={(e) => handleArrayInput('keywords', e.target.value)}
                placeholder="مثال: مهاجم, #9, team falcons"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit">
              {player ? "حفظ التعديلات" : "إضافة"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
