import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/star-rating";
import { t } from "@/lib/i18n";
import { departmentLabel } from "@/lib/constants";
import { formatNumberFa, nameInitials } from "@/lib/utils";
import type { ProfessorCardDto } from "@/types";

/** Professor card used in lists and the homepage "استادان برتر" section. */
export function ProfessorCard({ professor }: { professor: ProfessorCardDto }) {
  return (
    <Link href={`/professors/${professor.id}`} className="group block h-full">
      <Card className="h-full transition-colors group-hover:border-input">
        <CardContent className="flex h-full flex-col gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border bg-accent">
                {professor.photoUrl ? (
                  <AvatarImage src={professor.photoUrl} alt={professor.name} />
                ) : null}
                <AvatarFallback className="text-sm font-bold text-accent-foreground">
                  {nameInitials(professor.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-sm font-bold leading-tight transition-colors group-hover:text-primary">
                  {professor.name}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{departmentLabel(professor.department)}</p>
              </div>
            </div>
            <div className="text-left">
              <p className="font-display text-xl font-bold leading-none text-primary">
                {formatNumberFa(professor.bayesianRating, 1)}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground">{t("professor.avgRating")}</p>
            </div>
          </div>

          <StarRating value={professor.bayesianRating} size="sm" />

          <div className="mt-auto flex items-center justify-between border-t border-dashed border-border pt-3 text-xs text-muted-foreground">
            <span>
              {formatNumberFa(professor.totalReviews)} {t("professors.reviewsSuffix")}
            </span>
            <span>
              {t("common.difficulty")}: {formatNumberFa(professor.avgDifficulty, 1)}
            </span>
          </div>

          {professor.researchInterests.length > 0 && (
            <p className="truncate text-xs text-muted-foreground/90">
              {professor.researchInterests.slice(0, 3).join("، ")}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
