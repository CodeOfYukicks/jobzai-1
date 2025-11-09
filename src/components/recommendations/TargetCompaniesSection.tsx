import { motion } from 'framer-motion';
import { Building, MapPin, TrendingUp, Users, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { useState } from 'react';

interface Company {
  name: string;
  match: number;
  match_breakdown?: {
    skills: number;
    culture: number;
    location: number;
    salary: number;
    growth: number;
    size: number;
  };
  growth_potential?: string;
  size?: string;
  industry?: string;
  location?: string;
  suitable_roles?: Array<{
    title: string;
    level: string;
    match_score: number;
    why_fits: string;
  }>;
  why_match?: string;
  user_strengths?: string;
  improvement_areas?: string;
}

interface TargetCompaniesSectionProps {
  data: any;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

export default function TargetCompaniesSection({
  data,
  isLoading,
  error,
  onRefresh
}: TargetCompaniesSectionProps) {
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const companies: Company[] = data?.companies || [];

  if (isLoading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              Target Companies
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Companies that match your profile and career goals
            </p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
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
              <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              Target Companies
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

  if (!companies || companies.length === 0) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              Target Companies
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Companies that match your profile and career goals
            </p>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No companies found. Complete your profile to get recommendations.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Building className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            Target Companies
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {companies.length} companies that match your profile and career goals
          </p>
        </div>
      </div>

      {/* Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company, index) => (
          <motion.div
            key={company.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer group"
            onClick={() => setSelectedCompany(company)}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {company.name}
                </h3>
                {company.industry && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{company.industry}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {company.match}%
                </div>
                <div className="text-xs text-gray-500">Match</div>
              </div>
            </div>

            {/* Match Breakdown */}
            {company.match_breakdown && (
              <div className="mb-4 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400">Skills</span>
                  <span className="font-medium">{company.match_breakdown.skills}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-purple-500 h-1.5 rounded-full"
                    style={{ width: `${company.match_breakdown.skills}%` }}
                  />
                </div>
              </div>
            )}

            {/* Quick Info */}
            <div className="space-y-2 mb-4">
              {company.location && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4" />
                  <span>{company.location}</span>
                </div>
              )}
              {company.size && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Users className="h-4 w-4" />
                  <span>{company.size} employees</span>
                </div>
              )}
              {company.growth_potential && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <TrendingUp className="h-4 w-4" />
                  <span className="capitalize">{company.growth_potential} Growth</span>
                </div>
              )}
            </div>

            {/* Suitable Roles Preview */}
            {company.suitable_roles && company.suitable_roles.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Suitable Roles:
                </p>
                <div className="flex flex-wrap gap-2">
                  {company.suitable_roles.slice(0, 2).map((role, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-md"
                    >
                      {role.title}
                    </span>
                  ))}
                  {company.suitable_roles.length > 2 && (
                    <span className="px-2 py-1 text-xs text-gray-500">
                      +{company.suitable_roles.length - 2} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* View Details */}
            <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 font-medium group-hover:gap-3 transition-all">
              <span>View Details</span>
              <ExternalLink className="h-4 w-4" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedCompany(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {selectedCompany.name}
                </h3>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  {selectedCompany.industry && <span>{selectedCompany.industry}</span>}
                  {selectedCompany.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedCompany.location}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-purple-600 dark:text-purple-400">
                  {selectedCompany.match}%
                </div>
                <div className="text-sm text-gray-500">Overall Match</div>
              </div>
            </div>

            {/* Match Breakdown */}
            {selectedCompany.match_breakdown && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Match Breakdown
                </h4>
                <div className="space-y-3">
                  {Object.entries(selectedCompany.match_breakdown).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400 capitalize">{key}</span>
                        <span className="font-medium">{value}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Why Match */}
            {selectedCompany.why_match && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Why This Company Matches
                </h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedCompany.why_match}
                </p>
              </div>
            )}

            {/* Suitable Roles */}
            {selectedCompany.suitable_roles && selectedCompany.suitable_roles.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Suitable Roles
                </h4>
                <div className="space-y-3">
                  {selectedCompany.suitable_roles.map((role, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {role.title}
                        </span>
                        <span className="text-sm text-purple-600 dark:text-purple-400">
                          {role.match_score}% match
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">
                          {role.level}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{role.why_fits}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Strengths */}
            {selectedCompany.user_strengths && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Your Strengths for This Company
                </h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedCompany.user_strengths}
                </p>
              </div>
            )}

            {/* Improvement Areas */}
            {selectedCompany.improvement_areas && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Areas to Improve
                </h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {selectedCompany.improvement_areas}
                </p>
              </div>
            )}

            <button
              onClick={() => setSelectedCompany(null)}
              className="w-full mt-6 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </section>
  );
}



