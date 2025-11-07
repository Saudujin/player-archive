import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FastImageUpload } from "@/components/FastImageUpload";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Moon,
  Sun,
  LogIn,
  LogOut,
  Upload,
  Sparkles,
  FileType,
  Trash2,
  Edit,
  Image as ImageIcon,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showGalleryDialog, setShowGalleryDialog] = useState(false);

  // Queries with caching
  const { data: players = [], refetch: refetchPlayers } = trpc.player.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
  const { data: searchResults } = trpc.player.search.useQuery(
    { query: debouncedSearch },
    { enabled: debouncedSearch.trim().length > 0 }
  );

  const displayedPlayers = debouncedSearch.trim() ? searchResults || [] : players;

  const isAdmin = user?.role === "admin";

  const handleSearch = () => {
    // Search is automatic via useQuery
    if (displayedPlayers.length === 0) {
      toast.info("لم يتم العثور على نتائج");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">أرشيف اللاعبين</h1>
              <p className="text-muted-foreground mt-1">
                نظام إدارة متكامل مع تحسين الصور وتحويل الشعارات
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </Button>
              {isAuthenticated ? (
                <Button variant="outline" onClick={() => logout()}>
                  <LogOut className="w-4 h-4 ml-2" />
                  تسجيل خروج
                </Button>
              ) : (
                <Button onClick={() => (window.location.href = getLoginUrl())}>
                  <LogIn className="w-4 h-4 ml-2" />
                  تسجيل دخول
                </Button>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="ابحث عن لاعب بالعربية أو الإنجليزية..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1"
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 ml-2" />
              بحث
            </Button>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 ml-2" />
                إضافة لاعب
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Players Grid */}
      <div className="container py-8">
        {displayedPlayers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery.trim()
                  ? "لم يتم العثور على نتائج"
                  : "لا يوجد لاعبين حالياً"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4">
              <Badge variant="secondary">{displayedPlayers.length} لاعب</Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedPlayers.map((player: any) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  isAdmin={isAdmin}
                  onViewGallery={(p) => {
                    setSelectedPlayer(p);
                    setShowGalleryDialog(true);
                  }}
                  onEdit={(p) => {
                    setSelectedPlayer(p);
                    setShowAddDialog(true);
                  }}
                  onDelete={async (id) => {
                    if (confirm("هل أنت متأكد من حذف هذا اللاعب؟")) {
                      // Will implement delete mutation
                      toast.success("تم حذف اللاعب");
                      refetchPlayers();
                    }
                  }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Add/Edit Player Dialog */}
      <AddPlayerDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        player={selectedPlayer}
        onSuccess={() => {
          setShowAddDialog(false);
          setSelectedPlayer(null);
          refetchPlayers();
        }}
      />

      {/* Gallery Dialog */}
      {selectedPlayer && (
        <GalleryDialog
          open={showGalleryDialog}
          onOpenChange={setShowGalleryDialog}
          player={selectedPlayer}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}

// Player Card Component
function PlayerCard({ player, isAdmin, onViewGallery, onEdit, onDelete }: any) {
  const keywords = player.keywords ? JSON.parse(player.keywords) : [];

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-[16/9] bg-muted relative">
        {player.coverImageUrl ? (
          <img
            src={player.coverImageUrl}
            alt={player.nameArabic}
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-1">{player.nameArabic}</h3>
        <p className="text-sm text-muted-foreground mb-2">{player.nameEnglish}</p>
        {player.teamName && (
          <Badge variant="outline" className="mb-2">
            {player.teamName}
          </Badge>
        )}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {keywords.slice(0, 3).map((kw: string, i: number) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {kw}
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onViewGallery(player)}
          >
            <ImageIcon className="w-4 h-4 ml-1" />
            الألبوم
          </Button>
          {isAdmin && (
            <>
              <Button variant="outline" size="sm" onClick={() => onEdit(player)}>
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(player.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Add/Edit Player Dialog
function AddPlayerDialog({ open, onOpenChange, player, onSuccess }: any) {
  const [nameArabic, setNameArabic] = useState("");
  const [nameEnglish, setNameEnglish] = useState("");
  const [teamName, setTeamName] = useState("");
  const [keywords, setKeywords] = useState("");
  const [coverImage, setCoverImage] = useState<string | null>(null);

  const createMutation = trpc.player.create.useMutation({
    onSuccess: () => {
      toast.success("تم إضافة اللاعب بنجاح");
      onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast.error(`فشل: ${error.message}`);
    },
  });

  const updateMutation = trpc.player.update.useMutation({
    onSuccess: () => {
      toast.success("تم تحديث اللاعب بنجاح");
      onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast.error(`فشل: ${error.message}`);
    },
  });

  useEffect(() => {
    if (player) {
      setNameArabic(player.nameArabic || "");
      setNameEnglish(player.nameEnglish || "");
      setTeamName(player.teamName || "");
      const kw = player.keywords ? JSON.parse(player.keywords) : [];
      setKeywords(kw.join(", "));
    } else {
      resetForm();
    }
  }, [player]);

  const resetForm = () => {
    setNameArabic("");
    setNameEnglish("");
    setTeamName("");
    setKeywords("");
    setCoverImage(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!nameArabic || !nameEnglish) {
      toast.error("الرجاء إدخال الاسم بالعربية والإنجليزية");
      return;
    }

    const keywordsArray = keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k);

    if (player) {
      updateMutation.mutate({
        id: player.id,
        nameArabic,
        nameEnglish,
        teamName,
        keywords: keywordsArray,
        coverImageBase64: coverImage || undefined,
      });
    } else {
      createMutation.mutate({
        nameArabic,
        nameEnglish,
        teamName,
        keywords: keywordsArray,
        coverImageBase64: coverImage || undefined,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{player ? "تعديل لاعب" : "إضافة لاعب جديد"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">الاسم بالعربية</label>
            <Input
              value={nameArabic}
              onChange={(e) => setNameArabic(e.target.value)}
              placeholder="مثال: مهند"
            />
          </div>
          <div>
            <label className="text-sm font-medium">الاسم بالإنجليزية</label>
            <Input
              value={nameEnglish}
              onChange={(e) => setNameEnglish(e.target.value)}
              placeholder="Example: Mohannad"
            />
          </div>
          <div>
            <label className="text-sm font-medium">اسم الفريق</label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="مثال: Team Falcons"
            />
          </div>
          <div>
            <label className="text-sm font-medium">الكلمات المفتاحية (مفصولة بفاصلة)</label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="مثال: لاعب, فريق, بطولة"
            />
          </div>
          <div>
            <label className="text-sm font-medium">صورة الغلاف</label>
            <Input type="file" accept="image/*" onChange={handleImageChange} />
            {coverImage && (
              <img
                src={coverImage}
                alt="Preview"
                className="mt-2 w-32 h-32 object-cover rounded"
              />
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {player ? "تحديث" : "إضافة"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Gallery Dialog
function GalleryDialog({ open, onOpenChange, player, isAdmin }: any) {
  const [selectedImage, setSelectedImage] = useState<any>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const { data: images = [], refetch: refetchImages } =
    trpc.playerImage.list.useQuery(
      { playerId: player.id },
      { enabled: !!player.id }
    );

  const uploadMutation = trpc.playerImage.upload.useMutation({
    onSuccess: () => {
      toast.success("تم رفع الصورة بنجاح");
      refetchImages();
      setShowUploadDialog(false);
    },
  });

  const upscaleMutation = trpc.playerImage.upscale.useMutation({
    onSuccess: () => {
      toast.success("تم تحسين الصورة بنجاح");
      refetchImages();
    },
  });

  const vectorizeMutation = trpc.vectorLogo.vectorize.useMutation({
    onSuccess: (data) => {
      toast.success("تم تحويل الشعار إلى Vector");
      window.open(data.pdfUrl, "_blank");
    },
  });

  const handleUpload = (imageBase64: string) => {
    uploadMutation.mutate({
      playerId: player.id,
      imageBase64,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ألبوم {player.nameArabic}</DialogTitle>
        </DialogHeader>
        {isAdmin && (
          <div className="mb-4">
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 ml-2" />
              رفع صورة
            </Button>
          </div>
        )}
        {images.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            لا توجد صور في الألبوم
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img: any) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.imageUrl}
                  alt={img.caption || ""}
                  className="w-full aspect-square object-cover rounded cursor-pointer"
                  loading="lazy"
                  decoding="async"
                  onClick={() => setSelectedImage(img)}
                />
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => upscaleMutation.mutate({ imageId: img.id })}
                      disabled={upscaleMutation.isPending}
                    >
                      <Sparkles className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => vectorizeMutation.mutate({ imageId: img.id })}
                      disabled={vectorizeMutation.isPending}
                    >
                      <FileType className="w-3 h-3" />
                    </Button>
                  </div>
                )}
                {img.isUpscaled && (
                  <Badge className="absolute bottom-2 left-2" variant="secondary">
                    محسّنة
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>رفع صور للألبوم</DialogTitle>
            </DialogHeader>
            <FastImageUpload
              playerId={player.id}
              onSuccess={() => {
                refetchImages();
                setShowUploadDialog(false);
              }}
              multiple={true}
            />
          </DialogContent>
        </Dialog>

        {/* Full Image View */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>{selectedImage.caption || "عرض الصورة"}</DialogTitle>
              </DialogHeader>
              <img
                src={selectedImage.imageUrl}
                alt={selectedImage.caption || ""}
                className="w-full h-auto rounded"
              />
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = selectedImage.imageUrl;
                    a.download = `image-${selectedImage.id}.jpg`;
                    a.click();
                  }}
                  className="flex-1"
                >
                  تحميل الصورة
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Image Upload Dialog
function ImageUploadDialog({ onUpload, onClose }: any) {
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96">
        <CardContent className="p-6">
          <h3 className="font-bold mb-4">رفع صورة</h3>
          <Input type="file" accept="image/*" onChange={handleFileChange} />
          {imageBase64 && (
            <img
              src={imageBase64}
              alt="Preview"
              className="mt-4 w-full h-48 object-cover rounded"
            />
          )}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              onClick={() => imageBase64 && onUpload(imageBase64)}
              disabled={!imageBase64}
            >
              رفع
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
