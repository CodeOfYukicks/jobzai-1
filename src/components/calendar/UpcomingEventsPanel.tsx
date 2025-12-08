import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import './calendar-premium.css';
import {
  Calendar,
  Clock,
  ChevronRight,
  Video,
  Users,
  Building,
  Trophy,
  Briefcase,
  ArrowRight,
  Plus,
  Target,
  CalendarDays,
  Bell,
  MapPin,
  Heart,
  Layout,
} from 'lucide-react';
import { CalendarEvent } from './types';
import { CompanyLogo } from '../common/CompanyLogo';

interface UpcomingEventsPanelProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  onAddEvent: () => void;
}

interface GroupedEvents {
  today: CalendarEvent[];
  tomorrow: CalendarEvent[];
  thisWeek: CalendarEvent[];
  nextWeek: CalendarEvent[];
  later: CalendarEvent[];
}

const getInterviewTypeInfo = (type: string) => {
  switch (type) {
    case 'technical':
      return {
        icon: <Video className="w-3.5 h-3.5" />,
        label: 'Technical',
        dotColor: 'bg-emerald-500',
      };
    case 'hr':
      return {
        icon: <Users className="w-3.5 h-3.5" />,
        label: 'HR',
        dotColor: 'bg-blue-500',
      };
    case 'manager':
      return {
        icon: <Building className="w-3.5 h-3.5" />,
        label: 'Manager',
        dotColor: 'bg-amber-500',
      };
    case 'final':
      return {
        icon: <Trophy className="w-3.5 h-3.5" />,
        label: 'Final',
        dotColor: 'bg-green-500',
      };
    default:
      return {
        icon: <Video className="w-3.5 h-3.5" />,
        label: 'Interview',
        dotColor: 'bg-gray-500',
      };
  }
};

const UpcomingEventCard = ({
  event,
  isUrgent,
  onSelect,
}: {
  event: CalendarEvent;
  isUrgent?: boolean;
  onSelect: () => void;
}) => {
  const navigate = useNavigate();
  const isInterview = event.type === 'interview';
  const isWishlist = event.type === 'wishlist';
  const resource = event.resource || {};
  const interview = isInterview ? resource.interview : null;
  const companyName = resource?.companyName || 'Company';
  const position = resource?.position || 'Position';
  
  // Board info
  const boardName = resource?.boardName;
  const boardIcon = resource?.boardIcon;
  const boardColor = resource?.boardColor;

  const typeInfo = isInterview
    ? getInterviewTypeInfo(interview?.type || 'other')
    : isWishlist
      ? {
          icon: <Heart className="w-3.5 h-3.5" />,
          label: 'Wishlist',
          dotColor: 'bg-pink-500',
        }
      : {
          icon: <Briefcase className="w-3.5 h-3.5" />,
          label: 'Application',
          dotColor: 'bg-blue-500',
        };

  const handlePrepare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInterview && resource?.id && interview?.id) {
      navigate(`/interview-prep/${resource.id}/${interview.id}`);
    }
  };

  const isToday = moment(event.start).isSame(moment(), 'day');
  const isTomorrow = moment(event.start).isSame(moment().add(1, 'day'), 'day');

  return (
    <div
      onClick={onSelect}
      className={`
        relative group cursor-pointer rounded-lg p-3.5
        bg-white dark:bg-[#242325]
        border border-gray-200 dark:border-[#3d3c3e]
        hover:border-gray-300 dark:hover:border-gray-700
        hover:shadow-sm
        transition-all duration-150
      `}
    >
      {/* Urgent indicator */}
      {isUrgent && (
        <div className="absolute -top-1 -right-1">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 items-center justify-center">
              <Bell className="w-2 h-2 text-white" />
            </span>
          </span>
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Company Logo */}
        <div className="flex-shrink-0">
          <CompanyLogo companyName={companyName} size="md" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                {companyName}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{position}</p>
            </div>
            <span className="flex-shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-[#2b2a2c] text-gray-600 dark:text-gray-400">
              <span className={`w-1.5 h-1.5 rounded-full ${typeInfo.dotColor}`} />
              {typeInfo.label}
            </span>
          </div>

          {/* Time info */}
          <div className="mt-2 flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>
                {isToday
                  ? 'Today'
                  : isTomorrow
                    ? 'Tomorrow'
                    : moment(event.start).format('ddd, MMM D')}
              </span>
            </div>
            {!event.allDay && (
              <>
                <span className="text-gray-300 dark:text-gray-600">·</span>
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                  {moment(event.start).format('h:mm A')}
                </span>
              </>
            )}
          </div>

          {/* Location if interview */}
          {isInterview && interview?.location && (
            <div className="mt-1.5 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{interview.location}</span>
            </div>
          )}

          {/* Board indicator - minimalist */}
          {boardName && (
            <div className="mt-2 flex items-center gap-1.5 text-[10px] text-gray-400 dark:text-gray-500">
              <span 
                className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                style={{ backgroundColor: boardColor || '#6B7280' }}
              />
              <span className="truncate">
                {boardIcon && <span className="mr-0.5">{boardIcon}</span>}
                {boardName}
              </span>
            </div>
          )}

          {/* Action button for interviews - Notion Style */}
          {isInterview && interview?.status === 'scheduled' && (
            <button
              onClick={handlePrepare}
              className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 
                rounded-md text-xs font-medium
                bg-gray-900 dark:bg-white text-white dark:text-gray-900
                hover:bg-gray-800 dark:hover:bg-gray-100
                transition-all duration-150"
            >
              Prepare for Interview
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({
  title,
  count,
}: {
  title: string;
  count: number;
}) => (
  <div className="flex items-center justify-between mb-2.5">
    <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</h3>
    <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
      {count}
    </span>
  </div>
);

export const UpcomingEventsPanel = ({ events, onSelectEvent, onAddEvent }: UpcomingEventsPanelProps) => {
  // Group events by time period
  const groupedEvents = useMemo<GroupedEvents>(() => {
    const now = moment();
    const tomorrow = moment().add(1, 'day').startOf('day');
    const endOfWeek = moment().endOf('week');
    const endOfNextWeek = moment().add(1, 'week').endOf('week');

    const sorted = [...events]
      .filter((e) => moment(e.start).isAfter(now.startOf('day')))
      .sort((a, b) => moment(a.start).diff(moment(b.start)));

    return {
      today: sorted.filter((e) => moment(e.start).isSame(now, 'day')),
      tomorrow: sorted.filter((e) => moment(e.start).isSame(tomorrow, 'day')),
      thisWeek: sorted.filter((e) => {
        const eventDate = moment(e.start);
        return eventDate.isAfter(tomorrow) && eventDate.isSameOrBefore(endOfWeek);
      }),
      nextWeek: sorted.filter((e) => {
        const eventDate = moment(e.start);
        return eventDate.isAfter(endOfWeek) && eventDate.isSameOrBefore(endOfNextWeek);
      }),
      later: sorted.filter((e) => moment(e.start).isAfter(endOfNextWeek)),
    };
  }, [events]);

  // Calculate stats
  const stats = useMemo(() => {
    const interviews = events.filter((e) => e.type === 'interview');
    const upcomingInterviews = interviews.filter((e) => moment(e.start).isAfter(moment()));
    const todayEvents = groupedEvents.today.length;
    const thisWeekEvents = groupedEvents.today.length + groupedEvents.tomorrow.length + groupedEvents.thisWeek.length;

    return {
      totalUpcoming: upcomingInterviews.length,
      todayCount: todayEvents,
      thisWeekCount: thisWeekEvents,
    };
  }, [events, groupedEvents]);

  const hasUpcomingEvents =
    groupedEvents.today.length > 0 ||
    groupedEvents.tomorrow.length > 0 ||
    groupedEvents.thisWeek.length > 0 ||
    groupedEvents.nextWeek.length > 0;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#333234] border-l border-gray-200 dark:border-[#3d3c3e]">
      {/* Header - Notion Style */}
      <div className="flex-shrink-0 p-5 pb-4 border-b border-gray-100 dark:border-[#3d3c3e]">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#2b2a2c]">
              <CalendarDays className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h2 className="font-semibold text-base text-gray-900 dark:text-white">Upcoming</h2>
              <p className="text-xs text-gray-500 dark:text-gray-500">Your schedule at a glance</p>
            </div>
          </div>
        </div>

        {/* Quick Stats - Notion Style */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-lg border border-gray-100 dark:border-[#3d3c3e] bg-gray-50/50 dark:bg-[#242325]/50">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Today
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.todayCount}</p>
          </div>

          <div className="p-3 rounded-lg border border-gray-100 dark:border-[#3d3c3e] bg-gray-50/50 dark:bg-[#242325]/50">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Week
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.thisWeekCount}</p>
          </div>

          <div className="p-3 rounded-lg border border-gray-100 dark:border-[#3d3c3e] bg-gray-50/50 dark:bg-[#242325]/50">
            <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">
              Total
            </p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.totalUpcoming}</p>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
        <AnimatePresence mode="wait">
          {!hasUpcomingEvents ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-12 px-4 text-center"
            >
              <div className="p-4 rounded-xl bg-gray-100 dark:bg-[#2b2a2c] mb-4">
                <Calendar className="w-7 h-7 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                No upcoming events
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Your schedule is clear for now
              </p>
              <button
                onClick={onAddEvent}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add your first event
              </button>
            </motion.div>
          ) : (
            <>
              {/* Today */}
              {groupedEvents.today.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                >
                  <SectionHeader
                    title="Today"
                    count={groupedEvents.today.length}
                  />
                  <div className="space-y-2">
                    {groupedEvents.today.map((event) => (
                      <UpcomingEventCard
                        key={event.id}
                        event={event}
                        isUrgent={moment(event.start).diff(moment(), 'hours') < 3}
                        onSelect={() => onSelectEvent(event)}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Tomorrow */}
              {groupedEvents.tomorrow.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <SectionHeader
                    title="Tomorrow"
                    count={groupedEvents.tomorrow.length}
                  />
                  <div className="space-y-2">
                    {groupedEvents.tomorrow.map((event) => (
                      <UpcomingEventCard
                        key={event.id}
                        event={event}
                        onSelect={() => onSelectEvent(event)}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* This Week */}
              {groupedEvents.thisWeek.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <SectionHeader
                    title="This Week"
                    count={groupedEvents.thisWeek.length}
                  />
                  <div className="space-y-2">
                    {groupedEvents.thisWeek.map((event) => (
                      <UpcomingEventCard
                        key={event.id}
                        event={event}
                        onSelect={() => onSelectEvent(event)}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Next Week */}
              {groupedEvents.nextWeek.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <SectionHeader
                    title="Next Week"
                    count={groupedEvents.nextWeek.length}
                  />
                  <div className="space-y-2">
                    {groupedEvents.nextWeek.map((event) => (
                      <UpcomingEventCard
                        key={event.id}
                        event={event}
                        onSelect={() => onSelectEvent(event)}
                      />
                    ))}
                  </div>
                </motion.section>
              )}

              {/* Later */}
              {groupedEvents.later.length > 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <SectionHeader
                    title="Coming Up"
                    count={groupedEvents.later.length}
                  />
                  <div className="space-y-2">
                    {groupedEvents.later.slice(0, 3).map((event) => (
                      <UpcomingEventCard
                        key={event.id}
                        event={event}
                        onSelect={() => onSelectEvent(event)}
                      />
                    ))}
                    {groupedEvents.later.length > 3 && (
                      <button
                        className="w-full py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors flex items-center justify-center gap-1"
                      >
                        View {groupedEvents.later.length - 3} more events
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </motion.section>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
