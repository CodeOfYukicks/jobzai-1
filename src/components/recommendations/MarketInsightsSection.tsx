import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, MapPin, Loader2, AlertCircle, Building } from 'lucide-react';

interface MarketInsightsSectionProps {
  data: any;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function MarketInsightsSection({
  data,
  isLoading,
  error,
  onRefresh
}: MarketInsightsSectionProps) {
  const insights = data?.market_insights;

  if (isLoading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              Market Insights
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Job market trends and opportunities
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              Market Insights
            </h2>
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (!insights) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              Market Insights
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Job market trends and opportunities
            </p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No market insights available. Complete your profile to get recommendations.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            Market Insights
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive market analysis and opportunities
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Trends & Opportunities */}
        <div className="space-y-6">
          {/* Growing Sectors */}
          {insights.trends?.growing_sectors && insights.trends.growing_sectors.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                Growing Sectors
              </h3>
              <div className="space-y-3">
                {insights.trends.growing_sectors.map((sector: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {sector.sector}
                      </h4>
                      <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                        {sector.growth}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{sector.why}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In-Demand Skills */}
          {insights.trends?.in_demand_skills && insights.trends.in_demand_skills.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                In-Demand Skills
              </h3>
              <div className="space-y-2">
                {insights.trends.in_demand_skills.map((skill: any, index: number) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {skill.skill}
                    </span>
                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                      {skill.demand_increase}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hidden Opportunities */}
          {insights.hidden_opportunities && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Hidden Opportunities
              </h3>
              {insights.hidden_opportunities.hiring_companies && (
                <div className="space-y-2 mb-4">
                  {insights.hidden_opportunities.hiring_companies.map((company: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded"
                    >
                      <Building className="h-4 w-4 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {company.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{company.why}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Risks & Location */}
        <div className="space-y-6">
          {/* Declining Sectors */}
          {insights.risks_and_opportunities?.declining_sectors && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                Declining Sectors
              </h3>
              <div className="space-y-2">
                {insights.risks_and_opportunities.declining_sectors.map((sector: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">
                      {sector.sector}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{sector.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Location Insights */}
          {insights.location_insights && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Location Insights
              </h3>
              {insights.location_insights.market_health && (
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  {insights.location_insights.market_health}
                </p>
              )}
              {insights.location_insights.best_locations && (
                <div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Best Locations:
                  </p>
                  <div className="space-y-1">
                    {insights.location_insights.best_locations.map((location: string, index: number) => (
                      <div
                        key={index}
                        className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"
                      >
                        <span className="text-blue-500">•</span>
                        <span>{location}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {insights.recommendations && (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Actionable Recommendations
              </h3>
              {insights.recommendations.immediate && insights.recommendations.immediate.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Immediate (30 days):
                  </p>
                  <ul className="space-y-1">
                    {insights.recommendations.immediate.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-green-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {insights.recommendations.short_term && insights.recommendations.short_term.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Short-term (3 months):
                  </p>
                  <ul className="space-y-1">
                    {insights.recommendations.short_term.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}




