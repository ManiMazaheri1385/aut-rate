"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { formatNumberFa } from "@/lib/utils";
import type { RatingDistributionBucket, TrendPoint } from "@/types";

interface AnalyticsData {
  trend: TrendPoint[];
  distribution: RatingDistributionBucket[];
  totalReviews: number;
  avgDifficulty: number;
}

interface ChartsProps {
  data: AnalyticsData;
  /** Hide the monthly trend card (used on public profiles). */
  showTrend?: boolean;
}

/** "روند امتیازات" + "توزیع نظرات" — Recharts with Persian labels. */
export function ProfessorAnalyticsCharts({ data, showTrend = true }: ChartsProps) {
  const hasTrend = data.trend.length > 0;
  const hasDistribution = data.distribution.some((b) => b.count > 0);

  return (
    <div className={showTrend ? "grid gap-4 md:grid-cols-2" : ""}>
      {showTrend && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("analytics.ratingsTrend")}</CardTitle>
          </CardHeader>
          <CardContent dir="ltr">
            {hasTrend ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.trend} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fontFamily: "Vazirmatn" }}
                    reversed // RTL reading order
                  />
                  <YAxis domain={[1, 5]} tickCount={5} tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number | string) => [formatNumberFa(Number(value), 2), t("common.rating")]}
                    labelFormatter={(label: string) => label}
                    contentStyle={{ fontFamily: "Vazirmatn", direction: "rtl", textAlign: "right" }}
                  />
                  <Line type="monotone" dataKey="rating" stroke="#9E1B32" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">{t("analytics.noData")}</p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("analytics.distribution")}</CardTitle>
        </CardHeader>
        <CardContent dir="ltr">
          {hasDistribution ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={data.distribution.map((b) => ({
                  ...b,
                  ratingLabel: formatNumberFa(b.rating),
                }))}
                margin={{ top: 8, right: 8, bottom: 0, left: -16 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                <XAxis
                  dataKey="ratingLabel"
                  tick={{ fontSize: 11, fontFamily: "Vazirmatn" }}
                  reversed
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: number | string) => [
                    formatNumberFa(Number(value)),
                    t("analytics.countAxis"),
                  ]}
                  contentStyle={{ fontFamily: "Vazirmatn", direction: "rtl", textAlign: "right" }}
                />
                <Bar dataKey="count" fill="#9E1B32" radius={[6, 6, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-10 text-center text-sm text-muted-foreground">{t("analytics.noData")}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
