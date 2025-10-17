import React from 'react';
import { TimelineConfigEntry, TimelineMediaItem } from '../types/timeline';

interface TimelineContentProps {
  entry: TimelineConfigEntry;
}

const MediaItem: React.FC<{ item: TimelineMediaItem }> = ({ item }) => {
  if (item.type === 'youtube') {
    return (
      <div className="relative w-full h-48 md:h-64 lg:h-80 rounded-lg overflow-hidden shadow-lg">
        <iframe
          src={item.url}
          title={item.title || 'YouTube video'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-48 md:h-64 lg:h-80 rounded-lg overflow-hidden shadow-lg">
      <img
        src={item.url}
        alt={item.title || 'Timeline image'}
        className="w-full h-full object-cover"
      />
      {item.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h4 className="text-white font-semibold text-sm md:text-base">{item.title}</h4>
          {item.description && (
            <p className="text-white/80 text-xs md:text-sm mt-1">{item.description}</p>
          )}
        </div>
      )}
    </div>
  );
};

export const TimelineContent: React.FC<TimelineContentProps> = ({ entry }) => {
  return (
    <div>
      {entry.content.text && (
        <p className="text-neutral-800 dark:text-neutral-200 text-xs md:text-sm font-normal mb-8">
          {entry.content.text}
        </p>
      )}
      
      {entry.content.features && entry.content.features.length > 0 && (
        <div className="mb-8">
          {entry.content.features.map((feature, index) => (
            <div key={index} className="flex gap-2 items-center text-neutral-700 dark:text-neutral-300 text-xs md:text-sm mb-2">
              {feature}
            </div>
          ))}
        </div>
      )}
      
      {entry.content.media && entry.content.media.length > 0 && (
        <div className={`grid gap-4 ${entry.content.media.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {entry.content.media.map((mediaItem, index) => (
            <MediaItem key={index} item={mediaItem} />
          ))}
        </div>
      )}
    </div>
  );
};
