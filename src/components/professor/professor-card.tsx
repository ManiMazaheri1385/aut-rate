import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/star-rating";
import { t } from "@/lib/i18n";
import { departmentLabel } from "@/lib/constants";
import { formatNumberFa, nameInitials } from "@/lib/utils";
import type { ProfessorCardDto } from "@/types";

/** Professor card used in lists and the homepage "استادان برتر" section. */
export function ProfessorCard({ professor }: { professor: ProfessorCardDto }) {
  return (
    <Link href={`/professors/${professor.id}`} className="group block">
      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border">
                {professor.photoUrl ? (
                  <AvatarImage src={professor.photoUrl} alt={professor.name} />
                ) : null}
                <AvatarFallback className="bg-accent text-accent-foreground">
                  {nameInitials(professor.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-bold leading-tight">{professor.name}</h3>
                <Badge variant="accent" className="mt-1">
                  {departmentLabel(professor.department)}
                </Badge>
              </div>
            </div>
            <div className="text-left">
              <p className="text-lg font-extrabold text-primary">
                {formatNumberFa(professor.bayesianRating, 1)}
              </p>
              <p className="text-[10px] text-muted-foreground">{t("professor.avgRating")}</p>
            </div>
          </div>

          <StarRating value={professor.bayesianRating} size="sm" />

          <div className="mt-auto flex items-center justify-between text-xs text-muted-foreground">
            <span>
              👤 {formatNumberFa(professor.totalReviews)} {t("professors.reviewsSuffix")}
            </span>
            <span>
              📈 {t("common.difficulty")}: {formatNumberFa(professor.avgDifficulty, 1)}
            </span>
          </div>

          {professor.researchInterests.length > 0 && (
            <p className="truncate text-xs text-muted-foreground">
              🔬 {professor.researchInterests.slice(0, 3).join("، ")}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
