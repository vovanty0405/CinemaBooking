import React from 'react';
import { Link } from 'react-router-dom';
import type { Event } from '../../api/events';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <Link 
      to={`/events/${event.slug}`}
      className="group block rounded-xl overflow-hidden bg-[#1F1F1F] border border-[#2B2B2B] hover:border-brand-red transition-all duration-300 shadow-lg hover:shadow-[0_8px_30px_rgba(229,9,20,0.15)] flex flex-col h-full"
    >
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={event.thumbnailUrl} 
          alt={event.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        {event.category && (
          <div className="absolute top-3 left-3">
            <span className="bg-brand-red text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase">
              {event.category === 'promotion' ? 'Khuyến mãi' : 
               event.category === 'news' ? 'Tin tức' : 
               event.category === 'membership' ? 'Thành viên' : 'Sự kiện mùa'}
            </span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="text-xs text-text-muted mb-2 font-medium">
          {format(new Date(event.startDate), 'dd/MM/yyyy')}
          {event.endDate && ` - ${format(new Date(event.endDate), 'dd/MM/yyyy')}`}
        </div>
        <h3 className="text-white font-bold text-lg leading-tight mb-2 group-hover:text-brand-red transition-colors line-clamp-2">
          {event.title}
        </h3>
        {event.shortDescription && (
          <p className="text-text-secondary text-sm line-clamp-2 mb-4 flex-1">
            {event.shortDescription}
          </p>
        )}
      </div>
    </Link>
  );
};
