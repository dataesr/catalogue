import type { CatalogItem } from '~/schemas/catalog';
import DatasetCard from './DatasetCard';
import PublicationCard from './PublicationCard';
import ResourceCard from './ResourceCard.tsx';

interface ResultCardProps {
  item: CatalogItem;
}

export default function ResultCard({ item }: ResultCardProps) {
  switch (item.type) {
    case 'dataset':
      return <DatasetCard item={item} />;
    case 'publication':
      return <PublicationCard item={item} />;
    case 'resource':
      return <ResourceCard item={item} />;
  }
}
