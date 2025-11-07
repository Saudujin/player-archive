import { useState, useEffect, useMemo } from "react";
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
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import AdminLoginDialog from "@/components/AdminLoginDialog";

export default function Home() {
  const { admin, isAdmin, logout: adminLogout } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showLoginDialog, setShowLoginDialog] = useState(false);

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

  // Delete player mutation
  const deleteMutation = trpc.player.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف اللاعب بنجاح");
      refetchPlayers();
    },
    onError: (error) => {
      toast.error(`فشل الحذف: ${error.message}`);
    },
  });

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
              {isAdmin ? (
                <Button variant="outline" onClick={() => adminLogout()}>
                  <LogOut className="w-4 h-4 ml-2" />
                  تسجيل خروج ({admin?.username})
                </Button>
              ) : (
                <Button onClick={() => setShowLoginDialog(true)}>
                  <LogIn className="w-4 h-4 ml-2" />
                  تسجيل دخول المشرف
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
                  onDelete={(id) => {
                    if (confirm("هل أنت متأكد من حذف هذا اللاعب؟ سيتم حذف جميع صوره أيضاً.")) {
                      deleteMutation.mutate({ id });
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

      {/* Admin Login Dialog */}
      <AdminLoginDialog open={showLoginDialog} onOpenChange={setShowLoginDialog} />
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

  const handleSubmit = () => {
    if (!nameArabic.trim() || !nameEnglish.trim()) {
      toast.error("الرجاء إدخال الاسم بالعربية والإنجليزية");
      return;
    }

    const keywordsArray = keywords
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k);

    const data = {
      nameArabic,
      nameEnglish,
      teamName: teamName.trim() || undefined,
      keywords: keywordsArray,
      coverImageBase64: coverImage || undefined,
    };

    if (player) {
      updateMutation.mutate({ id: player.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{player ? "تعديل لاعب" : "إضافة لاعب جديد"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">الاسم بالعربية *</label>
            <Input
              value={nameArabic}
              onChange={(e) => setNameArabic(e.target.value)}
              placeholder="مثال: محمد صلاح"
            />
          </div>
          <div>
            <label className="text-sm font-medium">الاسم بالإنجليزية *</label>
            <Input
              value={nameEnglish}
              onChange={(e) => setNameEnglish(e.target.value)}
              placeholder="Example: Mohamed Salah"
            />
          </div>
          <div>
            <label className="text-sm font-medium">الفريق</label>
            <Input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="مثال: ليفربول"
            />
          </div>
          <div>
            <label className="text-sm font-medium">الكلمات المفتاحية</label>
            <Input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="افصل بفاصلة: محمد، صلاح، مصر"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">صورة الغلاف</label>
            <FastImageUpload
              onUploadComplete={(url) => {
                setCoverImage(url);
                toast.success("تم رفع الصورة بنجاح");
              }}
              buttonText="رفع صورة الغلاف"
            />
            {coverImage && (
              <div className="mt-2">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="w-full h-32 object-cover rounded"
                />
              </div>
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

  const { data: images = [], refetch: refetchImages } = trpc.playerImage.list.useQuery(
    { playerId: player.id },
    { enabled: open }
  );

  const upscaleMutation = trpc.playerImage.upscale.useMutation({
    onSuccess: () => {
      toast.success("تم تحسين الصورة بنجاح");
      refetchImages();
    },
    onError: (error) => {
      toast.error(`فشل التحسين: ${error.message}`);
    },
  });

  const vectorizeMutation = trpc.vectorLogo.vectorize.useMutation({
    onSuccess: () => {
      toast.success("تم تحويل الشعار إلى SVG بنجاح");
      refetchImages();
    },
    onError: (error) => {
      toast.error(`فشل التحويل: ${error.message}`);
    },
  });

  const deleteImageMutation = trpc.playerImage.delete.useMutation({
    onSuccess: () => {
      toast.success("تم حذف الصورة بنجاح");
      refetchImages();
    },
    onError: (error) => {
      toast.error(`فشل الحذف: ${error.message}`);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            ألبوم {player.nameArabic} ({images.length} صورة)
          </DialogTitle>
        </DialogHeader>

        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="w-4 h-4 ml-2" />
              رفع صور جديدة
            </Button>
          </div>
        )}

        {images.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            لا توجد صور في الألبوم
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img: any) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.thumbnailUrl || img.imageUrl}
                  alt=""
                  className="w-full aspect-square object-cover rounded cursor-pointer hover:opacity-80 transition"
                  onClick={() => setSelectedImage(img)}
                  loading="lazy"
                />
                <div className="absolute bottom-2 left-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs"
                    onClick={() => upscaleMutation.mutate({ imageId: img.id })}
                    disabled={upscaleMutation.isPending}
                  >
                    <Sparkles className="w-3 h-3 ml-1" />
                    تحسين
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="flex-1 text-xs"
                    onClick={() => vectorizeMutation.mutate({ imageId: img.id })}
                    disabled={vectorizeMutation.isPending}
                  >
                    <FileType className="w-3 h-3 ml-1" />
                    SVG
                  </Button>
                  {isAdmin && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm("هل أنت متأكد من حذف هذه الصورة؟")) {
                          deleteImageMutation.mutate({ id: img.id });
                        }
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload Dialog */}
        {showUploadDialog && (
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>رفع صور جديدة</DialogTitle>
              </DialogHeader>
              <FastImageUpload
                playerId={player.id}
                onSuccess={() => {
                  setShowUploadDialog(false);
                  refetchImages();
                }}
                multiple
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Lightbox */}
        {selectedImage && (
          <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
            <DialogContent className="sm:max-w-4xl">
              <img
                src={selectedImage.imageUrl}
                alt=""
                className="w-full h-auto"
              />
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
