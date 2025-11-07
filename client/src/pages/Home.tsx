import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Download,
  Upload,
  Moon,
  Sun,
  BarChart3,
  Filter,
} from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import PlayerCard from "@/components/PlayerCard";
import PlayerDialog from "@/components/PlayerDialog";
import {
  Player,
  loadPlayers,
  savePlayers,
  extractPlayerNames,
  exportPlayersJSON,
  importPlayersJSON,
  sortPlayers,
  filterByKeyword,
  SortOption,
} from "@/lib/playerData";
import { toast } from "sonner";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Player[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [keywordFilter, setKeywordFilter] = useState("");
  const [showStats, setShowStats] = useState(false);

  // Load players on mount
  useEffect(() => {
    const loaded = loadPlayers();
    setPlayers(loaded);
    setSearchResults(loaded);
  }, []);

  // Apply search, filter, and sort
  const displayedPlayers = useMemo(() => {
    let result = searchQuery.trim()
      ? extractPlayerNames(searchQuery, players)
      : players;

    if (keywordFilter.trim()) {
      result = filterByKeyword(result, keywordFilter);
    }

    return sortPlayers(result, sortBy);
  }, [players, searchQuery, keywordFilter, sortBy]);

  // Statistics
  const stats = useMemo(() => {
    const totalKeywords = new Set(
      players.flatMap((p) => p.keywords)
    ).size;
    return {
      totalPlayers: players.length,
      totalAlbums: players.length,
      totalKeywords,
      recentlyAdded: players.filter(
        (p) =>
          p.dateAdded &&
          new Date(p.dateAdded) >
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length,
    };
  }, [players]);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults(players);
      return;
    }
    const results = extractPlayerNames(searchQuery, players);
    setSearchResults(results);
    
    if (results.length === 0) {
      toast.info("لم يتم العثور على نتائج", {
        description: "جرّب البحث باسم مختلف أو تهجئة أخرى",
      });
    } else {
      toast.success(`تم العثور على ${results.length} لاعب`);
    }
  };

  const handleAddPlayer = () => {
    setEditingPlayer(null);
    setDialogOpen(true);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setDialogOpen(true);
  };

  const handleDeletePlayer = (playerId: string) => {
    if (confirm("هل أنت متأكد من حذف هذا اللاعب؟")) {
      const updated = players.filter((p) => p.id !== playerId);
      setPlayers(updated);
      savePlayers(updated);
      toast.success("تم حذف اللاعب بنجاح");
    }
  };

  const handleSavePlayer = (player: Player) => {
    let updated: Player[];
    if (editingPlayer) {
      updated = players.map((p) => (p.id === player.id ? player : p));
      toast.success("تم تحديث اللاعب بنجاح");
    } else {
      updated = [...players, player];
      toast.success("تم إضافة اللاعب بنجاح");
    }
    setPlayers(updated);
    savePlayers(updated);
  };

  const handleExport = () => {
    const json = exportPlayersJSON(players);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `player-archive-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("تم تصدير البيانات بنجاح");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const json = event.target?.result as string;
            const imported = importPlayersJSON(json);
            setPlayers(imported);
            savePlayers(imported);
            toast.success(`تم استيراد ${imported.length} لاعب بنجاح`);
          } catch (error) {
            toast.error("فشل استيراد البيانات", {
              description: "تأكد من صحة ملف JSON",
            });
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
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
                ابحث عن اللاعبين بالعربية أو الإنجليزية
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowStats(!showStats)}
                title="الإحصائيات"
              >
                <BarChart3 className="w-5 h-5" />
              </Button>
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
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="ابحث هنا… مثل: مهند وفارس / صور فيصل و ناصر"
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

          {/* Help Text */}
          <div className="text-sm text-muted-foreground space-y-1">
            <p>
              • اكتب اسم لاعب أو أكثر (مثال: <strong>مهند</strong> أو{" "}
              <strong>مهند و فارس</strong>)
            </p>
            <p>
              • يدعم العربية والإنجليزية، ويستخرج الأسماء حتى لو كانت داخل جملة
              طويلة
            </p>
          </div>
        </div>
      </header>

      {/* Statistics */}
      {showStats && (
        <div className="container py-6">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-bold mb-4">الإحصائيات</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {stats.totalPlayers}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    إجمالي اللاعبين
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {stats.totalAlbums}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    إجمالي الألبومات
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {stats.totalKeywords}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    الكلمات المفتاحية
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">
                    {stats.recentlyAdded}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    مضاف مؤخراً
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <div className="container py-6">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button onClick={handleAddPlayer}>
              <Plus className="w-4 h-4 ml-2" />
              إضافة لاعب
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 ml-2" />
              تصدير JSON
            </Button>
            <Button variant="outline" onClick={handleImport}>
              <Upload className="w-4 h-4 ml-2" />
              استيراد JSON
            </Button>
          </div>

          <div className="flex gap-2 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="فلترة بالكلمة المفتاحية..."
                value={keywordFilter}
                onChange={(e) => setKeywordFilter(e.target.value)}
                className="w-48"
              />
            </div>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="ترتيب" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">الأحدث أولاً</SelectItem>
                <SelectItem value="date-asc">الأقدم أولاً</SelectItem>
                <SelectItem value="name-asc">الاسم (أ-ي)</SelectItem>
                <SelectItem value="name-desc">الاسم (ي-أ)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="container pb-12">
        {displayedPlayers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                {searchQuery.trim() || keywordFilter.trim()
                  ? "لم يتم العثور على نتائج. جرّب البحث بطريقة مختلفة."
                  : "لا يوجد لاعبين حالياً. ابدأ بإضافة لاعب جديد!"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-2">
              <Badge variant="secondary">
                {displayedPlayers.length} نتيجة
              </Badge>
              {(searchQuery.trim() || keywordFilter.trim()) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setKeywordFilter("");
                  }}
                >
                  مسح الفلاتر
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {displayedPlayers.map((player) => (
                <PlayerCard
                  key={player.id}
                  player={player}
                  onEdit={handleEditPlayer}
                  onDelete={handleDeletePlayer}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Player Dialog */}
      <PlayerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        player={editingPlayer}
        onSave={handleSavePlayer}
      />

      {/* Footer */}
      <footer className="border-t bg-card py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>
            أرشيف اللاعبين - نظام إدارة متكامل مع بحث ذكي بالعربية والإنجليزية
          </p>
          <p className="mt-2">
            جميع البيانات محفوظة محلياً في متصفحك • استخدم التصدير/الاستيراد
            للنسخ الاحتياطي
          </p>
        </div>
      </footer>
    </div>
  );
}
