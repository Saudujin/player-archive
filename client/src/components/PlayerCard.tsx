import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Edit, Trash2 } from "lucide-react";
import { Player } from "@/lib/playerData";

interface PlayerCardProps {
  player: Player;
  onEdit?: (player: Player) => void;
  onDelete?: (playerId: string) => void;
}

export default function PlayerCard({ player, onEdit, onDelete }: PlayerCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-video bg-muted">
        <img
          src={player.cover}
          alt={player.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold text-lg mb-2">{player.name}</h3>
        <p className="text-sm text-muted-foreground mb-3">
          {player.aliases.slice(0, 3).join(' • ')}
        </p>
        
        {player.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {player.keywords.slice(0, 3).map((keyword, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs">
                {keyword}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            className="flex-1"
            onClick={() => window.open(player.albumUrl, '_blank')}
          >
            <ExternalLink className="w-4 h-4 ml-2" />
            فتح الألبوم
          </Button>
          
          {onEdit && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(player)}
            >
              <Edit className="w-4 h-4" />
            </Button>
          )}
          
          {onDelete && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(player.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
