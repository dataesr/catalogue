import ovoidSvg from '@gouvfr/dsfr/dist/artwork/background/ovoid.svg' with { type: 'file' };
import padlockSvg from '@gouvfr/dsfr/dist/artwork/pictograms/system/padlock.svg' with { type: 'file' };
import technicalErrorSvg from '@gouvfr/dsfr/dist/artwork/pictograms/system/technical-error.svg' with { type: 'file' };
import codingSvg from '@gouvfr/dsfr/dist/artwork/pictograms/digital/coding.svg' with { type: 'file' };

const PICTOGRAMS = {
  'system/padlock': padlockSvg,
  'system/technical-error': technicalErrorSvg,
  'digital/coding': codingSvg,
} as const;

type Pictogram = keyof typeof PICTOGRAMS;

type Props = {
  pictogram: Pictogram;
  withBackground?: boolean;
  className?: string;
};

export function DsfrArtwork({ pictogram, withBackground = true, className }: Props) {
  const src = PICTOGRAMS[pictogram];

  if (!withBackground) {
    return (
      <svg className={className ?? 'fr-artwork'} aria-hidden="true" viewBox="0 0 80 80" width="100%">
        <use className="fr-artwork-decorative" href={`${src}#artwork-decorative`} />
        <use className="fr-artwork-minor" href={`${src}#artwork-minor`} />
        <use className="fr-artwork-major" href={`${src}#artwork-major`} />
      </svg>
    );
  }

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className={className ?? 'fr-responsive-img fr-artwork'}
      aria-hidden="true"
      width="160"
      height="200"
      viewBox="0 0 160 200"
    >
      <use className="fr-artwork-motif" href={`${ovoidSvg}#artwork-motif`} />
      <use className="fr-artwork-background" href={`${ovoidSvg}#artwork-background`} />
      <g transform="translate(40, 60)">
        <use className="fr-artwork-decorative" href={`${src}#artwork-decorative`} />
        <use className="fr-artwork-minor" href={`${src}#artwork-minor`} />
        <use className="fr-artwork-major" href={`${src}#artwork-major`} />
      </g>
    </svg>
  );
}
