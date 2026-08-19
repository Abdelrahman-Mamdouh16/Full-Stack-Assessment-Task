import { SquaresFourIcon } from '@phosphor-icons/react/dist/ssr';

export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <SquaresFourIcon size={14} weight="fill" />
      </span>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">ProjectFlow</span>
    </span>
  );
}
