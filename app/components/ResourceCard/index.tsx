import { IconBox } from '@/components/ui/IconBox';
import cn from 'classnames';
import { Link } from 'react-router';
import { getFormatMeta, getTopicById } from '@/data/catalog';
import type { Resource } from '@/data/types';
import './styles.css';

interface ResourceCardProps {
  resource: Resource;
  featured?: boolean;
  showTopics?: boolean;
  className?: string;
}

export default function ResourceCard({
  resource,
  featured = false,
  showTopics = false,
  className: extraClassName,
}: ResourceCardProps) {
  const href = `/outils/${resource.id}`;
  const format = getFormatMeta(resource.format);

  const cardClassName = cn(
    'resource-card fx-card fx-card--rounded',
    format && `resource-card--${format.id}`,
    extraClassName,
  );

  return (
    <Link to={href} className={cardClassName}>
      <div className="fx-flex fx-items-center fx-justify-between">
        <div className="fx-flex fx-items-center fx-gap-2w">
          {format && <IconBox icon={format.icon} color={format.color} size="sm" />}
          {format && (
            <span className={cn('fr-badge fr-badge--xs fr-badge--no-icon', `fr-badge--${format.color}`)}>
              {format.label}
            </span>
          )}
        </div>
        <div className="fx-flex fx-items-center fx-gap-1w">
          {resource.requiresAuth && (
            <IconBox icon="fr-icon-lock-line" color="yellow-tournesol" size="sm" />
          )}
        </div>
      </div>

      <p className={cn('fr-mb-0', featured ? 'fr-h6' : 'fr-text--bold')}>
        {resource.title}
      </p>

      <p className={cn(
        'fr-text--sm fr-text-mention--grey fr-mb-0',
        featured ? 'fx-clamp-3' : 'fx-clamp-2',
      )}>
        {resource.description}
      </p>

      {showTopics && resource.topics.length > 0 && (
        <div className="fx-flex fx-flex-wrap fx-gap-1w">
          {resource.topics.map((topicId) => {
            const topic = getTopicById(topicId);
            return topic ? (
              <span key={topicId} className="fr-tag fr-tag--sm">
                {topic.shortLabel}
              </span>
            ) : null;
          })}
        </div>
      )}

      <div className="fx-flex-grow" />

      {resource.keywords.length > 0 && (
        <p className="fr-text--xs fr-text-mention--grey fr-mb-0 fx-clamp-1 resource-card__keywords">
          {resource.keywords.slice(0, 4).join(' · ')}
        </p>
      )}
    </Link>
  );
}
